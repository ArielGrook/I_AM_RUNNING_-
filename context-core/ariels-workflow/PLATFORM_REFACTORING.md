# PLATFORM REFACTORING — lego-base → iamrunning.online

*Создан: 20.04.2026 | Автор: Ariel + Claude Opus 4.7 (web MCP)*
*Статус: IN PROGRESS — Step 0 COMPLETE*
*Дедлайн: 2 рабочих дня (max 3) — Time4VPS lego-base billing истекает 27.05.2026, но финансовый дедлайн Ariel'а = ~22-23.04.2026*

---

## ⚠️ ЧИТАЙ ПЕРВЫМ В ЛЮБОЙ НОВОЙ СЕССИИ

Если ты новый Claude чат и только подключился — **это документ-якорь**. Он описывает что мы сейчас делаем, зачем, и в какой точке пути находимся. Прочитай целиком прежде чем что-либо делать.

Когда выполняешь шаг — обновляй секцию "Текущий статус" внизу файла. Следующая сессия должна понимать где остановились.

---

## 1. Контекст — зачем мы это делаем

Платформа I AM RUNNING разрабатывается на **двух серверах** уже 2 месяца:

- **iamrunning.online** (VPS 94.176.238.108, Time4VPS) — website builder SaaS, production сайт платформы, Supabase, MCP, Dev Console
- **lego-base.online** (VPS 185.5.55.111, Time4VPS) — iam-client-os (Team AI Workspace), тестовый сервер, где идёт активная разработка продукта для клиентских инсталляций

**Проблема:** Time4VPS подписка на lego-base истекает ~27.05.2026, Ariel не планирует её продлевать. Реальный рабочий дедлайн — через 2-3 дня (финансовые ограничения). Вся документация iam-client-os (workspace, memory, ariel-workflow, IDEAS, docs/architecture, source-of-truth) живёт ТОЛЬКО на lego-base. Потерять её нельзя.

**Дополнительная проблема:** два параллельных dev environment + два MCP connector'а = разрозненный source of truth. Новые AI чаты подключаются к одному из них и не видят полной картины. Это контрпродуктивно.

**Решение:** Вся разработка I AM RUNNING консолидируется на одном сервере — iamrunning.online. iam-client-os становится **частью** iamrunning.online (не отдельным бизнесом). Вся документация, исходники, workflow переезжают сюда. lego-base удаляется.

---

## 2. Ключевые архитектурные решения

### 2.1. IAM Client OS позиционируется как "AI бизнес OS на ваш сервер"

НЕ multi-tenant. НЕ hosting на нашем сервере. Каждый клиент получает:
- **Если у клиента есть свой VPS + домен:** ставим на его инфраструктуру через `install.sh`
- **Если у клиента нет:** мы покупаем ему дешёвый VPS ($30-50/мес) и домен, ставим туда, клиент платит нам за обслуживание
- iamrunning.online в этой модели = **routing layer / control plane**, через который идёт управление клиентскими инсталляциями

### 2.2. Subdomain `*.iamrunning.online` — для iamrunning.ai desktop клиентов, НЕ для IAM Client OS

Desktop клиенты (iamrunning.ai Electron) получают бесплатный subdomain под их лицензию для Cloudflare tunnel. IAM Client OS клиенты работают на своих доменах.

### 2.3. Код IAM Client OS живёт ВНУТРИ iamrunning.online репозитория

Структура после миграции:
```
/var/www/i_am_running/                      (iamrunning.online root)
├── app/, lib/, components/, context-core/, product-template/, ...
│
└── iam-clients-os/                         ← NEW продукт как папка
    ├── source/                             ← git clone ArielGrook/iam-client-os (в .gitignore)
    ├── workspace/                          ← memory, ariel-workflow, IDEAS, etc.
    └── skeleton-sync/                      ← скрипты переделанные
```

