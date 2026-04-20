# Product Tour Expansion — Roadmap for Sonnet

## Context

The Product Tour in `app/lib/tourSteps.ts` needs expansion. Current state: Super Admin 11 steps, Admin 8 steps, Reviewer 12, Developer 12. Target: 25-30 steps each, with detailed coverage of Work System, Team management, and key workflows.

Tour uses `data-tour` attributes on HTML elements. Each step points to a selector, specifies which tab to switch to, and shows title + description. The GuidedTour component in `app/lib/GuidedTour.tsx` handles rendering.

## Rules

- DO NOT modify GuidedTour.tsx — only modify tourSteps.ts
- Keep existing steps that work well — ADD new steps between them or at the end
- Each step should explain ONE thing clearly in 2-3 sentences
- Use real button names and emoji from the actual UI
- Write in English
- Read the actual component files to verify data-tour selectors exist before referencing them

## Step 1: Read context files

```
read_file("app/lib/tourSteps.ts")
read_file("app/lib/GuidedTour.tsx")
```

Then read the UI components to find existing data-tour selectors:
```
search_files("data-tour") — across app/admin/ and app/dashboard/
```

## Step 2: Expand SUPER_ADMIN_TOUR (Admin Panel)

Target: ~28 steps. Current: 11. Add these NEW steps (insert in logical order):

### After "Navigation" (step 2), add Dashboard tab detail:
- **Dashboard — Quick Stats**: "Your dashboard shows live stats: team members, goals progress, recent PRs, and deploy status. This is your morning briefing — one glance tells you the state of the project."
- **Dashboard — Recent Activity**: "The activity feed shows every action across the workspace: file changes, PR submissions, messages, deploys. Click any entry to see details. Filter by type to focus on what matters."

### After "Work System" section (step 7), add:
- **Work System — Editor**: "Click any file in the tree to open it in the code editor. As Super Admin, your edits save directly — no PR needed. The editor supports syntax highlighting for TypeScript, Markdown, JSON, and more."
- **Work System — Creating New Files**: "Click 📄+ above the file tree to create a new file. Type the path (e.g. docs/api-guide.md) and write content. Your file goes live immediately."
- **Work System — Diff View Modes**: "When reviewing a PR, the diff shows three views: Side-by-side (default), Inline (unified), and Proposed/Production toggle. Green = added lines, red = removed. Use the toggle to see the full proposed file vs current production."

### After "Team" (step 8), add detailed team management:
- **Team — Creating a Member**: "Click '+ Add Member' to create a new team member. Choose a name, role (developer/reviewer/marketer), and the system generates a unique MCP token. Send this token to the member — it's their key to connect Claude."
- **Team — Roles Explained**: "Developer: writes code via PRs, can't deploy. Reviewer: reviews PRs, manages goals and roadmap. Marketer: creates content, limited file access. Admin: full access like you but through Dashboard."
- **Team — Tools & Permissions**: "Each member has granular tool access. Expand the tools section to see checkboxes grouped by category: Files (read/write/patch), Tasks, Communication, Goals, Code Review, DevOps. Uncheck a tool to revoke that specific capability."
- **Team — Read/Write Paths**: "Control exactly which files each member can see and edit. Use glob patterns: 'workspace/*' means all workspace files. '!app/api/*' means everything EXCEPT API code. 'No access = doesn't exist' — members can't even see restricted files."
- **Team — Assigning Tasks**: "Click 'Assign Task' on any member card. Enter a title and description — the member gets a push notification immediately. They see the task in their dashboard and Claude loads it via MCP."

### After "Goals" (step 9), add:
- **Goals — Creating a Goal**: "Click '+ Goal' to start a new goal. Add milestones below it, then tasks under each milestone. Assign tasks to specific workers — they get notified. When a PR is approved for a task, the task auto-closes."
- **Goals — Comments**: "Click any goal, milestone, or task to expand it. The comment section lets you and your team discuss progress. Claude can also add comments via MCP — it's a shared communication channel."

### After "Settings" (step 10), add:
- **Settings — Claude Instructions & Memory**: "Collapsible sections with ready-to-copy text for Claude Projects. Instructions go into your Claude Project settings. Memory files are listed with paths — download from Dev Console and upload to Claude Knowledge."

### Add Messages and Logs tabs:
- **Messages — Team Communication**: "WhatsApp-style chat with your entire team. Create group chats, send direct messages. Workers get push notifications on their phones. All messages are searchable."
- **Activity Log**: "Every action in the system is logged: file changes, PR submissions, deploys, logins, messages. Use this for auditing and debugging. Filter by user, action type, or date."

## Step 3: Expand ADMIN_TOUR (Dashboard)

Target: ~25 steps. Current: 8. Add:

### After "Work Tab" (step 2), add Work System detail:
- **Work — PR Review Queue**: "PRs Awaiting Review shows all pending code changes. Each PR shows the file path, author, and status. Click to expand — see the full diff, leave comments, approve or reject."
- **Work — PR Actions**: "For each PR: ✅ Approve+Deploy pushes the change live. ✅ Approve only marks it ready. 💬 Changes sends feedback to the worker. ❌ Reject closes the PR. 💬 Comment adds a discussion note."
- **Work — Your Tasks**: "Below the PR queue are your own tasks. Click any task to see its description and status. Tasks link to PRs — when a PR is approved for a task, the task auto-closes."

