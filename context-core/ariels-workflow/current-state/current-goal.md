# Current Goal

## Mission: First paying beta client — actively selling as of 16.04.2026

IAM Client OS is an AI-native team workspace. Teams work through Claude/ChatGPT via MCP as their main interface. Tasks, PRs, messages, goals — all in one system. Installs on client's VPS via iam-client.sh.

**MCP Market Context (researched 16.04):** $4.5B market, 97M monthly SDK downloads. Simple MCP servers sell for $4-15k with 2-4 week delivery. IAM Client OS is the ONLY turnkey MCP workflow system for SMB. First-mover advantage confirmed.

## Roadmap to Launch

### Phase 1: Core System ✅ DONE
- [x] Tasks → PR → Review → Deploy workflow
- [x] 6 mega-tools with granular permissions
- [x] Activity Log v2 (45 event types)
- [x] Messaging V2 (WhatsApp-style, groups, push)
- [x] Goals (3 levels, comments, PR linking)
- [x] Dev Console (file tree + editor + AI chat)
- [x] Product Tour for all 4 roles
- [x] Deploy lock, persistent sessions, 3s polling

### Phase 2: Installer ✅ DONE (with known bugs)
- [x] iam-client.sh (769 lines, 12 steps, rollback, healthcheck)
- [x] Tested on 2 servers — 12/12 pass
- [x] Operator API (/api/operator — status, logs, update, restart)
- [x] iam-backup.sh (daily backup, 7-day rotation)
- [x] Dev Console inverted file tree (project files at root)
- [x] TOTP first-run flow — 3 endpoints + admin page UI
- [x] Persistent memory templates — 6 clean templates in step 4b
- [x] Bootstrap prompts — English, mega-tool syntax, no Ariel refs
- [x] TOTP_SECRET removed from .env.local (first-run owns lifecycle)
- [x] **FIXED 17.04: File delete in Admin Dev Console** — action name mismatch (delete→delete-file) + missing folder delete UI + tree refresh preserves expanded state. Commit `2ed817b`.
- [x] **FIXED 18.04: Skeleton infrastructure (Stage 1)** — `scripts/sync-to-skeleton/` with manifest + overrides + sed sanitization. First push completed, `ArielGrook/iam-client-skeleton` populated. Commits `e0f8e9d`, `e0208fd`, `1c05280`, `145bc73`.
- [ ] **BUG: Build error after git rollback (totp-test-flow imports)** — not blocking; will auto-resolve when demo is reinstalled from skeleton (skeleton excludes totp-test-flow)

### Phase 3: AI Behavior System ✅ DONE (15.04.2026)
- [x] smartOk per-tool `<internal>` injection
- [x] smartErr + errors.jsonl
- [x] Session limit 80, checkBlock (3 hard blocks)
- [x] Preset injection (frontend/backend)
- [x] session_handoff + session-stats.jsonl
- [x] v2 audit: 4 bugs + 3 arch issues fixed

### Phase 4: Polish ✅ MOSTLY DONE (15.04.2026)
- [x] C1: First-run TOTP flow
- [x] C3: Bootstrap prompts English rewrite
- [x] C5: install.sh configs (COOKIE_SECURE)
- [x] C2: Persistent memory templates in install.sh
- [x] Memory/Instructions sections in admin + dashboard Settings
- [x] Landing lineHeight fix
- [x] Deploy pipeline → validate-only
- [ ] Mobile adaptation Phase 3 (not blocking launch)
- [ ] ChatGPT MCP connector (on demand, 30-40 min)

### Phase 5: Go to Market ← **WE ARE HERE** (started 16.04.2026)
- [x] Upwork profile text finalized (MCP positioning)
- [x] LinkedIn profile set up (headline, services, experience)
- [x] MCP market research completed
- [x] Gmail iamrunning.online@gmail.com secured for cold email
- [x] GTM channels identified (6 channels, all free)
- [x] Hebrew DM templates for Israeli AI influencers
- [x] YouTube outreach strategy defined
- [ ] **Upwork: account suspended, Appeal pending (24-72h)**
- [ ] LinkedIn DMs to Gilad Shoham + Leon Mulumud (MCP Israel)
- [ ] YouTube: find 10 small AI/automation channels, DM free access
- [ ] Facebook: join Israeli tech groups
- [ ] Reddit: warm account, post in r/mcp
- [ ] Cold email: 10/day via Gmail
- [ ] iamrunning.online landing redesign (NOT NOW, after first client)
- [ ] Terms of Service
- [ ] Stripe (waiting for IBAN, first payment via PayPal)

## Critical Bugs to Fix Before Demo