Папка `context-core/ariels-workflow/` (где ты сейчас читаешь) — **главный хаб документации Ariel'а для всей платформы**, не только iam-clients-os. Сюда переезжают рабочие доки из lego-base.

### 2.4. GitHub workflow сохраняется

- `ArielGrook/iam-client-os` — репо продукта, из него клиентские VPS клонируются, остаётся как есть
- `ArielGrook/iam-client-skeleton` — skeleton для чистой клиентской установки, остаётся
- `ArielGrook/I_AM_RUNNING_-` — репо iamrunning.online, его НЕ замусориваем клонированным iam-client-os (`.gitignore` на `iam-clients-os/source/`)
- Каждый клиент = свой fork из skeleton в `ArielGrook/` GitHub, его собственный репозиторий. Клиентские PR-workflow идут через их собственный репо, не через `iam-client-os`

### 2.5. Web Installer = config generator, НЕ deploy pipeline

Задача Web Installer:
1. Форма в админке iamrunning.online — заполняешь поля (domain, client name, github repo, и т.д.)
2. На выходе — пре-настроенный `install.sh` с уже вписанными переменными
3. Ты (или клиент) берёшь этот скрипт, запускаешь на целевом VPS, он всё ставит

НЕТ live-прогресса через web. НЕТ автоматического деплоя с нашей стороны. Просто удобный генератор конфига.

### 2.6. MCP Connectors

- `iamrunning` connector — основной, остаётся
- `lego-base` connector — работает до конца миграции, потом удаляется (после Step 5)
- Если нужен изолированный тест iam-client-os — создадим subdomain `iam-clients-os.iamrunning.online` и поднимем отдельный MCP connector (заменяет `iam-test.lego-base.online`)

### 2.7. Admin panel — новая страница, не таб

Текущая структура `/[locale]/admin/`:
- Header: `[SEO] [Dev Console] [Logout]` — отдельные страницы
- Tabs внутри admin page: `👥 Users` | `📁 Projects`

После миграции в header добавляется: `[SEO] [Dev Console] [IAM Clients OS] [Logout]`. Страница `/[locale]/admin/iam-clients-os/page.tsx` с собственными подтабами:
- **Settings** — конфиг продукта
- **Client Projects** — CRUD клиентских инсталляций
- **Web Installer** — config generator
- **Dev Workspace** — file browser для `iam-clients-os/workspace/`

### 2.8. Frontend перед backend

Admin страница делается ДО переноса исходного кода iam-client-os. Почему: все 4 подтаба работают автономно (JSON/Supabase для данных, config generator автономен, Dev Workspace — file browser на уже перенесённый `workspace/`). Когда source code приедет — UI его просто подхватит.

---

## 3. Последовательность шагов

### ✅ Step 0 — Этот документ
Создание `context-core/ariels-workflow/` + `PLATFORM_REFACTORING.md` (якорь для всей миграции).

### ⏳ Step 1 — Большой шаг документации (4-5h)
Единый связанный блок: перенос документов + актуализация iamrunning.online docs.

1. **Аудит структуры iam-client-os на lego-base** (~30 min) — понять что за продукт, основные папки, mega-tools, lib/data, memory структура
2. **Перенос всех docs/workspace с lego-base** в `context-core/ariels-workflow/` (~2h):
   - `memory/*` (ARCHITECTURE, CURRENT_GOAL, NEXT_ACTIONS, WEEKLY_PROGRESS, SYSTEM_IDENTITY, TEAM_ROLES, RULES, CURSOR_PROMPTS)
   - `ariel-workflow/*` (current-goal, next-actions, roadmap, handoffs/, roadmaps/, specifications/, iamrunning.ai/, session-state.yaml и др.)
   - `IDEAS/*` (main_workflow, specs, handoffs, audits, concepts, docs)
   - `workspace/SHARED_CONTEXT.md` — главный router документ платформы
   - `docs/architecture/*` — карта системы (8 документов)
   - `source-of-truth/*` — WORKER_MECHANICS.md
