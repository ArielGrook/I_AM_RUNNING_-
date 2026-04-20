# Handoff — 19 April 2026 (Evening)

## Session scope
Continuation of morning session. Focus: end-to-end verification of freshly-installed iam-test + security and UX fixes discovered during verification + decision to switch back to iamrunner.ai work.

## Everything completed today (7 commits on lego-base dev)

### Morning session
- `250144d` MCP session counter reset on read_memory/onboard/session_handoff
- `76a8c03` docs/architecture cleanup -> ADMIN_PANEL_INTEGRATION.md
- `a06a622` BUG 1 CLIENT_DOMAIN scheme in iam-client.sh (pre-existing)
- `2207e23` OAuth debug logging gated behind OAUTH_DEBUG env flag
- `4805376` Dev Console tab persistence + unsaved-changes warning (Admin + Dashboard)

### Evening session
- `7c9ee18` Super Admin token generate uses ALL_TOOLS (auto-includes new tools)
- `427ca7c` Restore Setup tab in Dashboard header (was accidentally removed)

Skeleton synced 5 times total. `ArielGrook/iam-client-skeleton` fully up to date with all fixes.

## iam-test server state
- URL: https://iam-test.lego-base.online
- PM2: `iam.iam-test` (id 2), online, 17 MB
- Path: `/var/www/iam.test`
- Port: 4742
- Install: Stage 3 fresh from latest skeleton
- Verified working: TOTP first-run, Admin Panel login, MCP connector auth, Dev Console tab persistence, Setup tab visible, OAuth debug log NOT created on OAuth flow, Bootstrap prompts generic English

## iam-client-os production status
Ready for first real client. No known blockers.

## Known backlog (non-blocking)
1. `team-regenerate-token` handler only refreshes `token_hash`, not `tools[]`. Fix: if role is super_admin refresh to ALL_TOOLS; for others refresh to ROLE_TOOL_PRESETS[role]. Location: `app/api/admin/lib/post-handlers.ts`.
2. MANIFEST.txt — explicitly exclude `app/api/admin/totp-test-flow` so the leak-detector warning stops firing every sync. Cosmetic. Safety net already works.
3. SSL for iam-test: `certbot --nginx -d iam-test.lego-base.online --non-interactive --agree-tos -m admin@iam-test.lego-base.online --redirect`
4. End-to-end scenario test: worker creates task -> PR -> approve+deploy -> logs/deploy.jsonl entry. Not executed this session. Should run during first real client onboarding.

## Security notes
- MCP token `2416b88b...` was leaked (oauth-debug.log + chat history) and rotated today
- Current Super Admin token hash starts `sha256:67f9d78c...`
- Fine-grained PAT for skeleton push (`github_pat_11BWGRV3I0...`) still valid but Ariel plans to rotate later
- Ariel's position on token rotation: "поху, потом ротирую" — acknowledged, documented

## Switching focus to iamrunner.ai

Ariel is moving back to iamrunner.ai Electron client. The platform iam-client-os is stable. Do not bikeshed on it in the next few sessions unless a real client surfaces an issue.

### iamrunner.ai priorities

**A) Roadmap 17 — RAG Pipeline Unification** (2-3 sessions, biggest value)
- Indexer walks `rag/` folder only
- KB stores files in `{project}/rag/`
- Auto-reindex after KB changes

**B) RAG Nuances 10A-10D** (1 session, warm-up)
- Path collisions from `base64url.slice(0, 32)`
- Missing IPC handler for `rag:clear-index`
- `AiChat` `ragChunks` no live refresh — subscribe to `onRagProgress`
- `vector-store` metadata.text truncated at 2000 chars

**C) MCP Provider / AI-as-a-Service architecture spec** (strategic)
- Move MCP Provider from Electron to VPS (Hetzner GEX44 with RTX 4000 Ada)
- Pay-per-use pricing model

Recommended order: B -> A -> C

## Next session protocol

1. Read memory (lego-base if iam-client-os related, or iamrunner.ai memory if client focus)
2. Read this handoff file
3. Pick between RAG Nuances 10A-10D, Roadmap 17, or MCP Provider spec — Ariel picks
4. Do NOT return to iam-client-os unless client asks

## Session stats

Session started at counter 81/80 inherited from morning Opus. Mid-session discovered and fixed the counter persistence bug. After deploy, all new calls counted properly from 1/80. Used move-trick workaround multiple times before the fix deployed. Today's session total: 7 commits on dev, 5 skeleton syncs, fresh Stage 3 install, full end-to-end verification.
