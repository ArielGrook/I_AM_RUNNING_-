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
- MCP tools: read_file, write_file, patch_file, list_directory, read_context_core
- OAuth flow: /authorize → /api/mcp/authorize → /api/mcp/token
- .well-known/oauth-authorization-server: working via next.config.mjs rewrite
- Landing: white + orange, I AM RUNNING style, 4-step how-it-works, copy bootstrap prompt
- install.sh: full VPS setup (Node, PM2, Nginx, SSL, app, secrets)
- context-core template: 4 docs (SYSTEM_IDENTITY, CURRENT_GOAL, NEXT_ACTIONS, WEEKLY_PROGRESS)
- bootstrap-prompts/claude-start.md: basic version

## MVP Blockers 🔴

### Track 1 (Website Builder)
- Stripe integration (checkout, webhook, role upgrade)
- Route protection middleware (editor requires paid subscription)

### Track 2 (AI Business OS)
- Admin панель для iam-client-os (клиент должен видеть и редактировать memory/)
- Автономный bootstrap промт (Claude сам читает memory, сам обновляет в конце сессии)
- memory/RULES.md — защита от tool poisoning
- Переименовать context-core → memory в iam-client-os
- Тест install.sh на чистом VPS (Hetzner €4/мес)

## Next Actions (ordered by priority)

### 🔴 Этот спринт — iam-client-os MVP финал

1. **memory/ + RULES.md** — переименовать context-core → memory, добавить security rules
2. **Автономный bootstrap промт** — один промт, Claude сам всё делает
3. **Admin панель** — список файлов memory/, просмотр/редактирование, deploy кнопка
4. **Лендинг v2** — имя клиента подставляется, scroll-based steps анимация
5. **VPS тест** — install.sh на чистый Hetzner, полный цикл

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
