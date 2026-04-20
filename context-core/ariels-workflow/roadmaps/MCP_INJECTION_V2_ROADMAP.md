# MCP Tool Injection v2 — Improvement Roadmap
## Based on full Opus audit of route.ts + all 6 mega-tools (15.04.2026)

---

## Findings Summary

The injection system works — every tool call gets `<internal>` blocks. But the audit revealed **4 bugs** (broken functionality), **3 architectural issues** (wrong design), and **5 quality improvements** (better behavior).

---

## 🔴 BUGS — broken functionality, fix first

### Bug 1: `update_session_notes` — ghost tool reference

**Problem:** Injection text in route.ts (lines 322, 335) tells AI to "call update_session_notes". This tool was removed during mega-tools refactor. It does NOT exist. AI tries to call it → fails → wastes calls.

**Where it appears:**
- `route.ts` line 322: `→ Right now: call update_session_notes with what has been done`
- `route.ts` line 335: `1. update_session_notes — record what's done, what remains, blockers`
- `bootstrap-prompts/developer.md` line 34
- `bootstrap-prompts/reviewer.md` line 40
- `bootstrap-prompts/admin.md` lines 39, 120
- `skills/iam-silent-execution/SKILL.md` line 56
- `skills/session-hygiene.md` line 11
- `skills/iam-project-instructions/SKILL.md` line 34
- `memory/workers/README.md` line 7

