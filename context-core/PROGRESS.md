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

### Track 2: iam-client-os (AI Native Business OS)
- Repo: ArielGrook/iam-client-os (private)
- Deployed: iam-client-os.vercel.app ✅ (OAuth работает на Vercel)
- MCP OAuth connection to Claude: WORKS on Vercel ✅ (tested and verified)
- MCP tools: read_file, write_file, patch_file, list_directory, read_memory (v1.2.0)
- MCP Sandboxing: validateReadPath + validateWritePath + assertNotRulesFile ✅
- OAuth flow: /authorize → /api/mcp/authorize → /api/mcp/token
- .well-known/oauth-authorization-server: working via next.config.mjs rewrite
- memory/ with YAML frontmatter: 5 files (SYSTEM_IDENTITY, CURRENT_GOAL, NEXT_ACTIONS, WEEKLY_PROGRESS, RULES) ✅
- RULES.md: locked, sha256 checksum, cannot be modified via MCP ✅
- Watchdog: scripts/watchdog.sh (cron 5min) + scripts/post-commit.sh (git hook) + daily backup ✅
- Admin panel: /admin — TOTP auth + YAML dashboard + file editor + git history + deploy ✅
- Landing v2: two audiences (devs + business) + security block + bootstrap prompt copy ✅
- Next.js: 15.5.14 (all CVEs patched, 0 vulnerabilities) ✅
- install.sh: full VPS setup with memory/ YAML placeholders + watchdog + git hooks ✅
- Bootstrap prompt: autonomous (reads RULES.md first, YAML update instructions) ✅
- G07: install.sh протестирован на чистом VPS (Time4VPS) 27.03.2026 ✅

### Test VPS (27.03.2026)
- Provider: Time4VPS, IP: 185.5.55.111, Ubuntu 24.04
- Domain: test.lego-base.online (A-запись → 185.5.55.111)
- SSL: ✅ (certbot, expires 2026-06-25)
- App: /var/www/iam-os, PM2 process: iam-os, port 3000
- TOTP Secret: APA3AAMAXQAAAWAAAAAAAAGAWGAA (Google Authenticator)
- MCP Token: 6fbf0ae1022211c552c632913feb75ca9960d9b98e4bed6e1c44746fd1539f04
- install.sh: все 10 шагов прошли успешно ✅
- ПРОБЛЕМА РЕШЕНА: /.well-known route файл (app/.well-known/oauth-authorization-server/route.ts) перехватывал запрос ДО rewrite из next.config.mjs. Удаление файла + rebuild = fix. MCP Connector работает ✅

## MVP Blockers 🔴

### Track 1 (Website Builder)
- Stripe integration (checkout, webhook, role upgrade)
- Route protection middleware (editor requires paid subscription)

### Track 2 (AI Business OS)
- ✅ ~~Admin панель~~ DONE 26.03.2026
- ✅ ~~Автономный bootstrap промт~~ DONE 26.03.2026
- ✅ ~~memory/RULES.md~~ DONE 26.03.2026
- ✅ ~~Переименовать context-core → memory~~ DONE 26.03.2026
- ✅ ~~Sandboxing MCP~~ DONE 26.03.2026
- ✅ ~~Watchdog~~ DONE 26.03.2026
- ✅ ~~G07: Тест install.sh на чистом VPS~~ DONE 27.03.2026 — test.lego-base.online LIVE, MCP WORKS
- ✅ ~~OAuth metadata bug~~ FIXED 27.03.2026 — удалён app/.well-known route, rewrite теперь работает
- 🟡 Лендинг iamrunning.online — переработка визуала
- 🟡 Лендинг iam-client-os — дизайн-полировка

## OAuth Metadata Bug — РЕШЕНО 27.03.2026

**Симптом:** `/.well-known/oauth-authorization-server` возвращал `localhost:3000` вместо реального домена на VPS.

**4+ часа дебага. Что НЕ помогло:**
1. Добавить CLIENT_DOMAIN env → PM2 видит, Next.js игнорирует
2. X-Forwarded-Host в Nginx → не помогло
3. rm -rf .next + rebuild → не помогло
4. PM2 ecosystem.config.js с env → не помогло
5. export + pm2 --update-env → pm2 env показывает, curl = localhost
6. Хардкод домена в route.ts → всё равно localhost

