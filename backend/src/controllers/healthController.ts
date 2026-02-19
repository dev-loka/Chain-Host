// ============================================================
// Chain Host — Health Controller
// ============================================================

import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
    const checks: Record<string, string> = {};

    // Check Postgres
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.postgres = 'ok';
    } catch {
        checks.postgres = 'error';
    }

    // Check Redis
    try {
        await redis.ping();
        checks.redis = 'ok';
    } catch {
        checks.redis = 'error';
    }

    const allHealthy = Object.values(checks).every((v) => v === 'ok');

    res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks,
    });
});

// Readiness probe
healthRouter.get('/ready', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        await redis.ping();
        res.json({ ready: true });
    } catch {
        res.status(503).json({ ready: false });
    }
});

// Liveness probe
healthRouter.get('/live', (_req, res) => {
    res.json({ alive: true, pid: process.pid });
});
