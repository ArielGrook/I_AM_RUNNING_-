import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/dev-agent/config';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const DEVELOPER_USER_ID = process.env.DEVELOPER_USER_ID;

const BLOCKED_PATTERNS = ['.env', '.git/', 'node_modules/', '.next/', 'app/api/dev-agent'];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const config = await loadConfig();
    const devUserId = DEVELOPER_USER_ID || config.developerUserId;
    if (devUserId && user.id !== devUserId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { path: dirPath } = body;

    if (!dirPath) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    if (dirPath.startsWith('/') || dirPath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    for (const pattern of BLOCKED_PATTERNS) {
      if (dirPath.includes(pattern)) {
        return NextResponse.json({ error: `Cannot create directory in ${pattern}` }, { status: 403 });
      }
    }

    const absolute = path.resolve(PROJECT_ROOT, dirPath);
    if (!absolute.startsWith(path.resolve(PROJECT_ROOT))) {
      return NextResponse.json({ error: 'Path traversal detected' }, { status: 403 });
    }

    fs.mkdirSync(absolute, { recursive: true });

    return NextResponse.json({ success: true, path: dirPath });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
