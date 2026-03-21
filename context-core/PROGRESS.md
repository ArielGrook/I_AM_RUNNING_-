# CURRENT STATE — updated 20.03.2026

## Working ✅
- Craft.js editor with 15 Tron components (including TronAbout)
- Client site deploy on subdomains (SSR, pixel-perfect)
- Dev Console: Full IDE with file manager, code editor, git history, deploy/rollback
- **MCP Connector: Claude has direct project access (read/write/deploy)**
- **Interactive pipeline: 4-step wizard → assembly → preview → save**
- **Assembler: maps block IDs → real Tron components, builds Craft.js JSON client-side**
- Context Core v2: 10 documents as system prompt
- Color preset + scheme propagation across all pages
- Admin panel mobile-responsive (vertical cards, dropdown nav)
- SEO panel mobile-responsive
- Dev Console mobile-responsive (dropdown panels)

## MCP Connector — Operational ✅
- 12 tools available (read/write/patch/delete/list/search/git/deploy/run_command)
- OAuth auto-approve flow
- Whitelisted shell commands
- Deploy via nohup pattern (fire-and-forget)

## Open Issues ⚠️
- ~~Interactive: component positioning (sections may overlap)~~ ✅ Fixed 21.03.2026 — footer always last, assembler enforces canonical order
- Interactive: block position badges added in Step 3 (numeric for optional, "last" for footer)
- Interactive: style doesn't map to color presets yet
- Interactive: no mobileData generation
- Delete Account button in TronHub (stub)
- Profile page redirect missing locale
- Admin hardcoded login (security risk)
- Gemini adapter tool result format (partially fixed)

## MVP Blockers 🔴
- Stripe integration (checkout, webhook, subscription check)
- Route protection middleware (editor requires subscription)
- Missing components: TronServices, TronTeam, TronCTA, TronForgotPassword, TronEmailConfirmation
- Landing page needs "Build a Website" CTA prominence
- Interactive needs thumbnail previews for blocks

## Next Priority
1. Fix interactive component positioning
2. Write remaining Tron components (TronServices, TronTeam, TronCTA)
3. Stripe checkout integration
4. Route protection middleware
5. Landing page polish
