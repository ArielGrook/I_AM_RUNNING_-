# ARCHITECTURE

*How this system is structured. What's connected to what.*
*AI uses this to understand the technical/operational topology before making changes.*

---

## System overview

[CLIENT_NAME]'s AI Operating System runs on:
- **Server:** iamrunning.online VPS (managed by Ariel Grook)
- **URL:** [https://CLIENT_SUBDOMAIN.iamrunning.online]
- **Stack:** Next.js 15, Supabase, PM2, Nginx
- **AI access:** MCP endpoint at [https://CLIENT_SUBDOMAIN.iamrunning.online/api/mcp]
- **Dev Console:** [https://CLIENT_SUBDOMAIN.iamrunning.online/admin/dev-console]

---

## Three layers

### 1. Business / Workspace layer
What the operator sees and uses:
- Dashboard
- Project workspace
- Document storage (context-core/)

### 2. Operational layer
Tools for managing the system:
- Dev Console (file manager, git history, deploy)
- Admin panel (user management, config)

### 3. AI Access layer
How Claude/ChatGPT connects:
- MCP server at `/api/mcp`
- OAuth flow for Claude Connector
- Bootstrap prompts in bootstrap-prompts/

---

## Key files

| Path | Purpose |
|------|---------|
| `context-core/` | System memory — read by AI every session |
| `bootstrap-prompts/` | Session start scripts for Claude and ChatGPT |
| `.dev-agent-config.json` | MCP token and API keys |
| `app/api/mcp/` | MCP protocol endpoints |

---

## What AI can do in this system

**Read:** all files in context-core/, project code in app/, lib/, components/
**Write:** only context-core/*.md files
**Cannot:** deploy, run shell commands, access .env or secrets

---

## Current project stack

[Fill in client's actual tech if relevant — e.g. "React frontend on Vercel, Node backend on Railway, PostgreSQL on Supabase"]

---

*Updated: [INSTALL_DATE]*
