# IAM Client OS — Installer Specification v1

**Status:** Draft (16.04.2026 evening, updated 17.04 with hardcoded-paths findings)
**Author:** Ariel + Claude Opus 4.7
**Scope:** Проектная спецификация установщика как отдельной сущности. Не реализация.
**Дальше:** на базе этой спеки — архитектура skeleton, затем имплементация.

**Связанные документы (написаны параллельно в других чатах):**
- `ariel-workflow/OPERATOR_WEBINSTALLER_SKELETON_SPEC.md` — более широкая спека, описывающая всю экосистему (Operator role + Web Installer + Skeleton repo + Tripwire). Эта спека = подмножество того документа (фокус на узком вопросе dev-vs-client separation и cleanup текущего кода).
- `ariel-workflow/OPERATOR_WEBINSTALLER_ROADMAP.md` — 10-stage roadmap реализации

**Используй эту спеку если нужно:** быстрый ответ на "как отделить dev от client install сегодня".
**Используй OPERATOR_WEBINSTALLER_SKELETON_SPEC.md если нужно:** полная картина куда мы движемся (operator endpoints, web installer UI, kill switch и т.д.).

---

## ⚠️ ГЛАВНОЕ — прочитай до любого кода

**IAM Client OS существует в ДВУХ формах одновременно:**

1. **Рабочая разработческая система** (`test.lego-base.online`, `/var/www/iam-os`) — это то, где мы живём, пилим, хранит наши dev-данные: `ariel-workflow/`, `IDEAS/`, персональные memory, реальных worker-ов (дядя, брат), логи разработки, wisdom, черновики. **Этот код НИКОГДА не попадает клиенту целиком.**

2. **Клиентская инсталляция** (`/var/www/iam.client` на VPS клиента) — это **чистая** версия, только код продукта + шаблоны memory + инструкции first-run setup. Никаких dev-данных. Никаких имён. Никаких черновиков.

**Эти две вещи ДОЛЖНЫ быть разделены на уровне git-репозиториев**, а не только cleanup-скриптом. Current state — они живут в одном репо, и cleanup в install.sh пытается отделить одно от другого удалением. Это костыль. Правильно — два отдельных git-репо + механизм синхронизации.

---

## 1. Продуктовое позиционирование

IAM Client OS должен уметь устанавливаться в ДВУХ конфигурациях:

### Режим A — Standalone
- Пустой VPS, система ставится как единственное приложение
- Занимает домен целиком или subdomain
- Сама ставит nginx, SSL, PM2, fail2ban
- Клиентов-standalone будет меньшинство

### Режим B — Integration (основной)
- У клиента уже есть инфраструктура: работающий сайт, PM2 процессы, nginx конфиги, Supabase, API ключи
- IAM Client OS **встраивается рядом**, не ломая ничего существующего
- Свой поддомен (`iam.clientdomain.com`) или путь
- Свой порт, свой PM2 процесс с префиксом `iam.`
- Свой nginx server block, отдельный файл, не трогающий существующие
- Свой установочный путь (`/var/www/iam.client`)
- Проверяет зависимости, не переустанавливает их если они есть
- В идеале: генерирует архитектурную документацию того, что у клиента УЖЕ есть, и интегрирует своё в этот контекст

**Флаги, различающие режимы:**

```
--no-landing           Не ставить лендинг (клиент использует свой, система сразу на /dashboard)
--skip-nginx           Не трогать nginx (клиент настроит сам)
--skip-security        Не ставить fail2ban/UFW (уже есть)
--path=/custom/path    Куда ставить
--port=4741            На каком порту слушать
```

Большинство клиентов будут использовать все четыре.

---

## 2. Архитектура репозиториев

### Проблема текущего состояния
`install.sh` (и `scripts/iam-client.sh`) клонирует репо `ArielGrook/iam-client-os`, который содержит ВСЁ — и продукт, и нашу разработку. Cleanup в step 4b удаляет лишнее, но это реактивный подход: если мы добавляем новую dev-папку, она попадёт клиенту пока кто-то не вспомнит добавить её в cleanup.

### Целевая архитектура (три репозитория)

**Repo 1: `ArielGrook/iam-client-os`** (приватный)
- Рабочий development repo
- Всё живёт здесь: код + dev-данные + наши memory + experiments + drafts
- test.lego-base.online живёт из этого репо
- **Никогда не попадает к клиенту**

