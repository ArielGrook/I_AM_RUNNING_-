# Handoff — end of 2026-04-23 late-night session

**Status:** Integration Mode live, Path C mostly closed, operator (Ariel) going to sleep.
**Tomorrow:** 10-min GitHub unblock, then Path B (V2 injection backport) or Path A (V3 spec).

---

## What shipped today (evening + late-night combined)

### Architecture — Integration Mode
- `lib/data/constants.ts` — `IAM_SELF_PATH` separated from `PROJECT_ROOT`. Internal data (settings/tasks/memory/logs) now under IAM_SELF_PATH. MCP file ops + deploy + git use PROJECT_ROOT.
- `/api/operator/self-update` — new endpoint, rebuilds IAM Client OS itself. `/api/operator/deploy` rebuilds customer app. Variant B split validated end-to-end (HTTP 200, 99s rebuild, pm2 restart, customer site untouched).
- Installer: `--mode=team|solo`, `--project-path`, `--client-app-pm2-name` + missing `main "$@"` fix.
- Web installer UI: Integration mode fields (projectPath + clientAppPm2Name) collapsable section.

### Self-test on iamrunning.online
- Installed IAM Client OS into `/var/www/i_am_running/iam-admin/` (subdirectory)
- PROJECT_ROOT = `/var/www/i_am_running` (the main site)
- pm2 `iam.iam-admin-self-test` :4743
- Admin panel: `https://test.iamrunning.online/iam.admin`
- Shortcut: `https://iamrunning.online/iam.admin` → 302 redirect
- **Validated via Claude MCP:** `files list .` returned iamrunning.online source tree; created test file; TOTP first-run showed correctly (data/ separation works); session `[ROLE: admin | SESSION: 1/80]` (team mode).

### Path C — cleanup
| | |
|---|---|
| C.1 Wildcard cert | ✅ certbot.timer active, auto-renewal working |
| C.2 TOTP 24h | ✅ `ADMIN_TOKEN_MAX_AGE = 60 * 60 * 24` in `lib/admin/checkAdminAuth.ts`, built + restarted, `86400` in bundle |
| C.3 self-update endpoint | ✅ tested end-to-end on test.iamrunning.online, HTTP 200 |
| C.4 SSR hang | ⚠️ Partial. i18n deprecated API fixed (`requestLocale`, returns `locale`). Main hang still present — `LoadingProvider` + `useAuth()` don't resolve on SSR. Pre-existing, not a regression, real browser users unaffected. Defer. |
| C.5 GitHub push unblock | ⚠️ Blocked by 5+ legacy PATs in history. See below. |

---

## Tomorrow morning — resume steps

### 1. Finish GitHub push unblock (5-10 min)

Ariel clicked Allow on 2 unblock URLs. Next action:

```bash
cd /var/www/i_am_running
git push origin main
```

Outcomes:
- Push succeeds → done.
- More unblock URLs in output → open each in browser, Allow, push again.
- Repeat until push succeeds.

After successful push, revoke the 4 legacy PATs on https://github.com/settings/tokens:
- `ghp_GbyybPF8...` (unknown usage)
- `ghp_lC7goeoh...` (unknown usage)
- `ghp_QHs0kYaZ...` (iam-test-backup)
- `ghp_VZLa6c4T...` (skeleton clone)

**Keep `ghp_xZI4PZIq...`** — that's the active git remote credential. Revoking breaks push.

### 2. Then — Path B OR Path A

**Path B (V2 injection backport to iamrunning.online MCP server)** — recommended next.
The existing V2 behavior (`smartOk`/`smartErr`/`checkBlock`) from IAM Client OS doesn't exist on iamrunning's MCP. Every chat starts without guardrails. Bringing V2 across is the natural prerequisite for V3.

**Path A (V3 spec)** — write `specifications/MCP_INJECTION_V3_SPEC.md` based on `concepts/MCP_INJECTION_V3_IDEAS.md`. Resolve the 4 open questions (forced-redirect vs Claude retry, session start detection heuristic, handling when AI reads wrong file, redirect response length).

---

## Server state snapshot

**pm2 (all online):**
- `i-am-running` :3000 — iamrunning.online
- `iam.iam-test-phase-2` :4742 — test.lego-base.online (phase 2 standalone test)
- `iam.iam-admin-self-test` :4743 — test.iamrunning.online (Integration mode self-test)

**Git state:**
- iamrunning.online (local): HEAD at `2047e75` (i18n fix). 65 commits ahead of origin.
- iam-client-os source: pushed, HEAD `a3181ba`.
- iam-client-skeleton: synced.

**Backups:**
- `/root/backups/pre-integration-test-2026-04-23-2117.tar.gz` (319M)
- `/root/backups/post-integration-success-2026-04-23-2305.tar.gz` (318M)

**Known open issues (low priority, not blockers):**
- LoadingProvider SSR hang (pre-existing)
- `ecosystem.config.js` dump.pm2 resurrection concerns
- Dashboard = Admin Panel UI parity (IDEAS/DASHBOARD_EQUALS_ADMIN_PANEL_UI.md)
- Session handoff auto-archive (copy session-state.yaml → legacy/YYYY-MM-DD-HH)

---

## What to tell a fresh Claude session tomorrow

> Read `context-core/ariels-workflow/handoffs/2026-04-23-integration-mode-success.md` and `context-core/ariels-workflow/handoffs/2026-04-23-late-night-session-close.md`. First action: verify `https://test.iamrunning.online/iam.admin` still responds (HTTP 200 via nginx → pm2 iam.iam-admin-self-test). Then resume Path B (V2 MCP injection backport) unless I say otherwise.

Good night.
