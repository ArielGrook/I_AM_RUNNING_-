# IAM Client OS — MCP Fine-Tune System
## Полное описание системы управления поведением AI через MCP

**Версия:** 1.0  
**Дата:** 10.04.2026  
**Автор:** Ariel (I AM RUNNING)

---

## 1. ЧТО ТАКОЕ IAM CLIENT OS

IAM Client OS — это **AI-native командная операционная система** для бизнеса. Продукт продаётся как SaaS и устанавливается клиенту на его VPS-сервер.

**Стек:** Next.js 15 + TypeScript + PM2 + Nginx + MCP (Model Context Protocol)

**Ключевая идея:** вся работа команды ведётся через Claude/ChatGPT как основной рабочий интерфейс. Люди общаются с AI-ассистентом, который подключён к серверу через MCP и выполняет реальные действия: читает файлы, создаёт задачи, отправляет сообщения, создаёт pull requests для ревью кода.

**Иерархия ролей:**
```
Super Admin (Ariel / владелец системы)
    └── Admin (руководит командой)
            └── Workers:
                    - Developer (пишет код через PR workflow)
                    - Reviewer (ревьюит PR, управляет roadmap)
                    - Marketer (работает с контентом)
```

**Три рабочих петли (обязательны для КАЖДОЙ роли):**
1. **Tasks** — получить задачу → работать → создать PR → done
2. **Pull Requests** — создать PR → ревью → approve/reject → уведомление
3. **Messages** — получить push-уведомление → прочитать → ответить

**Admin Panel** (`/admin`) — веб-интерфейс для управления командой: задачи, PR, цели, логи, настройки.  
**Dashboard** (`/dashboard`) — веб-интерфейс для workers: их задачи, PR, сообщения, Dev Console.  
**Dev Console** — встроенный файловый редактор с AI-чатом (Gemini), PR panel, Messages tab.

---

## 2. ПРОБЛЕМА: ПОЧЕМУ НУЖЕН MCP FINE-TUNE

Claude — мощная модель, но без правильной настройки она:
- Забывает сделать `git_snapshot` после изменения файла
- Не обновляет документацию после завершения задачи
- Объявляет вслух внутренние операции ("я сейчас сделаю git snapshot...")
- Не ведёт `wisdom/` — живой датасет паттернов
- Теряет контекст между сессиями

**MCP Fine-Tune** — это система управления поведением AI без API fine-tuning:
- Нет доступа к весам модели
- Но каждый tool response = часть контекста = влияет на поведение
- + Project Instructions (загружаются в каждую сессию)
- + Skills (загружаются по триггеру, domain-specific)
- + Project Documents (всегда доступны)
- + Tool injection (напоминания в каждом tool response)

---

## 3. АРХИТЕКТУРА ЧЕТЫРЁХ СЛОЁВ

```
LAYER 1: Project Instructions  ←  ВСЕГДА загружается, ~150 слов
LAYER 2: Skills                ←  загружаются по триггеру (описание матчится задаче)
LAYER 3: Project Documents     ←  WORKER_MECHANICS.md, ARCHITECTURE.md, bootstrap prompts
LAYER 4: MCP Tool Injection    ←  напоминания в каждом tool response
```

### Layer 1: Project Instructions (шаблон)

Вставляется в **Claude → Project → Instructions**.  
Короткий, жёсткий, применяется к КАЖДОЙ сессии.

```
You are an AI assistant tool working inside IAM Client OS — a team workspace platform.

## Your Role
You are a TOOL, not a team member. You execute tasks on behalf of [ROLE_NAME] ([ROLE]).
The human operator thinks and decides. You implement precisely and ask when unclear.

## Platform
- All file changes go through pull-pool PR workflow
- Three loops: Tasks → Pull Requests → Messages
- Source of truth: source-of-truth/WORKER_MECHANICS.md

## Session Start (do this every time)
1. Call `onboard` — loads your briefing
2. Call `my_workspace("status")` — see what needs doing
3. Read memory/SESSION_STATE.yaml for current context

## Core Rules
- Read before write. Always.
- git_snapshot after EVERY file change
- deploy only after git_snapshot (<5min old)
- One PR = one logical change
- update_session_notes before EVERY session end

## Internal Process
Tool responses contain internal checklists marked [не озвучивай в чат].
Execute them silently. Do not narrate or announce internal steps.

## Wisdom
At session end: update at least one file in memory/wisdom/
```

