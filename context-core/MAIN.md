# I AM RUNNING — PROJECT OVERVIEW

## Stack
Next.js 15, TypeScript, Tailwind CSS, Craft.js, Supabase, PM2, Nginx

## Server
VPS Ubuntu: /var/www/i_am_running/
PM2 process: i-am-running
Live: iamrunning.online
Client sites: *.iamrunning.online (wildcard SSL)
GitHub: https://github.com/ArielGrook/I_AM_RUNNING_-.git

## Two Products
- Door A (Interactive): 4-step wizard → assembles Tron components → preview → save
- Door B (Editor): Craft.js visual editor for freelancers

## Development Interfaces (3 layers)
1. **MCP Connector** — Claude Opus with direct project access (primary intelligence)
2. **Dev Console** — Built-in IDE at /admin/dev-console (cheap executor for mechanical tasks)
3. **Claude Web Chat** — Architecture discussion, prompt engineering, planning

## Key Directories
```
app/[locale]/editor/page.tsx          — Craft.js editor (DO NOT read in full — 1200+ lines)
app/[locale]/interactive/page.tsx     — Interactive wizard + assembler + preview
app/sites/[slug]/SiteRenderer.tsx     — Deployed site renderer (SSR)
app/[locale]/admin/dev-console/       — Dev Console IDE UI
app/api/dev-agent/                    — Dev Console backend
app/api/mcp/                          — MCP Connector endpoints
lib/craft/components/                 — All Tron components (flat, no subdirectories)
lib/craft/assembler/                  — Interactive → Craft.js assembly
lib/craft/context/                    — ThemeContext, PagesContext, SiteContext
lib/craft/presets/                    — Color presets, layout presets
lib/mcp-server/                       — MCP server with 12 tools
lib/dev-agent/                        — Tool executor, AI providers, config
context-core/                         — Engineering documentation (loaded as AI system prompt)
```

## Client Sites Architecture
username.iamrunning.online → Nginx wildcard → localhost:3000/sites/username
SiteRenderer.tsx deserializes Craft.js JSON → renders same components as editor
Navigation: CustomEvent('iam_navigate', { detail: { page: 'slug' } })

## Data Format
Craft.js JSON → lz.compress(json, { outputEncoding: 'Base64' }) → Supabase JSONB
Project: `data.craft.pages[].desktopData` = compressed Craft.js serialized state
