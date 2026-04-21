import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/dev-agent/config';
import { resolveRootFromBody, resolvePathInsideRoot, WorkspaceRootError } from '@/lib/dev-agent/resolveRoot';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const DEVELOPER_USER_ID = process.env.DEVELOPER_USER_ID;

// Even when scoped, these are never writable.
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
    const { path: filePath, content } = body;

    if (!filePath || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing path or content' }, { status: 400 });
    }

    // Sensitive-pattern check still runs first (cheap, catches obvious things).
    for (const pattern of BLOCKED_PATTERNS) {
      if (filePath.includes(pattern)) {
        return NextResponse.json({ error: `Cannot write to ${pattern}` }, { status: 403 });
      }
    }

    // Resolve scope from body. resolvePathInsideRoot enforces no-traversal
    // and that the final path stays within the chosen workspace root.
    const resolved = resolveRootFromBody(body);
    const absolute = resolvePathInsideRoot(resolved, filePath);

    // Create directory if it doesn't exist
    const dir = path.dirname(absolute);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolute, content, 'utf-8');

    return NextResponse.json({
      success: true,
      path: filePath,
      lines: content.split('\n').length,
      size: Buffer.byteLength(content, 'utf-8'),
      rootId: resolved.rootId,
    });
  } catch (err: unknown) {
    if (err instanceof WorkspaceRootError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
