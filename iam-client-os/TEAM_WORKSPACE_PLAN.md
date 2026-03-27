# TEAM AI WORKSPACE — Architecture Plan
## Version 1.0 — 27.03.2026
## Status: APPROVED, ready for implementation

---

## Overview

Team AI Workspace transforms iam-client-os from a solo AI tool into a multi-user, role-based system where multiple AI agents (Claude, ChatGPT, Gemini) work on the same project with different roles, scoped access, and admin oversight.

**Two modes:**
- **Solo** (current, working) — one MCP token, flat memory/, full access
- **Team** (this plan) — multiple tokens, role-based access, pull-pool, task assignment

**Backward compatibility:** If TEAM_ROLES.md doesn't exist OR `mode: "solo"` → works exactly as now. Zero breaking changes.

---

## Architecture Decisions

### D1: Token → Role Resolution (code-enforced, not prompt-based)
- route.ts hashes incoming Bearer token with sha256
- Looks up hash in TEAM_ROLES.md YAML frontmatter
- Returns role object: { name, role, tools, read_paths, write_paths }
- AI learns its role through server response, NOT through bootstrap prompt
- read_memory returns role-scoped content automatically

### D2: Token Storage — sha256 hashes in TEAM_ROLES.md
- Tokens never stored in plaintext
- Admin panel generates token → shows once (like GitHub PAT) → stores sha256 hash
- Fallback: MCP_AUTH_TOKEN from .env = admin role (backward compat)

