# Client Emergency Troubleshooting Runbook

> **Цель.** Восстановить любого упавшего IAM Client OS клиента через `server_side_access` MCP tool на iamrunning.online. Этим документом должна уметь пользоваться даже бесплатная нейросеть — все команды готовы к копипасту, вся диагностика табличная.
>
> **Ты оператор.** У тебя есть iamrunning MCP connector в Claude → `server_side_access` → полный root на VPS. Если коннектор пропал (tool_search не находит) — сделай reconnect в Claude settings.
>
> **Последнее обновление:** 2026-04-23. Сервер iamrunning.online = 94.176.238.108.

---

## 0. Быстрая ориентация в клиенте

Путь установки любого клиента на iamrunning.online VPS: `/var/www/iam.<slug>` (например `/var/www/iam.test`). В iamrunning clients.json каждый клиент имеет `id`, `domain`, `port`, `installPath`, `operatorToken`.

Чтобы найти путь конкретного клиента: `iam_clients_list` tool → ищешь по `domain`, получаешь `id` + `installPath`.

PM2-имя процесса клиента начинается с `iam.<slug>` (например `iam.iam-test-phase-2`).

**Главные файлы на клиенте:**
- `/var/www/iam.X/ecosystem.config.js` — PM2 конфиг. **Если он сломан — cold pm2 restart убьёт клиента.**
- `/var/www/iam.X/.env.local` — секреты клиента (operator token, etc.). 0600, **никогда не редактировать напрямую**.
- `/var/www/iam.X/logs/.deploy.lock` — mutex для deploy. Если залип — удалить.
- `/var/www/iam.X/.next/` — Next.js build output. Если нет — клиент не стартует.
- `/var/www/iam.X/scripts/iam-heartbeat.sh` + `iam-activity.sh` + `iam-backup.sh` — крон-скрипты.

**Порты:** 4742 (test), 4741 (reserved), каждый новый клиент получает следующий свободный.

---

## 1. Симптом → команда-диагноз → команда-фикс

### 1.1 В админке iamrunning.online: `HTTP 502` на любой операции (push/rollback/GET files)

**Диагноз:** клиент полностью мёртв или не слушает порт.

**Проверка:**
```
server_side_access.bash_exec(cmd: "pm2 jlist | jq -r '.[] | select(.name | startswith(\"iam.\")) | \"\\(.name)\\t\\(.pm2_env.status)\\tuptime=\\((now*1000 - .pm2_env.pm_uptime)/1000 | floor)s\\trestarts=\\(.pm2_env.restart_time)\"'")
```

Если status = `errored` или restarts растёт каждые 3-5 сек → crash loop (см. 1.2). Если `online` но HTTP 502 → см. 1.3.

### 1.2 PM2 `errored` + в error logs `Could not find a production build in the '.next' directory`

**Диагноз:** `.next` build корраптовался. Обычно из-за упавшего `npm run build` во время push'а с `NODE_ENV=production` в `.env.local` без `NPM_CONFIG_PRODUCTION=false`.

**Фикс (ручной rebuild клиента):**
```
server_side_access.bash_exec(
  cmd: "cd /var/www/iam.<slug> && NPM_CONFIG_PRODUCTION=false npm install --include=dev --no-audit --no-fund && NPM_CONFIG_PRODUCTION=false npm run build 2>&1 | tail -15",
  timeout_sec: 300
)
```

**Потом:**
```
server_side_access.pm2(sub: "restart", name: "iam.<slug>")
```

### 1.3 PM2 `online`, но nginx отдаёт 502

**Диагноз:** процесс живой, но не слушает порт или зашкалил по памяти/ошибкам.

**Проверка:**
```
server_side_access.bash_exec(cmd: "ss -tlnp | grep <port>")
server_side_access.pm2(sub: "logs", name: "iam.<slug>", lines: 50)
```

Если порт не слушается — ecosystem.config.js сломан или startup упал. Смотри 1.4.

