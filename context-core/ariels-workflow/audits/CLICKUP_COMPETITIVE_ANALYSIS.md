# ClickUp vs I AM RUNNING — Конкурентный анализ

**Status:** research
**Created:** 01.04.2026

---

## Что такое ClickUp

Проджект-менеджмент платформа. Основана в 2017, оценка $4B (Series C, 2021). 800,000+ команд.
Tasks + Docs + Chat + Whiteboards + Sprints + Gantt + AI — всё в одном.

**Pricing:** Free → $7/user/mo (Unlimited) → $12/user/mo (Business) → Enterprise (custom)

**AI (ClickUp Brain):** AI генерирует планы, суммаризирует, создаёт задачи из обсуждений. "Super Agents" — AI-агенты для спринт-планирования, аллокации ресурсов, документации. Купили Codegen (AI-кодер) в 2025.

**Клиенты:** Logitech, AT&T, Paramount, Mayo Clinic, Salesforce.

## Где ClickUp и мы ПОХОЖИ

| Функция | ClickUp | I AM RUNNING |
|---------|---------|-------------|
| Tasks + statuses | ✅ | ✅ |
| Goals + milestones | ✅ | ✅ |
| Team roles | ✅ | ✅ |
| Comments/chat | ✅ | ✅ (PR comments, messages) |
| Dashboard | ✅ | ✅ |
| AI integration | ✅ (ClickUp Brain) | ✅ (MCP + Claude/ChatGPT) |

## Где мы ПРИНЦИПИАЛЬНО ДРУГИЕ

| | ClickUp | I AM RUNNING |
|-|---------|-------------|
| **Модель** | SaaS платформа (ты заходишь к ним) | VPS per client (сервер принадлежит клиенту) |
| **AI** | Их AI, их модель, их данные | Любая нейросеть (Claude, ChatGPT, Gemini), данные на сервере клиента |
| **Код** | Закрытый | Клиент видит и может менять |
| **MCP** | Нет | Есть — прямое подключение AI к серверу |
| **Pull-pool** | Нет (нет code review workflow) | Есть — AI пишет код → ревью → approve → deploy |
| **Кому** | Все команды, все размеры | Dev teams + бизнесы с AI workflows |
| **Цена** | $7-12/user/mo | $300-800/mo per server (managed) |
| **MCP fine-tune** | Нет | Есть — контроль поведения AI через MCP ответы |

## Наши конкурентные преимущества

### 1. AI-NATIVE, не AI-added
ClickUp добавил AI в 2023 поверх существующего PM инструмента. Мы строим систему ГДЕ AI — ОСНОВНОЙ СПОСОБ ВЗАИМОДЕЙСТВИЯ. Воркер подключает Claude → MCP → работает. Не "кликни кнопку чтоб AI помог" а "AI = интерфейс".

### 2. Private server = data sovereignty
ClickUp = облако, данные у них. Мы = VPS клиента. Для компаний с чувствительными данными это критично.

### 3. Code workflow built-in
ClickUp — для PM. Мы — для dev teams с code review. Pull-pool, approve+deploy, diff view — это GitHub-like workflow ВНУТРИ PM.

### 4. MCP fine-tune
Ни один конкурент не умеет управлять поведением AI через MCP. Это уникальная возможность.

### 5. Managed service, not SaaS
Мы не продаём подписку — мы настраиваем, деплоим, поддерживаем. Higher touch, higher value.

## Где ClickUp сильнее (объективно)

- **Масштаб и зрелость** — 7 лет vs наш MVP
- **Интеграции** — 1000+ интеграций vs наши MCP tools
- **UI polish** — мощный UI с 15+ views, Gantt, Kanban vs наш минималистичный dashboard
- **Non-dev teams** — маркетинг, HR, операции. Мы фокусируемся на dev/AI teams
- **Free tier** — бесплатный план с unlimited users. У нас нет

## Как конкурировать

### НЕ пытаться быть "ClickUp но лучше". Они в 100,000 раз больше.

### Вместо этого:
1. **Ниша: AI-native dev teams** — кто уже использует Claude/ChatGPT для кодинга, но хочет структуру
2. **Selling point: "Your server, your AI, your rules"** — private, managed, AI-first
3. **Upwork channel** — малый бизнес ищущий AI integration = наш ICP
4. **Demo effect** — показать как AI-воркер берёт задачу, пишет код, создаёт PR, получает ревью = wow-эффект
5. **Price anchor** — не "$7/user/mo как ClickUp" а "$300/mo за AI-powered dev workspace с поддержкой" = другая категория

---

*Записано: 01.04.2026*
