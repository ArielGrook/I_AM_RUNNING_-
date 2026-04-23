# Operator Spec — IAM Clients OS

**Status:** Draft v1, agreed with Ariel 23.04.2026.
**Supersedes:** `context-core/specs/OPERATOR_DASHBOARD_SPEC.md` (12.04 concept). When this spec stabilizes, that document gets archived.
**Scope:** end-to-end operator role for IAM Client OS — backend (ingestion + client-side operator API + iamrunning admin API), visual (client card UX), staging update flow, MVP cut, phasing.

---

## 1. Mission

Single point of remote control for every IAM Client OS install. From Ariel's admin panel on iamrunning.online he can:

- See whether each client install is alive and what version it runs
- Browse client filesystem live, read any file, push file changes
- Prepare an update bundle in a staging area, review the diff, push it to the client atomically with deploy + automatic rollback on failure
- View deploy history with one-click rollback to any previous version
- Receive real-time activity from each client (PRs, deploys, errors)
- (Phase 3) Open an SSH terminal directly to the client server inline

The operator role is the missing surface that makes IAM Client OS multi-tenant in practice. Without it, every install is an isolated black box requiring manual SSH for every operation.

---

## 2. Architecture overview

Three sides communicate:

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│  iamrunning.online      │         │  Client install              │
│  (admin / operator UI)  │         │  (e.g. test.lego-base.online)│
│                         │         │                              │
│  ┌──────────────────┐   │  HTTPS  │  ┌────────────────────────┐  │
│  │ Admin Dev Console│◄──┼─────────┼──┤ /api/operator/files    │  │
│  │ + staging area   │   │  PUT    │  │ /api/operator/deploy   │  │
│  └──────────────────┘   │  GET    │  │ /api/operator/notify   │  │
│           │             │         │  │ /api/operator/restart  │  │
│           ▼             │         │  │ /api/operator/logs     │  │
│  ┌──────────────────┐   │         │  │ /api/operator/status   │  │
│  │ Snapshot store   │   │         │  └────────────────────────┘  │
│  │ (versioning)     │   │         │           ▲                  │
│  └──────────────────┘   │         │           │                  │
│           ▲             │         │           │                  │
│  ┌──────────────────┐   │  HTTPS  │  ┌────────────────────────┐  │
│  │ /api/monitor/*   │◄──┼─────────┼──┤ Cron heartbeat (5min)  │  │
│  │ heartbeat,       │   │  POST   │  │ Cron activity   (5min) │  │
│  │ activity         │   │         │  └────────────────────────┘  │
│  └──────────────────┘   │         │                              │
└─────────────────────────┘         └──────────────────────────────┘
       inbound from client                outbound to client
       (push, no auth challenge —          (auth: bearer OPERATOR_TOKEN)
        clients self-identify by
        instance_id + signed payload)
```

Auth model is asymmetric but **uses the same token in both directions**:

- **Client → iamrunning** (heartbeat, activity): `Authorization: Bearer <OPERATOR_TOKEN>` on every request. iamrunning looks up the client by matching `operator_token` in `clients.json`. The token also acts as the permission grant — "this client is authorized to report heartbeat and activity about itself". No separate monitor secret.
- **iamrunning → client** (operator endpoints): same `OPERATOR_TOKEN`, bearer auth. Client validates against the token in its own `.env.local`.

**Why not a separate MONITOR_SECRET:** an extra secret doubles rotation cost (you have to regenerate TWO secrets on both sides in lockstep) and adds storage surface. Using `OPERATOR_TOKEN` bidirectionally means one secret = one rotation procedure = simpler contract.

**Trade-off accepted:** no replay protection (no HMAC-over-timestamp). If a heartbeat is intercepted with a valid bearer, it can be replayed to create a false "alive" signal for a dead instance. This is acceptable for beta — heartbeat carries no money/secrets, and replay only provides false positives, not false negatives (a dead instance stays detected via missing heartbeats over time). HMAC can be added as an additive future change without breaking compat (server accepts both formats, new clients opt in).

iamrunning rate-limits per `operator_token` match (e.g. max 20 heartbeats/min per client).

---

## 3. Backend

### 3.1 iamrunning ingestion endpoints (inbound from clients)

#### `POST /api/monitor/heartbeat`

Combines registration and liveness in one upsert. First call creates the client record (or attaches to an existing one created via Web Installer). Subsequent calls update `last_seen` and `version`.

**Auth:** `Authorization: Bearer <OPERATOR_TOKEN>`. The token must match an existing client record's `operator_token` field. On first call (record doesn't exist yet), the token becomes the record's operator_token — this is the registration step. Subsequent heartbeats must match the stored token.

**Request:**
```json
{
  "instance_id": "d2c9660d08522f8c",
  "domain": "test.lego-base.online",
  "client_name": "Test Client",          // only used on first call
  "operator_url": "https://...",          // only used on first call
  "version": "1.0.0",
  "uptime_sec": 8472,
  "status": "ok"                          // ok | degraded | starting
}
```

No signature, no timestamp — bearer auth is sufficient per §2.

**Response:** `{ ok: true, client_id, server_ts }`

**Side effects:** upsert into clients table, update `last_seen=now()`, update `version`, update `uptime`. If first call → set `status=installed`, `installDate=now()` if not already set.

#### `POST /api/monitor/activity`

Activity delta from client — separate from heartbeat because (a) heartbeat must be cheap and frequent, activity carries variable payload, (b) activity may be batched / retried independently.

**Request:**
```json
{
  "instance_id": "d2c9660d08522f8c",
  "since_ts": "2026-04-23T12:30:00Z",
  "events": [
    { "ts": "...", "type": "pr_created", "actor": "worker_id", "data": {...} },
    { "ts": "...", "type": "deploy_completed", "data": { "version": "1.0.1" } },
    { "ts": "...", "type": "task_assigned", ... }
  ]
}
```

Auth: same bearer token pattern as heartbeat (`Authorization: Bearer <OPERATOR_TOKEN>`).

Event types reuse the existing 45 types from Activity Log v2 in IAM Client OS. iamrunning does not interpret bodies — just stores them under the client record.

**Response:** `{ ok: true, accepted: N }`

### 3.2 Client-side operator endpoints (outbound from iamrunning)

All require `Authorization: Bearer <OPERATOR_TOKEN>`. All access is scoped to `INSTALL_PATH` — paths outside it return 403. Every call is logged to `logs/operator-access.jsonl` so the client can audit.

#### Existing (already in place):
- `GET  /api/operator/status` — health + version + uptime
- `POST /api/operator/restart` — pm2 restart
- `GET  /api/operator/logs?type=pm2|nginx|install&lines=N`

#### New:

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/operator/files?path=<rel>` | List directory contents (returns `[{name, type, size, mtime}]`) |
| `GET`  | `/api/operator/files/read?path=<rel>` | Read single file content (text or base64 for binary) |
| `PUT`  | `/api/operator/files?path=<rel>` | Write single file (body = content). Used during atomic push from staging — not called manually. |
| `POST` | `/api/operator/notify` | Receive notification ("update queued", "rollback applied", etc.) — surfaces as badge in client admin UI |
| `POST` | `/api/operator/deploy` | Trigger deploy: `npm run build` → `pm2 restart`. Returns success/fail with build log tail. On fail, pm2 still serves old build (no downtime). |

Path whitelist: only paths under `$INSTALL_PATH` are accepted. `..` rejected. `.env*` blocked from read (operator should not be able to exfil VAPID/admin secrets through this channel).

### 3.3 iamrunning admin endpoints (consumed by Admin UI)

These wrap the client-side API + add staging logic. No client ever calls these — only Ariel's admin panel.

#### Live read-through (proxies to client):

- `GET /api/admin/operator/files?client_id=X&path=...` → calls client `/api/operator/files`
- `GET /api/admin/operator/files/read?client_id=X&path=...` → calls client `/api/operator/files/read`

#### Staging:

- `POST /api/admin/operator/staging/save` — body: `{client_id, path, content}`. Saves to `data/operator/staging/{client_id}/{path}` on iamrunning.
- `GET  /api/admin/operator/staging/list?client_id=X` — returns array of `{path, modified_at, size, hasUnsavedDiff}`.
- `GET  /api/admin/operator/staging/diff?client_id=X&path=...` — diff between staging file and current production file (live-fetched).
- `POST /api/admin/operator/staging/discard` — body: `{client_id, paths?: []}`. Drop one or all staged files.

#### Push:

- `POST /api/admin/operator/push` — body: `{client_id, message?: "fix typo in dashboard"}`.
  1. Take server-side snapshot of all production versions of the staged files (saved to `data/operator/snapshots/{client_id}/{snap_id}/`).
  2. Atomically PUT each staged file to client `/api/operator/files`. If any PUT fails, abort (no deploy, snapshot kept for rollback).
  3. POST `/api/operator/deploy` on client.
  4. If deploy fails → automatic rollback (restore snapshot to client + redeploy).
  5. On success: clear staging, append entry to `data/operator/history/{client_id}.jsonl`.

#### History + rollback:

- `GET  /api/admin/operator/history?client_id=X&limit=50` → returns recent push events with snap_id, timestamp, message, files affected.
- `POST /api/admin/operator/rollback` — body: `{client_id, snap_id}`. Treats snapshot as new staging → push (which itself takes a fresh "before-rollback" snapshot, so rollback is itself rollbackable).

#### GitHub snapshot (per-client backup to client's own GitHub repo):

Each client install has an associated GitHub repo (separate from our dev repo, separate from the skeleton). Operator can push the current state of the client install to that repo as a git commit. Closes the backup-outside-our-infra gap and gives the client a visible audit trail in a system they own.

- `POST /api/admin/operator/github/snapshot` — body: `{client_id, message?: "post-update v2026-04-23-001", auto?: false}`. Triggers a snapshot from iamrunning, which calls the client-side endpoint below. Returns `{commit_hash, repo_url}` on success.

Client-side counterpart:
- `POST /api/operator/github/snapshot` — body: `{message}`. Does `git add -A` + `git commit -m "$message"` + `git push origin main` against the configured client GitHub remote. Returns commit hash + repo URL.

Auto-snapshot toggle (per-client setting): if enabled, the `POST /api/admin/operator/push` flow automatically calls github/snapshot on success. Default = off (manual control), togglable per client.

**Pre-requisites stored in clients.json (per client):**
- `github_repo` — e.g. `AcmeCorp/iam-acme` (the *client's* repo, not ours)
- `github_pat` — encrypted, must have `Contents: Read+Write` on `github_repo`
- `github_branch` — default `main`
- `auto_snapshot_after_push` — boolean, default false

**Client-side requirement:** `git remote origin` in the install dir must point to the client's GitHub repo. Set during install (extend `iam-client.sh` to accept `--client-github-repo` and rewrite remote after fresh git init), or settable later via Access badge in the operator UI.

This intentionally ties operator push and GitHub snapshot together as separate-but-linked actions: you can push without snapshotting (fast iteration), snapshot without pushing (manual checkpoint of current state), or chain them (with auto toggle on). Closes C9 from `context-core/ariels-workflow/current-state/current-goal.md`.

### 3.4 Storage layout (iamrunning side)

```
data/
  clients.json                           # registry (existing)
  operator/
    staging/
      {client_id}/
        path/to/file.tsx                 # mirrors client repo structure
    snapshots/
      {client_id}/
        {snap_id}/                       # taken before each push
          path/to/file.tsx               # captures "before" state
          .meta.json                     # { snap_id, ts, push_msg, files: [...] }
    history/
      {client_id}.jsonl                  # append-only push log
```

For first iteration this is JSON files on disk. Migrate to SQLite or Supabase when needed (see Backlog).

### 3.6 Sandbox validation (Phase 2, feasibility-gated)

**Idea (Ariel, 23.04 morning):** before pushing staged changes to client production, iamrunning prepares the update on a **client-side sandbox** instead. The sandbox is a copy of the client's install in a separate path/port (e.g. `/var/www/iam.client-sandbox/` + port+1). Push the staging bundle to sandbox first → trigger its build → if build passes, roll forward to production. If build fails, only sandbox is affected, production untouched.

**Why this is attractive:** catches broken builds before they reach production deploy step. Complements no-fall app pattern (no-fall keeps old build alive on failure *during* deploy; sandbox validates *before* deploy is even triggered).

**Why it's feasibility-gated:** implementing this means the installer must set up a parallel sandbox install — second clone, second port, second nginx config, second pm2 process, second `.env.local` (or synced from prod). Sandbox must stay in sync with prod between pushes (or be reset each time). That's non-trivial infrastructure.

**Decision rule:** if full implementation (installer extension + operator sandbox-push endpoint + admin-side orchestration) takes ≤ 2 hours of focused work, ship it in Phase 2. Otherwise defer to Phase 3+ and rely on the two existing safety nets (diff review + no-fall deploy fallback).

**Audit required before committing:** §3.6-audit below.

**Feasibility audit (performed 23.04 morning, by Claude):**

Components needed for a minimum working sandbox:

| Component | Complexity | Notes |
|---|---|---|
| Installer extension — create `/var/www/iam.client-sandbox/` parallel to prod at install time | ~30min | Just another `clone + npm install + pm2 start` block in `iam-client.sh`. Same ecosystem.config.js pattern, different process name (`iam.{name}-sandbox`), port = prod_port + 1. Can run on same nginx (subdomain like `sandbox.{domain}`) or skip nginx (localhost-only). |
| Sandbox sync script — reset sandbox to match prod before each push-to-sandbox | ~15min | `rm -rf sandbox/src && cp -r prod/src sandbox/src`, or preferably git-based: sandbox is cloned from prod on each cycle. Simpler to just `rsync --delete` prod → sandbox. |
| New client-side endpoint `/api/operator/push-to-sandbox` | ~20min | Receives files, writes to sandbox path, triggers `npm run build` in sandbox, returns `{ok, build_log}`. |
| New client-side endpoint `/api/operator/promote-sandbox` | ~15min | Copies sandbox/.next → prod/.next (atomic directory swap), restarts prod pm2. Only called after sandbox build succeeds. |
| Admin-side orchestration — change push flow to: push-to-sandbox → check build → promote | ~30min | Modify `POST /api/admin/operator/push` to run both steps. Error path: sandbox build failed → abort, show build_log to Ariel, don't touch prod. |

**Estimated total: 1h50m.** Under the 2h budget. **Verdict: ship in Phase 2.** Added to Phase 2 checklist §8 accordingly.

**Caveats surfaced by audit:**
- Sandbox path needs extra disk (2× install size — ~500MB-1GB per client). Accept.
- Sandbox must never heartbeat/activity as its own instance (would look like a ghost client in admin UI). Installer must skip sandbox from heartbeat crons. Add `IAM_SANDBOX=true` env → installer skips cron setup for sandbox.
- If prod has runtime state (open DB connections, in-memory caches, WebSocket clients), sandbox won't have it — build-time validation is OK because we only care "does it compile", but runtime validation would need more thought. Out of scope: we're validating build, not runtime.
- Node modules — sandbox needs its own `node_modules/`. Either install separately on each sync (slow, 20-30s) or share via symlink (risky if package.json diverges). Recommend: rsync both `src` and `package*.json`, then `npm install` on sandbox if lockfile changed. Detection: compare lockfile checksums.

### 3.7 Permissions / security

`OPERATOR_TOKEN` gives iamrunning **full read+write** access to the client install dir. This is intentional but serious:

- **Path whitelist** enforced on client side (`$INSTALL_PATH` only, `.env*` blocked from read)
- **Audit log** on client side (`logs/operator-access.jsonl`) — client admin can see every operator action
- **Rotation** — see backlog item, deferred. For now, manual rotation = re-run `step_secrets` block on client.
- **Future (Phase 3):** opt-in client approval flow — operator pushes are queued, client admin must approve in their UI before deploy runs. Off by default for the kind of clients we'll have first (we're hands-on managing them anyway).

---

## 4. Staging update flow (full walkthrough)

This is the central UX flow — everything else supports it.

```
1. Ariel opens Client Projects → clicks card for "Acme Corp" → card expands inline
2. Inside expanded card, taps badge "Files" → Dev Console panel opens within the same card
3. Dev Console shows file tree (live GET from client via admin proxy)
4. Ariel clicks dashboard.tsx → CodeMirror loads file content (live)
5. He edits 3 lines, hits Save (Ctrl+S)
   → POST /api/admin/operator/staging/save
   → File now in staging on iamrunning, NOT on client yet
   → File tree shows "● dashboard.tsx" (modified indicator)
6. Edits 2 more files. Each save = staging update. Status shows "3 files staged".
7. Click "Review changes" badge → modal/panel showing per-file diffs
8. Click "Push to client" → confirmation: "3 files, 47 lines changed. Deploy after?"
9. Confirm → POST /api/admin/operator/push
   → snapshot taken → atomic multi-PUT → deploy → success
10. Notification appears in client admin: "Update v2026-04-23-001 deployed by operator: 'fix dashboard layout'"
11. History badge in card now shows the new entry. One-click rollback button next to it.
```

Cancel paths:

- "Discard" badge in expanded card → drops all staging for this client, no client-side effect.
- Mid-edit "Discard this file" via right-click in tree → drops one file from staging.

Concurrent safety: only one staging session per client at a time. If Ariel opens two browser tabs on the same client, second tab gets read-only mode + warning. Staging is per-client, not per-user, because there's only one operator (Ariel) — multi-operator is post-MVP concern.

---

## 5. Visual

### 5.1 List view

`Admin → IAM Clients OS → Client Projects`. Replaces current right-side panel pattern with **inline accordion expansion**.

**Top bar:**
- Centered button `+ Add client` — new design (departs from current side-aligned plain button). Larger, clear visual weight.
- Right side: filter chips (Status: all/online/offline, Kind: all/real/test), search input.

**Card list:**
- Each client = stacked card, full width.
- Collapsed card row shows: status dot, domain, client_name, version, last_seen, kind tag.
- Click anywhere on a collapsed card → expand inline (accordion). Other cards stay in list.
- Expanded card visually distinguished from collapsed: subtle bg accent (1-step lighter/darker than collapsed), 2px left border in accent color, slight elevation shadow. Should read as "you're in this card's scope" without being loud.
- Click header again, or press Esc, to collapse. Only one card expanded at a time (clicking another collapses current, expands new).

### 5.2 Expanded card content — badge grid, not tabs

No tabs. Inside the expanded card is a grid of **badges** (chip-style components). Each badge represents a category. Tap a badge → it expands inline (within the card) showing details and actions.

**Badges (initial set — extensible):**

| Badge | Tap behavior |
|---|---|
| `Server` | Shows install path, port, version, install date, server IP, mode, kind. Read-only. Compact key-value layout. |
| `Status` | Shows uptime, last heartbeat (relative time + tooltip with absolute), online/offline indicator, response time. Refresh button. |
| `Access` | Shows masked credentials: MCP URL, MCP token (reveal button), Operator token (reveal), GitHub repo (client's own — editable), GitHub PAT (reveal, editable, scope checked: must be Read+Write Contents on that repo), GitHub branch (editable, default main). Each line has copy button. (Rotate buttons later — Phase 3.) |
| `Files` | Opens **embedded Dev Console** in card. File tree on left, CodeMirror on right. Live-fetched from client. Edits go to staging (see §4). |
| `Updates` | Shows current staging (N files, last modified) + push button + history list. From here you Push, Discard, view diffs, rollback. Also: **`Snapshot to GitHub`** button (manual one-shot push of current state to client's own GitHub repo). Toggle `Auto-snapshot after push` lives here. |
| `Activity` | Recent events from client, scrollable. Filter by event type. Polls every 30s while badge is expanded. |
| `Logs` | PM2 / nginx / install log viewer. Tail with live update. |
| `Billing` | Placeholder for now (Stripe/PayPal integration not done). Shows setup_amount, monthly, last_payment from client record. |
| `SSH` (Phase 3) | Opens embedded web terminal (xterm.js + WebSocket → ttyd on client). Big chunk — separate spec. |
| `Danger` | Restart, Force redeploy, Freeze (block all writes), Unfreeze, Delete client (with confirmation). |

Multiple badges can be expanded simultaneously. Each expanded badge adds a section vertically in the card. Card grows. Scroll within card if it gets long.

### 5.3 Status dots (used in list + Status badge)

- 🟢 green = heartbeat within last 10 min
- 🟡 amber = last heartbeat 10-60 min ago
- 🔴 red = no heartbeat for >60 min
- ⚫ grey = never seen (just registered, no heartbeat yet)

### 5.4 Dark/light mode

Admin panel currently does not have full dark mode. Out of scope for operator MVP. Tracked separately. New components built in this spec must use design tokens (CSS variables) so dark mode is a single sweep when it lands, not a per-component refactor.

### 5.5 Accessibility / interactions

- Card expand/collapse keyboard: Enter/Space on focused card, Esc to close.
- Badge tap is full-button (not just text), 44x44 min touch target for mobile.
- Dev Console inside card stays performant — virtualize file tree if >500 entries.

---

## 6. MVP scope (one implementation session, ~3-4h)

**In MVP:**
- Backend: `POST /api/monitor/heartbeat` (upsert pattern — closes BUG #3 from 22.04 session)
- Backend: client-side `GET /api/operator/files` + `GET /api/operator/files/read` (read-only, no PUT yet)
- Backend: admin proxies for the two read endpoints above
- Client-side cron sends heartbeat (already in `iam-client.sh` step_crons — already shipping, just needed the receiving end)
- Visual: replace right-side panel with inline accordion expansion in Client Projects
- Visual: badges `Server`, `Status`, `Access` (read-only metadata views)
- Visual: status dot in list view + `last_seen` column

**Out of MVP (Phase 2):**
- Activity ingestion endpoint + Activity badge
- Files PUT + staging area + Push flow + Updates badge
- Embedded Dev Console
- Notify endpoint
- History + rollback
- Logs badge with live tail

**Out of MVP (Phase 3+):**
- SSH terminal badge
- Token rotation UI
- Client-side approval flow for pushes
- Freeze / unfreeze / kill switch
- Tripwire alerts
- Billing integration (after Stripe/PayPal)
- Multi-operator support

Phasing rationale: MVP closes the most acute pain (BUG #3 — instances are invisible) and proves the inline-accordion visual works before we invest in heavy components like Dev Console embed and staging buffer.

---

## 7. Resolved decisions (23.04 morning, session 2)

All four assumptions from Draft v1 were reviewed with Ariel on 23.04 morning and resolved:

1. **Auth: single `OPERATOR_TOKEN`, no separate MONITOR_SECRET.** Bearer used bidirectionally (client → iamrunning for heartbeat/activity, iamrunning → client for operator endpoints). One rotation procedure, no extra secret to lose. Replay protection deferred — can be added additively (HMAC layer) if a real threat materializes. See §2.

2. **Staging buffer single-user.** Only Ariel operates. Second browser tab on same client = read-only + banner. Multi-operator deferred until a second operator actually exists.

3. **Full file snapshots, not diffs.** "Кто вообще снэпшотит дифы" — Ariel. Text files tiny, disk cheap, rollback is simple file copy. Revisit if a client ever commits a large binary blob.

4. **No pre-push validation (Phase 1/2).** BUT — see §3.6 for a **Phase 2 feasibility-gated sandbox validation idea**. If the sandbox idea can be built in ~1-2 hours of work, we do it; otherwise skipped. Safety nets remain: diff review + no-fall app pattern (deploy fallback keeps old build serving on build failure).

## 7b. Still open (decide before Phase 2)

- **File tree limits** — should iamrunning ever load a full tree of `node_modules/`? Default = excluded from listing (configurable per-client allowlist of paths to walk).
- **Diff format** — line-level (LCS, like existing Diff View in IAM Client OS) or word-level? Default = line-level, reuse existing.
- **Push history retention** — keep all snapshots forever? Default = last 50 per client, then trim oldest. Configurable per client.

---

## 8. Implementation checklist (for the implementation session)

Tracked here so the dev session has a definitive checklist. Status updated inline.

### MVP (Phase 1)

- [ ] Extend `lib/admin/iam-clients-os/store.ts` schema: add `instanceId`, `operatorToken` (encrypted), `operatorUrl`, `lastSeen`, `lastSeenUptime`, `heartbeatStatus`, `version`
- [ ] Add `operatorToken` to `ENCRYPTED_FIELDS` + `REVEALABLE_FIELDS`
- [ ] Add `upsertByHeartbeat()` helper in store.ts (find-by-instance-id-or-domain, create if missing, update liveness fields)
- [ ] Add `findClientByOperatorToken()` helper (linear scan — OK for <100 clients, revisit later)
- [ ] `POST /api/monitor/heartbeat` route (`app/api/monitor/heartbeat/route.ts`) — bearer auth, upsert, rate-limit per token (in-memory counter, 20/min)
- [ ] Client-side: extend `iam-client.sh` `step_crons` — add `Authorization: Bearer $OPERATOR_TOKEN` header to heartbeat curl, and include `version`, `uptime_sec`, `status`, `operator_url` in body
- [ ] Client-side: `GET /api/operator/files` route (listing, path whitelist, `.env*` block, audit log append)
- [ ] Client-side: `GET /api/operator/files/read` route
- [ ] iamrunning admin proxy routes for files list + read (`app/api/admin/operator/files/...`) — admin auth + lookup operator_token + fetch with bearer
- [ ] Visual: refactor `Client Projects` tab — remove right-side panel, implement inline accordion
- [ ] Visual: badge component (reusable) + grid layout inside expanded card
- [ ] Visual: badges Server / Status / Access wired to existing data + new heartbeat fields
- [ ] Visual: status dot column in list + last_seen relative time
- [ ] Visual: top bar `+ Add client` redesign (centered, larger)
- [ ] Smoke test: existing test.lego-base.online install → wait for next cron heartbeat (max 5min) → verify record in clients.json has lastSeen + operatorToken populated

### Phase 2 (separate session)

- [ ] Activity ingestion endpoint + client-side activity cron payload format
- [ ] `PUT /api/operator/files` + path whitelist
- [ ] `POST /api/operator/notify` endpoint + client-side badge surface
- [ ] `POST /api/operator/deploy` endpoint + no-fall app pattern integration (see no-fall spec)
- [ ] Staging save/list/diff/discard endpoints on iamrunning side
- [ ] Push endpoint with snapshot + atomic multi-PUT + deploy + auto-rollback
- [ ] History endpoint + rollback endpoint
- [ ] GitHub snapshot endpoint (admin proxy + client-side `git push origin main`)
- [ ] `iam-client.sh` `--client-github-repo` flag
- [ ] clients.json schema: `github_repo`, `github_pat` (encrypted), `github_branch`, `auto_snapshot_after_push`
- [ ] **Sandbox validation (§3.6)** — installer extension (parallel sandbox clone) + `/api/operator/push-to-sandbox` + `/api/operator/promote-sandbox` + admin-side orchestration. Budget: 2h. If it blows budget, revert to deploy-fallback-only flow.
- [ ] Visual: Dev Console embed in Files badge
- [ ] Visual: Updates badge (staging + push + history + Snapshot-to-GitHub + Auto-snapshot toggle + sandbox build status)
- [ ] Visual: Access badge editable fields for GitHub repo / PAT / branch
- [ ] Visual: Activity badge with polling
- [ ] Visual: Logs badge with tail

### Phase 3 (later)

- [ ] SSH terminal (separate spec)
- [ ] Token rotation
- [ ] Approval flow
- [ ] Danger zone actions (freeze, kill)
- [ ] Tripwire integration
- [ ] Billing badge wiring (when Stripe/PayPal lands)

---

## 9. Related documents

- Original concept (to be archived): `context-core/specs/OPERATOR_DASHBOARD_SPEC.md`
- Strategic architecture (skeleton + web installer + operator + tripwire): `iam-clients-os/source/ariels-workflow/specifications/OPERATOR_WEBINSTALLER_SKELETON_SPEC.md`
- Install validation that surfaced BUG #3 motivating this spec: `iam-clients-os/workspace/INSTALL_VALIDATION_2026-04-22.md`
- Server-side MCP toolset track (related — operator endpoints will benefit from typed MCP tools): `context-core/ariels-workflow/current-state/next-actions.md` §"Server-side MCP toolset expansion"

---

*Created: 23.04.2026 — drafted by Claude in chat with Ariel, agreed staging-buffer architecture + inline accordion visual.*
