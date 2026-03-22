/**
 * ChatGPT-Safe MCP Server
 * Exposes 4 read-only tools + restricted write to context-core/** only.
 * NO deploy, NO git, NO shell, NO patch_file, NO code writes.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readFile, writeFile, readdir, stat, appendFile } from 'fs/promises';
import { resolve, relative, extname, join } from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';

// ── Security constants ────────────────────────────────────────────────────
const READ_ALLOWED_DIRS = [
  'context-core',
  'lib',
  'app',
  'components',
  'docs',
  '.',  // root-level files only (e.g. README, package.json)
];
const WRITE_ALLOWED_DIR = 'context-core'; // ONLY this dir for writes
const ALLOWED_EXTENSIONS = ['.md', '.json', '.yaml', '.yml', '.txt'];
const MAX_FILE_SIZE = 500 * 1024; // 500KB
const BLOCKED_PATTERNS = [
  /\.env/,
  /node_modules/,
  /\.git/,
  /\.next/,
  /deploy/i,
  /rollback/i,
  /secret/i,
  /password/i,
  /token/i,
  /api-key/i,
];

// ── Audit log ─────────────────────────────────────────────────────────────
const AUDIT_LOG = join(PROJECT_ROOT, '.gpt-mcp-audit.log');

async function auditLog(action: string, path: string, extra = '') {
  const line = `[${new Date().toISOString()}] ${action} | path="${path}"${extra ? ' | ' + extra : ''}\n`;
  await appendFile(AUDIT_LOG, line).catch(() => {});
}

// ── Path security helpers ─────────────────────────────────────────────────
function safePath(inputPath: string): { abs: string; rel: string } | null {
  // Normalize and resolve
  const rel = inputPath.replace(/^\/+/, '').replace(/\.\./g, '');
  const abs = resolve(PROJECT_ROOT, rel);

  // Path traversal check
  if (!abs.startsWith(PROJECT_ROOT + '/') && abs !== PROJECT_ROOT) return null;

  // Block sensitive patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(rel)) return null;
  }

  return { abs, rel };
}

function isReadAllowed(rel: string): boolean {
  // Allow root-level files
  if (!rel.includes('/')) return true;
  const topDir = rel.split('/')[0];
  return READ_ALLOWED_DIRS.includes(topDir);
}

function isWriteAllowed(rel: string): boolean {
  return rel.startsWith(WRITE_ALLOWED_DIR + '/') || rel === WRITE_ALLOWED_DIR;
}

function isExtensionAllowed(rel: string): boolean {
  const ext = extname(rel).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) || ext === '';
}

// ── Result helpers ────────────────────────────────────────────────────────
function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
function err(msg: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }], isError: true };
}

// ── Server factory ────────────────────────────────────────────────────────
export function createGptSafeMcpServer(): McpServer {
  const server = new McpServer({
    name: 'i-am-running-gpt-safe',
    version: '1.0.0',
  });

  // ── TOOL 1: read_file ───────────────────────────────────────────────────
  server.tool(
    'read_file',
    'Read a documentation or source file. Allowed dirs: context-core, lib, app, components, docs. Blocked: .env, node_modules, .git, secrets.',
    { path: z.string().describe('Relative path from project root, e.g. "context-core/PROGRESS.md"') },
    async ({ path: inputPath }) => {
      const p = safePath(inputPath);
      if (!p) return err('Path blocked: traversal or sensitive file.');
      if (!isReadAllowed(p.rel)) return err(`Directory not in read whitelist. Allowed: ${READ_ALLOWED_DIRS.join(', ')}`);
      if (!isExtensionAllowed(p.rel)) return err(`Extension not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);

      try {
        const stats = await stat(p.abs);
        if (stats.size > MAX_FILE_SIZE) return err(`File too large (${stats.size} bytes). Max: ${MAX_FILE_SIZE}`);
        const content = await readFile(p.abs, 'utf-8');
        await auditLog('READ', p.rel);
        return ok(content);
      } catch (e: unknown) {
        return err(`Cannot read file: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  // ── TOOL 2: list_directory ─────────────────────────────────────────────
  server.tool(
    'list_directory',
    'List files in a directory. Allowed dirs: context-core, lib, app, components, docs.',
    {
      path: z.string().describe('Relative path. Use "context-core" to list docs.'),
      depth: z.number().optional().describe('Max depth (default 2)'),
    },
    async ({ path: inputPath, depth = 2 }) => {
      const p = safePath(inputPath || '.');
      if (!p) return err('Path blocked.');
      if (!isReadAllowed(p.rel)) return err(`Directory not in read whitelist.`);

      async function listDir(dir: string, maxDepth: number, currentDepth = 0): Promise<string[]> {
        if (currentDepth >= maxDepth) return [];
        const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
        const lines: string[] = [];
        for (const entry of entries) {
          if (['node_modules', '.next', '.git', '.idea'].includes(entry.name)) continue;
          const indent = '  '.repeat(currentDepth);
          const rel2 = relative(PROJECT_ROOT, join(dir, entry.name));
          lines.push(`${indent}${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`);
          if (entry.isDirectory()) {
            const sub = await listDir(join(dir, entry.name), maxDepth, currentDepth + 1);
            lines.push(...sub);
          }
        }
        return lines;
      }

      try {
        const lines = await listDir(p.abs, depth);
        await auditLog('LIST', p.rel);
        return ok(lines.join('\n') || '(empty)');
      } catch (e: unknown) {
        return err(String(e));
      }
    }
  );

  // ── TOOL 3: search_files ───────────────────────────────────────────────
  server.tool(
    'search_files',
    'Search text across project files using grep. Searches only .md, .ts, .tsx, .json files.',
    {
      query: z.string().describe('Text or regex to search for'),
      scope: z.string().optional().describe('Limit search to this directory, e.g. "context-core"'),
    },
    async ({ query, scope }) => {
      // Validate scope
      const searchDir = scope ? scope.replace(/^\/+/, '').replace(/\.\./g, '') : '.';
      const absDir = resolve(PROJECT_ROOT, searchDir);
      if (!absDir.startsWith(PROJECT_ROOT)) return err('Scope path blocked.');

      try {
        const safeQuery = query.replace(/'/g, "'\\''");
        const cmd = `grep -rn --include="*.md" --include="*.ts" --include="*.tsx" --include="*.json" -m 50 '${safeQuery}' '${absDir}' 2>/dev/null | head -60`;
        const result = execSync(cmd, { encoding: 'utf-8', timeout: 10000, cwd: PROJECT_ROOT });
        // Strip absolute paths to relative
        const cleaned = result.split('\n').map(line =>
          line.replace(PROJECT_ROOT + '/', '')
        ).join('\n');
        await auditLog('SEARCH', searchDir, `query="${query}"`);
        return ok(cleaned || 'No matches found.');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('exit code 1')) return ok('No matches found.');
        return err(msg);
      }
    }
  );

  // ── TOOL 4: write_file (context-core ONLY) ─────────────────────────────
  server.tool(
    'write_file',
    'Write or update a file. RESTRICTED: only context-core/** is writable. Only .md files allowed. Use for updating architecture docs.',
    {
      path: z.string().describe('Relative path — MUST start with context-core/'),
      content: z.string().describe('Full file content to write'),
    },
    async ({ path: inputPath, content }) => {
      const p = safePath(inputPath);
      if (!p) return err('Path blocked: traversal or sensitive pattern.');
      if (!isWriteAllowed(p.rel)) return err(`Write blocked. Only context-core/** is writable. Got: "${p.rel}"`);
      if (extname(p.rel).toLowerCase() !== '.md') return err('Write only allowed for .md files in context-core/');
      if (content.length > MAX_FILE_SIZE) return err(`Content too large (${content.length} bytes). Max: ${MAX_FILE_SIZE}`);

      // Extra safety: block any content that looks like it contains secrets
      const secretPatterns = [/process\.env/i, /Bearer\s+\w{20,}/i, /sk-[a-zA-Z0-9]{20,}/];
      for (const sp of secretPatterns) {
        if (sp.test(content)) return err('Content blocked: appears to contain sensitive data.');
      }

      try {
        await writeFile(p.abs, content, 'utf-8');
        await auditLog('WRITE', p.rel, `size=${content.length}`);
        return ok(`Written: ${p.rel} (${content.length} bytes)`);
      } catch (e: unknown) {
        return err(`Write failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  return server;
}