### 1.4 `ecosystem.config.js` испорчен / синтакс error

**Диагноз:** Ariel (или кто-то через Files UI) отредактировал файл и сохранил с синтакс ошибкой. PM2 сейчас работает из save-state (`~/.pm2/dump.pm2`), но **cold restart убьёт клиента**.

**Проверка:**
```
server_side_access.bash_exec(cmd: "node -c /var/www/iam.<slug>/ecosystem.config.js && echo OK || echo BROKEN")
```

**Фикс:** прочитай файл, найди и удали мусорные строки. Типичная атака: мусор в начале `this will not compile;;;\n\n`. Для мягкого фикса:
```
server_side_access.bash_exec(
  cmd: "node -e \"const fs=require('fs'); const f='/var/www/iam.<slug>/ecosystem.config.js'; const c=fs.readFileSync(f,'utf-8'); fs.writeFileSync(f, c.replace(/^this will not compile;;;\\n\\n/,'')); console.log('patched, new size:', fs.statSync(f).size);\""
)
```

### 1.5 `Deploy already in progress (Xs ago). Wait and retry.`

**Диагноз:** `.deploy.lock` завис (предыдущий deploy упал до того как удалил lock). С fix'ом от 2026-04-23 это auto-resolve'ится за 5 мин или сразу если pid мёртв. До фикса — 15 мин.

**Мгновенный фикс:**
```
server_side_access.files(sub: "delete", path: "/var/www/iam.<slug>/logs/.deploy.lock")
```

### 1.6 Rollback падает: `Aborted before upload: snapshot fetch <path>: HTTP 502`

**Диагноз:** клиент мёртв → iamrunning's push-flow не может сфетчить текущую production версию файла для pre-rollback snapshot → весь rollback abort'ится. Это **НЕ** баг rollback'а, это каскад из 1.1/1.2.

**Фикс:** сначала поднять клиента (см. 1.1 → 1.2). Потом rollback через UI сработает. Либо — восстановить файл **напрямую через server_side_access** (см. 2.1).

### 1.7 Push падает: `Deploy failed (Command failed: npm run build ...)`

**Диагноз:** билд упал на клиенте. Если в output видишь `Module not found: @/lib/...` — это NODE_ENV=production + devDeps pruned.

С fix'ом от 2026-04-23 на deploy endpoint'е это не должно происходить (`npm run build` теперь получает `NPM_CONFIG_PRODUCTION=false`). Если всё равно падает → проверь что клиент получил fix через skeleton sync:

```
server_side_access.bash_exec(cmd: "grep -c NPM_CONFIG_PRODUCTION /var/www/iam.<slug>/app/api/operator/deploy/route.ts")
```

Должно вернуть `>= 2` (один для npm install, один для npm run build). Если 1 — клиент со старым кодом, см. 2.3.

### 1.8 Uptime в UI всегда 0s / стейл

**Диагноз:** cron heartbeat не отрабатывает. Обычно из-за синтакс ошибки в `iam-heartbeat.sh` или `iam-activity.sh`.

**Проверка:**
```
server_side_access.bash_exec(cmd: "bash -n /var/www/iam.<slug>/scripts/iam-heartbeat.sh && echo HB_OK")
server_side_access.bash_exec(cmd: "bash -n /var/www/iam.<slug>/scripts/iam-activity.sh && echo ACT_OK")
server_side_access.bash_exec(cmd: "timeout 30s bash /var/www/iam.<slug>/scripts/iam-heartbeat.sh; echo exit=$?")
```

Последняя команда — сразу запустить heartbeat вручную и увидеть exit code. Если > 0 — смотри output выше, там stderr.

---

## 2. Прямое восстановление клиента (bypass UI)

Когда через operator UI ничего не проходит (клиент down) — можно восстановить напрямую через `server_side_access`. UI **не нужен**.

### 2.1 Восстановить файл из iamrunning snapshot напрямую

