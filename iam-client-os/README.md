# iam-client-os

**AI Native Business Operating System — by I AM RUNNING**

A standalone, isolated Next.js application deployed per client on a dedicated VPS.
Each client gets their own server, domain, and AI-connected workspace.

---

## What this is

A minimal AI business OS. The client gets:
- A landing page with onboarding instructions
- An admin panel (file manager + git)
- An MCP endpoint that connects Claude to their context-core
- Persistent context-core docs (goals, progress, next actions)

No website builder. No CRM. No bloat. Just AI + memory + workflow.

---

## Architecture

```
Client's VPS (Hetzner CX22, ~€4/mo)
├── Next.js app (this repo) — port 3000
├── Nginx — SSL termination, proxy
├── PM2 — process management
└── context-core/ — client's persistent memory
         ↑
         └── Claude reads/writes via MCP connector
```

---

## Installation (fresh VPS)

```bash
curl -fsSL https://raw.githubusercontent.com/ArielGrook/iam-client-os/main/install.sh | sudo bash
```

Or clone and run:
```bash
git clone https://github.com/ArielGrook/iam-client-os.git
sudo bash iam-client-os/install.sh
```

Takes ~10 minutes. Sets up everything: Node, PM2, Nginx, SSL, app.

---

## Manual setup (development)

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

---

## MCP Connection

After installation, connect Claude:
1. `claude.ai` → Settings → Connectors → Add connector
2. URL: `https://your-domain.com/api/mcp`
3. Complete OAuth
4. Paste `bootstrap-prompts/claude-start.md` to start every session

---

## Pricing model (for clients)

| Item | Price |
|------|-------|
| Setup fee | $500–2000 |
| Monthly (server + support) | $200–500/mo |
| Server cost (Hetzner CX22) | ~€4/mo |

---

## Built by

[I AM RUNNING](https://iamrunning.online) — AI-native platform for business solutions.
