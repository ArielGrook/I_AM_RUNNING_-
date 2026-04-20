# ПОЛНЫЙ СИСТЕМНЫЙ АУДИТ — IAM-CLIENT-OS

**Дата:** 2026-04-02
**Сервер:** test.lego-base.online (185.5.55.111)
**Путь:** /var/www/iam-os/
**Файлов прочитано:** 35+ (все .ts/.tsx API файлы, handlers, tools, auth, validation)
**Строк кода проанализировано:** ~6000+

---

## БЛОК 1: КАРТА ПРОЕКТА

```
/var/www/iam-os/
├── .env.local                  — секреты (CLIENT_DOMAIN, TOTP_SECRET, MCP tokens)
├── .env.example                — шаблон окружения
├── ecosystem.config.js         — PM2 конфиг (парсит .env.local)
├── goals.json                  — структурированные цели (Goals → Subgoals → Tasks)
├── install.sh                  — скрипт установки
├── next.config.mjs             — Next.js rewrites/config
├── package.json                — зависимости
├── tsconfig.json               — TypeScript конфиг
├── README.md                   — документация
├── oauth-debug.log             — дебаг лог OAuth (⚠️ не должен быть в проде)
│
├── app/                        — Next.js app router
│   ├── page.tsx                — Landing page
│   ├── layout.tsx              — Root layout
│   ├── globals.css             — Глобальные стили
│   ├── components/
│   │   └── TestBanner.tsx      — Тест баннер
│   ├── lib/utils/
│   │   └── yaml.ts             — YAML frontmatter парсер
│   ├── authorize/
│   │   └── route.ts            — OAuth authorize endpoint
│   ├── docs/
│   │   └── onboarding.md       — Документация по онбордингу
│   ├── .well-known/
│   │   └── oauth-authorization-server/  — OAuth discovery (⚠️ удалить — конфликт с rewrite)
│   │
│   ├── admin/                  — Admin Panel UI (Super Admin, TOTP)
│   │   ├── page.tsx            — Тонкий оркестратор (~150 строк)
│   │   ├── types.ts            — Типы для admin panel
│   │   ├── styles.ts           — Общие стили
│   │   └── components/         — 8 табов
│   │       ├── AdminDashboardTab.tsx
│   │       ├── AdminDevConsoleTab.tsx
│   │       ├── AdminGoalsTab.tsx
│   │       ├── AdminLogsTab.tsx
│   │       ├── AdminMessagesTab.tsx
│   │       ├── AdminPullPoolTab.tsx
│   │       ├── AdminSettingsTab.tsx
│   │       └── AdminTeamTab.tsx
│   │
│   ├── dashboard/              — User Dashboard (Admin/Worker)
│   │   ├── page.tsx            — Основная страница (~550+ строк)
│   │   ├── dashboard-types.ts  — Типы
│   │   ├── lib/
│   │   │   └── permissions.ts  — Permission helpers
│   │   └── components/         — 4 таба
│   │       ├── DashboardGoalsTab.tsx
│   │       ├── DashboardSetupTab.tsx
│   │       ├── DashboardTeamTab.tsx
│   │       └── DashboardWorkTab.tsx
│   │
│   └── api/                    — API Layer
│       ├── mcp/                — MCP Server (ядро системы)
│       │   ├── route.ts        — HTTP handler, session tracking, rate limiter (~120 строк)
│       │   ├── authorize/route.ts  — OAuth authorize
│       │   ├── register/route.ts   — OAuth register
│       │   ├── token/route.ts      — OAuth token
│       │   └── lib/            — Модульная библиотека
│       │       ├── shared.ts   — Константы, типы, safePath, matchesGlob, file locking (~180 строк)
│       │       ├── auth.ts     — resolveRole, loadTeamConfig, capabilities (~180 строк)
│       │       ├── memory.ts   — readRoleScopedMemory, createPullPoolEntry (~230 строк)
│       │       ├── validation.ts — Zod схемы (~90 строк)
│       │       └── tools/
│       │           ├── file-tools.ts   — read/write/patch/delete/list/search (~180 строк)
│       │           ├── data-tools.ts   — CRUD data + git/deploy (~320 строк)
│       │           └── worker-tools.ts — my_workspace, create_pr, onboard (~480 строк)
│       │
│       ├── dashboard/          — Dashboard API
│       │   ├── route.ts        — Маршрутизатор (~40 строк)
│       │   └── lib/
│       │       ├── shared.ts        — Типы, хелперы
│       │       ├── capability-gate.ts — Action→Capability mapping
│       │       ├── scope-helpers.ts  — Scope filtering, canApplyPr
│       │       ├── worker-handlers.ts — Worker actions + loadDashboardData (~420 строк)
│       │       ├── pr-handlers.ts    — PR review/approve/reject (~300 строк)
│       │       ├── team-handlers.ts  — Team management
│       │       └── goals-handlers.ts — Goals CRUD
│       │
│       ├── admin/              — Admin Panel API (TOTP-protected)
│       │   ├── panel/route.ts  — GET/POST dispatcher с CSRF
│       │   ├── totp-setup/route.ts — TOTP setup
│       │   ├── verify-totp/route.ts — TOTP verify
│       │   └── lib/
│       │       ├── shared.ts        — CSRF, audit, safePath, ROLE_PRESETS (~300 строк)
│       │       ├── get-handlers.ts  — 25+ GET handlers (~300 строк)
│       │       └── post-handlers.ts — 35+ POST handlers (~500 строк)
│       │
│       ├── oauth-metadata/route.ts  — OAuth discovery endpoint
│       └── skills-pack/route.ts     — Skills ZIP download
│
├── lib/                        — Shared libraries
│   ├── admin/
│   │   └── checkAdminAuth.ts   — Cookie-based admin auth
│   └── mcp/
│       └── code-store.ts       — Code store (legacy?)
│
├── memory/                     — AI Persistent Memory (YAML frontmatter)
│   ├── RULES.md                — 🔒 LOCKED — security rules
│   ├── ARCHITECTURE.md         — Архитектура проекта
│   ├── SYSTEM_IDENTITY.md      — Идентификация бизнеса
│   ├── CURRENT_GOAL.md         — Текущая цель
│   ├── NEXT_ACTIONS.md         — TODO
│   ├── TEAM_ROLES.md           — Роли + token hashes (⚠️ секреты!)
│   ├── WEEKLY_PROGRESS.md      — Недельный прогресс
│   ├── wisdom/                 — (пусто)
│   └── workers/                — Per-user session notes
│       ├── steve/session-notes.md
│       ├── aliks/session-notes.md
│       └── ariel/session-notes.md (+ legacy ariel-session.md)
│
├── data/                       — Structured JSON data
│   ├── tasks.json              — Задачи
│   ├── messages.json           — Сообщения
│   ├── task-requests.json      — Заявки на задачи
│   └── settings.json           — Настройки
│
├── pull-pool/                  — Worker PRs (sandboxed changes)
│   ├── pr-steve-001..011/      — PRs от Steve
│   ├── pr-1774*/ (7 dirs)     — PRs с timestamp-based IDs
│   └── *.md                    — Legacy loose PR files
│
├── tasks/                      — Legacy markdown tasks (auto-generated from data/tasks.json)
├── messages/                   — Legacy markdown messages
│   ├── to-admin/
│   └── to-developer/
│
├── scripts/
│   ├── deploy-logged.sh        — Deploy script с логированием
│   ├── post-commit.sh          — Git post-commit hook
│   ├── watchdog.sh             — Watchdog
│   └── wisdom-check.sh         — Wisdom checker
│
├── skills/                     — AI skills (prompt presets)
│   ├── description-required.md
│   ├── mcp-memory-first.md
│   ├── read-before-write.md
│   ├── session-hygiene.md
│   └── structured-data-only.md
│
├── bootstrap-prompts/          — Role startup prompts
│   ├── admin.md, developer.md, marketer.md, reviewer.md, claude-start.md
│
├── IDEAS/                      — Strategic docs & brainstorms (16 файлов)
│   ├── IMPROVEMENT_PLAN_IAM_CLIENT_OS.md — Трекер улучшений
│   ├── IAM_CLIENT_OS_IMPLEMENTATION_PLAN_v2.md — Стратегический план
│   ├── WORKFLOW_BRAINSTORM_02_04_2026.md
│   ├── SESSION_HANDOFF_*.md    — Handoff документы
│   ├── DEV_CONSOLE_*.md        — Dev Console specs
│   ├── PERMISSIONS_SYSTEM_SPEC.md
│   └── ...и другие
│
├── logs/
│   ├── activity.jsonl          — MCP + admin audit log
│   └── deploy.jsonl            — Deploy log
│
└── public/                     — (пусто)
```

