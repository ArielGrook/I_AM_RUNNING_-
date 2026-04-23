import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { executeTool } from '@/lib/dev-agent/tool-executor';
import { execSync, spawnSync, spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { registerServerSideAccess } from '@/lib/mcp-server/server-access-tool';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';

// ── Resolve project root for a given client slug (or main project if none) ──
function resolveRoot(clientSlug?: string): string {
  if (clientSlug) return `/var/www/iam-clients/${clientSlug}`;
  return PROJECT_ROOT;
}

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
export function createMcpServer(clientSlug?: string): McpServer {
  const clientRoot = resolveRoot(clientSlug);
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
      // If client slug present and path is context-core/* — read from client dir
      if (clientSlug && path.startsWith('context-core/')) {
        try {
          const absolute = resolve(clientRoot, path);
          const content = await readFile(absolute, 'utf-8');
          return ok(content);
        } catch (e) {
          return err(`context-core file not found: ${path}`);
        }
      }
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

  // ── TOOL 13: iam_clients_list ─────────────────────────────────────────
  server.tool(
    'iam_clients_list',
    'List all IAM Client OS clients (installations) with optional filters. Sensitive fields are returned as masked previews. Use iam_clients_get with reveal_field for plaintext.',
    {
      status: z.enum(['lead', 'paid', 'installing', 'installed', 'failed', 'churned']).optional()
        .describe('Filter by status'),
      kind: z.enum(['real', 'test']).optional().describe('Filter by kind'),
      search: z.string().optional().describe('Substring search across name, domain, server IP, tags'),
    },
    async ({ status, kind, search }) => {
      try {
        const { listClients } = await import('@/lib/admin/iam-clients-os/store');
        const clients = listClients({ status, kind, search });
        return ok(JSON.stringify({ count: clients.length, clients }, null, 2));
      } catch (e) {
        return err(String(e));
      }
    }
  );

  // ── TOOL 14: iam_clients_get ──────────────────────────────────────────
  server.tool(
    'iam_clients_get',
    'Get a single IAM Client OS client by id or domain. Optionally reveal one sensitive field (sshPassword | sshKey | superAdminToken). Reveal is logged to the audit trail.',
    {
      id_or_domain: z.string().describe('Client id (16-char hex) or domain (e.g. "iam-test.lego-base.online")'),
      reveal_field: z.enum(['sshPassword', 'sshKey', 'superAdminToken']).optional()
        .describe('If set, return decrypted plaintext for that one field'),
    },
    async ({ id_or_domain, reveal_field }) => {
      try {
        const store = await import('@/lib/admin/iam-clients-os/store');
        const client = store.getClientPublic(id_or_domain);
        if (!client) return err(`Client not found: "${id_or_domain}"`);

        const out: Record<string, unknown> = { client };
        if (reveal_field) {
          const r = store.revealField(id_or_domain, reveal_field, 'mcp');
          if (!r.ok) return err(r.error);
          out.revealed = { field: r.field, plaintext: r.plaintext };
        }
        return ok(JSON.stringify(out, null, 2));
      } catch (e) {
        return err(String(e));
      }
    }
  );

  // ── TOOL 15: iam_clients_create ───────────────────────────────────────
  server.tool(
    'iam_clients_create',
    'Create a new IAM Client OS client (installation record). At minimum: name + domain. Sensitive fields (sshPassword, sshKey, superAdminToken) are encrypted at rest.',
    {
      name: z.string().describe('Human label, e.g. "Acme Corp"'),
      domain: z.string().describe('Full domain, e.g. "acme.iamrunning.online"'),
      kind: z.enum(['real', 'test']).optional().describe('Default: "real"'),
      status: z.enum(['lead', 'paid', 'installing', 'installed', 'failed', 'churned']).optional()
        .describe('Default: "lead"'),
      mode: z.enum(['team', 'solo']).optional().describe('Default: "team"'),
      port: z.number().optional().describe('Default: 4742'),
      installPath: z.string().optional().describe('Default: "/var/www/iam"'),
      productVersion: z.string().optional(),
      installDate: z.string().optional().describe('YYYY-MM-DD'),
      serverIp: z.string().optional(),
      sshUser: z.string().optional(),
      sshPort: z.number().optional(),
      sshPassword: z.string().optional().describe('Will be encrypted'),
      sshKey: z.string().optional().describe('Private key text. Will be encrypted'),
      superAdminToken: z.string().optional().describe('Will be encrypted'),
      contacts: z.array(z.object({
        type: z.enum(['email', 'telegram', 'whatsapp', 'phone', 'other']),
        value: z.string(),
      })).optional(),
      payments: z.array(z.object({
        amount: z.number(),
        currency: z.string().optional(),
        date: z.string().optional(),
        note: z.string().optional(),
      })).optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    async (input) => {
      try {
        const { createClient } = await import('@/lib/admin/iam-clients-os/store');
        const result = createClient(input, 'mcp');
        if (!result.ok) return err(result.error);
        return ok(`Created client ${result.client.id} (${result.client.domain}).\n\n${JSON.stringify(result.client, null, 2)}`);
      } catch (e) {
        return err(String(e));
      }
    }
  );

  // ── TOOL 16: iam_clients_update ───────────────────────────────────────
  server.tool(
    'iam_clients_update',
    'Update fields on an existing IAM Client OS client. Pass id_or_domain plus only the fields to change. To clear a sensitive field pass empty string. Other fields stay unchanged.',
    {
      id_or_domain: z.string().describe('Client id or domain to update'),
      name: z.string().optional(),
      domain: z.string().optional(),
      kind: z.enum(['real', 'test']).optional(),
      status: z.enum(['lead', 'paid', 'installing', 'installed', 'failed', 'churned']).optional(),
      mode: z.enum(['team', 'solo']).optional(),
      port: z.number().optional(),
      installPath: z.string().optional(),
      productVersion: z.string().optional(),
      installDate: z.string().optional(),
      serverIp: z.string().optional(),
      sshUser: z.string().optional(),
      sshPort: z.number().optional(),
      sshPassword: z.string().optional().describe('Empty string clears it. Otherwise re-encrypts.'),
      sshKey: z.string().optional(),
      superAdminToken: z.string().optional(),
      contacts: z.array(z.object({
        type: z.enum(['email', 'telegram', 'whatsapp', 'phone', 'other']),
        value: z.string(),
      })).optional().describe('REPLACES the entire contacts array'),
      payments: z.array(z.object({
        amount: z.number(),
        currency: z.string().optional(),
        date: z.string().optional(),
        note: z.string().optional(),
      })).optional().describe('REPLACES the entire payments array'),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional().describe('REPLACES the entire tags array'),
    },
    async (input) => {
      try {
        const { id_or_domain, ...patch } = input;
        const { updateClient } = await import('@/lib/admin/iam-clients-os/store');
        const result = updateClient(id_or_domain, patch, 'mcp');
        if (!result.ok) return err(result.error);
        return ok(`Updated client ${result.client.id} (${result.client.domain}).\n\n${JSON.stringify(result.client, null, 2)}`);
      } catch (e) {
        return err(String(e));
      }
    }
  );

  // ── TOOL 17: iam_clients_delete ───────────────────────────────────────
  server.tool(
    'iam_clients_delete',
    'Delete an IAM Client OS client by id or domain. Requires confirm=true to actually remove. This action is irreversible.',
    {
      id_or_domain: z.string().describe('Client id or domain to delete'),
      confirm: z.boolean().describe('Must be true to actually delete. False = dry-run preview.'),
    },
    async ({ id_or_domain, confirm }) => {
      try {
        const store = await import('@/lib/admin/iam-clients-os/store');
        const target = store.getClientPublic(id_or_domain);
        if (!target) return err(`Client not found: "${id_or_domain}"`);

        if (!confirm) {
          return ok(`DRY RUN — would delete:\n${JSON.stringify({
            id: target.id, name: target.name, domain: target.domain, status: target.status,
          }, null, 2)}\n\nCall again with confirm=true to actually delete.`);
        }
        const result = store.deleteClient(id_or_domain, 'mcp');
        if (!result.ok) return err(result.error);
        return ok(`Deleted client ${result.id} (${result.domain}).`);
      } catch (e) {
        return err(String(e));
      }
    }
  );

  // ── TOOL 18: iam_installer_generate ───────────────────────────────────
  server.tool(
    'iam_installer_generate',
    'Generate a personalised bootstrap.sh for a new IAM Client OS install. Takes either id_or_domain (looks up a Client Project) OR raw domain+name. Returns the full script text. Never embeds the GitHub PAT — always relies on prompt-at-runtime or IAM_GITHUB_TOKEN env on the target server.',
    {
      id_or_domain: z.string().optional().describe('Existing client to use as template (overrides other fields if not given)'),
      domain: z.string().optional().describe('Target domain (required if id_or_domain is absent)'),
      name: z.string().optional().describe('Client display name (required if id_or_domain is absent)'),
      mode: z.enum(['team', 'solo']).optional(),
      port: z.number().optional(),
      installPath: z.string().optional(),
      adminPath: z.string().optional().describe('URL prefix for admin panel (default /iam.admin)'),
      skipSecurity: z.boolean().optional(),
      skipNginx: z.boolean().optional(),
      noLanding: z.boolean().optional(),
      dryRun: z.boolean().optional(),
      projectPath: z.string().optional().describe('Integration mode: path to the customer\'s existing app on their VPS. Becomes PROJECT_ROOT for MCP/deploy.'),
      clientAppPm2Name: z.string().optional().describe('Integration mode: customer\'s existing pm2 process name that deploy endpoint should restart.'),
    },
    async (input) => {
      try {
        const { findClient } = await import('@/lib/admin/iam-clients-os/store');

        let domain = input.domain?.trim();
        let name = input.name?.trim();
        let mode: 'team' | 'solo' = input.mode || 'team';
        let port = input.port;
        let installPath = input.installPath?.trim();

        if (input.id_or_domain) {
          const c = findClient(input.id_or_domain);
          if (!c) return err(`Client not found: ${input.id_or_domain}`);
          domain = domain || c.domain;
          name = name || c.name;
          mode = input.mode ?? c.mode;
          port = port ?? c.port;
          installPath = installPath || c.installPath;
        }

        if (!domain) return err('domain is required (either pass domain directly or id_or_domain of an existing client)');
        if (!name) return err('name is required (either pass name directly or id_or_domain of an existing client)');

        port = port || 4742;
        installPath = installPath || '/var/www/iam';
        const adminPath = input.adminPath || '/iam.admin';

        // Build the same bootstrap as the HTTP endpoint. Keep in sync with
        // app/api/admin/iam-clients-os/installer/generate/route.ts — the
        // shared logic is short enough that duplication is cheaper than
        // extracting it (for now; extract into a helper if the body grows).

        const INSTALLER_URL = 'https://iamrunning.online/installer/iam-client.sh';

        const shellEscape = (v: string) => `'${v.replace(/'/g, "'\\''")}'`;

        const extraFlags: string[] = [];
        // Mode is always explicit for web/MCP-generated installs (default team)
        extraFlags.push(`--mode=${mode}`);
        if (input.skipSecurity) extraFlags.push('--skip-security');
        if (input.skipNginx) extraFlags.push('--skip-nginx');
        if (input.noLanding) extraFlags.push('--no-landing');
        if (input.dryRun) extraFlags.push('--dry-run');
        if (input.projectPath) extraFlags.push(`--project-path=${input.projectPath}`);
        if (input.clientAppPm2Name) extraFlags.push(`--client-app-pm2-name=${input.clientAppPm2Name}`);

        const bootstrap = `#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# IAM Client OS bootstrap installer
#
# Generated for:   ${name}
# Target domain:   ${domain}
# Install mode:    ${mode}
# Port:            ${port}
# Install path:    ${installPath}
# Generated at:    ${new Date().toISOString()}
# Source:          ${INSTALLER_URL}
# Generator:       MCP tool (iam_installer_generate)
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

TOKEN="\${IAM_GITHUB_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  read -r -s -p "GitHub PAT (Contents: Read-only on skeleton repo): " TOKEN
  echo
fi
[ -n "$TOKEN" ] || { echo "GitHub PAT is required."; exit 1; }

TMP="$(mktemp -t iam-client-XXXXXX.sh)"
trap 'rm -f "$TMP"' EXIT

echo "→ Downloading installer from ${INSTALLER_URL}"
curl --proto '=https' --tlsv1.2 -fsSL "${INSTALLER_URL}" -o "$TMP"

chmod +x "$TMP"

echo "→ Running installer"
bash "$TMP" \\
  --domain=${shellEscape(domain)} \\
  --name=${shellEscape(name)} \\
  --github-token="$TOKEN" \\
  --port=${port} \\
  --path=${shellEscape(installPath)} \\
  --admin-path=${shellEscape(adminPath)}${extraFlags.length ? ' \\\n  ' + extraFlags.map(shellEscape).join(' \\\n  ') : ''}
`;

        return ok(JSON.stringify({
          filename: `iam-install-${domain.replace(/[^A-Za-z0-9._-]/g, '_')}.sh`,
          installerUrl: INSTALLER_URL,
          bootstrap,
          targetDomain: domain,
          name,
          mode,
          port,
          installPath,
        }, null, 2));
      } catch (e) {
        return err(String(e));
      }
    }
  );

  // ── TOOL 19: server_side_access ───────────────────────────────────────
  // Mega-tool — full server-side access, action-based. See server-access-tool.ts.
  registerServerSideAccess(server);

  return server;
}