3. **Актуализация `context-core/` на iamrunning.online** (~1-2h):
   - `PROGRESS.md` — v8 (был v6 от 27.03, сейчас ничего не знает про mega-tools, TOTP first-run, Stage 3 install, Phase 17A+17B iamrunning.ai)
   - `MAIN.md` — обновить tech stack, server layout, directory structure (убрать упоминания lego-base как отдельного сервера)
   - `PLATFORM.md` — обновить статус продуктов (iam-client-os production-ready, iamrunning.ai Phase 17A+17B done)
   - `PROJECT_STRUCTURE.md` — заполнить `[EMPTY - to be filled]` записи для реально существующих файлов
4. **Legacy cleanup** (~30 min):
   - `context-core/legacy/` уже существует — докинуть туда устаревшие документы (старый `product-template/INSTALL.md` Option A v3.0 и т.д., если они больше не актуальны)
   - Пометить `product-template/` как legacy (если Option A multi-tenant точно отмирает)

**Выход Step 1:** iamrunning.online = единственный source of truth, вся документация Ariel'а живёт в `context-core/ariels-workflow/`.

### ⏳ Step 2 — Подготовить место для iam-client-os (1h)

1. Создать `iam-clients-os/` в корне i_am_running
2. Подпапки: `source/` (пустая), `workspace/` (перенесённые доки), `skeleton-sync/` (переделанные скрипты)
3. Добавить в корневой `.gitignore`: `iam-clients-os/source/`
4. `git_snapshot` структуры

**Выход Step 2:** папка готова принять код iam-client-os в Step 4.

### ⏳ Step 3 — Admin page frontend (4-6h)

1. Новый route `app/[locale]/admin/iam-clients-os/page.tsx`
2. Header iamrunning.online admin получает ссылку `IAM Clients OS`
3. 4 подтаба внутри страницы:
   - **Settings** — форма конфига продукта (версия, defaults)
   - **Client Projects** — таблица клиентских инсталляций (CRUD через admin API + JSON файл или Supabase table)
   - **Web Installer** — форма генерации пре-настроенного install.sh (на выходе — скачиваемый .sh или bash-команда)
   - **Dev Workspace** — file browser для `iam-clients-os/workspace/` (можно переиспользовать Dev Console компоненты)
4. API routes:
   - `GET/POST /api/admin/iam-clients-os/clients` — CRUD клиентов
   - `POST /api/admin/iam-clients-os/generate-installer` — генерация install.sh из формы
   - `GET /api/admin/iam-clients-os/workspace/*` — чтение workspace файлов (может использовать существующий `/api/dev-agent/files/*`)

**Выход Step 3:** UI работает end-to-end на перенесённых в Step 1 данных.

### ⏳ Step 4 — Перенос source code (1-2h)

1. `git clone git@github.com:ArielGrook/iam-client-os.git iam-clients-os/source` (на сервере через MCP run_command)
2. Проверить MCP connector iamrunning видит файлы в `iam-clients-os/source/`
3. Проверить Dev Console iamrunning умеет редактировать (может потребоваться расширить allowed paths)
4. Актуализировать `skeleton-sync/` под новые пути
5. `git_snapshot`

**Выход Step 4:** полный iam-client-os исходник внутри iamrunning.online, редактируемый через Dev Console.

### ⏳ Step 5 — Валидация (1-2h)

1. End-to-end checks:
   - MCP connector iamrunning видит `iam-clients-os/source/`, `iam-clients-os/workspace/`, `context-core/ariels-workflow/`
   - Dev Console открывает/редактирует файлы в этих папках
   - Web Installer генерит валидный install.sh (`bash -n` smoke-test)
   - Client Projects CRUD работает
   - Admin page `/iam-clients-os/` рендерится, все 4 подтаба интерактивны
2. Если subdomain `iam-clients-os.iamrunning.online` нужен для изолированного теста — поднять nginx + SSL + PM2 (опционально, не блокер миграции)

