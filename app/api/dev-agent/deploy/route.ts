import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/dev-agent/config';
import { execSync } from 'child_process';

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

    execSync(`git pull origin ${GIT_BRANCH}`, { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 30000 });
    steps.push('git pull ✅');

    execSync('npm run build', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 120000 });
    steps.push('npm run build ✅');

    execSync(`pm2 restart ${PM2_PROCESS_NAME}`, { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 30000 });
    steps.push('pm2 restart ✅');

    // Health check — wait for server to respond
    await new Promise(resolve => setTimeout(resolve, 3000));
    let healthy = false;
    for (let i = 0; i < HEALTH_CHECK_RETRIES; i++) {
      try {
        const res = await fetch(HEALTH_CHECK_URL, { signal: AbortSignal.timeout(5000) });
        if (res.ok) { healthy = true; break; }
      } catch {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!healthy) {
      // Auto-rollback
      steps.push('health check ❌ — rolling back...');
      execSync('git reset --hard HEAD~1', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 15000 });
      execSync('npm run build', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 120000 });
      execSync(`pm2 restart ${PM2_PROCESS_NAME}`, { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 30000 });
      steps.push('rollback complete ✅');
      return NextResponse.json({ success: false, error: 'Health check failed — auto-rollback applied', steps }, { status: 500 });
    }

    steps.push('health check ✅');
    return NextResponse.json({ success: true, steps });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
