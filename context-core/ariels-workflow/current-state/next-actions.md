# Next Actions — 20.04.2026

*Previous 18.04 version archived at `../legacy_future_dataset/rotated-state/2026-04-18-next-actions.md`. That was focused on iam-client-os Stage 2 installer cleanup — all done (skeleton live, Stage 3 test install verified on 19.04).*

---

## Active focus: platform migration (lego-base → iamrunning.online)

Full plan with live status table: `../PLATFORM_REFACTORING.md`.

### Current Step: 1.4 — legacy cleanup (READY)

*Extended Step 1.3 work on the late-night 20.04 session: full READMEs for all 13 folders in `ariels-workflow/`, renamed `legacy/` → `legacy_future_dataset/` with subfolder structure (`rotated-state/`, `deprecated-code/`, `deprecated-docs/`, `wisdom/`, `fine-tune-ideas/`), created `bootstrap-prompts/SESSION_END_CHECKLIST.md`. Step 1.4 unchanged — still about cleanup in project root.*

**On iamrunning.online root `/var/www/i_am_running/`:**

1. Move `product-template/` → `context-core/ariels-workflow/legacy_future_dataset/deprecated-code/product-template/` — this was Option A multi-tenant installs, officially deprecated. Include a `_NOTE.md` inside explaining when and why it was retired.
2. Sweep stale root-level fix docs to `context-core/ariels-workflow/legacy_future_dataset/deprecated-docs/`:
   - `PRODUCTION_FIX.md`, `LOCALSTORAGE_QUOTA_FIX.md`
   - `COMPONENT_JSON_COMPLETE_FIX.md`, `COMPONENT_JSON_FIX.md`, `COMPONENT_EXTRACTION_DEBUG.md`
   - `HTML_CORRUPTION_ROOT_CAUSE_FIX.md`, `HTML_EXTRACTION_FIX.md`, `HTML_ATTRIBUTE_CORRUPTION_FIX.md`
   - `CSS_SAVING_FIX.md`
   - `CODEBASE_ANALYSIS_REPORT.md` (stale analysis)
   - Name them with `2026-04-21-` prefix on archiving (archive date, per `legacy_future_dataset/deprecated-docs/README.md`).
3. Keep at root (still active):
   - `README.md`
   - `SUPABASE_TABLE_SETUP.md` (setup guide still referenced)
   - `CREATE_COMPONENTS_TABLE.sql` (SQL still used)

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
