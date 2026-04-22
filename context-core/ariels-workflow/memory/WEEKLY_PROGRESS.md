---
version: 8
last_updated: "2026-04-19T17:40:00Z"
updated_by: "claude"
schema: "weekly_progress_v1"
required_fields: ["current_week"]
current_week: "2026-04-15 to 2026-04-19"
weeks_tracked: 5
total_actions_completed: 230
---

# Weekly Progress

## Week of 22-28 April 2026

### 23.04 Thursday evening — Operator role spec + BUG #2/#4 fixed

Long focused session, three commits + spec.

**Bug fixes:**
- BUG #2 (curl IPv4) in step_nginx — was using `curl -fsS ifconfig.me` which on dual-stack VPS returns IPv6, A-records always IPv4 → certbot block skipped every install. Fix: `curl -fsS -4 ifconfig.me`. Both copies (source + installer), byte-identical (28033 bytes), bash syntax OK. Local commit `b7eff62`.
- BUG #4 (heredoc ANSI) — `cat <<EOF` doesn't interpret `\033` escapes in `${RED}/${GREEN}/${NC}` variables. Replaced with `echo -e`. Same commit.
- Push to `ArielGrook/I_AM_RUNNING_-` blocked by GitHub Push Protection (5 historical PATs in old commits). Three resolution options laid out, Ariel chose defer. Fix lives on VPS — install route serves `installer/iam-client.sh` from disk so new installs already use it.
- Push to `ArielGrook/iam-client-os` (source repo) pending Ariel manual cd+commit+push.

**Architecture decisions:**
- Direct write architecture chosen for operator push (over git remote / hybrid). Simpler mental model, single source of truth on iamrunning side for versioning.
- Staging buffer on iamrunning side mandatory — files saved to `data/operator/staging/{client_id}/` until explicit "Push to client". Atomic multi-PUT then deploy then auto-rollback on failure. Client filesystem never touched until explicit push.
- Heartbeat = upsert (combines registration + liveness). First call creates record, subsequent calls update last_seen + version.
- Activity stays separate (different cadence + payload).
- Inline accordion expansion + badge grid in Client Projects UI (replacing right-side panel + tabs).
- Per-client GitHub snapshot endpoints — closes C9 (client repo strategy gap).

**Operator spec:**
- `iam-clients-os/specs/OPERATOR_SPEC.md` ~360 lines, draft v1.
- Sections: mission, architecture diagram, 3 endpoint blocks, staging walkthrough, visual spec, MVP cut, phasing, assumptions, implementation checklist.
- MVP (Phase 1, ~3-4h): heartbeat upsert + read-only file API + admin proxies + accordion + Server/Status/Access badges + status dot. Closes BUG #3.
- Phase 2: Activity + PUT + staging + push + Dev Console embed + history/rollback + GitHub snapshot.
- Phase 3: SSH terminal, token rotation, freeze/kill, billing, approval flow.

**Tracks added to next-actions:**
- Server-side MCP toolset expansion (typed tools to replace generic run_command — surfaced when whitelist blocked cd / git -C for source/ commits).
- No-fall application pattern (port lego-base swap+healthcheck pattern, dogfood on iamrunning first then bake into iam-client.sh).

**Pending Ariel manual actions:**
- cd into source/ and push BUG #2/#4 fix to ArielGrook/iam-client-os
- git mv iamrunning-ai/ to project root (symmetric with iam-clients-os/)
- Decide GitHub Push Protection resolution path
- Read OPERATOR_SPEC.md on PC, confirm/override 4 assumptions in §7

Commits: `b7eff62`, `e16b173`, `47dcd4f`, `22ba9f5`, plus session-end snapshot.

---

## Week of 15-19 April 2026

### 19.04 STAGE 3 TEST INSTALL COMPLETE + FULL VERIFICATION

Morning session (Opus):
- MCP session counter reset bug fixed. Counter persisted across chats blocking new sessions. Fix: reset on read_memory/onboard/session_handoff tool calls (commit 250144d).
- Dev Console tab persistence. Opened file tabs survive admin tab switches and full page reload. Dirty-state warning before leaving with unsaved changes. Admin and Dashboard both covered (commit 4805376).
- docs/architecture cleanup. Removed 8 dev-facing internal docs, replaced with single client-facing ADMIN_PANEL_INTEGRATION.md, 350 lines, operator-ready (commit 76a8c03).
- BUG 1 CLIENT_DOMAIN scheme in installer (commit a06a622, pre-existed).
- OAuth debug log security fix. authorize and token routes were writing team_token and client_secret in plaintext to oauth-debug.log on every OAuth request. Gated behind OAUTH_DEBUG env flag (commit 2207e23).
- Stage 3 fresh install on iam-test.lego-base.online. 11/11 steps successful, port 4742.
- 3 skeleton syncs to ArielGrook/iam-client-skeleton, all pushes verified.
- Verified via MCP connector: TOTP first-run works, read_memory returns clean skeleton templates, hidden paths work.

Evening session (Opus):
- Super Admin token preset fix. super-admin-token-generate handler had hard-coded tools list missing tasks.session_handoff. Changed to use ALL_TOOLS from tools-registry, auto-includes all current and future sub-actions (commit 7c9ee18).
- Dashboard Setup tab restored. Tab key silently removed from tabs array but render handler and component still existed. Workers could not access Bootstrap Prompt, Tour, Avatar, Skills. Restored (commit 427ca7c).
- 2 more skeleton syncs, 5 total today.
- End-to-end verification via MCP connector on iam-test: OAuth flow no longer writes oauth-debug.log, TEAM_ROLES has tasks.session_handoff permission, Bootstrap prompts generic English no personal names.
- Memory compromise cleanup: rotated MCP super_admin token, old one leaked in oauth-debug.log and chat history.
- Discovered backlog items (documented not fixed): team-regenerate-token only refreshes token_hash not tools, MANIFEST explicit exclude for totp-test-flow is cosmetic.
- Docs updated: CURRENT_GOAL v20, NEXT_ACTIONS v11, WEEKLY_PROGRESS v8.
- Handoff document written for iamrunner.ai refocus.

