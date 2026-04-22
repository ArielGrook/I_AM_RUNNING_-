# Tool Distribution UI Redesign — Spec (reviewed)
### 19.04.2026 | Reviewed by Opus, feedback applied

## Problem
Hardcoded defaultRoles in TOOL_REGISTRY. No UI for flexible tool distribution.

## Philosophy
ALL tools available. Warnings not blocks. Chain of delegation:
Super Admin → Admin (with distribute_tools capability) → Workers.

## 6 Tool Groups (visual grouping)

1. **Files:** read, write, patch, delete, list, search, (future: rename, move, copy, create_dir)
2. **Tasks:** create_task, add_specification, read_memory
3. **Communication:** send_message, my_workspace, onboard
4. **Goals:** list_goals, manage_goals, add_comment
5. **Code Review:** create_pr, reviewer_approve, reviewer_request_changes, update_doc
6. **DevOps:** git_snapshot, git_log, deploy, set_preset

## Warning Levels
- ⚠️ caution: delete_file, create_task, git_snapshot, manage_goals, reviewer_approve
- ⚠️⚠️ dangerous: deploy

## UI: Admin Panel Team Tab
Grouped checkboxes + warnings. Buttons: Apply, Reset to Default, Give All (with confirm).
Bulk "Apply to all with role: X". Visual diff при Apply.

## Code Changes
1. Rename `category` → `group` in TOOL_REGISTRY, add `warning` + `warningLevel`
2. Admin Panel Team Tab — grouped checkboxes UI
3. Bulk "Apply to role"
4. `distribute_tools` capability + Dashboard editing — Phase 2
5. New file sub-actions (rename/move/copy/create_dir) — separate roadmap

---

*Source of truth: SHARED_CONTEXT секция 10*