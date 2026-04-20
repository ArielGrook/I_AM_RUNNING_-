# Operator Role + Web Installer + Skeleton — Unified Spec

**Status:** Brainstorm draft (17.04.2026, mobile brainstorm session)
**Scope:** Как три концепта (Operator, Web Installer, Skeleton repo) сходятся в одну систему
**Next:** Roadmap на реализацию дома за ПК

---

## 1. Философия

### Три уровня доступа к клиентской инсталляции

```
Operator (Ariel, teневая роль)
  │  невидима для всех
  │  полный доступ: read/write/patch/delete/exec на сервере
  │  работает через API токен или SSH
  │
  └── Super Admin клиента (владелец бизнеса)
        │  UI admin panel
        │  не знает об operator
        │
        └── Admin / Workers (команда клиента)
              │  UI dashboard
              │  capability-gated
```

**Ключевое:** operator — это НЕ роль внутри IAM Client OS. Это **слой над системой**, существующий на уровне сервера. Клиент даже не знает что он есть.

### Три сущности, которые сходятся в одну

1. **Skeleton repo** (`ArielGrook/iam-client-skeleton`) — чистый код, откуда ставится система
2. **Web Installer** (UI на iamrunning.online) — форма + генератор install команды + live-прогресс
3. **Operator API** (`/api/operator/*` на клиентском сервере) — полный удалённый доступ после установки

**Всё сходится в одной точке — в Admin панели iamrunning.online.** Таб "Clients" (или "Instances"):

- Форма "Install new client" → выбрать skeleton версию + параметры → curl команда для клиента
- Live-прогресс установки
- После установки — карточка клиента с: env variables, logs, operator actions (restart/update/exec/read/patch/delete), datasets export, kill switch

---

## 2. Operator Role — что умеет

### Полный список возможностей

**File operations:**
- read file (любой, включая `.env.local`)
- write file (создать/перезаписать)
- patch file (частичная замена)
- delete file / directory
- list directory (видит всё, включая скрытое от клиента)
- chmod / chown

**System operations:**
- exec arbitrary command (bash)
- git pull / git log / git reset / git checkout
- npm install / npm run build
- pm2 restart / pm2 logs / pm2 delete / pm2 start
- nginx reload / nginx -t
- certbot renew
- systemctl (любой сервис)

**Monitoring:**
- uptime, disk, RAM, CPU
- read any log (activity.jsonl, deploy.jsonl, nginx error, pm2 logs, syslog)
- inspect processes
- inspect cron

**Data:**
- export activity.jsonl за период (для RAG training data)
- export messages, tasks, goals (для dataset generation)
- export full backup

**Maintenance:**
- update env variables (API keys, VAPID, etc.)
- rotate tokens (MCP, OPERATOR, ADMIN_SESSION)
- enable/disable features
- push new version (update mode)

**Emergency:**
- kill switch (остановить весь сервис клиента)
- freeze account (заблокировать доступ TOTP)
- rollback к предыдущему коммиту

### Как защищён

**Клиент НЕ видит:**
- `/api/operator/*` endpoints в MCP tools list
- Директорию с operator кодом в Dev Console tree
- Operator actions в activity log (или замаскированы как `system_maintenance`)
- Упоминания в TEAM_ROLES, settings, admin panel

**На уровне OS:**
- `/var/www/iam.client/app/api/operator/` — owned by root, chmod 600
- `/var/www/iam.client/.env.local` — chmod 600, client PM2 user может читать но не писать
- `OPERATOR_TOKEN` в отдельном файле, не в .env.local (чтобы не светиться в env UI)
- chattr +i на route.ts файлах operator endpoints (immutable, не редактируется даже через nano)
- Separate unix user для operator-процесса (если делаем отдельный agent)

**На уровне runtime:**
- Bearer token check на каждом запросе
- Rate limit (медленнее чем MCP)
- Optional IP whitelist (только iamrunning.online)
- Каждый operator call логгируется на iamrunning.online (не на клиенте — чтобы клиент не видел)

---

## 3. Архитектурное решение — agent vs endpoints

**Выбор:** endpoints внутри IAM Client OS (`/api/operator/*`), защищённые на уровне OS.

**Почему не отдельный agent:**
- Больше движущихся частей
- Надо отдельно апдейтить
- Больше поверхность атаки (два бинаря вместо одного)
- Клиент может заметить дополнительный процесс в `ps aux`

**Почему endpoints OK:**
- Тот же Next.js runtime что и вся система
- Protected через OS-level permissions (chmod, chattr, отдельный user)
- Если основная система упала — да, operator тоже не ответит, но это же и есть сигнал «надо поднимать, иди по SSH»
- Rollback через SSH остаётся как ultimate fallback

**Компромисс:** SSH credentials клиента тоже хранить (опционально, при онбординге). Если operator endpoints не отвечают — fallback через SSH из iamrunning.online.

---

## 4. Web Installer — flow

