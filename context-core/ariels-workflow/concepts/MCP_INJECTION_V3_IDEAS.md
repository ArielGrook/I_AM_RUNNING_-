# MCP Injection V3 — Ideas

*Concept draft, 2026-04-21. Author: Ariel + Claude Opus 4.7.*
*Status: exploratory. Not ready for spec. To be promoted to `specifications/MCP_INJECTION_V3_SPEC.md` after Step 4 of migration completes (MCP code lives on iamrunning.online then, not lego-base).*
*Related: `../memory/wisdom/SESSION_INSIGHTS.md` 2026-04-10 entry "Tool response injection as a memory mechanism".*

---

## Problem statement

Current state (V2, deployed 2026-04-15 in IAM Client OS):

- `smartOk()` — post-execution injection on every tool response
- `smartErr()` — error-recovery injection
- `checkBlock()` — 3 pre-execution hard blocks (writes without snapshot, session state violations, absolute limit)
- Preset injection — frontend/backend mode, path-aware
- `session_handoff` — MCP action for session-end ritual

This works. Compliance is up, chats stay on-protocol longer, session counter is respected. But there are still gaps observed in daily use, and — critically — **none of this exists on the `iamrunning.online` MCP connector yet.** Iamrunning's MCP endpoint is older code without injection infrastructure. Every chat started on iamrunning essentially drifts from turn 1.

## The specific gaps Ariel observed

1. **Tools that feel missing.** In some task categories, the available tool set is incomplete — you can read a file but you can't find-and-replace across files, you can deploy but you can't view deploy history easily, etc. The mega-tool groups were a good first cut but the sub-action surface is still gappy.

2. **Injection lands uneven.** Post-execution hints don't always match what the tool actually did. Pre-execution blocks miss some cases (e.g., a stale `read_file` result being used to justify a `patch_file` that shouldn't happen).

3. **No `iamrunning.online` injection at all.** Because injection V2 was built inside IAM Client OS, it's not applied when a chat is connected to `iamrunning`. Every iamrunning chat starts with zero behavioral guardrails. `CLAUDE_INSTRUCTION.md` tries to serve that purpose but it's a text file the AI may or may not read, not a tool-level guarantee.

4. **First-call context is fragile.** Even when the first prompt is well-written (`SUCCESS_CHAT_PATTERNS.md` + `FIRST_PROMPT_SCHEMA.md`), the AI might still call a random tool first if the prompt is slightly off. There is no server-side enforcement that the first call does something useful.

## Core idea — two-layer context: prompt-layer + system-layer

Current world: context is established in the **prompt layer** only. First prompt tells the AI what to read. Result depends entirely on how good the prompt is.

New world: context is also established in the **system layer** — the MCP server itself. Even if the prompt is bad or the AI ignores it, the server guarantees that the AI has project context before it can do anything meaningful.

### Mechanism: forced first-call redirect

On a new session (detected by: session ID is new, or `session_calls_count == 0`), **the very first tool call — whatever it is — is intercepted**. Instead of executing what the AI requested, the server returns:

> "Session start detected. Before executing tools, load project context. Call `read_file` on `context-core/ariels-workflow/current-state/README.md`, then proceed with your original request. This redirect is one-time per session."

The AI then reads the file, gets the context, and resumes. The redirect is idempotent for this session but fires fresh every session.

**Effect:** the prompt-layer attractor and the system-layer attractor align. Even a garbage first prompt can't skip context loading.

### Variation — forced anchor set

Instead of one file, the redirect can list 2-3 files (README + session-state + current PLATFORM_REFACTORING if active). Server decides based on platform state (active migration = PLATFORM_REFACTORING included; steady-state = just README + session-state).

### Variation — warn-vs-force

Two modes:
- **Warn:** first-call response includes injection saying "you haven't read context yet, consider doing so." Soft.
- **Force:** first-call response *refuses* the requested tool, returns only "read these files first, call me again when done." Hard.

