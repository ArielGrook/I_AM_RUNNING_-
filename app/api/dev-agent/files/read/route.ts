import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/dev-agent/config';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
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

    if (!filePath) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    // Reject absolute paths and path traversal attempts
    if (path.isAbsolute(filePath) || filePath.includes('..')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check against blocked patterns
    const normalizedPath = filePath.replace(/\\/g, '/');
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(normalizedPath)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Resolve and verify the path stays within PROJECT_ROOT
    const absolutePath = path.resolve(PROJECT_ROOT, filePath);
    const resolvedRoot = path.resolve(PROJECT_ROOT);
    if (!absolutePath.startsWith(resolvedRoot + path.sep) && absolutePath !== resolvedRoot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check file exists
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check it's a file (not a directory)
    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    // Check file size
    if (stat.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${Math.round(stat.size / 1024)}KB). Max 500KB.` },
        { status: 413 }
      );
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const lines = content.split('\n').length;

    return NextResponse.json({ content, path: filePath, lines });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
