# SOURCE OF TRUTH: Role Contract — IAM-CLIENT-OS
*Читается перед созданием ЛЮБОЙ новой роли. Это минимальный контракт, который обязана выполнять каждая роль.*

---

## Что такое роль

Роль — это набор разрешений + UI + MCP tools, которые вместе позволяют человеку работать в системе.
Роль НЕ является изолированной системой. Она интегрируется в общий workflow через три петли:

```
Петля 1: ТАСКИ    — получить задачу → работать → сдать PR
Петля 2: PR       — создать PR → ревью → approve/reject → обратная связь
Петля 3: СООБЩЕНИЯ — получать уведомления → общаться → отвечать
```

Каждая роль обязана участвовать в ВСЕХ трёх петлях.

---

## Минимальный контракт любой роли

### MCP Tools (обязательный минимум):
```
read_file          — читать файлы проекта
list_directory     — навигация по проекту
read_memory        — загрузка контекста
my_workspace       — хаб: статус, сообщения, заметки
onboard            — брифинг в начале сессии
send_message       — общение с командой
list_goals         — видеть цели проекта
create_pr          — отправлять изменения на ревью
```

### Dashboard UI (обязательный минимум):
```
Work Tab:
  ├── My Tasks (активные + done с кнопкой Reopen)
  ├── My PRs (статус + последний комментарий)
  ├── Inbox (новые таски, PR события, сообщения) — 3 цвета:
  │     📋 Таск      = оранжевый (#FF6B35)
  │     📥 PR событие = по результату (✅зелёный / ❌красный / ⚠️жёлтый)
  │     💬 Сообщение  = синий (#3b82f6)
  └── Available Tasks (если есть unassigned задачи в goals)

Goals Tab:
  └── Все активные goals (read-only)

Messages Tab:
  ├── Chats (WhatsApp-стиль, 3-second poll)
  └── Notifications (системные события)

Setup Tab:
  ├── Bootstrap prompt
  ├── Avatar + цвет профиля
  └── Push toggle
```

### Push уведомления (обязательные события):
| Событие | Кто получает |
|---------|-------------|
| Новый таск назначен | Assignee |
| Таск done | Assignee |
| PR approved | Автор PR |
| PR rejected | Автор PR |
| PR changes_requested | Автор PR |
| Новое сообщение (chat) | Получатель |

---

## Дополнительные возможности (capability-based)

### `manage_team` capability:
- Team Tab в Dashboard (карточки + chat + assign task + tools)
- Создание группового чата (только admin)
- Добавление/удаление участников группы

### `review_prs` capability:
- Pull Pool Tab в Dashboard
- Секция "Needs Your Review" в Work Tab
- `reviewer_approve_pr`, `reviewer_request_changes` MCP tools

### `manage_goals` capability:
- Создание goals/milestones/tasks
- `create_goal`, `create_milestone`, `create_goal_task`, `create_goal_tree` MCP tools

### `deploy` capability:
- Кнопка Deploy в Team Tab
- `deploy`, `git_snapshot`, `git_log` MCP tools

---

## Чеклист готовности роли к production

### Data Layer:
```
□ ROLE_PRESETS в lib/data/team.ts обновлён (tools, read_paths, write_paths, capabilities)
□ ALL_ADMIN_TOOLS в app/api/mcp/lib/auth.ts обновлён (если роль — super_admin или admin)
□ memory/TEAM_ROLES.md обновлён для существующих пользователей этой роли
```

### MCP Server:
```
□ Минимальный набор tools доступен (read_file, my_workspace, onboard, etc.)
□ Специфичные tools зарегистрированы в нужном tools/*.ts файле
□ Capabilities корректно настроены в auth.ts → buildResolvedRole()
□ onboard показывает релевантный контент для этой роли
□ my_workspace("status") показывает что нужно делать дальше
```

