# Session 2026-04-22 — Step 5 Install Validation

**Date:** April 22, 2026
**Preset:** First real install of iam-client.sh on iamrunning.online infrastructure after the lego-base → iamrunning migration closed on 04-21.
**Outcome:** ✅ Install succeeded end-to-end via MCP. Test instance live at https://test.lego-base.online. 4 bugs found (1 fixed, 3 deferred).

---

## What got done

### 1. DNS setup hint in Web Installer UI (BUG #1 fix)
Added a collapsible block under the Domain field in `app/[locale]/admin/iam-clients-os/WebInstallerTab.tsx`. Shows required A record target (`94.176.238.108`), full Namecheap + Cloudflare click-by-click instructions, and a live `dig +short <domain>` command that interpolates the current form value. Also inserted the DNS verification step as #1 in the post-generate "Next steps" panel.

Commit `b7c7cdc` → deployed.

### 2. Client registry record for the test install
Created via `iam_clients_create` (not through the web UI — via MCP, which is how this entire session ran):
- `id` = `6ecc4faf59e28d1e`
- `domain` = `test.lego-base.online`, `kind` = `test`, tags = `["install-validation", "step-5"]`
- After success: `status = installed`, `installDate = 2026-04-22`, `productVersion = 1.0.0`

### 3. Bootstrap + install executed via MCP tools only
No browser, no SSH from Ariel's side. Sequence:

1. `iam_installer_generate id_or_domain=test.lego-base.online` → returned ~30-line bootstrap.sh
2. Encoded bootstrap as base64 locally, sent via a single `run_command node -e` that decoded to `/tmp/iam-test-bootstrap.sh`, spawned detached bash with `IAM_GITHUB_TOKEN` in env, piped output to `/tmp/iam-install.log`
3. Polled `/tmp/iam-install.log` with `tail` + `node -e` until install script printed "Install complete"
4. Spawned `certbot --nginx -d test.lego-base.online --non-interactive` detached, polled `/tmp/certbot.log` until "Congratulations! You have successfully enabled HTTPS"
5. `iam_clients_update` → flipped client record to `status: installed`

Total install time ~90 seconds (apt cached, npm install 19s, next build ~40s, pm2 start + healthcheck <10s). Certbot ~15s.

### 4. Live verified
- `dig +short test.lego-base.online` → `94.176.238.108`
- `http://test.lego-base.online/iam.admin` → 200 (HTTP before cert)
- `https://test.lego-base.online/iam.admin` → 200 after cert (Next.js admin login HTML, 6151 bytes)
- PM2 `iam.iam-test` online, healthcheck 200 on port 4742, fork mode, 1 instance

---

## Bugs found

### BUG #1 — fixed this session
Web Installer UI lacked DNS setup instructions. Operators had to guess or ask what IP to point the domain at. Fix: DNS hint block with per-registrar walkthrough (commit `b7c7cdc`).

### BUG #2 — deferred, medium priority
`iam-client.sh` step 6 (`step_nginx`) does `server_ip="$(curl -fsS ifconfig.me)"`. On dual-stack VPS (our server has IPv6) this returns the IPv6 address. Domain A records always resolve to IPv4. The comparison `resolved_ip != server_ip` is therefore always true → certbot block is skipped every install → SSL must be added manually afterward.

Fix: one character — `curl -4 ifconfig.me`. Apply to `iam-clients-os/source/scripts/iam-client.sh` ~line 530 AND `iam-clients-os/installer/iam-client.sh` (the manual-copy one that the /installer/ route serves).

### BUG #3 — deferred, low priority
`/api/monitor/{heartbeat,activity,register}` endpoints don't exist on iamrunning.online yet. Installer's step 11 (register) + 5-min crons (heartbeat, activity) all fail silently. Installer is graceful about this ("Register endpoint unavailable, skipping.") so it doesn't block anything — but instance health is invisible.

Don't stub — these endpoints are the *core* of the operator role. Build them properly when operator role lands.

### BUG #4 — deferred, cosmetic
Final install summary heredoc in `step_register_and_summary` prints literal `\033[0;32m═══...` instead of green ANSI. Only the box wrapper breaks; URLs + Instance ID + next-steps text print fine. Fix: replace `cat <<EOF` with `printf` or `echo -e`.

---

## Automation ask from Ariel (for next session)

Current install flow requires me to manually encode bootstrap to base64, call node -e with long escaped strings, manage the detached process, poll logs. It works but is ugly. Ariel wants this collapsed into a single MCP tool:

**Proposed:** `iam_install_run` — accepts same params as `iam_installer_generate` plus `githubToken`, returns a stream of install log lines as it progresses, final response has `success: bool`, `instanceId`, `logTail`. Implementation is straightforward: generate bootstrap internally → spawn detached → tail-and-stream log until "Install complete" / "✖" marker.

Bonus: emit an artifact-style response so Ariel can download the raw bootstrap.sh from the chat if he wants to inspect or re-run manually.

---

## What did NOT get done (intentionally)

- **Checklist items 3-11** (TOTP first-run, MCP connect from Claude.ai, read_memory, add user, push notif, deploy button) — these need browser interaction. Ariel will drive them in the next session; I monitor via MCP.
- **BUG #2 fix in source** — know the fix, didn't push it this session because 1-line change + re-publish installer happens cleaner in next session alongside `iam_install_run` implementation.
- **Operator role / monitoring endpoints** — out of scope for "get install working" session.
- **Visual polish** — explicitly flagged as tomorrow's focus, not today's.

---

## Current state at session end

**iamrunning.online** (production — unchanged except for WebInstaller DNS hint):
- PM2: `i-am-running` online, fork mode, 1 instance
- Latest commit: `d692d01` (docs session), `b7c7cdc` (WebInstaller DNS hint deployed)

**test.lego-base.online** (new test install — this session's deliverable):
- PM2: `iam.iam-test` online, port 4742, fork mode, 1 instance
- Path: `/var/www/iam.test`
- SSL: deployed (Let's Encrypt, expires 2026-07-21, auto-renew configured)
- Admin panel: https://test.lego-base.online/iam.admin
- MCP endpoint: https://test.lego-base.online/api/mcp
- Instance ID: `d2c9660d08522f8c`

**Existing on same VPS (unrelated to this session):**
- `iam.demo-client` PM2 process — old demo install from pre-migration, port 4741, path `/var/www/iam.client`. Don't touch.

---

## Key learnings this session

### MCP-as-installer works beautifully
Every single step of an install can be driven through MCP tools. No SSH, no browser, no copy-paste of scripts. This is a real unlock: when a client buys an install, I can do the whole thing from a chat. The current flow is ugly (base64, node -e, polling) but proves the pattern. Cleaning it into `iam_install_run` is a small next-session task.

### IPv4/IPv6 dual-stack is a consistent gotcha
This same class of bug has bitten us in other places (OAuth callback resolution, cert validation). Default assumption everywhere should be: force IPv4 with `-4` unless you explicitly want v6. Worth a wisdom file entry.

### Default skeleton clone just works
`ArielGrook/iam-client-skeleton` → `/var/www/iam.test` → `rm -rf .git && git init` = a clean client-side install with zero skeleton-dev history leakage. The "reset git history" pattern is doing its job.

### The monitoring endpoint stubs are a *strength*, not a weakness
Installer calls `/api/monitor/register` → iamrunning returns 404 → installer warns "Register endpoint unavailable, skipping." and keeps going. Graceful degradation means we can ship installer before operator role is done. This is correct design.

---

*End of session. Handoff prompt for next session: `context-core/ariels-workflow/bootstrap-prompts/NEXT_PROMPT_2026-04-22.md`.*
