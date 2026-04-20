# ИДЕЯ: MCP FINE-TUNE — PERSISTENT DYNAMIC MEMORY
**Создана:** 06.04.2026
**Статус:** CONCEPT — записать, проработать, реализовать
**Приоритет:** 🔴 HIGH — это меняет весь воркфлоу

---

## ПРОБЛЕМА

Каждый новый чат с AI начинается с нуля. Контекст теряется.
Воркер тратит 5-10 минут на "прогрев" каждой сессии.
Bootstrap prompt статичный — не отражает текущее состояние работы.
Нет механизма контролируемого перехода при достижении лимита контекста.

---

## ИДЕЯ 1: СЧЁТЧИК ВЫЗОВОВ И ЭМПИРИЧЕСКИЙ ЛИМИТ

### Что есть сейчас
MCP сервер уже трекает `SESSION: N/40` в каждом ответе.

### Что нужно добавить
```typescript
// При завершении каждого чата — логировать:
// logs/session-stats.jsonl
{
  "ts": "2026-04-06T18:00:00Z",
  "user": "Super Admin",
  "tool_calls": 34,
  "context_quality": "good",  // субъективно или по результатам
  "tasks_completed": 3,
  "notes_updated": true
}
```

**Цель:** найти эмпирически при каком N начинается деградация контекста.
Гипотеза: ~25-30 вызовов для сложной работы, ~35-38 для простых операций.

После 10-20 сессий — вычислить медиану и использовать как soft limit (90%) и hard limit (100%).

---

## ИДЕЯ 2: 90% ТРИГГЕР — АВТОМАТИЧЕСКИЙ SESSION HANDOFF

### Механика
```
При SESSION: N >= 0.9 * EMPIRICAL_LIMIT:
  
  1. AI автоматически вызывает session_handoff() перед следующим действием
  
  2. session_handoff():
     a. Обновить memory/CURRENT_GOAL.md — текущий статус
     b. Обновить memory/NEXT_ACTIONS.md — ближайшие шаги
     c. Сохранить session notes с максимальным контекстом
     d. Записать в SESSION_STATE.yaml (см. ниже)
     e. Вывести в чат: 
        "⚠️ Context limit at 90% (N/LIMIT calls).
         Session state saved. Please start a new chat.
         New chat will auto-load context via bootstrap prompt."
  
  3. Новый чат читает bootstrap prompt → читает актуальные docs → продолжает
```

### Реализация в bootstrap prompt
```markdown
# ПЕРВЫМ ДЕЛОМ — читай эти файлы:
1. read_file("memory/SESSION_STATE.yaml")  ← текущее состояние
2. read_file("memory/CURRENT_GOAL.md")     ← цель и прогресс
3. read_file("memory/NEXT_ACTIONS.md")     ← что делать прямо сейчас
4. read_file("source-of-truth/WORKER_MECHANICS.md") ← правила

Потом: кратко скажи что в фокусе и спроси "Продолжаем?"
```

---

## ИДЕЯ 3: ДИНАМИЧЕСКАЯ YAML ПАМЯТЬ

### Проблема с текущей системой
Память хранится в `.md` файлах с YAML фронтматтером.
AI читает это как prose — медленно, неструктурированно, теряет детали.

### Решение: SESSION_STATE.yaml
```yaml
# memory/SESSION_STATE.yaml
# Обновляется автоматически при каждом session handoff

meta:
  last_updated: "2026-04-06T18:00:00Z"
  updated_by: "claude"
  chat_id: "2026-04-06-evening"
  tool_calls_at_save: 34

current_focus:
  task: "Build Dev Console backend"
  status: "in_progress"
  priority: "high"
  next_concrete_action: "Create app/api/dashboard/lib/dev-handlers.ts"
  
completed_this_session:
  - id: "tool-registry"
    title: "Tool Registry refactor"
    files: ["lib/tools-registry.ts", "app/admin/types.ts", "app/dashboard/components/DashboardTeamTab.tsx"]
    deployed: true
    
  - id: "notify-router"
    title: "Notification Router"
    files: ["lib/notify.ts"]
    deployed: true
    
  - id: "status-router"
    title: "Status Router + Permission Router"
    files: ["lib/status.ts", "lib/permissions.ts"]
    deployed: true

pending:
  - id: "dev-console-backend"
    title: "Dev Console backend (dev-handlers.ts)"
    priority: 1
    depends_on: []
    
  - id: "dev-console-frontend"
    title: "Dev Console UI (DashboardDevConsoleTab.tsx)"
    priority: 2
    depends_on: ["dev-console-backend"]

key_decisions:
  - "All PR transitions go through lib/status.ts transitionPr()"
  - "All notifications go through lib/notify.ts notify()"
  - "All tool definitions in lib/tools-registry.ts"
  - "Worker save in Dev Console = always PR, never direct write"

blockers: []

architecture_state:
  routers_done: ["tool-registry", "notify", "status", "permission", "data-layer", "pr-router", "push"]
  routers_pending: []
  
warnings:
  - "Admin panel PR list still uses old loadAllPrs pattern — migrate later"
```