### Dashboard:
```
□ Work Tab корректно отображает tasks + PRs + inbox
□ Messages Tab работает (отправка + получение + push)
□ Goals Tab виден
□ Setup Tab: bootstrap prompt загружается, аватар/цвет работают
□ Если review_prs — Pull Pool Tab виден, "Needs Your Review" секция есть
□ Если manage_team — Team Tab виден с полным функционалом
```

### Bootstrap Prompt:
```
□ Файл существует в bootstrap-prompts/{role}.md
□ Описывает актуальный workflow (не устаревший)
□ Перечисляет ВСЕ доступные tools с описанием
□ Объясняет PR flow для этой роли
□ Указывает что делать в начале сессии
```

### Push + Notifications:
```
□ Push приходит при назначении таска
□ Push приходит при изменении статуса PR (approve/reject/changes)
□ Push приходит при новом сообщении в chat
□ Inbox правильно категоризирует сообщения (3 цвета)
```

### Smoke Test (полный цикл):
```
□ Admin создаёт таск → роль получает push + видит в My Tasks
□ Роль берёт таск → создаёт create_pr → PR виден в pull-pool
□ Admin видит PR → approve → роль получает push + таск done
□ Admin reject → роль получает push + видит reason в Inbox
□ Роль отправляет сообщение → Admin получает push
□ Admin отвечает → роль получает push + видит в Messages
```

---

## Специфика ролей

### Developer
- Полный write access через pull-pool (patch_file, write_file → PR)
- search_files для навигации по коду
- Нет capability (нет Team/PullPool tabs)

### Marketer
- Ограниченный read access (content/*, app/page.tsx, etc.)
- Работает с контентом, не с кодом
- write только в pull-pool (изменения идут на ревью)
- Нет capability (нет Team/PullPool tabs)
- **Уникальные механики маркетера:** (см. marketer-spec.md когда будет создан)

### Reviewer
- Только read access, нет write кроме pull-pool/* и plans/*
- `review_prs` capability → Pull Pool Tab + reviewer MCP tools
- `manage_goals` capability → create/manage goals
- `reviewer_approve_pr` → PR статус: reviewer_approved (не approved!)
- Финальный approve всегда за Admin/Super Admin
- Видит ВСЕ pending/reviewing PRs без назначения

### Admin
- Полный доступ к файлам
- `manage_team`, `assign_tasks`, `review_prs`, `manage_goals`, `view_activity`, `view_logs`, `deploy`
- Финальный approve PRs (включая reviewer_approved)
- Управляет командой (Team Tab с полным функционалом)
- Dashboard = Admin Panel UI (принцип паритета)

### Super Admin
- Всё что Admin + управление токенами + TOTP + deploy
- Единственный кто может менять capabilities других
- tools берутся из ALL_ADMIN_TOOLS в auth.ts, НЕ из TEAM_ROLES.md

---

## PR система — единый роутер

Все PRs хранятся в `pull-pool/` — единый источник правды.
Доступ к PRs через `lib/data/pull-pool.ts`:

```
loadAllPrs()              → все PRs (для admin/reviewer)
loadPrsForRole(role)     → БУДУЩЕЕ: умный роутер по роли
```

### Статусы PR:
```
pending           → создан worker-ом, ждёт ревью
reviewing         → идёт процесс ревью (есть комментарии)
reviewer_approved → reviewer одобрил, ждёт финального approve
changes_requested → запрошены правки (worker должен исправить)
approved          → финально одобрен admin-ом, файл применён
rejected          → отклонён
```

### Кто видит что:
- **Worker (автор)** → только свои PRs (My PRs в Work Tab)
- **Reviewer** → все pending/reviewing/changes_requested PRs (Pull Pool Tab)
- **Admin** → все PRs от своих workers (Pull Pool Tab + Work Tab → PRs Awaiting Review)
- **Super Admin** → все PRs (Pull Pool Tab)

---

*Этот файл обновляется при каждом изменении архитектуры роли.*
*Последнее обновление: 2026-04-06*
