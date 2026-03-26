# I AM RUNNING — ROADMAP v9.0 (ЖИВОЙ ДОКУМЕНТ)

## Последнее обновление: 26.03.2026
## Версия: 9.0 (Three Products Era + AI Business OS + Opus Review)

**Философия:** Stop Chasing, Start Running.
**UX:** Mobile-First. Пользователь выбирает из вариантов (кнопки), а не пишет промпты.
**Позиционирование:** I AM RUNNING — платформа с тремя продуктами, не просто website builder.

---

# CHANGELOG v8.0 → v9.0

## Почему v9

Roadmap v8 (21.03.2026) зафиксировал MCP Era и расширение компонентов. За следующие 5 дней (21–26.03.2026) произошёл стратегический поворот: I AM RUNNING перестал быть только website builder и стал платформой с тремя продуктами. AI Business OS (iam-client-os) создан как изолированный продукт, протестирован, и признан fastest path to revenue. Полное ревью архитектуры с Opus зафиксировало 7 ключевых решений.

**Критическое отличие v9 от v8:** v8 не знал о существовании iam-client-os. v9 — первый roadmap, который отражает реальную структуру платформы: три продукта под одной крышей.

## Ключевые изменения v8 → v9

### 1. Три продукта, не один
I AM RUNNING = Interactive (Door A) + Editor (Door B) + AI Business OS (Door C). Общая инфраструктура, разные аудитории, разные revenue streams.

### 2. AI Business OS — новый продукт (fastest path to revenue)
Изолированное приложение на отдельном VPS клиента. MCP сервер → Claude/ChatGPT/Gemini подключаются к проекту. memory/ с YAML frontmatter как persistent AI память. Уже работает (мы через него разрабатываем I AM RUNNING). Ближе к первым деньгам чем Stripe для website builder.

### 3. Мультитенантность Option A (для legacy-клиентов)
Один PM2 процесс, Nginx X-Client-Slug per domain, *.lego-base.online wildcard SSL. install-client.sh v3. Тестовый клиент follin.lego-base.online работает. Но основная стратегия — изолированный iam-client-os.

### 4. Архитектурные решения из Opus ревью (26.03.2026)
- YAML frontmatter в memory/ файлах (машинно-читаемые заголовки)
- Watchdog — 3 уровня защиты memory/ (cron + git hooks + daily backup)
- Sandboxing MCP на уровне кода (не текстовых правил)
- Монетизация: $0 setup для первых клиентов, $200–500/мес
- Demo-видео tunnel на лендинге
- Аудитория: и разработчики, и бизнес — один лендинг, разные секции

### 5. Context Core: 11 → 19+ документов
Добавлены: IAM_CLIENT_OS_PLAN.md, MVP_HAPPY_PATH.md, и другие операционные документы.

### 6. Полный прайс-лист восстановлен + добавлен AI Business OS
Всё ценообразование в одном месте. Источник истины. Не сокращать между версиями.

## Статусы

| Маркер | Значение |
|--------|----------|
| ✅ | **Выполнено** — работает в production |
| 🟡 | **Частично** — основа работает, незакрытые пункты |
| 📋 | **Согласовано** — требования заморожены, код не написан |
| ❌ | **DEPRECATED** |
| 🆕 | **Новое** — не было в предыдущих версиях |

---

# АРХИТЕКТУРА: ТРИ ПРОДУКТА — ОДНА ПЛАТФОРМА

```
            ┌──────────────────────────────────┐
            │          ОБЩАЯ БАЗА              │
            │  - 18 Tron компонентов           │
            │  - Assembler (block→component)    │
            │  - SiteRenderer.tsx (SSR)        │
            │  - ThemeContext                   │
            │  - Supabase (DB+Auth+Storage)    │
            │  - MCP Connector (12 tools)      │
            │  - Context Core (19+ docs)       │
            │  - Dev Console (built-in IDE)    │
            └───────────┬──────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
┌────────────────┐ ┌────────────┐ ┌──────────────────┐
│  ИНТЕРАКТИВ    │ │  РЕДАКТОР  │ │  AI BUSINESS OS  │
│  (Дверь А)     │ │  (Дверь Б) │ │  (Дверь В) 🆕    │
│                │ │            │ │                  │
│ 4-шаговый      │ │ Craft.js   │ │ iam-client-os    │
│ wizard         │ │ visual     │ │ MCP + memory/    │
│ 12 color       │ │ editor     │ │ Tunnel агент     │
│ presets        │ │            │ │ Bootstrap промт  │
│ Assembler→SSR  │ │ Mobile     │ │ Admin панель     │
│                │ │ Editor     │ │                  │
│ Массовый рынок │ │ Фрилансеры │ │ Разработчики +   │
│ $60–$1,199     │ │ $199–$999  │ │ Бизнес           │
│                │ │ /мес       │ │ $200–$700/мес    │
└────────────────┘ └────────────┘ └──────────────────┘
```

---

# ЦЕНООБРАЗОВАНИЕ (ВСЁ В ОДНОМ МЕСТЕ)

> ⚠️ ПОЛНЫЙ ПРАЙС-ЛИСТ ВСЕЙ ПЛАТФОРМЫ. Источник истины. Не сокращать между версиями роадмапа.

Округление: USD — как есть | ILS — агрессивное вверх | RUB — агрессивное вверх

---

## 1. AI BUSINESS OS (Дверь В) 🆕

### Beta-фаза (первые 2-3 клиента)

| | USD | Примечание |
|--|-----|-----------|
| Setup fee | **$0** | Подарок. Снижаем барьер входа до нуля |
| Monthly | **$200–500/мес** | Зависит от сложности проекта клиента |
| Tunnel setup | Включено | Часть онбординга |

Позиционирование: "Посмотрите сколько стоят такие платформы на рынке. Это подарок."
Цель: feedback + кейсы для портфолио + первый revenue.

### Growth-фаза (после 3+ клиентов с кейсами)

| | USD |
|--|-----|
| Setup fee | $300–500 |
| Monthly | $300–500/мес |
| Tunnel setup | +$200 |

### Scale-фаза (после 10+ клиентов)

| | USD |
|--|-----|
| Setup fee | $500–2,000 |
| Monthly | $300–700/мес |
| Tunnel setup | +$200 |

**Что платит клиент сам (не нам):**
- VPS: Hetzner CX22 — €4/мес
- AI: Claude Pro $20/мес и/или ChatGPT Plus $20/мес и/или Gemini $20/мес (на выбор клиента)

---

## 2. Интерактив (Дверь А) — Пакеты сайтов

| Пакет | USD | ILS | RUB | Описание |
|-------|-----|-----|-----|----------|
| Landing | $60 | 300₪ | 6,000₽ | Одностраничник, 6–7 блоков |
| Launch | $249 | 1,000₪ | 25,000₽ | E-commerce базовый |
| Growth | $599 | 2,500₪ | 60,000₽ | E-commerce + аналитика |
| Shark | $1,199 | 5,000₪ | 120,000₽ | Premium: AI + автоматизация |

