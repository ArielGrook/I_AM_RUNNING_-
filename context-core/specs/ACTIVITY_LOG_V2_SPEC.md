# Activity Log v2 — Расширенное логирование

**Дата:** 12.04.2026 | **Статус:** Спека утверждена, реализация ~95%
**Файл:** logs/activity.jsonl

## Философия
Фундамент RAG Federation + Operator Dashboard. Negative signals самые ценные.

## Формат: обязательные поля
ts, user, role, action, session_id

## 30 positive events
file_read/write/search/delete, directory_list, pr_created/resubmitted/reviewer_approved/approved/comment, task_created/assigned/started/completed/reactivated, deploy_triggered/success, login/logout/session_expired, message_sent/group_created, ai_query, goal_created/updated/comment

## 15 negative events (самые ценные для RAG)
pr_rejected + pr_changes_requested (с reason + category), deploy_failed/rollback/timeout, server_error/memory_warning/disk_warning, auth_failed/totp_failed/token_expired/rate_limited, tool_error/timeout/forbidden, task_overdue, push_failed

## category для PR rejections
validation, error_handling, security, performance, style, logic, architecture, missing_feature, breaking_change, test_missing

## session_id
Генерируется при логине, связывает все действия в одну сессию.

**Полная спека с JSON schemas:** lego-base: IDEAS/concepts/ACTIVITY_LOG_V2_SPEC.md
