# MASTER PLAN — IAM CLIENT OS
## Система "Хранитель плана → Воркер-чат"

**Создан:** 04.04.2026
**Принцип:** Этот чат хранит план. Каждый спринт = отдельный воркер-чат.
Хранитель плана пишет воркеру **один промт** с контекстом + задачами + условиями.
Воркер закрывает 3-5 комплексных задач и возвращает отчёт.
Хранитель обновляет план и пишет следующий промт.

---

## ТЕКУЩИЙ СТАТУС СПРИНТОВ

| Спринт | Название | Статус |
|--------|----------|--------|
| Sprint 0 | Инфраструктура + баги | ⬜ |
| Sprint 1 | MCP Fine-tune deep dive | ⬜ |
| Sprint 2 | Dev Console Dashboard | ⬜ |
| Sprint 3 | UX / Dashboard improvements | ⬜ |
| Sprint 4 | Роли: Reviewer + Marketer | ⬜ |
| Sprint 5 | Landing + GTM | ⬜ |
| Sprint 6 | Зрелость продукта | ⬜ |

---

## SPRINT 0 — Инфраструктура + баги
**Цель:** Закрыть всё что нужно до онбординга + баг worker reply

### Задачи (3-4 за одну сессию):
1. **T1.5** BUG: Worker reply → уведомление admin (handlePrComment в worker-handlers.ts)
2. **T1.2** TEAM_ROLES.md auto-backup (cp в PM2 startup / scripts/)
3. **T1.3** Cron backups (memory/ + data/ → /var/backups/iam/, ротация 7 дней)
4. **T1.4** install.sh обновление

### Промт для воркер-чата:
```
Ты — AI разработчик на проекте IAM Client OS (test.lego-base.online).
Используй ТОЛЬКО lego-base MCP коннектор.
Начни с read_memory — там вся архитектура.

ЗАДАЧИ ЭТОЙ СЕССИИ:

1. BUG FIX: Worker reply не уведомляет admin
   Файл: app/api/dashboard/lib/worker-handlers.ts, функция handlePrComment()
   Проблема: когда worker добавляет comment к PR — admin не получает сообщение и push
   Фикс: в handlePrComment() после сохранения comment → sendChatMessage(from: workerName, to: adminName, text: "Ответ по PR [title]: [comment text]") + если есть task_ref → addGoalTaskComment(task_ref, comment)
   Используй getSuperAdminName() для adminName. Импорты из @/lib/data.

2. TEAM_ROLES.md auto-backup
   Создай скрипт scripts/backup-team-roles.sh который делает cp memory/TEAM_ROLES.md memory/TEAM_ROLES.md.bak
   Добавь вызов в ecosystem.config.js (post_start hook) или в deploy-logged.sh
   Также добавь восстановление: если TEAM_ROLES.md не парсится → cp .bak → restart

3. Cron backups
   Создай скрипт scripts/cron-backup.sh:
   - Делает tar.gz из memory/ + data/ → /var/backups/iam/backup-$(date +%Y%m%d).tar.gz
   - Ротация: удаляет файлы старше 7 дней
   - Логирует в logs/backup.log
   Добавь инструкцию в README как добавить в cron (crontab -e: 0 2 * * * /var/www/iam-os/scripts/cron-backup.sh)

4. install.sh обновление
   Прочитай текущий install.sh
   Добавь копирование: data/ (шаблоны), lib/push.ts, public/sw.js, extensions/, workers/ директория
   Добавь npm install web-push в секцию зависимостей
   
После каждой задачи делай git_snapshot с понятным сообщением.
В конце: deploy + проверь что всё работает.
```

---

## SPRINT 1 — MCP Fine-tune deep dive
**Цель:** Взаимодействие AI ↔ воркер стало гладким и умным.
**Приоритет: HIGH** — это основа всего опыта воркера.
**Документ-основа:** IDEAS/MCP_FINETUNE_EXPERIMENTS.md

### Что уже есть:
- smartOk preamble ✅
- Session warning ✅
- onboard structured briefing ✅
- read_file >500 hint ✅
- create_pr → update_notes reminder ✅
- Workflow enforcement в onboard ✅
- NEXT STEP в status (базово) ✅
- write_file non-admin hint ✅
- my_prs changes_requested warning ✅

### Что нужно сделать:
- **M1** Experiment 4 complete: file-specific hints в status (конкретный файл, номера строк, предыдущий PR)
- **M2** Experiment 5: smart error recovery (patch fail → re-read → retry)
- **M4** Onboard v2: ещё глубже персонализировать под текущий контекст
- **M5** Audit всех MCP tool responses — систематически
- **W1** my_workspace audit (проверить все 8 actions, закрыть gaps)

