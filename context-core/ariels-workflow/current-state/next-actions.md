# Next Actions — 23.04.2026 (morning rewrite)

> **Rotation note:** previous 20.04 version archived at `../legacy_future_dataset/rotated-state/2026-04-20-next-actions.md` [TODO: Ariel to manually `git mv` this since whitelist doesn't allow it]. This rewrite reflects actual current state (migration done 22.04, operator spec drafted 23.04 evening + revised 23.04 morning, MCP injection audit done) and drops outdated "Active focus: platform migration" framing.

---

## 🔥 Today's mission (23.04) — finalization day before GTM

Ariel's framing: today we finalize everything that stands between "platform works" and "we can sell it." Two tracks, both targeted for today, budget ~10-12h honest work.

### Track 1 — Operator role Phase 1 (LAUNCH-BLOCKER)

**Why launch-blocker:** BUG #3 — without `/api/monitor/heartbeat` on iamrunning side, we can't see if a client instance is alive. Every install is a black box. Client asks "is my instance running?" — no answer. This blocks selling.

**Phase 1 scope** (from `iam-clients-os/specs/OPERATOR_SPEC.md` §6):
- `POST /api/monitor/heartbeat` on iamrunning — upsert, bearer auth via `operator_token`
- Client-side `GET /api/operator/files` + `/files/read` (read-only, no write yet)
- iamrunning admin proxy routes for file API
- Client Projects UI — inline accordion replacing right-side panel
- Badges: Server / Status / Access (read-only)
- Status dot + last_seen in list

**Estimate:** 3-4h focused work. Backend in this Claude web chat session, UI in parallel Cursor session with spec as guide.

**Migration note for test.lego-base.online:** old install doesn't send `Authorization: Bearer` on heartbeat yet. Decision (from spec §7.1): first heartbeat from any client acts as auto-registration — server accepts it as valid because no record exists, and token from `.env.local` becomes the stored `operator_token` for that record. No manual migration needed.

### Track 2 — MCP injection rework on iamrunning (ARIEL-QOL)

**Audit done 23.04 morning.** Current state: iamrunning MCP has 18 tools, **zero injection** — just bare `ok()`/`err()` wrappers. No preamble, no session counter, no smartOk, no smartErr, no checkBlock, no session_handoff, no contextual rules. Contrast with iam-client-os MCP (already ships to clients): full v2 injection — works.

**Work = port v2 from iam-client-os + adapt to iamrunning context.** Not a v3 upgrade, it's first-ever injection on this MCP.

**Adaptations vs client side:**
- No 4-role permissions model (only Ariel uses iamrunning MCP) → skip role-based checks
- No worker/reviewer/marketer preset logic → keep only frontend/backend preset (path-based auto-detect)
- Keep: session counter, checkBlock, smartOk, smartErr, session_handoff, contextual rules
- Add iamrunning-specific contextual rules (e.g. "editing `lib/admin/iam-clients-os/store.ts` — make sure `audit()` is called")

**Estimate:** 5-7h. Realistically doesn't fit today after Track 1. Split:
- **Today afternoon (3-4h):** core — preamble with timestamp + session counter, smartOk per tool, checkBlock hard blocks, session_handoff action
- **Tomorrow (2-3h):** smartErr, preset (frontend/backend), contextual rules, session-stats.jsonl, smoke test + tuning

**Honest framing:** **not a launch-blocker.** Clients get injection via their IAM Client OS install (which ships with full v2). iamrunning MCP is Ariel's own tooling when he works on the platform via Cursor/Claude. If Track 1 runs over, Track 2 slips to tomorrow or next week without stopping any sale.

### Priority rule for today

Track 1 MUST complete. Track 2 is "as much as time allows after Track 1."

---

## Operator Phase 2 — scheduled after Phase 1 ships

From spec §8 Phase 2 checklist:
- Activity ingestion endpoint + client-side activity cron payload
- `PUT /api/operator/files` + path whitelist
- `POST /api/operator/notify` + client admin badge surface
- `POST /api/operator/deploy` with no-fall app pattern integration
- Staging save/list/diff/discard endpoints
- Push endpoint with snapshot + atomic multi-PUT + deploy + auto-rollback
- History endpoint + rollback endpoint
- GitHub snapshot endpoint (per-client backup to client's own repo)
- `iam-client.sh` `--client-github-repo` flag
- clients.json schema extensions for GitHub config
- **Sandbox validation (spec §3.6)** — installer extension + push-to-sandbox + promote endpoints + admin orchestration. Budget ~1h50m (audited feasible).
- Visual: Dev Console embed in Files badge, Updates badge, Access badge editable, Activity/Logs badges

**Sequencing:** After Phase 1 smoke-tested + first paying client onboarded (so Phase 2 is driven by real pain points, not assumptions).

---

## Sandbox validation — audit done 23.04 morning

Ariel asked mid-session: can we validate builds on client sandbox before pushing to prod? Feasibility audit results:

| Component | Est. |
|---|---|
| Installer creates parallel sandbox clone at install time | 30min |
| Sandbox sync before push (rsync prod → sandbox) | 15min |
| `/api/operator/push-to-sandbox` (write + build) | 20min |
| `/api/operator/promote-sandbox` (swap sandbox/.next → prod/.next + restart) | 15min |
| Admin orchestration (push flow becomes sandbox → check → promote) | 30min |
| **Total: ~1h50m** | under 2h budget → ship in Phase 2 |

Caveats in spec §3.6: disk overhead (~500MB-1GB/client), sandbox must not heartbeat as ghost client (installer sets `IAM_SANDBOX=true` → skip crons), node_modules sync via rsync + conditional npm install on lockfile change, validates build not runtime.

---

## Bug fixes done 23.04

- **BUG #2 (curl IPv4)** + **BUG #4 (heredoc ANSI)** in both copies of `iam-client.sh` — commit `b7eff62` on iamrunning local (still blocked from push). Commit `2345e95` on `ArielGrook/iam-client-os` (Ariel pushed manually 23.04 morning). Fix is live on VPS — installer route serves from disk.

---

## Structural cleanup done 23.04

- **`iamrunning-ai/` hoist:** already done. Folder in project root contains 9 files (EVOLUTION_CONTINUED_*, HANDOFF, MCP_AS_A_SERVICE_SPEC, ROADMAP_17_EXTENDED, etc.). `context-core/ariels-workflow/iamrunning-ai/` is effectively empty. Just needs a cleanup sweep: remove old empty path + grep-update any docs pointing to it.

---

## After today's two tracks close — GTM launch window

Goal: first paying beta client within 3-5 days after Track 1 + Track 2 ship.

- LinkedIn DMs to Gilad Shoham + Leon Mulumud (Hebrew templates ready)
- YouTube outreach (10 small AI/automation channels, 500-10k subs each)
- Cold email 10/day via `iamrunning.online@gmail.com`
- Facebook Israeli tech groups
- Reddit: warm account + post in r/mcp
- Demo viewer account on test.lego-base.online (read-only admin) for cold outreach

Pricing: Beta $300-500 setup, free usage for feedback. After beta $1,500-3,000+. First payment: PayPal.

Blockers: Upwork Appeal still pending (parallel channel, not blocking).

---

## 🔧 Server-side MCP toolset expansion — scheduled track

**Trigger (23.04):** `run_command` whitelist blocked `cd`, `git -C <subpath>` on sub-repo operations. Generic shell whitelist is a leaky abstraction.

**Direction:** typed server-side MCP tools per domain. Candidates: `git_repo_action(subpath, action)`, `git_push_with_allow`, `pm2_action`, `nginx_action`, `tail_log`, `iam_install_run`, `cert_action`.

**Sequencing:** after operator Phase 1 ships (operator endpoints may benefit from these tools — design together). First deliverable: `context-core/specs/MCP_SERVER_TOOLSET_V2_SPEC.md`. Lower priority than operator MVP.

**Overlap with Track 2:** separate concerns — injection = behavioral guardrails on existing tools, this = adding new typed tools. Can run in parallel.

---

## 🛡️ No-fall application pattern — scheduled track

**Port from lego-base:** build to `.next-staging/` (not `.next/`), atomic swap on success via `pm2 reload`, healthcheck rollback on fail, build failure keeps serving old build + banner in admin UI.

**Why it matters:** direct enabler for operator Phase 2 push flow. "Deploy fallback" in operator spec = this pattern.

**Sequencing:** first iamrunning.online itself (dogfood), then bake into `iam-client.sh` `step_build`/`step_pm2` for every client install. Runs in parallel with operator Phase 2.

**First deliverable:** `context-core/specs/NO_FALL_APP_SPEC.md`.

---

## Open questions for Ariel (answer when ready, don't block Track 1)

- **Push Protection resolution** for `ArielGrook/I_AM_RUNNING_-` — still blocked, local repo ~40 commits ahead. Options: Allow URLs (fast, 5 clicks), cleanup files + amend (clean, heavier), defer (current state, getting more painful every day).
- **Phase 2 decisions** from operator spec §7b: file tree limits (exclude node_modules by default?), diff format (line-level default), push history retention (last 50 per client default).
- **MCP injection scope** — port all of v2 including session_handoff + session-stats.jsonl, or skinny version (preamble + smartOk + checkBlock only)? My vote: full port, adaptation overhead is small vs reimplementing later.

---

## Parallel — iamrunning.ai (separate Cursor chats)

Roadmap 17 Phases 17C/17D continue in separate Cursor chats. Not in this Claude web chat scope.

---

## Backlog (not blocking any launch)

- ChatGPT MCP connector — test `<internal>` compliance with GPT-4o
- Mobile adaptation Phase 3 (DashboardDevConsoleTab, landing overflow)
- SSE instead of 3s polling
- SQLite migration (at ~10 concurrent users)
- Vitest smoke tests
- Operator Phase 3 (SSH terminal, token rotation, freeze/kill, tripwire, billing, approval flow)
- MCP-as-a-Service (Phase 2 — iamrunning.ai as MCP provider to Client OS installations)
- `scripts/regen-project-structure.ts` — auto-generate PROJECT_STRUCTURE.md from source
- `workspace-README.md` sitting in `current-state/` doesn't belong there (move to rules/ or delete)
- Bootstrap schema integration into IAM Client OS skeleton (after Phase 2 ships)

---

*Updated: 23.04.2026 morning. Previous 20.04 version archived [TODO: needs manual git mv to rotated-state/, whitelist blocks it from chat].*
