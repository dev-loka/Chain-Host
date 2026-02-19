# Chain Host — Deployment Guide

## Prerequisites

- **OS**: Ubuntu 22.04+ / Debian 12+ (recommended)
- **Docker**: Engine 24+ with Compose v2
- **RAM**: 4GB minimum, 8GB recommended
- **CPU**: 2 cores minimum, 4 recommended
- **Storage**: 50GB SSD minimum, 200GB recommended
- **Domain**: A domain name with DNS access
- **IP**: Static IP (required for email)

---

## Step 1: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

---

## Step 2: Clone & Configure

```bash
# Clone the repository
git clone https://github.com/dev-loka/chain-host.git
cd chain-host

# Create environment file
cp .env.example .env
```

### Generate Secrets
```bash
# Generate strong passwords
echo "JWT_SECRET=$(openssl rand -hex 32)" 
echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)"
echo "REDIS_PASSWORD=$(openssl rand -hex 16)"
echo "MINIO_ROOT_PASSWORD=$(openssl rand -hex 16)"
echo "N8N_ENCRYPTION_KEY=$(openssl rand -hex 16)"
echo "FORGEJO_SECRET_KEY=$(openssl rand -hex 16)"
echo "BACKUP_ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "GF_SECURITY_ADMIN_PASSWORD=$(openssl rand -hex 12)"
echo "N8N_BASIC_AUTH_PASSWORD=$(openssl rand -hex 12)"
```

### Configure Domain
Edit `.env`:
```env
DOMAIN=your-domain.com
ACME_EMAIL=admin@your-domain.com
MAIL_DOMAIN=your-domain.com
MAIL_HOSTNAME=mail.your-domain.com
```

---

## Step 3: DNS Configuration

Add these DNS records:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `YOUR_SERVER_IP` |
| A | `www` | `YOUR_SERVER_IP` |
| A | `api` | `YOUR_SERVER_IP` |
| A | `git` | `YOUR_SERVER_IP` |
| A | `grafana` | `YOUR_SERVER_IP` |
| A | `n8n` | `YOUR_SERVER_IP` |
| A | `mail` | `YOUR_SERVER_IP` |
| A | `storage` | `YOUR_SERVER_IP` |
| A | `traefik` | `YOUR_SERVER_IP` |
| MX | `@` | `mail.your-domain.com` (priority 10) |
| TXT | `@` | `v=spf1 ip4:YOUR_IP -all` |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:postmaster@your-domain.com` |
| PTR | `YOUR_IP` | `mail.your-domain.com` (set via hosting provider) |

---

## Step 4: Firewall Setup

```bash
# Install UFW
sudo apt install -y ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow required ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect to HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 25/tcp    # SMTP
sudo ufw allow 465/tcp   # SMTPS
sudo ufw allow 587/tcp   # Submission
sudo ufw allow 993/tcp   # IMAPS
sudo ufw allow 2222/tcp  # Forgejo SSH

# Enable
sudo ufw enable
```

---

## Step 5: Launch

```bash
# Build custom images
docker compose build

# Start all services
docker compose up -d

# Watch logs
docker compose logs -f

# Check status
docker compose ps
```

---

## Step 6: Post-Deployment Setup

### Create Admin User
```bash
# Access backend container
docker exec -it chainhost-backend sh

# Or use the API
curl -X POST https://api.your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@your-domain.com","password":"YourSecurePassword"}'
```

### Configure Email (DKIM)
```bash
# Generate DKIM keys
docker exec -it chainhost-mailserver setup config dkim

# Get the DKIM DNS record
docker exec -it chainhost-mailserver cat /tmp/docker-mailserver/opendkim/keys/your-domain.com/mail.txt
```

Add the DKIM TXT record to your DNS.

### Create Email Account
```bash
docker exec -it chainhost-mailserver setup email add admin@your-domain.com
```

### Set Up CrowdSec
```bash
# Enroll in CrowdSec console (optional, for cloud dashboard)
docker exec chainhost-crowdsec cscli console enroll YOUR_ENROLLMENT_KEY

# Generate bouncer API key
docker exec chainhost-crowdsec cscli bouncers add traefik-bouncer
# Add the key to .env as CROWDSEC_BOUNCER_KEY

# Restart bouncer
docker compose restart crowdsec-bouncer
```

---

## Step 7: Verify Everything

```bash
# Test health endpoint
curl https://api.your-domain.com/health

# Test SSL
curl -vI https://your-domain.com 2>&1 | grep "SSL certificate"

# Test email (send test)
docker exec -it chainhost-mailserver setup email test admin@your-domain.com

# Check Grafana dashboards
# Visit https://grafana.your-domain.com

# Test backup manually
docker exec -it chainhost-backup /usr/local/bin/backup.sh
```

---

## Maintenance

### Updates
```bash
# Pull latest images
docker compose pull

# Rebuild custom images
docker compose build --no-cache

# Rolling update
docker compose up -d --remove-orphans
```

### Database Migrations
```bash
docker exec -it chainhost-backend npx prisma migrate deploy
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 mailserver
```

### Restart Service
```bash
docker compose restart backend
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| SSL not working | Check DNS propagation, verify ports 80/443 open |
| Email blacklisted | Check rDNS, SPF/DKIM/DMARC, warm up IP |
| Postgres connection refused | Check `POSTGRES_PASSWORD` matches in all services |
| Redis auth error | Verify `REDIS_PASSWORD` in `.env` |
| CrowdSec blocking legit traffic | `docker exec chainhost-crowdsec cscli decisions list` |
| High memory usage | Disable ClamAV (`ENABLE_CLAMAV=0`) to save ~1GB |
