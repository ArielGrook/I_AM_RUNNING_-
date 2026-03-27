import { NextRequest } from 'next/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { readFile, readdir, writeFile, mkdir, stat } from 'fs/promises';
import { resolve, join, dirname, basename } from 'path';
import { createHash } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const MEMORY_DIR = process.env.MEMORY_DIR || process.env.CONTEXT_CORE_DIR || join(PROJECT_ROOT, 'memory');
const MCP_TOKEN = process.env.MCP_AUTH_TOKEN || '';
const TASKS_DIR = join(PROJECT_ROOT, 'tasks');
const MESSAGES_DIR = join(PROJECT_ROOT, 'messages');
const PULL_POOL_DIR = join(PROJECT_ROOT, 'pull-pool');

// ── Types ─────────────────────────────────────────────────────
interface RoleDef {
  token_hash: string;
  name: string;
  role: string;
  tools: string[];
  read_paths: string[];
  write_paths: string[];
}

interface TeamConfig {
  mode: 'solo' | 'team';
  roles: RoleDef[];
}

interface ResolvedRole {
  name: string;
  role: string;
  tools: string[];
  read_paths: string[];
  write_paths: string[];
  isAdmin: boolean;
}

// ── YAML Frontmatter Parser (minimal, no dependencies) ───────
function parseFrontmatter(content: string): { data: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const yamlStr = match[1];
  const body = match[2];
  const data: Record<string, unknown> = {};

  // Parse simple YAML (key: value, arrays with - items)
  let currentKey = '';
  let currentArray: unknown[] | null = null;
  let currentArrayItem: Record<string, unknown> | null = null;

  for (const line of yamlStr.split('\n')) {
    const trimmed = line.trimEnd();

    // Array item start: "  - key: value"
    if (/^\s{2}- \w/.test(line) && currentKey) {
      if (currentArrayItem && currentArray) {
        currentArray.push(currentArrayItem);
      }
      currentArrayItem = {};
      const itemContent = trimmed.replace(/^\s*-\s*/, '');
      const [k, ...v] = itemContent.split(':');
      if (k && v.length > 0) {
        currentArrayItem[k.trim()] = parseYamlValue(v.join(':').trim());
      }
      continue;
    }

    // Continuation of array item: "    key: value"
    if (/^\s{4}\w/.test(line) && currentArrayItem) {
      const [k, ...v] = trimmed.trim().split(':');
      if (k && v.length > 0) {
        currentArrayItem[k.trim()] = parseYamlValue(v.join(':').trim());
      }
      continue;
    }

    // Top-level key: value
    if (/^\w/.test(line) && line.includes(':')) {
      // Flush previous array
      if (currentArray) {
        if (currentArrayItem) currentArray.push(currentArrayItem);
        data[currentKey] = currentArray;
        currentArray = null;
        currentArrayItem = null;
      }

      const colonIdx = line.indexOf(':');
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();

      if (val === '' || val === '[]') {
        // Could be start of array
        currentKey = key;
        currentArray = val === '[]' ? [] : null;
        if (val === '[]') {
          data[key] = [];
          currentArray = null;
        }
      } else {
        currentKey = key;
        data[key] = parseYamlValue(val);
      }
      continue;
    }

    // Inline array continuation "  - value"
    if (/^\s{2}- /.test(line) && !currentArrayItem && currentKey) {
      if (!currentArray) currentArray = [];
      currentArray.push(parseYamlValue(trimmed.replace(/^\s*-\s*/, '')));
      continue;
    }
  }

  // Flush last array
  if (currentArray) {
    if (currentArrayItem) currentArray.push(currentArrayItem);
    data[currentKey] = currentArray;
  }

  return { data, body };
}

function parseYamlValue(val: string): unknown {
  // Remove quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  // Boolean
  if (val === 'true') return true;
  if (val === 'false') return false;
  // Number
  if (/^\d+$/.test(val)) return parseInt(val, 10);
  if (/^\d+\.\d+$/.test(val)) return parseFloat(val);
  // Inline array: ["a","b","c"]
  if (val.startsWith('[') && val.endsWith(']')) {
    const inner = val.slice(1, -1);
    if (inner === '') return [];
    return inner.split(',').map(s => parseYamlValue(s.trim()));
  }
  return val;
}

// ── Token Hashing ─────────────────────────────────────────────
function hashToken(token: string): string {
  return 'sha256:' + createHash('sha256').update(token).digest('hex');
}

