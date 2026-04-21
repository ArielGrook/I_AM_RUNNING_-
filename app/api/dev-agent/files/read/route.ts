import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/dev-agent/config';
import { resolveRootFromUrl, resolvePathInsideRoot, WorkspaceRootError } from '@/lib/dev-agent/resolveRoot';
import fs from 'fs';

export const runtime = 'nodejs';

const DEVELOPER_USER_ID = process.env.DEVELOPER_USER_ID;
const MAX_FILE_SIZE = 500 * 1024; // 500KB

const BLOCKED_PATTERNS = [
  /^\.env/,
  /^\.git[\\/]objects/,
  /node_modules/,
  /^\.next/,
];

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    // Resolve scope first; pathInsideRoot enforces no traversal.
    const resolved = resolveRootFromUrl(request.url);
    const absolutePath = resolvePathInsideRoot(resolved, filePath);

    // Pattern blocklist on the relative-to-PROJECT_ROOT path.
    // (Even when scoped, .env etc. should never be readable.)
    const normalizedPath = (filePath ?? '').replace(/\\/g, '/');
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(normalizedPath)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    if (stat.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${Math.round(stat.size / 1024)}KB). Max 500KB.` },
        { status: 413 }
      );
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const lines = content.split('\n').length;

    return NextResponse.json({ content, path: filePath, lines, rootId: resolved.rootId });
  } catch (err: unknown) {
    if (err instanceof WorkspaceRootError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
