# Stage 1 Handoff — Skeleton Sync Infrastructure

**Date:** 2026-04-17 late evening (session started ~23:00 UTC+3)
**Status:** 🟢 Stage 1 complete at code level. Not yet pushed to skeleton repo.
**Next:** Ariel adds `SKELETON_PUSH_TOKEN`, then someone runs `sync.sh`.

---

## Wake-up TL;DR (Ariel, read this first)

You have a fully-built skeleton sync system on lego-base. **Nothing has been pushed to GitHub yet.** To make the skeleton repo (`ArielGrook/iam-client-skeleton`) actually contain content, do this:

```bash
# On lego-base, once:
export SKELETON_PUSH_TOKEN=ghp_your_PAT_here

# Preview what will be synced (no push):
DRY_RUN=1 bash /var/www/iam-os/scripts/sync-to-skeleton/sync.sh

# If preview looks good, push for real:
bash /var/www/iam-os/scripts/sync-to-skeleton/sync.sh
```

**PAT requirements:** fine-grained PAT, **Contents: Read and write** on the `iam-client-skeleton` repo only. No other permissions needed. Export it into shell, don't commit it anywhere.

After a successful sync you'll see `https://github.com/ArielGrook/iam-client-skeleton` filled with a clean, installable version of IAM Client OS.

---

## What was built this session

### Infrastructure (`scripts/sync-to-skeleton/`)

| File | Purpose |
|------|---------|
| `MANIFEST.txt` | Whitelist of what ships to skeleton. One line per path. Types: `COPY`, `OVERRIDE`, `EMPTY_FILE`, `EMPTY_JSON`, `DIR` |
| `sync.sh` | The sync executor. Parses manifest, applies overrides, runs safety leak-check, git commits, git pushes. Supports `DRY_RUN=1`. |
| `overrides/` | Clean client-ready replacements for files that exist on lego-base but shouldn't ship verbatim |

### Clean overrides written

**Memory templates (7):** `ARCHITECTURE.md`, `SYSTEM_IDENTITY.md`, `CURRENT_GOAL.md`, `NEXT_ACTIONS.md`, `WEEKLY_PROGRESS.md`, `TEAM_ROLES.md` (RULES.md uses COPY — source was already generic and system-locked for write).

**Wisdom templates (4):** `ANTI_PATTERNS.md`, `DECISIONS.md`, `PATTERNS.md`, `SESSION_INSIGHTS.md` — all English, structured with entry formats, lifecycle instructions, and blank starting state. These are the dataset files MCP injection V3 will eventually populate (future work).

**Bootstrap prompts (2):** `developer.md`, `reviewer.md` — Russian intro line removed, rest of content was already English.

**Source-of-truth (3):** Full translations from Russian to English. Personal refs ("Ariel", "Aliks") stripped. Generic role references used.

**Docs (11):**
- Root: `SERVER_SECURITY_CHECKLIST.md` (paths updated to `iam.client` default), `team-guidelines.md` (rewritten as generic team guidelines — original was stale JSON)
- Architecture: `README.md`
- `architecture/api/`: `ADMIN_API.md`, `DASHBOARD_API.md`, `MCP_API.md`
- `architecture/data/`: `DATA_LAYER.md`
- `architecture/features/`: `MEGA_TOOLS.md`, `PR_TASKS_MCP.md`, `NOTIFICATIONS_ROLES_GOTCHAS.md`
- `architecture/ui/`: `UI_MESSAGING_SESSIONS_DEPLOY.md`

All translated to English. PM2 names genericized (`iam-os` → `iam.client` where relevant).

**Root:** `README.md` — client-facing install + first-run + structure guide.
**Workspace:** `README.md` — usage guidance for `workspace/` directory.

### Commits this session (on lego-base, main branch, unpushed to origin)

- `e0f8e9d` — `feat(skeleton): infrastructure + memory/wisdom/bootstrap overrides`
- `e0208fd` — `feat(skeleton): complete docs translation + client README + workspace README`
- Plus the earlier admin-dev-console bug fix commit (`2ed817b`) from earlier today

To push lego-base main to GitHub: `cd /var/www/iam-os && git push origin main`

---

## What's NOT done

### Skills — minor anonymization needed

All skill files (`skills/*.md` root + `skills/iam-*/SKILL.md`) are already English. However, spot-check of `skills/iam-super-admin-strategic/SKILL.md` found **example names** ("Troy", "Aliks", "Steve") used in illustrative scenarios. These should be replaced with generic names (e.g., "the reviewer", "the admin", "a developer").

**How to fix:** either (a) add sed transforms to `sync.sh` post-copy, or (b) add overrides for the specific skill files that contain these names. Option (a) is faster but risks false positives. Option (b) is cleaner.

**Files to check:** need to grep `skills/` for:
- `Ariel`, `Aliks`, `Steve`, `Troy`, `Gooner`
- `lego-base`
- `iamrunner.ai`
- `iamrunning.online` (may be OK in some contexts)

