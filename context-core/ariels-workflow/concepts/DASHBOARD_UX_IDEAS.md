# Dashboard UX Ideas

**Created:** 00.04.2026
**Source:** Ariel's feedback during Phase 4-5 development

---

## 1. Hierarchical Team Communication

**Principle:** Super Admin → manages Admins (his "team"). Admins → manage Workers (their teams).

- Super Admin's Team tab shows **Admins** as primary team members
- Super Admin CAN message Workers, but primary workflow is admin→admin
- Admin's Team tab shows **Workers** in their scope
- Admin panel and Admin dashboard share most team management functions (copy patterns from admin panel into dashboard)
- Admin panel = Super Admin's workspace, Dashboard = Admin's workspace

---

## 2. Spec Request → Direct Task Navigation

**Problem:** When admin receives a "📋 Spec request: {task}" message from a worker, there's no quick way to act on it. Admin has to manually go to Goals → find the goal → find the milestone → find the task → write specification. Too many clicks.

**Solution:** 
- When a spec request message appears in Inbox or Messages, show an **orange "Create Specification" button** directly under the message
- Clicking it navigates straight to that specific task's edit view with the description/spec field focused
- No need to manually drill through Goals → Milestone → Task
- Backend: spec request message should include `taskId` and `goalRef` for direct linking
- Frontend: button triggers navigation to Goals tab → auto-opens goal → auto-opens milestone → focuses on task spec field

---

## 3. Clickable Tasks in Admin Panel Dashboard

**Problem:** Admin panel Dashboard shows task pipeline (pending/active tasks) but tasks are not interactive. You can see "Activity Redesign" is active but can't click on it to see details or act on it.

**Solution:**
- Make task cards in Dashboard pipeline **clickable**
- Click → expands task card OR opens a detail panel showing:
  - Task description / specification
  - Comments thread (from workers, from admin)
  - Ability to **add comments** directly from Dashboard
  - Ability to **write/edit specification** directly from Dashboard
  - PR status linked to this task
  - Assignee info
- This same pattern applies to BOTH admin panel (/admin) AND admin dashboard (/dashboard)
- Reduces the need to switch between Dashboard and Goals tabs for common task management

---

## 4. Admin Panel ↔ Admin Dashboard Feature Parity

**Principle:** Many features should work identically in both places:
- Task viewing + commenting + spec writing
- Team member management (add/edit/remove/tools)
- PR review (view/comment/approve/reject)
- Activity log viewing
- Deploy triggering

**Differences:**
- Admin panel (/admin): Super Admin only, TOTP auth, has Settings/TOTP/Files/Dev Console
- Admin dashboard (/dashboard): Token auth, capability-gated, no system settings
- Admin panel has full Goals CRUD; Dashboard may have limited goals view

---

*Add new ideas here as they come up during development.*
