import { NextRequest } from 'next/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { resolve, join, dirname } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const CONTEXT_CORE_DIR = process.env.CONTEXT_CORE_DIR || join(PROJECT_ROOT, 'context-core');
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

function safePath(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  const absolute = resolve(PROJECT_ROOT, clean);
  if (!absolute.startsWith(PROJECT_ROOT)) {
    throw new Error('Path traversal blocked');
  }
  return absolute;
}

// ── MCP Server ────────────────────────────────────────────────
function createServer(): McpServer {
  const server = new McpServer({
    name: 'iam-client-os',
    version: '1.0.0',
  });

  // read_file
  server.tool(
    'read_file',
    'Read a file from the project. Use for context-core docs.',
    { path: z.string().describe('Relative path, e.g. "context-core/SYSTEM_IDENTITY.md"') },
    async ({ path }) => {
      try {
        const absolute = safePath(path);
        const content = await readFile(absolute, 'utf-8');
        return ok(content);
      } catch (e) {
        return err(`Cannot read ${path}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  // write_file — works on VPS, read-only on Vercel (but won't crash)
  server.tool(
    'write_file',
    'Write content to a file. Works on VPS. Read-only on Vercel.',
    {
      path: z.string(),
      content: z.string(),
    },
    async ({ path, content }) => {
      try {
        const absolute = safePath(path);
        await mkdir(dirname(absolute), { recursive: true });
        await writeFile(absolute, content, 'utf-8');
        return ok(`Written: ${path}`);
      } catch (e) {
        return err(`Cannot write ${path}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  // patch_file
  server.tool(
    'patch_file',
    'Replace a unique text fragment in a file.',
    {
      path: z.string(),
      old_text: z.string(),
      new_text: z.string(),
    },
    async ({ path, old_text, new_text }) => {
      try {
        const absolute = safePath(path);
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

  // list_directory
  server.tool(
    'list_directory',
    'List files in a directory.',
    { path: z.string().default('context-core').describe('Relative path') },
    async ({ path }) => {
      try {
        const absolute = safePath(path);
        const entries = await readdir(absolute, { withFileTypes: true });
        const lines = entries.map(e => `${e.isDirectory() ? '[dir]' : '[file]'} ${e.name}`);
        return ok(lines.join('\n') || '(empty)');
      } catch (e) {
        return err(`Cannot list ${path}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  );

  // read_context_core — convenience: read all context-core docs at once
  server.tool(
    'read_context_core',
    'Read ALL context-core documents at once. Use this at the start of every session.',
    {},
    async () => {
      try {
        const files = (await readdir(CONTEXT_CORE_DIR)).filter(f => f.endsWith('.md')).sort();
        if (files.length === 0) return ok('No context-core files found.');
        const parts: string[] = [];
        for (const file of files) {
          const content = await readFile(join(CONTEXT_CORE_DIR, file), 'utf-8');
          parts.push(`# --- ${file} ---\n${content}`);
        }
        return ok(parts.join('\n\n'));
      } catch (e) {
        return err(`Cannot read context-core: ${e instanceof Error ? e.message : String(e)}`);
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
