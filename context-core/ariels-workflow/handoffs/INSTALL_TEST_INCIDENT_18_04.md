# Install Test Incident — 2026-04-18 evening

**Status:** Stage 2 complete. Stage 3 (test install) aborted mid-setup. No data lost. Dev server recovered. Tokens need rotation.

---

## What happened

We planned Stage 3 (test install of new iam-client.sh on lego-base).

Ariel asked: "why do I need a new server, use lego-base". Correct. I suggested stopping dev PM2 process to "prepare" — this was wrong, not needed. Ariel executed `pm2 delete iam-os` and snipped crons. Dev went down.

Started installer setup but hit the architectural question: does installing on the same server as dev break dev? I changed position and said use a fresh subdomain (`iam-test.lego-base.online`) with isolated path/port. Ariel correctly pointed out that installer overwriting nginx config is bad even theoretically and asked this be fixed at principle level. I agreed and started writing wisdom/PATTERNS.md when MCP connector failed.

While trying to recover dev:
- `pm2 start npm --name iam-os -- start` — launched from `/var/www/` (wrong cwd), captured as permanent process cwd
- Process entered crash-restart loop (ENOENT on `/var/www/package.json`)
- Multiple next.js instances flapping on port 3000, nginx returning 502
- Fixed by `pm2 delete iam-os && pm2 start ecosystem.config.js` from `/var/www/iam-os/`
- Dev recovered, HTML served, PM2 stable

Test install was never executed. Server is in pre-test state but healthy.

---

## Current server state

```
/var/www/iam-os/                      dev repo, PM2 iam-os online
/var/www/iam.client                   does not exist (was never created)
/root/skeleton                        scratch clone of skeleton (can rm -rf, no longer needed)

nginx sites-enabled:
  - iam.demo.iamrunning.online        (remote demo server, not this machine, don't touch)
  - iam-os                            (serves test.lego-base.online → 127.0.0.1:3000 → dev repo)

PM2: iam-os online, id=0, no flapping
```

No leftover state from aborted install — installer never ran.

---

## Pending before next session runs Stage 3

### 1. Rotate GitHub tokens

Both leaked in chat earlier today:
- `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` (classic, full access, used for skeleton clone)
- `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` (fine-grained, Contents R+W on iam-client-skeleton, used as SKELETON_PUSH_TOKEN)

Plus these two were also shared:
- `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` (iam-client-os repo access)
- `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` (IAM_RUNNING- repo)

Go to github.com/settings/tokens → revoke all four → create replacements:
- **Fine-grained PAT for sync**: Contents R+W on `iam-client-skeleton` only. Export as `SKELETON_PUSH_TOKEN`.
- **Classic ghp_ for general use**: `repo` scope. Use for `git push origin main` and for cloning skeleton in future test installs.

### 2. Check DNS for test subdomain

If `iam-test.lego-base.online` A-record was created during earlier aborted attempt, keep it pointing at 185.5.55.111 (DNS only, grey cloud). If not created yet — create it before next session.

```bash
dig +short iam-test.lego-base.online   # should return 185.5.55.111
```

### 3. Delete scratch clone (optional)

```bash
rm -rf /root/skeleton
```

Not strictly needed, it's just leftover. Next session will re-clone with fresh PAT anyway.

---

## What's ready for Stage 3 (unchanged from plan)

### Installer command (uses new rotated classic PAT):

```bash
# Fresh clone in neutral location
git clone https://<NEW_CLASSIC_PAT>@github.com/ArielGrook/iam-client-skeleton.git /root/skeleton

# Run installer — fresh subdomain, fresh path, fresh port, does NOT touch dev
cd /root/skeleton
bash scripts/iam-client.sh \
  --domain=iam-test.lego-base.online \
  --name="IAM Test" \
  --github-token=<NEW_CLASSIC_PAT> \
  --path=/var/www/iam.test \
  --port=4742
```

### 11-point verification checklist (after install)

Open `https://iam-test.lego-base.online/iam.admin`:
1. TOTP first-run page visible (not regular login)
2. TOTP setup works end-to-end (QR scan, first code, lands in Admin Panel)
3. Admin Panel loads all tabs (Dashboard, Team, Goals, Pull Pool, Messages, Dev Console, Logs, Settings)
4. Settings → MCP Token → Generate New → visible once → copy
5. Claude: Settings → Integrations → Add MCP Server `https://iam-test.lego-base.online/api/mcp` + `Bearer <token>` → connects
6. In Claude: "Read memory" → returns clean templates (ARCHITECTURE empty, CURRENT_GOAL "Set up workspace")
7. Add user via Admin → Team → generate token → login to `/dashboard` in incognito
8. File Delete on a file in Admin Dev Console → file disappears (regression check for 17.04 fix)
9. File Delete on a folder → folder disappears
10. Push notifications: enable in Dashboard → Setup → send message → push arrives
11. Deploy button in Admin → Logs → triggers → `logs/deploy.jsonl` gets entry

---

## Wisdom extracted (already in memory/wisdom/SESSION_INSIGHTS.md via handoff)

### Multi-install coexistence is a first-class requirement
Several IAM installations should be able to run on the same physical server simultaneously without conflict. Each install has:
- Own `--path` (different install directory)
- Own `--port` (different app port)
- Own `--domain` (different subdomain, generates unique nginx config filename `iam.<domain>`)
- Own PM2 process name (`iam.<client-name>`)
- Own TLS cert via certbot (certbot issues per-domain, no collision)

Verification rule when touching installer: ask "if two IAM installs run on same server, what resource do they fight over?" Any shared resource = bug.

### PM2 with `pm2 start npm -- start` captures PWD as permanent cwd
This bit us today. Always use `ecosystem.config.js` with explicit `cwd:` field, or pass `--cwd /absolute/path` to pm2 start. Otherwise PM2 takes current PWD, which is whatever shell you ran from, and every restart uses that — fatal if wrong.

### When MCP connector starts erroring mid-session → save handoff immediately
Don't try to keep going. Context degradation in long chats is real. Save state via `tasks action session_handoff`, continue in fresh chat with `read_memory`. Today I took 3 extra turns diagnosing a simple cwd issue because I was already drifting.

### For testing installer on an active dev server
Never touch dev. Always use a fresh subdomain + fresh path + fresh port. The whole point of multi-install coexistence is that this works. Don't delete dev's PM2, don't remove dev's nginx config, don't reuse dev's domain.

---

## For whoever reads this in the next session

1. `read_memory` first — session state is fresh, next_actions has the plan
2. Read this file for incident context
3. Verify dev is still up: `pm2 list` should show iam-os online
4. Do the token rotation (Ariel's task, not yours)
5. Stage 3 install steps are above — the plan is solid, just execute on a fresh subdomain without touching dev

Stage 2 code is done and committed (054c5ae + 3b544b5). Skeleton has the new iam-client.sh. Everything is in place for Stage 3.
