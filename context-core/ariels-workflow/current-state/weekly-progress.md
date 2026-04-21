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
