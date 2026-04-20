# MCP Tool Injection Roadmap — For Sonnet Executor
## v3 — updated after full Opus audit of all ariel-workflow + IDEAS + route.ts (15.04.2026)

---

## Context

Every MCP tool response passes through `smartOk()` in `app/api/mcp/route.ts`. This appends text to tool results. AI reads it as context and follows instructions ~80% of the time.

**IMPORTANT:** A significant amount of infrastructure already exists in route.ts:
- Compliance tracking (write_without_snapshot, escalation_triggered, wisdom tracking)
- Two-level session warnings (early at 40, hard at SESSION_WARN_THRESHOLD)
- Blocking escalation after 3 writes without git_snapshot
- Per-tool reminders for write_file, patch_file, git_snapshot, deploy, create_pr
- compliance.jsonl logging

This roadmap UPGRADES and EXTENDS the existing system. Do NOT rewrite from scratch. Read route.ts first, understand what exists, then modify.

## Files to read BEFORE starting any task

```
read_file("app/api/mcp/route.ts")          ← CURRENT implementation, read FIRST
read_file("app/api/mcp/lib/shared.ts")      ← ok(), err(), types, SessionState interface
read_file("app/api/mcp/lib/tools/files-mega.ts")    ← where write_file/patch_file/read_file live
read_file("app/api/mcp/lib/tools/devops-mega.ts")   ← where deploy/git_snapshot live
read_file("app/api/mcp/lib/tools/tasks-mega.ts")    ← where onboard/read_memory live
read_file("IDEAS/docs/IMPLEMENTATION_RULES.md")
read_file("IDEAS/specs/PERSISTENT_MEMORY_ARCHITECTURE.md")
read_file("ariel-workflow/roadmap.md")
```

---

## Session Plan for Sonnet

This roadmap is designed for 2–3 Sonnet sessions. Each session = ~60-70 tool calls.

**Session 1:** Tasks 0–4 (audit + translate + timestamp + limit + smartErr)
**Session 2:** Tasks 5–7 (per-tool injection rewrite + presets + hard redirect)
**Session 3:** Tasks 8–10 (session_handoff + stats + contextual rules + verification)

At the end of each session: git_snapshot → deploy → verify build → update session state.

---

## Task 0: Audit existing implementation ⚡ DO THIS FIRST

**Why:** route.ts already has partial implementation. You must understand what exists before changing anything.

**Steps:**
1. Read `app/api/mcp/route.ts` — find smartOk, all injection text, compliance tracking, escalation logic
2. Read `app/api/mcp/lib/shared.ts` — find SessionState interface, ok(), err() functions
3. Read mega-tool files to understand which tools exist and their names
4. List what ALREADY works (don't break it):
   - `session.callsSinceWrite` tracking + escalation at >= 3
   - `session.wisdomUpdatedAt` tracking
   - `compliance.jsonl` logging
   - Two-level warnings (SESSION_EARLY_WARN=40, SESSION_HARD_WARN=60)
   - Per-tool reminders for write_file, patch_file, git_snapshot, deploy, create_pr
5. Note what's MISSING (this is what you'll build)

**Output:** Mental model of current state. No file changes.

---

## Task 1: Translate all existing Russian text to English

**Why:** Claude and ChatGPT follow English instructions significantly better. All existing injection text in route.ts is in Russian.

**What to translate:**
1. All text in smartOk reminders (`<internal>` blocks)
2. SESSION_EARLY_WARN message (currently: "СЕССИЯ ДОСТИГЛА...")
3. SESSION_HARD_WARN message (currently: "СЕССИЯ: N/60 ВЫЗОВОВ — пора завершать...")
4. Escalation message (currently: "BLOCKING: git_snapshot обязателен...")
5. Any other Russian text in route.ts

**Rules:**
- Keep `<internal>` tag format
- Keep meaning identical — only change language
- Keep emoji markers (⛔, ⚠️, 📋)

**Do NOT change any logic — only text strings.**

---

