/**
 * ChatGPT Safe Audit MCP Server
 * Mode: Safe Audit — full read of code/docs/config + write only to context-core/**
 * NO deploy, NO git, NO shell, NO patch outside docs zone.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readFile, writeFile, readdir, stat, appendFile } from 'fs/promises';
import { resolve, relative, extname, join, dirname } from 'path';
import { execSync } from 'child_process';
import { mkdir } from 'fs/promises';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';

// ── Read whitelist ────────────────────────────────────────────────────────
const READ_ALLOWED_DIRS = [
  'app', 'lib', 'components', 'context-core', 'docs',
  'scripts', 'public', 'types', 'hooks', 'utils', 'styles',
];
const READ_ALLOWED_ROOT_FILES = [
  'package.json', 'package-lock.json', 'next.config.js', 'next.config.ts',
  'tailwind.config.js', 'tailwind.config.ts', 'tsconfig.json',
  'middleware.ts', 'middleware.js', 'i18n.ts', 'i18n.js',
  'ecosystem.config.js', 'postcss.config.js', 'jest.config.ts',
  'README.md', '.eslintrc.json', '.eslintrc.js',
];
const READ_ALLOWED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.md',
  '.yml', '.yaml', '.css', '.html', '.txt', '.env.example',
];

// ── Write whitelist ───────────────────────────────────────────────────────
const WRITE_ALLOWED_DIRS = ['context-core', 'docs'];
const WRITE_ALLOWED_EXTENSIONS = ['.md'];

// ── Hard block patterns ───────────────────────────────────────────────────
const HARD_BLOCKED = [
  /\.env($|\.|\/)/,
  /node_modules/,
  /\.next/,
  /\.git($|\/)/,
  /secrets?\//i,
  /private\//i,
  /\.dev-agent-config/,
  /\.gpt-mcp-audit/,
];

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const AUDIT_LOG = join(PROJECT_ROOT, '.gpt-mcp-audit.log');

// ── Audit log ─────────────────────────────────────────────────────────────
async function audit(action: string, path: string, extra = '') {
  const line = `[${new Date().toISOString()}] ${action} | "${path}"${extra ? ' | ' + extra : ''}\n`;
  await appendFile(AUDIT_LOG, line).catch(() => {});
}

// ── Path helpers ──────────────────────────────────────────────────────────
function normalizePath(input: string): { abs: string; rel: string } | null {
  // Strip leading slashes, collapse ..
  const rel = input.replace(/^\/+/, '').split('/').reduce((acc: string[], seg) => {
    if (seg === '..' || seg === '.') return acc;
    acc.push(seg);
    return acc;
  }, []).join('/');

  const abs = resolve(PROJECT_ROOT, rel);

  // Path traversal guard
  if (!abs.startsWith(PROJECT_ROOT + '/') && abs !== PROJECT_ROOT) return null;

  // Hard block
  for (const p of HARD_BLOCKED) {
    if (p.test(rel)) return null;
  }

  return { abs, rel };
}

function canRead(rel: string): boolean {
  // Root-level whitelisted files
  if (!rel.includes('/')) return READ_ALLOWED_ROOT_FILES.includes(rel);
  const topDir = rel.split('/')[0];
  if (!READ_ALLOWED_DIRS.includes(topDir)) return false;
  const ext = extname(rel).toLowerCase();
  return READ_ALLOWED_EXTENSIONS.includes(ext) || ext === '';
}

function canWrite(rel: string): boolean {
  const topDir = rel.split('/')[0];
  if (!WRITE_ALLOWED_DIRS.includes(topDir)) return false;
  const ext = extname(rel).toLowerCase();
  return WRITE_ALLOWED_EXTENSIONS.includes(ext);
}

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
function err(msg: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }], isError: true };
}

// ── Server ────────────────────────────────────────────────────────────────
export function createGptSafeMcpServer(): McpServer {
  const server = new McpServer({ name: 'iam-running-audit', version: '2.0.0' });

  // ── 1. read_file ────────────────────────────────────────────────────────
  server.tool(
    'read_file',
    'Read any source/config/doc file. Supports .ts .tsx .js .jsx .json .md .yml .css etc. Allowed dirs: app, lib, components, context-core, docs, scripts + root config files.',
    {
      path: z.string().describe('Relative path, e.g. "lib/craft/components/HeroTron.tsx"'),
      offset: z.number().optional().describe('Start from this line number (1-based). For large files.'),
      limit: z.number().optional().describe('Read at most this many lines. Default: all.'),
    },
    async ({ path: input, offset, limit }) => {
      const p = normalizePath(input);
      if (!p) return err('Path blocked by security policy.');
      if (!canRead(p.rel)) return err(`Not in read whitelist. Allowed dirs: ${READ_ALLOWED_DIRS.join(', ')} + root config files.`);

      try {
        const s = await stat(p.abs);
        if (s.size > MAX_FILE_SIZE) return err(`File too large (${s.size} bytes). Use offset/limit params.`);

        const raw = await readFile(p.abs, 'utf-8');
        await audit('READ', p.rel);

        if (!offset && !limit) return ok(raw);

        const lines = raw.split('\n');
        const from = Math.max(0, (offset ?? 1) - 1);
        const to = limit ? from + limit : lines.length;
        const slice = lines.slice(from, to);
        const header = `// Lines ${from + 1}–${Math.min(to, lines.length)} of ${lines.length} | ${p.rel}\n`;
        return ok(header + slice.join('\n'));
      } catch (e: unknown) {
        return err(e instanceof Error ? e.message : String(e));
      }
    }
  );

  // ── 2. read_range ───────────────────────────────────────────────────────
  server.tool(
    'read_range',
    'Read specific line range from a file. Ideal for large files (editor/page.tsx etc). More efficient than read_file for targeted inspection.',
    {
      path: z.string().describe('Relative path'),
      start_line: z.number().describe('First line to read (1-based)'),
      end_line: z.number().describe('Last line to read (inclusive)'),
    },
    async ({ path: input, start_line, end_line }) => {
      const p = normalizePath(input);
      if (!p) return err('Path blocked.');
      if (!canRead(p.rel)) return err('Not in read whitelist.');

      try {
        const raw = await readFile(p.abs, 'utf-8');
        const lines = raw.split('\n');
        const total = lines.length;
        const from = Math.max(0, start_line - 1);
        const to = Math.min(end_line, total);
        const slice = lines.slice(from, to);
        const numbered = slice.map((l, i) => `${from + i + 1}\t${l}`).join('\n');
        await audit('READ_RANGE', p.rel, `lines ${start_line}-${end_line}`);
        return ok(`// ${p.rel} | lines ${start_line}–${to} of ${total}\n${numbered}`);
      } catch (e: unknown) {
        return err(e instanceof Error ? e.message : String(e));
      }
    }
  );

  // ── 3. file_stat ────────────────────────────────────────────────────────
  server.tool(
    'file_stat',
    'Get file metadata: size, line count, last modified. Use before read_file to decide if offset/limit needed.',
    { path: z.string().describe('Relative path') },
    async ({ path: input }) => {
      const p = normalizePath(input);
      if (!p) return err('Path blocked.');
      if (!canRead(p.rel)) return err('Not in read whitelist.');

      try {
        const s = await stat(p.abs);
        const raw = await readFile(p.abs, 'utf-8');
        const lines = raw.split('\n').length;
        await audit('STAT', p.rel);
        return ok(JSON.stringify({
          path: p.rel,
          size_bytes: s.size,
          size_kb: Math.round(s.size / 1024 * 10) / 10,
          lines,
          modified: s.mtime.toISOString(),
        }, null, 2));
      } catch (e: unknown) {
        return err(e instanceof Error ? e.message : String(e));
      }
    }
  );

  // ── 4. list_directory ───────────────────────────────────────────────────
  server.tool(
    'list_directory',
    'List files/folders in a directory. Excludes node_modules, .next, .git.',
    {
      path: z.string().describe('Relative path, e.g. "lib/craft/components"'),
      depth: z.number().optional().describe('Max depth (default 3, max 6)'),
    },
    async ({ path: input, depth = 3 }) => {
      const p = normalizePath(input || '.');
      if (!p) return err('Path blocked.');

      const maxDepth = Math.min(depth, 6);
      const SKIP = new Set(['node_modules', '.next', '.git', '.idea', 'dist', '.turbo']);

      async function walk(dir: string, d: number): Promise<string[]> {
        if (d >= maxDepth) return [];
        const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
        const lines: string[] = [];
        for (const e of entries) {
          if (SKIP.has(e.name)) continue;
          const indent = '  '.repeat(d);
          const relPath = relative(PROJECT_ROOT, join(dir, e.name));
          if (e.isDirectory()) {
            lines.push(`${indent}📁 ${e.name}/`);
            lines.push(...await walk(join(dir, e.name), d + 1));
          } else {
            const ext = extname(e.name).toLowerCase();
            const readable = READ_ALLOWED_EXTENSIONS.includes(ext) || READ_ALLOWED_ROOT_FILES.includes(e.name);
            lines.push(`${indent}${readable ? '📄' : '  '} ${e.name}`);
          }
        }
        return lines;
      }

      try {
        const lines = await walk(p.abs, 0);
        await audit('LIST', p.rel);
        return ok(`// ${p.rel}\n${lines.join('\n') || '(empty)'}`);
      } catch (e: unknown) {
        return err(e instanceof Error ? e.message : String(e));
      }
    }
  );

  // ── 5. search_files ─────────────────────────────────────────────────────
  server.tool(
    'search_files',
    'Search text/regex across project. Supports TypeScript/Unicode. Returns file:line:match format.',
    {
      query: z.string().describe('Text or regex pattern'),
      scope: z.string().optional().describe('Limit to dir, e.g. "lib/craft" or "context-core"'),
      file_pattern: z.string().optional().describe('Glob, e.g. "*.tsx" or "*.md"'),
      case_insensitive: z.boolean().optional().describe('Case insensitive search (default false)'),
    },
    async ({ query, scope, file_pattern, case_insensitive }) => {
      const searchDir = scope
        ? resolve(PROJECT_ROOT, scope.replace(/^\/+/, '').replace(/\.\./g, ''))
        : PROJECT_ROOT;

      if (!searchDir.startsWith(PROJECT_ROOT)) return err('Scope blocked.');

      const safeQuery = query.replace(/'/g, "'\\''");
      const includes = file_pattern
        ? `--include="${file_pattern}"`
        : '--include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.md"';
      const flags = `-rn${case_insensitive ? 'i' : ''} --color=never -m 80`;

      try {
        const cmd = `grep ${flags} ${includes} '${safeQuery}' '${searchDir}' 2>/dev/null | head -80`;
        const raw = execSync(cmd, { encoding: 'utf-8', timeout: 15000, cwd: PROJECT_ROOT });
        const cleaned = raw.split('\n')
          .map(l => l.replace(PROJECT_ROOT + '/', ''))
          .join('\n');
        await audit('SEARCH', scope || '.', `q="${query}"`);
        return ok(cleaned || 'No matches.');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('exit code 1')) return ok('No matches.');
        return err(msg);
      }
    }
  );

  // ── 6. read_multiple_files ───────────────────────────────────────────────
  server.tool(
    'read_multiple_files',
    'Read up to 8 files at once. Efficient for audit sessions.',
    { paths: z.array(z.string()).max(8).describe('Array of relative paths') },
    async ({ paths }) => {
      const results = await Promise.all(paths.map(async (input) => {
        const p = normalizePath(input);
        if (!p) return { path: input, error: 'Path blocked.' };
        if (!canRead(p.rel)) return { path: input, error: 'Not in read whitelist.' };
        try {
          const s = await stat(p.abs);
          if (s.size > MAX_FILE_SIZE) return { path: input, error: `Too large (${s.size} bytes)` };
          const content = await readFile(p.abs, 'utf-8');
          await audit('READ_MULTI', p.rel);
          return { path: p.rel, content };
        } catch (e: unknown) {
          return { path: input, error: e instanceof Error ? e.message : String(e) };
        }
      }));
      return ok(JSON.stringify(results, null, 2));
    }
  );

  // ── 7. write_file (context-core + docs ONLY) ────────────────────────────
  server.tool(
    'write_file',
    'Write/update a .md file. RESTRICTED to context-core/** and docs/** only. Use for architecture docs, PROGRESS, ENGINEERING_MEMORY etc.',
    {
      path: z.string().describe('Must start with context-core/ or docs/'),
      content: z.string().describe('Full markdown content'),
    },
    async ({ path: input, content }) => {
      const p = normalizePath(input);
      if (!p) return err('Path blocked.');
      if (!canWrite(p.rel)) return err(`Write blocked. Only context-core/**/*.md and docs/**/*.md allowed. Got: "${p.rel}"`);
      if (content.length > MAX_FILE_SIZE) return err(`Content too large (${content.length} bytes).`);

      // Block secret patterns
      for (const pattern of [/process\.env\./i, /Bearer\s+\w{20,}/i, /sk-[a-zA-Z0-9]{20,}/, /password\s*[:=]/i]) {
        if (pattern.test(content)) return err('Content blocked: appears to contain sensitive data.');
      }

      try {
        // Auto-create dirs
        await mkdir(dirname(p.abs), { recursive: true });
        await writeFile(p.abs, content, 'utf-8');
        await audit('WRITE', p.rel, `${content.length} bytes`);
        return ok(`✓ Written: ${p.rel} (${content.length} bytes)`);
      } catch (e: unknown) {
        return err(e instanceof Error ? e.message : String(e));
      }
    }
  );

  return server;
}
