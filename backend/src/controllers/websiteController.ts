// ============================================================
// Chain Host — Website Controller
// ============================================================

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/auditLog';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { deployQueue } from '../services/queueService';

export const websiteRouter = Router();

// All routes require auth
websiteRouter.use(authenticate);

// ── Schemas ─────────────────────────────────────────────
const createWebsiteSchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(63).regex(/^[a-z0-9-]+$/),
    description: z.string().max(500).optional(),
    siteType: z.enum(['STATIC', 'NEXTJS', 'NODE', 'PYTHON', 'PHP']).default('STATIC'),
    domain: z.string().optional(),
    buildCommand: z.string().optional(),
    outputDir: z.string().default('dist'),
});

const updateWebsiteSchema = createWebsiteSchema.partial();

// ── GET / — List user's websites ────────────────────────
websiteRouter.get('/', async (req: AuthRequest, res: Response) => {
    const websites = await prisma.website.findMany({
        where: { userId: req.user!.id },
        include: {
            deployments: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    version: true,
                    status: true,
                    createdAt: true,
                },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });

    res.json({ websites });
});

// ── GET /:id — Get website details ──────────────────────
websiteRouter.get('/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const website = await prisma.website.findFirst({
            where: { id: req.params.id, userId: req.user!.id },
            include: {
                deployments: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!website) {
            throw new AppError('Website not found', 404);
        }

        res.json({ website });
    } catch (err) {
        next(err);
    }
});

// ── POST / — Create website ────────────────────────────
websiteRouter.post(
    '/',
    auditLog('website.create', 'website'),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const data = createWebsiteSchema.parse(req.body);

            // Check slug uniqueness
            const existing = await prisma.website.findUnique({
                where: { slug: data.slug },
            });
            if (existing) {
                throw new AppError('Slug already taken', 409);
            }

            const website = await prisma.website.create({
                data: {
                    ...data,
                    userId: req.user!.id,
                },
            });

            logger.info(`Website created: ${website.slug} by ${req.user!.username}`);
            res.status(201).json({ website });
        } catch (err) {
            next(err);
        }
    }
);

// ── PATCH /:id — Update website ─────────────────────────
websiteRouter.patch(
    '/:id',
    auditLog('website.update', 'website'),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const data = updateWebsiteSchema.parse(req.body);

            const website = await prisma.website.updateMany({
                where: { id: req.params.id, userId: req.user!.id },
                data,
            });

            if (website.count === 0) {
                throw new AppError('Website not found', 404);
            }

            const updated = await prisma.website.findUnique({
                where: { id: req.params.id },
            });

            res.json({ website: updated });
        } catch (err) {
            next(err);
        }
    }
);

// ── DELETE /:id — Delete website ────────────────────────
websiteRouter.delete(
    '/:id',
    auditLog('website.delete', 'website'),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const result = await prisma.website.deleteMany({
                where: { id: req.params.id, userId: req.user!.id },
            });

            if (result.count === 0) {
                throw new AppError('Website not found', 404);
            }

            logger.info(`Website deleted: ${req.params.id} by ${req.user!.username}`);
            res.json({ message: 'Website deleted' });
        } catch (err) {
            next(err);
        }
    }
);

// ── POST /:id/deploy — Trigger deployment ───────────────
websiteRouter.post(
    '/:id/deploy',
    auditLog('website.deploy', 'website'),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const website = await prisma.website.findFirst({
                where: { id: req.params.id, userId: req.user!.id },
            });

            if (!website) {
                throw new AppError('Website not found', 404);
            }

            // Get latest version
            const lastDeploy = await prisma.deployment.findFirst({
                where: { websiteId: website.id },
                orderBy: { version: 'desc' },
            });

            const deployment = await prisma.deployment.create({
                data: {
                    websiteId: website.id,
                    version: (lastDeploy?.version || 0) + 1,
                    status: 'PENDING',
                },
            });

            // Queue deployment job
            await deployQueue.add('deploy', {
                deploymentId: deployment.id,
                websiteId: website.id,
                siteType: website.siteType,
                buildCommand: website.buildCommand,
                outputDir: website.outputDir,
            });

            await prisma.website.update({
                where: { id: website.id },
                data: { status: 'BUILDING' },
            });

            logger.info(`Deployment queued: ${website.slug} v${deployment.version}`);
            res.status(202).json({ deployment });
        } catch (err) {
            next(err);
        }
    }
);
