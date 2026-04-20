# PLATFORM QA CHECKLIST — IAM CLIENT OS
*Создан: 06.04.2026 | Обновлять после каждой значительной фичи*

---

## КАК ПОЛЬЗОВАТЬСЯ

Этот чеклист — пошаговый проход по всему продукту.
Проходить при каждом релизе или перед онбордингом нового клиента.
Отмечать: ✅ работает / ❌ сломано / ⚠️ работает с нюансами

---

## 1. SUPER ADMIN (/admin — TOTP)

### 1.1 Авторизация
- [ ] TOTP QR скан работает
- [ ] Вход по TOTP коду
- [ ] Сессия сохраняется после PM2 restart
- [ ] Logout работает

### 1.2 Dashboard Tab
- [ ] Pipeline: Pending / Active / Done задачи отображаются
- [ ] Review Queue: PR со статусом reviewer_approved видны с кнопкой "Approve+Deploy"
- [ ] Мини-чат: открывается на члена команды, уведомления (✅❌⚠️) показываются как системные плашки
- [ ] Quick Assign Task: форма работает, воркер получает push
- [ ] Needs Attention: pending PRs, task requests, overdue goals

### 1.3 Team Tab
- [ ] Список членов команды с аватарами и статусами online
- [ ] Добавление нового члена: форма → token появляется → копируется
- [ ] Expand карточки: видны Tools, Capabilities, Tasks
- [ ] "Reports To" dropdown для воркеров: меняется, сохраняется
- [ ] Capabilities для admin: чекбоксы работают, Save сохраняет
- [ ] Tool categories обновлены (нет create_goal/update_roadmap/update_subgoal)
- [ ] Revoke токена: member исчезает из списка
- [ ] Regenerate Token: старый токен перестаёт работать

### 1.4 Goals Tab
- [ ] Список goals с subgoals и прогресс-барами
- [ ] Добавление goal / subgoal / task
- [ ] Toggle subgoal done/not done
- [ ] Assign subgoal к member
- [ ] Создание задачи из goal → воркер получает notification

### 1.5 Pull Pool Tab
- [ ] Список всех PR со статусами и цветами
- [ ] Diff View: показывает изменения построчно
- [ ] Comments: добавление, отображение
- [ ] Approve: файл применяется, Steve получает ✅ уведомление, Steve task → done
- [ ] Approve+Deploy: деплой запускается в background
- [ ] Reject: Steve получает ❌ уведомление с причиной
- [ ] Review Prompt кнопка: копирует AI промт в clipboard
- [ ] Reviewer_approved PRs: синий badge "✅ Reviewer OK"

### 1.6 Messages Tab
- [ ] Список чатов: DMs + группы
- [ ] Системные уведомления (✅❌📋) показываются как центрированные плашки в треде
- [ ] Отправка сообщения: приходит push
- [ ] Notifs tab: системные события отдельно
- [ ] Создание группы: выбор участников, создаётся, сообщения работают
- [ ] Add/Remove участников группы: dropdown работает, сохраняется
- [ ] Удаление сообщения: tap-to-select, Delete
- [ ] Удаление всего чата: подтверждение, удаляется

### 1.7 Dev Console Tab
- [ ] File tree: показывает все файлы (кроме ALWAYS_HIDDEN)
- [ ] Открытие файла в редакторе
- [ ] Редактирование и Save: файл сохраняется напрямую
- [ ] Git Log: список коммитов
- [ ] Git Snapshot: создаёт коммит
- [ ] Deploy кнопка: запускает deploy
- [ ] Rollback: откатывает к выбранному коммиту

### 1.8 Logs Tab
- [ ] Deploy logs: последние деплои со статусами
- [ ] Activity log: действия команды

### 1.9 Settings Tab
- [ ] Super Admin Token генерация
- [ ] TOTP regenerate: QR → confirm → активируется
- [ ] Settings ключи: отображаются (замаскированные), сохраняются

---

## 2. ADMIN (/dashboard — token, role: admin, capabilities: all)

### 2.1 Авторизация
- [ ] Вход по токену
- [ ] Сессия 24h, переживает PM2 restart
- [ ] Scope: если reports_to настроен — видит только своих воркеров

### 2.2 Work Tab
- [ ] My Tasks: активные задачи с status badges
- [ ] My PRs: список со статусами + последний комментарий
- [ ] Inbox: уведомления с цветами (📋 оранжевый / ✅❌ цветные / 💬 синий)
- [ ] PRs Awaiting Review: reviewer_approved PRs с "✅ Reviewer OK" badge
- [ ] Available Tasks: незанятые задачи из goals

### 2.3 Team Tab (manage_team capability)
- [ ] Список воркеров (только scoped если reports_to настроен)
- [ ] Chat button: открывает inline mini-chat с системными плашками
- [ ] Assign Task: форма → воркер получает push
- [ ] New Token: regenerate работает
- [ ] Tools: expand → управление tools, presets работают
- [ ] PRs sub-tab: pending PRs из команды
- [ ] Activity sub-tab: действия команды
- [ ] Logs sub-tab: deploy логи
- [ ] Deploy кнопка (если capability deploy)

