// ============================================================
// Chain Host — BullMQ Queue Service
// ============================================================

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// ── Deploy Queue ────────────────────────────────────────
export const deployQueue = new Queue('deploy', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
    },
});

// ── Email Queue ─────────────────────────────────────────
export const emailQueue = new Queue('email', {
    connection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 10000,
        },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 100 },
    },
});

// ── Blockchain Queue ────────────────────────────────────
export const blockchainQueue = new Queue('blockchain', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 15000,
        },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 50 },
    },
});

// ── Backup Queue ────────────────────────────────────────
export const backupQueue = new Queue('backup', {
    connection,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 60000,
        },
        removeOnComplete: { count: 30 },
        removeOnFail: { count: 10 },
    },
});

logger.info('BullMQ queues initialized');
