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
- **route.ts v2.0 — Role Engine** ✅:
  - parseFrontmatter() YAML parser (known bug: empty value before array — fixed)
  - resolveRole() token→TEAM_ROLES.md→ResolvedRole
  - matchesGlob() path scoping per role
  - createPullPoolEntry() sandbox for non-admin writes
  - readRoleScopedMemory() role header + filtered memory + tasks + messages
  - 11 admin tools: read_file, write_file, patch_file, list_directory, read_memory,
    git_snapshot, git_log, search_files, delete_file, run_command, deploy
  - Activity logging: every MCP call → logs/activity.jsonl
  - PR description field: write_file/patch_file accept optional description for pull-pool
- **OAuth Team Flow** ✅:
  - Solo mode: auto-approve with env token
  - Team mode: HTML token input page → AES-256-GCM encrypt → stateless auth codes
  - /api/mcp/register for dynamic client registration
  - Free Claude supports 1 custom MCP connector
- **Admin Panel v3** ✅ (9 tabs + Logs):
  - Dashboard (goal+team with last_seen+git with rollback+deploy log), Team (role dropdown+member detail view+tools mgmt),
    Goals (structured goals with subgoals+assignment+progress bars+create-task-from-goal),
    Tasks (structured JSON, status columns, link to goals, Formulate with AI prompt),
    Messages (structured JSON, topic+body+goalRef), Pull Pool (PR review prompt, approve/reject),
    Activity (MCP log), Files (full file browser, edit, delete), Logs (deploy success/fail with error output),
    Settings (Supabase vars, TOTP setup)
  - TOTP setup moved behind auth (security fix)
  - Persistent auth: admin cookie check on mount, user sessionStorage
  - 30s polling on user dashboard
- **User Dashboard v2** ✅ (4 tabs):
  - Overview (tasks with Start Working prompt, messages with topic/body, PRs with description)
  - Goals (visible to all, subgoals with "You" badges, assigned-to-you section)
  - Activity (MCP log)
  - Setup (bootstrap prompt + role info)
- **MCP Tools v2.1** ✅: create_task, send_message, create_goal, list_goals (admin only)
  - AI writes to structured JSON → visible in admin panel + user dashboard
  - ARCHITECTURE.md updated with Data Flow Rules
- **Bootstrap Prompts v2** ✅: tool tables, description param workflow, role-specific guidance
  - Formulate Task prompt (admin), Start Working prompt (user), Review prompt (PR)
- **Goals System** ✅: structured goals.json, subgoals with assignee, progress bars, create-task-from-goal
- **wisdom/ folder** ✅: ROADMAP, EVOLUTION, ARCHITECTURE_DEBT, LESSONS + cron reminder every 3 days
- **Deploy Error Logging** ✅: deploy-logged.sh captures build output → logs/deploy.jsonl → Logs tab in admin
- **Pricing updated**: Solo $300/mo, Team per-seat $200/person (5+ → $150, 10+ → $125), $0 setup for first 10

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

## Next Actions (ordered by priority) — updated 28.03.2026 night

### Immediate (29.03.2026)
1. **Fix Logs tab display** — deploy errors showing but ANSI codes need cleanup
2. **Super Admin role** — admin panel as primary workspace, not just settings
3. **Landing iam-client-os** — Steve's redesign PR (dark green + fireflies) needs review + deploy

### Block 2: Landing iam-client-os
4. Finalize landing redesign after Steve's PR
5. "Go to Dashboard" button, three deployment scenarios

### Block 3: Landing iamrunning.online
6. Hero component per manifest (entry 148)

### 29-30.03 — Go to market
7. Upwork profile + 3 proposals
8. Cold DM templates (Reddit, LinkedIn, email)
9. Connect Ariel's brother as second team member
10. Video guide script

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

**Pricing (finalized 27.03.2026):**
- Phase 1 (first 10 clients, portfolio): Solo $300/mo flat. Team: 1-4 ppl $200/person, 5-9 $150/person, 10+ $125/person. $0 setup.
- Phase 2 (after 10): Setup $2000-5000 + Solo $500/mo, Team $200-250/person. Enterprise $5000-15000 setup + $800-1500/mo.

**Positioning:** NOT selling "AI workspace software". SELLING "Custom AI solution configured for YOUR business". Service with a product inside.

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