### D3: Communication — files, not Supabase
- tasks/{role-name}.md — task assignments per role
- messages/to-{role-name}/*.md — admin comments to specific users
- read_memory auto-includes tasks + messages for the requesting role
- Admin writes through admin panel UI

### D4: Pull-pool — sandbox for non-admin writes
- Non-admin write_file/patch_file → redirected to pull-pool/pr-NNN/
- Each PR: meta.md (author, role, target, status) + actual files
- Reviewer AI checks for conflicts/errors
- Admin approves in panel → git snapshot + copy to production + build
- Admin rejects → comment saved in messages/to-{role}/

### D5: ARCHITECTURE.md — full project map
- All directories, all files, all connections, what's inside each file
- Filled during setup (wizard or manually by admin)
- All AI read before working, only admin writes
- Eliminates need for repeated function audits

### D6: Bootstrap prompts — supplementary, not primary
- bootstrap-prompts/{role}.md — text guidance for each role
- User copies into their AI's system prompt
- BUT role enforcement is CODE-LEVEL (route.ts), not text-level
- Bootstrap prompt is UX polish, not security

---

## File System Structure (Team Mode)

```
memory/
├── RULES.md                    (locked, sha256 checksum)
├── TEAM_ROLES.md               (roles + sha256 token hashes)
├── ARCHITECTURE.md             (full project map, admin-only write)
├── SYSTEM_IDENTITY.md          (business info)
├── CURRENT_GOAL.md             (current goal + progress)
├── NEXT_ACTIONS.md             (action items)
├── WEEKLY_PROGRESS.md          (weekly log)
│
tasks/
├── developer-frontend.md       (tasks for frontend dev)
├── developer-backend.md        (tasks for backend dev)
├── marketer.md                 (tasks for marketer)
│
messages/
├── to-developer-frontend/
│   ├── 2026-03-28-review-hero.md
│   └── 2026-03-28-fix-mobile.md
├── to-marketer/
│   └── 2026-03-28-write-blog.md
│
pull-pool/
├── pr-001/
│   ├── meta.md                 (author, role, target, status, created)
│   └── hero.tsx                (actual file to review)
├── pr-002/
│   ├── meta.md
│   └── auth-fix.ts
│
bootstrap-prompts/
├── admin.md
├── developer.md
├── marketer.md
└── reviewer.md
```

---

## TEAM_ROLES.md Schema

```yaml
---
version: 1
last_updated: "2026-03-28T00:00:00Z"
updated_by: "admin"
schema: "team_roles_v1"
mode: "team"
roles:
  - token_hash: "sha256:a1b2c3..."
    name: "Ariel"
    role: "admin"
    tools: ["read_file","write_file","patch_file","list_directory","read_memory"]
    read_paths: ["*"]
    write_paths: ["*"]
  - token_hash: "sha256:d4e5f6..."
    name: "Frontend Dev"
    role: "developer"
    tools: ["read_file","list_directory","read_memory","write_file"]
    read_paths: ["memory/*","tasks/*","messages/to-developer/*","pull-pool/*","app/*","src/*"]
    write_paths: ["pull-pool/*"]
  - token_hash: "sha256:g7h8i9..."
    name: "Marketing"
    role: "marketer"
    tools: ["read_file","read_memory","write_file"]
    read_paths: ["memory/*","tasks/*","messages/to-marketer/*","content/*"]
    write_paths: ["pull-pool/*"]
  - token_hash: "sha256:j0k1l2..."
    name: "Reviewer"
    role: "reviewer"
    tools: ["read_file","list_directory","read_memory"]
    read_paths: ["*"]
    write_paths: []
---
```

---

## route.ts v2.0 — Changes

### New: resolveRole(request) function
```
1. Extract Bearer token from Authorization header
2. If no TEAM_ROLES.md exists → fallback to MCP_AUTH_TOKEN check → admin role
3. Parse TEAM_ROLES.md YAML frontmatter
4. If mode === "solo" → MCP_AUTH_TOKEN check → admin role
5. sha256(token) → find matching token_hash in roles array
6. Return role object or 401
```

### Modified: read_memory tool
```
Solo mode: returns all memory/ files (current behavior)
Team mode:
  1. Read memory/ files scoped to role.read_paths
  2. Prepend role header: "Your role: {role}. Name: {name}."
  3. Append tasks/{role}.md content (if exists)
  4. Append unread messages from messages/to-{role}/ (if any)
  5. Return combined response
```

### Modified: write_file / patch_file tools
```
Solo mode: current behavior
Team mode:
  1. Check role.tools includes this tool
  2. Check target path matches role.write_paths
  3. If admin → write directly (current behavior)
  4. If non-admin → redirect to pull-pool/pr-NNN/
     - Auto-create pr-NNN/ directory
     - Write meta.md with author, role, target_file, timestamp, status: "pending"
     - Write actual file content
     - Return: "Saved to pull-pool/pr-NNN/. Admin will review."
```

### Modified: all tool handlers
```
Before executing: check role.tools.includes(toolName)
If not allowed: return error "Tool {name} not available for role {role}"
```

---

## Admin Panel — New Tabs

### Tab: Team
- List of team members (name, role, created date)
- "Add Member" button → modal: name + role select → generates token → shows ONCE
- "Revoke" button → removes from TEAM_ROLES.md
- Mode toggle: Solo ↔ Team

### Tab: Tasks
- Dropdown: select team member
- Markdown editor for task file
- Save → writes to tasks/{role-name}.md

### Tab: Messages
- Dropdown: select team member
- Text input for comment
- Send → creates .md file in messages/to-{role-name}/
- History of sent messages

### Tab: Pull Pool
- List of pending PRs with: author, role, target, date
- Click → preview (meta.md + file diff)
- Approve button → git snapshot + copy to target + build
- Reject button → enter reason → saves to messages/to-{author-role}/

---

## Implementation Order

### Day 1: route.ts v2.0 + memory files
1. Write TEAM_ROLES.md template (YAML schema)
2. Write ARCHITECTURE.md template
3. Create directories: tasks/, messages/, pull-pool/, bootstrap-prompts/
4. Write bootstrap-prompts/ templates (admin, developer, marketer, reviewer)
5. Implement resolveRole() in route.ts
6. Modify read_memory to be role-scoped
7. Modify write_file/patch_file for pull-pool redirect
8. Add tool filtering per role
9. Test: solo mode still works (backward compat)

### Day 2-3: Admin panel team management
1. Add Team tab — list members, add/revoke
2. Add Tasks tab — assign tasks per role
3. Add Messages tab — send comments per role
4. Add Pull Pool tab — list, preview, approve/reject
5. API endpoints for all above

### Day 4: Testing + polish
1. Test with two different tokens (admin + developer)
2. Verify developer can only write to pull-pool/
3. Verify read_memory returns role-scoped content
4. Verify admin panel approve flow
5. Update install.sh for new directories
6. Update PROGRESS.md

---

## Known Risks

1. **YAML parsing in route.ts** — need gray-matter or manual regex. gray-matter adds a dependency. Manual regex is fragile. Decision: use gray-matter (small, well-tested, already common in Next.js ecosystem).

2. **Admin panel UI complexity** — could spiral. Mitigation: MVP first (basic table + forms), polish later.

3. **Pull-pool auto-build** — risky to auto-build on approve. V1: approve = copy file + git snapshot. Manual build via existing Deploy button. V2: auto-build.

4. **Performance** — reading TEAM_ROLES.md on every MCP request. Mitigation: file is tiny (<1KB), fs read is fast, can add in-memory cache later if needed.

5. **Race conditions** — two AI agents writing to pull-pool simultaneously. Mitigation: pr-NNN ID is timestamp-based (pr-{Date.now()}), extremely unlikely collision.

---

## Pricing (confirmed)

- Solo: 1 user, $200/mo
- Team: up to 5 users, $400/mo
- Business: up to 15 users, $700/mo

---

*Document created: 27.03.2026*
*Author: Claude (Opus 4.6) + Ariel*
*Status: Ready for implementation*
