# Legacy

Archive of previous versions of rotating documents from `../current-state/`. This is the **tape** — one file per meaningful update, named by date.

## Purpose

- **Dataset generation** — session-state rotations are a chain-of-thought progression, valuable as training data for future fine-tune.
- **Pattern analysis** — "what did we think we were doing 3 weeks ago vs now."
- **Continuity audit** — if something breaks, trace what changed and when.
- **Workflow retrospectives** — spot recurring thrash or clean-sprint rhythms.

AI sessions **do not read this folder by default**. Legacy is cold storage. Active chats read `../current-state/` only.

Do not delete. Do not modify archived files.

## Naming convention

```
YYYY-MM-DD-{filename}.ext          — one version that day
YYYY-MM-DD-HHMM-{filename}.ext     — multiple versions same day (use time)
```

Examples:
- `2026-04-15-1210-session-state.yaml` — session state saved at 12:10 on 15 April
- `2026-04-19-session-state.yaml` — end-of-day 19 April snapshot
- `2026-04-18-next-actions.md` — next-actions before it was rotated on 20 April

## How files arrive here

When something in `../current-state/` needs to be replaced, the current version is **copied here with a dated filename first**, then the new version is written to `../current-state/`. This keeps `../current-state/` always reflecting right now and `legacy/` preserving the full history.

The rule applies to rotating docs (session-state, weekly-progress, next-actions) and to major revisions of in-place docs (roadmap, current-goal, SHARED_CONTEXT) — not to typo-fix-level edits.

See `../current-state/README.md` for the full rotation rule.

## Also archived here

Top-level platform-structure rotations from this directory's scope:

- `product-template/` — Option A multi-tenant install (deprecated) — **to be moved here in migration Step 1.4.**
- Other root-level fix docs (PRODUCTION_FIX.md, HTML_CORRUPTION_*.md, etc.) — **to be moved here in Step 1.4.**

---

*Last edited: 20.04.2026.*
