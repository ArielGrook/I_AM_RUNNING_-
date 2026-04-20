---
version: 11
last_updated: "2026-04-19T17:40:00Z"
updated_by: "claude"
schema: "next_actions_v1"
---

# Next Actions (updated 19.04.2026 evening)

## Status: Platform stable, switching to iamrunner.ai

IAM Client OS is production-ready. Stage 1 (skeleton), Stage 2 (installer),
Stage 3 (test install) all complete as of today. No known blockers for
onboarding the first real beta client.

Ariel is refocusing on iamrunner.ai Electron client (local AI, RAG, MCP).

## iam-client-os — FROZEN unless client surfaces issue

If a real client reports a bug: top priority. Otherwise, leave it alone.

### Backlog (work only when touching nearby code)
1. `team-regenerate-token` auto-refresh tools[] for super_admin (ALL_TOOLS)
   and for others (ROLE_TOOL_PRESETS[role]). Location:
   app/api/admin/lib/post-handlers.ts
2. MANIFEST.txt explicit exclude for app/api/admin/totp-test-flow —
   stops leak-detector warning on every sync. Safety net already works.
3. SSL for iam-test: certbot --nginx -d iam-test.lego-base.online
   --non-interactive --agree-tos -m admin@iam-test.lego-base.online --redirect
4. End-to-end scenario test (worker → PR → approve+deploy) — run during
   first real client onboarding, not before.

## iamrunner.ai — NEW FOCUS (starting next session)

### Three candidate starting points (Ariel picks)

**A) Roadmap 17 — RAG Pipeline Unification** (biggest value, 2-3 sessions)
   - Spec written in iamrunner.ai/docs/roadmap/17_RAG_UNIFICATION.md
   - Indexer walks rag/ folder only
   - KB stores files in {project}/rag/
   - Auto-reindex after KB changes
   - Central to selling locally-run AI — needs to work well

**B) RAG Nuances 10A-10D** (small warm-up, 1 session)
   - Path collisions from base64url.slice(0, 32) — theoretical risk
   - Missing IPC handler for rag:clear-index (clearIndex has no bridge)
   - AiChat ragChunks no live refresh — subscribe to onRagProgress
   - vector-store metadata.text truncated at 2000 chars — acceptable
     if chunks are ~500-1000, keep in mind

**C) MCP Provider / AI-as-a-Service architecture spec** (strategic)
   - Move MCP Provider from Electron to VPS (Hetzner GEX44 with RTX 4000 Ada)
   - Pay-per-use pricing model with metered overage tier
   - Needs design discussion before implementation
   - Long-term play, not immediate revenue

### Recommended order
B (warm-up, clear small bugs) → A (core refactor, big impact) → C (strategic)

## GTM — parallel, Ariel's work

### This week (19-25.04)
- LinkedIn DMs to Gilad Shoham + Leon Mulumud (Hebrew templates ready)
- YouTube: find 10 small AI/automation/MCP channels (500-10k subs), DM
- Cold email: 10/day via iamrunning.online@gmail.com
- Facebook: join Israeli tech groups
- Reddit: warm account with comments, post in r/mcp
- Create demo viewer account (read-only admin) for cold outreach demos

### Blockers
- Upwork Appeal still pending for suspended original account
- Demo viewer account — create now that iam-test is verified working

## Next Session Protocol

### If focus is iamrunner.ai (default)
1. Connect to iamrunner.ai MCP connector (if exists) or work via files
2. Read iamrunner.ai memory/SHARED_CONTEXT.md
3. Read docs/roadmap/17_RAG_UNIFICATION.md if starting A
4. Pick B/A/C from above, confirm with Ariel, begin

### If iam-client-os issue reported by client
1. Read this file + CURRENT_GOAL.md
2. Reproduce the bug on iam-test or dev (lego-base)
3. Fix on dev, sync skeleton, rebuild iam-test to verify
4. Release to affected client

## Key Decisions Already Made

- Skeleton: ArielGrook/iam-client-skeleton, synced 4x today
- iamrunner.ai hosting: Hetzner GEX44 for production MCP Provider
- Model: Qwen2.5-Coder:14b (sequential serving, 5-10 clients)
- Payment: PayPal primary (no IBAN needed for Stripe)
- Pricing: Pay-per-use with included tier + metered overage
- Success metric: 100+ tool calls/day per engaged client

*Updated: 19.04.2026 17:40 UTC+3*
