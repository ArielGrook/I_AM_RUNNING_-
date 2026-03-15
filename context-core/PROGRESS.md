# CURRENT STATE — updated 13.03.2026

## Working ✅
- Craft.js editor with 14 Tron components
- HeaderTron: avatar 40px, wide/compact, dropdown, theme
- TronHub: Save Changes (Supabase REST + token refresh), theme toggle, avatar upload
- TronLogin / TronRegister: Supabase auth with auto-page creation
- Backend Auth: automatic RLS migrations + Storage bucket on Connect
- MediaLibrary: upload to client Supabase bucket
- Client site deploy on subdomains (SSR, pixel-perfect)
- Dev Console: Full IDE with file manager, code editor, git history, deploy/rollback.
- Context Core: this system prompt loaded before each prompt
- Color preset propagation (FIXED)
- Dashboard new project wrong data format (FIXED)

## Open Issues ⚠️
- Drag & drop component UX improvements
- Delete Account button in TronHub (currently a stub)
- Profile page redirect missing locale
- Backend auto-reconnect on editor load — not implemented

## Next Components to Build 📋
- New components: TronAbout, TronServices, TronTeam, TronCTA
- TronForgotPassword, TronEmailConfirmation

## Dev Console — Pending Improvements 📋
- Gemini Flash-Lite adapter (API format differs from OpenAI)
- Separate deploy step from AI call (button instead of auto)
- PROJECT_STRUCTURE.md integration into system prompt ← IN PROGRESS
- Token cost display per request
- Better error display when build fails
