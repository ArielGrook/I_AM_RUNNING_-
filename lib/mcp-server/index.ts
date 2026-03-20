import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { executeTool } from '@/lib/dev-agent/tool-executor';
import { execSync, spawnSync, spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';

// ── Whitelist for run_command ─────────────────────────────────────────────
const ALLOWED_PREFIXES = [
  'npm install', 'npm run build', 'npm run dev', 'npm list',
  'pm2 logs', 'pm2 status', 'pm2 restart', 'pm2 list',
  'cat', 'head', 'tail', 'wc', 'grep', 'find', 'ls', 'pwd', 'du', 'df',
  'git status', 'git log', 'git diff', 'git add', 'git commit', 'git push',
  'git pull', 'git stash', 'git branch', 'git checkout', 'git reset', 'git reflog',
  'curl localhost', 'curl http://localhost',
  'nginx -t', 'systemctl status nginx',
  'node -e', 'npx',
];

// ── Helper: format tool result as MCP content ─────────────────────────────
function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(message: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
}

// ── MCP Server factory ────────────────────────────────────────────────────
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'i-am-running',
    version: '1.0.0',
  });

  // ── TOOL 1: read_file ─────────────────────────────────────────────────
  server.tool(
    'read_file',
    'Read file contents from the project. Returns the full file text. Blocked: .env* files.',
    { path: z.string().describe('Relative path from project root, e.g. "app/page.tsx"') },
    async ({ path }) => {
      const result = await executeTool({ name: 'read_file', args: { path } });
      return result.success ? ok(result.data ?? '') : err(result.error ?? 'Unknown error');
    }
  );

  // ── TOOL 2: write_file ────────────────────────────────────────────────
  server.tool(
    'write_file',
    'Create or overwrite a file with full content. Auto-creates directories. Use patch_file for targeted edits. Blocked: .env*, node_modules.',
    {
      path: z.string().describe('Relative path from project root'),
      content: z.string().describe('Full file content to write'),
    },
    async ({ path, content }) => {
      const result = await executeTool({ name: 'write_file', args: { path, content } });
      return result.success ? ok(result.data ?? 'Written') : err(result.error ?? 'Unknown error');
    }
  );

  // ── TOOL 3: patch_file ────────────────────────────────────────────────
  server.tool(
    'patch_file',
    'Replace a unique text fragment in a file. Preferred over write_file for targeted edits — saves tokens. old_text must appear exactly once in the file.',
    {
      path: z.string().describe('Relative path from project root'),
      old_text: z.string().describe('Exact text to find — must appear exactly once in file'),
      new_text: z.string().describe('Text to replace it with'),
    },
    async ({ path, old_text, new_text }) => {
      const result = await executeTool({ name: 'patch_file', args: { path, old_text, new_text } });
      return result.success ? ok(result.data ?? 'Patched') : err(result.error ?? 'Unknown error');
    }
  );

  // ── TOOL 4: delete_file ───────────────────────────────────────────────
  server.tool(
    'delete_file',
    'Delete a file or directory. Use recursive=true to delete non-empty directories. Blocked: .env*, node_modules.',
    {
      path: z.string().describe('Relative path from project root'),
      recursive: z.boolean().optional().describe('Delete directory and all contents. Default false.'),
    },
    async ({ path, recursive }) => {
      const result = await executeTool({ name: 'delete_file', args: { path, recursive: recursive ?? false } });
      return result.success ? ok(result.data ?? 'Deleted') : err(result.error ?? 'Unknown error');
    }
  );

  // ── TOOL 5: list_directory ────────────────────────────────────────────
  server.tool(
    'list_directory',
    'List files and folders in a directory. Excludes node_modules, .next, .git, .idea.',
    {
      path: z.string().describe('Relative path. Use "." for project root.'),
      depth: z.number().optional().describe('Max depth (default 3)'),
    },
    async ({ path, depth }) => {
      const result = await executeTool({ name: 'list_directory', args: { path: path || '.', depth: depth ?? 3 } });
      return result.success ? ok(result.data ?? '') : err(result.error ?? 'Unknown error');
    }
  );

  // ── TOOL 6: search_files ──────────────────────────────────────────────
  server.tool(
    'search_files',
    'Search for text/regex across project files using grep. Returns up to 50 matching lines with file paths and line numbers.',
    {
      query: z.string().describe('Text or regex pattern to search for'),
      file_pattern: z.string().optional().describe('Optional glob filter, e.g. "*.tsx" or "*.ts"'),
    },
    async ({ query, file_pattern }) => {
      const result = await executeTool({ name: 'search_files', args: { query, file_pattern } });
      return result.success ? ok(result.data ?? 'No matches') : err(result.error ?? 'Unknown error');
    }
  );

  // ── TOOL 7: git_snapshot ──────────────────────────────────────────────
  server.tool(
    'git_snapshot',
    'Create a git commit of the current state. ALWAYS call before write_file or patch_file to enable rollback. Returns commit hash.',
    { message: z.string().describe('Short description, e.g. "before: refactor hero component"') },
    async ({ message }) => {
      const result = await executeTool({ name: 'git_snapshot', args: { message } });
      return result.success ? ok(result.data ?? 'Snapshot created') : err(result.error ?? 'Unknown error');
    }
  );

  // ── TOOL 8: git_log ───────────────────────────────────────────────────
  server.tool(
    'git_log',
    'Get recent git commit history as JSON array of {hash, message}.',
    { count: z.number().optional().describe('Number of commits to return (default 20)') },
    async ({ count }) => {
      try {
        const n = count ?? 20;
        const raw = execSync(`git log --oneline --no-decorate -${n}`, {
          cwd: PROJECT_ROOT,
          encoding: 'utf-8',
          timeout: 10000,
        }).trim();

        const commits = raw.split('\n').filter(Boolean).map(line => {
          const spaceIdx = line.indexOf(' ');
          return { hash: line.slice(0, spaceIdx), message: line.slice(spaceIdx + 1) };
        });

        return ok(JSON.stringify({ commits }, null, 2));
      } catch (e) {
        return err(String(e));
      }
    }
  );

  // ── TOOL 9: git_push ──────────────────────────────────────────────────
  server.tool(
    'git_push',
    'Push committed changes to origin/main.',
    {},
    async () => {
      try {
        execSync('git push origin main', {
          cwd: PROJECT_ROOT,
          encoding: 'utf-8',
          timeout: 30000,
        });
        return ok('Pushed to origin/main successfully.');
      } catch (e) {
        return err(String(e));
      }
    }
  );

  // ── TOOL 10: deploy ───────────────────────────────────────────────────
  server.tool(
    'deploy',
    'Trigger a production deployment (git pull + npm build + pm2 restart). Returns immediately — build runs in background.',
    {},
    async () => {
      try {
        const child = spawn(
          'bash',
          ['-c', 'sleep 2 && sudo /usr/local/bin/iam-deploy.sh'],
          { detached: true, stdio: 'ignore', cwd: PROJECT_ROOT }
        );
        child.unref();
        return ok('Deploy started. Build and pm2 restart happening in background (takes ~2 minutes).');
      } catch (e) {
        return err(String(e));
      }
    }
  );

  // ── TOOL 11: run_command ──────────────────────────────────────────────
  server.tool(
    'run_command',
    'Run a whitelisted shell command. Returns {stdout, stderr, exitCode}. Allowed prefixes: npm, pm2, cat, head, tail, wc, grep, find, ls, pwd, du, df, git *, curl localhost, nginx -t, systemctl status nginx, node -e, npx.',
    { command: z.string().describe('The shell command to execute') },
    async ({ command }) => {
      const trimmed = command.trim();
      const allowed = ALLOWED_PREFIXES.some(
        prefix => trimmed === prefix || trimmed.startsWith(prefix + ' ')
      );

      if (!allowed) {
        return err(`Command not allowed: "${trimmed}". Only whitelisted commands are permitted.`);
      }

      try {
        const result = spawnSync(trimmed, {
          shell: true,
          cwd: PROJECT_ROOT,
          encoding: 'utf-8',
          timeout: 30000,
          maxBuffer: 1024 * 1024 * 5,
        });

        return ok(JSON.stringify({
          stdout: result.stdout?.trim() ?? '',
          stderr: result.stderr?.trim() ?? '',
          exitCode: result.status ?? -1,
        }, null, 2));
      } catch (e) {
        return err(String(e));
      }
    }
  );

  // ── TOOL 12: read_multiple_files ──────────────────────────────────────
  server.tool(
    'read_multiple_files',
    'Read up to 10 files in one call. Returns array of {path, content} or {path, error}. More efficient than multiple read_file calls.',
    { paths: z.array(z.string()).max(10).describe('Array of relative file paths (max 10)') },
    async ({ paths }) => {
      const results = await Promise.all(
        paths.map(async (filePath) => {
          try {
            const absolute = resolve(PROJECT_ROOT, filePath.replace(/^\/+/, ''));
            if (!absolute.startsWith(PROJECT_ROOT)) {
              return { path: filePath, error: 'Path traversal blocked' };
            }
            const content = await readFile(absolute, 'utf-8');
            return { path: filePath, content };
          } catch (e) {
            return { path: filePath, error: String(e) };
          }
        })
      );
      return ok(JSON.stringify(results, null, 2));
    }
  );

  return server;
}
