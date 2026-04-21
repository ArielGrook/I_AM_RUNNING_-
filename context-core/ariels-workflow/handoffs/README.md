# Handoffs

Narrative session-to-session handoff notes. Complements the machine-readable `../current-state/session-state.yaml`.

## Relationship to `session-state.yaml`

- **`../current-state/session-state.yaml`** — structured, machine-parseable, compact. One file, always the latest.
- **`handoffs/*.md`** — narrative, human-readable, detailed. Multiple files, each named by session.

Both are written at end of significant sessions. Next chat reads `session-state.yaml` first (quick orientation), then optionally dives into the narrative handoff for the *why* behind decisions.

## Naming

`{TYPE}_{DD_MM_YYYY}{_MORNING|_EVENING|_INCIDENT}.md`

Examples:
- `HANDOFF_19_04_2026_EVENING.md` — end-of-day handoff
- `HANDOFF_19_04_2026_MORNING.md` — handoff after morning block
- `INSTALL_TEST_INCIDENT_18_04.md` — postmortem for an incident session
- `SESSION_HANDOFF_16_04_2026.md` — generic session handoff
- `WELCOME_HOME_17_04_2026.md` — context-switch handoff (returning from another workstream)

## Lifecycle

Handoffs don't rotate to legacy on every session — they accumulate indefinitely as the narrative log. When the folder gets very dense (>50 handoffs), earlier ones can be archived to `../legacy_future_dataset/deprecated-docs/handoffs/` by year.

## When to write a handoff

- End of a session that shipped substantial work
- Before a long break (overnight, multi-day)
- After an incident where postmortem value is high
- When handing off to a different AI (Opus → Sonnet, Claude → Cursor)
- When a session is going to be followed by another session from a different Ariel context (e.g., phone → desktop)

## What to include

- What got done (bullet list, commits, files touched)
- What got learned (surprises, bugs, new patterns → promote to wisdom after)
- What's open (blockers, questions, next specific action)
- Servers / environments touched
- Anything weird the next session should know about