// ── Role Resolution ───────────────────────────────────────────
async function loadTeamConfig(): Promise<TeamConfig | null> {
  try {
    const teamRolesPath = join(MEMORY_DIR, 'TEAM_ROLES.md');
    const content = await readFile(teamRolesPath, 'utf-8');
    const { data } = parseFrontmatter(content);

    const mode = (data.mode as string) || 'solo';
    const roles = (data.roles as RoleDef[]) || [];

    return { mode: mode as 'solo' | 'team', roles };
  } catch {
    // TEAM_ROLES.md doesn't exist → solo mode
    return null;
  }
}

async function resolveRole(request: NextRequest): Promise<ResolvedRole | null> {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

  if (!token) return null;

  // Try loading team config
  const config = await loadTeamConfig();

  // No TEAM_ROLES.md or solo mode → fallback to MCP_AUTH_TOKEN
  if (!config || config.mode === 'solo') {
    if (!MCP_TOKEN || token !== MCP_TOKEN) return null;
    return {
      name: 'Admin',
      role: 'admin',
      tools: ['read_file', 'write_file', 'patch_file', 'list_directory', 'read_memory'],
      read_paths: ['*'],
      write_paths: ['*'],
      isAdmin: true,
    };
  }

  // Team mode: also check MCP_AUTH_TOKEN as admin fallback
  if (MCP_TOKEN && token === MCP_TOKEN) {
    return {
      name: 'Admin (env)',
      role: 'admin',
      tools: ['read_file', 'write_file', 'patch_file', 'list_directory', 'read_memory'],
      read_paths: ['*'],
      write_paths: ['*'],
      isAdmin: true,
    };
  }

  // Team mode: hash token and look up in roles
  const tokenHash = hashToken(token);

  for (const roleDef of config.roles) {
    if (roleDef.token_hash === tokenHash) {
      return {
        name: roleDef.name,
        role: roleDef.role,
        tools: roleDef.tools || [],
        read_paths: roleDef.read_paths || ['*'],
        write_paths: roleDef.write_paths || [],
        isAdmin: roleDef.role === 'admin',
      };
    }
  }

  return null; // Token not found
}

// ── Path Matching ─────────────────────────────────────────────
function matchesGlob(path: string, patterns: string[]): boolean {
  const clean = path.replace(/^\/+/, '');
  for (const pattern of patterns) {
    if (pattern === '*') return true;
    // Simple glob: "memory/*" matches "memory/RULES.md" and "memory/sub/file.md"
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      if (clean.startsWith(prefix + '/') || clean === prefix) return true;
    }
    // Exact match
    if (clean === pattern) return true;
  }
  return false;
}

// ── Helpers ───────────────────────────────────────────────────
function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
function err(msg: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }], isError: true };
}

// ── Sandboxing ────────────────────────────────────────────────
const BLOCKED_PATHS = [
  '/etc/', '/var/log/', '/root/', '/home/', '/proc/',
  '/sys/', '/dev/', '/tmp/', '/usr/', '/boot/', '/sbin/', '/bin/',
];

const BLOCKED_WRITE_PATTERNS = [
  '.env', '.env.local', '.env.production',
  'nginx.conf', 'pm2.config', '.dev-agent-config.json',
  '.ssh/', '.gitconfig', 'package-lock.json',
];

function safePath(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  const absolute = resolve(PROJECT_ROOT, clean);
  if (!absolute.startsWith(PROJECT_ROOT)) {
    throw new Error('Path traversal blocked');
  }
  return absolute;
}

function validateReadPath(relativePath: string): string {
  const absolute = safePath(relativePath);
  for (const blocked of BLOCKED_PATHS) {
    if (absolute.startsWith(blocked)) {
      throw new Error(`Access denied: ${blocked} is a protected system directory`);
    }
  }
  return absolute;
}

function validateWritePath(relativePath: string, operation: string = 'write'): string {
  const absolute = validateReadPath(relativePath);
  const fileName = basename(absolute);
  const lowerPath = relativePath.toLowerCase();

  for (const pattern of BLOCKED_WRITE_PATTERNS) {
    if (lowerPath.includes(pattern.toLowerCase()) || fileName.toLowerCase() === pattern.toLowerCase()) {
      throw new Error(`${operation} denied: ${fileName} is a protected file`);
    }
  }
  if (absolute.includes('node_modules')) {
    throw new Error(`${operation} denied: cannot modify node_modules`);
  }
  if (absolute.includes('.next')) {
    throw new Error(`${operation} denied: cannot modify .next build directory`);
  }
  return absolute;
}

function assertNotRulesFile(relativePath: string, operation: string): void {
  const fileName = basename(relativePath).toUpperCase();
  if (fileName === 'RULES.MD') {
    throw new Error(`${operation} denied: memory/RULES.md is locked by the system and cannot be modified`);
  }
}

