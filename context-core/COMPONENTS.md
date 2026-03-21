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