**КОРЕНЬ ПРОБЛЕМЫ:** Файл `app/.well-known/oauth-authorization-server/route.ts` существовал как файловый route. Next.js правило: **app/ файловый route ВСЕГДА побеждает rewrite из next.config.mjs**. Rewrite на `/api/oauth-metadata` никогда не срабатывал. Старый route.ts использовал `new URL(request.url).origin` = `localhost:3000`.

**ФИКС:** `rm -rf app/.well-known` + rebuild. Теперь rewrite работает → `/api/oauth-metadata` → читает CLIENT_DOMAIN env → правильный URL.

**ПРАВИЛО ДЛЯ БУДУЩЕГО:** Никогда не иметь файловый route и rewrite на один путь. Выбрать одно.

## Next Actions (ordered by priority)

1. **Лендинг iamrunning.online** — полная переработка визуала, поэтапно по компонентам
2. **Лендинг iam-client-os** — дизайн-полировка + admin панель в светлой теме
3. **Найти первого клиента** — $200-500/мес, $0 setup, система готова к продаже
4. **G08: Tunnel агент** — Cloudflare Tunnel к локальному проекту (killer feature)
5. **Stripe** — монетизация Track 1

## Продуктовое видение (обновлено 27.03.2026)

**iam-client-os = Team AI Workspace.** Не "AI для одного" — "AI workspace для команды".

**Два режима:**
- **Solo** (готов, работает) — один пользователь, flat memory/, все инструменты
- **Team** (следующий билд) — multi-user, роли, ARCHITECTURE.md, pull pool, per-role токены

**Архитектура Team режима:**
- Каждый пользователь подключает один MCP URL к своему Claude/ChatGPT/Gemini
- MCP route проверяет Bearer token → определяет роль (admin, developer, marketer, reviewer)
- Роль ограничивает: read paths, write paths, allowed tools
- Все non-admin writes идут в `pull-pool/` — не напрямую в код
- ARCHITECTURE.md — единый файл связей, все AI читают перед работой
- Reviewer AI проверяет pull-pool на ошибки и конфликты
- Admin (главный в команде) решает деплоить или фиксить

**Pitch:** "I'll set up a private AI system where your whole team's Claude or ChatGPT remembers your business context, goals, and decisions — so nobody starts from zero."

**Pricing:**
- Solo: 1 user, $200/мес
- Team: до 5 users, $400/мес
- Business: до 15 users, $700/мес

**Target (Upwork):** бизнесы ищущие AI integration, AI automation, virtual CTO, AI workflow setup.

## Схема деплоя iam-client-os

Полная документация в `memory/SYSTEM_IDENTITY.md` на клиентском VPS (через lego-base MCP).

Краткая схема: Claude MCP → файлы в iam-client-os/ → Ариэль cp в ~/iam-client-os-repo/ → git push → на VPS: `git checkout -- . && git pull && rm -rf .next && npm run build && pm2 restart iam-os`

## Известные технические детали

- lego-base.online DNS: `test` A → 185.5.55.111 (новый VPS), `@` A → 185.5.55.111. Wildcard и старые записи удалены
- test.lego-base.online: LIVE ✅, SSL ✅, MCP Connector WORKS ✅, PM2+Nginx+certbot
- OAuth на VPS: app/.well-known/ route УДАЛЁН — rewrite в next.config.mjs теперь единственный путь
- Next.js правило: файловый route в app/ ВСЕГДА побеждает rewrite из next.config.mjs. Нельзя иметь оба
- Next.js `next start` НЕ читает .env.local — env должен быть в PM2 ecosystem или в export перед pm2 start --update-env
- NEXT_PUBLIC_* инлайнятся при билде, серверные env (без NEXT_PUBLIC_) читаются в runtime
- PM2 ecosystem.config.js парсит .env.local и передаёт env в процесс — это надёжнее чем export
- Vercel hostname: iam-client-os.vercel.app — OAuth работает
- write_file/patch_file не работают на Vercel (serverless) — только на VPS
- ChatGPT MCP endpoint теперь имеет полные права (12 инструментов = Claude)
- Theme defaults: все компоненты переведены на 'light' default (26.03.2026, ~30 файлов)
- GitHub token для push — ОТОЗВАТЬ старый, создать новый (утёк в чат 27.03.2026)
