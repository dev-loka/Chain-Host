# Chain Host — Hardening Guide

## Overview

This document covers all security hardening measures implemented in Chain Host and additional steps to take before production deployment.

---

## 1. Network Isolation

Chain Host uses **5 isolated Docker networks** to enforce the principle of least privilege:

| Network | Purpose | Internal Only |
|---------|---------|:---:|
| `proxy` | Traefik ↔ public-facing services | ❌ |
| `backend` | API ↔ databases ↔ storage | ✅ |
| `mail` | Mail server ↔ webmail | ❌ (ports 25,465,587,993) |
| `monitoring` | Prometheus ↔ exporters ↔ Grafana | ✅ |
| `crowdsec` | CrowdSec ↔ bouncer ↔ Traefik | ✅ |

**Key**: Backend services (Postgres, Redis, MinIO) are on `internal: true` networks — they cannot be reached from the internet.

---

## 2. Container Security

Every service follows these principles:

- **`security_opt: no-new-privileges:true`** — prevents privilege escalation
- **`read_only: true`** — filesystem is read-only where possible (backend, frontend)
- **Non-root users** — backend runs as UID 1001, Prometheus as UID 65534
- **Resource limits** — CPU/memory limits on database services
- **Health checks** — every service has health checks for automatic restart
- **Minimal images** — Alpine-based images where available

---

## 3. Traefik Reverse Proxy

### TLS Configuration
- **Minimum TLS 1.2** with strong cipher suites
- **TLS 1.3** available for modern clients
- **Automatic Let's Encrypt certificates** with HTTP challenge
- **HSTS** with 1-year preload

### Security Headers
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Rate Limiting
- **Global**: 100 requests/minute with burst of 50
- **Auth endpoints**: 5 requests/15 minutes (brute-force protection)
- **API**: 1000 requests/15 minutes

---

## 4. CrowdSec Integration

[CrowdSec](https://crowdsec.net/) provides community-driven threat intelligence:

- Analyzes Traefik access logs in real-time
- Blocks known malicious IPs via the bouncer middleware
- Shares threat signals with the CrowdSec network
- Collections installed: `traefik`, `http-cve`, `linux`, `nginx`

### Setup Steps
1. CrowdSec container starts automatically
2. Register your instance: `docker exec chainhost-crowdsec cscli hub update`
3. Generate bouncer key: `docker exec chainhost-crowdsec cscli bouncers add traefik-bouncer`
4. Add key to `.env` as `CROWDSEC_BOUNCER_KEY`

---

## 5. Database Security

### PostgreSQL
- **SCRAM-SHA-256** authentication (not MD5)
- **Connection pooling** via PgBouncer (prevents connection flooding)
- **Port bound to 127.0.0.1** — no external access
- **Extensions**: `pgcrypto` for server-side encryption

### Redis
- **Password authentication** required
- **Dangerous commands disabled**: `FLUSHALL`, `FLUSHDB`, `DEBUG` are renamed to empty strings
- **Max memory limit**: 256MB with LRU eviction
- **Protected mode** enabled
- **AOF persistence** enabled

---

## 6. Authentication Security

- **bcrypt** with 12 rounds for password hashing
- **JWT** with short-lived access tokens (24h) and refresh token rotation
- **SIWE** (Sign-In With Ethereum) for wallet-based login
- **Session tracking** with IP and user-agent logging
- **Brute-force protection** via Redis-tracked failed attempts
- **Zod validation** on all input schemas

---

## 7. Email Hardening

- **SPF, DKIM, DMARC** all enabled via docker-mailserver
- **ClamAV** antivirus scanning on all incoming mail
- **Rspamd/SpamAssassin** spam filtering
- **Fail2Ban** for SMTP brute-force protection
- **Postgrey** greylisting with 5-minute delay
- **No open relay** — `PERMIT_DOCKER=none`
- **SMTP relay fallback** — configure for reliable outbound delivery

### Pre-deployment Email Checklist
- [ ] Set up reverse DNS (PTR record) for your mail IP
- [ ] Add SPF record: `v=spf1 ip4:YOUR_IP -all`
- [ ] Generate DKIM keys and add DNS record
- [ ] Add DMARC record: `v=DMARC1; p=quarantine; rua=mailto:postmaster@domain`
- [ ] Test with [MXToolbox](https://mxtoolbox.com/) and [mail-tester.com](https://www.mail-tester.com/)
- [ ] Warm up IP gradually before sending bulk email

---

## 8. Backup & Recovery

- **Automated daily backups** at 3 AM UTC
- **AES-256 encryption** of backup archives
- **30-day retention** with automatic cleanup
- **Covers**: PostgreSQL (all databases), mail data, Forgejo repos
- **Stored in MinIO** (can be configured for off-site S3)

### Restore Procedure
```bash
# Decrypt backup
openssl enc -d -aes-256-cbc -pbkdf2 \
  -in backup.tar.gz.enc -out backup.tar.gz \
  -pass pass:YOUR_KEY

# Extract
tar -xzf backup.tar.gz

# Restore PostgreSQL
pg_restore -h postgres -U chainhost -d chainhost postgres_chainhost.dump
```

---

## 9. Monitoring & Alerting

### Alert Rules
| Alert | Threshold | Severity |
|-------|-----------|----------|
| High CPU | >70% for 5min | Warning |
| High Memory | >85% for 5min | Warning |
| Disk Space Low | >80% for 5min | Critical |
| Container Down | 1min missing | Critical |
| Container Restart Loop | >0.1 restarts/15min | Critical |
| Postgres Down | Immediate | Critical |
| High Error Rate | >5% 5xx for 5min | Critical |
| High Latency | >2s p95 for 5min | Warning |
| SSL Expiry | <14 days | Warning |

### Recommended: Connect Alerts to n8n
Configure n8n webhooks in `alertmanager.yml` to receive alerts and trigger actions (email, Slack, Discord, etc.)

---

## 10. Pre-Production Checklist

- [ ] Change ALL passwords in `.env` (use `openssl rand -hex 32`)
- [ ] Set proper `DOMAIN` and `ACME_EMAIL`
- [ ] Configure firewall: allow only 80, 443, 25, 465, 587, 993, 2222
- [ ] Set up reverse DNS for mail IP
- [ ] Generate DKIM keys
- [ ] Test CrowdSec bouncer connection
- [ ] Verify Grafana dashboards show data
- [ ] Test backup & restore procedure
- [ ] Enable 2FA for admin accounts
- [ ] Review and customize rate limits
- [ ] Set up off-site backup destination
- [ ] Run security scan (e.g., `trivy image` on all containers)
