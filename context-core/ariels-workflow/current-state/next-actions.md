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
- **Bootstrap schema integration into IAM Client OS** — ship `FIRST_PROMPT_SCHEMA.md` + `SUCCESS_CHAT_PATTERNS.md` + `SESSION_END_CHECKLIST.md` into skeleton repo so every client install has them. Full plan in `../specifications/BOOTSTRAP_SCHEMA_INTEGRATION.md`. Ties into MCP Injection V3 track (forced first-call redirect points to schema). Expected ~2-3h. Do after Step 4 — NOT before.

---

## 🔥 MCP Injection + Tools Refactor — track to schedule (noted 21.04.2026)

**Ariel's observation (21.04 morning):** recurring quality issues with the MCP layer — some tools feel missing when needed, and injection (`smartOk`, `smartErr`, preset, session-state) sometimes lands uneven (not all the right hints at the right time, or hints that don't match what the tool actually did). Current state: injection v2 is deployed on IAM Client OS and mostly works. **But on `iamrunning.online` MCP connector there is no injection at all** — that's zero behavioral guardrails on every chat started here.

**Ariel's idea (21.04 after Steps 1.4+2):** add strict, well-thought injections to `iamrunning` MCP, and critically add a **forced first-call redirect** — independent of what the AI asks for, the very first tool call in a session returns a pointer to `context-core/ariels-workflow/current-state/README.md` (or equivalent) and refuses the original request until docs are read. This sets starting context both at the prompt layer AND at the system layer. Two-layer context = much narrower failure surface.

**Full concept document:** `../concepts/MCP_INJECTION_V3_IDEAS.md` — problem statement, gap list, mechanism, variations, other improvements, sequencing, open questions.

**Sequencing:**
- Do NOT start before Step 4 of migration (lego-base is being decommissioned)
- First deliverable: `../specifications/MCP_INJECTION_V3_SPEC.md` — concrete API shapes + failure modes + answers to open questions
- Implement on `iamrunning` MCP first (delta is biggest — it has nothing), then backport to `iamrunning.ai` MCP
- Dogfood a week, measure via `session-stats.jsonl`

**Symptoms to collect** (ongoing, write into the concept doc as they come up):
- Tools that felt missing in specific situations (give examples)
- Where injection fired but didn't match the tool's actual action
- Where injection was silent but should have warned
- Tools existing but not grouped/exposed logically

---

## 🔧 Server-side MCP toolset expansion — track to schedule (noted 23.04.2026)

**Trigger (23.04 session):** During BUG #2/#4 fix on `iam-client.sh` we hit `run_command` whitelist limits — `cd`, `git -C <subpath>`, sub-repo operations all rejected. Result: a 1-line installer fix turned into a partial outcome — patched on disk + iamrunning local repo, but the `iam-clients-os/source/` repo (separate `ArielGrook/iam-client-os` git tree) had to be pushed by Ariel manually because no MCP tool could `cd` into it. The shell-whitelist abstraction is leaking.

**Underlying gap:** `run_command` is a generic shell escape hatch. Whenever an action is non-trivial (multi-step, sub-path, structured output, push-protection resolve) it falls outside the whitelist or requires brittle one-liners with `&&`. We end up either (a) hand-crafting bash that hits whitelist edges or (b) handing operations off to Ariel manually. Both are anti-patterns.

**Direction:** Replace generic `run_command` use cases with typed server-side MCP tools that natively perform the operation on the iamrunning.online server. Each tool knows its domain — no shell escape, no quoting issues, structured params + structured response.

**Concrete tool candidates surfaced this session:**

- `git_repo_action` — params: `subpath` (e.g. `iam-clients-os/source`), `action` (`status` | `commit` | `push` | `log` | `diff`), optional `message`/`files`/`count`. Works with any git tree under the iamrunning.online project root, not just root.
- `git_push_with_allow` — push that handles GitHub Push Protection automatically: detects blocked secrets in response, optionally hits `allow-secret` URLs (when token is approved-stale like our test PATs), or returns a structured list of blocked commits + paths for human review.
- `pm2_action` — params: `action` (`list` | `logs` | `restart` | `start` | `delete` | `describe`), `process_name`, `lines` (for logs). Replaces 6+ different `run_command` invocations.
- `nginx_action` — `test` | `reload` | `list_sites` | `read_site_config <domain>`.
- `tail_log` — params: `path`, `lines`, `since_offset` (for incremental polling). Native, no `node -e` wrapper.
- `iam_install_run` — automation ask from 22.04 session report. Wraps `iam_installer_generate` + spawn detached install + tail logs to completion + return `{success, instanceId, logTail}`. Replaces the base64+node-e+polling dance.
- `cert_action` — `issue <domain>` | `renew` | `list`. Wraps certbot.

