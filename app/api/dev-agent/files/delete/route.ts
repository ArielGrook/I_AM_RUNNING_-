import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/dev-agent/config';
import { resolveRootFromBody, resolvePathInsideRoot, WorkspaceRootError } from '@/lib/dev-agent/resolveRoot';
import fs from 'fs';

export const runtime = 'nodejs';

const DEVELOPER_USER_ID = process.env.DEVELOPER_USER_ID;

const BLOCKED_PATTERNS = ['.env', '.git/', 'node_modules/', '.next/'];

export async function DELETE(req: NextRequest) {
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
    const { path: filePath } = body;

    if (!filePath) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    for (const pattern of BLOCKED_PATTERNS) {
      if (filePath.includes(pattern)) {
        return NextResponse.json({ error: `Cannot delete ${pattern}` }, { status: 403 });
      }
    }

    const resolved = resolveRootFromBody(body);
    const absolute = resolvePathInsideRoot(resolved, filePath);

    if (!fs.existsSync(absolute)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(absolute);

    if (stat.isDirectory()) {
      const contents = fs.readdirSync(absolute);
      if (contents.length > 0) {
        return NextResponse.json({ error: 'Folder is not empty. Delete contents first.' }, { status: 409 });
      }
      fs.rmdirSync(absolute);
    } else {
      fs.unlinkSync(absolute);
    }

    return NextResponse.json({ success: true, path: filePath, rootId: resolved.rootId });
  } catch (err: unknown) {
    if (err instanceof WorkspaceRootError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
