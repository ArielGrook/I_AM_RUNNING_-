# Audits

Dated audit snapshots of the platform and its subsystems.

## What goes here

- Full-platform audits — `FULL_PLATFORM_AUDIT.md`, `IAM_RUNNING_PLATFORM_AUDIT_05_04_2026.md`
- System audit results from Cursor / Opus reviewers — `SYSTEM_AUDIT_RESULTS_03_04_2026.md`
- Competitive analyses — `CLICKUP_COMPETITIVE_ANALYSIS.md`
- Evolution blocks — chain-of-thought records from specific sprints (`EVOLUTION_BLOCKS_187_191.md`)

## Naming

`{AUDIT_TYPE}_{SUBJECT}_{DD_MM_YYYY}.md` when dated, or plain topic name when evergreen.

## When to consult

- **Before a new audit pass** — read the most recent one to see what was flagged and whether it's fixed.
- **For regression detection** — compare current state to the audit baseline.
- **For dataset generation** — old audits show how thinking evolved.

## Rules

Audits are **snapshots in time** — never updated after the fact. If you find something stale, write a new audit; don't edit the old one. When an audit is fully superseded and no longer useful as reference, move it to `../legacy_future_dataset/deprecated-docs/` (keep the original filename — it's already dated).
