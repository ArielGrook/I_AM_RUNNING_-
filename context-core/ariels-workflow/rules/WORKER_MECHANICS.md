# SOURCE OF TRUTH: Механики Системы IAM-CLIENT-OS
*Обязательное чтение перед любой работой с ролями, workflow, Dashboard UI, MCP tools.*
*Каждый пункт — закон. Если реализация противоречит этому файлу — баг в реализации.*

---

## ЧТО ЭТО ЗА СИСТЕМА

IAM-CLIENT-OS — AI Native командная операционная система для бизнеса.
Вся работа команды ведётся через Claude/ChatGPT как основной интерфейс (MCP).
Человек (Ariel) устанавливает систему клиенту на VPS — клиент получает готовую AI-команду.

**Иерархия:**
```
Super Admin (Ariel)
    └── Admin (Aliks и др.) — управляет своей командой
            └── Workers (developer, marketer, reviewer, ...) — выполняют задачи
```

**Ключевой принцип:** Новая роль — это НЕ отдельная система. Это ещё один участник общего workflow. Все роли работают по одним и тем же трём петлям: Таски → PR → Сообщения. Если добавляешь роль — ты интегрируешь её в эти петли, а не строишь что-то новое.

---

## ПЕТЛЯ 1: ТАСКИ

### Как работает:
```
Admin создаёт таск → worker получает MESSAGE + PUSH
Worker берёт таск (take_task) → статус in_progress
Worker делает PR → статус reviewing
Admin approve PR → таск автора done + MESSAGE + PUSH
Admin reject PR → таск rejected + MESSAGE + PUSH + причина
```

### Статусы таска:
`pending` → `in_progress` → `reviewing` → `done`
`reviewing` → `changes_requested` → `in_progress` (повторный цикл)
`reviewing` → `rejected` (финал)

### ОБЯЗАТЕЛЬНО для каждого worker:
- Видит свои таски в **Dashboard Work Tab → My Tasks**
- Получает **MESSAGE + PUSH** при назначении
- Получает **MESSAGE + PUSH** при done/rejected/changes_requested
- Может взять Available Task через `my_workspace("take_task")`
- Таск закрывается (done) ТОЛЬКО когда Admin approve-ит PR или вручную

### ОБЯЗАТЕЛЬНО при approve PR (файл: `app/api/dashboard/lib/pr-handlers.ts`, `prApprove()`):
1. Таск АВТОРА PR → `done` (через `task_ref` в meta.md)
2. Таск REVIEWER-а (если был assigned) → `done` (поиск по `assignee === reviewerName && title.includes(prId)`)
3. MESSAGE + PUSH автору
4. Если reviewer — дополнительный MESSAGE + PUSH reviewer-у (TODO: проверить наличие)

---

## ПЕТЛЯ 2: PULL REQUESTS

### Как работает:
```
Worker создаёт PR (create_pr) → появляется в pull-pool/ со статусом "pending"
Admin открывает Pull Pool → видит PR, читает diff
Reviewer открывает Pull Pool → видит все pending/reviewing PRs

Reviewer может:
  - reviewer_approve_pr → статус "reviewer_approved" (ждёт финального approve от Admin)
  - reviewer_request_changes → статус "changes_requested", push автору

Admin может:
  - Comment → добавляет комментарий
  - Approve → файл применяется, таски закрываются, push автору
  - Approve+Deploy → то же + запуск деплоя
  - Reject → таск rejected, push автору + причина
```

### Статусы PR:
`pending` → первоначальный
`reviewing` → есть комментарии (не от автора)
`reviewer_approved` → reviewer одобрил, ждёт admin
`approved` → admin финально approve (файл применён)
`changes_requested` → нужны правки (reviewer или admin)
`rejected` → отклонён (финал)

### ОБЯЗАТЕЛЬНО — Assign Reviewer УБРАН:
- Assign-reviewer убран из UI и workflow
- Все PRs видны ВСЕМ reviewer-ам и admin-ам без назначения
- Кто первый взялся — тот ревьюит
- Backend handlers assignReviewer() остались в коде, но не используются из UI

### ОБЯЗАТЕЛЬНО для каждого worker:
- Видит свои PR в **Dashboard Work Tab → My PRs**
- Видит статус каждого PR + последний комментарий
- Получает **MESSAGE + PUSH** при любом изменении статуса

