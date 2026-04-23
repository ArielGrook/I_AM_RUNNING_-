# SSH Server Readme — iamrunning.online (94.176.238.108)

> **Purpose.** Living guide for anyone (AI or human) starting work on the iamrunning.online VPS. Written by Claude on **2026-04-23** during first full-access server audit. Update on every significant change.
>
> **Audience.** Primarily future AI assistants who will pick up work here via the `server_side_access` MCP tool. Secondarily: Ariel himself, returning after a break.

---

## 1. How you're connected to this server

You reach this server via the **`server_side_access`** MCP tool on the `iamrunning` connector. That tool is a giant umbrella with 7 sub-actions:

| action | sub-actions |
|---|---|
| `bash_exec` | arbitrary shell, `cwd`, `timeout_sec` (default 30s, max 600s) |
| `files` | `read`, `write`, `append`, `patch`, `delete`, `list`, `stat`, `rename`, `copy` — **absolute paths allowed** |
| `pm2` | `list`, `jlist`, `describe`, `logs`, `restart`, `start`, `stop`, `delete` |
| `git` | `status`, `log`, `diff`, `add`, `commit`, `snapshot`, `push`, `pull`, `stash`, `branch`, `checkout`, `reset` — **`cwd` required** |
| `nginx` | `test`, `reload`, `list_sites`, `read_site`, `write_site`, `enable_site`, `disable_site` |
| `systemd` | `status`, `start`, `stop`, `restart`, `reload`, `is-active`, `journalctl` |
| `cert` | `list`, `renew`, `issue`, `delete` (certbot wrapper) |

Source: `/var/www/i_am_running/lib/mcp-server/server-access-tool.ts`. If you need a new operation not covered — add a sub-action there and redeploy (see §6).

**No whitelist. Full root access.** The process is running as `root`. Anything `bash` can do, you can do — including destroying the server. Match that with the rules in §7.

All responses are JSON: `{ success, stdout, stderr, exit_code, duration_ms, timed_out, truncated? }`. `stdout`/`stderr` are tailed to **200 lines or 50 KB** (whichever hits first) with `truncated: true`. Spawn buffer hard-cap 10 MB to avoid OOM.

---

## 2. Server inventory

### 2.1 Disks & RAM
- Single disk `/dev/sda2`, 40 GB total, ~12 GB used, ~26 GB free.
- RAM 3.8 GB, swap 2 GB (45 MB in use). Load avg typically <1.

### 2.2 Network
- Public IP `94.176.238.108` on `ens3`. Private `10.176.238.108` (same iface).
- Domains resolving here: `iamrunning.online`, `*.iamrunning.online`, `demo.iamrunning.online`, `sites.iamrunning.online`, `lego-base.online`, `*.lego-base.online`, `test.lego-base.online`.
- **Firewall (ufw active, default DENY in)**: allowed 22, 80, 443, 4741, 4742.
- SSH: `PermitRootLogin yes` — assume key-only. Only root user exists (no non-system users, `/home` empty).
- fail2ban 1.0.2 is installed and running.

### 2.3 What lives where

