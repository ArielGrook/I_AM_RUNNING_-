#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# iam-client.sh — IAM Client OS installer
# 
# Installs IAM Client OS from a clean skeleton repository onto a Linux VPS.
# Defaults to ArielGrook/iam-client-skeleton but supports any fork via --github.
#
# Usage:
#   bash iam-client.sh --domain=demo.example.com --name="Demo Client" \
#                      --github-token=github_pat_XXX
#
# Interactive mode (no --domain):
#   bash iam-client.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_NAME="iam-client.sh"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
TOTAL_STEPS=11

DOMAIN=""
CLIENT_NAME=""
GITHUB_REPO="ArielGrook/iam-client-skeleton"   # Default — clean skeleton repo
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
PORT="4741"
INSTALL_PATH="/var/www/iam.client"
ADMIN_PATH="/iam.admin"
PROJECT_PATH=""
NO_LANDING=false
SKIP_SECURITY=false
SKIP_NGINX=false
UPDATE_MODE=false
DRY_RUN=false

INSTALL_COMPLETE=false
CLONED=false
CRON_INSTALLED=false
NGINX_CONFIGURED=false
PM2_STARTED=false
LOG_FILE=""

INSTANCE_ID=""
OPERATOR_TOKEN=""
OPERATOR_URL=""
IAM_CLIENT_NAME=""
IAM_PROCESS_NAME=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

step() {
  local num="$1"
  local title="$2"
  echo -e "${BLUE}=== [${num}/${TOTAL_STEPS}] ${title} ===${NC}"
}
ok() { echo -e "${GREEN}$1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
info() { echo -e "${CYAN}$1${NC}"; }
fail() { echo -e "${RED}✖ $1${NC}" >&2; exit 1; }
dry() { echo -e "${YELLOW}[DRY-RUN]${NC} $1"; }

json_escape() {
  echo "$1" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' '|'
}

setup_log_file() {
  local log_dir="$INSTALL_PATH/logs"
  mkdir -p "$log_dir"
  LOG_FILE="$log_dir/install.jsonl"
}

log_json() {
  local status="$1"
  local message="$2"
  local escaped
  escaped="$(json_escape "$message")"
  if [ -n "$LOG_FILE" ]; then
    echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"status\":\"$status\",\"message\":\"$escaped\"}" >> "$LOG_FILE"
  fi
}

usage() {
  cat <<EOF
Usage: ./scripts/iam-client.sh [options]

Options:
  --domain=DOMAIN              Client domain (example: demo.iamrunning.online)
  --name=NAME                  Client display name
  --github=OWNER/REPO          GitHub repository to clone from
                                 (default: ArielGrook/iam-client-skeleton)
  --github-token=TOKEN         GitHub fine-grained PAT
                                 — for the default skeleton repo (private), PAT must have:
                                   Contents: Read-only  |  Metadata: Read-only
                                 — PAT is used ONCE for clone, then stripped from the remote
  --port=PORT                  App port (default: 4741)
  --path=PATH                  Install path (default: /var/www/iam.client)
  --project-path=PATH          Path to customer project (symlinked as project/)
  --admin-path=PATH            Admin path (default: /iam.admin)
  --no-landing                 Skip landing page, redirect home to /dashboard
  --skip-security              Skip fail2ban/UFW setup
  --skip-nginx                 Skip nginx + certbot setup
  --update                     Update existing installation in --path (no clone)
  --dry-run                    Validate arguments, print the install plan, do nothing
  --help                       Show this help

Examples:
  # Interactive install (prompts for everything):
  bash scripts/iam-client.sh

  # Non-interactive install from default skeleton:
  bash scripts/iam-client.sh --domain=demo.example.com --name="Demo Client" \\
                             --github-token=github_pat_XXX

  # Update an existing installation:
  bash scripts/iam-client.sh --update --path=/var/www/iam.client

  # Dry-run (preview only, no side effects):
  bash scripts/iam-client.sh --dry-run --domain=demo.example.com --name=Demo \\
                             --github-token=github_pat_XXX
EOF
}

cleanup() {
  if [ "$INSTALL_COMPLETE" = true ] || [ "$DRY_RUN" = true ]; then
    return 0
  fi

  warn "Install did not finish, rollback trap is running."

  if [ "$PM2_STARTED" = true ] && command -v pm2 >/dev/null 2>&1 && [ -n "${IAM_PROCESS_NAME:-}" ]; then
    pm2 delete "$IAM_PROCESS_NAME" >/dev/null 2>&1 || true
  fi

  if [ "$NGINX_CONFIGURED" = true ] && [ -n "${DOMAIN:-}" ]; then
    local conf="/etc/nginx/sites-available/iam.$DOMAIN"
    local enabled="/etc/nginx/sites-enabled/iam.$DOMAIN"
    sudo rm -f "$enabled" "$conf" >/dev/null 2>&1 || true
    sudo nginx -t >/dev/null 2>&1 && sudo systemctl reload nginx >/dev/null 2>&1 || true
  fi

  if [ "$CLONED" = true ] && [ -d "$INSTALL_PATH/.git" ]; then
    rm -rf "$INSTALL_PATH" || true
  fi

  if [ "$CRON_INSTALLED" = true ]; then
    (
      crontab -l 2>/dev/null | sed '/# iam.client/d'
    ) | crontab - || true
  fi
}

trap cleanup EXIT

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || fail "Missing required command: $cmd"
}