**Sequencing:**
- Do NOT start before operator role spec is written (operator endpoints will need similar tools — heartbeat read, activity read, push update — better to design them together).
- First deliverable: `../specifications/MCP_SERVER_TOOLSET_V2_SPEC.md` — for each candidate tool: name, params schema, response shape, replaces-what-current-pattern. Then prioritize by how many `run_command` calls each one collapses.
- Lower priority than: BUG #3/operator role, `iam_install_run` (which is on this list anyway and high priority).

**Connection to other tracks:**
- Overlaps with `iam_install_run` (the tool was already in the 22.04 session ask)
- Overlaps with operator role (operator endpoints need server-side tools to read heartbeat/activity logs, push updates to clients — same architectural pattern)
- Independent of MCP Injection V3 track (that's about behavioral guardrails on existing tools; this is about adding new typed tools)

---

## 🛡️ No-fall application pattern — track to schedule (noted 23.04.2026)

**Origin:** mentioned by Ariel at end of operator-spec session as off-topic but important. Pattern existed on lego-base, was useful in practice, want to port to iamrunning.online and adopt as the deploy primitive for IAM Client OS too (where it becomes the rollback safety net for operator pushes).

**Problem:** current `npm run build` + `pm2 restart` cycle has a window where a broken build takes the app down. On iamrunning.online specifically there's no protection — any deploy with a syntax error means the site is unreachable until either a manual rollback or a fixed redeploy. On IAM Client OS clients the operator push spec (Phase 2) leans on "deploy fallback" as a safety net but doesn't define how — that's exactly this pattern.

**Pattern (as it ran on lego-base):**

1. Build target = `.next-staging/` (not `.next/`)
2. `.next/` keeps the last *successful* build, untouched until swap
3. After build success: atomic directory swap — `.next/` ← `.next-staging/`, old `.next/` archived
4. Soft restart via `pm2 reload` (zero-downtime, not `pm2 restart`)
5. Post-restart healthcheck — if 200 within timeout, deploy is committed; if not, rollback (swap back) + alert
6. On build failure: `.next/` is never touched. App keeps serving the old build. Build error logged to `logs/build-errors.jsonl` and surfaced as a banner in admin UI.
7. From that banner: open Dev Console (in the same still-running app), edit the file, hit Build again. App stays up the whole time.

**Why it matters:**
- Removes "deploy = scary" energy. Iteration on prod becomes safe.
- Direct enabler for operator push flow on IAM Client OS — without this pattern on the client side, a bad push from iamrunning takes the client down even if our own staging review caught most issues. With it, a push that builds-fail just sits in logs visible to both sides, no client-facing impact.
- Prerequisite for any meaningful "edit production live" UX — which is what Dev Console-on-iamrunning becomes once the operator spec ships Phase 2.

**Sequencing:**
- First implementation target: **iamrunning.online itself**. We dogfood it on the platform we touch most (this repo). Builds confidence in the swap+healthcheck mechanic before we ship it into client installs.
- After it's proven on iamrunning: bake into `iam-client.sh` (modify `step_build` + `step_pm2`) so every new client install gets it from day one. Existing installs migrate via operator update.
- Operator spec Phase 2 (push flow) explicitly assumes this pattern is in place on the client side — the "deploy fallback" §3.2 / §4 mentions = this.
- Can run in parallel with operator MVP (Phase 1) — different surface area, no merge conflicts expected. Realistically would happen in a separate Cursor session.

**First deliverable:** `context-core/specs/NO_FALL_APP_SPEC.md` — extract the lego-base implementation (swap script, build target config, healthcheck timeout values, banner UI), adapt to current Next.js 15 build pipeline (.next layout may have changed), specify pm2 ecosystem.config.js modifications.

**Open questions for spec:**
- pm2 reload vs restart — does Next.js standalone mode tolerate reload cleanly? Need to check.
- Build artifacts other than `.next/` — `node_modules/`, `package-lock.json`, generated caches — what's safe to swap atomically vs needs to be coherent with `.next/`?
- Migration path for existing clients (Phase 2+ rollout)

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