**Repo 2: `ArielGrook/iam-client-skeleton`** (приватный, production-ready)
- Чистая версия: только код + шаблоны + install.sh
- Синхронизируется из Repo 1 скриптом `scripts/sync-skeleton.sh` (в dev repo)
- Содержит: `app/`, `lib/`, `scripts/`, `public/`, `bootstrap-prompts/`, `docs/architecture/` (опционально), `memory/` (только шаблоны), `install.sh`, `package.json` и т.д.
- **НЕ содержит:** `ariel-workflow/`, `IDEAS/`, `workspace/`, наши `memory/CURRENT_GOAL.md`, `memory/NEXT_ACTIONS.md`, `memory/WEEKLY_PROGRESS.md`, `memory/workers/`, `memory/wisdom/`, `memory/CURSOR_PROMPTS.md`, `memory/TEAM_ROLES.md` с нашими токенами, `data/` с нашими данными, `pull-pool/`, `logs/`, `tasks/`, `messages/`, `oauth-debug.log`, `test/`, `tests/`, `source-of-truth/`
- Это **базовый образ**, из которого делаются клиентские репо

**Repo 3 (N экземпляров): `ArielGrook/client-{name}-project-{name}-{N}`** (приватный)
- Создаётся при продаже каждого нового клиента
- Содержит копию `iam-client-skeleton` на момент создания
- install.sh клиента клонирует из **этого** репо
- Все клиентские commits (их правки через Dev Console → PR → merge) попадают в **этот** репо
- Мы пулим апдейты из `iam-client-skeleton` → `client-{name}-*` вручную или скриптом при необходимости обновлений

**Почему такая структура:**
1. Чистое разделение dev vs client
2. Клиент видит историю только своего репо, не нашей разработки
3. Мы можем бэкапить клиентский репо
4. Если клиент попросит доступ — даём только к его репо
5. Сетевая безопасность: токены клиентского репо не дают доступ к нашему dev

### Механизм синхронизации (`scripts/sync-skeleton.sh`)

Скрипт в dev repo, который:
1. Клонирует `iam-client-skeleton` локально (если нет)
2. Копирует из dev repo нужные директории (whitelist подход, не blacklist)
3. Перезаписывает `memory/` файлы чистыми шаблонами
4. Очищает `data/`
5. Коммитит в skeleton с сообщением `sync: from dev @ <commit-sha>`
6. Пушит в `ArielGrook/iam-client-skeleton`

**Whitelist (что копируется):**
- `app/` (весь код)
- `lib/` (весь код)
- `public/` (ассеты)
- `scripts/` — только production-ready: `iam-client.sh`, `iam-backup.sh`, `deploy-logged.sh`, `watchdog.sh`, `post-commit.sh`, `cleanup-pull-pool.js`, `wisdom-check.sh`
- `bootstrap-prompts/`
- `docs/architecture/` (если решим давать клиенту — ОТКРЫТЫЙ ВОПРОС)
- `skills/` (если есть)
- `extensions/`
- `source-of-truth/` (опционально — ОТКРЫТЫЙ ВОПРОС)
- `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.mjs`, `next-env.d.ts`, `.env.example`, `.gitignore`, `README.md` (клиентская версия)
- `install.sh` — тонкая обёртка, вызывающая `scripts/iam-client.sh`

**Blacklist (что никогда не копируется):**
- `ariel-workflow/`
- `IDEAS/`
- `workspace/`
- `memory/CURRENT_GOAL.md`, `memory/NEXT_ACTIONS.md`, `memory/WEEKLY_PROGRESS.md`, `memory/CURSOR_PROMPTS.md`, `memory/TEAM_ROLES.md`, `memory/workers/`, `memory/wisdom/`, `memory/ARCHITECTURE.md` (наш), `memory/SYSTEM_IDENTITY.md` (наш)
- `data/*` (все кроме `.gitkeep`-подобных)
- `tasks/`, `messages/`, `pull-pool/`, `logs/` (только структура, не содержимое)
- `.env`, `.env.local`, `.env.example` можно, `.env.*` c секретами нет
- `oauth-debug.log`, `.git/`, `.next/`, `node_modules/`
- `test/`, `tests/` — внутренние тесты, клиенту не нужны
- `app/api/admin/totp-test-flow/` — dev-only test endpoint

### Memory templates в skeleton

Skeleton включает `memory/` с шаблонами, НЕ с нашими данными:

