/**
 * Workspace root resolver for dev-agent file APIs.
 *
 * Background: dev-agent file endpoints historically operate on PROJECT_ROOT
 * (the iamrunning.online repo root). The admin Dev Console now supports
 * multiple "workspace scopes" — e.g. a user can switch to work inside
 * `iam-clients-os/` and have the file tree, reads, writes, and deletes
 * limited to that subfolder.
 *
 * This module centralizes:
 *   - the list of allowed workspace roots (whitelist)
 *   - parsing of `?root=` query parameters
 *   - resolution to an absolute filesystem path
 *   - path-traversal enforcement so a client-supplied relative path
 *     cannot escape the resolved workspace root
 *
 * Design notes:
 *   - A whitelist is required. Accepting arbitrary paths from query strings
 *     is how file servers get exploited.
 *   - The default root (empty / missing `?root=`) means PROJECT_ROOT —
 *     preserving 100% of existing behavior for callers that don't opt in.
 *   - resolveRoot is read-only on its inputs — it throws via typed errors
 *     that callers convert to 400/403 responses.
 */

import path from 'path';

export const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';

/**
 * Whitelist of accepted `?root=` values and their subpaths inside PROJECT_ROOT.
 *
 * The empty string key "" is an internal convention meaning "no scope selected,
 * use PROJECT_ROOT as-is". It is the value returned when the query parameter
 * is missing or equals an empty string.
 */
const WORKSPACE_ROOTS: Record<string, string> = {
  '': '',                                   // Default: full project
  'iamrunning.online': '',                  // Alias for default (readable in UI)
  'iam-clients-os': 'iam-clients-os',       // Scoped to IAM Client OS product folder
};

export interface ResolvedRoot {
  /** The `?root=` value normalized (e.g. '' for default). */
  rootId: string;
  /** Subpath inside PROJECT_ROOT (empty string = PROJECT_ROOT itself). */
  subPath: string;
  /** Absolute filesystem path to the workspace root. */
  absolute: string;
}

export class WorkspaceRootError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = 'WorkspaceRootError';
  }
}

/**
 * Validate and resolve a `?root=` query parameter to an absolute directory.
 *
 * @throws WorkspaceRootError when the supplied root is not in the whitelist.
 */
export function resolveRoot(rootParam: string | null | undefined): ResolvedRoot {
  const rootId = (rootParam ?? '').trim();

  if (!(rootId in WORKSPACE_ROOTS)) {
    throw new WorkspaceRootError(
      `Unknown workspace root: ${rootId}. Allowed: ${Object.keys(WORKSPACE_ROOTS).filter(k => k !== '').join(', ')}`,
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
 * Resolve a user-supplied relative file path against a workspace root and
 * enforce that it stays inside that root. Returns the absolute path.
 *
 * @throws WorkspaceRootError for empty/absolute/traversal inputs.
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

  // Must be boundary itself or strictly inside it (with separator).
  if (absolute !== boundary && !absolute.startsWith(boundary + path.sep)) {
    throw new WorkspaceRootError('Path traversal detected', 403);
  }

  return absolute;
}

/**
 * Convenience: extract `?root=` from a NextRequest URL and resolve it.
 */
export function resolveRootFromRequest(url: string): ResolvedRoot {
  try {
    const params = new URL(url).searchParams;
    return resolveRoot(params.get('root'));
  } catch {
    // URL parse failure = fall back to default scope
    return resolveRoot(null);
  }
}

/**
 * Convenience: extract `root` from a parsed JSON body (for POST/DELETE endpoints).
 */
export function resolveRootFromBody(body: unknown): ResolvedRoot {
  if (body && typeof body === 'object' && 'root' in body) {
    const r = (body as Record<string, unknown>).root;
    return resolveRoot(typeof r === 'string' ? r : null);
  }
  return resolveRoot(null);
}
