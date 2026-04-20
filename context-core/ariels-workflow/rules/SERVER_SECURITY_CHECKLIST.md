# Server Security Checklist — IAM Client OS Installation

Run this on every new server before giving client access.

---

## 1. fail2ban — Brute Force Protection

```bash
# Install
apt-get install -y fail2ban

# Configure
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
maxretry = 5
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# Verify
fail2ban-client status sshd
```

**Result:** 3 failed SSH attempts → IP banned for 24h. Protects against credential stuffing.

---

## 2. SSH Hardening — Key-Only Auth

```bash
# On client machine — generate key if needed
ssh-keygen -t ed25519 -C "iam-client-os"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server-ip

# On server — disable password auth
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
echo "PubkeyAuthentication yes" >> /etc/ssh/sshd_config

# Restart SSH (keep current session open!)
systemctl restart sshd

# Verify from new terminal before closing current session
ssh -i ~/.ssh/id_ed25519 user@server-ip
```

⚠️ Test new connection BEFORE closing existing SSH session. If locked out → need VPS console.

---

## 3. UFW Firewall

```bash
# Install and configure
apt-get install -y ufw

# Allow only what's needed
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp    # HTTP (nginx, for Let's Encrypt)
ufw allow 443/tcp   # HTTPS

# Enable
ufw --force enable
ufw status verbose
```

**Do NOT open port 3000** — Next.js runs behind nginx, never directly exposed.

---

## 4. Nginx Rate Limiting

Add to `/etc/nginx/nginx.conf` inside `http {}` block:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=mcp:10m rate=60r/m;
limit_conn_zone $binary_remote_addr zone=perip:10m;
```

Add to site config (inside `server {}` or `location /api/`):

```nginx
location /api/ {
    limit_req zone=api burst=10 nodelay;
    limit_conn perip 20;
    proxy_pass http://localhost:3000;
    proxy_set_header X-Real-IP $remote_addr;
}

location /api/mcp {
    limit_req zone=mcp burst=20 nodelay;
    proxy_pass http://localhost:3000;
    proxy_set_header X-Real-IP $remote_addr;
}
```

```bash
nginx -t && systemctl reload nginx
```

---

## 5. Health Check Script

```bash
cat > /usr/local/bin/iam-health << 'EOF'
#!/bin/bash
echo "=== IAM Client OS Health Check ==="
echo ""

# PM2 status
echo "📦 PM2 Process:"
pm2 show iam-os 2>/dev/null | grep -E "status|uptime|restarts|memory" || echo "NOT RUNNING"
echo ""

# Port check
echo "🔌 Port 3000:"
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000 && echo "" || echo "NOT RESPONDING"
echo ""

# Disk space
echo "💾 Disk:"
df -h / | tail -1
echo ""

# Memory
echo "🧠 Memory:"
free -h | grep Mem
echo ""

# fail2ban status
echo "🛡 fail2ban:"
fail2ban-client status sshd 2>/dev/null | grep "Currently banned" || echo "fail2ban not running"
echo ""

# Last deploy
echo "📋 Last Deploy:"
tail -1 /var/www/iam-os/logs/deploy.jsonl 2>/dev/null | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(f\"  {d.get('ts','')} — {d.get('status','')}\")" 2>/dev/null || echo "No deploy log"
echo ""

echo "=== Done ==="
EOF

chmod +x /usr/local/bin/iam-health
```

Usage: `iam-health` from anywhere.

---

## 6. Automatic Security Updates

```bash
apt-get install -y unattended-upgrades

cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

systemctl enable unattended-upgrades
```

---

## 7. .env Permissions

```bash
# Restrict .env.local to owner only
chmod 600 /var/www/iam-os/.env.local

# Verify
ls -la /var/www/iam-os/.env.local
# Should show: -rw------- 1 root root ...
```

---

## 8. Log Rotation

```bash
cat > /etc/logrotate.d/iam-os << 'EOF'
/var/www/iam-os/logs/*.jsonl {
    daily
    rotate 30
    compress
    missingok
    notifempty
    create 644 root root
}
EOF
```

---

## Quick Run — All At Once

```bash
# Save as /tmp/iam-secure.sh and run: bash /tmp/iam-secure.sh
apt-get update -qq
apt-get install -y fail2ban ufw unattended-upgrades

# fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
maxretry = 3
bantime = 86400
EOF
systemctl enable fail2ban && systemctl restart fail2ban

# UFW
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# .env permissions
chmod 600 /var/www/iam-os/.env.local 2>/dev/null

echo "✅ Security setup complete. Run: iam-health"
```

---

## Post-Install Verification Checklist

```
□ fail2ban running: systemctl status fail2ban
□ SSH key login works from new terminal
□ Password auth disabled: grep PasswordAuthentication /etc/ssh/sshd_config
□ UFW active: ufw status
□ Port 3000 not exposed: curl http://YOUR_IP:3000 should timeout
□ Port 443 responds: curl https://YOUR_DOMAIN
□ iam-health script returns OK
□ .env.local permissions are 600
```

---

*Run checklist on every new installation before handing over to client.*