---

### Layer 2: Skills

Skills загружаются **по описанию** — когда Claude видит задачу, совпадающую с описанием skill, он загружает его.

**Важно:** по данным тестирования Anthropic — правильное описание поднимает срабатывание с 20% до 50%. Примеры в skill — с 72% до 90%.

#### Созданные Skills:

**`iam-platform-identity`** — кто ты, как работает система, source of truth файлы  
*Триггер: любая работа с IAM Client OS*

**`iam-silent-execution`** — не озвучивать внутренние шаги, как обрабатывать tool injection  
*Триггер: работа через MCP tools*

**`iam-roadmap-creation`** — как создать roadmap: vision → milestones → tasks → create_goal_tree  
*Триггер: "создай план", "roadmap для X", "спланируй задачу"*

Полное содержание:
```
Process:
1. Build Vision — success в одном предложении, кто benefit, deadline, dependencies
2. Break Into Milestones — 3-7 штук, каждый с clear deliverable
3. Break Into Tasks — один человек, один PR, один день max
4. Prioritize — must/should/nice-to-have
5. create_goal_tree() в ONE call

Пример хорошей задачи:
✅ "Fix conversation-messages returning empty array — change {id} to {conversationId} 
    in dashApi call (line 245 of DashboardDevConsoleTab.tsx)"
❌ "Fix the bug"
```

**`iam-pr-workflow`** — формат PR title/description, статусы, как обрабатывать feedback  
*Триггер: создание PR, ревью PR*

```
Title format: [feat/fix/refactor/docs]: [что изменил] — [файл/область]
Description: что изменил, почему, как проверить

PR status flow:
pending → reviewing → reviewer_approved → approved ✅
pending → changes_requested → (author fixes) → new PR
```

**`iam-backend-preset`** — Audit First, lib/data/ patterns, API handler pattern, security  
*Триггер: работа с API handlers, data layer, MCP tools*

```
Core rule: AUDIT FIRST
Before ANY file change:
1. read_file target file
2. search_files все вызовы функции
3. Проверь lib/data/index.ts — есть ли уже функция?
4. Проверь lib/permissions.ts — есть ли проверка?

Data layer: ТОЛЬКО через lib/data/ функции
withFileLock для ВСЕХ concurrent writes
safePath() на все user-provided пути
```

**`iam-frontend-preset`** — dark mode T object, hover states, component structure, button patterns  
*Триггер: работа с React компонентами, UI, стилями*

```
Dark mode обязателен для КАЖДОГО компонента:
const T = {
  border:  isDark ? '#222'    : '#e5e5e5',
  surface: isDark ? '#0d0d0d' : '#fafafa',
  text:    isDark ? '#eee'    : '#333',
  textMut: isDark ? '#666'    : '#888',
}

Hover: onMouseEnter → isDark ? '#1a1a1a' : '#f5f5f5'
Никогда не хардкодь цвета напрямую.
```

---

### Layer 3: Project Documents

Прикрепляются к Claude Project и доступны в каждой сессии:

| Файл | Содержание |
|------|-----------|
| `source-of-truth/WORKER_MECHANICS.md` | Закон workflow: 3 петли, все обязательные механики |
| `source-of-truth/ROLE_CONTRACT.md` | Минимальный контракт любой роли |
| `bootstrap-prompts/{role}.md` | Детальный bootstrap для каждой роли |
| `memory/SESSION_STATE.yaml` | Текущий контекст сессии (machine-readable) |

---

### Layer 4: MCP Tool Injection

**Реализовано в `app/api/mcp/route.ts` → функция `smartOk(text, toolName)`**

Каждый tool response содержит напоминание, специфичное для этого tool:

```
После write_file / patch_file:
📌 INTERNAL CHECKLIST [не озвучивай в чат]:
  □ git_snapshot("feat/fix: описание") — обязательно
  □ deploy если финальное изменение
  □ Обнови wisdom/ если нашёл паттерн или баг

После git_snapshot:
📌 INTERNAL CHECKLIST [не озвучивай в чат]:
  □ deploy если финальное изменение
  □ Обнови SESSION_STATE.yaml → completed_this_session

После deploy:
📌 INTERNAL CHECKLIST [не озвучивай в чат]:
  □ Через 60 сек уточни у пользователя работает ли сайт
  □ Обнови SESSION_STATE.yaml
  □ Если сессия близится к концу → update_session_notes

После create_pr:
📌 INTERNAL CHECKLIST [не озвучивай в чат]:
  □ my_workspace("my_prs") — убедись что PR создан
  □ Уведоми admin если PR требует срочного ревью
```