- `memory/RULES.md` — тот же что сейчас (security, hardcoded)
- `memory/ARCHITECTURE.md` — шаблон с инструкциями first-run (как в `INSTALL_CLEANUP_ROADMAP.md` уже описан)
- `memory/SYSTEM_IDENTITY.md` — placeholders (`$CLIENT_NAME` и т.д. подставляются install.sh)
- `memory/CURRENT_GOAL.md` — шаблон "Set up workspace"
- `memory/NEXT_ACTIONS.md` — шаблон onboarding действий
- `memory/WEEKLY_PROGRESS.md` — пустой шаблон
- `memory/TEAM_ROLES.md` — `mode: solo, roles: []`

---

## 3. Установочный workflow

### Текущее состояние
```
ArielGrook/iam-client-os (монолит)
  ↓ git clone
install.sh на VPS клиента
  ↓ cleanup step 4b (удаляет dev-мусор)
Running client instance
```

### Целевой workflow

**Pre-onboarding (делает Ариэль):**
1. Приходит клиент → договариваемся
2. Создаём приватный репо: `ArielGrook/client-{slug}-project-{slug}-N`
3. Форкаем/клонируем содержимое `iam-client-skeleton` в новый репо
4. Генерируем GitHub Personal Access Token с доступом только к этому репо
5. Получаем SSH доступ к VPS клиента (или даёт root пароль на время установки)
6. Готовим DNS: поддомен `iam.{clientdomain.com}` → IP клиентского VPS

**Install:**
```bash
ssh root@client-server
curl -fsSL https://github.com/ArielGrook/client-{slug}/raw/main/install.sh -o iam-install.sh
# или: git clone + cd + bash
sudo bash scripts/iam-client.sh \
  --domain=iam.clientdomain.com \
  --name="Client Name" \
  --github=ArielGrook/client-{slug}-project-{slug}-N \
  --github-token=ghp_xxx \
  --port=4741 \
  --path=/var/www/iam.client \
  --no-landing \
  --skip-security   # если уже настроено
```

**Post-install (делает Ариэль):**
1. Проверяем URL `https://iam.clientdomain.com` → открывается TOTP first-run
2. Проверяем admin `/iam.admin` → доступен
3. Проверяем MCP endpoint — пробуем Claude коннектор
4. Передаём клиенту: URL + инструкция first-run (TOTP, создание команды, подключение Claude)

**First-time client experience:**
1. Открывает URL → TOTP setup wizard (`app/admin/totp-setup/page.tsx` или аналог)
2. Сканирует QR, сохраняет backup code
3. Входит в admin panel
4. Видит пустой workspace с TODO в `memory/CURRENT_GOAL.md`
5. Генерирует MCP token → подключает Claude
6. Claude читает memory, видит "fresh install", задаёт вопросы, помогает настроить

---

## 4. Что должно быть в install.sh (иерархия ответственностей)

Главный принцип: **install.sh НЕ занимается cleanup-ом**, потому что к моменту его запуска репо уже чистый (skeleton). Install.sh только:

1. **Check prerequisites** — Node 20+, RAM ≥1GB, disk ≥5GB, port свободен
2. **Install deps if missing** — nginx, certbot, pm2, fail2ban, ufw (с учётом флагов `--skip-*`)
3. **Clone client-specific repo** — из `--github=OWNER/REPO` с `--github-token=`
4. **Fill placeholders** — `$CLIENT_NAME`, `$DOMAIN`, `$INSTALL_PATH` в memory/ и ecosystem.config.js
5. **Generate secrets** — MCP_TOKEN, ADMIN_SESSION_SECRET, VAPID keys, OPERATOR_TOKEN, INSTANCE_ID
6. **Write .env.local** с секретами
7. **Install npm deps + build**
8. **Start PM2 with iam.{slug} name**
9. **Healthcheck** — curl на порт, ждать 200/307/308
10. **Setup nginx** (если не `--skip-nginx`) — server block для `iam.{domain}`, Let's Encrypt
11. **Setup crons** — heartbeat + activity push + daily backup
12. **Register instance** → POST на iamrunning.online/api/monitor/register
13. **Rollback on failure** — trap cleanup EXIT, удаление PM2/nginx/files

**Чего в install.sh быть НЕ ДОЛЖНО:**
- Удаление dev-мусора (если skeleton правильный — там мусора нет)
- Хардкод путей к нашим dev-данным
- Любые упоминания «Ariel», «ariel-workflow», «IDEAS», «test.lego-base.online»
- Зависимости от нашего dev-репозитория (только клиентский)