is_port_busy() {
  local target_port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$target_port" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  return 1
}

validate_domain() {
  [[ "$1" =~ ^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]
}

validate_repo() {
  [[ "$1" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]
}

validate_port() {
  [[ "$1" =~ ^[0-9]+$ ]] && [ "$1" -ge 1 ] && [ "$1" -le 65535 ]
}

ask_interactive() {
  info "Interactive mode — you'll be prompted for everything."
  info "Defaults shown in brackets. Press Enter to accept."
  echo

  while true; do
    read -r -p "Domain: " DOMAIN
    validate_domain "$DOMAIN" && break
    warn "Invalid domain format."
  done

  while true; do
    read -r -p "Client name: " CLIENT_NAME
    [ -n "$CLIENT_NAME" ] && break
    warn "Client name cannot be empty."
  done

  read -r -p "GitHub repo [$GITHUB_REPO]: " repo_input
  if [ -n "$repo_input" ]; then
    GITHUB_REPO="$repo_input"
  fi
  validate_repo "$GITHUB_REPO" || fail "Invalid github repo: $GITHUB_REPO"

  while true; do
    read -r -p "Port [4741]: " port_input
    PORT="${port_input:-4741}"
    if ! validate_port "$PORT"; then
      warn "Invalid port."
      continue
    fi
    if is_port_busy "$PORT"; then
      warn "Port $PORT is already in use."
      continue
    fi
    break
  done

  read -r -p "Install path [/var/www/iam.client]: " path_input
  INSTALL_PATH="${path_input:-/var/www/iam.client}"

  read -r -p "Enable landing page? [Y/n]: " landing_input
  case "${landing_input:-Y}" in
    n|N) NO_LANDING=true ;;
    *) NO_LANDING=false ;;
  esac

  read -r -p "Enable security setup (fail2ban/UFW)? [Y/n]: " security_input
  case "${security_input:-Y}" in
    n|N) SKIP_SECURITY=true ;;
    *) SKIP_SECURITY=false ;;
  esac
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --domain=*) DOMAIN="${1#*=}" ;;
      --name=*) CLIENT_NAME="${1#*=}" ;;
      --github=*) GITHUB_REPO="${1#*=}" ;;
      --github-token=*) GITHUB_TOKEN="${1#*=}" ;;
      --port=*) PORT="${1#*=}" ;;
      --path=*) INSTALL_PATH="${1#*=}" ;;
      --project-path=*) PROJECT_PATH="${1#*=}" ;;
      --admin-path=*) ADMIN_PATH="${1#*=}" ;;
      --no-landing) NO_LANDING=true ;;
      --skip-security) SKIP_SECURITY=true ;;
      --skip-nginx) SKIP_NGINX=true ;;
      --update) UPDATE_MODE=true ;;
      --dry-run) DRY_RUN=true ;;
      --help)
        usage
        INSTALL_COMPLETE=true   # suppress cleanup trap on help exit
        exit 0
        ;;
      *)
        fail "Unknown option: $1"
        ;;
    esac
    shift
  done

  validate_port "$PORT" || fail "Invalid --port value: $PORT"
}

