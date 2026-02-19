// ============================================================
// Chain Host — Audit Logging Middleware
// ============================================================

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export const auditLog = (action: string, entityType: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        // Store original json method
        const originalJson = res.json.bind(res);

        res.json = function (body: any) {
            // Log after successful response
            if (res.statusCode >= 200 && res.statusCode < 300) {
                prisma.auditLog.create({
                    data: {
                        userId: req.user?.id,
                        action,
                        entityType,
                        entityId: req.params.id || body?.id || 'unknown',
                        metadata: {
                            method: req.method,
                            path: req.path,
                            statusCode: res.statusCode,
                        },
                        ipAddress: req.ip || req.socket.remoteAddress,
                        userAgent: req.headers['user-agent'],
                    },
                }).catch((err) => {
                    logger.error('Failed to write audit log:', err);
                });
            }
            return originalJson(body);
        };

        next();
    };
};
