# IAM Client OS — Admin Panel Integration Rules

**What this document is.** A complete guide to extending the IAM Client OS admin panel with your own functionality — without touching the platform core. If you want an SEO tab, a billing dashboard, a custom CRM view, or anything else specific to your business, this is how you add it.

**What this document is not.** Internal platform architecture (MCP mega-tools, data layer internals, router patterns). That lives in `memory/ARCHITECTURE.md` and is for AI agents working on the platform itself, not for client integrations.

---

## The Extension pattern

IAM Client OS ships with a plugin system called **Extensions**. An extension is a self-contained directory under `extensions/` that adds a new tab to the admin panel. The platform auto-discovers extensions at startup — drop a folder in, restart the app, a new tab appears.

No core code is modified. No forking. Extensions are additive and safe to add or remove at any time.

**Working example already in the repo:** `extensions/project-stats/` — a Statistics tab showing task completion rates, PR approval rates, and per-member activity. This tab was built and integrated as an extension, never as a change to core admin panel code.

---

## How it works end to end

1. At startup, `GET /api/admin/panel?action=extensions-list` scans `extensions/*/manifest.json` and returns the list.
2. The admin panel UI fetches this list and renders one tab per extension, after the built-in tabs.
3. When a user clicks an extension tab, the admin panel dynamically loads your `AdminTab.tsx` component and passes it a standard set of props (data + API access).
4. Your component renders whatever UI it wants inside the tab area.
5. If the extension declares a `requiredCapability` and the current admin lacks it, the tab is hidden entirely (not disabled — hidden).

That's the entire integration surface. Two files per extension, no core changes.

---

## Creating a new extension

### Step 1 — Copy the template

```bash
cp -r extensions/_template extensions/my-extension
```

The name of the directory becomes the extension's `id`. Use kebab-case, lowercase, no spaces. The `id` must be unique across all installed extensions.

### Step 2 — Edit the manifest

Open `extensions/my-extension/manifest.json` and fill in the fields (see manifest reference below).

### Step 3 — Write the component

Open `extensions/my-extension/AdminTab.tsx` and export a default React component. See the props reference below for what's available.

### Step 4 — Restart the app

```bash
pm2 restart <process-name>
```

Refresh the admin panel. Your tab should appear.

---

## manifest.json — field reference

```json
{
  "id": "my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "icon": "🧩",
  "description": "One-line description shown in the extension list",
  "author": "your-name-or-company",
  "tabs": {
    "admin": {
      "component": "AdminTab.tsx",
      "label": "My Tab",
      "order": 90
    }
  },
  "requiredCapability": null,
  "dataDir": "data/extensions/my-extension/"
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Must match the directory name. Unique. |
| `name` | yes | Human-readable, shown in admin UI. |
| `version` | yes | Semver. Bump when you change the extension. |
| `icon` | yes | Single emoji. Displayed next to the tab label. |
| `description` | yes | Short one-liner. Keep under 80 chars. |
| `author` | no | Free-form string. |
| `tabs.admin.component` | yes | Filename of the React component in this directory. Conventionally `AdminTab.tsx`. |
| `tabs.admin.label` | yes | The tab label shown in the admin panel tab bar. |
| `tabs.admin.order` | no | Sort order vs other extensions. Lower = earlier. Default `99`. Built-in tabs always come first. |
| `requiredCapability` | no | Admin capability name. If set, tab is hidden unless the current admin has this capability. Use for sensitive features. |
| `dataDir` | no | Path where your extension can read/write its own files. If omitted, the extension should not persist data. |

---

## AdminTab.tsx — component contract

Your component receives a standard set of props. This is the complete contract:

```typescript
export interface ExtensionTabProps {
  api: (action: string, params?: Record<string, string>) => Promise<unknown>;
  apiPost: (body: Record<string, unknown>) => Promise<unknown>;
  showToast: (msg: string) => void;
  goals: GoalItem[];
  tasks: StructuredTask[];
  messages: StructuredMessage[];
  members: TeamMember[];
  prs: PullRequest[];
  isDark?: boolean;
}

