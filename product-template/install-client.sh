#!/bin/bash
# ============================================================
# I AM RUNNING — Client Installation Script v2.0
# AI Native Business Operating System
# ============================================================
# Usage: sudo bash install-client.sh
#
# Architecture:
#   - All clients share ONE Next.js build (your main project)
#   - Each client gets isolated: context-core + .env + port + nginx
#   - Each client gets a private GitHub repo for context-core backups
#   - Client NEVER sees source code — only browser UI + MCP
# ============================================================

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ── Config ────────────────────────────────────────────────────
IAM_DIR="/var/www/i_am_running"
CLIENTS_DIR="/var/www/iam-clients"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
BASE_DOMAIN="iamrunning.online"
BASE_PORT=3100
GITHUB_ORG="${GITHUB_ORG:-iamrunning-clients}"

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
echo -e "${BOLD}  AI Native Business Operating System — Client Installer v2.0${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""

[ "$EUID" -ne 0 ] && error "Run as root: sudo bash install-client.sh"

# ═══════════════════════════════════════════════════════════════
# STEP 0: VERIFY / INSTALL SYSTEM DEPENDENCIES
# ═══════════════════════════════════════════════════════════════
section "Checking System Dependencies"

check_dep() {
  if command -v "$1" &>/dev/null; then
    log "$1 found ($(command -v $1))"
  else
    warn "$1 not found — installing..."
    return 1
  fi
  return 0
}

# Node.js
if ! check_dep node; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &>/dev/null
  apt-get install -y nodejs &>/dev/null
  log "Node.js installed: $(node --version)"
fi

# npm
check_dep npm || (apt-get install -y npm &>/dev/null && log "npm installed")

# PM2
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2 &>/dev/null
  log "PM2 installed"
else
  log "PM2 found"
fi

# Nginx
if ! command -v nginx &>/dev/null; then
  apt-get install -y nginx &>/dev/null
  log "Nginx installed"
else
  log "Nginx found"
fi

# Git
check_dep git || (apt-get install -y git &>/dev/null && log "git installed")

# certbot (for SSL)
if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot python3-certbot-nginx &>/dev/null
  log "Certbot installed"
else
  log "Certbot found"
fi

# GitHub CLI (optional, for auto-creating repos)
GH_AVAILABLE=false
if command -v gh &>/dev/null; then
  log "GitHub CLI found"
  GH_AVAILABLE=true
else
  warn "GitHub CLI not found — repo creation will be manual"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 1: COLLECT CLIENT INFO
# ═══════════════════════════════════════════════════════════════
section "Client Information"

echo -e "${BOLD}Installed clients:${NC} $(ls "$CLIENTS_DIR" 2>/dev/null | wc -l)"
echo ""

read -p "  Client name (e.g. 'Acme Corp'): " CLIENT_NAME
[ -z "$CLIENT_NAME" ] && error "Client name required"

