# Rotated State

Every version of `../../current-state/` files that has been replaced, kept for chain-of-thought analysis and future dataset generation.

## What rotates here

| File in `current-state/` | Rotation cadence |
|-------------------------|-----------------|
| `session-state.yaml` | Every session — one snapshot per end-of-session |
| `next-actions.md` | On material priority shift |
| `weekly-progress.md` | End of each week |
| `current-goal.md` | On strategic pivot (rare) |
| `roadmap.md` | On major revision (rare) |
| `SHARED_CONTEXT.md` | On major architecture shift (rare) |

## Naming

```
YYYY-MM-DD-{filename}.ext            — one rotation that day
YYYY-MM-DD-HHMM-{filename}.ext       — multiple same-day rotations (append time)
```

Examples:
- `2026-04-19-session-state.yaml` — end-of-day 19 April
- `2026-04-20-0900-session-state.yaml` — morning session 20 April
- `2026-04-20-2100-session-state.yaml` — evening session 20 April
- `2026-04-18-next-actions.md` — next-actions before rotation on 20 April

## Why this folder is valuable

The rotation *sequence* is the training signal. A single session-state snapshot isn't interesting. The **sequence of snapshots over time** is exactly the chain-of-thought structure we want to fine-tune on:

> state(N) → actions taken → state(N+1)

Reading `2026-04-19-session-state.yaml` then `2026-04-20-session-state.yaml` shows one session's decisions changed the state. Many such pairs = training corpus.

## Do not edit

Rotated files are snapshots — immutable. If you think one is wrong, update the live version in `../../current-state/`, not the rotated copy.

---

*Folder created 20.04.2026 during formalization of the rotation pattern.*
