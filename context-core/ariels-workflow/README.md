# Ariel's Workflow — Platform workspace

Ariel's personal / operational workspace for the I AM RUNNING platform. Everything here is cross-product (not tied to one of the three products — `iamrunning.online`, IAM Client OS, `iamrunning.ai`).

## One-command entry point for any new AI chat

> "Read `context-core/ariels-workflow/current-state/README.md`, then `SHARED_CONTEXT.md`, then `session-state.yaml` from the same folder."

That always resolves to the latest state. Everything else below is secondary reference.

---

## Folder map

Every folder below has its own `README.md` with details. This table is the quick orientation:

| Folder | What | When to touch |
|--------|------|---------------|
| `current-state/` | Live snapshot files (session-state, next-actions, roadmap, goal, weekly-progress, SHARED_CONTEXT). Stable filenames forever. | First thing any new chat reads. Updated continuously. |
| `memory/` | Persistent memory for **IAM Client OS** (ships to clients via `read_memory` MCP tool). Has its own `wisdom/` + `workers/`. | Product-side. Touched when working on IAM Client OS. |
| `architecture/` | System architecture map for IAM Client OS. | Before changing any major flow. |
| `bootstrap-prompts/` | Role-specific onboarding prompts + meta-guide **`SUCCESS_CHAT_PATTERNS.md`** on how to write good first prompts. | Before writing any new first prompt. |
| `specifications/` | Implementation-ready technical specs (messaging, permissions, installer, etc.). | Before implementing a feature. |
| `concepts/` | Exploratory concept drafts — ideas not yet promoted to roadmaps / specs / decisions. | Before proposing architecture changes. |
| `roadmaps/` | Phased execution plans for feature sprints. | When kicking off a multi-session sprint. |
| `audits/` | Dated audit snapshots (FULL_PLATFORM_AUDIT, SYSTEM_AUDIT_RESULTS, etc.). | Retrospective / regression detection. |
| `handoffs/` | Narrative session-to-session handoff notes. Complements machine-readable `current-state/session-state.yaml`. | Written at end of heavy sessions; read at start of next. |
| `master-docs/` | Long-lived strategic + architectural documents (MASTER_PLAN, IMPLEMENTATION_RULES, PLATFORM_CHECKLIST). | High-level framing, rarely edited. |
| `iamrunning-ai/` | Product workspace for **iamrunning.ai** (desktop). EVOLUTION logs, Roadmap 17, handoffs, specs. | When working on iamrunning.ai. |
| `rules/` | Rules + guidelines (DEVELOPMENT_VS_CLIENT, ROLE_CONTRACT, SERVER_SECURITY_CHECKLIST, team-guidelines). | When onboarding a role or questioning a policy. |
| `legacy_future_dataset/` | Archive for future dataset generation — rotated state, deprecated code/docs, platform wisdom, fine-tune plans. | On rotation of `current-state/` files; on deprecation of code/docs; as cross-product wisdom accumulates. |

**Root-level temporary file:** `PLATFORM_REFACTORING.md` — the migration plan anchor. Lives here until the migration completes (~23.04.2026), then moves to `legacy_future_dataset/deprecated-docs/`.

---

## Core invariants

1. **Stable filenames, living content** — files in `current-state/` never change name. Content is kept current. Old versions rotate to `legacy_future_dataset/rotated-state/` with date prefix.

2. **Every folder has a README** — if there's no README, the folder isn't done. Anyone opening the folder (including Ariel in a month) should understand what it's for without guessing.

3. **Memory updates first, not last** — wisdom / memory / state files are updated *in the process* of work, not "at the end." Stale memory = next chat works blind.

4. **Russian for discussion with Ariel, English for code + docs meant for AI agents** — unless a doc is strictly narrative for Ariel, default to English.

5. **First prompt discipline** — before starting a new chat, review `bootstrap-prompts/SUCCESS_CHAT_PATTERNS.md`. A bad first prompt cannot be recovered mid-session.

---

## Platform context

This workspace sits inside `context-core/` on the `iamrunning.online` server (`/var/www/i_am_running/`). The platform has three products — see `../PLATFORM.md` for the overview.

**Active work right now:** migration of IAM Client OS source from `lego-base` (185.5.55.111, Time4VPS sunset ~23.04) into this server. See `PLATFORM_REFACTORING.md` for the 7-step plan and live status.

---

*Last edited: 20.04.2026.*