### 2.4 Pull Pool Tab (review_prs capability)
- [ ] Видны все PR от команды
- [ ] Approve / Reject / Comment работают
- [ ] Approve: нотификации уходят правильным людям
- [ ] Diff View работает

### 2.5 Goals Tab
- [ ] Список goals (read-only если нет manage_goals)
- [ ] Редактирование если manage_goals capability

### 2.6 Messages Tab
- [ ] Идентично Admin Panel Messages (синхронизированы)
- [ ] Системные уведомления видны в треде как плашки
- [ ] Группы: add/remove participants работает

### 2.7 Setup Tab
- [ ] Bootstrap prompt загружается
- [ ] Аватар: загрузка, отображается в шапке и чатах
- [ ] Цвет профиля: меняется, применяется
- [ ] Push toggle: подписка/отписка, уведомления приходят

---

## 3. DEVELOPER (/dashboard — token, role: developer)

### 3.1 Work Tab
- [ ] My Tasks: видны назначенные задачи
- [ ] Статус задачи меняется (pending → in_progress)
- [ ] My PRs: видны со статусами + комментарии от admin/reviewer
- [ ] Done tasks: кнопка ↩ Reopen работает
- [ ] Inbox: Task assigned (📋 оранжевый), PR events (цветные), Messages (💬 синий)
- [ ] Available Tasks: can submit take_task request

### 3.2 Goals Tab
- [ ] Список активных goals (read-only)
- [ ] Subgoals видны, задачи видны

### 3.3 Messages Tab
- [ ] DM с admin: отправка/получение + push
- [ ] Системные уведомления (✅ PR approved, 📋 task assigned) видны в треде как плашки
- [ ] Notifs tab: системные события
- [ ] Группы: если участник — видит и отправляет сообщения

### 3.4 Setup Tab
- [ ] Bootstrap prompt корректный для developer role
- [ ] Аватар работает
- [ ] Push notifications работают

### 3.5 ❌ НЕТ YET — Sprint 2
- [ ] Dev Console Tab: file tree по read_paths
- [ ] CodeMirror редактор (read + edit)
- [ ] Submit as PR из UI без AI
- [ ] Code Reference: выделить строки → Message Admin / Copy AI Prompt

---

## 4. REVIEWER (/dashboard — token, role: reviewer)

### 4.1 Work Tab
- [ ] My Tasks: видны
- [ ] Needs Your Review: pending/reviewing PRs секция
- [ ] После reviewer_approve_pr: задача "📋 Review: [title]" появляется в My Tasks → статус reviewing
- [ ] После final approve admin: эта задача → done ✅

### 4.2 Pull Pool Tab (review_prs capability)
- [ ] Все pending PR видны
- [ ] Reviewer Approve кнопка: статус → reviewer_approved, admin получает уведомление
- [ ] Request Changes: author получает ⚠️ push
- [ ] Comment тип "approval" работает
- [ ] Diff View работает

### 4.3 Goals Tab (manage_goals capability)
- [ ] Создание goals/milestones/tasks работает

### 4.4 Messages Tab
- [ ] Уведомление о новом PR: при create_pr от Steve → Troy получает 📋 inbox + push
- [ ] DM с admin: работает

### 4.5 ❌ НЕТ YET — Sprint 2
- [ ] Dev Console (read-only): смотреть код для ревью
- [ ] Manual PR creation через UI

---

## 5. MARKETER (/dashboard — token, role: marketer)

### 5.1 Work Tab
- [ ] My Tasks видны
- [ ] My PRs видны

### 5.2 ❌ НЕТ YET — Sprint 4
- [ ] Bootstrap prompt специфичный для marketer
- [ ] Content workflow (marketer → ТЗ → developer реализует)
- [ ] Dev Console с доступом к content/ директории
- [ ] Manual PR creation через UI

---

## 6. MCP WORKFLOW (через Claude + lego-base коннектор)

### Developer workflow
- [ ] `onboard` → показывает задачи, PRs, inbox корректно
- [ ] `my_workspace("status")` → корректный NEXT STEP hint
- [ ] `create_pr` → PR создаётся, Troy получает 📋 inbox + push
- [ ] `my_workspace("my_prs")` → видит статус и комментарии
- [ ] `my_workspace("update_notes")` → заметки сохраняются

### Reviewer (Troy) workflow
- [ ] `onboard` → видит PRs для ревью
- [ ] `reviewer_approve_pr(prId)` → статус → reviewer_approved, admin ✅, создаётся review task для Troy
- [ ] `reviewer_request_changes(prId, comment)` → статус → changes_requested, Steve ⚠️
- [ ] После final admin approve: Troy task → done, Troy ✅ notification

