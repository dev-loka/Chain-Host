// ============================================================
// Chain Host — Prisma Client Singleton
// ============================================================

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
        ],
    });

// Log slow queries in development
if (process.env.NODE_ENV !== 'production') {
    prisma.$on('query' as never, (e: any) => {
        if (e.duration > 500) {
            logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
    });
}

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
