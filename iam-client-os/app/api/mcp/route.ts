import { NextRequest } from 'next/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { resolve, join, dirname, basename } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const MEMORY_DIR = process.env.MEMORY_DIR || process.env.CONTEXT_CORE_DIR || join(PROJECT_ROOT, 'memory');
const MCP_TOKEN = process.env.MCP_AUTH_TOKEN || '';

// ── Auth ──────────────────────────────────────────────────────
function checkAuth(request: NextRequest): boolean {
  if (!MCP_TOKEN) return false;
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === MCP_TOKEN;
}

// ── Helpers ───────────────────────────────────────────────────
function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
function err(msg: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }], isError: true };
}

// ── Sandboxing ────────────────────────────────────────────────

// Blocked directories — never allow read or write
const BLOCKED_PATHS = [
  '/etc/',
  '/var/log/',
  '/root/',
  '/home/',
  '/proc/',
  '/sys/',
  '/dev/',
  '/tmp/',
  '/usr/',
  '/boot/',
  '/sbin/',
  '/bin/',
];

// Blocked file patterns — never allow write
const BLOCKED_WRITE_PATTERNS = [
  '.env',
  '.env.local',
  '.env.production',
  'nginx.conf',
  'pm2.config',
  '.dev-agent-config.json',
  '.ssh/',
  '.gitconfig',
  'package-lock.json',
];

/**
 * Resolve path within PROJECT_ROOT. Blocks path traversal.
 */
function safePath(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  const absolute = resolve(PROJECT_ROOT, clean);
  if (!absolute.startsWith(PROJECT_ROOT)) {
    throw new Error('Path traversal blocked');
  }
  return absolute;
}

/**
 * Validate a path for READ access.
 * Allowed: anything within PROJECT_ROOT, except blocked system dirs.
 */
function validateReadPath(relativePath: string): string {
  const absolute = safePath(relativePath);

  // Block system directories
  for (const blocked of BLOCKED_PATHS) {
    if (absolute.startsWith(blocked)) {
      throw new Error(`Access denied: ${blocked} is a protected system directory`);
    }
  }

  return absolute;
}

/**
 * Validate a path for WRITE access.
 * Allowed: memory/ and project files, except blocked patterns and RULES.md.
 */
function validateWritePath(relativePath: string, operation: string = 'write'): string {
  const absolute = validateReadPath(relativePath); // inherits read restrictions
  const fileName = basename(absolute);
  const lowerPath = relativePath.toLowerCase();

  // Block sensitive files
  for (const pattern of BLOCKED_WRITE_PATTERNS) {
    if (lowerPath.includes(pattern.toLowerCase()) || fileName.toLowerCase() === pattern.toLowerCase()) {
      throw new Error(`${operation} denied: ${fileName} is a protected file`);
    }
  }

  // Block node_modules
  if (absolute.includes('node_modules')) {
    throw new Error(`${operation} denied: cannot modify node_modules`);
  }

  // Block .next build directory
  if (absolute.includes('.next')) {
    throw new Error(`${operation} denied: cannot modify .next build directory`);
  }

  return absolute;
}

/**
 * Extra check: RULES.md is locked — never allow modification.
 */
function assertNotRulesFile(relativePath: string, operation: string): void {
  const fileName = basename(relativePath).toUpperCase();
  if (fileName === 'RULES.MD') {
    throw new Error(`${operation} denied: memory/RULES.md is locked by the system and cannot be modified`);
  }
}

// ── MCP Server ────────────────────────────────────────────────
function createServer(): McpServer {
  const server = new McpServer({
    name: 'iam-client-os',
    version: '1.2.0',
  });

  // read_file — sandboxed read
  server.tool(
    'read_file',
    'Read a file from the project. Use for memory/ docs.',
    { path: z.string().describe('Relative path, e.g. "memory/SYSTEM_IDENTITY.md"') },
    async ({ path }) => {
      try {
        const absolute = validateReadPath(path);
        const content = await readFile(absolute, 'utf-8');
        return ok(content);
      } catch (e) {
        return err(`Cannot read ${path}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  // write_file — sandboxed write, blocks RULES.md
  server.tool(
    'write_file',
    'Write content to a file. Blocked for: .env, RULES.md, node_modules, .next, system configs.',
    {
      path: z.string(),
      content: z.string(),
    },
    async ({ path, content }) => {
      try {
        assertNotRulesFile(path, 'Write');
        const absolute = validateWritePath(path, 'Write');
        await mkdir(dirname(absolute), { recursive: true });
        await writeFile(absolute, content, 'utf-8');
        return ok(`Written: ${path}`);
      } catch (e) {
        return err(`Cannot write ${path}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  // patch_file — sandboxed patch, blocks RULES.md
  server.tool(
    'patch_file',
    'Replace a unique text fragment in a file. Blocked for: .env, RULES.md, node_modules, .next.',
    {
      path: z.string(),
      old_text: z.string(),
      new_text: z.string(),
    },
    async ({ path, old_text, new_text }) => {
      try {
        assertNotRulesFile(path, 'Patch');
        const absolute = validateWritePath(path, 'Patch');
        const content = await readFile(absolute, 'utf-8');
        const count = content.split(old_text).length - 1;
        if (count === 0) return err(`old_text not found in ${path}`);
        if (count > 1) return err(`old_text found ${count} times — must be unique`);
        await writeFile(absolute, content.replace(old_text, new_text), 'utf-8');
        return ok(`Patched: ${path}`);
      } catch (e) {
        return err(`Cannot patch ${path}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  // list_directory — sandboxed read
  server.tool(
    'list_directory',
    'List files in a directory.',
    { path: z.string().default('memory').describe('Relative path') },
    async ({ path }) => {
      try {
        const absolute = validateReadPath(path);
        const entries = await readdir(absolute, { withFileTypes: true });
        const lines = entries.map(e => `${e.isDirectory() ? '[dir]' : '[file]'} ${e.name}`);
        return ok(lines.join('\n') || '(empty)');
      } catch (e) {
        return err(`Cannot list ${path}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  // read_memory — convenience: read all memory/ docs at once
  server.tool(
    'read_memory',
    'Read ALL memory/ documents at once. Use this at the start of every session.',
    {},
    async () => {
      try {
        const files = (await readdir(MEMORY_DIR)).filter(f => f.endsWith('.md')).sort();
        if (files.length === 0) return ok('No memory files found.');
        const parts: string[] = [];
        for (const file of files) {
          const content = await readFile(join(MEMORY_DIR, file), 'utf-8');
          parts.push(`# --- ${file} ---\n${content}`);
        }
        return ok(parts.join('\n\n'));
      } catch (e) {
        return err(`Cannot read memory: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  return server;
}

// ── Handler ───────────────────────────────────────────────────
async function handle(request: NextRequest): Promise<Response> {
  if (!checkAuth(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Set Authorization: Bearer <token>' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createServer();
  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close().catch(() => {});
  }
}

export async function POST(request: NextRequest) { return handle(request); }
export async function GET(request: NextRequest) { return handle(request); }
export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