print_dry_run_plan() {
  echo
  info "═══ DRY-RUN PLAN ═══"
  echo "  Domain:         $DOMAIN"
  echo "  Client name:    $CLIENT_NAME"
  echo "  Skeleton repo:  $GITHUB_REPO"
  echo "  GitHub token:   $([ -n "$GITHUB_TOKEN" ] && echo "[provided, masked]" || echo "[will prompt]")"
  echo "  Port:           $PORT"
  echo "  Install path:   $INSTALL_PATH"
  echo "  Admin path:     $ADMIN_PATH"
  echo "  Landing page:   $([ "$NO_LANDING" = true ] && echo "disabled" || echo "enabled")"
  echo "  Security setup: $([ "$SKIP_SECURITY" = true ] && echo "skipped" || echo "enabled")"
  echo "  Nginx/TLS:      $([ "$SKIP_NGINX" = true ] && echo "skipped" || echo "enabled")"
  if [ -n "$PROJECT_PATH" ]; then
    echo "  Project path:   $PROJECT_PATH"
  fi
  echo
  info "Steps that would run:"
  echo "  [1/$TOTAL_STEPS] Resource check (RAM, disk, Node)"
  echo "  [2/$TOTAL_STEPS] Install dependencies (Node 20, PM2, nginx, certbot, UFW, fail2ban)"
  echo "  [3/$TOTAL_STEPS] Security hardening $([ "$SKIP_SECURITY" = true ] && echo "(SKIPPED)")"
  echo "  [4/$TOTAL_STEPS] Clone repository + reset git history (fresh start per client)"
  echo "  [5/$TOTAL_STEPS] Generate .env.local with VAPID keys, MCP token, admin session secret"
  echo "  [6/$TOTAL_STEPS] Configure nginx + certbot $([ "$SKIP_NGINX" = true ] && echo "(SKIPPED)")"
  echo "  [7/$TOTAL_STEPS] npm install + npm run build"
  echo "  [8/$TOTAL_STEPS] PM2 start + healthcheck"
  echo "  [9/$TOTAL_STEPS] Install crons (heartbeat, activity ping, daily backup)"
  echo "  [10/$TOTAL_STEPS] Optional project symlink"
  echo "  [11/$TOTAL_STEPS] Register instance with iamrunning.online monitoring + print summary"
  echo
  warn "DRY-RUN: no changes made. Remove --dry-run to install for real."
}

step_resource_check() {
  step "1" "Resource check"

  local ram_mb disk_mb
  ram_mb="$(free -m | awk '/Mem:/ {print $2}')"
  disk_mb="$(df -Pm "$INSTALL_PATH" 2>/dev/null | awk 'NR==2 {print $4}' || true)"
  if [ -z "$disk_mb" ]; then
    disk_mb="$(df -Pm / | awk 'NR==2 {print $4}')"
  fi

  [ "${ram_mb:-0}" -ge 1024 ] || fail "Need at least 1GB RAM (found ${ram_mb:-0}MB)."
  [ "${disk_mb:-0}" -ge 5120 ] || fail "Need at least 5GB free disk (found ${disk_mb:-0}MB)."

  if command -v node >/dev/null 2>&1; then
    local node_major
    node_major="$(node -v | sed 's/^v//' | cut -d. -f1)"
    [ "${node_major:-0}" -ge 18 ] || fail "Node 18+ required (found $(node -v))."
  fi

  ok "Resources look good (RAM: ${ram_mb}MB, disk: ${disk_mb}MB free)."
}

install_node20_if_missing() {
  if command -v node >/dev/null 2>&1; then
    local major
    major="$(node -v | sed 's/^v//' | cut -d. -f1)"
    if [ "${major:-0}" -ge 20 ]; then
      return 0
    fi
  fi
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
}

step_dependencies() {
  step "2" "Install dependencies"
  require_cmd apt-get
  sudo apt-get update -y

  install_node20_if_missing

  if ! command -v pm2 >/dev/null 2>&1; then
    sudo npm install -g pm2
  fi

  if ! command -v nginx >/dev/null 2>&1; then
    sudo apt-get install -y nginx
  fi

  if ! command -v certbot >/dev/null 2>&1; then
    sudo apt-get install -y certbot python3-certbot-nginx
  fi

  if ! command -v ufw >/dev/null 2>&1; then
    sudo apt-get install -y ufw
  fi

  if ! command -v fail2ban-client >/dev/null 2>&1; then
    sudo apt-get install -y fail2ban
  fi

  ok "Dependencies ready."
}

step_security() {
  if [ "$SKIP_SECURITY" = true ]; then
    step "3" "Security hardening (SKIPPED via --skip-security)"
    return 0
  fi

  step "3" "Security hardening"

  if [ ! -f /etc/fail2ban/jail.local ]; then
    sudo tee /etc/fail2ban/jail.local >/dev/null <<'EOF'
[sshd]
enabled = true
maxretry = 5
bantime = 1h
findtime = 10m
EOF
    sudo systemctl restart fail2ban || true
  fi

  sudo ufw allow OpenSSH >/dev/null 2>&1 || true
  sudo ufw allow 'Nginx Full' >/dev/null 2>&1 || true
  sudo ufw allow "$PORT" >/dev/null 2>&1 || true
  if sudo ufw status | grep -q "inactive"; then
    sudo ufw --force enable >/dev/null 2>&1 || true
  fi

  if [ ! -f /etc/nginx/snippets/iam-security-headers.conf ]; then
    sudo tee /etc/nginx/snippets/iam-security-headers.conf >/dev/null <<'EOF'
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
EOF
  fi

  ok "Security baseline applied."
}

ask_github_token_if_missing() {
  if [ -n "$GITHUB_TOKEN" ]; then
    return 0
  fi
  info "GitHub fine-grained PAT is needed to clone: $GITHUB_REPO"
  info "For the default skeleton repo (private) — PAT needs Contents: Read-only + Metadata: Read-only."
  info "The PAT is used only for the initial clone, then stripped from the git remote."
  read -r -s -p "GitHub token: " GITHUB_TOKEN
  echo
  [ -n "$GITHUB_TOKEN" ] || fail "GitHub token is required for clone."
}

