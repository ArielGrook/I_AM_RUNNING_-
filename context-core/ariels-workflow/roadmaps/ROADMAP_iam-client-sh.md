ROADMAP: iam-client.sh — Установщик IAM Client OS
Дата: 14.04.2026
Статус: К реализации
Спека: iamrunning: context-core/specs/INSTALL_ONBOARDING_SPEC.md
Файл: scripts/iam-client.sh + app/api/operator/route.ts + app/page.tsx (--no-landing)

PHASE 0: Подготовка (перед написанием кода)
0.1 Прочитать спеку INSTALL_ONBOARDING_SPEC.md через iamrunning коннектор.
0.2 Прочитать текущие файлы которые будут затронуты:

scripts/deploy-logged.sh — понять паттерн deploy скрипта
app/page.tsx — понять текущий лендинг для --no-landing
.env.local через search по process.env — понять какие env vars нужны
lib/data/constants.ts — IAM_CLIENT_NAME, IAM_PROCESS_NAME


PHASE 1: Скелет iam-client.sh
1.1 Создать scripts/iam-client.sh со структурой:
#!/bin/bash
set -e

# Argument parsing (--domain, --name, --github, --port, --path, --no-landing, --skip-security, --skip-nginx, --admin-path, --update, --project-path)
# Defaults: port=4741, path=/var/www/iam.client, admin-path=/iam.admin
# Interactive mode: if no --domain → ask 7 questions

# Step 0: Resource check
# Step 0b: Rollback trap
# Step 1: Detect
# Step 2: Dependencies
# Step 3: Security
# Step 4: Clone
# Step 5: Secrets
# Step 6: Nginx
# Step 7: Build
# Step 8: PM2
# Step 8b: Healthcheck
# Step 9: Crons (heartbeat + activity + backup)
# Step 10: Project symlink
# Step 11: Register
# Step 12: Summary

INSTALL_COMPLETE=false
trap cleanup EXIT
1.2 Порт по умолчанию: 4741 (не 3100, слишком стандартный).
1.3 git_snapshot. Проверить синтаксис: bash -n scripts/iam-client.sh.

PHASE 2: Argument parsing + Interactive mode
2.1 Парсинг аргументов командной строки:
bashwhile [[ $# -gt 0 ]]; do
  case $1 in
    --domain=*) DOMAIN="${1#*=}" ;;
    --name=*) CLIENT_NAME="${1#*=}" ;;
    --github=*) GITHUB_REPO="${1#*=}" ;;
    --port=*) PORT="${1#*=}" ;;
    --path=*) INSTALL_PATH="${1#*=}" ;;
    --no-landing) NO_LANDING=true ;;
    --skip-security) SKIP_SECURITY=true ;;
    --skip-nginx) SKIP_NGINX=true ;;
    --admin-path=*) ADMIN_PATH="${1#*=}" ;;
    --update) UPDATE_MODE=true ;;
    --project-path=*) PROJECT_PATH="${1#*=}" ;;
  esac; shift
done
2.2 Если --domain не задан → интерактивный режим (7 вопросов с валидацией):

Domain (формат проверка)
Client name
GitHub repo (git ls-remote проверка)
Port (default 4741, lsof проверка)
Install path (default /var/www/iam.client)
Landing? (Y/n)
Security? (Y/n)

2.3 git_snapshot.

PHASE 3: Resource check + Rollback trap
3.1 Проверка RAM ≥1GB, disk ≥5GB, Node ≥18 (если установлен).
3.2 Trap cleanup EXIT — если INSTALL_COMPLETE ≠ true → удалить PM2, nginx конфиг, папку, crons.
3.3 git_snapshot.

PHASE 4: Detect + Dependencies + Security
4.1 Auto-detect: Node, PM2, Nginx, fail2ban, UFW, Certbot — если есть, пропускаем.
4.2 Установка отсутствующих (Node 20, PM2, Nginx, Certbot).
4.3 Security (если не --skip-security): fail2ban jail.local, UFW (allow SSH + Nginx Full), Nginx security headers.
ВАЖНО: НЕ ломать существующие конфиги. fail2ban — только добавить jail.local если нет. UFW — только добавить rules, не сбрасывать. Nginx headers — проверить что нет перед добавлением.
4.4 git_snapshot.

