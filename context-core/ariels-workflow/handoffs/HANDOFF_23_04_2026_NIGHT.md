# Handoff — 23.04.2026 night — Operator Phase 2 E2E + live install at test.lego-base.online

**Chat length**: ~5 hours. **Scope**: Phase 1+2 frozen last session, this one opened live E2E testing on a fresh install, surfaced 7 real bugs, fixed 6 of them. Ariel exited frustrated with manual bash copy-paste — next session must deliver a mega MCP tool for direct server access.

---

## What was accomplished

### Phase 2 — 75% passed via full E2E on `test.lego-base.online`

**New test install created**: client id `a11879b3bcf8e768`, domain `test.lego-base.online`, port 4742, pm2 name `iam.iam-test-phase-2`, installed in `/var/www/iam.test` on the iamrunning VPS itself (same host — `94.176.238.108`). Install id `be7138a2d9b8f1da`. operatorToken `6ea0218e...` registered via heartbeat.

**Works end to end (verified)**:
- Fresh install from `iamrunning.online/installer/iam-client.sh` → 11 steps pass
- Heartbeat cron `*/5` delivers uptime, status, version (with fix to use `pm2 jlist` instead of `pm2 describe`)
- Files badge: navigate, read, edit, Save to staging
- Staging list with timestamps and sizes
- Atomic push: snapshot → PUT files → deploy → notify → clear staging → history entry
- Deploy endpoint uses **detached pm2 restart** pattern (we return 200 response first, then `spawn sh -c 'sleep 2; pm2 restart X'` with `detached:true, stdio:'ignore', unref()`) — avoids the endpoint killing itself mid-`execSync`
- Deploy endpoint has **file-based mutex** at `logs/.deploy.lock` — returns 423 Locked if concurrent deploy triggered
- iamrunning push endpoint has **post-deploy `waitForHealthy`** poll — verifies client came back up after detached restart
- Build output tail (40 lines) surfaces in UI on deploy failure
- Activity badge delivery works — cron pushes events to `/api/monitor/activity`, UI shows 30+ events with filter
- GitHub snapshot works on dedicated backup repo (`ArielGrook/iam-test-backup` used, PAT `ghp_QHs0k...` — **to rotate**). Commit was made successfully, files visible on GitHub.

**Does NOT work (two Phase 2 exit defects)**:

1. **Rollback from history UI** — endpoint `/api/admin/operator/rollback/route.ts` does an internal `fetch("/api/admin/operator/push")` (self-HTTP-loop) to reuse push logic. This fetch has no timeout, ends without a JSON response, and Ariel's UI crashes with `Failed to execute 'json' on 'Response': Unexpected end of JSON input`. No history entry with `type: "rollback"` was ever written. Files did **not** actually rollback — verified by reading README on client (`# попытка теста` marker from Ariel's last push is still there). This is an architectural bug requiring refactor to inline the push flow into rollback endpoint without HTTP loop.

2. **Failure test (broken build should trigger rollback)** — Ariel tried breaking `ecosystem.config.js` with `this will not compile;;;` prepended. Next.js `build` doesn't read that file so build passed. PM2 restarted and stayed **online** because pm2 runs from `~/.pm2/dump.pm2` save-state, silently ignoring a broken config. This is a latent bug: if pm2 ever does a cold start from the config file alone, the client dies. Two fixes possible: (a) validate ecosystem.config.js syntax before `pm2 save` in installer + operator deploy, or (b) blacklist pm2 config from Files UI edits.
   - We did NOT re-run failure test with a file Next.js actually compiles (e.g. `app/page.tsx`) due to time.

---

## Session chronology — bugs found and fixed

In order of discovery:

1. **Old nginx config blocked re-install** (legacy `iam.test.lego-base.online` prefix from previous attempts). Manual `rm -f` of two old config files under `/etc/nginx/sites-{available,enabled}/iam.test.lego-base.online` + `nginx -t && systemctl reload nginx`. **Fix in source installer already handled this path** but existing leftover files had to be cleaned once manually.

2. **TypeScript build failed on `notify/route.ts`** — kwargs `notificationType`, `title`, `message`, `data` don't exist on `ActivityEntry` type. [FIXED] Packed all into `detail: JSON.stringify({...})`. Committed as `26309ac` in source repo.

3. **`Module not found @/lib/data` / `@/extensions/...` / `@/lib/tools-registry`** on second+ push. Root cause: client's `.env.local` has `NODE_ENV=production`. When deploy endpoint ran plain `npm install`, npm **pruned devDependencies** (typescript, @types/*, eslint). Next `next build` then failed to resolve `@/` aliases because typescript plugin was gone.  [FIXED] Deploy endpoint now runs `npm install --include=dev --no-audit --no-fund` with `env: { ...process.env, NPM_CONFIG_PRODUCTION: 'false' }`. Committed as `8cada4c`.