---

## БЛОК 2: КЛАССИФИКАЦИЯ ДОСТУПА

### Секреты и критические файлы

| Файл | Назначение | Секреты? | Видимость | Запись | Примечания |
|------|-----------|----------|-----------|--------|------------|
| `.env.local` | Все секреты (TOTP, tokens, domains) | **ДА** | 🔴 HIDDEN | 🚫 LOCKED | Заблокирован в read_file через `.env` pattern |
| `.env.example` | Шаблон env | Нет | 🟡 SYSTEM | 🚫 LOCKED | Не содержит значений |
| `ecosystem.config.js` | PM2 — парсит .env.local | **КОСВЕННО** | 🔴 HIDDEN | 🚫 LOCKED | Парсит .env.local в process.env |
| `memory/TEAM_ROLES.md` | Token hashes + roles | **ДА** (hashes) | 🟡 SYSTEM | 🔒 Admin-only | Фильтрация token_hash для не-admin |
| `memory/RULES.md` | Security rules | Нет | 🟢 CONFIG | 🚫 LOCKED | assertNotRulesFile() блокирует запись |
| `oauth-debug.log` | OAuth debug | **ВОЗМОЖНО** | 🔴 HIDDEN | 🚫 LOCKED | **Не должен быть в проде!** |
| `logs/activity.jsonl` | Audit log | Нет | 🟡 SYSTEM | 🚫 LOCKED | Может содержать IP/user data |
| `logs/deploy.jsonl` | Deploy log | Нет | 🟡 SYSTEM | 🚫 LOCKED | Build output |

### Код системы (API + Route)

| Файл | Видимость | Запись | Примечания |
|------|-----------|--------|------------|
| `app/api/mcp/**` | 🔴 HIDDEN | 🚫 LOCKED | Ядро — изменение = breach |
| `app/api/admin/**` | 🔴 HIDDEN | 🚫 LOCKED | Admin panel API |
| `app/api/dashboard/**` | 🔴 HIDDEN | 🚫 LOCKED | Dashboard API |
| `app/admin/**` | 🔴 HIDDEN | 🚫 LOCKED | Admin UI компоненты |
| `lib/**` | 🔴 HIDDEN | 🚫 LOCKED | Shared libraries |

