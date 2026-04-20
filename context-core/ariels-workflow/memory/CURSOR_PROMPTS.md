# CURSOR PROMPTS — I AM RUNNING PLATFORM
*Промты для Cursor Agent с claude-sonnet-4-6 + extended thinking*
*Запускать в папке I_AM_RUNNING_PLATFORM, Agent mode*

---

## ПРОМТ 1 — Dev Console Frontend

```
You are building DashboardDevConsoleTab.tsx for iam-client-os.

IMPORTANT — GIT RULES:
This workspace has TWO repos: /i-am-running and /iam-client-os.
You must ONLY modify files in /iam-client-os. Never touch /i-am-running.
When committing, cd into /iam-client-os first:
  cd iam-client-os
  git add app/dashboard/components/DashboardDevConsoleTab.tsx app/dashboard/page.tsx
  git commit -m "feat: DashboardDevConsoleTab"
  git push origin main

READ THESE FILES FIRST:
  iam-client-os/app/admin/components/AdminDevConsoleTab.tsx   ← copy this as base
  iam-client-os/IDEAS/DEV_CONSOLE_DESIGN.md                  ← full spec
  iam-client-os/lib/permissions.ts                           ← can(), canFile()
  iam-client-os/app/api/dashboard/lib/dev-handlers.ts        ← backend API
  iam-client-os/app/api/dashboard/lib/dev-console-config.ts  ← visibility rules
  iam-client-os/app/dashboard/dashboard-types.ts             ← DashboardData type
  iam-client-os/app/dashboard/page.tsx                       ← where to add tab
  iam-client-os/lib/useIsMobile.ts                           ← mobile hook

BACKEND API (POST to /api/dashboard):
  action: 'dev-list-dir'   body: { path: string }
    → { items: [{ name, path, type, size, modified, canEdit, ext }], path }

  action: 'dev-read-file'  body: { path: string }
    → { content, isImage, dataUrl?, path, size, lineCount, canEdit, warning? }

  action: 'dev-save-file'  body: { path, content, title?, description? }
    → { ok, method: 'direct'|'pull-pool', prId? }
    Admin → direct write. Worker → creates PR automatically.

  action: 'dev-create-pr'  body: { path, content, title, description, operation?, oldText? }
    → { ok, prId, path, title }

  action: 'dev-git-log'   body: {}
    → { commits: [{ hash, shortHash, message, date, author }], canRollback }

BUILD: iam-client-os/app/dashboard/components/DashboardDevConsoleTab.tsx

REQUIREMENTS:

1. File Tree (left panel, resizable — copy resize logic from AdminDevConsoleTab)
   - Recursive, fetches via 'dev-list-dir'
   - File type icons + colors (.tsx/.ts=blue, .md=orange, .json=yellow, .sh=green)
   - 🔒 icon on items where canEdit=false
   - Click file → load in CodeMirror editor
   - Right-click context menu:
     Worker: [📤 Submit as PR] only
     Admin: [💾 Save, 📤 Submit as PR]

2. Editor (right panel — copy CodeMirror setup EXACTLY from AdminDevConsoleTab)
   - Same imports, same extensions, same key bindings
   - Language detection by file extension
   - Top bar: filepath + canEdit badge + action button
   - Button label: "💾 Save" for admin+canEdit, "📤 Submit as PR" for workers
   - Image files (.png/.jpg/.webp/.svg): show <img> preview instead of editor

3. PR Submit Modal (appears on "Submit as PR" click)
   - Fields: Title (required), Description (optional)
   - Operation toggle: write / patch (patch shows "Find text" input)
   - Submit → action: 'dev-create-pr'
   - Success: toast "✅ PR created: pr-xxx"

4. Git History (collapsible bottom panel)
   - Commits from 'dev-git-log'
   - shortHash | message | author | date
   - Rollback button only if canRollback=true

5. Permissions:
   - Tab visible only if: data.capabilities.includes('dev_console')
   - Save direct: admin + item.canEdit
   - Workers: all saves → PR modal
   - Git snapshot button: admin only

6. Mobile (useIsMobile):
   - Stacked layout: tree top, editor bottom
   - Collapsible tree toggle button

7. Style: use T: Theme props same as other dashboard tabs

ADD TO page.tsx:
- Tab: { id: 'dev-console', label: '💻 Dev Console', show: data.capabilities.includes('dev_console') }
- Render: <DashboardDevConsoleTab data={data} T={T} isDark={isDark} token={token} />

Use extended thinking to plan before writing.
Write complete file — do not truncate.
```

