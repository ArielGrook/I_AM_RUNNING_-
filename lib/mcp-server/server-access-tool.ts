/**
 * server_side_access — mega MCP tool giving Claude full server-side access to
 * the iamrunning.online VPS (94.176.238.108).
 *
 * Unlike `run_command` (whitelisted ~10 command prefixes), this tool imposes
 * NO command whitelist. It is a developer-facing tool used exclusively by the
 * operator (Ariel) via the iamrunning MCP OAuth connector. Full trust model —
 * if the user holds the connector OAuth token, they have full server access.
 *
 * Design: one tool, action-based dispatch. Sub-actions share a flat Zod schema
 * (MCP SDK does not support discriminated unions at schema level) and validate
 * required fields inside each sub-action handler.
 *
 * Uniform response shape: every sub-action returns JSON text of the form
 *   { success: boolean, ...data, error?: string, truncated?: boolean }
 *
 * Safety (edge-only, no whitelist):
 *   - explicit default + hard max timeouts
 *   - stdout/stderr tailed to 200 lines OR 50 KB
 *   - maxBuffer 10 MB on spawnSync to avoid OOM before truncation kicks in
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { spawnSync } from 'child_process';

// ── Constants ─────────────────────────────────────────────────────────────
const DEFAULT_CWD = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const DEFAULT_BASH_TIMEOUT_SEC = 30;
const MAX_BASH_TIMEOUT_SEC = 600;
const MAX_OUTPUT_LINES = 200;
const MAX_OUTPUT_BYTES = 50 * 1024; // 50 KB
const SPAWN_MAX_BUFFER = 10 * 1024 * 1024; // 10 MB

type ActionName =
  | 'bash_exec'
  | 'files'
  | 'pm2'
  | 'git'
  | 'nginx'
  | 'systemd'
  | 'cert';

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Trim output to last MAX_OUTPUT_LINES lines OR last MAX_OUTPUT_BYTES bytes —
 * whichever is more restrictive. Returns truncation flag so caller can surface
 * it in the response.
 */
function truncateOutput(s: string): { text: string; truncated: boolean } {
  if (!s) return { text: '', truncated: false };

  let truncated = false;
  let out = s;

  // Byte limit (take tail — most recent output is usually what matters)
  if (Buffer.byteLength(out, 'utf-8') > MAX_OUTPUT_BYTES) {
    const buf = Buffer.from(out, 'utf-8');
    out = buf.slice(buf.length - MAX_OUTPUT_BYTES).toString('utf-8');
    truncated = true;
  }

  // Line limit — take tail
  const lines = out.split('\n');
  if (lines.length > MAX_OUTPUT_LINES) {
    out = lines.slice(lines.length - MAX_OUTPUT_LINES).join('\n');
    truncated = true;
  }

  return { text: out, truncated };
}

/** Wrap a result object as MCP text content. */
function jsonResult(obj: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(obj, null, 2) }],
  };
}

/** Stub response for sub-actions not yet implemented. */
function notImplemented(action: ActionName) {
  return jsonResult({
    success: false,
    error: `Sub-action '${action}' not yet implemented in server_side_access. Use action: "bash_exec" as fallback for now.`,
  });
}

// ── Sub-action: bash_exec ─────────────────────────────────────────────────

interface BashExecInput {
  cmd?: string;
  cwd?: string;
  timeout_sec?: number;
}

async function handleBashExec(input: BashExecInput) {
  if (!input.cmd || !input.cmd.trim()) {
    return jsonResult({
      success: false,
      error: "Parameter 'cmd' is required for action 'bash_exec'.",
    });
  }

  const cmd = input.cmd;
  const cwd = input.cwd && input.cwd.trim() ? input.cwd : DEFAULT_CWD;

  // Clamp timeout: default 30s, max 600s, reject non-positive
  let timeoutSec = input.timeout_sec ?? DEFAULT_BASH_TIMEOUT_SEC;
  if (!Number.isFinite(timeoutSec) || timeoutSec <= 0) {
    timeoutSec = DEFAULT_BASH_TIMEOUT_SEC;
  }
  if (timeoutSec > MAX_BASH_TIMEOUT_SEC) timeoutSec = MAX_BASH_TIMEOUT_SEC;

  const startedAt = Date.now();
  let result;
  try {
    result = spawnSync(cmd, {
      shell: '/bin/bash',
      cwd,
      encoding: 'utf-8',
      timeout: timeoutSec * 1000,
      maxBuffer: SPAWN_MAX_BUFFER,
      env: process.env,
    });
  } catch (e) {
    return jsonResult({
      success: false,
      error: `spawnSync threw: ${String(e)}`,
      cmd,
      cwd,
      duration_ms: Date.now() - startedAt,
    });
  }

  const durationMs = Date.now() - startedAt;

  // spawnSync surfaces signal-kill via result.signal (e.g. 'SIGTERM' on timeout)
  const timedOut = result.signal === 'SIGTERM' && durationMs >= timeoutSec * 1000 - 500;
  const spawnError = result.error ? String(result.error) : undefined;

  const stdoutT = truncateOutput(result.stdout ?? '');
  const stderrT = truncateOutput(result.stderr ?? '');
  const anyTruncated = stdoutT.truncated || stderrT.truncated;

  const exitCode = result.status;
  const success = !timedOut && !spawnError && exitCode === 0;

  return jsonResult({
    success,
    cmd,
    cwd,
    exit_code: exitCode,
    stdout: stdoutT.text,
    stderr: stderrT.text,
    duration_ms: durationMs,
    timed_out: timedOut,
    ...(anyTruncated ? { truncated: true } : {}),
    ...(result.signal && !timedOut ? { signal: result.signal } : {}),
    ...(spawnError ? { spawn_error: spawnError } : {}),
  });
}

