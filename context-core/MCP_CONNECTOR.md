# MCP CONNECTOR — SPECIFICATION

## What It Is
Remote MCP (Model Context Protocol) server that gives Claude direct access to the I AM RUNNING project.
Claude can read, write, patch, delete files, run whitelisted shell commands, commit, push, and deploy — all from the chat interface.

## URL & Auth
- Endpoint: `https://iamrunning.online/api/mcp`
- Auth: OAuth 2.0 flow (auto-approve for developer)
- Token stored in `.dev-agent-config.json` field `mcpAuthToken`
- Setup page: `GET /api/mcp/setup` (requires Supabase developer auth)

## Files
```
app/api/mcp/route.ts              — Streamable HTTP transport (POST/GET/DELETE)
app/api/mcp/authorize/route.ts    — OAuth auto-approve endpoint
app/api/mcp/token/route.ts        — Token exchange endpoint
app/api/mcp/setup/route.ts        — One-time setup (generates token)
app/.well-known/oauth-*/route.ts  — OAuth discovery endpoints
lib/mcp-server/index.ts           — MCP server with 12 tools
```

## 12 Tools Available

| Tool | Purpose | Blocked |
|------|---------|---------|
| `read_file` | Read any project file | .env* |
| `write_file` | Create or overwrite file | .env*, node_modules |
| `patch_file` | Replace unique text fragment | .env*, node_modules |
| `delete_file` | Delete file or empty dir | .env*, node_modules |
| `list_directory` | Tree view (depth configurable) | — |
| `search_files` | grep with optional glob filter | — |
| `git_snapshot` | git add -A + commit | — |
| `git_log` | Last N commits as JSON | — |
| `git_push` | Push to origin/main | — |
| `deploy` | Fire-and-forget deploy script | — |
| `run_command` | Whitelisted shell commands | Non-whitelisted |
| `read_multiple_files` | Read up to 10 files at once | .env* |

## run_command Whitelist
```
npm, pm2, cat, head, tail, wc, grep, find, ls, pwd, du, df,
git status/log/diff/add/commit/push/pull/stash/branch/checkout/reset/reflog,
curl localhost, nginx -t, systemctl status nginx, node -e, npx
```

## MCP vs Dev Console

| Aspect | MCP Connector | Dev Console |
|--------|--------------|-------------|
| Intelligence | Opus 4.6 (full reasoning) | Gemini Flash / GPT-4o (cheap executor) |
| Use case | Architecture, debugging, complex changes | Mechanical tasks, component insertion, quick patches |
| Auth | OAuth + Bearer token | Supabase + Developer ID |
| Access | All files except .env | Restricted (blocked paths list) |
| Deploy | Tool available | Button in UI |
| Cost | Claude Pro/Max subscription credits | API tokens (pay per use) |

## Operational Rules

1. **git_snapshot BEFORE any write** — always create a snapshot before modifying files
2. **Audit before fix** — read the relevant code before patching, never guess
3. **One concern per change** — don't fix adjacent issues unless asked
4. **Deploy is fire-and-forget** — returns immediately, build takes ~2 min
5. **PM2 restart kills itself** — deploy uses nohup sleep 2 pattern, site down ~5 sec
6. **No .env access** — API keys are not readable through MCP tools
7. **run_command is whitelisted** — arbitrary commands will be rejected

## When to Use MCP vs Dev Console

**Use MCP (Claude in chat):**
- Debugging complex issues
- Writing new components
- Architecture decisions + implementation
- Multi-file changes
- Anything requiring reasoning

**Use Dev Console:**
- Quick text changes (change color, fix typo)
- Running pre-written prompts
- Batch mechanical operations
- When Claude credits are limited