PHASE 5: Clone (закрытие GAP #1 — GitHub auth)
5.1 Проблема: на сервере клиента нет SSH ключа для ArielGrook GitHub.
5.2 Решение: клонировать через HTTPS + personal access token:
bashgit clone https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git "$INSTALL_PATH"
5.3 GITHUB_TOKEN — либо аргумент --github-token=, либо интерактивный вопрос. НЕ хранить в .env.local клиента. Используется только для clone. После clone — git remote set-url origin без токена.
5.4 Альтернатива: deploy key. install.sh генерирует SSH key pair, показывает public key, просит добавить в GitHub repo Settings → Deploy Keys. Менее удобно но безопаснее.
5.5 Выбор: для первой версии — HTTPS + token (проще). Deploy key — v2.
5.6 git_snapshot.

PHASE 6: Secrets + .env.local
6.1 Генерация всех секретов через openssl rand.
6.2 VAPID keys через npx web-push generate-vapid-keys --json.
6.3 Записать .env.local с ВСЕМИ переменными:
NODE_ENV, PROJECT_ROOT, CLIENT_DOMAIN, NEXT_PUBLIC_CLIENT_DOMAIN,
NEXT_PUBLIC_CLIENT_NAME, MCP_AUTH_TOKEN, TOTP_SECRET,
ADMIN_SESSION_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL,
OPERATOR_TOKEN, OPERATOR_URL, INSTANCE_ID,
IAM_CLIENT_NAME, IAM_PROCESS_NAME, NEXT_PUBLIC_ADMIN_PATH,
NEXT_PUBLIC_SKIP_LANDING (если --no-landing)
6.4 git_snapshot.

PHASE 7: Nginx (закрытие GAP #2 — SSL конфликты)
7.1 Создать конфиг /etc/nginx/sites-available/iam.{DOMAIN}.
7.2 ПЕРЕД созданием — проверить:
bash# Нет ли уже конфига для этого домена
if [ -f "/etc/nginx/sites-available/$DOMAIN" ] || [ -f "/etc/nginx/sites-available/iam.$DOMAIN" ]; then
  echo "⚠️ Nginx config for $DOMAIN already exists"
  read -p "Overwrite? (y/N): " confirm
fi
7.3 nginx -t после создания — если syntax error → откат конфига.
7.4 Certbot: проверить что домен A-запись указывает на этот IP. Если нет — skip SSL с warning.
bashRESOLVED_IP=$(dig +short $DOMAIN)
SERVER_IP=$(curl -s ifconfig.me)
if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
  echo "⚠️ Domain $DOMAIN points to $RESOLVED_IP, not $SERVER_IP"
  echo "   SSL skipped. Configure DNS first, then run: certbot --nginx -d $DOMAIN"
fi
7.5 git_snapshot.

PHASE 8: Build + PM2 + Healthcheck
8.1 npm install --production=false + npm run build.
8.2 Создать ecosystem.config.js с name: 'iam.{CLIENT_NAME}', port: {PORT}.
8.3 pm2 start + pm2 save + pm2 startup.
8.4 Healthcheck: sleep 15 → curl localhost:PORT → если не 200 → показать pm2 logs → exit 1.
8.5 git_snapshot.

PHASE 9: Crons (heartbeat + activity + backup)
9.1 Heartbeat cron — каждые 5 мин.
9.2 Activity push cron — каждые 5 мин.
9.3 Backup cron — каждый день в 3:00 AM:
bash# iam.client daily backup
0 3 * * * /var/www/iam.client/scripts/iam-backup.sh >/dev/null 2>&1
9.4 Создать scripts/iam-backup.sh:
bash#!/bin/bash
BACKUP_DIR="INSTALL_PATH/backups"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/backup-$(date +\%Y\%m\%d).tar.gz" \
  --exclude=node_modules --exclude=.next --exclude=backups \
  -C "INSTALL_PATH" .
# Keep only last 7
ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null
9.5 Все crons с комментарием # iam.client для идентификации.
9.6 git_snapshot.

PHASE 10: Project symlink (закрытие GAP #4)
10.1 Если --project-path указан:
bashif [ -n "$PROJECT_PATH" ] && [ -d "$PROJECT_PATH" ]; then
  ln -sf "$PROJECT_PATH" "$INSTALL_PATH/project"
  echo "✅ Project linked: $PROJECT_PATH → $INSTALL_PATH/project"
fi
10.2 Если не указан — спросить интерактивно:
Where is the client's project? (e.g. /var/www/html)
Leave empty to skip: _
10.3 После symlink — Dev Console увидит project/ в file tree.
10.4 git_snapshot.

PHASE 11: Register + Summary
11.1 POST на iamrunning.online/api/monitor/register (если endpoint существует, иначе skip с warning).
11.2 INSTALL_COMPLETE=true — отключает rollback trap.
11.3 Summary box с URL, admin panel, MCP, порт, PM2 name, что делать дальше.
11.4 git_snapshot.

PHASE 12: --update mode (закрытие GAP #3 — data migration)
12.1 Если --update — другой flow:
1. Проверить что INSTALL_PATH/.env.local существует
2. Автоматический backup (iam-backup.sh)
3. Сохранить текущую версию: OLD_VERSION=$(node -e "console.log(require('./package.json').version)")
4. git stash (если есть локальные изменения)
5. git pull
6. npm install (если package.json изменился)
7. rm -rf .next && npm run build
8. pm2 restart iam.{CLIENT_NAME}
9. Healthcheck
10. Если fail → rollback: git checkout HEAD~1, rebuild, restart
11. Если success → NEW_VERSION check. Если major version changed → warning "check data migration"
12.2 НЕ трогать: .env.local, data/, memory/TEAM_ROLES.md, logs/, backups/.

PHASE 13: Operator API endpoint
13.1 Создать app/api/operator/route.ts:

GET → action=status: сервер статус (uptime, RAM, disk, version, last_activity, team_count)
GET → action=logs: последние 100 строк activity.jsonl
POST → action=update: git pull + build + restart (с rollback)
POST → action=restart: pm2 restart
Auth: Bearer OPERATOR_TOKEN
Если OPERATOR_TOKEN не в .env.local → 403

13.2 git_snapshot.

PHASE 14: --no-landing в app/page.tsx
14.1 Добавить проверку в app/page.tsx:
tsxconst skipLanding = process.env.NEXT_PUBLIC_SKIP_LANDING === 'true';
if (skipLanding) {
  // рендерить форму логина (token input) как в dashboard login
  // без лендинга, без hero, без CTA
}
14.2 git_snapshot + deploy.

PHASE 15: Тестирование
15.1 bash -n scripts/iam-client.sh — синтаксис.
15.2 Тест на iamrunning.online (185.5.55.111):
bash./scripts/iam-client.sh \
  --domain=demo.iamrunning.online \
  --name=Demo \
  --github=ArielGrook/iam-client-os \
  --port=4741 \
  --project-path=/var/www/i_am_running \
  --no-landing
15.3 Чеклист:

 iamrunning.online на порту 3000 работает
 demo.iamrunning.online на порту 4741 работает
 /iam.admin показывает TOTP setup (label "IAM Client OS")
 Dev Console видит project/ (файлы iamrunning.online)
 PM2 list показывает оба процесса
 nginx -t → ok
 Heartbeat cron в crontab
 Backup cron в crontab
 activity.jsonl пишется

15.4 Если что-то сломалось → фикс → повторный тест.

Зависимости между phases
PHASE 0-1 (скелет) → PHASE 2 (args) → PHASE 3 (resources+trap)
  → PHASE 4 (detect+deps+security) → PHASE 5 (clone)
  → PHASE 6 (secrets) → PHASE 7 (nginx) → PHASE 8 (build+pm2)
  → PHASE 9 (crons+backup) → PHASE 10 (symlink)
  → PHASE 11 (register+summary)
  
PHASE 12 (--update) — независимый, пишется после основного flow
PHASE 13 (operator API) — независимый, отдельный файл
PHASE 14 (--no-landing) — независимый, отдельный файл
PHASE 15 (тест) — после всего
