# Bootstrap Schema Integration into IAM Client OS

*Created: 2026-04-21. Author: Ariel + Claude Opus 4.7.*
*Status: spec — ready to execute after migration Step 4 completes.*
*Related: `../bootstrap-prompts/FIRST_PROMPT_SCHEMA.md`, `../bootstrap-prompts/SUCCESS_CHAT_PATTERNS.md`, `../concepts/MCP_INJECTION_V3_IDEAS.md`.*

---

## Problem

The FIRST_PROMPT_SCHEMA + SUCCESS_CHAT_PATTERNS documents currently live only in `context-core/ariels-workflow/bootstrap-prompts/` on the platform (Ariel's workspace). They do not reach client installations.

Every client install should get both documents:
- So that a new AI chat on a client's install starts in the correct attractor
- So that clients or their AI agents can generate their own handoff prompts following the same schema
- So that the schema is versionable and updatable across all installs via skeleton sync

This is not blocking anything today — IAM Client OS clients haven't onboarded yet. But as soon as we have 1-2 paying clients, the absence of a rigorous bootstrap schema on their installs will cost us (their AI sessions will drift).

## Solution summary

Integrate FIRST_PROMPT_SCHEMA.md + SUCCESS_CHAT_PATTERNS.md into the IAM Client OS skeleton repo so every client install receives them. Keep English as the canonical version (clients may speak any language; schema stays stable in English per the "English for docs consumed by AI agents" rule).

## Sequencing — when to execute

**Not before migration Step 4 completes.** Before Step 4, MCP code + skeleton sync scripts live on lego-base, which is being decommissioned. Doing integration there = wasted work.

**After Step 4:** MCP code + skeleton sync scripts live in `iam-clients-os/source/` + `iam-clients-os/skeleton-sync/` on iamrunning.online. That's the right home to modify them.

## Execution plan

### Phase 1 — copy schema docs into skeleton

On `iamrunning.online` (after Step 4):

1. Identify source files:
   - `context-core/ariels-workflow/bootstrap-prompts/FIRST_PROMPT_SCHEMA.md`
   - `context-core/ariels-workflow/bootstrap-prompts/SUCCESS_CHAT_PATTERNS.md`
   - `context-core/ariels-workflow/bootstrap-prompts/SESSION_END_CHECKLIST.md`

2. Decide destination in IAM Client OS skeleton. Options:
   - **Option A:** `memory/bootstrap-schema/` — alongside `memory/` (which ships to clients via `read_memory`). Pros: auto-exposed via MCP. Cons: `read_memory` loads everything in `memory/`, which could bloat context.
   - **Option B:** `docs/bootstrap-schema/` — alongside product docs. Pros: clean separation, client-visible in admin panel. Cons: not auto-loaded by AI agents.
   - **Option C:** `skills/bootstrap-schema/` — inside the skills folder. Pros: loaded as skill by AI at onboard time. Cons: requires `skills/` infrastructure to recognize markdown docs as skills.

   **Recommended: Option A + excerpt.** Full schema lives in `docs/bootstrap-schema/` (not loaded), plus a one-page summary `memory/BOOTSTRAP_SCHEMA.md` that IS loaded. AI agent sees the summary via `read_memory`, knows where to find the full version if needed.

3. Update the IAM Client OS skeleton-sync manifest (`iam-clients-os/skeleton-sync/MANIFEST.txt` after Step 4) to include these new files in sync runs.

4. Run sync — new skeleton commit pushed to `ArielGrook/iam-client-skeleton`.

### Phase 2 — translate what needs translating

The full schema stays English. The **summary** in `memory/BOOTSTRAP_SCHEMA.md` also stays English (memory files are AI-consumed, English is stable).

If a client wants Russian onboarding, that's a separate deliverable — their Ariel-equivalent writes prompts in Russian, schema just provides the structure.

### Phase 3 — wire into MCP onboarding

This ties into the MCP Injection V3 track (`../concepts/MCP_INJECTION_V3_IDEAS.md`). When the forced-first-call redirect is implemented, one of the files it can point to is `memory/BOOTSTRAP_SCHEMA.md`. Fresh AI chat on a client install → first call redirected → reads schema + context → proceeds.

Concrete wiring:
1. MCP server's forced-first-call response includes bootstrap schema as one of the reading targets
2. Wording: "This is a new session. Before proceeding, read: `memory/BOOTSTRAP_SCHEMA.md` (how to structure handoff prompts), `memory/CURRENT_GOAL.md` (your role's active goal), `memory/SESSION_STATE.yaml` (where we stopped). Then continue."

### Phase 4 — test on iam-test install

Reinstall `iam-test.lego-base.online` (or its successor after decommissioning) from the updated skeleton. Verify:
1. `memory/BOOTSTRAP_SCHEMA.md` present
2. `docs/bootstrap-schema/FIRST_PROMPT_SCHEMA.md` (full) present
3. `read_memory` returns the summary schema content
4. Admin panel file tree exposes the full docs under `docs/`
5. Fresh Claude chat connected to the test install + bad first prompt → see whether schema content causes AI to reorient

### Phase 5 — propagate

Every subsequent client install from the updated skeleton now ships with the schema baked in. Existing installs (if any exist by then) get the update via the Operator API (`/api/operator/update`) — this is one of the standard update flows already designed.

## Rules for schema maintenance

Once shipped to clients, the schema becomes a versioned artifact:
- Source of truth stays in `context-core/ariels-workflow/bootstrap-prompts/`.
- Skeleton copy is one-way sync — never edit schema in skeleton or client install, always edit source and re-sync.
- Breaking changes to schema bump version (`FIRST_PROMPT_SCHEMA.md` → "Version 2.0 — 2026-XX-XX") and go out as a skeleton sync + Operator update.

## Non-goals

- **Not** shipping the schema to iamrunning.ai desktop client in this phase. Desktop client has its own onboarding needs; separate track.
- **Not** forcing client's AI agents to use the schema. Schema is available; use is cultural.
- **Not** auto-generating handoff prompts inside MCP server (that's the generator meta-instruction; clients do that themselves using the schema as prompt).

## Success criteria

- [ ] `FIRST_PROMPT_SCHEMA.md`, `SUCCESS_CHAT_PATTERNS.md`, `SESSION_END_CHECKLIST.md` copied into skeleton (Option A+C hybrid per decision in Phase 1)
- [ ] Skeleton-sync manifest updated; sync run successful
- [ ] Test install from updated skeleton shows schema files at correct paths
- [ ] `read_memory` returns schema summary
- [ ] (After MCP V3) forced-first-call redirect points to schema file
- [ ] Schema version is documented inside each file's header

## Open questions for implementation time

- What exactly belongs in the summary version in `memory/BOOTSTRAP_SCHEMA.md`? Full 10 fields or just the template block + field names?
- Should schema live at `memory/BOOTSTRAP_SCHEMA.md` (flat) or `memory/bootstrap/SCHEMA.md` (nested)? Depends on read_memory path depth handling.
- Do we want a variant of the schema specifically for client roles (admin, developer, reviewer, marketer) — pre-filled templates per role? Feels like scope creep for v1 but worth noting.

---

*Next action: wait for Step 4 of migration. Then execute Phase 1-5 above in order. Expected time: 2-3h once started.*
