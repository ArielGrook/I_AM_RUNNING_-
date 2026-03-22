# DEBUG MAP — Symptom → Code Area

*When something breaks, look here first instead of doing a full audit.*
*Update after every significant debugging session if a new symptom → code mapping is discovered.*

---

## 0. FIRST PRINCIPLE

Не начинать с полного аудита. Сначала определить **какой слой системы сломан**:

1. **Website/Product layer**
   - landing
   - dashboard
   - editor
   - interactive
   - deployed sites

2. **Operational/Dev layer**
   - admin
   - dev console
   - dev-agent endpoints
   - deploy / rollback / file ops / git

3. **AI Access layer**
   - MCP routes
   - MCP token/auth flow
   - mcp-gpt routes
   - context-core loading
   - tool exposure/runtime

Это резко сокращает ложные проверки.

---

## 1. MCP CONNECTOR / AI ACCESS LAYER

| Symptom | Look here first | Notes |
|---------|-----------------|-------|
| "Couldn't reach MCP server" / connector can't connect | `app/api/mcp/route.ts`, `app/api/mcp/setup/route.ts`, `middleware.ts` | Check that `/api` and `/.well-known` are excluded from locale middleware logic |
| MCP route returns 401 | `app/api/mcp/route.ts` auth check | Bearer token expected in `Authorization` header; verify `mcpAuthToken` exists in config |
| Setup works but tools still unavailable | `app/api/mcp/token/route.ts`, `lib/mcp-server/index.ts` | Token flow may work while tool exposure is broken |
| MCP client authorizes but gets empty/invalid response | `app/api/mcp/route.ts` GET/POST handling | Route supports Streamable HTTP spec; check whether client expects SSE stream vs POST protocol |
| GPT-specific connector behaves differently from main MCP | `app/api/mcp-gpt/*`, `lib/mcp-server/gpt-safe.ts` | Main MCP and GPT-safe MCP are separate surfaces; do not assume identical tool set |
| OAuth-style auth code fails / expires | `lib/mcp-oauth-codes.ts`, `lib/mcp-gpt-oauth-codes.ts` | Auth codes are in-memory and short-lived; restart or delay may invalidate flow |
| Connector suddenly breaks after middleware/auth change | `middleware.ts` | Always verify `.well-known` and API exclusions before blaming MCP runtime |
| MCP read_file can't open `.ts/.tsx` | current MCP bridge limitation, not necessarily project bug | In current environment `read_file` is restricted to docs/text formats; use `search_files` + signatures instead |

**False lead to avoid:**
- "MCP is broken because Dev Console UI is broken" → false by default. They share runtime, but are different access surfaces.

---

## 2. DEV CONSOLE / DEV-AGENT LAYER

| Symptom | Look here first | Notes |
|---------|-----------------|-------|
| File tree empty | `app/api/dev-agent/files/route.ts` | Usually auth failure or `DEVELOPER_USER_ID` mismatch, not FS issue |
| File opens in tree but code viewer can't read it | `app/api/dev-agent/files/read/route.ts` | Check path validation, blocked patterns, size limits |
| Save from browser editor does nothing | `app/api/dev-agent/files/write/route.ts` | Dev Console writes to disk only, does not auto-commit or auto-deploy |
| Can't create/delete folder | `mkdir/delete` routes | Delete only works for files or empty dirs by design |
| Git history empty | `app/api/dev-agent/git-log/route.ts` | Check project is a valid git repo and endpoint auth passed |
| Rollback button works but app not restored | `app/api/dev-agent/rollback/route.ts` + PM2/build pipeline | Rollback may succeed in git but fail in rebuild/restart stage |
| Deploy endpoint responds but site doesn't update | `app/api/dev-agent/deploy/route.ts`, `iam-deploy.sh` | Check build result and delayed `nohup sleep 2` restart pattern |
| AI execution loops / nonsense tool loop | `app/api/dev-agent/route.ts`, `lib/dev-agent/ai-provider.ts`, `lib/dev-agent/tool-executor.ts` | Check provider adapter formatting and tool loop state, especially function/tool response shape |
| Dev Console works for one user but 403 for another | all `app/api/dev-agent/*` | Most routes gate on both authenticated Supabase user and optional `DEVELOPER_USER_ID` hard restriction |

**False lead to avoid:**
- "Dev Console is broken because admin cookie is wrong" → not always. Dev-agent routes use Supabase user auth + developer ID restriction, not the admin cookie model.

---

## 3. ADMIN / OPERATIONAL ACCESS

