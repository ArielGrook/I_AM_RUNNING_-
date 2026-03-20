# DEBUG MAP — Symptom → Code Area

*When something breaks, look here first instead of doing a full audit.*

---

## INTERACTIVE / ASSEMBLY

| Symptom | Look here | Notes |
|---------|-----------|-------|
| Interactive steps not navigating | `app/[locale]/interactive/page.tsx` contract.step state | Check canProceed() validation |
| "Building your website" stuck forever | AssemblerInner useEffect, hidden Craft.js Editor | parseReactElement may fail silently |
| Preview shows empty page | buildElementsFromContract in `lib/craft/assembler/index.ts` | Block ID not in BLOCK_MAP |
| Preview components overlapping | Component CSS — each Tron has `minHeight: sectionHeight + vh` | Check if container has overflow |
| Save fails after preview | Supabase insert in handleSaveProject | Check user auth, RLS policies |
| Anonymous user loses work | localStorage `iam_interactive_contract` | Check signup redirect preserves `from=interactive` |

## EDITOR

| Symptom | Look here | Notes |
|---------|-----------|-------|
| Component not in Toolbox | `components/craft/Toolbox.tsx` tronSections array | Also check import line |
| Component works in editor but not on deployed site | `app/sites/[slug]/SiteRenderer.tsx` resolver | Missing from resolver import |
| Colors don't propagate to other pages | `app/[locale]/editor/page.tsx` iam_color_preset_changed handler | Event dispatched from Viewport.tsx |
| Theme toggle doesn't affect all pages | Same as above but `iam_color_scheme_changed` event | |
| Page switching loses data | `lz.compress/decompress` in editor/page.tsx | Check Base64 encoding option |
| Frame shows blank after page switch | `key={activePageId-frameKey}` on Frame | Key must change to force remount |
| Drag-and-drop broken | Craft.js core, `connect(drag(ref))` in component | Check useNode hook destructuring |
| Save fails silently | `saveProjectToSupabase` in `lib/store/supabase-sync.ts` | Token may be expired |

## DEPLOYED SITES (*.iamrunning.online)

| Symptom | Look here | Notes |
|---------|-----------|-------|
| Site shows 404 | `app/sites/[slug]/page.tsx` — Supabase query | Check slug matches, project.published = true |
| Site loads but components missing | SiteRenderer resolver | Component not imported |
| Navigation doesn't work | `iam_navigate` CustomEvent in SiteRenderer | Components must use handleLinkClick |
| Theme toggle broken on site | `applyColorScheme` in SiteRenderer | Rebuilds craftJson + changes Frame key |
| GSAP animations not firing | `data-animate` attrs + ScrollTrigger init in SiteRenderer | Check if enabled={false} blocks animations |
| Spotlight cursor laggy | DOM ref vs useState check | Must use direct DOM mutation, not state |

## AUTH

| Symptom | Look here | Notes |
|---------|-----------|-------|
| Login redirects wrong | `useAuth` guards in page components | Check locale in redirect URL |
| Role not updating | `user.user_metadata.role` | Set via admin panel, needs re-login |
| TronLogin/Register not saving session | `injectSupabaseCredentials` | Credentials injected at Connect |
| Avatar not showing | HeaderTron `session.user.user_metadata.avatar_url` | Upload via MediaLibrary, sync via `iam_auth_changed` |
| Backend auth migration fails | `runMigrations` in backend-auth route | RLS policy may already exist (use IF NOT EXISTS) |

## DEV CONSOLE

| Symptom | Look here | Notes |
|---------|-----------|-------|
| File tree empty | `GET /api/dev-agent/files` | Auth failure or fs permission |
| Code viewer not loading file | `GET /api/dev-agent/files/read` | File > 500KB or blocked path |
| Edit mode not saving | `POST /api/dev-agent/files/write` | Check blocked patterns |
| Deploy fails with "Error: ..." | deploy/route.ts | Was stderr check — now fixed to status only |
| Git history empty | `GET /api/dev-agent/git-log` | Check git repo exists in PROJECT_ROOT |
| AI execution loops | Gemini adapter in `lib/dev-agent/ai-provider.ts` | functionResponse format must be role: "function" |
| Context menu not working | page.tsx event bubbling | Backdrop onClick closes menu before button fires |

## MCP CONNECTOR

| Symptom | Look here | Notes |
|---------|-----------|-------|
| "Couldn't reach MCP server" | .well-known/* routes + middleware.ts | Middleware must exclude .well-known |
| 401 on MCP tools | app/api/mcp/route.ts auth check | Verify mcpAuthToken in config |
| patch_file "not found" | Text must be EXACT match, appear exactly once | Use run_command head/tail to see real content |
| deploy returns but nothing happens | iam-deploy.sh + nohup pattern | Build takes ~2 min, check pm2 logs after |
| run_command "not allowed" | Whitelist in lib/mcp-server/index.ts | Only prefixes in whitelist work |

## ADMIN PANEL

| Symptom | Look here | Notes |
|---------|-----------|-------|
| Mobile shows desktop layout | isMobile detection in admin/page.tsx | Uses window.innerWidth (not ResizeObserver) |
| SEO page broken on mobile | admin/seo/page.tsx | Fixed sidebar needs isMobile conditional |
| TOTP login not working | admin/page.tsx | Hardcoded credentials, Google Authenticator |
