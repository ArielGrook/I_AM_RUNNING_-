# skeleton-sync/ — dev repo → skeleton repo sync scripts

**Currently empty — will be populated in migration Step 4 (after source code is cloned into `../source/`).**

## What will be here

Scripts that take the IAM Client OS dev code from `../source/` and sync it into `ArielGrook/iam-client-skeleton` (the clean repo that clients clone via `iam-client.sh`).

On lego-base these currently live at `source/scripts/sync-to-skeleton/` in the iam-client-os repo. After Step 4, they'll be adapted here for the new paths (or called from `../source/scripts/sync-to-skeleton/` directly if paths work unchanged).

## What the sync does (for reference)

1. Reads a MANIFEST file listing which files to sync + which ones to override
2. Copies files from `source/` to a working skeleton directory
3. Applies sed-based sanitization to strip dev-only content (dev names, test URLs, hardcoded paths)
4. Applies per-file overrides (e.g., different README for clients vs devs)
5. Commits + pushes to `ArielGrook/iam-client-skeleton` via GitHub PAT

Current implementation is tested — 5 successful syncs by 2026-04-19.

## Why separate from `source/`

- `source/` is a git-ignored clone — doesn't travel with iamrunning.online repo
- `skeleton-sync/` is tracked by iamrunning.online — these scripts + configs live WITH the platform

Could also be argued that sync scripts live in `source/` since they're part of IAM Client OS dev tooling. TBD during Step 4 — whichever ends up cleaner.

---

*Placeholder README created 2026-04-21 during migration Step 2.*