## Task 2: Timestamp in smartOk preamble

**Current:**
```
[ROLE: developer | SESSION: 5/60 | TASK: Fix hero]
```

**New:**
```
[ROLE: developer | SESSION: 5/80 | 2026-04-15 11:34 UTC+3 | TASK: Fix hero]
```

Add server time to preamble string in smartOk. Use `new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jerusalem', hour12: false })` or similar for Israel timezone.

One line change inside smartOk function.

---

## Task 3: Session limit → 80

**Changes:**
1. Find `SESSION_WARN_THRESHOLD` in `lib/data/` (or wherever it's defined) → change from 60 to 80
2. Change `SESSION_EARLY_WARN` in route.ts from 40 to 50
3. Add new constant: `SESSION_SOFT_LIMIT = 72` (90% of 80) — used in Task 7 for blocking
4. Update all warning text to reflect new numbers

**Verify:** grep for any hardcoded "60" in route.ts or shared.ts related to session limits.

---

## Task 4: smartErr — error recovery system

**Create** `smartErr(msg: string, toolName: string, params?: Record<string, unknown>): ToolResult` alongside smartOk.

Every error response gets context-appropriate recovery hints.

**Per-tool error hints:**

| Tool | Error pattern | Recovery hint |
|------|--------------|---------------|
| patch_file | "text not found" / "not unique" | "Read the file first with read_file. Find the exact unique string. Include more surrounding context. Then retry." |
| write_file | permission / EACCES | "This path may be protected. Check if it's in RULES.md locked paths. Use create_pr if needed." |
| read_file | ENOENT / not found | "File not found. Use list_directory to check the correct path. File may have been moved or renamed." |
| deploy | any failure | "Read logs/deploy.jsonl last entry. Look for TypeScript or build error. Fix the source file first. Then run: rm -rf .next && retry deploy." |
| git_snapshot | nothing to commit | "No changes detected. This is normal if files were already committed. Proceed with your next action." |
| create_pr | duplicate / exists | "A PR with similar content may already exist. Check pull-pool/ directory first." |
| **any tool** | **unknown error** | **"Unexpected error. Read the error message carefully. Try a different approach. If stuck, describe the problem to the user and ask for guidance."** |

**Also:** Log every error to `logs/errors.jsonl`:
```json
{"ts":"...","user":"...","tool":"patch_file","error":"text not found","params_summary":"path: app/page.tsx","session_id":"..."}
```

**Implementation:** In each mega-tool file, where errors are returned via `err()`, replace with `smartErr()`. Or: create smartErr in route.ts/shared.ts and pass it through ToolContext alongside smartOk.

---

## Task 5: Per-tool behavioral instructions — FULL REWRITE

**This is the biggest task.** Rewrite ALL injection text in smartOk.

Format for ALL injections — English only:
```
<internal>
[instructions — execute silently, never narrate to user]
</internal>
```

### write_file / patch_file — EVERY call:
```
<internal>
1. git_snapshot with descriptive message: "feat/fix/docs: what changed"
2. If this changes project structure → note in memory/shared/new-files-log.md
3. If SESSION >= 50 → also update ariel-workflow/session-state.yaml with progress
4. Rule: read file before patching — never patch from memory
5. Rule: files > 500 lines → use patch_file, not write_file
</internal>
```

### git_snapshot — EVERY call:
```
<internal>
1. Update ariel-workflow/session-state.yaml → add to completed_this_session
2. If ready to deploy → proceed with deploy
3. If SESSION >= 50 → update ariel-workflow/next-actions.md with current progress
</internal>
```

### deploy — EVERY call:
```
<internal>
1. Wait ~60 seconds, then check logs/deploy.jsonl for result
2. Update ariel-workflow/session-state.yaml → add deployed item
3. If build failed → read error from logs, diagnose, fix source file, rm -rf .next, retry
4. If SESSION >= 50 → update all workflow files before next action
</internal>
```

### read_file / list_directory — EVERY call:
```
<internal>
1. Read before write. Understand file structure before changing.
2. If file > 500 lines → use patch_file for edits, not write_file
3. If you see undocumented files in project → note for architecture update
</internal>
```

### search_files — EVERY call:
```
<internal>
1. Check ALL call sites before modifying any function
2. Do not patch from memory — verify with search or read first
</internal>
```

### create_pr — EVERY call:
```
<internal>
1. Verify PR was created: check pull-pool/ directory
2. If this closes a task → update task status
3. Update ariel-workflow/session-state.yaml with PR info
</internal>
```

### onboard / read_memory (first call of session):
```
<internal>
SESSION START PROTOCOL:
1. Read ariel-workflow/session-state.yaml → understand where we left off
2. Read ariel-workflow/next-actions.md → current priorities
3. Read ariel-workflow/current-goal.md → position on roadmap
4. Summarize: current focus, last session progress, what to do now
5. Ask user: "Continue with [next action]? Or different priority?"

IMPLEMENTATION RULES (always active):
- Backend ↔ Frontend parity: every API action must have a UI element
- Capability gating through lib/permissions.ts only
- "No access = doesn't exist" — hidden, not disabled
- Read file before patching — never patch from memory
- One commit = one task
- No type casts — add to interface
- Deploy requires fresh git_snapshot (< 5 min old)
</internal>
```

### Important: memory paths

**Current paths** (use these NOW — do not change):
- `ariel-workflow/session-state.yaml`
- `ariel-workflow/next-actions.md`
- `ariel-workflow/current-goal.md`
- `ariel-workflow/weekly-progress.md`

**Future paths** (after persistent memory migration — separate task, NOT in this sprint):
- `memory/workers/{name}/{name}-session-state.yaml`

**Do NOT reference `memory/SESSION_STATE.yaml` in injections** — that path doesn't exist yet. Use `ariel-workflow/` paths.

---

## Task 6: Preset injection (frontend/backend modes)

### Architecture problem:
smartOk receives `(text, toolName)` but NOT the file path being modified. To inject frontend/backend preset rules, we need the path.

### Solution:
1. Extend smartOk signature: `smartOk(text: string, toolName?: string, meta?: { path?: string })`
2. In mega-tool handlers (files-mega.ts), pass the path: `ctx.smartOk(result, 'write_file', { path })`
3. In smartOk, read `data/worker-presets.json` and check if current worker has active preset
4. If preset active AND path matches (components/ → frontend, api/ or lib/ → backend), append preset rules

### Preset injection text:

**Frontend preset** (when path contains `components/`, `app/dashboard/`, `app/admin/`):
```
<internal>
FRONTEND MODE ACTIVE:
- Use T theme object for all colors — no hardcoded hex values
- useCallback for all event handlers
- Always show loading states for async operations
- Dark mode required: isDark from context, T object for theming
- Hover: onMouseEnter → isDark ? '#1a1a1a' : '#f5f5f5'
</internal>
```

**Backend preset** (when path contains `api/`, `lib/`, `scripts/`):
```
<internal>
BACKEND MODE ACTIVE:
- AUDIT FIRST: read_file before any change, search_files for all call sites
- Data access ONLY through lib/data/ modules
- withFileLock() for ALL concurrent file writes
- safePath() on ALL user-provided paths
- Check lib/permissions.ts for capability gates
</internal>
```

### If worker-presets.json doesn't exist or worker has no preset → skip injection.

---

## Task 7: Hard redirect — BLOCKING enforcement

Upgrade existing escalation in route.ts to true blocking (tool NOT executed, error returned).

**IMPORTANT:** Block point 1 (writes without snapshot) already partially exists as a WARNING. Convert it to a true BLOCK.

### Block point 1: 3+ writes without git_snapshot
```typescript
// BEFORE smartOk — check BEFORE executing tool
if ((toolName === 'write_file' || toolName === 'patch_file') && session.callsSinceWrite >= 3 && session.lastWriteAt > 0) {
  return smartErr(
    '⛔ BLOCKED: git_snapshot required.\n' +
    'You have ' + session.callsSinceWrite + ' file changes without snapshot.\n' +
    'Call git_snapshot("description of changes") before any other write action.',
    toolName
  );
  // Tool NOT executed — return immediately
}
```

### Block point 2: SESSION >= 90% (72/80) without session state update
```typescript
const SESSION_SOFT_LIMIT = 72; // 90% of 80
if (session.callCount >= SESSION_SOFT_LIMIT && !session.sessionStateUpdated) {
  // Allow ONLY: write_file/patch_file on ariel-workflow/ paths, git_snapshot
  const isWorkflowUpdate = (toolName === 'write_file' || toolName === 'patch_file') && meta?.path?.startsWith('ariel-workflow/');
  const isSnapshot = toolName === 'git_snapshot';
  if (!isWorkflowUpdate && !isSnapshot) {
    return smartErr(
      '⛔ BLOCKED: Session state update required.\n' +
      'SESSION at ' + session.callCount + '/80. You must update ariel-workflow/session-state.yaml before continuing.\n' +
      'Use patch_file on ariel-workflow/session-state.yaml, then retry your action.',
      toolName
    );
  }
}
```

**Requires:** Add `sessionStateUpdated: boolean` to SessionState interface in shared.ts. Set to `true` when write_file/patch_file targets `ariel-workflow/session-state.yaml` (or future `memory/workers/` path).

### Block point 3: SESSION >= 100% (80/80) — absolute limit
```typescript
if (session.callCount >= SESSION_HARD_WARN) {
  const allowedTools = ['git_snapshot'];
  const isWorkflowWrite = (toolName === 'write_file' || toolName === 'patch_file') && meta?.path?.startsWith('ariel-workflow/');
  if (!allowedTools.includes(toolName) && !isWorkflowWrite) {
    return smartErr(
      '⛔ SESSION LIMIT REACHED (' + session.callCount + '/80).\n' +
      'Only session-end actions allowed: update ariel-workflow/ files, git_snapshot.\n' +
      'Tell the user to start a new chat. Call onboard in the new session to continue.',
      toolName
    );
  }
}
```

### Implementation note:
Block points must execute BEFORE the tool handler runs. Currently smartOk runs AFTER tool execution. You need to add pre-execution checks. Options:
- Add a `preCheck(toolName, meta)` function called before tool handler
- Or wrap tool handlers with a guard in each mega-tool registration

Choose the cleanest approach. The key: blocked tool = NOT executed, error returned.

---

## Task 8: session_handoff MCP action

**Why:** Currently, session-end requires 3+ separate patch_file calls. This is unreliable — AI skips steps. One command should do everything.

**Create** a new MCP action `session_handoff` in tasks-mega.ts (or communication-mega.ts):

**Input:**
```json
{
  "action": "session_handoff",
  "completed": ["list of what was done"],
  "next_actions": ["list of what to do next"],
  "current_focus": "what was being worked on",
  "blockers": ["optional list of blockers"],
  "wisdom": "optional insight from this session"
}
```

**What it does:**
1. Reads current `ariel-workflow/session-state.yaml`
2. Archives it to `ariel-workflow/legacy/YYYY-MM-DD-HH-session-state.yaml`
3. Writes new `ariel-workflow/session-state.yaml` with provided data
4. Updates `ariel-workflow/next-actions.md` — moves completed items to Done, adds new items
5. If `wisdom` provided → appends to `memory/wisdom/SESSION_INSIGHTS.md`
6. Sets `session.sessionStateUpdated = true`
7. Returns summary of what was saved

**Injection for session_handoff:**
```
<internal>
Session state saved successfully. Now:
1. Call git_snapshot("docs: session handoff")
2. Tell the user: "Session state saved. Start a new chat and call onboard to continue."
</internal>
```

---

## Task 9: Session-stats.jsonl

Log at session end (triggered by session_handoff or timeout 30min):
```json
{
  "ts": "2026-04-15T14:30:00+03:00",
  "user": "ariel",
  "role": "super_admin",
  "session_id": "sess-abc123",
  "tool_calls": 47,
  "writes": 12,
  "snapshots": 3,
  "deploys": 1,
  "errors": 2,
  "escalations_triggered": 1,
  "blocks_triggered": 0,
  "duration_min": 45,
  "wisdom_updated": true,
  "session_state_updated": true,
  "preset": "backend",
  "compliance_score": 0.85
}
```

**compliance_score** = simple metric: (snapshots_after_writes / total_writes). Track this over time.

Write to `logs/session-stats.jsonl`.

After 10-20 sessions → analyze compliance_score trend, calibrate limits.

---

## Task 10: Contextual implementation rules

Instead of injecting all 10 rules in onboard/read_memory, inject 1-2 RELEVANT rules per tool:

| Rule | Inject in |
|------|-----------|
| Rule 1 (backend↔frontend parity) | write_file when path contains `api/` or `components/` |
| Rule 2 (capability gating via permissions.ts) | write_file when path contains `permissions` or `capabilities` |
| Rule 3 (no access = hidden) | write_file when path contains `components/` |
| Rule 4 (read before patch) | patch_file and write_file — already in Task 5 |
| Rule 5 (one commit = one task) | git_snapshot |
| Rule 6 (no type casts) | write_file when path contains `.ts` or `.tsx` |
| Rule 7 (cut & paste refactoring) | Only in onboard for refactoring tasks |
| Rule 9 (deploy requires snapshot) | deploy |
| Full 10 rules | Only in onboard/read_memory |

**Implementation:** In smartOk, after basic tool injection, check `meta.path` and append 1-2 relevant rules from a rules map.

---

## Implementation order for Sonnet

### Session 1 (Tasks 0–4):
1. **Task 0:** Read all files, understand current implementation
2. **Task 1:** Translate all Russian text to English
3. **Task 2:** Add timestamp to preamble
4. **Task 3:** Change session limit to 80, early warn to 50, add SOFT_LIMIT=72
5. **Task 4:** Create smartErr with per-tool recovery hints + errors.jsonl
6. git_snapshot → deploy → verify build

### Session 2 (Tasks 5–7):
1. **Task 5:** Rewrite all per-tool behavioral instructions (English, `<internal>` tags)
2. **Task 6:** Preset injection (extend smartOk signature, read worker-presets.json)
3. **Task 7:** Hard redirect — 3 block points (pre-execution checks)
4. git_snapshot → deploy → verify build

### Session 3 (Tasks 8–10):
1. **Task 8:** session_handoff MCP action
2. **Task 9:** Session-stats.jsonl logging
3. **Task 10:** Contextual implementation rules
4. Full end-to-end test: onboard → write_file → git_snapshot → deploy → session_handoff
5. git_snapshot → deploy → verify build

---

## Constraints

- Do NOT rewrite route.ts from scratch — modify existing code
- Do NOT change tool logic — only TEXT in responses and BLOCKING conditions
- All instruction text inside `<internal>` tags, English only
- Keep instructions concise — long text wastes AI context window
- Test that build passes after every task (TypeScript compilation)
- Memory paths: use `ariel-workflow/` for now. `memory/workers/` migration is a SEPARATE future task
- One MCP connector per chat (lego-base only)
- git_snapshot after each completed task

## ChatGPT / Gemini compatibility note

Current instructions are optimized for Claude. `<internal>` tags and "execute silently" work well with Claude (~80% compliance). For ChatGPT/Gemini, compliance may differ. After this sprint, test with ChatGPT MCP connector and adjust wording if needed. This is tracked as a separate task (H5 in roadmap.md), NOT part of this sprint.

---

*v3 — 15.04.2026, after full Opus audit of all documents + route.ts*
*Changes from v2: added Task 0 (audit), Task 1 (translate), Task 8 (session_handoff), Task 6 (presets with architecture solution), fixed memory paths, added session plan, added compliance_score metric, added generic error fallback, clarified existing implementation*
