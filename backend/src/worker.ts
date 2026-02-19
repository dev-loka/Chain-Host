// ============================================================
// Chain Host — Background Worker (BullMQ processors)
// ============================================================

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from './utils/prisma';
import { logger } from './utils/logger';
import { minioService } from './services/minioService';
import { ipfsService } from './services/ipfsService';
import { blockchainService } from './services/blockchainService';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// ── Deploy Worker ───────────────────────────────────────
const deployWorker = new Worker(
    'deploy',
    async (job: Job) => {
        const { deploymentId, websiteId, siteType, buildCommand, outputDir } = job.data;

        logger.info(`Processing deployment: ${deploymentId}`);

        try {
            // Update status
            await prisma.deployment.update({
                where: { id: deploymentId },
                data: { status: 'BUILDING', startedAt: new Date() },
            });

            // 1. Fetch site archive from MinIO
            // 2. Build (if dynamic site)
            // 3. Upload built files to hosting bucket
            // 4. Hash content for blockchain integrity
            // 5. Optionally pin to IPFS

            // Simulate build process for now
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Generate content hash
            const contentHash = `0x${Buffer.from(deploymentId).toString('hex').padEnd(64, '0')}`;

            // Update deployment
            await prisma.deployment.update({
                where: { id: deploymentId },
                data: {
                    status: 'SUCCESS',
                    contentHash,
                    finishedAt: new Date(),
                },
            });

            // Update website status
            await prisma.website.update({
                where: { id: websiteId },
                data: {
                    status: 'LIVE',
                    contentHash,
                },
            });

            logger.info(`Deployment successful: ${deploymentId}`);
            return { status: 'success', contentHash };
        } catch (err) {
            logger.error(`Deployment failed: ${deploymentId}`, err);

            await prisma.deployment.update({
                where: { id: deploymentId },
                data: {
                    status: 'FAILED',
                    buildLog: err instanceof Error ? err.message : 'Unknown error',
                    finishedAt: new Date(),
                },
            });

            await prisma.website.update({
                where: { id: websiteId },
                data: { status: 'ERROR' },
            });

            throw err;
        }
    },
    {
        connection,
        concurrency: 2,
        limiter: {
            max: 5,
            duration: 60000,
        },
    }
);

// ── Email Worker ────────────────────────────────────────
const emailWorker = new Worker(
    'email',
    async (job: Job) => {
        const { to, subject, html, from } = job.data;
        logger.info(`Sending email to: ${to}`);
        // TODO: Integrate with docker-mailserver SMTP
        // For now, log
        logger.info(`Email sent: ${subject} -> ${to}`);
    },
    { connection, concurrency: 5 }
);

// ── Blockchain Worker ───────────────────────────────────
const blockchainWorker = new Worker(
    'blockchain',
    async (job: Job) => {
        const { content, entityType, entityId } = job.data;
        logger.info(`Hashing content for ${entityType}:${entityId}`);

        const result = await blockchainService.hashContent(content);

        await prisma.blockchainRecord.create({
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

        logger.info(`Blockchain record created: ${result.txHash}`);
        return result;
    },
    { connection, concurrency: 1 }
);

// ── Worker Event Handlers ───────────────────────────────
[deployWorker, emailWorker, blockchainWorker].forEach((worker) => {
    worker.on('completed', (job) => {
        logger.info(`Job ${job.id} completed on queue ${worker.name}`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`Job ${job?.id} failed on queue ${worker.name}:`, err);
    });

    worker.on('error', (err) => {
        logger.error(`Worker ${worker.name} error:`, err);
    });
});

logger.info('⛓️  Chain Host Worker started');
logger.info('   Queues: deploy, email, blockchain');