| Symptom | Look here first | Notes |
|---------|-----------------|-------|
| `/admin` hidden or returns 404 | `middleware.ts`, `lib/admin/checkAdminAuth.ts` | This may be expected behavior for non-admin/non-cookie access |
| TOTP accepted but admin APIs still 401 | `lib/admin/checkAdminAuth.ts`, verify/logout routes | Check cookie set/clear path, secret, and secure/sameSite behavior |
| get-users returns nothing or stale roles | `app/api/admin/get-users/route.ts` | Source of truth is `auth.admin.listUsers()`, not profiles-only view |
| Role changes succeed but UI user still sees old permissions | `lib/hooks/useAuth.tsx`, profiles realtime flow | UI waits for realtime + `refreshSession()`; old JWT caching is common false cause |
| update-user-role works for some roles but not others | `app/api/admin/update-user-role/route.ts`, `lib/supabase/updateUserRole.ts` | Check role mapping, user_metadata sync, profiles sync |
| Admin login breaks after env change | `ADMIN_SESSION_SECRET` + cookie auth utilities | Missing/invalid secret breaks all admin route checks |

**False lead to avoid:**
- "Supabase role field in profiles is enough" → false. Current source of truth is Auth metadata role.

---

## 4. INTERACTIVE / ASSEMBLY

| Symptom | Look here first | Notes |
|---------|-----------------|-------|
| Step buttons don't move forward | `app/[locale]/interactive/page.tsx` step state and validation | Check gating logic before assuming UI bug |
| "Building your website" hangs forever | hidden assembly flow in interactive + assembler | `parseReactElement` / node tree generation may fail before visible error |
| Preview empty or missing blocks | `lib/craft/assembler/index.ts` | Block ID not mapped or reorder logic broken |
| Footer appears in middle of preview | assembler canonical ordering | Known historical bug: footer must be forced last |
| Selected block badges/order weird | Step 3 optional block ordering logic | Header/Hero implicit, Footer last, optional blocks numbered |
| Selected preset doesn't recolor everything | interactive contract + assembler extra props + editor/site tokens | Check preset propagation, not just UI thumbnail state |
| Save fails after preview | save flow to Supabase project | Check auth, project payload shape, and RLS/policies |
| Anonymous user loses work after signup | localStorage contract restore flow | Known weak spot in anonymous → signup transition |
| Mobile portrait flow feels blocked | old rotate-to-landscape logic | This restriction was removed; if it returns, check for stale code |

**False lead to avoid:**
- "The issue is in the thumbnail SVGs" → often false. Many preview/save bugs are actually assembler or contract-shape issues.

---

## 5. EDITOR / CRAFT.JS

| Symptom | Look here first | Notes |
|---------|-----------------|-------|
| Component missing from Toolbox | `components/craft/Toolbox.tsx` | Also verify import/export registration |
| Component works in editor preview but missing on deployed site | `app/sites/[slug]/SiteRenderer.tsx` resolver | Classic 4-registration-points bug |
| Component doesn't exist anywhere after adding | all 4 registration points | `lib/craft/components/index.ts`, editor resolver, SiteRenderer resolver, Toolbox |
| Page switching loses content | `app/[locale]/editor/page.tsx`, `PagesContext.tsx` | Check serialize → compress → store → decompress flow |
| Frame goes blank after page switch | `key={activePageId-frameKey}` logic | Frame remount key must change |
| Save fails silently | `lib/store/supabase-sync.ts` and auth token freshness | Expired access token is common hidden cause |
| Theme/preset change affects only current page | preset/scheme event pipeline in editor | Check event sender and the all-pages propagation handler |
| Drag-and-drop or select breaks | Craft.js connectors + render node wiring | Often local component integration bug, not global editor bug |
| Component colors don't match theme | `lib/craft/tokens.ts`, component props, ThemeContext | Components must use tokens, not hardcoded colors |

**False lead to avoid:**
- "The color handler is broken in Viewport" → first check where the event is sent and where all-pages propagation is actually applied.

---

## 6. DEPLOYED SITES (*.iamrunning.online)

| Symptom | Look here first | Notes |
|---------|-----------------|-------|
| Site shows 404 | `app/sites/[slug]/page.tsx` query + project publish state | Check slug and `published = true` |
| Site loads but some components absent | `app/sites/[slug]/SiteRenderer.tsx` resolver | Missing import/resolver entry |
| Site navigation doesn't work | `lib/craft/context/SiteContext.tsx`, `LinkPicker`, CustomEvent path | Deployed sites navigate via `iam_navigate`, not router.push |
| Theme toggle broken on deployed site | SiteRenderer theme rebuild logic | Site theme changes rebuild craft JSON + change Frame key |
| Deployed auth widgets fail | `lib/auth/clientAuthService.ts`, backend-auth injection flow | Credentials must be injected before client auth components can work |
| Cursor spotlight feels duplicated or too bright | `components/craft/Viewport.tsx`, `SiteRenderer.tsx`, component implementation | Check for forbidden component-level cursor spotlight duplication |
| Nginx site responds but static assets 404 | nginx subdomain config | `/_next/static/` should be served from disk/alias, not broken proxy path |
| Subdomain proxy throws resolver error | nginx config with variable proxy_pass | `127.0.0.1` must be used instead of `localhost` when variables are involved |

