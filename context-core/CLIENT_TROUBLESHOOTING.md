# Client Troubleshooting Playbook

> **Purpose.** When an IAM Client OS install breaks, this playbook maps error messages (as they appear in the operator UI) to exact `server_side_access` MCP commands that fix them. Designed so that even a free-tier LLM can follow this and unblock a client.
>
> **Prerequisites.** You are Claude on the iamrunning.online connector with the `server_side_access` tool available. You know the client's domain (e.g. `test.lego-base.online`) and install path (usually `/var/www/iam.<name>` — check `iam_clients_list` tool if unsure).
>
> **Update discipline.** When you hit a new failure mode, add it here with the fix you used.

---

## 0. Vocabulary

- **Client VPS** — the server where the IAM Client OS install lives. For now the same box as iamrunning.online (`94.176.238.108`), but future clients will be separate machines.
- **`$CLIENT_PATH`** — the install directory on the client, e.g. `/var/www/iam.test`.
- **`$CLIENT_PM2`** — the pm2 process name, e.g. `iam.iam-test-phase-2`. Find via `pm2 jlist` or the client's `ecosystem.config.js`.
- **`$CLIENT_DOMAIN`** — e.g. `test.lego-base.online`.

All commands below assume you're on iamrunning.online and use `server_side_access` to reach the client. For now both share this box, so "client commands" = bash on same host.

---

## 1. First 30 seconds when something's wrong

Always run this diagnosis block first. Copy-paste into one `bash_exec`:

```bash
echo "=== pm2 state ==="
pm2 jlist | jq -r '.[] | "\(.name)\t\(.pm2_env.status)\trestarts=\(.pm2_env.restart_time)\tuptime=\((now*1000 - .pm2_env.pm_uptime)/1000 | floor)s"'
echo
echo "=== health ==="
curl -s -o /dev/null -w "local HTTP=%{http_code}\n" --max-time 5 http://localhost:$CLIENT_PORT/
curl -sI --max-time 5 https://$CLIENT_DOMAIN/ | head -2
echo
echo "=== deploy lock ==="
ls -la $CLIENT_PATH/logs/.deploy.lock 2>&1 | head
echo
echo "=== last error log ==="
pm2 logs $CLIENT_PM2 --err --lines 15 --nostream --no-color 2>&1 | tail -20
```

Interpretation:
- `status=errored` or `restarts` growing fast → crash loop (§3)
- `HTTP=502` → upstream down, pm2 probably crashed (§3 or §4)
- `.deploy.lock` present with recent mtime → §2
- Error log mentions `Could not find a production build` → `.next` corrupted, §4

---

## 2. "Deploy already in progress (Xs ago). Wait and retry."

**Cause.** The client's `/api/operator/deploy` endpoint writes `logs/.deploy.lock` at the start of a deploy and deletes it in a `finally`. If the Node process crashed mid-deploy (OOM, SIGTERM, build failure taking down pm2), the lock never gets released. Next push returns HTTP 423 with this message for up to `MAX_DEPLOY_AGE_MS` = 5 minutes after the lock's mtime.

**Fix.**

```bash
# Force-release the lock
rm -f $CLIENT_PATH/logs/.deploy.lock
ls $CLIENT_PATH/logs/.deploy.lock 2>&1  # should say "No such file or directory"
```

Tell user: "Try pushing again." If it sticks again right after, there's a second process actually running (look at `pm2 logs $CLIENT_PM2` for live build output). Otherwise you're good.

---

## 3. "Deploy failed: Command failed: npm run build"

**Cause (most common).** Client's `.env.local` has `NODE_ENV=production` by design. When `npm run build` runs without `NPM_CONFIG_PRODUCTION=false` override, npm prunes devDependencies (typescript, @types/*, eslint) so Next.js can't resolve `@/` aliases. Build fails. `.next/` is erased or incomplete. pm2 enters crash loop with `Could not find a production build`.

**Fix — manual rebuild of the client:**

```bash
cd $CLIENT_PATH
NPM_CONFIG_PRODUCTION=false npm install --include=dev --no-audit --no-fund
NPM_CONFIG_PRODUCTION=false npm run build 2>&1 | tail -30

# If build succeeds:
pm2 restart $CLIENT_PM2 --update-env

# Verify:
sleep 8
pm2 jlist | jq -r '.[] | select(.name == "'$CLIENT_PM2'") | .pm2_env.status'
curl -s -o /dev/null -w "HTTP=%{http_code}\n" --max-time 10 https://$CLIENT_DOMAIN/
```

**Is the fix permanent?** If the error keeps coming back, verify the deploy endpoint has the env override. This was regression-fixed on 2026-04-23; the fix must be in `$CLIENT_PATH/app/api/operator/deploy/route.ts`:

