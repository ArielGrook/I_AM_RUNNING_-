# Next Actions — 20.04.2026

*Previous 18.04 version archived at `../legacy_future_dataset/rotated-state/2026-04-18-next-actions.md`. That was focused on iam-client-os Stage 2 installer cleanup — all done (skeleton live, Stage 3 test install verified on 19.04).*

---

## Active focus: platform migration (lego-base → iamrunning.online)

Full plan with live status table: `../PLATFORM_REFACTORING.md`.

### Current Step: 3 — Admin page frontend (READY)

Steps 1.4 + 2 completed morning of 21.04. Root is clean (`product-template/` archived, old fix docs archived, broken-filename garbage archived). Folder `iam-clients-os/{source,workspace,skeleton-sync}/` exists with READMEs and proper `.gitignore` on `source/`.

**Step 3 scope (per PLATFORM_REFACTORING.md section 3.3):**

- New route `app/[locale]/admin/iam-clients-os/page.tsx`
- Header iamrunning.online admin gets link `IAM Clients OS`
- 4 subtabs inside the page:
  - **Settings** — product config form (version, defaults)
  - **Client Projects** — CRUD table for client installations (admin API + JSON file or Supabase table)
  - **Web Installer** — generator form for preconfigured install.sh (downloadable .sh or bash command output)
  - **Dev Workspace** — file browser for `iam-clients-os/workspace/` (can reuse Dev Console components from `app/api/dev-agent/files/`)
- API routes:
  - `GET/POST /api/admin/iam-clients-os/clients` — client CRUD
  - `POST /api/admin/iam-clients-os/generate-installer` — install.sh generation from form data
  - `GET /api/admin/iam-clients-os/workspace/*` — workspace file reading (may extend existing `/api/dev-agent/files/*`)

**Estimate:** ~4-6h, best done in 2-3 Cursor sessions. First session: Settings tab + page scaffolding (lowest-risk ramp-up). Second: Client Projects + Web Installer. Third: Dev Workspace.

**Sequence rationale:** Frontend before backend (Step 3 before Step 4). All 4 subtabs work autonomously on existing data — no dependency on source code migration. Step 4 happens after Step 3 so that when source arrives, the UI is already built and just needs to know the path.

---

### After Step 3:
- Step 4 — git clone ArielGrook/iam-client-os into `iam-clients-os/source/` (~1-2h)
- Step 5 — end-to-end validation (~1-2h)
- Step 6 — decommission lego-base (~1h, mostly waiting on backup + Time4VPS cancel)

### DONE this morning (21.04):

**Step 1.4 — legacy cleanup** — moved to `legacy_future_dataset/`:
- `product-template/` (Option A multi-tenant, deprecated) with `_NOTE.md` inside
- 4 fix docs with `2026-04-21-` prefix
- 3 broken-filename garbage files with sanitized names + `_NOTE.md`

**Step 2 — folder structure** — created `iam-clients-os/{source,workspace,skeleton-sync}/` with parent + 3 subfolder READMEs, added `iam-clients-os/source/` to root `.gitignore`.

---

### Next: Step 2 — prepare `iam-clients-os/` folder

- `mkdir -p iam-clients-os/{source,workspace,skeleton-sync}`
- Add `iam-clients-os/source/` to root `.gitignore`
- `git_snapshot` structure

---

## This week (20–23.04) — migration priority

| Day | Task | Status |
|-----|------|--------|
| 20.04 Sun | Steps 1.3 + current-state/legacy pattern formalized | ✅ DONE (this session) |
| 21.04 Mon | Step 1.4 (legacy cleanup) + Step 2 (iam-clients-os/ folder) | ⏳ READY |
| 21–22.04 Mon-Tue | Step 3 (Admin page frontend, 4 subtabs, ~4–6h) | ⏳ PENDING |
| 22–23.04 Tue-Wed | Step 4 (clone iam-client-os source) + Step 5 (validation) | ⏳ PENDING |
| 23.04 Wed | Step 6 (decommission lego-base, cancel Time4VPS) | ⏳ PENDING |

