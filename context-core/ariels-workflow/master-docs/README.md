# Master Docs

Long-lived strategic and architectural documents. Not per-sprint — these describe the platform's fundamental direction and rules.

## Files

- `MASTER_PLAN.md` — Strategic plan: products, market, pricing, roadmap horizon.
- `IMPLEMENTATION_RULES.md` — Rules for how implementation is done (review, deploy, snapshot discipline, testing norms).
- `PLATFORM_CHECKLIST.md` — Periodic health-check list for the whole platform.
- `IAM_CLIENT_OS_IMPLEMENTATION_PLAN_v2.md` — Long-form implementation plan for IAM Client OS (v2 current).
- `IAMRUNNER_AI_MASTER_DOC.md` — Master doc for the iamrunning.ai desktop product.
- `DASHBOARD_EQUALS_ADMIN_PANEL_UI.md` — Enforced directive: Dashboard UI must mirror Admin Panel UI exactly; diff is capability gating only.
- `IDEAS_INDEX.md` — Index of ideas across the workspace. May be superseded by `../README.md` + per-folder READMEs over time.

## What belongs here vs elsewhere

- **Here:** high-level direction, rules governing many features, strategic frames.
- **`../specifications/`:** concrete implementable specs.
- **`../roadmaps/`:** phased execution plans.
- **`../concepts/`:** exploratory drafts not yet ready for any of the above.

## Update cadence

Rare. These docs drift slowly and deliberately. When updating:
1. Note the version bump in the document header.
2. Archive the previous version to `../legacy_future_dataset/deprecated-docs/` with date prefix.
3. Update cross-references in other docs if structural changes were made.

## Reading priority for new chat

- `MASTER_PLAN.md` — for platform strategy questions.
- `IMPLEMENTATION_RULES.md` — before writing any code.
- `DASHBOARD_EQUALS_ADMIN_PANEL_UI.md` — when touching any dashboard or admin UI.
- Others — on demand.
