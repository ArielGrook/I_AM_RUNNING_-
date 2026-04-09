# I AM RUNNING — Платформа
*Версия: 1.1 | Обновлён: 08.04.2026*

---

## Главное

**I AM RUNNING** — это платформа. Всё продаётся под одним брендом.

**Два формата одной платформы:**

```
iamrunning.online  — веб-версия платформы
iamrunning.ai      — десктоп-версия платформы (в разработке как iamrunner.ai)
```

Веб и десктоп — это не разные продукты. Это два способа работать с одной платформой I AM RUNNING.

**Эволюция десктоп клиента:**
```
Сейчас:   iamrunner.ai — базовый десктоп клиент (MCP + Ollama + workspace)
Будущее:  iamrunning.ai — полная десктоп версия платформы со всеми функциями
```

**Внутренние части:**
- `iam-client-os` на 185.5.55.111 — Team Workspace бэкенд (часть платформы)
- `iamrunner.ai` локально на ПК — будущий iamrunning.ai

---

## Что входит в платформу

### 1. Website Builder
- **Door A** — wizard 7 шагов (для не-технарей)
- **Door B** — Craft.js visual editor (полный контроль)

### 2. Team Workspace (iam-client-os)
- Операционная система для команды с AI в центре
- Claude+MCP как основной рабочий интерфейс
- Задачи, PR, сообщения, цели — всё в одной системе
- Устанавливается на VPS клиента

### 3. Desktop Client (iamrunner.ai → iamrunning.ai)
- Electron приложение с локальным AI (Ollama + Qwen)
- MCP сервер для Cursor/Claude
- Knowledge Base — fine-tune на своих данных из интерфейса
- Offline-first

---

## Структура сайта (план)

- **iamrunning.online** — главная страница платформы + блоки по каждому продукту
- **/builder** — лендинг Website Builder
- **/workspace** — лендинг Team Workspace
- **/desktop** — лендинг Desktop Client

---

## Воронка продаж

```
Клиент → Website Builder
    ↓ нужна команда
Team Workspace ($300/mo+)
    ↓ нужна мощь и приватность
Desktop Client ($1k+ entry)
    ↓ накопил датасет
Fine-tune ($49) → LoRA экспорт ($99-199)
```

---

## Монетизация

| Продукт | Entry | Ongoing |
|---------|-------|---------|
| Website Builder | TBD | TBD |
| Team Workspace (Phase 1) | $0 | $300/mo Solo, $200/person Team |
| Team Workspace (Phase 2) | $2-5k | $500-800/mo |
| Desktop Client | **$1k+** | $100-200/user/mo |
| Fine-tune модели | $49 | — |
| LoRA экспорт | $99-199 | — |

---

## Статус (08.04.2026)

**Website Builder:** ✅ Работает. Есть клиенты. Stripe — в планах.
**Team Workspace:** ✅ 96% готов. Осталось: scope system, маркетер роль.
**Desktop Client:** 🔄 ~30%, 2 недели разработки. Следующее: RAG.

---

*I AM RUNNING — платформа. Продаётся с iamrunning.online.*
*iam-client-os и iamrunner.ai — части платформы, не отдельные бизнесы.*
