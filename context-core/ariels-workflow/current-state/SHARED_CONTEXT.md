# SHARED CONTEXT — I AM RUNNING Platform
### Глобальный роутер памяти для всех AI агентов платформы
### Обновлён: 20.04.2026 (день) — section 4 now reflects iam-client-os 19.04 evening state
### Авторы: Ariel + Claude Opus 4.6 + Claude Sonnet 4.6 + Claude Opus 4.7
### Копии: lego-base/workspace/ (MASTER), iamrunning.online/context-core/actual_state/

**ЧТО ЭТО:** Единственный документ который связывает несколько нейросетей между собой. Разные AI агенты (iam-client-os чат, iamrunning.ai чат, iamrunning.online чат) читают этот файл и понимают: на каком этапе проект, что делают другие, какие решения приняты. Это глобальная память платформы.

**КТО ЧИТАЕТ:** 2-3 нейросети одновременно. Каждая работает со своим продуктом но видит общую картину через этот файл.

---

## 1. ПЛАТФОРМА

```
I AM RUNNING (Ariel, 18, founder)
├── IAM Client OS       — Team AI Workspace (server-side, ГОТОВ К ПРОДАЖЕ)
│   └── test.lego-base.online | VPS 185.5.55.111
├── iamrunning.online   — Website Builder SaaS (лендинг платформы, переделывается)
│   └── VPS 94.176.238.108
└── iamrunning.ai       — Desktop Client (local, ex iamrunner.ai, ребрендинг утверждён)
    └── Electron + Ollama + MCP tunnel
```

Связь: iamrunning.ai = локальная версия iam-client-os. iamrunning.online = marketing front door. MCP = единый протокол.

---

## 2. БИЗНЕС-МОДЕЛЬ (4 тира)

### Тир 1: SaaS Small (IAM Client OS)
- Малый бизнес, маркетинг, контент
- На сервере КЛИЕНТА. +$30/мес за managed hosting на нашем
- Setup: $0. Цена: $20-90/user/мес (модульно)

### Тир 2: Premium (IAM Client OS)
- Средний бизнес, dev teams, agencies
- Setup: $350-6,000. Цена: $60-100/user/мес
- Upsale: Custom Plugin Access $500 one-time

### Тир 3: Solo (iamrunning.ai)
- Developers, фрилансеры. Setup: $0. Цена: $50-150/мес. Free tier
- Permanent purchase инструментов. MCP tunnel. Community Portal

### Тир 4: Team (Master Mode)
- Лицензия: $2,000-6,000 + $50-200/seat/мес
- Permanent purchase должностей ($3k за seat навсегда)

### Permanent Purchase
| Инструмент | Подписка | Перманентно | Окупаемость |
|-----------|---------|-------------|-------------|
| Frontend Plugin | $30/мес | $500 | 16 мес |
| Advanced AI Presets | $35/мес | $500 | 14 мес |
| MCP Tunnel Bridge | $25/мес | $300 | 12 мес |
| Fine-tune модели | — | $1,000 | exit fee |

НЕ продаётся перманентно: RAG + Knowledge Base.

### Revenue: subscriptions, setup fees, managed hosting, permanent purchases, plugins, custom plugin access ($500), fine-tune ($1k), AI API (будущее), community→team conversion (40% скидка)

---

## 3. СТРАТЕГИЯ (обновлено 16.04.2026 — GTM launch day)

