// ============================================================
// Chain Host — Redis Client
// ============================================================

import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        if (times > 10) {
            logger.error('Redis: max retries reached');
            return null;
        }
        return Math.min(times * 200, 5000);
    },
    enableReadyCheck: true,
    lazyConnect: false,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err));
redis.on('close', () => logger.warn('Redis connection closed'));
