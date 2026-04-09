# PROGRESS — updated 27.03.2026

## Working ✅

### Track 1: I AM RUNNING Website Builder
- Craft.js editor with 18 Tron components
- Client site deploy on subdomains *.iamrunning.online (SSR, pixel-perfect)
- Dev Console: Full IDE (file manager, code editor, git history, deploy/rollback)
- MCP Connector: Claude direct project access via /api/mcp/* — primary dev tool
- MCP GPT Safe: ChatGPT endpoint /api/mcp-gpt/* (read + context-core write only)
- Interactive pipeline: 4-step wizard → assembly → preview → save
- Context Core: 19 documents actively maintained as AI runtime memory
- Landing v3: Hero, ThreeDoors, Speed, Hosting, SavingsCalculator, FinalCTA
- lib/mcp-server/index.ts: createMcpServer(clientSlug?) — dynamic context-core per tenant
- dev-agent/route.ts: loadContextCore(clientSlug?) — reads /var/www/iam-clients/SLUG/
- middleware.ts: *.lego-base.online → x-client-slug header routing
- install-client.sh v3: Option A (Nginx + files, no separate PM2)
- SSL wildcard lego-base.online ✅ (expires 2026-06-23 — renew manually)
- follin.lego-base.online: test client installed, MCP reads correct context-core ✅

### Track 2: iam-client-os (AI Native Business OS) — Team Workspace
- Repo: ArielGrook/iam-client-os (private)
- Deployed: iam-client-os.vercel.app ✅ (OAuth на Vercel)
- Test VPS: test.lego-base.online ✅ (Time4VPS, 185.5.55.111, Ubuntu 24.04)
- route.ts v2.0 — Role Engine ✅
- OAuth Team Flow ✅
- Admin Panel v2 ✅ (7 tabs)
- User Dashboard /dashboard ✅
- End-to-end verified ✅
- install.sh v2 ✅
- Watchdog updated ✅
- MCP Sandboxing v2.0.0 ✅
- memory/ with YAML frontmatter: 7 files ✅

## MVP Blockers 🔴

### Track 1 (Website Builder)
- Stripe integration
- Route protection middleware

### Track 2 (AI Business OS)
- ✅ All G01-G07 DONE 27.03.2026
- 🟡 Лендинг iamrunning.online — переработка
- 🟡 Лендинг iam-client-os — дизайн-полировка

## OAuth Metadata Bug — РЕШЕНО 27.03.2026
Файл app/.well-known/oauth-authorization-server/route.ts перехватывал запрос ДО rewrite.
Фикс: rm -rf app/.well-known + rebuild.

## Next Actions (ordered by priority) — updated 28.03.2026
1. Admin Panel Team tab UI — role dropdown, member detail view
2. install-agent.sh v1 — lightweight sidecar for existing servers
3. Redesign landing iam-client-os
4. Landing iamrunning.online — Hero component per manifest
5. Go to market — Upwork profile + 3 proposals

*[legacy doc — current status in lego-base memory/]*