**Скидка за баннер:** −25% от стоимости сайта (sticky баннер "I AM RUNNING" внизу).

---

## 3. Метод получения (после покупки сайта)

| Метод | USD | ILS | RUB | Что |
|-------|-----|-----|-----|-----|
| DIY (ZIP download) | +$0 | +0₪ | +0₽ | Сам деплоишь |
| Managed Deploy | +$10 | +40₪ | +800₽ | Мы деплоим VPS + домен + SSL |
| Full Service | +$30 | +100₪ | +2,000₽ | Deploy + настройка Supabase, Stripe |

> ZIP только после оплаты. Без логики платформы, системных ключей, промптов.

---

## 4. Hosting (monthly, ПЕРВЫЙ МЕСЯЦ FREE)

| Tier | USD | ILS | RUB | Для кого |
|------|-----|-----|-----|----------|
| Starter | $20/мес | 100₪/мес | 2,000₽/мес | До 100 юзеров, 50 товаров, 10 одновременных |
| Business | $29/мес | 200₪/мес | 3,000₽/мес | До 1,000 юзеров, 500 товаров, 50 одновременных |
| Pro | $59/мес | 300₪/мес | 6,000₽/мес | До 10,000 юзеров, 5,000 товаров, 200 одновременных |
| Enterprise | $99/мес | 500₪/мес | 10,000₽/мес | Безлимит, 1,000 одновременных |

Сайт НЕ падает при превышении → email с auto-upgrade предложением.

---

## 5. Security

| Level | USD | ILS | RUB | Описание |
|-------|-----|-----|-----|----------|
| Level 1 | Included | Included | Included | SSL, firewall. Во ВСЕ сайты |
| Level 2 | +$30 | +150₪ | +3,000₽ | Авто при Auth/Payment |
| Level 3 | +$150 | +750₪ | +15,000₽ | Аудит, мониторинг, WAF |

---

## 6. Backend блоки — полный прайс-лист

| Блок | USD | ILS | RUB |
|------|-----|-----|-----|
| Contact Form | $25 | 125₪ | 2,500₽ |
| Callback Form | $20 | 100₪ | 2,000₽ |
| Newsletter | $40 | 200₪ | 4,000₽ |
| SEO Optimization | $40 | 200₪ | 4,000₽ |
| User Auth | $40 | 200₪ | 4,000₽ |
| Google OAuth | $25 | 125₪ | 2,500₽ |
| Social Auth Pack | $50 | 250₪ | 5,000₽ |
| Product Catalog | $60 | 300₪ | 6,000₽ |
| Shopping Cart | $40 | 200₪ | 4,000₽ |
| Checkout | $35 | 175₪ | 3,500₽ |
| Stripe Payment | $80 | 400₪ | 8,000₽ |
| PayPal Payment | $60 | 300₪ | 6,000₽ |
| Payment Pack (Stripe+PayPal) | $120 | 600₪ | 12,000₽ |
| Reviews/Ratings | $60 | 300₪ | 6,000₽ |
| Trustpilot Reviews (widget) | $25 | 125₪ | 2,500₽ |
| User Dashboard | $60 | 300₪ | 6,000₽ |
| Wishlist | $40 | 200₪ | 4,000₽ |
| Order Tracking (ручной) | $35 | 175₪ | 3,500₽ |
| Order Tracking (авто) | $120 | 600₪ | 12,000₽ |
| FAQ Accordion (с админкой) | $25 | 125₪ | 2,500₽ |
| Live Chat (Tawk.to/Crisp) | $60 | 300₪ | 6,000₽ |
| Booking (Calendly widget) | $35 | 175₪ | 3,500₽ |
| Booking (своя система) | $70 | 350₪ | 7,000₽ |
| Google Map | $20 | 100₪ | 2,000₽ |
| Admin Panel Basic | $40 | 200₪ | 4,000₽ |
| Admin Panel E-commerce | $70 | 350₪ | 7,000₽ |
| DB Simple | $40 | 200₪ | 4,000₽ |
| DB Medium | $70 | 350₪ | 7,000₽ |
| DB Advanced | $120 | 600₪ | 12,000₽ |
| AI Chatbot | $150 | 750₪ | 15,000₽ |
| Google Analytics | $30 | 150₪ | 3,000₽ |
| Google Ads Setup | $50 | 250₪ | 5,000₽ |
| Facebook Pixel | $40 | 200₪ | 4,000₽ |
| Marketing Ready Pack | $120 | 600₪ | 12,000₽ |

---

## 7. Домены

| Extension | USD | ILS | RUB |
|-----------|-----|-----|-----|
| .com | $12/год | 60₪/год | 1,200₽/год |
| .net | $15/год | 75₪/год | 1,500₽/год |
| .org | $16/год | 80₪/год | 1,600₽/год |
| Subdomain iamrunning.online | FREE | FREE | FREE |
| Свой домен (подключить) | FREE | FREE | FREE |

---

## 8. Редактор (Дверь Б) — подписки фрилансеров

| Plan | USD | ILS | RUB | Проекты | Backend | AI Code Gen | Trial |
|------|-----|-----|-----|---------|---------|-------------|-------|
| Frontend | $199/мес | 1,000₪/мес | 20,000₽/мес | 3 | Скидка 25% | ❌ | 3 дня |
| Full Stack | $599/мес | 3,000₪/мес | 60,000₽/мес | 5 | 6 включены + скидка 30% | ❌ | 3 дня |
| Professional | $999/мес | 5,000₪/мес | 100,000₽/мес | 10 | Все включены | ✅ 20 msg/day | 3 дня |

**Full Stack включает:** Contact Form + User Auth + Product Catalog + Cart + Checkout + Stripe = $280 value
**Professional включает:** Всё из Full Stack + Newsletter + SEO + Reviews + Dashboard + Wishlist + AI Chatbot + Order Tracking = $790 value

**3-дневный Trial:** привязка карты (без списания) → полный доступ 3 дня → автосписание. Отмена до конца = без списания.

---

## 9. AI бюджеты

| Фича | Провайдер | Модель | Бюджет | Доступ |
|------|-----------|--------|--------|--------|
| Support Chat | OpenAI | GPT-4o-mini | $10/мес | Все (включая анонимов) |
| Code Generator | Anthropic | Claude 3.5 Sonnet | $5/мес | Только Professional ($999) |

---

## 10. Ранги фрилансеров

| Ранг | Клиентов | Плюшки |
|------|----------|--------|
| 🥉 Starter | 0–4 | — |
| 🥈 Builder | 5–14 | −15% на план, бейдж |
| 🥇 Pro | 15–29 | −50% на план, приоритет поддержки |
| 💎 Elite | 30+ | Бесплатный план, ранний доступ |

---

# ФИЧИ — TRACK 1: WEBSITE BUILDER (Interactive + Editor)

---