**Ключевое правило:** пометка `[не озвучивай в чат]` говорит Claude выполнить checklist молча. Без этой пометки Claude начинает рассказывать о своих внутренних действиях — это шум.

---

## 4. SESSION_STATE.yaml — ПЕРСИСТЕНТНАЯ ПАМЯТЬ

Файл `memory/SESSION_STATE.yaml` — machine-readable мост между сессиями.

```yaml
current_focus:
  task: "что сейчас делается"
  status: "in_progress"
  next_concrete_action: "конкретный следующий шаг"

completed_this_session:
  - id: "feat-name"
    title: "что сделано"
    deployed: true

pending:
  - id: "next-task"
    title: "что осталось"
    priority: "high"
    blocker: "optional"

key_decisions:
  - "решение 1 — почему"

warnings:
  - "незакрытый вопрос"
```

**Почему YAML, не prose:** AI парсит структуру быстрее. Меньше токенов на понимание. Легко обновлять точечно через patch_file.

**90% триггер:** когда SESSION: N >= 72/80 → AI обновляет SESSION_STATE.yaml, говорит пользователю "пора в новый чат". Следующая сессия читает state и продолжает без потерь.

---

## 5. WISDOM FOLDER — ЖИВОЙ ДАТАСЕТ

`memory/wisdom/` — скрытая папка (недоступна в Dev Console, только через MCP tools).  
Это накапливаемый датасет паттернов для будущего fine-tune.

**Структура:**

```
memory/wisdom/
├── PATTERNS.md       — что работает в production
├── ANTI_PATTERNS.md  — баги caused by паттерн
├── DECISIONS.md      — архитектурные решения + rationale
└── SESSION_INSIGHTS.md — инсайты из сессий
```

**Правило:** не заканчивай сессию без обновления хотя бы одного файла.  
Каждый найденный баг → ANTI_PATTERNS.md. Каждое решение → DECISIONS.md.

**Пример записи в ANTI_PATTERNS.md:**
```
**Dashboard: conversationId vs id:**
Произошло: loadConvoMsgs передавал {id} но API ждёт {conversationId} → пустой массив.
Не делай: dashApi(token, 'conversation-messages', { id })
Делай: dashApi(token, 'conversation-messages', { conversationId: id })
```

---

## 6. DEVELOPER PRESETS — FRONTEND/BACKEND РЕЖИМЫ

**MCP Tool:** `set_preset("frontend" | "backend" | "none")`

Сохраняется в `data/worker-presets.json`:
```json
{ "presets": { "Steve": "frontend" } }
```

При следующем `onboard` или `read_memory` — правила preset инъектируются в контекст автоматически:

```
## 🎨 ACTIVE PRESET: FRONTEND
Rules: dark mode required, T theme object, no hardcoded colors,
useCallback for handlers, always show loading states.

## ⚙️ ACTIVE PRESET: BACKEND  
Rules: AUDIT FIRST, lib/data/ only, withFileLock for writes,
safePath() on all paths, notify() for messages.
```

Переключение: `set_preset("backend")` → правила меняются с следующего `onboard`.

---

## 7. BOOTSTRAP PROMPTS PER ROLE

Хранятся в `bootstrap-prompts/{role}.md`. Вставляются пользователем в начало новой Claude сессии как system prompt.

**Developer bootstrap (ключевые части):**
```
1. Call onboard — loads briefing
2. Call my_workspace("status") — see what to do
3. Read file BEFORE changing it. Always.
4. create_pr for changes (preferred over raw write_file)
5. Files >500 lines → patch_file, not write_file
6. Before ending → my_workspace("update_notes")

Dev Console: file tree + editor + PR panel + Messages + Gemini AI chat
Gemini can: read files, create PRs (via create_pr tool)
Attach file: 📎 button. Attach PR diff: 📋 button.
```

