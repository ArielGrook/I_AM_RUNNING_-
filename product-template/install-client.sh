#!/bin/bash
# ============================================================
# I AM RUNNING — Client Installation Script
# AI Native Business Operating System
# Version: 1.0.0
# ============================================================
# Usage:
#   sudo bash install-client.sh
#
# What this script does:
#   1. Collects client info (name, subdomain, domain)
#   2. Creates isolated client directory on server
#   3. Copies and configures context-core template
#   4. Generates unique MCP token and GPT secret
#   5. Creates .env for client instance
#   6. Configures Nginx virtual host + SSL
#   7. Starts client instance via PM2
#   8. Prints final connection instructions
# ============================================================

set -e

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Config ───────────────────────────────────────────────────
TEMPLATE_DIR="/var/www/i_am_running"
CLIENTS_DIR="/var/www/iam-clients"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
BASE_DOMAIN="iamrunning.online"
BASE_PORT=3100  # client instances start from this port

# ── Banner ───────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}"
echo "  ██╗ █████╗ ███╗   ███╗    ██████╗ ██╗   ██╗███╗   ██╗███╗   ██╗██╗███╗   ██╗ ██████╗ "
echo "  ██║██╔══██╗████╗ ████║    ██╔══██╗██║   ██║████╗  ██║████╗  ██║██║████╗  ██║██╔════╝ "
echo "  ██║███████║██╔████╔██║    ██████╔╝██║   ██║██╔██╗ ██║██╔██╗ ██║██║██╔██╗ ██║██║  ███╗"
echo "  ██║██╔══██║██║╚██╔╝██║    ██╔══██╗██║   ██║██║╚██╗██║██║╚██╗██║██║██║╚██╗██║██║   ██║"
echo "  ██║██║  ██║██║ ╚═╝ ██║    ██║  ██║╚██████╔╝██║ ╚████║██║ ╚████║██║██║ ╚████║╚██████╔╝"
echo "  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝ "
echo -e "${NC}"
echo -e "${BOLD}  AI Native Business Operating System — Client Installer${NC}"
echo -e "  ${BLUE}https://iamrunning.online${NC}"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# ── Check root ────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}✗ Run as root: sudo bash install-client.sh${NC}"
  exit 1
fi

# ── Helpers ───────────────────────────────────────────────────
log()     { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }
section() { echo ""; echo -e "${BOLD}${BLUE}── $1 ──────────────────────────────${NC}"; echo ""; }
gen_secret() { node -e "const {randomBytes}=require('crypto'); process.stdout.write(randomBytes(32).toString('hex'))"; }

# ── Find next available port ──────────────────────────────────
find_free_port() {
  local port=$BASE_PORT
  while pm2 list 2>/dev/null | grep -q ":$port"; do
    port=$((port + 1))
  done
  echo $port
}

# ── Count existing clients ────────────────────────────────────
client_count() {
  ls "$CLIENTS_DIR" 2>/dev/null | wc -l | tr -d ' '
}

# ═══════════════════════════════════════════════════════════════
# STEP 1: COLLECT CLIENT INFO
# ═══════════════════════════════════════════════════════════════
section "Client Information"

echo -e "${BOLD}Current clients installed:${NC} $(client_count)"
echo ""

read -p "Client name (e.g. 'Acme Corp'): " CLIENT_NAME
[ -z "$CLIENT_NAME" ] && error "Client name is required"

