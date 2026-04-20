# PROGRESS — v9, updated 20.04.2026

*Previous version (v6 from 27.03) described Stage 1 of iam-client-os — everything done but superseded. Full archive of v6 is in git history (commit before `73b0d2a`).*

---

## Platform snapshot

**I AM RUNNING** is one platform, three products:

1. **iamrunning.online** — Website Builder SaaS + platform control plane + (soon) home of IAM Client OS source code. This server (VPS 94.176.238.108).
2. **IAM Client OS** — Team AI Workspace. Installs on client's VPS via `iam-client.sh`. Currently developed on lego-base (VPS 185.5.55.111). **Migrating to iamrunning.online by 22–23.04.2026.**
3. **iamrunning.ai** — Electron desktop client (local Ollama + bundled MCP server). Repo: `ArielGrook/iamrunning.ai`.

---

## Active migration (lego-base → iamrunning)

lego-base Time4VPS subscription is being terminated. Full migration of IAM Client OS source + workspace docs → iamrunning.online. See `context-core/ariels-workflow/PLATFORM_REFACTORING.md` for the 7-step plan and live status table.

Current step: **1.3** (this — actualizing context-core docs).

---

## Current state per product

### iamrunning.online (this server)

- ✅ Craft.js editor with Tron components (HeroTron, HeaderTron, TronFeatures, TronPricing, TronFAQ, TronContact, etc.)
- ✅ Site deploy to `*.iamrunning.online` (SSR, wildcard SSL)
- ✅ Dev Console IDE at `/[locale]/admin/dev-console` (file browser + editor + AI agent)
- ✅ MCP Connector endpoint `/api/mcp` (~12 tools, Bearer auth, OAuth flow)
- ✅ ChatGPT-safe MCP endpoint `/api/mcp-gpt` (context-core write + full file read)
- ⏳ Ingesting IAM Client OS as `iam-clients-os/` folder (migration Steps 2-4)
- ⏳ New Admin page `/[locale]/admin/iam-clients-os/` with 4 subtabs: Settings, Client Projects, Web Installer, Dev Workspace (Step 3)
- ⏸️ Stripe (deferred — first payment via PayPal)
- ⏸️ Route protection middleware (deferred until first paying customer)

### IAM Client OS (currently on lego-base, migrating)

**Status: production-ready for first paying client. FROZEN until real client reports a bug. All active focus is on iamrunning.ai and this migration.**

- ✅ Core workflow: Tasks → PR → Review → Approve+Deploy
- ✅ 6 mega-tools (`files`, `tasks`, `communication`, `goals`, `code_review`, `devops`) with capability gates
- ✅ MCP Tool Injection V2 (`smartOk`, `smartErr`, `checkBlock`, `session_handoff`, preset injection). Session counter resets on `read_memory` / `onboard` / `session_handoff` (fixed 19.04).
- ✅ Activity Log V2 (45 event types), Messaging V2 (WhatsApp-style + groups + push), Goals (3 levels + comments + PR linking)
- ✅ Dev Console (file tree + editor + AI chat), Product Tour (4 roles), Deploy lock, persistent sessions
- ✅ `iam-client.sh` installer — 769 lines, 12 steps, rollback, healthcheck, update mode. Tested end-to-end on Stage 3.
- ✅ Operator API (`/api/operator/*` — status, logs, update, restart) for no-SSH remote management
- ✅ TOTP first-run flow, English+generic bootstrap prompts, clean memory templates
- ✅ Stage 3 test install live: `https://iam-test.lego-base.online` (PM2 `iam.iam-test`, port 4742). Verified 19.04.
- ✅ Skeleton repo `ArielGrook/iam-client-skeleton` — 5 syncs, all fixes pushed, clean history
- ✅ OAuth debug logging gated behind `OAUTH_DEBUG` env flag (fixed 19.04)
- ✅ Super Admin preset uses `ALL_TOOLS` from registry (fixed 19.04)
- ✅ Dev Console tab persistence + unsaved-changes warning (fixed 19.04)
- ✅ Dashboard Setup tab restored (was silently removed) — fixed 19.04
- ⏳ SSL for iam-test (certbot, pending)
- ⏳ Backlog: `team-regenerate-token` refresh tools[], MANIFEST exclude for totp-test-flow, end-to-end scenario test

### iamrunning.ai (defrosted 19.04.2026)

**Status: active development. Claude Max + Cursor subscriptions have limited time remaining, so focus is on specifications so Cursor can continue independently.**

