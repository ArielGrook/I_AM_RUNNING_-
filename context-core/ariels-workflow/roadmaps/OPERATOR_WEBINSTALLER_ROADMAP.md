# Operator + Web Installer + Skeleton — Implementation Roadmap

**Parent spec:** `ariel-workflow/OPERATOR_WEBINSTALLER_SKELETON_SPEC.md`
**Status:** Ready for implementation (17.04.2026)
**Strategy:** Параллельная работа — Claude в lego-base (клиентская часть) + Cursor в iamrunning.online (UI + API)

---

## Обзор этапов

```
Stage 0  — Уборка путаницы                        [~1 час]   [Claude + Ariel SSH]
Stage 1  — Skeleton repo                          [~2-3 ч]   [Claude + Ariel GitHub]
Stage 2  — Operator endpoints (client-side)       [~3-4 ч]   [Claude]
Stage 3  — Guard process + tripwire               [~3-4 ч]   [Claude]
Stage 4  — Modify iam-client.sh под web installer [~2 ч]     [Claude]
Stage 5  — Install API endpoints на iamrunning     [~3 ч]    [Cursor]
Stage 6  — Install UI (форма + прогресс)           [~4 ч]    [Cursor]
Stage 7  — Operator Dashboard UI                   [~4 ч]    [Cursor]
Stage 8  — GitHub autocreate клиентских репо       [~2 ч]    [Cursor]
Stage 9  — Живая установка на iam.iamrunning.online [~2 ч]   [Ariel + Claude]
Stage 10 — Bug fix: file delete Dev Console        [~30 мин]  [Claude, параллельно]
```

**Общее время:** 26-32 часа фактической работы. Распределено на 5-7 дней при параллельной работе.

---

## Stage 0 — Уборка путаницы (DO FIRST, 1 час)

**Цель:** убрать дуализм install.sh и удалить забытые артефакты.

### Задачи

**0.1. Удалить корневой `install.sh` (legacy) в lego-base**
- Он уже не актуален, новый это `scripts/iam-client.sh`
- Либо удалить совсем, либо превратить в тонкую обёртку:
```bash
#!/bin/bash
exec sudo bash "$(dirname "$0")/scripts/iam-client.sh" "$@"
```

**0.2. Обновить README.md в lego-base**
- Указать правильный путь: `sudo bash scripts/iam-client.sh --domain=... --name=... --github=...`
- Убрать упоминание старого `install.sh` в корне

**0.3. Удалить legacy `iam-client-os/` с iamrunning.online**
- Ариэль делает через SSH на VPS 94.176.238.108
- `cd /var/www/i_am_running && rm -rf iam-client-os/`
- Commit change + git push (если это в репе)

**0.4. Написать DEVELOPMENT_VS_CLIENT.md**
- Короткий документ в корне dev repo
- Разместить в skeleton repo тоже
- Красными буквами: "lego-base = наша разработка, skeleton = клиентский код, НЕ ПУТАТЬ"

### Исполнители / deliverable
- **Claude:** 0.1, 0.2, 0.4 (в lego-base)
- **Ariel:** 0.3 (SSH команда, ~30 секунд работы)

---

## Stage 1 — Skeleton repo (2-3 часа)

**Цель:** создать чистый репо, откуда будут ставиться клиенты.

### Задачи

**1.1. Ариэль создаёт GitHub repo**
- Name: `iam-client-skeleton`
- Visibility: private
- No README, no .gitignore (будет залит скриптом)

