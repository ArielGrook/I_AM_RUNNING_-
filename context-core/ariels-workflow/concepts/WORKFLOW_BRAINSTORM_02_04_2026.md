# WORKFLOW BRAINSTORM — 02.04.2026
## Complete Worker Workflow + Role Roadmap

**Участники:** Ariel (founder) + Claude (dev session)
**Статус:** Consensus reached, ready for implementation planning
**Контекст:** После тестирования worker dashboard (Steve) выявлены разрывы в feedback loop и недостающие возможности для ручной работы.

---

## ПРИНЦИП: AI + Manual = полный workflow

> Worker должен мочь закрыть задачу как через AI (MCP → create_pr), так и руками через dashboard.
> Наравне с нейросетью должна быть возможность закрыть задачу ручками.
> Это даёт больше возможностей для маневра.

Это архитектурный принцип — НЕ "или AI, или руки", а "и то, и другое".

**Дополнение:** Dev Console для worker'а не нужно придумывать с нуля — копируем существующий UI из Admin Panel Files tab, добавляем кнопки "Submit as PR" и "Create Code Reference".

---

## ТЕКУЩИЕ БАГИ (обнаружены при тестировании)

### BUG: Дубликаты комментариев
**Проблема:** Request Changes записывает comment в два места (PR comments + goal task comments). Dashboard `getTaskComments()` и Continue Working prompt собирают оба источника → один и тот же текст дважды.
**Фикс:** Дедупликация. Если goal task comment имеет `prRef` и мы уже показываем PR comments от этого PR — пропускаем.
**Файлы:** `DashboardWorkTab.tsx` (getTaskComments), `worker-handlers.ts` (handleWorkPrompt feedback section)

### BUG: Worker reply не уведомляет admin
**Проблема:** `handlePrComment()` добавляет reply в PR comments, но НЕ: отправляет message admin'у, НЕ добавляет в goal task comments, НЕ создаёт inbox notification для admin'а.
**Фикс:** В `handlePrComment()` → отправить structured message admin'у + добавить comment в goal task (если есть task_ref).
**Файлы:** `worker-handlers.ts` (handlePrComment)

---

## ФИЧИ — ПРИОРИТИЗАЦИЯ

### P1 — Admin Worker Task Visibility (Work Tab)
**Что:** Admin видит в Work tab секцию "Workers' Tasks" — список задач каждого worker'а со статусами, последними комментариями, возможностью написать comment.
**Зачем:** Admin сейчас видит только PRs, но не знает что происходит с задачами.
**Scope:** Показать active tasks каждого scoped worker'а, status badges, last comment preview, "Add Comment" inline.
**Файлы:** `DashboardWorkTab.tsx`, `worker-handlers.ts` (loadDashboardData)

### P2 — Manual PR via Dashboard (Dev Console MVP)
**Что:** Worker открывает файл проекта → просматривает с номерами строк → редактирует → Submit as PR.
**Зачем:** Без этого worker зависит от AI для любого изменения.
**MVP scope:**
1. File browser (по read_paths из TEAM_ROLES)
2. Readonly file preview с номерами строк
3. "Edit & Submit PR" → textarea с содержимым файла → target_file auto-filled → Submit → создаётся PR
4. НЕ нужен CodeMirror / syntax highlighting на первом этапе (polish later)
**Файлы:** Новый компонент `DashboardDevConsole.tsx` или расширение Files tab
**Связано с:** Existing plan item D5 (Dev Console) и F1 (CodeMirror)

### P3 — Code Reference System
**Что:** Worker выбирает файл + диапазон строк → пишет комментарий → генерируется structured reference.
**Зачем:** Коммуникация о коде (предложения, баги, документация) + AI-ready prompt.
**Два выхода:**
1. **Message admin'у** — structured message с кликабельным file reference:
   ```
   📎 File: app/api/mcp/route.ts, lines 45-62
   [code snippet preview]
   💬 Comment: Предлагаю вынести этот блок в отдельную функцию
   ```
2. **Unified AI prompt** (копируемый):
   ```
   Read file app/api/mcp/route.ts, focus on lines 45-62.
   Context: [worker's comment]
   Task: [action description]
   Current code: [snippet]
   ```
**Зачем промпт:** Worker может скопировать и отправить своей нейросети, не формулируя задачу с нуля.
**Зависимость:** Требует P2 (file browser) для выбора файла/строк.

### P4 — Task Lifecycle Notifications
**Что:** Полный цикл нотификаций:
- Task created → notify worker
- Task status changed → notify relevant party
- PR created → notify admin
- PR reviewed → notify worker
- Comment added → notify other party
- Worker reply → notify admin
**Зачем:** Без этого люди не знают что происходит. Backbone всего workflow.
**Scope:** Расширить `buildInbox()` + добавить message creation в каждый handler.

### P5 — Task Priority / Ordering
**Что:** Приоритет задач (1-5 или drag-and-drop ordering).
**Зачем:** Worker с 2+ active tasks не знает какую делать первой.
**MVP:** Priority field на задаче (high/medium/low) + сортировка в Work tab.