### ⏳ Step 6 — Decommission lego-base (1h)

1. Полный git clone lego-base на локалку Ariel'а (backup)
2. `git push` последних коммитов из lego-base в ArielGrook/iam-client-os (если что-то незапушено)
3. Удалить lego-base MCP connector из Claude settings
4. Отменить Time4VPS подписку 185.5.55.111
5. Обновить `SHARED_CONTEXT.md` (теперь он на iamrunning.online, lego-base больше не упоминается как активный сервер)
6. Commit финальный + git_push + deploy

**Выход Step 6:** lego-base мёртв, всё работает на iamrunning.online, подписка отменена.

---

## 4. Чего НЕ делаем (важные границы)

- **НЕ сливаем iam-client-os с Option A multi-tenant.** Option A (`product-template/install-client.sh`) — legacy, клиентов на iamrunning.online сервер НЕ ставим
- **НЕ ломаем website builder** (app/editor, app/sites, Craft.js) — это отдельный продукт платформы, работает как есть
- **НЕ трогаем iamrunning.ai** (Electron desktop) — Phase 17A+17B закрыт, 17D/17C позже отдельно
- **НЕ создаём multi-tenant hosting инфраструктуру** — наш сервер = control plane + dev environment, не хостинг для клиентов
- **НЕ оставляем lego-base "на всякий случай"** — бюджет не позволяет, жёсткий deadline

---

## 5. Текущий статус

| Step | Статус | Дата | Заметки |
|------|--------|------|---------|
| 0 — Документация решений | ✅ DONE | 2026-04-20 | PLATFORM_REFACTORING.md создан |
| 1.1 — Аудит структуры iam-client-os | ✅ DONE | 2026-04-20 | прошлая сессия |
| 1.2 — Перенос docs с lego-base | ✅ DONE | 2026-04-20 | Ariel через GitHub, 13 папок, ~100 файлов в `ariels-workflow/` |
| 1.3 — Актуализация context-core/ iamrunning | ✅ DONE | 2026-04-20 | PROGRESS v9, MAIN v2, PLATFORM v2, SUCCESS_CHAT_PATTERNS.md, PROJECT_STRUCTURE помечен stale |
| 1.4 — Legacy cleanup | ⏳ READY | — | Следующий шаг: product-template/ → legacy/, пометить устаревшие INSTALL.md |
| 2 — Подготовить iam-clients-os/ | ⏳ PENDING | — | — |
| 3 — Admin page frontend | ⏳ PENDING | — | — |
| 4 — Перенос source code | ⏳ PENDING | — | — |
| 5 — Валидация | ⏳ PENDING | — | — |
| 6 — Decommission lego-base | ⏳ PENDING | — | — |

**Следующее действие:** Step 1.4 — legacy cleanup. Переместить `product-template/` в `context-core/legacy/`, пометить устаревшие INSTALL.md / Option A документы. После этого Step 2 — создание структуры `iam-clients-os/` с `.gitignore` на `source/`.

**Handoff инструкция для следующей сессии (если эта прервётся):**
1. Подключись к MCP connector: `iamrunning`
2. Прочитай этот файл целиком
3. Прочитай `context-core/ariels-workflow/bootstrap-prompts/SUCCESS_CHAT_PATTERNS.md` — чтобы понимать как должен быть построен хороший первый промпт (на случай если этот handoff тебе используют)
4. Посмотри в секцию "Текущий статус" — там указан Step на котором остановились
5. Читай детали этого Step выше и продолжай
6. После завершения шага — обнови таблицу статусов в этом файле

---

## 6. Резервная копия

Ariel делает полный `git clone` всех репозиториев lego-base на локалку перед Step 6. git snapshots на обоих серверах = дополнительная страховка. Даже если что-то пойдёт не так — ничего не потеряно.

---

*Последнее обновление: 2026-04-20 21:10 UTC+3 | Step 1.3 complete, awaiting Ariel's go-ahead for Step 1.4*