| Path | Role | Size | Backup? |
|---|---|---:|:---:|
| `/var/www/i_am_running/` | **iamrunning.online source** (Next.js 15). Also hosts `context-core/` (workflow docs), `iam-clients-os/data/` (operator state: clients.json, staging, audit log), `scripts/` (installer, sync-to-skeleton), `lib/mcp-server/` (MCP tools). | 1.7 GB (14 MB excl node_modules+next; `.git` 321 MB) | ✅ |
| `/var/www/iam.test/` | **test.lego-base.online** client install (IAM Client OS). PM2 name `iam.iam-test-phase-2`, port 4742. Daily cron-backup to its own `backups/`. | 715 MB (2.3 MB excl) | ✅ |
| `/var/www/sites/` | User-created sites via iamrunning.online website builder. Subdirs `marcenko-artiom/`, `test/`. Served via `/sites/[slug]` Next.js route. | 2.5 MB | ✅ |
| `/var/www/html/` | Nginx default stub. Not used. | 8 KB | ✅ |
| `/etc/nginx/` | Reverse proxy: routes 8 sites (see `nginx:list_sites`). Per-site configs at `/etc/nginx/sites-available/`, symlinks in `sites-enabled/`. | 116 KB | ✅ |
| `/etc/letsencrypt/` | SSL certs for 5 domains. **`iamrunning.online-0001` (wildcard) expires 2026-05-28 — monitor.** Other 4 expire 60-88 days out. Auto-renewal via `/etc/cron.d/certbot`. | 276 KB | ✅ |
| `/etc/systemd/system/` | Custom units (if any). | 116 KB | ✅ |
| `/root/.ssh/` | SSH authorised keys. | small | ✅ |
| `/root/.pm2/` | PM2 state. **`dump.pm2` + `dump.pm2.bak` are critical** — PM2 restores processes from this file on cold start. See §7 gotcha #2. | ~500 KB | ✅ (dump only) |
| `/root/iam-client-os/`, `/root/iam-client-os-repo/` | **Legacy workspaces from Mar 25–26**, not production. Together ~395 MB. Safe to delete if disk ever pressured. | 395 MB | ❌ |
| `/var/log/` | System + app logs. Cron'd rotation (`logrotate` daily). | 563 MB | ❌ |

### 2.4 Running processes (PM2)

Two Next.js apps under PM2 (`pm2 jlist` for live state):

| name | pm_id | port | cwd | role |
|---|---|---|---|---|
| `i-am-running` | 10 | 3000 | `/var/www/i_am_running` | **iamrunning.online** — landing, operator admin, MCP server, website builder, clients.json store |
| `iam.iam-test-phase-2` | 12 | 4742 | `/var/www/iam.test` | Test client install (IAM Client OS). Heartbeat + activity cron every 5 min. |

Both started via npm, auto-restart on crash. `pm2 save` persists state into `dump.pm2`.

### 2.5 Cron schedule (root)

```
*/5 * * * *  /var/www/iam.test/scripts/iam-heartbeat.sh        # client → iamrunning heartbeat
*/5 * * * *  /var/www/iam.test/scripts/iam-activity.sh         # client → iamrunning activity log
0 3 * * *    /var/www/iam.test/scripts/iam-backup.sh "/var/www/iam.test"  # daily backup, 7-day retention
```

Plus system crons (`/etc/cron.daily`: apt, dpkg, logrotate, man-db; `/etc/cron.d/certbot`).

**Missing:** no analogous `iam-backup.sh` cron for `/var/www/i_am_running` itself. Adding one is a tracked TODO (see §9).

---

## 3. Backups

### 3.1 Location & naming

- **Full server snapshots** (manual, pre-risky-op): `/root/backups/pre-debug-YYYY-MM-DD-HHMM.tar.gz`. Mode 0600, owner root. SHA256 recorded at creation.
- **iam.test daily auto-backups**: `/var/www/iam.test/backups/backup-YYYYMMDD.tar.gz`. Retention 7 days (older pruned). Driven by cron + `scripts/iam-backup.sh`.

### 3.2 What a `pre-debug-*` snapshot contains

Code + state + configs + secrets, ~300–400 MB compressed:

```
/var/www/i_am_running/       (excl node_modules, .next)  ← includes .git with unpushed commits
/var/www/iam.test/           (excl node_modules, .next, backups)
/var/www/sites/              (full, user content)
/var/www/html/
/etc/nginx/, /etc/letsencrypt/, /etc/systemd/system/
/root/.ssh/, /root/.pm2/dump.pm2*, /root/.gitconfig, /root/.bashrc, /root/.bash_history
+ crontab -l snapshot, pm2 jlist snapshot, timestamp, manifest
```

**Exclusions** (recoverable via npm install / build / git clone): `node_modules`, `.next`, `*/backups/backup-*.tar.gz` (no recursive nesting), `/var/log`, `/root/iam-client-os*` legacy.