Iamrunning хранит snapshots клиентов тут: `/var/www/i_am_running/iam-clients-os/data/operator/snapshots/<client_id>/<snap_id>/`. Файлы точно как на клиенте (полные пути).

```
# 1. Список snapshot'ов для клиента
server_side_access.bash_exec(cmd: "ls -la /var/www/i_am_running/iam-clients-os/data/operator/snapshots/<client_id>/ | tail -20")

# 2. Посмотреть что в конкретном snapshot
server_side_access.files(sub: "list", path: "/var/www/i_am_running/iam-clients-os/data/operator/snapshots/<client_id>/<snap_id>", recursive: true)

# 3. Копирнуть файл из snapshot напрямую на клиент
server_side_access.files(
  sub: "copy",
  path: "/var/www/i_am_running/iam-clients-os/data/operator/snapshots/<client_id>/<snap_id>/<rel_path>",
  destination: "/var/www/iam.<slug>/<rel_path>"
)

# 4. Если надо — rebuild клиента
server_side_access.bash_exec(
  cmd: "cd /var/www/iam.<slug> && NPM_CONFIG_PRODUCTION=false npm run build 2>&1 | tail -5",
  timeout_sec: 300
)

# 5. Restart
server_side_access.pm2(sub: "restart", name: "iam.<slug>")
```

### 2.2 Восстановить из full-server backup (tar.gz)

Если всё совсем плохо — в `/root/backups/pre-debug-*.tar.gz` лежат полные snapshots сервера.

```
# Список имеющихся бэкапов
server_side_access.bash_exec(cmd: "ls -lh /root/backups/")

# Вытащить ТОЛЬКО один файл клиента
server_side_access.bash_exec(
  cmd: "tar -xzf /root/backups/pre-debug-YYYY-MM-DD-HHMM.tar.gz -C /tmp/ var/www/iam.<slug>/<rel_path> && cp /tmp/var/www/iam.<slug>/<rel_path> /var/www/iam.<slug>/<rel_path>",
  timeout_sec: 60
)

# Вытащить всю папку проекта клиента (без перезаписи .env.local!)
server_side_access.bash_exec(
  cmd: "mkdir -p /tmp/restore && tar -xzf /root/backups/pre-debug-*.tar.gz -C /tmp/restore var/www/iam.<slug> && cp -r /tmp/restore/var/www/iam.<slug>/* /var/www/iam.<slug>/",
  timeout_sec: 120
)
```

**⚠️ Никогда не восстанавливай поверх `.env.local`** — секреты могут не совпадать с новым состоянием iamrunning clients.json.

### 2.3 Клиент нужно апгрейднуть (старый код)

Если клиент установлен давно и получает баги из-за устаревшего кода — надо заменить файлы из `iam-clients-os/source`.

```
# Скопировать конкретный исправленный файл
server_side_access.files(
  sub: "copy",
  path: "/var/www/i_am_running/iam-clients-os/source/app/api/operator/deploy/route.ts",
  destination: "/var/www/iam.<slug>/app/api/operator/deploy/route.ts"
)

# Rebuild + restart
server_side_access.bash_exec(
  cmd: "cd /var/www/iam.<slug> && NPM_CONFIG_PRODUCTION=false npm run build 2>&1 | tail -5 && pm2 restart iam.<slug> --update-env",
  timeout_sec: 300
)
```

Полный апгрейд клиента **через cli у клиента** (когда клиент сам запускает): команда `./scripts/iam-update.sh` или `git pull && npm run build && pm2 restart`. Пока это не автоматизировано — делай через server_side_access как выше.

### 2.4 Очистить застрявшие staging файлы на iamrunning

Если в Updates badge висит файл который не хочет ни push'иться ни discardиться (редко, но бывает):

```
server_side_access.bash_exec(cmd: "ls /var/www/i_am_running/iam-clients-os/data/operator/staging/<client_id>/")

# Удалить весь staging для клиента
server_side_access.files(
  sub: "delete",
  path: "/var/www/i_am_running/iam-clients-os/data/operator/staging/<client_id>",
  recursive: true
)

# Пересоздать пустую папку (чтобы endpoint не ругался)
server_side_access.bash_exec(cmd: "mkdir -p /var/www/i_am_running/iam-clients-os/data/operator/staging/<client_id>")
```

