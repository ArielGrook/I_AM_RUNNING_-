# PROGRESS — updated 25.03.2026

## Working ✅

### Core Platform
- Craft.js editor with 18 Tron components (HeroTron, HeaderTron, TronFeatures, TronStats, TronAbout, TronPortfolio, TronTestimonials, TronPricing, TronFAQ, TronFooter, TronContact, TronShowcase, TronLogin, TronRegister, TronHub, TronCTA, TronServices, TronTeam)
- Client site deploy on subdomains *.iamrunning.online (SSR, pixel-perfect)
- Dev Console: Full IDE with file manager, code editor, git history, deploy/rollback
- MCP Connector: Claude has direct project access via `/api/mcp/*` — primary dev tool
- MCP GPT Safe: ChatGPT audit endpoint `/api/mcp-gpt/*` (read all sources + write context-core only)
- Interactive pipeline: 4-step wizard → assembly → preview → save (16 light SVG niche thumbnails)
- Context Core: 19 documents actively maintained as AI runtime memory
- Landing v3: Hero (orange bg, marquee, smart nav), ThreeDoors, Speed, Hosting, SavingsCalculator, FinalCTA

### AI Native Integrated Business Software — Product Template ✅
- `product-template/` — complete installation package
- `install-client.sh` v2: deps check, secrets generation, context-core setup, Nginx config
- `generate-ecosystem.js`: PM2 env injection helper (no bash quoting issues)
- `manage-clients.sh`: list/status/logs/restart/backup/remove
- `auto-backup.sh`: daily cron — git commit + push context-core to GitHub
- Context-core template: 8 docs (SYSTEM_IDENTITY, CURRENT_GOAL, IDEAS, MVP_BRIEF, NEXT_ACTIONS, WEEKLY_PROGRESS, ARCHITECTURE, ENGINEERING_MEMORY)
- Bootstrap prompts: claude-start.md + chatgpt-start.md
- INSTALL.md: founder guide with pricing ($1000-2500 setup + $300-600/мес)

### Security ✅
- Admin: httpOnly cookie TOTP auth, 404 for non-admins, IP ban after 3 probes
- MCP: Bearer token, separate tokens per endpoint
- GPT MCP: read-only + context-core write only, audit log

### Role System v2 ✅
- Roles 0-7, source of truth: auth.users.user_metadata.role
- Real-time propagation via Realtime subscription → refreshSession()

## Active Focus 🎯 — AI Business Software Prototype

**Goal:** First working client installation (Grisha on gooner.lego-base.online)

**Architecture DECIDED: Option A — Single PM2, X-Client-Slug routing**
```
gooner.lego-base.online
  → Nginx: proxy_pass 127.0.0.1:3000 + add_header X-Client-Slug "gooner"
  → middleware.ts: reads x-client-slug header
  → if slug present: serve client onboarding page (no i18n needed)
  → MCP /api/mcp: loads context-core from /var/www/iam-clients/gooner/context-core/
  → Claude/ChatGPT connects MCP → reads Grisha's context-core → works
```

**Why Option A:**
- Zero new PM2 processes — no .next build conflicts
- One codebase serves all clients
- Nginx config per client is the only "installation" needed
- lego-base.online as client domain (iamrunning.online stays clean)

**What Grisha gets:**
- `gooner.lego-base.online` — onboarding page with instructions
- MCP endpoint: `gooner.lego-base.online/api/mcp` with his token
- context-core pre-filled with his business info
- Bootstrap prompts to paste into Claude/ChatGPT
- NO embedded chat needed — he uses Claude.ai or ChatGPT directly

**No auth for prototype** — Grisha's system is the MCP endpoint + context-core.
Admin Panel (Dev Console) stays as founder-only tool.

## MVP Blockers 🔴 (I AM RUNNING website builder)
- Stripe integration (checkout, webhook, role upgrade)
- Route protection middleware (editor requires subscription)
- Landing: needs polish pass after Business Software prototype done

## Open Issues ⚠️
- `install-client.sh` written for Option B (separate PM2) — needs rewrite for Option A
- `client-home/page.tsx` exists but not wired — needs proper routing via middleware
- Landing v3: multiple iterations, not final — deprioritized until first client live
- `app/[locale]/page.tsx` is clean (no CLIENT_SLUG patch) — good

## Next Actions (ordered)

### 🔴 This session — Business Software Prototype
1. Add lego-base.online to Nginx (server_name + SSL or use existing cert)
2. Update middleware.ts: read x-client-slug → route to client page
3. Update MCP server: load context-core from env CLIENT_CONTEXT_CORE path
4. Rewrite install-client.sh for Option A (no PM2, just Nginx + files)
5. Install Grisha: `bash install-client.sh` → gooner.lego-base.online live
6. Connect Claude MCP to gooner.lego-base.online/api/mcp → test

### 🟡 Next — Stripe
7. Stripe checkout + webhook + role upgrade
8. Route protection middleware for editor

### 🟢 Later — Landing polish
9. Full landing redesign pass (after live client case)