### ОБЯЗАТЕЛЬНО для Admin:
- **Pull Pool tab** в Dashboard (идентично Admin Panel)
- Dropdown Assign Reviewer — ТОЛЬКО роли с `role === "reviewer"`
- Approve / Approve+Deploy / Reject / Comment
- При approve: файл применяется через `safePath()` + git commit

### ОБЯЗАТЕЛЬНО для Reviewer:
- Видит ВСЕ pending/reviewing PRs в **Pull Pool Tab** (без назначения)
- Видит "Needs Your Review" секцию в **Work Tab** (быстрый доступ)
- Кнопки Approve (Review) / Request Changes в Pull Pool Tab (идентично Admin Panel)
- MCP tools: `reviewer_approve_pr`, `reviewer_request_changes`
- При reviewer approve → статус `reviewer_approved`, NOT `approved` (admin должен финально подтвердить)
- `reviewer_approve_pr` принимает статусы: `pending`, `reviewing`, `changes_requested`
- `reviewer_request_changes` принимает статусы: `pending`, `reviewing`, `reviewer_approved`

---

## ПЕТЛЯ 3: СООБЩЕНИЯ

### Канал сообщений — два способа:
1. **Структурированные** (`sendMessage`) — тема + тело, как email. Для системных уведомлений.
2. **Чат** (`sendChatMessage`) — WhatsApp-стиль, появляется в Conversations. Для живого общения.

### ВСЕГДА используй правильный импорт:
```typescript
import { sendMessage, sendChatMessage, pushNewMessages } from '@/lib/data';
// sendChatMessage → auto-push + auto-conversation (предпочтительно для живых сообщений)
// sendMessage → manual saveMessages + pushNewMessages (для системных уведомлений)
```

### ОБЯЗАТЕЛЬНЫЕ автоматические события → сообщение + push:
| Событие | От кого | Кому | Файл |
|---------|---------|------|------|
| Таск назначен | Admin | Worker (assignee) | `post-handlers.ts` |
| Таск done | Admin | Worker | `post-handlers.ts` |
| PR approved | Admin | PR author | `pr-handlers.ts → prApprove()` |
| PR rejected | Admin | PR author | `pr-handlers.ts → prReject()` |
| PR changes_requested | Admin/Reviewer | PR author | `pr-handlers.ts → prReview()` |
| PR assigned reviewer | Admin | Reviewer | `pr-handlers.ts → prAssignReviewer()` |
| Reviewer approved PR | Reviewer | Admin (PR author field) | `pr-handlers.ts → prReviewerApprove()` |

**Если событие есть, а push нет — это БАГ.**

### ОБЯЗАТЕЛЬНО для каждого worker:
- Видит чаты в **Dashboard Messages Tab** (WhatsApp-стиль)
- Видит Inbox (последние 3-5) в **Work Tab**
- Получает PUSH при новом сообщении
- Может отправлять через `my_workspace("message")` или `my_workspace("ask_admin")`

---

## DASHBOARD UI — ЗАКОН ПАРИТЕТА

**Главный принцип:** Dashboard для Admin = Admin Panel. Один к одному.
Если функция есть в Admin Panel — она ОБЯЗАНА быть в Dashboard с идентичным UI.
Единственная разница — capability gating.

### Что видит каждая роль:

**Все workers (базово):**
- Work Tab: My Tasks, My PRs (со статусом + последний комментарий), Inbox, Available Tasks
- Goals Tab: цели проекта (read-only)
- Messages Tab: WhatsApp-стиль чат
- Setup Tab: bootstrap prompt, профиль (аватар + цвет), push toggle

**Admin дополнительно (capability: `manage_team`):**
- Team Tab: карточки подчинённых — аватар, статус, tools count, кнопки: 💬 Chat, 📋 Assign Task, 🔑 New Token, ⚙️ Tools
- Pull Pool Tab (capability: `review_prs`): полная копия Admin Panel Pull Pool

**Reviewer дополнительно (capability: `review_prs`):**
- Work Tab → Needs Your Review секция (PR назначенные на тебя)
- Pull Pool Tab: только PR назначенные на тебя

**Super Admin:**
- Всё что у Admin + деплой + полный team management

---

## MCP TOOLS — СТАНДАРТ

### Минимальный набор для ЛЮБОЙ роли:
```
read_file, list_directory, read_memory, my_workspace, onboard, list_goals, send_message
```

