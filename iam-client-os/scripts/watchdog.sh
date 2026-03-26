#!/bin/bash
# ============================================================
# IAM-CLIENT-OS — Memory Watchdog
# Runs via cron every 5 minutes. Checks memory/ integrity.
# If critical files are missing or corrupted → auto-rollback + alert.
# ============================================================
# Install: crontab -e → */5 * * * * /var/www/iam-os/scripts/watchdog.sh >> /var/log/iam-watchdog.log 2>&1
# ============================================================

set -euo pipefail

# ── Config ─────────────────────────────────────────────────────
APP_DIR="${APP_DIR:-/var/www/iam-os}"
MEMORY_DIR="$APP_DIR/memory"
RULES_FILE="$MEMORY_DIR/RULES.md"
CHECKSUM_FILE="$APP_DIR/.rules-checksum"
BACKUP_DIR="/var/backups/iam-memory"
LOG_PREFIX="[watchdog $(date '+%Y-%m-%d %H:%M:%S')]"

# Resend API (optional — set in .env.local or export before cron)
RESEND_API_KEY="${RESEND_API_KEY:-}"
ALERT_EMAIL="${ALERT_EMAIL:-}"
ALERT_FROM="${ALERT_FROM:-watchdog@iamrunning.online}"

# Required memory files
REQUIRED_FILES=(
  "SYSTEM_IDENTITY.md"
  "CURRENT_GOAL.md"
  "NEXT_ACTIONS.md"
  "WEEKLY_PROGRESS.md"
  "RULES.md"
)

MIN_FILE_SIZE=50  # bytes — anything smaller is considered empty/corrupted

# ── Functions ──────────────────────────────────────────────────

log() { echo "$LOG_PREFIX $1"; }

send_alert() {
  local subject="$1"
  local body="$2"

  log "ALERT: $subject"

  # Send via Resend if configured
  if [ -n "$RESEND_API_KEY" ] && [ -n "$ALERT_EMAIL" ]; then
    curl -s -X POST https://api.resend.com/emails \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"from\": \"$ALERT_FROM\",
        \"to\": \"$ALERT_EMAIL\",
        \"subject\": \"[IAM WATCHDOG] $subject\",
        \"text\": \"$body\n\nServer: $(hostname)\nTime: $(date)\nApp: $APP_DIR\"
      }" > /dev/null 2>&1 && log "Alert email sent to $ALERT_EMAIL" || log "Failed to send alert email"
  fi
}

rollback_from_git() {
  log "Attempting rollback from last git commit..."
  cd "$APP_DIR"

  # Get the list of memory files from last commit
  local restored=0
  for file in "${REQUIRED_FILES[@]}"; do
    if git show "HEAD:memory/$file" > /dev/null 2>&1; then
      git show "HEAD:memory/$file" > "$MEMORY_DIR/$file"
      log "Restored: memory/$file from git"
      ((restored++))
    else
      # Try one commit back
      if git show "HEAD~1:memory/$file" > /dev/null 2>&1; then
        git show "HEAD~1:memory/$file" > "$MEMORY_DIR/$file"
        log "Restored: memory/$file from git HEAD~1"
        ((restored++))
      else
        log "ERROR: Cannot restore memory/$file — not in git history"
      fi
    fi
  done

  log "Rollback complete: $restored files restored"
  return 0
}

# ── Checks ─────────────────────────────────────────────────────

check_files_exist() {
  local missing=()

  for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$MEMORY_DIR/$file" ]; then
      missing+=("$file")
    fi
  done

  if [ ${#missing[@]} -gt 0 ]; then
    local msg="Missing memory files: ${missing[*]}"
    send_alert "CRITICAL: Missing memory files" "$msg"
    rollback_from_git
    return 1
  fi

  return 0
}

check_files_not_empty() {
  local empty=()

  for file in "${REQUIRED_FILES[@]}"; do
    local filepath="$MEMORY_DIR/$file"
    if [ -f "$filepath" ]; then
      local size=$(stat -f%z "$filepath" 2>/dev/null || stat -c%s "$filepath" 2>/dev/null || echo 0)
      if [ "$size" -lt "$MIN_FILE_SIZE" ]; then
        empty+=("$file (${size}b)")
      fi
    fi
  done

  if [ ${#empty[@]} -gt 0 ]; then
    local msg="Empty/corrupted memory files: ${empty[*]}"
    send_alert "WARNING: Empty memory files" "$msg"
    rollback_from_git
    return 1
  fi

  return 0
}

check_rules_integrity() {
  if [ ! -f "$RULES_FILE" ]; then
    return 0  # handled by check_files_exist
  fi

  # Extract body (everything after YAML frontmatter — line 8+)
  local current_checksum=$(tail -n +8 "$RULES_FILE" | sha256sum | cut -d' ' -f1)

  # If checksum file doesn't exist yet, create it (first run)
  if [ ! -f "$CHECKSUM_FILE" ]; then
    echo "$current_checksum" > "$CHECKSUM_FILE"
    log "RULES.md checksum initialized: $current_checksum"
    return 0
  fi

  local stored_checksum=$(cat "$CHECKSUM_FILE")

  if [ "$current_checksum" != "$stored_checksum" ]; then
    send_alert "CRITICAL: RULES.md modified" "RULES.md has been modified outside of system control.\nExpected: $stored_checksum\nGot: $current_checksum\nRolling back..."
    rollback_from_git
    # Recalculate checksum after rollback
    local new_checksum=$(tail -n +8 "$RULES_FILE" | sha256sum | cut -d' ' -f1)
    echo "$new_checksum" > "$CHECKSUM_FILE"
    return 1
  fi

  return 0
}

# ── Daily backup ───────────────────────────────────────────────

run_daily_backup() {
  local today=$(date '+%Y-%m-%d')
  local backup_path="$BACKUP_DIR/$today"

  # Only run once per day
  if [ -d "$backup_path" ]; then
    return 0
  fi

  mkdir -p "$backup_path"
  cp -r "$MEMORY_DIR/"* "$backup_path/" 2>/dev/null || true
  log "Daily backup created: $backup_path"

  # Clean backups older than 30 days
  find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
}

# ── Main ───────────────────────────────────────────────────────

main() {
  # Ensure directories exist
  if [ ! -d "$MEMORY_DIR" ]; then
    send_alert "CRITICAL: memory/ directory missing" "The entire memory/ directory is gone from $APP_DIR"
    rollback_from_git
    return
  fi

  local issues=0

  check_files_exist || ((issues++))
  check_files_not_empty || ((issues++))
  check_rules_integrity || ((issues++))
  run_daily_backup

  if [ "$issues" -eq 0 ]; then
    # Only log OK every hour (not every 5 min) to reduce noise
    local minute=$(date '+%M')
    if [ "$minute" -lt 5 ]; then
      log "OK — all ${#REQUIRED_FILES[@]} memory files intact"
    fi
  else
    log "ISSUES FOUND: $issues — rollback attempted"
  fi
}

main
