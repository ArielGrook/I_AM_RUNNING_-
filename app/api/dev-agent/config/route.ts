import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig, saveConfig, maskConfig, type DevAgentConfig } from '@/lib/dev-agent/config';

export const runtime = 'nodejs';

const DEVELOPER_USER_ID = process.env.DEVELOPER_USER_ID;

// Проверка auth — ИДЕНТИЧНА app/api/dev-agent/route.ts
async function checkAuth(): Promise<{ authorized: boolean; error?: string; status?: number }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false, error: 'Not authenticated', status: 401 };
  }

  const config = await loadConfig();
  const devUserId = DEVELOPER_USER_ID || config.developerUserId;
  if (devUserId && user.id !== devUserId) {
    return { authorized: false, error: 'Access denied', status: 403 };
  }

  return { authorized: true };
}

export async function GET() {
  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const config = await loadConfig();
  return NextResponse.json({ config: maskConfig(config) });
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body: Partial<DevAgentConfig> = await request.json();
  const updated = await saveConfig(body);
  return NextResponse.json({ config: maskConfig(updated), success: true });
}
