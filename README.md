# ⛓️ Chain Host

> **A Self-Hostable All-in-One Web Platform for Developers**

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org)

---

## 🚀 Overview

Chain Host is a **single self-hostable platform** for developers and small businesses to manage websites, workflows, and emails — while leveraging **blockchain for security, data integrity, and optional decentralization**.

### Core Modules

| Module | Description | Key Tech |
|--------|-------------|----------|
| 🌐 **Website Hosting** | Static & dynamic site hosting with SSL | Traefik, MinIO, IPFS |
| 📧 **Mail Server** | Full email stack with anti-spam | docker-mailserver, Rspamd |
| 🔧 **Developer Tools** | Git hosting, CI/CD, workflow automation | Forgejo, n8n |
| ⛓️ **Blockchain** | Identity, integrity hashing, DID | Hardhat, IPFS |
| 📊 **Monitoring** | Real-time metrics & alerting | Prometheus, Grafana |
| 🛡️ **Security** | Hardened infrastructure | Fail2Ban, WAF, CrowdSec |

---

## 📁 Project Structure

```
chain-host/
├── docker-compose.yml          # Main orchestration (22+ services)
├── docker-compose.override.yml # Local dev overrides
├── .env.example                # Environment template
├── backend/                    # Node.js API (TypeScript)
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── services/           # Business logic
│   │   ├── models/             # Prisma models
│   │   ├── middleware/         # Auth, rate-limit, WAF
│   │   └── utils/              # Helpers
│   ├── prisma/                 # Database schema & migrations
│   ├── Dockerfile              # Multi-stage build
│   └── package.json
├── frontend/                   # Next.js dashboard
│   ├── src/
│   │   ├── app/                # App router pages
│   │   ├── components/         # Reusable UI
│   │   ├── stores/             # Zustand state
│   │   └── lib/                # Utilities
│   ├── Dockerfile
│   └── package.json
├── mail/                       # Mail server config
│   ├── config/                 # Postfix/Dovecot configs
│   └── opendkim/               # DKIM keys
├── monitoring/                 # Prometheus + Grafana
│   ├── prometheus.yml
│   ├── alertmanager.yml
│   └── grafana/
│       └── dashboards/
├── security/                   # Hardening configs
│   ├── crowdsec/
│   ├── fail2ban/
│   └── traefik/
│       ├── traefik.yml
│       └── dynamic/
├── blockchain/                 # Smart contracts & tools
│   ├── contracts/
│   ├── scripts/
│   └── hardhat.config.ts
├── nginx/                      # Site hosting configs
│   └── templates/
├── backups/                    # Automated backup scripts
│   └── backup.sh
└── docs/                       # Documentation
    ├── ARCHITECTURE.md
    ├── HARDENING.md
    ├── SCALING.md
    └── DEPLOYMENT.md
```

---

## ⚡ Quick Start

### Prerequisites

- Docker Engine 24+
- Docker Compose v2+
- 4GB RAM minimum (8GB recommended)
- Domain name (for SSL/email)

### 1. Clone & Configure

```bash
git clone https://github.com/dev-loka/chain-host.git
cd chain-host
cp .env.example .env
# Edit .env with your domain, passwords, and API keys
```

### 2. Launch

```bash
docker compose up -d
```

### 3. Access

| Service | URL |
|---------|-----|
| Dashboard | `https://your-domain.com` |
| Traefik | `https://traefik.your-domain.com` |
| Forgejo (Git) | `https://git.your-domain.com` |
| Grafana | `https://grafana.your-domain.com` |
| n8n (Workflows) | `https://n8n.your-domain.com` |
| Webmail | `https://mail.your-domain.com` |

---

## 🛡️ Security Hardening (Built-in)

- **CrowdSec** community-driven threat intelligence
- **Fail2Ban** brute-force protection
- **Traefik** with rate limiting & IP whitelisting
- **Helmet.js** HTTP security headers
- **CORS** strict origin policies
- **JWT + Wallet** dual authentication
- **Automated SSL** via Let's Encrypt
- **Network isolation** via Docker networks
- **Read-only containers** where possible
- **No root** container execution

---

## 📈 Scaling Strategy

See [docs/SCALING.md](docs/SCALING.md) for full guide.

- **Horizontal**: Docker Swarm / k3s with Traefik load balancing
- **Database**: Postgres read replicas + PgBouncer connection pooling
- **Caching**: Redis Cluster for sessions & static assets
- **Async**: BullMQ job queues for email, blockchain, CI/CD
- **CDN**: Cloudflare edge caching for hosted sites
- **Monitoring**: Prometheus autoscale triggers (CPU > 70%)

---

## 🔗 Blockchain Integration

- **DID (Decentralized Identity)** — wallet-based login
- **Content Integrity** — SHA-256 hashes anchored on-chain
- **IPFS Storage** — decentralized file pinning
- **Smart Contracts** — Solidity contracts for identity registry
- **Multi-chain** — EVM compatible (Ethereum, Polygon, Base)

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by [Dev Loka](https://dev-loka.github.io)**
