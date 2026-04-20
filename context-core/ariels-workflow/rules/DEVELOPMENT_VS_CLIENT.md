# ⚠️ DEVELOPMENT vs CLIENT — READ FIRST

**For every AI agent, every developer, every future-Ariel opening this project.**

This repository exists in **two simultaneous forms**. Confusing them is the single biggest source of bugs and wasted time in the project history. Read this before writing anything.

---

## The Two Forms

### 1. This repository, as hosted on `test.lego-base.online`
= the **development environment** where we build the product.
Contains:
- Our working data: `ariel-workflow/`, `IDEAS/`, `workspace/`
- Our real memory with real goals, real workers, real progress: `memory/CURRENT_GOAL.md`, `memory/NEXT_ACTIONS.md`, `memory/WEEKLY_PROGRESS.md`, `memory/workers/`, `memory/wisdom/`, `memory/CURSOR_PROMPTS.md`
- Real PR history, real task queue, real logs
- Real team tokens in `memory/TEAM_ROLES.md`
- PM2 process `iam-os` on port 3000, path `/var/www/iam-os`

**This data is PRIVATE. It NEVER ships to any client.**

### 2. A client installation on the client's own VPS
= the **product** our clients buy and run.
Contains:
- Only the product code: `app/`, `lib/`, `public/`, `scripts/`, `bootstrap-prompts/`
- **Blank** memory files (templates with placeholders filled by install.sh)
- **Empty** tasks/messages/goals/logs — they fill these themselves
- PM2 process `iam.{client-slug}` on port 4741 (default), path `/var/www/iam.client`

---

## How they stay separate today (fragile)

`scripts/iam-client.sh` clones this repo and then in `step_clone` (step 4b) **deletes dev-only data**:
```
rm -rf "$INSTALL_PATH/ariel-workflow"
rm -rf "$INSTALL_PATH/IDEAS"
rm -f  "$INSTALL_PATH/memory/CURSOR_PROMPTS.md"
rm -rf "$INSTALL_PATH/memory/wisdom"
rm -rf "$INSTALL_PATH/memory/workers/"*
# data/ files reset to empty
# TEAM_ROLES wiped, memory templates overwritten
# logs/pull-pool/tasks/messages cleared
```

This is a **blacklist approach**. If we add a new dev-only directory tomorrow and forget to add it to step 4b, it ships to the next client.

## How they SHOULD stay separate (future — see INSTALLER_SPEC_v1.md)

Three separate GitHub repositories:
- `ArielGrook/iam-client-os` — this dev repo
- `ArielGrook/iam-client-skeleton` — clean, whitelisted copy (no dev data, ever)
- `ArielGrook/client-{slug}-project-{name}-N` — per-client fork of skeleton

Sync script takes code FROM dev TO skeleton with a **whitelist**, not a blacklist. Install pulls from the client repo. Dev data can never leak.

Not implemented yet. See `ariel-workflow/INSTALLER_SPEC_v1.md` §2 for full architecture.

---

## The mental test before any edit

Before you touch any file, ask yourself:

> **"If a client ran `iam-client.sh` right now and cloned this, would they see this file?"**

| If **YES** | If **NO** |
|------------|-----------|
| Edit carefully. Placeholders matter. Clients read this. | Edit freely. This is our scratchpad. |

### Files clients SEE (product code)

- `app/`, `lib/`, `public/`, `scripts/`, `bootstrap-prompts/`, `extensions/`, `skills/`
- `memory/RULES.md`, `memory/ARCHITECTURE.md`, `memory/SYSTEM_IDENTITY.md`, `memory/TEAM_ROLES.md` (as templates, blank)
- `package.json`, `tsconfig.json`, `next.config.mjs`, `README.md`
- `install.sh` (thin wrapper), `scripts/iam-client.sh` (real installer)
- `docs/architecture/` (probably — open question §7.1 in spec)

### Files clients NEVER see (dev-only)

- `ariel-workflow/` — this directory, all of it
- `IDEAS/` — spec drafts, experiments, audits
- `workspace/` — SHARED_CONTEXT cross-chat memory
- `memory/CURRENT_GOAL.md`, `memory/NEXT_ACTIONS.md`, `memory/WEEKLY_PROGRESS.md` — our version
- `memory/workers/`, `memory/wisdom/`, `memory/CURSOR_PROMPTS.md`
- `data/` contents — real goals, tasks, messages (we reset these)
- `pull-pool/` contents — our real PRs
- `logs/` — our activity/deploy logs
- `oauth-debug.log`, `.next/`, `node_modules/`, `.git/`
- `test/`, `tests/` — probably (open question)
- `source-of-truth/` — probably (open question)

---

## Known phantom bugs (work on dev, break on client)

Several source files hardcode `/var/www/iam-os` and `pm2 restart iam-os`. On dev these match; on a client install where path is `/var/www/iam.client` and PM2 name is `iam.{slug}`, they silently break.

Locations (as of 17.04):
- `app/api/push/route.ts:30` — fallback PROJECT_ROOT
- `app/api/dashboard/lib/dev-ai-handler.ts:311` — AI system prompt
- `app/api/mcp/route.ts:205` — user-facing deploy instruction
- `app/api/mcp/lib/tools/devops-mega.ts:77` — same in MCP tool
- `app/api/admin/lib/post-handlers.ts:129` — `execSync('pm2 restart iam-os')`

Fix: use `process.env.PROJECT_ROOT` and `process.env.IAM_PROCESS_NAME` (both set by iam-client.sh in client's `.env.local`).

**Rule going forward:** every code path that references a filesystem path or a PM2 process name must use env vars, never literals.

---

## Why this matters right now (17.04.2026)

We're about to land our first paying beta client. If the install hands them a copy of my (Ariel's) `CURRENT_GOAL.md` or `IDEAS/` full of internal notes, that's:
- A privacy problem
- A professionalism problem
- A security problem (may contain tokens, internal URLs, real names of team members)

The blacklist cleanup in step 4b works **today**, for the files we know about. The spec (`INSTALLER_SPEC_v1.md`) describes the correct long-term architecture with a separate skeleton repo.

Until the skeleton repo exists: when in doubt, **audit what ships to the client before any install**.

---

*Created: 17.04.2026 by Claude Opus 4.7 during Stage 0 cleanup.*
*Related: `memory/ARCHITECTURE.md`, `ariel-workflow/INSTALLER_SPEC_v1.md`, `scripts/iam-client.sh`.*
