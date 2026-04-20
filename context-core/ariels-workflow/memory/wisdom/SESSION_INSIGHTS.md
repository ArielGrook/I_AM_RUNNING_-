# WISDOM: Session Insights — IAM Client OS

Инсайты из сессий работы. Обновляй в конце каждой сессии.
Формат: дата | что узнали | как применить

---

## 2026-04-10

**Tool response injection как механизм памяти**
Вставка напоминаний в каждый tool response (через smartOk) надёжнее чем system prompt инструкции.
Причина: AI "видит" напоминание прямо перед следующим действием, а не только в начале сессии.
Применение: добавить tool-specific суффиксы в smartOk() для write/patch/git_snapshot.

**Wisdom folder как живой датасет**
Паттерны должны записываться сразу — не откладывать "до файн-тюна".
Каждый найденный баг → ANTI_PATTERNS.md. Каждое решение → DECISIONS.md.
Применение: обновлять wisdom/ в конце КАЖДОЙ сессии как обязательный шаг.

**Лимит 40 инструментов мешал сложным задачам**
При тёмном режиме (7 табов) + DevConsole Block 3 + Block 4 в одной сессии лимит давил.
Поднято до 80. Качество AI не деградирует линейно с количеством вызовов.

**Stripe для payouts требует IBAN, не карту**
Buwei виртуальная карта → не подходит для Stripe payouts.
Нужен IBAN (некоторые fintech дают) или банковский счёт.
Решение: батин IBAN → Stripe. Потом: эстонское OÜ или грузинское ИП.

**SESSION_STATE.yaml быстрее чем prose session notes**
AI парсит YAML структуру быстрее чем читает prose notes.
current_focus + pending + key_decisions = контекст восстанавливается за 1 tool call.

---

## 2026-04-06

**Внешний аудит (Cursor Opus) → 6 уязвимостей за 10 минут**
То что кажется готовым изнутри имеет дыры не видные при пошаговой разработке.
Применение: внешний аудит перед каждым клиентом — обязательно.

**Router pattern = масштабируемость**
Permission Router, Notification Router, Status Router.
Каждый новый case = 1 строка, не 5 файлов.

## 2026-04-15 — Session Insight
Session 2 Arch fixes required ~30 calls total. Large section replacements (Arch 2 was ~120 lines) work well as single patch when old_text is fully verified via read_file first. Always search for remaining instances after replacement to confirm 0 matches before snapshot.

## 2026-04-15 — Session Insight
PM2 caches environment variables at process start. Editing .env.local + pm2 restart is NOT enough — must pm2 delete + pm2 start to reload env. This caused the TOTP first-run bug: old TOTP_SECRET stayed in PM2 memory even after removal from .env.local. Also: install.sh must NOT generate secrets that bypass first-run flows. The first-run flow should own the entire secret lifecycle.

## 2026-04-18 — Session Insight
CRITICAL LESSON 18.04.2026 evening — never stop the dev PM2 process when testing a separate installation on the same server. Multi-install coexistence is the whole point: each install has own path/port/domain/PM2 name/nginx config. If you find yourself typing `pm2 delete iam-os` before a test install — STOP, that's the wrong approach. The test goes on a FRESH subdomain (iam-test.lego-base.online), FRESH path (/var/www/iam.test), FRESH port (4742) — dev stays running, its MCP connector keeps working, no collisions. Second lesson: when using `pm2 start npm --name X -- start` without --cwd, PM2 captures the current PWD as the process cwd permanently. If PWD is wrong, every restart uses wrong cwd → ENOENT on package.json → crash-restart loop → 502. Always use ecosystem.config.js which has explicit cwd, or pass --cwd /correct/path explicitly. Third lesson: when MCP connector errors start appearing mid-session, that's a signal to save handoff IMMEDIATELY via `tasks action session_handoff` and continue in a fresh chat — Claude accumulates context-drift errors in long sessions, and the mistakes compound (today: suggested stopping dev to install test, suggested rm nginx configs that didn't need removing, took 3 turns to diagnose a 502 that was a simple cwd issue). User correctly identified this: "Claude tupit lyuto" — the correct response is session handoff, not continuing to dig.

## 2026-04-18 — Session Insight
"When testing a skeleton-based installer, smoke-test OAuth discovery endpoint (/.well-known/oauth-authorization-server) BEFORE attempting Claude.ai connector setup. If issuer/endpoints come back without https:// scheme, the connector will 500 on first request. This is a fast pre-flight check: curl --resolve <domain>:443:127.0.0.1 https://<domain>/.well-known/oauth-authorization-server and eyeball the JSON. Second lesson: Admin Panel 'Generate Token' buttons must be traced end-to-end — it's not enough that the UI shows a token, it must actually be the token the MCP route validates against. Button that generates random UI string without persisting is worse than no button (breaks trust on first client use)."

## 2026-04-19 — Session Insight
Docs cleanup principle: if a document duplicates information in code comments or memory/ARCHITECTURE.md, it is not reference material — it is confusion. Delete it. Single source of truth beats three overlapping sources every time. For client-facing docs, the rule is stricter: only stable integration contracts belong there, never implementation notes. The extensions/ plugin system was already working (Statistics tab proves it) but undocumented — the fix was one integrator-facing document, not restructuring of internal docs.

## 2026-04-19 — Session Insight
"When you hit session limit mid-task, save completed work product (not just progress notes) to memory/workers/<role>/. A next-chat handoff that says 'move this file, here are the exact paths' costs 2 tool calls in the new chat instead of regenerating the whole thing. Turn the limit into a checkpoint, not a loss."

## 2026-04-19 — Session Insight
Two classes of silent bugs found today. First: code removed from UI but handlers left behind creates invisible features. Setup tab in Dashboard had render handler and component still present but tab array entry was deleted, making the entire feature inaccessible without error. When removing UI surface area always grep all references including render handlers. Second: hard-coded lists duplicated from a registry fall out of sync when the registry grows. Super Admin tools array was missing tasks.session_handoff because it was hard-coded instead of derived from TOOL_REGISTRY. When a file declares a source of truth use it everywhere downstream, never copy-paste into a second static list. Third: security logging without env flags is a liability not a feature. Any debug logger writing tokens, secrets, or PII must be gated behind env like OAUTH_DEBUG, default off in production. Today we found OAuth routes writing team_token and client_secret in plaintext to a log file on every request with no flag.
