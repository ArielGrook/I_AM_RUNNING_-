# HANDOFF — iamrunning.ai (копия для lego-base)
### 19.04.2026
### Source of truth: iamrunner.ai MCP → HANDOFF.md

---

## Quick Start (для нового Claude чата по iamrunning.ai)

Подключись к iamrunner.ai MCP коннектору. Прочитай в этом порядке:

1. `HANDOFF.md` — этот файл (entry point)
2. `docs/architecture/README.md` — карта системы (7 файлов)
3. `workspace/SHARED_CONTEXT.md` — общий контекст платформы
4. `roadmaps/ROADMAP_17_RAG_PIPELINE_UNIFICATION.md` — следующая задача
5. `CURSOR_HANDOFF.md` — если нужно писать roadmap для Cursor

---

## Что это

**iamrunning.ai** (ex iamrunner.ai) — десктопный Electron клиент с локальным AI (Ollama).

```
I AM RUNNING
├── IAM Client OS       — Team AI Workspace на VPS (готов к продаже)
├── iamrunning.online   — Лендинг + License API
└── iamrunning.ai       — Desktop Client (этот проект)
```

**Стек:** Electron 33, React 18, Tailwind, Zustand, CodeMirror 6, xterm.js, node-pty, Ollama (Qwen2.5-Coder:7b), nomic-embed-text, Vectra, MCP SDK, Cloudflare Tunnel

---

## Статус (19.04.2026)

### Работает ✅
- Solo + Team Mode, Local-First архитектура
- Ollama AI Chat + Claude API (streaming + tool calling, max 10 iterations)
- RAG: 875 чанков, persistence при kill (flushIndexedState writeFileSync)
- Knowledge Base UI (drag-drop)
- MCP server (8 tools), OAuth 2.1 + PKCE, Cloudflare named tunnel
- Terminal (node-pty), CodeMirror editor, smart commits
- Splash screen, PowerSaveBlocker (prevent-display-sleep)
- Индексация только по кнопке (auto-index убран в Roadmap 16)

### Закрытые roadmaps: 10A-10D, 11, 12, 13, 14, 15, 16 + hotfixes

### Roadmap 17 — RAG Pipeline Unification (NEXT)
- Переключить индексатор на `rag/` папку only (сейчас ходит по всему проекту)
- KB файлы → `{project}/rag/` вместо %APPDATA%
- Один путь: файлы в rag/ → indexer → vectra → AI Chat
- Спека: `roadmaps/ROADMAP_17_RAG_PIPELINE_UNIFICATION.md`

### Задачи после Roadmap 17
1. Master Mode UI (LAN/Tunnel для команд)
2. Payment (PayPal Subscriptions API — IBAN для Stripe нет)
3. License Server на iamrunning.online
4. LAN Mode + mDNS
5. MCP-as-a-Service (Phase 2 после 4-5 клиентов)

---

## Ключевые концепции

### MCP-as-a-Service (концепт 16.04)
iamrunning.ai как MCP Provider на VPS (Hetzner GEX44, RTX 4000 Ada, 20GB VRAM, $200/мес).
Qwen2.5-Coder:14b, одна модель на всех клиентов (последовательно).
5-10 клиентов IAM Client OS подключаются как MCP Clients.
Pay-per-use: included tier + metered overage.
Success = 100+ tool calls/day per engaged client.

### RAG Strategy
Индексируем ТОЛЬКО `rag/` папку. Claude создаёт доки → rag/ → Ollama индексирует.
Fine-tune позже (3-6 мес, 500+ Chain-of-Thought пар, LoRA на Qwen2.5-Coder:14b).

---

## Структура проекта

```
iamrunning.ai/
├── HANDOFF.md              ← Entry point для Claude
├── CURSOR_HANDOFF.md       ← Entry point для Cursor без Claude
├── docs/                   ← 14 спек
│   └── architecture/       ← Карта системы (7 файлов)
│       ├── README.md       ← Индекс
│       ├── AI_SYSTEM.md    ← AI Chat, провайдеры, tool loop
│       ├── RAG_SYSTEM.md   ← Indexer, vector store, persistence
│       ├── MCP_SERVER.md   ← 8 tools, OAuth, tunnel
│       ├── MAIN_PROCESS.md ← IPC handlers, lifecycle
│       ├── RENDERER.md     ← 12 screens, 7 stores, 10 components
│       └── DATA_FLOW.md    ← Все потоки данных
├── rag/                    ← RAG документы для Ollama
├── roadmaps/               ← Задачи для Cursor
├── progress/               ← Логи сессий
├── workspace/              ← Shared context
└── src/                    ← Код (Electron + React)
```

---

## Правила
- Русский для общения, английский для кода
- Cursor Agent mode для кода, одна задача на промпт
- Local-First: Files/Editor/Terminal/AI ВСЕГДА локально
- Ollama: короткий system prompt, контекст в user message
- Никогда chain patch_file на файлах >500 строк → write_file
- git_snapshot перед крупными изменениями

---

*Копия хранится на lego-base для кросс-проектного контекста.*
*Source of truth: iamrunner.ai MCP → HANDOFF.md*