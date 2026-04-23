/**
 * server_side_access — mega MCP tool giving Claude full server-side access to
 * the iamrunning.online VPS (94.176.238.108).
 *
 * Unlike `run_command` (whitelisted ~10 command prefixes), this tool imposes
 * NO command whitelist. It is a developer-facing tool used exclusively by the
 * operator (Ariel) via the iamrunning MCP OAuth connector. Full trust model —
 * if the user holds the connector OAuth token, they have full server access.
 *
 * Design: one MCP tool, action-based dispatch. Sub-actions share a flat Zod
 * schema (MCP SDK does not support discriminated unions) and validate required
 * fields inside each sub-action handler.
 *
 * Uniform response: every sub-action returns JSON text of the form
 *   { success: boolean, ...data, error?: string, truncated?: boolean }
 *
 * Safety (edge-only):
 *   - explicit default + hard max timeouts per action
 *   - stdout/stderr tailed to 200 lines OR 50 KB
 *   - maxBuffer 10 MB on spawnSync
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { spawnSync, SpawnSyncReturns } from 'child_process';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

// ── Constants ─────────────────────────────────────────────────────────────
const DEFAULT_CWD = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const DEFAULT_BASH_TIMEOUT_SEC = 30;
const MAX_BASH_TIMEOUT_SEC = 600;
const DEFAULT_PM2_TIMEOUT_SEC = 60;
const DEFAULT_GIT_TIMEOUT_SEC = 30;
const DEFAULT_NGINX_TIMEOUT_SEC = 15;
const DEFAULT_SYSTEMD_TIMEOUT_SEC = 30;
const DEFAULT_CERT_TIMEOUT_SEC = 300; // certbot renew/issue can take 2+ min
const MAX_OUTPUT_LINES = 200;
const MAX_OUTPUT_BYTES = 50 * 1024;
const SPAWN_MAX_BUFFER = 10 * 1024 * 1024;

// ── Helpers ───────────────────────────────────────────────────────────────

function truncateOutput(s: string): { text: string; truncated: boolean } {
  if (!s) return { text: '', truncated: false };
  let truncated = false;
  let out = s;
  if (Buffer.byteLength(out, 'utf-8') > MAX_OUTPUT_BYTES) {
    const buf = Buffer.from(out, 'utf-8');
    out = buf.slice(buf.length - MAX_OUTPUT_BYTES).toString('utf-8');
    truncated = true;
  }
  const lines = out.split('\n');
  if (lines.length > MAX_OUTPUT_LINES) {
    out = lines.slice(lines.length - MAX_OUTPUT_LINES).join('\n');
    truncated = true;
  }
  return { text: out, truncated };
}

function jsonResult(obj: Record<string, unknown>) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(obj, null, 2) }] };
}

interface BashRunOpts {
  cwd?: string;
  timeout_sec?: number;
  default_timeout_sec?: number;
}

interface BashRunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  duration_ms: number;
  timed_out: boolean;
  truncated?: boolean;
  signal?: string;
  spawn_error?: string;
}

/** Core shell runner used by all sub-actions that shell out. */
function runBash(cmd: string, opts: BashRunOpts = {}): BashRunResult {
  const cwd = opts.cwd && opts.cwd.trim() ? opts.cwd : DEFAULT_CWD;
  const defaultTimeout = opts.default_timeout_sec ?? DEFAULT_BASH_TIMEOUT_SEC;
  let timeoutSec = opts.timeout_sec ?? defaultTimeout;
  if (!Number.isFinite(timeoutSec) || timeoutSec <= 0) timeoutSec = defaultTimeout;
  if (timeoutSec > MAX_BASH_TIMEOUT_SEC) timeoutSec = MAX_BASH_TIMEOUT_SEC;

  const startedAt = Date.now();
  let r: SpawnSyncReturns<string>;
  try {
    r = spawnSync(cmd, {
      shell: '/bin/bash',
      cwd,
      encoding: 'utf-8',
      timeout: timeoutSec * 1000,
      maxBuffer: SPAWN_MAX_BUFFER,
      env: process.env,
    });
  } catch (e) {
    return {
      success: false,
      stdout: '',
      stderr: '',
      exit_code: null,
      duration_ms: Date.now() - startedAt,
      timed_out: false,
      spawn_error: `spawnSync threw: ${String(e)}`,
    };
  }
  const durationMs = Date.now() - startedAt;
  const timedOut = r.signal === 'SIGTERM' && durationMs >= timeoutSec * 1000 - 500;
  const stdoutT = truncateOutput(r.stdout ?? '');
  const stderrT = truncateOutput(r.stderr ?? '');
  const anyTruncated = stdoutT.truncated || stderrT.truncated;
  const exitCode = r.status;
  const success = !timedOut && !r.error && exitCode === 0;

  const out: BashRunResult = {
    success,
    stdout: stdoutT.text,
    stderr: stderrT.text,
    exit_code: exitCode,
    duration_ms: durationMs,
    timed_out: timedOut,
  };
  if (anyTruncated) out.truncated = true;
  if (r.signal && !timedOut) out.signal = r.signal;
  if (r.error) out.spawn_error = String(r.error);
  return out;
}

