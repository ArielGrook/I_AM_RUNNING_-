#!/bin/bash
# ============================================================
# I AM RUNNING — Automated Daily Backup
# Run via cron: 0 2 * * * bash /var/www/i_am_running/product-template/auto-backup.sh
# ============================================================

CLIENTS_DIR="/var/www/iam-clients"
IAM_DIR="/var/www/i_am_running"
LOG="$CLIENTS_DIR/_backups/backup.log"
DATE=$(date '+%Y-%m-%d %H:%M')

mkdir -p "$CLIENTS_DIR/_backups"
echo "[$DATE] Starting auto-backup..." >> "$LOG"

backed=0
failed=0

for dir in "$CLIENTS_DIR"/*/; do
  slug=$(basename "$dir")
  [[ "$slug" == _* ]] && continue
  [ -d "$dir/context-core" ] || continue

  # Git commit + push context-core
  if git -C "$dir" rev-parse --git-dir &>/dev/null; then
    cd "$dir"
    git add context-core/ bootstrap-prompts/ 2>/dev/null
    if git diff --cached --quiet 2>/dev/null; then
      echo "[$DATE] $slug: no changes" >> "$LOG"
    else
      git commit -m "auto-backup: $DATE" --quiet 2>/dev/null
      if git remote -v 2>/dev/null | grep -q origin; then
        git push --quiet 2>/dev/null && \
          echo "[$DATE] $slug: backed up + pushed to GitHub" >> "$LOG" || \
          echo "[$DATE] $slug: committed locally, GitHub push failed" >> "$LOG"
      else
        echo "[$DATE] $slug: committed locally (no GitHub remote)" >> "$LOG"
      fi
    fi
    backed=$((backed+1))
    cd "$IAM_DIR"
  else
    echo "[$DATE] $slug: no git repo found" >> "$LOG"
    failed=$((failed+1))
  fi
done

echo "[$DATE] Done. Success: $backed, Failed: $failed" >> "$LOG"

# Keep only last 30 days of log
find "$CLIENTS_DIR/_backups" -name "*.tar.gz" -mtime +30 -delete 2>/dev/null
