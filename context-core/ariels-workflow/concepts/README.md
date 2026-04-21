# Concepts

Exploratory concept drafts. Ideas being shaped but not yet promoted to specs, roadmaps, or decisions.

## What goes here

Early-stage thinking. Current files:
- `CHAIN_OF_THOUGHT_FINETUNE.md` — fine-tune dataset format design
- `DASHBOARD_UX_IDEAS.md` — UX experiments for the dashboard
- `MCP_FINETUNE_EXPERIMENTS.md` — experiments on MCP-wrapped inference
- `MCP_PERSISTENT_MEMORY.md` — concepts for MCP-side persistent memory
- `SELF_LEARNING_WORKSPACE_CONCEPT.md` — self-improving workspace direction
- `WORKFLOW_BRAINSTORM_02_04_2026.md` — dated brainstorm session

## Lifecycle

1. **Draft** — raw notes, may contain contradictions, no commitment.
2. **Promoted** — when accepted, rewrite as a spec in `../specifications/` or a decision in `../memory/wisdom/DECISIONS.md`, then move the original to `../legacy_future_dataset/deprecated-docs/` with date prefix.
3. **Abandoned** — if explicitly rejected, move to `../legacy_future_dataset/deprecated-docs/` with a `_NOTE.md` explaining why.

## Rule

Don't delete concept drafts. They're valuable as training data ("how thinking evolved on topic X"). Always archive, never delete.

## Not the same as `../specifications/`

- **Concept** — "maybe we should do X" / exploratory / contradictions OK.
- **Specification** — "here's exactly how X works" / implementable / self-consistent.

When a concept matures enough to become a spec, write the spec as a new document. Don't edit the concept into being a spec — archive the concept as evidence of the exploration.