### Каждый worker имеет доступ к:
- `my_workspace(status)` — обзор: таски + PR + inbox
- `my_workspace(my_prs)` — детальный список своих PR
- `my_workspace(take_task)` — подать заявку на Available Task
- `my_workspace(ask_admin)` — сообщение admin-у
- `my_workspace(message)` — сообщение любому члену команды
- `my_workspace(update_notes)` — сохранить заметки сессии
- `my_workspace(how_to)` — справка по workflow
- `create_pr(title, description, target_file, content)` — создать PR

### Reviewer дополнительно:
- `reviewer_approve_pr(prId, reason)` — одобрить PR (→ reviewer_approved)
- `reviewer_request_changes(prId, comment)` — запросить правки (→ changes_requested)
- `update_doc(path, content)` — обновить документ (→ pull-pool)

---

## ПРИ ДОБАВЛЕНИИ НОВОЙ РОЛИ — ЧЕКЛИСТ

Это не опциональный список. Это контракт. Каждый пункт обязателен.

### DATA LAYER:
```
□ lib/data/team.ts → ROLE_PRESETS["новая_роль"] добавлен
  (tools, read_paths, write_paths, capabilities)
```

### MCP SERVER:
```
□ app/api/mcp/lib/tools/{role}-tools.ts создан (если нужны кастомные tools)
□ app/api/mcp/route.ts → import + register новых tools
□ app/api/mcp/lib/auth.ts → capabilities для роли в buildResolvedRole()
```

### ADMIN PANEL (app/api/admin/lib/):
```
□ post-handlers.ts → ALL_TOOLS whitelist включает tools новой роли
□ types.ts → TOOL_CATEGORIES обновлён (для UI тулбокса)
□ types.ts → ROLE_TOOL_PRESETS обновлён (preset для UI)
```

### DASHBOARD UI:
```
□ app/dashboard/components/DashboardWorkTab.tsx →
  если роль reviewer: добавить "Needs Your Review" секцию
  (идентично Admin Panel Review Queue UI)
□ Если роль имеет review_prs capability → Pull Pool tab visible
□ app/dashboard/route.ts → новые handlers если нужны
```

### TEAM_ROLES.md:
```
□ Существующие пользователи этой роли — обновить tools список
□ capabilities поле присутствует (иначе крашится AdminTeamTab)
□ tools, read_paths, write_paths, scope — все поля обязательны
```

### WORKFLOW ВЕРИФИКАЦИЯ (не закрывай задачу без этого):
```
□ Admin назначает таск → worker видит в My Tasks + push приходит
□ Worker create_pr → PR виден в My PRs со статусом pending
□ Admin открывает Pull Pool → видит PR нового worker-а
□ Admin approve → PR author получает push + таск done
□ Admin reject → PR author получает push + причина
□ Если reviewer: assign reviewer → reviewer получает TASK + MESSAGE + PUSH
□ Если reviewer: reviewer approve → статус reviewer_approved + push admin-у
□ Сообщение admin → worker: появляется в Messages Tab + push
□ Сообщение worker → admin: появляется в admin Inbox + push
```

---

## КЛЮЧЕВЫЕ ФАЙЛЫ ДЛЯ БЫСТРОЙ НАВИГАЦИИ

| Что менять | Файл |
|-----------|------|
| PR approve/reject логика | `app/api/dashboard/lib/pr-handlers.ts` |
| Таск создание/назначение | `app/api/admin/lib/post-handlers.ts` |
| Worker MCP tools | `app/api/mcp/lib/tools/worker-tools.ts` |
| Reviewer MCP tools | `app/api/mcp/lib/tools/reviewer-tools.ts` |
| Capabilities + role resolve | `app/api/mcp/lib/auth.ts` |
| Dashboard Work Tab UI | `app/dashboard/components/DashboardWorkTab.tsx` |
| Dashboard Pull Pool UI | `app/dashboard/components/DashboardPullPoolTab.tsx` |
| Dashboard Team Tab UI | `app/dashboard/components/DashboardTeamTab.tsx` |
| Admin Pull Pool UI | `app/admin/components/AdminPullPoolTab.tsx` |
| Role presets + data | `lib/data/team.ts` |
| All data operations | `lib/data/index.ts` (НИКОГДА не читай JSON напрямую) |
| Push notifications | `lib/push.ts` + `public/sw.js` |
| Tool UI categories | `app/api/admin/lib/types.ts` |
