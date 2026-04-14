# install.sh + Onboarding Flow — Полная спецификация

**Дата:** 12.04.2026 | **Статус:** Спека утверждена, реализация — первый эшелон

---

## Философия
Оператор ставит систему и проверяет. Точка. Клиент сам настраивает команду.
Система как плагин — отдельная папка, свой порт, не ломает существующий сайт.

## Onboarding: 3 фазы
- **Фаза 0:** GitHub репо, invoice, Terms, SSH доступ
- **Фаза 1:** `install.sh --domain= --name= --github= --port=3100`
- **Фаза 2:** Проверка: URL, /admin, PM2, Nginx, SSL, heartbeat
- **Фаза 3 (клиент сам):** TOTP, аккаунты, токены, MCP, Product Tour

## install.sh — 11 шагов
0. Resources (≥1GB RAM, ≥5GB disk) + Rollback trap
1. Detect (Node/PM2/Nginx/fail2ban/UFW/certbot)
2. Deps (Node 20, PM2, Nginx, certbot)
3. Security (fail2ban 5 attempts/1h ban, UFW SSH+Nginx)
4. Clone (git clone в --path)
5. Secrets (MCP token, TOTP, VAPID, operator token → .env.local)
6. Nginx (reverse proxy + SSL, отдельный server block)
7. Build (npm install + npm run build)
8. PM2 (ecosystem.config.js, healthcheck 15s)
9. Crons (heartbeat + activity push каждые 5 мин)
10. Register (POST iamrunning.online/api/monitor/register)
11. Summary

## Флаги
--domain, --name, --github, --port (default 3100), --path (default /var/www/iam.client), --no-landing, --skip-security, --skip-nginx, --update, --admin-path

## iam. префикс на всём нашем
Папка: iam.client/, Nginx: iam.{domain}, PM2: iam.{clientname}, Cron: # iam.client

## Operator API (новый endpoint)
GET /status, POST /update, POST /restart, GET /logs — Bearer OPERATOR_TOKEN

## Update mode (--update)
Backup data/ → git pull → rebuild → restart → healthcheck → rollback if fail

**Полная спека с bash кодом:** lego-base: IDEAS/concepts/INSTALL_ONBOARDING_SPEC.md