### Expand Team section:
- **Team — Member Cards**: "Each member card shows their name, role badge, and status. Click to expand and see their tools, paths, and assigned tasks."
- **Team — Managing Permissions**: "Expand tools to see grouped checkboxes: Files, Tasks, Communication, Goals, Code Review, DevOps. Each checkbox controls a specific MCP tool the member can use."
- **Team — Assigning Tasks**: "Click 'Assign Task' on a member card. Enter title and description — they get a push notification. The task appears in their Work tab and Claude loads it automatically."

### After "Dev Console" (step 7), add detail:
- **Work System — File Tree**: "Browse all workspace files in the left panel. Click 📄+ to create a new file, 📁+ to create a folder. Your edits save directly to production — unlike workers who submit PRs."
- **Work System — PR Panel**: "The right panel shows all pending PRs. Click any PR to see the diff: green lines = added, red = removed. Review, comment, or approve directly."
- **Work System — AI Chat**: "Gemini AI with full project access. Attach 📎 the current file or 📋 a PR diff. Ask it to review code, explain changes, or suggest improvements."

### Expand Setup section:
- **Setup — Bootstrap Prompt**: "Copy this text and paste as your first message to Claude. It loads your role, tools, and context automatically — Claude knows who you are and what to do."
- **Setup — Instructions & Memory**: "Instructions: copy into Claude Project settings. Memory: download files from Dev Console, upload to Claude Knowledge. This gives Claude persistent context about your project."
- **Setup — Skills**: "Download skill files and upload to Claude → Skills. Each skill teaches Claude specific rules for better-quality work."

## Step 4: Expand REVIEWER_TOUR

Target: ~25 steps. Current: 12. Add:

### After "Goals" (step 3), add:
- **Goals — Creating Goals & Milestones**: "Click '+ Goal' to create a new goal. Add milestones under it, then tasks under each milestone. Assign tasks to developers — they get notified immediately."
- **Goals — Tracking Progress**: "Each goal shows a progress bar based on task completion. Milestones track intermediate targets. Click any item to see comments and status updates."

### Work System expansion:
- **Work System — Diff View**: "When you click a PR, the diff opens in the center panel. Three view modes: Side-by-side, Inline, or Proposed vs Production toggle. Green = additions, red = removals."
- **Work System — Review Workflow**: "Your review flow: Read the diff → Leave comments → Click '👁 Rev. OK' to approve or '💬 Changes' to request fixes. After your approval, Admin does the final approve+deploy."

### Setup expansion:
- **Setup — Instructions & Memory**: "New sections! Instructions: ready-to-copy text for Claude Project settings. Memory: list of key project files to upload to Claude Knowledge."

## Step 5: Expand DEVELOPER_TOUR

Target: ~25 steps. Current: 12. Add:

### Work tab expansion:
- **Work — Starting a Task**: "Click any pending task → click '▶ Start Working'. This copies a ready-made prompt to your clipboard. Paste it into Claude — Claude loads the task context and starts helping you immediately."
- **Work — Understanding PR Status**: "Your PRs show status badges: ⏳ Pending (waiting for review), 💬 Changes Requested (fix and resubmit), ✅ Rev. OK (reviewer approved, waiting for admin), ✅ Approved (live!), ❌ Rejected."

### Work System expansion:
- **Work System — Editing a File**: "Click any file in the tree to open it. Make your changes in the editor, then click 'Submit as PR' in the top bar. Enter a title and description — admin will review your change."
- **Work System — Understanding the Diff**: "After submitting a PR, click it in the PR panel to see the diff. Green lines = what you added, red = what was removed. Reviewers and admin see the same view."
- **Work System — PR Feedback**: "When admin or reviewer requests changes, you'll see a 💬 icon. Click to read their feedback, then click ✏️ Edit to fix your PR content and resubmit."

### Setup expansion:
- **Setup — Instructions & Memory**: "New sections! Instructions: copy into Claude Project settings for persistent context. Memory: key project files to upload to Claude Knowledge."

## Step 6: Verify selectors

After writing all new steps, verify each selector references an existing `data-tour` attribute. If a selector doesn't exist, use the closest parent tab selector with `tab:` property to navigate first. Steps that reference a tab but no specific element can use the tab selector itself.

For new selectors that DON'T exist yet in the UI (like `admin-activity-log`, `work-pr-queue`, etc.), use the closest tab selector: `tab-{tabname}`. The tour will highlight the whole tab area — this is acceptable.

## Step 7: git_snapshot

After all changes, git_snapshot. Tell user to deploy via SSH.

## Implementation

All changes go into ONE file: `app/lib/tourSteps.ts`. Read it, then rewrite it completely (it's ~300 lines, ok to use write_file). Keep the same export names. Keep all existing `data-tour` selectors. Just add new steps and reorder for logical flow.