---

## 5. Что нужно в iamrunning.online (платформа)

### Endpoints для operator dashboard
- `POST /api/monitor/register` — регистрация нового инстанса при install
- `POST /api/monitor/heartbeat` — здоровье каждые 5 минут
- `POST /api/monitor/activity` — дельта activity.jsonl
- `GET  /api/operator/...` — прокси к клиентскому Operator API (для remote manage)

### UI
- Admin panel → таб "Clients" (или "Instances")
- Список всех установок, status, last heartbeat
- Per-client drill-down: logs, activity, push update, billing

**Это — ОТДЕЛЬНАЯ спека** (`IDEAS/concepts/OPERATOR_DASHBOARD_SPEC.md` уже существует). Сюда не тащим детали, только помечаем что install.sh зависит от этих endpoints (register, heartbeat, activity).

### GitHub API для создания клиентских репо
- Создание приватного репо через GitHub API при onboarding
- Копирование содержимого `iam-client-skeleton` в новый клиентский репо
- Генерация PAT с доступом только к этому репо
- Хранение credentials зашифрованно
- **Это тоже ОТДЕЛЬНАЯ спека** — не влезать сюда

---

## 6. Где скелет живёт и как обновляется

### Вариант A — отдельный репо + отдельный поддомен (рекомендовано)
- `ArielGrook/iam-client-skeleton` — хранилище чистого кода
- `skeleton.lego-base.online` — живая development-инсталляция скелета, где мы можем тестировать install.sh в реальных условиях
- Отдельный VPS или тот же VPS с другим портом (что проще)
- Обновляется скриптом sync из dev repo

### Вариант B — branch в монорепо
- `ArielGrook/iam-client-os` branch `skeleton` — чистая ветка
- Установщик клонирует `--branch skeleton`
- Проще, но меньше гибкости: любой случайный коммит в skeleton branch прилетает клиентам

**Выбор:** Вариант A, когда времени больше. Вариант B как MVP на первых 1–2 клиентов. **Открытый вопрос.**

---

## 7. Открытые вопросы

1. **`docs/architecture/` — давать клиенту или нет?**
   - За: помогает Claude работать эффективнее, описывает систему
   - Против: раскрывает наши внутренние решения, может устареть относительно нашего dev
   - Решение: скорее всего **давать, но помечать**, что это референс системы IAM, не клиентского кода

2. **`source-of-truth/` — давать клиенту?**
   - `WORKER_MECHANICS.md` содержит нашу философию — полезно для AI, читающего систему
   - Давать, вероятно

3. **`bootstrap-prompts/` — давать клиенту?**
   - Это прямые инструкции для Claude при подключении. Обязательно давать.

4. **Skeleton как branch vs отдельный repo — ?**

5. **Sync-скрипт — автоматический (на каждый push в main) или ручной?**
   - Ручной безопаснее
   - Автоматический проще, но рискованно, потому что в main может залететь что-то сырое

6. **Старый `install.sh` в корне — что с ним?**
   - Это legacy. Либо удалить, либо переделать в тонкую обёртку `sudo bash scripts/iam-client.sh "$@"`
   - В skeleton корневой `install.sh` = обёртка, это точно

7. **Старая папка `iam-client-os/` в корне проекта iamrunning.online — что с ней?**
   - Это забытый артефакт устаревшей установки
   - **Надо удалить** при следующем заходе на VPS 94.176.238.108
   - Пометить в задачах на уборку

8. **Где хранится клиентский GitHub PAT?**
   - В процессе install — передаётся через `--github-token`
   - После установки — нигде на VPS клиента, потому что git remote используется только для pull апдейтов (и там через deploy key можно, без PAT)
   - В `.env.local` хранить PAT — плохо, его видит PM2 и утечёт в логи

9. **Deploy key vs PAT для клонирования.**
   - PAT: проще, но широкий scope если неправильно настроить
   - Deploy key: безопаснее, но установка в 2 шага (показать public key → юзер добавляет в Repo Settings)
   - Текущий подход: PAT. Обсудить.

10. **Supabase — в скелет или нет?**
    - Тестовый флаг показывает что интеграция не готова
    - Если не готова — не включать в скелет, добавить после теста
    - Вопрос требует отдельной спеки на базу (что храним, миграции, как соединяться)

