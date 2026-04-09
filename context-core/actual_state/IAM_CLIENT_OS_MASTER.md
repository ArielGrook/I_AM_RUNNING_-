# IAM-CLIENT-OS — Team Workspace
*Продукт платформы I AM RUNNING | Версия: 1.0 | Обновлён: 08.04.2026*

> **⚠️ Это не отдельный бизнес.** iam-client-os — это Team Workspace, один из продуктов платформы **I AM RUNNING** (iamrunning.online). Разрабатывается на отдельном сервере ради удобства. Продаётся под брендом I AM RUNNING.

---

## Что это и зачем

Операционная система для команды с AI в центре. Вместо Jira+Slack+GitHub — одна система через Claude+MCP.

**Иерархия:**
```
Super Admin (Ariel) — SSH only, невидим
    └── Admin — управляет командой
            └── Workers: Developer | Reviewer | Marketer
```

**Три петли workflow:**
1. Таски: Admin создаёт → Worker берёт → PR → Admin approve
2. Pull Requests: Worker → Reviewer review → Admin финально
3. Сообщения: WhatsApp-стиль + push уведомления

---

## Техстек

- Next.js 15.5, TypeScript, PM2, Nginx
- MCP Server v2.0 — протокол для AI агентов
- Web Push API + VAPID — push уведомления
- **Сервер:** 185.5.55.111 → `/var/www/iam-os`
- **Домен:** test.lego-base.online (тест), lego-base.online (клиент)
- **GitHub:** ArielGrook/iam-client-os

## Как работать

**Коннектор:** `lego-base` — всегда начинай с `read_memory`
**Deploy:** MCP `deploy` (нужен git snapshot <5 мин)
**⚠️ Упал:** `ssh root@185.5.55.111` → `rm -rf .next && npm run build && pm2 restart iam-os`

---

## Статус (08.04.2026) — 96% готов

**Готово ✅**
- Workflow (таски → PR → сообщения → push)
- Admin Panel + Dashboard (все роли)
- Pull Pool с diff/approve/deploy, reviewer workflow
- Messaging V2 + Push уведомления
- Dev Console (edit-then-submit, permissions по ролям)
- Persistent sessions, Security 14/14, Mobile responsive

**Осталось:**
- 🔴 Scope system — reports_to, admin видит только своих workers
- 🔴 Маркетер роль — отдельная система
- 🟡 Brother + Uncle онбординг
- 🟡 Bootstrap prompts, Backup система

---

## Команда (тестовые аккаунты)

| Имя | Роль |
|-----|------|
| Aliks | Admin |
| Steve | Developer |
| Troy | Reviewer |
| Gooner | Marketer (планируется клиент) |

---

## Ключевые файлы

| Что | Файл |
|-----|------|
| Закон системы | `source-of-truth/WORKER_MECHANICS.md` |
| Роли и токены | `memory/TEAM_ROLES.md` |
| PR логика | `app/api/dashboard/lib/pr-handlers.ts` |
| MCP инструменты | `app/api/mcp/lib/tools/` |
| Стратегия | `IDEAS/main_workflow/` |

---

## Монетизация

- Phase 1: $0 setup, $300/mo Solo, $200/person/mo Team
- Phase 2: $2-5k setup + $500-800/mo
- Канал: Upwork — команды которым нужна AI автоматизация

---

## Правила

1. `read_memory` первым в каждой сессии
2. `git_snapshot` перед `deploy`
3. `rm -rf .next` перед `npm run build`
4. Никогда `.tsx` в `pull-pool/`
5. Все data операции через `lib/data/`
