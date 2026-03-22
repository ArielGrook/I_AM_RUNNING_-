# DEVELOPMENT RULES

*Operational doctrine for AI work inside I AM RUNNING.*
*Goal: minimize blind edits, repeated audits, and context drift.*

---

## 1. CORE PRINCIPLE

Do **not** guess.
Do **not** patch from intuition.
Do **not** treat chat memory as source of truth.

Source of truth is always:
1. relevant code/files
2. `context-core/` documents
3. confirmed runtime behavior

If something is not confirmed, mark it as an open question — do not present it as fact.

---

## 2. THREE ACCESS MODES

### Mode 1 — MCP Connector (full reasoning mode)
Use when the model can audit, reason, decide, and execute in one session.

Rules:
- Audit relevant files before any meaningful change
- Prefer `search_files` before `read_file`
- Update `context-core` after durable discoveries
- Separate confirmed facts from hypotheses
- When writing docs, write only what was verified or clearly marked as pending

### Mode 2 — Dev Console Executor (cheap execution mode)
Use when a cheaper/faster model is executing a narrow task from a prepared prompt.

Rules:
- One task per prompt maximum
- Read minimum necessary files only
- Prefer targeted patching over broad rewrites
- Never improvise architecture decisions
- Never treat Dev Console as independent source of truth; it executes against the server runtime

### Mode 3 — Documentation / Audit mode
Use when the goal is to map, explain, or formalize the system.

Rules:
- Prioritize architecture, structure, flows, traps, and symptom maps
- Avoid cosmetic edits unless they improve clarity
- Every durable finding should land in the proper `context-core` file
- Distinguish current implementation from future product ideas

---

## 3. ORDER OF WORK

For any non-trivial task:
1. Determine the layer involved
   - Website/Product layer
   - Operational/Dev layer
   - AI Access layer
2. Identify relevant files with `search_files` / directory scan
3. Audit before writing
4. Make the smallest correct change
5. Update documentation if the change/finding is durable
6. Deploy only if requested or clearly required

---

## 4. USE THE RIGHT DOCUMENT FOR THE RIGHT KNOWLEDGE

- `ARCHITECTURE.md` — major flows and system layers
- `PROJECT_STRUCTURE.md` — role of specific files
- `ENGINEERING_MEMORY.md` — durable engineering knowledge, discoveries, traps
- `DEBUG_MAP.md` — symptom → area → first checks
- `PATTERNS.md` — short operational patterns worth copying exactly
- `MECHANICS.md` — mechanics doctrine for components and interactions
- `COMPONENTS.md` — Craft/Tron component system rules
- `PROGRESS.md` — current working state, blockers, recent changes
- `RULES.md` — behavior doctrine for models/operators

Do not dump everything into one doc.

---

## 5. COMPONENT RULES

See also: `COMPONENTS.md` and `PROJECT_CONTEXT/COMPONENT_WRITING_RULES_v2.md`

Mandatory:
- Register new Craft component in 4 places:
  1. `lib/craft/components/index.ts`
  2. editor resolver
  3. `app/sites/[slug]/SiteRenderer.tsx` resolver
  4. `components/craft/Toolbox.tsx`
- Colors via theme tokens (`buildTokens` / token helpers), not arbitrary hardcoding
- Editable inline text only through shared `EditableText`
- Media through MediaLibrary URLs, not base64 props
- Respect mobile strategy used in project (ResizeObserver-based patterns where applicable)

Forbidden:
- Hardcoded component-local cursor spotlight
- Skipping one of the 4 registration points
- Reading env directly inside client components for auth credentials

---

## 6. MECHANICS RULES

See full doctrine: `MECHANICS.md`

Critical distinction:
- **Global mechanics** live outside the component
  - cursor spotlight
  - page-level animation orchestration
- **Component mechanics** live inside the component
  - static spotlight
  - magnetic buttons
  - tilt
  - parallax
  - count-up

Never implement component-level mousemove cursor spotlight if the project already provides a global one.

---

## 7. CODE SAFETY

- No `window.*` / DOM access without SSR guard
- No browser storage access in server-unsafe contexts
- Supabase client in components must be memoized when recreated from changing auth inputs
- Refresh token before client-side Supabase REST requests when required by current auth pattern
- LZUTF8 always with explicit Base64 encoding options
- Do not read giant files in full if targeted search can isolate the relevant section

---

## 8. AUTH / ACCESS SAFETY

- Admin routes use cookie-based server auth — do not assume Supabase user auth is enough there
- Dev-agent routes use Supabase user auth and may additionally restrict by `DEVELOPER_USER_ID`
- MCP routes use Bearer token auth and their own setup/token flow
- Do not confuse these three access models while debugging

---

## 9. MCP / DEV CONSOLE DISTINCTION

This is critical:
- **MCP** is a protocol access surface for external AI clients
- **Dev Console** is a browser-based operational/development surface
- They share server runtime, docs, and some config primitives
- They are not the same subsystem and should not be documented/debugged as if they were the same thing

When something breaks, first identify whether the issue is:
- MCP protocol/auth/tooling
- Dev Console UI/route/auth/tooling
- shared server runtime underneath both

---

## 10. PROTECTED / HIGH-RISK FILES

Never write casually to:
- `.env`, `.env.local`, `.env.production`
- `node_modules/`
- `.next/`

High-risk zones — audit before editing:
- `middleware.ts`
- auth/session flows
- payment/webhook routes
- deploy scripts / restart logic
- MCP auth/token/setup routes
- `app/[locale]/editor/page.tsx`
- `app/sites/[slug]/SiteRenderer.tsx`

---

## 11. DOCUMENTATION DISCIPLINE

After work, update docs when appropriate:
- Significant architecture insight → `ARCHITECTURE.md`
- Durable file-role discovery → `PROJECT_STRUCTURE.md`
- New trap / confirmed behavior → `ENGINEERING_MEMORY.md`
- New symptom mapping → `DEBUG_MAP.md`
- Shipped feature / changed state → `PROGRESS.md`
- New operational rule → `RULES.md`

If the knowledge will matter in the next chat, it belongs in `context-core`, not only in conversation history.

---

## 12. DEBUGGING DISCIPLINE

Before proposing a fix:
- confirm the symptom class
- identify the correct layer
- check the first known hot spots from `DEBUG_MAP.md`
- avoid false leads already disproven in `ENGINEERING_MEMORY.md`

Do not re-discover old traps if they are already documented.

---

## 13. DEPLOY DISCIPLINE

- Deploy only when requested or clearly necessary to validate a change
- For product/UI changes: live validation is often required
- For critical path changes (auth, payments, middleware, deploy, MCP): audit more deeply before deploy
- PM2 restart should follow the known delayed pattern (`nohup sleep 2`) to avoid self-killing the route response
- Do not treat harmless stderr as failure without checking process exit status

---

## 14. GIT DISCIPLINE

- Snapshot/commit before risky writes when workflow permits
- Use meaningful commit prefixes: `feat:`, `fix:`, `refactor:`, `docs:`
- Do not perform careless broad rewrites without need
- Prefer reversible, inspectable changes

---

## 15. WHAT TO DO WHEN UNSURE

If unsure:
1. search for the exact file/function/event first
2. inspect related `context-core` docs
3. state uncertainty explicitly
4. document the open question if it matters for future work

Uncertainty is acceptable.
Blind confidence is not.

---

*Updated: 22.03.2026*