/**
 * Shared push-flow logic for iamrunning.online operator endpoints.
 *
 * Extracted from app/api/admin/operator/push/route.ts so that both /push and
 * /rollback can invoke the same atomic flow WITHOUT a self-HTTP-loop.
 *
 * The old rollback route did `fetch('/api/admin/operator/push', ...)` against
 * its own origin, which on same-host nginx+TLS manifests as
 * ERR_SSL_WRONG_VERSION_NUMBER and breaks rollbacks. The fix is direct
 * in-process invocation.
 *
 * Flow (same as the old push endpoint):
 *   1. Collect staged files for client
 *   2. Snapshot production versions of those files (for rollback)
 *   3. PUT each staged file to the client
 *   4. Trigger deploy on client, wait for healthy
 *   5. On success: clear staging, append history, notify, prune
 *   5F. On any fail: restore snapshot back, redeploy, append failure history
 *
 * Returns a discriminated union — route handlers translate to NextResponse.
 */

import { findClient } from '@/lib/admin/iam-clients-os/store';
import { decryptString } from '@/lib/admin/iam-clients-os/crypto';
import {
  listStagedFiles, readStagedFile, createSnapshot, writeSnapshotFile,
  writeSnapshotFileEncoding, readSnapshotFile, discardAllForClient,
  appendHistory, pruneOldSnapshots,
} from '@/lib/admin/iam-clients-os/operator-store';

const UPSTREAM_TIMEOUT_MS = 60_000;
const DEPLOY_TIMEOUT_MS = 420_000;

// ── Public types ──────────────────────────────────────────────────────────

export interface PushFlowParams {
  clientId: string;
  message?: string;
  /**
   * History entry type. Default 'push'. Rollback callers pass 'rollback' so
   * the history log distinguishes operations.
   */
  historyType?: 'push' | 'rollback';
  /**
   * Additional history fields set by the caller (e.g. rollback_of_snap_id).
   * Merged into the history entry on both success and failure paths.
   */
  extraHistoryFields?: Record<string, unknown>;
}

export interface PushFlowSuccess {
  ok: true;
  snap_id: string;
  files_pushed: string[];
  count: number;
  deploy_http: number;
  deploy_message: string;
  staging_cleared: number;
}

export interface PushFlowFailure {
  ok: false;
  status: number; // HTTP status the caller should return
  error: string;
  snap_id?: string;
  deploy_http?: number;
  build_output_tail?: string;
  rollback_applied?: boolean;
  rollback_errors?: string[];
  redeploy_http?: number;
  pushed_before_rollback?: string[];
  errors?: string[];
}

export type PushFlowResult = PushFlowSuccess | PushFlowFailure;

// ── Helpers (pure — no knowledge of request/response) ────────────────────

function resolveOperatorUrl(client: { domain: string; operatorUrl?: string }): string {
  if (client.operatorUrl && client.operatorUrl.startsWith('http')) return client.operatorUrl;
  return `https://${client.domain}/api/operator`;
}

async function upstreamGET(
  operatorUrl: string, token: string, path: string,
): Promise<
  | { ok: true; content: string; encoding: 'text' | 'base64' }
  | { ok: false; status: number; error: string }
> {
  const url = `${operatorUrl}/files/read?path=${encodeURIComponent(path)}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (res.status === 404) return { ok: false, status: 404, error: 'not found' };
    const data = await res.json().catch(() => null) as { content?: string; encoding?: string; error?: string } | null;
    if (!res.ok) return { ok: false, status: res.status, error: data?.error || `HTTP ${res.status}` };
    return {
      ok: true,
      content: data?.content || '',
      encoding: data?.encoding === 'base64' ? 'base64' : 'text',
    };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

async function upstreamPUT(
  operatorUrl: string, token: string, path: string, content: string, encoding: 'text' | 'base64',
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const url = `${operatorUrl}/files?path=${encodeURIComponent(path)}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ content, encoding }),
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null) as { error?: string } | null;
    if (!res.ok) return { ok: false, status: res.status, error: data?.error || `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

async function upstreamDeploy(operatorUrl: string, token: string): Promise<{
  ok: boolean; httpCode: number; message: string; buildOutputTail?: string; locked?: boolean; restartScheduled?: boolean;
}> {
  const url = `${operatorUrl}/deploy`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      cache: 'no-store',
      signal: AbortSignal.timeout(DEPLOY_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null) as {
      success?: boolean; httpCode?: number; message?: string; buildOutputTail?: string; error?: string; locked?: boolean; restartScheduled?: boolean;
    } | null;
    return {
      ok: !!data?.success,
      httpCode: data?.httpCode || res.status,
      message: data?.message || data?.error || `HTTP ${res.status}`,
      buildOutputTail: data?.buildOutputTail,
      locked: data?.locked || res.status === 423,
      restartScheduled: data?.restartScheduled,
    };
  } catch (err) {
    return { ok: false, httpCode: 0, message: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Poll client's root URL until it returns 2xx/3xx or maxMs elapses.
 * Client's /deploy returns BEFORE the detached pm2 restart fires, so external
 * health verification is mandatory here.
 */
async function waitForHealthy(domain: string, maxMs: number = 45_000): Promise<number> {
  const deadline = Date.now() + maxMs;
  let lastCode = 0;
  // Give detached pm2 restart time to kick in (client's spawn has sleep 2).
  await new Promise(r => setTimeout(r, 3000));
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`https://${domain}/`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5_000),
        redirect: 'manual',
      });
      lastCode = res.status;
      if (res.status >= 200 && res.status < 400) return res.status;
    } catch { /* keep polling */ }
    await new Promise(r => setTimeout(r, 2000));
  }
  return lastCode;
}

