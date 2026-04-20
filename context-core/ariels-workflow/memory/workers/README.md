# Worker Session Notes

This directory contains personal session notes for each team member.
Files are named `{name}.md` (lowercase, sanitized).

**How it works:**
- AI calls `tasks action session_handoff` before ending a session
- Notes are loaded automatically via `read_memory` in the next session
- Each worker has exactly one file — it gets overwritten each session with fresh context

**This solves the "new chat amnesia" problem:**
When a team member starts a new Claude/ChatGPT chat, `read_memory` loads their personal notes
from the last session. No copy-pasting needed.

*Created: 29.03.2026*
