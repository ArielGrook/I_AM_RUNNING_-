# WISDOM: Architectural Decisions — IAM Client OS

Ключевые решения и почему они были приняты.
Обновляй когда принимается важное архитектурное решение.

---

## 2026-04-10

**Dev Console = Workspace tool, not Code Editor**
Решение: app/, lib/, extensions/ скрыты от всех — включая Super Admin в Dev Console.
Почему: система не должна показывать собственную реализацию клиентам.
Управление кодом платформы — через MCP/SSH, не браузер.

**Gemini primary + Flash fallback для AI Chat**
Решение: gemini-2.5-pro первичная, gemini-2.5-flash fallback при 503.
Почему: pro перегружается, flash всегда доступна. Подтверждено через ListModels API.
Урок: маркетинговые имена ≠ API имена. Всегда проверяй ListModels.

**SESSION_WARN_THRESHOLD: 40 → 80**
Решение: поднять лимит предупреждения вдвое.
Почему: 40 вызовов слишком мало для сложных задач. Качество не деградирует линейно.

**Wisdom folder скрыт от Dev Console, доступен через MCP**
Решение: memory/wisdom/ — SYSTEM_CODE_DIR, не workspace.
Почему: это датасет системы, не рабочие файлы команды. Только AI читает/пишет.

---

## 2026-04-08 — 2026-04-06

**Permission Router pattern (lib/permissions.ts)**
Решение: can(role, action), canFile(role, path, mode) — единая таблица.
Почему: разрозненные проверки isSuperAdmin + capabilities → сложно поддерживать.
Результат: новая capability = 1 запись вместо изменений в 6 файлах.

**Notification Router (lib/notify.ts)**
Решение: notify(event, payload) — один вызов вместо 15+ copy-paste паттернов.
Почему: каждое событие требовало saveMessages + pushNewMessages + text formatting.

**Status Router (lib/status.ts)**
Решение: transitionPr(prId, transition, ctx) — атомарный переход.
Почему: PR transitions включают validate + permission + apply file + notify + task update.
40+ строк в двух файлах → 10 строк вызова.

**Filesystem-based JSON data layer**
Решение: все данные в data/*.json, не в БД.
Почему: 0 зависимостей, легко бэкапить, читается MCP инструментами напрямую.
Ограничение: не масштабируется выше 10-20 воркеров (concurrent writes).
Когда переходить: при первых признаках race conditions или >50 req/sec.

**Reviewer не назначается явно**
Решение: все reviewer-ы видят все PRs без назначения.
Почему: назначение создавало bottleneck. "Кто первый взялся — тот ревьюит."
Трейдофф: нет accountability за конкретный PR.