### Рабочие файлы

| Файл/Директория | Видимость | Запись | Примечания |
|------|-----------|--------|------------|
| `app/page.tsx` | 🟢 CONFIG | ✏️/📤 | Landing page — admin пишет, worker через PR |
| `app/dashboard/**` | 🟡 SYSTEM | 🚫 LOCKED | Dashboard UI — только admin |
| `memory/*.md` (кроме RULES, TEAM_ROLES) | 🟢 CONFIG | ✏️ ADMIN | Контекст проекта |
| `memory/workers/{name}/*` | 🟢 CONFIG | ✏️ OWNER | Каждый пишет только свои notes |
| `data/tasks.json` | 🟢 CONFIG | ✏️ через API | Через create_task tool |
| `data/messages.json` | 🟢 CONFIG | ✏️ через API | Через send_message tool |
| `goals.json` | 🟢 CONFIG | ✏️ через API | Через create_goal/update tools |
| `pull-pool/**` | 🟢 CONFIG | 📤 PR-WRITE | Worker пишет, admin ревьюит |
| `tasks/*.md` | 🟢 CONFIG | 🔒 READ-ONLY | Auto-generated legacy |
| `messages/**` | 🟢 CONFIG | 🔒 READ-ONLY | Auto-generated legacy |
| `bootstrap-prompts/*.md` | 🟢 CONFIG | ✏️ ADMIN | Prompt templates |
| `skills/*.md` | 🟢 CONFIG | ✏️ ADMIN | AI skills |
| `IDEAS/*.md` | 🟡 SYSTEM | ✏️ ADMIN | Strategic docs |
| `scripts/*.sh` | 🔴 HIDDEN | 🚫 LOCKED | System scripts |
| `public/*` | ⚪ PUBLIC | ✏️ ADMIN | Static assets |

---

## БЛОК 3: АУДИТ БЕЗОПАСНОСТИ

### 3.1 Path Traversal

**shared.ts — safePath():**
```typescript
export function safePath(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  const absolute = resolve(PROJECT_ROOT, clean);
  if (!absolute.startsWith(PROJECT_ROOT)) throw new Error('Path traversal blocked');
  return absolute;
}
```

**Оценка: ✅ КОРРЕКТНО** — `resolve()` нормализует `..` перед проверкой `startsWith`.

**validateReadPath():**
- Блокирует `/etc/`, `/var/log/`, `/root/`, `/home/`, etc.
- ✅ Хороший whitelist системных путей

**validateWritePath():**
- Блокирует `.env*`, `nginx.conf`, `node_modules`, `.next`
- ✅ Хорошая защита

