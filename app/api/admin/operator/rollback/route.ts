/**
 * POST /api/admin/operator/rollback
 *
 * Body: { client_id, snap_id }
 *
 * Restores files from a past snapshot by:
 *   1. Loading target snapshot's files into iamrunning's staging
 *   2. Invoking executePushFlow (in-process, NO self-HTTP-loop) with
 *      historyType='rollback'. The flow captures the current production
 *      state as a new snapshot (pre_snap_id) so the user can roll forward
 *      again.
 *
 * Note on ABSENT markers: if the target snapshot marked a file as ABSENT
 * (i.e. that file didn't exist in production at the time of the snapshot),
 * a full rollback would require DELETE'ing that file from the client. For
 * now, ABSENT entries are reported as warnings in `stage_errors` and the
 * file is left untouched. TODO: extend flow with DELETE capability.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { findClient } from '@/lib/admin/iam-clients-os/store';
import {
  getSnapshotMeta, readSnapshotFile, saveStagedFile, discardAllForClient,
} from '@/lib/admin/iam-clients-os/operator-store';
import { executePushFlow } from '@/lib/admin/iam-clients-os/push-flow';

export const runtime = 'nodejs';

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

  const meta = getSnapshotMeta(client.id, body.snap_id);
  if (!meta) return NextResponse.json({ error: `Snapshot ${body.snap_id} not found` }, { status: 404 });

  if (!meta.files || meta.files.length === 0) {
    return NextResponse.json({ error: 'Snapshot contains no files (or meta corrupted)' }, { status: 500 });
  }

  // ── 1. Load target snapshot files into staging
  discardAllForClient(client.id);
  const stagedFiles: string[] = [];
  const stageWarnings: string[] = [];

  for (const p of meta.files) {
    const snap = readSnapshotFile(client.id, body.snap_id, p);
    if (snap.ok) {
      const r = saveStagedFile(client.id, p, snap.content, snap.encoding);
      if (r.ok) stagedFiles.push(p);
      else stageWarnings.push(`stage ${p}: ${r.error}`);
      continue;
    }
    const absent = readSnapshotFile(client.id, body.snap_id, p + '.ABSENT');
    if (absent.ok) {
      // TODO: support DELETE path for ABSENT markers. For now: warn + skip.
      stageWarnings.push(`skip ${p}: was ABSENT in target snapshot (not re-deleted)`);
      continue;
    }
    stageWarnings.push(`snap ${p}: not found and no ABSENT marker`);
  }

  if (stagedFiles.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'No content files could be staged for rollback (all ABSENT or missing)',
      snap_id: body.snap_id,
      stage_warnings: stageWarnings,
    }, { status: 502 });
  }

  // ── 2. Direct in-process push flow (no self-HTTP-loop).
  //       executePushFlow captures current production as its own snapshot —
  //       that becomes our pre_snap_id for roll-forward.
  const result = await executePushFlow({
    clientId: client.id,
    message: `Rollback to snapshot ${body.snap_id}`,
    historyType: 'rollback',
    extraHistoryFields: { rolled_back_from_snap_id: body.snap_id },
  });

  if (!result.ok) {
    return NextResponse.json({
      success: false,
      error: result.error,
      snap_id: body.snap_id,
      pre_snap_id: result.snap_id,
      deploy_http: result.deploy_http,
      build_output_tail: result.build_output_tail,
      rollback_applied: result.rollback_applied,
      rollback_errors: result.rollback_errors,
      stage_warnings: stageWarnings,
    }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    snap_id: body.snap_id,
    pre_snap_id: result.snap_id,
    files_rolled_back: result.files_pushed,
    count: result.count,
    deploy_http: result.deploy_http,
    stage_warnings: stageWarnings,
  });
}