---

## Parallel work — iamrunning.ai (desktop client)

Phase 17 remaining sub-phases:

- **Phase 17D** — Ollama tool-calling polish (~2–3h) — NEXT. Addresses Qwen tool-call failure from 17A.9 verification.
- **Phase 17C** — Persistent memory via shadow hints (~3–4h). Unblocked by 17B manifest foundation.

Run these in separate Cursor chats (not this Claude web chat — different product, different scope).

Phase-by-phase spec lives in `../iamrunning-ai/ROADMAP_17_EXTENDED.md`.

---

## Parallel work — GTM / first paying client

Goal: first beta client paying $300–500 setup, free usage for feedback.

- LinkedIn DMs to Gilad Shoham + Leon Mulumud (MCP Israel community leaders)
- YouTube: find 10 small AI/automation channels (500–10k subs), DM free access for review
- Cold email: 10/day via `iamrunning.online@gmail.com`
- Reddit engagement in `r/mcp` (account warming first)
- Monitor Upwork Appeal
- Build demo viewer account on iam-test for cold outreach

First payment: PayPal (skip Stripe for now).

---

## After migration complete (~24.04+)

- Finish iamrunning.ai Phase 17D + 17C (Cursor), close Roadmap 17
- Roadmap 18 — Fine-tune v1 (QLoRA on RTX 3050, 300–500 CoT pairs from EVOLUTION files)
- First paying client onboarding (pilot through the full flow: `iam-client.sh` → admin panel → PR workflow → deploy)
- `../current-state/roadmap.md` revision — dated 14.04, needs platform-level refresh (not just iam-client-os). Rotate + rewrite.

---

## 🔥 MCP Injection + Tools Refactor — track to schedule (noted 21.04.2026)

**Ariel's observation (21.04 morning):** recurring quality issues with the MCP layer — some tools feel missing when needed, and injection (`smartOk`, `smartErr`, preset, session-state) sometimes lands uneven (not all the right hints at the right time, or hints that don't match what the tool actually did). Current state: injection v2 is deployed and mostly works, but the dogfood experience still has gaps.

**Ariel has ideas for improvements.** Plan: integrate this track somewhere around migration Step 3/4 (after Admin page frontend, ideally after source code is moved — because then the MCP code lives in `iam-clients-os/source/` here on iamrunning, not over on lego-base, so we can iterate freely).

**Concrete symptoms to write up in a spec before touching code:**
- Which tools felt missing in which situations (collect examples from recent sessions)
- Where injection fired but didn't match the tool's actual action
- Where injection was silent but should have warned (e.g., pre-execution blocks missing certain cases)
- Tools that exist but aren't grouped/exposed logically (review the 6 mega-tools carefully)

**Deliverable before coding:** a spec document in `../specifications/MCP_INJECTION_V3_SPEC.md` covering all observed gaps + Ariel's idea set + proposed fixes. Only then implement via Cursor.

**Do not start this track before Step 4 (source code migration).** Doing it on lego-base that's about to be decommissioned is wasted work.

---

## Backlog (not blocking any launch)

- ChatGPT MCP connector — test `<internal>` compliance with GPT-4o
- Mobile adaptation Phase 3 (DashboardDevConsoleTab, landing overflow)
- SSE instead of 3s polling
- SQLite migration (at ~10 concurrent users)
- Vitest smoke tests
- Operator Role + Web Installer UI (Stage 5+ after first paying client)
- MCP-as-a-Service (Phase 2 — iamrunning.ai as MCP provider to Client OS installations)
- `scripts/regen-project-structure.ts` — auto-generate PROJECT_STRUCTURE.md from source
- `workspace-README.md` sitting in `current-state/` doesn't belong there (move to rules/ or delete)

---

*Updated: 20.04.2026 23:45 UTC+3 (late-session extended Step 1.3 work). Previous version (18.04) rotated to `../legacy_future_dataset/rotated-state/2026-04-18-next-actions.md`.*