step_clone() {
  step "4" "Clone repository (from $GITHUB_REPO)"

  [ -n "$DOMAIN" ] || fail "DOMAIN is required."
  [ -n "$CLIENT_NAME" ] || fail "CLIENT_NAME is required."
  [ -n "$GITHUB_REPO" ] || fail "GITHUB_REPO is required."

  validate_domain "$DOMAIN" || fail "Invalid domain: $DOMAIN"
  validate_repo "$GITHUB_REPO" || fail "Invalid github repo: $GITHUB_REPO"

  if [ -d "$INSTALL_PATH/.git" ]; then
    fail "Install path already contains a git repo: $INSTALL_PATH"
  fi
  if [ -d "$INSTALL_PATH" ] && [ "$(ls -A "$INSTALL_PATH" 2>/dev/null || true)" != "" ]; then
    fail "Install path is not empty: $INSTALL_PATH"
  fi

  mkdir -p "$(dirname "$INSTALL_PATH")"
  ask_github_token_if_missing

  git clone "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" "$INSTALL_PATH"
  CLONED=true

  # ── Reset git history — client's installation starts with a fresh tree.
  # Skeleton sync commits are not part of the client's working history;
  # updates arrive later via operator API, not git pull.
  (
    cd "$INSTALL_PATH"
    rm -rf .git
    git init -q -b main
    git add -A
    git -c user.email="install@iam.client" -c user.name="IAM Install" \
        commit -q -m "chore: initial install from ${GITHUB_REPO} at ${STARTED_AT}"
  )

  # ── Defensive sanity check: make sure data/ files exist and are empty.
  # Skeleton should provide these, but this belt-and-suspenders step ensures
  # a known-good state even if skeleton structure changes.
  mkdir -p "$INSTALL_PATH/data" "$INSTALL_PATH/logs" \
           "$INSTALL_PATH/pull-pool" "$INSTALL_PATH/memory/workers" \
           "$INSTALL_PATH/tasks" "$INSTALL_PATH/messages" "$INSTALL_PATH/workspace"
  for jsonf in tasks.json messages.json conversations.json goals.json \
               user-profiles.json task-requests.json spec-requests.json \
               push-subscriptions.json sessions.json admin-sessions.json \
               worker-presets.json settings.json; do
    local target="$INSTALL_PATH/data/$jsonf"
    if [ ! -f "$target" ] || [ ! -s "$target" ]; then
      case "$jsonf" in
        tasks.json)         echo '{ "tasks": [] }' > "$target" ;;
        messages.json)      echo '[]' > "$target" ;;
        conversations.json) echo '{ "conversations": [] }' > "$target" ;;
        goals.json)         echo '[]' > "$target" ;;
        user-profiles.json) echo '[]' > "$target" ;;
        task-requests.json) echo '{ "requests": [] }' > "$target" ;;
        spec-requests.json) echo '{ "requests": [] }' > "$target" ;;
        *)                  echo '{}' > "$target" ;;
      esac
    fi
  done

  # Ensure log files exist empty
  : > "$INSTALL_PATH/logs/activity.jsonl" 2>/dev/null || true
  : > "$INSTALL_PATH/logs/compliance.jsonl" 2>/dev/null || true
  : > "$INSTALL_PATH/logs/deploy.jsonl" 2>/dev/null || true

  setup_log_file
  log_json "info" "Repository cloned and reset to fresh history"
  ok "Repository cloned from $GITHUB_REPO (history reset, skeleton leaks not possible)."
}

generate_vapid_json() {
  (
    cd "$INSTALL_PATH"
    npx --yes web-push generate-vapid-keys --json
  )
}