### UI на iamrunning.online/admin

Страница: `/admin/clients/new`

**Форма:**
- Client name
- Domain (где будет жить IAM Client OS — `iam.clientdomain.com`)
- GitHub repo (можно создать автоматически через API: `ArielGrook/client-{slug}-{N}`)
- Port (default 4741, проверить не занят)
- Install path (default `/var/www/iam.client`)
- Configuration:
  - [x] Skip landing (интеграция в существующий сайт)
  - [ ] Skip security (уже настроен fail2ban/UFW)
  - [ ] Skip nginx (клиент настроит сам)
- Notes (свободный текст для себя)

**После submit:**

1. Валидация на сервере
2. Создаётся запись в базе instance (pending)
3. Создаётся клиентский GitHub repo (fork из skeleton)
4. Генерируется персонализированный install script
5. Возвращается клиенту: **одна curl команда** + install token (short TTL)

Клиент копирует команду → запускает на своём VPS → скрипт выполняется → отстукивает прогресс на iamrunning.online.

**Пример команды:**
```bash
curl -fsSL https://iamrunning.online/api/install/run?token=xxx | sudo bash
```

### Прогресс установки

Страница `/admin/clients/{instance_id}/installing` — live-прогресс:

- Step 1/12 — Resource check ✓
- Step 2/12 — Installing dependencies ✓
- Step 3/12 — Cloning repo ✓
- ...
- Step 12/12 — Complete ✓

Реализация: клиентский bash скрипт отстукивает после каждого шага через `curl POST /api/install/status`. Браузер Ариэля poll-ит `/api/install/status` каждые 2 секунды.

При ошибке — клиентский скрипт отправляет stderr lot на `/api/install/log`. Ариэль видит причину без SSH.

### После установки

- Клиентская запись в базе: `status: active`
- Карточка клиента открыта в Admin панели
- Видны все метаданные: domain, port, path, github_repo, operator_token (encrypted), MCP token (для передачи клиенту), TOTP secret (одноразовый показ)
- Operator actions доступны: Status / Logs / Update / Restart / Exec / Export Data / Kill Switch
- Heartbeat начинает идти каждые 5 минут
- Activity push каждые 5 минут

---

## 5. Skeleton Repo

### Что это

`ArielGrook/iam-client-skeleton` — приватный репо с чистым кодом IAM Client OS, **откуда** делаются fork-и клиентам и **куда** отправляются наши релизы.

### Что внутри

**Есть:**
- `app/` — включая `app/api/operator/*` (уже там, но скрыто)
- `lib/`
- `scripts/iam-client.sh` (без корневого `install.sh` легаси)
- `bootstrap-prompts/`
- `public/`
- `memory/` — только шаблоны (RULES, ARCHITECTURE template, SYSTEM_IDENTITY template, CURRENT_GOAL template, NEXT_ACTIONS template, WEEKLY_PROGRESS template, TEAM_ROLES template)
- `docs/architecture/` (решение открытое)
- `source-of-truth/` (решение открытое)
- `package.json`, `tsconfig.json`, `next.config.mjs`, `.env.example`, `.gitignore`
- `README.md` — клиентская версия

**Нет:**
- `ariel-workflow/`
- `IDEAS/`
- `workspace/`
- Наши реальные memory (CURRENT_GOAL с нашими целями, WEEKLY_PROGRESS с нашей историей)
- `memory/workers/`, `memory/wisdom/`, `memory/CURSOR_PROMPTS.md`
- `data/*` с нашими данными
- `tasks/`, `messages/`, `pull-pool/`, `logs/`
- `test/`, `tests/`
- `oauth-debug.log`

### Синхронизация

Скрипт `scripts/sync-skeleton.sh` в dev repo (`iam-client-os` на lego-base):
1. Клонирует skeleton локально
2. Копирует whitelist директорий из dev repo
3. Перезаписывает memory/ шаблонами
4. Коммитит + пушит

Запускается вручную когда мы выпускаем релиз. НЕ на каждый push в dev.

### Клиентские репо

При создании нового клиента через web installer:
1. GitHub API → create private repo `ArielGrook/client-{slug}-{N}`
2. Либо fork из skeleton, либо clone+push (зависит от API)
3. Install на клиентский сервер клонирует из **этого** репо
4. Клиентские PR-мёржи идут в их репо (не в skeleton)
5. Релизы: мы пушим updates из skeleton в их репо (мержим апстрим когда надо)

---

## 6. Где что живёт (summary)

### На iamrunning.online (наша платформа)
- Admin panel → tab "Clients"
- Form "Install new client"
- List of instances with cards
- Per-client card: env, logs, operator actions
- API: `/api/install/prepare`, `/api/install/run`, `/api/install/status`, `/api/install/log`, `/api/install/complete`
- API: `/api/monitor/register`, `/api/monitor/heartbeat`, `/api/monitor/activity`
- API: `/api/operator/proxy/*` — прокси к клиентским operator endpoints
- Database: instances, instance_team, instance_activity, instance_billing, instance_updates
- GitHub integration: создание клиентских репо через API

