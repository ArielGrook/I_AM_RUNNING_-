# PROGRESS — updated 22.03.2026 (end of session)

## Working ✅

### Core Platform
- Craft.js editor with 18 Tron components
- Client site deploy on subdomains (SSR, pixel-perfect)
- Dev Console: Full IDE with file manager, code editor, git history, deploy/rollback
- MCP Connector: Claude has direct project access via `/api/mcp/*`
- MCP GPT: ChatGPT safe audit endpoint `/api/mcp-gpt/*` (read + context-core write)
- Interactive pipeline: 4-step wizard → assembly → preview → save
- Context Core: 11 documents, actively maintained as AI runtime memory

### Interactive Step 1 (redesigned 22.03.2026)
- 16 light colorful SVG thumbnails (140×88), each in its own color family
- Cards always light — background transparent, SVG sets the color
- AnimatedBackground: 140 icons, left-based (0..130%), translate(-160vw,-140vh)
- Opacity 0.10-0.22 (was 0.85 — too bright)

### AI Access Layer
- MCP server: 12 tools (read/write/patch/search/git/deploy/run_command)
- MCP GPT safe server: 7 tools (read_file with offset/limit, read_range, file_stat, list_directory, search_files, read_multiple_files, write context-core only)
- OAuth flow for both Claude and ChatGPT connectors
- ChatGPT connected and tested — reads context-core via mcp-gpt endpoint

### AI Native Business OS — Product Template (NEW 22.03.2026)
- `product-template/` created — complete installation package
- `install-client.sh` v2: checks deps, generates secrets, creates context-core, PM2 via ecosystem.config.js, Nginx config
- `generate-ecosystem.js`: separate helper for PM2 env injection (no bash quoting issues)
- `manage-clients.sh`: list/status/logs/restart/backup/remove all clients
- `auto-backup.sh`: daily cron backup — git commit + push context-core to GitHub
- Context-core template: 8 documents (SYSTEM_IDENTITY, CURRENT_GOAL, IDEAS, MVP_BRIEF, NEXT_ACTIONS, WEEKLY_PROGRESS, ARCHITECTURE, ENGINEERING_MEMORY)
- Bootstrap prompts: claude-start.md + chatgpt-start.md
- INSTALL.md: founder installation guide with pricing reference
- First test installation: iam-gooner process created and ran successfully

## Security ✅
- Admin API: httpOnly cookie auth on all /api/admin/* routes
- Admin UI: 404 for non-admins + IP ban after 3 probes
- MCP: Bearer token auth, separate tokens per endpoint
- GPT MCP: separate secret, read-only + context-core write only
- Audit log for all GPT MCP write operations (.gpt-mcp-audit.log)

## Role System v2 ✅
- Roles 0-7, source of truth: auth.users.user_metadata.role
- Real-time role propagation via Realtime subscription

## MVP Blockers 🔴
- Stripe integration (checkout, webhook, subscription check)
- Route protection middleware
- Landing: pricing section + demo CTA

## Open Issues ⚠️
- Client multi-tenancy architecture: separate PM2 per client conflicts on shared .next build
  → Solution: single PM2 process, Nginx passes X-Client-Slug header, middleware routes
  → OR: use lego-base.online as separate domain for client deployments (next session)
- iam-gooner process currently stopped (architecture decision pending)
- client-home/page.tsx created but not yet wired properly
- page.tsx patched to detect CLIENT_SLUG — revert or keep pending architecture decision

## Architecture Decision Pending 🟡
**Client multi-tenancy — 3 options, decide next session:**

Option A — Single process, header-based routing (cleanest, most scalable)
  - One PM2, Nginx sets X-Client-Slug header per domain
  - Middleware reads header, loads client's context-core
  - All clients share one build

Option B — Separate domain per client (simplest for now)
  - lego-base.online as client OS domain
  - client.lego-base.online per client
  - Each client = separate PM2 process with own PORT
  - Separate git clone per client (no shared .next conflict)

Option C — Hybrid
  - Your main product stays on iamrunning.online
  - Client systems on lego-base.online subdomains
  - Separate repo/build per client

## Next Priority — Roadmap

### 🔴 Priority 1 — Monetization (I AM RUNNING core product)
- [ ] Stripe integration
- [ ] Route protection middleware
- [ ] Landing: pricing + demo CTA

### 🟡 Priority 2 — AI Native OS product (new business line)
- [ ] Decide client multi-tenancy architecture (Options A/B/C above)
- [ ] Set up lego-base.online for client deployments
- [ ] Fix install-client.sh for chosen architecture
- [ ] First real client installation (Grisha as test)
- [ ] Revert/clean page.tsx client-home patch if going Option B

### 🟢 Priority 3 — Polish
- [ ] Interactive: steps 2-5 restructure
- [ ] i18n for Interactive
- [ ] Niche-specific Tron components
