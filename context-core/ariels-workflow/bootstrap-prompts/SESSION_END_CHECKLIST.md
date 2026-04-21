# Session End Checklist

Ready-to-paste prompts for ending a chat cleanly, plus the ordered checklist of documents that should be current after every session.

Near the end of a long session, AI models degrade — they start forgetting or half-updating documentation, which compounds into stale context for the next chat. An explicit ordered list prevents that. Pasting one of the prompts below shifts the burden from "remember everything" to "check items off a list."

---

## Prompt A — Short session (under 30 min, minor work)

Paste this at the end of a short chat:

> We're wrapping up. Before you stop, please update:
>
> 1. `context-core/ariels-workflow/current-state/session-state.yaml` — overwrite with today's final state (same session, no rotation).
> 2. `context-core/ariels-workflow/current-state/weekly-progress.md` — append a bullet for what shipped today.
> 3. `context-core/ariels-workflow/PLATFORM_REFACTORING.md` — update the status table if a migration step moved. *(Only until ~23.04.2026 — then this file is retired.)*
>
> Then `git_snapshot` with a one-line message summarizing the session. No other docs need updating.

---

## Prompt B — Full session (substantial work, multi-topic)

Paste this at the end of a long or heavy chat:

> We're wrapping up this session. Please update the following documents, **in this order**, so the next session starts clean. Confirm each item explicitly — list what you changed, or say "skipped — no change" if it doesn't apply. No silent skips.
>
> **Platform workspace (`context-core/ariels-workflow/`):**
> 1. `current-state/session-state.yaml` — overwrite with today's final state. Same session = no rotation; next chat does the rotation when it opens.
> 2. `current-state/next-actions.md` — if priorities shifted materially, rotate the old version to `legacy_future_dataset/rotated-state/YYYY-MM-DD-next-actions.md` and write a fresh one. If not, just update the "Recently Done" section.
> 3. `current-state/weekly-progress.md` — add today's bullet.
> 4. `handoffs/HANDOFF_DD_MM_YYYY{_MORNING|_EVENING}.md` — write a narrative handoff covering what we did, what we learned, what's open.
>
> **If we worked on IAM Client OS (product-side memory in `memory/`):**
> 5. `memory/CURRENT_GOAL.md` — update progress / blockers / pricing if changed.
> 6. `memory/NEXT_ACTIONS.md` — update tasks.
> 7. `memory/WEEKLY_PROGRESS.md` — append day's entries.
> 8. `memory/SESSION_STATE.yaml` — rewrite.
> 9. `memory/wisdom/PATTERNS.md` — add any new pattern that worked.
> 10. `memory/wisdom/ANTI_PATTERNS.md` — add any bug we caught, with root cause and fix.
> 11. `memory/wisdom/DECISIONS.md` — log any architectural decision with its *why*.
> 12. `memory/wisdom/SESSION_INSIGHTS.md` — append a one-paragraph insight if the session produced one.
>
> **If we worked on iamrunning.ai:**
> 13. `iamrunning-ai/EVOLUTION_CONTINUED_DD_MM_YYYY.md` — append or create for today.
> 14. `iamrunning-ai/ROADMAP_17_EXTENDED.md` (or current roadmap) — update phase statuses.
>
> **If any structural change happened (folder rename, file moves, new doc type):**
> 15. READMEs in the affected folders — keep them honest.
> 16. `ariels-workflow/README.md` — update the folder map if the structure changed.
>
> **Migration-specific (until ~23.04.2026 only):**
> 17. `PLATFORM_REFACTORING.md` status table — reflect which step moved.
>
> **Final:**
> 18. `git_snapshot` with a message summarizing the session.
>
> Report back as:
> - Item 1: [what you did, or skipped and why]
> - Item 2: ...

---

## Prompt C — Midnight / crisis wrap-up (chat is glitching, need minimal safe exit)

Paste this when the chat has started hallucinating or you realize you must stop immediately:

> We're stopping now. The chat is degrading. Before you stop, do ONLY these two things:
>
> 1. Write `context-core/ariels-workflow/current-state/session-state.yaml` with a brief summary of where we stopped — what was last working, what's open, what the next chat should do first. Do not rotate. Do not touch any other file.
> 2. `git_snapshot` with message "emergency handoff: [one line summary]"
>
> That's it. Do not update anything else even if you think it would help.

---

## Why three prompts

- **A (short):** overhead of a full checklist on a 15-minute chat is wasteful and makes the AI fabricate updates where none are needed.
- **B (full):** full session, everything gets updated, nothing is missed.
- **C (crisis):** when the chat is already compromised, minimize the blast radius.

---

## How to pick

Before pasting, ask yourself:
- Did we only touch 1–2 files? → **A**
- Did we touch multiple products, multiple folders, or make architectural decisions? → **B**
- Is the AI already glitching (proposing nonsense, inventing file paths, missing context)? → **C**

---

## Maintaining this file

Review this file every few weeks. Prune items that have stabilized into muscle memory. Add new items when a new doc type enters the "update every session" loop. When changing item numbers, double-check that no other doc references the old numbering.

---

*Created 20.04.2026 after Ariel observed that AI models forget or half-update documentation near session end, compounding stale context for future chats. Related: `SUCCESS_CHAT_PATTERNS.md` (how to START a chat well).*
