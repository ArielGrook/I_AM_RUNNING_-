/**
 * POST /api/admin/operator/push
 *
 * Body: { client_id, message? }
 *
 * Pushes all staged files to the client install atomically:
 *   1. Take snapshot of current production versions of every staged file
 *      (so we can rollback if deploy fails).
 *   2. PUT each staged file to client /api/operator/files.
 *      If any PUT fails, immediately rollback: PUT snapshot files back,
 *      redeploy, report error.
 *   3. Trigger client /api/operator/deploy. If deploy healthcheck fails,
 *      rollback the same way.
 *   4. On success: clear staging, append history, notify client.
 *
 * Returns:
 *   {
 *     success, snap_id, files_pushed, deploy_http, deploy_message,
 *     rollback_applied?: bool, errors?: string[]
 *   }
 *
 * This is the only write-side operator endpoint that's "all-or-nothing".
 * Single user flow — no concurrency handling. If two admins push at once,
 * second push wins (overlaps staging with current state, snapshot still
 * captures true production at that moment).
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';
import { decryptString } from '@/lib/admin/iam-clients-os/crypto';
import {
  listStagedFiles, readStagedFile, createSnapshot, writeSnapshotFile,
  writeSnapshotFileEncoding, discardAllForClient, appendHistory, pruneOldSnapshots,
  type SnapshotMeta,
} from '@/lib/admin/iam-clients-os/operator-store';

export const runtime = 'nodejs';

const UPSTREAM_TIMEOUT_MS = 20_000;
const DEPLOY_TIMEOUT_MS = 180_000;

function resolveOperatorUrl(client: { domain: string; operatorUrl?: string }): string {
  if (client.operatorUrl && client.operatorUrl.startsWith('http')) return client.operatorUrl;
  return `https://${client.domain}/api/operator`;
}

async function upstreamGET(operatorUrl: string, token: string, path: string):
  Promise<{ ok: true; content: string; encoding: 'text' | 'base64' } | { ok: false; status: number; error: string }> {
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

async function upstreamPUT(operatorUrl: string, token: string, path: string, content: string, encoding: 'text' | 'base64'):
  Promise<{ ok: true } | { ok: false; status: number; error: string }> {
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

async function upstreamDeploy(operatorUrl: string, token: string):
  Promise<{ ok: boolean; httpCode: number; message: string; buildOutputTail?: string }> {
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
      success?: boolean; httpCode?: number; message?: string; buildOutputTail?: string; error?: string;
    } | null;
    return {
      ok: !!data?.success,
      httpCode: data?.httpCode || res.status,
      message: data?.message || data?.error || `HTTP ${res.status}`,
      buildOutputTail: data?.buildOutputTail,
    };
  } catch (err) {
    return { ok: false, httpCode: 0, message: err instanceof Error ? err.message : String(err) };
  }
}

async function upstreamNotify(operatorUrl: string, token: string, payload: { type: string; title: string; message: string; data?: unknown }): Promise<void> {
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

interface PushBody {
  client_id?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({})) as PushBody;
  if (!body.client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 });

  const client = findClient(body.client_id);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (!client.operatorToken) return NextResponse.json({ error: 'Client has no operatorToken — waiting for first heartbeat' }, { status: 409 });

  let token: string;
  try { token = decryptString(client.operatorToken); } catch {
    return NextResponse.json({ error: 'Failed to decrypt operator_token' }, { status: 500 });
  }
  const operatorUrl = resolveOperatorUrl(client);

  // ── 1. Collect staged files ───────────────────────────────────────────────
  const staged = listStagedFiles(client.id);
  if (staged.length === 0) {
    return NextResponse.json({ error: 'No staged files to push' }, { status: 400 });
  }

  // ── 2. Create snapshot ────────────────────────────────────────────────────
  const snapRes = createSnapshot(client.id, body.message);
  if (!snapRes.ok) return NextResponse.json({ error: snapRes.error }, { status: snapRes.status });
  const snapId = snapRes.snap_id;

  const errors: string[] = [];

  for (const f of staged) {
    const prod = await upstreamGET(operatorUrl, token, f.path);
    if (prod.ok) {
      const w = writeSnapshotFile(client.id, snapId, f.path, prod.content, prod.encoding);
      if (!w.ok) {
        errors.push(`snapshot write ${f.path}: ${w.error}`);
      } else {
        writeSnapshotFileEncoding(client.id, snapId, f.path, prod.encoding);
      }
    } else if (prod.status === 404) {
      // File didn't exist in production — mark snapshot with encoding=text and empty.
      // Rollback of a "didn't exist" file means deleting it. We capture that
      // by writing a sentinel marker: empty content with encoding=text. During
      // rollback we DELETE files that weren't in the pre-push production.
      writeSnapshotFile(client.id, snapId, f.path + '.ABSENT', '', 'text');
    } else {
      errors.push(`snapshot fetch ${f.path}: ${prod.error}`);
    }
  }

  if (errors.length) {
    appendHistory(client.id, {
      ts: new Date().toISOString(), type: 'push', snap_id: snapId,
      message: body.message, files: staged.map(f => f.path),
      deploy_ok: false, note: `Aborted before upload: ${errors.join('; ')}`,
    });
    return NextResponse.json({
      success: false,
      error: 'Snapshot phase failed — no files pushed',
      snap_id: snapId,
      errors,
    }, { status: 502 });
  }

  // ── 3. PUT each staged file to client ────────────────────────────────────
  const pushedPaths: string[] = [];

  for (const f of staged) {
    const content = readStagedFile(client.id, f.path);
    if (!content.ok) {
      errors.push(`staging read ${f.path}: ${content.error}`);
      break;
    }
    const up = await upstreamPUT(operatorUrl, token, f.path, content.content, content.encoding);
    if (!up.ok) {
      errors.push(`PUT ${f.path}: ${up.error} (HTTP ${up.status})`);
      break;
    }
    pushedPaths.push(f.path);
  }

  // If any upload failed — rollback whatever we already pushed, then return
  if (errors.length) {
    const rollbackErrors = await rollbackToSnapshot(operatorUrl, token, client.id, snapId, pushedPaths);
    await upstreamDeploy(operatorUrl, token); // try to restart back to a known state
    appendHistory(client.id, {
      ts: new Date().toISOString(), type: 'push', snap_id: snapId,
      message: body.message, files: pushedPaths,
      deploy_ok: false,
      note: `Upload failed: ${errors.join('; ')}${rollbackErrors.length ? ` · rollback issues: ${rollbackErrors.join('; ')}` : ''}`,
    });
    return NextResponse.json({
      success: false,
      error: 'Upload failed — rolled back',
      snap_id: snapId,
      pushed_before_rollback: pushedPaths,
      errors,
      rollback_errors: rollbackErrors,
      rollback_applied: true,
    }, { status: 502 });
  }

  // ── 4. Deploy ────────────────────────────────────────────────────────────
  const deploy = await upstreamDeploy(operatorUrl, token);

  if (!deploy.ok) {
    const rollbackErrors = await rollbackToSnapshot(operatorUrl, token, client.id, snapId, pushedPaths);
    const redeploy = await upstreamDeploy(operatorUrl, token);
    appendHistory(client.id, {
      ts: new Date().toISOString(), type: 'push', snap_id: snapId,
      message: body.message, files: pushedPaths,
      deploy_ok: false, deploy_http: deploy.httpCode,
      note: `Deploy failed (${deploy.message}) · rollback ${rollbackErrors.length ? 'with errors: ' + rollbackErrors.join('; ') : 'applied'} · redeploy httpCode=${redeploy.httpCode}`,
    });
    return NextResponse.json({
      success: false,
      error: `Deploy failed: ${deploy.message}`,
      snap_id: snapId,
      deploy_http: deploy.httpCode,
      build_output_tail: deploy.buildOutputTail,
      rollback_applied: true,
      rollback_errors: rollbackErrors,
      redeploy_http: redeploy.httpCode,
    }, { status: 502 });
  }

  // ── 5. Success path — clear staging, append history, notify, prune ──────
  const clearResult = discardAllForClient(client.id);
  pruneOldSnapshots(client.id, 50);

  appendHistory(client.id, {
    ts: new Date().toISOString(), type: 'push', snap_id: snapId,
    message: body.message, files: pushedPaths,
    deploy_ok: true, deploy_http: deploy.httpCode,
  });

  // Notify client admin UI (best effort, non-blocking-on-error)
  await upstreamNotify(operatorUrl, token, {
    type: 'update_deployed',
    title: 'Update deployed',
    message: body.message || `${pushedPaths.length} file(s) updated`,
    data: { files: pushedPaths, snap_id: snapId, at: new Date().toISOString() },
  });

  return NextResponse.json({
    success: true,
    snap_id: snapId,
    files_pushed: pushedPaths,
    count: pushedPaths.length,
    deploy_http: deploy.httpCode,
    deploy_message: deploy.message,
    staging_cleared: clearResult.ok ? (clearResult as { removed_count: number }).removed_count : 0,
  });
}

/**
 * Rollback by restoring snapshot files back onto client.
 * Returns list of per-file errors (empty = clean rollback).
 */
