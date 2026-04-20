---
version: 5
last_updated: "2026-04-17T16:36:00Z"
updated_by: "claude"
schema: "architecture_v1"
required_fields: ["project_name", "tech_stack"]
project_name: "I AM RUNNING — Team Workspace"
tech_stack: ["next.js 15.5.14", "typescript", "pm2", "nginx", "mcp", "web-push"]
---

# Project Architecture

*Complete map of this project. All AI agents read this before working.*

---

## 🚨 READ THIS FIRST — `DEVELOPMENT_VS_CLIENT.md`

**Before touching any file**, read `DEVELOPMENT_VS_CLIENT.md` in the project root.

This repository is simultaneously:
1. Our development environment (`test.lego-base.online`) — contains our dev data
2. The source for client installations (via `scripts/iam-client.sh`) — must stay clean

Confusing these two has been the single biggest source of bugs. `DEVELOPMENT_VS_CLIENT.md` explains which files ship to clients, which don't, and the mental test to apply before every edit.

---

## ⚠️ Платформенный контекст — читай первым

Этот сервер — **Team Workspace**, часть платформы **I AM RUNNING** (iamrunning.online).
Это НЕ отдельный бизнес. Продаётся под брендом I AM RUNNING.

```
I AM RUNNING (платформа)
├── iamrunning.online    — Website Builder SaaS (сервер 94.176.238.108)
├── iam-client-os        — Team Workspace бэкенд (ЭТОТ СЕРВЕР, 185.5.55.111)
└── iamrunner.ai         — Desktop Client (локально, → будет iamrunning.ai)
```

**Текущий приоритет:** iam-client-os — финальный рывок к первому клиенту.
iamrunner.ai заморожен до вывода iam-client-os на рынок.

---

## Как работать с проектом

**Начало каждой сессии:**
```
read_memory  → загружает все memory/ файлы автоматически
```

**Стратегические документы платформы:** `IDEAS/main_workflow/`
- `ARIEL_WORKFLOW.md` — правила, серверы, быстрый старт
- `IAM_CLIENT_OS_MASTER.md` — этот продукт
- `IAMRUNNER_AI_MASTER.md` — desktop client
- `IAMRUNNING_ONLINE_MASTER.md` — платформа целиком

**Deploy:** `git_snapshot` → `deploy` (требует commit <5 мин)

---

## Tech Stack

- Next.js 15.5.14
- TypeScript
- PM2 + Nginx
- MCP Server v2.0.0
- web-push (VAPID push notifications)

## Directory Structure

