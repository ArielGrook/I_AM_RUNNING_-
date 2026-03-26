# I AM RUNNING — PROJECT OVERVIEW
*Updated: 26.03.2026*

## Stack
Next.js 15, TypeScript, Tailwind CSS, Craft.js, Supabase, PM2, Nginx

## Server
VPS Ubuntu: /var/www/i_am_running/
PM2 process: i-am-running (port 3000)
Live: iamrunning.online
Client sites (website builder): *.iamrunning.online (wildcard SSL)
Client OS installs: *.lego-base.online (wildcard SSL, expires 2026-06-23)
GitHub (main): https://github.com/ArielGrook/I_AM_RUNNING_-.git
GitHub (client OS): https://github.com/ArielGrook/iam-client-os.git

## TWO PARALLEL PRODUCT TRACKS

### Track 1: I AM RUNNING — Website Builder SaaS
- Door A (Interactive): 4-step wizard → Tron components → preview → save
- Door B (Editor): Craft.js visual editor for freelancers
- MVP Blockers: Stripe + route protection middleware

### Track 2: iam-client-os — AI Native Business OS (CURRENT FOCUS)
Отдельный изолированный продукт. Каждый клиент = отдельный VPS (Hetzner €4/мес).
Репо: ArielGrook/iam-client-os
Демо: iam-client-os.vercel.app (Vercel, read-only filesystem — только для демо MCP)
Реальный деплой: install.sh на чистый VPS

**Что клиент получает:**
- Лендинг-инструкция (белый + оранжевый, I AM RUNNING стиль)
- memory/ — AI память бизнеса (переименованный context-core)
- MCP endpoint /api/mcp — Claude/ChatGPT подключаются сюда
- Admin панель — Dev Console для управления файлами и деплоем
- Bootstrap промт — один промт для старта каждой сессии
- RULES.md — защита от tool poisoning атак

**AI экосистема клиента:**
- Claude Pro ($20/мес, платит клиент сам) — для разработки и архитектуры
- ChatGPT — для маркетинга и контента
- Gemini — для анализа кода (нативный MCP появится в 2026)
- Один MCP сервер обслуживает все три AI одновременно

## Development Interfaces
1. **MCP Connector** — Claude с прямым доступом к проекту (primary)
   URL: https://iamrunning.online/api/mcp
2. **Dev Console** — Built-in IDE at /admin/dev-console
3. **Claude Web Chat** — Архитектура, планирование (этот интерфейс)

## Key Directories (I AM RUNNING)
```
app/[locale]/editor/page.tsx          — Craft.js editor (DO NOT read in full — 1200+ lines)
app/[locale]/interactive/page.tsx     — Interactive wizard (~1300 lines)
app/sites/[slug]/SiteRenderer.tsx     — Deployed site renderer (SSR)
app/[locale]/admin/dev-console/       — Dev Console IDE UI
app/api/dev-agent/                    — Dev Console backend (loadContextCore — dynamic for tenants)
app/api/mcp/                          — MCP Connector endpoints (12 tools)
app/api/mcp-gpt/                      — ChatGPT safe MCP (7 tools)
lib/craft/components/                 — All 18 Tron components
lib/mcp-server/index.ts               — Main MCP server (createMcpServer(clientSlug?))
context-core/                         — Engineering documentation
product-template/                     — Legacy Option A client install (lego-base.online)
/var/www/iam-clients/                 — Option A client data (outside project root)
```

## Key Directories (iam-client-os)
```
~/iam-client-os-repo/                 — Local copy on VPS for pushing to GitHub
app/page.tsx                          — Client landing (white + orange)
app/api/mcp/route.ts                  — MCP server (read/write/patch/list/read_context_core)
app/api/mcp/authorize/route.ts        — OAuth authorize
app/api/mcp/token/route.ts            — OAuth token exchange
app/authorize/route.ts                — /authorize redirect (Claude hits this)
app/api/oauth-metadata/route.ts       — .well-known discovery
memory/                               — Client's AI memory (renamed from context-core)
  SYSTEM_IDENTITY.md
  CURRENT_GOAL.md
  NEXT_ACTIONS.md
  WEEKLY_PROGRESS.md
  RULES.md                            — Security: tool poisoning protection
bootstrap-prompts/
  claude-start.md                     — Autonomous bootstrap prompt
install.sh                            — Full VPS setup in ~10 minutes
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

## Data Format
Craft.js JSON → lz.compress(json, { outputEncoding: 'Base64' }) → Supabase JSONB