**⚠️ ПРОБЛЕМА 1: search_files — Command Injection**
```typescript
execSync(
  `grep -rn ... "${query.replace(/"/g, '\\"')}" "${safeDirPath}" ...`
)
```
Экранирование `"` недостаточно! Пользователь может внедрить `$(cmd)` или `` `cmd` `` через backticks.
- **Риск:** СРЕДНИЙ. Worker с search_files может выполнить произвольную команду.
- **Фикс:** Использовать `--` перед query или экранировать все спецсимволы shell: `$`, `` ` ``, `\`, `!`, `(`, `)`.

**⚠️ ПРОБЛЕМА 2: git_snapshot — Command Injection**
```typescript
execSync(`git add -A && git commit -m "${message.replace(/"/g, '\\"')}"`)
```
Та же проблема — `$(cmd)` и backticks не экранируются.
- **Риск:** СРЕДНИЙ (только для admin с git_snapshot tool).
- **Фикс:** Использовать `execFileSync` или передавать через env variable.

**⚠️ ПРОБЛЕМА 3: admin post-handlers git-snapshot**
Аналогичная injection в `post-handlers.ts` → `git-snapshot` handler.

**⚠️ ПРОБЛЕМА 4: admin post-handlers git-rollback**
```typescript
const { hash } = body;
if (!hash || !/^[a-f0-9]{7,40}$/.test(String(hash))) return error('Valid commit hash required');
execSync(`git checkout ${hash} -- .`);
```
Regex валидация хеша ОК, но `execSync` всё равно рискованный паттерн.

### 3.2 Auth Bypass

**MCP Auth (route.ts):**
- Bearer token → resolveRole() → token hashing → match against TEAM_ROLES.md
- ✅ Нет bypass. Null role → 401.

**Dashboard Auth (dashboard/route.ts):**
- Token в body → resolveRoleFromToken() → capability gate
- ✅ Нет bypass. Missing/invalid token → 400/401.
- **⚠️ ПРОБЛЕМА 5:** Token передаётся в JSON body, не в header. При XSS на dashboard JS-код может прочитать token из localStorage и передать.
- **Рекомендация:** Перейти на httpOnly cookie для dashboard тоже.

**Admin Panel Auth (admin/panel/route.ts):**
- TOTP → httpOnly cookie `admin_token` → checkAdminAuth()
- CSRF token в header `X-CSRF-Token`
- ✅ Хорошая защита.

**⚠️ ПРОБЛЕМА 6: Admin session token = static secret**
```typescript
function getExpectedToken(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET;
}
```
Cookie value = env variable напрямую. Не меняется при перезагрузке. Если утечёт — access навсегда.
- **Фикс:** Генерировать сессионный токен при TOTP verify, хранить в Map с TTL.

### 3.3 Token Security

- Tokens хешируются через SHA-256 (`sha256:hex`)
- Token hashes хранятся в `memory/TEAM_ROLES.md`
- Token hashes фильтруются в read_memory output для не-admin
- ✅ Хорошо

**⚠️ ПРОБЛЕМА 7:** При создании нового team member (`team-add`), plaintext token возвращается в JSON response. Логируется в activity.jsonl? Нет, `logAdminAction` вызывается для audit, но значение `token` не логируется напрямую — передаётся только в response.

### 3.4 File Locking

**withFileLock():**
- Lock файлы в `/tmp/iam-locks/`
- 30s timeout, 5s wait
- ✅ Корректная имплементация с cleanup
- **⚠️ ПРОБЛЕМА 8:** При timeout — продолжает БЕЗ блокировки (логирует предупреждение). Это race condition.
- **Рекомендация:** При timeout — ОТКАЗЫВАТЬ в операции, не продолжать без лока.

### 3.5 Rate Limiting

- 100 calls/minute per token hash
- globalThis persistent map
- ✅ Работает корректно
- **⚠️ ПРОБЛЕМА 9:** Rate limiter только на MCP endpoint, НЕТ на dashboard API и admin panel API.
- **Рекомендация:** Добавить rate limit на dashboard route (100 req/min).

### 3.6 Secrets Exposure

| Вектор | Статус | Детали |
|--------|--------|--------|
| read_memory output | ✅ Фильтрует token_hash для не-admin | Строки с `token_hash:` удаляются |
| Activity logs | ✅ OK | Params truncated to 100 chars, no secrets |
| Error messages | ✅ OK | Generic errors, no role/scope leak |
| Git history | ⚠️ РИСК | Если .env когда-либо коммитился |
| oauth-debug.log | ❌ ПРОБЛЕМА | **Файл в корне проекта, может содержать debug данные** |
| TEAM_ROLES.md в git | ⚠️ РИСК | Token hashes в git = если hash алгоритм слаб, можно brute-force. SHA-256 стойкий, но best practice — не коммитить. |

### 3.7 CSRF

- Admin panel: ✅ CSRF token в header, validated перед POST
- Dashboard: ❌ **НЕТ CSRF PROTECTION** — dashboard POST не проверяет CSRF
  - **ПРОБЛЕМА 10:** Если dashboard token утекает (XSS/etc), любой сайт может делать POST к dashboard API
  - Смягчение: SameSite cookies не используются на dashboard (token в body)

### 3.8 Input Validation

| Endpoint | Zod? | Статус |
|----------|------|--------|
| MCP tools (create_task, send_message, etc) | ✅ | TaskSchema, MessageSchema, GoalSchema |
| MCP file tools | ✅ | z.string() params |
| Admin panel POST handlers | ❌ | **Нет Zod** — ручная проверка `if (!body.title)` |
| Dashboard POST handlers | ❌ | **Нет Zod** — ручная проверка |

**ПРОБЛЕМА 11:** Admin и Dashboard handlers не используют Zod. String coercion через `String(body.x)` работает, но нет валидации длины, формата, типа. Потенциально — можно передать object вместо string.

### Сводка безопасности

| # | Критичность | Проблема | Статус |
|---|------------|----------|--------|
| 1 | 🔴 HIGH | search_files command injection (`$()`, backticks) | НЕ ИСПРАВЛЕНО |
| 2 | 🟡 MEDIUM | git_snapshot command injection | НЕ ИСПРАВЛЕНО |
| 3 | 🟡 MEDIUM | Admin git-snapshot injection | НЕ ИСПРАВЛЕНО |
| 4 | 🟢 LOW | git-rollback — regex validates, low risk | ПРИЕМЛЕМО |
| 5 | 🟡 MEDIUM | Dashboard token в body (не httpOnly cookie) | АРХИТЕКТУРНЫЙ |
| 6 | 🟡 MEDIUM | Admin session = static env secret | НЕ ИСПРАВЛЕНО |
| 7 | 🟢 LOW | Token plaintext в team-add response | ПРИЕМЛЕМО (one-time) |
| 8 | 🟡 MEDIUM | File lock timeout → proceeds without lock | НЕ ИСПРАВЛЕНО |
| 9 | 🟡 MEDIUM | No rate limit on dashboard/admin APIs | НЕ ИСПРАВЛЕНО |
| 10 | 🟡 MEDIUM | No CSRF on dashboard API | НЕ ИСПРАВЛЕНО |
| 11 | 🟢 LOW | No Zod on admin/dashboard handlers | НЕ ИСПРАВЛЕНО |

---

## БЛОК 4: АУДИТ КОДА

### 4.1 MCP Ядро

**route.ts (~120 строк)** — ✅ ОТЛИЧНО
- Чистый, модульный, понятный
- Session tracking через globalThis
- Rate limiter inline
- Правильное создание нового McpServer для каждого запроса

**shared.ts (~180 строк)** — ✅ ХОРОШО
- Чёткие типы (ResolvedRole, ToolContext)
- safePath, matchesGlob — корректные
- File locking — работает (с оговоркой о timeout)
- ⚠️ matchesGlob: pattern `foo/*` матчит `foo/bar` и `foo`, но НЕ матчит `foo/bar/baz`. Это **правильно** для single-level matching, но может быть неочевидно.

**auth.ts (~180 строк)** — ✅ ОТЛИЧНО
- Capability system продуманный: whitelist, auto-includes, required-tools filter
- Unknown capabilities → warning в audit log
- Graceful degradation при ошибке TEAM_ROLES.md (cached fallback)
- Solo mode fallback на MCP_AUTH_TOKEN
- `_cachedTeamConfig` — **⚠️ ПРОБЛЕМА 12:** Кеш НИКОГДА не инвалидируется (кроме рестарта PM2). Если TEAM_ROLES.md обновится во время работы, новые роли не подтянутся до следующего файлового чтения (которое перезаписывает кеш). На практике loadTeamConfig вызывается на каждый запрос и читает файл, так что кеш используется только при ошибке чтения. ✅ ОК.

**validation.ts (~90 строк)** — ✅ ОТЛИЧНО
- Все схемы на месте: Task, Message, Goal, Comment
- Вложенные типы (GoalTask с comments и prs)
- `.default()` для optional полей

**memory.ts (~230 строк)** — ✅ ХОРОШО
- readRoleScopedMemory: правильная фильтрация по read_paths
- Token hash filtering для не-admin
- createPullPoolEntry: auto-link to active task, auto-status update
- ⚠️ `findActiveTaskRef` сортирует по приоритету: changes_requested > rejected > in_progress > pending — **хорошо**

**file-tools.ts (~180 строк)** — ✅ ХОРОШО  
- Tool registration условная (role.tools.includes)
- Path security: matchesGlob + safePath + validateReadPath/WritePath
- Worker write → pull-pool redirect
- `search_files` — **❌ ПРОБЛЕМА 1 (command injection)**
- ⚠️ `list_directory` проверяет `matchesGlob(path, role.read_paths)` И `matchesGlob(path + '/*', role.read_paths)` — правильная двойная проверка

**data-tools.ts (~320 строк)** — ✅ ХОРОШО
- Zod validation на create_task, send_message, create_goal
- withFileLock на все JSON операции
- update_session_notes регистрируется для ВСЕХ ролей (вне if) — **✅ правильно**, это единственный файл который worker может писать напрямую
- ⚠️ `deploy` tool использует `nohup bash ...` — нет output capture. `build` handler в admin лучше (synchronous).
- ⚠️ `git_snapshot` и `git_log` — **ПРОБЛЕМА 2 (injection)**

**worker-tools.ts (~480 строк)** — ✅ ХОРОШО
- my_workspace: multi-action hub, хорошая структура
- create_pr: валидация patch mode (проверяет count occurrences)
- onboard: comprehensive brief с tools listing
- ⚠️ `loadUserPrs` читает ВСЕ pr-* директории — при большом количестве PR будет медленно
- ⚠️ `ask_admin` находит первого admin, но если несколько admin — отправляет только первому. Правильнее отправлять конкретному admin (scope-aware).

### 4.2 Dashboard API

**route.ts (~40 строк)** — ✅ ОТЛИЧНО
- Чистый dispatcher с action routing tables
- capability-gate enforcement

**capability-gate.ts** — ✅ ОТЛИЧНО
- Полная mapping action→capability (30+ actions)
- Super admin bypass
- Actions без capability → доступны всем authenticated users

**scope-helpers.ts** — ✅ ХОРОШО
- filterByScope: super_admin видит всех кроме других super_admin
- canApplyPr: write_paths check

**worker-handlers.ts (~420 строк)** — ✅ ХОРОШО с замечаниями
- loadDashboardData: 10+ секций, comprehensive
- ⚠️ **Дублирование:** goals loading/parsing дублируется между admin и dashboard handlers
- ⚠️ `handlePrComment` ищет admin через regex по TEAM_ROLES.md вместо использования loadTeamConfig — fragile
- ⚠️ `handleRequestTask` не использует withFileLock на task-requests.json — **race condition**
- ⚠️ `handleMarkStarted` не проверяет `withFileLock` на tasks.json — **race condition**

**pr-handlers.ts (~300 строк)** — ✅ ХОРОШО
- Scope enforcement: isAuthorInScope() — правильно
- canApplyPr: write_paths check перед approve
- Auto-comments, auto-status updates, auto-notifications
- ⚠️ `prReview` не проверяет scope автора (только approve/reject проверяют). Worker review не ограничен scope.

### 4.3 Admin Panel API

**panel/route.ts (~50 строк)** — ✅ ОТЛИЧНО
- CSRF validation на POST
- Audit logging всех действий
- checkAdminAuth на GET и POST

**get-handlers.ts (~300 строк)** — ✅ ХОРОШО
- 25+ handlers: list, read, dashboard, git-log, team, tasks, messages, goals, activity, deploy, settings
- `list-dir` использует safePath — ✅
- `read` использует safePath — ✅
- ⚠️ `read` handler **НЕ фильтрует .env файлы!** Admin panel может прочитать `.env.local` через `?file=.env.local`
  - **ПРОБЛЕМА 13: КРИТИЧЕСКАЯ** — Super Admin может прочитать .env.local через Dev Console
  - MCP блокирует .env через pattern в read_file, но admin GET handler НЕ проверяет
  - **Фикс:** Добавить проверку `.env` pattern в handler `read`
- `settings-get` маскирует значения (8 chars + dots) — ✅

**post-handlers.ts (~500 строк)** — ✅ ХОРОШО с замечаниями
- 35+ handlers: save, deploy, git, team CRUD, tasks CRUD, goals CRUD, messages CRUD, PR actions
- `save` handler проверяет RULES.md и safePath — ✅
- `delete-file` проверяет RULES.MD и .env — ✅
- `team-add` генерирует crypto.randomBytes(32) token — ✅
- `team-capabilities-edit` проверяет role === 'admin' — ✅
- `goals-create-task` линкует externalTaskId — ✅
- ⚠️ Большой файл — 500+ строк, но хорошо структурирован через Record<string, PostHandler>
- ⚠️ **Нет Zod validation** — все body поля проверяются вручную через String()
- ⚠️ `pull-pool-approve` в admin НЕ проверяет scope (admin panel = Super Admin, scope = all)

### 4.4 UI Components (не читал полностью, но оценка по структуре)

- **admin/page.tsx** — тонкий оркестратор, ~150 строк ✅
- 8 tab components — хорошее разделение
- **dashboard/page.tsx** — ~550 строк, на грани `write_file` необходимости
- 4 dashboard tab components

### 4.5 Дублирование кода

| Дублирование | Где | Рекомендация |
|-------------|-----|-------------|
| Goals loading/parsing | admin/lib/shared.ts + dashboard/lib/*.ts + mcp/lib/tools/*.ts | Общий `data-layer.ts` |
| PR metadata parsing (regex) | worker-handlers.ts + pr-handlers.ts + get-handlers.ts | Общий `parsePrMeta()` |
| Team config loading | admin/lib/shared.ts + mcp/lib/auth.ts | Уже shared, но используется по-разному |
| safePath | admin/lib/shared.ts + mcp/lib/shared.ts | Два ОТДЕЛЬНЫХ identical implementations |
| Task status sync to goals | admin/lib/shared.ts + memory.ts | Два places с identical logic |
| Messages sending | worker-tools.ts + pr-handlers.ts + worker-handlers.ts | Общий `sendMessage()` |

### 4.6 TypeScript Quality

- ✅ Нет `any` кастингов в core (shared, auth, validation)
- ⚠️ Есть `as any` в data-tools.ts (goal task traversal) и post-handlers.ts
- ⚠️ Некоторые handlers используют `Record<string, unknown>` вместо typed interfaces
- ✅ Zod schemas для structured data — отлично
- ⚠️ GoalTask interface определён отдельно в admin shared.ts и в validation.ts — потенциальный drift

---

## БЛОК 5: DATA FLOW AUDIT

### Flow 1: Worker получает и выполняет задачу

```
Admin → goals-create-task (POST /api/admin/panel)
  → creates StructuredTask in data/tasks.json
  → creates GoalTask in goals.json (with externalTaskId link)
  → syncs to tasks/{role}.md (legacy)
  
Worker opens dashboard → POST /api/dashboard (no action)
  → loadDashboardData() → reads tasks.json, filters by assignee
  → returns tasks[]

Worker clicks "Start Working" → POST /api/dashboard {action: "work-prompt", taskId}
  → handleWorkPrompt() → generates prompt with:
    - Task context
    - Goal context (if goalRef)
    - Previous feedback (PR comments + goal task comments)
    - Instructions
  → Worker copies prompt to Claude MCP

AI calls onboard → reads SYSTEM_IDENTITY, CURRENT_GOAL, tasks, messages, PRs, session notes
AI calls read_file → matchesGlob check → validateReadPath → file content
AI calls create_pr → createPullPoolEntry() → pull-pool/pr-{name}-{num}/
  → auto-links task_ref (findActiveTaskRef)
  → auto-updates task status → "reviewing"
  → writes meta.md + proposed file

Admin reviews (dashboard or admin panel):
  → pr-approve → scope check → canApplyPr (write_paths) → copy to production → git commit
    → auto-updates task status → "done"
    → auto-comment on goal task
    → sends notification message
  → pr-reject → updates status → "rejected"
    → auto-updates task status → "rejected"
    → auto-comment on goal task
    → sends rejection message
  → pr-review (request-changes) → adds comment → updates task status → "changes_requested"
    → sends message to author
```

**Где может сломаться:**
1. ⚠️ `findActiveTaskRef` может вернуть wrong task если у worker несколько active tasks с одинаковым приоритетом — маловероятно, но возможно
2. ⚠️ Task status sync (data/tasks.json ↔ goals.json) — dual write, potential inconsistency при concurrent access. File lock на tasks.json НЕ ЛОЧИТ goals.json одновременно.
3. ⚠️ `handleMarkStarted` не использует withFileLock — concurrent "Start Working" может race.

### Flow 2: Permission Check при File Access

```
Token → resolveRole(request) 
  → extract Bearer token from header
  → hashToken(token) → sha256:hex
  → loadTeamConfig() → read TEAM_ROLES.md → parse YAML frontmatter
  → find roleDef by token_hash match
  → build ResolvedRole {name, role, tools, read_paths, write_paths, capabilities, scope}

read_file("app/page.tsx") →
  1. role.tools.includes('read_file') → registered? Yes/No
  2. matchesGlob("app/page.tsx", role.read_paths) → allowed?
     - developer read_paths: ["memory/*","tasks/*","messages/*","pull-pool/*","app/*","lib/*","src/*"]
     - "app/*" matches "app/page.tsx" ✅
  3. validateReadPath("app/page.tsx") → safePath → BLOCKED_PATHS check
  4. Read file content

write_file("app/page.tsx") →
  1. Worker: matchesGlob("app/page.tsx", role.write_paths) → ["pull-pool/*"] → NO
  2. Falls to pull-pool check: matchesGlob("pull-pool/*", role.write_paths) → YES
  3. → createPullPoolEntry() → pull-pool/pr-*/ 
  4. Admin: validateWritePath → direct write
