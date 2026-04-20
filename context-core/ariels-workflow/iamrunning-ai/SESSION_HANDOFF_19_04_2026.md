# iamrunning.ai — Session Handoff 19.04.2026

> ⚠️ **DEPRECATED — 20.04.2026 утро.** Этот файл описывает состояние ДО начала работы над Phase 17A. С тех пор Phase 17A и 17B полностью закрыты (12 коммитов, все запушены).
>
> **Актуальный handoff:** `ariel-workflow/iamrunning.ai/EVOLUTION_CONTINUED_20_04_2026.md`
>
> **TL;DR для нового чата:** Phase 17A (10/10 sub-phases) + Phase 17B (manifest + memory foundation + EN sync) = DONE. 12 коммитов от `7d1599b` до `7d66300` на `origin/main`. Remaining Roadmap 17: 17D (Ollama tool polish) → 17C (shadow hints). Суммарно ~5-7h. Файл ниже оставлен для исторического контекста.

---

**Для следующего AI чата (Claude/Sonnet/Opus) или Cursor'а.** Коротко: что произошло, где мы сейчас, что делать дальше.

---

## TL;DR

- **iamrunning.ai РАЗМОРОЖЕН** 19.04.2026 (до этого был заморожен в пользу IAM Client OS до первого клиента).
- **Причина разморозки:** Claude Max подписка ~неделя остатка, Cursor ~2 недели — надо выжать максимум на planning и написание roadmap'ов пока есть инструмент.
- **Главный deliverable сессии:** `ariel-workflow/iamrunning.ai/ROADMAP_17_EXTENDED.md` v3 — полная спека RAG Pipeline + Persistent Memory + Ollama Tool Calling + Bilingual support.
- **Статус реализации:** 0%. Ничего из 17A.0-9 / 17B / 17C / 17D ещё не написано. Cursor ждёт промпта на 17A.0.
- **Roadmap прошёл 1 раунд Ask review в Cursor** — все 6 🔴 блокеров и 5 🟡 must-fix закрыты в v2/v3.

---

## Контекст проекта

**iamrunning.ai** (ex iamrunner.ai) — Electron desktop AI client.
- Solo Mode (offline, local Ollama AI) + Team Mode (подключение к iam-client-os VPS)
- Local MCP server (port 3847) + Cloudflare named tunnel → `iamrunner-ai.iamrunning.online`
- Ollama + Qwen2.5-Coder:7b + nomic-embed-text (будет заменён на bge-m3)
- Vectra (file-based vector store), 875 chunks проиндексировано
- Knowledge Base UI (drag-drop), RAG Stats, Test Query
- 8 MCP tools: read_file, write_file, patch_file, delete_file, list_directory, search_files, git_snapshot, git_log
- OAuth 2.1 + PKCE для Claude connector, persistent token
- Terminal (node-pty), CodeMirror editor, Smart commits

**Где реально работает код:**
`C:\Users\marce\OneDrive\Desktop\I_AM_RUNNING\I_AM_RUNNING_PLATFORM\iamrunner-ai`
(Windows, RTX 3050 8GB VRAM, OneDrive-synced — гостейское окружение)

**GitHub:** https://github.com/ArielGrook/iamrunning.ai