### Промт для воркер-чата:
```
Ты — AI разработчик на проекте IAM Client OS (test.lego-base.online).
Используй ТОЛЬКО lego-base MCP коннектор.
Начни с read_memory + read_file IDEAS/MCP_FINETUNE_EXPERIMENTS.md

КОНТЕКСТ:
IAM Client OS = workspace OS для команд с AI инструментами.
Воркер (Steve) работает через Claude+MCP. Каждый ответ MCP инструмента — это часть
контекста Claude, и мы используем это чтобы управлять поведением AI.
Цель: воркер открывает чат → onboard → status → сразу понимает что делать и делает правильно.
Сейчас "стыки" между инструментами не очень гладкие.

ЗАДАЧИ ЭТОЙ СЕССИИ:

1. my_workspace audit
   Прочитай app/api/mcp/lib/tools/ — найди my_workspace обработчик
   Проверь что реально работает из actions: status / my_prs / take_task / rename_pr / ask_admin / message / update_notes / how_to
   Задокументируй что есть/чего нет в IDEAS/MCP_FINETUNE_EXPERIMENTS.md (новая секция "my_workspace state")
   Закрой gaps: что не работает — реализуй или задокументируй почему нет

2. Experiment 4 complete: file-specific hints в status
   В my_workspace("status") response для задачи in_progress:
   - Если у задачи есть spec/description → включить первые 2 строки + "Read full spec: list_goals → [goalRef]"  
   - Если у задачи есть связанный PR с changes_requested → "⚠️ Fix required in PR [title]. Read PR comments first."
   - Если нет активных задач → "No active tasks. Ask admin: my_workspace('ask_admin')"
   Это contextual guidance чтобы Claude сразу знал следующий шаг.

3. Experiment 5: smart error recovery в patch_file / read_file responses
   Когда patch_file возвращает ошибку "text not found" → добавить:
   "⚠️ Patch failed: old_text not found. Re-read the file with read_file first, then retry."
   Когда read_file на большой файл (>500 lines) → уже есть hint, проверь что актуален.
   Когда list_directory на недоступный путь → "Access denied. Check your read_paths in onboard."

4. onboard v2 — персонализация
   Текущий onboard хорошо структурирован. Добавить:
   - Если у воркера есть PR с changes_requested → первая строка onboard: "⚠️ You have [N] PRs needing fixes."
   - Если воркер давно не делал update_notes → "💡 Last notes: [date]. Consider updating after this session."
   - Если у воркера 0 задач → "No assigned tasks. Use my_workspace('take_task') to find work."
   Это должно быть в первых 3 строках response — Claude сразу это видит.

После каждой задачи git_snapshot.
Результаты экспериментов записывай в IDEAS/MCP_FINETUNE_EXPERIMENTS.md.
```

---

## SPRINT 2 — Dev Console для Dashboard (воркеры)
**Цель:** Воркер может руками редактировать файлы в dashboard → Submit as PR.
**Документы-основа:** IDEAS/DEV_CONSOLE_DESIGN.md, IDEAS/DEV_CONSOLE_REDESIGN.md

### Задачи:
- **D1** DashboardDevConsoleTab: file tree по read_paths + CodeMirror + Save → Submit PR
- **D2** Capability `dev_console` gate
- **D3** Code Reference System (выделить строки → Message Admin / Copy AI Prompt)
- **D5** Image preview

### Промт для воркер-чата:
```
Ты — AI разработчик на проекте IAM Client OS (test.lego-base.online).
Используй ТОЛЬКО lego-base MCP коннектор.
Начни с read_memory + read_file IDEAS/DEV_CONSOLE_DESIGN.md + read_file IDEAS/DEV_CONSOLE_REDESIGN.md

КОНТЕКСТ:
Admin panel уже имеет Dev Console с CodeMirror, resizable panels, git history — всё работает.
Нужно создать версию для Dashboard (воркеры). Ключевое отличие:
- Worker видит ТОЛЬКО файлы по своим read_paths
- Worker Save → Submit as PR (не прямой write)
- Новая фича: Code Reference (выделить строки → toolbar → Message Admin / Copy AI Prompt)

ЗАДАЧИ ЭТОЙ СЕССИИ:

1. Backend: dev-handlers.ts + capability gate
   Создай app/api/dashboard/lib/dev-handlers.ts:
   - dev-list-dir: фильтрует по role.read_paths + ALWAYS_HIDDEN
   - dev-read-file: проверка доступа
   - dev-save-file: admin → direct write, worker → createPullPoolEntry()
   Подключи в dashboard route.ts
   Добавь 'dev_console' в capability-gate.ts

2. DashboardDevConsoleTab.tsx
   Скопируй из AdminDevConsoleTab.tsx как основу
   Замени API calls на dashboard API (dev-list-dir, dev-read-file, dev-save-file)
   Worker: кнопка Save = "📤 Submit as PR" → открывает modal с title + description
   Admin: обычный Save (прямой write)
   File tree: рендерит ТОЛЬКО то что вернул backend (уже отфильтровано по read_paths)
   Подключи в app/dashboard/page.tsx как новый таб (видим только при dev_console capability)

3. Code Reference System
   В CodeMirror editor: onSelectionChange → track selected lines
   Когда выделено: показать floating toolbar: "📎 Lines N-M · [Copy Reference] [Message Admin]"
   "Copy Reference" → clipboard: "📎 app/path/file.tsx:N-M\n```\n[selected code]\n```"
   "Message Admin" → opens inline compose modal с reference pre-filled + textarea для комментария
   Send → my_workspace('ask_admin') с code reference в body

4. Image preview
   В file tree: .png/.jpg/.webp/.gif/.svg → не открывают CodeMirror
   Вместо этого → <img src="/api/dashboard?action=dev-read-file-binary" />
   Добавь dev-read-file-binary handler (возвращает base64 data URL)
   Показывать в editor area как centered image с path + size info

После каждой задачи git_snapshot + промежуточный deploy для проверки.
```

