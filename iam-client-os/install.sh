#!/bin/bash
# ============================================================
# I AM RUNNING — AI Business OS Installer
# Deploys a full client instance on a fresh VPS
# ============================================================
# Usage: curl -fsSL https://raw.githubusercontent.com/ArielGrook/iam-client-os/main/install.sh | sudo bash
#   OR:  sudo bash install.sh
#
# Tested on: Ubuntu 22.04 / 24.04
# Time: ~10 minutes on fresh VPS
# ============================================================

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()     { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }
section() { echo ""; echo -e "${BOLD}${BLUE}── $1 ──────────────────────────${NC}"; echo ""; }
gen_secret()      { node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"; }
gen_totp_secret() { node -e "process.stdout.write(require('crypto').randomBytes(20).toString('base64').replace(/[^A-Z2-7]/g,'A').slice(0,32))"; }

[ "$EUID" -ne 0 ] && error "Run as root: sudo bash install.sh"

clear
echo -e "${CYAN}${BOLD}"
cat << 'EOF'
  ██╗ █████╗ ███╗   ███╗     ██████╗ ███████╗
  ██║██╔══██╗████╗ ████║    ██╔═══██╗██╔════╝
  ██║███████║██╔████╔██║    ██║   ██║███████╗
  ██║██╔══██║██║╚██╔╝██║    ██║   ██║╚════██║
  ██║██║  ██║██║ ╚═╝ ██║    ╚██████╔╝███████║
  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚═════╝ ╚══════╝
EOF
echo -e "${NC}"
echo -e "${BOLD}  AI Native Business OS — VPS Installer${NC}"
echo "════════════════════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────
# STEP 0: COLLECT INFO
# ─────────────────────────────────────────────────────────────
section "Client Setup"

read -p "  Client name (e.g. 'Acme Corp'): " CLIENT_NAME
[ -z "$CLIENT_NAME" ] && error "Client name required"

read -p "  Domain (e.g. 'acme.com' or 'client.lego-base.online'): " CLIENT_DOMAIN
[ -z "$CLIENT_DOMAIN" ] && error "Domain required"

read -p "  Business type (e.g. 'agency', 'saas startup'): " BUSINESS_TYPE
read -p "  Your email (for SSL cert): " ADMIN_EMAIL

INSTALL_DATE=$(date '+%Y-%m-%d')
APP_DIR="/var/www/iam-os"
APP_PORT=3000

echo ""
echo -e "${BOLD}Summary:${NC}"
echo "  Client:  $CLIENT_NAME"
echo "  Domain:  https://$CLIENT_DOMAIN"
echo "  Dir:     $APP_DIR"
echo ""
read -p "Confirm? (y/N): " CONFIRM
[[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]] && exit 0

# ─────────────────────────────────────────────────────────────
# STEP 1: SYSTEM DEPENDENCIES
# ─────────────────────────────────────────────────────────────
section "Installing Dependencies"

apt-get update -qq
apt-get install -y -qq git curl nginx certbot python3-certbot-nginx

# Node.js 20
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &>/dev/null
  apt-get install -y -qq nodejs
fi
log "Node.js $(node --version)"

# PM2
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2 --quiet
fi
log "PM2 $(pm2 --version)"

# ─────────────────────────────────────────────────────────────
# STEP 2: CLONE APP
# ─────────────────────────────────────────────────────────────
section "Installing Application"

mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --quiet
  log "App updated from GitHub"
else
  git clone --quiet https://github.com/ArielGrook/iam-client-os.git "$APP_DIR"
  log "App cloned"
fi

cd "$APP_DIR"
npm install --quiet
log "Dependencies installed"

# ─────────────────────────────────────────────────────────────
# STEP 3: GENERATE SECRETS
# ─────────────────────────────────────────────────────────────
section "Generating Secrets"

MCP_TOKEN=$(gen_secret)
GPT_SECRET=$(gen_secret)
ADMIN_SESSION_SECRET=$(gen_secret)
TOTP_SECRET=$(gen_totp_secret)
log "Secrets generated"

# ─────────────────────────────────────────────────────────────
# STEP 4: ENVIRONMENT
# ─────────────────────────────────────────────────────────────
section "Writing Configuration"

cat > "$APP_DIR/.env.local" << EOF
# ── $CLIENT_NAME — AI Business OS ─────────────────────────────
# Generated: $INSTALL_DATE

NEXT_PUBLIC_CLIENT_NAME=$CLIENT_NAME
NEXT_PUBLIC_CLIENT_DOMAIN=https://$CLIENT_DOMAIN
BUSINESS_TYPE=$BUSINESS_TYPE

PROJECT_ROOT=$APP_DIR
CONTEXT_CORE_DIR=$APP_DIR/context-core

# ── AI Access ──────────────────────────────────────────────────
MCP_AUTH_TOKEN=$MCP_TOKEN
GPT_MCP_SECRET=$GPT_SECRET

# ── Admin ──────────────────────────────────────────────────────
ADMIN_SESSION_SECRET=$ADMIN_SESSION_SECRET
TOTP_SECRET=$TOTP_SECRET
EOF

# .dev-agent-config.json for MCP
cat > "$APP_DIR/.dev-agent-config.json" << EOF
{
  "mcpAuthToken": "$MCP_TOKEN",
  "gptMcpSecret": "$GPT_SECRET"
}
EOF

log ".env.local written"

# ─────────────────────────────────────────────────────────────
# STEP 5: FILL CONTEXT-CORE WITH CLIENT INFO
# ─────────────────────────────────────────────────────────────
section "Setting Up Context-Core"

sed -i \
  -e "s/\[CLIENT_NAME\]/$CLIENT_NAME/g" \
  -e "s/\[BUSINESS_TYPE\]/$BUSINESS_TYPE/g" \
  -e "s/\[CLIENT_DOMAIN\]/https:\/\/$CLIENT_DOMAIN/g" \
  -e "s/\[INSTALL_DATE\]/$INSTALL_DATE/g" \
  "$APP_DIR/context-core/SYSTEM_IDENTITY.md"

log "context-core/SYSTEM_IDENTITY.md filled"

# ─────────────────────────────────────────────────────────────
# STEP 6: BUILD
# ─────────────────────────────────────────────────────────────
section "Building Application"

cd "$APP_DIR"
npm run build
log "Build complete"

# ─────────────────────────────────────────────────────────────
# STEP 7: PM2
# ─────────────────────────────────────────────────────────────
section "Starting PM2 Process"

pm2 delete iam-os 2>/dev/null || true
pm2 start npm --name "iam-os" -- start -- --port $APP_PORT
pm2 save
log "PM2 process started on port $APP_PORT"

# ─────────────────────────────────────────────────────────────
# STEP 8: NGINX
# ─────────────────────────────────────────────────────────────
section "Configuring Nginx"

cat > "/etc/nginx/sites-available/iam-os" << NGINX
server {
    listen 80;
    server_name $CLIENT_DOMAIN;

    location /_next/static/ {
        alias $APP_DIR/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 120s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/iam-os /etc/nginx/sites-enabled/iam-os
nginx -t && systemctl reload nginx
log "Nginx configured"

# ─────────────────────────────────────────────────────────────
# STEP 9: SSL
# ─────────────────────────────────────────────────────────────
section "Getting SSL Certificate"

certbot --nginx -d "$CLIENT_DOMAIN" --non-interactive --agree-tos -m "$ADMIN_EMAIL" && \
  log "SSL certificate obtained" || \
  warn "SSL failed — run manually: certbot --nginx -d $CLIENT_DOMAIN"

# ─────────────────────────────────────────────────────────────
# STEP 10: PM2 STARTUP
# ─────────────────────────────────────────────────────────────
pm2 startup | tail -1 | bash &>/dev/null || true
pm2 save
log "PM2 startup configured"

# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}${BOLD}  ✓  INSTALLATION COMPLETE${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
printf "  %-18s %s\n" "Client:" "$CLIENT_NAME"
printf "  %-18s %s\n" "URL:" "https://$CLIENT_DOMAIN"
printf "  %-18s %s\n" "App dir:" "$APP_DIR"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}Admin TOTP Secret (Google Authenticator — show ONCE):${NC}"
echo "  $TOTP_SECRET"
echo ""
echo -e "  ${BOLD}MCP Token (for Claude Connector):${NC}"
echo "  $MCP_TOKEN"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}Claude setup:${NC}"
echo "  1. claude.ai → Settings → Connectors → Add connector"
echo "  2. URL: https://$CLIENT_DOMAIN/api/mcp"
echo "  3. Complete OAuth"
echo "  4. Paste: $APP_DIR/bootstrap-prompts/claude-start.md"
echo ""
echo -e "  ${BOLD}Logs:${NC}"
echo "  pm2 logs iam-os"
echo "  tail -f /var/log/nginx/error.log"
echo "════════════════════════════════════════════════════════════════"