**Source of truth MCP:** iamrunner.ai connector (локальный на машине Ariel'а). Код + 14 спек в `docs/` + 7 файлов architecture map + `rag/` + `roadmaps/` + `progress/`.

**Планирование, стратегия, handoffs:** lego-base MCP → `ariel-workflow/iamrunning.ai/`

---

## Что закрыто до 19.04

Roadmaps 10A-10D, 11, 12, 13, 14, 15, 16 + hotfixes. Подробнее в SHARED_CONTEXT секция 5.

Ключевые закрытые фичи:
- Solo + Team режимы, Local-First архитектура
- Ollama + Claude API streaming + tool calling (max 10 iterations)
- RAG pipeline с persistence при kill (flushIndexedState writeFileSync)
- Knowledge Base UI
- MCP server + OAuth
- Cloudflare named tunnel
- Terminal, editor, Smart commits, Splash screen, PowerSaveBlocker

**Закрытие аудит 19.04:** `src/main/ai-provider.ts` прочитан — Ollama tool calling реализован полностью, но Qwen 7B нестабилен (иногда пишет tool call JSON в content вместо structured field) + Ollama используется с дефолтным `num_ctx: 2048` что фундаментально ограничивает UX.

---

## Что сейчас на столе

### Roadmap 17 Extended v3 — RAG Pipeline + Persistent Memory + Ollama Tool Calling + Bilingual

Полная спека: `ariel-workflow/iamrunning.ai/ROADMAP_17_EXTENDED.md` (~1200 строк).

**10 sub-phases в 17A:**
| # | Название | Effort |
|---|---|---|
| 17A.0 | Ollama num_ctx 8192 + params + Settings UI | 1-2h (SHIP FIRST) |
| 17A.1 | Indexer scope → rag/ only | 1h |
| 17A.2 | KB thin layer (remove dead code) | 2-3h |
| 17A.3 | Batched adds с debounce 1.5s | 2h |
| 17A.4 | Targeted chunk deletion | 1-2h |
| 17A.5 | Transactional migration | 3-4h |
| 17A.6 | Windows/OneDrive guards | 3-4h |
| 17A.7 | queryChunks metadata filters | 1-2h |
| 17A.8 | Nuances + clearIndex bug fix | 2h |
| 17A.9 | Bilingual EN+RU + auto language detect | 4-5h + 2-3h translations |
| 17B | RAG structure + manifest + memory foundation | 3-4h |
| 17C | Persistent memory через shadow hints | 6-8h |
| 17D | Ollama tool calling polish | 3-5h |

**Total:** 33-44h Cursor Agent mode + 2-3h RU translations. 14 коммитов.

**Критический путь:** 17A.0 ships first (independent), потом 17A.1 → 17A.2 → 17A.3 → 17A.4 → 17A.5 → 17A.9.1 (embedder switch). 17A.6/7/8 параллелятся.

---

## Архитектурные решения зафиксированные в эту сессию

1. **RAG контент = Markdown** (оптимум для embedder). JSON отвергнут — хуже для semantic search.
2. **Манифест = JSON** (`rag/.rag-manifest.json`) — metadata отдельно.
3. **Структура RAG:** 4 категории `knowledge | platform | rules | strategy` + `memory` (17C).
4. **Persistent Memory через RAG, не через fine-tune.** 17C использует "shadow instructions" паттерн — при каждом tool call делается `queryChunks(tool:X path:Y, categoryFilter:memory)`, top-2 relevant hints инжектятся в tool result как `<hint source="rag/memory/...">...</hint>`. Модель видит, учитывает, но это не в её весах.
5. **Ollama Tool Calling работает в коде**, проблема — нестабильность Qwen 7B (иногда пишет JSON в content). Фикс: text-based fallback regex в 17D.
6. **Embedder: bge-m3 вместо nomic-embed-text** для multilingual quality (EN+RU без компромиссов).
7. **Язык:** auto-detect по cyrillic ratio в последнем user message, >20% = Russian. NO settings toggle — автоматически.
8. **Code, memory docs, MCP injections, instructions — ВСЕГДА EN.** Только conversational content переводится.
9. **Fine-tune ранний, не через 3-6 месяцев.** 300-500 Chain-of-Thought pairs из EVOLUTION + docs + git log → LoRA на RTX 3050 8GB через unsloth локально (без облака). → Roadmap 18.
10. **MCP tools expansion:** группы с **видимыми** sub-tools, НЕ мега-tools. → Roadmap 19 (вместе с ChatGPT-5 connector).

---

## Бизнес-модель iamrunning.ai (уточнено 19.04)

- **Solo Free Tier:** 1 неделя использования, регистрация + card on file, auto-charge если не отменил. No-refund policy (Cursor-style).
- **Solo Paid:** $50-150/мес
- **Team/Master:** $2,000-6,000 setup + $50-250/seat/мес. Чем меньше людей в команде — тем дороже за seat (inverse scaling).
- **Permanent Purchase:** MCP Tunnel $300, Frontend Plugin $500, AI Presets $500, Fine-tune adapter $1,000
- **MCP-as-a-Service** (Phase 2 после 4-5 клиентов IAM Client OS): pay-per-use, VPS Hetzner GEX44 ($200/мес), Qwen2.5-Coder:14b, 5-10 clients

---

## Как следующему AI чату/Cursor'у начать работу

**Если ты новый Claude чат:**
1. Прочитай этот файл (`SESSION_HANDOFF_19_04_2026_IAMRUNNING_AI.md`) first
2. Прочитай `workspace/SHARED_CONTEXT.md` секцию 5 (iamrunning.ai status)
3. Прочитай `ariel-workflow/iamrunning.ai/ROADMAP_17_EXTENDED.md` — всю спеку
4. Подключись к iamrunner.ai MCP connector, прочитай `HANDOFF.md` и `docs/architecture/README.md` для актуального состояния кода
5. Спроси Ariel какая именно под-фаза сейчас в работе

**Если ты Cursor Agent mode:**
Ariel копипастит содержимое Phase 17A.X из ROADMAP_17_EXTENDED.md в промпт + добавляет wrapper-промпт (env context, files to read, acceptance criteria). Ты не видишь ROADMAP файл сам — он на lego-base MCP сервере, не в локальной проектной папке.

**Если ты Cursor Ask mode (для review):**
Тот же паттерн — Ariel копипастит содержимое + просит review. Уже 1 раз делали такой круг — результат в комментариях коммитов `89a4ea6` и `26548e2`.

---

## Связанные документы

**На lego-base (workspace):**
- `workspace/SHARED_CONTEXT.md` — глобальный роутер памяти (master copy)
- `ariel-workflow/iamrunning.ai/HANDOFF.md` — копия HANDOFF с iamrunner.ai
- `ariel-workflow/iamrunning.ai/ROADMAP_17_EXTENDED.md` — главная спека сессии
- `ariel-workflow/iamrunning.ai/MCP_AS_A_SERVICE_SPEC.md` — Phase 2 концепт (не сейчас)
- `ariel-workflow/iamrunning.ai/TOOL_DISTRIBUTION_SPEC.md` — для IAM Client OS

**На iamrunner.ai MCP (локально):**
- `HANDOFF.md` — source of truth для проекта
- `CURSOR_HANDOFF.md` — для работы без Claude
- `docs/architecture/` — 7 файлов карты системы
- `docs/` — 14 feature specs
- `rag/` — 4 RAG документа + будущие `rag/ru/` + `rag/memory/`
- `roadmaps/ROADMAP_17_RAG_PIPELINE_UNIFICATION.md` — старая narrow version (заменена на extended)
- `src/` — код Electron app

---

## Git commits этой сессии (lego-base)

- `5a5112e` — Initial unfreeze + ROADMAP_17_EXTENDED v1 (4 phases, 17A-D)
- `8fd6054` — Add 17A.7 metadata filters + critical 17A.8 Ollama num_ctx fix
- `89a4ea6` — v2 post-Cursor-review: 9 sub-phases, Windows guards, debounce, targeted delete, transactional migration
- `26548e2` — v3: add 17A.9 bilingual RAG + auto language detection

---

## Что делать дальше (по порядку)

1. **Сейчас:** Ariel отправляет Cursor промпт для 17A.0 (готов в чате Claude).
2. **После 17A.0 commit:** smoke test (прочитать файл 3K строк через AI Chat, проверить что Qwen не теряет контекст).
3. **Если 17A.0 OK:** следующий промпт для 17A.1.
4. **После 17A.1-8 работают:** 17A.9 — switch embedder to bge-m3, полный reindex.
5. **17A.9 code готов:** Ariel (не Cursor) переводит 4 RAG документа через Claude web на русский → `rag/ru/`.
6. **17A готов целиком:** переходим к 17B (structure + manifest + memory foundation).
7. **17B готов:** 17C (shadow hints implementation).
8. **17C готов:** 17D (Ollama tool calling polish).
9. **Roadmap 17 закрыт:** начинается Roadmap 18 (Fine-tune v1 на 300-500 CoT pairs).

---

## Параллельно (не блокирует 17)

- Ariel продолжает GTM по IAM Client OS (LinkedIn DMs, YouTube outreach, cold email).
- IAM Client OS Stage 2-4 (deadline 25.04) делается отдельно Sonnet'ом/Cursor'ом.
- Можно начать скетч Roadmap 18 (fine-tune) — dataset extraction design.

---

*Author: Ariel + Claude Opus 4.7 (19.04.2026, ~11:45-12:15 UTC+3)*
*Session budget: ~60 calls на lego-base MCP, полный roadmap extended v3 написан*
