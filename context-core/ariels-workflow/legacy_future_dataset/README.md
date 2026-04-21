# Legacy + Future Dataset

One folder, two purposes: preserve the past AND accumulate fuel for the future dataset / fine-tune / RAG.

## Structure

```
legacy_future_dataset/
├── README.md               ← this file
├── rotated-state/          — state files rotated from ../current-state/
├── deprecated-code/        — modules / features retired from production
├── deprecated-docs/        — old fix notes, superseded specs, abandoned concepts
├── wisdom/                 — cross-product platform-level wisdom (empty scaffold as of 20.04)
└── fine-tune-ideas/        — forward-looking fine-tune / RAG design notes
```

Each subfolder has its own README with the specifics.

## Why this folder matters

Every file in here is one of:
- A **chain-of-thought example** — how thinking evolved from state N to state N+1
- A **pattern worth replicating** — something that worked, captured with rationale
- An **anti-pattern to avoid** — something that broke, captured with root cause
- A **decision snapshot** — what we chose, why, and what was rejected
- A **deprecated artifact** — code/doc no longer applied, kept for historical context

All of these feed:
1. **Fine-tuning platform AI models** (LoRA on CoT chains derived from rotated state + wisdom)
2. **Seeding RAG** for a production AI that understands this platform specifically
3. **Pattern analysis** during retrospectives and postmortems

## Rules

- **Nothing gets deleted.** Even obsolete files have dataset value.
- **Archived files are immutable.** If the current version is wrong, update the live version in `../current-state/` (or wherever) — don't edit legacy copies.
- **AI sessions do not read this folder by default.** Active chats read `../current-state/`. This folder is cold storage, accessed only for retrospective / dataset generation / continuity audit.

## Naming convention (inside subfolders)

```
YYYY-MM-DD-{original-filename}.ext           — one rotation per day
YYYY-MM-DD-HHMM-{original-filename}.ext      — multiple rotations same day
```

## Prior name

This folder was called `legacy/` until 20.04.2026. Renamed to `legacy_future_dataset/` per Ariel's instruction, to make the dataset purpose explicit — these files aren't just historical ballast, they're seed material for platform AI.

---

*Last edited: 20.04.2026.*