### Почему YAML а не JSON или Markdown
- YAML читается AI как структурированный input, не как prose
- Меньше токенов на парсинг структуры
- Легко обновлять точечно через patch_file
- Человеку тоже читабельно

---

## ИДЕЯ 4: УНИВЕРСАЛЬНЫЙ BOOTSTRAP PROMPT

### Принцип
Bootstrap prompt **не меняется**. Меняются только данные которые он читает.
Один prompt работает для любой роли, любого проекта, любого состояния.

```markdown
# UNIVERSAL BOOTSTRAP v1

Ты — AI помощник в системе IAM-CLIENT-OS.

## ШАГ 1: Загрузи контекст (обязательно, в этом порядке)
1. read_memory()                          ← роль, правила, сообщения
2. read_file("memory/SESSION_STATE.yaml") ← что делалось, что дальше
3. read_file("memory/NEXT_ACTIONS.md")   ← конкретные следующие шаги

## ШАГ 2: Скажи коротко (2-3 предложения)
- Что в фокусе прямо сейчас
- Что было сделано в прошлой сессии
- Что будем делать в этой

## ШАГ 3: Спроси
"Продолжаем с [NEXT_ACTION]? Или есть другие приоритеты?"

## ПРАВИЛА
- Не делай ничего без прочтения SESSION_STATE.yaml
- После каждого значимого действия — git_snapshot
- При SESSION > 90% лимита — выполни session_handoff и предупреди
```

---

## РЕАЛИЗАЦИЯ — ПЛАН

### Этап 1: Счётчик и статистика (~1 час)
- [ ] Добавить логирование в `logs/session-stats.jsonl` при каждом MCP вызове
- [ ] Поле `session_tool_calls` в ответе MCP (уже есть SESSION: N/40)
- [ ] Собрать 10 сессий статистики → вычислить реальный лимит

### Этап 2: SESSION_STATE.yaml (~2 часа)
- [ ] Создать `memory/SESSION_STATE.yaml` с начальным состоянием
- [ ] Добавить `update_session_state(state)` tool в MCP
- [ ] Обновлять при каждом `update_session_notes` вызове
- [ ] Bootstrap prompt читает его первым

### Этап 3: 90% триггер (~3 часа)
- [ ] В `app/api/mcp/route.ts` — добавить проверку при каждом запросе
- [ ] При N >= 0.9 * limit — добавить в ответ warning: `⚠️ SESSION_LIMIT_APPROACHING`
- [ ] AI видит warning → вызывает `session_handoff` action в `my_workspace`
- [ ] `session_handoff`:
  - Обновляет SESSION_STATE.yaml
  - Обновляет NEXT_ACTIONS.md
  - Выводит инструкцию для пользователя

### Этап 4: Универсальный Bootstrap (~1 час)
- [ ] Переписать все `bootstrap-prompts/*.md` под новый формат
- [ ] Сделать один `bootstrap-prompts/universal.md` как основу
- [ ] Роль-специфичные промты = `universal.md` + дополнения

---

## ПОЧЕМУ ЭТО МЕНЯЕТ ВСЁ

### Для разработчика (Ariel)
- Каждый новый чат начинается там где предыдущий закончился
- Не нужно объяснять контекст заново
- 90% триггер — никаких потерь работы из-за переполнения контекста

### Для воркеров (Steve, Troy, etc.)
- onboard() всегда актуальный — читает SESSION_STATE.yaml
- Знают точно что делать дальше
- Не тратят токены на прогрев сессии

### Для системы в целом
- Voркфлоу ускоряется в 3-4x
- Ошибки из-за потери контекста исчезают
- Масштабируется на любое кол-во ролей и проектов

---

## СВЯЗЬ С MCP FINE-TUNE (следующий горизонт)

Это база для настоящего MCP fine-tuning:
- Статистика сессий → понимаем паттерны использования
- SESSION_STATE.yaml → понимаем "качественные" vs "неудачные" сессии
- На этих данных можно обучать лучшие подсказки в smartOk/smartErr
- В конечном счёте — специализированные MCP endpoints под конкретные workflow

**Никто так ещё не делает. Это первопроходство.**

---

*Создана: 06.04.2026 | Обновить после реализации*