4. **Deploy 504 + rollback PUT 502 + redeploy 502** — two issues together:
   - iamrunning's `DEPLOY_TIMEOUT_MS` was 180s; npm-install-with-devDeps + next build can run longer.
   - No mutex on client deploy endpoint → iamrunning timing out triggered a rollback deploy while original deploy was still running → two parallel deploys crashed the client.
   
   [FIXED] Raised `DEPLOY_TIMEOUT_MS` to **420s** in both `app/api/admin/operator/push/route.ts` and `rollback/route.ts`. Added **file-based mutex** at `logs/.deploy.lock` in client deploy route, returning 423 Locked with `sinceMs`. iamrunning push endpoint reads `locked: true` from response.

5. **Deploy endpoint killed itself mid-`pm2 restart`** — classic bug: endpoint runs inside `iam.iam-test-phase-2` pm2 process, calls `execSync('pm2 restart "iam.iam-test-phase-2"')`. pm2 SIGTERMs the current Node process mid-execSync. `execSync` throws "Command failed: pm2 restart". pm2 **does** restart the process, but the endpoint never returned success → caller thinks deploy failed → rollback cascade.
   
   [FIXED] Rewrote `iam-clients-os/source/app/api/operator/deploy/route.ts`:
   - Removed synchronous `pm2 restart` after build
   - Release mutex + log `operator_deploy_built` 
   - `setTimeout(100ms)` then `spawn('sh', ['-c', 'sleep 2; pm2 restart "X" --update-env'], { detached: true, stdio: 'ignore' }).unref()`
   - Return 200 immediately with `{ success: true, restartScheduled: true, httpCode: 0 }`
   - Caller responsibility: poll healthcheck externally

6. **iamrunning push endpoint didn't verify client after detached restart** — required after fix #5, since client's deploy endpoint no longer does its own healthcheck. [FIXED] Added `waitForHealthy(domain, maxMs)` in iamrunning push: waits 3s, then polls `https://{domain}/` HEAD every 2s up to 45s. Expects 2xx/3xx. Rollback triggered if unhealthy after build ok.

7. **Nginx `proxy_read_timeout` 60s default** cut deploy HTTPS connections. nginx same-host loop (`iamrunning → https://test.lego-base.online → 127.0.0.1:4742`) was severing at exactly 60s even though client's deploy endpoint was still processing.
   
   [FIXED] Installer now writes `proxy_read_timeout 600s`, `proxy_send_timeout 600s`, `proxy_connect_timeout 60s`, `client_max_body_size 20m` into nginx config at install time. Applied manually to `/etc/nginx/sites-available/iam.test.lego-base.online` for current test client + reloaded nginx.

8. **Uptime always 0 in UI** — `iam-heartbeat.sh` helper used `pm2 describe $NAME` which returns a text table, not JSON. My regex for `pm_uptime` never matched. [FIXED] Switched to `pm2 jlist` (always JSON) + Node.js parse filtered by `process.env.IAM_PROCESS_NAME`.

9. **`iam-activity.sh` syntax error at line 127, corrupt content** — the `write_activity_script` function in installer had an unclosed single-quote in `EVENTS_JSON="$(echo ... | grep -v '^...` inside a heredoc. Heredoc dumps text literally until `ACTIVITY_EOF`, so the file got generated fine. But at **runtime**, bash parsed the unclosed `'` as starting a string literal that continued for hundreds of lines (matching the next `'` much later in file). Grep got an absurd multiline pattern, script syntax broke at line 127. This caused cron activity pushes to fail silently for hours — UI activity badge stayed empty.
   
   [FIXED] Rewrote the EVENTS_JSON builder inside `write_activity_script` to use a Node.js one-liner that filters/validates JSON object lines. No tricky bash quoting. Cleaner. Committed + skeleton synced. Also had to clean up a duplicate function block that accumulated from prior partial patches (`head -n 1094 iam-client.sh > /tmp/clean.sh && mv`).

10. **iamrunning `UPSTREAM_TIMEOUT_MS` 20s too tight** for snapshot GET through nginx same-host HTTPS loop under occasional transient delays. [FIXED] Bumped to 60s in both push and rollback routes.

---

## Commits (source repo `ArielGrook/iam-client-os`)

