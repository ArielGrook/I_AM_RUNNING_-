# Operator Dashboard — Полная спецификация

**Дата:** 12.04.2026 | **Статус:** Концепт, утверждён Ariel
**Расположение:** iamrunning.online → Admin Panel → таб "Servers"

---

## Философия
Единая точка контроля всех клиентских инстансов: мониторинг, обновления, биллинг, доступ.

## Карточка проекта — 6 табов
1. **Overview** — домен, IP, VPS, версия, uptime, server stats
2. **Team** — пользователи, роли, токены, activity score
3. **Access** — SSH, GitHub, MCP URL, operator token, TOTP
4. **Activity** — лог событий (PR/deploy/tasks/messages/errors)
5. **Updates** — версии, Push Update, changelog, rollback
6. **Billing** — план, setup/monthly, payments, Stripe

## Протокол
- Heartbeat: каждые 5 мин (server) / 15 мин (local)
- Activity push: дельта событий каждые 5 мин
- Update push: iamrunning.online → клиент через /api/operator/update

## Два типа инстансов
- **Server (IAM Client OS):** полный доступ, SSH, push updates
- **Local (iamrunning.ai):** License API, heartbeat, auto-updater

## Privacy
Messages content НЕ передаётся. Код НЕ передаётся. AI chat НЕ передаётся. Credentials AES-256.

## Supabase таблицы
instances, instance_team, instance_activity, instance_billing, instance_payments, instance_updates

## install.sh добавляет
1. OPERATOR_TOKEN в .env.local
2. /api/operator/* endpoints (status, update, restart, logs)
3. Heartbeat cron (*/5 * * * *)
4. Activity push cron
5. Авто-регистрация на iamrunning.online

**Полная спека с JSON schemas:** lego-base: IDEAS/concepts/OPERATOR_DASHBOARD_SPEC.md
