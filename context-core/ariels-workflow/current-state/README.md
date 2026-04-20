# Current State — Live snapshot of the platform

This folder is the **single source of truth** for "where is the project right now."

Any new AI chat, human collaborator, or future-you session starts by reading files from this folder before doing anything else. The **filenames here are stable forever** — they never change. What changes is the content.

The whole point is that you can give any chat the same instruction and it always resolves to the latest information:

> "Read `context-core/ariels-workflow/current-state/README.md` first, then `SHARED_CONTEXT.md`, then `session-state.yaml`. After that read `current-goal.md` for the mission framing."

This always lands on right now. Older versions are preserved in `../legacy/`.

---

## Files in this folder

| File | Purpose | When to update |
|------|---------|----------------|
| `README.md` | This file — the map | When the pattern itself changes |
| `SHARED_CONTEXT.md` | Global router between AI agents across all three products. Read to understand the whole platform. | On strategic shift |
| `current-goal.md` | Active mission (what we're trying to accomplish) | On goal change |
| `next-actions.md` | What to do now and this week | On priority shift |
| `roadmap.md` | Technical task tracker across priorities | On roadmap revision |
| `session-state.yaml` | Machine-readable handoff from last session | Every session |
| `weekly-progress.md` | Week-by-week log of what shipped | End of each week |

`workspace-README.md` — legacy (documents the `/workspace/` Work System from IAM Client OS, not current-state pattern). Will be moved out in a future cleanup pass.

---

## The rotation rule

When you update a file here in a way that replaces its meaning (not a typo fix), the **old version goes to `../legacy/` first**, then the new one is written. That way `current-state/` always reflects right now, and `../legacy/` accumulates the full tape.

### Naming convention for legacy archives

```
legacy/YYYY-MM-DD-{filename}.ext           — one update that day
legacy/YYYY-MM-DD-HHMM-{filename}.ext      — multiple updates same day (use time)
```

Examples:
- `legacy/2026-04-19-session-state.yaml` — end-of-day 19 April
- `legacy/2026-04-20-0930-session-state.yaml` — morning session on 20 April
- `legacy/2026-04-20-2130-session-state.yaml` — evening session on 20 April
- `legacy/2026-04-18-next-actions.md` — next-actions before 20 April rotation

### What rotates vs what updates in place

**Always rotate on update** (every change archives the previous version):
- `session-state.yaml` — full semantic change per session
- `weekly-progress.md` — rotate end-of-week (typically Sunday or Monday morning)

**Rotate on material change** (typo fixes don't count):
- `next-actions.md` — when priorities shift (stage complete, new focus)
- `roadmap.md` — on real version bump

**Update in place, rotate only on strategic pivot**:
- `current-goal.md` — goal rarely changes
- `SHARED_CONTEXT.md` — continuously updated, rotate only on major architecture shift

---

## Why we keep `../legacy/`

Not for humans to read routinely. For:
- **Dataset generation** — session-state rotations are a chain-of-thought progression, valuable for future fine-tune.
- **Pattern analysis** — "what did we think we were doing 3 weeks ago vs now"
- **Continuity audit** — if something breaks, we can trace what changed when.
- **Workflow retrospectives** — spotting recurring thrash or clean-sprint rhythms.

AI sessions do NOT read `../legacy/` by default. Legacy is cold storage.

---

## Related files (outside current-state/)

- `../PLATFORM_REFACTORING.md` — active migration plan (temporary, lives at root of ariels-workflow/)
- `../memory/` — persistent memory for IAM Client OS (separate scope, product-side)
- `../bootstrap-prompts/` — role onboarding prompts + `SUCCESS_CHAT_PATTERNS.md`
- `../architecture/README.md` — IAM Client OS system map
- `../iamrunning-ai/` — iamrunning.ai handoff + roadmaps + evolution
- `../master-docs/MASTER_PLAN.md` — strategic plan

---

## For a new chat joining mid-migration (until ~23.04.2026)

Add to the reading list:
- `../PLATFORM_REFACTORING.md` — what migration step we're on, full plan
- Everything else works as described above.

---

*Last edited: 20.04.2026. Authored by Claude Opus 4.7 during migration Step 1.3.*
