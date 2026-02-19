// ============================================================
// Chain Host — Blockchain Controller
// ============================================================

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { blockchainService } from '../services/blockchainService';

export const blockchainRouter = Router();

blockchainRouter.use(authenticate);

// ── POST /hash — Hash content on-chain ──────────────────
blockchainRouter.post('/hash', async (req: AuthRequest, res: Response, next) => {
    try {
        const schema = z.object({
            content: z.string().min(1),
            entityType: z.string(),
            entityId: z.string(),
        });

        const { content, entityType, entityId } = schema.parse(req.body);

        const result = await blockchainService.hashContent(content);

        // Store record
        const record = await prisma.blockchainRecord.create({
            data: {
                entityType,
                entityId,
                contentHash: result.contentHash,
                txHash: result.txHash,
                chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '1337'),
                blockNumber: result.blockNumber ? BigInt(result.blockNumber) : null,
                gasUsed: result.gasUsed ? BigInt(result.gasUsed) : null,
                status: 'confirmed',
            },
        });

        logger.info(`Content hashed on-chain: ${result.txHash}`);
        res.json({
            record: {
                ...record,
                blockNumber: record.blockNumber?.toString(),
                gasUsed: record.gasUsed?.toString(),
            },
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /verify — Verify content against chain ─────────
blockchainRouter.post('/verify', async (req: AuthRequest, res: Response, next) => {
    try {
        const schema = z.object({
            content: z.string().min(1),
            txHash: z.string(),
        });

        const { content, txHash } = schema.parse(req.body);

        const record = await prisma.blockchainRecord.findUnique({
            where: { txHash },
        });

        if (!record) {
            throw new AppError('Blockchain record not found', 404);
        }

        const isValid = blockchainService.verifyHash(content, record.contentHash);

        res.json({
            isValid,
            record: {
                ...record,
                blockNumber: record.blockNumber?.toString(),
                gasUsed: record.gasUsed?.toString(),
            },
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /records — List blockchain records ──────────────
blockchainRouter.get('/records', async (req: AuthRequest, res: Response, next) => {
    try {
        const { entityType, entityId, page = '1', limit = '20' } = req.query;

        const where: any = {};
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;

        const pageNum = parseInt(page as string);
        const limitNum = Math.min(parseInt(limit as string), 100);

        const [records, total] = await Promise.all([
            prisma.blockchainRecord.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
            prisma.blockchainRecord.count({ where }),
        ]);

        res.json({
            records: records.map((r) => ({
                ...r,
                blockNumber: r.blockNumber?.toString(),
                gasUsed: r.gasUsed?.toString(),
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (err) {
        next(err);
    }
});