**Fix:**
1. In `route.ts` SESSION_EARLY_WARN message (line ~322): replace `call update_session_notes` with `call session_handoff (tasks action) with your completed items and next actions`
2. In `route.ts` SESSION_HARD_WARN message (line ~335): replace `1. update_session_notes — record...` with `1. Call tasks action session_handoff — saves state, next actions, and wisdom in one call`
3. Also remove line `2. patch_file("ariel-workflow/session-state.yaml")` from the HARD_WARN — session_handoff already does this
4. Search and replace in all bootstrap-prompts/*.md files
5. Search and replace in skills/*.md files

### Bug 2: `session_handoff` not in tools-registry

**Problem:** `session_handoff` exists in tasks-mega.ts (line 42-43) but is NOT registered in `lib/tools-registry.ts`. Sonnet hardcoded a bypass: `if (action === 'session_handoff') { ... }` before the `allowed.has(action)` check. This means:
- Workers' tools list doesn't include `tasks.session_handoff`
- Admin panel Team tab doesn't show this permission
- It bypasses the normal permission system

**Where:** `lib/tools-registry.ts` → `tasks.sub_actions` section (around line 67-73)

**Fix:**
1. Add `session_handoff` to `TOOL_REGISTRY.tasks.sub_actions`:
```typescript
session_handoff: { description: 'Save session state, next actions, wisdom before ending', defaultRoles: ['super_admin','admin','developer','marketer','reviewer'] }
```
2. Remove the hardcoded bypass in `tasks-mega.ts` (lines 42-43) — the `allowed.has()` check should now handle it naturally since all roles get this tool by default
3. Update `memory/TEAM_ROLES.md` — add `tasks.session_handoff` to Super Admin's tools list (other roles get it via ROLE_PRESETS automatically on next team save)

### Bug 3: Preset injection reads wrong data format

**Problem:** `set_preset` in devops-mega.ts writes: `presets[role.name.toLowerCase()] = { preset: "frontend", updatedAt: "..." }` at ROOT level of JSON.
But the file also has legacy data: `{ presets: { Steve: "frontend" } }` at NESTED level.
In `smartOk` (route.ts), preset is read: `presets[role.name.toLowerCase()]?.preset` — this works for the new format but NOT for legacy data.

**Where:** `route.ts` line ~289 (preset reading in smartOk), `devops-mega.ts` line ~88-92 (preset writing in set_preset)

**Fix:** Unify the format. Two options (pick one):

**Option A (recommended):** Fix the reader in route.ts to handle both formats:
```typescript
const data = JSON.parse(presetsRaw);
const workerPreset = data[role.name.toLowerCase()]?.preset   // new format
                  || data.presets?.[role.name]                // legacy format (value is string directly)
                  || data.presets?.[role.name.toLowerCase()]; // legacy lowercase
```

**Option B:** Fix the writer in devops-mega.ts to use nested format consistently:
```typescript
let data = { presets: {} };
try { data = JSON.parse(await readFile(presetsPath, 'utf-8')); } catch {}
if (!data.presets) data.presets = {};
data.presets[role.name] = preset; // string directly, not object
```

Also fix the redundant path: `join(DATA_DIR, '..', 'data', 'worker-presets.json')` → `join(DATA_DIR, 'worker-presets.json')` (DATA_DIR is already `/var/www/iam-os/data/`).

### Bug 4: `workspace` sub_actions are fake — all do the same thing

**Problem:** `communication-mega.ts` workspace action has 7 sub_actions (status, my_prs, take_task, message, ask_admin, update_notes, how_to) but ALL of them call `readRoleScopedMemory(role)` and return the same result. None actually perform different actions. AI thinks it has 7 different commands but they're all identical.

**Where:** `communication-mega.ts` lines 49-55

**Fix:** Either implement real sub-actions OR remove the fake enum. Recommended: simplify to just one action with no sub_actions, and add `session_handoff` reference in the description:
```typescript
if (action === 'workspace') {
  const memory = await readRoleScopedMemory(role);
  log('communication', { action }, 'ok');
  return smartOk(`[WORKSPACE]\n\n${memory}`, 'workspace');
}
```

Remove the `sub_action` parameter and the misleading "sub_action options" line in the response. The old `update_notes` functionality is now `session_handoff`.

---

## 🟡 ARCHITECTURE — wrong design, fix for quality

### Arch 1: Hardcoded `ariel-workflow/` paths in injection text

**Problem:** Every injection reference uses `ariel-workflow/session-state.yaml`, `ariel-workflow/next-actions.md`, etc. These paths exist only on Ariel's development server. For clients, session state should go to `memory/workers/{name}/`.

**Where:** All `<internal>` blocks in `route.ts` that reference `ariel-workflow/` — approximately 8 occurrences. Also `session_handoff` in `tasks-mega.ts` hardcodes `join(PROJECT_ROOT, 'ariel-workflow')`.

**Fix:**
1. Create a helper function `getWorkerDir(role)` in route.ts or shared.ts:
```typescript
function getWorkerDir(role: ResolvedRole): string {
  const workerDir = join(PROJECT_ROOT, 'memory', 'workers', role.name.toLowerCase());
  // Fallback to ariel-workflow/ if worker dir doesn't exist (dev server)
  if (!existsSync(workerDir) && existsSync(join(PROJECT_ROOT, 'ariel-workflow'))) {
    return 'ariel-workflow';
  }
  mkdirSync(workerDir, { recursive: true });
  return `memory/workers/${role.name.toLowerCase()}`;
}
```
2. Replace all hardcoded `ariel-workflow/` paths in injection text with the result of `getWorkerDir(role)`
3. Update `session_handoff` in tasks-mega.ts to use `getWorkerDir(role)` instead of hardcoded path
4. This also makes session_handoff work per-worker instead of everyone writing to the same Ariel file

### Arch 2: Multiple `<internal>` blocks per tool call

**Problem:** For a `write_file` call on a `.tsx` file with a frontend preset, the AI receives UP TO 4 separate `<internal>` blocks:
1. Tool-specific reminder (5 lines)
2. Contextual rules (1-3 lines)
3. Deploy rule (1 line) — only for deploy
4. Preset injection (5 lines)

Multiple blocks = more tokens + AI might miss later blocks.

**Where:** `route.ts` — the reminder block, contextual rules, and preset injection are all separate append operations.

**Fix:** Consolidate into ONE `<internal>` block per tool call. Build an array of all instruction lines, then wrap once:
```typescript
const instructions: string[] = [];

// Tool-specific
if (toolName === 'write_file' || toolName === 'patch_file') {
  instructions.push('1. git_snapshot with descriptive message');
  // ...
}

// Contextual rules
if (meta?.path && /api\/|components\//.test(meta.path)) {
  instructions.push('Rule: Backend ↔ Frontend parity');
}

// Preset
if (workerPreset === 'frontend' && isFrontend) {
  instructions.push('FRONTEND MODE: Use T theme object, no hardcoded colors');
}

// Wrap once
if (instructions.length > 0) {
  result += '\n\n<internal>\n' + instructions.join('\n') + '\n</internal>';
}
```

### Arch 3: `callCount` not incremented on blocked calls

**Problem:** `checkBlock` runs BEFORE `smartOk`. If a call is blocked, `smartOk` is never called, so `callCount` is never incremented. This means blocked calls don't count toward session total. After 10 blocked calls, the session counter still shows the same number — misleading.

**Where:** `route.ts` — `checkBlock` function (line ~362) vs `smartOk` function (line ~96 where callCount++)

**Fix:** Increment `callCount` inside `checkBlock` when returning a block:
```typescript
function checkBlock(toolName: string, meta?: { path?: string }): ToolResult | null {
  session.callCount++; // Count blocked calls too
  // ... rest of check logic
  return null; // null = not blocked, callCount already incremented
}
```
Then remove the `session.callCount++` from the top of `smartOk`. But be careful — calls that go through checkBlock AND smartOk should only increment once. Best approach: increment at the start of checkBlock, remove from smartOk.

Wait — checkBlock is called only for certain tools (write, patch, git_snapshot, deploy). For other tools (read, list, search), checkBlock is never called, so smartOk must still increment. Better approach:

Add a `preCall()` method that always runs before any tool handler:
```typescript
function preCall(): void { session.callCount++; }
```
Call it at the start of each mega-tool handler, remove increment from both smartOk and checkBlock.

OR simpler: increment in checkBlock for blocked calls only:
```typescript
if (blocked) { session.callCount++; return smartErr(...); }
```

---

## 🟢 IMPROVEMENTS — better behavior, after bugs are fixed

### Improve 1: Adaptive verbosity by session phase

**Problem:** Every call gets full-length injection (~80 tokens). Over 80 calls that's 6400 tokens of overhead.

**Where:** `route.ts` — all `<internal>` block construction

**Fix:** Add session phase logic:
```typescript
const phase = session.callCount <= 10 ? 'start' : session.callCount <= 50 ? 'mid' : 'end';
```

- `start` (calls 1-10): Full instructions (current behavior)
- `mid` (calls 11-50): Abbreviated — one line per reminder instead of 5
- `end` (calls 51+): Only critical reminders (git_snapshot, session state)

Example for write_file at `mid` phase:
```
<internal>git_snapshot required. Read before write.</internal>
```
vs current `start` phase (5 lines).

### Improve 2: Task focus injection

**Problem:** AI knows about its current task (shown in preamble) but gets no behavioral guidance about it.

**Where:** `route.ts` — `smartOk` function, after preamble

**Fix:** If `getCurrentTask()` returns a task, add to write_file/patch_file injection:
```
Current task: "{task title}". Stay focused — one PR = one task. Don't refactor unrelated code.
```

### Improve 3: Escalating git_snapshot pressure

**Problem:** Binary escalation — nothing until 3 writes, then immediate BLOCK. No gradient.

**Where:** `route.ts` — escalation warning (line ~142) and checkBlock

**Fix:** Add graduated warnings:
- After 1 write without snapshot: (nothing — this is normal)
- After 2 writes without snapshot: Soft reminder: `"Note: 2 writes without git_snapshot. Consider committing soon."`
- After 3 writes: Current BLOCK behavior

### Improve 4: Role-specific injection text

**Problem:** Developer and reviewer get identical `read_file` instructions.

**Where:** `route.ts` — toolName checks in reminderBlock construction

**Fix:** Check `role.role` and vary text:
- Developer read_file: "Read before write. Understand file structure. If >500 lines → patch."
- Reviewer read_file: "Check if changes match architecture. Note any pattern violations for review."
- Admin read_file: "Check team member's work. Verify capability gates and security."

### Improve 5: `session_handoff` should replace `update_session_notes` everywhere

**Problem:** Even after fixing the ghost reference (Bug 1), the concept of "session_handoff" needs to be evangelized. Bootstrap prompts, skills, and docs all need updating.

**Where:** All bootstrap-prompts/*.md, all skills/*.md, memory/workers/README.md

**Fix:** Global search-and-replace `update_session_notes` → `session_handoff (tasks action)` in all files. Also update the description text to explain it's one command that does everything.

---

## Implementation Order for Sonnet

### Session 1: Fix bugs (4 tasks)
1. **Bug 1:** Replace all `update_session_notes` references in route.ts injection text → `session_handoff`
2. **Bug 2:** Register `session_handoff` in tools-registry.ts + remove bypass in tasks-mega.ts + update TEAM_ROLES.md
3. **Bug 3:** Fix preset reading in route.ts to handle both data formats + fix redundant path
4. **Bug 4:** Simplify `workspace` action — remove fake sub_actions
5. git_snapshot → deploy → verify

### Session 2: Architecture fixes (3 tasks)
1. **Arch 1:** Create `getWorkerDir(role)` helper, replace hardcoded `ariel-workflow/` paths in injection text AND in session_handoff
2. **Arch 2:** Consolidate multiple `<internal>` blocks into single block per tool call
3. **Arch 3:** Fix callCount increment — blocked calls should count toward session total
4. git_snapshot → deploy → verify

### Session 3: Quality improvements (5 tasks)
1. **Improve 1:** Adaptive verbosity (start/mid/end phases)
2. **Improve 2:** Task focus injection in write_file/patch_file
3. **Improve 3:** Graduated git_snapshot pressure (2 writes = soft warning)
4. **Improve 4:** Role-specific read_file injection text
5. **Improve 5:** Replace `update_session_notes` in bootstrap-prompts/*.md and skills/*.md
6. git_snapshot → deploy → verify

---

## Files affected

| File | Changes |
|------|---------|
| `app/api/mcp/route.ts` | Bug 1, Bug 3, Arch 2, Arch 3, Improve 1-4 |
| `app/api/mcp/lib/tools/tasks-mega.ts` | Bug 2 (remove bypass), Arch 1 (dynamic paths) |
| `app/api/mcp/lib/tools/communication-mega.ts` | Bug 4 (simplify workspace) |
| `app/api/mcp/lib/tools/devops-mega.ts` | Bug 3 option B (if chosen) |
| `app/api/mcp/lib/shared.ts` | Arch 1 (getWorkerDir helper) |
| `lib/tools-registry.ts` | Bug 2 (add session_handoff) |
| `memory/TEAM_ROLES.md` | Bug 2 (add tasks.session_handoff to tools) |
| `bootstrap-prompts/*.md` | Bug 1, Improve 5 |
| `skills/*.md` | Bug 1, Improve 5 |
| `memory/workers/README.md` | Bug 1 |

## Constraints

- Do NOT change tool logic — only fix broken references, data formats, and injection text
- All instruction text in English, inside `<internal>` tags
- TypeScript build must pass after every task
- git_snapshot after each completed task
- Read file before patching — never patch from memory
- For Bug 3, use Option A (fix reader) unless stated otherwise

---

*v1 — 15.04.2026, Opus audit of route.ts + 6 mega-tools*
