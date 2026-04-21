# Bootstrap Prompts

Role-specific onboarding prompts for AI agents, plus meta-guides on how to write first prompts and handle session ends.

## Files

- **`SUCCESS_CHAT_PATTERNS.md`** — Meta-guide on what makes a good first prompt and how to recognize a poisoned chat. **Read this before writing any other prompt in this folder.**
- **`FIRST_PROMPT_SCHEMA.md`** — Fill-in template (10 fields) for producing a handoff prompt. Includes meta-instruction so another AI chat can use it as a prompt generator.
- **`SESSION_END_CHECKLIST.md`** — Ordered list of documents to update at session end, plus ready-to-paste prompts (short + full + crisis) Ariel can drop into any chat to ensure clean handoff.
- `claude-start.md` — Generic Claude onboarding.
- `admin.md` — Super Admin role onboarding (full access, TOTP, admin panel ops).
- `developer.md` — Developer role onboarding (PR workflow, file scope, git discipline).
- `reviewer.md` — Reviewer role onboarding (approve / request-changes workflow).
- `marketer.md` — Marketer role onboarding (content tools, messaging).

## What these are NOT

NOT the runtime prompts used by the IAM Client OS product at install time. Those live in the product repo and get distributed to clients via skeleton sync. This folder is Ariel's own workspace — drafts, review copies, meta-guides.

## Template for every prompt

Follow the 5-part structure from `SUCCESS_CHAT_PATTERNS.md`:
1. Mission (one sentence, present tense)
2. Anchor (one file path to read first)
3. First action (concrete tool call)
4. Rules (short bullets)
5. Boundaries (what NOT to do)

## Rotation

When a prompt is materially revised, the old version goes to `../legacy_future_dataset/deprecated-docs/` with date prefix (e.g., `2026-04-20-admin.md`).
