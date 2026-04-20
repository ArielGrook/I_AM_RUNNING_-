---
version: 1
last_updated: "2026-04-19T14:10:05.074Z"
updated_by: "admin"
schema: "team_roles_v1"
mode: "team"
roles:
  - token_hash: "sha256:c519016938db61d8fa0871acd9e3d276fc421db985a57e392c12e58d0d21b315"
    name: "Super Admin"
    role: "super_admin"
    tools: ["files.read","files.list","files.search","files.write","files.patch","files.rename","files.move","files.copy","files.delete","files.create_dir","tasks.read_memory","tasks.create","tasks.add_specification","tasks.session_handoff","communication.onboard","communication.workspace","communication.send_message","goals.list","goals.add_comment","goals.manage","code_review.create_pr","code_review.update_doc","code_review.reviewer_approve","code_review.reviewer_request_changes","devops.git_log","devops.git_snapshot","devops.deploy","devops.set_preset"]
    read_paths: ["*"]
    write_paths: ["*"]
    capabilities: ["manage_team","assign_tasks","review_prs","manage_goals","view_activity","view_logs","deploy"]
    scope: "all"
  - token_hash: "sha256:c1835ff92eafe9496af5ea9d500cc53617430c8a29319000f82fa61c02296b27"
    name: "gggggg"
    role: "admin"
    tools: ["files.read","files.list","files.search","files.write","files.patch","files.rename","files.move","files.copy","files.delete","files.create_dir","tasks.read_memory","tasks.create","tasks.add_specification","tasks.session_handoff","communication.onboard","communication.workspace","communication.send_message","goals.list","goals.add_comment","goals.manage","code_review.create_pr","code_review.update_doc","code_review.reviewer_approve","code_review.reviewer_request_changes","devops.git_log","devops.git_snapshot","devops.deploy","devops.set_preset"]
    read_paths: ["*"]
    write_paths: ["*"]
    capabilities: ["manage_team","assign_tasks","review_prs","manage_goals","view_activity","view_logs","deploy","dev_console"]
    scope: "all"
---

# Team Roles

Managed by admin panel. See /admin → Team tab.
