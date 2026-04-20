# Memory & Instructions in Settings — Roadmap for Sonnet

## Context

Dashboard Setup tab already has collapsible Claude Instructions and Claude Memory sections — but they reference OLD tool names (pre mega-tools refactor). Admin Settings tab has Skills but no Instructions/Memory.

## Task 1: Fix Dashboard claudeInstructions — mega-tool syntax

File: `app/dashboard/components/DashboardSetupTab.tsx`

The `claudeInstructions` object (around line 61) contains per-role instruction text. ALL roles reference old tools.

### Replace these tool references in ALL roles:

| Old | New |
|-----|-----|
| `read_memory` | `tasks action read_memory` |
| `my_workspace(action: "status")` | `communication action workspace` |
| `my_workspace(action: "update_notes")` | `tasks action session_handoff` |
| `my_workspace(action: "ask_admin")` | `communication action send_message` |
| `onboard` | `communication action onboard` |
| `create_task({...})` | `tasks action create assignee="..." title="..."` |
| `create_pr({...})` | `code_review action create_pr target_file="..." content="..."` |
| `git_snapshot` | `devops action git_snapshot message="..."` |
| `deploy` | `devops action deploy` |
| `set_preset("backend")` | `devops action set_preset preset="backend"` |
| `reviewer_approve_pr({...})` | `code_review action reviewer_approve prId="..."` |
| `reviewer_request_changes({...})` | `code_review action reviewer_request_changes prId="..."` |
| `list_goals` | `goals action list` |
| `manage_goals` | `goals action manage` |
| `update_doc` | `code_review action update_doc` |

Also fix the session end instructions:
- OLD: `my_workspace(action: "update_notes")` 
- NEW: `tasks action session_handoff` (with completed, next_actions, wisdom params)

Also remove reference to "Ariel" in super_admin instructions and `IDEAS/main_workflow/ARIEL_WORKFLOW.md` from memory files.

Also update the language line — remove "Russian for chat" since this is now generic for any client:
- OLD: `Language: Russian for chat, English for code.`
- NEW: `Language: Use the client's preferred language for chat, English for code and file names.`

## Task 2: Fix Dashboard claudeMemoryFiles

Same file. The `claudeMemoryFiles` object (around line 117) lists files per role.

For `super_admin`, remove:
```
{ path: 'IDEAS/main_workflow/ARIEL_WORKFLOW.md', desc: "Ariel's personal workflow" }
```

For all roles, keep the existing files but verify paths are correct:
- `memory/ARCHITECTURE.md` ✅
- `memory/TEAM_ROLES.md` ✅
- `memory/CURRENT_GOAL.md` ✅
- `memory/NEXT_ACTIONS.md` ✅
- `memory/RULES.md` ✅
- `source-of-truth/WORKER_MECHANICS.md` ✅
- `bootstrap-prompts/*.md` ✅

## Task 3: Fix Dashboard Quick Reference

Same file, near the bottom. The Quick Reference section uses old tool names:
```
onboard → communication action onboard
my_workspace → communication action workspace
create_pr → code_review action create_pr
my_workspace → action: "ask_admin" → communication action send_message
my_workspace → action: "update_notes" → tasks action session_handoff
```

## Task 4: Add Instructions + Memory to AdminSettingsTab

File: `app/admin/components/AdminSettingsTab.tsx`

Add two new collapsible sections AFTER the Skills section and BEFORE the System section:

### 4a: Claude Instructions section

Similar pattern to Skills collapsible. Contents:
- State: `instructionsOpen`, `instructionsCopied`
- Show super_admin instructions text (hardcoded, same content as dashboard but for super_admin)
- Pre block with copy button
- Instruction text: "Go to claude.ai → Projects → Settings → Instructions and paste this"

The super_admin instructions text should be:
```
You are the Super Admin of an IAM Client OS workspace.

## Your identity
- Role: super_admin | Full access to all files, deploy, team management
- MCP URL: {window.location.origin}/api/mcp

## Every session — start with:
1. tasks action read_memory — loads all memory/ files
2. communication action workspace — current state overview
3. Summarize: what needs attention, what you'll do next

## Core tools (mega-tool syntax)
- files action read/write/patch/list/search — file operations
- devops action git_snapshot message="..." — commit changes
- devops action deploy — validate and deploy
- tasks action create — assign tasks to workers
- code_review action create_pr — create pull requests
- communication action send_message — message team
- goals action list/manage — manage roadmap

## Critical rules
- devops action git_snapshot BEFORE any deploy
- Read file before patching — never patch from memory
- Files >500 lines → use patch action, not write action
- Deploy is manual — git_snapshot, then deploy via SSH

## End of session
tasks action session_handoff — saves state, next actions, wisdom.
```

### 4b: Claude Memory section

Same pattern. Show list of memory files with paths:
- `memory/ARCHITECTURE.md` — Full project architecture
- `memory/TEAM_ROLES.md` — Roles, tokens, access paths
- `memory/CURRENT_GOAL.md` — Current priorities
- `memory/NEXT_ACTIONS.md` — Next steps
- `memory/RULES.md` — Security rules
- `source-of-truth/WORKER_MECHANICS.md` — Workflow rules
- `bootstrap-prompts/admin.md` — Admin bootstrap prompt

Each with a "Copy path" button (same pattern as dashboard).

Instruction text: "Go to claude.ai → Projects → Knowledge → Add content. Find each file in Dev Console and upload."

## Implementation Order

1. Read DashboardSetupTab.tsx
2. Patch claudeInstructions — all 4 roles
3. Patch claudeMemoryFiles — remove Ariel reference
4. Patch Quick Reference
5. git_snapshot
6. Read AdminSettingsTab.tsx
7. Add Instructions + Memory sections (before System section)
8. git_snapshot
9. Tell user to deploy via SSH

## Rules
- Read file before patching
- Patch, don't rewrite — file is ~300 lines
- Match existing styling (use sectionStyle, labelStyle, codeBlock from the file)
- Keep collapsible pattern consistent with Skills
- All text in English
- git_snapshot after each file