## ✅ F01: СХЕМА БД — ВЫПОЛНЕНО

8 таблиц в Supabase:

### profiles (users)
id, user_number SERIAL, email, full_name, avatar, account_type CHECK ('regular', 'freelancer')
**role INTEGER CHECK (0..7)** — Role System v2
agency_id UUID (AgencyEmployee → AgencyOwner), trial_expires_at
freelancer_tier, freelancer_status, freelancer_trial_ends_at, freelancer_subscription_id
referral_code UNIQUE, referred_by, freelancer_rank, current_discount_percent, display_name
ai_requests_today, ai_requests_limit DEFAULT 20, created_at, updated_at

### projects
id, project_number SERIAL, user_id, name, description, thumbnail
source CHECK ('interactive', 'editor'), status CHECK ('draft', 'paid', 'deployed', 'expired')
preview_token UUID UNIQUE DEFAULT gen_random_uuid()
contract JSONB — Living Project JSON v2 (для Интерактива)
**data JSONB** — `{ craft: { pages: [{ id, name, slug, desktopData (lz-string), mobileData }], activePageId } }`
backend_blocks JSONB, domain
has_promo_banner, discount_percent, original_price, final_price
deployment_strategy CHECK ('static', 'docker'), delivery_method CHECK ('managed', 'diy')
hosting_tier, hosting_status, first_month_free_used
seo_metadata JSONB, is_public, is_template

### components
id, block_type, variant_name, name, html, css, react_source, craft_config JSONB
style_tags TEXT[], business_tags TEXT[], feature_tags TEXT[]
is_premium, is_active, usage_count

### backend_blocks
id, slug UNIQUE, category, name_en/ru/he, description_en/ru/he
price, api_endpoints JSONB, env_vars_required TEXT[], files JSONB, icon

### payments
id, payment_number SERIAL, user_id, project_id
payment_type CHECK ('site_package', 'backend_block', 'deployment', 'hosting', 'freelancer_subscription', 'domain')
amount, currency CHECK ('usd', 'ils', 'rub'), stripe_payment_id, status, metadata JSONB

### freelancer_clients
id, freelancer_id, client_email, client_name, project_id, payment_link_token UNIQUE

### freelancer_referrals
id, referrer_id, referred_id, referral_type CHECK ('freelancer', 'client'), bonus_applied

### chat_insights (Shadow Mode)
id, session_id, user_id, anonymous_id, conversation_json JSONB, extracted_insights JSONB
language CHECK ('en', 'ru', 'he'), processed BOOLEAN DEFAULT false

**RLS:** users (свои), projects (свои + public), components (SELECT всем), backend_blocks (SELECT всем), payments (свои), chat_insights (только service role).

**One-Way Ejection паттерн:** данные из Интерактива (contract JSONB) трансформируются в формат редактора при "выталкивании" — обратная конвертация не нужна.

---

## ✅ F02: НАПОЛНЕНИЕ — ВЫПОЛНЕНО

### Стили (12 штук, в коде):
clear, dark, neon_futuristic, minimal, elegant, bold, soft, corporate, creative, playful, brutalist, glassmorphism

### Типы бизнеса (16 штук) с подтипами:

| Slug | Название | Подтипы |
|------|----------|---------|
| food | Еда | restaurant, cafe, delivery, bakery, food_truck |
| shop | Магазин | clothing, electronics, grocery, furniture, gifts |
| ecommerce | Интернет-магазин | fashion, digital, handmade, marketplace, dropshipping |
| startup | Стартап | saas, fintech, healthtech, edtech, ai |
| business_card | Визитка | freelancer, executive, consultant, artist, developer |
| portfolio | Портфолио | photographer, designer, developer, architect, writer |
| craft | Мастерство | photographer, woodworker, jeweler, painter, musician |
| beauty | Красота | salon, barbershop, spa, cosmetics, nails |
| health | Здоровье | fitness, clinic, wellness, yoga, nutrition |
| education | Образование | online_course, school, tutoring, workshop, academy |
| agency | Агентство | marketing, design, development, pr, recruitment |
| consulting | Консалтинг | management, finance, legal, hr, it |
| blog | Блог | personal, tech, lifestyle, travel, news |
| event | Мероприятия | wedding, corporate, festival, concert, conference |
| real_estate | Недвижимость | residential, commercial, luxury, rental, developer |
| travel | Туризм | tours, hotel, hostel, adventure, cruise |

### Палитры (16 штук, в коде):
**Solid (8):** Pure Black, Pure White, Black Red, Deep Blue, Light Blue, Fresh Green, Pink Orange, Royal Purple
**Gradient (8):** Sunset, Ocean, Forest, Night, Steel, Arctic, Fire, Lavender
Каждая: primary, secondary, accent, bg, text. Градиенты: 3–4 оттенка.

### Пресеты анимаций (10 штук):
None, Subtle, Elegant, Dynamic, Playful, Corporate, Bold, Smooth, Tech, Cinematic

