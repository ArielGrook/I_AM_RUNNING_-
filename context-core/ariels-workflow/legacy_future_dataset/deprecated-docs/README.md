# Deprecated Docs

Old documentation that no longer reflects current state, preserved for dataset value. Includes superseded specs, closed roadmaps, old fix notes, promoted concepts, and rotated bootstrap prompts.

## What goes here

- **Superseded specs** — when `specifications/foo-v2.md` is written, v1 moves here with a date.
- **Closed roadmaps** — roadmaps for finished sprints (to keep active `roadmaps/` folder small).
- **Old root-level fix notes** — `PRODUCTION_FIX.md`, `HTML_CORRUPTION_ROOT_CAUSE_FIX.md`, `COMPONENT_JSON_*.md`, etc. — historical one-off fixes.
- **Promoted concepts** — concepts from `../../concepts/` that were promoted to spec / decision / master-doc and no longer need to sit as drafts.
- **Rotated bootstrap prompts** — old versions of files in `../../bootstrap-prompts/`.

## Naming

```
YYYY-MM-DD-{original-name}.ext
```

Where `YYYY-MM-DD` is the archiving date (when it became deprecated).

Examples:
- `2026-04-20-PRODUCTION_FIX.md`
- `2026-04-20-HTML_CORRUPTION_ROOT_CAUSE_FIX.md`
- `2026-04-15-INSTALL_CLEANUP_ROADMAP.md` (closed roadmap)
- `2026-04-10-MCP_FINETUNE_EXPERIMENTS.md` (concept promoted to spec)

## Why keep it

Every old fix doc is a real debugging session compressed. Every closed roadmap is a sprint post-mortem. Valuable fine-tune corpus for "how we debug / plan / decide in this stack."

## Currently pending move (migration Step 1.4)

From `/var/www/i_am_running/` (project root, cluttered with old fix docs):
- `PRODUCTION_FIX.md`
- `LOCALSTORAGE_QUOTA_FIX.md`
- `COMPONENT_JSON_COMPLETE_FIX.md`, `COMPONENT_JSON_FIX.md`, `COMPONENT_EXTRACTION_DEBUG.md`
- `HTML_CORRUPTION_ROOT_CAUSE_FIX.md`, `HTML_EXTRACTION_FIX.md`, `HTML_ATTRIBUTE_CORRUPTION_FIX.md`
- `CSS_SAVING_FIX.md`
- `CODEBASE_ANALYSIS_REPORT.md`
