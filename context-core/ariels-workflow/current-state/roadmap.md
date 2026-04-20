# ROADMAP — IAM Client OS
## Актуальный трекер задач (обновлён 14.04.2026)

---

## ✅ ЗАВЕРШЕНО

### Архитектура и инфраструктура
- ✅ Data Layer: 11 модулей lib/data/ — единый источник правды
- ✅ Security sprint 14/14
- ✅ 4 глобальных роутера (Tool Registry, Permissions, Notify, Status)
- ✅ 6 mega-tools (files, tasks, communication, goals, code_review, devops)
- ✅ iam. prefix (/iam.admin, PM2, activity)
- ✅ Activity Log v2 (45 event types, session tracking)
- ✅ Deploy lock (globalThis flag, prevents OOM)
- ✅ Persistent sessions (24h, survive PM2 restart)
- ✅ Extensions framework (manifest.json + project-stats PoC)

### UI
- ✅ Admin Panel: 8 табов, dark/light mode, full feature set
- ✅ Dashboard: Work, Pull Pool, Goals, Messages, Team, Setup tabs
- ✅ Dev Console: CodeMirror editor, file tree, git history, PR panel, AI chat (Gemini)
- ✅ Dev Console inverted file tree: project files at root, iam-client-os/ virtual folder
- ✅ Product Tour for all 4 roles
- ✅ Messaging V2: WhatsApp-style, groups, push notifications, avatars, profiles
- ✅ Diff View (LCS algorithm, 3 modes)
- ✅ Mobile responsive (Phase 1-2, ~70%)

### Workflow
- ✅ Tasks → PR → Review → Deploy full cycle
- ✅ Reviewer role (architectural guardian, approve/reject/comment)
- ✅ Goals: 3 levels, comments, PR linking
- ✅ Spec Request system
- ✅ Onboarding brother + uncle (11 апреля, workflow confirmed)

### Installer
- ✅ iam-client.sh (769 lines, 12 steps, rollback, healthcheck)
- ✅ iam-backup.sh (daily, 7-day rotation)
- ✅ Operator API (/api/operator — status, logs, update, restart)
- ✅ --no-landing flag (server-side redirect)
- ✅ Tested on 2 servers — 12/12 pass, 12 bugs found and fixed

### Docs & Organization
- ✅ docs/architecture/ — 8+ documents, full system map
- ✅ IDEAS/ organized into 7 categories (29 files)
- ✅ ariel-workflow/ personal persistent memory system
- ✅ ai-wisdom.yaml — index of all 28 IDEAS files with importance ratings

### MCP Tool Injection System (15.04.2026)
- ✅ smartOk behavioral injection — per-tool `<internal>` blocks on EVERY tool call
- ✅ smartErr — error recovery hints per tool + errors.jsonl logging
- ✅ Timestamp in preamble (Israel UTC+3)
- ✅ Session limit 80, early warn 50, soft limit 72
- ✅ checkBlock — 3 pre-execution hard blocks (writes without snapshot, session state, absolute limit)
- ✅ Preset injection — frontend/backend mode, path-aware
- ✅ session_handoff MCP action — one command for session-end ritual
- ✅ session-stats.jsonl — compliance_score tracking
- ✅ Contextual rules — 1-2 relevant rules per tool based on file path
- ✅ All injection text English, `<internal>` tags
- ✅ Bugfix: 11 missing toolName params across all mega-tools

---

## 🔴 CRITICAL — блокеры / баги для первого клиента

| # | Задача | Статус | Описание |
|---|--------|--------|----------|
| ~~C1~~ | ~~First-run TOTP flow~~ | ✅ DONE 15.04 | 3 endpoints + admin UI + test page. TOTP_SECRET removed from install.sh |
| ~~C2~~ | ~~Persistent memory templates~~ | ✅ DONE 15.04 | 6 clean templates in step 4b, dev-specific dirs removed |
| ~~C3~~ | ~~Bootstrap prompts English~~ | ✅ DONE 15.04 | All 5 files rewritten, mega-tool syntax, no Ariel refs |
| ~~C4~~ | ~~MCP tool injection~~ | ✅ DONE 15.04 | 11 tasks + v2 audit, all deployed |
| ~~C5~~ | ~~install.sh configs~~ | ✅ DONE 15.04 | COOKIE_SECURE added |
| C6 | **File delete broken in Dev Console** | 🔴 BUG | Right-click → Delete → file disappears from view but stays in tree. Super Admin, full perms. |
| C7 | **Build error after rollback** | 🔴 BUG | totp-test-flow/route.ts imports non-existent functions. Fix: delete app/api/admin/totp-test-flow/ on client installs |
| C8 | **GitHub history exposed** | 🔴 SECURITY | Client install shows all dev commits. Need client-specific repos |
| C9 | **Client GitHub repo strategy** | 🔴 MISSING | Clients push to ArielGrook/iam-client-os production repo. Need: client repos + GitHub token in Settings + git remote switch |
| C10 | **Environment Settings in Admin** | 🔴 MISSING | Collapsed section for GitHub token, Supabase keys, API keys. GitHub features only after token configured |
| C11 | **Demo viewer account** | 🟡 NEEDED | Read-only admin on demo.iamrunning.online for cold outreach |
| C12 | **Supabase integration untested** | 🟡 QUESTION | No table creation code. Does v1 need Supabase or is file-based JSON enough? |
| C13 | **install.sh rethink** | 🟡 FUTURE | Web-installer on iamrunning.online or curl-based install without GitHub token dependency |

