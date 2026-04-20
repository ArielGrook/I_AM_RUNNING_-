# WISDOM: Coding Patterns — IAM Client OS

Паттерны которые работают. Сюда пишется то что было проверено в продакшне.
Обновляй этот файл когда находишь паттерн который стабильно работает.

---

## File Operations

**patch_file requires unique old_text:**
Всегда включай достаточно контекста (2-3 строки вокруг) чтобы old_text был уникальным.
Если встречается >1 раз — добавь больше контекста.

**write_file vs patch_file:**
- <500 строк или >40% изменений → write_file
- Точечная правка → patch_file (экономит токены)
- Всегда читай файл перед patch_file

**git_snapshot timing:**
- ВСЕГДА перед деструктивной операцией (delete, overwrite)
- ВСЕГДА после группы связанных изменений перед deploy
- Сообщение: "feat/fix/refactor: что конкретно"

---

## Architecture Patterns

**Theme object для dark mode:**
```tsx
const T = {
  border: isDark ? '#222' : '#e5e5e5',
  surface: isDark ? '#0d0d0d' : '#fafafa',
  text: isDark ? '#eee' : '#333',
  textMut: isDark ? '#666' : '#888',
}
```
Не используй className для dark mode в inline-styled компонентах.

**API action routing (dashboard route.ts):**
Новые actions добавляются в соответствующий массив + capability-gate.ts.
Порядок: TEAM → PR → GOALS → MESSAGING → DEV → worker handler

**filterByAccess + isSystemCodeDir:**
Системные файлы (app/, lib/) скрыты от всех через isSystemCodeDir().
Кастомные пути — через loadCustomHiddenPaths() из settings.json.

---

## MCP Tool Patterns

**smartOk() как injection point:**
Все tool responses проходят через smartOk(). Это место для напоминаний.
Не возвращай raw строки из tool handlers — используй smartOk() или err().

**Gemini tool calling:**
- agentic loop: max 10 итераций
- functionCall в parts → executeTool → functionResponse → следующий вызов
- old_text должен быть уникальным (та же логика что и patch_file)

---

## Memory Management (CRITICAL — added 14.04.2026)

**Обновление памяти — ПЕРВЫЙ приоритет, не последний.**
За 3 недели memory файлы обновлялись спорадически → каждый новый чат работал с устаревшим контекстом → хаос.

**Правило:** Если сделал что-то значимое — обнови memory/ ТУТ ЖЕ. Не "в конце сессии". В процессе.

**Что обновлять и когда:**
- `CURRENT_GOAL.md` → при изменении прогресса, блокеров, цен, стратегии
- `WEEKLY_PROGRESS.md` → каждый день с новыми результатами
- `NEXT_ACTIONS.md` → при завершении задач или появлении новых
- `SESSION_STATE.yaml` → при каждом handoff / смене фокуса
- `SHARED_CONTEXT.md` → при ЛЮБОМ стратегическом решении (цены, архитектура, заморозка фич)

**SHARED_CONTEXT = глобальный роутер памяти.** 2-3 AI агента читают его одновременно. Обновляешь → все видят. Не обновляешь → все работают вслепую.

---

## Deployment

**Safe deploy sequence:**
```bash
pm2 stop iam-os && rm -rf .next && npm run build && pm2 start iam-os
```
После failed build (удалён .next) сервер возвращает 403 (не 502).

**Deploy tool** — fire-and-forget через spawn(detached:true).
Результат в logs/deploy.jsonl — проверяй через read_file если не уверен.