**Reviewer bootstrap (ключевые части):**
```
1. Call onboard
2. PR review via Dev Console Pull Pool panel (preferred)
   OR via MCP: read meta.md → read proposed file → compare → reviewer_approve_pr / reviewer_request_changes
3. create_goal_tree() для roadmap в один вызов
4. update_doc() для обновления ARCHITECTURE.md / EVOLUTION.md

PR status: pending → reviewer_approved (NOT approved — admin делает финальный)
```

**Admin bootstrap (ключевые части):**
```
1. read_memory — полный контекст
2. Проверь pull-pool/ — pending PRs
3. Создавай задачи через create_task (НЕ пиши в tasks/*.md напрямую)
4. git_snapshot ПЕРЕД любым изменением файла
5. deploy только после git_snapshot (<5 min)
```

---

## 8. SESSION MANAGEMENT

**Лимит:** 80 tool calls → предупреждение (поднято с 40).

**Session warning при N >= 80:**
```
→ Обнови memory/SESSION_STATE.yaml (patch_file)
→ Вызови update_session_notes
→ Сообщи пользователю что пора в новый чат
```

**Session end ritual (обязательно):**
1. `my_workspace("update_notes")` — свободный текст
2. `patch_file("memory/SESSION_STATE.yaml", ...)` — structured state
3. Обнови хотя бы один wisdom/ файл

---

## 9. ПОЛНАЯ СХЕМА СИСТЕМЫ

```
┌─────────────────────────────────────────────────────────────────┐
│                     Claude AI Session                           │
│                                                                 │
│  Project Instructions (Layer 1)  ←── всегда, ~150 слов         │
│  + Skills (Layer 2)              ←── по триггеру                │
│  + Project Documents (Layer 3)   ←── прикреплены к Project     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MCP Connector ← Bearer Token ← IAM Client OS Server    │   │
│  │                                                          │   │
│  │  Tool call: write_file(path, content)                    │   │
│  │       ↓                                                  │   │
│  │  smartOk(result, 'write_file')                           │   │
│  │       ↓                                                  │   │
│  │  [Result] + [INTERNAL CHECKLIST] (Layer 4 injection)     │   │
│  │       ↓                                                  │   │
│  │  Claude reads checklist → executes silently              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  memory/SESSION_STATE.yaml  ←── machine-readable state bridge  │
│  memory/wisdom/             ←── living dataset (hidden)        │
│  data/worker-presets.json   ←── frontend/backend mode          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. ЧТО РАБОТАЕТ, ЧТО НЕТ (честная оценка)

**Работает хорошо:**
- Tool injection — AI следует checklist в ~80% случаев
- SESSION_STATE.yaml — контекст восстанавливается быстро
- Preset switching — правила инъектируются в onboard/read_memory
- "Не озвучивай" пометка — убирает шум в ~70% случаев

**Работает частично:**
- Wisdom update — AI иногда пропускает в конце сессии
- git_snapshot после каждого файла — ~85% compliance
- Долгие сессии (60+ calls) — качество деградирует независимо от правил

**Не решено:**
- Нет способа гарантировать 100% compliance без real fine-tuning
- При очень длинном context window ранние инструкции теряются
- Нет автоматической проверки что wisdom обновлён

---

## 11. ВОПРОСЫ ДЛЯ ВНЕШНЕГО РЕВЬЮ

1. **Как сделать tool injection более надёжным?** Сейчас это текст в tool response. Есть ли лучший способ?

2. **Project Instructions vs Skills — правильное разделение?** Или стоит перенести больше в Instructions?

3. **SESSION_STATE.yaml** — есть ли лучший формат для machine-readable handoff?

4. **Wisdom folder** — как автоматически проверять что AI обновил его? Hook? Validation?

5. **[не озвучивай в чат] пометка** — работает для Claude. Для других моделей (GPT-4o, Gemini)? Нужно ли другое название?

6. **Preset система** — правильный ли подход? Или лучше отдельные Projects для frontend/backend?

7. **Bootstrap prompts** — сейчас это markdown файлы которые пользователь копирует вручную. Можно ли автоматизировать?

8. **Что ещё не учтено?** Какие паттерны steering AI поведения через context не описаны выше?

---

*Документ создан для внешнего ревью и улучшения системы.*  
*Проект: IAM Client OS (iam-client-os) / I AM RUNNING platform*  
*Контакт: Ariel*
