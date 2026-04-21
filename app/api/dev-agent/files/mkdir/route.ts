import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/dev-agent/config';
import { resolveRootFromBody, resolvePathInsideRoot, WorkspaceRootError } from '@/lib/dev-agent/resolveRoot';
import fs from 'fs';

export const runtime = 'nodejs';

const DEVELOPER_USER_ID = process.env.DEVELOPER_USER_ID;

const BLOCKED_PATTERNS = ['.env', '.git/', 'node_modules/', '.next/'];

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

    for (const pattern of BLOCKED_PATTERNS) {
      if (dirPath.includes(pattern)) {
        return NextResponse.json({ error: `Cannot create directory in ${pattern}` }, { status: 403 });
      }
    }

    const resolved = resolveRootFromBody(body);
    const absolute = resolvePathInsideRoot(resolved, dirPath);

    fs.mkdirSync(absolute, { recursive: true });

    return NextResponse.json({ success: true, path: dirPath, rootId: resolved.rootId });
  } catch (err: unknown) {
    if (err instanceof WorkspaceRootError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
