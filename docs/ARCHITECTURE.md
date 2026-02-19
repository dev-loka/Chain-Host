# Chain Host — Architecture

## System Architecture Diagram

```
                        ┌─── Internet ───┐
                        │                │
                   ┌────▼────┐     ┌─────▼─────┐
                   │ Port 80 │     │ Port 443  │
                   └────┬────┘     └─────┬─────┘
                        │                │
                   ┌────▼────────────────▼────┐
                   │      TRAEFIK v3          │ ← CrowdSec Bouncer
                   │   (Reverse Proxy + SSL)  │
                   └──┬──┬──┬──┬──┬──┬──┬──┬──┘
                      │  │  │  │  │  │  │  │
          ┌───────────┘  │  │  │  │  │  │  └───────────┐
          ▼              ▼  │  │  │  ▼  │              ▼
     ┌─────────┐    ┌──────┐│  │  │┌────┴──┐    ┌──────────┐
     │Frontend │    │ API  ││  │  ││Forgejo│    │ Grafana  │
     │ Next.js │    │Node  ││  │  ││ (Git) │    │Dashboard │
     └─────────┘    └──┬───┘│  │  │└───────┘    └──────────┘
                       │    │  │  │
              ┌────────┘    │  │  │
              ▼             ▼  ▼  ▼
     ┌─────────────┐   ┌──────┐ ┌──────────┐
     │  PgBouncer  │   │ n8n  │ │Roundcube │
     └──────┬──────┘   └──────┘ └────┬─────┘
            │                        │
     ┌──────▼──────┐          ┌──────▼──────┐
     │ PostgreSQL  │          │ Mail Server │
     │    16       │          │ (Postfix +  │
     └─────────────┘          │  Dovecot)   │
                              └─────────────┘
     ┌─────────────┐
     │   Redis 7   │ ◄── Sessions, Cache, BullMQ
     └─────────────┘

     ┌─────────────┐   ┌─────────────┐
     │    MinIO     │   │    IPFS     │ ◄── Decentralized storage
     │ (S3 storage) │   │   (Kubo)    │
     └─────────────┘   └─────────────┘

     ┌─────────────┐   ┌─────────────┐
     │  Ganache /   │   │  BullMQ     │
     │  EVM Chain   │   │  Workers    │ ◄── Background jobs
     └─────────────┘   └─────────────┘

     ┌──────────────────────────────────┐
     │         MONITORING STACK         │
     │  Prometheus → Grafana            │
     │  Node Exporter │ cAdvisor        │
     │  Postgres Exp  │ Redis Exporter  │
     │  Alertmanager → n8n webhooks     │
     └──────────────────────────────────┘

     ┌──────────────────────────────────┐
     │         SECURITY STACK           │
     │  CrowdSec → Traefik Bouncer     │
     │  Fail2Ban (mail)                 │
     │  Automated Backups → MinIO      │
     └──────────────────────────────────┘
```

## Data Flow

### 1. Website Deployment Flow
```
User uploads site → API → MinIO (storage)
                        → BullMQ (deploy queue)
                        → Worker processes build
                        → Content hash → Blockchain
                        → IPFS (optional pin)
                        → Traefik serves site
```

### 2. Authentication Flow
```
Email/Password Login:
  Client → API → bcrypt verify → JWT (access + refresh)
  
Wallet Login (SIWE):
  Client → Create SIWE message → Sign with wallet
        → API → Verify signature → Find/create user → JWT
```

### 3. Blockchain Integrity Flow
```
Content change → SHA-256 hash
             → Transaction to EVM chain
             → Store record in PostgreSQL
             → Verify: rehash content → compare with on-chain hash
```

## Network Architecture

```
┌─ proxy (bridge) ──────────────────────────┐
│  traefik, frontend, backend, forgejo,     │
│  n8n, grafana, roundcube, minio           │
└───────────────────────────────────────────┘

┌─ backend (internal) ─────────────────────┐
│  backend, worker, postgres, pgbouncer,   │
│  redis, minio, ipfs, ganache,            │
│  postgres-exporter, redis-exporter       │
└───────────────────────────────────────────┘

┌─ mail (bridge) ──────────────────────────┐
│  mailserver, roundcube                   │
└───────────────────────────────────────────┘

┌─ monitoring (internal) ──────────────────┐
│  prometheus, grafana, node-exporter,     │
│  cadvisor, alertmanager,                 │
│  postgres-exporter, redis-exporter       │
└───────────────────────────────────────────┘

┌─ crowdsec (internal) ────────────────────┐
│  crowdsec, crowdsec-bouncer, traefik     │
└───────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Proxy | Traefik v3 | Reverse proxy, SSL, load balancer |
| Frontend | Next.js 15 | Dashboard SPA |
| Backend | Node.js + Express + TypeScript | REST API |
| ORM | Prisma | Database access |
| Database | PostgreSQL 16 | Primary data store |
| Pooler | PgBouncer | Connection management |
| Cache | Redis 7 | Sessions, cache, job queues |
| Queue | BullMQ | Background job processing |
| Storage | MinIO | S3-compatible object storage |
| IPFS | Kubo | Decentralized file storage |
| Blockchain | Hardhat/Ganache + ethers.js | Content integrity, DID |
| Git | Forgejo | Repository hosting, CI/CD |
| Workflows | n8n | Visual workflow automation |
| Mail | docker-mailserver | Full email stack |
| Webmail | Roundcube | Browser-based email client |
| Monitoring | Prometheus + Grafana | Metrics & dashboards |
| Alerting | Alertmanager | Alert routing |
| Security | CrowdSec | Threat intelligence |
| Backups | Custom + MinIO | Encrypted automated backups |
