# ENGINEERING MEMORY

*Accumulated knowledge about this system. Things discovered, traps found, decisions made.*
*AI reads this before debugging to avoid re-discovering what's already known.*

---

## System notes

### How sessions work
- Each session starts with bootstrap prompt (bootstrap-prompts/)
- AI reads context-core/ files via MCP connection
- Key outputs are written back to context-core/ (CURRENT_GOAL, NEXT_ACTIONS, etc.)
- Context does NOT persist automatically — it must be explicitly saved

### MCP connection
- Claude: Settings → Connectors → Add → URL: `https://[CLIENT_SUBDOMAIN].iamrunning.online/api/mcp`
- ChatGPT: Apps → I AM RUNNING → OAuth flow

### Bootstrap prompt location
- Claude version: `bootstrap-prompts/claude-start.md`
- ChatGPT version: `bootstrap-prompts/chatgpt-start.md`

---

## Known quirks

*(Add discoveries here as they accumulate)*

---

## Decisions log

*(Record important decisions and why they were made)*

| Date | Decision | Reason |
|------|---------|--------|

---

## False hypotheses (already disproven)

*(Things that seemed right but weren't — saves time in future sessions)*

---

*Started: [INSTALL_DATE]*
