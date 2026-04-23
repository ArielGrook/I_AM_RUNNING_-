/**
 * POST /api/admin/operator/rollback
 *
 * Body: { client_id, snap_id }
 *
 * Restores files from a past snapshot back onto the client by:
 *   1. Reading all files under the snapshot directory
 *   2. Using them as "staging content" and calling the same push flow
 *   3. appendHistory entry with type='rollback'
 *
 * Important: this takes a NEW snapshot of current production BEFORE
 * applying the rollback — so the user can roll forward again if needed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';
import { decryptString } from '@/lib/admin/iam-clients-os/crypto';
import {
  getSnapshotMeta, readSnapshotFile, saveStagedFile, discardAllForClient,
  createSnapshot, writeSnapshotFile, writeSnapshotFileEncoding, appendHistory,
} from '@/lib/admin/iam-clients-os/operator-store';

export const runtime = 'nodejs';

const UPSTREAM_TIMEOUT_MS = 20_000;
const DEPLOY_TIMEOUT_MS = 180_000;

function resolveOperatorUrl(client: { domain: string; operatorUrl?: string }): string {
  if (client.operatorUrl && client.operatorUrl.startsWith('http')) return client.operatorUrl;
  return `https://${client.domain}/api/operator`;
}

interface RollbackBody {
  client_id?: string;
  snap_id?: string;
}

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({})) as RollbackBody;
  if (!body.client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  if (!body.snap_id) return NextResponse.json({ error: 'snap_id required' }, { status: 400 });

  const client = findClient(body.client_id);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (!client.operatorToken) return NextResponse.json({ error: 'Client has no operatorToken' }, { status: 409 });

  let token: string;
  try { token = decryptString(client.operatorToken); } catch {
    return NextResponse.json({ error: 'Failed to decrypt operator_token' }, { status: 500 });
  }
  const operatorUrl = resolveOperatorUrl(client);

  const meta = getSnapshotMeta(client.id, body.snap_id);
  if (!meta) return NextResponse.json({ error: `Snapshot ${body.snap_id} not found` }, { status: 404 });

  if (!meta.files || meta.files.length === 0) {
    return NextResponse.json({ error: 'Snapshot contains no files (or meta corrupted)' }, { status: 500 });
  }

  // ── 1. Pre-rollback snapshot: capture current production so we can roll forward again
  const preSnap = createSnapshot(client.id, `pre-rollback of ${body.snap_id}`);
  if (!preSnap.ok) return NextResponse.json({ error: `pre-snapshot: ${preSnap.error}` }, { status: preSnap.status });
  const preSnapId = preSnap.snap_id;

  const errors: string[] = [];

  for (const p of meta.files) {
    try {
      const url = `${operatorUrl}/files/read?path=${encodeURIComponent(p)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
      if (res.status === 404) {
        writeSnapshotFile(client.id, preSnapId, p + '.ABSENT', '', 'text');
        continue;
      }
      const data = await res.json() as { content?: string; encoding?: string };
      const encoding = data.encoding === 'base64' ? 'base64' : 'text';
      writeSnapshotFile(client.id, preSnapId, p, data.content || '', encoding);
      writeSnapshotFileEncoding(client.id, preSnapId, p, encoding);
    } catch (err) {
      errors.push(`pre-snap fetch ${p}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── 2. Load snapshot files into staging, then run push flow via PUT + deploy.
  //       We re-use the push endpoint's upstream helpers by calling them inline
  //       (not by HTTP) — simpler error handling.
  discardAllForClient(client.id);

  let staged_into = 0;
  for (const p of meta.files) {
    const snap = readSnapshotFile(client.id, body.snap_id, p);
    if (snap.ok) {
      const r = saveStagedFile(client.id, p, snap.content, snap.encoding);
      if (r.ok) staged_into++;
      else errors.push(`stage ${p}: ${r.error}`);
      continue;
    }
    // Check ABSENT marker: means "rollback to non-existence" — delete the file on client
    const absent = readSnapshotFile(client.id, body.snap_id, p + '.ABSENT');
    if (absent.ok) {
      try {
        const res = await fetch(`${operatorUrl}/files?path=${encodeURIComponent(p)}`, {
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
    errors.push(`snap ${p}: not found in snapshot and no ABSENT marker`);
  }

  // Run the push flow on the staged files.
  // We avoid a self-HTTP call — instead we POST directly to our own push endpoint
  // via fetch("/api/admin/operator/push"). But we're already a server route,
  // so it's simpler to forward the admin cookie via request.
  // Cleaner: re-implement the push sequence here — too much code. Since push/route.ts
  // is its own module, we'd duplicate logic. Compromise: export a helper from push/route.ts
  // would couple modules. For now: call the push endpoint through internal fetch.

  const pushRes = await fetch(new URL('/api/admin/operator/push', request.url).toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: request.headers.get('cookie') || '',
    },
    body: JSON.stringify({ client_id: client.id, message: `Rollback to snapshot ${body.snap_id}` }),
  });
  const pushData = await pushRes.json().catch(() => ({})) as {
    success?: boolean; snap_id?: string; files_pushed?: string[]; deploy_http?: number;
    error?: string;
  };

  appendHistory(client.id, {
    ts: new Date().toISOString(),
    type: 'rollback',
    snap_id: body.snap_id,
    files: meta.files,
    deploy_ok: !!pushData.success,
    deploy_http: pushData.deploy_http,
    note: pushData.success
      ? `Rolled back ${staged_into} file(s) (pre-snapshot ${preSnapId})`
      : `Rollback failed: ${pushData.error || 'unknown'}`,
    message: `Rollback to ${body.snap_id}`,
  });

  if (!pushData.success) {
    return NextResponse.json({
      success: false,
      error: pushData.error || 'Rollback push failed',
      snap_id: body.snap_id,
      pre_snap_id: preSnapId,
      errors,
    }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    snap_id: body.snap_id,
    pre_snap_id: preSnapId,
    files_rolled_back: meta.files,
    deploy_http: pushData.deploy_http,
    warnings: errors,
  });
}