step_secrets() {
  step "5" "Generate .env.local"

  IAM_CLIENT_NAME="$(echo "$CLIENT_NAME" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//')"
  [ -n "$IAM_CLIENT_NAME" ] || IAM_CLIENT_NAME="client"
  IAM_PROCESS_NAME="iam.$IAM_CLIENT_NAME"

  local mcp_token admin_secret vapid_json vapid_public vapid_private vapid_email skip_landing_val
  mcp_token="$(openssl rand -hex 32)"
  admin_secret="$(openssl rand -hex 32)"
  INSTANCE_ID="$(openssl rand -hex 8)"
  OPERATOR_TOKEN="$(openssl rand -hex 32)"
  OPERATOR_URL="https://${DOMAIN}/api/operator"
  vapid_email="mailto:admin@${DOMAIN}"
  skip_landing_val="false"
  if [ "$NO_LANDING" = true ]; then
    skip_landing_val="true"
  fi

  vapid_json="$(generate_vapid_json)"
  vapid_public="$(echo "$vapid_json" | grep -o '"publicKey":"[^"]*"' | sed 's/"publicKey":"//;s/"$//')"
  vapid_private="$(echo "$vapid_json" | grep -o '"privateKey":"[^"]*"' | sed 's/"privateKey":"//;s/"$//')"

  [ -n "$vapid_public" ] || fail "Unable to generate VAPID public key."
  [ -n "$vapid_private" ] || fail "Unable to generate VAPID private key."

  cat > "$INSTALL_PATH/.env.local" <<EOF
NODE_ENV=production
PROJECT_ROOT=$INSTALL_PATH
CLIENT_DOMAIN=https://$DOMAIN
NEXT_PUBLIC_CLIENT_DOMAIN=https://$DOMAIN
NEXT_PUBLIC_CLIENT_NAME=$CLIENT_NAME
MCP_AUTH_TOKEN=$mcp_token
ADMIN_SESSION_SECRET=$admin_secret
VAPID_PUBLIC_KEY=$vapid_public
VAPID_PRIVATE_KEY=$vapid_private
VAPID_EMAIL=$vapid_email
OPERATOR_TOKEN=$OPERATOR_TOKEN
OPERATOR_URL=$OPERATOR_URL
INSTANCE_ID=$INSTANCE_ID
IAM_CLIENT_NAME=$IAM_CLIENT_NAME
IAM_PROCESS_NAME=$IAM_PROCESS_NAME
PORT=$PORT
NEXT_PUBLIC_ADMIN_PATH=$ADMIN_PATH
NEXT_PUBLIC_SKIP_LANDING=$skip_landing_val
COOKIE_SECURE=true
EOF

  chmod 600 "$INSTALL_PATH/.env.local"
  log_json "info" ".env.local generated"
  ok ".env.local generated (chmod 600, never commit)."
}

step_nginx() {
  if [ "$SKIP_NGINX" = true ]; then
    step "6" "Nginx + certbot (SKIPPED via --skip-nginx)"
    return 0
  fi

  step "6" "Configure nginx + certbot"

  local conf="/etc/nginx/sites-available/iam.$DOMAIN"
  local enabled="/etc/nginx/sites-enabled/iam.$DOMAIN"
  local backup=""

  if [ -f "$conf" ] || [ -f "/etc/nginx/sites-available/$DOMAIN" ]; then
    warn "Nginx config for this domain already exists."
    read -r -p "Overwrite nginx config? (y/N): " confirm
    case "${confirm:-N}" in
      y|Y) ;;
      *) fail "Nginx setup cancelled by user." ;;
    esac
  fi

  if [ -f "$conf" ]; then
    backup="$(mktemp)"
    sudo cp "$conf" "$backup"
  fi

  sudo tee "$conf" >/dev/null <<EOF
server {
  listen 80;
  server_name $DOMAIN;

  location / {
    proxy_pass http://127.0.0.1:$PORT;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
  }

  include snippets/iam-security-headers.conf;
}
EOF

  sudo ln -sfn "$conf" "$enabled"
  if ! sudo nginx -t; then
    if [ -n "$backup" ]; then
      sudo cp "$backup" "$conf"
    else
      sudo rm -f "$conf" "$enabled"
    fi
    fail "nginx -t failed. Config rolled back."
  fi

  sudo systemctl reload nginx
  NGINX_CONFIGURED=true

  local resolved_ip server_ip
  resolved_ip="$(dig +short "$DOMAIN" | head -n 1 || true)"
  server_ip="$(curl -fsS -4 ifconfig.me || true)"

  if [ -n "$resolved_ip" ] && [ -n "$server_ip" ] && [ "$resolved_ip" != "$server_ip" ]; then
    warn "Domain resolves to $resolved_ip, server IP is $server_ip. SSL skipped."
    warn "Run later: certbot --nginx -d $DOMAIN"
  else
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect || warn "Certbot failed, continuing with HTTP."
  fi

  ok "Nginx configured."
}

write_ecosystem_config() {
  cat > "$INSTALL_PATH/ecosystem.config.js" <<EOF
const fs = require('fs');
const env = {};
fs.readFileSync('$INSTALL_PATH/.env.local', 'utf8').split('\\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eq = trimmed.indexOf('=');
  if (eq > 0) env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
});
module.exports = {
  apps: [{
    name: '$IAM_PROCESS_NAME',
    script: 'npm',
    args: 'start -- --port $PORT',
    cwd: '$INSTALL_PATH',
    env
  }]
};
EOF
}

step_build() {
  step "7" "Install dependencies + build"
  (
    cd "$INSTALL_PATH"
    npm install --production=false
    npm run build
  )
  write_ecosystem_config
  ok "Build completed."
}