### MCP Market Research (новое, 16.04)
- MCP рынок: $4.5B (2025), рост 34.6% CAGR, 97M monthly SDK downloads
- 5800+ MCP серверов, 300+ клиентов. Backed by: Anthropic, OpenAI, Google, Microsoft, AWS
- Simple MCP server разработка: $4-15k, 2-4 недели delivery
- **IAM Client OS = ЕДИНСТВЕННЫЙ turnkey MCP workflow для SMB. Конкурентов с таким пакетом НЕТ.**
- Все крупные игроки (Moody's, Microsoft Copilot, AWS Bedrock) обслуживают enterprise. SMB ниша пустая.
- Наш edge: готовый продукт за 1-3 дня vs индустрия 2-12 недель

### Go-to-Market (обновлено 16.04)

**Позиционирование в публичных профилях:** Professional AI Business Systems Developer. НЕ beta-tester.
**Позиционирование в личных сообщениях:** Beta-tester approach. "Набираю 3-5 команд для тестирования. $300-500 за установку."

**Upwork Profile Title:** Custom Workflows via MCP | Local AI Workflows via Ollama
**LinkedIn Headline:** AI Business Systems Developer | Custom Workflows via MCP Protocol | Local AI via Ollama

**GTM каналы (ранжированы по ожидаемому ROI):**
1. LinkedIn DMs — Israeli AI influencers + global MCP community
2. YouTube — маленькие AI/automation каналы (500-10k subs), бесплатный доступ за review/тест
3. Cold email — 10/day через iamrunning.online@gmail.com
4. Facebook — Israeli tech groups (Israeli Startups, AI Israel, Israeli Developers)
5. Reddit — engagement marketing в r/mcp, r/LocalLLaMA, r/ClaudeAI, r/selfhosted
6. Upwork — мониторим Appeal (аккаунт suspended из-за verification бага), любого клиента тянем на Upwork за review
7. Upwork/Fiverr — как база контактов (находим AI фрилансеров, пишем им через LinkedIn)

**Ключевые тактики:**
- Любой клиент найденный вне Upwork → просить сделать контракт через Upwork → builds review history
- YouTube каналы: не только MCP/Claude — ANY digital/AI/automation/no-code каналы
- Pitch для нетехнических каналов: "AI workflow system" не "MCP server implementation"
- Upwork/Fiverr profiles как contact database: находим freelancers, пишем как peer через LinkedIn
- Fiverr ОТБРОШЕН как канал продаж — race to bottom с $90 Indian devs

**Israeli community targets (identified 16.04):**
- Gilad Shoham (11.5k followers) — community leader, AI Ladders, MCP, n8n
- Leon Mulumud (8k followers) — Gen AI Lead, co-founder MCP Israel

**Формулировка проблемы (обновлено 16.04):**
НЕ "менеджер не видит что делает AI". Проблема: AI мощный, люди это понимают, но используют его обособленно — каждый в своём чате, со своими трюками для сохранения контекста. Без правильных инструментов AI ощущается как неуклюжий инструмент. Решение: shared workflow с persistent memory вместо изолированных чатов.

---

## 4. СТАТУС IAM CLIENT OS (обновлено 19.04.2026 вечер — PRODUCTION-READY)

**🎯 Status:** Platform production-ready для первого реального клиента. Stage 3 test install прошёл на iam-test.lego-base.online. No known blockers.

**Focus state:** FROZEN — не бикшеддим пока не появится реальный клиент с багом. Все активные силы на iamrunning.ai (Phase 17D next).

### Что работает end-to-end (все verified 19.04 через MCP connector)
- Core workflow: Tasks → PR → Review → Approve+Deploy
- 6 мега-tools с гранулярными правами
- MCP Tool Injection v2 (smartOk, smartErr, checkBlock, session_handoff, preset injection)
- **MCP session counter reset** — фикс 19.04 (сбрасывается на read_memory/onboard/session_handoff)
- Activity Log v2, Messaging V2, Goals, Product Tour, Deploy lock, Push notifications
- iam. prefix (/iam.admin, PM2 iam.{name})
- Operator API endpoint (/api/operator)
- iam-client.sh installer — протестирован end-to-end на свежем VPS
- TOTP first-run flow
- Bootstrap prompts (English, generic, sanitized)
- Memory templates clean (skeleton-based)
- **Dev Console tab persistence** — 19.04: открытые вкладки + active file сохраняются в localStorage при переключении табов админки + unsaved-changes warning
- **Dashboard Setup tab** — 19.04: восстановлен (был silently removed), Bootstrap Prompt + Product Tour + Avatar + Skills снова доступны воркерам
- **OAuth security hardening** — 19.04: debug logging в `/api/mcp/authorize` и `/token` закрыт за `OAUTH_DEBUG` env flag, default off (раньше писали team_token + client_secret + auth code в plaintext в oauth-debug.log на каждый OAuth request)
- **Super Admin preset авто-инклюд всех tools** — 19.04: `super-admin-token-generate` теперь использует `ALL_TOOLS` из registry вместо hard-coded списка (новые sub-actions автоматом попадают в дефолт)
- `docs/architecture/` — client-facing ADMIN_PANEL_INTEGRATION.md (один документ вместо 8 dev-facing)

### Stage 3 test install — LIVE
- **URL:** https://iam-test.lego-base.online
- **Path:** /var/www/iam.test
- **PM2:** iam.iam-test (id 2), online
- **Port:** 4742 (параллельно с основным iam-os на 4741)
- **MCP token hash (current):** sha256:67f9d78c793fcbdfd3b310d0e89e8c83b8f8f7f408ff24de9036b2ed88f50875
- **Verified:** TOTP login, Admin Panel, MCP connector auth, read_memory returns clean templates, hidden paths работают, Bootstrap prompts generic EN, OAuth debug log не создаётся

### Skeleton repo
`ArielGrook/iam-client-skeleton` — синхронизирован 5 раз за 19.04. Все фиксы запушены. `iam-client.sh` по умолчанию клонит оттуда.

### Коммиты 19.04 (7 штук на lego-base dev)
- `250144d` fix(mcp): reset session counter on read_memory/onboard/session_handoff
- `76a8c03` docs(skeleton): replace dev-facing docs with ADMIN_PANEL_INTEGRATION
- `a06a622` fix: BUG 1 CLIENT_DOMAIN scheme (pre-existing)
- `2207e23` fix(mcp-oauth): gate debug logging behind OAUTH_DEBUG env flag
- `4805376` feat(dev-console): persist open tabs + warn on unsaved changes
- `7c9ee18` fix(team): super_admin token generate uses ALL_TOOLS
- `427ca7c` fix(dashboard): restore Setup tab (was removed)
- `a56198d` docs: evening handoff 19.04 + memory updates
- `186645d` docs(shared-context): Phase 17B + calibration notes (iamrunning.ai section update)

### Backlog iam-client-os (non-blocking — фиксить только когда рядом правишь)
1. `team-regenerate-token` handler обновляет только `token_hash`, не `tools[]`. Для super_admin → refresh к ALL_TOOLS, для остальных → refresh к ROLE_TOOL_PRESETS[role]. Location: `app/api/admin/lib/post-handlers.ts`
2. MANIFEST.txt — explicit exclude для `app/api/admin/totp-test-flow` (cosmetic warning на каждый sync, safety net уже работает)
3. SSL для iam-test: `certbot --nginx -d iam-test.lego-base.online --non-interactive --agree-tos -m admin@iam-test.lego-base.online --redirect`
4. End-to-end scenario test (worker→PR→approve+deploy → logs/deploy.jsonl entry) — прогнать при онбординге первого реального клиента

### Что делает НОВЫЙ чат если клиент зарепортил баг
1. Прочитать этот section 4 + `ariel-workflow/handoffs/HANDOFF_19_04_2026_EVENING.md`
2. Воспроизвести баг на dev (lego-base) или iam-test
3. Фикс на dev → sync skeleton → rebuild iam-test для проверки
4. Релизнуть пострадавшему клиенту

### Security note
- MCP token `2416b88b...` компрометирован (засветился в oauth-debug.log и в чат-истории), ротирован 19.04
- Current super_admin token hash: `sha256:67f9d78c...`
- GitHub PAT для skeleton push (`github_pat_11BWGRV3I0...`) планируется к ротации

## 5. СТАТУС IAMRUNNING.AI (обновлено 19.04.2026 — РАЗМОРОЖЕН)

**Приоритет:** Проект разморожен 19.04.2026 по решению Ariel. Работает параллельно с IAM Client OS (Stage 2-4). Фокус текущей сессии — планирование и спецификации ROADMAP для Cursor. Причина срочности: Claude Max подписка ~неделя остатка, Cursor ~2 недели остатка — надо выжать максимум на написание roadmap'ов пока есть инструмент.

**Папка планирования:** `ariel-workflow/iamrunning.ai/` (перенесена 19.04.2026 из `workspace/iamrunning.ai/` для консолидации с остальным ariel-workflow контекстом).

**GitHub repo:** https://github.com/ArielGrook/iamrunning.ai

**Работает ✅:**
- Solo + Team Mode, Local-First архитектура
- Ollama AI Chat + Claude API (streaming + tool calling, max 10 iterations)
- RAG: 875 чанков, persistence при kill (flushIndexedState writeFileSync)
- Knowledge Base UI (drag-drop), MCP server (8 tools), OAuth 2.1 + PKCE
- Cloudflare named tunnel, Terminal (node-pty), CodeMirror editor
- Smart commits, Splash screen, PowerSaveBlocker (prevent-display-sleep)
- Auto-indexing убран (только по кнопке)

**Закрытые roadmaps:** 10A-10D, 11, 12, 13, 14, 15, 16 + hotfixes

**Roadmap 17 EXTENDED v4 — Phases 17A + 17B COMPLETE (обновлено 20.04.2026 утро):**
Полная спека: `ariel-workflow/iamrunning.ai/ROADMAP_17_EXTENDED.md`
Расширенный recap: `ariel-workflow/iamrunning.ai/EVOLUTION_CONTINUED_19_04_2026.md` + `EVOLUTION_CONTINUED_20_04_2026.md`

**Phase 17A — DONE (10/10 sub-phases, ~11h real Cursor time, 19.04.2026):**
- ✅ 17A.0 (7d1599b) — Ollama num_ctx/num_predict/temperature + OOM banner
- ✅ 17A.1 (15d3527) — indexer scoped to {project}/rag/
- ✅ 17A.2 (e471557) — KB thin layer, dead code removed
- ✅ 17A.3 (8060a4f) — batched scheduler + debounce
- ✅ 17A.4 (8e83095) — targeted chunk deletion via metadata.path
- ✅ 17A.5 (1f9a5ff) — migration + bge-m3 swap (also closed clearIndex state reset)
- ✅ HOTFIX — bge-m3 cold-start timeout 15s→120s
- ✅ 17A.6 (38f18ee) — Windows/OneDrive guards + normalizePathForChunkId
- ✅ 17A.7 (9ea82b3) — queryChunks filters + QueryOptions
- ✅ 17A.8 (d7d9db1) — live RAG stats + Clear Index UI + embedding-model guard
- ✅ 17A.9 (7316add) — bilingual EN+RU with auto language detection + 4 RU translations

**Phase 17B — DONE (1 commit, ~2h, 19.04.2026 вечер):**
- ✅ 17B (7d66300) — RAG structure + manifest + memory foundation + EN/RU sync cleanup
  - `rag/.rag-manifest.json` — центральный registry (version/lastUpdated/documents)
  - `rag/_templates/` — 5 skeleton'ов (knowledge, platform, rules, strategy, memory)
  - `rag/memory/` — 4 placeholder'а под Phase 17C (с TRANSLATION_PENDING_MARKER)
  - NEW `src/main/rag/rag-manifest.ts` — shared manifest utilities
  - indexer emit'ит metadata.category из manifest
  - vector-store `resolveStoredCategory` заменил 17A.7 stub
  - knowledge-base: validateRagDocument warns если файл не в manifest
  - docs/RAG_HOW_TO_ADD.md — step-by-step guide для Ariel
  - EN sync cleanup: RAG_KNOWLEDGE.md + RAG_RULES.md обновлены под bge-m3 + {project}/rag/
  - RAG_STRATEGY.md EN: полный rewrite с русского на natural English (был в русском)

**Manual verification 17A.9 (5/6 tests passed):**
- ✅ EN query → EN response
- ✅ RU query → RU response (from rag/ru/)
- ❌ RU query "прочитай src/main/ai-provider.ts" → Qwen failed to find existing file (Qwen tool-call instability, NOT file system issue — file verified present via MCP). **Добавляет срочности Phase 17D.**
- ✅ Short "ok" followup → RU fallback works
- ✅ Code block with RU comment → RU response, code preserved
- ✅ Bilingual retrieval: EN query hits rag/RAG_PLATFORM.md, RU query hits rag/ru/RAG_PLATFORM.md

**GitHub status:** 12 коммитов от 17A.0 до 17B все запушены на `github.com/ArielGrook/iamrunning.ai`. Git tree clean на `7d66300`.

**Remaining Phase 17 — REORDERED (17D first due to user-facing urgency):**
- ◻ **17D** — Ollama tool calling polish (2-3h) — **NEXT**, addresses Qwen tool-call failure seen in 17A.9 test
- ◻ 17C — Persistent memory via shadow hints (3-4h, зависит от 17B manifest + memory/ foundation — теперь unblocked)

Total remaining: ~5-7h Cursor time. Roadmap 17 close возможно в одну рабочую сессию.

**Калибровка timing (вывод):** Оценки в roadmap были 2-3× conservative. Реальное время на Composer 2 thinking с clean Premium requests — significantly меньше. Phase 17A+17B суммарно оценивались 20-30h, по факту ~13h.

**Status пауза:** 20.04.2026 утро — Ariel на IAM Client OS. Возврат на iamrunning.ai — вечером через новый чат.

**After Roadmap 17 complete:** Roadmap 18 — Fine-tune v1 (QLoRA on RTX 3050 via unsloth, 300-500 CoT pairs).

### Задачи после Roadmap 17
1. **Roadmap 18 — Fine-tune v1** (LoRA QLoRA на 300-500 CoT pairs из EVOLUTION + docs + git log, на RTX 3050 8GB локально через unsloth)
2. **Roadmap 19 — MCP Tools Expansion + ChatGPT-5** (больше tools в группах с видимыми sub-tools, НЕ мега-tool, + OAuth для GPT-5)
3. **Roadmap 20 — Master Mode UI** (invite flow, role management, LAN hosting)
4. **Roadmap 21 — Payment (PayPal)** (Subscriptions, free tier 1 неделя с картой, no-refund Cursor-style)
5. **Roadmap 22 — License Server** (iamrunning.online API)
6. **Roadmap 23 — LAN + mDNS** (discovery, Ollama proxy через Master)

**Документация:** полная реструктуризация 19.04.2026. docs/ (14 спек), docs/architecture/ (7 файлов — карта системы), CURSOR_HANDOFF.md (для работы без Claude).

**Handoff для другого AI чата:** lego-base → `ariel-workflow/iamrunning.ai/HANDOFF.md`

**MCP-as-a-Service (концепт):** iamrunning.ai как MCP Provider на VPS (Hetzner GEX44, $200/мес, RTX 4000 Ada, Qwen2.5-Coder:14b). Phase 2 после 4-5 клиентов IAM Client OS. Pay-per-use pricing.

---

## 6. АРХИТЕКТУРНЫЕ РЕШЕНИЯ
D1: License на iamrunning.online API. D2: Ребрендинг первым. D3: Invite link. D4: mDNS + fallback. D5: Ollama прокси через Master. D6: Ребрендинг → Local-First → Master → License → LAN. D7: Onboarding через AnyDesk. D8: Splash screen.

---

## 7. ЦЕНООБРАЗОВАНИЕ IAM CLIENT OS (обновлено 16.04.2026)

### Phase 1 — Beta (первые 3-5 клиентов):
- Setup: $300-500 (тестируем три ценовых точки)
- Monthly: бесплатно в обмен на feedback
- Позиционирование: "Beta-tester" ТОЛЬКО в личных сообщениях, НЕ в публичных профилях
- Первый платёж: PayPal (Stripe позже)
- Delivery: 1-3 дня от ТЗ до сдачи

### Phase 2 — после 4-5 кейсов:
- Setup: $1,500–3,000+
- Monthly: $70–80/user
- Market context: simple MCP servers sell $4-15k with 2-4 weeks delivery

### Phase 3 — MCP-as-a-Service (future):
- $29-99/month subscription per team
- Fine-tuned model access through MCP endpoint
- Shared RAG knowledge base

### Каналы: LinkedIn, YouTube, Email, Facebook, Reddit, Upwork (после восстановления)

---

## 8. OPERATOR DASHBOARD (концепт Ariel, утверждён)

**Где:** iamrunning.online → Admin Panel → таб "Servers"/"Projects"
**Что:** единая панель управления ВСЕМИ клиентскими инстансами (и серверные IAM Client OS, и локальные iamrunning.ai)
**Полная спека:** IDEAS/concepts/OPERATOR_DASHBOARD_SPEC.md

### Карточки проектов, 6 табов каждая:
1. **Overview** — домен, IP, VPS, версия, uptime, server stats
2. **Team** — все пользователи, роли, токены, activity score
3. **Access** — SSH, GitHub repo, deploy key, MCP URL, operator token, TOTP
4. **Activity** — лог событий с фильтрами (PR/deploy/tasks/messages/errors)
5. **Updates** — версия, changelog, кнопка "Push Update", история, rollback
6. **Billing** — план, стоимость, payment history, invoice generation

### Протокол:
- Heartbeat: клиент → iamrunning.online каждые 5 мин (server) / 15 мин (local)
- Activity push: дельта новых событий каждые 5 мин через POST /api/monitor/activity
- Update push: iamrunning.online → клиент через POST /api/operator/update
- install.sh автоматически ставит heartbeat cron + operator API endpoint + регистрирует инстанс

### Два типа инстансов:
- **Server (IAM Client OS):** полный доступ — SSH, GitHub, MCP, все логи, push updates
- **Local (iamrunning.ai):** через License API, heartbeat при запуске, auto-updater Electron

### Privacy:
- Messages content НЕ передаётся (только counts)
- Код НЕ передаётся (только PR metadata)
- AI chat НЕ передаётся (только query counts)
- Credentials зашифрованы AES-256

### Для обоих чатов:
- **IAM Client OS:** добавить в install.sh operator cron + /api/operator/* endpoints
- **iamrunning.ai:** License API heartbeat + метрики (session time, AI queries, RAG size, модель Ollama)
- **iamrunning.online:** создать /api/monitor/* endpoints + Supabase таблицы (instances, instance_team, instance_activity, instance_billing, instance_payments, instance_updates) + UI таб Servers в admin panel

---

## 9. RAG FEDERATION (концепт Ariel)
5 слоёв: Персональный RAG → Групповой RAG → Компиляция на Master → Fine-tune (одна модель, LoRA) → Дистрибуция.
Feedback: reject → anti-pattern → предупреждение всем. Production bug → чеклист ревьюера.
Логировать с первого клиента: user, role, action, path, context, outcome, iterations, time.

**ПРАВИЛО: ВСЕ RAG чанки, датасеты, инсайты — ТОЛЬКО НА АНГЛИЙСКОМ.** Русский только для общения между людьми. Код, данные, training data — английский. Модели лучше работают с английским, клиенты международные.

**EVOLUTION файл как источник данных:** EVOLUTION_CONTINUED_10_04_2026.md — готовый датасет. Каждый блок = training pair: problem → root_cause → actions → files_changed → result → insight. Инсайты (поле `insight`) — самое ценное для RAG. Категории: architecture_decision, bugfix_pattern, security_lesson, ux_principle, workflow_optimization, tooling_lesson, deployment_gotcha. Структурировать каждый блок EVOLUTION в JSON чанк при компиляции.

Полная спека: IDEAS/concepts/RAG_FEDERATION_SPEC.md

---

## 10. TOOL DISTRIBUTION — философия (решение Ariel 13.04)

**Превентивное ограничение tools — тупиковая схема.** Система не решает за владельца бизнеса.

**Принцип:** ВСЕ tools доступны. Цепочка делегирования: Super Admin раздаёт tools админам + даёт админу permission раздавать дальше → Admin раздаёт tools своим воркерам. `defaultRoles` в TOOL_REGISTRY = рекомендация при создании пользователя, НЕ ограничение. В UI — подсказки типа "⚠️ delete_file рекомендуем только для admin" но без блокировки.

**Архитектура: 6 мега-tools вместо 26 отдельных.** Один tool на группу, внутри sub-actions через параметр `action`. Паттерн уже работает: `my_workspace(action: "status")`, `manage_goals(action: "add")`.

**6 мега-tools:**
1. **files** → actions: read, write, patch, delete, rename, move, copy, list, create_dir, search
2. **tasks** → actions: create, add_specification, read_memory
3. **communication** → actions: send_message, workspace_status, onboard
4. **goals** → actions: list, manage, add_comment
5. **code_review** → actions: create_pr, reviewer_approve, reviewer_request_changes, update_doc
6. **devops** → actions: git_snapshot, git_log, deploy, set_preset

**UI:** Admin Panel Team Tab — grouped checkboxes с warnings (⚠️ caution / ⚠️⚠️ dangerous). Apply/Reset to Default/Give All (с confirmation). Bulk "Apply to all with role: X". Visual diff при Apply.

**Порядок реализации:**
1. Переименовать `category` → `group` в TOOL_REGISTRY, добавить `warning` + `warningLevel`
2. Admin Panel Team Tab — grouped checkboxes + warnings + Apply/Reset/Give All
3. Bulk "Apply to role" кнопка
4. `distribute_tools` capability + Dashboard Team Tab editing — второй этап
5. Новые file sub-actions (rename/move/copy/create_dir) — отдельно, не блокер

---

## 10. ACTIVITY LOG V2 — расширенное логирование (утверждено, первый эшелон)

**Файл:** logs/activity.jsonl | **Спека:** IDEAS/concepts/ACTIVITY_LOG_V2_SPEC.md
**Приоритет:** реализация ДО мобильной адаптации. Фундамент для RAG Federation + Operator Dashboard.

### Формат записи
```json
{"ts":"...","user":"steve","role":"developer","action":"pr_created","session_id":"sess-abc","pr_id":"pr-steve-018","files_read_before":3,"time_since_task_ms":3600000,"iteration":1}
```

### Positive events (30 типов):
- **File ops:** file_read, file_write, file_search, file_delete, directory_list
- **PR:** pr_created, pr_resubmitted, pr_reviewer_approved, pr_approved, pr_comment
- **Tasks:** task_created, task_assigned, task_started, task_completed, task_reactivated
- **Deploy:** deploy_triggered, deploy_success
- **Session:** login, logout, session_expired
- **Messages:** message_sent, group_created (NO content — privacy)
- **AI:** ai_query (provider, tool_calls[], iterations — NO query content)
- **Goals:** goal_created, goal_updated, goal_comment

### Negative events (15 типов — САМЫЕ ЦЕННЫЕ для RAG):
- **PR rejections:** pr_rejected, pr_changes_requested — поля `reason` (текст) + `category` (validation/error_handling/security/performance/logic/architecture/breaking_change/missing_feature/style/test_missing)
- **Deploy:** deploy_failed, deploy_rollback, deploy_timeout
- **Server:** server_error (endpoint, status, stack_file, stack_line), memory_warning, disk_warning
- **Auth:** auth_failed, totp_failed, token_expired, rate_limited
- **Tools:** tool_error, tool_timeout, tool_forbidden
- **Tasks:** task_overdue (assignee, overdue_by_hours)
- **Push:** push_failed (target, reason)

### Ключевое — поле `category` для PR rejections:
Классификация ошибки → агрегация: "у Steve 60% реджектов по error_handling". Becomes anti-pattern в RAG.

### session_id:
Генерируется при логине, связывает все действия в одну сессию. Позволяет вычислить flow: files_read → ai_queries → pr_created → outcome.

### Точки интеграции в коде:
MCP route.ts + tools/, dashboard pr-handlers/worker-handlers/messaging-handlers/goals-handlers, admin post-handlers/get-handlers, dashboard auth/route.ts, lib/push.ts, deploy-logged.sh, dev-ai-handler.ts

### Для Operator Dashboard:
scripts/push-activity.js читает activity.jsonl, отслеживает offset, пушит дельту на iamrunning.online/api/monitor/activity каждые 5 мин.

### Для RAG Federation:
- Паттерны: files_read_before → pr_outcome корреляция
- Anti-patterns: reason + category из pr_rejected/pr_changes_requested
- Управление: task time_to_complete × iteration_count × формулировка TZ

### Для обоих чатов:
- **IAM Client OS:** расширить lib/data/activity.ts, добавить session_id в session data, интегрировать во все handlers (список в спеке)
- **iamrunning.ai:** аналогичный формат для локального лога (AI chat history, file navigation, time tracking, RAG queries)

---

## 11. INSTALL.SH + ONBOARDING FLOW (утверждено)

**Спека:** IDEAS/concepts/INSTALL_ONBOARDING_SPEC.md

### Философия
Оператор ставит систему и проверяет что работает. Точка. Всё остальное — клиент сам. Система самодостаточна.

### Onboarding: 3 фазы
**Фаза 0 (пре-онбординг):** создать GitHub репо (ArielGrook/{client}), invoice, Terms of Service, получить SSH доступ.
**Фаза 1 (install.sh):** SSH → `install.sh --domain= --name= --github= --port=3100` → система работает.
**Фаза 2 (проверка):** открыть URL, проверить /admin, проверить heartbeat на iamrunning.online. Передать URL клиенту. Всё.
**Фаза 3 (клиент сам):** TOTP setup, создание аккаунтов, токены, MCP коннекторы, Product Tour.

### install.sh — принцип "плагин, не захват"
- Ставится в отдельную папку (default `/var/www/iam.client/`), свой порт (default 3100)
- **iam. префикс** на всём нашем: папка `iam.client/`, nginx конфиг `iam.{domain}`, PM2 процесс `iam.{clientname}`, cron комментарии `# iam.client`. Файлы внутри папки остаются оригинальные (package.json и т.д.) — иначе Node.js не найдёт.
- Флаг `--no-landing`: если у клиента уже есть сайт, лендинг не нужен — система сразу на логин
- НЕ трогает существующий сайт, Nginx конфиги, PM2 процессы, cron jobs
- Auto-detect: Node, PM2, Nginx, fail2ban, UFW — если есть, пропускает
- Генерирует ВСЕ secrets автоматически (MCP token, TOTP, VAPID, operator token)
- Включает: rollback при падении (trap cleanup EXIT), проверка ресурсов (≥1GB RAM, ≥5GB disk), healthcheck после pm2 start (curl localhost:PORT), update mode (--update для обновлений без потери данных)
- Ставит crons: heartbeat + activity push на iamrunning.online каждые 5 мин
- Регистрирует инстанс на iamrunning.online/api/monitor/register

### Operator API (новый endpoint в IAM Client OS)
`/api/operator/*` — управление сервером клиента БЕЗ SSH:
- GET /status, POST /update (git pull + build + restart), POST /restart, GET /logs
- Auth: Bearer OPERATOR_TOKEN (из .env.local)
- Даже если клиент поменяет SSH пароль — оператор имеет доступ через API

### Тестирование
1. Чистый VPS → install.sh → работает
2. VPS с существующим сайтом → install.sh --port=3100 → работает рядом
3. iamrunning.online → install.sh --port=3200 → demo рядом

### Для обоих чатов:
- **IAM Client OS:** создать /api/operator/* endpoints, ecosystem.config.js шаблон, scripts/heartbeat.sh + push-activity.js
- **iamrunning.online:** создать /api/monitor/* endpoints (register, heartbeat, activity)

---

## 12. ARCHITECTURE DOCS (для всех AI agents)

**Папка:** `docs/architecture/` — полная карта системы. Любой AI agent читает нужный документ ПЕРЕД работой.

| Документ | Что покрывает |
|----------|--------------|
| `README.md` | Индекс + quick recipes ("как добавить MCP tool", "как добавить таб", etc.) |
| `api/DASHBOARD_API.md` | 50+ dashboard actions, все handlers, capability gates |
| `api/ADMIN_API.md` | 50+ admin actions (GET + POST), extensions system |
| `api/MCP_API.md` | Все MCP tools, auth flow, 7 мест регистрации |
| `features/PR_TASKS_MCP.md` | PR lifecycle, Tasks, MCP tools map |
| `features/NOTIFICATIONS_ROLES_GOTCHAS.md` | Notifications, Roles/Auth, Dev Console, Activity Log, GOTCHAS |
| `data/DATA_LAYER.md` | lib/data/ модули, JSON schemas, 4 глобальных роутера |
| `ui/UI_MESSAGING_SESSIONS_DEPLOY.md` | UI components (Dashboard 7 табов, Admin 8 табов), Messaging V2, Sessions, Deploy |

**Инструкция для Sonnet:** "Прочитай docs/architecture/README.md и нужный feature doc перед работой. Без аудитов."

---

## 13. ПЛАН НА НЕДЕЛЮ (15-20.04.2026, обновлено 20.04)

| День | Задача | Статус |
|------|--------|--------|
| **15.04 (вт)** | MCP Tool Injection + TOTP + bootstrap + install.sh cleanup + demo install | ✅ DONE |
| **16.04 (ср)** | GTM launch: Upwork, LinkedIn, MCP research, 6 channels. 🔴 Upwork suspended | ✅ DONE |
| **17.04 (чт)** | Stage 0 cleanup, Dev Console file delete fix, Stage 1 skeleton infrastructure | ✅ DONE |
| **18.04 (пт)** | Stage 1 first skeleton sync, GitHub PAT, lego-base dev pushed | ✅ DONE |
| **19.04 (сб)** | **BIG DAY:** 7 коммитов на iam-client-os (Stage 3 test install, MCP counter, Dev Console persist, OAuth security, Super Admin preset, Setup tab restore) + Phase 17A+17B на iamrunning.ai (12 коммитов, 13h total) | ✅ DONE |
| **20.04 (вс)** | Утро: SHARED_CONTEXT update для iamrunning.ai Phase 17B. День: SHARED_CONTEXT section 4 refresh для iam-client-os 19.04. Вечер: iamrunning.ai Phase 17D (Ollama tool-calling polish) | 🔄 IN PROGRESS |

### Текущие приоритеты (20.04)

**Платформа iam-client-os:** FROZEN. Никакой активной работы. Только если реальный клиент зарепортит баг.

**iamrunning.ai:** ГОРЯЧИЙ ФОКУС.
- Phase 17D (Ollama tool-calling polish, 2-3h) — NEXT, вечерний чат
- Phase 17C (Persistent memory, 3-4h) — после 17D
- Phase 18+ (Fine-tune, MCP Tools Expansion, Master Mode, Payment, License, LAN) — после Roadmap 17 complete

**GTM (Ariel, параллельно):**
- LinkedIn DMs к Gilad Shoham + Leon Mulumud
- YouTube: маленькие AI/MCP/automation каналы (500-10k subs)
- Cold email 10/день
- Reddit r/mcp engagement
- Demo viewer account (read-only admin на iam-test для холодных демо)

---

## 14. PERSISTENT MEMORY — ПРАВИЛА ОБНОВЛЕНИЯ (критично, решение Ariel 14.04)

**ПРОБЛЕМА:** За 3 недели разработки memory файлы обновлялись спорадически. CURRENT_GOAL от 11.04 описывал цены двухнедельной давности. WEEKLY_PROGRESS пропустил целую неделю. SESSION_STATE от 10.04. Каждый новый AI чат читал устаревший контекст и работал с неправильной картиной. Это КОРНЕВАЯ ПРИЧИНА хаоса в разработке.

**РЕШЕНИЕ: Обновление памяти — ПЕРВЫЙ ПРИОРИТЕТ, не последний.**

### ⚠️ ПРАВИЛА ДЛЯ ВСЕХ AI АГЕНТОВ (читающих этот файл):

1. **memory/ файлы обновляются КАЖДУЮ СЕССИЮ.** Не "если успеем". Не "в конце". В ПРОЦЕССЕ работы. Если ты сделал что-то значимое — обнови CURRENT_GOAL или WEEKLY_PROGRESS тут же.

2. **SHARED_CONTEXT обновляется при ЛЮБОМ стратегическом решении.** Новая цена? Записать. Новая архитектура? Записать. Решили что-то заморозить? Записать. Другие AI чаты должны об этом узнать.

3. **SESSION_STATE.yaml обновляется при КАЖДОМ handoff.** Что в фокусе, что сделано, что pending, какие решения приняты.

4. **Code-level enforcement (TODO):** MCP сервер должен БЛОКИРОВАТЬ операции если контекст не загружен:
   - Нельзя write_file/patch_file если не вызван read_memory
   - Нельзя deploy если нет git_snapshot < 5 мин
   - При завершении сессии (>50 tool calls) — автоматический prompt "обнови session notes"
   - Это уже частично реализовано, нужно усилить

5. **Персистентная память = набор файлов:**
   - `memory/CURRENT_GOAL.md` — текущий приоритет, прогресс, блокеры
   - `memory/NEXT_ACTIONS.md` — что делать сейчас и на неделе
   - `memory/WEEKLY_PROGRESS.md` — что сделано (не пропускать недели!)
   - `memory/SESSION_STATE.yaml` — machine-readable handoff между сессиями
   - `memory/ARCHITECTURE.md` — техническая карта проекта
   - `memory/TEAM_ROLES.md` — роли, токены, capabilities
   - `memory/SYSTEM_IDENTITY.md` — что за система
   - `memory/RULES.md` — security (locked, не трогать)
   - `memory/wisdom/` — паттерны, анти-паттерны, решения, инсайты
   - `workspace/SHARED_CONTEXT.md` — **ГЛОБАЛЬНЫЙ РОУТЕР** между всеми AI чатами

6. **SHARED_CONTEXT — это не просто файл, это протокол.** Когда несколько AI работают над разными частями платформы, SHARED_CONTEXT — единственное что их связывает. Каждый AI при старте читает его и понимает общую картину. При важном изменении — обновляет его. Другие AI при следующем чтении видят обновление.

---

## 15. ПРАВИЛА
Русский для общения, английский для кода. Одна задача на промпт. git_snapshot перед deploy.
iam-client-os: lib/data/ source of truth, rm -rf .next перед build, read_memory первым.
iamrunning.ai: Local-First, короткий system prompt, manifest-first, text-based tool fallback.
iamrunning.online: компоненты в 4 местах, GSAP opacity:0 запрещён.

---

## 16. ДОКУМЕНТЫ
lego-base: workspace/ (shared context, business model, GTM), ariel-workflow/iamrunning.ai/ (handoff для локального проекта), memory/, IDEAS/concepts/, docs/architecture/ (карта системы IAM Client OS)
iamrunner.ai: docs/ (14 спек), docs/architecture/ (7 файлов — карта системы), rag/ (4 RAG docs), roadmaps/, HANDOFF.md, CURSOR_HANDOFF.md
iamrunning.online: context-core/actual_state/, CLAUDE_INSTRUCTION.md, docs/

---

## 17. QUICK START
iamrunning.ai чат: подключись к iamrunner.ai MCP → читай HANDOFF.md + docs/architecture/README.md. Или читай lego-base → ariel-workflow/iamrunning.ai/HANDOFF.md
iam-client-os чат: read_memory + workspace/SHARED_CONTEXT.md + docs/architecture/README.md
iamrunning.online чат: CLAUDE_INSTRUCTION.md + context-core/actual_state/README.md

*Обновлено: 20.04.2026 | Master copy на lego-base*

---

## 19. MCP-AS-A-SERVICE — НОВЫЙ КОНЦЕПТ (16.04.2026)

**Идея:** iamrunning.ai (Electron + Ollama + fine-tuned models) становится **MCP PROVIDER**. Web-клиенты на iam-client-os подключаются как **MCP CLIENTS** через tunnel. Получают:
1. Fine-tuned model inference (industry-specific)
2. Специализированные workflow tools (недоступные больше нигде)
3. Shared knowledge base (RAG federation across clients)

**Архитектура:**
```
Client's iam-client-os (web, на их VPS)
    └── MCP Client Panel → connects to Ariel's MCP endpoint
              │
              │ MCP protocol over HTTPS
              │ Bearer auth + tenant isolation
              ▼
Ariel's iamrunning.ai (Electron или VPS)
    ├── Cloudflare named tunnel
    ├── Custom MCP Server
    │    ├── Tool: ask_specialist_model → Ollama fine-tuned inference
    │    ├── Tool: analyze_technical_debt
    │    └── Tool: generate_architecture_doc
    ├── Ollama (fine-tuned model)
    └── Vectra (shared RAG knowledge base)
```

**Почему это ломает рынок:**
- Клиент получает quality лучше чем base Claude/Gemini на workflow-specific задачах
- Model weights остаются на инфраструктуре Ariel — клиенты не могут скопировать
- Network effect: больше клиентов = больше training data = лучшая модель
- Subscription ($29-99/month) поверх одноразового setup = recurring MRR

**Для iamrunning.ai чата:** полная спека написана в чате iam-client-os 16.04 (search "ДОКУМЕНТ 2: СПЕКА ДЛЯ КУРСОРА"). 5 фаз: MCP Server Skeleton → Client-Side MCP Client → First Tools → RAG Federation → Billing.

**Это Phase 2.** Сначала продать базу (IAM Client OS). После 4-5 клиентов — MCP-as-a-Service.

---

## 20. TOOL INJECTION — ДЫРА В ДОКУМЕНТИРОВАНИИ (найдено 16.04)

MCP injection system (smartOk) напоминает AI правила при каждом tool call. Но **НЕТ** инструкции "обнови документацию после изменения". Есть только "note in memory" про архитектуру, но не про CURRENT_GOAL/WEEKLY_PROGRESS/roadmap.

**TODO:** Добавить в smartOk для write/patch actions правило:
```
If this change closes a task or changes project status →
update memory/CURRENT_GOAL.md and ariel-workflow/roadmap.md
```

Это закроет проблему устаревшей документации навсегда.

---

## 18. ОБНОВЛЕНИЕ 12.04.2026 вечер — Сессия Opus (iamrunning.ai чат)

### Качество сессии: средне
Opus 4.6 много галлюцинировал на протяжении сессии. Ariel вынужден был корректировать и направлять. Тем не менее удалось закрыть 5 roadmaps + 3 hotfix + бизнес-модель + AI стратегию.

### Выполнено через Cursor ✅
- **Roadmap 11** — Local-First Fix: local:callTool/vps:callTool, Files всегда локальные, Sidebar Local+Team
- **Roadmap 12** — Ребрендинг iamrunner.ai → iamrunning.ai + Splash screen с прогресс-баром
- **Roadmap 13** — Bug fixes: RAG recovery, project folder change, rag:index-complete event
- **Roadmap 14** — RAG Stats: getActualChunkCount() из vectra, Full Re-index кнопка
- **Roadmap 15** — RAG Reliability: unload chat model перед индексацией, паузы, MAX_FAILURES 15
- **Hotfixes** — concurrent RAG mutex, periodic save каждые 10 файлов, out/ в SKIP_DIRS

### RAG — текущее состояние
RAG технически работает но нестабилен. Индексация всего проекта бесполезна — забивает индекс сырым кодом и скомпилированными бандлами. Нужна стратегия: индексировать ТОЛЬКО подготовленные документы от Claude, не весь проект.

### Нерешённые баги iamrunning.ai
- PowerSaveBlocker: prevent-app-suspension не работает, нужен prevent-display-sleep
- Auto-indexing при старте нужно убрать (только по кнопке)
- RAG indexed-files.json не сохраняется при kill приложения (periodic save помогает частично)

### AI Training Strategy (утверждено Ariel)

**RAG = мануал (ЧТО есть в проекте)**
- Claude через MCP создаёт структурированную документацию
- Документы складываются в RAG папку
- Ollama индексирует ТОЛЬКО эту папку, не весь проект
- Top-5 чанков по релевантности на каждый запрос
- Больше чанков = точнее поиск, не больше нагрузки на модель

**Fine-tune = опыт работы (КАК делать)**
- ИСКЛЮЧИТЕЛЬНО Chain-of-Thought формат dataset
- Каждый output начинается с аудита (читаю ARCHITECTURE.md)
- Одна инструкция = одна цепочка (3-10 шагов)
- Модель учится ДУМАТЬ: аудит → анализ → действие → проверка
- Минимум 500 пар, оптимум 1000-5000
- Источники: EVOLUTION.md, Activity Log V2, PR history
- Срок накопления: 3-6 месяцев
- LoRA адаптер ~300MB, тренировка $5-20 на RunPod

**Связь RAG + Fine-tune:**
- RAG = шпаргалка (помнит факты проекта)
- Fine-tune = подготовка (понимает логику работы)
- Вместе = подготовленный разработчик со шпаргалкой

**Что НЕ работает:**
- Индексация всего проекта в RAG (мусор, бесполезно)
- Fine-tune на неструктурированных данных (мусорная модель)
- Простые пары вопрос-ответ без chain-of-thought (примитивно)

### Документы записаны на iamrunner.ai
- IDEAS/AI_TRAINING_STRATEGY.md — полная стратегия
- IDEAS/BUSINESS_MODEL_FINAL.md — 4-тирная модель с permanent purchase
- IDEAS/PERMANENT_PURCHASE_SPEC.md — спека permanent purchase
- IDEAS/ARCHITECTURE_DECISIONS.md — 8 решений
- progress/SESSION_12.04.2026.md — итоги сессии
- roadmaps/ — 11, 12, 13, 14, 15 + hotfixes

### Для Sonnet чата (iam-client-os)
- Activity Log V2 критически важен — формат dataset для future fine-tune
- Каждый PR reject/approve = training pair
- session_id связывает действия в цепочку
- Начинать логировать с ПЕРВОГО клиента
