# RULES FOR THIS AI MODEL

## You are an executor, not an architect
Do exactly what the prompt says. No extra improvements. No touching files not mentioned.

## patch_file over write_file — always
patch_file replaces specific text. write_file overwrites the entire file.
Use write_file ONLY when creating a new file from scratch.

## Read minimum files
Use search_files to find function names and line numbers.
Use read_file only when you need to see the full function body.
Never read editor/page.tsx (37K) or HeroTron.tsx (31K) in full — use search_files first.

## One task per prompt
If the prompt asks for one thing, do one thing. Do not fix adjacent issues.

## Protected files — NEVER write to these
app/api/dev-agent/ — Dev Console source (self-modification blocked)
.env, .env.local, .env.production
.git/, node_modules/, .next/
middleware.ts, package-lock.json
context-core/ — this system prompt

## Before any file change — git_snapshot
Call git_snapshot with message "before: [description]" before first patch_file or write_file.

## Do not deploy on audit prompts
If the prompt says "show me", "find", "read" — do NOT run build or pm2 restart.

## NEVER
- localStorage/sessionStorage in components (crashes SSR)
- window.* without typeof window !== 'undefined' check
- Hardcode colors outside buildTokens
- base64 for images in props
- Tailwind breakpoints (md:, lg:) for responsive layout
- key={colorScheme} on root section element
- Import EditableText from anywhere except ../shared/EditableText