step_pm2() {
  step "8" "PM2 start + healthcheck"
  (
    cd "$INSTALL_PATH"
    pm2 start ecosystem.config.js --only "$IAM_PROCESS_NAME"
    pm2 save
  )
  pm2 startup >/dev/null 2>&1 || warn "pm2 startup command requires manual confirmation."
  PM2_STARTED=true
  ok "PM2 process started: $IAM_PROCESS_NAME"

  # Healthcheck inline (no separate step number)
  local code="" attempt=1
  sleep 5
  while [ "$attempt" -le 6 ]; do
    code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/" || true)"
    if [ "$code" = "200" ] || [ "$code" = "307" ] || [ "$code" = "308" ]; then
      ok "Healthcheck passed (HTTP $code on port $PORT)."
      return 0
    fi
    sleep 3
    attempt=$((attempt + 1))
  done
  pm2 logs "$IAM_PROCESS_NAME" --lines 80 || true
  fail "Healthcheck failed (last HTTP code: ${code:-none})."
}

install_crons() {
  local heartbeat activity backup existing

  # Heartbeat / activity both use an external helper script — the cron line
  # stays short (no inline JSON building, no quoting hell). Helpers live in
  # the install tree so they have access to .env.local for OPERATOR_TOKEN
  # and other identity fields.
  heartbeat="*/5 * * * * $INSTALL_PATH/scripts/iam-heartbeat.sh >/dev/null 2>&1 # iam.client heartbeat"
  activity="*/5 * * * * $INSTALL_PATH/scripts/iam-activity.sh >/dev/null 2>&1 # iam.client activity"
  backup="0 3 * * * $INSTALL_PATH/scripts/iam-backup.sh \"$INSTALL_PATH\" >/dev/null 2>&1 # iam.client backup"

  existing="$(crontab -l 2>/dev/null | sed '/# iam.client/d' || true)"
  {
    [ -n "$existing" ] && echo "$existing"
    echo "$heartbeat"
    echo "$activity"
    echo "$backup"
  } | crontab -

  CRON_INSTALLED=true
}

# ── Heartbeat helper script generation ─────────────────────────────────────
#
# Writes scripts/iam-heartbeat.sh into the install tree. This runs on every
# cron tick (*/5 * * * *) and:
#   1) sources identity from $INSTALL_PATH/.env.local (OPERATOR_TOKEN,
#      INSTANCE_ID, CLIENT_DOMAIN, OPERATOR_URL, NEXT_PUBLIC_CLIENT_NAME)
#   2) reads local uptime from systemd and pm2 describe
#   3) POSTs to https://iamrunning.online/api/monitor/heartbeat with
#      Authorization: Bearer <OPERATOR_TOKEN> and a JSON body
#   4) on first run, includes operator_token in body too (server uses it
#      to register the client on first contact)
#
# The script is idempotent, safe to run manually for debugging, and
# intentionally silent on success (cron discards stdout).

write_heartbeat_script() {
  mkdir -p "$INSTALL_PATH/scripts"
  cat > "$INSTALL_PATH/scripts/iam-heartbeat.sh" <<'HEARTBEAT_EOF'
#!/bin/bash
# Sends heartbeat to iamrunning.online. Runs from cron every 5 minutes.
# Also safe to run manually for debugging: bash scripts/iam-heartbeat.sh
set -euo pipefail

INSTALL_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$INSTALL_PATH/.env.local"

[ -f "$ENV_FILE" ] || { echo "heartbeat: no .env.local" >&2; exit 1; }

# Read key=value lines, skipping comments/empty. Export them locally.
while IFS='=' read -r key value; do
  case "$key" in
    ''|\#*) continue ;;
  esac
  # Strip surrounding quotes if any
  value="${value%\"}"; value="${value#\"}"
  export "$key=$value"
done < "$ENV_FILE"

[ -n "${OPERATOR_TOKEN:-}" ] || { echo "heartbeat: OPERATOR_TOKEN missing" >&2; exit 1; }
[ -n "${INSTANCE_ID:-}" ] || { echo "heartbeat: INSTANCE_ID missing" >&2; exit 1; }
[ -n "${CLIENT_DOMAIN:-}" ] || { echo "heartbeat: CLIENT_DOMAIN missing" >&2; exit 1; }

# Strip scheme from CLIENT_DOMAIN for the body.domain field
DOMAIN_BARE="${CLIENT_DOMAIN#https://}"; DOMAIN_BARE="${DOMAIN_BARE#http://}"; DOMAIN_BARE="${DOMAIN_BARE%/}"

CLIENT_NAME="${NEXT_PUBLIC_CLIENT_NAME:-$DOMAIN_BARE}"
OPERATOR_URL_VAL="${OPERATOR_URL:-https://$DOMAIN_BARE/api/operator}"

# Current version from package.json — fallback to empty if unreadable
VERSION=""
if [ -f "$INSTALL_PATH/package.json" ]; then
  VERSION="$(node -e "try { console.log(require('$INSTALL_PATH/package.json').version || '') } catch(_) { console.log('') }" 2>/dev/null || echo "")"
fi

# Uptime of PM2 process for this install, in seconds.
# pm2 describe returns JSON; we parse pm2_env.axm_monitor or pm2_env.pm_uptime.
UPTIME_SEC=0
if command -v pm2 >/dev/null 2>&1 && [ -n "${IAM_PROCESS_NAME:-}" ]; then
  UPTIME_SEC="$(pm2 describe "$IAM_PROCESS_NAME" 2>/dev/null | node -e "
    let data = '';
    process.stdin.on('data', c => data += c);
    process.stdin.on('end', () => {
      const m = data.match(/\"pm_uptime\"\s*:\s*(\d+)/);
      if (!m) { console.log(0); return; }
      const uptimeStart = parseInt(m[1], 10);
      console.log(Math.max(0, Math.floor((Date.now() - uptimeStart) / 1000)));
    });
  " 2>/dev/null || echo "0")"
fi

# Status: degraded if http://127.0.0.1:$PORT returns non-2xx/3xx. Default ok.
STATUS="ok"
if [ -n "${PORT:-}" ]; then
  HTTP_CODE="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/" 2>/dev/null || echo "000")"
  case "$HTTP_CODE" in
    2*|3*) STATUS="ok" ;;
    *)     STATUS="degraded" ;;
  esac
