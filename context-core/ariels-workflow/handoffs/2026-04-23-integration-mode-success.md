# Handoff — Integration Mode End-to-End Success

**Session:** 2026-04-23 evening (the "2-day sprint before subscription expires")
**Outcome:** ✅ Integration Mode fully working. Self-test install proves Виталий's model is real.
**Next session:** MCP tools audit + Session persistence (TOTP 24h) + MCP Injection V3.

---

## What was achieved today

### 1. Architecture: separated `IAM_SELF_PATH` from `PROJECT_ROOT`

**Before:** `DATA_DIR`, `MEMORY_DIR`, `TASKS_DIR`, `MESSAGES_DIR`, `LOGS_DIR` all resolved against `PROJECT_ROOT`. In Integration mode (PROJECT_ROOT = customer's app), our IAM Client OS would have read the customer's `settings.json` / `data/` — mixing our internal state with theirs. That's why the first self-test install picked up iamrunning.online's TOTP secret and showed "solo mode" without first-run setup.

**After:** `lib/data/constants.ts` now derives all internal data paths from `IAM_SELF_PATH` (the install location of IAM Client OS itself). `PROJECT_ROOT` is reserved exclusively for MCP file operations, git, and deploy targets.

```typescript
export const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
export const IAM_SELF_PATH = process.env.IAM_SELF_PATH || PROJECT_ROOT;
export const DATA_DIR = join(IAM_SELF_PATH, 'data');   // was: PROJECT_ROOT
export const MEMORY_DIR = process.env.MEMORY_DIR || join(IAM_SELF_PATH, 'memory');
export const TASKS_DIR = join(IAM_SELF_PATH, 'tasks');
export const MESSAGES_DIR = join(IAM_SELF_PATH, 'messages');
export const LOGS_DIR = join(IAM_SELF_PATH, 'logs');
```

In standalone mode IAM_SELF_PATH defaults to PROJECT_ROOT — no behavior change. Only Integration mode installs see the difference.

### 2. Two-endpoint deploy split (Variant B)

`/api/operator/deploy` — uses `CLIENT_APP_PM2_NAME || IAM_PROCESS_NAME` with fallback. In Integration mode this rebuilds the customer's app and restarts their pm2 process.

`/api/operator/self-update` (NEW) — uses `IAM_SELF_PATH` for cwd, `IAM_PROCESS_NAME` for restart. This is how IAM Client OS itself updates its code without touching the customer's app.

### 3. Web installer flow — full parameter pipeline

- Installer script `iam-client.sh` gained `--mode=team|solo`, `--client-app-pm2-name=NAME`, plus the `--project-path` it always had.
- Web installer endpoint (`app/api/admin/iam-clients-os/installer/generate/route.ts`) accepts `projectPath` + `clientAppPm2Name` in body, emits `--mode=...` + `--project-path=...` + `--client-app-pm2-name=...` in generated bootstrap.
- MCP tool `iam_installer_generate` (`lib/mcp-server/index.ts`) — same params passed through.
- UI `WebInstallerTab.tsx` — "Integration mode (optional)" collapsable section with two fields + hints.

### 4. Installer fixes along the way

- `main "$@"` was missing at end of installer — script defined functions but never executed anything. Fixed.
- `npm run build` in `/api/operator/deploy` now explicitly sets `NPM_CONFIG_PRODUCTION=false` (prevents devDep pruning crash when NODE_ENV=production).
- `settings.json` template now pre-writes `{"mode": "team"}` on web-generated installs instead of empty `{}`.

### 5. Proof: self-test on iamrunning.online

Installed IAM Client OS as a *client of its own parent site*:
- Subdomain: `test.iamrunning.online` (wildcard cert `*.iamrunning.online-0001` covers it)
- Install path: `/var/www/i_am_running/iam-admin/` (subdirectory of iamrunning.online source)
- PROJECT_ROOT: `/var/www/i_am_running` (the main site)
- CLIENT_APP_PM2_NAME: `i-am-running` (the main pm2 process)
- PM2: `iam.iam-admin-self-test` on port 4743
- Admin panel: `https://test.iamrunning.online/iam.admin`
- Shortcut: `https://iamrunning.online/iam.admin` → 302 redirect to subdomain

Ariel verified via Claude MCP connector:
- `files list .` returned the iamrunning.online project tree (app/, lib/, middleware.ts, iam-clients-os/, iam-admin/ as subdir, etc.) — **not** the IAM Client OS internal files.
- TOTP first-run showed correctly (proof that data/ is separated).
- Admin session: `[ROLE: admin | SESSION: 1/80]` (proof that team mode is active).
- Created test file via Claude on test.iamrunning.online MCP, confirmed it appeared in iamrunning.online filesystem. **End-to-end Integration model validated.**

---

## Current server state

**pm2 processes:**
- `i-am-running` (3000) — iamrunning.online main site
- `iam.iam-test-phase-2` (4742) — test.lego-base.online (phase 2 standalone test)
- `iam.iam-admin-self-test` (4743) — test.iamrunning.online (Integration mode self-test)

**Git state:**
- `iamrunning.online` (`/var/www/i_am_running`, pm `i-am-running`): HEAD at `f12e25b` (or later snapshot). Still NOT pushed to GitHub — secret-scanner blocked on `I_AM_RUNNING_-` repo. Many PATs in history need scrubbing before push will succeed. Source is safely git-committed locally.
- `iam-client-os` (source, `/var/www/i_am_running/iam-clients-os/source`): HEAD at `a3181ba`, pushed to `ArielGrook/iam-client-os`.
- `iam-client-skeleton`: synced from source, pushed to `ArielGrook/iam-client-skeleton` (sync ts `2026-04-23T19:17:52Z`).

**Backups:**
- `/root/backups/pre-integration-test-2026-04-23-2117.tar.gz` (319 MB, pre-install state)
- `/root/backups/post-integration-success-2026-04-23-2305.tar.gz` (318 MB, post-success state, SHA256 `72ef030745a833bd...`)

**nginx sites:**
- `iamrunning.online` (includes new location blocks: `/installer/iam-client.sh` direct serve, `/iam.admin` redirect to subdomain)
- `test.iamrunning.online` (new; proxies to localhost:4743 via wildcard cert)
- `test.lego-base.online` (standalone iam.test client)

**Known open issues** (NOT fixed today, deferred):
- **TOTP session persistence on iamrunning.online** — operator must re-enter TOTP every visit. Real UX pain. Needs investigation into cookie maxAge / session storage on iamrunning code (not IAM Client OS). High priority for next session.
- **i-am-running SSR hang on GET `/`** — main site serves API/MCP requests fine but `GET /` via curl without Accept-Language header times out (30s). Affects static serving too — hence nginx bypass for `/installer/iam-client.sh`. Root cause: next-intl middleware + some missing config. Pre-existing, not today's regression. Low priority if browser users aren't hitting it.
- **iamrunning GitHub push blocked** by secret scanner. ≥6 PATs in history. Need: rotate PATs, `git filter-repo` to scrub, force-push. Medium priority.
- **Wildcard cert `iamrunning.online-0001` expires 2026-05-28** (34 days). Certbot auto-renewal should fire before. Verify cron is configured.

---

## Next session priorities

1. **TOTP session 24h persistence** (iamrunning.online codebase) — find cookie expiry, set `maxAge: 24*60*60` seconds, verify `secure` + `httpOnly` + `sameSite: 'lax'`. 10-30 min.
2. **MCP tools audit + MCP Injection V3** — the actual product work Ariel has been waiting to do. This requires a fresh chat with clean context.
3. **Dashboard = Admin Panel UI parity** (Worker/Admin/Super-Admin tiers) — `IDEAS/DASHBOARD_EQUALS_ADMIN_PANEL_UI.md` from Project knowledge.
4. **Session handoff auto-archive** — when `session_handoff` called, copy current `session-state.yaml` to `ariel-workflow/legacy/YYYY-MM-DD-HH-session-state.yaml` before overwriting. Low-lift.

---

## Validated files + line counts (for anyone picking up mid-flight)

| File | Lines | Key fact |
|---|---|---|
| `iam-clients-os/source/lib/data/constants.ts` | 48 | IAM_SELF_PATH separation |
| `iam-clients-os/source/scripts/iam-client.sh` | 1121 | `--mode`, `--client-app-pm2-name`, `main "$@"` at end |
| `iam-clients-os/source/app/api/operator/deploy/route.ts` | ~250 | uses `CLIENT_APP_PM2_NAME || IAM_PROCESS_NAME` |
| `iam-clients-os/source/app/api/operator/self-update/route.ts` | 161 | NEW endpoint, uses `IAM_SELF_PATH` |
| `app/api/admin/iam-clients-os/installer/generate/route.ts` | ~220 | passes `--mode`, `--project-path`, `--client-app-pm2-name` |
| `lib/mcp-server/index.ts` tool 18 | — | same params in MCP version of generate |
| `app/[locale]/admin/iam-clients-os/WebInstallerTab.tsx` | ~420 | "Integration mode" collapsable section |
| `/etc/nginx/sites-available/iamrunning.online` | ~95 | `/installer/iam-client.sh` bypass + `/iam.admin` redirect |
| `/etc/nginx/sites-available/test.iamrunning.online` | 34 | NEW site, wildcard cert, proxies to 4743 |
