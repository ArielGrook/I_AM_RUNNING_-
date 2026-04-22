# HANDOFF — iamrunning.ai

**Updated:** 21.04.2026 evening
**State:** Roadmap 17 COMPLETE. Roadmap 18 (Fine-tune v1) queued.

---

## Quick Start (новый Claude чат по iamrunning.ai)

Подключись к **iamrunning** MCP коннектору (не lego-base — он decommissioned). Прочитай в этом порядке:

1. Этот файл — entry point
2. `context-core/ariels-workflow/iamrunning-ai/README.md` — current status одной страницей
3. `context-core/ariels-workflow/iamrunning-ai/EVOLUTION_CONTINUED_21_04_2026.md` — самый свежий tactical recap (Roadmap 17 close)
4. `context-core/ariels-workflow/current-state/SHARED_CONTEXT.md` — общий контекст всей платформы
5. `context-core/ariels-workflow/iamrunning-ai/ROADMAP_17_EXTENDED.md` — закрытая, но полезна как образец структуры будущих roadmaps

Для конкретного кода iamrunning.ai (Electron app):
- Подключись параллельно к **iamrunner.ai** MCP connector (локальный, на машине Ariel'а)
- Читай `docs/architecture/README.md` (карта системы из 7 файлов) и оттуда дальше по нужной фиче
- `CURSOR_HANDOFF.md` в корне — entry point если работаешь без Claude

---

## Что это

**iamrunning.ai** (ex iamrunner.ai) — десктопный Electron клиент с локальным AI (Ollama) и MCP integration.

```
I AM RUNNING (платформа)
├── IAM Client OS       — Team AI Workspace на VPS (готов к продаже, ~$300-500 setup beta / $1.5-3k post-beta)
├── iamrunning.online   — Лендинг + License API + Operator Dashboard (хост источников всей документации)
└── iamrunning.ai       — Desktop Client с локальной Ollama (этот проект)
```

iamrunning.ai = Solo Mode (offline single-developer, $50-150/mo) + Team Mode (LAN/Tunnel, $2k-6k setup + $50-200/seat/mo). Один Electron app, два рынка.

**Стек (актуально на 21.04.2026):**
Electron 33, React 18, Tailwind, Zustand, CodeMirror 6, xterm.js, node-pty, Ollama (Qwen2.5-Coder:7b), **bge-m3** embedder (1024-dim multilingual, заменил nomic-embed-text в 17A.5), Vectra (file-based vector store), MCP SDK, Cloudflare named tunnel.

---

## Статус (21.04.2026 evening)

### Работает ✅ — Roadmap 17 close

**RAG pipeline (17A + 17B):**
- Indexer scoped to `{project}/rag/` only (no project-wide noise)
- Knowledge Base UI (drag-drop) as thin layer over `rag/`, batched scheduler with debounce
- Targeted chunk deletion on KB remove (no full clearIndex thrashing)
- Transactional migration from `%APPDATA%`, bge-m3 embedder swap
- Windows/OneDrive resilience (placeholder detection, BOM strip, symlink skip, EBUSY retry)
- queryChunks filters: `topK`, `categoryFilter`, `pathPrefix`, `language`, `minScore`
- Live RAG stats UI + Clear Index button + embedding-model guard
- Bilingual EN+RU with auto language detection (cyrillic ratio in last user msg, code-fence stripped, short-msg fallback)
- Manifest registry (`rag/.rag-manifest.json`) with path-based category resolution
- 5 starter templates in `rag/_templates/`
- `docs/RAG_HOW_TO_ADD.md` step-by-step guide

**Ollama tool calling (17D):**
- Text-based fallback regex parsing `{"name": "...", "arguments": {...}}` — Ollama-native format Qwen2.5-Coder was trained on
- Dynamic tool schema injection from `tools[]` parameter — auto-includes new tools as they're added
- `nonToolIterations` counter throws `QWEN_TOOL_INSTABILITY` after 3 consecutive misses
- AiChat banner with "Switch to Claude" / "Dismiss" actions; preserves stored API key on switch
- `fn.arguments` parsed when Ollama emits as serialized JSON string (Qwen variant)

**Persistent memory (17C):**
- `shadow-hints.ts` runs `queryChunks(categoryFilter: 'memory', topK: 2, minScore: 0.7)` after every tool call
- `appendHints()` wraps results in `<hint source="...">...</hint>` blocks, injected into tool response sent to model (NOT into UI IPC events)
- Both Ollama and Claude paths integrated
- `store_memory` tool (9th MCP tool) — categories `behavioral_patterns | file_relationships | anti_patterns | workflow_reminders`, 60s per-category rate limit, debounced reindex via `scheduleReindex`
- 4 starter memory docs (EN only — memory is internal system data, never translated per 17A.9)
- `docs/PERSISTENT_MEMORY_GUIDE.md` written

**Pre-existing infrastructure (Roadmaps 10-16, kept):**
- Solo + Team Mode, Local-First architecture
- Claude API (streaming + tool calling, max 10 iterations)
- MCP server (now 9 tools), OAuth 2.1 + PKCE, Cloudflare named tunnel
- Terminal (node-pty), CodeMirror editor, smart commits via Ollama
- Splash screen with progress bar, PowerSaveBlocker (prevent-display-sleep)
- Indexing only by button (auto-index removed in Roadmap 16)

### Closed roadmaps

10A-10D, 11, 12, 13, 14, 15, 16 + hotfixes, **17A.0-17A.9 + 17B + 17D + 17C** (Roadmap 17 EXTENDED v4 fully closed).

### Queued — work next

1. **Roadmap 18 — Fine-tune v1** (PRIMARY NEXT)
   - 300-500 chain-of-thought training pairs from EVOLUTION docs + git log + acceptance transcripts
   - QLoRA on RTX 3050 8GB via unsloth, locally (no cloud)
   - Output: LoRA adapter (~300MB), distributable to clients as `$1,000 permanent purchase` SKU
   - Why now: Roadmap 17 produced exactly the structured records needed as training data
2. Roadmap 19 — MCP Tools Expansion + ChatGPT-5 (more tools in visible groups, OAuth for GPT-5)
3. Roadmap 20 — Master Mode UI (LAN/Tunnel for teams, invite flow)
4. Roadmap 21 — Payment via PayPal Subscriptions (no IBAN required, unlike Stripe)
5. Roadmap 22 — License Server on iamrunning.online
6. Roadmap 23 — LAN Mode + mDNS, Ollama proxy through Master

### Backlog concepts (not roadmaps yet)

- **`THINKING_TRACE_UI`** — Ariel observed during 17C testing that Qwen visibly streams "thinking" text during generation, but final UI render replaces it with only the polished answer. Three approach options documented in `EVOLUTION_CONTINUED_21_04_2026.md`. Defer prioritization until Roadmap 18 results inform whether this is needed for trust or made redundant by better-aligned model.
- **`store_memory` category selection bias** — Qwen tends to pick `workflow_reminders` even when `anti_patterns` is semantically correct. Fixable via better starter examples in `behavioral_patterns.md` OR via fine-tune in Roadmap 18.
- **`store_memory` rate limit verification** — during 17C Test 4, second call within ~60s window succeeded; unclear if rate limit silently failed open or window was just over 60s. Read `src/main/store-memory.ts` to verify timestamp comparison.

---

## MCP-as-a-Service (концепт, Phase 2)

iamrunning.ai как MCP Provider на VPS (Hetzner GEX44, RTX 4000 Ada, 20GB VRAM, ~$200/мес). Qwen2.5-Coder:14b, одна модель на всех клиентов (последовательно). 5-10 клиентов IAM Client OS подключаются как MCP Clients через tunnel. Pay-per-use: included tier + metered overage. Success criteria = 100+ tool calls/day per engaged client.

После Roadmap 17 close — инфраструктурные foundations (`store_memory` + shadow hints + bilingual + manifest) генерализуются на multi-tenant memory в shared model.

Полная спека: `MCP_AS_A_SERVICE_SPEC.md` в этой же папке.

Расчёт срока: после 4-5 продающих клиентов IAM Client OS, не раньше.

---

## RAG / Fine-tune стратегия

- **RAG = manual** — что есть в проекте. Документы в `rag/` индексируются bge-m3, top-K по релевантности на каждый запрос.
- **Memory = how to work** — поведенческие правила в `rag/memory/`, инжектятся как shadow hints при tool calls.
- **Fine-tune = experience** — chain-of-thought training pairs обучают модель ДУМАТЬ как разработчик iamrunning. Roadmap 18.

EVOLUTION файлы в этой папке — готовый dataset для fine-tune. Каждый блок = training pair: problem → root_cause → actions → files_changed → result → insight.

**ПРАВИЛО: ВСЕ RAG чанки, memory docs, training data — ТОЛЬКО НА АНГЛИЙСКОМ.** Русский только для разговора между Ariel и AI. Bilingual support в RAG относится ТОЛЬКО к 4 публичным `RAG_*.md` документам — у них есть `ru/` параллельные переводы. Memory и shadow hints — всегда EN.

---

## Структура iamrunning.ai проекта (на iamrunner.ai MCP connector)

```
iamrunning.ai/
├── HANDOFF.md              ← Entry point для Claude (на iamrunner.ai connector)
├── CURSOR_HANDOFF.md       ← Entry point для Cursor без Claude
├── docs/                   ← 14 спек
│   └── architecture/       ← Карта системы (7 файлов)
│       ├── README.md       ← Индекс
│       ├── AI_SYSTEM.md    ← AI Chat, провайдеры, tool loop, schema injection (17D)
│       ├── RAG_SYSTEM.md   ← Indexer, vector store, persistence, bge-m3
│       ├── MCP_SERVER.md   ← 9 tools, OAuth, tunnel
│       ├── MAIN_PROCESS.md ← IPC handlers, lifecycle, store-memory module (17C)
│       ├── RENDERER.md     ← screens, stores, components
│       └── DATA_FLOW.md    ← Все потоки данных, shadow hints integration
├── docs/PERSISTENT_MEMORY_GUIDE.md  ← Новое в 17C
├── docs/RAG_HOW_TO_ADD.md           ← Новое в 17B
├── rag/                    ← RAG документы для Ollama
│   ├── RAG_KNOWLEDGE.md, RAG_PLATFORM.md, RAG_RULES.md, RAG_STRATEGY.md  (EN)
│   ├── ru/                  параллельные RU переводы
│   ├── memory/              persistent memory (4 категории, EN only)
│   ├── _templates/          5 skeleton templates
│   └── .rag-manifest.json   registry
├── roadmaps/               ← Закрытые roadmaps (для архивы и шаблонов)
├── progress/               ← Логи сессий
├── workspace/              ← Локальная копия SHARED_CONTEXT (синхронизируется по необходимости)
└── src/                    ← Код (Electron + React)
    ├── main/
    │   ├── ai-provider.ts          ollamaChat + claudeChat, schema injection, fallback (17D), shadow hints integration (17C)
    │   ├── ai-ipc.ts               IPC handlers, LOCAL_AI_TOOL_SCHEMAS, executeLocalAiTool
    │   ├── shadow-hints.ts         NEW (17C) — getShadowHints, appendHints
    │   ├── store-memory.ts         NEW (17C) — executeStoreMemoryTool, rate limit
    │   ├── local-mcp-server.ts     9 MCP tools, OAuth, tunnel
    │   └── rag/
    │       ├── indexer.ts, vector-store.ts, embeddings.ts (bge-m3), index-scheduler.ts, rag-manifest.ts (NEW 17B)
    └── renderer/
        ├── screens/AiChat.tsx      tool-instability banner (17D)
        └── stores/ai.ts            isGenerating cleanup on instability (17D)
```

---

## Правила работы

- Русский для общения между Ariel и AI, английский для кода и commit messages
- Cursor Composer 2 thinking для critical phases (tool calling, RAG core); Auto/Sonnet 4 для правок без последствий
- Одна задача / sub-phase на промпт
- Local-First: Files/Editor/Terminal/AI ВСЕГДА локально, Team Mode добавляет workflow features сверху
- Ollama: короткий system prompt + контекст в user message + recency-anchored language reminder в конце user msg (dual-location pattern из 17A.9)
- Никогда chain `patch_file` на файлах >500 строк → `write_file`
- `git_snapshot` перед deploy / большими изменениями
- Manifest-first для RAG: новый документ → копия в `rag/` → запись в manifest → reindex
- Memory всегда EN, конversational reply на языке user'а

---

## Документация на iamrunning connector (этот файл и братья)

Все файлы в `context-core/ariels-workflow/iamrunning-ai/`:

| Файл | Что внутри |
|------|-----------|
| `README.md` | Current status одной страницей |
| `HANDOFF.md` | **Этот файл — entry point** |
| `EVOLUTION_CONTINUED_19_04_2026.md` | Recap Phase 17A close (большой день) |
| `EVOLUTION_CONTINUED_20_04_2026.md` | Утренний sync, подготовка к 17D |
| `EVOLUTION_CONTINUED_21_04_2026.md` | **Самый свежий** — Roadmap 17 close (17D + 17C + Roadmap 18 handoff) |
| `ROADMAP_17_EXTENDED.md` | Закрытая, но полезный template для будущих roadmap |
| `MCP_AS_A_SERVICE_SPEC.md` | Phase 2 концепт |
| `TOOL_DISTRIBUTION_SPEC.md` | Cross-product spec для IAM Client OS |
| `SESSION_HANDOFF_19_04_2026.md` | DEPRECATED, kept for archaeology |

---

*Authors: Ariel + Claude Opus 4.7 (21.04.2026 evening)*
*lego-base connector decommissioned — все iamrunning.ai docs живут на iamrunning connector*
