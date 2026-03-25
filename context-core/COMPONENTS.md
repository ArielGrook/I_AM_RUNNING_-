# CRAFT.JS COMPONENTS

## Registration — 4 places (always all 4)
1. lib/craft/components/index.ts — export
2. app/[locale]/editor/page.tsx — resolver object
3. app/sites/[slug]/SiteRenderer.tsx — resolver object
4. components/craft/Toolbox.tsx — UI button

## Active Tron Components
HeaderTron — navigation header with avatar, dropdown, wide/compact modes
HeroTron — full-screen hero with CTAs, GSAP animations
TronFeatures — features grid with icons and cards
TronPortfolio — portfolio carousel with filtering
TronTestimonials — infinite scroll testimonials
TronPricing — pricing table with billing toggle
TronFAQ — accordion FAQ
TronFooter — site footer with columns
TronContact — contact form with info display
TronStats — animated count-up statistics
TronShowcase — tabbed showcase with media
TronHub — user dashboard (auth required, real Supabase ops)
TronLogin — login with email + Google OAuth
TronRegister — registration form

## Mechanics Rules
See full doctrine: context-core/MECHANICS.md

GLOBAL mechanics (DO NOT implement in component):
- Cursor spotlight — lives in Viewport.tsx + SiteRenderer.tsx ONLY
- Page scroll animations — GSAP via data-animate attributes

COMPONENT mechanics (allowed in component):
- Static spotlight — fixed decorative radial gradient (NOT mouse-reactive)
  prop name: spotlightIntensity — this is the TOP LIGHT, not cursor
- Magnetic buttons, parallax image, card tilt, count-up — specific to component
- Canvas particles/fireflies — Canvas API, always with cancelAnimationFrame cleanup

KEY RULE: Never add mousemove → radial-gradient in a component.
That's cursor spotlight. It's global. Adding it in component = double brightness bug.

## Unified Header Navigation Model
Any current or future header must derive navigation from the same shared model, not from component-local assumptions.

Required pipeline:
- blocks → nav model → header render

Rules:
- Header must render from a normalized nav model, not directly from raw block props
- Block order in the editor is the source of truth for nav order
- Only blocks explicitly allowed in navigation may appear in the header
- Hidden/disabled blocks must be excluded from navigation
- Empty labels must resolve through a shared fallback rule
- Anchor ids, labels, visibility, order, and inclusion rules must be centralized so all headers behave consistently
- Do not duplicate header mapping logic across multiple header variants/components

Goal:
- one navigation derivation layer reusable across Interactive and every future header implementation

## Unified Settings UI Rules
Component settings must use one consistent control system across the editor. Settings are not allowed to evolve as isolated one-off UIs per component.

Required principle:
- same setting type = same visual control pattern everywhere

What this means:
- text fields, number fields, sliders, switches, selects, textareas, color triggers, media pickers, buttons, and grouped sections must follow shared primitives
- spacing, height, radius, typography, border treatment, hover, focus, disabled, and error states must be visually consistent across all settings panels
- dark mode and light mode must be handled through shared semantic tokens, not ad hoc per-component color choices
- settings should be audited across existing components first, then normalized into reusable controls
- new component settings should be assembled from shared settings primitives instead of custom local markup whenever possible

Goal:
- when we enter the settings-standardization phase, we review all existing controls, understand what each one does, and unify their presentation without changing the underlying product logic unnecessarily

## Protected (DO NOT DELETE)
Container — root Element in Craft.js Frame
HtmlBlock — required for ZIP import

## Component Structure
Each component exports: ComponentName + ComponentNameSettings
craft.props must include: colorScheme, accentColor, darkBg, lightBg
craft.custom must include: block_type, variant_name, style_tags, business_tags, feature_tags

## Theme System
Colors ONLY via buildTokens(darkBg, lightBg)[colorScheme]
Accent ONLY via hexToRgb(accentColor)
NEVER hardcode colors except #fff/#000

## Mobile
ResizeObserver with 520px threshold (NOT 768px, NOT Tailwind breakpoints)
Each component: horizontal layout desktop → vertical layout mobile

## Credentials in Components
ONLY via injectSupabaseCredentials.ts at Backend Connect
NEVER hardcode, NEVER read from env in component