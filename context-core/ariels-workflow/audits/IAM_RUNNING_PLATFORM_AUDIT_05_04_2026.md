# ПЛАТФОРМЕННЫЙ АУДИТ — I AM RUNNING
**Дата:** 05.04.2026
**Кто проводил:** Claude (super_admin сессия)
**Источники:** ROADMAP v9, ARCHITECTURE.md, ENGINEERING_MEMORY.md, PROGRESS.md, MVP_HAPPY_PATH.md, EVOLUTION (25/26/27.03), IAM_CLIENT_OS_PLAN.md, MAIN.md
**Цель:** Понять текущее состояние платформы I AM RUNNING для принятия решений об интеграции с iam-client-os

---

## ЧАСТЬ 1: КАРТА ПЛАТФОРМЫ

### 1.1 Три продукта под одной крышей

```
iamrunning.online
├── Door A — Interactive (Wizard)       — 4-step → assembly → preview → deploy
├── Door B — Editor (Craft.js)          — Visual editor для фрилансеров
└── Door C — AI Business OS             — iam-client-os (отдельный VPS/репо)
```

**Общий фундамент (на одном сервере iamrunning.online):**
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- 18 Tron компонентов (Craft.js)
- SiteRenderer.tsx (SSR клиентских сайтов)
- ThemeContext (accentColor + colorScheme)
- MCP Connector (12 tools, /api/mcp/*)
- Dev Console (встроенная IDE)
- Context Core (19+ docs)
- Auth + Role System v2 (roles 0–7)
- Nginx wildcard *.iamrunning.online + PM2

**НЕ на том же сервере:**
- iam-client-os → отдельный репо (ArielGrook/iam-client-os), отдельный VPS (test.lego-base.online)

---

### 1.2 Статусы (по состоянию на 27.03.2026 — дата последнего обновления PROGRESS.md)

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| Craft.js Editor (18 Tron компонентов) | ✅ Работает | |
| Client site deploy (*.iamrunning.online) | ✅ Работает | SSR, wildcard SSL |
| Dev Console | ✅ Работает | File manager, git, deploy, rollback |
| MCP Connector | ✅ Работает | 12 tools, OAuth 2.0 |
| Interactive Pipeline | ✅ Работает | 4 шага + assembly + preview + save |
| Context Core | ✅ Работает | 19+ документов, живая память |
| Landing v3 | ✅ Работает | Hero, ThreeDoors, Speed, Hosting, SavingsCalculator, FinalCTA |
| Auth + Role System | ✅ Работает | httpOnly cookie admin, Realtime role propagation |
| Multi-tenancy Option A | 🟡 Частично | follin.lego-base.online работает, не в проде |
| Stripe / Payments | ❌ НЕ сделано | 🔴 MVP BLOCKER |
| Route protection (editor) | ❌ НЕ сделано | 🔴 MVP BLOCKER |
| TronForgotPassword/EmailConfirmation | ❌ НЕ сделано | Auth flow не завершён |
| Backend Blocks (F04) | ❌ НЕ сделано | Согласовано, не реализовано |
| Freelancer Dashboard | ❌ НЕ сделано | Согласовано |
| Mobile Editor | ❌ НЕ сделано | Отложен |
| AI Support Chat | ❌ НЕ сделано | GPT-4o-mini, после launch |

---

## ЧАСТЬ 2: ДЕТАЛЬНЫЙ АУДИТ — TRACK 1 (WEBSITE BUILDER)

### 2.1 Что реально работает end-to-end

**Happy Path (100% работает):**
```
Visitor → Interactive (4 шага) → Assembly → Preview → Signup → 
Supabase save → Dashboard → Editor (Craft.js) → Deploy → *.iamrunning.online (live)
```

**Критические пути:**
- ✅ Interactive wizard → contract → Assembler → Craft.js JSON → lz-compress → Supabase
- ✅ Editor: deserialize → Frame → DnD → serialize → lz-compress → save
- ✅ Deploy: slug → SiteRenderer.tsx → SSR → nginx wildcard → live site
- ✅ Theme: ThemeContext → accentColor/colorScheme → все компоненты
- ✅ Multi-page: desktopData/mobileData раздельно → page switching → Frame key remount

**18 Tron компонентов (все работают):**
HeaderTron, HeroTron, TronFeatures, TronPortfolio, TronTestimonials, TronPricing,
TronFAQ, TronFooter, TronContact, TronStats, TronShowcase, TronLogin, TronRegister,
TronHub, TronAbout, TronCTA, TronServices, TronTeam

### 2.2 Что НЕ работает / технический долг

**🔴 MVP Blockers (без них нет продаж):**
1. **Stripe** — нет checkout, нет webhook, нет role upgrade. Весь монетизационный слой отсутствует.
2. **Route protection** — editor доступен без оплаты. Guard только client-side, не на уровне middleware.

**🟡 Незавершённые фичи:**
3. **Auth flow** — нет TronForgotPassword, нет TronEmailConfirmation. Пользователь застревает при проблемах с паролем.
4. **Anonymous → signup restore** — проект из localStorage не всегда восстанавливается при регистрации.
5. **Interactive i18n** — wizard только на английском, ru/he не работают.
6. **mobileData generation** — нет автогенерации мобильной версии в Interactive.

**🟢 Долг, не блокирующий запуск:**
7. **Interactive 8 полных шагов** — реализованы 4 из 8 (нет: порядок блоков DnD, анимации, детали/лого, домен).
8. **Preview Mode** — `/preview/{token}` полноценный preview не сделан.
9. **Примитивное редактирование (F09)** — упрощённый Craft.js для пользователей Interactive.
10. **Dashboard обычных пользователей (F10)** — нет полного UI (Draft/Paid/Deployed/Expired).
11. **Backend Panel (F12)** — Canvas с 6 нодами есть, но покупка/настройка блоков не сделана.
12. **Freelancer Dashboard (F13)** — не сделан.
13. **Backend Blocks (F04)** — ни один модуль не реализован.
14. **Mobile Editor (F02.6)** — отложен.
15. **Settings Panel** — неоднородный дизайн.

### 2.3 Архитектурные ловушки (задокументированные)

| Ловушка | Последствие | Решение |
|---------|-------------|---------|
| lzutf8 без опций | Бинарный мусор вместо данных | Всегда `{ outputEncoding: 'Base64' }` |
| Frame key break | Десериализация не срабатывает | `key={activePageId-frameKey}` нельзя трогать |
| useMemo для Supabase | Render loop, тысячи GoTrueClient | Всегда через useMemo |
| GSAP stagger opacity:0 | Ломает editor (компоненты невидимы) | Запрещено в компонентах |
| Cursor spotlight в компоненте | Двойная яркость | Только в SiteRenderer |
| pm2 self-kill | Deploy route не успевает ответить | `nohup sleep 2 && pm2 restart` |
| middleware.ts в BLOCKED_PATTERNS | Блокирует через MCP | `node -e fs.writeFileSync` |
| USER_UPDATED не срабатывает | Роль не обновляется | Realtime подписка на profiles |
| Assembler порядок блоков | Footer попадает в середину | Canonical order в assembler |

### 2.4 Реальная оценка готовности Track 1

**Что есть:** Полноценный website builder с визуальным редактором, 18 компонентами, деплоем, мультистраничностью, темами. Технически это зрелый продукт.

**Чего нет для запуска:** Только два блокера (Stripe + route protection) + лендинг с чётким pricing/CTA.

**Оценка времени до первой продажи Track 1:** 10–15 рабочих дней (при фокусе).

---

## ЧАСТЬ 3: ДЕТАЛЬНЫЙ АУДИТ — TRACK 2 (IAM CLIENT OS)

### 3.1 Текущее состояние

**Живёт на:** test.lego-base.online (185.5.55.111, Time4VPS, Ubuntu 24.04)
**Репо:** ArielGrook/iam-client-os (private)
**Vercel демо:** iam-client-os.vercel.app
**progress_percent в memory/:** 92%

**Что работает (подтверждено 04.04.2026):**
- MCP server v2.0 — 15+ tools, роли, rate limiting, session tracking
- OAuth team flow — stateless AES-256-GCM, free Claude поддерживает 1 custom MCP
- Admin panel — 8 табов + Logs (полный feature set)
- User Dashboard — 5 табов, polling, Start Working prompts
- Messaging System V2 — conversations, groups, avatars, push notifications
- Push Notifications — SW, VAPID, auto-prompt, все triggers
- PR Review — Diff View (LCS), 6 типов комментариев, auto-status
- Security — 14/14 issues закрыты
- Mobile responsive — все табы
- Data Layer lib/data/ — 11 модулей, единый источник правды
- Роли: super_admin (Ariel), developer (Steve), admin (Aliks), marketer (Gooner)
- Goals system, Tasks, Pull Pool, Bootstrap prompts v3, Skills, Extensions

**Что ещё не сделано:**
- Dev Console MVP (file browser + editor + Submit PR)
- Лендинг test.lego-base.online — дизайн-полировка
- install.sh — нужно обновить под новую структуру (data/, lib/data/, lib/push.ts, SW)
- Onboarding документация
- Go to Market

**Ключевой продуктовый вывод:** iam-client-os уже является самостоятельным продуктом класса enterprise team workspace. Это НЕ просто "MCP + memory/". Это полноценная командная платформа с messaging, goals, tasks, PRs, push, RBAC.

---

## ЧАСТЬ 4: КАРТА ОТНОШЕНИЙ МЕЖДУ ПРОЕКТАМИ

### 4.1 Как проекты связаны сейчас

```
iamrunning.online (основной сервер)
├── /api/mcp/*           ← MCP Connector (dev tool для I AM RUNNING)
├── lib/mcp-server/      ← createMcpServer(clientSlug?)
├── context-core/        ← 19 docs (memory для I AM RUNNING)
├── /var/www/iam-clients/ ← Option A multi-tenancy data
│   └── gooner/context-core/ ← клиентский context (тест)
└── iam-client-os/       ← КОПИЯ репо внутри проекта (для разработки через MCP!)
    └── app/api/mcp/     ← MCP сервер iam-client-os (разрабатывается здесь)

test.lego-base.online (клиентский VPS)
├── /var/www/iam-os/     ← iam-client-os в проде
└── memory/              ← YAML frontmatter (5 файлов)
```

**Критическое наблюдение:** I AM RUNNING использует собственный MCP сервер (`/api/mcp`) как primary dev tool — т.е. iam-client-os разрабатывается через тот же принцип, что и продаёт. Продукт ест собственную собачью еду.

### 4.2 Что сейчас ДУБЛИРУЕТСЯ между проектами

| Концепт | I AM RUNNING | iam-client-os | Синхронизированы? |
|---------|-------------|---------------|-------------------|
| MCP Server | lib/mcp-server/index.ts (12 tools) | app/api/mcp/ (15+ tools, роли, RBAC) | ❌ Разные |
| Memory/Context | context-core/ (19 md файлов) | memory/ (YAML frontmatter) | ❌ Разные |
| Admin Panel | /admin/dev-console/ | /admin/ | ❌ Разные |
| Auth | Supabase (roles 0-7) | TEAM_ROLES.md + SHA-256 | ❌ Разные |
| Deploy | pm2 restart + nohup | deploy-logged.sh + pm2 | ✅ Похожи |
| Git | git_snapshot, git_log | git_snapshot, git_log | ✅ Похожи |
| Tron компоненты | 18 штук в lib/craft/ | — (не используются) | ❌ Только в IAM |
| Landing | iamrunning.online | test.lego-base.online | ❌ Разные |

### 4.3 Что iam-client-os взял от I AM RUNNING

**Взял и улучшил:**
- MCP server паттерн → добавил RBAC, pull-pool, роли, team mode
- Dev Console идея → стал полноценной admin panel с 8 табами
- context-core концепт → стал memory/ с YAML frontmatter (машиночитаемый)
- Bootstrap prompt → стал автономным, role-specific

**Не взял:**
- Tron компоненты (iam-client-os не website builder)
- Supabase (использует flat JSON files)
- Craft.js (не нужен)
- Interactive wizard (не нужен)

---

## ЧАСТЬ 5: ИНТЕГРАЦИОННЫЙ АНАЛИЗ

### 5.1 Три возможных модели интеграции

#### Модель A: Полная изоляция (текущее состояние)
```
iamrunning.online → Website Builder (Track 1)
test.lego-base.online → AI Business OS (Track 2)
```
**Плюсы:** Никаких зависимостей. Независимая продажа.
**Минусы:** Дублирование. Нет synergy. Пользователь I AM RUNNING не знает об OS.
**Когда:** Сейчас, до первого клиента Track 2.

#### Модель B: Iam-client-os как апгрейд для клиентов I AM RUNNING
```
iamrunning.online купил сайт → предложение "Add AI Business OS" → 
install.sh на VPS клиента → Claude видит его сайт через MCP
```
**Плюсы:** Cross-sell. Естественный upsell. Сайт клиента = проект который Claude может читать.
**Минусы:** Нужен install.sh на VPS где живёт сайт клиента.
**Когда:** После первых продаж обоих продуктов.

#### Модель C: I AM RUNNING сам работает на iam-client-os
```
Ariel (super_admin) → iam-client-os управляет разработкой I AM RUNNING →
Steve (developer) работает через MCP → PR → Admin review → Deploy
```
**Плюсы:** Уже работает! Мы через это и разрабатываем. Proof of concept — живой.
**Минусы:** Пока только dev workflow, не продаётся клиентам как service.
**Когда:** Уже сейчас (де-факто).

### 5.2 Интеграционные точки (технические)

| Точка интеграции | Что нужно | Сложность | Приоритет |
|-----------------|-----------|-----------|-----------|
| Лендинг iamrunning.online — Door C | Обновить ThreeDoorsSection | Низкая | 🟡 После первого клиента |
| install.sh + Tron сайт | agent.sh может "видеть" сайт I AM RUNNING через MCP | Средняя | 🟢 Версия 2 |
| Общий Auth | Supabase user_id → iam-client-os token | Высокая | 🔴 Нет (разные архитектуры) |
| Billing | Stripe на iamrunning.online → выдаёт iam-client-os токен | Высокая | 🟢 Версия 2 |
| Shared Tron components | iam-client-os лендинг использует Tron | Средняя | 🟢 Опционально |

### 5.3 Что НЕ нужно интегрировать (сейчас)

- **Общий Auth:** Supabase (I AM RUNNING) vs TEAM_ROLES.md (iam-client-os) — архитектурно несовместимы и не должны быть совмещены. Разные продукты, разные аудитории.
- **Shared DB:** iam-client-os намеренно работает без Supabase (flat files = простота, переносимость). Менять не нужно.
- **Общий MCP server:** Два разных MCP — для разных задач. IAM MCP = dev tool. ClientOS MCP = team workspace. Объединять не нужно.

---

## ЧАСТЬ 6: ТЕХНИЧЕСКОЕ ЗДОРОВЬЕ ПЛАТФОРМЫ

### 6.1 I AM RUNNING — Сильные стороны

- **Craft.js архитектура** — зрелая, стабильная. 18 компонентов работают без багов.
- **SiteRenderer SSR** — deployed сайты работают нативно (не iframe, не static export).
- **ThemeContext** — dual theme (dark/light) + accent color работает во всех компонентах.
- **lz-string сжатие** — данные компактны, Supabase JSONB эффективен.
- **Context Core** — 19 документов обеспечивают "память" для AI разработки. Уникальное преимущество.
- **MCP + Dev Console** — два интерфейса к одному runtime. Оба работают.

### 6.2 I AM RUNNING — Технический долг

**Критический:**
- Stripe полностью отсутствует (весь payment layer)
- Route protection только client-side (любой может открыть editor)

**Важный:**
- editor/page.tsx — 1200+ строк (читать нельзя через MCP)
- Дублирование: MCP и dev-agent share некоторые утилиты но не unified
- mobileData не генерируется в Interactive (только desktopData)
- Anonymous → signup restore неполный
- Auth flow без password reset / email confirmation

**Незначительный:**
- Settings Panel неоднородный дизайн
- i18n только в части компонентов
- Pull-pool в legacy виде (md файлы в корне)

### 6.3 Сравнение зрелости двух треков

| Критерий | Track 1 (Website Builder) | Track 2 (AI Business OS) |
|---------|--------------------------|--------------------------|
| Core функциональность | ✅ 90% | ✅ 92% |
| Монетизация | ❌ 0% | ✅ Ценообразование зафиксировано |
| Security | ✅ Хорошая | ✅ 14/14 issues закрыты |
| Первый клиент | Нужен Stripe | Можно продавать сейчас |
| Team workflow | N/A | ✅ Полностью |
| Документация | ✅ 19 docs | ✅ IDEAS + bootstrap prompts |
| Mobile | 🟡 Editor не mobile | ✅ Responsive |

---

## ЧАСТЬ 7: ВЫВОДЫ И РЕКОМЕНДАЦИИ

### 7.1 Главный вывод

**iam-client-os уже готов к продаже.** Track 2 — это не "функция внутри платформы" в смысле зависимости от Track 1. Это независимый продукт, который просто живёт в экосистеме I AM RUNNING.

**Track 1 требует 10–15 дней для первой продажи** (Stripe + route protection). Это реалистично.

**Интеграция сейчас преждевременна.** Лучшая интеграция — это уточнение позиционирования на лендинге (Door C) и cross-sell после первых клиентов обоих продуктов.

### 7.2 Рекомендованный порядок действий

```
1. [СЕЙЧАС] Первый клиент Track 2 — Upwork/DM/LinkedIn
   Продукт готов. Нужны только переговоры и onboarding.
   
2. [Параллельно] Track 1 — Stripe + route protection
   10–15 дней. После этого Track 1 можно продавать.
   
3. [После первого клиента Track 2] Dev Console MVP в iam-client-os
   Killer feature для "серьёзных" клиентов.
   
4. [После 3+ клиентов Track 2] Обновить лендинг iamrunning.online
   Добавить Door C как реальный продукт с кейсами.
   
5. [Версия 2] Интеграция: cross-sell Website Builder → AI Business OS
   Клиент купил сайт → предлагаем AI OS для этого сайта.
   
6. [Версия 2] install.sh поддерживает сайты I AM RUNNING
   Claude видит Tron сайт клиента через MCP.
```

### 7.3 Что НЕ делать

- ❌ Не объединять Auth (Supabase vs TEAM_ROLES) — разные архитектуры, разные нужды
- ❌ Не переписывать I AM RUNNING под flat files (Supabase — правильный выбор для website builder)
- ❌ Не тратить время на Mobile Editor сейчас — это Track 1 v2 feature
- ❌ Не делать Backend Blocks до Stripe — блоки нечем продавать
- ❌ Не делать "общий лендинг" — два продукта, разные аудитории, разные лендинги правильно

### 7.4 Ключевые числа

| Метрика | Значение |
|---------|---------|
| Дней до первого клиента Track 2 | 0–3 (продукт готов) |
| Дней до первой продажи Track 1 | ~15 (Stripe + route protection) |
| Дней до интеграции Track 1+2 | ~45–60 (после первых продаж обоих) |
| Компонентов в I AM RUNNING | 18 Tron |
| Документов в Context Core | 19+ |
| Инструментов в MCP (I AM RUNNING) | 12 |
| Инструментов в MCP (iam-client-os) | 15+ |
| Закрытых security issues (iam-client-os) | 14/14 |
| Progress iam-client-os | 92% |

---

## ПРИЛОЖЕНИЕ: КЛЮЧЕВЫЕ ТЕХНИЧЕСКИЕ ФАКТЫ

### Деплой I AM RUNNING
```
VPS: Hetzner, Ubuntu
Path: /var/www/i_am_running/
PM2: i-am-running (port 3000)
Nginx: wildcard *.iamrunning.online + SSL
Deploy: nohup sleep 2 && pm2 restart i-am-running &
GitHub: ArielGrook/I_AM_RUNNING_-.git
```

### Деплой iam-client-os
```
VPS: Time4VPS, 185.5.55.111, Ubuntu 24.04
Path: /var/www/iam-os/
PM2: iam-os (port 3000)
Domain: test.lego-base.online
GitHub: ArielGrook/iam-client-os.git
Deploy: git pull → rm -rf .next → npm run build → pm2 restart iam-os
```

### Схема разработки iam-client-os (через MCP I AM RUNNING)
```
Claude MCP (iamrunning.online) → пишет в /var/www/i_am_running/iam-client-os/
Ariel → cp файлы в ~/iam-client-os-repo/ → git push → GitHub
На клиентском VPS: git pull → build → pm2 restart
```

---

*Аудит проведён на основе: ROADMAP v9.0 (830 строк), ARCHITECTURE.md, ENGINEERING_MEMORY.md, PROGRESS.md, IAM_CLIENT_OS_PLAN.md, MAIN.md, MVP_HAPPY_PATH.md, 3 файлов EVOLUTION, аудита iam-client-os (03.04.2026)*
*Следующее обновление: после первого клиента Track 2 или после Stripe Track 1*