fi

# Build JSON body. We always include operator_token — on first heartbeat the
# server uses it to create the record; on subsequent calls the server ignores
# the body field (auth comes from the bearer header).
BODY=$(cat <<BODY_EOF
{"instance_id":"$INSTANCE_ID","domain":"$DOMAIN_BARE","client_name":"$CLIENT_NAME","operator_url":"$OPERATOR_URL_VAL","operator_token":"$OPERATOR_TOKEN","version":"$VERSION","uptime_sec":$UPTIME_SEC,"status":"$STATUS"}
BODY_EOF
)

curl -fsS -m 15 \
  -X POST "https://iamrunning.online/api/monitor/heartbeat" \
  -H "Authorization: Bearer $OPERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BODY" >/dev/null 2>&1 || exit 0

exit 0
HEARTBEAT_EOF
  chmod 755 "$INSTALL_PATH/scripts/iam-heartbeat.sh"
}

# Activity helper — stub for now (Phase 2). Still written so the cron line
# doesn't fail with "file not found". It silently exits 0.
write_activity_script() {
  mkdir -p "$INSTALL_PATH/scripts"
  cat > "$INSTALL_PATH/scripts/iam-activity.sh" <<'ACTIVITY_EOF'
#!/bin/bash
# Activity push to iamrunning.online. Phase 2 — stub until /api/monitor/activity exists.
# Safe to leave in cron; currently does nothing and exits 0.
exit 0
ACTIVITY_EOF
  chmod 755 "$INSTALL_PATH/scripts/iam-activity.sh"
}

step_crons() {
  step "9" "Install crons (heartbeat + activity + backup)"
  write_heartbeat_script
  write_activity_script
  install_crons
  ok "Crons installed."
}

step_project_symlink() {
  step "10" "Project symlink (optional)"
  if [ -z "$PROJECT_PATH" ] && [ -t 0 ]; then
    read -r -p "Client project path (empty to skip): " PROJECT_PATH
  fi

  if [ -n "$PROJECT_PATH" ] && [ -d "$PROJECT_PATH" ]; then
    ln -sfn "$PROJECT_PATH" "$INSTALL_PATH/project"
    ok "Project linked: $PROJECT_PATH -> $INSTALL_PATH/project"
  else
    warn "Project link skipped."
  fi
}

step_register_and_summary() {
  step "11" "Register instance + summary"

  local payload
  payload=$(cat <<EOF
{"instance_id":"$INSTANCE_ID","domain":"$DOMAIN","client_name":"$CLIENT_NAME","operator_url":"$OPERATOR_URL","installed_at":"$STARTED_AT"}
EOF
)

  if ! curl -fsS -m 15 -X POST "https://iamrunning.online/api/monitor/register" -H "Content-Type: application/json" -d "$payload" >/dev/null 2>&1; then
    warn "Register endpoint unavailable, skipping."
  else
    ok "Instance registered with iamrunning.online monitoring."
  fi

  echo -e "
${GREEN}═══════════════════════════════════════════════════════${NC}
${GREEN}  IAM Client OS installed successfully${NC}
${GREEN}═══════════════════════════════════════════════════════${NC}

  URL:           https://$DOMAIN
  Admin panel:   https://$DOMAIN$ADMIN_PATH
  MCP endpoint:  https://$DOMAIN/api/mcp
  Operator API:  https://$DOMAIN/api/operator
  Port:          $PORT
  PM2 process:   $IAM_PROCESS_NAME
  Install path:  $INSTALL_PATH
  Instance ID:   $INSTANCE_ID

  ${CYAN}Next steps:${NC}
  1) Open admin panel → complete TOTP first-run setup
  2) Generate MCP token (Admin → Settings → MCP Token)
  3) Connect Claude — Settings → Integrations → Add MCP Server
  4) First message: \"Read memory. I'm setting up a fresh workspace...\"

  ${CYAN}Ops cheatsheet:${NC}
  - Check PM2:      pm2 list
  - App logs:       pm2 logs $IAM_PROCESS_NAME
  - Nginx test:     sudo nginx -t
  - Update later:   bash scripts/iam-client.sh --update --path=$INSTALL_PATH
