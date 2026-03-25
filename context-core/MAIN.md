# I AM RUNNING — PROJECT OVERVIEW
*Updated: 25.03.2026*

## Stack
Next.js 15, TypeScript, Tailwind CSS, Craft.js, Supabase, PM2, Nginx

## Server
VPS Ubuntu: /var/www/i_am_running/
PM2 process: i-am-running (port 3000)
Live: iamrunning.online
Client sites (website builder): *.iamrunning.online (wildcard SSL)
Client OS installs: *.lego-base.online (second domain, Option A multi-tenancy)
GitHub: https://github.com/ArielGrook/I_AM_RUNNING_-.git

## TWO PARALLEL PRODUCT TRACKS

### Track 1: I AM RUNNING — Website Builder SaaS
- Door A (Interactive): 4-step wizard → Tron components → preview → save
- Door B (Editor): Craft.js visual editor for freelancers
- Door C (Business Software): AI Native Integrated Business Software — see below

### Track 2: AI Native Integrated Business Software (CURRENT FOCUS)
An installable AI operating system for business clients.
Client gets: context-core (AI memory) + MCP endpoint + Dev Console + bootstrap prompts.
AI (Claude/ChatGPT) connects via MCP, reads context-core, knows the business.
Architecture: Option A — single PM2, Nginx X-Client-Slug header routing.
Client data: /var/www/iam-clients/CLIENT_SLUG/context-core/
Installation: product-template/install-client.sh
Pricing: $1000-2500 setup + $300-600/month

## Development Interfaces
1. **MCP Connector** — Claude with direct project access (primary intelligence)
   URL: https://iamrunning.online/api/mcp
2. **Dev Console** — Built-in IDE at /admin/dev-console
3. **Claude Web Chat** — Architecture, planning (this interface)

## Key Directories
```
app/[locale]/editor/page.tsx          — Craft.js editor (DO NOT read in full — 1200+ lines)
app/[locale]/interactive/page.tsx     — Interactive wizard (~1300 lines)
app/sites/[slug]/SiteRenderer.tsx     — Deployed site renderer (SSR)
app/[locale]/admin/dev-console/       — Dev Console IDE UI
app/api/dev-agent/                    — Dev Console backend (loadContextCore is dynamic for tenants)
app/api/mcp/                          — MCP Connector endpoints (12 tools)
app/api/mcp-gpt/                      — ChatGPT safe MCP (7 tools, context-core write only)
lib/craft/components/                 — All 18 Tron components (flat directory)
lib/craft/assembler/                  — Interactive → Craft.js assembly
lib/mcp-server/index.ts               — Main MCP server (12 tools)
lib/mcp-server/gpt-safe.ts            — ChatGPT safe MCP server
context-core/                         — Engineering documentation
product-template/                     — Client installation package
/var/www/iam-clients/                 — Client OS data (outside project root)
```

## Client OS Architecture (Track 2)
```
gooner.lego-base.online
  → Nginx: add_header X-Client-Slug "gooner"
  → port 3000 (shared i-am-running process)
  → middleware.ts reads hostname → sets x-client-slug
  → dev-agent loads /var/www/iam-clients/gooner/context-core/
  → AI knows Grisha's business, not Ariel's project
```

## Context Core Documents
| File | When to read |
|------|-------------|
| PROGRESS.md | **Every new chat — current state** |
| ARCHITECTURE.md | Before changing any flow |
| COMPONENTS.md | Before working with Tron components |
| MECHANICS.md | Before writing any mechanic |
| PATTERNS.md | Before writing a component |
| ENGINEERING_MEMORY.md | Before debugging familiar zones |
| DEBUG_MAP.md | On any bug |
| INTERACTIVE_PIPELINE.md | Interactive wizard work |
| AI_NATIVE_INTEGRATED_BUSINESS_SOFTWARE.md | Business Software track context |

## Data Format
Craft.js JSON → lz.compress(json, { outputEncoding: 'Base64' }) → Supabase JSONB
