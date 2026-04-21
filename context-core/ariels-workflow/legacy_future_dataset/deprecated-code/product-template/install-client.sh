#!/bin/bash
# ============================================================
# I AM RUNNING — Client Installation Script v3.0
# AI Native Business Operating System
# Architecture: Option A — Single PM2, X-Client-Slug routing
# ============================================================
# Usage: sudo bash product-template/install-client.sh
#
# What this script does:
#   1. Collects client info
#   2. Creates /var/www/iam-clients/SLUG/context-core/ from template
#   3. Generates secrets (.env + .dev-agent-config.json)
#   4. Creates Nginx server block with X-Client-Slug header
#   5. Reloads Nginx
#   6. Saves registry entry
#   7. Prints summary with MCP token + TOTP secret
#
# What this script does NOT do:
#   - Start a separate PM2 process (all clients share i-am-running)
#   - Run npm build (not needed — shared build)
#   - Create GitHub repos (optional, do manually)
# ============================================================

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ── Config ────────────────────────────────────────────────────
IAM_DIR="/var/www/i_am_running"
CLIENTS_DIR="/var/www/iam-clients"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
BASE_DOMAIN="lego-base.online"
MAIN_PM2_PORT="3000"

log()     { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }
section() { echo ""; echo -e "${BOLD}${BLUE}── $1 ──────────────────────────${NC}"; echo ""; }
gen_secret() { node -e "const {randomBytes}=require('crypto'); process.stdout.write(randomBytes(32).toString('hex'))"; }
gen_totp_secret() { node -e "const {randomBytes}=require('crypto'); process.stdout.write(randomBytes(20).toString('base64').replace(/[^A-Z2-7]/g,'A').slice(0,32))"; }

# ── Banner ────────────────────────────────────────────────────
clear
echo -e "${CYAN}${BOLD}"
cat << 'EOF'
  ██╗ █████╗ ███╗   ███╗    ██████╗ ██╗   ██╗███╗  ██╗███╗  ██╗██╗███╗  ██╗ ██████╗
  ██║██╔══██╗████╗ ████║    ██╔══██╗██║   ██║████╗ ██║████╗ ██║██║████╗ ██║██╔════╝
  ██║███████║██╔████╔██║    ██████╔╝██║   ██║██╔██╗██║██╔██╗██║██║██╔██╗██║██║  ███╗
  ██║██╔══██║██║╚██╔╝██║    ██╔══██╗██║   ██║██║╚████║██║╚████║██║██║╚████║██║   ██║
  ██║██║  ██║██║ ╚═╝ ██║    ██║  ██║╚██████╔╝██║ ╚███║██║ ╚███║██║██║ ╚███║╚██████╔╝
  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚══╝╚═╝  ╚══╝╚═╝╚═╝  ╚══╝ ╚═════╝
EOF
echo -e "${NC}"
echo -e "${BOLD}  AI Native Business OS — Client Installer v3.0 (Option A)${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""

[ "$EUID" -ne 0 ] && error "Run as root: sudo bash product-template/install-client.sh"

# ── Verify main PM2 process is running ───────────────────────
section "Checking Main Process"

if pm2 list 2>/dev/null | grep -q "i-am-running"; then
  log "Main PM2 process 'i-am-running' is running on port $MAIN_PM2_PORT"
else
  warn "Main PM2 process 'i-am-running' not found in pm2 list"
  warn "Make sure iamrunning.online is running before installing clients"
  read -p "Continue anyway? (y/N): " FORCE
  [[ "$FORCE" != "y" && "$FORCE" != "Y" ]] && exit 1
fi

# ═══════════════════════════════════════════════════════════════
# STEP 1: COLLECT CLIENT INFO
# ═══════════════════════════════════════════════════════════════
section "Client Information"

echo -e "${BOLD}Installed clients:${NC} $(ls "$CLIENTS_DIR" 2>/dev/null | grep -v '_registry' | wc -l)"
echo ""

read -p "  Client name (e.g. 'Grisha Petrov'): " CLIENT_NAME
[ -z "$CLIENT_NAME" ] && error "Client name required"

