/**
 * GET /api/admin/iam-clients-os/workspace
 *
 * Scoped file-tree endpoint for the Dev Workspace subtab.
 *
 * Unlike /api/dev-agent/files (which returns the entire project tree from
 * PROJECT_ROOT), this endpoint is scoped strictly to `iam-clients-os/workspace/`.
 * That isolation matters because:
 *  - The admin Dev Workspace is product-specific, not a general file browser
 *  - It prevents admin users from accidentally browsing into app/, lib/, .next/
 *  - Path-traversal attempts are blocked at the scope boundary
 *
 * File READ happens through the existing `/api/dev-agent/files/read` endpoint
 * (it already handles `iam-clients-os/workspace/...` paths correctly since
 * PROJECT_ROOT sees them). The UI just prefixes `iam-clients-os/workspace/`
 * before calling that endpoint.
 *
 * Write / delete are NOT exposed in this iteration — Dev Workspace is
 * read-only by design until we need otherwise.
 *
 * Guarded by checkAdminAuth (TOTP session cookie).
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const WORKSPACE_ROOT = path.resolve(PROJECT_ROOT, 'iam-clients-os', 'workspace');

// Same ignore list as /api/dev-agent/files — keeps parity with Dev Console UX.
const IGNORE = new Set([
  'node_modules', '.next', '.git', '.idea', '.cursor', '.continue',
  '.turbo', 'dist', 'coverage', '.vercel', '.husky',
]);

interface TreeNode {
  name: string;
  /** Path relative to `iam-clients-os/workspace/` (NOT to PROJECT_ROOT). */
  path: string;
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

  const sorted = entries
    .filter(e => !e.name.startsWith('.') || e.name === '.env.example')
    .filter(e => !IGNORE.has(e.name))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  const result: TreeNode[] = [];
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

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Does the workspace folder even exist? Covers the Gotcha #1 case:
    // a fresh checkout where only README.md is present.
    if (!fs.existsSync(WORKSPACE_ROOT)) {
      return NextResponse.json({
        tree: [],
        empty: true,
        reason: 'iam-clients-os/workspace/ folder does not exist',
        workspacePath: 'iam-clients-os/workspace',
      });
    }

    const stat = fs.statSync(WORKSPACE_ROOT);
    if (!stat.isDirectory()) {
      return NextResponse.json({
        tree: [],
        empty: true,
        reason: 'iam-clients-os/workspace exists but is not a directory',
        workspacePath: 'iam-clients-os/workspace',
      });
    }

    const tree = buildTree(WORKSPACE_ROOT, '', 0, 6);
    return NextResponse.json({
      tree,
      empty: tree.length === 0,
      workspacePath: 'iam-clients-os/workspace',
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