---

## PERMISSION HIERARCHY (файловый доступ)

### 4 уровня:
```
Operator (SSH) → видит ВСЁ, включая .iam/ скрытые конфиги
    ↓
Super Admin (TOTP) → видит почти всё, кроме .iam/operator/
    Управляет presets для Admin'ов
    ↓
Admin (token) → получает preset от Super Admin
    Управляет read_paths для своих Worker'ов
    ↓
Worker (token) → получает read_paths от Admin'а
    Developer = код. Marketer = content. Reviewer = PR review.
```

### Presets (Super Admin → Admin):
- **Full Dev** — всё кроме .env, .iam/
- **Frontend Only** — app/, public/, styles/, content/
- **Content Only** — content/, public/images/, memory/ (readonly)
- **Read Only Memory** — memory/ только

### Presets (Admin → Worker):
- **Developer** — app/, lib/, src/, memory/, tasks/, content/ (по read_paths в TEAM_ROLES)
- **Marketer** — content/, public/, memory/SYSTEM_IDENTITY.md
- **Reviewer** — pull-pool/, app/ (readonly), memory/

### Hidden directories:
- `.iam/` — скрытая от всех кроме Operator
- `.iam/operator/` — только SSH доступ
- `.iam/connector/` — конфиги для передачи данных в iamrunning.online

---

## ROLE ROADMAP

### Сейчас (v1): Super Admin + Admin + Developer
- Developer workflow = основной фокус
- Admin workflow = PR review + task management
- Super Admin = TOTP panel + team management

### v2: + Reviewer
- **НЕ просто code reviewer** — это **architectural guardian / documentation auditor**
- Следит за ARCHITECTURE.md, ведёт EVOLUTION.md
- Проводит архитектурные аудиты
- Проверяет что новый код соответствует архитектурным решениям
- Поясняет за архитектуру новым членам команды
- Право: approve/reject/comment на PR'ы
- read-only доступ к коду, write только в comments + documentation
- ТЗ для ревьюера — отдельный документ (будет составлен после закрытия developer workflow)

### v3: + Marketer
- **Collaboration flow с девелопером:**
  1. Маркетолог формулирует ТЗ с маркетинговыми константами (ЦА, tone of voice, CTA, позиционирование)
  2. AI генерирует из этого структурированное ТЗ для девелопера
  3. Девелопер получает ТЗ → реализует с AI
  4. Маркетолог ревьюит результат → approve/request-changes
- Content editor: content/ директория (landing pages, blog posts, email templates)
- Copy management: предложения по изменению текста через PR
- AI content generation → review → submit PR
- Asset management: upload изображений в public/
- **Будущее:** социальная автоматизация (Instagram, LinkedIn, Facebook) через AI — plugin territory

### Будущее:
- Кастомные роли через capabilities editor
- Plugin-based role extensions (SEO, CRM, analytics)
- Социальная автоматизация через extensions/manifest.json

---

## ДОПОЛНИТЕЛЬНЫЕ ИДЕИ (из brainstorm)

### Work Groups (динамические рабочие группы)
**Что:** Admin создаёт group → добавляет workers → у группы: общая папка, общие задачи, внутренняя переписка.
**Зачем:** Несколько workers работают над одной фичей, им нужна координация.
**По сути:** channels/rooms поверх существующей team structure.
**Scope:** Future — сначала закрыть basic worker workflow.

### File Conflict Resolution (когда 2 worker'а пишут в один файл)
**Текущее решение:** `withFileLock()` на JSON файлах — работает но workaround.
**Правильное решение:** Миграция на SQLite (уже описано в `IAM_CLIENT_OS_IMPLEMENTATION_PLAN_v2.md`, секция C5).
- `better-sqlite3` библиотека
- `data/iam.db` файл
- SQLite управляет конкурентностью нативно — file locking больше не нужен
**Когда:** При масштабировании, когда JSON файлы станут bottleneck.

### Push Notifications (мобильные уведомления)
**Описано в:** `IAM_CLIENT_OS_IMPLEMENTATION_PLAN_v2.md`, секция B4.
- Web Push API + Service Worker
- `data/push-subscriptions.json` (или SQLite таблица после миграции)
- Browser permission request → subscription → server-side push при событиях
- Критично для mobile workflow — без push worker не узнает о новых задачах/feedback

---

## ПОРЯДОК РЕАЛИЗАЦИИ

### Этап 1 — Bug fixes (текущая сессия):
1. ✅ Дедупликация комментариев
2. ✅ Worker reply → admin notification
3. Admin Work tab: Workers' Tasks секция

### Этап 2 — Manual workflow:
4. Dev Console MVP (file browser + editor + Submit PR)
5. Code Reference System
6. Task lifecycle notifications

### Этап 3 — Permission & roles:
7. Permission hierarchy presets
8. Hidden directories
9. Reviewer role + TZ
10. Marketer role + content editor

---

*Дата: 02.04.2026*
*Source: Brainstorm session, Claude chat*