---

## ПРОМТ 2 — Vitest scaffold

```
IMPORTANT — GIT RULES: only modify iam-client-os, never i-am-running.
cd iam-client-os && git add [files] && git commit && git push

Add minimal test infrastructure to iam-client-os.

TASKS:
1. npm install -D vitest @vitest/ui in iam-client-os/
2. Create iam-client-os/vitest.config.ts
3. Create iam-client-os/tests/ directory
4. Write these smoke tests in iam-client-os/tests/smoke.test.ts:
   - can() permission checks from lib/permissions.ts
     (super_admin can do everything, worker cannot 'pr:approve', reviewer can 'pr:reviewer_approve')
   - safePath() from lib/data — verify '../etc/passwd' throws
   - matchesGlob() — 'app/*' matches 'app/page.tsx', doesn't match 'lib/utils.ts'
   - isProtectedPath() — '.env.local' is protected, 'app/page.tsx' is not
5. Add "test": "vitest" to package.json scripts
6. Run tests and verify all pass

Push to iam-client-os repo only.
```

---

## ПРОМТ 3 — Tauri Desktop Client (Phase 1)

```
IMPORTANT — create a NEW repository or subdirectory for this.
Do NOT mix with i-am-running or iam-client-os.
Create: I_AM_RUNNING_PLATFORM/iam-desktop-client/

Build a Tauri + React + TypeScript desktop application called "I AM RUNNING Client".

Read this API spec first: iam-client-os/app/api/mcp/route.ts
Read this for types: iam-client-os/app/api/mcp/lib/shared.ts

PHASE 1 SCOPE ONLY:

1. Login Screen
   - Fields: Server URL (e.g. https://test.lego-base.online), Bearer Token
   - "Connect" button → validates by calling GET /api/mcp with Authorization header
   - Store token securely in OS keychain (tauri-plugin-stronghold or keytar)
   - Show error if connection fails

2. Dashboard Screen (after login)
   - Sidebar: Tasks | Messages | PRs | Files | Settings
   - Tasks tab: fetch via MCP tool 'my_workspace' action 'status'
   - Messages tab: fetch via 'send_message' + list
   - PRs tab: fetch via 'my_workspace' action 'my_prs'

3. File Browser
   - Tree view via MCP tool 'list_directory'
   - Click file → 'read_file' → show in text editor (Monaco or CodeMirror)
   - Save → 'write_file' (goes to PR automatically for non-admin)

4. Settings
   - Disconnect / change server
   - Show role and capabilities

Tech stack:
- Tauri 2.0 (Rust backend)
- React 18 + TypeScript
- Tailwind CSS
- MCP communication: plain HTTP POST/GET to server URL + Bearer token

MCP HTTP protocol:
  POST {serverUrl}/api/mcp
  Headers: Authorization: Bearer {token}, Content-Type: application/json
  Body: { tool: "tool_name", params: { ...args } }

  GET {serverUrl}/api/mcp (for session info)
  Headers: Authorization: Bearer {token}

Use extended thinking to design the architecture before coding.
```

---

## ПРОМТ 4 — Dataset Generator (для fine-tune)

```
IMPORTANT — GIT RULES: only modify iam-client-os, create scripts/ subdirectory.

Create a dataset generation system for fine-tuning Qwen2.5-Coder.

Read: iam-client-os/IDEAS/MCP_PERSISTENT_MEMORY.md (for philosophy)
Read: iam-client-os/IDEAS/FULL_PLATFORM_AUDIT.md (for context)

CREATE: iam-client-os/scripts/generate-dataset.ts

This script:
1. Walks all .ts, .tsx, .md files in iam-client-os/
2. For each file, calls Claude API (claude-sonnet-4-6) with:
   "Generate 10 instruction-response pairs for fine-tuning based on this file.
    Categories: CODE (write/fix/explain code), ARCHITECTURE (why decisions were made),
    PATTERNS (router pattern, PR workflow, capability system).
    Format: [{instruction: string, output: string}]"
3. Saves to training-data/dataset.jsonl in alpaca format:
   {"instruction": "...", "input": "", "output": "..."}
4. Skips node_modules, .next, build artifacts
5. Rate limits: 1 file per 2 seconds (API limits)
6. Resume support: tracks processed files in training-data/progress.json

CREATE: iam-client-os/scripts/README-finetuning.md
Explain:
- How to run the generator
- How to use the output with unsloth for QLoRA fine-tune on Qwen2.5-Coder 32B
- Expected training time on RTX 4090

Push only iam-client-os changes.
```
