# workspace/ — IAM Client OS dev workflow state

**Currently empty — will be populated in migration Step 4 (or after, as needed).**

## Scope

Product-specific workflow state for IAM Client OS development:
- Memory files that ship to client installations via `read_memory` — but scoped to IAM Client OS development, not platform-wide
- Handoffs between dev sessions specifically about this product
- Spec drafts that only make sense for this product (platform-wide specs live in `../../context-core/ariels-workflow/specifications/`)

## Why separate from `../../context-core/ariels-workflow/`

- `../../context-core/ariels-workflow/` = **platform-wide** workflow (Ariel's personal workspace for all three products).
- `iam-clients-os/workspace/` = **product-specific** workflow (only IAM Client OS).

Currently some IAM Client OS content lives in `ariels-workflow/` (iamrunning-ai/, memory/, etc.) because the boundary wasn't needed before. After migration Step 4 we may migrate some of that content here, but this is not urgent — better to let the boundary define itself as work happens.

## Suggested structure (to emerge, not enforced)

```
workspace/
├── README.md
├── memory/          ← product-side AI memory templates (may move from ariels-workflow/memory/)
├── handoffs/        ← IAM Client OS-specific session handoffs
└── specs/           ← specs that only make sense for this product
```

## Related

- `../source/` — the product source code
- `../skeleton-sync/` — scripts that take source/ + workspace/ content and build the skeleton
- `../README.md` — parent folder overview

---

*Placeholder README created 2026-04-21 during migration Step 2.*
