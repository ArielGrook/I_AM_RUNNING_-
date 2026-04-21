# product-template — DEPRECATED

**Archived: 2026-04-21**
**Retired as part of migration Step 1.4 (`context-core/ariels-workflow/PLATFORM_REFACTORING.md`).**

## What this was

Implementation of "Option A" for IAM Client OS: **multi-tenant installs hosted on our own iamrunning.online server**, with each client getting a subdomain under `*.iamrunning.online` (or `*.lego-base.online`).

Contents:
- `install-client.sh` — per-client installer that added a client slug + data folder on our server
- `manage-clients.sh` — ops script for listing / removing client installs
- `generate-ecosystem.js` — generated PM2 ecosystem entries per client
- `auto-backup.sh` — backup script for per-client data
- `INSTALL.md` — Option A install documentation (v3.0)
- `context-core/` — memory / bootstrap templates for each client
- `bootstrap-prompts/` — `claude-start.md` and `chatgpt-start.md` for multi-tenant scenario

## Why retired

We pivoted from Option A (multi-tenant on our server) to **Option B: per-client VPS via `iam-client.sh` from the skeleton repo (`ArielGrook/iam-client-skeleton`)**.

Rationale:
- Clients want their data on their own infrastructure for privacy / compliance / sovereignty
- Multi-tenant on one server = one outage = all clients down
- Pricing works better per-VPS than per-tenant
- Every client's install is a fork — their own GitHub repo, their own PR workflow, their own customizations

Option B has been shipping since 2026-04-15 via skeleton repo + `iam-client.sh` installer (see `../../../roadmaps/ROADMAP_iam-client-sh.md`).

## Why kept (not deleted)

- **Future-dataset value** — the install scripts contain patterns we will re-use (healthchecks, rollback, systemd, nginx config generation)
- **Historical record** — decisions that led to the Option A → Option B pivot are clearer with the code in hand
- **Potential revival** — if a future enterprise customer wants a hosted multi-tenant variant, this is the starting point

## Don't

- Don't reference code from here in new implementations — patterns are already extracted where needed.
- Don't run `install-client.sh` — the infra it targets (subdomains on lego-base / iamrunning) is being dismantled.
- Don't edit files here. If you find something valuable, copy it somewhere else with attribution.

## Replaced by

- `ArielGrook/iam-client-skeleton` — clean skeleton for per-client installs
- `scripts/iam-client.sh` in dev repo (lego-base until migration Step 4, then `iam-clients-os/source/scripts/iam-client.sh` on iamrunning)

---

*This note was written during migration Step 1.4 on 2026-04-21.*