// ── Pull Pool Helper ──────────────────────────────────────────
async function createPullPoolEntry(
  role: ResolvedRole,
  targetPath: string,
  content: string,
  operation: 'write' | 'patch',
  patchMeta?: { old_text: string; new_text: string }
): Promise<string> {
  const prId = `pr-${Date.now()}`;
  const prDir = join(PULL_POOL_DIR, prId);
  await mkdir(prDir, { recursive: true });

  // Write meta.md
  const meta = `---
id: "${prId}"
author: "${role.name}"
role: "${role.role}"
created: "${new Date().toISOString()}"
target_file: "${targetPath}"
operation: "${operation}"
status: "pending"
---

# Pull Request: ${prId}

**Author:** ${role.name} (${role.role})
**Target:** ${targetPath}
**Operation:** ${operation}
**Status:** Pending review

${operation === 'patch' && patchMeta ? `## Patch Details\n\n**Find:**\n\`\`\`\n${patchMeta.old_text}\n\`\`\`\n\n**Replace with:**\n\`\`\`\n${patchMeta.new_text}\n\`\`\`\n` : ''}
`;
  await writeFile(join(prDir, 'meta.md'), meta, 'utf-8');

  // Write the actual file content
  const fileName = basename(targetPath);
  await writeFile(join(prDir, fileName), content, 'utf-8');

  return prId;
}

// ── Read Role-Scoped Content ──────────────────────────────────
async function readRoleScopedMemory(role: ResolvedRole): Promise<string> {
  const parts: string[] = [];

  // Role header
  parts.push(`# Your Role: ${role.role}\n**Name:** ${role.name}\n**Access:** ${role.isAdmin ? 'Full admin access' : 'Scoped access — writes go to pull-pool/'}\n`);

  // Memory files (filtered by read_paths)
  try {
    const files = (await readdir(MEMORY_DIR)).filter(f => f.endsWith('.md')).sort();
    for (const file of files) {
      const memPath = `memory/${file}`;
      if (matchesGlob(memPath, role.read_paths)) {
        const content = await readFile(join(MEMORY_DIR, file), 'utf-8');
        parts.push(`# --- ${file} ---\n${content}`);
      }
    }
  } catch { /* memory dir might not exist */ }

  // Tasks for this role
  try {
    const taskFiles = await readdir(TASKS_DIR);
    for (const file of taskFiles) {
      if (!file.endsWith('.md') || file.startsWith('.')) continue;
      // Match by role name: "developer-frontend.md" matches role "developer" or exact slug
      const taskRole = file.replace('.md', '').toLowerCase();
      const userRole = role.role.toLowerCase();
      const userName = role.name.toLowerCase().replace(/\s+/g, '-');
      if (taskRole === userRole || taskRole === userName || taskRole.startsWith(userRole + '-')) {
        const content = await readFile(join(TASKS_DIR, file), 'utf-8');
        parts.push(`# --- YOUR TASKS (${file}) ---\n${content}`);
      }
    }
  } catch { /* tasks dir might not exist */ }

  // Messages for this role
  try {
    const roleSlug = role.role.toLowerCase() + (role.name ? '-' + role.name.toLowerCase().replace(/\s+/g, '-') : '');
    // Check multiple possible dir names
    const possibleDirs = [
      join(MESSAGES_DIR, `to-${role.role}`),
      join(MESSAGES_DIR, `to-${roleSlug}`),
      join(MESSAGES_DIR, `to-${role.name.toLowerCase().replace(/\s+/g, '-')}`),
    ];

    for (const msgDir of possibleDirs) {
      try {
        const files = (await readdir(msgDir)).filter(f => f.endsWith('.md')).sort().reverse();
        if (files.length > 0) {
          parts.push(`\n# --- MESSAGES FROM ADMIN ---`);
          // Show last 5 messages
          for (const file of files.slice(0, 5)) {
            const content = await readFile(join(msgDir, file), 'utf-8');
            parts.push(`\n## ${file.replace('.md', '')}\n${content}`);
          }
        }
      } catch { /* specific message dir might not exist */ }
    }
  } catch { /* messages dir might not exist */ }

  return parts.join('\n\n');
}