### 3.3 Security note on the archive

`/root/.bash_history` is **included** and may contain PATs, deploy tokens, or other secrets in plaintext. The archive file has `0600` perms. If you SCP a snapshot offsite, treat the destination as secret storage. Don't commit snapshots to git. Don't upload to public clouds without encryption.

### 3.4 Restore cheatsheet

```bash
# Full restore (overwrites everything — careful)
cd / && tar -xzf /root/backups/pre-debug-YYYY-MM-DD-HHMM.tar.gz

# Partial restore: just pull one file out
tar -xzf /root/backups/pre-debug-*.tar.gz -C /tmp/restore \
  var/www/i_am_running/lib/mcp-server/server-access-tool.ts

# Inspect without extracting
tar -tzf /root/backups/pre-debug-*.tar.gz | grep -F "path/you/want"
```

After restore: `npm install` in each project, `npm run build` if needed, `pm2 resurrect` to rehydrate processes from `dump.pm2`.

---

## 4. Source repos & sync flow

- **Main source**: `/var/www/i_am_running/` → GitHub `ArielGrook/I_AM_RUNNING_-` (private). Remote `origin`, branch `main`.
- **IAM Client OS source**: `/var/www/i_am_running/iam-clients-os/source/` — owns its own `.git`, remote `ArielGrook/iam-client-os`.
- **Skeleton repo**: `ArielGrook/iam-client-skeleton` — sync target, never has dev history. Synced from source via `scripts/sync-to-skeleton/sync.sh`.
- **Client backup repos**: e.g. `ArielGrook/iam-test-backup` — GitHub repos clients back files up to via operator Push flow.

### Known live state (2026-04-23)

- `/var/www/i_am_running` is **`ahead 55`** of `origin/main`. Push blocked by GitHub secret-scanning (leaked PATs in historical commits). Unblock path: revoke leaked PATs → use GitHub "Allow secret" URLs OR `git filter-repo` to scrub history. Until fixed, these 55 commits only exist in the local `.git` (and inside `pre-debug-*.tar.gz` backups).

---

## 5. Nginx — reverse proxy map

`/etc/nginx/sites-available/` holds one file per site. Symlink into `sites-enabled/` to turn on.

| Site | Enabled? | Proxies to | Notes |
|---|:---:|---|---|
| `iamrunning.online` | ✅ | `localhost:3000` (pm2 `i-am-running`) | Main app. `proxy_read_timeout 600s`, `client_max_body_size 20m`. |
| `sites.iamrunning.online` | ✅ | same | Website-builder subdomain. Has a cosmetic `protocol options redefined for 0.0.0.0:443` warning. |
| `demo.iamrunning.online` | ✅ | — | Demo landing. |
| `iam.demo.iamrunning.online` | ❌ | — | Disabled. |
| `gooner.iamrunning.online` | ✅ | — | Historic test client. **Not a real lead** — treat as test-only. |
| `follin.lego-base.online` | ✅ | — | Pre-migration artefact. |
| `iam.test.lego-base.online` | ✅ | — | Legacy, kept for nginx test cases. |
| `test.lego-base.online` | ✅ | `localhost:4742` (pm2 `iam.iam-test-phase-2`) | **Active test client install (IAM Client OS).** Operator Phase 2 E2E runs against this. |

Always `nginx:test` (or `nginx -t`) after any config edit. `nginx:write_site` auto-runs the test and reports `nginx_test.passed` — if `false`, don't `nginx:reload`.

---

## 6. Deploy workflow (for changes to iamrunning.online itself)

Because the MCP server you're reaching through **runs inside `pm2 i-am-running`**, restarting it blind via `pm2 restart i-am-running` kills your own process mid-call (classic bug — see session 2026-04-23 night). Use the detached pattern:

```bash
# Safe self-restart
nohup bash -c 'sleep 3 && pm2 restart i-am-running --update-env' >/tmp/self-restart.log 2>&1 &
```

Full cycle:

