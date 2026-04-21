# Roadmaps

Phased execution plans for specific sprints. Each roadmap is a multi-task plan with checkpoints; typically spans 1–5 sessions.

## Files (present)

- `ROADMAP_iam-client-sh.md` — iam-client.sh installer roadmap (DONE)
- `INSTALL_CLEANUP_ROADMAP.md` — install.sh cleanup plan (DONE 17.04)
- `MCP_TOOL_INJECTION_ROADMAP.md` — MCP injection v2 original plan
- `MCP_INJECTION_V2_ROADMAP.md` — MCP injection v2 expanded (11 tasks, DONE 15.04)
- `TOTP_BOOTSTRAP_ROADMAP.md` — TOTP first-run + bootstrap prompts (DONE 15.04)
- `PRODUCT_TOUR_ROADMAP.md` — Product Tour feature
- `MEMORY_INSTRUCTIONS_ROADMAP.md` — Memory / Instructions sections
- `OPERATOR_WEBINSTALLER_ROADMAP.md` — Operator role + Web Installer (planned, post-first-client)
- `IMPROVEMENT_PLAN_IAM_CLIENT_OS.md` — Improvement plan

Many of these are now closed sprints. Next cleanup pass will archive closed roadmaps to `../legacy_future_dataset/deprecated-docs/roadmaps/` with date prefix, leaving only active plans here.

## Lifecycle

1. **Draft** — written at sprint start, lives here.
2. **Active** — updated during execution, checkpoints marked DONE / IN PROGRESS / PENDING.
3. **Closed** — sprint complete. Roadmap archived to `../legacy_future_dataset/deprecated-docs/roadmaps/` with archive date prefix.

Roadmaps are not updated indefinitely. They describe a specific sprint and either close (success) or get replaced (revision). When a roadmap is fundamentally rewritten (v1 → v2), archive v1 before writing v2.

## Why separate from `../specifications/`

- **Roadmap** = time-ordered execution plan with checkpoints.
- **Specification** = technical design of a component, no time ordering.

A feature often has both: spec describes *what* and *how*; roadmap describes *when* and *in what order*.