### Color presets Interactive (12 штук):
Midnight Ember (#FF6B35 / #0a0a0a), Arctic Pulse (#00D4FF / #050d1a), Crimson Dark (#e11d48 / #0c0007), Forest Night (#22c55e / #061410), Violet Storm (#8b5cf6 / #0d0a1a), Solar Flare (#f59e0b / #100800), Rose Quartz (#ec4899 / #1a0912), Ocean Mist (#3b82f6 / #060d1a), Obsidian Gold (#d97706 / #0a0800), Cyber Lime (#84cc16 / #030a00), Pearl Minimal (#64748b / #0f0f0f), Coral Sunset (#f97316 / #0f0500).

---

## 🟡 F02.5: CRAFT.JS EDITOR CORE — ЧАСТИЧНО ВЫПОЛНЕНО

### ✅ Что работает:

**Core:** Craft.js DnD, EditableText (react-contenteditable), Undo/redo, Dual save desktopData + mobileData → Supabase JSONB, Viewport Desktop/768/375, Multi-page, Export JSON, Auto-save.

**Deploy:** Client site на *.iamrunning.online, SSR через SiteRenderer.tsx, Spotlight cursor (DOM ref), GSAP ScrollTrigger, мультистраничная навигация через window.dispatchEvent('iam_navigate'), SiteContext, лоадер с accentColor.

**Theme:** ThemeContext (accentColor + colorScheme), ColorPresetSync (живое обновление нод без перезагрузки Frame), 10 color presets + 12 Interactive presets, Dark/Light toggle на клиентских сайтах.

**Auth & Security:** injectSupabaseCredentials, Backend Auth миграции при Connect, Role System v2, httpOnly cookie admin auth, Rate limiting в middleware, Admin 404 + IP ban, CSP headers.

**UX:** Toast система, предупреждение при выходе, SEO метаданные, Component Writing Rules v2.

### 18 Tron компонентов:

| Компонент | block_type | Особенности |
|-----------|-----------|-------------|
| HeaderTron | header | Dropdown, avatar, previewLoggedIn |
| HeroTron | hero | Grid, static spotlight, GSAP |
| TronFeatures | features | |
| TronPortfolio | portfolio | |
| TronTestimonials | testimonials | Бесконечная карусель |
| TronPricing | pricing | |
| TronFAQ | faq | Аккордеон |
| TronFooter | footer | |
| TronContact | contact | |
| TronStats | stats | Count-up IntersectionObserver |
| TronShowcase | showcase | Tabbed контент |
| TronLogin | login | Auto-page creation |
| TronRegister | register | Auto-page creation |
| TronHub | user_dashboard | 5 секций, Supabase операции |
| TronAbout | about | Timeline, media, counters |
| TronCTA | cta | GSAP word stagger, magnetic buttons, split/centered |
| TronServices | services | 3 layouts, accordion, CTA per card, scroll reveal |
| TronTeam | team | 3D tilt, pulse ring, spotlight, dynamic socials (10), back button |

### ⚠️ Не реализовано:
- Delete Account (нет onClick в TronHub)
- Авто-reconnect бэкенда
- Layers Panel
- Gradient Builder (visual)
- Typography system
- Schema migration system, localStorage WAL
- CiC (Container-in-Container) — отложен, Enhanced Monoliths достаточны

---

## 📋 F02.6: MOBILE EDITOR — СОГЛАСОВАНО

Click-to-place, Bottom Sheet Settings, PWA. Killer feature. desktopData/mobileData раздельно — архитектурная основа есть. Реализация после MVP.

---

## 🟡 F03: FRONTEND КОМПОНЕНТЫ — ЧАСТИЧНО ВЫПОЛНЕНО

18 из нужных работают.

### Следующие приоритеты:

| Компонент | Приоритет | Зачем |
|-----------|-----------|-------|
| TronForgotPassword | 🔴 Высокий | Auth flow не завершён |
| TronEmailConfirmation | 🔴 Высокий | Auth flow не завершён |
| Нишевые Tron (Shop, Agency, Portfolio style) | 🟡 Средний | Расширение ниш |
| Раздел Механики в Settings Panel | 🟡 Средний | Fireflies, particles, blobs |

### Component Writing Rules v2 — обязательно:
- Регистрация в 4 местах + assembler
- 520px breakpoint через ResizeObserver
- buildTokens(darkBg, lightBg) + hexToRgb(accentColor)
- colorScheme и accentColor в Component.craft.props
- MECHANICS.md перед добавлением интерактивности
- Cursor spotlight — НИКОГДА в компоненте
- GSAP stagger с opacity:0 — ЗАПРЕЩЁН (ломает editor)
- EditableText из ../shared/EditableText
- MediaLibrary для изображений

### Будущие семейства (после Tron):
Elegant (light, premium), Bold (яркие), Soft (пастельные), Corporate (деловые).

---

## 📋 F04: BACKEND БЛОКИ — СОГЛАСОВАНО

Каждый блок = модуль: Frontend + API routes (Next.js) + DB schema + Env vars + meta.json.

### E-commerce пакеты:

**🚀 Launch — $249 + $29/мес**
User Auth + Product Catalog + Cart + Checkout + Stripe + Admin Basic + Security L2 + DB Simple = ~$365 раздельно → Экономия $116.

**📈 Growth — $599 + $59/мес**
Launch + Reviews + Newsletter + Dashboard + Wishlist + GA + DB Medium = ~$920 раздельно → Экономия $321.

**🦈 Shark — $1,199 + $99/мес**
Growth + AI Chatbot + Order Tracking авто + Security L3 + Marketing Pack + DB Advanced = ~$1,680 раздельно → Экономия $481.

### Порядок реализации:
1. Auth → Catalog → Cart → Checkout → Stripe → Admin → Security L2 → DB Simple
2. Reviews → Newsletter → Dashboard → Wishlist → GA → DB Medium
3. AI Chatbot → Order Tracking → Security L3 → Marketing → DB Advanced
4. Contact Form → FAQ → Booking → Maps → Live Chat

---

## 📋 F05: ASSEMBLER + LIVING PROJECT — СОГЛАСОВАНО

Базовый Assembler работает. Living Project JSON v2, One-Way Ejection (contract → editor), ZIP Export Strip Logic, полный 8-шаговый pipeline — предстоит реализовать.

---

## 📋 F06: ТЕСТИРОВАНИЕ — СОГЛАСОВАНО

Vitest + Playwright + GitHub Actions CI. 13 test cases включая: SSR Deploy, Auth flow end-to-end, Craft.js serialize/deserialize lossless, Interactive wizard 4 шага, Multi-page.

Acceptance criteria: Chrome/Safari/Firefox без ошибок, Lighthouse Performance > 80, Accessibility > 90, Craft.js serialize → deserialize = lossless.

---

## 📋 F07: ИНТЕРАКТИВ — ПОЛНЫЙ WORKFLOW — СОГЛАСОВАНО

4 из 8 шагов реализованы (см. INTERACTIVE PIPELINE ниже).

### Расширение до полного workflow:
Шаг 5: Порядок блоков (DnD) → Шаг 6: Анимация (10 пресетов, live preview) → Шаг 7: Детали (лого max 2MB, телефон, email, адрес Google Places, соцсети, API keys AES-256-CBC) → Шаг 8: Домен.

### Preview Mode:
`/preview/{preview_token}` — полноценный сайт в iframe. Mock Strategy: Contact Form → fake toast, Stripe → modal. Redis TTL 7 дней. Свободно: просмотр. Требует регистрации: Edit, Buy, Download ZIP.

Edge cases: закрыл окно → localStorage восстанавливает (<7 дней); Redis TTL → "Проект истёк"; email занят → предлагаем войти + claim.

**Метрики цели:** Step→Preview 95%+, Preview→Action 70–80%, Overall 55–65%.

---

## ✅ F08: DASHBOARD — ВЫПОЛНЕНО

Production-ready.

---

## 📋 F09: ПРИМИТИВНОЕ РЕДАКТИРОВАНИЕ — СОГЛАСОВАНО

Упрощённый Craft.js (primitiveResolver) для пользователей Интерактива. 6 функций: текст (max 200/500 символов), картинки (Cropper.js + WebP 85%), цвета (только из палитры, CSS variables), прозрачность (0–100%), размер (S/M/L/XL/XXL), поворот. Toolbox и Layers скрыты. Нельзя добавлять/удалять/переставлять блоки → warning + upsell на Редактор.

---

## 📋 F10: DASHBOARD ОБЫЧНЫХ ПОЛЬЗОВАТЕЛЕЙ — СОГЛАСОВАНО

Один проект одновременно. Статусы: Draft / Paid / Deployed / Expired. Кнопки: Preview, Edit, Buy, Download ZIP, Delete. DNS status checking.

---

## ❌ F11: GRAPESJS — DEPRECATED

Удалён 15.02.2026. Backbone.js несовместим с React.

---

## 🟡 F12: BACKEND БЛОКИ ПАНЕЛЬ — ЧАСТИЧНО ВЫПОЛНЕНО

### ✅ Выполнено:
Backend Canvas: 6 нод (YOUR SITE, SUPABASE, AUTH, CONTACT, PAYMENT, COMMERCE). SVG линии пересчитываются при движении. Pan + zoom + точечный фон. Категорийные цвета. Переключатель Frontend↔Backend.

### 📋 Осталось:
Доступ по подпискам, покупка блоков через Stripe, настройка API ключей (AES-256-CBC), статусы блоков.

---

## 📋 F13: DASHBOARD ФРИЛАНСЕРОВ — СОГЛАСОВАНО

Лимиты: Frontend 3, Full Stack 5, Professional 10. Grid/List, thumbnail, статус, клиент, MRR. Создать/Дублировать/Удалить. Статистика: активных/лимит, MRR график (Chart.js), экономия, AI сообщений. Реферальная система.

---

## 📋 F14: ОПЛАТА ЗА САЙТ — СОГЛАСОВАНО

Stripe Checkout: пакет + backend блоки + security level + deployment + hosting + домен + скидка баннер. Terms of Service с обязательной прокруткой. Metadata: user_id, project_id, package_type, delivery_method, hosting_plan.

---

## 📋 F15: HOSTING ПОДПИСКИ — СОГЛАСОВАНО

Первый месяц FREE. Сайт НЕ падает при превышении → scheduled upgrade.

---

## 📋 F16: ПОДПИСКИ ФРИЛАНСЕРОВ — СОГЛАСОВАНО

3-дневный trial. Upgrade: prorated. Downgrade: в конце billing cycle. Emails: Trial Start → Trial Ending (−1 день) → Trial Converted → Trial Cancelled.

---

## 🟡 F17: HYBRID DEPLOYMENT — ЧАСТИЧНО ВЫПОЛНЕНО

### ✅ Работает:
Wildcard subdomains *.iamrunning.online + SSL. Nginx → PM2 → Next.js. `nohup sleep 2 && pm2 restart` — единственный безопасный способ. /_next/static/ через filesystem alias. 127.0.0.1 вместо localhost в proxy_pass.

### 📋 Планируется:
Coolify (self-hosted PaaS, Traefik auto-SSL), GitHub Strategy (отдельный repo), resource limits, monitoring, rollback, auto-deploy pipeline.

**VPS:** Hetzner. Старт CX32 (4 cores, 16GB, ~50 сайтов). После 30 клиентов → CX42 (8 cores, 32GB, ~150 сайтов).

---

## 🟡 F18: SECURITY — ЧАСТИЧНО ВЫПОЛНЕНО

**Level 1 (included):** SSL, UFW (22/80/443), Fail2Ban, Security headers (CSP, X-Frame, X-XSS, Referrer-Policy), Cloudflare Free DDoS, unattended-upgrades.

**Level 2 (+$30, авто при Auth/Payment):** SQL Injection (Supabase SDK), RLS (все таблицы), XSS (DOMPurify), helmet.js, CSRF (Next.js middleware), Rate Limiting (express-rate-limit + Redis), bcrypt (Supabase Auth), zod на всех API routes. Enforcement: Assembler добавляет L2 принудительно при auth/payment блоках.

**Level 3 (+$150):** OWASP ZAP monthly scan, Sentry, Cloudflare Pro WAF, Coolify + Slack alerts, quarterly audit.

**Платформа iamrunning.online:** Supabase RLS на ВСЕХ таблицах, JWT middleware, Stripe webhook signature, admin через service role, httpOnly cookie auth (ADMIN_SESSION_SECRET), IP ban после 3 проб, AES-256-CBC для API keys, .env.local НИКОГДА в Git.

---

## 🟢 F19: ДОПОЛНИТЕЛЬНЫЕ ФИЧИ — ПОСЛЕ ЗАПУСКА

- **Showcase:** iamrunning.online/showcase — все deployed сайты, бесконечный скролл, плитки с превью
- **Лидерборд фрилансеров:** ТОП месяца по display_name, публичный

---

## 📋 F20: AI SUPPORT CHAT + SHADOW INSIGHTS — СОГЛАСОВАНО

**Support Chat:** GPT-4o-mini, $10/мес, все пользователи включая анонимов. Floating bubble → drawer. Mobile: full-screen. Идентичность: "AI Assistant от I AM RUNNING" (НЕ GPT, НЕ OpenAI). Soft budget: 80% → короче; 100% → fallback FAQ. Конверсионная задача: направляет к покупке.

Guardrails — запрещено: генерация кода/стихов, политика/религия, всё не о платформе.

**Shadow Mode:** Согласие в ToS. Pipeline: диалог → завершение → batch extraction раз в час → JSON инсайты → chat_insights. Инсайты: business_type, pain_points, intent, budget_signal, objections, competitor_mentions. Будущее — обучение Mistral на собранных данных.

**Приоритет:** Этап 1 — Support Chat. Этап 2 — Shadow Mode. Этап 3 — Analytics dashboard.

---

# ФИЧИ — TRACK 2: AI BUSINESS OS (iam-client-os) 🆕

---

## 🟡 G00: БАЗОВАЯ ИНФРАСТРУКТУРА — ЧАСТИЧНО ВЫПОЛНЕНО

### ✅ Работает:
- Репо: ArielGrook/iam-client-os (private)
- Deployed: iam-client-os.vercel.app ✅
- MCP OAuth подключение к Claude: WORKS ✅
- MCP tools: read_file, write_file, patch_file, list_directory, read_context_core
- OAuth flow: /authorize → /api/mcp/authorize → /api/mcp/token
- .well-known/oauth-authorization-server: working via next.config.mjs rewrite
- Landing: white + orange, I AM RUNNING style, 4 steps, copy bootstrap prompt
- install.sh: full VPS setup (Node, PM2, Nginx, SSL, app, secrets)
- context-core template: 4 docs (SYSTEM_IDENTITY, CURRENT_GOAL, NEXT_ACTIONS, WEEKLY_PROGRESS)
- Мы сами работаем через этот MCP каждый день — proof of concept

### ❌ Не готово:
Всё ниже (G01–G09).

---

## 📋 G01: MEMORY/ + YAML FRONTMATTER + RULES.MD

Переименовать context-core → memory. Клиент не должен видеть технические термины.
Изменить в: app/api/mcp/route.ts, install.sh, bootstrap-prompts/

Каждый файл в memory/ начинается с машинно-читаемого YAML заголовка между `---`.
AI обновляет и заголовок, и тело. Код (admin панель, watchdog, аналитика) парсит только заголовок.

**Зачем:**
- `version` — watchdog видит, обновлялся ли файл. Если не растёт неделю → alert
- `last_updated` + `updated_by` — аудит: кто и когда менял (AI vs клиент)
- `required_fields` — watchdog: обязательное поле пустое → файл сломан → откат
- `status`, `progress_percent`, `blockers` — admin dashboard всех клиентов одним взглядом
- `schema: "..._v1"` — миграция старых файлов при обновлении структуры

**5 файлов:** SYSTEM_IDENTITY.md (system_identity_v1), CURRENT_GOAL.md (current_goal_v1), NEXT_ACTIONS.md (next_actions_v1), WEEKLY_PROGRESS.md (weekly_progress_v1), RULES.md (rules_v1, locked: true, checksum protected).

Полные схемы — см. IAM_CLIENT_OS_PLAN.md v2.

---

## 📋 G02: АВТОНОМНЫЙ BOOTSTRAP ПРОМТ

Один промт, клиент вставляет один раз в начале каждой сессии. Claude:
1. Читает все файлы memory/ через MCP (RULES.md первым)
2. Делает краткий summary текущей ситуации (3–5 предложений)
3. Спрашивает что делать сегодня
4. В конце КАЖДОГО действия: обновляет нужные файлы + git snapshot
5. При обновлении: increment version, set last_updated, set updated_by
6. В конце сессии: обновляет NEXT_ACTIONS.md + WEEKLY_PROGRESS.md

Полный текст промта — см. IAM_CLIENT_OS_PLAN.md v2.

---

## 📋 G03: SANDBOXING MCP ИНСТРУМЕНТОВ

Ограничения на уровне кода в lib/mcp-server/index.ts:

| Инструмент | Разрешено | Запрещено |
|-----------|-----------|-----------|
| read_file | Project root клиента | /etc/, /var/log/, ~/.ssh/, системные пути |
| write_file | memory/ + проект клиента | Системные файлы, конфиги nginx/pm2 |
| patch_file | То же что write_file | То же что write_file |
| delete_file | Проект клиента (кроме RULES.md) | memory/RULES.md |
| run_command | Whitelist команд | rm -rf, sudo, curl \| bash |
| deploy | pm2 restart процесса клиента | Всё остальное |

Реализация: `validatePath(filePath, allowedDirs[], blockedDirs[])`

---

## 📋 G04: WATCHDOG ДЛЯ MEMORY/

Три уровня защиты:

**Уровень 1 — Cron (каждые 5 мин):**
- Все 5 обязательных файлов существуют
- Ни один не пустой (> 50 bytes)
- RULES.md не изменён (sha256 checksum)
- Проблема → email через Resend + автооткат из git snapshot

**Уровень 2 — Git hooks:**
- Post-commit: коммит не удалил обязательные файлы → если удалил, revert

**Уровень 3 — Daily backup:**
- Cron раз в сутки: cp -r memory/ → /var/backups/memory/YYYY-MM-DD/

---

## 📋 G05: ADMIN ПАНЕЛЬ

Dev Console портированный из I AM RUNNING, без IAM брендинга.

- Файловое дерево memory/
- Просмотр и редактирование файлов (CodeMirror)
- **Dashboard из YAML frontmatter:** статус goal, progress %, blockers — одним взглядом
- Git history + rollback
- Deploy кнопка (nohup sleep 2 && pm2 restart)
- Auth: TOTP (портировать из I AM RUNNING, Google Authenticator)

---

## 📋 G06: ЛЕНДИНГ V2 + DEMO-ВИДЕО

- Имя клиента: `NEXT_PUBLIC_CLIENT_NAME` → "Добро пожаловать, [Имя]"
- Две секции аудитории на одной странице: для разработчиков + для бизнеса
- **Demo-видео tunnel:**
  - Вариант A: "У меня локальный проект" (30 сек) — curl → tunnel → Claude подключился
  - Вариант B: "У меня VPS с сайтом" (45 сек) — SSH → curl → Claude видит кодовую базу
- Scroll-based steps: один экран = один шаг, анимация при скролле
- Кнопка "Copy bootstrap prompt"
- Блок безопасности: "подключайте только наш MCP сервер"
- Футер: "Powered by I AM RUNNING" + ссылка

---

## 📋 G07: ТЕСТ INSTALL.SH НА ЧИСТОМ VPS

Полный цикл на чистом Hetzner CX22 (€4/мес):
1. curl install.sh | bash
2. VPS поднят: Node, PM2, Nginx, SSL, app, secrets
3. Клиент получает: URL + TOTP + MCP token
4. Claude подключается — читает memory/, делает изменения, git snapshot
5. Admin панель работает
6. Watchdog крутится

---

## 📋 G08: TUNNEL АГЕНТ (KILLER FEATURE)

`agent.sh` — один скрипт, три сценария:

**Сценарий A — Новый проект на нашем Hetzner:**
curl install.sh | bash → полный VPS setup

**Сценарий B — Локальная разработка:**
curl agent.sh | bash → Cloudflare Tunnel (бесплатно, без регистрации) → Claude видит localhost

**Сценарий C — Существующий VPS клиента:**
SSH → curl agent.sh | bash → Tunnel + MCP рядом с проектом

### agent.sh делает:
1. Проверить/установить cloudflared
2. Определить режим: локальный или VPS
3. Найти или создать memory/
4. Поднять туннель: `cloudflared tunnel --url http://localhost:PORT`
5. Получить публичный URL
6. Записать URL в memory/SYSTEM_IDENTITY.md (обновить YAML frontmatter)
7. Вывести готовый MCP URL для Claude

---

## 📋 G09: MULTI-AI BOOTSTRAP

Разные инструкции для разных AI в одном промте:

| AI | Роль | MCP endpoint | Особенности |
|----|------|-------------|-------------|
| Claude Pro | Архитектура, разработка | /api/mcp (полный, 12 инструментов) | Primary operator |
| ChatGPT Plus | Маркетинг, тексты | /api/mcp-gpt (safe, 7 инструментов) | Read + context-core write |
| Gemini | Анализ кода | Нативный MCP (2026) | Пока через Extensions |

Один MCP сервер обслуживает все три AI одновременно.

---

## 📋 G10: ИНФРАСТРУКТУРА МОНИТОРИНГА

Клиентские серверы изолированы, но подключены к системе мониторинга:

- **Health check cron** на каждом VPS: pm2 status, disk space, nginx errors
- **Alert pipeline:** проблема → webhook → Telegram/Resend → ты чинишь
- **Watchdog memory/** (G04): проверка целостности файлов
- Первый этап: ручная поддержка (за деньги, это нормально)
- Позже: AI-мониторинг (Claude/Gemini парсит логи → предлагает фиксы)

---

# ФИЧИ — ОБЩАЯ ИНФРАСТРУКТУРА

---

## ✅ MCP CONNECTOR — ОСНОВНОЙ ИНСТРУМЕНТ

`lib/mcp-server/index.ts`. Endpoint: POST /api/mcp. Transport: Streamable HTTP. Auth: OAuth 2.0 auto-approve.

12 инструментов: read_file, write_file, patch_file, delete_file, list_directory, search_files, git_snapshot, git_log, git_push, deploy, run_command, read_multiple_files.

Динамический context-core: createMcpServer(clientSlug?) → читает /var/www/iam-clients/SLUG/ для Option A клиентов.

---

## ✅ DEV CONSOLE — ВТОРИЧНЫЙ ИНСТРУМЕНТ

`app/[locale]/admin/dev-console/`. 6 инструментов. BLOCKED_PATTERNS включает middleware.ts (писать через `node -e fs.writeFileSync`).

Фичи: Gemini adapter, Deploy button (nohup sleep 2 && pm2 restart), file tree через fs.readdirSync (без AI токенов), CodeMirror editor с syntax highlighting, Edit Mode, Git History с rollback, context menu, resizable panels, mobile-responsive.

---

## ✅ CONTEXT CORE — ОПЕРАЦИОННАЯ ПАМЯТЬ

`/context-core/`: 19+ документов. MAIN.md, PROGRESS.md, ARCHITECTURE.md, COMPONENTS.md, MECHANICS.md, PATTERNS.md, RULES.md, MCP_CONNECTOR.md, ENGINEERING_MEMORY.md, DEBUG_MAP.md, INTERACTIVE_PIPELINE.md, IAM_CLIENT_OS_PLAN.md, MVP_HAPPY_PATH.md и другие.

Загружается как system prompt (~38K chars) перед каждым Dev Console промтом. Самообновляемая: Dev Console может обновить свой собственный system prompt.

---

## ✅ INTERACTIVE PIPELINE

4 шага end-to-end (21.03.2026):

**Шаг 1:** Тип бизнеса (16 опций). Pure CSS thumbnails. НЕ SVG.
**Шаг 2:** Color Preset (12 named). Мини-превью + accent dot.
**Шаг 3:** Секции (13 блоков). CSS block thumbnails с accent.
**Шаг 4:** Название компании. Summary.

Assembler: `buildElementsFromContract()` → canonical order → прокидывает цвета.
Save: Auth → Supabase; Anon → localStorage.

---

## 📋 ЛЕНДИНГ IAMRUNNING.ONLINE — ОБНОВИТЬ ПОЗИЦИОНИРОВАНИЕ

Текущий лендинг: Hero, ThreeDoors, Speed, Hosting, SavingsCalculator, FinalCTA.
Нужно обновить: добавить AI Business OS как третью дверь, обновить позиционирование с "website builder" на "платформа с тремя продуктами".

---

# TERMS OF SERVICE

- Право использовать сайт клиента как пример/рекламу
- Showcase страница со всеми deployed сайтами
- Согласие на анонимизированный анализ диалогов с AI
- ZIP содержит только клиентский код, без логики платформы
- Пользователь соглашается при регистрации

---

# ПОРЯДОК РАЗРАБОТКИ v9.0

Два параллельных трека. Track 2 — приоритет (fastest path to revenue).

```
═══ TRACK 2: AI BUSINESS OS (ПРИОРИТЕТ) ═══

G01 (memory/ + YAML + RULES.md)
  ↓
G02 (Bootstrap промт)
  ↓
G03 (Sandboxing MCP)
  ↓
G04 (Watchdog)
  ↓
G05 (Admin панель)
  ↓
G06 (Лендинг v2 + demo-видео)
  ↓
G07 (Тест install.sh на чистом VPS)
  ↓
═══► ПЕРВЫЙ КЛИЕНТ AI BUSINESS OS ◄═══
  ↓
G08 (Tunnel агент)
  ↓
G09 (Multi-AI bootstrap)
  ↓
G10 (Мониторинг)


═══ TRACK 1: WEBSITE BUILDER (ПАРАЛЛЕЛЬНО) ═══

F14–F16 (Stripe + Подписки) ← 🔴 Блокер запуска Track 1
  ↓
F03 (Auth компоненты: ForgotPassword, Confirmation)
  ↓
F07 (Interactive полные 8 шагов + Preview Mode)
  ↓
F09 (Примитивное редактирование)
  ↓
F10 (Dashboard обычных юзеров)
  ↓
F12 (Backend Panel завершение)
  ↓
F13 (Dashboard фрилансеров)
  ↓
F04 (Backend Blocks первая волна)
  ↓
F02.6 (Mobile Editor)
  ↓
F06 (Тестирование)
  ↓
F17 (Deployment масштабирование)
  ↓
F18 (Security завершение)
  ↓
F20 (AI Support Chat)
  ↓
═══► ЗАПУСК WEBSITE BUILDER ◄═══
  ↓
F19 (Showcase, Лидерборд)


═══ ОБЩЕЕ ═══

Лендинг iamrunning.online — обновить позиционирование (после первого клиента AI Business OS)
```

---

# ТЕКУЩИЕ ПРИОРИТЕТЫ (26.03.2026)

## 🔴 Track 2 — AI Business OS (текущий фокус):
1. G01: memory/ + YAML frontmatter + RULES.md
2. G02: Автономный bootstrap промт
3. G03: Sandboxing MCP
4. G04: Watchdog
5. G05: Admin панель

## 🟡 Track 1 — Website Builder (после первого клиента Track 2):
- Stripe интеграция (checkout + webhook + role upgrade)
- Route protection middleware
- TronForgotPassword + TronEmailConfirmation
- Landing: pricing секция + demo CTA

## 🟢 Полировка (фоном):
- Settings Panel — единообразный дизайн
- Нишевые Tron компоненты
- Anonymous → signup: проект из localStorage

---

# ОЦЕНКА ВРЕМЕНИ (актуальная, 26.03.2026)

При работе 4–5 часов/день:

## Track 2 — AI Business OS → Первый клиент:

| Блок | Оценка | Примечание |
|------|--------|-----------|
| G01: memory/ + YAML + RULES.md | 1–2 дня | Переименование + схемы |
| G02: Bootstrap промт | 1 день | Финализация + тестирование |
| G03: Sandboxing MCP | 2–3 дня | validatePath + whitelist |
| G04: Watchdog | 1–2 дня | Bash + cron + Resend |
| G05: Admin панель | 5–7 дней | Портирование Dev Console |
| G06: Лендинг v2 | 2–3 дня | Дизайн + demo-видео |
| G07: Тест install.sh | 1–2 дня | Чистый Hetzner |

**Итого Track 2 до первого клиента: ~15–20 рабочих дней (3–4 недели)**
**Реалистичная дата: середина–конец апреля 2026**

## Track 2 — После первого клиента:

| Блок | Оценка |
|------|--------|
| G08: Tunnel агент | 3–5 дней |
| G09: Multi-AI bootstrap | 2–3 дня |
| G10: Мониторинг | 2–3 дня |

## Track 1 — Website Builder → Launch:

| Блок | Оценка | Примечание |
|------|--------|-----------|
| **Stripe + Route Protection** | 5–7 дней | 🔴 Блокер #1 |
| **Landing pricing + CTA** | 1–2 дня | 🔴 Блокер #2 |
| Auth components | 2–3 дня | |
| Settings Panel + Механики | 3–5 дней | |
| Нишевые Tron компоненты | 5–7 дней | |
| Interactive 8 шагов + Preview | 7–10 дней | |
| Примитивное редактирование (F09) | 3–5 дней | |
| Dashboard обычных юзеров (F10) | 3–5 дней | |
| Backend Panel (F12 завершение) | 3–5 дней | |
| Dashboard фрилансеров (F13) | 3–5 дней | |
| Backend Blocks (F04, первая волна) | 7–10 дней | |
| Mobile Editor (F02.6) | 10–15 дней | |
| Тестирование (F06) | 3–5 дней | |
| Coolify Deployment (F17) | 5–7 дней | |
| Security L2 полная (F18) | 3–5 дней | |
| AI Support Chat (F20) | 3–5 дней | |

**Итого Track 1: ~75–100 рабочих дней**
**Реалистичный launch Website Builder: сентябрь–октябрь 2026**

---

# ТЕХНИЧЕСКИЙ СТЕК (СВОДКА v9.0)

| Область | Технология |
|---------|-----------|
| Frontend | Next.js 15, TypeScript, React, Tailwind CSS |
| Visual Editor | Craft.js |
| Component Architecture | Enhanced Monoliths (18 Tron) |
| Theme System | ThemeContext (accentColor + colorScheme) + buildTokens |
| Editor State | query.serialize() + lz-string → Supabase JSONB |
| Client Sites (WB) | Next.js SSR через SiteRenderer.tsx |
| Client Sites Deploy | Nginx wildcard subdomains + PM2 + nohup |
| Inline Editing | react-contenteditable (EditableText) |
| Media | MediaLibrary → Supabase Storage (URLs, не base64) |
| Mobile Breakpoint | 520px через ResizeObserver |
| Animations | GSAP + ScrollTrigger + IntersectionObserver |
| Database | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Primary Dev Tool** | **MCP Connector** (Remote MCP Server, OAuth 2.0) |
| Secondary Dev Tool | Dev Console (встроенная AI IDE, Gemini Flash) |
| AI Context | Context Core (/context-core/, 19+ файлов) |
| AI Support | GPT-4o-mini ($10/мес) |
| AI Code Gen | Claude 3.5 Sonnet ($5/мес, Professional only) |
| Payments | Stripe (planned) |
| Deployment (WB) | Nginx + PM2 → Coolify (planned) |
| VPS (main) | Hetzner CX32 → CX42 |
| VPS (client OS) | Hetzner CX22 (€4/мес per client) |
| Email | Resend (custom domain) |
| i18n | next-intl (en/ru/he) |
| Testing | Vitest + Playwright (planned) |
| CI/CD | GitHub Actions + Coolify webhooks (planned) |
| **AI Business OS** 🆕 | Next.js 15, @modelcontextprotocol/sdk |
| **AI Memory** 🆕 | YAML frontmatter in markdown (memory/) |
| **Tunnel** 🆕 | Cloudflare Tunnel (agent.sh) |
| **Client OS Repo** 🆕 | ArielGrook/iam-client-os |
| **Client OS Demo** 🆕 | iam-client-os.vercel.app |
| **Client OS Domain** 🆕 | *.lego-base.online (legacy Option A) |
| **Watchdog** 🆕 | Bash cron + git hooks + daily backup |

---

# БЕЗОПАСНОСТЬ — AI BUSINESS OS 🆕

| Слой | Механизм |
|------|----------|
| Изоляция | Каждый клиент = отдельный VPS |
| Auth | TOTP для admin панели (Google Authenticator) |
| MCP Auth | Уникальный OAuth 2.0 token per client |
| Текстовая защита | RULES.md (locked: true, sha256 checksum) |
| Code-level защита | Sandboxing: validatePath(), command whitelist |
| Мониторинг | Watchdog cron (5 мин) + git hooks + daily backup |
| Восстановление | Автооткат из git snapshot при сломанном memory/ |
| Tool poisoning | RULES.md + sandboxing + лендинг предупреждение |

---

# ВЫУЧЕННЫЕ УРОКИ (v6 → v9, накопленные)

1. Два → три продукта — Interactive, Editor и AI Business OS требуют разных UX и аудиторий
2. GrapesJS несовместим с React — Craft.js решил проблему
3. AI не создаёт premium дизайн — нужны готовые компоненты + полировка
4. Цены по capacity, не по серверу — "100 юзеров" понятнее чем "2GB RAM"
5. Mobile-first обязательно
6. Отдельные desktopData/mobileData — единственный правильный подход
7. Short focused prompts — одна задача за раз
8. Enhanced Monoliths достаточны для MVP — CiC при масштабировании
9. SSR > Static HTML — React нельзя честно перевести в HTML
10. DOM ref > useState для анимаций (spotlight)
11. Cursor → Dev Console → MCP Connector — эволюция за 5 недель
12. Context Core решает амнезию — 19+ файлов = полное понимание проекта
13. Cache read в Cursor = токенная смерть — 85M токенов за 2 дня
14. Аудит перед фиксом — непреложно
15. useMemo для Supabase клиента — без него render loop
16. pm2 self-kill — только nohup sleep 2 && pm2 restart
17. OAuth discovery обязателен для Claude Connectors
18. SVG overflow нельзя надёжно клипировать — только pure CSS div
19. GSAP stagger с opacity:0 = сломанный editor — IntersectionObserver
20. Cursor spotlight в компоненте = двойная яркость
21. middleware.ts в BLOCKED_PATTERNS — только node -e fs.writeFileSync
22. Nginx proxy_pass через localhost = resolver error — использовать 127.0.0.1
23. USER_UPDATED не срабатывает при admin API — Realtime на profiles
24. Компоненты пишутся в Claude чате → write_file — самый быстрый pipeline
25. **Полный прайс-лист должен сохраняться в каждой версии роадмапа** — не упрощать
26. 🆕 **YAML frontmatter в memory/ — AI обновляет, код парсит заголовки**
27. 🆕 **Watchdog для memory/ — 3 уровня: cron + git hooks + daily backup**
28. 🆕 **Sandboxing MCP на уровне кода > текстовые правила (RULES.md)**
29. 🆕 **Tunnel — killer feature, которую нужно показать в видео, а не описать**
30. 🆕 **Один MCP сервер обслуживает Claude + ChatGPT + Gemini одновременно**
31. 🆕 **Fastest path to revenue — продукт который уже работает (AI Business OS)**
32. 🆕 **Аудитория может быть широкой — лендинг с секциями для каждого сегмента**
33. 🆕 **$0 setup для первых клиентов — снижаем барьер, получаем кейсы**
34. 🆕 **Мультитенантность Option A работает, но изолированный VPS — основная стратегия**

---

*Конец Roadmap v9.0. Дата создания: 26.03.2026. Следующее обновление: при значимых изменениях.*
