# actual_state/ — Актуальное состояние платформы
*Обновлён: 08.04.2026*

Эта папка содержит актуальные документы платформы I AM RUNNING.
**Читать первым** перед любой работой с проектом.

---

## Файлы

| Файл | Что это |
|------|---------|
| `ARIEL_WORKFLOW.md` | **Личный source of truth** — правила, серверы, быстрый старт |
| `PLATFORM.md` | I AM RUNNING как платформа — два формата, три продукта |
| `IAM_CLIENT_OS_MASTER.md` | Team Workspace — статус, архитектура, команда |
| `IAMRUNNER_AI_MASTER.md` | Desktop Client — архитектура, Knowledge Base, Cursor стратегия |
| `GTM.md` | Go-to-market — два рынка, три фазы, аргументы продажи |

---

## Быстрый старт

```
Работа с iamrunning.online (этот сервер):
  → Claude коннектор "i am running"
  → read_file("context-core/actual_state/ARIEL_WORKFLOW.md")

Работа с iam-client-os:
  → Claude коннектор "lego-base"
  → read_memory (загружает всё автоматически)

Работа с iamrunner.ai:
  → cloudflared + npm run dev + Cursor
```

---

## Чего здесь нет

- `context-core/legacy/` — устаревшие документы марта 2026 (датасет, не удалять)
- `context-core/` корень — технические доки по website builder (ARCHITECTURE, COMPONENTS, DEBUG_MAP и т.д.)
