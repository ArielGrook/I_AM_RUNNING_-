# I AM RUNNING — ROADMAP (ЖИВОЙ ДОКУМЕНТ)

## Последнее обновление: 24.02.2026

## Версия: 6.0 (Container Architecture + Mobile Editor)

**Философия:** Stop Chasing, Start Running.

**UX:** Mobile-First. Пользователь выбирает из вариантов (кнопки), а не пишет промпты.

---

# CHANGELOG v5.0 → v6.0

## Почему v6

Редактор вышел в production и стабильно работает с 11 Tron компонентами. Однако при попытке добавить ресайзинг карточек обнаружилась фундаментальная проблема: монолитные компоненты (TronPricing, TronFeatures и др.) задают width в трёх местах одновременно, и они конфликтуют. Параллельно возникла идея мобильного редактора — раз desktopData и mobileData уже хранятся раздельно, можно сделать полноценное редактирование с телефона.

Gemini Deep Analysis (22.02.2026) подтвердил архитектуру Container-in-Container как правильное решение: re-resizable для handles, ThemeContext вместо props на каждой ноде, React.memo на контейнерах, контентные поля как props с contentEditable (не отдельные Craft.js ноды).

## Что произошло с момента v5.0 (19.02.2026 → 24.02.2026)

### Редактор вышел в production:
- Craft.js editor core стабилен
- Undo/redo работает
- Dual save desktopData + mobileData → Supabase
- Viewport эмуляция Desktop / 768 / 375
- Переключатель colorScheme (Dark/Light) на канве
- Copy to Mobile (desktopData → mobileData)
- Multi-page: удаление, навигация, минимум 1 страница
- Export в JSON
- Preview mode с GSAP анимациями + Light/Dark переключатель
- Color presets (10 штук: 6 solid + 4 градиентных)
- Spotlight cursor глобальный (цвет следует за пресетом)
- Smart links: external / page / section с динамическими выпадашками
- sectionHeight слайдер (50-100vh) у всех Tron кроме Header/Hero/Footer
- cardWidth и cardMinHeight слайдеры у карточных компонентов
- SEO метаданные через Supabase + форма в дашборде

### 11 Tron компонентов работают:
HeaderTron, HeroTron, TronFeatures, TronPortfolio, TronTestimonials, TronPricing, TronFAQ, TronFooter, TronContact, TronStats, TronShowcase

### BASIC компоненты:
Container, Text, Button, Image, Divider, Video, HtmlBlock

### Пресеты:
Dark Launch, Tron — применяются корректно

### Component Guide v2 написан:
Полные правила создания компонентов с Container-in-Container архитектурой, обязательной dark/light поддержкой, градиентами, максимальной настраиваемостью.

## Что изменилось

| Область | v5.0 | v6.0 |
|---------|------|------|
| Component Architecture | Монолитные Tron компоненты | **Container-in-Container** (SectionBlock → LayoutBlock → CardBlock) |
| Theme Distribution | Props на каждой ноде | **ThemeContext** для accentColor/colorScheme |
| Card Resize | Отсутствует / конфликтует | **re-resizable** на CardBlock (корневая функция) |
| Content Fields | Смешанный подход | **Строго props (НЕ отдельные Craft.js ноды)** |
| Old Components | Активные | **LEGACY** (в resolver, убраны из Toolbox) |
| Mobile Editor | Только viewport эмуляция | **Новый раздел F02.6** — click-to-place, bottom sheet, PWA |
| Parser | Упомянут кратко | **Документирован** как HtmlBlock wrapper подход (низкий приоритет) |

## Что НЕ изменилось

