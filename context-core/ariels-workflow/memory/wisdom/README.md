# Wisdom — IAM Client OS (product-side)

Product-side knowledge for IAM Client OS: what works, what breaks, what was decided, what we learned.

## Files

- `PATTERNS.md` — Successful patterns verified in production (code, architecture, workflow).
- `ANTI_PATTERNS.md` — Things that broke. Format: *what happened → don't do → do this instead*.
- `DECISIONS.md` — Architectural decisions with rationale. One entry = one decision with *why* attached.
- `SESSION_INSIGHTS.md` — Per-session lessons. Dated entries.

## Update rule (CRITICAL — per SHARED_CONTEXT §14)

Wisdom files are updated **in the process of work**, not at the end. When you:
- Find a pattern that works → add to `PATTERNS.md` **immediately**.
- Fix a bug caused by a pattern → add the failure to `ANTI_PATTERNS.md` **immediately**.
- Make an architectural decision → write it in `DECISIONS.md` with the *why*.
- End a meaningful session → append to `SESSION_INSIGHTS.md`.

No "I'll update it later." Wisdom compounds across sessions; deferred updates = no compounding.

## Scope

**IAM Client OS product wisdom.** Cross-product / platform-wide wisdom that applies to iamrunning.online + IAM Client OS + iamrunning.ai lives in `../../legacy_future_dataset/wisdom/` instead.

## Why this folder matters

Core of the future fine-tune dataset. Every entry is a training pair: situation → correct pattern / avoided anti-pattern / rationale. At 500+ entries, we generate CoT training pairs directly from these files.

See `../../legacy_future_dataset/wisdom/README.md` for the platform-wide collection and `../../legacy_future_dataset/fine-tune-ideas/README.md` for the training strategy.

## Rules

- **Do not delete entries.** If a pattern becomes obsolete, move it to `../../legacy_future_dataset/deprecated-docs/` with a `_NOTE.md`.
- **Don't overwrite history.** Dated entries stay dated.
- **Don't generalize prematurely.** Specific is useful; abstract is noise.