export default function MyExtensionTab(props: ExtensionTabProps) {
  return <div>...</div>;
}
```

**What each prop gives you:**

`api(action, params?)` — GET request to `/api/admin/panel` with the given action. Use this to read data. Admin session is already authenticated; you do not handle auth.

`apiPost(body)` — POST request to `/api/admin/panel`. Use this to write data. The admin CSRF token is injected automatically.

`showToast(msg)` — display a toast notification at the top of the admin panel. Use for success/error feedback.

`goals`, `tasks`, `messages`, `members`, `prs` — live data already fetched by the admin panel. You do not need to re-fetch these. They update on admin panel polling.

`isDark` — boolean indicating whether the admin panel is in dark mode. Honor this for visual consistency.

**What you must export:** a default React component accepting these props. Nothing else.

**What you must not do:** do not import from `@/app/admin/*` internals. Do not modify global state. Do not make requests outside `/api/admin/panel` without good reason.

---

## A real, working example — Statistics tab

The `extensions/project-stats/` extension in this repository computes and displays team statistics entirely from the live data passed in via props — no backend, no data writes, no new API endpoints. The entire extension is two files:

**`extensions/project-stats/manifest.json`**

```json
{
  "id": "project-stats",
  "name": "Project Statistics",
  "version": "1.0.0",
  "icon": "📊",
  "description": "Task completion rates, PR review times, team activity overview",
  "author": "iam-client-os",
  "tabs": {
    "admin": {
      "component": "AdminTab.tsx",
      "label": "Statistics",
      "order": 90
    }
  },
  "requiredCapability": null,
  "dataDir": "data/extensions/project-stats/"
}
```

**`extensions/project-stats/AdminTab.tsx`** — a React component that reads `tasks`, `prs`, `goals`, `members` from props and renders dashboards. It does not call `api()` at all. It does not write anywhere. It is read-only visualization of data the admin panel already has.

**When this pattern is right.** Read-only views, dashboards, reports, analytics — anything you can compute from the props you already receive.

**When you need more.** If your extension needs to persist state (e.g., SEO tab that stores target keywords), declare a `dataDir` and use `api()` / `apiPost()` to add read/write handlers. See the Data persistence section below.

---

## Data persistence for extensions

If your extension stores its own data:

1. Declare `"dataDir": "data/extensions/my-extension/"` in `manifest.json`. The platform creates this directory on first load.
2. Inside that directory, store JSON files (`config.json`, `state.json`, etc.). Stick to JSON — extensions do not get their own database.
3. To read/write from the frontend, add matching handlers in the admin panel API layer. Since extensions cannot modify core code directly, write to a generic storage endpoint via `api()` / `apiPost()` that is extension-scoped by `id`.

**Never** write outside your own `dataDir`. The extension system assumes this boundary; violating it will break future platform updates.

---

## Capability gating — hiding vs disabling

IAM Client OS follows the principle **"no access = doesn't exist"**. If an admin lacks a capability, the feature is hidden, not greyed out.

Set `requiredCapability` in your manifest to any capability name in the platform's capability list (see `memory/TEAM_ROLES.md` for the list currently in use). Admins without the capability won't see the tab at all.

Example — an extension that only Super Admins should see:

```json
"requiredCapability": "manage_team"
```

If `requiredCapability` is `null` (the default), every admin with access to the admin panel sees the tab.

---

## Best practices

**Keep extensions self-contained.** All assets, styles, components belong inside your extension directory. Do not reach into platform internals.

**Version your manifest.** Bump the `version` field whenever you change anything. This helps when rolling back or debugging.

**Render defensively.** Your tab receives live data — `tasks` may be empty, `members` may be zero, a PR may be missing fields. Always check before rendering.

**Honor dark mode.** Use the `isDark` prop and design both light and dark color schemes. The admin panel user controls this; your tab should follow.

**Write for the live props.** The admin panel polls and updates `tasks`, `goals`, etc. automatically. Your component re-renders on updates. Do not cache stale copies.

**Scope your storage.** If you write data, write only under your declared `dataDir`. Name your files predictably (`{id}-config.json`) so they are easy to audit and back up.

**Document the capability you need.** If you set `requiredCapability`, explain why in the extension's own README. Future admins need to know which role should get the capability.

---

## Troubleshooting

**"My tab doesn't appear."** Check three things: (1) does `extensions/{id}/manifest.json` exist and parse as valid JSON, (2) is the `tabs.admin.component` filename correct and does the file export a default component, (3) did you restart the app (`pm2 restart`). Tab list is loaded on admin panel mount, not live.

**"I see the tab but it crashes when I click it."** Open browser devtools. A component error inside your extension is surfaced as a React crash. Fix the component, refresh — no restart needed.

**"API calls return 403."** Your admin session may not have the capability your handler requires. Check the admin's role in the Team tab.

**"I want to remove an extension."** Delete its directory from `extensions/` and restart. The tab disappears. If the extension stored data under `dataDir`, those files remain — delete them manually if you want a clean removal.

---

## Roadmap — what is not yet supported

The extension system today covers admin panel tabs only. Planned but not yet shipped:

- **Dashboard tabs** (extensions that appear in the worker dashboard, not just admin panel)
- **MCP tool registration** (extensions contributing their own MCP sub-actions for AI agents)
- **Scheduled jobs** (extensions running background cron tasks)
- **Pages outside tab area** (extensions adding standalone routes)

If you need one of these, contact the platform team or open an issue — extending the plugin system in these directions is on the roadmap.

---

*Keep this document up to date whenever the extension contract changes. This is the single source of truth for third-party integrators.*