```

**Где может сломаться:**
1. ✅ matchesGlob работает корректно — `app/*` матчит `app/page.tsx` но НЕ `app/api/mcp/route.ts` (single-level only)
   - **СТОП! Это ПРОБЛЕМА 14:** developer с `read_paths: ["app/*"]` может читать `app/page.tsx` но НЕ `app/api/mcp/route.ts`? Нет! Проверяем matchesGlob:
   ```
   pattern "app/*" → prefix "app"
   clean "app/api/mcp/route.ts".startsWith("app/") → TRUE ✅
   ```
   Так что `app/*` матчит ВСЁ внутри app/ включая вложенные. Developer МОЖЕТ читать `app/api/mcp/route.ts`.
   - **ПРОБЛЕМА 14: Developer может читать ВСЕ файлы API включая security-critical code.** read_paths `["app/*"]` слишком широкий.
   - **Фикс:** Изменить developer preset на `["app/page.tsx", "app/components/*", "app/lib/*"]` или добавить exclusion patterns.

### Flow 3: Message Flow

```
Admin sends message (dashboard/admin panel):
  → POST /api/admin/panel {action: "messages-send-v2", to, topic, body}
  → Adds to data/messages.json (structured)
  → ALSO writes to messages/to-{role}/{ts}.md (legacy markdown)

Worker receives (dashboard load):
  → loadDashboardData → reads messages.json → filters by to === role.name
  → Returns in messages[]

Worker replies:
  → POST /api/dashboard {action: "send-message", to, topic, body}
  → handleSendMessage → writes to messages.json
  → (NO legacy markdown write for worker messages)

Worker replies on PR:
  → POST /api/dashboard {action: "pr-comment", prId, text}
  → handlePrComment → writes to pull-pool/{prId}/comments.json
  → Auto-sends message to admin (finds admin via regex on TEAM_ROLES.md)
  → Auto-adds comment to linked goal task (via taskRef)
```

**Где может сломаться:**
1. ⚠️ `handleSendMessage` не использует withFileLock — concurrent messages can corrupt messages.json
2. ⚠️ Admin legacy markdown write (messages/to-{role}/) + structured JSON — dual write, potential desync
3. ⚠️ Worker admin finding in `handlePrComment` — regex-based, fragile. If YAML format changes, breaks.

---

## БЛОК 6: РЕКОМЕНДАЦИИ ДЛЯ DEV CONSOLE

### 6.1 Финальная Матрица Файлового Доступа

```
ALWAYS_HIDDEN (никто через Dev Console, только SSH):
  - .env.local
  - .env.example  
  - ecosystem.config.js
  - oauth-debug.log
  - app/api/mcp/**          — MCP server core
  - app/api/admin/**         — Admin panel API
  - app/api/dashboard/**     — Dashboard API
  - app/api/oauth-metadata/** — OAuth endpoints
  - app/api/skills-pack/**
  - app/api/mcp/authorize/**
  - app/api/mcp/register/**
  - app/api/mcp/token/**
  - lib/**                   — Shared auth libraries
  - node_modules/
  - .next/
  - .git/
  - package-lock.json
  - scripts/**               — System scripts
  - next-env.d.ts
  - tsconfig.json            — Build config

SUPER_ADMIN_ONLY (видит только Super Admin через admin panel):
  - memory/TEAM_ROLES.md     — Contains token hashes
  - logs/activity.jsonl      — Audit log (contains user data)
  - logs/deploy.jsonl        — Deploy logs
  - data/settings.json       — App settings
  - data/task-requests.json  — Task requests
  - IDEAS/**                 — Strategic documents
  - install.sh
  - next.config.mjs

ADMIN_CONFIGURABLE (видимость определяется read_paths):
  - app/page.tsx             — Landing page
  - app/layout.tsx
  - app/globals.css
  - app/components/**
  - app/admin/page.tsx       — Admin UI (read-only for review)
  - app/admin/components/**  — Admin UI components
  - app/admin/types.ts, styles.ts
  - app/dashboard/**         — Dashboard UI
  - app/lib/**               — Utility libs
  - app/docs/**
  - memory/*.md (кроме TEAM_ROLES)
  - data/tasks.json
  - data/messages.json
  - goals.json
  - pull-pool/**
  - tasks/**
  - messages/**
  - bootstrap-prompts/**
  - skills/**
  - README.md
  - public/**

WORKER_PATHS (по ролям — defaults):
  See presets below
```

### 6.2 Рекомендованные Path Presets

**Developer:**
```yaml
read_paths:
  - "memory/ARCHITECTURE.md"
  - "memory/CURRENT_GOAL.md"
  - "memory/NEXT_ACTIONS.md"
  - "memory/SYSTEM_IDENTITY.md"
  - "memory/WEEKLY_PROGRESS.md"
  - "memory/workers/*"          # свои session notes
  - "tasks/*"
  - "messages/*"
  - "pull-pool/*"
  - "app/page.tsx"              # landing page
  - "app/layout.tsx"
  - "app/globals.css"
  - "app/components/*"
  - "app/dashboard/*"           # dashboard UI (for reference)
  - "app/lib/*"
  - "bootstrap-prompts/*"
  - "skills/*"
  - "goals.json"                # read-only goals
  - "README.md"
write_paths:
  - "pull-pool/*"
```

⚠️ **УБРАТЬ `app/*` из developer read_paths** — слишком широкий, включает API security code.

**Marketer:**
```yaml
read_paths:
  - "memory/ARCHITECTURE.md"
  - "memory/CURRENT_GOAL.md"
  - "memory/SYSTEM_IDENTITY.md"
  - "memory/workers/*"
  - "tasks/*"
  - "messages/*"
  - "app/page.tsx"              # landing page
  - "app/globals.css"
  - "public/*"
  - "bootstrap-prompts/*"
  - "README.md"
write_paths:
  - "pull-pool/*"
```

**Reviewer:**
```yaml
read_paths:
  - "memory/*"                  # всё кроме TEAM_ROLES (фильтруется в memory.ts)
  - "tasks/*"
  - "messages/*"
  - "pull-pool/*"
  - "app/page.tsx"
  - "app/components/*"
  - "app/dashboard/*"
  - "app/lib/*"
  - "goals.json"
  - "bootstrap-prompts/*"
  - "README.md"
write_paths: []                 # read-only role
```

### 6.3 Security Recommendations (до запуска Dev Console)

**КРИТИЧЕСКИЕ (исправить ПЕРЕД запуском):**

1. **🔴 search_files command injection** — Заменить `execSync` с string interpolation на safe альтернативу:
   ```typescript
   execSync(`grep -rn -- ${shellEscape(query)} ${safeDirPath}`)
   // или лучше:
   execFileSync('grep', ['-rn', '--include=*.ts', ...includes, query, safeDirPath])
   ```

2. **🔴 Admin `read` handler не блокирует .env** — Добавить:
   ```typescript
   'read': async (req) => {
     const filePath = req.nextUrl.searchParams.get('file');
     if (!filePath) return error('file param required');
     if (filePath.includes('.env')) return error('Protected file', 403);
     // ...
   }
   ```

3. **🔴 Developer read_paths `["app/*"]` слишком широкий** — Сузить до конкретных subdirectories, исключая `app/api/`.

**ВАЖНЫЕ (исправить в ближайшее время):**

4. **🟡 Добавить rate limiting на dashboard API** — Скопировать паттерн из MCP route.
5. **🟡 Добавить CSRF на dashboard API** — Или перейти на httpOnly cookie.
6. **🟡 withFileLock timeout → fail** — Не продолжать без лока, возвращать error.
7. **🟡 Добавить withFileLock** на dashboard handlers: handleSendMessage, handleMarkStarted, handleRequestTask.
8. **🟡 git_snapshot injection** — Использовать `execFileSync` или env variable.

**РЕКОМЕНДОВАННЫЕ (улучшения):**

9. **🟢 Удалить oauth-debug.log** из проекта.
10. **🟢 Admin session → dynamic token** вместо static env secret.
11. **🟢 Zod validation** на admin/dashboard handlers.
12. **🟢 Общий data layer** — вынести Goals/Tasks/Messages в отдельный модуль.

### 6.4 Архитектурные Рекомендации

**Что спроектировано ОТЛИЧНО:**
- 🏆 Ролевая модель (4 уровня) — продуманная, правильная
- 🏆 Capability system с whitelist + auto-includes — enterprise-grade
- 🏆 Pull-pool workflow — безопасный, с auto-linking к tasks/goals
- 🏆 MCP modular split — route.ts (handler) + lib/ (logic) + tools/ (per-domain)
- 🏆 Zod schemas для structured data
- 🏆 Activity logging — comprehensive
- 🏆 File locking pattern (except timeout behavior)
- 🏆 Token hashing + hash filtering в read_memory

**Что нужно рефакторить:**
- ⚠️ **Дублирование safePath** — два identical implementations. Вынести в общий `lib/security.ts`.
- ⚠️ **Дублирование task↔goal sync** — три места с identical logic. Вынести в `lib/data/sync.ts`.
- ⚠️ **PR metadata parsing regex** — fragile, используется в 5+ местах. Создать `parsePrMetadata()`.
- ⚠️ **Messages dual write** (JSON + legacy markdown) — Legacy markdown можно убрать, всё через JSON.
- ⚠️ **matchesGlob single-level** — для Dev Console нужен **exclusion pattern** (`!app/api/*`). Текущая реализация не поддерживает.

**Что требует внимания:**
- ⚠️ **goals.json в корне** — не в data/. Перенести в `data/goals.json` для consistency.
- ⚠️ **dashboard/page.tsx ~550 строк** — на грани. При добавлении Dev Console может перевалить за 600. Рассмотреть дополнительный split.
- ⚠️ **Отсутствие data backup** — нет механизма backup для data/*.json и goals.json. Git snapshot помогает, но не автоматический.
- ⚠️ **globalThis паттерн** для sessions/rateLimits/csrf — работает с PM2 single instance, но не масштабируется на несколько процессов.

---

## ИТОГИ

| Метрика | Оценка |
|---------|--------|
| **Безопасность** | 7/10 — хорошая база (hashing, RBAC, CSRF), но есть command injection и missing checks |
| **Корректность** | 8/10 — data flows работают, race conditions возможны но маловероятны |
| **Качество кода** | 8/10 — модульная структура, TypeScript, Zod, но есть дублирование |
| **Готовность к Dev Console** | 6/10 — нужны fixes #1, #2, #3 из security recommendations |

**TOP 3 действия перед Dev Console:**
1. Fix command injection в search_files (execFileSync)
2. Блокировать .env в admin `read` handler
3. Сузить developer read_paths (убрать app/api/* доступ)

---

*Аудит проведён на основе полного чтения всех .ts/.tsx API/handler/tool файлов проекта через MCP tools.*