"
}

run_update_mode() {
  step "1" "Update mode (--update)"

  [ -d "$INSTALL_PATH/.git" ] || fail "Install path is not a git repository: $INSTALL_PATH"
  [ -f "$INSTALL_PATH/.env.local" ] || fail ".env.local not found in $INSTALL_PATH"

  setup_log_file

  local old_version new_version old_major new_major old_commit has_stash
  old_commit="$(cd "$INSTALL_PATH" && git rev-parse HEAD)"
  old_version="$(cd "$INSTALL_PATH" && node -e "console.log(require('./package.json').version)")"
  has_stash=false

  if [ -x "$INSTALL_PATH/scripts/iam-backup.sh" ]; then
    "$INSTALL_PATH/scripts/iam-backup.sh" "$INSTALL_PATH"
  else
    warn "Backup script missing, skipping backup."
  fi

  if [ -n "$(cd "$INSTALL_PATH" && git status --porcelain)" ]; then
    (cd "$INSTALL_PATH" && git stash push -u -m "iam-client-auto-update-$(date +%s)")
    has_stash=true
  fi

  (
    cd "$INSTALL_PATH"
    git pull --ff-only
    npm install
    rm -rf .next
    npm run build
  )

  IAM_PROCESS_NAME="$(cd "$INSTALL_PATH" && awk -F= '/^IAM_PROCESS_NAME=/{print $2}' .env.local | tr -d '\r')"
  IAM_PROCESS_NAME="${IAM_PROCESS_NAME:-iam-os}"
  PORT="$(cd "$INSTALL_PATH" && awk -F= '/^PORT=/{print $2}' .env.local | tr -d '\r')"
  PORT="${PORT:-4741}"

  pm2 restart "$IAM_PROCESS_NAME" || fail "PM2 restart failed for $IAM_PROCESS_NAME"

  sleep 5
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/" || true)"
  if [ "$code" != "200" ] && [ "$code" != "307" ] && [ "$code" != "308" ]; then
    warn "Healthcheck failed after update. Rolling back."
    (
      cd "$INSTALL_PATH"
      git reset --hard "$old_commit"
      rm -rf .next
      npm run build
    )
    pm2 restart "$IAM_PROCESS_NAME" || true
    fail "Update failed and rollback was applied."
  fi

  new_version="$(cd "$INSTALL_PATH" && node -e "console.log(require('./package.json').version)")"
  old_major="${old_version%%.*}"
  new_major="${new_version%%.*}"
  if [ "$new_major" != "$old_major" ]; then
    warn "Major version changed ($old_version -> $new_version). Check data migrations."
  fi

  if [ "$has_stash" = true ]; then
    (cd "$INSTALL_PATH" && git stash pop >/dev/null 2>&1) || true
  fi

  log_json "success" "Update completed: $old_version -> $new_version"
  INSTALL_COMPLETE=true
  ok "Update successful: $old_version -> $new_version"
}

main_install() {
  if [ -z "$DOMAIN" ]; then
    ask_interactive
  fi

  [ -n "$DOMAIN" ] || fail "--domain is required."
  [ -n "$CLIENT_NAME" ] || fail "--name is required."
  [ -n "$GITHUB_REPO" ] || fail "--github is required."
  validate_domain "$DOMAIN" || fail "Invalid domain: $DOMAIN"
  validate_repo "$GITHUB_REPO" || fail "Invalid github repo: $GITHUB_REPO"
  is_port_busy "$PORT" && fail "Port $PORT is already in use."

  if [ "$DRY_RUN" = true ]; then
    print_dry_run_plan
    INSTALL_COMPLETE=true
    return 0
  fi

  step_resource_check
  step_dependencies
  step_security
  step_clone
  step_secrets
  step_nginx
  step_build
  step_pm2
  step_crons
  step_project_symlink
  step_register_and_summary

  INSTALL_COMPLETE=true
  log_json "success" "Install completed for $DOMAIN"
  ok "Install complete."
}

main() {
  parse_args "$@"
  if [ "$UPDATE_MODE" = true ]; then
    run_update_mode
  else
    main_install
  fi
}

main "$@"
