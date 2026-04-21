/**
 * Workspace root resolver — shared by all dev-agent file routes.
 *
 * The Dev Console UI exposes a "workspace scope" selector (root vs.
 * iam-clients-os). When set, all file operations (tree, read, write,
 * delete, mkdir) confine themselves to the corresponding subfolder.
 *
 * This is a real server-side boundary: even if the UI is bypassed,
 * an attacker with `?root=iam-clients-os&path=../../app/page.tsx`
 * cannot escape because resolvePathInsideRoot enforces the boundary
 * via absolute-path comparison.
 *
 * Whitelist-based: only known roots are allowed. Adding a new
 * workspace = adding a key here.
 */

import path from 'path';

export const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';

const WORKSPACE_ROOTS: Record<string, string> = {
  '': '',                                   // Default: full project
  'root': '',                               // Alias for default
  'iamrunning.online': '',                  // Alias for default (UI label)
  'iam-clients-os': 'iam-clients-os',       // Scoped to IAM Client OS folder
};

export interface ResolvedRoot {
  rootId: string;
  subPath: string;
  absolute: string;
}

export class WorkspaceRootError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = 'WorkspaceRootError';
  }
}

export function resolveRoot(rootParam: string | null | undefined): ResolvedRoot {
  const rootId = (rootParam ?? '').trim();

  if (!(rootId in WORKSPACE_ROOTS)) {
    throw new WorkspaceRootError(
      `Unknown workspace root: "${rootId}". Allowed: ${Object.keys(WORKSPACE_ROOTS).filter(k => k !== '').join(', ')}`,
      400,
    );
  }

  const subPath = WORKSPACE_ROOTS[rootId];
  const absolute = subPath
    ? path.resolve(PROJECT_ROOT, subPath)
    : path.resolve(PROJECT_ROOT);

  return { rootId, subPath, absolute };
}

/**
 * Resolve a user-supplied relative path against a workspace root.
 * Enforces no-traversal: result must stay strictly inside resolved.absolute.
 */
export function resolvePathInsideRoot(
  resolved: ResolvedRoot,
  userPath: string | null | undefined,
): string {
  const p = (userPath ?? '').trim();

  if (!p) {
    throw new WorkspaceRootError('Missing path', 400);
  }
  if (path.isAbsolute(p) || p.includes('..')) {
    throw new WorkspaceRootError('Invalid path', 403);
  }

  const absolute = path.resolve(resolved.absolute, p);
  const boundary = resolved.absolute;

  if (absolute !== boundary && !absolute.startsWith(boundary + path.sep)) {
    throw new WorkspaceRootError('Path traversal detected', 403);
  }

  return absolute;
}

export function resolveRootFromUrl(url: string): ResolvedRoot {
  try {
    const params = new URL(url).searchParams;
    return resolveRoot(params.get('root'));
  } catch {
    return resolveRoot(null);
  }
}

export function resolveRootFromBody(body: unknown): ResolvedRoot {
  if (body && typeof body === 'object' && 'root' in body) {
    const r = (body as Record<string, unknown>).root;
    return resolveRoot(typeof r === 'string' ? r : null);
  }
  return resolveRoot(null);
}