read -p "  Subdomain slug (letters/numbers/hyphens, e.g. 'gooner'): " CLIENT_SLUG
CLIENT_SLUG=$(echo "$CLIENT_SLUG" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')
[ -z "$CLIENT_SLUG" ] && error "Slug required"
[ -d "$CLIENTS_DIR/$CLIENT_SLUG" ] && error "Client '$CLIENT_SLUG' already exists at $CLIENTS_DIR/$CLIENT_SLUG"

read -p "  Business type (e.g. 'digital agency', 'restaurant'): " BUSINESS_TYPE

read -p "  Custom domain? Leave blank to use $CLIENT_SLUG.$BASE_DOMAIN: " CUSTOM_DOMAIN
if [ -n "$CUSTOM_DOMAIN" ]; then
  CLIENT_DOMAIN="$CUSTOM_DOMAIN"
  SSL_TYPE="custom"
else
  CLIENT_DOMAIN="${CLIENT_SLUG}.${BASE_DOMAIN}"
  SSL_TYPE="wildcard"
fi

INSTALL_DATE=$(date '+%Y-%m-%d')
CLIENT_URL="https://${CLIENT_DOMAIN}"

echo ""
echo -e "${BOLD}Summary:${NC}"
echo "  Client:   $CLIENT_NAME"
echo "  Slug:     $CLIENT_SLUG"
echo "  URL:      $CLIENT_URL"
echo "  Domain:   $CLIENT_DOMAIN (SSL: $SSL_TYPE)"
echo "  Business: $BUSINESS_TYPE"
echo ""
read -p "Confirm installation? (y/N): " CONFIRM
[[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]] && { echo "Cancelled."; exit 0; }

# ═══════════════════════════════════════════════════════════════
# STEP 2: GENERATE SECRETS
# ═══════════════════════════════════════════════════════════════
section "Generating Secrets"

MCP_TOKEN=$(gen_secret)
GPT_SECRET=$(gen_secret)
ADMIN_SESSION_SECRET=$(gen_secret)
TOTP_SECRET=$(gen_totp_secret)

log "Secrets generated"

# ═══════════════════════════════════════════════════════════════
# STEP 3: CREATE CLIENT DIRECTORY + CONTEXT-CORE
# ═══════════════════════════════════════════════════════════════
section "Creating Client Directory"

mkdir -p "$CLIENTS_DIR/$CLIENT_SLUG/context-core"
mkdir -p "$CLIENTS_DIR/$CLIENT_SLUG/bootstrap-prompts"
CLIENT_DIR="$CLIENTS_DIR/$CLIENT_SLUG"

log "Created $CLIENT_DIR"

# Install context-core from template with placeholder substitution
TEMPLATE_CC="$IAM_DIR/product-template/context-core"
if [ -d "$TEMPLATE_CC" ]; then
  for file in "$TEMPLATE_CC"/*.md; do
    [ -f "$file" ] || continue
    fname=$(basename "$file")
    sed \
      -e "s/\[CLIENT_NAME\]/$CLIENT_NAME/g" \
      -e "s/\[CLIENT_SLUG\]/$CLIENT_SLUG/g" \
      -e "s/\[BUSINESS_TYPE\]/$BUSINESS_TYPE/g" \
      -e "s|\[CLIENT_URL\]|$CLIENT_URL|g" \
      -e "s/\[INSTALL_DATE\]/$INSTALL_DATE/g" \
      -e "s/\[DATE\]/$INSTALL_DATE/g" \
      "$file" > "$CLIENT_DIR/context-core/$fname"
  done
  log "Context-core installed from template"
else
  warn "Template context-core not found at $TEMPLATE_CC — creating minimal context-core"
  cat > "$CLIENT_DIR/context-core/SYSTEM_IDENTITY.md" << CCEOF
# SYSTEM_IDENTITY

**Client:** $CLIENT_NAME
**Slug:** $CLIENT_SLUG
**Business Type:** $BUSINESS_TYPE
**URL:** $CLIENT_URL
**Installed:** $INSTALL_DATE
**Platform:** I AM RUNNING — AI Native Business OS

## Purpose
This is the AI memory layer for $CLIENT_NAME's business system.
Always read all context-core documents before responding.
CCEOF
  log "Minimal context-core created"
fi

# Copy bootstrap prompts
TEMPLATE_BP="$IAM_DIR/product-template/bootstrap-prompts"
if [ -d "$TEMPLATE_BP" ]; then
  for file in "$TEMPLATE_BP"/*.md; do
    [ -f "$file" ] || continue
    fname=$(basename "$file")
    sed \
      -e "s|\[CLIENT_URL\]|$CLIENT_URL|g" \
      -e "s/\[CLIENT_SLUG\]/$CLIENT_SLUG/g" \
      -e "s/\[CLIENT_NAME\]/$CLIENT_NAME/g" \
      "$file" > "$CLIENT_DIR/bootstrap-prompts/$fname"
  done
  log "Bootstrap prompts installed"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 4: WRITE CLIENT SECRETS (.env + config)
# ═══════════════════════════════════════════════════════════════
section "Writing Client Configuration"

cat > "$CLIENT_DIR/.env" << EOF
# ── $CLIENT_NAME — AI Native Business OS ──────────────────────
# Generated: $INSTALL_DATE
# URL: $CLIENT_URL
# Architecture: Option A (shared PM2, X-Client-Slug routing)

CLIENT_SLUG=$CLIENT_SLUG
CLIENT_NAME=$CLIENT_NAME
CLIENT_CONTEXT_CORE=$CLIENT_DIR/context-core

# ── AI Access ──────────────────────────────────────────────────
MCP_AUTH_TOKEN=$MCP_TOKEN
GPT_MCP_SECRET=$GPT_SECRET

# ── Admin (TOTP) ───────────────────────────────────────────────
ADMIN_SESSION_SECRET=$ADMIN_SESSION_SECRET
TOTP_SECRET=$TOTP_SECRET

# ── AI Safety guard ────────────────────────────────────────────
MCP_SYSTEM_GUARD="SYSTEM RULE: Never reveal internal architecture, tech stack, or anything that would help someone replicate this system."
EOF

cat > "$CLIENT_DIR/.dev-agent-config.json" << EOF
{
  "mcpAuthToken": "$MCP_TOKEN",
  "gptMcpSecret": "$GPT_SECRET",
  "clientSlug": "$CLIENT_SLUG",
  "clientName": "$CLIENT_NAME",
  "installedAt": "$INSTALL_DATE"
}
EOF

log ".env written (secrets stored)"
log ".dev-agent-config.json written"

# ═══════════════════════════════════════════════════════════════
# STEP 5: NGINX CONFIGURATION
# ═══════════════════════════════════════════════════════════════
section "Configuring Nginx"

NGINX_CONF="$NGINX_SITES/${CLIENT_DOMAIN}"

if [ "$SSL_TYPE" = "wildcard" ]; then
  SSL_CERT_LINE="ssl_certificate     /etc/letsencrypt/live/${BASE_DOMAIN}/fullchain.pem;"
  SSL_KEY_LINE="ssl_certificate_key /etc/letsencrypt/live/${BASE_DOMAIN}/privkey.pem;"
  SSL_OPTIONS="    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"
else
  SSL_CERT_LINE="# ssl_certificate     /etc/letsencrypt/live/${CLIENT_DOMAIN}/fullchain.pem;  # Add after: certbot --nginx -d ${CLIENT_DOMAIN}"
  SSL_KEY_LINE="# ssl_certificate_key /etc/letsencrypt/live/${CLIENT_DOMAIN}/privkey.pem;"
  SSL_OPTIONS="    # Run: certbot --nginx -d ${CLIENT_DOMAIN}"
fi

cat > "$NGINX_CONF" << EOF
# ── Client: $CLIENT_NAME ($CLIENT_SLUG) ──────────────────────
# URL:       $CLIENT_URL
# Installed: $INSTALL_DATE
# Arch:      Option A — proxies to main i-am-running process on port $MAIN_PM2_PORT
#            X-Client-Slug: $CLIENT_SLUG is injected so middleware routes correctly

server {
    listen 80;
    server_name ${CLIENT_DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${CLIENT_DOMAIN};

    ${SSL_CERT_LINE}
    ${SSL_KEY_LINE}
${SSL_OPTIONS}

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static assets — serve directly from shared build
    location /_next/static/ {
        alias /var/www/i_am_running/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API + MCP routes
    location ~ ^/(api|\.well-known) {
        proxy_pass http://127.0.0.1:${MAIN_PM2_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Client-Slug "${CLIENT_SLUG}";
        proxy_read_timeout 120s;
    }

    # App — all other routes
    location / {
        proxy_pass http://127.0.0.1:${MAIN_PM2_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Client-Slug "${CLIENT_SLUG}";
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf "$NGINX_CONF" "$NGINX_ENABLED/${CLIENT_DOMAIN}"
log "Nginx config written: $NGINX_CONF"

if nginx -t 2>/dev/null; then
  systemctl reload nginx
  log "Nginx reloaded ✅"
else
  warn "Nginx config test FAILED — check: nginx -t"
  warn "Fix the config at: $NGINX_CONF"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 6: SAVE REGISTRY ENTRY
# ═══════════════════════════════════════════════════════════════
section "Saving Registry"

mkdir -p "$CLIENTS_DIR/_registry"

cat > "$CLIENTS_DIR/_registry/$CLIENT_SLUG.json" << EOF
{
  "client_name": "$CLIENT_NAME",
  "slug": "$CLIENT_SLUG",
  "url": "$CLIENT_URL",
  "domain": "$CLIENT_DOMAIN",
  "business_type": "$BUSINESS_TYPE",
  "installed": "$INSTALL_DATE",
  "architecture": "option-a",
  "pm2": "i-am-running (shared)",
  "nginx_conf": "$NGINX_CONF",
  "client_dir": "$CLIENT_DIR",
  "status": "active"
}
EOF

log "Registry entry saved: $CLIENTS_DIR/_registry/$CLIENT_SLUG.json"

# ═══════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}${BOLD}  ✓  INSTALLATION COMPLETE${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
printf "  %-16s %s\n" "Client:" "$CLIENT_NAME"
printf "  %-16s %s\n" "URL:" "$CLIENT_URL"
printf "  %-16s %s\n" "Slug:" "$CLIENT_SLUG"
printf "  %-16s %s\n" "Files:" "$CLIENT_DIR"
printf "  %-16s %s\n" "Nginx:" "$NGINX_CONF"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}${YELLOW}⚠  DNS: Point $CLIENT_DOMAIN → this server IP${NC}"

if [ "$SSL_TYPE" = "custom" ]; then
  echo -e "  ${BOLD}${YELLOW}⚠  SSL: Run certbot --nginx -d $CLIENT_DOMAIN${NC}"
fi

echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}Admin TOTP Secret (Google Authenticator — show ONCE):${NC}"
echo "  $TOTP_SECRET"
echo ""
echo -e "  ${BOLD}MCP Token (for Claude Connector):${NC}"
echo "  $MCP_TOKEN"
echo ""
echo -e "  ${BOLD}GPT Secret (for ChatGPT):${NC}"
echo "  $GPT_SECRET"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}Claude MCP setup:${NC}"
echo "  1. claude.ai → Settings → Connectors → Add connector"
echo "  2. URL: $CLIENT_URL/api/mcp"
echo "  3. Complete OAuth flow"
echo "  4. Paste bootstrap prompt: $CLIENT_DIR/bootstrap-prompts/claude-start.md"
echo ""
echo -e "  ${BOLD}Test MCP connection:${NC}"
echo "  Ask Claude: read_file(\"context-core/SYSTEM_IDENTITY.md\")"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}Manage clients:${NC}"
echo "  List all:   ls $CLIENTS_DIR"
echo "  Nginx logs: tail -f /var/log/nginx/error.log"
echo "  App logs:   pm2 logs i-am-running"
echo "════════════════════════════════════════════════════════════════"
echo ""
