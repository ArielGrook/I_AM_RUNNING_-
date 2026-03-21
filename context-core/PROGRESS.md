# CURRENT STATE — updated 21.03.2026

## Working ✅
- Craft.js editor with 15 Tron components (including TronAbout)
- Client site deploy on subdomains (SSR, pixel-perfect)
- Dev Console: Full IDE with file manager, code editor, git history, deploy/rollback
- **MCP Connector: Claude has direct project access (read/write/deploy)**
- **Interactive pipeline: 4-step wizard → assembly → preview → save**
- **Assembler: maps block IDs → real Tron components, builds Craft.js JSON client-side**
- **Interactive: footer always last (canonical order: header→hero→middle→footer)**
- **Interactive: position badges on optional blocks (numeric) + "last" on footer**
- Context Core v2: 10 documents as system prompt
- Color preset + scheme propagation across all pages
- Admin panel: TOTP auth + httpOnly cookie on all /api/admin/* routes
- Admin panel: mobile-responsive (cards on mobile, table on desktop)
- Admin panel: role buttons Free/Paid/Basic/Pro/Admin/Agency/Employee with active highlight
- Admin panel: role badge updates instantly after change (reads from auth.admin.listUsers)
- Admin panel: Last seen column
- **Security: rate limiting in middleware (totp/auth/api/pages)**
- **Security: /admin returns 404 to non-admins + IP ban after 3 probes (24h)**
- **Security: CSP + X-Frame + X-XSS + Referrer-Policy headers on all responses**
- **Role system v2: roles 0-7 (added Agency Owner 6, Agency Employee 7)**
- **Role system: USER_UPDATED event — role change reflects without re-login**
- **Role system: agency_id + trial_expires_at fields in profiles table**
- Nginx subdomains: static served directly from disk (/_next/static/ → alias), no Node.js overhead

## MCP Connector — Operational ✅
- 12 tools available (read/write/patch/delete/list/search/git/deploy/run_command)
- OAuth auto-approve flow
- Whitelisted shell commands
- Deploy via nohup pattern (fire-and-forget)

## Open Issues ⚠️
- Interactive: style doesn't map to color presets yet
- Interactive: no mobileData generation
- Delete Account button in TronHub (stub)
- Profile page redirect missing locale
- Anonymous → signup: project not restored from localStorage after registration
- Multi-deploy: can't deploy specific site or multiple sites simultaneously (Nginx slug bug)

## MVP Blockers 🔴
- Stripe integration (checkout, webhook, subscription check)
- Route protection middleware (editor requires subscription)
- Missing components: TronCTA, TronServices, TronTeam
- Landing page needs pricing section + demo CTA
- Interactive needs thumbnail previews for blocks

## Role System — Current State
```
0 = Anonymous
1 = Free User        — default on signup, chat only
2 = Paid User        — editor, 1 project ($20 one-time, Stripe pending)
3 = Freelancer Basic — 5 projects ($30/mo)
4 = Freelancer Pro   — unlimited ($100/mo)
5 = Admin
6 = Agency Owner     — team management, unlimited projects
7 = Agency Employee  — works under owner (agency_id field)
```
Source of truth: auth.users.user_metadata.role (set via Admin API)
DB: profiles.role CHECK (0..7), profiles.agency_id, profiles.trial_expires_at

## Security — Current State
```
✅ Admin API: httpOnly cookie auth (ADMIN_SESSION_SECRET)
✅ Admin UI: 404 for non-admins + 24h IP ban after 3 probes
✅ TOTP: 5 req/15min window + 30min block (middleware + route)
✅ Auth endpoints: 10 req/min
✅ API general: 60 req/min
✅ Page routes: 120 req/min
✅ CSP + security headers on all responses
⬜ Stripe (no payment = no attack surface yet)
⬜ CAPTCHA (deferred, not needed pre-launch)
```

## Next Priority
1. TronCTA component (needed on every site)
2. TronServices component (currently mapped to TronFeatures — wrong)
3. Anonymous → signup project restore flow
4. Route protection middleware (editor guard)
5. Stripe checkout + webhook