async function rollbackToSnapshot(
  operatorUrl: string,
  token: string,
  clientId: string,
  snapId: string,
  paths: string[],
): Promise<string[]> {
  const errors: string[] = [];
  // We need the snapshot meta to know which files are "absent" (need delete not put)
  const meta: SnapshotMeta | null = null; // not strictly required — we check sidecar files in snapshot dir
  void meta;

  // For each file that was pushed: either PUT back the snapshot version,
  // or DELETE it (if snapshot marked it ABSENT, meaning it didn't exist pre-push).
  for (const p of paths) {
    // Try regular restore first
    try {
      const { readSnapshotFile } = await import('@/lib/admin/iam-clients-os/operator-store');
      const snap = readSnapshotFile(clientId, snapId, p);
      if (snap.ok) {
        const up = await upstreamPUT(operatorUrl, token, p, snap.content, snap.encoding);
        if (!up.ok) errors.push(`rollback PUT ${p}: ${up.error}`);
        continue;
      }

      // Not found in snapshot → check ABSENT marker
      const absent = readSnapshotFile(clientId, snapId, p + '.ABSENT');
      if (absent.ok) {
        // Originally didn't exist — delete to restore that state
        const delUrl = `${operatorUrl}/files?path=${encodeURIComponent(p)}`;
        try {
          const res = await fetch(delUrl, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
          });
          if (!res.ok && res.status !== 404) {
            errors.push(`rollback DELETE ${p}: HTTP ${res.status}`);
          }
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