```
/var/www/iam-os/
├── lib/data/                  — ⭐ ЕДИНЫЙ DATA LAYER (source of truth)
│   ├── index.ts               — Public API: import { ... } from '@/lib/data'
│   ├── constants.ts           — All paths (PROJECT_ROOT, DATA_DIR, GOALS_FILE, etc.)
│   ├── security.ts            — safePath, matchesGlob (!exclusion), validateReadPath
│   ├── file-lock.ts           — withFileLock (throws on timeout)
│   ├── goals.ts               — loadGoals, saveGoals, findGoalTask, addGoalTaskComment, syncTaskStatusToGoals
│   ├── tasks.ts               — loadTasks, saveTasks, updateTaskStatus, findActiveTaskRef, TASK_TRANSITIONS
│   ├── messages.ts            — loadMessages, saveMessages, sendChatMessage, sendGroupMessage, sendNotification, deleteMessage, deleteConversation
│   ├── pull-pool.ts           — parsePrMeta, loadPrComments, addPrComment, loadAllPrs, createPullPoolEntry
│   ├── team.ts                — loadTeamRoles, saveTeamRoles, ROLE_PRESETS, RoleEntry
│   ├── activity.ts            — logActivity (MCP), logAdminAction (admin panel)
│   └── yaml.ts                — parseFrontmatter
│
├── lib/push.ts                — ⭐ PUSH NOTIFICATIONS SERVER MODULE
│   ├── addSubscription, removeSubscription, removeSubscriptionsByHash
│   ├── sendPushToUser, sendPushToAll, getSubscriptionsForUser
│   └── getVapidPublicKey
│
├── lib/dashboard/session.ts   — Dashboard httpOnly cookie sessions
├── lib/admin/checkAdminAuth.ts — Admin TOTP cookie sessions
├── lib/admin/totp-secret.ts   — TOTP secret management (settings.json override)
├── lib/web-push.d.ts          — TypeScript declaration for web-push module
│
├── app/                       — Next.js app router
│   ├── api/mcp/               — MCP server (tools + auth + memory)
│   │   ├── route.ts           — HTTP handler, session tracking, rate limiter
│   │   └── lib/
│   │       ├── shared.ts      — MCP types only (ResolvedRole, ToolContext, ok/err)
│   │       ├── auth.ts        — resolveRole, loadTeamConfig, capabilities
│   │       ├── memory.ts      — readRoleScopedMemory, createPullPoolEntry
│   │       ├── validation.ts  — Zod schemas
│   │       └── tools/         — file-tools, data-tools, worker-tools
│   │
│   ├── api/admin/             — Admin panel API (TOTP-protected)
│   │   ├── panel/route.ts     — GET/POST dispatcher + CSRF
│   │   └── lib/
│   │       ├── shared.ts      — Thin wrapper: re-exports from lib/data + CSRF + settings
│   │       ├── get-handlers.ts
│   │       └── post-handlers.ts — ⚡ pushNewMessages integrated
│   │
│   ├── api/dashboard/         — Dashboard API (token-auth)
│   │   ├── route.ts           — Dispatcher + capability gate
│   │   ├── auth/route.ts      — POST login / DELETE logout (httpOnly cookie)
│   │   └── lib/
│   │       ├── shared.ts      — Re-exports from lib/data + RequestBody + json helper
│   │       ├── capability-gate.ts
│   │       ├── scope-helpers.ts
│   │       ├── validation.ts  — 15 Zod schemas
│   │       ├── worker-handlers.ts — ⚡ pushNewMessages integrated
│   │       ├── pr-handlers.ts    — ⚡ pushNewMessages integrated
│   │       ├── team-handlers.ts  — ⚡ pushNewMessages integrated
│   │       ├── goals-handlers.ts
│   │       └── messaging-handlers.ts — conversations, groups, profiles, delete
│   │
│   ├── api/push/              — Push notification API
│   │   ├── route.ts           — GET vapid key, POST subscribe, DELETE unsubscribe
│   │   └── test/route.ts      — Test endpoint (send push via curl)
│   │
│   ├── admin/                 — Admin panel UI (8 tab components)
│   ├── dashboard/             — User dashboard UI (4 tab components)
│   ├── lib/
│   │   ├── useIsMobile.ts     — Responsive hook (768px breakpoint)
│   │   └── usePushNotifications.ts — Client push hook (SW register, subscribe/unsub)
│   └── page.tsx               — Landing page
│
├── public/
│   └── sw.js                  — ⭐ Service Worker for push notifications
│
├── data/                      — Structured JSON data
│   ├── goals.json             — Goals → Subgoals → Tasks
│   ├── tasks.json             — Structured tasks
│   ├── messages.json          — Messages (V1+V2, auto-migrated)
│   ├── conversations.json     — Conversation records (DM + group)
│   ├── user-profiles.json     — Avatars + nickname colors (base64)
│   ├── task-requests.json     — Worker task requests
│   ├── push-subscriptions.json — Push notification subscriptions
│   └── settings.json          — App settings (TOTP, superAdminName)
│
├── memory/                    — AI persistent memory (YAML frontmatter)
│   ├── RULES.md               — 🔒 Locked security rules
│   ├── TEAM_ROLES.md          — Role definitions + token hashes
│   ├── ARCHITECTURE.md        — This file
│   ├── SYSTEM_IDENTITY.md, CURRENT_GOAL.md, NEXT_ACTIONS.md, WEEKLY_PROGRESS.md
│   └── workers/               — Per-user session notes
│
├── source-of-truth/             — ⭐ ОБЯЗАТЕЛЬНЫЕ ЧЕКЛИСТЫ (читай перед работой с ролями/workflow)
│   ├── README.md                — Индекс source-of-truth файлов
│   └── WORKER_MECHANICS.md      — Что ОБЯЗАН иметь каждый worker (таски, сообщения, PR, push, UI)
│
├── pull-pool/                 — Worker PRs (sandboxed changes)
├── scripts/                   — deploy-logged.sh, watchdog, post-commit
├── logs/                      — activity.jsonl, deploy.jsonl
└── IDEAS/                     — Strategic documents, brainstorms
```

## Data Layer — How to Use

**ALL data operations go through lib/data/:**
```typescript
import { loadGoals, sendMessage, pushNewMessages, safePath } from '@/lib/data';
```

**NEVER read/write JSON files directly.** Use the functions from lib/data.

| Operation | Function | Module |
|-----------|----------|--------|
| Load goals | `loadGoals()` | goals.ts |
| Save goals | `saveGoals(goals, phases?)` | goals.ts |
| Find goal task | `findGoalTask(goals, taskRef)` | goals.ts |
| Load tasks | `loadTasks()` | tasks.ts |
| Update task status | `updateTaskStatus(taskId, status)` | tasks.ts (auto-syncs to goals!) |
| Send message | `sendMessage({from, to, topic, body})` | messages.ts (with file lock + auto-push!) |
| Send chat | `sendChatMessage(from, to, text)` | messages.ts (auto-push, auto-conversation) |
| Send group msg | `sendGroupMessage(from, groupId, text)` | messages.ts (push to all participants) |
| Send notification | `sendNotification(from, to, text, metadata)` | messages.ts (system messages) |
| Delete message | `deleteMessage(messageId)` | messages.ts (hard delete) |
| Delete conversation | `deleteConversation(conversationId)` | messages.ts (deletes all messages + record) |
| Push notify batch | `pushNewMessages([msg1, msg2])` | messages.ts (for manual saveMessages patterns) |
| Load profiles | `loadProfiles()` / `saveProfile(profile)` | messages.ts |
| Parse PR | `parsePrMeta(prId)` | pull-pool.ts |
| Load team | `loadTeamRoles()` | team.ts |
| Check path | `safePath(path)`, `matchesGlob(path, patterns)` | security.ts |
| Lock file | `withFileLock(name, fn)` | file-lock.ts |

