# Notes Feature — Locked Spec

Owner: Ariel  
Implementation model: Sonnet 4.6 (3-4 sessions)

## Vision

Obsidian-style notes app inside `iamrunning.online`, first for operator workflow, then extrapolated into IAM Client OS as a free adoption hook. Core positioning: self-hosted ownership, no SaaS lock-in.

## Storage Architecture

Filesystem-first, Obsidian-compatible:

`/var/www/i_am_running/storage/notes/{user_id}/`

- `notes/{note-uuid}.md`
- `attachments/{note-uuid}__filename.ext`
- optional `_index.json` (post-MVP cache)

Each note stores markdown + YAML frontmatter with fields:
`id`, `title`, `color`, `tags`, `pinned`, `created`, `updated`, `attachments`.

## File Support

- `.md`: native note format, parse/write frontmatter.
- `.txt`: convert to markdown wrapper and save as `.md`.
- `.pdf`: keep in attachments and embed markdown link; inline read-only render.
- Images (`.png/.jpg/.webp`): MVP bonus embed path.

Limits:
- 50MB per file
- 200MB per note total

## UI/UX

- Main screen: responsive notes card grid (4/3/2/1 columns by breakpoints).
- Glass-card 3D hover (perspective tilt up to +/-8deg, dynamic shadow).
- Click card -> fullscreen expansion using framer-motion `layoutId`.
- Fullscreen note: editor + markdown preview split on desktop, stacked on mobile.

## Color Palette

Eight fixed ClickUp-inspired colors stored by `name` (not hex):
`red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`, `gray`.

## Routes & API

Pages:
- `/notes`
- `/notes/[id]` (or layout-based modal)

API:
- `GET/POST /api/notes`
- `GET/PATCH/DELETE /api/notes/[id]`
- `POST /api/notes/[id]/attachments`
- `POST /api/notes/import`

## Explicit Non-scope

- Real-time collaboration
- Public note sharing
- Export formats outside markdown
- Native mobile app
- Embedded AI assistant in notes
- Wiki-style backlinks in MVP
- Custom note versioning (prefer git-tracked storage folder)

