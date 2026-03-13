# I AM RUNNING — PROJECT OVERVIEW

## Stack
Next.js 15, TypeScript, Tailwind CSS, Craft.js, Supabase, PM2, Nginx

## Server
VPS Ubuntu: /var/www/i_am_running/ (underscore, not hyphen)
PM2 process: i-am-running
Live: iamrunning.online
Client sites: *.iamrunning.online (wildcard SSL)
GitHub: https://github.com/ArielGrook/I_AM_RUNNING_-.git

## Two Products
- Door A (Interactive): 7-step wizard for business owners
- Door B (Editor): Craft.js visual editor for freelancers

## Key Directories
app/[locale]/editor/page.tsx — Craft.js editor main page
app/sites/[slug]/SiteRenderer.tsx — deployed site renderer
app/[locale]/admin/dev-console/page.tsx — this Dev Console UI
app/api/dev-agent/ — Dev Console backend (DO NOT WRITE HERE)
lib/craft/components/ — all Tron components
lib/craft/context/ — ThemeContext, PagesContext, SiteContext
lib/dev-agent/ — tool executor, AI providers, config
context-core/ — this system prompt (DO NOT WRITE HERE)

## Client Sites Architecture
username.iamrunning.online → Nginx → localhost:3000/sites/username
SiteRenderer.tsx deserializes Craft.js JSON → renders same components as editor
Navigation: CustomEvent('iam_navigate', { detail: { page: 'slug' } })
