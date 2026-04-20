# I AM RUNNING — Платформа

*Обновлён: 20.04.2026 | Читать первым в любой сессии*

---

## ⚠️ Главное — читай первым

**I AM RUNNING** — это платформа, не один продукт. Всё что здесь разрабатывается — части одной платформы под одним брендом, продаётся с одного сайта: **iamrunning.online**.

---

## Три продукта одной платформы

```
I AM RUNNING
├── iamrunning.online       — веб-платформа (этот сервер, 94.176.238.108)
│                             — Website Builder SaaS
│                             — платформенный control plane
│                             — (скоро) дом для IAM Client OS source
│
├── IAM Client OS           — Team AI Workspace для клиента
│                             — ставится на VPS клиента через iam-client.sh
│                             — разрабатывается на lego-base (185.5.55.111)
│                             — мигрирует сюда до ~23.04.2026
│
└── iamrunning.ai           — Electron desktop клиент
                              — локальный Ollama + встроенный MCP server
                              — repo: ArielGrook/iamrunning.ai
```

Эти три продукта связаны единым протоколом (MCP) и общим брендом. Не три бизнеса — три продукта одного бизнеса.

---

## Что входит в каждый продукт

### 1. Website Builder (на iamrunning.online)

Создание сайта с AI за минуты.
- **Door A** — interactive wizard 7 шагов (для не-технарей)
- **Door B** — Craft.js visual editor (полный контроль, freelancers)
- Сайт клиента деплоится на subdomain `*.iamrunning.online` (SSR, wildcard SSL)

### 2. IAM Client OS (Team AI Workspace)

Операционная система для команды с AI как основным интерфейсом.
- Ставится на VPS клиента через `iam-client.sh` (769 строк, 12 шагов, тестировано end-to-end)
- 6 мега-tools (files, tasks, communication, goals, code_review, devops) с capability gates
- MCP Tool Injection V2: smartOk поведенческие подсказки, session_handoff, preset injection
- Роли: Super Admin (TOTP) → Admin (токен) → Worker (токен), Operator (SSH-only, невидимый)
- Activity Log V2, Messaging V2, Goals, Dev Console, Product Tour
- **Статус:** production-ready для первого платящего клиента. FROZEN до реального бага.
- Скелетон-репо: `ArielGrook/iam-client-skeleton` (чистая база для клиентских установок)

### 3. iamrunning.ai (Desktop)

Electron приложение. Локальный AI (Ollama + bge-m3 + Qwen2.5-Coder) + встроенный MCP server + workspace клиент.
- Solo + Team режимы, Cloudflare named tunnel, OAuth 2.1 + PKCE
- RAG unified pipeline (Phase 17A+17B done) — manifest-driven, bilingual EN+RU
- Следующие фазы: 17D (Ollama tool-calling polish), 17C (persistent memory)
- **Статус:** активная разработка, дальний план Roadmaps 18-23 (fine-tune, Master Mode, Payment, License, LAN)

---

## Воронка продаж

```
Клиент → Website Builder (или отдельный лендинг)
    ↓ нужна команда с AI
Team Workspace — IAM Client OS (beta $300-500 setup)
    ↓ нужна локальная мощь и приватность
Desktop — iamrunning.ai
    ↓ накопил датасет
Fine-tune модели (LoRA) — Roadmap 18 iamrunning.ai
```

---

## Инфраструктура

| Что | Где | Статус |
|-----|-----|--------|
| Веб-платформа (этот сервер) | `94.176.238.108` → `/var/www/i_am_running` | ACTIVE |
| IAM Client OS dev сервер | `185.5.55.111` → `/var/www/iam-os` (lego-base) | SUNSET ~23.04 |
| IAM Client OS test install | `iam-test.lego-base.online` (port 4742) | ACTIVE, будет переехать |
| Desktop tunnel (iamrunning.ai) | `iamrunner-ai.iamrunning.online` | ACTIVE |

**GitHub:**
- `ArielGrook/I_AM_RUNNING_-` — website builder (этот сервер)
- `ArielGrook/iam-client-os` — dev-репо IAM Client OS
- `ArielGrook/iam-client-skeleton` — чистый скелетон для клиентских установок
- `ArielGrook/iamrunning.ai` — desktop client

---

## Активная миграция (20.04 → ~23.04.2026)

Подписка Time4VPS на lego-base истекает, продлевать не будем. Вся разработка IAM Client OS переезжает внутрь iamrunning.online репозитория как папка `iam-clients-os/`:

```
/var/www/i_am_running/
├── app/, lib/, components/, context-core/
└── iam-clients-os/                 ← NEW
    ├── source/                     ← git clone ArielGrook/iam-client-os (в .gitignore)
    ├── workspace/                  ← memory, specs, handoffs
    └── skeleton-sync/              ← scripts для sync dev → skeleton
```

В Admin панели iamrunning.online добавляется страница `/[locale]/admin/iam-clients-os/` с 4 подтабами: Settings, Client Projects, Web Installer, Dev Workspace.

Полный план миграции: **`context-core/ariels-workflow/PLATFORM_REFACTORING.md`** (7 шагов, live статус-таблица).

---

## Как работать с этим сервером

**Первым в новом чате:**

```
read_file("context-core/PROGRESS.md")                               ← текущее состояние
read_file("context-core/PLATFORM.md")                               ← этот файл
read_file("context-core/ariels-workflow/PLATFORM_REFACTORING.md")   ← план миграции
read_file("context-core/ariels-workflow/bootstrap-prompts/SUCCESS_CHAT_PATTERNS.md")
                                                                    ← как писать промпты
```

Для любой бизнес-контекстной задачи — `context-core/ariels-workflow/current-state/SHARED_CONTEXT.md` (глобальный роутер между AI агентами платформы).

**Коннектор:** `iamrunning` (MCP)
**Deploy:** через MCP `deploy` tool или `git_snapshot` + pm2 restart
**⚠️ Продакшн с реальными клиентами на website builder**

---

## Правила

- Русский для общения с Ariel, английский для кода и документации (RAG/datasets — только английский)
- `git_snapshot` перед каждым `write_file` / `patch_file` — для возможности rollback
- `rm -rf .next` перед rebuild (Next.js капризничает с кэшем)
- Одна задача на промпт — не пытаться закрыть 5 тикетов в одном сообщении
- Никаких вариантов A/B/C в ответах — прямое действие
- Перед первой сессией — прочесть `SUCCESS_CHAT_PATTERNS.md` (в bootstrap-prompts/)

---

*Этот файл — первое что должна прочитать любая нейронка подключившаяся к этому серверу.*
*Обновлять при смене стратегии или структуры платформы.*
*Authored: Claude Opus 4.7 (web MCP) 20.04.2026. Replaces v1 from 08.04.2026.*