### На клиентском сервере (IAM Client OS)
- Всё что сейчас есть
- `/api/operator/*` endpoints — скрыто
- `OPERATOR_TOKEN` хранится в отдельном protected файле
- Heartbeat cron
- Activity push cron
- Backup cron

### В lego-base (dev)
- `scripts/sync-skeleton.sh`
- `ariel-workflow/`, `IDEAS/`, наши memory и т.д.
- Рабочий `iam-client-os` код

### В skeleton repo
- Только production-ready код + шаблоны
- Синхронизируется ручным запуском sync-скрипта

### В per-client repos
- Fork из skeleton + клиентские PR-мержи

---

## 7. Открытые вопросы

1. **SSH credentials хранить или нет?** Если хранить — защита (AES-256), доступ только через master password. Нет — fallback на operator endpoints только.

2. **`docs/architecture/` и `source-of-truth/` — в skeleton или нет?** Скорее всего да, но пометить как референс системы, не клиентского кода.

3. **Operator actions логируются на iamrunning.online — но клиент должен знать что его сервер удалённо дёргают?** Решение: в Terms of Service указано что мы имеем доступ для обслуживания. Transparent по согласию, но невидимо в UI.

4. **Kill switch — legitimate use cases?** Неплатящий клиент, нарушение ToS, compromise. Нужен audit trail.

5. **Update механизм — push (мы обновляем всех сразу) vs pull (клиент сам решает когда)?** Скорее push с опцией pause на стороне клиента.

6. **GitHub автосоздание репо — через Ariel's PAT или через отдельный service account?** Service account безопаснее.

7. **Как быть с уже существующей папкой `iam-client-os/` в корне iamrunning.online?** Удалить руками до начала реальной работы.

8. **Immutable файлы (`chattr +i`) — насколько агрессивно?** Только route.ts operator endpoints? Или вся `app/api/operator/`?

---

## 8. Tripwire & Freeze — защита от клиентского вмешательства

### Концепт

Любой доступ клиента к operator/системным файлам (read/write/patch/delete) → мгновенная реакция:
1. Alert на iamrunning.online
2. Push уведомление Ariel
3. Auto-rollback последнего git commit
4. System freeze — клиент видит официальное сообщение о заморозке

Это работает как sticky honeypot: клиент полез — система сразу закрылась — клиент пишет Ariel-у — Ariel разбирается.

### Техническая реализация

**Guard process** (`iam-guard` PM2 процесс, замаскирован как `node-monitor`):
- Работает 24/7 рядом с main app
- Слушает inotify events на protected paths
- Фильтрует legitimate operator calls (через Bearer token check)
- Любое незаконное событие → trigger response

**Protected paths:**
- `/app/api/_maint/**` — operator endpoints
- `/lib/_internal/**` — operator helpers
- `.env.local` (чтение не-PM2 user-ом)
- `ecosystem.config.js`
- `data/settings.json`
- `scripts/iam-backup.sh`, `scripts/iam-guard.js`
- `.git/hooks/*`

**Response на trigger:**
1. Local log: timestamp, process info (ps, lsof), UID, command, file accessed
2. POST на `iamrunning.online/api/monitor/security-alert`
3. `git reset --hard HEAD~1` (rollback последних изменений)
4. `pm2 restart` main app
5. Touch `/var/lib/iam/.frozen` flag
6. Main app при следующем request проверяет flag → рендерит freeze screen

### Freeze UI

Простой full-page компонент (рендерится до auth, до admin panel):

```
System Access Alert
───────────────────
This installation has been temporarily suspended due to 
detected unauthorized access to system files.

All user data is preserved. Service will resume after review.

Contact: ariel@iamrunning.online
Reference: INC-{timestamp}
```

### Unfreeze

Ariel через Admin панель iamrunning.online → клиентская карточка → кнопка "Unfreeze":
- DELETE `/var/lib/iam/.frozen` через operator API
- pm2 restart
- Action logged

### Open questions по tripwire

- **False positive protection** — legitimate operator calls whitelist-ятся через token check в guard. Git pull / npm install через operator API — whitelisted. Всё остальное → trigger.
- **Guard killed by client** — main app heartbeat-ит guard каждые 30 сек. Нет ответа — main app сам triggerит alert + freeze.
- **Rollback depth** — `HEAD~1` default. Если клиент patched 3 файла — нужен snapshot перед и rollback на snapshot. Улучшение для v2.
- **Полное удаление install path клиентом** — не наш кейс. Heartbeat прекращается, instance помечается `offline`.

---

## 9. Следующий шаг — Roadmap

Roadmap в отдельном документе: `ariel-workflow/OPERATOR_WEBINSTALLER_ROADMAP.md`

Этапы, задачи, кто делает (Claude в lego-base vs Cursor в iamrunning.online), зависимости, время.
