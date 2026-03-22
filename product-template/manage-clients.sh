#!/bin/bash
# ============================================================
# I AM RUNNING — Client Manager
# View, restart, backup all client instances
# Usage: bash manage-clients.sh [list|status|backup|logs|restart]
# ============================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

CLIENTS_DIR="/var/www/iam-clients"
IAM_DIR="/var/www/i_am_running"

CMD="${1:-list}"

case "$CMD" in

  list)
    echo ""
    echo -e "${BOLD}${CYAN}  Installed Clients${NC}"
    echo "════════════════════════════════════════════"
    printf "  %-20s %-8s %-30s %s\n" "CLIENT" "PORT" "URL" "STATUS"
    echo "────────────────────────────────────────────"

    for reg in "$CLIENTS_DIR/_registry"/*.json; do
      [ -f "$reg" ] || continue
      slug=$(basename "$reg" .json)
      name=$(node -pe "JSON.parse(require('fs').readFileSync('$reg','utf8')).client_name" 2>/dev/null)
      port=$(node -pe "JSON.parse(require('fs').readFileSync('$reg','utf8')).port" 2>/dev/null)
      url=$(node -pe "JSON.parse(require('fs').readFileSync('$reg','utf8')).url" 2>/dev/null)
      pm2_status=$(pm2 show "iam-$slug" 2>/dev/null | grep "status" | awk '{print $4}' || echo "unknown")

      if [ "$pm2_status" = "online" ]; then
        status="${GREEN}● online${NC}"
      else
        status="${RED}● offline${NC}"
      fi

      printf "  %-20s %-8s %-30s " "$name" "$port" "$url"
      echo -e "$status"
    done

    echo ""
    total=$(ls "$CLIENTS_DIR/_registry" 2>/dev/null | wc -l)
    echo -e "  ${BOLD}Total: $total client(s)${NC}"
    echo ""
    ;;

  status)
    CLIENT="${2:-}"
    [ -z "$CLIENT" ] && { echo "Usage: $0 status CLIENT_SLUG"; exit 1; }
    pm2 show "iam-$CLIENT"
    ;;

  logs)
    CLIENT="${2:-}"
    [ -z "$CLIENT" ] && { echo "Usage: $0 logs CLIENT_SLUG [lines]"; exit 1; }
    LINES="${3:-30}"
    pm2 logs "iam-$CLIENT" --lines "$LINES" --nostream
    ;;

  restart)
    CLIENT="${2:-}"
    [ -z "$CLIENT" ] && { echo "Usage: $0 restart CLIENT_SLUG"; exit 1; }
    pm2 restart "iam-$CLIENT" --update-env
    echo -e "${GREEN}✓${NC} Restarted iam-$CLIENT"
    ;;

  restart-all)
    echo "Restarting all client instances..."
    for reg in "$CLIENTS_DIR/_registry"/*.json; do
      [ -f "$reg" ] || continue
      slug=$(basename "$reg" .json)
      pm2 restart "iam-$slug" --update-env 2>/dev/null && echo -e "${GREEN}✓${NC} iam-$slug" || echo -e "${RED}✗${NC} iam-$slug"
    done
    ;;

  backup)
    CLIENT="${2:-}"
    BACKUP_DIR="$CLIENTS_DIR/_backups/$(date +%Y%m%d)"
    mkdir -p "$BACKUP_DIR"

    if [ -n "$CLIENT" ]; then
      # Backup single client
      if [ -d "$CLIENTS_DIR/$CLIENT" ]; then
        tar czf "$BACKUP_DIR/$CLIENT.tar.gz" -C "$CLIENTS_DIR" "$CLIENT/context-core" "$CLIENT/bootstrap-prompts"
        echo -e "${GREEN}✓${NC} Backed up $CLIENT → $BACKUP_DIR/$CLIENT.tar.gz"

        # Push context-core to GitHub if remote exists
        if git -C "$CLIENTS_DIR/$CLIENT" remote -v 2>/dev/null | grep -q origin; then
          cd "$CLIENTS_DIR/$CLIENT"
          git add context-core/
          git commit -m "backup: $(date '+%Y-%m-%d %H:%M')" --quiet 2>/dev/null || true
          git push --quiet 2>/dev/null && echo -e "${GREEN}✓${NC} Pushed to GitHub" || echo -e "${YELLOW}⚠${NC}  GitHub push failed"
          cd "$IAM_DIR"
        fi
      else
        echo -e "${RED}✗${NC} Client '$CLIENT' not found"
      fi
    else
      # Backup all clients
      echo "Backing up all clients..."
      for dir in "$CLIENTS_DIR"/*/; do
        slug=$(basename "$dir")
        [[ "$slug" == _* ]] && continue
        [ -d "$dir/context-core" ] || continue

        tar czf "$BACKUP_DIR/$slug.tar.gz" -C "$CLIENTS_DIR" "$slug/context-core" "$slug/bootstrap-prompts" 2>/dev/null
        echo -e "${GREEN}✓${NC} $slug"

        # GitHub push
        if git -C "$dir" remote -v 2>/dev/null | grep -q origin; then
          cd "$dir"
          git add context-core/ 2>/dev/null
          git commit -m "backup: $(date '+%Y-%m-%d %H:%M')" --quiet 2>/dev/null || true
          git push --quiet 2>/dev/null && echo -e "  ${GREEN}↑${NC} pushed to GitHub" || true
          cd "$IAM_DIR"
        fi
      done
      echo ""
      echo -e "${GREEN}✓${NC} Backups saved to $BACKUP_DIR"
    fi
    ;;

  remove)
    CLIENT="${2:-}"
    [ -z "$CLIENT" ] && { echo "Usage: $0 remove CLIENT_SLUG"; exit 1; }
    echo -e "${RED}WARNING: This will remove client '$CLIENT' completely.${NC}"
    read -p "Type the slug to confirm: " CONFIRM
    [ "$CONFIRM" != "$CLIENT" ] && { echo "Cancelled."; exit 0; }

    # Stop PM2
    pm2 delete "iam-$CLIENT" 2>/dev/null && echo -e "${GREEN}✓${NC} PM2 process removed"

    # Archive (don't delete)
    ARCHIVE_DIR="$CLIENTS_DIR/_archived"
    mkdir -p "$ARCHIVE_DIR"
    mv "$CLIENTS_DIR/$CLIENT" "$ARCHIVE_DIR/${CLIENT}_$(date +%Y%m%d)"
    echo -e "${GREEN}✓${NC} Files archived to $ARCHIVE_DIR/${CLIENT}_$(date +%Y%m%d)"

    # Remove nginx
    rm -f "/etc/nginx/sites-enabled/${CLIENT}.iamrunning.online"
    rm -f "/etc/nginx/sites-available/${CLIENT}.iamrunning.online"
    nginx -s reload 2>/dev/null && echo -e "${GREEN}✓${NC} Nginx config removed"

    # Remove registry
    rm -f "$CLIENTS_DIR/_registry/$CLIENT.json"
    echo -e "${GREEN}✓${NC} Registry entry removed"
    ;;

  *)
    echo ""
    echo -e "${BOLD}Usage:${NC} bash manage-clients.sh COMMAND [client_slug]"
    echo ""
    echo "Commands:"
    echo "  list              — show all installed clients"
    echo "  status SLUG       — show PM2 status for one client"
    echo "  logs SLUG [N]     — show last N log lines (default 30)"
    echo "  restart SLUG      — restart one client"
    echo "  restart-all       — restart all clients"
    echo "  backup [SLUG]     — backup context-core (all or one)"
    echo "  remove SLUG       — archive and remove a client"
    echo ""
    ;;
esac
