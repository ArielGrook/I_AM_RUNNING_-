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
- ПРОБЛЕМА: /.well-known/oauth-authorization-server возвращает localhost:3000 — Claude Connector не работает

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
- ✅ ~~G07: Тест install.sh на чистом VPS~~ DONE 27.03.2026 — установка работает
- 🔴 **OAuth metadata bug**: `/.well-known/oauth-authorization-server` возвращает `localhost:3000` вместо `https://test.lego-base.online`
- 🟡 Лендинг iamrunning.online — переработка визуала
- 🟡 Лендинг iam-client-os — дизайн-полировка

## OAuth Metadata Bug — детали (27.03.2026)

**Симптом:** curl https://test.lego-base.online/.well-known/oauth-authorization-server возвращает localhost:3000

**Файл:** iam-client-os/app/api/oauth-metadata/route.ts

**Что пробовали:**
1. Добавили `clientDomain = process.env.NEXT_PUBLIC_CLIENT_DOMAIN` → не помогло
2. Добавили `X-Forwarded-Host` в Nginx → не помогло
3. rm -rf .next + rebuild → не помогло

**Гипотеза:** NEXT_PUBLIC_* переменные инлайнятся на этапе билда из окружения где запускается `npm run build`. На VPS .env.local читается правильно (проверено cat), но в скомпилированный бандл значение не попадает — возможно Next.js кеширует пустое значение из первого билда.

**Что проверить:**
```bash
grep -r "test.lego-base" /var/www/iam-os/.next/server/
grep -r "NEXT_PUBLIC_CLIENT_DOMAIN" /var/www/iam-os/.next/server/
```

**Возможный правильный фикс:** использовать серверный env без NEXT_PUBLIC_ префикса:
```ts
const clientDomain = process.env.CLIENT_DOMAIN || process.env.NEXT_PUBLIC_CLIENT_DOMAIN || '';
```
И добавить `CLIENT_DOMAIN` в .env.local. Серверные переменные (без NEXT_PUBLIC_) не инлайнятся — читаются в runtime.

**На Vercel работало** потому что NEXT_PUBLIC_CLIENT_DOMAIN не задан → код падал на x-forwarded-host который Vercel выставляет правильно автоматически.

## Next Actions (ordered by priority)

1. **Фикс OAuth metadata** — использовать серверный env CLIENT_DOMAIN вместо NEXT_PUBLIC_
2. **Подключить Claude Connector к test.lego-base.online** — после фикса OAuth
3. **Лендинг iamrunning.online** — переработка по платформенному манифесту, поэтапно
4. **Лендинг iam-client-os** — дизайн-полировка
5. **Найти первого клиента** — Upwork, стартапы без технаря, малый бизнес

## Продуктовое видение (зафиксировано 27.03.2026)

**I AM RUNNING = full-cycle AI development platform. Три продукта:**
- Door A (Interactive) — mobile-first wizard, 15 мин до живого сайта
- Door B (Editor) — Craft.js visual editor для фрилансеров
- Door C (AI Business OS) — AI-агрегатор с памятью и доступом к проекту

**AI Business OS позиционирование:**
- Не "AI для бизнеса" — инфраструктура для работы любого AI с любым проектом
- Малый бизнес: SaaS без setup fee, ~$400-500/мес подписка
- Средний бизнес/стартап без CTO: $2-15k first launch + $700-1500/мес
- Killer сегмент: стартапы которые ищут технаря — Claude заменяет CTO

**Монетизация Track 2:**
- Beta (первые 2-3 клиента): $0 setup, $200-500/мес
- После кейсов: $300-500 setup + $300-500/мес
- Scale: $500-2000 setup + $300-700/мес

## Известные технические детали

- lego-base.online SSL — manual cert, ренью через certbot --manual до 2026-06-23
- test.lego-base.online SSL — auto-renew через certbot timer, expires 2026-06-25
- Vercel: iam-client-os.vercel.app — OAuth работает (используй для MCP пока не починен VPS)
- write_file/patch_file не работают на Vercel (serverless) — только на VPS
- Git push в iam-client-os-repo требует: git config user.email → ArielGrook email
- Токен для пуша в GitHub хранится в remote URL (не коммить его)
- NEXT_PUBLIC_* переменные инлайнятся в билд — на VPS нужно использовать серверные env без префикса для runtime-значений
- pm2 restart --update-env нужен когда меняются env переменные