**1.2. Claude пишет `scripts/sync-skeleton.sh` в lego-base**
- Whitelist подход (не blacklist)
- Копируемые директории: `app/`, `lib/`, `public/`, `scripts/` (только production), `bootstrap-prompts/`, `docs/architecture/`, `source-of-truth/`, `extensions/`
- Копируемые файлы: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.mjs`, `next-env.d.ts`, `.env.example`, `.gitignore`, `README.md` (клиентская версия)
- Memory файлы: только templates (не наши реальные)
- НЕ копировать: `ariel-workflow/`, `IDEAS/`, `workspace/`, `memory/workers/`, `memory/wisdom/`, `memory/CURSOR_PROMPTS.md`, `data/*` (кроме .gitkeep), `logs/`, `tasks/`, `messages/`, `pull-pool/`, `test/`, `tests/`, `oauth-debug.log`
- НЕ копировать `app/api/admin/totp-test-flow/` (dev-only)
- В конце: `git init`, `git add -A`, `git commit -m "sync: from dev @ <sha>"`, `git push --force origin main`

**1.3. Первый sync**
- Запустить `./scripts/sync-skeleton.sh`
- Проверить что в skeleton нет dev-мусора
- Вручную просмотреть дерево файлов

**1.4. Клиентская версия README.md**
- Короткий README для skeleton (без упоминания lego-base, без истории)
- Описание продукта, как ставить, куда писать при проблемах

**1.5. Проверка — установить skeleton локально**
- Клонировать skeleton в отдельную папку
- `npm install && npm run build && pm2 start`
- Убедиться что работает как чистая инсталляция

### Исполнители / deliverable
- **Ariel:** 1.1 (создать GitHub repo, ~1 мин)
- **Claude:** 1.2, 1.4 (код в lego-base)
- **Ariel + Claude:** 1.3, 1.5 (запуск, проверка)

---

## Stage 2 — Operator endpoints на клиентской стороне (3-4 часа)

**Цель:** создать `/api/_maint/*` endpoints в IAM Client OS (изначально живут в skeleton → ставятся всем клиентам автоматически).

**Naming convention:** `_maint` вместо `operator` в путях / env / PM2 name — максимальная маскировка.

### Задачи

**2.1. Endpoints в `app/api/_maint/`**
- `GET /api/_maint/status` — version, uptime, disk, RAM, PM2 status
- `GET /api/_maint/logs?type=activity|deploy|error&lines=100` — любые логи
- `POST /api/_maint/read` body `{path}` → возвращает содержимое файла
- `POST /api/_maint/write` body `{path, content}` → перезаписывает файл
- `POST /api/_maint/patch` body `{path, oldText, newText}` → targeted replacement
- `POST /api/_maint/delete` body `{path, recursive}` → удаление файла/директории
- `POST /api/_maint/exec` body `{command}` → произвольная bash команда (с логом)
- `POST /api/_maint/update` → git pull + build + restart
- `POST /api/_maint/restart` → pm2 restart
- `POST /api/_maint/backup` → trigger iam-backup.sh + return path
- `GET /api/_maint/export?type=activity|messages|tasks&from=&to=` → datasets
- `POST /api/_maint/env-update` body `{key, value}` → обновить .env.local
- `POST /api/_maint/kill-switch` → freeze mode
- `POST /api/_maint/unfreeze` → снять freeze

**2.2. Auth middleware**
- Bearer token check — сравнение с `MAINT_KEY` из `.env.local`
- Rate limit 10 req/sec на endpoint
- Optional IP whitelist (iamrunning.online ips only, опционально)
- Каждый вызов логгируется **не на клиенте**, а отправляется на iamrunning.online: `POST /api/monitor/maint-log`
- Если iamrunning.online недоступен — локальный лог в `/var/lib/.iam-cache/maint.log` (neutral location)

**2.3. Защита на уровне OS (install.sh ставит)**
- `app/api/_maint/` — chown root:root, chmod 700
- route.ts в endpoints — chattr +i (immutable)
- `.env.local` — chown root:pm2user, chmod 640 (PM2 читает, не пишет)
- `MAINT_KEY` не в `.env.local` а в отдельном файле `/var/lib/.iam-cache/maint.key` — chown root:root, chmod 600 (main app читает через `fs.readFileSync`)

**2.4. MCP tools hiding**
- В `app/api/mcp/lib/tools-registry.ts` — НЕТ упоминания `_maint`
- В capability-gate — НЕТ route для `_maint`
- В Dev Console file tree — `_maint/` в hidden paths list
- В activity log injection — если вызов от _maint токена, пропустить логирование

### Исполнители / deliverable
- **Claude:** всё (код в lego-base, потом sync в skeleton)

---

## Stage 3 — Guard process + tripwire (3-4 часа)

**Цель:** защита operator файлов от несанкционированного доступа клиентом.

### Задачи

**3.1. `scripts/iam-guard.js` (Node.js)**
- Использует `chokidar` или нативный `fs.watch` для inotify
- Protected paths list (уже определены в спеке)
- При событии (read/write/delete) — проверка: это legitimate maint call?
  - Legitimate: если Parent PID процесса = main IAM Client OS process И вызов содержит `MAINT_KEY` header
  - Illegitimate: всё остальное
- Illegitimate trigger:
  1. Logs locally (neutral location)
  2. POST `https://iamrunning.online/api/monitor/security-alert`
  3. `git reset --hard HEAD~1`
  4. `pm2 restart iam.<client>`
  5. Touch `/var/lib/.iam-cache/.frozen`
- Heartbeat от main app → guard каждые 30 сек (детект если guard killed)

**3.2. Guard masquerade**
- PM2 name: `node-monitor` (не `iam-guard`)
- Process args: generic
- Файл: `/var/lib/.iam-cache/monitor.js` (neutral path)

**3.3. Main app — freeze detection**
- Middleware в Next.js: если `.frozen` flag → рендерить freeze screen на все routes
- Freeze screen: full-page, минималистичный, с reference ID и contact email
- API endpoints возвращают 503 с `{"frozen": true, "reference": "..."}`

**3.4. Unfreeze mechanism**
- `POST /api/_maint/unfreeze` body `{reference_id}` → удаляет `.frozen` flag, pm2 restart
- Доступно только через Ariel из iamrunning.online Operator Dashboard

**3.5. install.sh интеграция**
- Создать `/var/lib/.iam-cache/` (chown root, chmod 700)
- Копировать guard скрипт туда
- `pm2 start /var/lib/.iam-cache/monitor.js --name node-monitor`
- Добавить в PM2 startup

### Исполнители / deliverable
- **Claude:** всё (код + install.sh интеграция)

---

## Stage 4 — Modify iam-client.sh под web installer (2 часа)

**Цель:** скрипт должен работать (а) как сейчас (CLI с флагами) и (б) с переменными окружения от web installer.

### Задачи

**4.1. Поддержка env vars как альтернатива флагам**
- Если `IAM_DOMAIN` env → использовать как `--domain`
- Если `IAM_CLIENT_NAME` env → `--name`
- Если `IAM_GITHUB_REPO` env → `--github`
- Если `IAM_GITHUB_TOKEN` env → `--github-token`
- Если `IAM_STATUS_URL` env → отправлять прогресс туда
- Если `IAM_INSTALL_TOKEN` env → использовать в status POST

**4.2. Report progress function**
```bash
report_step() {
  local step="$1"
  local status="${2:-ok}"
  if [ -n "$IAM_STATUS_URL" ]; then
    curl -fsS -X POST "$IAM_STATUS_URL" \
      -H "Authorization: Bearer $IAM_INSTALL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"step\":\"$step\",\"status\":\"$status\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
      >/dev/null 2>&1 || true
  fi
}
```

**4.3. Вставить report_step во все 12 шагов**
- `report_step "resource_check"` в начале step_resource_check
- `report_step "dependencies"` и т.д.
- На error: `report_step "$step" "failed"` с error message

**4.4. Upload лога при ошибке**
- При trap cleanup (rollback) → сохранить весь stderr/stdout в tmpfile
- POST `https://iamrunning.online/api/install/log` с контентом
- Ариэль видит причину без SSH

**4.5. В конце установки — register instance**
- POST `https://iamrunning.online/api/monitor/register` с instance_id, domain, MAINT_KEY, OPERATOR_URL
- Теперь iamrunning.online знает про нового клиента

### Исполнители / deliverable
- **Claude:** изменения в `scripts/iam-client.sh`

---

## Stage 5 — Install API endpoints на iamrunning.online (3 часа)

**Цель:** API endpoints для web installer flow.

### Задачи (всё делает Cursor в чате iamrunning.online)

**5.1. Supabase schema / tables**
- `instances` — клиентские инсталляции
  - id, client_name, domain, github_repo, install_token (one-time, TTL), install_status (pending/installing/active/failed/frozen), instance_id, operator_url, maint_key (encrypted), created_at, installed_at
- `install_progress` — прогресс установок
  - install_token, step, status, timestamp, error_message
- `instance_activity` — heartbeat + activity logs
- `security_alerts` — tripwire triggers
- `instance_operator_logs` — все operator calls

**5.2. API endpoints**
- `POST /api/install/prepare` — создаёт запись, возвращает install_token + curl команду
- `GET /api/install/script?token=xxx` — возвращает персонализированный bash скрипт (вставлены env vars)
- `POST /api/install/status` — приём прогресса от клиентского скрипта
- `POST /api/install/log` — приём stderr при ошибке
- `POST /api/install/complete` — финал, сохранение MAINT_KEY
- `POST /api/monitor/register` — регистрация инстанса
- `POST /api/monitor/heartbeat` — здоровье каждые 5 мин
- `POST /api/monitor/activity` — дельта activity.jsonl
- `POST /api/monitor/security-alert` — tripwire trigger
- `POST /api/monitor/maint-log` — operator call log

**5.3. Operator proxy endpoints**
- `POST /api/operator/proxy` body `{instance_id, method, path, body}`
- Прокси к клиентскому `/api/_maint/<path>` с Bearer MAINT_KEY
- Возвращает результат как есть

### Исполнители / deliverable
- **Cursor в iamrunning.online**

---

## Stage 6 — Install UI (4 часа)

**Цель:** форма установки + live прогресс в Admin панели iamrunning.online.

### Задачи (всё делает Cursor)

**6.1. Страница `/admin/clients` (список)**
- Таблица всех инсталляций
- Колонки: name, domain, status (с цветом), last heartbeat, version, actions
- Кнопка "Install new client" → `/admin/clients/new`

**6.2. Страница `/admin/clients/new` (форма)**
- Все поля из Stage 5.2 (client_name, domain, github_repo, port, install_path, skip_landing, skip_security, skip_nginx, notes)
- Validation
- Submit → `/api/install/prepare` → получает install_token + curl команду
- Показывает команду в копируемом формате + QR код (для переноса на телефон клиента)
- Кнопка "Monitor progress" → `/admin/clients/{instance_id}/installing`

**6.3. Страница `/admin/clients/{instance_id}/installing` (прогресс)**
- Live-лог шагов (polling `/api/install/status` каждые 2 сек)
- Progress bar
- При ошибке — показ последних lines лога
- При success — кнопка "Open client card"

**6.4. Страница `/admin/clients/{instance_id}` (карточка)**
- Metadata: все переменные инсталляции
- Tabs:
  - **Overview** — status, uptime, version, domain link
  - **Logs** — activity, deploy, error (через operator proxy)
  - **Operator Actions** — buttons: Status / Read File / Write File / Patch File / Delete / Exec / Update / Restart / Export Data / Freeze / Kill Switch
  - **Security Alerts** — история tripwire trigger-ов
  - **Operator History** — все operator calls с timestamps

**6.5. UI для operator actions**
- Каждая action — модалка с формой (например Read File → input path → display content)
- Exec — textarea для команды + output display
- Write/Patch File — CodeMirror редактор
- Freeze — red button с confirm dialog
- Unfreeze — green button, доступен только когда frozen

### Исполнители / deliverable
- **Cursor в iamrunning.online**

---

## Stage 7 — Operator Dashboard (4 часа, частично overlap со Stage 6)

**Цель:** полноценная admin панель для управления всеми клиентами.

Почти совпадает со Stage 6.4 (карточка клиента) — но дополняется:

**7.1. Global dashboard**
- Всего клиентов: N (active / frozen / offline)
- Revenue tracking (MRR from instances)
- Alerts feed (security + errors)

**7.2. Bulk actions**
- Push update to all clients (select which)
- Send message to all clients
- Export aggregated datasets (все activity logs в один файл для RAG)

**7.3. Billing integration (позже)**
- Per-client billing status
- PayPal/Stripe hooks

### Исполнители / deliverable
- **Cursor в iamrunning.online**

---

## Stage 8 — GitHub autocreate (2 часа)

**Цель:** при Install prepare — автоматически создаётся клиентский репо.

### Задачи (Cursor)

**8.1. GitHub App или Service Account**
- Создать GitHub App с правами repo:create
- Или PAT на service account
- Хранить токен зашифрованно в Supabase secrets

**8.2. API integration**
- При `/api/install/prepare` → GitHub API call:
  - POST `/repos/template-owner/iam-client-skeleton/generate` body `{name, private: true}`
  - Возвращает new repo URL
- Сохранить repo URL в instance record

**8.3. Per-repo deploy token**
- После create — генерация deploy token для этого репо
- Передача в install скрипт как `IAM_GITHUB_TOKEN`
- После установки — token всё ещё живёт (для update через git pull)

### Исполнители / deliverable
- **Cursor в iamrunning.online**

---

## Stage 9 — Живая установка на iam.iamrunning.online (2 часа)

**Цель:** поставить IAM Client OS **на iamrunning.online** (94.176.238.108) как реальный клиент, через новый Web Installer, чтобы полностью протестировать flow в бою.

### Задачи

**9.1. DNS**
- Ариэль создаёт A-запись: `iam.iamrunning.online → 94.176.238.108`
- Проверить `dig iam.iamrunning.online`

**9.2. Install via web installer**
- Открыть iamrunning.online/admin/clients/new
- Заполнить форму:
  - Name: "IAM Running Test Instance"
  - Domain: `iam.iamrunning.online`
  - Port: 4741 (убедиться свободен через SSH)
  - Install path: `/var/www/iam.client`
  - Skip landing: YES
  - Skip security: YES (UFW уже настроен)
  - Skip nginx: NO (нужен новый server block)
- Submit → получить curl команду
- SSH на 94.176.238.108 → запустить команду
- Наблюдать прогресс в web UI

**9.3. Проверка**
- Проверить что существующий `i-am-running` PM2 работает без изменений
- Проверить что `iam.iamrunning.online` открывается
- Проверить TOTP first-run
- Подключить Claude к новому MCP endpoint
- Убедиться что guard процесс запущен: `pm2 list | grep node-monitor`
- Из Operator Dashboard — проверить что operator proxy работает (Status / Read File / Exec)

**9.4. Security test**
- **Claude намеренно пытается прочитать `/app/api/_maint/*` через Dev Console**
- Убедиться что tripwire сработал:
  - Alert пришёл в iamrunning.online Admin
  - System заморожен
  - Rollback выполнен
- Unfreeze через Admin panel → система восстанавливается

### Исполнители / deliverable
- **Ariel + Claude совместно** (Claude дебажит, Ariel пушит кнопки)

---

## Stage 10 — Bug fix file delete (30 мин, параллельно)

**Цель:** починить известный баг из вчерашней сессии. Это не блокер, но быстро.

### Задачи

**10.1. Backend — `app/api/dashboard/lib/dev-handlers.ts` функция `devDeleteFile`**
- Сейчас: `unlink()` удаляет только файлы
- Заменить на: `stat` → если directory → `rm -rf` (через fs.rm recursive) / если file → `unlink`

**10.2. Frontend — `app/dashboard/components/DashboardDevConsoleTab.tsx` функция `handleDeleteFile`**
- Сейчас: `loadTree()` перезагружает корень
- Заменить на: перезагрузка родительской папки удалённого файла
- Или: полный reload tree с сохранением expanded state

**10.3. Тест**
- Удалить файл из раскрытой папки
- Удалить пустую папку
- Удалить папку с содержимым

### Исполнители / deliverable
- **Claude** (параллельно с любым другим stage)

---

## Критический путь (что от чего зависит)

```
Stage 0 (уборка)
    │
    ▼
Stage 1 (skeleton) ─────┐
    │                    │
    ▼                    │
Stage 2 (operator)       │
    │                    │
    ▼                    │
Stage 3 (guard)          │
    │                    │
    ▼                    ▼
Stage 4 (iam-client.sh) ─┴── Stage 5 (install API)
    │                              │
    │                              ▼
    │                          Stage 6 (install UI)
    │                              │
    │                              ▼
    │                          Stage 7 (operator dashboard)
    │                              │
    │                              ▼
    │                          Stage 8 (github autocreate)
    │                              │
    └──────────────┬───────────────┘
                   ▼
               Stage 9 (живая установка)

Stage 10 (bug fix) — independent, делается в любой момент
```

---

## Предлагаемый порядок выполнения дома

**День 1 (сегодня вечер):**
1. Stage 0.1, 0.2, 0.4 (Claude, ~30 мин)
2. Stage 0.3 (Ariel SSH, ~2 мин)
3. Stage 10 bug fix file delete (Claude, ~30 мин)
4. Stage 1.1 создание GitHub repo (Ariel, ~1 мин)
5. Stage 1.2 начало sync-skeleton.sh (Claude, ~1 час)

Если время есть — Stage 1.3-1.5 (первый sync + тест).

**День 2:**
1. Stage 2 — Operator endpoints (Claude, ~3-4 часа)
2. Параллельно: Cursor начинает Stage 5 — Install API (3 ч)

**День 3:**
1. Stage 3 — Guard process (Claude, 3-4 ч)
2. Параллельно: Cursor делает Stage 6 — Install UI (4 ч)

**День 4:**
1. Stage 4 — Modify iam-client.sh (Claude, 2 ч)
2. Параллельно: Cursor делает Stage 7 — Operator Dashboard (4 ч)

**День 5:**
1. Stage 8 — GitHub autocreate (Cursor, 2 ч)
2. Integration tests между клиентской и серверной частью

**День 6:**
1. Stage 9 — Живая установка на iam.iamrunning.online (вместе)
2. Security test (tripwire verification)
3. Fix any bugs found

**День 7:**
1. Polish
2. Документация
3. Готовность к первому реальному клиенту

---

## Open questions to resolve перед началом

1. **SSH credentials хранить или нет?** Решение: НЕТ пока, fallback через operator endpoints. Можно добавить позже если нужно.

2. **Kill switch legitimate uses** — документировать в ToS (неплатёж, нарушение, compromise). Для MVP достаточно ручного toggle.

3. **Update механизм push vs pull** — начнём с push (Ariel жмёт кнопку, клиентский сервер обновляется). Клиент-side opt-out можно добавить позже.

4. **`docs/architecture/` и `source-of-truth/` в skeleton** — ДА, копируем. Они помогают Claude эффективно работать в клиентской среде.

5. **Immutable файлы (chattr +i)** — только на route.ts операторских endpoints + ecosystem.config.js. Остальные защищаются через permissions.

6. **False positives в tripwire** — whitelist через parent PID + MAINT_KEY presence. Первые 24 часа работы — режим "alert only, no freeze", чтобы поймать false positives.

7. **Guard жив / мёртв** — main app heartbeat-ит guard. Если guard умер — main app сам делает alert + freeze (degraded mode).

---

## Что готово к моменту возвращения Ариэля домой

- ✅ Спека `OPERATOR_WEBINSTALLER_SKELETON_SPEC.md` (9 секций)
- ✅ Roadmap (этот документ)
- ✅ Обновлённый `session-state.yaml`
- ✅ Обновлённый `current-goal.md`
- ✅ Старые специи прочитаны (`INSTALLER_SPEC_v1.md`, `INSTALL_CLEANUP_ROADMAP.md`)
- ✅ Известный баг документирован (file delete) с готовым планом фикса

**Готов стартовать с любого Stage как только Ариэль скажет.**