---

## 🟡 HIGH — важно но не блокирует launch

| # | Задача | Описание |
|---|--------|----------|
| ~~H1~~ | ~~**90% session auto-trigger**~~ | ✅ DONE — checkBlock Block point 2 at 72/80 calls |
| ~~H2~~ | ~~**session_handoff MCP action**~~ | ✅ DONE — one command for session-end ritual |
| ~~H3~~ | ~~**Timestamp in smartOk**~~ | ✅ DONE — Israel UTC+3 in every preamble |
| ~~H4~~ | ~~**Skills + Project Memory в Settings**~~ | ✅ DONE 15.04 — Memory/Instructions sections added to admin + dashboard Settings |
| H5 | **ChatGPT MCP connector** | /api/mcp-gpt/ endpoint для ChatGPT. Есть на iamrunning, нет на iam-client-os |
| H6 | **Mobile adaptation Phase 3** | DashboardDevConsoleTab на мобиле + лендинг overflow |
| H7 | **Code Reference System** | Select lines → message admin / copy AI prompt. Упоминается в 3 документах |

---

## 🟢 MEDIUM — после launch

| # | Задача |
|---|--------|
| M1 | Marketer role + content workflow |
| M2 | Work Groups (dynamic team channels) |
| M3 | Task Priority ordering |
| M4 | Path Presets UI (admin configures worker paths via dropdown) |
| M5 | Update PLATFORM_CHECKLIST.md checkboxes |
| M6 | Mark completed items inside SYSTEM_AUDIT_RESULTS |

---

## 🔵 SCALE — зрелость продукта

| # | Задача |
|---|--------|
| S1 | Test coverage (currently 0 — critical gap) |
| S2 | CSRF validation on dashboard API |
| S3 | search_files command injection (execFileSync) |
| S4 | Rate limit on dashboard/admin APIs |
| S5 | withFileLock timeout → fail instead of proceeding |
| S6 | SSE instead of 3s polling |
| S7 | SQLite migration (at ~10 concurrent users) |
| S8 | Operator Dashboard on iamrunning.online |

---

## 🟣 GTM — go to market (updated 16.04.2026)

| # | Задача | Статус |
|---|--------|--------|
| G1 | iamrunning.online landing redesign | ⬜ NOT NOW — after first client |
| G2 | Terms of Service | ⬜ |
| G3 | Stripe (waiting for IBAN) | ⬜ blocked — first payment via PayPal |
| G4 | Upwork profile finalized | ✅ DONE — MCP positioning, full overview |
| G4b | Upwork account suspended | 🔴 Appeal pending (24-72h, camera bug) |
| G5 | LinkedIn profile set up | ✅ DONE — headline, services, experience |
| G5b | LinkedIn DMs to Israeli MCP influencers | ⬜ templates ready (Hebrew) |
| G6 | YouTube outreach (small AI channels) | ⬜ strategy defined |
| G7 | Gmail cold email channel | ✅ iamrunning.online@gmail.com secured |
| G8 | Facebook Israeli tech groups | ⬜ |
| G9 | Reddit engagement (r/mcp, r/LocalLLaMA) | ⬜ account ready, needs warmup |
| G10 | MCP market research | ✅ DONE — $4.5B market, SMB niche empty |
| G11 | First beta client ($300-500 setup) | ⬜ target: April 20 |

### GTM Channels (ranked by expected ROI)
1. LinkedIn DMs — Israeli AI influencers + global MCP community
2. YouTube — small AI/automation channels (500-10k subs), free access for review
3. Cold email — 10/day via iamrunning.online@gmail.com
4. Facebook — Israeli tech groups
5. Reddit — engagement marketing
6. Upwork — monitor Appeal, route any client through for reviews
7. Upwork/Fiverr — contact database (find AI freelancers, write via LinkedIn)

### Pricing (updated 16.04)
- Beta (DMs only): $300-500 setup
- After beta: $1,500-3,000+
- Market: simple MCP servers = $4-15k, 2-4 weeks
- MCP-as-a-Service (future): $29-99/month subscription

### Key Tactics
- Any client found outside Upwork → ask to create Upwork contract → builds review history
- Beta-tester language ONLY in DMs, never in public profile
- YouTube: not just MCP channels — any digital/AI/automation/no-code channels
- Upwork/Fiverr profiles as contact DB: find freelancers' LinkedIn, write as peer
- Pitch for non-technical channels: "AI workflow system" not "MCP server"

---

*Обновлено: 16.04.2026 22:00*
