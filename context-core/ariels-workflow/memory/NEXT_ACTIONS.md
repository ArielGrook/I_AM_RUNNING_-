---
version: 11
last_updated: "2026-04-19T17:40:00Z"
updated_by: "claude"
schema: "next_actions_v1"
---

# Next Actions (updated 23.04.2026 evening)

## Status: Operator role spec drafted, Phase 1 implementation next

IAM Client OS migrated to iamrunning.online infrastructure (22.04). Test install live at `test.lego-base.online` — full install via MCP succeeded, SSL deployed, admin panel rendering. 11-point checklist items 1-2 verified, 3-11 deferred (browser+TOTP needed).

**Operator role end-to-end spec written 23.04** — `iam-clients-os/specs/OPERATOR_SPEC.md` (~360 lines, draft v1). Direct write architecture, staging buffer on iamrunning side, accordion+badges visual, MVP/Phase2/Phase3 phasing. Closes the gap around "we can install clients but can't see/operate them remotely".

## Primary track — Operator Phase 1 implementation (next session)

Scope from `OPERATOR_SPEC.md` §6 + checklist §8:
- POST /api/monitor/heartbeat (upsert) on iamrunning side — closes BUG #3
- Extend iam-client.sh step_secrets to generate MONITOR_SECRET in .env.local
- Extend iam-client.sh step_crons to include HMAC sig in heartbeat POST
- GET /api/operator/files (list) + GET /api/operator/files/read on client side
- Admin proxy routes for files list+read on iamrunning side
- Replace right-side panel with inline accordion in Client Projects tab
- Badge component (reusable) + grid layout
- Badges Server / Status / Access wired to live data
- Status dot column in list + last_seen relative time
- "+ Add client" button redesign (centered)

~3-4h, one Cursor session. Spec is detailed enough that Cursor should execute without re-explanation.

## Bug fixes this session (23.04)

- BUG #2 (curl IPv4) — fixed in both copies of iam-client.sh, byte-identical, commit `b7eff62`
- BUG #4 (heredoc ANSI) — same commit
- Push to ArielGrook/I_AM_RUNNING_- blocked by Push Protection (deferred per Ariel)
- Push to ArielGrook/iam-client-os pending Ariel manual

## Pending Ariel manual actions

1. `cd /var/www/i_am_running/iam-clients-os/source && git add scripts/iam-client.sh && git commit -m "..." && git push origin main` to ship BUG #2/#4 to skeleton-source repo
2. `git mv context-core/ariels-workflow/iamrunning-ai iamrunning-ai` to hoist iamrunner.ai folder to project root
3. Decide GitHub Push Protection resolution (Allow URLs / cleanup files / defer)
4. Read OPERATOR_SPEC.md on PC, confirm/override 4 assumptions in §7

## Parallel tracks (sequenced, not started)

- **Server-side MCP toolset expansion** — typed tools (git_repo_action, pm2_action, nginx_action, tail_log, iam_install_run, etc.) replacing generic run_command. Logged in `context-core/ariels-workflow/current-state/next-actions.md`. Sequenced after operator spec done — design together. First deliverable: `MCP_SERVER_TOOLSET_V2_SPEC.md`.
- **No-fall application pattern** — port lego-base swap+healthcheck pattern (.next-staging build target, atomic swap, healthcheck rollback, build error banner in admin UI). Implementation order: iamrunning.online first (dogfood), then bake into iam-client.sh. First deliverable: `NO_FALL_APP_SPEC.md`. Direct enabler for operator Phase 2 push flow ("deploy fallback").
- **MCP Injection V3** — still scheduled, not started. First deliverable: `MCP_INJECTION_V3_SPEC.md`.

## iamrunner.ai — parallel Cursor sessions

Roadmap 17 Phases 17C/17D continue in separate Cursor chats. Not in this Claude web chat scope.

## GTM — parallel, Ariel's work

This week:
- LinkedIn DMs to Gilad Shoham + Leon Mulumud
- YouTube outreach (10 small AI/automation channels)
- Cold email 10/day
- Reddit warm + post in r/mcp
- Demo viewer account on test.lego-base.online (read-only admin) for cold outreach demos

Blockers: Upwork Appeal still pending. Demo viewer not created yet.

## Next Session Protocol

Default — operator Phase 1:

1. Connect to MCP iamrunning
2. Read context-core/ariels-workflow/current-state/README.md + session-state.yaml
3. Read iam-clients-os/specs/OPERATOR_SPEC.md
4. Plan sub-sessions inside the chat (heartbeat → file API → admin proxies → UI accordion → badges → status dot)
5. Begin with heartbeat endpoint

If iam-client-os issue reported by client: top priority, drop everything.

## Key Decisions Already Made (this session and prior)

This session (23.04):
- Direct write over git remote for operator push
- Staging buffer on iamrunning side (not on client)
- Heartbeat = upsert (combines registration+liveness)
- Inline accordion + badge grid for Client Projects UI
- Per-client GitHub snapshot (closes C9)
- HMAC for monitor endpoints (assumption — Ariel to confirm)

Prior:
- Skeleton: ArielGrook/iam-client-skeleton
- iamrunner.ai hosting: Hetzner GEX44 for production MCP Provider
- Model: Qwen2.5-Coder:14b
- Payment: PayPal primary
- Pricing: Beta $300-500 setup, after beta $1500-3000+

*Updated: 23.04.2026 22:00 UTC+3*
