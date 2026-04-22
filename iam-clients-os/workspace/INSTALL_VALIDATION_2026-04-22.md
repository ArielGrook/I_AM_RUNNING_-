# Install Validation — 2026-04-22

Session goal: first real install of iam-client.sh via Web Installer on iamrunning.online infrastructure. Walk through 11-point checklist from INSTALL_TEST_INCIDENT_18_04.md.

---

## Test context

**Domain:** `lego-base.online` (Ariel's currently-unused apex domain, empty DNS). Proposed subdomain for install: `test.lego-base.online` — keeps apex free for parallel test installs.

**Server IP:** `94.176.238.108` (iamrunning.online prod server — same box hosts test install on port 4742, isolated path `/var/www/iam.test`).

**Test GitHub repo:** `ArielGrook/alexs-Take-Go.Co-iam-clients-os` — burn-after-test. Not strictly required for installer (default skeleton `ArielGrook/iam-client-skeleton` is what gets cloned), but fixed here for reference.

**Test GitHub PAT:** `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` — classic, no-expiry, tester-only. Ariel flagged: this is intentionally perpetual because we have no rotation UX yet. Will be revoked after validation along with the repo.

---

## Findings

### FIXED — WebInstaller UI: no DNS setup instructions

**Symptom:** Operator picks a domain in WebInstallerTab but nowhere in the UI does it say "you must first create an A record pointing at our server IP, otherwise certbot fails silently and monitoring registration is a black hole."

**Root cause:** Original Web Installer assumed the operator already knew the networking prereqs.

**Fix:** Added DNS hint block under the Domain input in `app/[locale]/admin/iam-clients-os/WebInstallerTab.tsx` — shows required IP (`94.176.238.108`), collapsible Namecheap + Cloudflare step-by-step, `dig +short <domain>` verification command with live interpolation. Also appears in "Next steps" panel after generate.

**Commit:** `b7c7cdc`. Deployed to iamrunning.online.

---

## Backlog (deferred, not this session)

### Token rotation mechanism — architectural

**Issue:** Web Installer accepts a GitHub PAT but we have no way to update it once install is done. If the PAT leaks or expires, the operator has to SSH to each client VPS and manually edit `.env.local` + PM2 restart. At scale this is unworkable.

**Proper fix** (operator role, next session): one-click rotation flow from admin panel → sends new PAT to `POST https://<client-domain>/api/operator/rotate-token` with OPERATOR_TOKEN auth → client-side script updates `.env.local` + `pm2 delete && pm2 start ecosystem.config.js` → returns success/failure. Same pattern applies to any env var that needs server-side replacement (encryption keys, VAPID, admin session secret). UI: a "Rotate credentials" section in Client Projects tab.

**Impact now:** we accept that this test install uses a perpetual PAT. When Ariel kills the test, he revokes the token + deletes the repo manually — no rotation flow needed for throwaway.

### Solo mode still in WebInstallerTab select dropdown

`mode: 'team' | 'solo'` picker still exists in `WebInstallerTab.tsx` line ~260. Per userMemories, solo mode is deprecated in UI (poorly tested, kept in code for future lower-budget tier). Clean up as part of pre-outreach polish pass, not today.

---

## 11-point checklist (pending DNS + install)

1. [ ] TOTP first-run page visible
2. [ ] TOTP setup end-to-end (QR → first code → Admin Panel)
3. [ ] Admin Panel loads all tabs
4. [ ] Settings → MCP Token → Generate
5. [ ] Claude.ai MCP connect + 200 OK
6. [ ] `Read memory` returns clean templates
7. [ ] Add worker via Team → generate token → login in incognito
8. [ ] File Delete on file (regression 17.04 fix)
9. [ ] File Delete on folder
10. [ ] Push notifications enable → push arrives
11. [ ] Deploy button → `logs/deploy.jsonl` entry

---

## Commits this session

- `b7c7cdc` — `feat(web-installer): add DNS setup hint block under Domain field (Namecheap/Cloudflare steps + dig verify + IP 94.176.238.108)`
