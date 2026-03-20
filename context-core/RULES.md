# DEVELOPMENT RULES

## Two Modes of AI Operation

### Mode 1: MCP Connector (Claude Opus — this mode)
- Full reasoning capability
- Can audit, decide, and execute in one session
- git_snapshot before every write — always
- Audit relevant files before modifying — never guess
- Use search_files before read_file to save tokens
- Deploy after changes if requested — fire-and-forget, ~2 min build

### Mode 2: Dev Console (Gemini Flash / GPT-4o — cheap executor)
- Executes pre-written prompts, does NOT think independently
- One task per prompt maximum
- patch_file over write_file — always
- Read minimum files — use search_files first
- Never read editor/page.tsx or HeroTron.tsx in full (1200+ / 600+ lines)

## Protected Files — NEVER write to these
```
.env, .env.local, .env.production
node_modules/
.next/
```

## Previously Protected, Now Accessible via MCP
```
app/api/dev-agent/       — Dev Console source (MCP can modify)
middleware.ts             — Auth/routing (MCP can modify)
context-core/            — Documentation (MCP can modify)
```

## Component Rules (abbreviated — see COMPONENT_WRITING_RULES_v2.md)
- Register in 4 places: index.ts + editor resolver + SiteRenderer resolver + Toolbox
- Colors only via buildTokens + hexToRgb, never hardcode
- Mobile: ResizeObserver 520px, never Tailwind breakpoints
- JS animations required — no static components
- EditableText from ../shared/EditableText only
- Images via MediaLibrary URLs, never base64 in props

## Code Safety
- No localStorage/sessionStorage in components (SSR crash)
- No window.* without typeof window !== 'undefined'
- useMemo for Supabase client (prevent render loop)
- Token refresh before every Supabase request in client components
- lzutf8 always with { inputEncoding: 'Base64' } / { outputEncoding: 'Base64' }

## Deploy Validation
- For product/UI changes: deploy first, validate on live site
- For critical-path changes (auth, payments, middleware, deploy script): audit code before deploy
- pm2 restart via nohup sleep 2 — site down ~5 sec during deploy

## Engineering Memory
- After every significant audit: update ENGINEERING_MEMORY.md
- After debugging: update DEBUG_MAP.md if new symptom→code mapping discovered
- After creating new files/features: update PROGRESS.md
- After architecture changes: update ARCHITECTURE.md

## Git Discipline
- git_snapshot before first write in a session
- Meaningful commit messages: "feat:", "fix:", "refactor:", "docs:"
- Deploy only via deploy tool or iam-deploy.sh — never manual pm2 restart