---

## SPRINT 3 — UX / Dashboard improvements
**Цель:** Более удобный рабочий процесс для admin и воркеров.
**Документы-основа:** IDEAS/DASHBOARD_UX_IDEAS.md, IDEAS/PERMISSIONS_SYSTEM_SPEC.md

### Задачи:
- **U1** Spec Request → прямая навигация (кнопка в inbox)
- **U2** Кликабельные задачи в Admin pipeline
- **U3** Workers' Tasks секция в Admin Work Tab
- **U6** Permissions system (usePermissions hook)
- **U4** Admin ↔ Dashboard parity: определить что именно неудобно + spec

### Промт для воркер-чата:
```
Ты — AI разработчик на проекте IAM Client OS (test.lego-base.online).
Используй ТОЛЬКО lego-base MCP коннектор.
Начни с read_memory + read_file IDEAS/DASHBOARD_UX_IDEAS.md + read_file IDEAS/PERMISSIONS_SYSTEM_SPEC.md

ЗАДАЧИ ЭТОЙ СЕССИИ:

1. Permissions system — usePermissions hook
   Создай app/dashboard/lib/permissions.ts согласно IDEAS/PERMISSIONS_SYSTEM_SPEC.md
   Функции: can(), hasTool(), isAdmin(), canAssignTool(), showTeamTab()
   Константа UI_CAPS — полная карта
   Обнови page.tsx: создай ctx: UserContext, передай в все компоненты
   Замени все inline hasCap() и capabilities.includes() на can(ctx, UI_CAPS.xxx)
   Это чистый рефактор — поведение не меняется, просто централизуем

2. Workers' Tasks секция в Admin Work Tab (DashboardWorkTab.tsx)
   Для admin/super_admin: добавь секцию "Workers' Tasks" выше или рядом с existing content
   Показывает: для каждого scoped worker → список active tasks со статусами
   На каждой карточке: task title + status badge + assignee + last comment preview
   "Add Comment" inline (textarea + submit → goals-add-comment)
   Data: уже есть в loadDashboardData() — проверь что возвращает для admin

3. Spec Request → прямая навигация
   В Messages/Inbox: когда сообщение содержит "spec request" или type="spec-request" →
   Показать оранжевую кнопку "📋 Create Specification" под сообщением
   Click → переключает на Goals tab + auto-opens нужный goal + milestone + focuses task spec field
   Backend: убедись что spec request message включает taskId + goalRef в metadata
   Frontend: кнопка делает setActiveTab('goals') + передаёт targetTaskId как state

4. Кликабельные задачи в Admin pipeline
   В AdminDashboardTab.tsx: task cards в pipeline (pending/active)
   Click → expand inline panel под card:
   - Task description/spec (editable если manage_goals)
   - Comments thread
   - "Add Comment" form
   - PR status если есть task_ref
   - Assignee info
   Закрыть: click again или X button

git_snapshot после каждой задачи.
```

---

## SPRINT 4 — Роли: Reviewer + Marketer
**Цель:** Полноценные роли с workflow и bootstrap prompts.
**Документ-основа:** IDEAS/WORKFLOW_BRAINSTORM_02_04_2026.md

### Задачи:
- **R1** Reviewer роль: bootstrap prompt + capabilities + tools
- **R2** Marketer роль: bootstrap prompt + capabilities + content editor flow
- **R3** Bootstrap prompts оба
- **W2** Task Request System v2 (улучшенный UI для воркера + approve flow)

