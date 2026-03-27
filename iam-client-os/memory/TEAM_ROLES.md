---
version: 1
last_updated: "INSTALL_DATE_PLACEHOLDER"
updated_by: "system"
schema: "team_roles_v1"
mode: "solo"
roles: []
---

# Team Roles

This file controls Team AI Workspace access.

## Mode

- `solo` — single MCP token from .env, full access (default)
- `team` — multiple tokens, role-based access, pull-pool

## How it works

When mode is "team", route.ts reads this file on every MCP request:
1. Hashes the incoming Bearer token (sha256)
2. Finds matching token_hash in the roles array
3. Returns scoped access based on role definition

## Role schema

Each role has:
- `token_hash` — sha256 hash of the Bearer token (never store plaintext)
- `name` — display name of the team member
- `role` — role identifier (admin, developer, marketer, reviewer, custom)
- `tools` — allowed MCP tools array
- `read_paths` — glob patterns for readable paths
- `write_paths` — glob patterns for writable paths ("*" = all, "pull-pool/*" = sandbox only)

## Adding members

Use the admin panel at /admin → Team tab → Add Member.
The system generates a token, shows it once, and stores the sha256 hash here.

## Available roles

| Role | Read | Write | Tools |
|------|------|-------|-------|
| admin | * | * | all |
| developer | memory/, tasks/, app/, src/ | pull-pool/* | read_file, write_file, list_directory, read_memory |
| marketer | memory/, tasks/, content/ | pull-pool/* | read_file, write_file, read_memory |
| reviewer | * | (none) | read_file, list_directory, read_memory |

---

*Managed by admin panel. Do not edit manually unless you know what you're doing.*