1. `git:snapshot` (creates commit; acts as rollback anchor)
2. `files:write` / `files:patch` — your actual change
3. `bash_exec: npm run build` (`timeout_sec: 300`, tail last 20 lines)
4. Detached `pm2 restart i-am-running --update-env`
5. After ~8–15 s, `pm2:jlist` — verify `i-am-running` is `online`, `uptime_sec` low, `restarts` incremented by 1
6. Smoke-test your change

**Adding a new MCP sub-action?** No reconnect needed — the tool schema is the same, only the internal dispatch grows. Just deploy steps 1–6 above.

**Adding a whole new MCP tool?** The schema changes → **Ariel must reconnect the iamrunning connector** in Claude settings before new tools appear. Tell him explicitly.

---

## 7. Rules & patterns for working on this server

### 7.1 Always
1. **Snapshot before you mutate.** `git:snapshot` for code, `pre-debug-*.tar.gz` for cross-project/system changes.
2. **Detached restart when restarting your own process.** See §6.
3. **`nginx -t` before `nginx reload`.** `nginx:write_site` does this automatically; `bash_exec`-driven edits don't.
4. **Explicit timeouts.** Bigger than default (30s) for builds, backups, `du -sh` on large trees, certbot ops.
5. **Use absolute paths in `files:*`.** They work; they're unambiguous; they survive `cwd` confusion.
6. **Prefer `files:patch` over `files:write` for edits** — saves tokens, forces you to be surgical.
7. **When editing `iam.test/` or any client**: `pm2 save` is **not** reloaded on `pm2 restart`. To have the new state persist across cold boots, explicitly `pm2 save` after a verified-good restart.

### 7.2 Never
1. **Never `rm -rf /` or any broad wildcard as root without triple-checking.** There's no safety net.
2. **Never trust `pm2 describe` for parsing.** Returns a human-readable table. Use `pm2 jlist` (always JSON).
3. **Never touch `/var/www/iam.test/ecosystem.config.js`** until the "broken config + pm2 save-state mismatch" bug is fixed (see §9). The file is currently malformed but pm2 runs from save-state. Cold restart without fix → client dies.
4. **Never commit `.bash_history`, `.env*`, `dump.pm2` to git.** These leak secrets.
5. **Never edit `node_modules/` or `.next/`.** Both are regenerated.
6. **Never run a long-blocking `du -sh /` or `find / -size …` without explicit `timeout_sec`.** Will timeout default 30s, but you'll lose the whole output.

### 7.3 Gotchas (learned the hard way)
- **npm prunes devDeps under `NODE_ENV=production`.** Always run `npm install --include=dev --no-audit --no-fund` on client installs, with `NPM_CONFIG_PRODUCTION=false` in env. Otherwise Next.js build fails to resolve `@/` aliases.
- **nginx default `proxy_read_timeout` is 60 s.** Any operator endpoint that takes longer gets cut. For iamrunning.online's operator routes we bumped to 600 s.
- **Bash heredocs + unclosed single quotes**: run `bash -n` on any generated script. An unclosed `'` can eat hundreds of lines silently.
- **Self-HTTP-loop in route handlers is an anti-pattern.** If two endpoints share logic, extract to a lib and import — don't `fetch('/api/...')` from inside a route. Rollback endpoint demonstrates this bug live.

---

## 8. Current fix queue (as of 2026-04-23)

Ordered by how the `server_side_access` tool enables them:

