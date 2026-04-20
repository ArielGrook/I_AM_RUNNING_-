# MCP Fine-tune — Управление поведением AI через ответы MCP сервера

**Status:** idea / research
**Priority:** MEDIUM — долгосрочное исследование
**Source:** Ariel brainstorm 01.04.2026

---

## Концепция

MCP сервер возвращает текст. Claude читает этот текст как часть контекста. Значит мы можем включать в ответы инструментов **поведенческие инструкции** которые Claude будет следовать.

Это примитивный fine-tune без API:
- Нет доступа к system prompt Claude (он задаётся пользователем/платформой)
- Но каждый ответ MCP tool = часть контекста = влияет на поведение
- Первый ответ (onboard/read_memory) = самый мощный, задаёт тон всей сессии

## Что уже работает (реализовано 31.03.2026)

1. **smartOk preamble** — `[ROLE: developer | SESSION: 5/40 | TASK: Fix hero]` — Claude видит роль и задачу в каждом ответе ✅
2. **Session warning** — после 40 вызовов "рекомендуй новый чат" — Claude реально следует ✅
3. **onboard structured briefing** — замена raw read_memory dump, включает: проект, задачи, сообщения, PR, заметки, workflow правила, список инструментов ✅
4. **read_file >500 lines hint** — "Use patch_file for targeted edits, NOT write_file" ✅ (Experiment 1 DONE)
5. **create_pr → update_notes reminder** — "Before ending: call my_workspace('update_notes')" ✅ (Experiment 2 DONE)
6. **Workflow enforcement в onboard** — правила, workflow шаги, "ты ИНСТРУМЕНТ, не замена" ✅ (Experiment 3 DONE)
7. **NEXT STEP в my_workspace("status")** — контекстная подсказка: исправь PR / работай над задачей / нет задач ✅ (Experiment 4 PARTIALLY)
8. **write_file/patch_file non-admin → create_pr hint** — "Prefer create_pr for explicit PR creation with clear titles" ✅
9. **my_prs changes_requested warning** — "⚠️ Address feedback on [PR] before creating new PRs" ✅

## Эксперименты — статус

### ✅ Experiment 1: Directive injection в read_file — IMPLEMENTED
Файлы >500 строк получают hint. Только для non-admin.

### ✅ Experiment 2: Next step suggestion в create_pr — IMPLEMENTED
PR creation → reminder about update_notes.

### ✅ Experiment 3: Workflow enforcement в onboard — IMPLEMENTED
Полный набор правил в onboard response.

### ⬜ Experiment 4: Contextual hints в status — PARTIALLY DONE
NEXT STEP suggestion работает, но file-specific hints (номера строк, предыдущие PR) — TODO.

### ⬜ Experiment 5: Error recovery instructions — NOT YET
Нужно добавить в error responses для patch_file и read_file.

## Метрики для измерения

- % PR с description vs без
- Количество ошибок patch_file per session
- Использование update_notes (% сессий где вызывается)
- Время от onboard до первого PR (меньше = лучше)
- Количество "разведочных" read_file до начала работы

## Записи экспериментов

(добавлять по мере проведения)

| Дата | Эксперимент | Результат | Вывод |
|------|-------------|-----------|-------|
| — | — | — | — |

---

*Создано: 01.04.2026*
