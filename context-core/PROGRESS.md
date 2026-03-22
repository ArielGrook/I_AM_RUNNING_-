# CURRENT STATE — updated 22.03.2026

## Working ✅
- Craft.js editor with 18 Tron components (TronCTA, TronServices, TronTeam added)
- Client site deploy on subdomains (SSR, pixel-perfect)
- Nginx subdomains: static served from disk (/_next/static/ alias), no Node.js overhead
- Dev Console: Full IDE with file manager, code editor, git history, deploy/rollback
- **MCP Connector: Claude has direct project access (read/write/deploy)**
- **Interactive pipeline: 4-step wizard → assembly → preview → save**
- **Assembler: canonical order enforced (header→hero→middle→footer), position badges in Step 3**
- Context Core v2: 11 documents as system prompt
- **Interactive Step 1: complete redesign (22.03.2026)**
  - 16 detailed 140×88 SVG niche thumbnails (food, shop, ecommerce, startup, portfolio, beauty, health, education, agency, consulting, blog, event, real_estate, travel, craft, business_card)
  - Animated diagonal background: 120 line-art SVG icons floating bottom-right → top-left
  - Background icons: gray by default, transition to niche accent color on selection (1.3s ease)
  - NICHE_PRESET_MAP: selecting a niche auto-applies matching color preset
  - Light/Dark mode toggle (Step 1 only — subsequent steps use niche-driven color)
  - Removed mobile landscape-only restriction — works in portrait naturally

## Security ✅
- Admin API: httpOnly cookie auth (ADMIN_SESSION_SECRET) on all /api/admin/* routes
- Admin UI: 404 for non-admins + IP ban after 3 probes (24h)
- Rate limiting in middleware: totp (5/15min), auth (10/min), api (60/min), pages (120/min)
- CSP + X-Frame + X-XSS + Referrer-Policy headers on all responses
- Admin logout clears httpOnly cookie server-side

## Role System v2 ✅
- Roles 0-7: 0=Anon, 1=Free, 2=Paid, 3=Basic, 4=Pro, 5=Admin, 6=AgencyOwner, 7=AgencyEmployee
- Source of truth: auth.users.user_metadata.role (set via Admin API)
- Real-time role propagation: Realtime subscription on profiles table → refreshSession() → UI updates without re-login
- DB: profiles.role CHECK (0..7), profiles.agency_id, profiles.trial_expires_at
- useAuth flags: isAgencyOwner, isAgencyEmployee, isAgency added

## Admin Panel ✅
- Mobile-responsive (cards on mobile, table on desktop)
- Role buttons: Free/Paid/Basic/Pro/Admin/Agency/Employee with active highlight (✓)
- Role badge updates instantly after change (reads from auth.admin.listUsers)
- Last seen column
- get-users reads from auth.admin.listUsers() — numeric role always fresh

## Components ✅ (16 total)
- HeroTron, HeaderTron, TronFeatures, TronStats, TronAbout, TronPortfolio
- TronTestimonials, TronPricing, TronFAQ, TronFooter, TronContact, TronShowcase
- TronLogin, TronRegister, TronHub, **TronCTA** (new 21.03.2026)
- TronCTA features: GSAP word stagger, cursor spotlight, magnetic buttons, pulse glow, split/centered layout, editable card

## Open Issues ⚠️
- Interactive: no mobileData generation
- Delete Account button in TronHub (stub)
- Profile page redirect missing locale
- Anonymous → signup: project not restored from localStorage after registration
- Multi-deploy: can't deploy specific site or multiple sites simultaneously

## MVP Blockers 🔴
- Stripe integration (checkout, webhook, subscription check)
- Route protection middleware (editor requires subscription)
- Landing page needs pricing section + demo CTA

## Interactive Pipeline — Step 1 (redesigned 22.03.2026)
`NICHE_THUMBNAILS` — объект с 16 SVG 140×88, каждая иллюстрирует нишу (не иконка, а mini-сайт-концепт).
`NICHE_PRESET_MAP` — маппинг 16 ниш → ID цветового пресета (food→coral_sunset, startup→cyber_lime и т.д.)
`AnimatedBackground` — 120 line-art SVG иконок, анимация `diag` CSS keyframes, движение bottom-right→top-left, duration 28–50s.
При выборе ниши: `bg` элемент получает `color: accentColor` через CSS transition 1.3s — все иконки перекрашиваются.
Light/Dark тогл: только на Step 1, управляет `isDarkMode` state, карточки `#181818`/`#fff`, фон `#0d0d0d`/`#f2eeea`.

## Interactive Pipeline — Color Presets
12 named presets in `app/[locale]/interactive/page.tsx`:
- Midnight Ember, Arctic Pulse, Crimson Dark, Forest Night, Violet Storm, Solar Flare
- Rose Quartz, Ocean Mist, Obsidian Gold, Cyber Lime, Pearl Minimal, Coral Sunset
- Each preset: id, name, tagline, accentColor, darkBg, lightBg, colorScheme
- Selected preset passes accentColor/darkBg/lightBg to assembler → applied to ALL components
- Step 2 shows mini site preview card + accent dot for each preset

## Interactive Pipeline — Block Thumbnails
SVG thumbnails for all 13 block types rendered inline in Step 3.
`BlockThumbnail({ blockId, accent })` component uses accent color from selected preset.
No external images — pure SVG, instant render.

## Next Priority — Roadmap

### 🔴 Приоритет 1 — Монетизация (блокеры запуска)
- [ ] Stripe интеграция (checkout + webhook + role upgrade)
- [ ] Route protection middleware (editor требует подписки)
- [ ] Landing: pricing section + demo CTA

### 🟡 Приоритет 2 — Interactive доработки
- [ ] Step 2 (blocks) → Step 3 (style) → Step 4 (color override) → Step 5 (animations) restructure
- [ ] i18n для Interactive (ru/he)
- [ ] Anonymous → signup flow: проект из localStorage не восстанавливается после регистрации

### 🟢 Приоритет 3 — Компоненты и механики
- [ ] Раздел "Механики" в Settings Panel (fireflies, particles, gradient blobs, magnetic select)
- [ ] Нишевые Tron компоненты (Shop, Portfolio, Agency, Business Card, Startup)

### ⏳ Отложено (после запуска)
- [ ] Header в Interactive не обновляет навигацию под выбранные блоки
