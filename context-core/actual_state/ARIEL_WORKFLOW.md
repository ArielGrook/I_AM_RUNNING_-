# ARIEL'S MASTER WORKFLOW
*v2.0 | 08.04.2026 | Отправляй нейросетям в начале сессии*

> **Главное что нужно понять:** Есть одна платформа — **I AM RUNNING** (iamrunning.online). У неё два формата: веб (iamrunning.online) и десктоп (iamrunning.ai, сейчас в разработке как iamrunner.ai). Внутри платформы есть отдельные части которые разрабатываются на разных серверах ради удобства разработки — это **не отдельные бизнесы и не отдельные бренды**.

## ⚠️ Как не запутаться (читай первым)

Если ты нейронка и работаешь с этим проектом — запомни три вещи:

1. **Один бренд:** всё называется **I AM RUNNING**. Не "iam-client-os", не "iamrunner.ai" — это внутренние технические названия. Клиент видит только I AM RUNNING.

2. **iam-client-os — не отдельный продукт.** Это Team Workspace, часть платформы. Разрабатывается на сервере 185.5.55.111 ради удобства. Продаётся как функция I AM RUNNING, не как отдельный бизнес.

3. **iamrunner.ai — не отдельный продукт.** Это десктоп клиент платформы в процессе разработки. Когда будет готов полностью — переименуется в **iamrunning.ai**. Продаётся как десктоп версия I AM RUNNING.

---

## Два формата одной платформы

```
I AM RUNNING
├── iamrunning.online   — веб-версия (этот сервер, 94.176.238.108)
└── iamrunning.ai       — десктоп-версия (в разработке как iamrunner.ai)
```

### Веб-версия: iamrunning.online
**Сервер:** 94.176.238.108 → `/var/www/i_am_running`
**Коннектор:** `i am running`
**Deploy:** `npm run build && pm2 restart all`
**⚠️ Продакшн с клиентами**

### Team Workspace бэкенд: iam-client-os
**Сервер:** 185.5.55.111 → `/var/www/iam-os`
**Коннектор:** `lego-base` — начинай с `read_memory`
**Deploy:** MCP `deploy` tool (нужен git snapshot <5 мин)
**⚠️ Упал:** `ssh root@185.5.55.111` → `rm -rf .next && npm run build && pm2 restart iam-os`

### Десктоп клиент: iamrunner.ai (→ iamrunning.ai)
**Запуск:** `cloudflared tunnel run iamrunner` + `npm run dev` + Start Server
**Туннель:** iamrunner-ai.iamrunning.online
**Код:** Cursor + MCP коннектор iamrunner-ai

---

## Твоя роль: Mastermind

| Задача | Инструмент |
|--------|------------|
| Архитектура, стратегия | Claude — extended thinking |
| Код iam-client-os | Claude коннектор **lego-base** |
| Код iamrunning.online | Claude коннектор **i am running** |
| Код iamrunner.ai | Cursor + MCP |
| Брейншторм | Gemini |

---

## Правила которые нельзя нарушать

1. Три сервера — три разные машины. Коннекторы не смешивать.
2. `rm -rf .next` перед `npm run build` на iam-client-os
3. `git_snapshot` перед `deploy` (<5 мин)
4. Никогда `.tsx` в `pull-pool/` — Next.js компилирует и падает
5. `read_memory` первым в каждой сессии lego-base
6. Cursor НЕ думает — только исполняет готовый план от Opus

---

## Быстрый старт

**iam-client-os:** Claude → lego-base → `read_memory` → работай
**iamrunner.ai:** tunnel + npm run dev + Start Server → Cursor для кода
**iamrunning.online:** SSH 94.176.238.108 → pm2 restart all
