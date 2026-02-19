# Chain Host — Scaling Guide

## Overview

Chain Host is designed with modular scaling in mind. Start with a single Docker Compose deployment, then scale horizontally as demand grows.

---

## Scaling Stages

### Stage 1: Single Server (1-10 users)
**Current Docker Compose setup**

- All services on one machine
- PostgreSQL + Redis on same host
- Suitable for small teams and dev environments

**Hardware**: 4 CPU, 8GB RAM, 100GB SSD

### Stage 2: Vertical Scaling (10-50 users)
- Upgrade host resources (CPU/RAM)
- Enable PostgreSQL read replicas
- Add Redis Sentinel for HA
- Increase PgBouncer pool size

**Hardware**: 8 CPU, 16GB RAM, 500GB SSD

### Stage 3: Docker Swarm (50-200 users)
- Deploy across 3+ nodes
- Traefik handles load balancing automatically
- PostgreSQL on dedicated node
- Redis Cluster mode

```bash
# Initialize Swarm
docker swarm init --advertise-addr <MANAGER_IP>

# Join worker nodes
docker swarm join --token <TOKEN> <MANAGER_IP>:2377

# Deploy stack
docker stack deploy -c docker-compose.yml -c docker-compose.swarm.yml chainhost
```

### Stage 4: Kubernetes / k3s (200+ users)
- Migrate to k3s (lightweight Kubernetes)
- Horizontal Pod Autoscaler (HPA)
- Persistent Volume Claims for data
- Ingress controller replaces Traefik (or Traefik as Ingress)

---

## Component-Specific Scaling

### Backend API
```yaml
# docker-compose.swarm.yml
services:
  backend:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 30s
      restart_policy:
        condition: on-failure
```

### PostgreSQL
1. **PgBouncer** — Already configured, handles connection pooling
2. **Read Replicas** — Add streaming replication for read-heavy workloads
3. **Partitioning** — Partition `AuditLog` and `BlockchainRecord` by date
4. **Sharding** — Shard by tenant ID for multi-tenant deployments

### Redis
1. **Sentinel** — Automatic failover (3-node minimum)
2. **Cluster** — For >256MB cache needs
3. **Separate instances** — One for cache, one for BullMQ queues

### Worker Service
```yaml
services:
  worker:
    deploy:
      replicas: 3
      placement:
        constraints:
          - node.labels.type == worker
```

### Mail Server
- Mail servers should NOT be horizontally scaled (DNS/IP reputation issues)
- Scale vertically or use SMTP relay for outbound
- Move to dedicated host at Stage 3

---

## Caching Strategy

| Layer | What to Cache | TTL | Tool |
|-------|---------------|-----|------|
| Edge | Static assets, images | 1 week | Cloudflare CDN |
| Application | API responses, user sessions | 5-30 min | Redis |
| Database | Frequent queries | 1-5 min | Redis + PgBouncer |
| DNS | DNS lookups | 1 hour | Cloudflare DNS |

### Redis Cache Pattern
```typescript
async function getCachedWebsites(userId: string) {
  const cacheKey = `websites:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const websites = await prisma.website.findMany({ where: { userId } });
  await redis.set(cacheKey, JSON.stringify(websites), 'EX', 300); // 5 min
  return websites;
}
```

---

## Async Processing

All heavy operations should go through BullMQ queues:

| Queue | Operations | Concurrency |
|-------|-----------|-------------|
| `deploy` | Site builds, file processing | 2 |
| `email` | Transactional emails, notifications | 5 |
| `blockchain` | On-chain hashing, verification | 1 |
| `backup` | Database dumps, file archival | 1 |

---

## Monitoring for Scale

### Key Metrics to Watch
- **CPU > 70%** sustained → Add nodes or upgrade
- **Memory > 85%** → Increase RAM or optimize queries
- **Postgres connections > 80** → Increase PgBouncer pool
- **Redis memory > 80%** → Scale Redis or increase max memory
- **Queue depth > 100** → Add worker replicas
- **p95 latency > 2s** → Profile and optimize

### Autoscaling Triggers (k3s HPA)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## Migration Checklist

### Single Server → Docker Swarm
- [ ] Set up 3+ nodes with Docker installed
- [ ] Configure shared storage (NFS/GlusterFS) for volumes
- [ ] Initialize Swarm manager
- [ ] Create overlay networks
- [ ] Move PostgreSQL to dedicated node
- [ ] Deploy stack with replicas
- [ ] Test failover scenarios

### Docker Swarm → Kubernetes (k3s)
- [ ] Install k3s on all nodes
- [ ] Convert Docker Compose to Helm charts
- [ ] Set up Persistent Volume Claims (Longhorn/NFS)
- [ ] Configure Ingress controller
- [ ] Set up HPA for backend and worker
- [ ] Configure network policies
- [ ] Test blue-green deployments
- [ ] Set up CI/CD pipeline (Forgejo Actions)