**Estimated effort:** 20-30 min audit + overrides for 2-4 files.

### `iamrunning-component-rules` skill

Already EXCLUDED from manifest (specific to website builder, not IAM Client OS). Good.

### Sync script hasn't been run yet

`SKELETON_PUSH_TOKEN` is not in `.env` or shell on lego-base yet. Ariel needs to set it. Then a first `DRY_RUN=1` to verify, then a real run.

### `.env.example` dropped

Note in `MANIFEST.txt`: `.env.example` writes are blocked by MCP write system (dotfile env pattern). Since `install.sh` generates `.env.local` during install directly, clients don't need a reference file. If you want one anyway, it can be added to skeleton repo manually via `git`.

---

## Safety checks in `sync.sh`

After copying/overriding everything, `sync.sh` runs a **leak detection pass** that removes any of these from the skeleton working dir if they appear:

```
ariel-workflow, IDEAS, memory/CURSOR_PROMPTS.md, memory/SESSION_STATE.yaml,
DEVELOPMENT_VS_CLIENT.md, bootstrap-prompts/claude-start.md,
app/api/admin/totp-test-flow, test, tests, __tests__, new-file.md,
oauth-debug.log, .env, .env.local, .next, node_modules,
ecosystem.config.js, scripts/sync-to-skeleton, scripts/cleanup-pull-pool.js,
scripts/wisdom-check.sh, skills/iamrunning-component-rules
```

If any of these appear as a side effect of `COPY app/`, `COPY lib/`, etc., they get wiped before commit. Belt-and-suspenders approach — never trust just the manifest.

---

## What the skeleton repo will look like after sync

Top-level structure after first sync:

```
iam-client-skeleton/
├── README.md                       (client-facing, fresh)
├── .gitignore
├── install.sh                      (root wrapper)
├── package.json, package-lock.json
├── tsconfig.json, next.config.mjs, next-env.d.ts
├── app/                            (Next.js app)
├── lib/                            (shared code)
├── public/                         (sw.js + static)
├── scripts/
│   ├── iam-client.sh               (main installer)
│   ├── iam-backup.sh
│   ├── deploy-logged.sh
│   ├── watchdog.sh
│   └── post-commit.sh
├── extensions/
│   ├── _template/
│   └── project-stats/
├── bootstrap-prompts/
│   ├── admin.md                    (copied from lego-base)
│   ├── developer.md                (cleaned intro)
│   ├── reviewer.md                 (cleaned intro)
│   └── marketer.md                 (copied from lego-base)
├── memory/
│   ├── ARCHITECTURE.md             (clean template)
│   ├── SYSTEM_IDENTITY.md          (clean template)
│   ├── CURRENT_GOAL.md             (clean template)
│   ├── NEXT_ACTIONS.md             (clean template)
│   ├── WEEKLY_PROGRESS.md          (clean template)
│   ├── RULES.md                    (copied, already generic)
│   ├── TEAM_ROLES.md               (empty roles)
│   ├── wisdom/
│   │   ├── ANTI_PATTERNS.md        (English template)
│   │   ├── DECISIONS.md            (English template)
│   │   ├── PATTERNS.md             (English template)
│   │   └── SESSION_INSIGHTS.md     (English template)
│   └── workers/
│       └── .gitkeep
├── data/
│   ├── tasks.json                  ({"tasks":[]})
│   ├── messages.json               ([])
│   ├── conversations.json          ({"conversations":[]})
│   ├── goals.json                  ([])
│   ├── user-profiles.json          ([])
│   ├── task-requests.json          ({"requests":[]})
│   ├── spec-requests.json          ({"requests":[]})
│   ├── push-subscriptions.json     ({})
│   ├── sessions.json               ({})
│   ├── admin-sessions.json         ({})
│   ├── worker-presets.json         ({})
│   └── settings.json               ({})
├── pull-pool/.gitkeep
├── tasks/.gitkeep
├── messages/.gitkeep
├── logs/.gitkeep
├── workspace/
│   └── README.md                   (clean)
├── docs/
│   ├── SERVER_SECURITY_CHECKLIST.md   (English)
│   ├── team-guidelines.md             (English, generic)
│   └── architecture/
│       ├── README.md
│       ├── api/{ADMIN,DASHBOARD,MCP}_API.md
│       ├── data/DATA_LAYER.md
│       ├── features/{MEGA_TOOLS,PR_TASKS_MCP,NOTIFICATIONS_ROLES_GOTCHAS}.md
│       └── ui/UI_MESSAGING_SESSIONS_DEPLOY.md
├── source-of-truth/
│   ├── README.md                   (English)
│   ├── ROLE_CONTRACT.md            (English)
│   └── WORKER_MECHANICS.md         (English)
└── skills/
    ├── description-required.md
    ├── mcp-memory-first.md
    ├── read-before-write.md
    ├── session-hygiene.md
    ├── structured-data-only.md
    ├── iam-admin-work-planning/SKILL.md
    ├── iam-backend-preset/SKILL.md
    ├── iam-frontend-preset/SKILL.md
    ├── iam-platform-identity/SKILL.md
    ├── iam-pr-workflow/SKILL.md
    ├── iam-preset-switching/SKILL.md
    ├── iam-project-instructions/SKILL.md
    ├── iam-reviewer-planning/SKILL.md
    ├── iam-roadmap-creation/SKILL.md
    ├── iam-silent-execution/SKILL.md
    └── iam-super-admin-strategic/SKILL.md
```

