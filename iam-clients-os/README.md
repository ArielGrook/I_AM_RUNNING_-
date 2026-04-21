# iam-clients-os — IAM Client OS product folder

This folder contains the **IAM Client OS** product inside the `iamrunning.online` repository. It is one of the three products of the I AM RUNNING platform.

Created during migration Step 2 on 2026-04-21.

## Structure

```
iam-clients-os/
├── README.md            ← this file
├── source/              ← git clone of ArielGrook/iam-client-os (git-ignored)
├── workspace/           ← memory, handoffs, specs for Ariel's dev workflow on this product
└── skeleton-sync/       ← scripts to sync dev repo → ArielGrook/iam-client-skeleton
```

## Why each subfolder exists

### `source/` — product source code

Contains the full git clone of `ArielGrook/iam-client-os` (the dev repo — what clients DON'T clone; clients clone `ArielGrook/iam-client-skeleton`).

- **Git-ignored in the root iamrunning.online `.gitignore`** — because `source/` has its own `.git/` directory and its own history. Not a submodule (for simplicity), just a sibling clone.
- **Populated in migration Step 4** — until then, this folder is empty with only its own README.
- **After Step 4:** MCP tools on iamrunning can read/write files here, Dev Console can edit them.

### `workspace/` — dev workflow state for the product

Ariel's personal workflow state specifically for this product. Different from `../context-core/ariels-workflow/` (which is platform-wide):
- Platform-wide workflow lives in `../context-core/ariels-workflow/`
- Product-specific workflow for IAM Client OS lives here

Content comes in Step 4 (after source migration when the workflow is on the same host as the code).

### `skeleton-sync/` — dev → skeleton sync scripts

Scripts that take files from `source/` (dev version) and sync them to `ArielGrook/iam-client-skeleton` (clean client-facing version), sanitizing dev-only content on the way.

On lego-base these live at `scripts/sync-to-skeleton/` inside the iam-client-os repo. After migration Step 4, they'll be copied/rewritten here to work with the new paths.

## Relationship to iamrunning.online

- This folder IS inside `/var/www/i_am_running/` (the iamrunning.online repo root).
- But `source/` is ignored by git, so the iamrunning.online repo doesn't "contain" IAM Client OS code — it just has a place to put the clone.
- Admin UI at `/[locale]/admin/iam-clients-os/` (to be built in Step 3) manages client installations + generates installers + shows dev workspace.

## Related docs

- `../context-core/PLATFORM.md` — platform-level overview of all three products
- `../context-core/ariels-workflow/PLATFORM_REFACTORING.md` — migration plan that created this folder
- `ArielGrook/iam-client-os` — GitHub dev repo (what gets cloned into `source/`)
- `ArielGrook/iam-client-skeleton` — GitHub clean repo (what clients clone via `iam-client.sh`)

---

*Created 2026-04-21 during migration Step 2.*
