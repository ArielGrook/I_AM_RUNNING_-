# PROGRESS — updated 25.03.2026

## Working ✅

### Core Platform
- Craft.js editor with 18 Tron components
- Client site deploy on subdomains (SSR, pixel-perfect)
- Dev Console: Full IDE with file manager, code editor, git history, deploy/rollback
- MCP Connector: Claude has direct project access via `/api/mcp/*`
- MCP GPT: ChatGPT safe audit endpoint `/api/mcp-gpt/*` (read + context-core write)
- Interactive pipeline: 4-step wizard → assembly → preview → save
- Context Core: 19 documents, actively maintained as AI runtime memory

### Interactive Step 1 (redesigned 22.03.2026)
- 16 light colorful SVG thumbnails (140×88), each in its own color family
- Cards always light — background transparent, SVG sets the color
- AnimatedBackground: 140 icons, left-based (0..130%), translate(-160vw,-140vh)

### AI Access Layer
- MCP server: 12 tools (full access)
- MCP GPT safe server (lib/mcp-server/gpt-safe.ts): 7 tools — read_file with offset/limit, read_range, file_stat, list_directory, search_files, read_multiple_files, write context-core only
- OAuth flow for both Claude and ChatGPT connectors
- Both connectors working and tested

### Landing (iamrunning.online) — current state
- Latest commit: 9ccd896 "landing v3 - black dark theme, fire gradient title, i18n marquee..."
- Sections: Hero → ThreeDoors → Speed → Hosting → SavingsCalculator → FinalCTA → Footer
- Hero: solid orange background, slow small marquee text, auth in static header
- Status: functional but needs visual polish — NOT current priority

### AI Native Business OS — Product Template (22.03.2026)
- `product-template/` — full installation package
- `install-client.sh` v2: creates context-core, generates secrets, Nginx config
- `generate-ecosystem.js`: PM2 env helper (Option B only — deprecated for Option A)
- `manage-clients.sh`, `auto-backup.sh`
- Context-core template: 8 documents
- Bootstrap prompts: claude-start.md + chatgpt-start.md

## Security ✅
- Admin API: httpOnly cookie auth on all /api/admin/* routes
- Admin UI: 404 for non-admins + IP ban after 3 probes
- MCP: Bearer token auth, separate secrets per endpoint

## Role System v2 ✅
- Roles 0-7, source of truth: auth.users.user_metadata.role
- Real-time role propagation via Realtime subscription

## ACTIVE FOCUS 🎯 — AI Native Business Software Prototype
Two tracks running in parallel:
1. **I AM RUNNING** — website builder SaaS (iamrunning.online)
2. **AI Native Integrated Business Software** — installable AI OS for clients

Current focus: Track 2 prototype → first real client install (Grisha on gooner.lego-base.online)

## Architecture Decision: OPTION A (chosen 25.03.2026) ✅
Single PM2 process, Nginx-based tenant routing:

```
gooner.lego-base.online  →  Nginx adds X-Client-Slug: gooner  →  port 3000
client2.lego-base.online →  Nginx adds X-Client-Slug: client2 →  port 3000
iamrunning.online        →  no header                          →  port 3000
```

**middleware.ts** — добавляет slug detection перед intlMiddleware:
- читает hostname → если `*.lego-base.online` → sets x-client-slug header
- локали не ломаются

**dev-agent/route.ts** — `loadContextCore()` становится dynamic:
- если `x-client-slug` есть → грузит из `/var/www/iam-clients/SLUG/context-core/`
- иначе → грузит из `/var/www/i_am_running/context-core/` (текущее поведение)

**install-client.sh** — упрощается для Option A:
- создаёт `/var/www/iam-clients/SLUG/context-core/` из шаблона
- добавляет Nginx server block с `add_header X-Client-Slug "SLUG"`
- НЕ создаёт отдельный PM2 процесс

## MVP Blockers 🔴
- [ ] Stripe integration (checkout, webhook, subscription check)
- [ ] Route protection middleware (editor requires paid role)
- [ ] Landing: final visual polish

## Open Issues ⚠️
- page.tsx: CLIENT_SLUG patch was reverted — clean, no action needed
- client-home/page.tsx: still exists but unused — can delete when Option A is implemented
- Grisha first install: pending Option A implementation

## Roadmap

### 🔴 Priority 1 — AI Native OS (current focus, this week)
- [ ] middleware.ts: add x-client-slug detection for *.lego-base.online
- [ ] dev-agent/route.ts: dynamic context-core loading by client slug
- [ ] update install-client.sh for Option A (no separate PM2)
- [ ] Nginx config for lego-base.online + gooner.lego-base.online
- [ ] First install: Grisha on gooner.lego-base.online
- [ ] Bootstrap session with Grisha

### 🔴 Priority 2 — Monetization
- [ ] Stripe integration
- [ ] Route protection middleware

### 🟡 Priority 3 — Landing polish
- [ ] Full visual redesign (after first client case study)
- [ ] Pricing section finalization

### 🟢 Priority 4 — Product polish
- [ ] Interactive: steps 2-5 restructure
- [ ] Niche-specific Tron components
