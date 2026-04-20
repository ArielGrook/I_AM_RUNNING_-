Сервер: test.lego-base.online (185.5.55.111), /var/www/iam-os/
MCP: Подключай ТОЛЬКО lego-base connector
Рабочий язык: русский с Ariel, код на английском


КАК НАЧАТЬ

1. read_memory — ARCHITECTURE.md, CURRENT_GOAL.md, NEXT_ACTIONS.md, TEAM_ROLES.md
2. read_file("IDEAS/plans/REVIEWER_SPEC.md") — полная спецификация, читай целиком
3. read_file("IDEAS/SYSTEM_AUDIT_RESULTS_03_04_2026.md") — Блок 4 (аудит кода) для понимания текущей архитектуры
4. Прочитай текущую структуру данных:
   - read_file("data/goals.json") — понять формат Goal/Milestone/Task
   - list_directory("pull-pool") — понять структуру PR директорий
   - read_file одного pull-pool/pr-*/meta.md — понять формат PR мета
5. Потом иди в код:
   - app/api/mcp/lib/tools/data-tools.ts — create_task, create_goal, send_message
   - app/api/mcp/lib/tools/worker-tools.ts — create_pr, my_workspace
   - app/api/admin/lib/post-handlers.ts — pull-pool-approve/reject/add-comment
   - app/admin/components/AdminPullPoolTab.tsx — UI Pull Pool
   - app/admin/components/AdminDashboardTab.tsx — куда вставлять Review Queue


ЧТО НУЖНО РЕАЛИЗОВАТЬ — REVIEWER WORKFLOW

Это новая роль + новые инструменты + новые статусы + новые UI секции.
Цель: закрыть workflow за одну сессию. Без DAG (dependency graph) — это v2.

---

БЛОК 1: НОВЫЕ СТАТУСЫ (данные)

PR статусы — добавить "reviewer_approved":
Текущая цепочка: pending → approved | rejected | changes_requested
Новая цепочка:
  pending
    → reviewer_approved    (Reviewer одобрил, ждёт Admin финала)
    → changes_requested    (от Reviewer ИЛИ от Admin на любом этапе)
    → approved             (только Admin через Approve+Deploy)
    → rejected             (Admin)

Что менять:
- meta.md в pull-pool — поле status уже есть, просто добавить новое значение
- Все места где читается/фильтруется status PR — добавить обработку reviewer_approved
- Поле "assigned_reviewer" в meta.md — Admin назначает при создании PR или после

Task статус — добавить "reviewing":
Текущая цепочка: pending → in_progress → done | rejected | changes_requested
Новая цепочка: pending → in_progress → reviewing → done
  reviewing = Developer задеплоил, ждёт одобрения (Marketer или Admin)
  Reject как опция ОТСУТСТВУЕТ — код в проде, только правки

Что менять:
- data/tasks.json — новый статус в списке допустимых
- lib/data/tasks.ts — TASK_TRANSITIONS, updateTaskStatus
- Dashboard WorkTab — показывать статус "reviewing" как отдельное состояние
- Admin Goals/Tasks табы — отображение нового статуса

---

БЛОК 2: НОВЫЕ MCP ИНСТРУМЕНТЫ (для роли reviewer)

reviewer_approve_pr(prId: string):
  → Читает meta.md PR
  → Меняет status: reviewer_approved
  → Пишет comment type:approve в comments.json
  → Отправляет push + message Admin'у: "PR [название] прошёл ревью, ждёт финала"
  → Логирует в activity.jsonl

reviewer_request_changes(prId: string, comment: string):
  → Меняет status: changes_requested
  → Пишет comment type:request-changes в comments.json
  → Отправляет push + message автору PR: "Нужны правки: [comment]"

update_doc(filePath: string, content: string, reason: string):
  → Разрешён ТОЛЬКО для: memory/ARCHITECTURE.md, memory/EVOLUTION.md
  → Делает git_snapshot перед записью
  → write_file с новым content
  → Логирует в activity.jsonl с reason

create_goal_tree(planFilePath: string):
  → Читает YAML план из planFilePath (формат из REVIEWER_SPEC.md)
  → Парсит Goal → Milestones → Tasks
  → Резолвит ref → временные ID
  → Создаёт через существующие create_goal/create_task функции
  → БЕЗ DAG валидации (v2)
  → Возвращает созданное дерево в человеческом виде
  → Submit as PR (создаёт PR в pull-pool с описанием дерева)

Все эти инструменты регистрируются ТОЛЬКО если role.tools.includes('reviewer_approve_pr') etc.
Добавить в ROLE_PRESETS["reviewer"] нужные tools.

---

БЛОК 3: REVIEW QUEUE — новая секция на Admin дашборде

Отдельная секция в AdminDashboardTab.tsx (или отдельный компонент AdminReviewQueueTab.tsx).
Показывает ТОЛЬКО PR со статусом reviewer_approved.

Каждая карточка:
┌──────────────────────────────────────────────────────┐
│ [название PR] · [автор] · [reviewer: имя]            │
│ ✅ Прошёл ревью · [время]          [▼] [Approve+Deploy] │
└──────────────────────────────────────────────────────┘

При раскрытии [▼]:
- Diff view (уже есть — реюзать из AdminPullPoolTab)
- Комментарии ревьюера
- Linked task/goal если есть

[Approve+Deploy] — существующая кнопка approve из Pull Pool, просто вынесенная сюда.