read -p "Subdomain slug (e.g. 'acme', no spaces): " CLIENT_SLUG
CLIENT_SLUG=$(echo "$CLIENT_SLUG" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')
[ -z "$CLIENT_SLUG" ] && error "Subdomain is required"

# Check slug not already taken
if [ -d "$CLIENTS_DIR/$CLIENT_SLUG" ]; then
  error "Client '$CLIENT_SLUG' already exists at $CLIENTS_DIR/$CLIENT_SLUG"
fi

read -p "Client's own domain (optional, press Enter to skip): " CLIENT_DOMAIN
read -p "Business type (e.g. 'digital agency', 'SaaS startup'): " BUSINESS_TYPE
read -p "Admin email for this client: " ADMIN_EMAIL

CLIENT_URL="https://${CLIENT_SLUG}.${BASE_DOMAIN}"
CLIENT_PORT=$(find_free_port)
INSTALL_DATE=$(date '+%Y-%m-%d')

echo ""
echo -e "${BOLD}About to install:${NC}"
echo "  Client:    $CLIENT_NAME"
echo "  Slug:      $CLIENT_SLUG"
echo "  URL:       $CLIENT_URL"
echo "  Port:      $CLIENT_PORT"
echo "  Business:  $BUSINESS_TYPE"
echo ""
read -p "Confirm? (y/N): " CONFIRM
[ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ] && { echo "Cancelled."; exit 0; }

# ═══════════════════════════════════════════════════════════════
# STEP 2: GENERATE SECRETS
# ═══════════════════════════════════════════════════════════════
section "Generating Secrets"

MCP_TOKEN=$(gen_secret)
GPT_SECRET=$(gen_secret)
ADMIN_SESSION_SECRET=$(gen_secret)

log "MCP token generated"
log "GPT secret generated"
log "Admin session secret generated"

# ═══════════════════════════════════════════════════════════════
# STEP 3: CREATE CLIENT DIRECTORY
# ═══════════════════════════════════════════════════════════════
section "Setting Up Client Directory"

mkdir -p "$CLIENTS_DIR/$CLIENT_SLUG"
CLIENT_DIR="$CLIENTS_DIR/$CLIENT_SLUG"

log "Created $CLIENT_DIR"

# Clone or copy the template project
if [ -d "$TEMPLATE_DIR/.git" ]; then
  git clone "$TEMPLATE_DIR" "$CLIENT_DIR/app" --quiet
  log "Cloned project from $TEMPLATE_DIR"
else
  cp -r "$TEMPLATE_DIR" "$CLIENT_DIR/app"
  log "Copied project from $TEMPLATE_DIR"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 4: INSTALL CONTEXT-CORE
# ═══════════════════════════════════════════════════════════════
section "Installing Context-Core"

TEMPLATE_CC="$TEMPLATE_DIR/product-template/context-core"
CLIENT_CC="$CLIENT_DIR/app/context-core"

if [ -d "$TEMPLATE_CC" ]; then
  # Copy template and replace placeholders
  for file in "$TEMPLATE_CC"/*.md; do
    filename=$(basename "$file")
    sed \
      -e "s/\[CLIENT_NAME\]/$CLIENT_NAME/g" \
      -e "s/\[CLIENT_SLUG\]/$CLIENT_SLUG/g" \
      -e "s/\[CLIENT_DOMAIN\]/${CLIENT_DOMAIN:-$CLIENT_URL}/g" \
      -e "s|\[https://CLIENT_SUBDOMAIN.iamrunning.online\]|$CLIENT_URL|g" \
      -e "s/\[BUSINESS_TYPE\]/$BUSINESS_TYPE/g" \
      -e "s/\[INSTALL_DATE\]/$INSTALL_DATE/g" \
      -e "s/\[DATE\]/$INSTALL_DATE/g" \
      "$file" > "$CLIENT_CC/$filename"
  done
  log "Context-core installed (${INSTALL_DATE})"
else
  warn "Template context-core not found — using existing context-core"
fi

# Copy bootstrap prompts
TEMPLATE_BP="$TEMPLATE_DIR/product-template/bootstrap-prompts"
CLIENT_BP="$CLIENT_DIR/app/bootstrap-prompts"

if [ -d "$TEMPLATE_BP" ]; then
  mkdir -p "$CLIENT_BP"
  for file in "$TEMPLATE_BP"/*.md; do
    filename=$(basename "$file")
    sed \
      -e "s/\[CLIENT_NAME\]/$CLIENT_NAME/g" \
      -e "s|\[CLIENT_SUBDOMAIN\]|$CLIENT_SLUG|g" \
      "$file" > "$CLIENT_BP/$filename"
  done
  log "Bootstrap prompts installed"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 5: CREATE .ENV
# ═══════════════════════════════════════════════════════════════
section "Writing .env"

# Read base .env from template (skip secrets, keep structure)
BASE_ENV="$TEMPLATE_DIR/.env"

cat > "$CLIENT_DIR/app/.env" << EOF
# ── Client: $CLIENT_NAME ──────────────────────────────────────
# Generated: $INSTALL_DATE
# DO NOT COMMIT THIS FILE

NEXT_PUBLIC_SITE_URL=$CLIENT_URL
PORT=$CLIENT_PORT
PROJECT_ROOT=$CLIENT_DIR/app

# ── AI Access ─────────────────────────────────────────────────
MCP_AUTH_TOKEN=$MCP_TOKEN
GPT_MCP_SECRET=$GPT_SECRET

# ── Admin ─────────────────────────────────────────────────────
ADMIN_SESSION_SECRET=$ADMIN_SESSION_SECRET

# ── Supabase — fill in from Supabase dashboard ────────────────
# (Use template project's Supabase or create separate project for client)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ── API Keys — fill in if client needs AI in Dev Console ─────
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
EOF

# Write MCP token to dev-agent config
cat > "$CLIENT_DIR/app/.dev-agent-config.json" << EOF
{
  "mcpAuthToken": "$MCP_TOKEN",
  "developerUserId": ""
}
EOF

log ".env created"
log ".dev-agent-config.json created"

# ═══════════════════════════════════════════════════════════════
# STEP 6: NPM INSTALL + BUILD
# ═══════════════════════════════════════════════════════════════
section "Building Client App"

cd "$CLIENT_DIR/app"

echo "Running npm install..."
npm install --silent
log "Dependencies installed"

echo "Running npm build (this takes ~2 min)..."
npm run build
log "Build complete"

# ═══════════════════════════════════════════════════════════════
# STEP 7: PM2 SETUP
# ═══════════════════════════════════════════════════════════════
section "Starting PM2 Process"

PM2_NAME="iam-$CLIENT_SLUG"

pm2 start npm \
  --name "$PM2_NAME" \
  --cwd "$CLIENT_DIR/app" \
  -- start \
  --env PORT=$CLIENT_PORT

pm2 save
log "PM2 process '$PM2_NAME' started on port $CLIENT_PORT"

# ═══════════════════════════════════════════════════════════════
# STEP 8: NGINX CONFIGURATION
# ═══════════════════════════════════════════════════════════════
section "Configuring Nginx"

NGINX_CONF="$NGINX_SITES/${CLIENT_SLUG}.${BASE_DOMAIN}"

cat > "$NGINX_CONF" << EOF
# Client: $CLIENT_NAME
# Subdomain: ${CLIENT_SLUG}.${BASE_DOMAIN}
# Generated: $INSTALL_DATE

server {
    listen 80;
    server_name ${CLIENT_SLUG}.${BASE_DOMAIN};

    # Redirect to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${CLIENT_SLUG}.${BASE_DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${BASE_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${BASE_DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Static assets served from disk
    location /_next/static/ {
        alias $CLIENT_DIR/app/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:$CLIENT_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf "$NGINX_CONF" "$NGINX_ENABLED/${CLIENT_SLUG}.${BASE_DOMAIN}"

# Test nginx config
if nginx -t 2>/dev/null; then
  systemctl reload nginx
  log "Nginx configured and reloaded"
else
  warn "Nginx config test failed — check $NGINX_CONF manually"
  warn "Run: nginx -t"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 9: SAVE INSTALLATION RECORD
# ═══════════════════════════════════════════════════════════════
section "Saving Installation Record"

REGISTRY="$CLIENTS_DIR/registry.json"

# Read existing registry or create empty
if [ -f "$REGISTRY" ]; then
  EXISTING=$(cat "$REGISTRY")
else
  EXISTING="[]"
fi

# Append new client record (simple approach)
cat > "$CLIENT_DIR/installation.json" << EOF
{
  "client_name": "$CLIENT_NAME",
  "slug": "$CLIENT_SLUG",
  "url": "$CLIENT_URL",
  "port": $CLIENT_PORT,
  "pm2_name": "$PM2_NAME",
  "business_type": "$BUSINESS_TYPE",
  "admin_email": "$ADMIN_EMAIL",
  "installed": "$INSTALL_DATE",
  "status": "active"
}
EOF

log "Installation record saved to $CLIENT_DIR/installation.json"

# ═══════════════════════════════════════════════════════════════
# STEP 10: PRINT SUMMARY
# ═══════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}${BOLD}  ✓ INSTALLATION COMPLETE${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${BOLD}Client:${NC}         $CLIENT_NAME"
echo -e "${BOLD}URL:${NC}            $CLIENT_URL"
echo -e "${BOLD}Port:${NC}           $CLIENT_PORT"
echo -e "${BOLD}PM2 process:${NC}    $PM2_NAME"
echo ""
echo -e "${BOLD}${YELLOW}⚠  REQUIRED: Fill in Supabase keys in .env${NC}"
echo "   $CLIENT_DIR/app/.env"
echo ""
echo "────────────────────────────────────────────────────────────"
echo -e "${BOLD}MCP Token (for Claude Connector):${NC}"
echo "   $MCP_TOKEN"
echo ""
echo -e "${BOLD}GPT Secret (for ChatGPT App):${NC}"
echo "   $GPT_SECRET"
echo "────────────────────────────────────────────────────────────"
echo ""
echo -e "${BOLD}Claude setup:${NC}"
echo "   1. Open claude.ai → Settings → Connectors"
echo "   2. Add: $CLIENT_URL/api/mcp"
echo "   3. Complete OAuth flow"
echo "   4. Send bootstrap prompt from: bootstrap-prompts/claude-start.md"
echo ""
echo -e "${BOLD}ChatGPT setup:${NC}"
echo "   1. Open chatgpt.com → Settings → Connected Apps"
echo "   2. Add: $CLIENT_URL/api/mcp-gpt"
echo "   3. OAuth Client ID: iamrunning-chatgpt-mcp"
echo "   4. Send bootstrap prompt from: bootstrap-prompts/chatgpt-start.md"
echo ""
echo -e "${BOLD}Next step:${NC}"
echo "   Fill in Supabase keys in .env, then rebuild:"
echo "   cd $CLIENT_DIR/app && npm run build && pm2 restart $PM2_NAME"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