Chronological:
- `26309ac` — fix(operator notify): pack custom fields into detail JSON — ActivityEntry type doesn't allow notificationType/message/data as top-level keys
- `8cada4c` — fix(operator): deploy endpoint installs devDeps, file-based mutex, build output tail, heartbeat uses pm2 jlist
- (pending) — fix(operator deploy): detached pm2 restart
- (pending) — fix(installer activity): unclosed single-quote in grep pattern + duplicate function block
- (pending) — feat(installer nginx): proxy_read_timeout 600s + client_max_body_size 20m

Skeleton synced 3x over session. Client `test.lego-base.online` was manually patched 3x (cp from source → rebuild → pm2 restart) because push flow itself was being developed.

iamrunning.online VPS rebuilt 3x during session for timeout + healthcheck changes.

---

## State at end of session

### test.lego-base.online client (id `a11879b3bcf8e768`)
- pm2 process `iam.iam-test-phase-2`: **online**, memory 55mb, restart count 13
- HTTPS: healthy, 200 OK
- README.md: Ariel's "# попытка теста" marker still present (rollback never ran)
- ecosystem.config.js: **broken** (Ariel prepended `this will not compile;;;`). pm2 works because of save-state — do NOT cold-restart pm2 without fixing this first.
- Push history: 5 entries including 2 success, 3 failures
- GitHub backup configured to `ArielGrook/iam-test-backup`, PAT `ghp_QHs0k...` — working

### iamrunning.online
- pm2 process `i-am-running`: online, restart 22, 54.7mb
- Source `/var/www/i_am_running/iam-clients-os/source` — contains uncommitted changes (detached restart, activity script fix, nginx proxy timeouts)
- **Ariel MUST commit these before end of session** — files to commit:
  - `scripts/iam-client.sh` (uptime fix + activity script rewrite + nginx config + duplicate block cleanup)
  - `app/api/operator/deploy/route.ts` (detached restart)
  - Installer copy at `iam-clients-os/installer/iam-client.sh` (mirror of scripts/)

### TODO before closing chat
- `git add -A && git commit && git push` in source
- `bash scripts/sync-to-skeleton/sync.sh` one final time

---

## Patterns (put in `memory/wisdom/PATTERNS.md` if not already there)

1. **Detached restart after hot-update**. When an HTTP endpoint needs to restart the process it's running in: don't `execSync('pm2 restart X')` — schedule `spawn(detached, stdio:'ignore').unref()` with a small delay AFTER the response is sent. Return 200 immediately. Caller polls health externally.

2. **File-based mutex for long-running mutating endpoints**. Lock at `logs/.deploy.lock` with pid + ISO timestamp. Check mtime age, steal if > 15 min (stale). Returns 423 Locked with `sinceMs` so caller knows to retry.

3. **nginx timeouts for reverse-proxying long Node endpoints**. Default `proxy_read_timeout` is 60s — cuts any endpoint that takes longer. Bump to 600s for operator-scope endpoints. Same story for `proxy_send_timeout` and `client_max_body_size` (20m for base64-encoded file PUTs).

4. **Detect npm-prune-on-install when NODE_ENV=production**. Fresh clients have `NODE_ENV=production` in `.env.local`. Any `npm install` inherits this and prunes devDependencies. Always override: `npm install --include=dev --no-audit --no-fund` with `env: { ...process.env, NPM_CONFIG_PRODUCTION: 'false' }`.

---

## Anti-patterns (put in `memory/wisdom/ANTI_PATTERNS.md`)

1. **Self-HTTP-loop inside a route handler**. The rollback endpoint's `fetch('/api/admin/operator/push')` pattern. Event-loop reentry under stress, no timeout by default, mystery failures. Extract shared logic to a library function and call it directly instead.

2. **Bash heredoc + unclosed single-quote**. Even if the heredoc text is written as literal (via `<<'EOF'`), bash will parse the resulting file at runtime. Unclosed quotes silently eat hundreds of lines of the output file as a multi-line string. Always run `bash -n <file>` on any generated script immediately after writing it, as a smoke test.

3. **`pm2 describe` for scripting**. Returns a human-readable ASCII table, not JSON, despite what older docs suggest. Always use `pm2 jlist` when you need structured data.

4. **Sync `pm2 restart` from inside the process being restarted**. It works (pm2 does restart) but the calling `execSync` never returns because the Node process is SIGTERM'd. The calling code thinks the operation failed. Always detached spawn.

5. **Activity cron not silently failing**. When a cron script has a silent syntax error (like our grep quote bug), nothing visible breaks — the UI just stays empty. Add a smoke test: after writing the script, `bash -n` it and also `timeout 30s bash <script>` once during install to verify it runs.

