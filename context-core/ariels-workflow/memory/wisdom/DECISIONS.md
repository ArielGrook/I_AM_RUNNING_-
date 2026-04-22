# WISDOM: Architectural Decisions — IAM Client OS

Ключевые решения и почему они были приняты.
Обновляй когда принимается важное архитектурное решение.

---

## 2026-04-23 (operator role spec session)

**Direct write over git remote for operator push**
Решение: операторские push'и обновлений идут через PUT `/api/operator/files` напрямую в файловую систему клиента, не через git remote.
Почему: git remote был на бумаге классный (diff/rollback бесплатно), но тащит client-side git auth complexity (SSH/PAT на клиенте), security surface (operator remote = постоянный backdoor через git protocol), и клиентский git history становится зависим от наших pushes — для будущего "клиент сам редактирует" станет источником конфликтов. Diff и rollback всё равно собираем поверх своего snapshot store — это пара экранов в Dev Console, не недели работы.
Trade-off: версионирование живёт ТОЛЬКО на iamrunning стороне. Если iamrunning лежит — клиент видит только последнюю версию без истории. Митигация: per-client GitHub snapshot endpoint (отдельный канал).

**Staging buffer на iamrunning стороне (не на клиенте)**
Решение: правки оператора первым делом идут в `data/operator/staging/{client_id}/` на iamrunning. Клиентская ФС не трогается до явного "Push to client" action.
Почему: без staging operator = "мгновенный пуш в прод" → легко уронить клиента опечаткой, deploy fallback это reactive. Staging даёт proactive буфер: накапливаешь правки, смотришь diff, при необходимости сбрасываешь.
Реализация: атомарный multi-PUT при push, snapshot сохраняется до push для rollback, deploy после. На fail deploy — auto-rollback из snapshot.

**Heartbeat = upsert, не отдельный register**
Решение: один endpoint `/api/monitor/heartbeat` делает всё — первый call = создаёт client record (или attaches к Web Installer pre-created), последующие = updates last_seen + version.
Почему: register + heartbeat несут одинаковую info (instance_id, domain). Разделение давало бы 2 endpoints с почти identical schema и race condition (что если heartbeat пришёл до register?). Upsert pattern это решает.

**Inline accordion + badge grid вместо side panel + tabs**
Решение: Client Projects UI — карточки клиентов раскрываются inline (accordion) с сеткой бейджей внутри. Не side panel справа, не модалка, не tabs.
Почему (Ariel's framing): tabs скрывают контент, side panel разрывает scope ("где я?"). Accordion + badges — scope явно очерчен (одна карточка expanded), badges = quick access pattern (много небольших действий, каждое нажимается одним кликом).
Альтернатива была tabs внутри expanded карточки — отвергнута, потому что bademy позволяют "открыть несколько одновременно" и видеть Status + Files + Updates параллельно.

**Server-side MCP toolset > generic run_command**
Решение: вместо whitelisted `run_command` shell escape hatch — типизированные MCP tools per domain (git_repo_action, pm2_action, nginx_action, tail_log, iam_install_run, cert_action, etc.).
Почему: surfaced когда run_command whitelist заблокировал `cd` и `git -C` для commits в sub-repo (`iam-clients-os/source/`). Generic shell tool с whitelist-ом = leaky abstraction (либо shell escape hits edge cases, либо нужны brittle one-liners с `&&`). Типизированные tools знают свой domain → нет shell quoting issues, structured params + responses.
Sequencing: spec этой группы tools после operator role spec — operator endpoints sами потребуют похожих server-side tools (heartbeat read, activity push), лучше дизайнить вместе.

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
