# Specifications

Detailed technical specifications for platform components and features. Each spec is **implementation-ready** — it contains enough detail to write code against without further design work.

## Files

- `ARCHITECTURE_REFACTORING_PLAN.md`
- `DEV_CONSOLE_DESIGN.md` / `DEV_CONSOLE_REDESIGN.md`
- `INSTALLER_SPEC_v1.md` — iam-client.sh installer spec
- `MESSAGING_SYSTEM_V2.md`
- `OPERATOR_WEBINSTALLER_SKELETON_SPEC.md` — Operator role + web installer + skeleton (unified, 9 sections)
- `PERMISSIONS_SYSTEM_SPEC.md` — Permission router design
- `PERSISTENT_MEMORY_ARCHITECTURE.md` — Platform-wide persistent memory plan
- `ROUTER_ARCHITECTURE.md` — Permission / Notification / Status router patterns
- `WORKER_TOOLS_REDESIGN.md` — Tool distribution system
- `IAM_CLIENT_OS_MCP_FINETUNE.md` — MCP fine-tune strategy

## Distinction from neighboring folders

- `../concepts/` — half-formed ideas, contradictions OK, no commitment.
- **Here (specifications/):** implementation-ready designs. Concrete interfaces, data formats, failure modes.
- `../master-docs/` — cross-cutting strategic docs, higher altitude than specs.
- `../roadmaps/` — time-ordered execution of one or more specs.

## Lifecycle

1. **Spec written** (often promoted from `../concepts/` after review).
2. **Spec executed** (roadmap referenced from `../roadmaps/`).
3. **Spec closed** — if feature is stable and canonical docs are in the product's own `docs/`, the spec can be archived to `../legacy_future_dataset/deprecated-docs/specifications/`.

**Don't delete superseded specs.** Archive them — they document *how we thought* at spec time, useful for dataset and continuity.

## Template

A good spec here has:
- **Problem** — what we're solving and why now.
- **Design** — data structures, interfaces, sequence diagrams where useful.
- **Failure modes** — what goes wrong and how the system behaves.
- **Open questions** — explicit list of what's NOT decided yet.
- **Implementation notes** — where to put code, what to reuse, what to build fresh.