Force is probably what we want. Warn is what V2 does de facto and it's not enough.

## Other improvements while we're in there

### Stricter injections

- Every `write_file` and `patch_file` response includes **diff summary** (before/after line counts, number of changes). Forces the AI to acknowledge scope of its own change.
- Every `deploy` response includes **deploy freshness check** (warn if previous deploy was < 60 seconds ago — likely a mistake).
- Every `git_snapshot` response includes the **full commit message back**. AI sees what it actually committed, not what it thinks it committed.

### Tools that are currently missing

To be collected as an explicit list during the spec phase. Initial candidates from daily use:
- Cross-file find-and-replace (current: manual per-file)
- `read_file` with line range at top + tail automatically (not full file)
- `git_log` with path filter (what changed in this specific file recently)
- Deploy log streaming (current: file-based jsonl, requires polling)
- Directory tree with depth control as a single call (current: recursion via multiple calls)

### Registry-driven tool list

Currently mega-tools hardcode their sub-action list. `ALL_TOOLS` fix on 2026-04-19 addressed super_admin token scope but the pattern still exists elsewhere (hardcoded capability arrays in 3-4 handlers). V3 should have a single `TOOL_REGISTRY` that every other piece of the system reads from, never duplicates.

### Sub-action hints

When an AI calls a mega-tool with wrong sub-action name, the error should list valid sub-actions with one-line descriptions. Current error is "unknown action" — useless.

## Two-layer context — theoretical point

The prompt-layer sets the goal. The system-layer sets the constraints. Together they form a pincer:

- Prompt says: "do X."
- System says: "before X, satisfy preconditions Y."

When they agree, the AI flies straight. When the prompt is bad, system catches the fall. When the system has a gap, the prompt compensates. Both layers failing simultaneously is the only way the AI goes off-rails — and that's a much narrower failure surface than either layer alone.

This pattern appears in other systems — DB constraints + application validation, type system + runtime checks — and it works there for the same reason. Defense in depth.

## Sequencing

1. **Not before Step 4 of migration.** Touching MCP on lego-base is wasted work; it's being decommissioned. Wait until MCP code lives on iamrunning and we control it here.
2. **Spec first, code second.** Write `specifications/MCP_INJECTION_V3_SPEC.md` covering all sections of this doc with concrete API shapes and failure modes. Only after spec review → implement.
3. **Implement on `iamrunning` MCP first** (it currently has *nothing*, so the delta is biggest). Backport to `iamrunning.ai` MCP after.
4. **Dogfood for a week.** Actual session compliance metrics (read `session-stats.jsonl`), not self-report.

## Non-goals

- **Not** trying to prevent the AI from being helpful. Injections shape behavior; they don't replace judgment.
- **Not** adding a RAG layer at this stage. First-call redirect to a single file is enough; RAG on context-core/ is a separate future improvement (tied to the fine-tune dataset track in `../legacy_future_dataset/fine-tune-ideas/`).
- **Not** rewriting the 6 mega-tool architecture. Groups are the right shape. V3 polishes them, doesn't replace them.

## Open questions

- Is forced-redirect compatible with Claude's retry-on-error behavior? (If retry is automatic, the AI might loop on "read context first" → retry → "read context first" without ever actually reading.)
- How does the server detect "session start" reliably? MCP sessions don't have an explicit start message. Heuristic: if we haven't seen this client for > 30 min, treat next call as session start.
- What happens if the AI tries to read a *different* file as its "first action" (not the one we asked for)? Accept? Reject?
- How verbose should first-call redirect response be? Too short → AI might ignore. Too long → token cost on every session.

---

*Next action: wait for Step 4 of migration to complete. Then promote this doc to `specifications/MCP_INJECTION_V3_SPEC.md`, flesh out API shapes and failure modes, review with Ariel, and queue as Cursor work.*