### PR полный цикл E2E
- [ ] Steve create_pr → Troy inbox + push ✅
- [ ] Troy reviewer_approve_pr → Admin inbox "✅ Reviewer approved" + push ✅
- [ ] Admin pr-approve → Steve task done + push, Troy task done + push ✅
- [ ] Admin pr-approve-deploy → то же + deploy запускается ✅

---

## 7. PUSH NOTIFICATIONS

- [ ] Task assigned → assignee получает push
- [ ] New PR → все с review_prs capability → push
- [ ] Reviewer approved → admin получает push
- [ ] PR approved → author получает push
- [ ] PR rejected → author получает push
- [ ] Changes requested → author получает push
- [ ] New chat message → получатель push
- [ ] Group message → все участники push

---

## 8. ИНФРАСТРУКТУРА

- [ ] Deploy через Admin Panel работает (~30-60s)
- [ ] Build errors показываются (не пустые)
- [ ] PM2 restart → сессии сохраняются (data/sessions.json, data/admin-sessions.json)
- [ ] Git Snapshot → коммит создаётся
- [ ] Git Log → история отображается
- [ ] Scope System: admin видит только своих воркеров (reports_to настроен)
- [ ] ❌ Backup: cron backup data/ + memory/ — НЕ НАСТРОЕН

---

## 9. ROADMAP — ЧТО НЕ СДЕЛАНО

| Фича | Приоритет | Где описано |
|------|-----------|-------------|
| **Tool Registry рефактор** (одна точка правды) | 🔴 HIGH | см. раздел 10 |
| **Dev Console Dashboard** (file tree + editor + PR submit) | 🔴 HIGH | IDEAS/DEV_CONSOLE_DESIGN.md |
| **Manual PR через UI** (без AI, для всех ролей) | 🔴 HIGH | IDEAS/DEV_CONSOLE_DESIGN.md |
| **Reviewer code reading** (dev_console read-only) | 🟡 MED | IDEAS/DEV_CONSOLE_DESIGN.md |
| **Marketer workflow** + bootstrap prompt | 🟡 MED | IDEAS/MASTER_PLAN.md Sprint 4 |
| **YAML backup** (cron) | 🟡 MED | IDEAS/MASTER_PLAN.md Sprint 0 |
| **Stripe** (payments) | 🟡 MED | — |
| **Brother + Uncle onboarding** | 🟡 MED | — |
| **Code Reference System** (выделить строки → Message Admin) | 🟢 LOW | IDEAS/DEV_CONSOLE_DESIGN.md |
| **MCP fine-tune** (smart hints в status/onboard) | 🟢 LOW | IDEAS/MASTER_PLAN.md Sprint 1 |
| **Landing pages** | 🟢 LOW | IDEAS/MASTER_PLAN.md Sprint 5 |
| **SSE вместо polling** | 🟢 LOW | IDEAS/MASTER_PLAN.md Sprint 6 |

---

## 10. TOOL REGISTRY — АРХИТЕКТУРНАЯ ПРОБЛЕМА

### Текущее состояние (плохо)
Добавление нового tool требует обновления **6 файлов:**
1. `app/api/mcp/lib/auth.ts` → ALL_ADMIN_TOOLS
2. `lib/data/team.ts` → ROLE_PRESETS (tools + capabilities)
3. `app/admin/types.ts` → ALL_TOOLS + ROLE_PRESETS + TOOL_CATEGORIES
4. `app/dashboard/components/DashboardTeamTab.tsx` → ALL_TOOLS + TOOL_CATEGORIES + ROLE_PRESETS
5. `app/api/admin/lib/post-handlers.ts` → team-tools-edit whitelist
6. `app/api/dashboard/lib/capability-gate.ts` → capability → tool mappings

### Целевое состояние (единый реестр)
```typescript
// lib/tools-registry.ts — ЕДИНСТВЕННЫЙ файл для регистрации
export const TOOLS_REGISTRY = {
  // File operations
  read_file:    { category: 'File Operations', roles: ['all'] },
  write_file:   { category: 'File Operations', roles: ['developer', 'admin', 'super_admin'] },
  patch_file:   { category: 'File Operations', roles: ['developer', 'admin', 'super_admin'] },
  // ...

  // Admin only
  deploy:       { category: 'Admin Tools', roles: ['admin', 'super_admin'], capability: 'deploy' },
  git_snapshot: { category: 'Admin Tools', roles: ['admin', 'super_admin'] },

  // Reviewer only
  reviewer_approve_pr:     { category: 'Reviewer Tools', roles: ['reviewer'] },
  reviewer_request_changes: { category: 'Reviewer Tools', roles: ['reviewer'] },
};

// Всё остальное derivируется из этого реестра
export const ALL_TOOLS = Object.keys(TOOLS_REGISTRY);
export const TOOL_CATEGORIES = deriveCategories(TOOLS_REGISTRY);
export const ROLE_PRESETS = derivePresets(TOOLS_REGISTRY);
```

*Реализация: Sprint 2 Pre-work — до Dev Console*

---

*Создан: 06.04.2026*
*Следующее обновление: после каждого спринта или major фичи*
