# CURRENT STATE — updated 13.03.2026

## Working ✅
- Craft.js editor with 14 Tron components
- HeaderTron: avatar 40px, wide/compact, dropdown, theme
- TronHub: Save Changes (Supabase REST + token refresh), theme toggle, avatar upload
- TronLogin / TronRegister: Supabase auth with auto-page creation
- Backend Auth: automatic RLS migrations + Storage bucket on Connect
- MediaLibrary: upload to client Supabase bucket
- Client site deploy on subdomains (SSR, pixel-perfect)
- Dev Console: tool use, auto-deploy, SSE streaming, rollback (Claude + OpenAI + DeepSeek)
- Context Core: this system prompt loaded before each prompt

## Open Issues ⚠️
1. Color preset propagation — ColorPresetSync component exists but visual update doesn't happen
   Next step: check what query.serialize() returns in ColorPresetSync logs
2. Delete Account — TronHub Settings confirm button has no onClick handler
3. Backend auto-reconnect on editor load — not implemented

## Next Components to Build 📋
TronAbout, TronServices, TronTeam, TronCTA
TronForgotPassword, TronEmailConfirmation

## Dev Console — Pending Improvements 📋
- Gemini Flash-Lite adapter (API format differs from OpenAI)
- Separate deploy step from AI call (button instead of auto)
- PROJECT_STRUCTURE.md integration into system prompt ← IN PROGRESS

## Dev Console UI — Polish needed 📋
- File tree viewer
- Token cost display per request
- Better error display when build fails