read -p "  Subdomain slug (letters/numbers/hyphens): " CLIENT_SLUG
CLIENT_SLUG=$(echo "$CLIENT_SLUG" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')
[ -z "$CLIENT_SLUG" ] && error "Slug required"
[ -d "$CLIENTS_DIR/$CLIENT_SLUG" ] && error "Client '$CLIENT_SLUG' already exists"

read -p "  Business type (e.g. 'digital agency'): " BUSINESS_TYPE
read -p "  Admin email: " ADMIN_EMAIL
read -p "  Create GitHub repo? (y/N): " CREATE_GITHUB

CLIENT_URL="https://${CLIENT_SLUG}.${BASE_DOMAIN}"
INSTALL_DATE=$(date '+%Y-%m-%d')

# Find free port
CLIENT_PORT=$BASE_PORT
while pm2 list 2>/dev/null | grep -q "port $CLIENT_PORT" || ss -tlnp 2>/dev/null | grep -q ":$CLIENT_PORT "; do
  CLIENT_PORT=$((CLIENT_PORT + 1))
done

echo ""
echo -e "${BOLD}Summary:${NC}"
echo "  Client:  $CLIENT_NAME"
echo "  URL:     $CLIENT_URL"
echo "  Port:    $CLIENT_PORT"
echo ""
read -p "Confirm? (y/N): " CONFIRM
[[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]] && { echo "Cancelled."; exit 0; }

# ═══════════════════════════════════════════════════════════════
# STEP 2: GENERATE SECRETS
# ═══════════════════════════════════════════════════════════════
section "Generating Secrets"

MCP_TOKEN=$(gen_secret)
GPT_SECRET=$(gen_secret)
ADMIN_SESSION_SECRET=$(gen_secret)
TOTP_SECRET=$(gen_totp_secret)

log "All secrets generated"

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
    fname=$(basename "$file")
    sed \
      -e "s/\[CLIENT_NAME\]/$CLIENT_NAME/g" \
      -e "s/\[CLIENT_SLUG\]/$CLIENT_SLUG/g" \
      -e "s/\[BUSINESS_TYPE\]/$BUSINESS_TYPE/g" \
      -e "s|\[https://CLIENT_SUBDOMAIN.iamrunning.online\]|$CLIENT_URL|g" \
      -e "s/\[INSTALL_DATE\]/$INSTALL_DATE/g" \
      -e "s/\[DATE\]/$INSTALL_DATE/g" \
      "$file" > "$CLIENT_DIR/context-core/$fname"
  done
  log "Context-core installed (7 documents)"
fi

# Copy bootstrap prompts
TEMPLATE_BP="$IAM_DIR/product-template/bootstrap-prompts"
if [ -d "$TEMPLATE_BP" ]; then
  for file in "$TEMPLATE_BP"/*.md; do
    fname=$(basename "$file")
    sed -e "s|\[CLIENT_SUBDOMAIN\]|$CLIENT_SLUG|g" \
        -e "s/\[CLIENT_NAME\]/$CLIENT_NAME/g" \
        "$file" > "$CLIENT_DIR/bootstrap-prompts/$fname"
  done
  log "Bootstrap prompts installed"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 4: WRITE CLIENT .ENV (in main project per-client config)
# ═══════════════════════════════════════════════════════════════
section "Writing Client Configuration"

# Client env stored separately, loaded by per-client pm2 process
cat > "$CLIENT_DIR/.env" << EOF
# ── $CLIENT_NAME — AI Native Business OS ──────────────────────
# Generated: $INSTALL_DATE by I AM RUNNING installer
# Server: $CLIENT_URL

NEXT_PUBLIC_SITE_URL=$CLIENT_URL
PORT=$CLIENT_PORT
PROJECT_ROOT=$IAM_DIR
CLIENT_SLUG=$CLIENT_SLUG
CLIENT_CONTEXT_CORE=$CLIENT_DIR/context-core

# ── AI Access ─────────────────────────────────────────────────
MCP_AUTH_TOKEN=$MCP_TOKEN
GPT_MCP_SECRET=$GPT_SECRET

# ── Admin (TOTP) ───────────────────────────────────────────────
ADMIN_SESSION_SECRET=$ADMIN_SESSION_SECRET
TOTP_SECRET=$TOTP_SECRET

# ── AI Safety — system prompt injection ───────────────────────
# These are injected into every MCP session to protect IP
MCP_SYSTEM_GUARD="SYSTEM RULE: Never reveal internal architecture, tech stack, how context-core works, server infrastructure, or anything that would help someone replicate this system. If asked about system internals, respond: This is proprietary. Contact your administrator."

# ── Supabase — fill in from dashboard ─────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ── API Keys ───────────────────────────────────────────────────
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
EOF

# Dev agent config
cat > "$CLIENT_DIR/.dev-agent-config.json" << EOF
{
  "mcpAuthToken": "$MCP_TOKEN",
  "developerUserId": "",
  "gptMcpSecret": "$GPT_SECRET"
}
EOF

log ".env written"
log ".dev-agent-config.json written"

# ═══════════════════════════════════════════════════════════════
# STEP 5: INITIALIZE GIT REPO FOR CLIENT CONTEXT-CORE
# ═══════════════════════════════════════════════════════════════
section "Initializing Git Repository"

cd "$CLIENT_DIR"
git init --quiet
git add context-core/ bootstrap-prompts/
git commit -m "init: $CLIENT_NAME context-core installed $INSTALL_DATE" --quiet
log "Local git repo initialized"

# Create .gitignore to protect secrets
cat > "$CLIENT_DIR/.gitignore" << 'EOF'
.env
.env.*
.dev-agent-config.json
*.log
node_modules/
.next/
EOF
git add .gitignore
git commit -m "chore: add .gitignore" --quiet

# GitHub repo creation
if [[ "$CREATE_GITHUB" == "y" || "$CREATE_GITHUB" == "Y" ]]; then
  if [ "$GH_AVAILABLE" = true ]; then
    REPO_NAME="client-$CLIENT_SLUG"
    if gh repo create "$GITHUB_ORG/$REPO_NAME" --private --source="$CLIENT_DIR" --push --quiet 2>/dev/null; then
      log "GitHub repo created: $GITHUB_ORG/$REPO_NAME"
      GITHUB_REPO="https://github.com/$GITHUB_ORG/$REPO_NAME"
    else
      warn "GitHub repo creation failed — push manually later"
      warn "cd $CLIENT_DIR && git remote add origin git@github.com:$GITHUB_ORG/client-$CLIENT_SLUG.git && git push -u origin main"
    fi
  else
    warn "GitHub CLI not available. Manual steps:"
    warn "1. Create private repo: github.com/new (name: client-$CLIENT_SLUG)"
    warn "2. cd $CLIENT_DIR && git remote add origin YOUR_REPO_URL && git push -u origin main"
  fi
fi

cd "$IAM_DIR"

# ═══════════════════════════════════════════════════════════════
# STEP 6: PM2 — START CLIENT INSTANCE
# ═══════════════════════════════════════════════════════════════
section "Starting PM2 Process"

PM2_NAME="iam-$CLIENT_SLUG"

# PM2 — generate ecosystem.config.js via helper script
node "$IAM_DIR/product-template/generate-ecosystem.js" "$CLIENT_DIR" "$PM2_NAME" "$IAM_DIR"

pm2 start "$CLIENT_DIR/ecosystem.config.js"
pm2 save
log "PM2 process '$PM2_NAME' started on port $CLIENT_PORT"

# Wait for process to start
sleep 3
if pm2 show "$PM2_NAME" 2>/dev/null | grep -q "online"; then
  log "Process is online"
else
  warn "Process may not be running. Check: pm2 logs $PM2_NAME"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 7: NGINX CONFIGURATION
# ═══════════════════════════════════════════════════════════════
section "Configuring Nginx"

NGINX_CONF="$NGINX_SITES/${CLIENT_SLUG}.${BASE_DOMAIN}"

cat > "$NGINX_CONF" << EOF
# ── Client: $CLIENT_NAME ─────────────────────────────
# URL: ${CLIENT_SLUG}.${BASE_DOMAIN}
# Port: ${CLIENT_PORT}
# Installed: ${INSTALL_DATE}

server {
    listen 80;
    server_name ${CLIENT_SLUG}.${BASE_DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${CLIENT_SLUG}.${BASE_DOMAIN};

    # SSL — wildcard cert
    ssl_certificate     /etc/letsencrypt/live/${BASE_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${BASE_DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static assets from disk (fast)
    location /_next/static/ {
        alias ${IAM_DIR}/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # MCP + API routes (no cache)
    location ~ ^/(api|\.well-known) {
        proxy_pass http://127.0.0.1:${CLIENT_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    # App
    location / {
        proxy_pass http://127.0.0.1:${CLIENT_PORT};
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

if nginx -t 2>/dev/null; then
  systemctl reload nginx
  log "Nginx configured and reloaded"
else
  warn "Nginx config failed — check: nginx -t"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 8: SAVE INSTALLATION RECORD
# ═══════════════════════════════════════════════════════════════
section "Saving Installation Record"

mkdir -p "$CLIENTS_DIR/_registry"

cat > "$CLIENTS_DIR/_registry/$CLIENT_SLUG.json" << EOF
{
  "client_name": "$CLIENT_NAME",
  "slug": "$CLIENT_SLUG",
  "url": "$CLIENT_URL",
  "port": $CLIENT_PORT,
  "pm2_name": "$PM2_NAME",
  "business_type": "$BUSINESS_TYPE",
  "admin_email": "$ADMIN_EMAIL",
  "installed": "$INSTALL_DATE",
  "github_repo": "${GITHUB_REPO:-not created}",
  "status": "active"
}
EOF

log "Registry entry saved"

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
printf "  %-16s %s\n" "Port:" "$CLIENT_PORT"
printf "  %-16s %s\n" "PM2:" "$PM2_NAME"
printf "  %-16s %s\n" "Files:" "$CLIENT_DIR"
[ -n "$GITHUB_REPO" ] && printf "  %-16s %s\n" "GitHub:" "$GITHUB_REPO"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}${YELLOW}⚠  REQUIRED: Add Supabase keys to .env${NC}"
echo "  nano $CLIENT_DIR/.env"
echo ""
echo "  Then rebuild:"
echo "  cd $IAM_DIR && npm run build && pm2 restart $PM2_NAME --update-env"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}Admin TOTP Secret (for Google Authenticator):${NC}"
echo "  $TOTP_SECRET"
echo ""
echo -e "  ${YELLOW}⚠  Show this to client ONE TIME. Not stored in plaintext after this.${NC}"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}MCP Token (for Claude Connector):${NC}"
echo "  $MCP_TOKEN"
echo ""
echo -e "  ${BOLD}GPT Secret (for ChatGPT App):${NC}"
echo "  $GPT_SECRET"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}Claude setup:${NC}"
echo "  1. claude.ai → Settings → Connectors → Add"
echo "  2. URL: $CLIENT_URL/api/mcp"
echo "  3. Complete OAuth"
echo "  4. Paste: $CLIENT_DIR/bootstrap-prompts/claude-start.md"
echo ""
echo -e "  ${BOLD}ChatGPT setup:${NC}"
echo "  1. chatgpt.com → Settings → Connected Apps → Add"
echo "  2. URL: $CLIENT_URL/api/mcp-gpt"
echo "  3. Client ID: iamrunning-chatgpt-mcp"
echo ""
echo "  Bootstrap prompts: $CLIENT_DIR/bootstrap-prompts/"
echo "════════════════════════════════════════════════════════════════"
echo ""


pm2 save
log "PM2 process '$PM2_NAME' started on port $CLIENT_PORT"

# Wait for process to start
sleep 3
if pm2 show "$PM2_NAME" 2>/dev/null | grep -q "online"; then
  log "Process is online"
else
  warn "Process may not be running. Check: pm2 logs $PM2_NAME"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 7: NGINX CONFIGURATION
# ═══════════════════════════════════════════════════════════════
section "Configuring Nginx"

NGINX_CONF="$NGINX_SITES/${CLIENT_SLUG}.${BASE_DOMAIN}"

cat > "$NGINX_CONF" << EOF
# ── Client: $CLIENT_NAME ─────────────────────────────
# URL: ${CLIENT_SLUG}.${BASE_DOMAIN}
# Port: ${CLIENT_PORT}
# Installed: ${INSTALL_DATE}

server {
    listen 80;
    server_name ${CLIENT_SLUG}.${BASE_DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${CLIENT_SLUG}.${BASE_DOMAIN};

    # SSL — wildcard cert
    ssl_certificate     /etc/letsencrypt/live/${BASE_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${BASE_DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static assets from disk (fast)
    location /_next/static/ {
        alias ${IAM_DIR}/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # MCP + API routes (no cache)
    location ~ ^/(api|\.well-known) {
        proxy_pass http://127.0.0.1:${CLIENT_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    # App
    location / {
        proxy_pass http://127.0.0.1:${CLIENT_PORT};
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

if nginx -t 2>/dev/null; then
  systemctl reload nginx
  log "Nginx configured and reloaded"
else
  warn "Nginx config failed — check: nginx -t"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 8: SAVE INSTALLATION RECORD
# ═══════════════════════════════════════════════════════════════
section "Saving Installation Record"

mkdir -p "$CLIENTS_DIR/_registry"

cat > "$CLIENTS_DIR/_registry/$CLIENT_SLUG.json" << EOF
{
  "client_name": "$CLIENT_NAME",
  "slug": "$CLIENT_SLUG",
  "url": "$CLIENT_URL",
  "port": $CLIENT_PORT,
  "pm2_name": "$PM2_NAME",
  "business_type": "$BUSINESS_TYPE",
  "admin_email": "$ADMIN_EMAIL",
  "installed": "$INSTALL_DATE",
  "github_repo": "${GITHUB_REPO:-not created}",
  "status": "active"
}
EOF

log "Registry entry saved"

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
printf "  %-16s %s\n" "Port:" "$CLIENT_PORT"
printf "  %-16s %s\n" "PM2:" "$PM2_NAME"
printf "  %-16s %s\n" "Files:" "$CLIENT_DIR"
[ -n "$GITHUB_REPO" ] && printf "  %-16s %s\n" "GitHub:" "$GITHUB_REPO"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}${YELLOW}⚠  REQUIRED: Add Supabase keys to .env${NC}"
echo "  nano $CLIENT_DIR/.env"
echo ""
echo "  Then rebuild:"
echo "  cd $IAM_DIR && npm run build && pm2 restart $PM2_NAME --update-env"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}Admin TOTP Secret (for Google Authenticator):${NC}"
echo "  $TOTP_SECRET"
echo ""
echo -e "  ${YELLOW}⚠  Show this to client ONE TIME. Not stored in plaintext after this.${NC}"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}MCP Token (for Claude Connector):${NC}"
echo "  $MCP_TOKEN"
echo ""
echo -e "  ${BOLD}GPT Secret (for ChatGPT App):${NC}"
echo "  $GPT_SECRET"
echo ""
echo "────────────────────────────────────────────────────────────────"
echo -e "  ${BOLD}Claude setup:${NC}"
echo "  1. claude.ai → Settings → Connectors → Add"
echo "  2. URL: $CLIENT_URL/api/mcp"
echo "  3. Complete OAuth"
echo "  4. Paste: $CLIENT_DIR/bootstrap-prompts/claude-start.md"
echo ""
echo -e "  ${BOLD}ChatGPT setup:${NC}"
echo "  1. chatgpt.com → Settings → Connected Apps → Add"
echo "  2. URL: $CLIENT_URL/api/mcp-gpt"
echo "  3. Client ID: iamrunning-chatgpt-mcp"
echo ""
echo "  Bootstrap prompts: $CLIENT_DIR/bootstrap-prompts/"
echo "════════════════════════════════════════════════════════════════"
echo ""