Notable absences (by design): `ariel-workflow/`, `IDEAS/`, `memory/wisdom/` dev content, `bootstrap-prompts/claude-start.md`, test dirs, dev logs, our internal "DEVELOPMENT_VS_CLIENT.md".

---

## Next session / next day — what to do

**Priority 1 — run the sync:**
1. Set `SKELETON_PUSH_TOKEN` in shell on lego-base
2. `DRY_RUN=1 bash scripts/sync-to-skeleton/sync.sh` — preview
3. Review the diff stat at the bottom of dry-run output
4. If looks good: remove `DRY_RUN=1` and run again
5. Visit `https://github.com/ArielGrook/iam-client-skeleton` — should be populated

**Priority 2 — skills anonymization pass:**
- grep skills/ for the names/terms listed above
- Add 2-4 override files for the skills that need cleanup
- Re-run sync (idempotent — safe to run repeatedly)

**Priority 3 — real install test:**
- On an isolated VPS, run `install.sh --github=ArielGrook/iam-client-skeleton --github-token=XXX --domain=test.iamrunning.online --name=TestClient`
- Verify: clone works, build succeeds, pm2 starts, TOTP first-run prompts, MCP token generates, push works
- Report bugs → fix on lego-base → re-run sync → re-install

**Priority 4 — then move to Stage 2:**
Simplify `scripts/iam-client.sh` per our earlier plan:
- Remove the entire Step 4b (cleanup + template writes — skeleton is already clean)
- Default `--github` to `ArielGrook/iam-client-skeleton`
- Make `--github-token` mandatory
- Add `[N/11]` progress indicators
- Add `--dry-run` flag

---

## Stage 3+ reminder — MCP Injection V3 + Wisdom Routing

Per earlier discussion, this is the "same-echelon" priority as skeleton MVP, not a nice-to-have. Components:

1. **Session log** — append-only `memory/wisdom/_session-log.jsonl`
2. **Wisdom index** — `memory/wisdom/_index.json` mapping tool/path/event → relevant wisdom sections
3. **smartOk v3** — context-aware pre- and post-execution injection
4. **`crystallize_wisdom`** — new sub-action in `tasks` mega-tool that compacts session log into ANTI_PATTERNS/DECISIONS/PATTERNS/SESSION_INSIGHTS
5. **Pre-execution injection** — next-call hint based on current call context

Plan Stage 3 immediately after Stage 2 install.sh simplification (per earlier roadmap).

---

## Architectural reminder

The architecture that emerged from the brainstorm:

```
lego-base (ArielGrook/iam-client-os) ── dev, all our stuff, never modified by clients
        │
        │ scripts/sync-to-skeleton/sync.sh (one-way, manifest-driven)
        ▼
iam-client-skeleton (private GitHub repo) ── clean, client-ready
        │
        │ install.sh (on client VPS, clones skeleton with PAT)
        ▼
Client VPS (e.g., /var/www/iam.client)
        │
        │ /api/operator/* endpoints (already scaffolded in code)
        ▼
Future: iamrunning.online admin panel ── monitor, update, deploy clients remotely
```

When lego-base the domain goes away (hosting expires), move to `lego-base.iamrunning.online` subdomain on the iamrunning.online VPS. `scripts/sync-to-skeleton/` uses only local paths + PAT to push, so it will move without changes.

---

## If something goes wrong

- **Sync script fails with "clone failed":** check PAT is valid and has write access to `iam-client-skeleton`
- **Safety check says "LEAK DETECTED":** investigate which file leaked. Check manifest — probably a `COPY <parent-dir>` is pulling in something that should be excluded. Add more specific COPY or add the leaked path to the leak detector.
- **Override not applied:** check file exists at `scripts/sync-to-skeleton/overrides/<path>` matching the manifest's OVERRIDE path exactly.
- **Skeleton has extra files after re-sync:** `sync.sh` clears everything in the skeleton working dir (except `.git`) before re-applying. Safe to run repeatedly.

---

*Generated at end of Stage 1 session, 2026-04-17, Opus 4.7.*
*Stage 1 infra deliverable: complete. Testing + skills anonymization pending.*
