# SESSION HANDOFF — 16 April 2026 (GTM Launch Day)

## What Was Done

### Upwork
- Profile text finalized — title: "Custom Workflows via MCP | Local AI Workflows via Ollama"
- Full overview written (~3200 chars, MCP positioning)
- Original account SUSPENDED (verification camera bug) — Appeal submitted to Trust & Safety
- New account created but risky (double-account violates ToS)
- Decision: wait for Appeal, don't buy Connects on new account yet

### MCP Market Research
- Market: $4.5B (2025), 97M monthly SDK downloads, 5800+ servers
- Backed by: Anthropic, OpenAI, Google, Microsoft, AWS, Linux Foundation
- Simple MCP server: $4-15k, 2-4 weeks delivery
- IAM Client OS = ONLY turnkey MCP workflow for SMB — no competitor
- SMB niche completely empty — all players target enterprise

### MCP-as-a-Service Concept (NEW)
iamrunning.ai (Electron + Ollama + fine-tuned model) becomes MCP PROVIDER.
Web clients running iam-client-os connect as MCP CLIENTS through tunnel.
They get: fine-tuned inference, specialized tools, shared RAG knowledge.
Full spec in chat transcript — search "ДОКУМЕНТ 2: СПЕКА ДЛЯ КУРСОРА".

### LinkedIn
- Profile set up — headline, about, experience, services section
- Hebrew DM templates for Gilad Shoham (MCP/n8n community leader, 11.5k followers) and Leon Mulumud (MCP Israel co-founder, 8k followers)
- Strategy: thoughtful comments on influencer posts + DMs asking for advice

### Other Channels
- Reddit account exists (1yr old), strategy: engagement marketing in r/mcp r/LocalLLaMA r/ClaudeAI
- Gmail iamrunning.online@gmail.com secured for cold email (10/day pace)
- YouTube strategy: find small AI/automation channels (500-10k subs), offer free access for testing/review
- Facebook: Israeli tech groups identified (Israeli Startups, AI Israel, Israeli Developers)
- Upwork/Fiverr as contact DATABASE: find AI freelancers, get their LinkedIn, write as peer outside platform
- Fiverr REJECTED as sales channel — race to bottom with $90 Indian devs

### Evolution Document
- Blocks 192-197 written (artifact in chat, NOT on server)

---

## CRITICAL BUGS FOUND

### BUG 1: File Delete Not Working in Dev Console
- Location: demo.iamrunning.online (and likely lego-base too)
- Symptom: Right-click file → Delete → file disappears from view but stays in file tree
- Confirmed: Super Admin role, full permissions
- Impact: CRITICAL — basic functionality broken, visible in client demos