### Промт для воркер-чата:
```
Ты — AI разработчик на проекте IAM Client OS (test.lego-base.online).
Используй ТОЛЬКО lego-base MCP коннектор.
Начни с read_memory + read_file IDEAS/WORKFLOW_BRAINSTORM_02_04_2026.md

ЗАДАЧИ ЭТОЙ СЕССИИ:

1. Task Request System v2
   Текущее состояние: базовая реализация есть в task-requests.json
   Улучшить: 
   - В my_workspace("status") для незанятых воркеров → показывать список open tasks без assignee
   - "Take this task" → корректно создаёт task request + отправляет notification admin
   - Admin видит в Work Tab секцию "Task Requests": [Worker] хочет взять [Task] → [Approve] [Decline]
   - Approve → assignTask() + notification воркеру
   Прочитай data/task-requests.json и worker-handlers.ts чтобы понять текущую реализацию

2. Reviewer роль — capabilities + tools preset
   В lib/data/team.ts: добавь в ROLE_PRESETS новую роль "reviewer":
   tools: ['read_file', 'list_directory', 'read_memory', 'my_workspace', 'onboard', 'list_goals', 'send_message', 'add_comment']
   capabilities: ['review_prs', 'view_activity', 'dev_console']
   read_paths: ['memory/*', 'pull-pool/*', 'app/*', 'lib/*', 'data/goals.json']
   write_paths: [] — всё через pull-pool
   scope: 'assigned'
   В Team tab: добавь "reviewer" в role dropdown

3. Bootstrap prompt для Reviewer
   Создай bootstrap-prompts/reviewer.md:
   - Роль: Architectural Guardian — следишь за тем чтобы код соответствовал ARCHITECTURE.md
   - Основные задачи: review PRs на соответствие архитектуре, документация, аудиты
   - Инструменты: review PR → add_comment, одобрить → через admin
   - Документы которые нужно читать каждую сессию: ARCHITECTURE.md, CURRENT_GOAL.md
   - Стиль ревью: constructive, конкретные examples

4. Marketer роль + bootstrap prompt
   ROLE_PRESETS добавь "marketer":
   tools: ['read_file', 'write_file', 'list_directory', 'read_memory', 'my_workspace', 'create_pr', 'onboard', 'list_goals', 'send_message']
   capabilities: []
   read_paths: ['memory/*', 'content/*', 'public/*', 'data/goals.json']
   write_paths: ['pull-pool/*', 'content/*']
   
   bootstrap-prompts/marketer.md:
   - Роль: Content & Marketing — создаёшь ТЗ для разработчиков + управляешь контентом
   - Workflow: формулируешь маркетинговое ТЗ → AI генерирует спек для девелопера → девелопер реализует → ты ревьюишь
   - Контент: content/ директория, все изменения через PR
   - Координация с developer через сообщения

git_snapshot после каждой задачи.
```

---

## SPRINT 5 — Landing + GTM
**Цель:** Продавать.

### Задачи:
- **G2** Landing iamrunning.online редизайн
- **G1** Landing test.lego-base.online polish
- **G3** Upwork профиль + 3 proposal templates
- **G4** Reddit + LinkedIn outreach templates

### Промт для воркер-чата:
```
[Составить позже, после определения messaging и positioning]

Основные вопросы для Ariel перед этим спринтом:
1. Кто target audience (solo freelancer / small team / agency)?
2. Главный pain point который мы решаем (formulate in one sentence)?
3. Есть ли уже case study / результаты которые можно показать?
4. Ценовая страница: Solo $300/mo, Team $200/person — показывать публично?
```

---

## SPRINT 6 — Зрелость продукта
**Цель:** Production-ready для 10+ клиентов.

### Задачи:
- **P1** Logs redesign (Deploy/Activity/Audit Trail подтабы)
- **P3** SSE вместо polling
- **P4** Rsync offsite backups
- **P2** run_command завершение (2-уровневый whitelist)

---

## ПРАВИЛА ВЕДЕНИЯ ПЛАНА

1. **Этот чат = хранитель плана.** Не кодит, только планирует и пишет промты.
2. **Воркер-чат** = отдельный чат Claude с lego-base коннектором. Получает один промт, закрывает 3-5 задач, возвращает отчёт.
3. **После воркер-чата** — обновить статус в этом файле + IMPROVEMENT_PLAN.md
4. **Порядок спринтов** может меняться по ситуации. Sprint 0 и Sprint 1 — фиксированные.
5. **Промт для воркера** должен содержать: контекст, конкретные файлы, конкретные действия, критерий готовности.

---

*Создан: 04.04.2026*
*Следующий шаг: Sprint 0 → скопируй промт → открой новый чат с lego-base → выполни*
