// ============================================================
// Chain Host — Express Server Entry Point
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { collectDefaultMetrics, register } from 'prom-client';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './controllers/authController';
import { websiteRouter } from './controllers/websiteController';
import { blockchainRouter } from './controllers/blockchainController';
import { healthRouter } from './controllers/healthController';
import { emailRouter } from './controllers/emailController';
import { uploadRouter } from './controllers/uploadController';

// ── Prometheus Metrics ──────────────────────────────────
collectDefaultMetrics({ prefix: 'chainhost_' });

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security Middleware ─────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            connectSrc: ["'self'", 'wss:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN || `https://${process.env.DOMAIN || 'localhost:3000'}`,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
}));

// ── Global Rate Limiter ─────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

app.use(globalLimiter);

// ── Body Parsing (with size limits) ─────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request Logging ─────────────────────────────────────
app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
    skip: (req) => req.url === '/health' || req.url === '/metrics',
}));

// ── Trust Proxy (behind Traefik) ────────────────────────
app.set('trust proxy', 1);

// ── Routes ──────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/metrics', async (_req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end();
    }
});
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/websites', websiteRouter);
app.use('/api/v1/blockchain', blockchainRouter);
app.use('/api/v1/email', emailRouter);
app.use('/api/v1/upload', uploadRouter);

// ── Error Handler ───────────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────
app.listen(PORT, () => {
    logger.info(`⛓️  Chain Host API listening on port ${PORT}`);
    logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
