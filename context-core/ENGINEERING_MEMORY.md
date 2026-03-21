# ENGINEERING MEMORY

*Accumulated knowledge from audits, debugging, and exploration. Prevents repeated rediscovery.*
*Update after every significant audit or debugging session.*

---

## Last updated: 20.03.2026

---

### Admin Panel Security (lib/admin/checkAdminAuth.ts)
- **Было:** `/api/admin/get-users` и `/api/admin/update-user-role` — нулевая серверная авторизация. GET на get-users = полный список юзеров. POST на update-user-role = назначить себе роль 5 (Admin).
- **Стало:** httpOnly cookie `admin_token` содержит `ADMIN_SESSION_SECRET` из env. `checkAdminAuth(request)` проверяет cookie в каждом admin route.
- **verify-totp** выставляет cookie через `setAdminSessionCookie(response)` при успешном TOTP.
- **logout** (`POST /api/admin/logout`) чистит cookie сервер-сайд через `clearAdminSessionCookie()`.
- Cookie: httpOnly, secure (production), sameSite: strict, maxAge: 8 часов.
- Переменная `ADMIN_SESSION_SECRET` обязательна — без неё все admin routes возвращают 500.

### Editor (app/[locale]/editor/page.tsx)
- **Size:** ~1200 lines. NEVER read in full — use search_files
- **Serialization:** `query.serialize()` → JSON → `lz.compress(json, { outputEncoding: 'Base64' })` → Supabase
- **Deserialization:** `lz.decompress(data, { inputEncoding: 'Base64' })` → `actions.deserialize(json)`
- **Page switching:** serialize current → store compressed → decompress target → deserialize → key change forces Frame remount
- **Color propagation:** `iam_color_preset_changed` event → `applyColorPresetToAllPages()` decompresses all pages, updates accentColor/darkBg/lightBg in every node, recompresses
- **Bug found 15.03:** color preset dispatch was in Viewport.tsx, not editor/page.tsx — always look where event is SENT, not received

### SiteRenderer (app/sites/[slug]/SiteRenderer.tsx)
- **Read-only Craft.js:** `<Editor enabled={false}>` + `<Frame data={craftJson} />`
- **Decompression:** same lzutf8 Base64 pattern as editor
- **SiteContext:** provides `navigateToPage()` and `toggleTheme()` to components
- **Theme switching:** `applyColorScheme()` rebuilds entire craftJson and changes Frame key

### Component Registration
- 4 mandatory places: index.ts, editor resolver, SiteRenderer resolver, Toolbox
- Common bug: adding to editor but forgetting SiteRenderer — component works in preview but not on deployed site
- TronAbout registration had path issue: `./TronAbout` correct, `./tron/TronAbout` wrong (no tron/ subdirectory)
- Gemini once duplicated imports — always search for component name in all 4 files before adding

### Deploy Pipeline
- `iam-deploy.sh`: git pull → npm build → nohup pm2 restart (2 sec delay)
- Previous bug: pm2 restart killed the API route before response was sent
- Previous bug: git pull writes to stderr even on success → deploy route was checking stderr as error
- Fix: check `deployResult.status !== 0` only, ignore stderr content

### Dashboard (app/[locale]/dashboard/page.tsx)
- Creates projects with `data: { craft: { schemaVersion: 2, pages: [...] } }`
- Source field: 'wizard' | 'editor' | 'interactive'

### Interactive Pipeline (app/[locale]/interactive/page.tsx)
- 4-step wizard: business type → style → blocks → company name
- Assembly: hidden Craft.js Editor + `buildElementsFromContract()` → `parseReactElement` → `addNodeTree` → `serialize()`
- Preview: `<Editor enabled={false}>` with assembled JSON
- Save: compress → Supabase project with desktopData
- Anonymous: saves to localStorage, redirects to signup
- **Known issue:** component positioning may need fixing (overlapping sections)

### MCP Server (lib/mcp-server/index.ts + app/api/mcp/)
- OAuth discovery at .well-known/* paths — must NOT go through next-intl middleware
- middleware.ts excludes `/.well-known` and `/api` paths
- OAuth flow: authorize auto-approves → token endpoint returns mcpAuthToken
- In-memory auth codes with 5-min TTL (lib/mcp-oauth-codes.ts)

### Assembler (lib/craft/assembler/index.ts)
- Maps block IDs to Tron components: header→HeaderTron, hero→HeroTron, about→TronAbout, etc.
- services→TronFeatures (TronServices not yet built)
- Returns React elements array for Craft.js parseReactElement
- **Block ordering bug (fixed 21.03.2026):** `contract.blocks` initial state is `['header','hero','footer']`. When user toggles optional blocks they append AFTER footer, giving order: header→hero→footer→about→services. Assembler rendered in array order → footer was 3rd.
- **Fix:** assembler now enforces canonical order: header→hero→middleBlocks(user order)→footer via explicit reorder before map.
- **Position badges (added 21.03.2026):** Step 3 UI shows numeric badge (1,2,3...) on optional selected blocks in top-left corner. Footer shows "last" badge. Header/Hero show no badge (always implicit first positions). Computed from `optionalSelected = contract.blocks.filter(not header/hero/footer)`.

---

## KNOWN TRAPS

| Trap | Why | Solution |
|------|-----|----------|
| lzutf8 Base64 encoding | Must use `{ outputEncoding: 'Base64' }` / `{ inputEncoding: 'Base64' }` — without it, data is binary garbage | Always pass encoding option |
| useMemo for Supabase client | Without it: render loop, thousands of GoTrueClient instances | Wrap in useMemo, deps: [url, key, accessToken] |
| Token refresh before Supabase | Access tokens expire — request will fail silently | Call refresh_token before every REST request in components |
| ThemeContext vs prop colorScheme | Component receives both — siteCtx.colorScheme should take priority over prop | Check HeroTron pattern |
| editor/page.tsx size | 1200+ lines, reading full file burns tokens | Use search_files first, read_file only for specific sections |
| Duplicate imports | AI sometimes adds TronXxx twice in import line | Search before patching |
| .well-known paths | Next.js middleware tries to add locale prefix | middleware.ts must exclude /.well-known |
| pm2 self-kill | Deploy route can't respond if pm2 kills process | nohup sleep 2 pattern mandatory |

---

## FALSE HYPOTHESES (proven wrong)

- "Next.js caches old deploy/route.ts" → FALSE, the issue was `if (false)` hack not rebuilt
- "Static HTML export works for client sites" → FALSE, abandoned for SSR
- "Container-in-Container needed" → FALSE at current scale, Enhanced Monoliths sufficient
- ".next cache causes deploy issues" → PARTIALLY TRUE, but main issue was pm2 self-kill
- "GPT-4o can't handle Cyrillic in search_files" → TRUE, grep has encoding issues with Unicode
