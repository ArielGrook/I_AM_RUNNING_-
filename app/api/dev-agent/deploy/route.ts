import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/dev-agent/config';
import { execSync, spawnSync } from 'child_process';

export const maxDuration = 120;
export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const PM2_PROCESS_NAME = process.env.PM2_PROCESS_NAME || 'i-am-running';
const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:3000';
const HEALTH_CHECK_RETRIES = 3;
const GIT_BRANCH = process.env.GIT_BRANCH || 'main';
const DEVELOPER_USER_ID = process.env.DEVELOPER_USER_ID;

export async function POST() {
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

    const steps: string[] = [];

    const deployResult = spawnSync('sudo', ['/usr/local/bin/iam-deploy.sh'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 180000,
    });
      if (deployResult.status !== 0) throw new Error(deployResult.stdout || "Deploy script failed");
    steps.push('git pull ✅');
    steps.push('npm run build ✅');
    steps.push('pm2 restart ✅');
    return NextResponse.json({ success: true, steps });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
