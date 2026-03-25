# BUSINESS SOFTWARE PROTOTYPE — Build Plan
## AI Native Integrated Business Software — Technical Spec
*25.03.2026 — active implementation document*

---

## What we're building right now

First working installation of the AI Native Business OS for a real client (Grisha).
System: `gooner.lego-base.online` — Grisha's AI-connected business environment.

---

## Architecture: Option A — Single PM2, X-Client-Slug routing

```
iamrunning.online → pm2: i-am-running (port 3000) → YOUR product
gooner.lego-base.online → same pm2, same port → Grisha's system
client2.lego-base.online → same pm2, same port → Client 2's system
```

**Nginx per client (gooner.lego-base.online):**
```nginx
server {
  server_name gooner.lego-base.online;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header X-Client-Slug "gooner";
    proxy_set_header Host $host;
    # ... standard proxy headers
  }
}
```

**middleware.ts addition:**
```typescript
// Before intlMiddleware:
const clientSlug = request.headers.get('x-client-slug');
if (clientSlug) {
  // Client domain — no i18n, serve client pages
  // Pass slug via header to pages/API routes
  const response = NextResponse.next();
  response.headers.set('x-client-slug', clientSlug);
  return response;
}
// else: normal i18n routing for iamrunning.online
return intlMiddleware(request);
```

**MCP server (lib/mcp-server/index.ts) — read from client context-core:**
```typescript
// Each MCP request carries Authorization header with client's token
// Token maps to client slug → loads /var/www/iam-clients/SLUG/context-core/
const clientSlug = getSlugFromToken(mcpAuthToken); // lookup table in config
const contextCorePath = `/var/www/iam-clients/${clientSlug}/context-core`;
```

---

## File structure per client

```
/var/www/iam-clients/
  gooner/
    context-core/           ← Grisha's business memory (8 docs)
      SYSTEM_IDENTITY.md
      CURRENT_GOAL.md
      IDEAS.md
      MVP_BRIEF.md
      NEXT_ACTIONS.md
      WEEKLY_PROGRESS.md
      ARCHITECTURE.md
      ENGINEERING_MEMORY.md
    bootstrap-prompts/
      claude-start.md
      chatgpt-start.md
    .env                    ← MCP_AUTH_TOKEN (unique per client)
    .dev-agent-config.json  ← mcpAuthToken
```

---

## install-client.sh — Option A rewrite

New logic (no PM2):
1. Collect client info (name, slug, domain)
2. Generate unique MCP token
3. Create `/var/www/iam-clients/SLUG/` with context-core from template
4. Register token → slug mapping in server config
5. Write Nginx config for client domain
6. Reload Nginx
7. Print: MCP URL + token + bootstrap prompts location

---

## Client onboarding page

`gooner.lego-base.online/` shows:
- What this system is (1 paragraph)
- How to connect Claude: Settings → Connectors → `gooner.lego-base.online/api/mcp`
- How to connect ChatGPT: Apps → `gooner.lego-base.online/api/mcp-gpt`
- Bootstrap prompt to paste at start of each session
- No login required for onboarding page

---

## MCP token → client routing

Each client gets unique MCP_AUTH_TOKEN.
Main MCP server needs to know which context-core to load based on token.

Option 1 (simplest): store `{token: slug}` mapping in `/var/www/iam-clients/_tokens.json`
Option 2: each client token IS their slug encrypted
Option 3: separate MCP endpoint per client at `/api/mcp/[slug]`

**Decision: Option 1** — simple JSON lookup, loaded at request time, no rebuild needed.

---

## What Grisha sees on day 1

1. Opens `gooner.lego-base.online` — sees clean onboarding page
2. Opens Claude.ai → Settings → Connectors → adds his MCP URL
3. Pastes bootstrap prompt in new Claude chat
4. Claude reads his context-core → knows his business goals
5. They work together → Claude updates docs → next session continues

That's the product. No embedded chat. No complex UI.
The value is the connected memory, not the interface.

---

## Pricing for first clients

| Package | Price | What's included |
|---------|-------|----------------|
| Setup | $500-1000 (pilot rate) | Installation + context-core setup + onboarding |
| Monthly | $200-300 (pilot rate) | Uptime + 1 support session + updates |
| Normal setup | $1000-2500 | Full installation |
| Normal monthly | $300-600 | Full support |

First 2-3 clients at pilot rate → case studies → raise price.

---

## Success criteria for prototype

- [ ] `gooner.lego-base.online` loads onboarding page
- [ ] Claude MCP connects to `gooner.lego-base.online/api/mcp`
- [ ] Claude reads Grisha's CURRENT_GOAL.md via read_file tool
- [ ] Claude writes to Grisha's context-core (NEXT_ACTIONS.md update)
- [ ] Grisha can start a new Claude session, paste bootstrap prompt, continue work

When all 5 are green — prototype is done and can be sold.
