# Worker Tools Redesign — my_workspace + onboard + create_pr

**Status:** spec (brainstormed 01.04.2026)
**Priority:** HIGH — next implementation sprint
**Source:** Ariel brainstorm session, voice + chat

---

## Core Philosophy

**"Ты не Steve — ты ИНСТРУМЕНТ Steve'а."**

Это НЕ умная хуйня которая всё делает за тебя. Это workflow optimization tool. Головой думать придётся в любом случае. Каждый текст, каждый ответ, каждый onboard должен это подчёркивать. Мы не продаём AI agent — мы продаём оптимизированный рабочий процесс с AI инструментами.

---

## 1. `my_workspace` — мульти-инструмент воркера

Один инструмент вместо кучи разрозненных. Параметр `action` определяет что делать.

### Actions:

| Action | Что делает | Параметры |
|--------|-----------|-----------|
| `status` | Мои задачи + мои PR + мои сообщения (компактно) | — |
| `my_prs` | Список моих PR со статусами | — |
| `take_task` | Отправить заявку на задачу админу | taskId |
| `rename_pr` | Переименовать свой PR | prId, newTitle |
| `ask_admin` | Отправить вопрос/запрос/идею админу | topic, text |
| `message` | Написать сообщение (с выбором из списка доступных получателей) | to, topic, text |
| `update_notes` | Обновить мои session notes | notes |
| `how_to` | Инструкция по работе с системой | — |

### `status` — что возвращает:
```
📋 Твои задачи (2):
  🔨 [in_progress] Redesign hero section — goal: Landings
  ⏳ [pending] Fix mobile nav — goal: Polish

📥 Твои PR (3):
  ✅ pr-steve-001 "Hero redesign" — approved
  ⏳ pr-steve-004 "Nav fix" — pending review
  ⚠️ pr-steve-003 "Pulse animation" — changes requested

💬 Непрочитанные сообщения (1):
  From admin: "pr-steve-003 REJECTED — причина..."

💡 Доступные команды: my_workspace("take_task"), my_workspace("ask_admin"), ...
```

### `message` — список получателей:
Ответ включает список team members кому можно написать. Воркеры могут слать сообщения админу, другим воркерам. Нужна вкладка Messages в worker dashboard для отправки и чтения.

### `how_to` — возвращает:
Полную инструкцию по workflow. Как брать задачи, как создавать PR, как читать фидбэк, как общаться с админом. Написано человеческим языком, не как raw documentation.

---

## 2. `onboard` — первый вызов сессии (замена read_memory)

Вместо raw dump всех YAML файлов → структурированный бриф.

### Формат ответа:
```
# Workspace Context

Это AI-инструментарий для [Project Name]. Ты — рабочий инструмент пользователя [Steve].
Твоя задача — помочь [Steve] эффективно выполнять работу, НЕ заменить его.

## Твои инструменты:
- my_workspace(action) — управление задачами, PR, сообщениями
- create_pr(title, file, content) — создание pull request
- read_file(path) — чтение файлов проекта
- list_directory(path) — обзор структуры
- patch_file(path, old, new) — точечное редактирование

## Текущее состояние:
- Активные задачи: [N] (используй my_workspace("status"))
- Непрочитанные сообщения: [N]
- PR на ревью: [N]

## Workflow:
1. my_workspace("status") — посмотри что нужно делать
2. read_file — прочитай файлы связанные с задачей
3. create_pr — отправь изменения на ревью
4. Жди фидбэк от админа
5. Перед завершением: my_workspace("update_notes")

## ВАЖНО:
- Все write/patch операции идут через pull-pool (ревью админа)
- Всегда включай description в PR — без него админ не поймёт зачем
- Не бандли несвязанные изменения в один PR
- При сомнениях — my_workspace("ask_admin")
```

### Ключевое отличие от read_memory:
- Не дампит RULES.md, ARCHITECTURE.md, WEEKLY_PROGRESS.md целиком
- Даёт actionable context: что делать прямо сейчас
- Включает поведенческие инструкции (fine-tune через MCP)

---

## 3. `create_pr` — явное создание PR

