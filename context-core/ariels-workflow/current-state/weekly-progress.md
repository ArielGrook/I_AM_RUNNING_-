# Weekly Progress

## Week of 14–20 April 2026

### 15.04 Tuesday (night after bagrut)
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

**Morning (Sonnet executor):**
- 6 mega-tools refactor (files, tasks, communication, goals, code_review, devops)
- iam. prefix everywhere (/iam.admin, PM2 iam.{name})
- Opus audit: pr-approve-deploy + dev-git-snapshot routing bugs fixed
- /api/push/test removed (was unauthenticated)
- 1494 lines dead code deleted
- Docs updated (MCP_API, PR_TASKS, MEGA_TOOLS)

**Afternoon (Sonnet + Cursor):**
- iam-client.sh written (769 lines)
- iam-backup.sh written
- Operator API created (/api/operator)
- --no-landing flag (server-side redirect)
- Tested on both servers — 12/12 pass
- 12 bugs found and fixed during testing
- TOTP label: "I AM RUNNING" → "IAM Client OS"

**Evening (this Opus session):**
- Dev Console inverted file tree: deployed + bug-fixed on live test
- Cookie secure bug: found NODE_ENV hardcode, fixed to COOKIE_SECURE env var
- Symlink, SYSTEM_CODE filtering, devConsoleHiddenPaths — all fixed
- All fixes synced lego-base → GitHub → iamrunning
- IDEAS/ organized: 29 files → 7 categories
- Persistent memory architecture brainstorm (DRAFT spec)
- ariel-workflow/ personal system created
- MCP tool injection discovered as key behavior control mechanism