/** Escape a string for safe inclusion inside single-quoted bash. */
function shq(v: string): string {
  return `'${v.replace(/'/g, `'\\''`)}'`;
}

function requireField(
  val: unknown,
  name: string,
  action: string
): { ok: false; result: ReturnType<typeof jsonResult> } | { ok: true } {
  if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
    return {
      ok: false,
      result: jsonResult({
        success: false,
        error: `Parameter '${name}' is required for action '${action}'.`,
      }),
    };
  }
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-action: bash_exec
// ═══════════════════════════════════════════════════════════════════════════

async function handleBashExec(input: {
  cmd?: string;
  cwd?: string;
  timeout_sec?: number;
}) {
  const v = requireField(input.cmd, 'cmd', 'bash_exec');
  if (!v.ok) return v.result;
  const r = runBash(input.cmd!, {
    cwd: input.cwd,
    timeout_sec: input.timeout_sec,
    default_timeout_sec: DEFAULT_BASH_TIMEOUT_SEC,
  });
  return jsonResult({ ...r, cmd: input.cmd, cwd: input.cwd || DEFAULT_CWD });
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-action: files
// Absolute paths allowed — no PROJECT_ROOT restriction (by design).
// ═══════════════════════════════════════════════════════════════════════════

async function handleFiles(input: {
  sub?: string;
  path?: string;
  content?: string;
  old_text?: string;
  new_text?: string;
  destination?: string;
  recursive?: boolean;
}) {
  const s = requireField(input.sub, 'sub', 'files');
  if (!s.ok) return s.result;
  const p = requireField(input.path, 'path', `files:${input.sub}`);
  if (!p.ok) return p.result;
  const sub = input.sub!;
  const fpath = input.path!;

  try {
    switch (sub) {
      case 'read': {
        const content = await fsp.readFile(fpath, 'utf-8');
        const t = truncateOutput(content);
        return jsonResult({
          success: true,
          path: fpath,
          content: t.text,
          bytes: Buffer.byteLength(content, 'utf-8'),
          ...(t.truncated ? { truncated: true } : {}),
        });
      }
      case 'write': {
        if (input.content === undefined)
          return jsonResult({ success: false, error: "'content' required for files:write" });
        await fsp.mkdir(path.dirname(fpath), { recursive: true });
        await fsp.writeFile(fpath, input.content, 'utf-8');
        return jsonResult({
          success: true,
          path: fpath,
          bytes_written: Buffer.byteLength(input.content, 'utf-8'),
        });
      }
      case 'append': {
        if (input.content === undefined)
          return jsonResult({ success: false, error: "'content' required for files:append" });
        await fsp.appendFile(fpath, input.content, 'utf-8');
        return jsonResult({
          success: true,
          path: fpath,
          bytes_appended: Buffer.byteLength(input.content, 'utf-8'),
        });
      }
      case 'patch': {
        if (input.old_text === undefined || input.new_text === undefined) {
          return jsonResult({
            success: false,
            error: "Both 'old_text' and 'new_text' required for files:patch",
          });
        }
        const original = await fsp.readFile(fpath, 'utf-8');
        const occurrences = original.split(input.old_text).length - 1;
        if (occurrences === 0) {
          return jsonResult({ success: false, error: `old_text not found in ${fpath}` });
        }
        if (occurrences > 1) {
          return jsonResult({
            success: false,
            error: `old_text appears ${occurrences}× in ${fpath} — must be unique. Include more surrounding context.`,
            occurrences,
          });
        }
        const patched = original.replace(input.old_text, input.new_text);
        await fsp.writeFile(fpath, patched, 'utf-8');
        return jsonResult({
          success: true,
          path: fpath,
          delta_bytes:
            Buffer.byteLength(patched, 'utf-8') - Buffer.byteLength(original, 'utf-8'),
        });
      }
      case 'delete': {
        const st = await fsp.lstat(fpath).catch(() => null);
        if (!st) return jsonResult({ success: false, error: `Path not found: ${fpath}` });
        if (st.isDirectory()) {
          if (!input.recursive) {
            return jsonResult({
              success: false,
              error: `${fpath} is a directory — pass recursive=true to delete.`,
            });
          }
          await fsp.rm(fpath, { recursive: true, force: true });
          return jsonResult({ success: true, path: fpath, type: 'directory' });
        }
        await fsp.unlink(fpath);
        return jsonResult({ success: true, path: fpath, type: 'file' });
      }
      case 'list': {
        const st = await fsp.stat(fpath).catch(() => null);
        if (!st) return jsonResult({ success: false, error: `Path not found: ${fpath}` });
        if (!st.isDirectory())
          return jsonResult({ success: false, error: `${fpath} is not a directory` });
        if (input.recursive) {
          // Use find with depth limit 3 via runBash for recursive listing
          const r = runBash(`find ${shq(fpath)} -maxdepth 3 -printf '%y %s %p\\n'`, {
            default_timeout_sec: 15,
          });
          return jsonResult({
            ...r,
            path: fpath,
            recursive: true,
            note: 'Columns: type(d/f/l) size path. Max depth 3.',
          });
        }
        const entries = await fsp.readdir(fpath, { withFileTypes: true });
        const details = await Promise.all(
          entries.map(async (e) => {
            const full = path.join(fpath, e.name);
            try {
              const est = await fsp.lstat(full);
              return {
                name: e.name,
                type: e.isDirectory()
                  ? 'dir'
                  : e.isSymbolicLink()
                  ? 'symlink'
                  : 'file',
                size: est.size,
                mtime: est.mtime.toISOString(),
              };
            } catch {
              return { name: e.name, type: 'unknown', size: 0, mtime: null };
            }
          })
        );
        return jsonResult({ success: true, path: fpath, count: details.length, entries: details });
      }
      case 'stat': {
        const st = await fsp.lstat(fpath).catch(() => null);
        if (!st) return jsonResult({ success: false, error: `Path not found: ${fpath}` });
        return jsonResult({
          success: true,
          path: fpath,
          is_dir: st.isDirectory(),
          is_file: st.isFile(),
          is_symlink: st.isSymbolicLink(),
          size: st.size,
          mode: '0' + (st.mode & 0o777).toString(8),
          mtime: st.mtime.toISOString(),
          uid: st.uid,
          gid: st.gid,
        });
      }
      case 'rename': {
        if (!input.destination)
          return jsonResult({ success: false, error: "'destination' required for files:rename" });
        await fsp.rename(fpath, input.destination);
        return jsonResult({ success: true, from: fpath, to: input.destination });
      }
      case 'copy': {
        if (!input.destination)
          return jsonResult({ success: false, error: "'destination' required for files:copy" });
        const st = await fsp.lstat(fpath).catch(() => null);
        if (!st) return jsonResult({ success: false, error: `Path not found: ${fpath}` });
        if (st.isDirectory()) {
          if (!input.recursive)
            return jsonResult({
              success: false,
              error: `${fpath} is a directory — pass recursive=true.`,
            });
          await fsp.cp(fpath, input.destination, { recursive: true });
        } else {
          await fsp.mkdir(path.dirname(input.destination), { recursive: true });
          await fsp.copyFile(fpath, input.destination);
        }
        return jsonResult({ success: true, from: fpath, to: input.destination });
      }
      default:
        return jsonResult({
          success: false,
          error: `Unknown files sub: '${sub}'. Valid: read, write, append, patch, delete, list, stat, rename, copy.`,
        });
    }
  } catch (e: unknown) {
    return jsonResult({ success: false, error: `files:${sub} failed: ${String(e)}`, path: fpath });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-action: pm2
// ═══════════════════════════════════════════════════════════════════════════

async function handlePm2(input: {
  sub?: string;
  name?: string;
  lines?: number;
  ecosystem?: string;
}) {
  const s = requireField(input.sub, 'sub', 'pm2');
  if (!s.ok) return s.result;
  const sub = input.sub!;

  const needsName = ['restart', 'stop', 'delete', 'describe', 'logs'];
  if (needsName.includes(sub)) {
    const n = requireField(input.name, 'name', `pm2:${sub}`);
    if (!n.ok) return n.result;
  }

  switch (sub) {
    case 'list': {
      const r = runBash('pm2 list --no-color', { default_timeout_sec: DEFAULT_PM2_TIMEOUT_SEC });
      return jsonResult({ ...r, sub });
    }
    case 'jlist': {
      const r = runBash('pm2 jlist', { default_timeout_sec: DEFAULT_PM2_TIMEOUT_SEC });
      if (!r.success) return jsonResult({ ...r, sub });
      try {
        const parsed = JSON.parse(r.stdout);
        const summary = parsed.map((p: Record<string, unknown>) => {
          const env = (p.pm2_env || {}) as Record<string, unknown>;
          const monit = (p.monit || {}) as Record<string, number>;
          const uptimeMs = env.pm_uptime ? Date.now() - (env.pm_uptime as number) : null;
          return {
            name: p.name,
            pm_id: p.pm_id,
            status: env.status,
            uptime_sec: uptimeMs !== null ? Math.round(uptimeMs / 1000) : null,
            restarts: env.restart_time,
            unstable_restarts: env.unstable_restarts,
            memory_mb: monit.memory ? Math.round(monit.memory / 1024 / 1024) : 0,
            cpu: monit.cpu ?? 0,
            cwd: env.pm_cwd,
            exec_path: env.pm_exec_path,
          };
        });
        return jsonResult({ success: true, sub, processes: summary, raw_count: parsed.length });
      } catch (e) {
        return jsonResult({ success: false, sub, error: `jlist parse failed: ${String(e)}` });
      }
    }
    case 'describe': {
      const r = runBash(`pm2 describe ${shq(input.name!)} --no-color`, {
        default_timeout_sec: DEFAULT_PM2_TIMEOUT_SEC,
      });
      return jsonResult({ ...r, sub, name: input.name });
    }
    case 'logs': {
      const lines = Math.max(1, Math.min(input.lines ?? 50, 500));
      const r = runBash(`pm2 logs ${shq(input.name!)} --lines ${lines} --nostream --no-color`, {
        default_timeout_sec: DEFAULT_PM2_TIMEOUT_SEC,
      });
      return jsonResult({ ...r, sub, name: input.name, lines });
    }
    case 'restart': {
      const r = runBash(`pm2 restart ${shq(input.name!)} --update-env`, {
        default_timeout_sec: DEFAULT_PM2_TIMEOUT_SEC,
      });
      return jsonResult({ ...r, sub, name: input.name });
    }
    case 'start': {
      const target = input.ecosystem || input.name;
      if (!target)
        return jsonResult({
          success: false,
          error: "pm2:start requires 'ecosystem' (path) or 'name' (existing process).",
        });
      const r = runBash(`pm2 start ${shq(target)}`, {
        default_timeout_sec: DEFAULT_PM2_TIMEOUT_SEC,
      });
      return jsonResult({ ...r, sub, target });
    }
    case 'stop': {
      const r = runBash(`pm2 stop ${shq(input.name!)}`, {
        default_timeout_sec: DEFAULT_PM2_TIMEOUT_SEC,
      });
      return jsonResult({ ...r, sub, name: input.name });
    }
    case 'delete': {
      const r = runBash(`pm2 delete ${shq(input.name!)}`, {
        default_timeout_sec: DEFAULT_PM2_TIMEOUT_SEC,
      });
      return jsonResult({ ...r, sub, name: input.name });
    }
    default:
      return jsonResult({
        success: false,
        error: `Unknown pm2 sub: '${sub}'. Valid: list, jlist, describe, logs, restart, start, stop, delete.`,
      });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-action: git
// All git ops require explicit cwd — ambiguity between source/clients is too risky.
// ═══════════════════════════════════════════════════════════════════════════

async function handleGit(input: {
  sub?: string;
  cwd?: string;
  message?: string;
  path?: string;
  ref?: string;
  count?: number;
}) {
  const s = requireField(input.sub, 'sub', 'git');
  if (!s.ok) return s.result;
  const c = requireField(input.cwd, 'cwd', `git:${input.sub}`);
  if (!c.ok) return c.result;
  const sub = input.sub!;
  const cwd = input.cwd!;

  const opts = { cwd, default_timeout_sec: DEFAULT_GIT_TIMEOUT_SEC };

  switch (sub) {
    case 'status':
      return jsonResult({ ...runBash('git status --short --branch', opts), sub, cwd });
    case 'log': {
      const n = Math.max(1, Math.min(input.count ?? 20, 200));
      return jsonResult({
        ...runBash(`git log --oneline --no-decorate -${n}`, opts),
        sub,
        cwd,
        count: n,
      });
    }
    case 'diff': {
      const ref = input.ref ? ` ${shq(input.ref)}` : '';
      const pathArg = input.path ? ` -- ${shq(input.path)}` : '';
      return jsonResult({
        ...runBash(`git diff --stat${ref}${pathArg} && echo --- && git diff${ref}${pathArg}`, opts),
        sub,
        cwd,
      });
    }
    case 'add': {
      const target = input.path || '-A';
      return jsonResult({ ...runBash(`git add ${shq(target)}`, opts), sub, cwd, target });
    }
    case 'commit': {
      const m = requireField(input.message, 'message', 'git:commit');
      if (!m.ok) return m.result;
      return jsonResult({
        ...runBash(`git commit -m ${shq(input.message!)}`, opts),
        sub,
        cwd,
      });
    }
    case 'snapshot': {
      const m = requireField(input.message, 'message', 'git:snapshot');
      if (!m.ok) return m.result;
      return jsonResult({
        ...runBash(
          `git add -A && git commit -m ${shq(input.message!)} --allow-empty`,
          opts
        ),
        sub,
        cwd,
      });
    }
    case 'push':
      return jsonResult({
        ...runBash('git push origin main', { ...opts, default_timeout_sec: 60 }),
        sub,
        cwd,
      });
    case 'pull':
      return jsonResult({
        ...runBash('git pull --ff-only', { ...opts, default_timeout_sec: 60 }),
        sub,
        cwd,
      });
    case 'stash':
      return jsonResult({ ...runBash('git stash', opts), sub, cwd });
    case 'branch':
      return jsonResult({ ...runBash('git branch -vv', opts), sub, cwd });
    case 'checkout': {
      const r = requireField(input.ref, 'ref', 'git:checkout');
      if (!r.ok) return r.result;
      return jsonResult({ ...runBash(`git checkout ${shq(input.ref!)}`, opts), sub, cwd });
    }
    case 'reset': {
      const r = requireField(input.ref, 'ref', 'git:reset');
      if (!r.ok) return r.result;
      return jsonResult({
        ...runBash(`git reset --hard ${shq(input.ref!)}`, opts),
        sub,
        cwd,
      });
    }
    default:
      return jsonResult({
        success: false,
        error: `Unknown git sub: '${sub}'. Valid: status, log, diff, add, commit, snapshot, push, pull, stash, branch, checkout, reset.`,
      });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-action: nginx
// ═══════════════════════════════════════════════════════════════════════════

const NGINX_AVAIL = '/etc/nginx/sites-available';
const NGINX_ENABLED = '/etc/nginx/sites-enabled';

async function handleNginx(input: { sub?: string; site?: string; content?: string }) {
  const s = requireField(input.sub, 'sub', 'nginx');
  if (!s.ok) return s.result;
  const sub = input.sub!;

  const siteRequired = ['read_site', 'write_site', 'enable_site', 'disable_site'];
  if (siteRequired.includes(sub)) {
    const v = requireField(input.site, 'site', `nginx:${sub}`);
    if (!v.ok) return v.result;
    // No path separators — site must be a filename, not a path
    if (input.site!.includes('/') || input.site!.includes('..')) {
      return jsonResult({
        success: false,
        error: "'site' must be a filename only (e.g. 'example.com'), no path separators.",
      });
    }
  }

  const opts = { default_timeout_sec: DEFAULT_NGINX_TIMEOUT_SEC };

  switch (sub) {
    case 'test':
      return jsonResult({ ...runBash('nginx -t 2>&1', opts), sub });
    case 'reload':
      return jsonResult({
        ...runBash('nginx -t && systemctl reload nginx', {
          ...opts,
          default_timeout_sec: 30,
        }),
        sub,
      });
    case 'list_sites': {
      try {
        const [available, enabled] = await Promise.all([
          fsp.readdir(NGINX_AVAIL).catch(() => [] as string[]),
          fsp.readdir(NGINX_ENABLED).catch(() => [] as string[]),
        ]);
        const enabledSet = new Set(enabled);
        const sites = available.map((name) => ({ name, enabled: enabledSet.has(name) }));
        return jsonResult({ success: true, sub, sites, count: sites.length });
      } catch (e) {
        return jsonResult({ success: false, sub, error: String(e) });
      }
    }
    case 'read_site': {
      try {
        const full = path.join(NGINX_AVAIL, input.site!);
        const content = await fsp.readFile(full, 'utf-8');
        const t = truncateOutput(content);
        return jsonResult({
          success: true,
          sub,
          site: input.site,
          path: full,
          content: t.text,
          ...(t.truncated ? { truncated: true } : {}),
        });
      } catch (e) {
        return jsonResult({ success: false, sub, site: input.site, error: String(e) });
      }
    }
    case 'write_site': {
      if (input.content === undefined)
        return jsonResult({ success: false, error: "'content' required for nginx:write_site" });
      const full = path.join(NGINX_AVAIL, input.site!);
      try {
        await fsp.writeFile(full, input.content, 'utf-8');
        // Auto-validate — caller decides whether to reload
        const test = runBash('nginx -t 2>&1', opts);
        return jsonResult({
          success: test.success,
          sub,
          site: input.site,
          path: full,
          bytes_written: Buffer.byteLength(input.content, 'utf-8'),
          nginx_test: {
            passed: test.success,
            stdout: test.stdout,
            stderr: test.stderr,
          },
          note: test.success
            ? 'Config valid. Call nginx:reload to apply.'
            : 'Config INVALID — not applied. Fix and retry.',
        });
      } catch (e) {
        return jsonResult({ success: false, sub, site: input.site, error: String(e) });
      }
    }
    case 'enable_site': {
      const src = path.join(NGINX_AVAIL, input.site!);
      const dst = path.join(NGINX_ENABLED, input.site!);
      return jsonResult({
        ...runBash(`ln -sf ${shq(src)} ${shq(dst)} && nginx -t 2>&1`, opts),
        sub,
        site: input.site,
      });
    }
    case 'disable_site': {
      const dst = path.join(NGINX_ENABLED, input.site!);
      return jsonResult({ ...runBash(`rm -f ${shq(dst)}`, opts), sub, site: input.site });
    }
    default:
      return jsonResult({
        success: false,
        error: `Unknown nginx sub: '${sub}'. Valid: test, reload, list_sites, read_site, write_site, enable_site, disable_site.`,
      });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-action: systemd
// ═══════════════════════════════════════════════════════════════════════════

async function handleSystemd(input: { sub?: string; unit?: string; lines?: number }) {
  const s = requireField(input.sub, 'sub', 'systemd');
  if (!s.ok) return s.result;
  const u = requireField(input.unit, 'unit', `systemd:${input.sub}`);
  if (!u.ok) return u.result;
  const sub = input.sub!;
  const unit = input.unit!;

  const opts = { default_timeout_sec: DEFAULT_SYSTEMD_TIMEOUT_SEC };

  switch (sub) {
    case 'status':
      return jsonResult({
        ...runBash(`systemctl status ${shq(unit)} --no-pager --lines=20`, opts),
        sub,
        unit,
      });
    case 'start':
    case 'stop':
    case 'restart':
    case 'reload':
      return jsonResult({ ...runBash(`systemctl ${sub} ${shq(unit)}`, opts), sub, unit });
    case 'is-active':
      return jsonResult({ ...runBash(`systemctl is-active ${shq(unit)}`, opts), sub, unit });
    case 'journalctl': {
      const lines = Math.max(1, Math.min(input.lines ?? 100, 500));
      return jsonResult({
        ...runBash(`journalctl -u ${shq(unit)} -n ${lines} --no-pager`, opts),
        sub,
        unit,
        lines,
      });
    }
    default:
      return jsonResult({
        success: false,
        error: `Unknown systemd sub: '${sub}'. Valid: status, start, stop, restart, reload, is-active, journalctl.`,
      });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-action: cert (certbot wrapper)
// ═══════════════════════════════════════════════════════════════════════════

async function handleCert(input: {
  sub?: string;
  domain?: string;
  email?: string;
  webroot?: string;
  force?: boolean;
}) {
  const s = requireField(input.sub, 'sub', 'cert');
  if (!s.ok) return s.result;
  const sub = input.sub!;

  const opts = { default_timeout_sec: DEFAULT_CERT_TIMEOUT_SEC };

  switch (sub) {
    case 'list':
      return jsonResult({ ...runBash('certbot certificates 2>&1', opts), sub });
    case 'renew': {
      const domainFlag = input.domain ? ` --cert-name ${shq(input.domain)}` : '';
      const forceFlag = input.force ? ' --force-renewal' : '';
      return jsonResult({
        ...runBash(`certbot renew${domainFlag}${forceFlag} --non-interactive 2>&1`, opts),
        sub,
        domain: input.domain,
      });
    }
    case 'issue': {
      const d = requireField(input.domain, 'domain', 'cert:issue');
      if (!d.ok) return d.result;
      const e = requireField(input.email, 'email', 'cert:issue');
      if (!e.ok) return e.result;
      const w = requireField(input.webroot, 'webroot', 'cert:issue');
      if (!w.ok) return w.result;
      const cmd = [
        'certbot certonly',
        '--webroot',
        `-w ${shq(input.webroot!)}`,
        `-d ${shq(input.domain!)}`,
        `-m ${shq(input.email!)}`,
        '--agree-tos',
        '--non-interactive',
        '2>&1',
      ].join(' ');
      return jsonResult({ ...runBash(cmd, opts), sub, domain: input.domain });
    }
    case 'delete': {
      const d = requireField(input.domain, 'domain', 'cert:delete');
      if (!d.ok) return d.result;
      if (!input.force) {
        return jsonResult({
          success: false,
          error: `cert:delete requires force=true. Would delete certificate '${input.domain}'.`,
          dry_run: true,
        });
      }
      return jsonResult({
        ...runBash(`certbot delete --cert-name ${shq(input.domain!)} --non-interactive 2>&1`, opts),
        sub,
        domain: input.domain,
      });
    }
    default:
      return jsonResult({
        success: false,
        error: `Unknown cert sub: '${sub}'. Valid: list, renew, issue, delete.`,
      });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MCP tool registration
// ═══════════════════════════════════════════════════════════════════════════

export function registerServerSideAccess(server: McpServer): void {
  server.tool(
    'server_side_access',
    [
      'Full server-side access to the iamrunning.online VPS. Action-based umbrella tool. No command whitelist.',
      '',
      'Actions:',
      '  bash_exec — arbitrary shell command. { cmd, cwd?, timeout_sec? (default 30, max 600) }',
      '  files     — file ops with absolute paths allowed. { sub: read|write|append|patch|delete|list|stat|rename|copy, path, content?, old_text?, new_text?, destination?, recursive? }',
      '  pm2       — process manager. { sub: list|jlist|describe|logs|restart|start|stop|delete, name?, lines?, ecosystem? }',
      '  git       — git ops (cwd REQUIRED). { sub: status|log|diff|add|commit|snapshot|push|pull|stash|branch|checkout|reset, cwd, message?, path?, ref?, count? }',
      '  nginx     — nginx config. { sub: test|reload|list_sites|read_site|write_site|enable_site|disable_site, site?, content? }',
      '  systemd   — systemctl. { sub: status|start|stop|restart|reload|is-active|journalctl, unit, lines? }',
      '  cert      — certbot. { sub: list|renew|issue|delete, domain?, email?, webroot?, force? }',
      '',
      'Response: JSON with { success, ...data, error?, truncated? }. stdout/stderr tailed to 200 lines / 50 KB.',
    ].join('\n'),
    {
      action: z
        .enum(['bash_exec', 'files', 'pm2', 'git', 'nginx', 'systemd', 'cert'])
        .describe('Sub-action to dispatch'),

      cmd: z.string().optional().describe('[bash_exec] Shell command'),
      cwd: z
        .string()
        .optional()
        .describe('[bash_exec, git] Working directory. Required for git.'),
      timeout_sec: z
        .number()
        .optional()
        .describe('[bash_exec] Timeout in seconds (default 30, max 600)'),

      sub: z
        .string()
        .optional()
        .describe('[files, pm2, git, nginx, systemd, cert] Sub-operation'),
      path: z.string().optional().describe('[files] File or directory path. Absolute paths OK.'),
      content: z
        .string()
        .optional()
        .describe('[files:write|append, nginx:write_site] New content'),
      old_text: z.string().optional().describe('[files:patch] Text to replace (unique)'),
      new_text: z.string().optional().describe('[files:patch] Replacement text'),
      destination: z
        .string()
        .optional()
        .describe('[files:rename, files:copy] Destination path'),
      recursive: z.boolean().optional().describe('[files:delete|list|copy] Recurse directories'),

      name: z.string().optional().describe('[pm2] Process name or id'),
      lines: z
        .number()
        .optional()
        .describe('[pm2:logs (default 50), systemd:journalctl (default 100)] Lines to tail'),
      ecosystem: z.string().optional().describe('[pm2:start] Path to ecosystem.config.js'),

      message: z.string().optional().describe('[git:commit, git:snapshot] Commit message'),
      ref: z
        .string()
        .optional()
        .describe('[git:checkout, git:reset, git:diff] Git ref (branch/tag/SHA)'),
      count: z.number().optional().describe('[git:log] Commit count (default 20, max 200)'),

      site: z
        .string()
        .optional()
        .describe('[nginx:*_site] Site config filename (no path separators)'),

      unit: z.string().optional().describe('[systemd] systemd unit name'),

      domain: z.string().optional().describe('[cert] Domain name'),
      email: z.string().optional().describe('[cert:issue] Account email'),
      webroot: z.string().optional().describe('[cert:issue] Webroot path for http-01'),
      force: z.boolean().optional().describe('[cert:delete, cert:renew] Force / skip confirmation'),
    },
    async (input) => {
      switch (input.action) {
        case 'bash_exec':
          return handleBashExec(input);
        case 'files':
          return handleFiles(input);
        case 'pm2':
          return handlePm2(input);
        case 'git':
          return handleGit(input);
        case 'nginx':
          return handleNginx(input);
        case 'systemd':
          return handleSystemd(input);
        case 'cert':
          return handleCert(input);
        default:
          return jsonResult({
            success: false,
            error: `Unknown action: '${String((input as { action: unknown }).action)}'`,
          });
      }
    }
  );
}