## Push Notifications — How It Works

**Architecture:** Service Worker + Web Push API + VAPID keys

**Server flow:**
1. Client subscribes via `/api/push` POST (stores in `data/push-subscriptions.json`)
2. `sendMessage()` in data layer auto-triggers push to recipient
3. Manual patterns use `pushNewMessages([newMsg])` after `saveMessages()`
4. `lib/push.ts` sends via `web-push` with VAPID keys from `.env.local`
5. Expired subscriptions auto-cleaned on 410 response

**Client flow:**
1. `usePushNotifications()` hook registers SW and manages subscription state
2. Auto-prompt on login (both dashboard + admin panel)
3. Bell button for manual toggle (🔔/🔕)
4. `public/sw.js` handles push events → shows notification → click opens dashboard

**VAPID keys:** stored in `.env.local` as `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`

**Test endpoint:** `curl -X POST http://localhost:3000/api/push/test -H "Content-Type: application/json" -d '{"to":"Name","title":"Test","body":"Hello"}'`

## Security Rules

- Deploy requires fresh git snapshot (<5 min old)
- .env files blocked on READ and WRITE
- matchesGlob supports exclusion patterns: `!app/api/*`
- withFileLock throws on timeout (never proceeds without lock)
- Rate limiting: 100 req/min per token on MCP + Dashboard
- CSRF tokens on admin panel (8h TTL)
- Dynamic session tokens (randomBytes + globalThis Map)
- httpOnly cookies for dashboard sessions
- Zod validation on all dashboard handlers (15 schemas)
- TOTP re-issue requires code confirmation before activation

## ⚠️ CRITICAL GOTCHA — Добавление нового MCP sub-action (мега-tools v2)

**Архитектура:** 6 мега-tools (files, tasks, communication, goals, code_review, devops).
Каждый объединяет группу sub-actions. `role.tools` хранит гранулярные permissions: `"files.read"`, `"devops.deploy"`.

**Добавить новый sub-action — 3 шага:**

1. **Реализация** → добавить case в `app/api/mcp/lib/tools/*-mega.ts` (files-mega, tasks-mega, communication-mega, goals-mega, review-mega, devops-mega)
2. **Регистрация** → добавить запись в `lib/tools-registry.ts` → `TOOL_REGISTRY[megaTool].sub_actions`
3. **Существующие пользователи** → обновить `memory/TEAM_ROLES.md` (добавить `"megaTool.subAction"` в tools массивы)

**Всё остальное деривируется АВТОМАТИЧЕСКИ из TOOL_REGISTRY:**
- `ALL_ADMIN_TOOLS` (auth.ts) — auto
- `ROLE_TOOL_PRESETS` (team.ts) — auto
- `ALL_TOOLS` whitelist (post-handlers.ts) — auto
- UI: DashboardTeamTab grouped checkboxes — auto

**Если добавляешь НОВЫЙ мега-tool** (редко): нужен новый `*-mega.ts` + import в `route.ts` + новый ключ в TOOL_REGISTRY + тип в MegaToolName.

## IDEAS/ — Структура документации

```
IDEAS/
├── README.md                    — навигационный индекс
├── main_workflow/               — ⭐ СТРАТЕГИЧЕСКИЕ ДОКУМЕНТЫ (читай здесь)
│   ├── ARIEL_WORKFLOW.md        — личный source of truth Ариэля
│   ├── IAMRUNNING_ONLINE_MASTER.md — платформа I AM RUNNING целиком
│   ├── IAM_CLIENT_OS_MASTER.md  — этот продукт
│   ├── IAMRUNNER_AI_MASTER.md   — desktop client
│   ├── IAMRUNNER_AI_GTM.md      — go-to-market
│   └── CURSOR_WORKFLOW_STRATEGY.md — как работать с Cursor
├── specs/                       — спецификации фич (MARKETER_SPEC, REVIEWER_SPEC, MCP_FINETUNE_SPEC)
├── handoffs/                    — session handoffs между чатами
├── audits/                      — аудиты и конкурентный анализ
├── concepts/                    — идеи и концепты
└── docs/                        — правила и документация
```

## Do Not Touch

- memory/RULES.md — locked by system
- .env.local — secrets (VAPID keys, TOTP, tokens)
- app/api/** — security-critical code (hidden from workers via !app/api/* exclusion)
- node_modules/, .next/

---

*Updated: 08.04.2026*