Сейчас PR создаётся неявно (write_file для non-admin → автоматом в pull-pool). Проблемы:
- Название генерируется автоматически (pr-steve-007)
- Description необязательный
- Нет контроля

### Новый инструмент:
```
create_pr(title, description, target_file, content, operation?)
```

- `title` — человекочитаемое название ("Fix hero CTA animation")
- `description` — подробное описание что и зачем
- `target_file` — какой файл меняем
- `content` — предложенный контент
- `operation` — "write" (full) или "patch" (diff) — default "write"

### Для patch mode:
```
create_pr(title, description, target_file, content, operation: "patch", old_text, new_text)
```

### Важно:
- write_file и patch_file для non-admin всё ещё работают (backward compatible)
- create_pr — preferred way, даёт больше контроля
- "Создание PR — главная хуйня в workflow, она должна быть оптимизирована, иначе дебаг превращается в ребаг" — Ariel

---

## 4. MCP Fine-tune — поведенческие инструкции через ответы инструментов

### Концепция:
MCP ответ = system prompt для следующего действия Claude. Сервер управляет поведением AI через текст в ответах.

### Где это работает сейчас:
- `smartOk` preamble: `[ROLE: developer | SESSION: 5/40 | TASK: Fix hero]`
- Session warning после 40 вызовов

### Где можно расширить:
- `onboard` → полные поведенческие правила на старте сессии
- `my_workspace("status")` → "NEXT STEP: прочитай файл X"
- `create_pr` response → "PR создан. Теперь вызови my_workspace('update_notes')"
- `read_file` response → "Этот файл >500 строк. При изменении используй patch, не write"
- Error responses → "Ошибка. Прочитай файл заново перед повторной попыткой"

### Потенциал:
Это примитивный fine-tune без API. Если придрочиться, можно контролировать поведение нейросети почти полностью через формулировки ответов MCP сервера. Нужно экспериментировать и документировать что работает, а что нет.

**TODO: создать отдельный документ IDEAS/MCP_FINETUNE_EXPERIMENTS.md для записи экспериментов.**

---

## 5. Dev Console переработка

### Что нужно:
- Взять обработчик кода с iamrunning.online — цветная подсветка синтаксиса, легче читать
- Система ручного редактирования файлов для воркеров
- Воркеры должны иметь доступ к ручному написанию кода в определённые файлы (pull-pool scope)
- "Может и не будут юзать, но функция должна быть"

### Как:
- Monaco editor или CodeMirror в worker dashboard
- Scope: только файлы в pull-pool/* или файлы по read_paths
- Save → автоматом создаёт PR

---

## 6. Task Request System (take_task)

### Flow:
1. Воркер видит список открытых задач (goals → milestones → tasks без assignee)
2. Нажимает "Take this task" или через my_workspace("take_task", taskId)
3. Заявка летит в `data/task-requests.json`
4. Админ видит в Dashboard: "Steve хочет взять задачу X"
5. Админ approve → задача назначена Steve
6. При следующем status Steve видит: задача назначена ему

### Зачем:
Превращает систему из "админ пушит" в двустороннюю. Воркеры инициируют.

---

## 7. Worker Messages Tab

### Что нужно:
- Вкладка Messages в worker dashboard (app/dashboard/page.tsx)
- Отправка сообщений админу и другим воркерам
- Предложения новых функций, вопросы, обсуждения
- Список получателей = все team members

### Уже частично есть:
- Worker dashboard имеет Messages tab (3 tabs: Inbox/Messages/Notes)
- Worker `send-message` endpoint уже в dashboard route.ts
- Нужно проверить что оно реально работает end-to-end

---

## Implementation Order (предложение):

1. **IDEAS папка** ✅ (этот файл)
2. **create_pr** — самый критичный, оптимизация главного workflow
3. **my_workspace** — мега-инструмент, заменяет кучу разрозненных
4. **onboard** — замена read_memory, fine-tune на старте
5. **take_task** — двусторонняя система задач
6. **Dev Console** — подсветка + ручной edit
7. **MCP fine-tune experiments** — долгосрочное исследование

---

*Записано: 01.04.2026. Источник: голосовое сообщение + чат Ariel.*
