---
version: 1
last_updated: "INSTALL_DATE_PLACEHOLDER"
updated_by: "admin"
schema: "architecture_v1"
required_fields: ["project_name", "tech_stack"]
project_name: "CLIENT_NAME_PLACEHOLDER"
tech_stack: []
---

# Project Architecture

*Complete map of this project. All AI agents read this before working.*
*Only admin can modify this file.*

---

## Tech Stack

- (fill during setup)

## Directory Structure

```
/
├── app/                    — Next.js app router
├── memory/                 — AI persistent memory (YAML frontmatter)
├── tasks/                  — Task assignments per role
├── messages/               — Admin comments to team members
├── pull-pool/              — Sandbox for non-admin proposed changes
├── bootstrap-prompts/      — Role-specific setup prompts
├── public/                 — Static assets
└── ...
```

## Key Files

| File | Purpose | Who modifies |
|------|---------|-------------|
| (fill during setup) | | |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/mcp | POST | MCP server — AI agent interface |
| /api/admin/* | POST | Admin panel API |
| /api/oauth-metadata | GET | OAuth discovery |

## Conventions

- (naming conventions, code style, etc.)

## Do Not Touch

- memory/RULES.md — locked by system
- .env.local — secrets
- node_modules/
- .next/

---

*Fill this document during initial setup or via the Setup Wizard in /admin.*
*All AI agents read this at the start of every session.*