- Весь бизнес-план, цены, пакеты, backend блоки
- F01 Database schema
- F08 Dashboard — production-ready
- One-Way Ejection паттерн
- Все требования F07, F09, F10, F12-F20
- i18n (next-intl, en/ru/he), Supabase, Auth
- Цветовая схема (#FF6B35 orange, #1a1a1a dark)
- Coolify, Hybrid Deployment, AI бюджеты, Security Stack

## Статусы

| Маркер | Значение |
|--------|----------|
| ✅ | **Выполнено** — код написан, работает в production |
| 🔄 | **В работе** — активная разработка |
| 📋 | **Согласовано** — требования заморожены, код не написан |
| 🟡 | **Частично выполнено** — основа работает, есть незакрытые пункты |
| ❌ | **DEPRECATED** — удалено из roadmap |

---

# АРХИТЕКТУРА: ДВА ПРОДУКТА — ОДНА ПЛАТФОРМА

```
        ┌─────────────────────────┐
        │   ОБЩАЯ БАЗА            │
        │   - React/Tailwind      │
        │     компоненты          │
        │   - Backend блоки       │
        │   - Сборщик (Living     │
        │     Project JSON v2)    │
        │   - Coolify (Hybrid     │
        │     Deployment)         │
        │   - AI Support Chat     │
        │     (GPT-4o-mini)       │
        └───────────┬─────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
 ┌───────────────┐       ┌───────────────┐
 │  ИНТЕРАКТИВ   │       │   РЕДАКТОР    │
 │  (Дверь А)    │       │  (Дверь Б)    │
 │               │       │               │
 │  • 8+ шагов   │       │  • Craft.js   │
 │    + branching │       │  • Container  │
 │  • Preview    │       │    -in-       │
 │    Mode       │       │    Container  │
 │  • 1 проект   │       │  • Mobile     │
 │  • $60 base   │       │    Editor     │
 │  • Массовый   │       │    (PWA)      │
 │    рынок      │       │  • AI Code    │
 │               │       │    Gen        │
 └───────────────┘       └───────────────┘
                          Frontend: $199/мес
                          Full Stack: $599/мес
                          Professional: $999/мес
```

---

# ЦЕНООБРАЗОВАНИЕ (3 ВАЛЮТЫ)

**Округление:** USD — как есть | ILS — агрессивное округление вверх | RUB — агрессивное округление вверх

## Интерактив — Пакеты сайтов (покупка "товара"):

| Package | USD | ILS (₪) | RUB (₽) | Описание |
|---------|-----|---------|---------|----------|
| **Landing** | $60 | 300₪ | 6,000₽ | Одностраничник, 6-7 блоков |
| **Launch** | $249 | 1,000₪ | 25,000₽ | E-commerce базовый |
| **Growth** | $599 | 2,500₪ | 60,000₽ | E-commerce + аналитика |
| **Shark** | $1,199 | 5,000₪ | 120,000₽ | Premium: AI + автоматизация |

## Метод получения (после покупки пакета):

| Метод | USD | ILS | RUB | Что делаем |
|-------|-----|-----|-----|------------|
| **DIY** (ZIP download) | +$0 | +0₪ | +0₽ | Скачиваешь чистый билд, сам деплоишь |
| **Managed Deploy** | +$10 | +40₪ | +800₽ | Мы деплоим на VPS + домен + SSL |
| **Full Service** | +$30 | +100₪ | +2,000₽ | + настройка аккаунтов (Supabase, Stripe) |

> **ВАЖНО:** ZIP доступен ТОЛЬКО после оплаты пакета. Бесплатно код не отдаём.
> ZIP содержит чистый статический билд / Docker-контейнер сайта клиента.
> Из ZIP вырезаны: логика платформы, системные API-ключи, промпты, исходный код I AM RUNNING.

## Hosting (monthly, ПЕРВЫЙ МЕСЯЦ FREE):

| Tier | USD | ILS | RUB | Для кого |
|------|-----|-----|-----|----------|
| Starter | $20/мес | 100₪/мес | 2,000₽/мес | До 100 юзеров, 50 товаров, 10 одновременных |
| Business | $29/мес | 200₪/мес | 3,000₽/мес | До 1,000 юзеров, 500 товаров, 50 одновременных |
| Pro | $59/мес | 300₪/мес | 6,000₽/мес | До 10,000 юзеров, 5,000 товаров, 200 одновременных |
| Enterprise | $99/мес | 500₪/мес | 10,000₽/мес | Безлимит юзеров/товаров, 1,000 одновременных |

**Сайт НЕ упадёт при превышении лимитов!** Email с предложением auto-upgrade на следующий billing cycle.

**Trial:** Первый billing cycle бесплатно (от даты подписки до +1 месяц).

## Security:

| Level | USD | ILS | RUB | Описание |
|-------|-----|-----|-----|----------|
| Level 1 | **Included** | **Included** | **Included** | SSL, базовый firewall. **Включён во ВСЕ сайты.** |
| Level 2 | +$30 | +150₪ | +3,000₽ | **Авто-добавляется при Auth/Payment.** |
| Level 3 | +$150 | +750₪ | +15,000₽ | Аудит, мониторинг, WAF |

## Backend блоки (полный прайс-лист, детали в F04):

| Block | USD | ILS (₪) | RUB (₽) |
|-------|-----|---------|---------|
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

## Domains:

| Extension | USD | ILS | RUB |
|-----------|-----|-----|-----|
| .com | $12/year | 60₪/year | 1,200₽/year |
| .net | $15/year | 75₪/year | 1,500₽/year |
| .org | $16/year | 80₪/year | 1,600₽/year |

## Редактор (подписки фрилансеров):

| Plan | USD | ILS | RUB | Проекты | Backend | AI Code Gen | Trial |
|------|-----|-----|-----|---------|---------|-------------|-------|
| **Frontend** | $199/мес | 1,000₪/мес | 20,000₽/мес | 3 | Скидка 25% | ❌ | 3 дня |
| **Full Stack** | $599/мес | 3,000₪/мес | 60,000₽/мес | 5 | 6 включены + скидка 30% | ❌ | 3 дня |
| **Professional** | $999/мес | 5,000₪/мес | 100,000₽/мес | 10 | Все включены | ✅ 20 msg/day | 3 дня |

**Скидка за баннер:** -25% от стоимости сайта (sticky баннер "I AM RUNNING" внизу)

## AI бюджеты:

| Фича | Провайдер | Модель | Бюджет | Доступ |
|------|-----------|--------|--------|--------|
| Support Chat | OpenAI | GPT-4o-mini | $10/мес | Все (включая анонимов) |
| Code Generator | Anthropic | Claude 3.5 Sonnet | $5/мес | Только Professional ($999) |


---

# ✅ F01: СХЕМА БД — ВЫПОЛНЕНО

**Статус:** ✅ Выполнено (код написан, работает в production)

**Паттерн:** One-Way Ejection — данные из Интерактива (JSON contract) трансформируются в формат редактора при "выталкивании" в Craft.js, обратная конвертация не нужна.

## 8 таблиц:

### 1. `users`

- id UUID PRIMARY KEY REFERENCES auth.users(id)
- user_number SERIAL
- email TEXT NOT NULL, full_name TEXT, avatar TEXT
- account_type TEXT CHECK ('regular', 'freelancer') DEFAULT 'regular'
- company TEXT
- Подписка фрилансера (freelancer_tier, freelancer_price, freelancer_status, freelancer_trial_ends_at, freelancer_subscription_id)
- Статистика (projects_created, projects_completed, total_spent)
- Реферальная система (referral_code UNIQUE, referred_by, total_referrals, freelancer_rank, current_discount_percent, display_name)
- AI (ai_requests_today, ai_requests_limit DEFAULT 20)
- created_at, updated_at TIMESTAMPTZ

### 2. `projects`

- id UUID, project_number SERIAL
- user_id UUID NOT NULL, name TEXT, description TEXT, thumbnail TEXT
- source TEXT CHECK ('interactive', 'editor') DEFAULT 'interactive'
- status TEXT CHECK ('draft', 'paid', 'deployed', 'expired') DEFAULT 'draft'
- preview_token UUID UNIQUE DEFAULT gen_random_uuid()
- contract JSONB DEFAULT '{}' — Living Project JSON v2
- **desktopData JSONB** — Craft.js editor state для десктопа
- **mobileData JSONB** — Craft.js editor state для мобильной версии
- assembled_html TEXT, assembled_css TEXT, assembled_js TEXT
- backend_blocks JSONB DEFAULT '[]'
- has_promo_banner BOOLEAN, discount_percent, original_price, final_price
- deployment_strategy TEXT CHECK ('static', 'docker')
- delivery_method TEXT CHECK ('managed', 'diy')
- hosting_tier, hosting_status, first_month_free_used
- is_public BOOLEAN, is_template BOOLEAN
- created_at, updated_at TIMESTAMPTZ

### 3. `components`

- id UUID, component_number SERIAL
- block_type TEXT NOT NULL CHECK ('header', 'hero', 'about', 'services', 'portfolio', 'stats', 'team', 'features', 'faq', 'pricing', 'cta', 'footer', 'auth', 'ecommerce', 'dashboard', 'admin', 'form', 'custom')
- variant_name TEXT DEFAULT 'default'
- name TEXT NOT NULL
- html TEXT NOT NULL — React JSX source (reference)
- css TEXT, js TEXT
- craft_config JSONB — `{ defaultProps, rules, related }` для регистрации в Craft.js resolver
- react_source TEXT — полный source код (View + Settings + .craft static)
- style_tags TEXT[], business_tags TEXT[], feature_tags TEXT[]
- editable_areas JSONB
- is_premium BOOLEAN, is_public BOOLEAN, usage_count INTEGER
- created_by UUID, meta JSONB
- created_at, updated_at TIMESTAMPTZ

### 4. `backend_blocks`

- id UUID, slug TEXT UNIQUE, category TEXT
- name_en/ru/he TEXT, description_en/ru/he TEXT
- price NUMERIC, api_endpoints JSONB, database_tables JSONB, env_vars_required TEXT[], files JSONB
- icon TEXT, preview_image TEXT
- created_at, updated_at TIMESTAMPTZ

### 5. `payments`

- id UUID, payment_number SERIAL
- user_id UUID, project_id UUID
- payment_type TEXT CHECK ('site_package', 'backend_block', 'deployment', 'hosting', 'freelancer_subscription', 'domain')
- item_name TEXT, amount NUMERIC, currency TEXT CHECK ('usd', 'ils', 'rub')
- stripe_payment_id TEXT, stripe_invoice_id TEXT
- status TEXT CHECK ('pending', 'succeeded', 'failed', 'refunded')
- metadata JSONB, created_at TIMESTAMPTZ

### 6. `freelancer_clients`

- id UUID, client_number SERIAL
- freelancer_id UUID, client_email TEXT, client_name TEXT
- project_id UUID, project_name TEXT
- deployment_price NUMERIC, deployment_status TEXT
- payment_link_token TEXT UNIQUE, payment_link_used BOOLEAN
- created_at, updated_at TIMESTAMPTZ

### 7. `freelancer_referrals`

- id UUID, referrer_id UUID, referred_id UUID
- referral_type TEXT CHECK ('freelancer', 'client')
- bonus_applied BOOLEAN, created_at TIMESTAMPTZ

### 8. `chat_insights` (Shadow Mode)

- id UUID, insight_number SERIAL, session_id UUID
- user_id UUID, anonymous_id TEXT
- conversation_json JSONB, extracted_insights JSONB
- user_agent TEXT, language TEXT CHECK ('en', 'ru', 'he')
- created_at TIMESTAMPTZ, processed BOOLEAN DEFAULT false

## Ключевые решения:

- Стили/палитры — В КОДЕ, не в БД
- Клиенты фрилансеров НЕ регистрируются, только Stripe subscription
- Порядковые номера везде
- Ранги фрилансеров публичные с display_name
- Первый месяц сервера FREE
- Shadow Mode: сбор инсайтов с явным согласием в ToS
- Deployment Strategy: hybrid (static / docker) через Coolify
- preview_token для безопасного публичного Preview Mode
- ZIP export: strip platform logic, API keys, prompts
- **v6:** desktopData и mobileData — раздельное хранение для двойного canvas

## RLS Policies:

- `users`: юзер видит/редактирует себя, админ — всех
- `projects`: юзер — свои, админ — все, public — для showcase
- `components`: public видны всем, приватные — автору
- `backend_blocks`: видны всем (каталог)
- `payments`: юзер — свои, админ — все
- `freelancer_clients`: фрилансер — своих клиентов
- `freelancer_referrals`: юзер — свои
- `chat_insights`: только service role

## Ранги фрилансеров:

| Ранг | Клиентов | Плюшки |
|------|----------|--------|
| 🥉 Starter | 0-4 | — |
| 🥈 Builder | 5-14 | -15% на план, бейдж |
| 🥇 Pro | 15-29 | -50% на план, приоритетная поддержка |
| 💎 Elite | 30+ | Бесплатный план, ранний доступ к фичам |

---

# ✅ F02: НАПОЛНЕНИЕ — ВЫПОЛНЕНО

**Статус:** ✅ Выполнено

## Стили (12 штук, в коде):

| Стиль | Описание |
|-------|----------|
| clear | Чистый, воздушный, много белого |
| dark | Тёмный фон, светлый текст |
| neon_futuristic | Неон, свечение, киберпанк |
| minimal | Минимализм |
| elegant | Элегантный, премиум, serif |
| bold | Яркий, контраст |
| soft | Мягкие цвета, скругления |
| corporate | Деловой, строгий |
| creative | Креативный, нестандартный |
| playful | Игривый, для молодёжи |
| brutalist | Брутализм, raw |
| glassmorphism | Стекло, blur, прозрачности |

## Типы бизнеса (16 штук) с Branching подтипами:

| Slug | Название | Подтипы (branching, опциональные) |
|------|----------|-----------------------------------|
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

## Палитры (16 штук, в коде):

### Solid (8):
Pure Black, Pure White, Black Red, Deep Blue, Light Blue, Fresh Green, Pink Orange, Royal Purple

### Gradient (8):
Sunset, Ocean, Forest, Night, Steel, Arctic, Fire, Lavender

Каждая палитра: 3-5 цветов (primary, secondary, accent, bg, text). Градиенты: 3-4 оттенка.

## Пресеты анимаций (10 штук, в коде):

| # | Название | Вайб |
|---|----------|------|
| 1 | None | Статичный |
| 2 | Subtle | Сдержанный |
| 3 | Elegant | Изысканный |
| 4 | Dynamic | Живой |
| 5 | Playful | Весёлый |
| 6 | Corporate | Профессиональный |
| 7 | Bold | Смелый |
| 8 | Smooth | Спокойный |
| 9 | Tech | Современный |
| 10 | Cinematic | Впечатляющий |

---

# 🟡 F02.5: CRAFT.JS EDITOR CORE — ЧАСТИЧНО ВЫПОЛНЕНО

**Статус:** 🟡 Частично выполнено (24.02.2026)

> **Заменяет F11 (GrapesJS) из v4.0.** GrapesJS удалён из проекта — архитектурно несовместим с React.

## Статус по фазам v5.0

### Phase 1 — Critical Fixes: ✅ ВЫПОЛНЕНО
- [x] Fix Features/Footer crash — все 11 Tron компонентов стабильны
- [x] Fix hydration errors — редактор работает в production
- [x] Stable Undo/Redo — работает
- [x] Keyboard shortcuts — undo/redo функционирует

### Phase 2 — Core Features: 🟡 ЧАСТИЧНО
- [x] Preview Mode — работает с GSAP анимациями, Dark/Light переключатель
- [x] Multi-page — навигация, удаление, добавление страниц, минимум 1
- [x] Responsive preview — Viewport эмуляция Desktop / 768 / 375
- [ ] **Layers Panel** — НЕ реализована (дерево компонентов, lock/hide)

### Phase 3 — Custom Fields: 🟡 ЧАСТИЧНО
- [x] Animation Controls — animationType работает, GSAP в preview
- [x] Color presets — 10 штук (6 solid + 4 градиентных), мгновенное применение
- [ ] **Gradient Builder** — градиентные пресеты есть, но кружки показывают solid вместо градиента
- [ ] **Background Image Upload** — не реализован
- [ ] **Typography Controls** — не реализованы (font family, letter spacing, line height)

### Phase 4 — Stable Base: 🟡 ЧАСТИЧНО
- [x] Все 11 Tron компонентов рабочие
- [x] Save/Load стабильный — dual save desktopData + mobileData в Supabase
- [x] Export в JSON
- [ ] **Schema migration system** — не реализована
- [ ] **localStorage WAL** — не реализован (резервное сохранение)

## НОВОЕ В v6: CONTAINER-IN-CONTAINER АРХИТЕКТУРА

### Проблема монолитов

Текущие 11 Tron компонентов — монолиты. TronPricing, TronFeatures и остальные — единые блоки где всё жёстко прошито. При попытке добавить ресайзинг карточек width задавался в трёх местах одновременно и конфликтовал. Монолиты не масштабируются.

### Решение: трёхуровневая иерархия

```
SectionBlock (фон, padding, высота секции, анимация)
  └── LayoutBlock (flex/grid, gap, колонки, alignment)
        └── CardBlock (ресайзируемая карточка с re-resizable)
              └── контентные поля = props (НЕ отдельные Craft.js ноды)
```

**SectionBlock** — обёртка секции:
- background (solid/gradient)
- padding, minHeight, sectionHeight слайдер
- анимация секции (data-animate)
- data-block-type для Smart Links
- colorScheme и accentColor

**LayoutBlock** — сетка внутри секции:
- grid/flex layout
- количество колонок
- gap, alignment
- responsive breakpoints
- Это `<Element canvas>` — принимает CardBlock'и

**CardBlock** — единица контента с `re-resizable`:
- свой фон, border, shadow
- размеры через resize handles
- Контент внутри — **СТРОГО props**, не отдельные Craft.js ноды

### КРИТИЧЕСКОЕ ПРАВИЛО: Контентные поля = props

```tsx
// ✅ ПРАВИЛЬНО — заголовок и текст как props
const CardBlock = ({ title, description, icon, price }) => {
  return (
    <div>
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span>{price}</span>
    </div>
  )
}

// ❌ ЗАПРЕЩЕНО — заголовок как отдельная Craft.js нода
const CardBlock = ({ children }) => {
  return (
    <div>
      <Element id="card-title" is={Text} canvas />   {/* НЕТ! */}
    </div>
  )
}
```

**Почему:** потолок Craft.js ~300-500 нод. Если карточка содержит 4 текстовых ноды вместо 4 props — страница с 10 секциями упирается в потолок.

### ThemeContext вместо props

```tsx
// БЫЛО: accentColor и colorScheme как props на каждой ноде
// СТАЛО: ThemeContext

const ThemeContext = React.createContext({
  accentColor: '#FF6B35',
  colorScheme: 'dark' as 'dark' | 'light',
});

// SectionBlock читает из контекста:
const { accentColor, colorScheme } = useContext(ThemeContext);
```

Переключение темы в Toolbar мгновенно применяется через Provider, не нужно итерировать все ноды.

### Deprecation старых монолитов

Существующие TronPricing, TronFeatures, TronTestimonials и остальные 11 — LEGACY:
- **Остаются в resolver** — старые проекты не ломаются при загрузке
- **Убираются из Toolbox** — новые проекты используют Container-in-Container
- **Не дорабатываются** — только критические баги

### React.memo на всех контейнерах

```tsx
export const SectionBlock = React.memo(({ bgColor, padding, children }) => {
  // ...
});
```

Все `useNode()` collectors с selective subscription — подписка только на нужные props.

### CardBlock с re-resizable

```tsx
import { Resizable } from 're-resizable';

const CardBlock = ({ title, description, width, minHeight }) => {
  const { connectors: { connect, drag }, isSelected, actions: { setProp } } = useNode(
    (node) => ({ isSelected: node.events.selected })
  );

  return (
    <Resizable
      size={{ width, height: 'auto' }}
      minWidth={200}
      maxWidth={600}
      minHeight={minHeight}
      enable={isSelected ? { right: true, left: true, bottom: true } : false}
      onResizeStop={(e, dir, ref, d) => {
        setProp((p) => { p.width = (width || 300) + d.width }, 300);
      }}
    >
      <div ref={(ref) => connect(drag(ref))}
        className={isSelected ? 'outline outline-2 outline-orange-500' : ''}>
        {/* контент через props */}
      </div>
    </Resizable>
  );
};
```

### Proof of Concept стратегия

1. **PoC на TronPricing** — самый наглядный кандидат (карточки с ценами)
2. Валидация подхода: resize работает, ноды не конфликтуют
3. Миграция остальных компонентов по одному
4. Параллельно: LEGACY монолиты остаются рабочими

## Craft.js Core Architecture (из v5.0 — без изменений)

Craft.js хранит все ноды в **flat `Record<NodeId, Node>` map** (не nested tree). Root нода всегда `"ROOT"`. Каждый React элемент внутри `<Frame>` становится `Node`.

**Три типа связей нод:**
- **Child nodes** — `data.nodes[]`, рендерятся как children
- **Linked nodes** — `data.linkedNodes`, через `<Element id="some_id">`
- **ROOT** — top-level контейнер

**Ключевые паттерны:**
- `setProp(props => { props.text = value; })` — Immer-style мутация
- `setProp(cb, throttleMs)` — throttle для undo history
- `connect(drag(ref))` — оба connector'а на одном ref
- `useNode(collector)` — selective subscription

## Data Format (Supabase projects)

```json
{
  "desktopData": "compressed_lz-string_of_craft_serialized_json",
  "mobileData": "compressed_lz-string_of_craft_serialized_json"
}
```

**Раздельное хранение** десктопной и мобильной версии — основа для Mobile Editor (F02.6).

## Текущие компоненты и их статус

### Tron Theme (11 компонентов — LEGACY, в resolver, убираются из Toolbox):

| Компонент | Статус | Особенности |
|-----------|--------|-------------|
| HeaderTron | ✅ | Навигация, sticky |
| HeroTron | ✅ | Главный экран |
| TronFeatures | ✅ | Карточки преимуществ |
| TronPortfolio | ✅ | Галерея работ |
| TronTestimonials | ✅ | Бесконечная карусель, 1-2 ряда |
| TronPricing | ✅ | Карточки цен |
| TronFAQ | ✅ | Аккордеон |
| TronFooter | ✅ | Подвал |
| TronContact | ✅ | Контактная форма |
| TronStats | ✅ | Анимированные счётчики |
| TronShowcase | ✅ | Интерактивный tabbed контент |

### BASIC компоненты (остаются активными):

| Компонент | Статус |
|-----------|--------|
| Container | ✅ |
| Text | ✅ |
| Button | ✅ |
| Image | ✅ |
| Divider | ✅ |
| Video | ✅ |
| HtmlBlock | ✅ |

### Рабочие фичи редактора:

- Craft.js editor core
- Undo/redo
- Dual save desktopData + mobileData → Supabase
- Viewport эмуляция Desktop / 768 / 375
- colorScheme переключатель (Dark/Light)
- Copy to Mobile (desktopData → mobileData)
- Multi-page: удаление, навигация (минимум 1 страница)
- Export в JSON
- Preview mode с GSAP анимациями + Dark/Light
- Навигация по страницам в preview
- Color presets (10 штук)
- Spotlight cursor глобальный
- Smart links: external / page / section
- sectionHeight слайдер (50-100vh)
- cardWidth и cardMinHeight слайдеры
- SEO метаданные
- Пресеты: Dark Launch, Tron

### Известные баги (бэклог):

- AnimationType ScrollTrigger — срабатывает не при доскролле
- Градиентные кружки пресетов — показывают solid вместо градиента
- Диагональные линии на канве — источник не найден

## Phases реализации (ОБНОВЛЕНО v6)

**Phase 5 — Container-in-Container (5-7 дней):**
- [ ] SectionBlock примитив: background, padding, minHeight, sectionHeight, data-block-type
- [ ] LayoutBlock примитив: grid/flex, columns, gap, alignment, responsive
- [ ] CardBlock примитив: re-resizable, background, border, shadow, content-as-props
- [ ] ThemeContext: Provider в Editor, accentColor + colorScheme
- [ ] PoC на TronPricing → SectionBlock + LayoutBlock + PricingCardBlock
- [ ] Если PoC успешен — миграция TronFeatures, TronTestimonials
- [ ] Добавить примитивы в Toolbox, убрать LEGACY монолиты из Toolbox

**Phase 6 — Незакрытые пункты (3-5 дней):**
- [ ] Layers Panel: tree view, lock/hide, content preview, type badges
- [ ] Gradient Builder: visual, не text input
- [ ] Background Image Upload: Supabase Storage + crop
- [ ] Typography Controls: font family, letter spacing, line height
- [ ] Schema migration system
- [ ] Исправить ScrollTrigger
- [ ] Исправить градиентные кружки пресетов
- [ ] localStorage WAL (резервное сохранение)

## Craft.js ограничения (учтены):

- Performance ceiling ~300-500 editable nodes (Container-in-Container увеличивает количество нод — компенсируется правилом "content-as-props")
- Semi-maintained (последний релиз Feb 2025, prevwong ушёл в Reka.js)
- Client-side only (dynamic import ssr: false)
- Нет встроенного HTML import (решено через HtmlBlock wrapper)
- Нет встроенных resize handles (решено через re-resizable)

---

# 📋 F02.6: MOBILE EDITOR — СОГЛАСОВАНО (НОВОЕ В v6)

**Статус:** 📋 Согласовано (концепция, код не написан)

## Предпосылка

В редакторе уже реализовано двойное сохранение: `desktopData` и `mobileData` для каждой страницы. Есть viewport эмуляция Desktop/768/375 и кнопка "Copy to Mobile". Фактически, мобильная версия сайта существует как отдельный canvas с отдельными данными. Раз данные уже разделены — можно сделать полноценный мобильный редактор.

## Killer Feature

Ни Webflow, ни Wix, ни Tilda не имеют полноценного мобильного редактора. Они позволяют "посмотреть" на телефоне но не редактировать. Для целевой аудитории (фрилансеры, малый бизнес) возможность собрать сайт прямо с телефона — огромное конкурентное преимущество.

## Механика: Click-to-Place (вместо Drag-and-Drop)

DnD неудобен на touch-экранах. Альтернативная механика:

1. Пользователь нажимает "+" для добавления компонента
2. Выбирает компонент из списка (тап)
3. На канве подсвечиваются доступные места для вставки (между существующими блоками)
4. Пользователь тапает на нужное место — компонент вставляется

**Техническая реализация:** `actions.add(nodeTree, parentId, index)` — Craft.js поддерживает программную вставку в конкретную позицию.

## Touch-оптимизированный UI

### Bottom Sheet Settings

Вместо правого сайдбара (не помещается на мобиле) — bottom sheet:

- Тап на элемент → bottom sheet выезжает снизу
- Рендерит те же `related.settings` что и десктопная панель
- Swipe down для закрытия
- Высота: 40-60% экрана

### Toolbar

- Фиксированный top bar: "← Назад" | Название проекта | 💾 | 👁 Preview
- Floating "+" кнопка (Material Design FAB) для добавления компонентов

### Работа с контентом

- Тап на текст → inline editing через системную клавиатуру
- Тап на изображение → bottom sheet с upload/crop
- Тап на кнопку → bottom sheet с настройками ссылки

## Связь с существующей архитектурой

- Mobile Editor работает ТОЛЬКО с `mobileData`
- Desktop Editor работает ТОЛЬКО с `desktopData`
- Copy to Mobile: копирует desktopData → mobileData (уже реализовано)
- Один проект, два canvas, два редактора

## Пользовательские сценарии

**Сценарий A — Mobile-first workflow:**
Фрилансер в метро → открывает редактор на телефоне → собирает структуру → приходит домой → открывает на ПК → видит готовую мобильную версию → доделывает десктоп

**Сценарий B — Cross-device правка:**
Собрал сайт на ПК → Copy to Mobile → открыл на телефоне → подправил что не так выглядит → сохранил

## PWA стратегия

Мобильный редактор как Progressive Web App:
- Установка на Home Screen
- Landscape orientation lock (`"orientation": "landscape"`) — опционально
- Offline fallback: показать сохранённый draft
- Push notifications: "Проект обновлён на другом устройстве"

## Технические вопросы (открытые)

1. **Отдельный роут или режим** — `/editor/mobile` как отдельная страница (рекомендуется для чистоты) или переключатель внутри `/editor`
2. **Touch events в Craft.js** — DnD engine работает на мобиле, но возможны edge cases с selection vs scroll
3. **Bottom sheet библиотека** — react-spring-bottom-sheet или кастомная реализация
4. **Performance на мобиле** — меньше нод на мобильном canvas (компоненты проще)

## Phases реализации

**Phase 1 — Базовый мобильный режим (3-5 дней):**
- [ ] Роут `/editor/mobile` с touch-оптимизированным layout
- [ ] Click-to-place механика (вместо DnD)
- [ ] Bottom sheet для Settings
- [ ] Загрузка/сохранение mobileData

**Phase 2 — Полноценный редактор (5-7 дней):**
- [ ] Inline text editing через touch
- [ ] Image upload с мобильной камеры
- [ ] Preview mode на мобиле
- [ ] PWA manifest и Service Worker
- [ ] Синхронизация между устройствами

**Phase 3 — Полировка (3-4 дня):**
- [ ] Gesture support (pinch-to-zoom, swipe)
- [ ] Haptic feedback
- [ ] Offline draft support
- [ ] Push notifications

---

# 📋 F03: FRONTEND КОМПОНЕНТЫ — СОГЛАСОВАНО (ОБНОВЛЕНО v6)

**Статус:** 📋 Согласовано

> **ИЗМЕНЕНИЕ v6:** Все НОВЫЕ компоненты пишутся по Container-in-Container паттерну.
> Существующие 11 Tron монолитов = LEGACY (в resolver, убраны из Toolbox).
> Подробные правила — в Component Guide v2 (COMPONENT_GUIDE_v2.md).

## Архитектура компонентов (v6)

### Базовые примитивы (НОВОЕ):

| Примитив | Назначение | Статус |
|----------|-----------|--------|
| **SectionBlock** | Обёртка секции: background, padding, height, animation | 📋 |
| **LayoutBlock** | Сетка: grid/flex, columns, gap, alignment | 📋 |
| **CardBlock** | Ресайзируемая карточка: re-resizable, content-as-props | 📋 |

### Новые компоненты (Container-in-Container паттерн):

Каждый новый компонент = SectionBlock + LayoutBlock + специализированные CardBlock'и.

Пример: **Pricing** = SectionBlock (фон, заголовок секции) → LayoutBlock (3 колонки) → PricingCard (цена, features list, кнопка — всё как props).

### LEGACY компоненты (11 Tron монолитов):

HeaderTron, HeroTron, TronFeatures, TronPortfolio, TronTestimonials, TronPricing, TronFAQ, TronFooter, TronContact, TronStats, TronShowcase

**Статус LEGACY:** в resolver для обратной совместимости, убраны из Toolbox.

## Формат компонентов

Каждый компонент = тройка View + Settings + .craft:
1. **View** — JSX с `useNode()`, `connect(drag(ref))`, data-block-type
2. **Settings** — React form с `setProp()`, throttle, секции в стандартном порядке
3. **`.craft` static** — displayName, props (defaults), related, rules, custom (tags)

**Обязательно для каждого компонента (Component Guide v2):**
- colorScheme (dark/light) и accentColor
- Объект tokens с dark/light вариантами
- Поддержка градиентов (bgType, accentType)
- 100% мобильная адаптивность (375px проверка)
- animationType и animateDelay
- data-block-type на корневом элементе
- style/business/feature tags в .craft.custom

## ДВЕ БИБЛИОТЕКИ

### 📂 FRONTEND (бесплатные, 6-7 в базовом сайте):

| Блок | Вариантов | Описание |
|------|-----------|----------|
| Header | 5 | Шапка с навигацией |
| Hero | 5 | Главный экран |
| About | 5 | О нас/компании |
| Services | 5 | Услуги |
| Portfolio/Gallery | 5 | Галерея работ |
| Stats | 5 | Цифры/достижения |
| Team | 4 | Команда |
| Features | 5 | Преимущества |
| FAQ | 4 | Вопросы-ответы |
| Pricing | 5 | Таблица цен |
| CTA | 5 | Призыв к действию |
| Footer | 5 | Подвал |

### 📂 FRONTEND ДЛЯ BACKEND (платные):

**🔐 Auth:** Login (4), Register (4), Forgot Password (3), Email Confirmation (3), Profile Settings (3)
**🛒 E-commerce:** Product Card (5), Product Page (4), Catalog/Grid (4), Cart (4), Checkout (3), Order Confirmation (3)
**👤 Dashboard:** Dashboard Home (3), Orders History (3), Settings (3)
**🛠️ Admin:** Admin Dashboard (3), Products Management (3), Orders Management (3), Users Management (3)
**📧 Forms:** Contact Forms (5), Newsletter Forms (4)

## Источники компонентов

| Источник | Применение |
|----------|-----------|
| Купленные библиотеки (Tailwind UI, Flowbite Pro) | Дизайн-референсы |
| Ручная доработка | Финальная полировка, анимации |
| AI (Cursor) | Boilerplate, структура, Settings panels |
| ZIP Parser (HtmlBlock) | Импорт готовых шаблонов (низкий приоритет) |

## Приоритет

**Этап 1:** E-commerce полный цикл
**Этап 2:** Визитка/Портфолио
**Этап 3:** Остальное

---


# 📋 F04: BACKEND БЛОКИ — СОГЛАСОВАНО

**Статус:** 📋 Согласовано (без изменений от v5.0)

## Архитектура

Каждый backend блок = **полноценный модуль** включающий:

1. **Frontend страницы** (из библиотеки Frontend для Backend)
2. **API routes** (TypeScript, Next.js)
3. **Database schema** (SQL migrations для Supabase)
4. **Env vars** (список что нужно от клиента)
5. **Files** (структура кода)
6. **meta.json** (для визуализации в редакторе)

**Принцип автоподключения:** Все backend блоки используют фиксированные endpoints → Frontend страницы уже подключены.

- Auth: `/api/auth/*`
- Contact: `/api/contact/submit`
- Cart: `/api/cart/*`
- Products: `/api/products/*`
- Checkout: `/api/checkout/create`

**Купил блок → вставил API ключи → всё работает.**

## Пакеты E-commerce

### 🚀 Launch — $249 + $29/мес

**Состав:** User Auth ($40) + Product Catalog ($60) + Shopping Cart ($40) + Checkout ($35) + Stripe Payment ($80) + Admin Panel Basic ($40) + Security Level 2 (авто, $30) + DB Simple ($40).

**Итого раздельно:** ~$365 → **Экономия $116.**

**Frontend страницы включены:** Login, Register (по 4 варианта), Product Card, Product Page, Catalog (по 4-5), Cart (4), Checkout (3), Admin Dashboard (2).

### 📈 Growth — $599 + $59/мес

**Всё из Launch +** Reviews/Ratings ($60) + Newsletter ($40) + User Dashboard ($60) + Wishlist ($40) + Google Analytics ($30) + DB Medium ($70).

**Итого раздельно:** ~$920 → **Экономия $321.**

### 🦈 Shark — $1,199 + $99/мес

**Всё из Growth +** AI Chatbot ($150) + Order Tracking авто ($120) + Security Level 3 ($150) + Marketing Ready Pack ($120) + DB Advanced ($120).

**Итого раздельно:** ~$1,680 → **Экономия $481.**

## Отдельные блоки (à la carte)

### 📋 Формы и Коммуникация

**Contact Form — $25**
- API: `POST /api/contact/submit`
- DB: `contact_submissions (id, name, email, phone, message, created_at, status)`
- Env: `RESEND_API_KEY`, `CONTACT_EMAIL_TO`
- Frontend: Contact section (5 вариантов)

**Callback Form — $20**
- API: `POST /api/callback/request`
- DB: `callback_requests (id, phone, name, preferred_time, status)`
- Env: `RESEND_API_KEY`, `CALLBACK_NOTIFY_EMAIL`

**Newsletter — $40**
- API: `POST /api/newsletter/subscribe`, `POST /api/newsletter/unsubscribe`
- DB: `newsletter_subscribers (id, email, status, subscribed_at, ip_address)`
- Env: `RESEND_API_KEY`, `NEWSLETTER_LIST_ID`
- Frontend: Newsletter widget (4 варианта)

### 💬 Отзывы и Поддержка

**Trustpilot Reviews (widget) — $25**
- Integration: Trustpilot embed
- Env: `TRUSTPILOT_BUSINESS_ID`

**Reviews/Ratings (своя система) — $60**
- API: `POST /api/reviews/create`, `GET /api/reviews/list`, `PUT /api/reviews/moderate`
- DB: `reviews (id, product_id, user_id, rating, title, comment, verified_purchase, status)`

**Live Chat (Tawk.to/Crisp) — $60**
- External widget
- Env: `TAWK_PROPERTY_ID`, `TAWK_WIDGET_ID`

**FAQ Accordion (с админкой) — $25**
- API: `GET /api/faq/list`, `POST/PUT/DELETE /api/faq/*` (admin)
- DB: `faq_items (id, question, answer, category, order, visible)`

### 📍 Локация и Бронирование

**Google Map — $20**
- Env: `GOOGLE_MAPS_API_KEY`

**Booking (Calendly widget) — $35**
- Env: `CALENDLY_USERNAME`

**Booking (своя система) — $70**
- API: `GET /api/booking/slots`, `POST /api/booking/create`, `PUT /api/booking/cancel`
- DB: `booking_slots`, `bookings`

### 🔐 Аутентификация

**User Auth — $40**
- API: register, login, logout, reset-password, verify-email
- DB: `user_profiles`
- Env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `JWT_SECRET`, `RESEND_API_KEY`
- Frontend: Login (4), Register (4), Forgot Password (3), Email Confirmation (3)

**Google OAuth — $25** (дополнение к User Auth)

**Social Auth Pack (Google+FB+Apple) — $50**

### 🛒 E-commerce Ядро

**Product Catalog — $60**
- API: list, get, CRUD (admin)
- DB: `products`, `categories`
- Frontend: Product Card (5), Product Page (4), Catalog/Grid (4), Admin product editor

**Shopping Cart — $40**
- API: get, add, update, remove, clear
- DB: `cart_items`
- Frontend: Cart drawer/modal (4)

**Checkout — $35**
- API: create-session, validate
- DB: `orders`, `order_items`
- Frontend: Checkout page (3)

**Stripe Payment — $80**
- API: create-payment-intent, webhook, payment-status
- Env: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**PayPal Payment — $60**

**Payment Pack (Stripe+PayPal) — $120** (экономия $20)

### 👤 Личный Кабинет

**User Dashboard — $60**
- Frontend: Dashboard (3), Profile Settings (3), Orders History (3)

**Wishlist — $40**
- Frontend: Wishlist page (2)

**Order Tracking (ручной) — $35**

**Order Tracking (авто) — $120**
- Env: `SHIPPO_API_KEY` или `EASYPOST_API_KEY`

### ⚙️ Администрирование

**Admin Panel Basic — $40**
- Dashboard (2), User list

**Admin Panel E-commerce — $70**
- Advanced dashboard (2), Order/Product management, Analytics

### 🗄️ Базы Данных

**DB Simple — $40** — users, products (basic), orders (basic)

**DB Medium — $70** — + reviews, wishlist, newsletter_subscribers, analytics_events, RLS policies

**DB Advanced — $120** — + shipping_events, audit_logs, cache_tables, performance optimization

### 🤖 AI и Маркетинг

**AI Chatbot (ChatGPT) — $150** — Клиент вставляет СВОЙ OpenAI ключ

**Google Analytics — $30**

**Google Ads Setup — $50**

**Facebook Pixel — $40**

**Marketing Ready Pack — $120** (GA + Ads + Pixel)

### 🔒 Защита

**Security Level 2 — $30** (ОБЯЗАТЕЛЕН при Auth/Payment) — SQL injection, XSS, CSRF, rate limiting, bcrypt

**Security Level 3 — $150** — + аудит, мониторинг, DDoS advanced, penetration testing, WAF

## Файловая структура блока (пример user_auth)

```
/backend_blocks/user_auth/
├── meta.json
├── api/auth/ (register.ts, login.ts, logout.ts, reset-password.ts, verify-email.ts)
├── db/migration.sql
├── middleware/auth.ts
├── lib/jwt.ts
└── README.md
```

## Integration Flow (для фрилансеров)

1. Открывает панель Backend блоков в редакторе
2. Видит визуализацию: иконка, название, API endpoints, database tables, цена
3. Добавляет блок → модальное окно "Настройка"
4. Вставляет API ключи клиента
5. Ключи шифруются (AES-256-CBC) и сохраняются в БД
6. Блок: ⏳ Pending → ✅ Active
7. Frontend страницы уже подключены через стандартные endpoints

## Приоритет реализации

**Этап 1 (Launch):** User Auth → Product Catalog → Shopping Cart → Checkout → Stripe Payment → Admin Panel Basic → Security Level 2 → DB Simple
**Этап 2 (Growth):** Reviews/Ratings → Newsletter → User Dashboard → Wishlist → Google Analytics → DB Medium
**Этап 3 (Shark):** AI Chatbot → Order Tracking (авто) → Security Level 3 → Marketing Ready Pack → DB Advanced
**Этап 4:** Contact Form → FAQ → Booking → Maps → Live Chat

---

# 📋 F05: СБОРЩИК + LIVING PROJECT — СОГЛАСОВАНО

**Статус:** 📋 Согласовано (адаптация под Craft.js, из v5.0)

> **ИЗМЕНЕНИЕ v5:** Источник данных — Craft.js serialized JSON вместо GrapesJS getProjectData().

## Концепция

Сборщик — **трансформер** который превращает JSON contract → готовый сайт.

**Living Project:** JSON contract хранит полное состояние проекта (контент, классы, backend config). Проект можно "гидратировать" обратно в редактор в любой момент. БД — single source of truth.

## Living Project JSON v2 Schema

```json
{
  "version": "2.0",
  "meta": {
    "created_at": "2026-02-11T12:00:00Z",
    "updated_at": "2026-02-24T12:00:00Z",
    "source": "interactive",
    "last_editor": "interactive | primitive | craftjs"
  },
  "design": {
    "business_type": "food",
    "business_subtype": "restaurant",
    "style": "minimal",
    "palette": "pure_white",
    "animation_preset": "subtle"
  },
  "blocks": [
    {
      "id": "block_001",
      "type": "header",
      "variant": "minimal",
      "order": 1,
      "content": {
        "logo": { "src": "data:image/png;base64,...", "alt": "Best Pizza" },
        "nav_items": [
          { "label": "Home", "href": "#hero" },
          { "label": "Menu", "href": "#services" }
        ],
        "cta_button": { "label": "Order Now", "href": "#cta" }
      },
      "classes": {
        "wrapper": "bg-white shadow-sm fixed top-0 w-full z-50",
        "logo": "h-10 w-auto",
        "nav": "hidden md:flex gap-8",
        "cta": "bg-primary text-white px-6 py-2 rounded-full"
      },
      "animations": {
        "headline": { "type": "fadeInUp", "delay": 0.2, "duration": 0.8 }
      },
      "visibility": { "desktop": true, "mobile": true }
    }
  ],
  "backend_blocks": [
    {
      "slug": "contact_form",
      "status": "active",
      "config": {
        "env_vars": {
          "RESEND_API_KEY": "encrypted:aes256:iv:...",
          "CONTACT_EMAIL_TO": "encrypted:aes256:iv:..."
        }
      }
    }
  ],
  "details": {
    "company_name": "Best Pizza",
    "phone": "+1234567890",
    "email": "info@bestpizza.com",
    "address": "123 Main St",
    "social": { "instagram": "https://instagram.com/bestpizza" },
    "hours": { "mon_fri": "09:00-22:00", "sat": "10:00-23:00", "sun": "closed" }
  },
  "domain": {
    "type": "subdomain",
    "value": "bestpizza-xyz.iamrunning.online"
  },
  "deployment": {
    "strategy": "static",
    "tier": "starter",
    "delivery_method": "managed"
  }
}
```

## Craft.js → Living Project Адаптер

Маппинг Craft.js nodes → Living Project blocks:
- Каждый Craft node с `resolvedName` != Container/Text/Button → секция сайта → `blocks[].type` + `blocks[].variant`
- Craft.js props → `blocks[].content` (тексты, изображения)
- Craft.js `style={{}}` + className → `blocks[].classes`
- Animation props → `blocks[].animations`

## One-Way Ejection (Интерактив → Редактор)

При "выталкивании" проекта из Интерактива в Craft.js:
1. Читаем `contract` (Living Project JSON v2)
2. Для каждого `blocks[]` — загружаем соответствующий Craft.js компонент из `components` таблицы
3. Строим Craft.js serialized JSON: ROOT → [Header, Hero, About, ..., Footer] как ноды с props из contract.content
4. Сжимаем через `lz-string` → сохраняем в `projects.data.craft.pages[0].data`
5. Обратная конвертация НЕ нужна (one-way)

## HTML Generation для Export

Два подхода (выбрать при реализации):
1. **Custom recursive renderer** — обход Craft.js nodes → генерация HTML + Tailwind classes. Не требует Craft.js runtime
2. **React SSR** — рендер React tree в static HTML через `renderToString()` + Tailwind CLI purge

## CSS Generation

- Tailwind CLI purge на серверной стороне (только используемые классы)
- Динамические стили (из `style={{}}`) → inline CSS в export
- CSS variables из палитры → root level

## JS Assembly (GSAP)

10 animation presets → GSAP + ScrollTrigger. Deduplication скриптов. Только используемые анимации включаются в билд.

## ZIP Export Strip Logic

При экспорте ZIP вырезаются:
- Все системные API ключи платформы
- System prompts AI
- Код платформы I AM RUNNING
- Supabase service role keys
- Любая логика аутентификации платформы

Клиент получает: чистый static build (HTML/CSS/JS) или Docker-контейнер с его сайтом.

## ZIP Parser (HtmlBlock Wrapper) — НИЗКИЙ ПРИОРИТЕТ

Парсер уже существует в кодовой базе (от GrapesJS эры). Адаптация под Craft.js:

**Подход:** HtmlBlock wrapper — Craft.js компонент рендерит сырой HTML через `dangerouslySetInnerHTML`.

```
ZIP → парсер (Cheerio) → массив { html, css, type, tags }
  → для каждого блока: создать Craft.js HtmlBlock node
  → добавить на canvas через actions.add()
```

**Что переносится:** структура блока, текст, картинки, классы, inline стили, layout.
**Что НЕ переносится:** JS логика, CSS анимации, медиа-запросы, формы с валидацией, слайдеры.

**Приоритет:** НЕ первоочередная задача. Сначала Container-in-Container архитектура и Component Library. Парсер — способ быстро наполнить библиотеку компонентов из имеющихся 35+ ZIP шаблонов.

## Compilation Progress (40+ секунд)

7 шагов с прогресс-баром: Подбор компонентов (5s) → HTML (8s) → Стили (7s) → GSAP (6s) → Backend (10s) → PWA (3s) → Оптимизация (4s) ≈ 43 секунды.

## Output Structure

- Frontend: html, css, js, manifest.json, sw.js, assets
- Backend: api_routes[], database_schemas[], env_vars_template, readme
- Deployment: tier, pricing, features
- Domain: name, price, registration_id, nameservers (если покупается)
- Metadata: source, components_used, backend_blocks_used, total_size_kb, compilation_time_ms

---

# 📋 F06: ТЕСТИРОВАНИЕ — СОГЛАСОВАНО

**Статус:** 📋 Согласовано

## Test Framework

Vitest (unit) + Playwright (e2e) + GitHub Actions CI.

## Test Cases (обновлено v6)

1. **Интерактив: только frontend** — Landing пакет, 6 блоков, static deploy
2. **Интерактив: frontend + 1 backend** — Landing + Contact Form
3. **Интерактив: полный e-commerce** — Launch пакет, docker deploy
4. **Редактор: кастомная сборка** — Craft.js → serialize → Living Project JSON → build
5. **Редактор: с backend блоками** — Full Stack подписка, 6 блоков
6. **Living Project: гидратация** — Сохранить → закрыть → открыть → проверить что все ноды intact
7. **ZIP Export** — Проверить что stripped build работает standalone
8. **Preview Mode** — Anonymous → preview → register → claim project
9. **Craft.js save/load cycle** — serialize → compress → Supabase → load → decompress → deserialize → verify nodes match
10. **Multi-page** — Создать 3 страницы → переключаться → проверить что данные каждой страницы сохранены
11. **Container-in-Container** — SectionBlock + LayoutBlock + CardBlock → resize → save → load → verify
12. **Mobile Editor** — click-to-place → edit → save mobileData → verify на десктопе

## Acceptance Criteria

- Собранный сайт открывается без ошибок в Chrome, Safari, Firefox
- Mobile responsive на всех breakpoints
- Lighthouse score: Performance > 80, Accessibility > 90
- Backend endpoints отвечают корректно
- ZIP export содержит только клиентский код
- Craft.js serialize → deserialize = lossless (100% нод сохранены)

## Тестирование с братом

- Собрать сайт через Интерактив, пройти полный flow
- 100% скидка для теста
- Деплой на subdomain iamrunning.online

---

# 📋 F07: ИНТЕРАКТИВ — ПОЛНЫЙ WORKFLOW — СОГЛАСОВАНО

**Статус:** 📋 Согласовано (без изменений от v5.0)

> 8 шагов + Preview Mode + Registration flow.

## 8 ШАГОВ ИНТЕРАКТИВА (с опциональным Branching)

### Шаг 1: ТИП БИЗНЕСА

Выбор из 16 типов (food, shop, ecommerce, startup, business_card, portfolio, craft, beauty, health, education, agency, consulting, blog, event, real_estate, travel). Сохраняется как `"business_type": "food"`.

**Branching (опционально):** После выбора → подтипы (3-5 на каждый тип, см. F02). Можно пропустить. Сохраняется как `"business_subtype": "restaurant"`.

### Шаг 2: СТИЛЬ

12 стилей (clear, dark, neon_futuristic, minimal, elegant, bold, soft, corporate, creative, playful, brutalist, glassmorphism). Сохраняется как `"style": "minimal"`.

### Шаг 3: ПАЛИТРА

16 палитр (8 solid + 8 gradient). Каждая: 3-5 цветов (primary, secondary, accent, bg, text). Градиенты: 3-4 оттенка одного цвета. Сохраняется как `"palette": "pure_white"`.

### Шаг 4: БЛОКИ С ВАРИАНТАМИ

Пользователь выбирает какие блоки будут на сайте (Header, Hero, About, Services, Portfolio, Stats, Team, Features, FAQ, Pricing, CTA, Footer) + вариант каждого (3-5 вариантов). Сохраняется как массив `"blocks": [{ "type": "header", "variant": "minimal", "order": 1 }]`.

### Шаг 5: ПОРЯДОК БЛОКОВ

Drag-and-drop для изменения порядка. Обновляется `"order"` в массиве blocks.

### Шаг 6: АНИМАЦИЯ

10 пресетов с live preview при hover/tap:

| # | Название | Вайб | Описание |
|---|----------|------|----------|
| 1 | None | Статичный | Без анимаций, быстрая загрузка |
| 2 | Subtle | Сдержанный | Минималистичные fade-in |
| 3 | Elegant | Изысканный | Плавные, премиум |
| 4 | Dynamic | Живой | Энергичные scale/rotate |
| 5 | Playful | Весёлый | Bounce, elastic |
| 6 | Corporate | Профессиональный | Строгие, деловые |
| 7 | Bold | Смелый | Агрессивные, яркие |
| 8 | Smooth | Спокойный | Очень плавные, медленные |
| 9 | Tech | Современный | Футуристичные, expo easing |
| 10 | Cinematic | Впечатляющий | Кинематографичные, драматичные |

Desktop: Сетка 3x3+1. Mobile portrait: вертикальный скролл, карточки 150x150px. Mobile landscape: горизонтальный свайп.

По дефолту: "Subtle".

### Шаг 7: ДЕТАЛИ

Поля **динамически** появляются в зависимости от выбранных блоков на Шаге 4.

**Обязательные:**
- Название компании (max 50 символов, required)
- Логотип (PNG/JPG/SVG, max 2MB, drag-and-drop + кнопка, авто-конверсия в base64)

**Опциональные (зависят от блоков):**
- Телефон (если Contact/Footer) — international format, libphonenumber-js
- Email (если Contact/Newsletter/Footer) — regex + опционально DNS MX
- Адрес (если About/Contact/Footer) — Google Places Autocomplete
- Соцсети (если Footer/Header) — Facebook, Instagram, Twitter, LinkedIn URLs
- Часы работы (если About/Contact/Footer) — Dropdown по дням, быстрый выбор "Пн-Пт 9-18"

**Backend настройки (динамические):**
- Supabase URL + Anon Key + Service Key (если User Auth / DB блоки)
- Stripe keys (если Stripe Payment)
- PayPal keys (если PayPal)
- Resend API Key (если Contact Form / Newsletter)
- OAuth keys (если Social Auth)
- OpenAI API Key + System Prompt (если AI Chatbot)

**Шифрование API ключей:** AES-256-CBC с IV, хранение как `iv:encrypted` в БД.

### Шаг 8: ДОМЕН

**1. Подключу свой домен:**
- Ввод домена
- Выбор deployment уровня (DIY / Deploy / Full Service)
- DNS credentials для Deploy/Full Service (username + API token)
- Авто-настройка DNS через API (Namecheap, GoDaddy, Cloudflare)

**2. Хочу купить новый:**
- Ввод желаемого домена + выбор extension (.com/.net/.org)
- Проверка доступности через Namecheap API
- Показ альтернатив если занят
- Покупка + WhoisGuard бесплатно

**3. Пока нет:**
- Subdomain: `{slug}-{random}.iamrunning.online`
- Можно добавить домен позже из Dashboard
- Выбор deployment уровня

---

## PREVIEW MODE WORKFLOW (ШАГИ 9-12)

### Шаг 9: Compilation (40+ секунд)

Кнопка "Собрать сайт" → прогресс-бар (7 шагов, ~43 сек).

**Anonymous storage:** localStorage UUID → Redis TTL 7 дней (anon_id → contract + assembled + preview_token).

### Шаг 10: FULL PREVIEW (КЛЮЧЕВОЙ МОМЕНТ)

Страница `/preview/{preview_token}` — полноценный интерактивный сайт:
- Полный рендер, скролл, навигация, все анимации
- Desktop/Mobile toggle
- **Рендерится через кастомный renderer из Living Project JSON, НЕ через Craft.js** (F05 lightweight renderer)

**Свободно:** ✅ Просмотр, скролл, навигация, анимации.

**Требует регистрации + оплаты:**
- 🔒 Edit → Modal "Зарегистрируйтесь"
- 🔒 Buy/Launch → Modal "Зарегистрируйтесь"
- 🔒 Download ZIP → Modal "Скачивание после покупки"

**Mock Strategy для backend компонентов в preview:**
- Contact Form submit → toast "Сообщение отправлено!" (fake)
- Stripe/PayPal → modal "Оплата подключится после деплоя"
- Auth формы → toast "Авторизация после деплоя"
- Каталог → placeholder товары из contract

### Шаг 11: Регистрация (при попытке действия)

- Google OAuth или Email/Password + Resend confirmation
- Terms of Service (включает Shadow Mode consent)
- Claim: Redis → БД → delete Redis
- После регистрации → возврат к триггернувшему действию

### Шаг 12: Dashboard

Confetti 🎉 + toast "Проект сохранён!" Ограничение: 1 проект (draft/paid блокируют).

## Edge Cases

- **Закрыл окно во время компиляции:** localStorage восстанавливает прогресс (< 7 дней)
- **Redis TTL истёк (7 дней):** "Проект истёк, создайте новый"
- **Прямой /preview/{token}:** Работает, действия заблокированы
- **Email занят:** Предлагаем войти + claim

## Метрики

Funnel: starts → step_8 → preview → action → registration

Целевые: Step8→Preview: 95%+, Preview→Action: 70-80%, Action→Reg: 85%+, **Overall: 55-65%**

---

# ✅ F08: DASHBOARD — ВЫПОЛНЕНО

**Статус:** ✅ Выполнено (production-ready)

CRUD проектов, статистика, i18n (en/ru/he), статусы (draft/paid/deployed/expired). Без изменений.

---

# 📋 F09: ПРИМИТИВНОЕ РЕДАКТИРОВАНИЕ — СОГЛАСОВАНО

**Статус:** 📋 Согласовано (реализация через Craft.js)

> **ИЗМЕНЕНИЕ v5:** Реализуется как ограниченный Craft.js конфиг вместо кастомного UI.

Упрощённый редактор для пользователей Интерактива. Максимальная простота без возможности "сломать" сайт.

## 6 функций

### 1. ТЕКСТ (Inline Editing)
`react-contenteditable` через Craft.js (two-click inline editing). Max 200 символов заголовки, 500 параграфы.

### 2. КАРТИНКИ (Upload)
Upload + Cropper.js + WebP 85% → обновление через `setProp(p => { p.src = newSrc; })`.

### 3. ЦВЕТА (Из палитры)
Только цвета из выбранной палитры (primary, secondary, accent, bg, text). Lookup table → className. Через CSS variables.

### 4. ПРОЗРАЧНОСТЬ (Opacity)
Slider 0-100% → `setProp(p => { p.opacity = value; })`. Live preview.

### 5. РАЗМЕР (Scale)
Presets: S (75%), M (90%), L (100%), XL (110%), XXL (125%). Или точное значение → `setProp(p => { p.fontSize = value; })`.

### 6. ПОВОРОТ (Rotation)
Desktop: dial. Mobile: кнопки (0°, ±45°, ±90°, 180°). Или точное значение → `style={{ transform: rotate(${deg}deg) }}`.

## Реализация: primitiveResolver

```typescript
// Ограниченный resolver — только base components с simplified settings
const primitiveResolver = {
  Container: ContainerPrimitive,  // Упрощённый — нет добавления children
  Text: TextPrimitive,            // Только текст и цвет
  Image: ImagePrimitive,          // Только src и размер
  Hero: HeroPrimitive,            // Только текст, bgColor
  // НЕ включены: Button, Header, Footer как отдельные draggable элементы
};

// Ограниченный settings panel — показывает только 6 функций
// НЕ показывает: gradient builder, animation controls, добавление блоков
```

## Ограничения

- **Нельзя удалять/добавлять блоки** → Toolbox скрыт
- При попытке структурных изменений → warning с предложением подписки на Редактор (Craft.js full, $199/мес)
- **Нельзя менять порядок блоков** → Layers Panel скрыт или read-only
- Undo/Redo доступен (50 changes max)
- Auto-save каждые 30 сек
- Keyboard shortcuts: Ctrl+Z, Ctrl+Shift+Z, Ctrl+S

## Сохранение

Каждое редактирование → `setProp` → auto-serialize → `lz-string` compress → Supabase `projects.data`. Incremental через onNodesChange debounce.

---

# 📋 F10: DASHBOARD ДЛЯ ОБЫЧНЫХ ПОЛЬЗОВАТЕЛЕЙ — СОГЛАСОВАНО

**Статус:** 📋 Согласовано

Минималистичный личный кабинет для тех кто создал сайт через Интерактив. **ОДИН проект** одновременно.

**Принципы:**
- ✅ Простота и фокус на единственном проекте
- ✅ Без домена → только DIY (ZIP download) ИЛИ subdomain iamrunning.online
- ✅ Deploy/Full Service → нужен домен (свой или купленный)
- ✅ Subdomain iamrunning.online доступен для деплоя

## Статусы проекта

| Иконка | Статус | Описание | Действия |
|--------|--------|----------|----------|
| 📝 | Черновик | Не оплачен | Редактировать, Купить, Удалить |
| 💳 | Оплачен | Оплачен, не задеплоен | Деплой (если есть домен/subdomain), Скачать ZIP, Удалить |
| 🚀 | Deployed | Live на сервере | Открыть сайт, Редактировать, Управление, Скачать ZIP |
| ⚠️ | Просрочен | Хостинг не оплачен >7 дней | Оплатить, Скачать backup, Удалить |

## Кнопки

1. **Превью** (👁️) — Modal с iframe, переключение Mobile/Desktop
2. **Редактировать** (✏️) → Примитивное Редактирование (F09, Craft.js с primitiveResolver)
3. **Купить** (💰) → Checkout (F14)
4. **Скачать ZIP** (📥) — Только после оплаты. Stripped build
5. **Удалить** (🗑️) — С подтверждением, рекомендация скачать ZIP сначала

## Ограничение 1 проект

- `canCreateNewProject()`: проверяет что нет draft/paid проектов (deployed не блокируют)
- Modal с вариантами: удалить текущий ИЛИ купить/задеплоить текущий

## Домен

- `canDeploy()`: проверяет домен + DNS + оплату
- Выбор домена доступен из Dashboard (свой / купить / subdomain)
- DNS status checking

## Дополнительно

- Notification center (уведомления о деплое, платежах)
- Settings (профиль, безопасность, оплата, язык, поддержка)
- Empty state: CTA "Создать сайт" + примеры

---

# ❌ F11: GRAPESJS РЕДАКТОР — DEPRECATED

**Статус:** ❌ DEPRECATED (заменён на F02.5 Craft.js Editor Core, 15.02.2026)

> GrapesJS удалён из проекта. Причины:
> - Backbone.js (2010) несовместим с React
> - iframe canvas → CSS конфликты, performance bottleneck
> - O(N×M) HTML парсинг → замораживает браузер
> - 2+ дня работы + $12 Windsurf = проблемы остались
>
> Вся функциональность F11 перенесена в F02.5 (Craft.js Editor Core).

## COMPONENT ISOLATION (ОБНОВЛЁННАЯ СТРАТЕГИЯ)

**Старый подход (GrapesJS):** Custom Trait Manager → Tailwind classes через iframe. Inline стили запрещены.

**Новый подход (Craft.js):** React tree rendering (не iframe) → нет CSS конфликтов между компонентами.

- Tailwind utility classes — основной метод стилизации
- `style={{}}` для динамических пользовательских значений (цвета, размеры)
- CSS Variables bridge: `className="bg-[var(--user-bg)]"` + `style={{'--user-bg': color}}`
- `safelist` в tailwind.config.ts для предсказуемых dynamic классов
- Компонентные CSS modules где нужна дополнительная изоляция
- **v6: ThemeContext** для глобального распространения accentColor + colorScheme

## Доступ по подпискам

| Функция | Frontend $199 | Full Stack $599 | Professional $999 |
|---------|---------------|-----------------|-------------------|
| Проекты | 3 | 5 | 10 |
| Craft.js Editor | ✅ | ✅ | ✅ |
| **Mobile Editor** | ✅ | ✅ | ✅ |
| Backend визуализация | ❌ | ✅ | ✅ |
| AI Code Generator | ❌ | ❌ | ✅ 20 msg/day |

## Фичи Редактора (адаптированы под Craft.js)

1. **UI Positioning** — left sidebar (280px, Toolbox + Layers) + canvas (flex, Frame) + right sidebar (320px, Settings) + top toolbar (50px)
2. **Сохранение/загрузка** — Auto-save (2s debounce) + manual Ctrl+S, warning при закрытии с unsaved changes
3. **Asset Manager** — Supabase Storage, 200MB, папки
4. **Image Editing** — Crop (Cropper.js), Rotate, Filters (grayscale/brightness/contrast/sepia), Background Removal (Clipdrop API), WebP
5. **Background Options** — Image/gradient через Custom Fields (F02.5)
6. **Responsive Preview** — Desktop/Laptop/Tablet/Mobile через variable-width wrapper
7. **Zoom Canvas** — CSS transform scale 50%-200% на Frame container
8. **Layers Panel** — Кастомная реализация: tree view, lock/hide, content preview, type badges
9. **Icon Library** — Font Awesome picker → prop iconName → рендер через `<i className>`
10. **Scroll Animations** — GSAP/AOS через animation wrapper (suppress в editor mode)
11. **Keyboard Shortcuts** — Ctrl+S (save), Ctrl+Z (undo), Ctrl+Shift+Z (redo), Delete (удалить), Ctrl+D (duplicate)
12. **Code View** — ОТКЛЮЧЕН ("Доступ запрещён")

## 🤖 AI CODE GENERATOR (Professional $999/мес)

**Провайдер:** Anthropic Claude 3.5 Sonnet. **Бюджет:** $5/мес.

**Лимит:** 20 сообщений/сутки (Redis, TTL 24h). Warnings при 5 оставшихся.

**System Prompt:**
- Идентичность: "AI Component Generator от I AM RUNNING"
- Область: ТОЛЬКО React/Tailwind компоненты для веб-сайтов
- Формат: React JSX с View + Settings + .craft паттерн (НЕ просто ```jsx блок)
- Responsive mobile-first, Accessibility

**Craft.js Pipeline для AI-генерированных компонентов:**
1. Claude Sonnet генерирует React JSX (View + Settings + .craft static)
2. Валидация синтаксиса (try parse)
3. **Динамическая регистрация в resolver** — resolver это объект, можно добавлять ключи в runtime
4. Создание Craft.js node через `actions.add(query.parseReactElement(<GeneratedComponent />).toNodeTree(), 'ROOT')`
5. Компонент появляется на canvas, доступен для drag/edit
6. Кнопка "Сохранить в библиотеку" → Supabase components таблица

**КРИТИЧНО:** Все AI-генерированные компоненты должны быть зарегистрированы в resolver ДО десериализации проекта. При загрузке проекта → проверяем serialized JSON → загружаем недостающие компоненты из `components` таблицы → регистрируем → deserialize.

---

# 📋 F12: BACKEND БЛОКИ ПАНЕЛЬ (ВИЗУАЛИЗАЦИЯ) — СОГЛАСОВАНО

**Статус:** 📋 Согласовано

WOW-фича: визуализация backend архитектуры проекта прямо в Craft.js редакторе. Доступна ВСЕМ фрилансерам.

## Доступ по подпискам

| Подписка | Доступ | Включённые блоки | Скидка на остальные |
|----------|--------|-------------------|---------------------|
| Frontend $199 | ✅ Покупка блоков | 0 | 25% |
| Full Stack $599 | ✅ 6 включены | Contact Form, User Auth, Product Catalog, Shopping Cart, Checkout, Stripe Payment | 30% |
| Professional $999 | ✅ Все включены | Все кроме Security Level 3 | 50% на Security L3 |

## UI по подпискам

- **Frontend:** Все блоки со скидкой 25%, upgrade промо на Full Stack
- **Full Stack:** 6 включённых + остальные со скидкой 30%, upgrade промо на Professional
- **Professional:** Все включённые, только Security Level 3 со скидкой 50%

## Покупка блока (для Frontend)

Stripe checkout → добавление в проект → auto-open настройка.

## Настройка блока (одинаковая для всех)

Modal с полями для API ключей. Шифрование AES-256-CBC. Тестирование подключения.

## Статусы

| Иконка | Статус |
|--------|--------|
| ⏳ | Pending — API ключи не настроены |
| ✅ | Active — работает |
| ⚠️ | Error — ошибка подключения |
| 🔒 | Disabled — временно отключён |

## Визуализация архитектуры

Диаграмма: Frontend → Backend блоки → Supabase. Статистика: endpoints, tables, services.

## Удаление

- Включённые блоки: "Отключить" (можно включить обратно бесплатно)
- Купленные: "Удалить" с подтверждением (данные будут потеряны)

---

# 📋 F13: DASHBOARD ФРИЛАНСЕРОВ — СОГЛАСОВАНО

**Статус:** 📋 Согласовано

Профессиональный управленческий центр. Множество проектов, статистика, клиенты, recurring revenue.

## Лимиты по подпискам

| Plan | Проекты | Блоки |
|------|---------|-------|
| Frontend $199 | 3 | Скидка 25% |
| Full Stack $599 | 5 | 6 включены + скидка 30% |
| Professional $999 | 10 | Все включены |

## Функции

- **Проекты:** Grid/List view, thumbnail, статус, клиент, MRR, backend блоки
- **Создать проект:** Проверка лимита, modal при достижении с upgrade предложением
- **Дублировать проект:** Copy с reset домена (для шаблонов)
- **Удалить проект:** С подтверждением, отмена хостинга, рекомендация backup
- **Фильтры:** По статусу, хостингу, backend
- **Сортировка:** По дате создания/обновления, названию, статусу, MRR

## Статистика

- Активных проектов / лимит
- Клиентов на хостинге
- MRR (Monthly Recurring Revenue)
- Всего проектов за всё время
- Backend блоков (включённые + купленные)
- Экономия на подписке
- AI сообщений сегодня (только Professional)

## Клиенты

Информация о клиенте к каждому проекту: company_name, contact_person, email, phone, notes.

## MRR График

Chart.js: помесячный MRR, рост, прогноз.

---

# 📋 F14: ОПЛАТА ЗА САЙТ (ИНТЕРАКТИВ) — СОГЛАСОВАНО

**Статус:** 📋 Согласовано

## Checkout

Полный breakdown: Сайт (пакет) + Backend блоки + Security Level + Deployment + Хостинг + Домен + Скидка (баннер -25%).

**Deployment опции:**
- DIY (ZIP) — FREE, всегда доступно
- Deploy ($10) — нужен домен или subdomain
- Full Service ($30) — нужен домен или subdomain, + настройка аккаунтов

**Хостинг:** Первый billing cycle FREE. Описание "для кого" (юзеры/товары/одновременные), не характеристики сервера.

**Security Level 1:** Included во все сайты, отображается явно.
**Security Level 2:** Обязателен при Auth/Payment, автоматически добавляется.

## Terms of Service

Modal с **обязательной прокруткой** до конца. Кнопка "Согласен" активируется только после прокрутки.

## Stripe Checkout

Line items: сайт + backend блоки + security + deployment + домен + скидка (баннер). Metadata: user_id, project_id, package_type, deployment_option, hosting_plan.

---

# 📋 F15: HOSTING ПОДПИСКИ — СОГЛАСОВАНО

**Статус:** 📋 Согласовано

## Планы

| Tier | USD | Для кого | Trial |
|------|-----|----------|-------|
| Starter | $20/мес | До 100 юзеров, 50 товаров, 10 одновременных | 1-й месяц FREE |
| Business | $29/мес | До 1,000 юзеров, 500 товаров, 50 одновременных | 1-й месяц FREE |
| Pro | $59/мес | До 10,000 юзеров, 5,000 товаров, 200 одновременных | 1-й месяц FREE |
| Enterprise | $99/мес | Безлимит юзеров/товаров, 1,000 одновременных | 1-й месяц FREE |

**Trial:** Первый billing cycle бесплатно (от даты подписки до +1 месяц).

## Автоматический Upgrade

- Сайт НЕ падает при превышении лимитов
- При 90%+ → email уведомление
- Scheduled upgrade на следующий billing cycle
- Пользователь может отменить scheduled upgrade
- Upgrade применяется при следующем платеже через Stripe

## Emails

- При приближении к лимиту (90%)
- При scheduled upgrade
- При применении upgrade
- При отмене scheduled upgrade

---

# 📋 F16: ПОДПИСКИ ФРИЛАНСЕРОВ — СОГЛАСОВАНО

**Статус:** 📋 Согласовано

## Планы

| Plan | USD | ILS | RUB | Проекты | Backend | AI | Trial |
|------|-----|-----|-----|---------|---------|-----|-------|
| Frontend | $199/мес | 1,000₪/мес | 20,000₽/мес | 3 | Скидка 25% | ❌ | 3 дня |
| Full Stack | $599/мес | 3,000₪/мес | 60,000₽/мес | 5 | 6 включены + скидка 30% | ❌ | 3 дня |
| Professional | $999/мес | 5,000₪/мес | 100,000₽/мес | 10 | Все включены | ✅ 20 msg/day | 3 дня |

**Скидка за баннер:** -25% от стоимости сайта (sticky баннер "I AM RUNNING" внизу).

## 3-дневный Trial

1. Привязка карты (списания НЕТ)
2. Полный доступ 3 дня
3. Автоматическое списание через 3 дня
4. Отмена в любой момент до конца trial — без списания

## Какие блоки включены

**Full Stack ($599):** Contact Form + User Auth + Product Catalog + Shopping Cart + Checkout + Stripe Payment = $280 value

**Professional ($999):** Все из Full Stack + Newsletter + SEO + Reviews/Ratings + User Dashboard + Wishlist + AI Chatbot + Order Tracking = $790 value

## Emails

1. Trial Start — что доступно, когда списание
2. Trial Ending (1 день до) — напоминание
3. Trial Converted — подтверждение списания
4. Trial Cancelled — что происходит с проектами

## Upgrade/Downgrade

Upgrade: prorated charge через Stripe. Downgrade: в конце billing cycle.

---

# 📋 F17: HYBRID DEPLOYMENT (Coolify) — СОГЛАСОВАНО

**Статус:** 📋 Согласовано

## Концепция

Hybrid Deployment через **Coolify** (self-hosted PaaS, open-source, бесплатно).

Coolify = Vercel/Heroku на своём VPS. Управляет static и Docker, автоматический SSL, reverse proxy (Traefik), dashboard, rollback.

## Deployment Strategy

| Тип проекта | Strategy | Как деплоится | Когда |
|-------------|----------|---------------|-------|
| Landing (только frontend) | `static` | Nginx static files через Coolify | Нет backend блоков |
| WebApp (с backend) | `docker` | Docker container через Coolify | Есть backend блоки |

**Автоопределение:** Сборщик → если `backend_blocks` пусто → static, иначе → docker.

## GitHub Strategy

**Каждый проект = отдельный GitHub private repo.**

**Workflow (static):** Сборщик → GitHub repo → Coolify webhook → static deploy → SSL auto → health check

**Workflow (docker):** Сборщик → GitHub repo (с Dockerfile) → Coolify webhook → docker build → container start → SSL auto → health check

## VPS

- **Старт:** Hetzner CX32 (4 cores, 16GB RAM, €14/мес, ~50 сайтов)
- **После 30 клиентов:** CX42 (8 cores, 32GB RAM, ~€50/мес, ~150 сайтов)

## Coolify: что даёт из коробки

- Dashboard (мониторинг всех проектов)
- Auto SSL через Traefik (не нужен Certbot)
- Docker management (build, run, restart, logs)
- Static site deployment
- Resource limits per container (CPU, RAM)
- Rollback к предыдущей версии
- Webhooks для auto-deploy из GitHub
- Built-in database management
- Health checks

**Что НЕ нужно настраивать вручную:** PM2 (Coolify управляет процессами), Certbot (Traefik auto-SSL), Nginx configs (Traefik reverse proxy), Port assignment (Coolify авто).

## Resource Limits

| Strategy | RAM per project | CPU |
|----------|----------------|-----|
| Static | ~50MB (Nginx) | Shared |
| Docker (Next.js) | 256MB limit | 0.5 CPU |
| Docker (Next.js + DB) | 512MB limit | 1 CPU |

## Subdomains

`{slug}-{random}.iamrunning.online` — автоматически через Coolify + DNS wildcard.

Custom domains: пользователь добавляет A/CNAME record → Coolify auto-SSL.

## Backup

- GitHub (primary): всё в репо
- Coolify: built-in backup для DB volumes
- Supabase: ответственность клиента (инструкции предоставляем)

## Rollback

GitHub tag/commit → Coolify redeploy previous version. Автоматически при failed health check.

## Мониторинг

- Coolify dashboard: CPU, RAM, uptime per project
- Alerts: email при downtime > 5 мин
- Logs: accessible через Coolify UI

## Deployment Automation (полный скрипт)

1. Сборщик генерирует файлы
2. GitHub API: create private repo + push code
3. Coolify API: create new service (static или docker)
4. Coolify: auto-build → auto-deploy → auto-SSL
5. DNS: subdomain или custom domain
6. Health check
7. Email клиенту: "Ваш сайт запущен!"
8. Обновление `projects` в БД: status → 'deployed'

---

# 📋 F18: SECURITY — СОГЛАСОВАНО

**Статус:** 📋 Согласовано

## Level 1 (Included во ВСЕ сайты)

| Мера | Инструмент | Описание |
|------|------------|----------|
| SSL | Traefik (через Coolify) | Автоматический Let's Encrypt |
| Firewall | UFW | allow 22, 80, 443 |
| Brute-force | Fail2Ban | Защита SSH и HTTP |
| Security headers | Traefik middleware | X-Frame-Options, X-Content-Type-Options, HSTS |
| DDoS базовый | Cloudflare Free | DNS proxy + базовая защита |
| Auto-updates | unattended-upgrades | Security patches |

## Level 2 (+$30, АВТО при Auth/Payment)

| Мера | Инструмент | Описание |
|------|------------|----------|
| SQL Injection | Supabase SDK | Параметризованные запросы (автоматически) |
| Row-Level Security | Supabase RLS | Policies на всех таблицах с user data |
| XSS | DOMPurify | Sanitize всего user input |
| Security Headers | helmet.js | Comprehensive headers для Next.js |
| CSRF | Next.js middleware | Built-in CSRF protection |
| Rate Limiting | express-rate-limit + Redis | Per-IP, per-endpoint limiting |
| Password | bcrypt (Supabase Auth) | Автоматический hashing |
| Input Validation | zod | Schema validation на всех API routes |

**Enforcement:** Сборщик проверяет backend_blocks → если есть auth/payment без Security L2 → добавляет принудительно + уведомление в checkout.

## Level 3 (+$150)

| Мера | Инструмент | Описание |
|------|------------|----------|
| Vulnerability Scan | OWASP ZAP | Автоматический monthly scan (cron) |
| Error Monitoring | Sentry (free tier) | Real-time error tracking |
| WAF | Cloudflare Pro ($20/мес) | Web Application Firewall + advanced DDoS |
| Health Monitoring | Coolify + Slack webhook | Alerts при downtime |
| Security Audit | OWASP ZAP reports | Quarterly automated reports |

## Платформа iamrunning.online (собственная безопасность)

| Мера | Описание |
|------|----------|
| Supabase RLS | На ВСЕХ таблицах, без исключений |
| API auth middleware | Проверка JWT на каждом protected route |
| Stripe webhook | Signature verification (stripe-webhook-secret) |
| Admin routes | Через Supabase service role (не anon key) |
| Auth rate limiting | 5 attempts/min на login/register |
| API keys | AES-256-CBC encryption, никогда plaintext |
| Environment | .env.local НИКОГДА в Git, Coolify secrets |
| ZIP export strip | Вырезаем все системные ключи и логику платформы |

---

# 🟢 F19: ДОПОЛНИТЕЛЬНЫЕ ФИЧИ — ПОЗЖЕ

## Showcase страница

- iamrunning.online/showcase
- Все deployed сайты
- Бесконечный скролл
- Плитки с превью и ссылками

## Лидерборд фрилансеров

- ТОП фрилансеров месяца
- По display_name, НЕ email
- Публичный

---

# 📋 F20: AI SUPPORT CHAT + SHADOW INSIGHTS — СОГЛАСОВАНО

**Статус:** 📋 Согласовано

## SUPPORT CHAT ASSISTANT

**Провайдер:** OpenAI GPT-4o-mini. **Бюджет:** $10/мес.

**Доступ:** ВСЕ пользователи (включая анонимов). Инструмент продаж — без hard rate limits.

**Soft budget management:** При 80% бюджета → ответы короче (lower max_tokens). При 100% → fallback на статичные FAQ ответы (без API call).

**UI:** Floating chat bubble → drawer. Mobile: full-screen drawer.

**Session ID:** localStorage UUID (тот же что для anonymous preview projects).

### GUARDRAILS (System Prompt)

**Идентичность:** "AI Assistant от I AM RUNNING" (НЕ GPT, НЕ OpenAI).

**Разрешено:**
- Платформа I AM RUNNING (функции, цены, помощь)
- Веб-разработка (общие вопросы)
- Бизнес клиента (выбор пакета, блоков)
- Сравнение с конкурентами
- Техническая поддержка

**Запрещено (жёсткое пресечение):**
- ❌ Генерация кода, стихов, историй
- ❌ Политика, религия, личные темы
- ❌ Всё не о платформе/веб-разработке/бизнесе
- Ответ: "Я могу помочь только с вашим сайтом и платформой I AM RUNNING."

**Конверсионная задача:** Мягко направляет к покупке/подписке с конкретными рекомендациями пакетов.

**Контекст system prompt:** Текущие цены, описания пакетов, FAQ, список backend блоков. Обновляется при изменении цен.

## SHADOW MODE

**Согласие:** Пункт в Terms of Service.

### Pipeline

1. Пользователь общается (real-time, GPT-4o-mini)
2. Завершение сессии (закрытие чата / 5 мин inactivity)
3. **Batch extraction:** Раз в час собираем все завершённые сессии → один GPT-4o-mini call на batch (~10-20 диалогов) → извлекаем JSON инсайты
4. Сохранение в `chat_insights`
5. Weekly aggregation для паттернов

### Extracted JSON

```json
{
  "session_id": "uuid",
  "insights": {
    "business_type": "restaurant",
    "pain_points": ["need online menu", "want delivery"],
    "intent": "purchase_launch_package",
    "budget_signal": "medium",
    "technical_level": "beginner",
    "language": "ru",
    "objections": ["price too high"],
    "features_interested": ["e-commerce", "booking"],
    "competitor_mentions": ["wix"]
  }
}
```

### Будущее

- Обучение Mistral на собранных данных
- Автоперсонализация
- Умные рекомендации
- Анализ причин отказа

## Приоритет реализации

**Этап 1 (MVP):** Support Chat + system prompt. Без Shadow Mode.
**Этап 2:** Shadow Mode extraction pipeline.
**Этап 3:** Analytics dashboard.

---

# TERMS OF SERVICE

- Право использовать любой сайт клиента в качестве примера/рекламы
- Showcase страница со всеми deployed сайтами
- Согласие на анонимизированный анализ диалогов с AI для улучшения сервиса
- ZIP содержит только клиентский код, без логики платформы
- Пользователь соглашается при регистрации

---

# ПОРЯДОК РАЗРАБОТКИ (v6.0)

```
F01 (БД) ✅
  │
  ├──► F02 (Наполнение) ✅
  │
  ▼
F08 (Dashboard) ✅
  │
  ▼
F02.5 (Craft.js Editor Core) 🟡 ЧАСТИЧНО
  │
  ├──► Phase 1 (Critical Fixes) ✅
  ├──► Phase 2 (Core Features) 🟡
  ├──► Phase 3 (Visual Polish) 🟡
  ├──► Phase 4 (Data Layer) 🟡
  │
  ▼
F02.5 Phase 5 (Container-in-Container) 📋 ← ТЕКУЩИЙ ФОКУС
  │
  ▼
F02.5 Phase 6 (Unfulfilled Items) 📋
  │
  ▼
F02.6 (Mobile Editor) 📋
  │
  ▼
F03 (Frontend Component Library) 📋
  │
  ▼
F04 (Backend Blocks) 📋
  │
  ▼
F05 (Assembler + Living Project) 📋
  │
  ▼
F06 (Тестирование) 📋
  │
  ┌──────┴──────┐
  ▼             ▼
F07 (Интерактив  F11 (Deprecated)
 + Preview Mode) │
  │             ├──► Фичи редактора
  │             │    (F02.5 покрывает)
  │             │
  ▼             ▼
F09 (Примитивное F12 (Backend Panel)
 редактирование) │
  │             ▼
  ▼           F13 (Dashboard
F10 (Dashboard    фрилансеров)
 обычных юзеров) │
  │             │
  └──────┬──────┘
         ▼
  F14-F16 (Оплата/Подписки)
         │
         ▼
  F17 (Hybrid Deployment / Coolify)
         │
         ▼
  F18 (Security)
         │
         ▼
  F20 (AI Support Chat)
         │
         ▼
  ═══► ЗАПУСК! ◄═══
         │
         ▼
  F19 (Showcase, Лидерборд — после запуска)
```

---

# ОЦЕНКА ВРЕМЕНИ

При работе 4-5 часов/день:

| Блок | Оценка | Комментарий |
|------|--------|-------------|
| **F02.5 Phase 3-4** (remainder) | 2-3 дня | Layers Panel, Gradient Builder, Typography, Schema migration |
| **F02.5 Phase 5** (CiC) | 5-7 дней | SectionBlock, LayoutBlock, CardBlock, ThemeContext, TronPricing PoC, миграция |
| **F02.5 Phase 6** (долги) | 3-5 дней | localStorage WAL, Background Upload, оставшееся |
| **F02.6** (Mobile Editor) | 10-15 дней | Click-to-place, Bottom Sheet, PWA, touch UI |
| **F03** (Component Library) | 7-10 дней | CiC компоненты, View+Settings+.craft, тестирование |
| **F04** (Backend Blocks) | 7-10 дней | Модули, API routes, DB schemas, meta.json, шифрование |
| **F05** (Assembler) | 5-7 дней | Living Project JSON, pipeline, HTML/CSS/JS generation, ZIP export |
| **F06** (Тестирование) | 3-5 дней | Vitest + Playwright, 12 test cases, CI/CD |
| **F07** (Интерактив) | 7-10 дней | 8 шагов UI, Preview Mode, Registration, Compilation |
| **F09** (Примитивное) | 3-5 дней | primitiveResolver, 6 функций, ограничения |
| **F10** (Dashboard юзеров) | 3-5 дней | Статусы, кнопки, 1-проект лимит, домен |
| **F12** (Backend Panel) | 3-5 дней | Визуализация, подписки, статусы, покупка |
| **F13** (Dashboard фрилансеров) | 3-5 дней | Grid/List, статистика, MRR, клиенты |
| **F14-F16** (Оплата) | 5-7 дней | Stripe checkout, hosting подписки, freelancer подписки, trial |
| **F17** (Deployment) | 5-7 дней | Coolify setup, GitHub API, automation script, DNS |
| **F18** (Security) | 3-5 дней | 3 уровня, enforcement, платформа |
| **F20** (AI Chat) | 3-5 дней | GPT-4o-mini, system prompt, Shadow Mode pipeline |

**Итого:** ~80-120 рабочих дней

**Реалистичный launch:** Июль-август 2026

**Отклонение от v5 (май 2026):** +2-3 месяца из-за добавления Container-in-Container архитектуры и Mobile Editor. Это инвестиции в масштабируемость и killer feature, а не потеря времени.

---

# ТЕХНИЧЕСКИЙ СТЕК (СВОДКА v6.0)

| Область | Технология |
|---------|-----------|
| Frontend | Next.js 15, TypeScript, React, Tailwind CSS |
| Visual Editor | Craft.js |
| **Component Architecture** | **Container-in-Container (SectionBlock → LayoutBlock → CardBlock)** |
| **Theme System** | **ThemeContext (accentColor + colorScheme)** |
| Editor State | Craft.js `query.serialize()` + `lz-string` compress → Supabase JSONB (desktopData + mobileData) |
| Resize | `re-resizable` (handles на CardBlock) |
| **Mobile Editor** | **Click-to-place + Bottom Sheet + PWA** |
| Inline Editing | `react-contenteditable` (two-click pattern) |
| Drag & Drop | Craft.js native (NOT React DnD) |
| Database | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| AI Support | GPT-4o-mini ($10/мес budget) |
| AI Code Gen | Claude 3.5 Sonnet ($5/мес budget) |
| Animations | GSAP + ScrollTrigger |
| Payments | Stripe (checkout, subscriptions, webhooks) |
| Deployment | Coolify (self-hosted PaaS) + Traefik (SSL, reverse proxy) |
| VPS | Hetzner CX32 → CX42 |
| CI/CD | GitHub Actions + Coolify webhooks |
| Email | Resend (custom domain) |
| i18n | next-intl (en/ru/he) |
| Testing | Vitest + Playwright |
| Monitoring | Coolify dashboard + Sentry (L3) + Slack webhooks |

---

# ВЫУЧЕННЫЕ УРОКИ (v6.0)

1. **Два продукта, не один** — Интерактив и Редактор требуют разных UX, технологий и целевых аудиторий
2. **GrapesJS несовместим с React** — Backbone.js (2010) + iframe canvas = тупик. Craft.js решил проблему
3. **AI не создаёт premium дизайн** — Даже топовые модели с референсами = generic Tailwind. Нужны купленные библиотеки + ручная полировка
4. **Цены по capacity, не по серверу** — "100 юзеров, 50 товаров" понятнее чем "2GB RAM, 1 CPU"
5. **Mobile-first обязательно** — Больше половины трафика = мобильный
6. **Coolify > PM2+Nginx+Certbot** — Один инструмент вместо трёх, бесплатно
7. **Отдельные desktopData/mobileData** — Единственный правильный подход к responsive editing
8. **Short focused prompts** — Одна задача за раз, сразу тестируем на production
9. **Монолиты не масштабируются** — CiC решает конфликты ресайзинга между тремя уровнями width
10. **Правильная архитектура сейчас > рефакторинг потом** — Миграция на CiC дешевле чем борьба с width conflicts
11. **Отдельные данные = новые возможности** — desktopData/mobileData привели к идее Mobile Editor
12. **Killer feature из существующей архитектуры** — Mobile Editor не требует переписывания, только новый UI
13. **Component Guide = инвестиция** — Детальные правила компонентов экономят итерации с AI
14. **Deprecation > deletion** — LEGACY монолиты остаются для обратной совместимости