**False lead to avoid:**
- "router.push broke page nav" → deployed sites should not use router.push for internal page navigation.

---

## 7. AUTH / SESSION / ROLES

| Symptom | Look here first | Notes |
|---------|-----------------|-------|
| Login/signup redirects to wrong locale | auth pages + guard redirects | Check locale-aware redirect building |
| User role changed in admin but app still denies access | `lib/hooks/useAuth.tsx` realtime + refreshSession path | Token refresh lag is the common cause |
| TronLogin/TronRegister render but can't actually auth | `lib/craft/injectSupabaseCredentials.ts` + backend-auth connect flow | Credentials are injected, not read from env inside components |
| Site components spam Supabase auth errors | component-side token refresh logic | Access token refresh before requests is required |
| Browser creates many GoTrueClient instances / weird loops | component Supabase client construction | Use `useMemo`, otherwise render loop / client flood |
| Session disappears on deployed client site | `clientAuthService.ts` localStorage handling | Check storage key integrity and sign-out/sign-in path |

**False lead to avoid:**
- "Need full relogin after admin role change" → historically true, but current intended flow is realtime role propagation + `refreshSession()`.

---

## 8. DEPLOY / BUILD / RUNTIME INFRA

| Symptom | Look here first | Notes |
|---------|-----------------|-------|
| Deploy endpoint reports failure because stderr is non-empty | deploy route / shell wrapper | Historical false-negative: stderr may contain harmless git output |
| Deploy request dies before returning | PM2 restart timing | Restart must be delayed so API response can finish |
| App updated in git but not on live site | build/restart stage | Git success alone is not enough |
| Live site breaks after Nginx change | Nginx subdomain config and static alias rules | Proxy + static split is critical for deployed sites |
| Only subdomain sites fail after infra edit | subdomain Nginx file | Main app and client subdomains have different failure surfaces |

**False lead to avoid:**
- ".next cache is always the problem" → sometimes partially true, but historically many deploy failures came from restart timing or stderr interpretation.

---

## 9. CONTEXT-CORE / DOCUMENTATION RUNTIME

| Symptom | Look here first | Notes |
|---------|-----------------|-------|
| AI keeps rediscovering the same facts | `ENGINEERING_MEMORY.md`, `PROJECT_STRUCTURE.md`, `ARCHITECTURE.md` | Usually docs not updated after audit/fix |
| AI makes unsafe guesses about runtime topology | `ARCHITECTURE.md`, `PROJECT_STRUCTURE.md` | Missing mapping between MCP, Dev Console, server runtime |
| Different chats behave inconsistently | `RULES.md`, bootstrap docs, stale context-core docs | Context drift is often documentation drift |
| New model enters and breaks known pattern | `PATTERNS.md`, `MECHANICS.md`, `COMPONENTS.md` | The rule probably exists, but not in the first-read docs |

**Rule:** if a bug taught something durable, add it to `ENGINEERING_MEMORY.md` or `DEBUG_MAP.md`, not only to chat history.

---

## 10. QUICK TRIAGE PATHS

### A. "MCP doesn't work"
1. Check connector auth/token path (`setup`, `token`, bearer token)
2. Check middleware exclusions (`/.well-known`, `/api`)
3. Check `app/api/mcp/route.ts` auth and GET/POST handling
4. Only then inspect `lib/mcp-server/index.ts`

### B. "Dev Console doesn't work"
1. Check authenticated Supabase user
2. Check `DEVELOPER_USER_ID` restriction
3. Check file route / git route / deploy route specifically
4. Only then inspect file-system or shell logic

### C. "Admin role changes don't reflect"
1. Check update-user-role endpoint actually succeeded
2. Check Auth metadata vs profiles assumptions
3. Check realtime role-watch flow in `useAuth`
4. Check `refreshSession()` path

### D. "Component fine in editor, broken on site"
1. Check SiteRenderer resolver
2. Check 4 registration points
3. Check theme/navigation differences between editor and deployed site
4. Check component mechanics rules (global vs component spotlight)

---

## 11. KNOWN CROSS-CUTTING TRAPS

| Trap | Why | Fix |
|------|-----|-----|
| Reading giant files first | burns time/tokens, hides real issue | use `search_files` first, then targeted read |
| Confusing Dev Console with MCP | both touch same runtime but are different entry points | debug as separate layers |
| Assuming profiles.role is source of truth | real access derives from Auth metadata/JWT flow | inspect auth metadata + refresh path |
| Forgetting the 4 registration points | component half-works and wastes time | always check all 4 immediately |
| Blaming UI for server auth failure | many UI symptoms are backend auth/restriction issues | inspect route auth first |
| Treating harmless stderr as deploy failure | shell tools write noise to stderr | trust exit status first |
| Adding cursor spotlight inside component | duplicates global spotlight | keep cursor spotlight global only |

---

*Updated: 22.03.2026*