async function upstreamNotify(
  operatorUrl: string, token: string,
  payload: { type: string; title: string; message: string; data?: unknown },
): Promise<void> {
  try {
    await fetch(`${operatorUrl}/notify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch { /* best effort */ }
}

/**
 * Restore snapshot back onto client. Returns per-file error list (empty = clean).
 */
async function rollbackToSnapshot(
  operatorUrl: string, token: string, clientId: string, snapId: string, paths: string[],
): Promise<string[]> {
  const errors: string[] = [];
  for (const p of paths) {
    try {
      const snap = readSnapshotFile(clientId, snapId, p);
      if (snap.ok) {
        const up = await upstreamPUT(operatorUrl, token, p, snap.content, snap.encoding);
        if (!up.ok) errors.push(`rollback PUT ${p}: ${up.error}`);
        continue;
      }
      const absent = readSnapshotFile(clientId, snapId, p + '.ABSENT');
      if (absent.ok) {
        const delUrl = `${operatorUrl}/files?path=${encodeURIComponent(p)}`;
        try {
          const res = await fetch(delUrl, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
          });
          if (!res.ok && res.status !== 404) errors.push(`rollback DELETE ${p}: HTTP ${res.status}`);
        } catch (err) {
          errors.push(`rollback DELETE ${p}: ${err instanceof Error ? err.message : String(err)}`);
        }
        continue;
      }
      errors.push(`rollback ${p}: not in snapshot and no ABSENT marker`);
    } catch (err) {
      errors.push(`rollback ${p}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return errors;
}

// ── Main entry ────────────────────────────────────────────────────────────

export async function executePushFlow(params: PushFlowParams): Promise<PushFlowResult> {
  const { clientId, message } = params;
  const historyType = params.historyType ?? 'push';
  const extra = params.extraHistoryFields ?? {};

  // ── 0. Resolve client + token
  const client = findClient(clientId);
  if (!client) return { ok: false, status: 404, error: 'Client not found' };
  if (!client.operatorToken) {
    return { ok: false, status: 409, error: 'Client has no operatorToken — waiting for first heartbeat' };
  }
  let token: string;
  try { token = decryptString(client.operatorToken); } catch {
    return { ok: false, status: 500, error: 'Failed to decrypt operator_token' };
  }
  const operatorUrl = resolveOperatorUrl(client);

  // ── 1. Collect staged files
  const staged = listStagedFiles(clientId);
  if (staged.length === 0) {
    return { ok: false, status: 400, error: 'No staged files to push' };
  }

  // ── 2. Create snapshot
  const snapRes = createSnapshot(clientId, message);
  if (!snapRes.ok) return { ok: false, status: snapRes.status, error: snapRes.error };
  const snapId = snapRes.snap_id;

  // ── 2a. Populate snapshot with current production versions
  const snapErrors: string[] = [];
  for (const f of staged) {
    const prod = await upstreamGET(operatorUrl, token, f.path);
    if (prod.ok) {
      const w = writeSnapshotFile(clientId, snapId, f.path, prod.content, prod.encoding);
      if (!w.ok) snapErrors.push(`snapshot write ${f.path}: ${w.error}`);
      else writeSnapshotFileEncoding(clientId, snapId, f.path, prod.encoding);
    } else if (prod.status === 404) {
      // File didn't exist in production — ABSENT marker for rollback-to-delete.
      writeSnapshotFile(clientId, snapId, f.path + '.ABSENT', '', 'text');
    } else {
      snapErrors.push(`snapshot fetch ${f.path}: ${prod.error}`);
    }
  }

  if (snapErrors.length) {
    appendHistory(clientId, {
      ts: new Date().toISOString(), type: historyType, snap_id: snapId,
      message, files: staged.map(f => f.path),
      deploy_ok: false, note: `Aborted before upload: ${snapErrors.join('; ')}`,
      ...extra,
    });
    return {
      ok: false, status: 502,
      error: 'Snapshot phase failed — no files pushed',
      snap_id: snapId, errors: snapErrors,
    };
  }

  // ── 3. PUT each staged file
  const pushedPaths: string[] = [];
  const uploadErrors: string[] = [];
  for (const f of staged) {
    const content = readStagedFile(clientId, f.path);
    if (!content.ok) {
      uploadErrors.push(`staging read ${f.path}: ${content.error}`);
      break;
    }
    const up = await upstreamPUT(operatorUrl, token, f.path, content.content, content.encoding);
    if (!up.ok) {
      uploadErrors.push(`PUT ${f.path}: ${up.error} (HTTP ${up.status})`);
      break;
    }
    pushedPaths.push(f.path);
  }

  // Upload failed? Rollback what we already uploaded + redeploy to known state.
  if (uploadErrors.length) {
    const rbErrors = await rollbackToSnapshot(operatorUrl, token, clientId, snapId, pushedPaths);
    await upstreamDeploy(operatorUrl, token);
    appendHistory(clientId, {
      ts: new Date().toISOString(), type: historyType, snap_id: snapId,
      message, files: pushedPaths,
      deploy_ok: false,
      note: `Upload failed: ${uploadErrors.join('; ')}${rbErrors.length ? ` · rollback issues: ${rbErrors.join('; ')}` : ''}`,
      ...extra,
    });
    return {
      ok: false, status: 502,
      error: 'Upload failed — rolled back',
      snap_id: snapId,
      pushed_before_rollback: pushedPaths,
      errors: uploadErrors,
      rollback_errors: rbErrors,
      rollback_applied: true,
    };
  }

  // ── 4. Deploy
  const deploy = await upstreamDeploy(operatorUrl, token);

  if (!deploy.ok) {
    const rbErrors = await rollbackToSnapshot(operatorUrl, token, clientId, snapId, pushedPaths);
    const redeploy = await upstreamDeploy(operatorUrl, token);
    const redeployHealth = redeploy.ok ? await waitForHealthy(client.domain) : 0;
    appendHistory(clientId, {
      ts: new Date().toISOString(), type: historyType, snap_id: snapId,
      message, files: pushedPaths,
      deploy_ok: false, deploy_http: deploy.httpCode,
      note: `Deploy failed (${deploy.message}) · rollback ${rbErrors.length ? 'with errors: ' + rbErrors.join('; ') : 'applied'} · redeploy scheduled=${!!redeploy.restartScheduled} health=${redeployHealth}`,
      ...extra,
    });
    return {
      ok: false, status: 502,
      error: `Deploy failed: ${deploy.message}`,
      snap_id: snapId,
      deploy_http: deploy.httpCode,
      build_output_tail: deploy.buildOutputTail,
      rollback_applied: true,
      rollback_errors: rbErrors,
      redeploy_http: redeployHealth,
    };
  }

  // Client's /deploy returns BEFORE pm2 restart fires — we must poll externally.
  const healthCode = await waitForHealthy(client.domain);
  if (healthCode < 200 || healthCode >= 400) {
    const rbErrors = await rollbackToSnapshot(operatorUrl, token, clientId, snapId, pushedPaths);
    const redeploy = await upstreamDeploy(operatorUrl, token);
    const redeployHealth = redeploy.ok ? await waitForHealthy(client.domain) : 0;
    appendHistory(clientId, {
      ts: new Date().toISOString(), type: historyType, snap_id: snapId,
      message, files: pushedPaths,
      deploy_ok: false, deploy_http: healthCode,
      note: `Build ok but post-restart health check failed (got ${healthCode}) · rollback ${rbErrors.length ? 'with errors: ' + rbErrors.join('; ') : 'applied'} · redeploy scheduled=${!!redeploy.restartScheduled} health=${redeployHealth}`,
      ...extra,
    });
    return {
      ok: false, status: 502,
      error: `Build succeeded but client didn't return healthy after restart (${healthCode})`,
      snap_id: snapId,
      deploy_http: healthCode,
      build_output_tail: deploy.buildOutputTail,
      rollback_applied: true,
      rollback_errors: rbErrors,
      redeploy_http: redeployHealth,
    };
  }

  // ── 5. Success — clear staging, history, notify, prune
  const clearResult = discardAllForClient(clientId);
  pruneOldSnapshots(clientId, 50);

  appendHistory(clientId, {
    ts: new Date().toISOString(), type: historyType, snap_id: snapId,
    message, files: pushedPaths,
    deploy_ok: true, deploy_http: healthCode,
    ...extra,
  });

  await upstreamNotify(operatorUrl, token, {
    type: historyType === 'rollback' ? 'update_rolled_back' : 'update_deployed',
    title: historyType === 'rollback' ? 'Rolled back' : 'Update deployed',
    message: message || `${pushedPaths.length} file(s) ${historyType === 'rollback' ? 'rolled back' : 'updated'}`,
    data: { files: pushedPaths, snap_id: snapId, at: new Date().toISOString() },
  });

  return {
    ok: true,
    snap_id: snapId,
    files_pushed: pushedPaths,
    count: pushedPaths.length,
    deploy_http: healthCode,
    deploy_message: deploy.message,
    staging_cleared: clearResult.ok ? (clearResult as { removed_count: number }).removed_count : 0,
  };
}