- ✅ Roadmap 17 — Phases 17A (10/10 sub-phases) + 17B complete. 12 commits on `github.com/ArielGrook/iamrunning.ai`.
- ✅ RAG unified pipeline: `{project}/rag/` only, bge-m3 embedder, `rag-manifest.json` registry, 5 templates, bilingual EN+RU with auto-detection, live stats, Clear Index UI, Windows/OneDrive guards, targeted chunk deletion, batched scheduler
- ✅ Solo + Team modes, Ollama AI Chat + Claude API streaming, OAuth 2.1 + PKCE, Cloudflare named tunnel, Terminal (node-pty), CodeMirror editor
- ⏳ **Phase 17D — Ollama tool-calling polish (2-3h) — NEXT**. Addresses Qwen tool-call instability observed in 17A.9 verification.
- ⏳ Phase 17C — Persistent memory via shadow hints (3-4h, unblocked by 17B manifest foundation)
- 📋 Roadmaps 18-23 planned (Fine-tune QLoRA, MCP Tools Expansion + GPT-5, Master Mode UI, Payment via PayPal, License Server, LAN + mDNS)

---

## Go to Market (Phase 5 — active since 16.04.2026)

**Goal: first paying beta client.**

- ✅ Upwork profile text finalized (MCP positioning)
- ✅ LinkedIn profile set up
- ✅ MCP market research (the market is $4.5B, 97M monthly SDK downloads, simple MCP servers sell $4-15k with 2-4 week delivery; IAM Client OS is the only turnkey MCP workflow for SMB)
- ✅ Gmail `iamrunning.online@gmail.com` for cold email
- ✅ GTM channels identified: LinkedIn DMs (Israeli AI influencers + global MCP community), YouTube (small AI/automation channels), Cold email (10/day), Facebook (Israeli tech groups), Reddit (r/mcp, r/LocalLLaMA), Upwork (pending Appeal)
- 🔴 Upwork: account suspended, Appeal pending
- ⏳ LinkedIn DMs to Gilad Shoham + Leon Mulumud (MCP Israel)
- ⏳ YouTube: find 10 small AI/automation channels, DM free access
- ⏳ Reddit: warm account, engagement in r/mcp
- ⏳ Demo viewer account on iam-test for cold demos
- ⏸️ Stripe (deferred — first payment via PayPal)

**Pricing (Phase 1 beta):** $300-500 setup, free usage for feedback, 3-5 clients target. Phase 2 (after 4-5 case studies): $1,500-3,000+ setup.

---

## Next actions

### Today / this week (20-23.04)
1. **Finish migration Step 1.3** (this file, MAIN.md, PLATFORM.md refresh) — IN PROGRESS
2. **Step 1.4** — legacy cleanup (product-template/ → legacy/)
3. **Step 2** — create `iam-clients-os/` folder structure + .gitignore
4. **Step 3** — Admin page frontend for IAM Clients OS (4 subtabs, ~4-6h)
5. **Step 4** — clone `ArielGrook/iam-client-os` into `iam-clients-os/source/`
6. **Step 5** — end-to-end validation
7. **Step 6** — decommission lego-base (full backup, cancel Time4VPS, remove connector)

### Parallel
- **iamrunning.ai Phase 17D** — separate Cursor chat, ~2-3h
- **GTM outreach** — LinkedIn DMs, YouTube, Reddit engagement

---

## Where documentation lives now

All active working docs are in `context-core/ariels-workflow/` — 13 folders, ~100 files, master workspace after migration Step 1.1-1.2.

Key entry points for any new AI chat:

| Path | Purpose |
|------|---------|
| `ariels-workflow/PLATFORM_REFACTORING.md` | Migration plan + live status table |
| `ariels-workflow/current-state/SHARED_CONTEXT.md` | Global router between AI agents |
| `ariels-workflow/current-state/current-goal.md` | Active mission (first paying client) |
| `ariels-workflow/current-state/session-state.yaml` | Machine-readable handoff state |
| `ariels-workflow/memory/` | Persistent memory (ARCHITECTURE, TEAM_ROLES, CURRENT_GOAL, NEXT_ACTIONS, RULES, wisdom/) |
| `ariels-workflow/bootstrap-prompts/` | Role-specific onboarding + **SUCCESS_CHAT_PATTERNS.md** |
| `ariels-workflow/architecture/README.md` | IAM Client OS system map |
| `ariels-workflow/master-docs/MASTER_PLAN.md` | Strategic plan |
| `ariels-workflow/iamrunning-ai/` | iamrunning.ai handoff + roadmaps + evolution |

---

## Deprecated / legacy

- **`context-core/PROGRESS.md` v6** (pre-20.04) — described Stage 1 of iam-client-os (Admin Panel v3, route.ts v2.0, first VPS install). All items DONE but superseded by mega-tools architecture and subsequent phases.
- **`context-core/MAIN.md` pre-20.04** — described 2-track platform. Now 3-product architecture.
- **`context-core/PLATFORM.md` pre-20.04** — did not know about lego-base sunset or iam-clients-os migration.
- **`product-template/INSTALL.md` Option A v3.0** — multi-tenant install on our server. Officially deprecated (clients install on their own VPS via `iam-client.sh`).
- **`*.lego-base.online` subdomains** — being decommissioned. `iam-test.lego-base.online` will need re-hosting or acceptance of loss.

---

*File version: v9. Authored by: Claude Opus 4.7 (web MCP) 20.04.2026.*
