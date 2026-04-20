# iamrunner.ai — Master Documentation
*Session recap: 07-08.04.2026 | Authors: Ariel + Claude*
*Это живой документ. Обновлять при каждом значительном изменении.*

---

## 1. ЧТО ЭТО И ЗАЧЕМ

### Проблема которую решает iamrunner.ai

Современные AI инструменты для разработки (Cursor, Claude, ChatGPT) — статичные. Они не знают твой проект. Каждый новый чат — ты снова объясняешь архитектуру, правила, паттерны. Это теряет время и создаёт ошибки.

Дополнительно: для команды из 5 человек Claude + ChatGPT подписки стоят $100+/мес. И всё равно AI не знает вашу кодовую базу.

### Решение

**iamrunner.ai** — десктоп приложение (Electron) которое превращает любую локальную папку проекта в AI-powered рабочее пространство с тремя ключевыми возможностями:

1. **Локальный MCP сервер** — Claude на claude.ai читает, пишет, ищет и коммитит файлы на твоей машине через Cloudflare tunnel. Без API ключей, только существующая Claude подписка.

2. **Командный workspace** — подключается к iam-client-os VPS для задач, PR, сообщений, целей.

3. **Локальная AI модель** — Ollama + Qwen2.5-Coder для оффлайн, бесплатного, безлимитного AI кодинга. Fine-tuned на паттернах проекта через QLoRA.

### Killer insight

Claude.ai уже поддерживает MCP коннекторы. Если поднять локальный MCP сервер и прокинуть через Cloudflare tunnel — Claude работает с файлами бесплатно. iamrunner.ai упаковывает это в one-click опыт.

---

## 2. МЕСТО В ЭКОСИСТЕМЕ I AM RUNNING

Три продукта, три отдельных сервера:

| Продукт | Домен | Что это | VPS |
|---------|-------|---------|-----|
| i-am-running | iamrunning.online | Website Builder SaaS | 94.176.238.108 |
| iam-client-os | test.lego-base.online | Team AI Workspace | 185.5.55.111 |
| **iamrunner.ai** | iamrunner-ai.iamrunning.online | **Десктоп AI клиент** | Локальный ПК |

**Связь между продуктами:**
- Клиент подписывается → получает iam-client-os на VPS
- Воркеры ставят iamrunner.ai на свои ПК
- iamrunner.ai подключается к iam-client-os для командных данных
- iamrunner.ai запускает локальный MCP для Claude + локальных файлов

---

## 3. АРХИТЕКТУРА

```
┌─────────────────────────────────────────────────────────┐
│                    ПК пользователя                       │
│                                                          │
│  ┌────────────────────────────────────────────────┐      │
│  │            iamrunner.ai (Electron)              │      │
│  │  React UI (10 экранов)                          │      │
│  │  MCP Client → VPS (задачи, PR, сообщения)       │      │
│  │  Local MCP Server :3847                         │      │
│  │  (8 tools, OAuth 2.1 PKCE, per-session)         │      │
│  └──────────────────────────┬───────────────────────┘     │
│                              │                            │
│  Cloudflare Named Tunnel     │                            │
│  iamrunner-ai.iamrunning.online → localhost:3847          │
│                                                          │
│  Ollama: Qwen2.5-Coder:7b + nomic-embed-text             │
│  localhost:11434                                         │
└──────────────┬──────────────────────────┬────────────────┘
               │                          │
               ▼                          ▼
    iam-client-os VPS              claude.ai / Cursor
    test.lego-base.online          MCP коннектор
```

### Local MCP Server (localhost:3847)

8 инструментов: `read_file`, `write_file`, `patch_file`, `delete_file`, `list_directory`, `search_files`, `git_snapshot`, `git_log`

Безопасность:
- `safePath()` блокирует path traversal
- Персистентный Bearer token (хранится в `mcp-token.txt` между перезапусками)
- OAuth 2.1 + PKCE для Claude.ai и Cursor
- Сервер слушает только `127.0.0.1`
- Per-session McpServer (один сервер = один transport)

### Cloudflare Named Tunnel

- Tunnel: `iamrunner` (ID: cd6bc6dd-7c48-4691-84d2-835e88cf9d54)
- Домен: `iamrunner-ai.iamrunning.online` (постоянный)
- DNS: **DNS Only** (без Cloudflare Proxy — иначе OAuth flow ломается!)

---

## 4. TECH STACK

| Слой | Технология |
|------|-----------|
| Desktop | Electron 33+ |
| UI | React 18, Tailwind CSS 3, Zustand 5 |
| Редактор | CodeMirror 6 (one-dark) |
| MCP клиент | @modelcontextprotocol/sdk |
| MCP сервер | @modelcontextprotocol/sdk + Node http |
| Tunnel | cloudflared |
| Хранение | Electron safeStorage |
| Local AI | Ollama + Qwen2.5-Coder:7b |
| Embeddings | nomic-embed-text (Ollama, CPU) |
| Вектор база (план) | Vectra (чистый JS) |
| Fine-tune (план) | Unsloth + QLoRA |