1. **Pending commits in source.** Two new commits (`a4531d1`, `ee2a60c`) are local-only. Push blocked → see §4 state + item 6 below.
2. **`/var/www/iam.test/ecosystem.config.js` is broken.** Ariel prepended `this will not compile;;;`. PM2 runs from save-state, so the process is still online, but cold restart dies. Fix with `files:read` → `files:patch`.
3. **README marker test.** `/var/www/iam.test/README.md` still has Ariel's "# попытка теста" string. Use it to re-test rollback after #4 is fixed.
4. **Rollback endpoint self-HTTP-loop.** `/api/admin/operator/rollback/route.ts` does `fetch('https://test.lego-base.online/...')` → SSL wrong-version-number error (it's same-host, nginx cuts the TLS loop). Refactor: extract push flow into a lib function, inline-call from both push and rollback routes. No more internal HTTPS.
5. **PM2 save-state hides broken ecosystem.config.** Latent bug. Two options: (a) `bash -n ecosystem.config.js` validation in installer + operator deploy before `pm2 save`, or (b) blacklist `ecosystem.config.js` from Files UI edits.
6. **Rotate leaked PATs** (these are in git history & `.bash_history`):
   - `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` — skeleton clone
   - `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` — iam-test-backup
   - +1 unknown (GitHub warning shown "1 more secrets detected")
   After revoke: use GitHub "Allow secret" URLs to unblock push OR `git filter-repo` to scrub. Only after push, do `bash scripts/sync-to-skeleton/sync.sh`.
7. **Cert `iamrunning.online-0001` (wildcard) expires 2026-05-28.** 35 days out. Auto-renew cron exists, but verify it ran. `cert:list` shows current state.
8. **Uptime UI stale 5 min** after client restart (heartbeat interval is `*/5`). Options: 1-min heartbeat, or add "Refresh uptime" button that triggers heartbeat via operator endpoint.
9. **Backup cron for iamrunning.online itself.** iam.test has one, iamrunning.online doesn't. Copy pattern from `/var/www/iam.test/scripts/iam-backup.sh`, install in root crontab. Target `/root/backups/iamrunning-daily-YYYYMMDD.tar.gz`, retain 7.
10. **Disk cleanup opportunity.** `/root/iam-client-os*` (395 MB) legacy dirs, `/var/log` (563 MB) can be rotated more aggressively if disk gets tight (currently 26 GB free, no pressure).

---

## 9. Open architectural TODO

### 9.1 Split server-side MCP tools for clients vs operator

The `server_side_access` tool as-is is **only for the operator** (Ariel, via iamrunning.online connector). It gives full root access, which is correct for him since he owns the infrastructure.

**Client-side `iam-client.sh` installer** ships its own MCP server on the client VPS. Currently that exposes tools scoped to the client app (files, goals, tasks, PR review, etc.). When we next update MCP injection in `iam-client.sh`, we should add a **separate, restricted** server-side tool group for clients. Design goal:

- **Operator MCP** (`server_side_access` here): full root, no whitelist, all 7 actions. As is.
- **Client MCP** (new, to-be-added in `iam-client.sh`): a *scoped subset* — client teams need enough server visibility to diagnose "is my app up?" but must NOT be able to:
  - Edit `/etc/nginx/`, `/etc/letsencrypt/`, `/etc/systemd/`
  - Edit outside `/var/www/iam.<client>/` in files
  - Run arbitrary bash (no `bash_exec`)
  - Restart other pm2 processes, only their own
  - Touch certs

Expected client-side sub-actions:
- `files` scoped to their install directory
- `pm2` scoped to their process name
- `git` within their install
- Read-only `health` / `logs` aggregator
- Heartbeat / activity inspector

No `nginx`, no `systemd`, no `cert`, no `bash_exec`, no raw file access outside `$INSTALL_PATH`. Path-prefix enforcement at the tool layer, not relying on filesystem perms.

### 9.2 Document this split in `iam-client.sh` and here

When implemented, update this file's §1 to reflect the operator/client MCP distinction, and link the client-side tool docs.

---

## 10. Update discipline

When you finish a non-trivial session on this server:
1. If you added/changed paths in §2, update the inventory table.
2. If you added/changed running services, update §2.4.
3. If you hit a new gotcha, add it to §7.3.
4. If you closed a fix-queue item in §8, delete it (don't leave ghosts).
5. Bump the date in the header.
6. `git:snapshot` this file with message `docs: SSH_SERVER_README update — <short reason>`.

This document is a **living source of truth** for how to operate on this server. If it gets out of sync, the next AI loses time re-discovering things. Keep it honest.
