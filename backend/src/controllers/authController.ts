// ============================================================
// Chain Host — Auth Controller
// ============================================================

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { SiweMessage } from 'siwe';
import { v4 as uuid } from 'uuid';

import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const authRouter = Router();

// ── Schemas ─────────────────────────────────────────────
const registerSchema = z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
    email: z.string().email(),
    password: z.string().min(8).max(128),
});

const loginSchema = z.object({
    emailOrUsername: z.string().min(1),
    password: z.string().min(1),
});

const walletLoginSchema = z.object({
    message: z.string(),
    signature: z.string(),
});

// ── Rate Limiters ───────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5'),
    message: { error: 'Too many auth attempts. Try again in 15 minutes.' },
    standardHeaders: true,
});

// ── Helper: Generate Tokens ─────────────────────────────
function generateTokens(userId: string) {
    const accessToken = jwt.sign(
        { userId, type: 'access' },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    const refreshToken = jwt.sign(
        { userId, type: 'refresh', jti: uuid() },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
    return { accessToken, refreshToken };
}

// ── POST /register ──────────────────────────────────────
authRouter.post('/register', authLimiter, async (req, res: Response, next) => {
    try {
        const { username, email, password } = registerSchema.parse(req.body);

        // Check existing
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (existing) {
            throw new AppError(
                existing.email === email ? 'Email already registered' : 'Username taken',
                409
            );
        }

        const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
        const passwordHash = await bcrypt.hash(password, rounds);

        const user = await prisma.user.create({
            data: { username, email, passwordHash },
            select: { id: true, username: true, email: true, role: true },
        });

        const tokens = generateTokens(user.id);

        // Store refresh token
        await prisma.session.create({
            data: {
                userId: user.id,
                refreshToken: tokens.refreshToken,
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        logger.info(`User registered: ${user.username}`);
        res.status(201).json({ user, ...tokens });
    } catch (err) {
        next(err);
    }
});

// ── POST /login ─────────────────────────────────────────
authRouter.post('/login', authLimiter, async (req, res: Response, next) => {
    try {
        const { emailOrUsername, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
            },
        });

        if (!user || !user.passwordHash) {
            throw new AppError('Invalid credentials', 401);
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            // Track failed attempts in Redis
            const key = `login_fail:${req.ip}`;
            const attempts = await redis.incr(key);
            if (attempts === 1) await redis.expire(key, 900);

            throw new AppError('Invalid credentials', 401);
        }

        const tokens = generateTokens(user.id);

        await prisma.session.create({
            data: {
                userId: user.id,
                refreshToken: tokens.refreshToken,
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        // Clear failed attempts
        await redis.del(`login_fail:${req.ip}`);

        logger.info(`User logged in: ${user.username}`);
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            ...tokens,
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /wallet-login (SIWE) ───────────────────────────
authRouter.post('/wallet-login', authLimiter, async (req, res: Response, next) => {
    try {
        const { message, signature } = walletLoginSchema.parse(req.body);

        const siweMessage = new SiweMessage(message);
        const fields = await siweMessage.verify({ signature });

        if (!fields.success) {
            throw new AppError('Invalid wallet signature', 401);
        }

        const address = fields.data.address.toLowerCase();

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { walletAddress: address },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    walletAddress: address,
                    username: `wallet_${address.slice(0, 8)}`,
                    isVerified: true,
                },
            });
            logger.info(`Wallet user created: ${address}`);
        }

        const tokens = generateTokens(user.id);

        await prisma.session.create({
            data: {
                userId: user.id,
                refreshToken: tokens.refreshToken,
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        res.json({
            user: {
                id: user.id,
                username: user.username,
                walletAddress: user.walletAddress,
                role: user.role,
            },
            ...tokens,
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /refresh ───────────────────────────────────────
authRouter.post('/refresh', async (req, res: Response, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new AppError('Refresh token required', 400);
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as {
            userId: string;
            type: string;
        };

        if (decoded.type !== 'refresh') {
            throw new AppError('Invalid token type', 401);
        }

        // Verify session exists
        const session = await prisma.session.findUnique({
            where: { refreshToken },
        });

        if (!session || session.expiresAt < new Date()) {
            throw new AppError('Session expired', 401);
        }

        // Rotate refresh token
        const tokens = generateTokens(decoded.userId);

        await prisma.session.update({
            where: { id: session.id },
            data: {
                refreshToken: tokens.refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        res.json(tokens);
    } catch (err) {
        next(err);
    }
});

// ── POST /logout ────────────────────────────────────────
authRouter.post('/logout', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await prisma.session.deleteMany({
                where: { refreshToken, userId: req.user!.id },
            });
        }

        res.json({ message: 'Logged out' });
    } catch (err) {
        next(err);
    }
});

// ── GET /me ─────────────────────────────────────────────
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            walletAddress: true,
            role: true,
            isVerified: true,
            twoFactorEnabled: true,
            createdAt: true,
        },
    });
    res.json({ user });
});

// ── GET /nonce (for SIWE) ───────────────────────────────
authRouter.get('/nonce', (_req, res: Response) => {
    const nonce = uuid();
    res.json({ nonce });
});
