# I AM RUNNING — Платформа
*Создан: 08.04.2026 | Читать первым в любой сессии*

---

## ⚠️ Главное — читай первым

**I AM RUNNING** — это платформа. Не website builder, не один продукт.
Всё что здесь разрабатывается — части одной платформы под одним брендом.
Продаётся с одного сайта: **iamrunning.online**

---

## Два формата одной платформы

```
I AM RUNNING
├── iamrunning.online   — веб-версия (этот сервер, 94.176.238.108)
└── iamrunning.ai       — десктоп-версия (в разработке как iamrunner.ai)
```

---

## Что входит в платформу

### 1. Website Builder
Создаёшь сайт с AI за минуты.
- **Door A** — wizard 7 шагов (для не-технарей)
- **Door B** — Craft.js visual editor (полный контроль)

### 2. Team Workspace (iam-client-os)
Операционная система для команды с AI в центре.
Разрабатывается на отдельном сервере (185.5.55.111) — **это удобство разработки, не отдельный бизнес**.
Устанавливается клиентам на их VPS через платформу.
Вся команда работает через Claude+MCP как основной интерфейс.

### 3. Desktop Client (iamrunner.ai → iamrunning.ai)
Electron приложение. Локальный AI (Ollama + Qwen) + MCP сервер + workspace клиент.
Сейчас называется iamrunner.ai в процессе разработки.
Когда будут все функции платформы — переименуется в **iamrunning.ai**.
**Это не отдельный продукт** — это десктоп версия I AM RUNNING.

---

## Воронка продаж

```
Клиент → Website Builder
    ↓ нужна команда
Team Workspace ($300/mo+)
    ↓ нужна мощь и приватность
Desktop Client ($1k+ entry)
    ↓ накопил датасет
Fine-tune модели ($49) → LoRA экспорт ($99-199)
```

---

## Структура сайта (план)

- **iamrunning.online** — главная страница платформы + блоки по каждому продукту
- **/builder** — лендинг Website Builder
- **/workspace** — лендинг Team Workspace
- **/desktop** — лендинг Desktop Client

---

## Инфраструктура

| Что | Где |
|-----|-----|
| Веб-версия (этот сервер) | 94.176.238.108 → `/var/www/i_am_running` |
| Team Workspace (разработка) | 185.5.55.111 → `/var/www/iam-os` |
| Desktop tunnel | iamrunner-ai.iamrunning.online |
| GitHub website builder | ArielGrook/I_AM_RUNNING_- |
| GitHub workspace | ArielGrook/iam-client-os |

---

## Как работать с этим сервером

```
Первым делом в новом чате:
read_file("context-core/PROGRESS.md")   ← текущее состояние
read_file("context-core/MAIN.md")       ← полный контекст
read_file("context-core/DEBUG_MAP.md")  ← при баге
```

**Коннектор:** `i am running`
**Deploy:** через MCP `deploy` tool или `git_snapshot` → pm2 restart
**⚠️ Продакшн с реальными клиентами**

---

*Этот файл — первое что должна прочитать любая нейронка подключившаяся к этому серверу.*
*Обновлять при смене стратегии или структуры платформы.*
