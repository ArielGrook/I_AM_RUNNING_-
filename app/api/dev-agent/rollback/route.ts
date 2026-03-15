import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/dev-agent/config';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const DEVELOPER_USER_ID = process.env.DEVELOPER_USER_ID;
const PM2_PROCESS_NAME = process.env.PM2_PROCESS_NAME || 'i-am-running';

export const maxDuration = 120;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const config = await loadConfig();
    const devUserId = DEVELOPER_USER_ID || config.developerUserId;
    if (devUserId && user.id !== devUserId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { targetHash } = body as { targetHash?: string };

    // Validate targetHash if provided
    if (targetHash && !/^[a-f0-9]{7,40}$/.test(targetHash)) {
      return NextResponse.json({ success: false, error: 'Invalid commit hash' }, { status: 400 });
    }

    const rolledBack = execSync('git log --oneline -1', {
      cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 5000,
    }).trim();

    const resetTarget = targetHash ? targetHash : 'HEAD~1';
    execSync(`git reset --hard ${resetTarget}`, {
      cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000,
    });

    const revertedTo = execSync('git log --oneline -1', {
      cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 5000,
    }).trim();

    execSync('npm run build', {
      cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 120000,
    });

    execSync(`pm2 restart ${PM2_PROCESS_NAME}`, {
      cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000,
    });

    return NextResponse.json({ success: true, rolledBack, revertedTo });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
