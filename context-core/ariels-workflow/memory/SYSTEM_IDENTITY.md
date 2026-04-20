---
version: 4
last_updated: "2026-04-08T00:00:00Z"
updated_by: "claude"
schema: "system_identity_v1"
required_fields: ["business_name", "business_type", "owner_name"]
business_name: "I AM RUNNING"
business_type: "AI Native Business Platform"
owner_name: "Ariel"
primary_language: "en"
tech_stack: ["next.js 15.5.14", "typescript", "pm2", "nginx", "mcp"]
mcp_url: "https://test.lego-base.online/api/mcp"
---

# System Identity

## ⚠️ Важно — читай первым

Этот сервер (test.lego-base.online) — это **Team Workspace**, один из продуктов платформы **I AM RUNNING** (iamrunning.online).

Это **не отдельный бизнес** и не отдельный бренд. Разрабатывается на отдельном сервере ради удобства разработки. Продаётся под брендом I AM RUNNING.

**Платформа I AM RUNNING = три части:**
```
iamrunning.online       — веб-версия платформы (Website Builder + Team Workspace)
iam-client-os           — Team Workspace бэкенд (этот сервер, часть платформы)
iamrunner.ai            — десктоп клиент (в разработке, будет iamrunning.ai)
```

---

## Что такое этот сервер

**Название продукта:** Team Workspace (I AM RUNNING)
**Внутреннее название:** iam-client-os
**Домен тест:** https://test.lego-base.online
**Домен клиентский:** lego-base.online
**Платформа:** I AM RUNNING (iamrunning.online)
**Owner:** Ariel
**VPS:** Time4VPS, IP 185.5.55.111, Ubuntu 24.04
**Installed:** 2026-03-27

Team Workspace — операционная система для команды с AI в центре.
Каждый член команды работает через Claude+MCP как основной рабочий интерфейс.
Задачи, Pull Requests, сообщения, цели — всё в одной системе.

---

## Иерархия ролей

```
Super Admin (Ariel) — SSH only, невидим в системе
    └── Admin — управляет командой, /admin panel
            └── Workers: Developer | Reviewer | Marketer
```

---

## Deployment

```bash
# На сервере:
cd /var/www/iam-os
git checkout -- .    # ОБЯЗАТЕЛЬНО перед pull
git pull origin main
rm -rf .next && npm run build && pm2 restart iam-os
```

**Правила:**
- `git checkout -- .` перед `git pull` — иначе merge fails
- `rm -rf .next` перед `npm run build` — иначе stale cache
- PM2 env живёт в ecosystem.config.js (next start НЕ читает .env.local)

---

## Key Files

- `.env.local` — все секреты (CLIENT_DOMAIN, TOTP_SECRET, MCP токены)
- `ecosystem.config.js` — PM2 конфиг
- `memory/` — persistent state системы
- `source-of-truth/WORKER_MECHANICS.md` — закон workflow
- `IDEAS/main_workflow/` — стратегические документы платформы

---

*Updated: 08.04.2026*