// ── Register the tool on the MCP server ───────────────────────────────────

export function registerServerSideAccess(server: McpServer): void {
  server.tool(
    'server_side_access',
    [
      'Full server-side access to the iamrunning.online VPS. Action-based umbrella tool.',
      'Actions:',
      '  - bash_exec: run arbitrary shell command (no whitelist). { cmd, cwd?, timeout_sec? (default 30, max 600) }',
      '  - files: file ops with absolute paths allowed. { sub: read|write|append|patch|delete|list|stat|rename|copy, path, ... } (NOT YET IMPLEMENTED)',
      '  - pm2: process manager ops. { sub: list|jlist|logs|restart|start|stop|delete|describe, name?, lines? } (NOT YET IMPLEMENTED)',
      '  - git: git ops with cwd param. { sub: status|log|diff|add|commit|push|pull|snapshot|stash|branch|checkout|reset, cwd, message?, path?, ref?, count? } (NOT YET IMPLEMENTED)',
      '  - nginx: nginx config ops. { sub: test|reload|list_sites|read_site|write_site|enable_site|disable_site, site?, content? } (NOT YET IMPLEMENTED)',
      '  - systemd: systemctl ops. { sub: status|start|stop|restart|reload|is-active|journalctl, unit, lines? } (NOT YET IMPLEMENTED)',
      '  - cert: certbot ops. { sub: list|renew|issue|delete, domain?, email?, webroot?, force? } (NOT YET IMPLEMENTED)',
      '',
      'All outputs returned as JSON with { success, ...data, error?, truncated? }. stdout/stderr tailed to 200 lines or 50KB.',
    ].join('\n'),
    {
      action: z
        .enum(['bash_exec', 'files', 'pm2', 'git', 'nginx', 'systemd', 'cert'])
        .describe('Sub-action to dispatch'),

      // bash_exec
      cmd: z.string().optional().describe('[bash_exec] Shell command to execute'),
      cwd: z
        .string()
        .optional()
        .describe(
          '[bash_exec, git] Working directory. Default for bash_exec: /var/www/i_am_running. Required for git.'
        ),
      timeout_sec: z
        .number()
        .optional()
        .describe('[bash_exec] Command timeout in seconds. Default 30, hard max 600.'),

      // files
      sub: z
        .string()
        .optional()
        .describe(
          '[files, pm2, git, nginx, systemd, cert] Sub-operation name within the action.'
        ),
      path: z
        .string()
        .optional()
        .describe('[files] File or directory path. Absolute paths are allowed.'),
      content: z
        .string()
        .optional()
        .describe('[files:write, files:append, nginx:write_site] New file content.'),
      old_text: z
        .string()
        .optional()
        .describe('[files:patch] Text to replace (must occur exactly once).'),
      new_text: z
        .string()
        .optional()
        .describe('[files:patch] Replacement text.'),
      destination: z
        .string()
        .optional()
        .describe('[files:rename, files:copy] Destination path.'),
      recursive: z
        .boolean()
        .optional()
        .describe('[files:delete, files:list] Recurse into directories.'),

      // pm2 / systemd / cert shared
      name: z
        .string()
        .optional()
        .describe('[pm2] Process name or id. Omit for list/jlist.'),
      lines: z
        .number()
        .optional()
        .describe('[pm2:logs, systemd:journalctl] Number of log lines to tail.'),
      ecosystem: z
        .string()
        .optional()
        .describe('[pm2:start] Path to ecosystem.config.js.'),

      // git
      message: z.string().optional().describe('[git:commit, git:snapshot] Commit message.'),
      ref: z
        .string()
        .optional()
        .describe('[git:checkout, git:reset, git:diff] Git ref (branch, tag, SHA).'),
      count: z
        .number()
        .optional()
        .describe('[git:log] Number of commits to return. Default 20.'),

      // nginx
      site: z
        .string()
        .optional()
        .describe('[nginx:read_site, nginx:write_site, nginx:enable_site] Site config filename.'),

      // systemd
      unit: z.string().optional().describe('[systemd] systemd unit name (e.g. "nginx").'),

      // cert
      domain: z.string().optional().describe('[cert] Domain name.'),
      email: z.string().optional().describe('[cert:issue] Account email for Let\'s Encrypt.'),
      webroot: z.string().optional().describe('[cert:issue] Webroot path for http-01 challenge.'),
      force: z.boolean().optional().describe('[cert] Force non-interactive operation.'),
    },
    async (input) => {
      switch (input.action) {
        case 'bash_exec':
          return handleBashExec({
            cmd: input.cmd,
            cwd: input.cwd,
            timeout_sec: input.timeout_sec,
          });
        case 'files':
          return notImplemented('files');
        case 'pm2':
          return notImplemented('pm2');
        case 'git':
          return notImplemented('git');
        case 'nginx':
          return notImplemented('nginx');
        case 'systemd':
          return notImplemented('systemd');
        case 'cert':
          return notImplemented('cert');
        default:
          // Should be unreachable given Zod enum — kept for defensive clarity.
          return jsonResult({
            success: false,
            error: `Unknown action: '${String((input as { action: unknown }).action)}'`,
          });
      }
    }
  );
}
