# Weekly Progress

## Week of 14–20 April 2026

*End-of-week. This week spans Tuesday 14.04 through Monday 20.04 (Ariel's Tue–Mon week convention). Rotates to legacy when next week's file is created on Tuesday 21.04.*

---

### 14.04 Tuesday — pre-sprint prep (night after bagrut)
- MCP Tool Injection Roadmap v2 finalized (Opus review → 7 improvements accepted)
- Session docs fully actualized
- Ready for Sonnet executor tomorrow

### 15.04 Wednesday — MCP TOOL INJECTION SPRINT (full day)

**Opus Mastermind (morning):**
- Full audit of ALL ariel-workflow + IDEAS + route.ts (13 documents)
- Identified 10 gaps in v2, upgraded to v3 roadmap (11 tasks, 3 sessions)
- Added: Task 0 audit, Task 1 translate, Task 8 session_handoff, preset architecture, compliance_score
- All ariel-workflow docs updated

**Sonnet Session 1:**
- Task 0: audit existing route.ts
- Task 1: translate Russian → English (all injection text)
- Task 2: timestamp in preamble (Israel UTC+3)
- Task 3: session limit 80, early warn 50, soft limit 72
- Task 4: smartErr + errors.jsonl + per-tool recovery hints
- Deploy #44: success ✅

**Sonnet Session 2:**
- Task 5: per-tool injection rewrite (English, `<internal>` tags)
- Task 6: preset injection (frontend/backend, path-aware, smartOk signature extended)
- Task 7: checkBlock — 3 pre-execution hard blocks
- Deploy #45: success ✅

**Sonnet Session 3:**
- Path fix: 8 patches (memory/SESSION_STATE → ariel-workflow/session-state)
- Task 8: session_handoff MCP action (archive + write + update next-actions + wisdom + stats)
- Task 9: session-stats.jsonl + totalWrites/totalErrors/totalDeploys counters
- Task 10: contextual rules (path-based 1-2 rules per tool)
- Deploy #46: success ✅

**Bugfix Session (Sonnet):**
- Found: smartOk called without toolName for read/list/search/onboard/read_memory
- 11 patches: files-mega (read, list, search, rename, move, copy, delete), tasks-mega (read_memory), communication-mega (onboard), review-mega (update_doc)
- Deploy #47: success ✅

**Opus Dogfood Verification:**
- read_memory → ✅ SESSION START PROTOCOL + IMPLEMENTATION RULES
- read_file → ✅ read-before-write + architecture reminder
- list_directory → ✅ same injection
- search_files → ✅ check call sites reminder
- Preamble → ✅ `[ROLE | SESSION x/80 | 15:01 UTC+3]`
- All documentation updated

### 16.04 Thursday — GTM launch day

- Upwork profile finalized with MCP positioning (Custom Workflows via MCP | Local AI via Ollama)
- LinkedIn profile set up (headline, services, experience)
- MCP market research: $4.5B market, 97M monthly SDK downloads, 5800+ servers, simple MCP servers sell $4-15k with 2-4 week delivery; SMB niche empty
- Gmail `iamrunning.online@gmail.com` secured for cold email
- 6 GTM channels identified and ranked by ROI (LinkedIn DMs, YouTube, Cold email, Facebook, Reddit, Upwork)
- Hebrew DM templates written for Israeli AI influencers (Gilad Shoham, Leon Mulumud)
- 🔴 Upwork account suspended (camera verification bug), Appeal pending 24–72h
- Pricing finalized for Phase 1 beta: $300–500 setup, free usage for feedback

### 17.04 Friday — Dev Console file delete + Stage 1 skeleton infrastructure

**Morning:**
- Stage 0 install cleanup session (install.sh → thin wrapper, README rewritten, DEVELOPMENT_VS_CLIENT.md)
- INSTALLER_SPEC_v1 written
- Phantom hardcoded paths fixed in 5 source files (commits 5546822, 1f7da3b)

**Evening:**
- Admin Dev Console file delete bug fixed — action name mismatch (`delete` → `delete-file`) + missing folder delete UI + tree refresh preserves expanded state (commit `2ed817b`)
- Stage 1 infrastructure written: `scripts/sync-to-skeleton/` (MANIFEST + sync.sh + 28 overrides)
- All docs/ + source-of-truth/ + memory templates translated EN
- Wisdom English templates created (structure for future population)
- sed sanitization pass added to sync.sh
- Stage 1 handoff doc written

### 18.04 Saturday — Stage 1 skeleton sync completed

- ✅ Stage 1: skeleton sync first run successful — 173 files sanitized, 180 committed, pushed to `ArielGrook/iam-client-skeleton`
- ✅ middleware.ts removed from manifest fix
- ✅ lego-base dev → GitHub push (commits 2ed817b..145bc73)
- GitHub PAT for skeleton push generated
- Phase 1 Section 4 of CURRENT_GOAL completed

### 19.04 Sunday — BIG DAY (7 iam-client-os commits + 12 iamrunning.ai commits)

**iam-client-os (lego-base dev, 7 commits):**
- `250144d` fix(mcp): reset session counter on `read_memory`/`onboard`/`session_handoff`
- `76a8c03` docs(skeleton): replace dev-facing docs with ADMIN_PANEL_INTEGRATION
- `a06a622` fix: BUG 1 CLIENT_DOMAIN scheme (pre-existing)
- `2207e23` fix(mcp-oauth): gate debug logging behind `OAUTH_DEBUG` env flag
- `4805376` feat(dev-console): persist open tabs + warn on unsaved changes
- `7c9ee18` fix(team): super_admin token generate uses `ALL_TOOLS`
- `427ca7c` fix(dashboard): restore Setup tab (was silently removed)
- `a56198d` docs: evening handoff 19.04 + memory updates
- Skeleton resynced 5 times, all fixes pushed
- Stage 3 test install live at `iam-test.lego-base.online:4742`, verified end-to-end

**iamrunning.ai (12 commits, Phases 17A + 17B complete, ~13h Cursor time):**
- 17A.0 Ollama num_ctx/num_predict/temperature + OOM banner
- 17A.1 Indexer scoped to `{project}/rag/`
- 17A.2 KB as thin layer over rag/
- 17A.3 Batched scheduler + debounce
- 17A.4 Targeted chunk deletion via metadata.path
- 17A.5 Migration + bge-m3 swap (also closed clearIndex state reset)
- HOTFIX bge-m3 cold-start timeout 15s → 120s
- 17A.6 Windows/OneDrive guards + normalizePathForChunkId
- 17A.7 queryChunks filters + QueryOptions
- 17A.8 Live RAG stats + Clear Index UI + embedding-model guard
- 17A.9 Bilingual EN+RU with auto language detection + 4 RU translations
- 17B RAG structure + manifest + memory foundation + EN/RU sync cleanup

**Known issue surfaced in 17A.9 verification:**
- Test 3 failed: Qwen said file not found for existing `src/main/ai-provider.ts`. This is Qwen tool-call instability, addressed by Phase 17D.

### 20.04 Monday — Platform migration begins

**Morning:**
- SHARED_CONTEXT section 4 refreshed for iam-client-os 19.04 state

**Evening (this session — Claude Opus 4.7 web MCP):**
- PLATFORM_REFACTORING.md anchor document created (Step 0 DONE)
- Migration Step 1.1 + 1.2 completed (docs transferred from lego-base, Ariel pushed via GitHub)
- Migration Step 1.3 completed: `context-core/` on iamrunning actualized
  - `PROGRESS.md` v9 written
  - `MAIN.md` v2 written
  - `PLATFORM.md` v2 written
  - `PROJECT_STRUCTURE.md` marked STALE with regen TODO
- `bootstrap-prompts/SUCCESS_CHAT_PATTERNS.md` created (based on Ariel's observation about first-prompt attractor behavior)
- `current-state/` + `legacy/` rotation pattern formalized:
  - `current-state/README.md` written (canonical entry point + rotation rule)
  - `legacy/README.md` rewritten (purpose, naming convention)
  - Rotation demonstrated: `session-state.yaml` 19.04 → legacy, new 20.04 written; `next-actions.md` 18.04 → legacy, new 20.04 written; this file expanded 14–20

**Late-night (extended Step 1.3 scope):**
- All 13 folders in `ariels-workflow/` got their own README.md (audits, bootstrap-prompts, concepts, current-state, handoffs, iamrunning-ai, master-docs, memory, memory/wisdom, roadmaps, rules — already had one, specifications)
- `ariels-workflow/README.md` created as the root folder map with one-command entry point
- `legacy/` renamed to `legacy_future_dataset/` per Ariel's instruction (makes dataset purpose explicit)
- Subfolder structure inside: `rotated-state/`, `deprecated-code/`, `deprecated-docs/`, `wisdom/` (platform-wide scaffold), `fine-tune-ideas/` (forward-looking training plans)
- `bootstrap-prompts/SESSION_END_CHECKLIST.md` created — ready-to-paste prompts (A short / B full / C crisis) for ending chats cleanly, plus rationale

Commits: `73b0d2a`, `ca0632c`, `e03a057`, (session-end snapshot pending)

### 21.04 Tuesday morning — Steps 1.4 + 2 closed, Step 3 ready

**Step 1.4 (root cleanup):**
- `product-template/` (Option A multi-tenant installer, 10 files, deprecated) → `context-core/ariels-workflow/legacy_future_dataset/deprecated-code/product-template/` with `_NOTE.md` explaining why retired
- 4 root-level fix docs → `legacy_future_dataset/deprecated-docs/` with `2026-04-21-` prefix: CODEBASE_ANALYSIS_REPORT, COMPONENT_EXTRACTION_DEBUG, LOCALSTORAGE_QUOTA_FIX, PRODUCTION_FIX
- 3 broken-filename garbage files (~76 kb total, fragments of interrupted shell commands) → `legacy_future_dataset/deprecated-code/broken-filenames/` with sanitized names + `_NOTE.md` documenting their origin

**Step 2 (folder structure for IAM Client OS inside iamrunning.online):**
- Created `iam-clients-os/{source,workspace,skeleton-sync}/` with READMEs in each
- Added `iam-clients-os/README.md` as parent-level overview
- Added `iam-clients-os/source/` to root `.gitignore` (only `source/` ignored; `workspace/` and `skeleton-sync/` tracked)

**Migration state after today's morning block:** Steps 0-2 DONE. Step 3 (Admin page frontend) next, ~4-6h, best split across 2-3 Cursor sessions. After that: Steps 4-6 (source clone, validation, lego-base decommission) within 22-23.04.

**Also noted today:** Ariel's MCP injection + tools refactor observation recorded as a scheduled track in next-actions.md. Do not start before Step 4 (lego-base is being decommissioned — no point touching MCP there). First deliverable: `specifications/MCP_INJECTION_V3_SPEC.md`.

Commits: `70d9961` (yesterday's dangling snapshot), `9f49f17` (MCP track note), `53df896` (Step 1.4 moves), final Step 2 snapshot pending.

### 23.04 Thursday evening — Operator spec + BUG #2/#4 fixed (this session)

**Bug fixes (early in session):**
- BUG #2 (curl IPv4): `curl -fsS ifconfig.me` → `curl -fsS -4 ifconfig.me` in `step_nginx`. Without `-4`, dual-stack VPS returns IPv6 → A-record IP comparison fails → certbot block skipped → manual SSL needed every install.
- BUG #4 (heredoc ANSI): `cat <<EOF` doesn't interpret `\033` escapes in `${RED}/${GREEN}/${NC}` variables → final install summary printed literal escape codes instead of colored box. Replaced with `echo -e`.
- Both fixes applied to both copies (`iam-clients-os/source/scripts/iam-client.sh` AND `iam-clients-os/installer/iam-client.sh`), verified byte-identical (28033 bytes), bash syntax OK.
- Local commit `b7eff62`. **Push to GitHub blocked** by Push Protection (5 historical PATs in old commits — pre-existing, not from this session). Resolution deferred. Fix lives on VPS — install route serves `installer/iam-client.sh` from disk so it works for new installs immediately.

**Architecture discussion (mid-session):**
- Discussed server-side MCP toolset architecture. `run_command` whitelist hit limits (no `cd`, no `git -C`) when trying to commit in `iam-clients-os/source/` (separate git tree). Anti-pattern recognized. Solution: typed MCP tools per domain (git_repo_action, pm2_action, nginx_action, tail_log, iam_install_run, etc.) instead of generic shell escape hatch.
- Tracked as scheduled work in `next-actions.md`.

**Operator role spec written:**
- Drafted `iam-clients-os/specs/OPERATOR_SPEC.md` v1 (~360 lines).
- Key decisions:
  - Heartbeat = upsert (combines registration + liveness in one endpoint, instead of two)
  - Activity stays separate from heartbeat (different cadence + payload)
  - Direct write architecture for push update (over git remote / hybrid) — simpler mental model, single source of truth on iamrunning side
  - **Staging buffer on iamrunning side** — files saved to `data/operator/staging/{client_id}/` until "Push to client" action. Atomic multi-PUT then deploy then auto-rollback on failure. Client filesystem is never touched until explicit push.
  - Inline accordion expansion (replacing right-side panel) + badge grid (replacing tabs) in Client Projects UI
  - Per-client GitHub snapshot endpoints — closes C9 (client repo strategy gap from CURRENT_GOAL)
- MVP cut: heartbeat upsert + read-only file API + accordion + badges Server/Status/Access + status dot. ~3-4h, one Cursor session. Closes BUG #3 (monitor endpoints missing).
- Phase 2: staging + push + Dev Console embed + history/rollback + GitHub snapshot
- Phase 3: SSH terminal, token rotation, freeze/kill, billing, approval flow

**No-fall app pattern track added:**
- Port lego-base swap+healthcheck pattern to iamrunning.online first (dogfood), then bake into `iam-client.sh` step_build/step_pm2.
- `.next-staging/` build target, atomic swap on success, pm2 reload (zero-downtime), healthcheck rollback on fail, build errors visible in admin UI banner with link to Dev Console.
- Direct enabler for operator Phase 2 push flow — "deploy fallback" mentioned in spec = this pattern.
- Tracked in `next-actions.md`.

**Pending Ariel manual actions:**
- Push BUG #2/#4 fix from `iam-clients-os/source/` to `ArielGrook/iam-client-os` (cd+commit+push — whitelist blocks automation)
- `git mv context-core/ariels-workflow/iamrunning-ai iamrunning-ai` (hoist folder to root, symmetry with `iam-clients-os/`)
- Decide GitHub Push Protection resolution path (currently deferred)

**Commits this session:** `b7eff62`, `e16b173`, `47dcd4f`, `22ba9f5`, plus session-end snapshot.

### 23.04 Thursday night — Operator Phase 2 E2E live test at test.lego-base.online (this session, Opus 4.7 web)

**Context:** Continuation after morning evening. Phase 1+2 code complete and deployed, now open live E2E testing on a fresh install to verify everything works together.

**Test install created:**
- `test.lego-base.online` (DNS already pointing to `94.176.238.108`, same VPS as iamrunning)
- Client id `a11879b3bcf8e768`, port 4742, pm2 `iam.iam-test-phase-2`, install `/var/www/iam.test`
- Install id `be7138a2d9b8f1da`, operatorToken registered via first heartbeat
- All 11 installer steps passed on second attempt (first hit old `iam.test.lego-base.online` nginx config leftover — cleaned manually)

**7 bugs discovered during live testing, 6 fixed in-session:**

1. **notify endpoint TypeScript error** — custom kwargs (`notificationType`, `title`, `message`, `data`) not in `ActivityEntry` type. Fix: pack into `detail: JSON.stringify(...)`. Commit `26309ac`.

2. **Deploy endpoint pruned devDependencies** when client had `NODE_ENV=production` in `.env.local`. Client's first post-install push failed with "Module not found `@/lib/data`" and `@/` aliases broken. Fix: `npm install --include=dev --no-audit --no-fund` with `env: { NPM_CONFIG_PRODUCTION: 'false' }`. Commit `8cada4c`.

3. **iamrunning DEPLOY_TIMEOUT_MS 180s too tight** — npm install + next build + pm2 restart + healthcheck can take longer on cold caches. Fix: raised to 420s (7 min) in both push and rollback routes.

4. **Concurrent deploys** — iamrunning timed out, fired rollback while original deploy still running → double build → client crashed. Fix: added file-based mutex at `logs/.deploy.lock` in client deploy route (15 min stale detection, returns 423 Locked).

5. **Deploy endpoint killed itself mid-`execSync` of `pm2 restart`** (endpoint runs inside the very pm2 process it restarts → SIGTERM before response returns). Fix: refactored to detached `spawn(sh -c 'sleep 2; pm2 restart X', { detached: true, stdio: 'ignore' }).unref()` AFTER returning 200 response. iamrunning side now polls `waitForHealthy()` externally to verify client recovered. Endpoint no longer healthchecks itself.

6. **nginx `proxy_read_timeout` 60s default** cut deploy HTTPS connections at exactly 60s despite client still processing. Fix: baked `proxy_read_timeout 600s` + `proxy_send_timeout 600s` + `proxy_connect_timeout 60s` + `client_max_body_size 20m` into installer nginx template. Applied manually to current test client.

7. **Heartbeat uptime always 0 in UI** — `pm2 describe` returns text table, regex for `pm_uptime` never matched. Fix: switched to `pm2 jlist` (always JSON) + Node.js filter by `process.env.IAM_PROCESS_NAME`.

**Bonus 8th bug: `iam-activity.sh` syntax error at line 127** causing silent cron failure for hours. Root cause: unclosed single-quote in `grep -v '^` inside heredoc. Bash parsed the file at runtime and ate hundreds of lines as one multi-line string. Activity badge stayed empty despite events being logged. Fix: rewrote `write_activity_script` in installer to use Node.js one-liner for JSON validation (no bash quoting). Also removed duplicate function block from accumulated partial patches.

**Plus 9th — `UPSTREAM_TIMEOUT_MS 20s` too tight** for snapshot fetches through same-host HTTPS loop. Fix: raised to 60s.

**Phase 2 declared 75% passed.** Works: install, heartbeat, files navigation/read/write/staging, atomic push with snapshot + deploy + notify, deploy mutex, post-restart waitForHealthy, activity delivery, GitHub snapshot on dedicated backup repo.

**Two defects remain open (next session):**
- **Rollback from history UI** — self-HTTP-loop in `rollback/route.ts` (calls push endpoint via `fetch()`) with no timeout → UI gets empty body → JSON parse crash → no history entry → files never roll back. Needs refactor to inline push logic.
- **Failure test at pm2 config level** — Ariel broke `ecosystem.config.js` expecting pm2 restart to fail. Instead pm2 used save-state from `~/.pm2/dump.pm2` and ignored broken config. Latent bug: cold-start would kill the process. Fix options: validate config pre-save in installer, or blacklist pm2 config from Files UI edits.

**Session outcome note:** Ariel physically exhausted from 5h of manual bash copy-paste (whitelisted `run_command` MCP tool rejected most commands). Explicit demand for next session: ship mega MCP tool `server_side_access` with action-based API (bash_exec, files, pm2, git, nginx, systemd, cert). Prompt ready in `handoffs/HANDOFF_23_04_2026_NIGHT.md`.

**Commits from this session:**
- `26309ac` — notify TypeScript fix (pushed)
- `8cada4c` — devDeps + mutex + heartbeat jlist (pushed)
- Pending: deploy detached restart, activity script rewrite, nginx proxy timeouts, duplicate block removal (in source repo, not yet committed)

**State at end:**
- pm2 `iam.iam-test-phase-2`: online, healthy, uptime growing
- pm2 `i-am-running`: online, rebuilt 3× this session, rebuilt with waitForHealthy on final
- `test.lego-base.online`: 200 OK, README.md contains Ariel's "# попытка теста" marker (rollback UI failed to clean up)
- `ecosystem.config.js` on test client is broken — do NOT cold-restart pm2 there without fixing first

---

## Stats for the week

- **iam-client-os commits (lego-base dev):** 7 on 19.04, plus ~5 on 15.04 sprint and skeleton infra on 17–18.04
- **iamrunning.ai commits:** 12 on 19.04 (Phases 17A+17B)
- **iamrunning.online commits (this server):** 3 so far on 20.04 (migration Steps 0 + 1.3 + pattern formalization)
- **Stage 3 test install:** live and verified
- **GTM progress:** 6 channels identified + Upwork suspended + LinkedIn/Gmail/Hebrew DM templates ready. No paying client yet.
- **Big documentation wins:** anchor doc for migration, rotation pattern formalized, SUCCESS_CHAT_PATTERNS codified

## Rollup

This was the week where (a) iam-client-os went from "almost production" to "verified production-ready on Stage 3 test install", (b) iamrunning.ai defrosted and closed Phases 17A+17B of RAG pipeline unification, (c) GTM got real (MCP research, channels, profiles), and (d) platform migration kicked off due to lego-base VPS sunset.

Next week's file starts Tuesday 21.04.

---

*Updated: 20.04.2026 21:30 UTC+3. Rotation to legacy happens 21.04 morning when new week file is created.*
