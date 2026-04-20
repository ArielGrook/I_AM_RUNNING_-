# I AM RUNNING — Project Overview

*Updated: 20.04.2026 — now reflects 3-product architecture and lego-base → iamrunning migration*

## What this is

**I AM RUNNING** is one platform with three products, sold from one site (`iamrunning.online`).

```
I AM RUNNING
├── iamrunning.online      — Website Builder SaaS + platform control plane
│                            (this server, VPS 94.176.238.108)
├── IAM Client OS          — Team AI Workspace, installs on client's VPS
│                            (currently developed on lego-base 185.5.55.111,
│                             migrating here by 22-23.04.2026)
└── iamrunning.ai          — Electron desktop client (local Ollama + MCP)
                             (repo: ArielGrook/iamrunning.ai)
```

These are three **products of one platform**, not three separate businesses. Connected by MCP as a shared protocol.

## Stack

Next.js 15 (App Router), TypeScript, Tailwind CSS, Craft.js (website builder), Supabase (auth + data), PM2, Nginx. Electron + Ollama (iamrunning.ai). Node.js backend, file-based persistence for per-client workspaces.

## Server infrastructure

| Server | IP | Role | Status |
|--------|----|----|--------|
| iamrunning.online | 94.176.238.108 | Primary — website builder + platform + (soon) iam-clients-os source | ACTIVE |
| lego-base | 185.5.55.111 | iam-client-os development + test install | SUNSET by ~23.04.2026 |

Path conventions: `/var/www/i_am_running` (this server), `/var/www/iam-os` (lego-base, going away).
PM2 processes: `i-am-running` (this server, port 3000), `iam-os` (lego-base).

After migration, `iam-clients-os/source/` on this server will be a git clone of `ArielGrook/iam-client-os` (ignored in root `.gitignore`).

## GitHub repos

| Repo | Purpose |
|------|---------|
| `ArielGrook/I_AM_RUNNING_-` | iamrunning.online website builder (this server's code) |
| `ArielGrook/iam-client-os` | IAM Client OS source (dev repo, NOT what clients clone) |
| `ArielGrook/iam-client-skeleton` | Clean skeleton — what clients actually clone via `iam-client.sh` |
| `ArielGrook/iamrunning.ai` | Electron desktop client |

Per-client install: each client gets a fork from `iam-client-skeleton` under `ArielGrook/` — their own repo with their own PR workflow.

## Three ways to interact with this codebase

1. **MCP Connector** — Claude/ChatGPT connected to `/api/mcp` on this server. Primary dev interface.
2. **Dev Console** — in-app IDE at `/[locale]/admin/dev-console` (file tree + editor + AI agent + git history).
3. **Claude web chat** — for architecture, planning, and multi-session work like this migration.

## Key directories (iamrunning.online root)

```
app/[locale]/editor/page.tsx            — Craft.js visual editor (DO NOT read in full — 1200+ lines)
app/[locale]/interactive/page.tsx       — Interactive 7-step wizard (~1300 lines)
app/[locale]/admin/page.tsx             — Admin panel (Users, Projects, SEO, Dev Console)
app/[locale]/admin/dev-console/         — Dev Console IDE UI
app/api/dev-agent/                      — Dev Console backend (AI agent + file ops + git + deploy)
app/api/mcp/                            — MCP Connector endpoints (OAuth + tools)
app/api/mcp-gpt/                        — ChatGPT-safe MCP endpoint
app/sites/[slug]/SiteRenderer.tsx       — Deployed site renderer (SSR via Craft.js JSON)
lib/craft/components/                   — Tron components (Hero, Header, Features, Pricing, FAQ, Contact, etc.)
lib/mcp-server/index.ts                 — MCP server factory (createMcpServer)
lib/dev-agent/                          — AI provider adapters, tool executor, config

context-core/                           — Engineering documentation (this folder)
context-core/ariels-workflow/           — MASTER WORKSPACE for all of Ariel's docs (post-migration)

product-template/                       — LEGACY — Option A multi-tenant installs, deprecated
/var/www/iam-clients/                   — LEGACY — Option A client data, deprecated
```

After Step 2 of migration, we add:

```
iam-clients-os/                         — IAM Client OS product folder
├── source/                             — git clone ArielGrook/iam-client-os (in .gitignore)
├── workspace/                          — memory, specs, handoffs for Ariel's dev workflow
└── skeleton-sync/                      — scripts for syncing dev → skeleton
```

## Context-core entry points

Any new AI chat connecting to this server should read these, in order:

| File | When |
|------|------|
| `context-core/PROGRESS.md` | **Every new session — current state of everything** |
| `context-core/PLATFORM.md` | Platform overview |
| `context-core/ariels-workflow/PLATFORM_REFACTORING.md` | Active migration plan (until ~23.04) |
| `context-core/ariels-workflow/current-state/SHARED_CONTEXT.md` | Global router between AI agents |
| `context-core/ariels-workflow/bootstrap-prompts/SUCCESS_CHAT_PATTERNS.md` | How to write good first prompts |
| `context-core/ARCHITECTURE.md` | Before changing any flow |
| `context-core/DEBUG_MAP.md` | On any bug |
| `context-core/COMPONENTS.md` | Before working with Tron components |

## Data flow (website builder)

```
Editor (Craft.js JSON) → lz-compress base64 → Supabase JSONB → SiteRenderer (SSR) → client sees pixel-perfect site
```

Per-client site: subdomain `*.iamrunning.online` → Nginx → Next.js `app/sites/[slug]/` route → reads JSONB → renders via Craft.js resolver.

## SSL / DNS

- `iamrunning.online` — wildcard SSL, handled by certbot
- `*.iamrunning.online` — wildcard, for deployed client sites
- `lego-base.online` wildcard (expires 2026-06-23, will not be renewed)

## What NOT to touch

- `app/[locale]/editor/page.tsx` in full (too large, use targeted reads)
- `product-template/` (legacy, being deprecated)
- `.env.local` (server secrets, MCP-protected)
- Production database writes without explicit task

---

*Authored: Claude Opus 4.7 (web MCP) 20.04.2026. Replaces v1 from 26.03.2026.*
