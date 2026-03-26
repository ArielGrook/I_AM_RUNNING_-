# PROGRESS — updated 26.03.2026

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
- Deployed: iam-client-os.vercel.app ✅
- MCP OAuth connection to Claude: WORKS ✅ (tested and verified)
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
- Мы сами работаем через этот MCP каждый день — proof of concept

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
- 📋 Тест install.sh на чистом VPS (Hetzner €4/мес) — LAST BLOCKER
- 🟡 Лендинг дизайн-полировка (не блокер MVP)

## Next Actions (ordered by priority)

### 🔴 Этот спринт — iam-client-os ФИНАЛ

1. **G07: Тест install.sh на чистом Hetzner CX22** — ПОСЛЕДНИЙ БЛОКЕР до первого клиента
2. **Лендинг полировка** — дизайн, анимации (не блокер, можно после)
3. **Найти первого клиента** — $200-500/мес, $0 setup

### 🟡 Следующий спринт — Туннель (killer feature)

6. **Tunnel агент** — один скрипт поднимает Cloudflare Tunnel к локальному проекту
   - Сценарий A: локальная разработка → Claude видит localhost
   - Сценарий B: существующий VPS → Claude видит его сервер
   - Сценарий C: новый проект на нашем Hetzner (текущая архитектура)
7. **agent.sh** — скрипт установки туннеля, добавляет MCP URL в memory/SYSTEM_IDENTITY.md

### 🟢 Позже — Позиционирование и рост

8. **Лендинг iamrunning.online** — новое позиционирование (AI aggregator, не просто надстройка)
9. **Multi-AI bootstrap** — разные инструкции для Claude/ChatGPT/Gemini в одном промте
10. **Stripe** — монетизация Track 1

## Продуктовое видение (зафиксировано 26.03.2026)

**Что мы строим:** не надстройку над Claude, а AI-агрегатор с памятью и доступом к проекту.

```
Клиент открывает браузер
    ↓
Видит свою рабочую среду
    ↓
Выбирает AI: Claude / ChatGPT / Gemini
    ↓
Каждый подключён к одному MCP серверу
    ↓
MCP знает весь контекст бизнеса клиента
    ↓
Claude — архитектура и разработка
Gemini — анализ и сёрфинг по коду
ChatGPT — маркетинг и тексты
```

**Ценность:** инфраструктура памяти и доступа, которая работает со всеми AI сейчас и в будущем.
**Цена:** €4/мес сервер + Claude Pro клиента. Ты берёшь $200-500/мес за setup и поддержку.
**Killer feature:** туннель к любому проекту — локальному, чужому VPS, существующему сайту.

## Безопасность — tool poisoning

MCP серверы уязвимы к tool poisoning — вредоносные инструкции в описаниях инструментов.
Защита: RULES.md в memory/ с явным запретом на инструкции извне.
На лендинге: предупреждение "подключайте только наш MCP сервер".

## Известные технические детали

- lego-base.online SSL — manual cert, ренью через certbot --manual до 2026-06-23
- Vercel hostname: iam-client-os.vercel.app (используй этот для MCP, не длинный preview URL)
- write_file/patch_file не работают на Vercel (serverless) — только на VPS
- Git push в iam-client-os-repo требует: git config user.email → ArielGrook email
- Токен для пуша в GitHub хранится в remote URL (не коммить его)