```bash
grep -A3 "npm run build 2>&1" $CLIENT_PATH/app/api/operator/deploy/route.ts
```

Should show `env: { ...process.env, NPM_CONFIG_PRODUCTION: 'false', NODE_ENV: 'production' }`. If missing, patch it there AND in `iam-clients-os/source/app/api/operator/deploy/route.ts` (so new installs are safe).

**If build itself reports a real code error** — the user or a previous push broke the code. Find what changed:

```bash
cd $CLIENT_PATH
git log --oneline -5              # recent commits on client (usually just the install one)
git status --short                 # any uncommitted local mess
# The offending file is likely something that was just pushed. Try rolling back
# via the operator UI → History → Rollback to previous snapshot.
```

If UI rollback also fails (§4), do emergency manual rollback.

---

## 4. Client returns HTTP 502 (nginx but upstream dead)

**Cause.** pm2 process for the client is `errored` or stopped. nginx is fine; there's just nothing on the upstream port.

**Fix sequence:**

```bash
# 1. Check pm2
pm2 describe $CLIENT_PM2 --no-color | head -20
pm2 logs $CLIENT_PM2 --err --lines 30 --nostream --no-color

# 2. Most common — .next missing or broken (see §3 for rebuild)
ls $CLIENT_PATH/.next/BUILD_ID 2>&1   # If missing, rebuild
```

If rebuild isn't the fix, dig the error log. Typical failures beyond build:
- `Cannot find module …` → partial `npm install`, re-run `npm install --include=dev`
- `EADDRINUSE` → stale process still holding the port: `pm2 delete $CLIENT_PM2 && pm2 start $CLIENT_PATH/ecosystem.config.js`
- `Error: Cannot find '…ecosystem.config.js'` → the ecosystem file was broken; see §6

---

## 5. Rollback failures — "Aborted before upload: snapshot fetch X: HTTP 502"

**Cause.** The rollback needs to GET each file's current production state from the client before overwriting it (so a "pre-rollback snapshot" exists to roll forward). If the client is dead (HTTP 502), those GETs all fail and the rollback aborts.

**This is a paradox:** UI rollback requires a living client, but the user is trying to rollback *because* the client is broken.

**Fix — emergency rollback via server_side_access directly:**

1. First restore the client to a running state using §3 or §4.
2. THEN use UI rollback to roll content back to a known-good snapshot.

If UI rollback keeps failing even after the client is up (check `curl -sI $CLIENT_DOMAIN` returns 200), look at individual snapshot files on iamrunning:

```bash
ls /var/www/i_am_running/iam-clients-os/data/operator/snapshots/$CLIENT_ID/
# Each dir is a snapshot. Check the target one has the files it claims.
cat /var/www/i_am_running/iam-clients-os/data/operator/snapshots/$CLIENT_ID/<snap_id>/meta.json
```

If a snapshot's `meta.json` lists files that don't actually exist in that snapshot dir, the snapshot is corrupt — skip it, pick an older one.

**Alternative — direct file restore** (no UI, no push flow):

```bash
# Pick a file from a snapshot and copy it directly to client
SNAP_PATH=/var/www/i_am_running/iam-clients-os/data/operator/snapshots/$CLIENT_ID/<snap_id>
cp $SNAP_PATH/path/to/file.ts $CLIENT_PATH/path/to/file.ts

# Rebuild & restart
cd $CLIENT_PATH && NPM_CONFIG_PRODUCTION=false npm run build && pm2 restart $CLIENT_PM2
```

This bypasses push-flow entirely and works even when the push endpoint is broken.

---

## 6. `ecosystem.config.js` broken — pm2 survives on save-state

**Symptom.** Client is online. But if you ever cold-restart pm2 (reboot the box, `pm2 kill`, etc.), the client dies with `Error: Cannot find ecosystem.config.js` or a syntax error.

**Diagnose:**

```bash
cat $CLIENT_PATH/ecosystem.config.js | head
node -c $CLIENT_PATH/ecosystem.config.js 2>&1
# OR fully validate:
node -e "console.log(JSON.stringify(require('$CLIENT_PATH/ecosystem.config.js').apps[0]))"
```

**Fix if file is broken (e.g. accidental junk at top):**

```bash
node -e "
const fs=require('fs');
const f='$CLIENT_PATH/ecosystem.config.js';
const c=fs.readFileSync(f,'utf-8');
// Adjust the pattern below to match the junk you see
const cleaned = c.replace(/^this will not compile;;;\n+/,'').replace(/^garbage_pattern\n+/,'');
fs.writeFileSync(f, cleaned);
console.log('syntax:', JSON.stringify(require(f).apps[0].name));
"
```

