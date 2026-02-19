// ============================================================
// Chain Host — Email Controller
// ============================================================

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const emailRouter = Router();

emailRouter.use(authenticate);

// ── GET / — List email accounts ─────────────────────────
emailRouter.get('/', requireRole('ADMIN', 'SUPER_ADMIN'), async (_req, res: Response) => {
    const accounts = await prisma.emailAccount.findMany({
        orderBy: { createdAt: 'desc' },
    });
    res.json({ accounts });
});

// ── POST / — Create email account ──────────────────────
emailRouter.post('/', requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res: Response, next) => {
    try {
        const schema = z.object({
            address: z.string().email(),
            displayName: z.string().optional(),
            forwardTo: z.string().email().optional(),
            isAlias: z.boolean().default(false),
            quotaMb: z.number().int().min(10).max(10240).default(1024),
        });

        const data = schema.parse(req.body);

        const existing = await prisma.emailAccount.findUnique({
            where: { address: data.address },
        });
        if (existing) {
            throw new AppError('Email address already exists', 409);
        }

        const account = await prisma.emailAccount.create({ data });
        res.status(201).json({ account });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /:id — Delete email account ──────────────────
emailRouter.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res: Response, next) => {
    try {
        const result = await prisma.emailAccount.delete({
            where: { id: req.params.id },
        });
        res.json({ message: 'Email account deleted', account: result });
    } catch (err) {
        next(err);
    }
});