### BUG 2: Build Error After Git Rollback on demo.iamrunning.online
```
./app/api/admin/totp-test-flow/route.ts:14:10
Type error: '"@/lib/admin/totp-secret"' has no exported member named 'setTestTotpSecret'.
```
- Cause: totp-test-flow/route.ts imports setTestTotpSecret, getTestTotpSecret, clearTestTotpSecret from @/lib/admin/totp-secret — but those functions don't exist in that module
- This happened after rolling back to an older commit on demo server
- Fix needed: either add those exports to totp-secret.ts, or delete totp-test-flow/route.ts (it's a test page, not needed for production)
- RECOMMENDED FIX: delete app/api/admin/totp-test-flow/ directory — it was a test endpoint, not needed in client installs

### BUG 3: install.sh Deploy Issues
- File deletion doesn't work (related to Bug 1?)
- Needs deeper investigation

### BUG 4: GitHub History Visible in Client Install
- After install.sh clone, full git history with all dev commits is visible
- Client can see all Ariel's development commits
- GitHub token/access to production repo may be accessible
- CRITICAL privacy/security issue

---

## CRITICAL MISSING FEATURES

### MISSING 1: Client GitHub Repo Strategy
Problem: install.sh clones from ArielGrook/iam-client-os (production repo). Client sees all commits, client changes go to production repo.
Need:
1. Client-specific GitHub repos (ArielGrook/client-{name} or client's own)
2. Git remote switch after install to point to client repo
3. GitHub token field in Admin Panel → Settings
4. GitHub features only appear after token configured

### MISSING 2: Supabase Integration Never Tested
- No code to create tables on connection
- No handling of existing client databases
- Question: does v1 even NEED Supabase? System runs on file-based JSON storage

### MISSING 3: Environment Settings Section in Admin Panel
Need collapsed/locked section containing: GitHub token, Supabase keys, API keys.
GitHub features only appear after GitHub token configured.

### MISSING 4: Demo Viewer Account
Need read-only admin on demo.iamrunning.online for cold outreach demos.
Permissions: only read operations, all write disabled.

### MISSING 5: Web-Based Installer (Future)
Idea: iamrunning.online/install → form with domain/IP/SSH → server connects via ssh2 and runs install.sh automatically.
NOT a blocker for first client — first client gets manual install. Needed when 5+ clients.

### MISSING 6: install.sh Should Not Require GitHub
Currently install.sh clones from GitHub. Alternative: host install package on iamrunning.online, download via curl without GitHub token. Simpler for clients.

---

## DECISIONS MADE

1. Fiverr REJECTED — wrong market
2. Upwork second account — NOT recommended, wait for Appeal
3. Primary channels: LinkedIn + YouTube + Facebook + Email + Reddit
4. Beta pricing ($300-500) ONLY in private DMs, never public
5. Public positioning: professional AI systems developer
6. Gooner = test account, NOT real person
7. iamrunning.online landing redesign — NOT NOW
8. Any client from any channel → route through Upwork for review/trust
9. Gmail cold email pace: 10/day (realistic), not 20-30
10. YouTube target: not just MCP channels — ANY digital/AI/automation/no-code channels

---

## GTM CHANNELS (Priority Order)

1. LinkedIn DMs — Israeli AI influencers + global MCP community
2. YouTube — small AI/automation channels, offer free access for testing/review
3. Cold email — 10/day via iamrunning.online@gmail.com
4. Facebook — Israeli tech groups
5. Reddit — engagement marketing in r/mcp r/LocalLLaMA r/ClaudeAI
6. Upwork — monitor Appeal, use as trust/review platform
7. Upwork/Fiverr — contact database (find freelancers, write via LinkedIn)
8. Russian market — Habr Freelance + Telegram (low priority, free parallel channel)

---

## PRICING

- Beta (DMs only): $300-500 setup, free usage for feedback
- After beta (4-5 clients): $1,500-3,000+ setup
- Market context: simple MCP servers sell $4-15k with 2-4 week delivery
- MCP-as-a-Service (future): $29-99/month subscription tier

---

## NEXT ACTIONS

### Immediate (today):
1. Fix file delete bug
2. Fix build error on demo server (delete totp-test-flow or add missing exports)
3. Send LinkedIn DMs (Hebrew) to Gilad Shoham + Leon Mulumud
4. Create demo viewer account on demo.iamrunning.online
5. Find 5-10 YouTube channels covering AI/automation/MCP, DM them

### This week:
6. LinkedIn: 10 more connection requests to AI/MCP people
7. LinkedIn: first English post about MCP workflow system
8. Facebook: join Israeli tech groups, engage
9. Reddit: warm account with comments, then post in r/mcp
10. Cold email: start 10/day to YouTube creators + LinkedIn contacts
11. Fix install.sh issues thoroughly
12. Design client GitHub repo workflow

### Before second client:
13. Client GitHub repo strategy implemented
14. Environment Settings in Admin Panel
15. Decide Supabase: v1 or Phase 2?
16. Web-based installer concept (or simpler curl-based install)
17. iamrunning.online landing redesign for IAM Client OS

---

## KEY INSIGHTS

- MCP market $4.5B, 34.6% CAGR. SMB niche EMPTY. First-mover advantage.
- YouTube small channels = best beta tester source (they need content, technical, respond to DMs)
- Any client found anywhere → route through Upwork → builds review history
- Pitch for non-technical channels: "AI workflow system" not "MCP server implementation"
- Upwork/Fiverr = contact database, not sales platform (find freelancers, contact via LinkedIn)
- install.sh needs rethinking — web-installer or curl-based, not GitHub-dependent
- Gmail 10/day = 300/month = 3-9 real conversations at 1-3% conversion