After fix, don't touch pm2 — save-state is the current source of truth, overwriting the file doesn't require restart. On next cold restart it'll now load cleanly.

---

## 7. SSL / cert issues

Client's domain must have a valid cert for nginx to proxy HTTPS. If `https://$CLIENT_DOMAIN/` returns SSL errors:

```bash
# List certs
certbot certificates | grep -A5 $CLIENT_DOMAIN

# Issue a new one (only works if DNS points to this box AND port 80 is open)
# BUT FIRST check if a wildcard cert covers the domain already:
certbot certificates | grep -E "Domains:.*\*"
```

For `*.iamrunning.online` wildcard — clients under iamrunning.online subdomains are already covered.
For new client domains outside wildcards, issue per-domain:

```bash
certbot certonly --webroot -w /var/www/html -d $CLIENT_DOMAIN \
  -m ariel@...com --agree-tos --non-interactive
# Reload nginx if config references the new cert
nginx -t && systemctl reload nginx
```

---

## 8. Staging is "stuck" — keeps showing old pushes

**Cause.** The iamrunning staging dir for this client has leftovers.

```bash
ls /var/www/i_am_running/iam-clients-os/data/operator/staging/$CLIENT_ID/
# If you see files you didn't put there, clear them:
rm -rf /var/www/i_am_running/iam-clients-os/data/operator/staging/$CLIENT_ID/*
# But keep the dir itself intact — operator-store expects it to exist.
```

UI refresh → staging should be empty.

---

## 9. Client `.env.local` corrupted

Client needs specific env vars. If `pm2 logs $CLIENT_PM2` shows `OPERATOR_TOKEN` or similar as missing:

```bash
ls -la $CLIENT_PATH/.env.local
cat $CLIENT_PATH/.env.local | head -20   # Check keys are present
```

Keys typically needed: `OPERATOR_TOKEN`, `IAM_PROCESS_NAME`, `CLIENT_DOMAIN`, TOTP secret, others. Restore from backup if broken:

```bash
# Extract .env.local from the most recent full backup
tar -xzf /root/backups/pre-debug-*.tar.gz -C /tmp/restore \
  var/www/iam.test/.env.local
cp /tmp/restore/var/www/iam.test/.env.local $CLIENT_PATH/.env.local
chmod 600 $CLIENT_PATH/.env.local
pm2 restart $CLIENT_PM2 --update-env
```

---

## 10. Nuclear option — full restore from pre-debug backup

Works if the client is totally broken and nothing above helps.

```bash
# List available snapshots
ls -lh /root/backups/pre-debug-*.tar.gz

# Pick one. Extract just the client tree:
BACKUP=/root/backups/pre-debug-YYYY-MM-DD-HHMM.tar.gz
cd / && tar -xzf $BACKUP var/www/iam.test/   # or the right client path

# Now rebuild + restart
cd $CLIENT_PATH
NPM_CONFIG_PRODUCTION=false npm install --include=dev
NPM_CONFIG_PRODUCTION=false npm run build
pm2 restart $CLIENT_PM2 --update-env
```

Caveats:
- Only works if backup included the client (default: yes)
- Backup is typically < 24 hours old — recent commits after backup will be lost
- You'll also need to verify `.env.local` wasn't rotated since backup

---

## Appendix A — Finding client metadata

If you only know a domain or partial name:

```bash
# List all clients
curl -s http://localhost:3000/api/admin/iam-clients-os \
  -H "Cookie: $(cat /tmp/your-admin-cookie)" | jq .

# OR use the iamrunning MCP tool directly:
# Claude: iam_clients_list({ search: "test" })
```

From that record get: `id`, `domain`, `installPath`, `mode`, `port`. The client ID is what appears in snapshot / staging paths.

---

## Appendix B — When to escalate to Ariel vs. fix yourself

**Fix yourself without asking:**
- Stale deploy lock (§2) — safe, reversible
- Rebuild client (§3, §4) — just reconstructs what should be there
- Clear staging (§8) — only affects queued edits, nothing live
- Mirror a manual fix into `iam-clients-os/source/` — improves future installs

**Ask Ariel before doing:**
- Any `rm -rf` or massive write that touches client data outside the obvious garbage
- Changes to `.env.local` beyond restoring from backup
- Issuing new SSL certs (rate-limited by Let's Encrypt)
- Anything on production `iamrunning.online` that would cause restart during business hours

**Never do without explicit confirmation:**
- Delete snapshots (you might erase the only rollback anchor)
- Delete a client record from `clients.json`
- Overwrite a backup file
- Force-push any git repo

---

Last updated: 2026-04-23 by Claude, during the 2-day pre-release push.