Total commits 19.04: 7 on lego-base dev plus skeleton commits.
iam-test server state: online, healthchecked, OAuth hardened, all fixes live.

### 18.04 — STAGE 1 SHIPPED
- ✅ Fine-grained PAT created for skeleton repo (Contents R+W only, Metadata R-only)
- ✅ First skeleton sync run SUCCESSFUL: 173 text files sanitized, 180 files committed
- ✅ `ArielGrook/iam-client-skeleton` populated and verified
- ✅ middleware.ts fix in manifest (file didn't exist in lego-base root, removed)
- ✅ lego-base dev commits pushed to GitHub origin/main (2ed817b..145bc73, 4 commits)
- ✅ All documentation updated: current-goal.md, next-actions.md, session-state.yaml, memory/*

### 17.04 — STAGE 0 CLEANUP + ADMIN DEV CONSOLE FIX + SKELETON INFRASTRUCTURE
- ✅ Morning: Stage 0 cleanup — install.sh wrapper, README rewrite, DEVELOPMENT_VS_CLIENT.md
- ✅ Morning: phantom hardcoded paths fixed in 5 source files (PROJECT_ROOT + IAM_PROCESS_NAME)
- ✅ Morning: INSTALLER_SPEC_v1.md written with 11 open questions
- ✅ Morning: OPERATOR_WEBINSTALLER_SKELETON_SPEC written (9 sections including Tripwire & Freeze)
- ✅ Evening: Admin Dev Console file delete bug fixed (commit 2ed817b)
- ✅ Evening: Stage 1 skeleton sync infrastructure written (~2000 lines with 28 overrides)

### 16.04 — GTM LAUNCH DAY + MCP MARKET RESEARCH
- ✅ Upwork profile text finalized, MCP positioning
- ✅ MCP market research: $4.5B market, 97M SDK downloads, SMB niche EMPTY
- ✅ Pricing validated: simple MCP servers sell $4-15k (2-4 weeks), our turnkey = $300-500 beta
- ✅ LinkedIn profile set up, Gmail for cold email, Hebrew DM templates
- ✅ 6 GTM channels identified (all free): LinkedIn, YouTube, Email, Facebook, Reddit, Upwork
- 🔴 Upwork suspended (verification camera bug) Appeal pending

### 15.04 — MCP TOOL INJECTION SPRINT + TOTP + INSTALL.SH CLEANUP
- ✅ MCP Tool Injection v1: 11 tasks (smartOk, smartErr, checkBlock, session_handoff, contextual rules)
- ✅ MCP Injection v2 audit by Opus: 4 bugs + 3 arch issues found and fixed
- ✅ C1: TOTP first-run — 3 endpoints + admin page UI + test page
- ✅ C3: Bootstrap prompts — English, mega-tool syntax, no Ariel refs
- ✅ install.sh cleanup: rm ariel-workflow/, IDEAS/, CURSOR_PROMPTS.md + 6 clean memory templates
- ✅ Demo installed on demo.iamrunning.online — TOTP first-run works

---

## Week of 9-14 April 2026

### 14.04 — MEGA-TOOLS REFACTORING + AUDIT + IAM-CLIENT.SH
- ✅ 6 mega-tools (files, tasks, communication, goals, code_review, devops) replacing 20+ separate
- ✅ Granular rights: files.read, devops.deploy, etc.
- ✅ UI grouped checkboxes with sub-actions (Dashboard + Admin Team Tab)
- ✅ iam-client.sh written by Cursor (769 lines): 12 steps install, --update, rollback, healthcheck
- ✅ 285 commits pushed to GitHub

### 12-13.04 — STRATEGIC SESSION (Opus 4.6)
- ✅ 5 specs: RAG Federation, Operator Dashboard, Activity Log v2, install.sh, Architecture Docs
- ✅ Activity Log v2 implemented, docs/architecture 8 documents
- ✅ Data cleaned, landing updated, My Tasks + My PRs + Team PRs in Work System
- ✅ Decisions fixed: pricing, GitHub strategy, beta-tester approach

### 11.04 — FIRST LIVE TEST + GTM
- ✅ Test with uncle (developer) and brother (reviewer) confirmed workflow
- ✅ Deploy lock added to prevent parallel deploy crashes
- ✅ Product Tour, polling 15s->3s, PR diff for new files, push on PR comments

### 10.04 — Workspace Boundary + Source of Truth
- ✅ Dev Console file visibility: SYSTEM_CODE_DIRS hidden, workspace/ visible
- ✅ source-of-truth/ folder, WORKER_MECHANICS.md as workflow law
- ✅ Four global routers: tools-registry, permissions, notify, status

### 09.04 — Gemini AI Chat + Ollama Fix (iamrunner.ai)
- ✅ Dev Console AI Chat: Gemini agentic loop, tool calling, model selection
- ✅ Ollama default provider, tunnel auto-start

---

## Week of 7-8 April 2026
(Dev Console Phase 3, Documentation sprint, Scope fix)

## Week of 31 March - 6 April 2026
(Data layer refactor, Messaging V2, Security Sprint, Push Notifications, Reviewer Workflow)

## Week of 24-30 March 2026
(Team Workspace v1 created, install.sh first VPS test, MCP OAuth)

---

*Updated: 19.04.2026 17:40 UTC+3*
