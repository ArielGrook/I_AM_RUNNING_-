# First Prompt Schema — a fill-in template for handoff prompts

Partner to `SUCCESS_CHAT_PATTERNS.md`. That one explains *why* first prompts matter. This one is the *template* — the fill-in-the-blanks structure you (or another AI) use to produce a good one, every time.

## Why a schema, not just a style guide

Galerating a first prompt from scratch is a lot of decisions made in a hurry (and often at the end of a long session when we're tired). A schema collapses the decisions into filling 10 fields. Once the fields are filled, you have a prompt that hits every point `SUCCESS_CHAT_PATTERNS.md` requires.

The schema is also designed so that **another AI chat can use it as a generator.** You can paste this whole document into a chat and say "fill this schema for the task: [describe task]" and get back a correctly-structured first prompt. The meta-instruction at the bottom of this file makes that explicit.

---

## The template

Copy this block. Fill every field. Delete field labels and instructions when you paste the final prompt.

```
# [MISSION TITLE — 3-6 words]

## 1. Role
[One sentence. Who is the AI in this session. "You are the X for Y."]

## 2. Mission
[1-2 sentences, present tense. The single outcome we want by end of session.]

## 3. Connectors
[Which MCP connector(s) to enable. Name them exactly as they appear in Claude's connector list.]

## 4. Anchor — read first, in this order
[2-5 file paths. First file should be the index; subsequent files drill deeper. No narrative. Just paths.]

1. `path/to/first.md`  — one-line purpose
2. `path/to/second.md` — one-line purpose
3. ...

## 5. First action
[One concrete sentence naming specific tool calls. Not "get familiar with the project" — "read A, read B, list directory C, then report what you see."]

## 6. Rules
[3-6 short bullets. Tone, language, pacing, discipline. No paragraphs.]

- [rule 1]
- [rule 2]
- ...

## 7. Boundaries
[3-5 short bullets of explicit "do NOT"s. Mirror of Rules.]

- Do not [X]
- Do not [Y]
- ...

## 8. Success criteria
[2-3 bullets. How do we know the session succeeded. Be specific.]

- [criterion 1]
- [criterion 2]

## 9. Gotchas
[Optional. 1-4 bullets. Things the AI is likely to trip on given the task. If nothing specific, delete this section.]

- [gotcha 1]
- ...

## 10. End of session
[One sentence pointing to SESSION_END_CHECKLIST.md with the right prompt variant.]

When wrapping up, paste Prompt [A/B/C] from `context-core/ariels-workflow/bootstrap-prompts/SESSION_END_CHECKLIST.md`.
```

---

## Field-by-field instructions

### 1. Role
**What:** Identity assignment. The AI identifies with the role you give it.
**Good examples:** "You are the migration engineer." / "You are the frontend architect for iam-clients-os admin page." / "You are the MCP spec writer."
**Bad examples:** "Help me with X" (no identity) / "You are a brilliant genius AI" (flattery, no specificity) / "You're an assistant" (too generic).

### 2. Mission
**What:** The single outcome by end of session, in present tense. Two sentences max.
**Good example:** "You are shipping Step 3 of the migration: a new Admin UI page with 4 functional subtabs at /[locale]/admin/iam-clients-os/."
**Bad example:** "We want to make things better and plan what to do about the admin panel." (no outcome)

### 3. Connectors
**What:** Which MCP connector(s) the chat needs. Name them exactly — connector names are case-sensitive in Claude's UI.
**Typical values for this platform:** `iamrunning`, `lego-base`, `iam-clients-os-test`, `iamrunner.ai`.
**Note:** After migration completes, only `iamrunning` and `iamrunner.ai` remain active.

### 4. Anchor — read first, in order
**What:** A short list of files that, after reading, give the AI everything it needs to act. Ordered from most-general to most-specific.
**Rule:** ≤ 5 files. If you need more, you're not pointing to an index — you're trying to dump context into the prompt (that's what anchor docs are for).
**For migration-era sessions:** usually `current-state/README.md` + `session-state.yaml` + `PLATFORM_REFACTORING.md` + (optional) a specific subfolder README.

### 5. First action
**What:** Concrete. Specific tool calls. If first action is "read the 4 anchor files," say exactly that. If first action is "list the current admin page directory," write `list_directory app/[locale]/admin/` with the exact path.
**Bad:** "Get familiar with the codebase." / "Let me know what you think." / "Review the project."
**Good:** "Read files 1-4 from Anchor, then `list_directory` on `app/[locale]/admin/`, then report the 4 subtab names you plan to build and which one you want to start with."

### 6. Rules
**What:** Constant behavioral rules for the session. Short bullets. No explanations in the rules themselves.
**Common rules for this stack:**
- No variants or A/B/C. Direct action only.
- Russian for discussion with Ariel, English for code and docs.
- `git_snapshot` before every `write_file` or `patch_file`.
- One task per turn — don't batch 5 features in one response.
- Don't estimate work in hours (we've been wrong on hour estimates 100% of the time).
- Ask one clarifying question max; otherwise proceed with your best interpretation and note the assumption.

### 7. Boundaries
**What:** Explicit "do NOT"s. These matter more than you think — the model defaults to helpful-suggestion mode, boundaries cut that off.
**Common boundaries:**
- Do not touch `app/[locale]/editor/page.tsx` (1200+ lines, causes bloat).
- Do not deploy without explicit go-ahead.
- Do not create files outside the target folder.
- Do not ask permission for read operations.
- Do not propose alternative approaches mid-session — complete the current plan first.

### 8. Success criteria
**What:** Specific, checkable outcomes. Use this to decide at session end whether we shipped.
**Good:** "`/[locale]/admin/iam-clients-os/` route renders with 4 visible subtabs." / "`git_snapshot` created with all 4 subtab skeleton files committed."
**Bad:** "We understand the admin page better." / "Code is cleaner." (not checkable)

### 9. Gotchas (optional)
**What:** Specific traps this task is likely to hit given its domain. If you can't think of 1-2 specific gotchas, delete the section — empty gotchas sections train the AI to hallucinate them.
**Good:** "Next.js file router beats rewrite — don't add a route to `app/.well-known/` when there's a rewrite for the same path." / "Dev Console file tree requires `isSystemCodeDir()` check — new paths may need allowlisting."

### 10. End of session
**What:** One sentence pointing to `SESSION_END_CHECKLIST.md` with the right prompt variant (A short / B full / C crisis). This is the bookend — starts clean, ends clean.

---

## Using this schema as a generator (meta-instruction)

Another AI chat can produce a first prompt from this schema. Paste this file's content into the chat, then say:

> Use the First Prompt Schema above to generate a first prompt for the following task. Fill every field per the field-by-field instructions. Return the filled template only — no commentary.
>
> Task: [describe the task — what outcome, which connectors, any specific constraints]
> Anchor candidates: [list of files that might be read first, or "figure it out from session-state.yaml"]
> End-of-session variant: [A/B/C]

The result is a ready-to-paste prompt for the new chat.

### Rules for the generator

- If a field genuinely doesn't apply, the generator writes "N/A" — it doesn't silently skip or invent content.
- The generator does NOT add fields beyond the 10. Expanding the schema is a separate decision.
- The generator reads anchor files itself before writing the prompt if it has tool access — so that Success Criteria and Gotchas reflect real state, not guesses.

---

## Example — filled for Step 3 of the lego-base → iamrunning migration

Live example from 2026-04-21. This is a real prompt ready to paste into a new chat tomorrow morning.

```
# Step 3 — Admin page frontend for IAM Clients OS

## 1. Role
You are the frontend engineer for iamrunning.online, specifically building the Admin panel page that manages IAM Client OS installations.

## 2. Mission
Ship Step 3 of the lego-base → iamrunning migration: new route `app/[locale]/admin/iam-clients-os/page.tsx` with 4 functional subtabs (Settings, Client Projects, Web Installer, Dev Workspace) and their supporting API routes under `/api/admin/iam-clients-os/*`. Skeleton working end-to-end by session end, even if individual subtabs are early-stage.

## 3. Connectors
`iamrunning`

## 4. Anchor — read first, in order
1. `context-core/ariels-workflow/current-state/README.md` — entry point and reading order
2. `context-core/ariels-workflow/current-state/session-state.yaml` — state from 21.04 morning session
3. `context-core/ariels-workflow/PLATFORM_REFACTORING.md` — migration plan, section 3.3 describes Step 3 scope
4. `iam-clients-os/README.md` — folder structure overview for the product being admin'd

## 5. First action
Read files 1-4 from Anchor. Then `list_directory` on `app/[locale]/admin/` to understand existing admin page structure. Then report: (a) where exactly the new page file goes, (b) how the existing admin tabs are routed, (c) which of the 4 subtabs you want to start with. Do not write any code until I confirm the plan.

## 6. Rules
- No variants or A/B/C. Direct action only after plan is confirmed.
- Russian for discussion with Ariel, English for code and docs.
- `git_snapshot` before every `write_file` or `patch_file`.
- One subtab per turn. Don't try to build all 4 in one response.
- Don't estimate work in hours.
- Follow the "Dashboard = Admin Panel UI" directive from `context-core/ariels-workflow/master-docs/DASHBOARD_EQUALS_ADMIN_PANEL_UI.md` — reuse existing Dev Console components where applicable.

## 7. Boundaries
- Do not touch `app/[locale]/editor/page.tsx` (1200+ lines).
- Do not deploy until all 4 subtabs render without errors.
- Do not create the Supabase integration in this session — use JSON files for Client Projects CRUD and defer Supabase to a later pass.
- Do not modify the existing admin header/layout beyond adding a link to `/iam-clients-os/`.
- Do not ask permission for read operations.

## 8. Success criteria
- Route `/[locale]/admin/iam-clients-os/` responds 200 and renders 4 tabs.
- Each tab has a visible placeholder UI (even if not fully functional).
- At least 2 tabs (Settings + Dev Workspace) are fully functional end-to-end.
- `git_snapshot` committed with a clear message summarizing Step 3 progress.

## 9. Gotchas
- Dev Workspace subtab reads from `iam-clients-os/workspace/` which currently only has READMEs — that's fine, UI should handle empty folder gracefully.
- Web Installer generates a `.sh` file — make sure the MIME type and Content-Disposition are set so browsers trigger download, not display.
- The existing Dev Console's file-read endpoint `/api/dev-agent/files/*` may need its allowed-path list extended to include `iam-clients-os/workspace/`.

## 10. End of session
When wrapping up, paste Prompt B (full session) from `context-core/ariels-workflow/bootstrap-prompts/SESSION_END_CHECKLIST.md`.
```

---

## Why these 10 fields specifically

Each field prevents a specific failure mode observed in this project:

| Field | Failure mode it prevents |
|-------|--------------------------|
| Role | Generic-helpful-assistant mode (vague identity → vague output) |
| Mission | Endless brainstorm mode (no outcome → no execution) |
| Connectors | Wrong-tool mode (wrong MCP → wrong servers → confusion) |
| Anchor | Context-dump-in-prompt mode (bloated prompts → weighted-wrong attention) |
| First action | "Get familiar" mode (unbounded exploration → hallucinated narratives) |
| Rules | Style drift (mid-session the AI forgets conventions) |
| Boundaries | Helpful-suggestion drift (AI adds unrequested "improvements") |
| Success criteria | "I think we're done?" mode (no checkable outcome) |
| Gotchas | Known-landmine stepping (this task has specific traps) |
| End of session | Stale-docs accumulation (chat ends without updating state) |

---

*Created 2026-04-21 after Ariel observed that even with `SUCCESS_CHAT_PATTERNS.md` explaining why prompts work, producing a good prompt each time is still friction. A fill-in schema removes that friction.*
