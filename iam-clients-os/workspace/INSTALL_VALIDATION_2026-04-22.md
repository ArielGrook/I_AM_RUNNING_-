# Install Validation — 2026-04-22

Session goal: first real install of iam-client.sh via Web Installer on iamrunning.online infrastructure. Walk through 11-point checklist from INSTALL_TEST_INCIDENT_18_04.md.

**Outcome: ✅ INSTALL SUCCESSFUL.** Running at https://test.lego-base.online — HTTP 200, SSL active, PM2 online, admin panel rendering. 4 bugs found, 1 fixed this session, 3 deferred.

---

## Test context

- **Domain:** `test.lego-base.online` (subdomain on Ariel's unused `lego-base.online` apex). A record → `94.176.238.108`.
- **Install path:** `/var/www/iam.test` (isolated from production `/var/www/i_am_running` on same VPS).
- **Port:** `4742` (4741 was taken by old `iam.demo-client`).
- **Client record:** id `6ecc4faf59e28d1e` in admin registry, kind=test, status=installed.
- **Instance ID:** `d2c9660d08522f8c`.
- **PM2 process:** `iam.iam-test` (fork mode, 1 instance).
- **Test GitHub repo:** `ArielGrook/alexs-Take-Go.Co-iam-clients-os` — burn-after-test, not directly used (default skeleton `ArielGrook/iam-client-skeleton` cloned instead).
- **Test GitHub PAT:** `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` — classic, no-expiry, tester-only. Revoke after final validation.

---

## Install flow (what actually happened)

Everything ran through MCP tools end-to-end, no web UI clicks, no SSH:

1. `iam_clients_create` → created client record with status=installing
2. `iam_installer_generate` → returned ~30-line bootstrap.sh referencing `https://iamrunning.online/installer/iam-client.sh`
3. `node -e` via `run_command` → decoded bootstrap from base64, spawned detached bash process with `IAM_GITHUB_TOKEN` in env, redirected stdout+stderr to `/tmp/iam-install.log`
4. Polled log until step 11 complete. Full install took ~90 seconds (apt already up-to-date, npm install 19s, next build ~40s).
5. `certbot --nginx -d test.lego-base.online --non-interactive --agree-tos` spawned detached → SSL deployed automatically
6. `iam_clients_update` → marked status=installed, installDate, productVersion=1.0.0

**This flow is already automated end-to-end via MCP.** Next session will formalize it into a cleaner "one-command install" tool that wraps generate + execute + tail logs into a single call.

---

## Findings

### BUG #1 (FIXED) — Web Installer UI: no DNS setup instructions
- **Symptom:** Operator picks a domain but UI doesn't tell them to create an A record first.
- **Fix:** Added DNS hint block under Domain field in `WebInstallerTab.tsx` with Namecheap + Cloudflare step-by-step, `dig` verify command, server IP displayed.
- **Commit:** `b7c7cdc` (deployed to iamrunning.online).

### BUG #2 (DEFERRED, MEDIUM) — IPv4/IPv6 mismatch in certbot precheck
- **Symptom:** Install log: `Domain resolves to 94.176.238.108, server IP is 2a02:7b40:5eb0:ee6c::1. SSL skipped.` → installer never runs certbot automatically.
- **Root cause:** `iam-client.sh` step 6 does `server_ip="$(curl -fsS ifconfig.me)"` which on dual-stack hosts returns IPv6. A records are always IPv4. Comparison never matches → certbot block is skipped every time.
- **Fix:** Change `curl` to `curl -4` in `scripts/iam-client.sh` around line 530 (`step_nginx`). Trivial, next session.
- **Workaround used:** Ran certbot manually via MCP after install. SSL now live.

### BUG #3 (DEFERRED, LOW) — Monitoring endpoints not implemented on iamrunning.online
- **Symptom:** Install log: `Register endpoint unavailable, skipping.` Also the 5-min heartbeat + activity crons silently fail.
- **Root cause:** Installer posts to `https://iamrunning.online/api/monitor/{heartbeat,activity,register}` but these routes don't exist yet.
- **Fix:** Wait for operator role — these endpoints are its core surface area (collect heartbeats, show instance health in admin UI, respond to register calls by correlating instanceId back to client record). Don't stub prematurely.

### BUG #4 (DEFERRED, COSMETIC) — Escape sequences broken in final summary
- **Symptom:** Last few lines of install log show literal `\033[0;32m═══...` instead of green colored box.
- **Root cause:** `step_register_and_summary` uses `cat <<EOF` heredoc which doesn't interpret `\033`. Only the boxed wrapper breaks — field values print fine.
- **Fix:** Replace heredoc with `printf` or `echo -e` in that function. Trivial.

---

## 11-point checklist (partial)

| # | Check | Status |
|---|-------|--------|
| 1 | HTTPS reachable | ✅ `https://test.lego-base.online` returns 200 |
| 2 | Admin login page renders | ✅ (HTML body = 6151 bytes of Next.js output) |
| 3 | TOTP first-run setup end-to-end | ⬜ (next session — Ariel runs through browser) |
| 4 | Admin Panel all tabs load | ⬜ |
| 5 | Settings → MCP Token generate | ⬜ |
| 6 | Claude.ai MCP connect returns 200 | ⬜ |
| 7 | `Read memory` returns clean templates | ⬜ |
| 8 | Add worker via Team → token → incognito login | ⬜ |
| 9 | File Delete on file (regression check) | ⬜ |
| 10 | Push notifications enable → push arrives | ⬜ |
| 11 | Deploy button → `logs/deploy.jsonl` entry | ⬜ |

Only automated checks (1-2) confirmed. Items 3-11 require browser interaction + Claude.ai MCP connect, deferred to next session.

---

## Backlog (not blocking)

### Token rotation mechanism (operator role)
Still no way to update a PAT on an existing install without SSH. Proper fix lives in operator role: `POST /api/operator/rotate-token` with OPERATOR_TOKEN auth → client-side updates `.env.local` + `pm2 delete && pm2 start`. UI: "Rotate credentials" section in Client Projects tab. Same pattern for encryption keys, VAPID, admin session secret.

### Solo mode dropdown in WebInstallerTab
`mode: team | solo` picker still renders. Solo is deprecated in UI. Remove as part of visual polish pass.

### `iam-clients-os/source/` duplicated installer copies
Installer exists at `iam-clients-os/source/scripts/iam-client.sh` (from migration) AND `iam-clients-os/installer/iam-client.sh` (manual copy published via `/installer/iam-client.sh` route). Must stay byte-identical or installer route returns stale code. Consider making `installer/iam-client.sh` a symlink or the route serve from `source/scripts/` directly.

---

## Commits this session

- `b7c7cdc` — feat(web-installer): DNS setup hint block under Domain field (Namecheap/Cloudflare/dig)
- `d692d01` — docs(validation): open INSTALL_VALIDATION_2026-04-22 — fix #1 + operator backlog

---

## Next session entry conditions

Install is live. New session:
1. Browser walk-through of checklist items 3-11 (Ariel drives, I monitor via MCP)
2. Fix BUG #2 (`curl -4`) in `iam-clients-os/source/scripts/iam-client.sh`, push to GitHub
3. Wrap install flow into a single MCP tool `iam_install_run` that does generate + execute + tail-logs
4. If time: start operator role — at minimum a `/api/monitor/heartbeat` stub endpoint to close BUG #3

Prompt for next session in `context-core/ariels-workflow/bootstrap-prompts/NEXT_PROMPT_2026-04-22.md`.
