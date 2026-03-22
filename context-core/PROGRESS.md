# CURRENT STATE — updated 22.03.2026

## Working ✅
- Craft.js editor with 18 Tron components (TronCTA, TronServices, TronTeam added)
- Client site deploy on subdomains (SSR, pixel-perfect)
- Nginx subdomains: static served from disk (/_next/static/ alias), no Node.js overhead
- Dev Console: Full IDE with file manager, code editor, git history, deploy/rollback
- **MCP Connector: project has direct AI access layer via `/api/mcp/*`**
- **Interactive pipeline: 4-step wizard → assembly → preview → save**
- **Assembler: canonical order enforced (header→hero→middle→footer), position badges in Step 3**
- Context Core expanded and actively maintained as project memory/docs runtime
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
- MCP/docs access remains blocked from `.env`, secrets, `.git`, `node_modules`, `.next`

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

## Components ✅
- HeroTron, HeaderTron, TronFeatures, TronStats, TronAbout, TronPortfolio
- TronTestimonials, TronPricing, TronFAQ, TronFooter, TronContact, TronShowcase
- TronLogin, TronRegister, TronHub, TronCTA, TronServices, TronTeam
- TronCTA features: GSAP word stagger, decorative/static spotlight, magnetic buttons, pulse glow, split/centered layout, editable card

## Architecture Documentation Progress ✅
Major context-core normalization completed on 22.03.2026:
- `ARCHITECTURE.md` rewritten around 3 layers:
  - Website/Product layer
  - Operational/Dev layer
  - AI Access layer
- `ENGINEERING_MEMORY.md` updated with confirmed AI runtime findings and known traps
- `PROJECT_STRUCTURE.md` expanded for runtime core (`mcp`, `mcp-gpt`, `dev-agent`, admin auth, oauth code stores, mcp server)
- `DEBUG_MAP.md` upgraded into a usable symptom → area → triage map
- `RULES.md` rewritten as operational doctrine for MCP / Dev Console / documentation mode
- `MVP_HAPPY_PATH.md` aligned with current website-system MVP and separated from future platform direction

## Product Insight — New Strategic Direction 💡
A major product insight was formalized on 22.03.2026:

**I AM RUNNING should no longer be thought of only as a website builder/editor.**
It is increasingly becoming an:

### **AI-native business operating system**
A system composed of:
- website layer
- operational/admin layer
- AI access layer
- context-core documentation memory
- Dev Console / AI runtime / deploy tooling

### Important clarification
This does **not** replace the current MVP.
Instead the current framing becomes:
- **Current monetizable MVP:** website system (interactive → editor → deploy)
- **Emerging reusable product direction:** AI-native business operating system template for agencies/businesses/startups

### Why this matters
- Current product can be sold first as a site/system workflow
- Current codebase can later be extracted into a reusable business-system template
- Context Core becomes a real competitive advantage because each new AI session enters a documented runtime, not a blank chat
- Dev Console + MCP + project memory together form the reusable core, while the website builder/editor can become one vertical/module built on top of that core

## Open Issues ⚠️
- Interactive: no mobileData generation
- Delete Account button in TronHub (stub)
- Profile page redirect missing locale
- Anonymous → signup: project not restored from localStorage after registration
- Multi-deploy: can't deploy specific site or multiple sites simultaneously
- Current MCP bridge/session behavior can still be unstable across resource handles depending on connector session

## MVP Blockers 🔴
- Stripe integration (checkout, webhook, subscription check)
- Route protection middleware (editor requires subscription/entitlement)
- Landing page needs pricing section + demo CTA
- Anonymous → signup restore flow needs to be reliable

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

### 🔴 Priority 1 — Monetization / Launch blockers
- [ ] Stripe integration (checkout + webhook + role upgrade)
- [ ] Route protection middleware (editor requires paid entitlement)
- [ ] Landing: pricing section + demo CTA
- [ ] Reliable anonymous → signup restore flow

### 🟡 Priority 2 — Interactive / Website-system polish
- [ ] Step 2 (blocks) → Step 3 (style) → Step 4 (color override) → Step 5 (animations) restructure
- [ ] i18n for Interactive (ru/he)
- [ ] Reduce component overlap/positioning edge cases
- [ ] Clearer onboarding from landing → interactive → account → deploy

### 🟢 Priority 3 — Product-template extraction
- [ ] Create product-template documentation for AI-native business operating system
- [ ] Define reusable core vs project-specific verticals
- [ ] Document deployment modes for agency/business use
- [ ] Formalize session bootstrap / context-core operating model

### ⏳ Later / After launch
- [ ] Mechanics section in Settings Panel (fireflies, particles, gradient blobs, magnetic select)
- [ ] Niche-specific Tron component verticals (Shop, Portfolio, Agency, Business Card, Startup)
- [ ] Header in Interactive updates navigation according to selected blocks
- [ ] Agency/business template packaging and commercial modular add-ons

---

## Short Strategic Summary

**Today the project stands in two realities at once:**

1. It is already a usable website-system MVP with interactive assembly, editor, and deploy.
2. It is also becoming the prototype of a broader AI-native business software platform.

The next job is to preserve the first reality long enough to monetize it,
while documenting and extracting the second reality into reusable product-template docs.