---

## 5. ЧТО РЕАЛИЗОВАНО (08.04.2026)

### ✅ Работает

- Electron App: 10 экранов, auto-login, dark/light/system темы
- Local MCP Server: 8 tools, OAuth 2.1 PKCE, per-session, HTML auth страница
- Cloudflare Named Tunnel: постоянный домен, Claude читает/пишет файлы
- Ollama: qwen2.5-coder:7b + nomic-embed-text установлены
- AI Chat: Claude API + Ollama Local, streaming, tool call визуализация
- Settings: Ollama статус баннер, выбор моделей, test connection
- Cursor: подключён через `.cursor/mcp.json`
- Документация: PLATFORM_MAP.md, ARIEL_WORKFLOW.md

### ❌ Известные проблемы

- Cursor MCP OAuth loop — "Needs authentication" после token exchange (Cursor bug, есть план фикса)
- Ollama chat нет доступа к файлам (tool calling отключён — Qwen 7B нестабилен с tools)
- Ollama не всегда учитывает историю сообщений

### ⬜ Построено но не протестировано

- Claude API chat
- Offline queue
- File caching

---

## 6. БОЛЬШИЕ ИДЕИ (стратегия)

### Self-Learning AI Workspace

**Главная идея:** Клиент замкнутого цикла — AI дообучается на твоих файлах прямо внутри интерфейса.

```
Работаешь → Drag & drop файлы → Датасет → Fine-tune → Модель знает проект → Работаешь быстрее → цикл
```

**Knowledge Base экран (запланирован):**
- Drag & drop зона (.md, .ts, .json, .pdf)
- Режимы: RAG / Dataset / Both
- Прогресс индексации, статистика датасета
- Кнопка Fine-tune при N+ примерах

**Почему это разрывает рынок:** Cursor, Claude Code — статичные. iamrunner.ai учится на твоей работе.

### Chain-of-Thought Fine-Tune

Обучаем не "что" делать, а "как думать как архитектор":

```json
{
  "instruction": "Как добавить новый MCP tool?",
  "thinking": "MCP tools добавляются в три места — иначе super_admin не получит доступ...",
  "output": "1. data-tools.ts 2. auth.ts → ALL_ADMIN_TOOLS 3. team.ts → ROLE_PRESETS"
}
```

**Источники для датасета (уже есть):**
- Наши сессии с Claude (~500+ chain-of-thought примеров)
- ARCHITECTURE.md + memory/ (~50 правил)
- Git история (~100+ коммитов)
- IDEAS/ документы (~200 решений)
- Реальные баги и фиксы (~30 паттернов)

**Итого: ~900 потенциальных примеров уже сейчас.**

### Решение проблемы персистентной памяти

Когда модель fine-tuned — архитектурные правила прошиты в веса. Не нужен длинный system prompt каждый раз.

### Mastermind + Executor

```
Ты + Claude (Mastermind) → думает, планирует
Cursor / Qwen local (Executor) → имплементирует
```

---

## 7. AI СТРАТЕГИЯ

### Три слоя AI

**Слой 1: Claude через MCP (РАБОТАЕТ)**
Бесплатно с существующей подпиской. Полная мощь Claude Opus/Sonnet.

**Слой 2: Ollama (УСТАНОВЛЕНА, в разработке)**
Qwen2.5-Coder:7b. Оффлайн, бесплатно, безлимитно.

Пресеты (автодетект GPU):
| Пресет | VRAM | Модель |
|--------|------|--------|
| COMPACT | 6-8GB | Qwen2.5-Coder 7B Q4 |
| STANDARD | 12-16GB | Qwen2.5-Coder 14B Q4 |
| FULL | 24GB+ | Qwen2.5-Coder 32B Q4 |
| CPU_ONLY | <6GB | Qwen2.5-Coder 3B Q4 |

**Слой 3: Fine-tuned модель (ПЛАН)**
QLoRA адаптер ~200MB. Зашифрован + привязан к подписке.

### RAG Pipeline (следующий шаг)

AST-aware chunking → nomic-embed-text embeddings → Vectra → top chunks в prompt.
Даёт 80% пользы fine-tune при 0% затрат.

---

## 8. БИЗНЕС МОДЕЛЬ

**Setup: $4,000-5,000** — VPS, установка, tunnel, первичный fine-tune, 3 мес поддержки

**Подписка: $200-500/мес** — обновления LoRA адаптера, приложения, поддержка. Адаптер привязан к подписке — кончилась = не грузится.

**За воркера: $50-100/мес**