11. **⚠️ КРИТИЧНО: Хардкоды пути `/var/www/iam-os` и PM2-имени `iam-os` в коде.** Найдены 17.04 при уборке:
    - `app/api/push/route.ts:30` — fallback для PROJECT_ROOT
    - `app/api/dashboard/lib/dev-ai-handler.ts:311` — в AI system-промпте сказано "Project root: /var/www/iam-os/"
    - `app/api/mcp/route.ts:205` — инструкция пользователю "cd /var/www/iam-os && npm run build && pm2 restart iam-os"
    - `app/api/mcp/lib/tools/devops-mega.ts:77` — та же инструкция в devops мега-туле
    - `app/api/admin/lib/post-handlers.ts:129` — `execSync('pm2 restart iam-os ...')` в build handler
    - **Эффект для клиента:** deploy команды врут, PM2 restart не работает (есть fallback на `pm2 restart all` но это грязно)
    - **Решение:** заменить на `process.env.PROJECT_ROOT` и `process.env.IAM_PROCESS_NAME` (обе переменные уже существуют в `.env.local` клиента, проставляются install.sh)
    - **Приоритет:** высокий — это **phantom bug** (у нас работает, у клиента нет). Чинить до первой реальной установки.

---

## 8. План имплементации (NOT DONE YET — это черновик плана)

**Stage 0 — уборка путаницы (1 час):**
- Удалить корневой `install.sh` (оставить только `scripts/iam-client.sh`) или превратить в обёртку
- Обновить `README.md` — указать правильный скрипт
- Удалить `iam-client-os/` из корня iamrunning.online (вручную через SSH)
- Обновить memory/CURRENT_GOAL и NEXT_ACTIONS — писать "iam-client.sh" вместо "install.sh"

**Stage 1 — skeleton repo (2-3 часа):**
- Создать `ArielGrook/iam-client-skeleton` на GitHub
- Написать `scripts/sync-skeleton.sh` (в dev repo)
- Прогнать первый sync — проверить что в skeleton нет dev-мусора
- Установить skeleton на тестовом поддомене (`skeleton.lego-base.online` или локально)

**Stage 2 — первая боевая установка (2-3 часа):**
- Создать `ArielGrook/client-iamrunning-test-0`
- Залить skeleton в этот клиентский репо
- Создать A-запись `iam.iamrunning.online → 94.176.238.108`
- Установить через `iam-client.sh --domain=iam.iamrunning.online ...` на 94.176.238.108
- Проверить что существующий `i-am-running` работает как раньше
- Проверить что `iam.iamrunning.online` показывает чистый IAM Client OS
- Подключить Claude к этой установке через новый MCP endpoint — работать там как «клиент»

**Stage 3 — починка найденных багов (сколько понадобится):**
- File delete в Dev Console (bug #1)
- Build errors
- Cleanup дыры если обнаружатся
- UX issues

**Stage 4 — DEVELOPMENT_VS_CLIENT.md:**
- Публичный документ, который попадает в **оба** репо
- Объясняет следующему AI-чату (и будущему Ариэлю) почему здесь два репо, как их синхронизировать, что куда класть

---

## 9. Красные буквы — зарубка на будущее

> **ВНИМАНИЕ ВСЕМ AI АГЕНТАМ И БУДУЩЕМУ АРИЭЛЮ:**
>
> `test.lego-base.online` — это наша **разработческая** среда. Здесь живут наши dev-данные.
> Клиентская инсталляция — это **другая сущность**, в другом репо, по другому пути.
>
> **НИКОГДА НЕ ПУТАТЬ ЭТО.**
>
> Когда ты редактируешь файл в dev-среде, спроси себя: **«попадёт ли это к клиенту?»** Если да — редактируй с осторожностью. Если нет (это `ariel-workflow/`, `IDEAS/`, `memory/CURRENT_GOAL.md` и т.п.) — редактируй свободно, клиенты это не увидят.
>
> `install.sh` (то есть `scripts/iam-client.sh`) — это **отдельная сущность**. Он должен клонировать **чистый skeleton** или клиент-специфичный репо. Не наш monorepo с dev-данными.

---

## Метаданные

- Version: 1 (draft)
- Author: Ariel + Claude Opus 4.7
- Related: `ariel-workflow/INSTALL_CLEANUP_ROADMAP.md`, `IDEAS/concepts/INSTALL_ONBOARDING_SPEC.md`, `IDEAS/concepts/OPERATOR_DASHBOARD_SPEC.md`, `scripts/iam-client.sh`
- Next step: обсудить открытые вопросы с Ариэлем, затем приступить к Stage 0
