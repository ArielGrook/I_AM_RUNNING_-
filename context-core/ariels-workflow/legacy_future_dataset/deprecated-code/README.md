# Deprecated Code

Retired modules, features, and implementation artifacts — code removed from the main tree but preserved for dataset value.

## What goes here

- Old versions of modules that were fundamentally rewritten
- Retired product variants (e.g., `product-template/` — Option A multi-tenant installer, superseded by per-client VPS installs via `iam-client.sh`)
- Experimental branches that didn't ship but had learning value

## Naming

Preserve the original folder/file name when possible. If ambiguous, prefix with retirement date:
- `product-template/` (name is self-explanatory)
- `2026-04-{original-name}/` when name alone is ambiguous

Each retired module must include a **note** (either in its own README or in a `_NOTE.md` at its root) answering:
- When it was deprecated
- Why
- What replaced it

## Why keep it

- Training data for "what we stopped doing and why" patterns
- Continuity if we need to reference the old approach (e.g., to diff with the new one)
- Historical record of architectural evolution

## Currently pending move (migration Step 1.4)

From `/var/www/i_am_running/`:
- `product-template/` → here, with a `_NOTE.md` explaining Option A deprecation