Добавить счётчик в шапку дашборда: "Review Queue (N)" — красный бейдж если N > 0.

---

БЛОК 4: НАЗНАЧЕНИЕ РЕВЬЮЕРА

В Admin Panel → Pull Pool, карточка PR:
- Добавить dropdown "Assign Reviewer" — список членов команды с ролью reviewer
- При назначении: patch meta.md (добавить assigned_reviewer: "Name")
- Отправить push + message Reviewer'у: "PR [название] назначен тебе на ревью"
- Если SLA не настроен — игнорировать. SLA = future.

API handler (admin post-handlers.ts):
- Новый action: "pull-pool-assign-reviewer"
- Принимает: prId, reviewerName
- Валидирует что reviewerName существует в TEAM_ROLES.md с ролью reviewer
- Patch meta.md, отправляет уведомление

---

БЛОК 5: BOOTSTRAP PROMPT

Создать файл bootstrap-prompts/reviewer.md
Текст — берёшь из REVIEWER_SPEC.md раздел "Bootstrap Prompt", адаптируй под текущие инструменты системы.

Добавить в DashboardSetupTab.tsx новую role: "reviewer" с нужным промтом.

---

ROLE PRESET — добавить/обновить

В app/api/admin/lib/shared.ts → ROLE_PRESETS:

ROLE_PRESETS["reviewer"] = {
  role: "reviewer",
  tools: [
    "read_file", "list_directory", "read_memory", "search_files",
    "my_workspace", "onboard", "list_goals", "send_message", "add_comment",
    "reviewer_approve_pr", "reviewer_request_changes", "update_doc", "create_goal_tree"
  ],
  read_paths: [
    "memory/ARCHITECTURE.md", "memory/CURRENT_GOAL.md", "memory/NEXT_ACTIONS.md",
    "memory/SYSTEM_IDENTITY.md", "memory/WEEKLY_PROGRESS.md", "memory/workers/*",
    "tasks/*", "messages/*", "pull-pool/*",
    "app/page.tsx", "app/components/*", "app/dashboard/*", "app/lib/*",
    "data/goals.json", "bootstrap-prompts/*", "README.md",
    "plans/*"                        // читает план файлы для create_goal_tree
  ],
  write_paths: ["pull-pool/*", "plans/*"],  // create_goal_tree пишет PR через pull-pool
  capabilities: ["review_prs", "manage_goals", "messaging"]
}


ПОРЯДОК РЕАЛИЗАЦИИ (внутри сессии)

1. Данные: новые статусы в lib/data/tasks.ts и pull-pool мета
2. MCP tools: reviewer_approve_pr, reviewer_request_changes, update_doc в data-tools.ts или отдельный reviewer-tools.ts
3. create_goal_tree — последний из инструментов, самый сложный
4. Admin API: pull-pool-assign-reviewer handler
5. UI: Review Queue секция + assign reviewer dropdown + счётчик бейдж
6. Bootstrap prompt файл
7. ROLE_PRESETS обновить
8. git_snapshot + deploy + smoke test


КЛЮЧЕВАЯ АРХИТЕКТУРА (напоминание)

lib/data/                    ← ЕДИНЫЙ DATA LAYER — всё через него
  index.ts                   ← public API: import { ... } from '@/lib/data'
  goals.ts                   ← loadGoals, saveGoals, findGoalTask
  tasks.ts                   ← loadTasks, saveTasks, updateTaskStatus, TASK_TRANSITIONS
  messages.ts                ← sendMessage, sendChatMessage (auto-push)
  pull-pool.ts               ← parsePrMeta, createPullPoolEntry, loadAllPrs
  team.ts                    ← loadTeamRoles, ROLE_PRESETS
  activity.ts                ← logActivity, logAdminAction

app/api/mcp/lib/tools/
  data-tools.ts              ← create_task, create_goal, send_message, git_snapshot, deploy
  worker-tools.ts            ← create_pr, my_workspace, onboard
  file-tools.ts              ← read_file, write_file, patch_file, list_directory, search_files
  → добавить reviewer-tools.ts с новыми инструментами

app/api/mcp/lib/auth.ts      ← resolveRole, ROLE_PRESETS импортируются сюда
app/api/admin/lib/
  post-handlers.ts           ← 35+ handlers, добавить pull-pool-assign-reviewer
  shared.ts                  ← ROLE_PRESETS, ROLE_PRESETS["reviewer"] добавить сюда


ПРАВИЛА

- read_memory первым вызовом
- git_snapshot перед deploy (enforced системой)
- Аудит перед правкой: read_file → понять → patch/write
- Файлы >500 строк → write_file (не chain patch_file)
- Все data операции: import { ... } from '@/lib/data'
- sendMessage auto-pushes — не нужно отдельно вызывать push
- Никогда window.innerWidth в JSX — только useIsMobile() hook
- Один connector — только lego-base


SMOKE TEST (после деплоя)

1. Создай тестовый PR от имени Steve (или через create_pr)
2. В Admin Panel → Pull Pool: назначь Reviewer (Aliks или другой с ролью reviewer)
3. Подключись как Reviewer → вызови reviewer_approve_pr(prId)
4. В Admin Panel → Dashboard: убедись что PR появился в Review Queue
5. Admin нажимает Approve+Deploy из Review Queue
6. PR закрыт, task в статусе done