1. ✅ **FIXED 17.04: File delete in Admin Dev Console** — see Phase 2
2. ✅ **ADDRESSED 18.04: GitHub history exposure** — skeleton repo now has fresh history, starting from first sync commit. Clients installing from skeleton won't see lego-base dev commits.
3. **Build error on demo server** — totp-test-flow imports missing functions. Fix by reinstalling demo from skeleton (skeleton excludes this dev endpoint).
4. **Hardcoded paths in 5 source files** — `/var/www/iam-os` and `pm2 restart iam-os` hardcoded. Fix already committed (5546822 + 1f7da3b), now live via skeleton sync.
5. ✅ **FIXED: iam-client.sh step 4b missing totp-test-flow cleanup** — skeleton eliminates need for step 4b entirely. Stage 2 will remove step 4b from iam-client.sh.

## Critical Missing Features

1. **Client GitHub repo strategy** — clients must NOT push to production repo (see INSTALLER_SPEC_v1.md §2)
2. **Environment Settings in Admin Panel** — GitHub token, Supabase keys, API keys (collapsed section)
3. **Demo viewer account** — read-only admin for cold outreach demos
4. **Supabase integration** — never tested, decide if needed for v1

## Installer Naming (cleaned up 17.04)

- `install.sh` (root) = **thin wrapper** — for backwards compatibility with curl|bash pattern
- `scripts/iam-client.sh` = **the actual installer** (~600 lines, all features)
- Spec: `ariel-workflow/INSTALLER_SPEC_v1.md`

## 🆕 Strategic Architecture Decision (17.04.2026 morning — updated 18.04)

После мобильного брейнсторма с Opus 4.7 утверждена единая архитектура трёх концептов:

**1. Skeleton repo** (`ArielGrook/iam-client-skeleton`) — чистый код, откуда ставятся клиенты. Dev repo (lego-base) ≠ client install. ✅ **ГОТОВО 18.04.2026:** `scripts/sync-to-skeleton/` с manifest + 28 overrides + sed-санитизацией. Первый sync выполнен, skeleton содержит 173 чистых text файла + код. Commits `e0f8e9d`, `e0208fd`, `1c05280`, `145bc73`.

**2. Web Installer** — форма в Admin панели iamrunning.online. Клиент получает curl команду, копирует в консоль. Live прогресс через polling. Вариант A (НЕ SSH с нашей стороны). *Ещё не реализовано — Stage 5+.*

**3. Operator Role** — теневая роль с полным доступом (read/write/patch/delete/exec) на клиентском сервере. Невидимая для клиента: UI hidden + OS file perms (chmod 600, chattr +i, root owner, neutral naming `_maint/`) + networking hidden. *Ещё не реализовано — Stage 5+.*

**4. Tripwire & Freeze** — guard процесс на клиентском сервере слушает inotify на protected paths. При незаконном доступе: alert → auto-rollback (git reset --hard HEAD~1) → freeze system (клиент видит official suspension screen). *Ещё не реализовано — Stage 5+.*

**Kernel/rootkit level НЕ используем** (незаконно, business-killer). Уровни UI + file perms + networking + tripwire достаточны против 99% клиентов.

**Всё сходится в Admin панели iamrunning.online:** форма установки + список клиентов + карточка каждого с env, logs, operator actions, freeze/unfreeze, kill switch.

**Полная спека:** `ariel-workflow/OPERATOR_WEBINSTALLER_SKELETON_SPEC.md` (9 секций)

## Pricing (updated 16.04)

- **Beta (DMs only):** $300-500 setup, free usage for feedback
- **After beta (4-5 clients):** $1,500-3,000+ setup
- **Market context:** simple MCP servers sell $4-15k, 2-4 weeks
- **MCP-as-a-Service (future):** $29-99/month subscription tier
- **First payment:** PayPal (skip Stripe for now)

## GTM Channels (ranked by expected ROI)

1. LinkedIn DMs — Israeli AI influencers + global MCP community
2. YouTube — small AI/automation channels (500-10k subs), free access for review
3. Cold email — 10/day via iamrunning.online@gmail.com
4. Facebook — Israeli tech groups
5. Reddit — engagement marketing in r/mcp, r/LocalLLaMA, r/ClaudeAI
6. Upwork — monitor Appeal, route any client through for reviews
7. Upwork/Fiverr — contact database (find AI freelancers, contact via LinkedIn)

## Key Documents

- `ariel-workflow/SESSION_HANDOFF_16_04_2026.md` — full GTM day handoff
- `ariel-workflow/roadmap.md` — technical task tracker
- `ariel-workflow/INSTALL_CLEANUP_ROADMAP.md` — install.sh spec
- Chat transcript 16.04 — MCP-as-a-Service spec (search "ДОКУМЕНТ 2: СПЕКА ДЛЯ КУРСОРА")

*Updated: 18.04.2026 12:25 — Stage 1 skeleton infrastructure complete, first sync successful*