---

## Decisions taken in this session (put in `memory/wisdom/DECISIONS.md`)

1. **Operator deploy endpoint no longer does healthcheck**. The client's deploy route fires `restartScheduled: true` and dies. Health verification moves to the caller (iamrunning push endpoint) via `waitForHealthy()` polling the client externally. This decouples "build ok" from "service recovered."

2. **No self-HTTP-loop in rollback endpoint**. Decision not applied yet — this is the core open bug for next session. But the direction is clear: inline the push flow, no internal fetch.

3. **Mutex is file-based, not memory-based**. Surviving pm2 restarts matters — memory locks die with the process. File mutex at `logs/.deploy.lock` with stale detection by mtime age.

4. **nginx `proxy_read_timeout` in installer** — baked into every new client install, not a manual post-setup step.

5. **iamrunning.online is the development VPS AND hosts test.lego-base.online**. Single-server setup for now. Both domains resolve to `94.176.238.108`, nginx routes by Host header. Makes testing fast — no SSH to another machine for a test client — at the cost of "a bug in one takes down the other's disk" risk.

---

## What the next session MUST do FIRST

Ariel is exhausted with bash copy-paste. He has spent 5 hours pasting commands into a terminal when the AI could have just executed them. His literal request: **build a mega MCP tool for the iamrunning MCP server that gives Claude full server-side access — name it something like `server_side_access` or `server_access` — that aggregates file ops, bash exec, pm2, git, nginx, certbot, systemd into one umbrella with actions.**

This replaces the current `run_command` which is gated to a whitelist of ~10 commands and rejects everything else. Those rejections are what accumulated the 5 hours of friction today.

**Scope for next session**:
- Spec out `server_side_access` mega tool: action-based API, what goes in each action
- Write it as a new MCP tool in `app/api/mcp/lib/` (iamrunning's MCP server)
- Deploy to `iamrunning.online`
- Ariel reconnects the iamrunning connector in Claude → new tool appears → verify with a few test commands (`bash_exec ls /var/www`, `pm2_action list`, `git_action snapshot`, etc.)
- Remove the old whitelisted `run_command` OR demote it to a stub

**Design prompts for mega tool**:
- `server_side_access.bash_exec({ cmd, timeout_sec?, cwd? })` — arbitrary command
- `server_side_access.files({ action: read|write|patch|delete|list|rename|copy|stat, path, ... })`
- `server_side_access.pm2({ action: list|logs|restart|start|delete|jlist, name? })`
- `server_side_access.git({ action: status|log|diff|snapshot|add|commit|push|pull, cwd, ... })`
- `server_side_access.nginx({ action: test|reload|list_sites|read_site|write_site, domain? })`
- `server_side_access.systemd({ action: status|restart|start|stop, unit })`
- `server_side_access.cert({ action: list|renew|issue, domain })`

No whitelist at action layer, just safety at the edges (no rm -rf /, no destructive commands without confirmation flag). Ariel is the only user of iamrunning.online — he signs the connector OAuth himself — trust level is full.

---

## Open issues to carry forward

1. **Rollback from history UI** — self-HTTP-loop bug, needs refactor (not blocker for Phase 2 overall — workaround: operator can manually PUT old file via Files Edit)
2. **Failure test at pm2 config level** — latent bug where pm2 uses save-state and ignores broken config file
3. **Uptime UI not live-updating** — heartbeat is 5min, so after deploy restart the "0s" sits stale for up to 5 min. Fix by either reducing heartbeat interval (1min) or adding manual "Refresh uptime" button that triggers heartbeat via operator endpoint
4. **Rotate PATs** — two leaked in this session:
   - `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` (skeleton clone PAT used for installs)
   - `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` (iam-test-backup PAT — stored encrypted on client, visible in this chat)
5. **Pending commits in source** — detached restart, activity fix, nginx config changes not yet committed/pushed/synced

---

## What worked in this session (process notes)

- Live E2E testing is extremely high-signal. Every bug above would've taken weeks to surface from unit tests.
- Iterative patch-on-client + patch-in-source is OK workflow when source and client are on same VPS.
- Ariel reading back pm2 + logs + file contents as single long bash outputs was efficient for me to diagnose. But it burned his energy, hence the mega-tool request.

## What didn't work

- Whitelisted `run_command` in iamrunning MCP — blocker.
- Multiple overlapping fixes applied without a strict "commit after each" discipline → Ariel ended up with uncommitted source changes at end of session.
- Ariel tried creative tests (PM2 config as failure scenario) that didn't match expected failure surface (Next.js build).
