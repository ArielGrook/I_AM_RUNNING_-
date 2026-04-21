# INSTALL.md — Founder Installation Guide

*How to install a new client instance of the AI Native Business OS.*
*Read this before every new installation.*

---

## Prerequisites (one-time setup)

These must be done once on the server before installing any clients:

- [ ] Wildcard SSL cert covers `*.iamrunning.online`
- [ ] `/var/www/iam-clients/` directory exists: `mkdir -p /var/www/iam-clients`
- [ ] `product-template/` is in the main project at `/var/www/i_am_running/product-template/`
- [ ] PM2 is running the main i-am-running process
- [ ] Nginx wildcard subdomain config is working

---

## Installation steps

### 1. SSH into server
```bash
ssh root@YOUR_SERVER_IP
```

### 2. Run installation script
```bash
cd /var/www/i_am_running
sudo bash product-template/install-client.sh
```

Follow the prompts. Takes about 5 minutes.

### 3. Fill in Supabase keys
After the script finishes, open the client's `.env`:
```bash
nano /var/www/iam-clients/CLIENT_SLUG/app/.env
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

**Option A — shared Supabase (simpler):** use the same Supabase project as the main I AM RUNNING app. Client gets their own user account and projects table rows.

**Option B — dedicated Supabase (more isolated):** create a new Supabase project for this client. Better privacy, more setup.

### 4. Rebuild and verify
```bash
cd /var/www/iam-clients/CLIENT_SLUG/app
npm run build && pm2 restart iam-CLIENT_SLUG
```

Wait 30 seconds, then test:
```bash
curl https://CLIENT_SLUG.iamrunning.online
```

Should return HTML. If 502, check:
```bash
pm2 logs iam-CLIENT_SLUG --lines 20
```

### 5. Set up client's AI connection

**Claude:**
1. Log into the client's Claude.ai (either their account or yours during setup)
2. Settings → Connectors → Add connector
3. URL: `https://CLIENT_SLUG.iamrunning.online/api/mcp`
4. Complete OAuth flow
5. Test: ask Claude to `read_file("context-core/SYSTEM_IDENTITY.md")`

**ChatGPT:**
1. Log into client's ChatGPT
2. Settings → Connected Apps → Add
3. URL: `https://CLIENT_SLUG.iamrunning.online/api/mcp-gpt`
4. OAuth Client ID: `iamrunning-chatgpt-mcp`
5. Complete flow

### 6. Onboard the client (30 min session)

Run an onboarding session with the client:

1. Show them how to open Claude/ChatGPT
2. Show them the bootstrap prompt (`bootstrap-prompts/claude-start.md`)
3. Walk through first session: fill in CURRENT_GOAL.md and NEXT_ACTIONS.md together
4. Show them that context saves between sessions
5. Give them the client handoff doc (see below)

---

## Client handoff — what to give them

Send this to the client after installation:

```
Hi [NAME],

Your AI business operating system is live at: https://CLIENT_SLUG.iamrunning.online

How to use it:

1. Open Claude (claude.ai) or ChatGPT (chatgpt.com)
2. Make sure the I AM RUNNING connector is enabled
3. Start every session by pasting this prompt:
   [PASTE CONTENTS OF bootstrap-prompts/claude-start.md]

That's it. The AI will read your current goals and context,
and you can start working immediately.

Your system remembers everything between sessions — as long as you
ask the AI to update the docs before ending a session.

Questions? Contact me at: [YOUR EMAIL/WHATSAPP]
```

---

## Monitoring installed clients

List all running client processes:
```bash
pm2 list | grep iam-
```

Check a specific client's logs:
```bash
pm2 logs iam-CLIENT_SLUG --lines 50
```

Restart a client instance:
```bash
pm2 restart iam-CLIENT_SLUG
```

List all client directories:
```bash
ls /var/www/iam-clients/
```

---

## Pricing reference

| Package | Price | What's included |
|---------|-------|----------------|
| Setup fee | $500–2000 | Installation + context-core setup + onboarding |
| Monthly support | $300–500/mo | System uptime, updates, 1 support session/month |
| Context-core buildout | +$300 | Deep documentation of client's existing business/tech |
| Integration extra | +$500 | Connecting client's existing tools or codebase |

---

## Uninstall / offboard a client

```bash
# Stop PM2 process
pm2 delete iam-CLIENT_SLUG

# Remove nginx config
rm /etc/nginx/sites-enabled/CLIENT_SLUG.iamrunning.online
rm /etc/nginx/sites-available/CLIENT_SLUG.iamrunning.online
nginx -s reload

# Archive client files (don't delete immediately)
mv /var/www/iam-clients/CLIENT_SLUG /var/www/iam-clients/_archived/CLIENT_SLUG_$(date +%Y%m%d)
```

---

## Troubleshooting

**502 Bad Gateway**
→ PM2 process crashed. Check: `pm2 logs iam-CLIENT_SLUG --lines 30`
→ Usually: missing .env keys or failed build

**MCP connector can't connect**
→ Check SSL cert covers the subdomain
→ Check nginx config: `nginx -t`
→ Check process running: `pm2 list`

**Claude says "no tools available"**
→ OAuth flow may have expired. Re-authorize connector in Claude settings.

**Context-core files not updating**
→ GPT_MCP_SECRET or MCP_AUTH_TOKEN not set in .env
→ Rebuild after adding: `npm run build && pm2 restart iam-CLIENT_SLUG`