---

## 3. Sanity-check — "всё ли у меня здорово прямо сейчас?"

Запустить перед тем как начинать любой debug: покажет быстро все проблемные места.

```
server_side_access.bash_exec(cmd: "
echo '=== PM2 ==='
pm2 jlist | jq -r '.[] | \"\\(.name)\\t\\(.pm2_env.status)\\tup=\\((now*1000 - .pm2_env.pm_uptime)/1000 | floor)s\\trestarts=\\(.pm2_env.restart_time)\\tmem=\\(.monit.memory/1048576 | floor)mb\"'
echo
echo '=== NGINX ==='
nginx -t 2>&1 | tail -3
systemctl is-active nginx
echo
echo '=== DISK ==='
df -h / | tail -1
echo
echo '=== LOCKS ==='
find /var/www -name '.deploy.lock' -type f 2>/dev/null | while read f; do echo \"$f (age: $(( ($(date +%s) - $(stat -c %Y \"$f\")) / 60 )) min)\"; done
echo
echo '=== Each client HEALTH ==='
for p in /var/www/iam.*; do
  if [ -d \"$p\" ]; then
    port=$(grep -oE 'port [0-9]+' \"$p/ecosystem.config.js\" | head -1 | awk '{print \\$2}')
    [ -z \"$port\" ] && port=$(grep -oE '\"port [0-9]+\"' \"$p/ecosystem.config.js\" | head -1 | grep -oE '[0-9]+')
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://localhost:\\${port:-4742}/ 2>/dev/null)
    echo \"$p (port ${port:-?}) = HTTP $code\"
  fi
done
")
```

Если всё зелёное:
- PM2 все процессы `online`, restarts не растут
- nginx `active` + config syntax ok
- disk > 2GB свободно
- locks empty или old (> 5 min) — к следующему deploy сами украдутся
- каждый клиент на своём порту возвращает 200 (редко 3xx)

Что-то не так — соответствующая секция выше даёт фикс.

---

## 4. Что НЕЛЬЗЯ делать

- **Не делать `pm2 restart iam.<slug>` без предварительной проверки что `ecosystem.config.js` валиден** (`node -c <file>`). Если он broken — клиент попадёт в crash loop и прод упадёт.
- **Не редактировать `.env.local` клиента напрямую через files:write** без синхронизации с iamrunning clients.json. Токены должны совпадать, иначе heartbeat сломается.
- **Не запускать `pm2 save`** без подтверждения что процессы в желаемом состоянии. `pm2 save` фиксирует текущее в dump.pm2 — если сейчас что-то errored, оно останется таким после cold reboot.
- **Не делать git push на iamrunning.online source** пока не пройдёт PAT rotate (см. SSH_SERVER_README §4). GitHub блокирует push.
- **Не удалять `.next` в момент когда клиент под нагрузкой** — next server падает сразу. Если нужен clean rebuild — сначала `pm2 stop` → `rm -rf .next` → `npm run build` → `pm2 restart`.

---

## 5. Документация / куда смотреть, если этого runbook'а мало

- `context-core/SSH_SERVER_README.md` — инвентарь сервера, как MCP tool устроен, full-server backup strategy
- `context-core/handoffs/HANDOFF_*.md` — история сессий, какие фиксы делались и почему
- `iam-clients-os/source/app/api/operator/*` — код endpoints клиента (deploy, files, notify, etc.)
- `iam-clients-os/source/lib/admin/iam-clients-os/push-flow.ts` — extracted push-flow library, общий для push и rollback на iamrunning side

**Когда застрял** — читай pm2 logs с `--lines 100`, это обычно сразу показывает причину. Если нет — смотри nginx error log: `tail -50 /var/log/nginx/error.log`.
