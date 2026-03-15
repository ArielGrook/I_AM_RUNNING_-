import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/dev-agent/config';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const DEVELOPER_USER_ID = process.env.DEVELOPER_USER_ID;

const IGNORE = new Set([
  'node_modules', '.next', '.git', '.idea', '.cursor', '.continue',
  '.turbo', 'dist', 'coverage', '.vercel', '.husky'
]);

interface TreeNode {
  name: string;
  path: string;       // relative to PROJECT_ROOT
  type: 'file' | 'dir';
  children?: TreeNode[];
}

function buildTree(dirPath: string, relativePath: string, depth: number, maxDepth: number): TreeNode[] {
  if (depth >= maxDepth) return [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const result: TreeNode[] = [];

  // Sort: directories first, then files, alphabetically
  const sorted = entries
    .filter(e => !e.name.startsWith('.') || e.name === '.env.example')
    .filter(e => !IGNORE.has(e.name))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  for (const entry of sorted) {
    const entryRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    const entryAbsolute = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        path: entryRelative,
        type: 'dir',
        children: buildTree(entryAbsolute, entryRelative, depth + 1, maxDepth),
      });
    } else {
      result.push({
        name: entry.name,
        path: entryRelative,
        type: 'file',
      });
    }
  }

  return result;
}

export async function GET() {
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

    const tree = buildTree(PROJECT_ROOT, '', 0, 5);
    return NextResponse.json({ tree });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