// ── MCP Server ────────────────────────────────────────────────
function createServer(role: ResolvedRole): McpServer {
  const server = new McpServer({
    name: 'iam-client-os',
    version: '2.0.0',
  });

  // ── read_file ──
  if (role.tools.includes('read_file')) {
    server.tool(
      'read_file',
      'Read a file from the project.',
      { path: z.string().describe('Relative path, e.g. "memory/SYSTEM_IDENTITY.md"') },
      async ({ path }) => {
        try {
          if (!matchesGlob(path, role.read_paths)) {
            return err(`Read denied: ${path} is outside your read scope (role: ${role.role})`);
          }
          const absolute = validateReadPath(path);
          const content = await readFile(absolute, 'utf-8');
          return ok(content);
        } catch (e) {
          return err(`Cannot read ${path}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    );
  }

  // ── write_file ──
  if (role.tools.includes('write_file')) {
    server.tool(
      'write_file',
      role.isAdmin
        ? 'Write content to a file. Blocked for: .env, RULES.md, node_modules, .next.'
        : 'Propose a file change. Your write will go to pull-pool/ for admin review.',
      { path: z.string(), content: z.string() },
      async ({ path, content }) => {
        try {
          assertNotRulesFile(path, 'Write');

          // Admin: direct write
          if (role.isAdmin) {
            const absolute = validateWritePath(path, 'Write');
            await mkdir(dirname(absolute), { recursive: true });
            await writeFile(absolute, content, 'utf-8');
            return ok(`Written: ${path}`);
          }

          // Non-admin: redirect to pull-pool
          if (!matchesGlob(path, role.write_paths) && !matchesGlob('pull-pool/*', role.write_paths)) {
            return err(`Write denied: ${path} is outside your write scope (role: ${role.role})`);
          }

          const prId = await createPullPoolEntry(role, path, content, 'write');
          return ok(`Saved to pull-pool/${prId}/. Admin will review your proposed change to ${path}.`);
        } catch (e) {
          return err(`Cannot write ${path}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    );
  }

  // ── patch_file ──
  if (role.tools.includes('patch_file')) {
    server.tool(
      'patch_file',
      role.isAdmin
        ? 'Replace a unique text fragment in a file. Blocked for: .env, RULES.md, node_modules, .next.'
        : 'Propose a patch to a file. Your change will go to pull-pool/ for admin review.',
      { path: z.string(), old_text: z.string(), new_text: z.string() },
      async ({ path, old_text, new_text }) => {
        try {
          assertNotRulesFile(path, 'Patch');

          // Admin: direct patch
          if (role.isAdmin) {
            const absolute = validateWritePath(path, 'Patch');
            const fileContent = await readFile(absolute, 'utf-8');
            const count = fileContent.split(old_text).length - 1;
            if (count === 0) return err(`old_text not found in ${path}`);
            if (count > 1) return err(`old_text found ${count} times — must be unique`);
            await writeFile(absolute, fileContent.replace(old_text, new_text), 'utf-8');
            return ok(`Patched: ${path}`);
          }

          // Non-admin: redirect to pull-pool
          // First read the file to create the full proposed version
          const absolute = validateReadPath(path);
          const fileContent = await readFile(absolute, 'utf-8');
          const count = fileContent.split(old_text).length - 1;
          if (count === 0) return err(`old_text not found in ${path}`);
          if (count > 1) return err(`old_text found ${count} times — must be unique`);
          const proposedContent = fileContent.replace(old_text, new_text);

          const prId = await createPullPoolEntry(role, path, proposedContent, 'patch', { old_text, new_text });
          return ok(`Saved to pull-pool/${prId}/. Admin will review your proposed patch to ${path}.`);
        } catch (e) {
          return err(`Cannot patch ${path}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    );
  }

  // ── list_directory ──
  if (role.tools.includes('list_directory')) {
    server.tool(
      'list_directory',
      'List files in a directory.',
      { path: z.string().default('memory').describe('Relative path') },
      async ({ path }) => {
        try {
          if (!matchesGlob(path, role.read_paths) && !matchesGlob(path + '/*', role.read_paths)) {
            return err(`List denied: ${path} is outside your read scope (role: ${role.role})`);
          }
          const absolute = validateReadPath(path);
          const entries = await readdir(absolute, { withFileTypes: true });
          const lines = entries.map(e => `${e.isDirectory() ? '[dir]' : '[file]'} ${e.name}`);
          return ok(lines.join('\n') || '(empty)');
        } catch (e) {
          return err(`Cannot list ${path}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    );
  }

  // ── read_memory ──
  if (role.tools.includes('read_memory')) {
    server.tool(
      'read_memory',
      'Read your role context, memory files, tasks, and messages. Use at the start of every session.',
      {},
      async () => {
        try {
          const content = await readRoleScopedMemory(role);
          return ok(content);
        } catch (e) {
          return err(`Cannot read memory: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    );
  }

  return server;
}

// ── Handler ───────────────────────────────────────────────────
async function handle(request: NextRequest): Promise<Response> {
  const role = await resolveRole(request);

  if (!role) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Invalid or missing Bearer token.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createServer(role);
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
  const role = await resolveRole(request);
  if (!role) return new Response('Unauthorized', { status: 401 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
