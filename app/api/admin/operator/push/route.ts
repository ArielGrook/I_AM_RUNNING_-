/**
 * POST /api/admin/operator/push
 *
 * Body: { client_id, message? }
 *
 * Thin HTTP adapter over executePushFlow. All the atomic push logic
 * (snapshot → PUT → deploy → healthcheck → rollback-on-fail → history)
 * lives in lib/admin/iam-clients-os/push-flow.ts so that the /rollback
 * endpoint can invoke it directly without a self-HTTP-loop.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { executePushFlow } from '@/lib/admin/iam-clients-os/push-flow';

export const runtime = 'nodejs';

interface PushBody {
  client_id?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({})) as PushBody;
  if (!body.client_id) {
    return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  }

  const result = await executePushFlow({
    clientId: body.client_id,
    message: body.message,
    historyType: 'push',
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        snap_id: result.snap_id,
        deploy_http: result.deploy_http,
        build_output_tail: result.build_output_tail,
        rollback_applied: result.rollback_applied,
        rollback_errors: result.rollback_errors,
        redeploy_http: result.redeploy_http,
        pushed_before_rollback: result.pushed_before_rollback,
        errors: result.errors,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    success: true,
    snap_id: result.snap_id,
    files_pushed: result.files_pushed,
    count: result.count,
    deploy_http: result.deploy_http,
    deploy_message: result.deploy_message,
    staging_cleared: result.staging_cleared,
  });
}
