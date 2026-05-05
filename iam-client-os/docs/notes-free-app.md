# Free Notes App for Your Team

Notes in IAM Client OS are designed as a free, ownership-first tool:

- Data lives on your own server filesystem (`/workspace/notes/{user_id}/`)
- Notes are plain markdown files with frontmatter metadata
- Attachments stay on disk next to notes (`attachments/`)
- Compatible with Obsidian-style workflows and backups

## Enable in Admin

1. Open admin settings for Notes.
2. Turn on **Enable Notes for users**.
3. Optionally turn on **Tenant mode storage** to enforce `/workspace/notes/{user_id}/`.

## Why this matters

- No SaaS lock-in
- Easy migration and backup (`rsync`, `cp -r`)
- User trust through data ownership

