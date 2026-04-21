# Memory — IAM Client OS persistent memory

**Product-side memory for IAM Client OS.** Ships to client installations via the `read_memory` MCP tool.

Different from `../current-state/` — that's Ariel's **platform-wide** personal workspace. This folder is the **product's own** persistent memory — what a new AI chat inside a client install sees when it calls `read_memory`.

## Files

- `SYSTEM_IDENTITY.md` — What the system is (framing for AI inside a client install).
- `ARCHITECTURE.md` — Technical architecture of IAM Client OS.
- `CURRENT_GOAL.md` — Client-side active goal.
- `NEXT_ACTIONS.md` — Client-side next actions.
- `WEEKLY_PROGRESS.md` — Client-side weekly log.
- `SESSION_STATE.yaml` — Client-side session handoff.
- `TEAM_ROLES.md` — Roles, capabilities, worker directory mapping.
- `RULES.md` — Security / safety rules (locked, don't edit casually).
- `CURSOR_PROMPTS.md` — Prompts for Cursor-assisted development on the product itself.
- `wisdom/` — Product-side patterns, anti-patterns, decisions, session insights (see subfolder README).
- `workers/` — Per-worker personal session notes (see subfolder README).

## Why this lives in `ariels-workflow/` on iamrunning.online

These are the **templates / reference versions** that get synced into the IAM Client OS skeleton repo (`ArielGrook/iam-client-skeleton`). Clients get their own copies during `iam-client.sh` install. Any change here propagates to new client installs via the skeleton sync scripts.

**Per-client runtime state** — each client's actual memory files populated by their own AI chats — lives on their own VPS, not here.

## Relationship summary

| Folder | Scope | Audience |
|--------|-------|----------|
| `../current-state/` | Platform (cross-product), personal | Ariel + AI working on the platform |
| `memory/` (this folder) | Product (IAM Client OS), templates | AI inside a client install |

Different scopes, different audiences. Don't mix.

## Update discipline (per SHARED_CONTEXT §14)

Update in process, not at session end. Stale memory = next chat works blind.
