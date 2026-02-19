// ============================================================
// Chain Host — MinIO Service (S3-compatible storage)
// ============================================================

import * as Minio from 'minio';
import { logger } from '../utils/logger';

class MinioService {
    private client: Minio.Client;

    constructor() {
        this.client = new Minio.Client({
            endPoint: process.env.MINIO_ENDPOINT || 'minio',
            port: parseInt(process.env.MINIO_PORT || '9000'),
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ROOT_USER || '',
            secretKey: process.env.MINIO_ROOT_PASSWORD || '',
        });
    }

    /**
     * Ensure a bucket exists
     */
    async ensureBucket(bucket: string): Promise<void> {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
            await this.client.makeBucket(bucket);
            logger.info(`Created bucket: ${bucket}`);
        }
    }

    /**
     * Upload a file to MinIO
     */
    async uploadFile(
        bucket: string,
        key: string,
        buffer: Buffer,
        contentType: string,
    ): Promise<{ url: string; key: string; etag: string }> {
        await this.ensureBucket(bucket);

        const result = await this.client.putObject(bucket, key, buffer, buffer.length, {
            'Content-Type': contentType,
        });

        const url = `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucket}/${key}`;

        return {
            url,
            key,
            etag: result.etag,
        };
    }

    /**
     * Get a pre-signed URL for download
     */
    async getPresignedUrl(bucket: string, key: string, expiry: number = 3600): Promise<string> {
        return this.client.presignedGetObject(bucket, key, expiry);
    }

    /**
     * Delete a file
     */
    async deleteFile(bucket: string, key: string): Promise<void> {
        await this.client.removeObject(bucket, key);
    }

    /**
     * List files in a path
     */
    async listFiles(bucket: string, prefix: string): Promise<Minio.BucketItem[]> {
        return new Promise((resolve, reject) => {
            const items: Minio.BucketItem[] = [];
            const stream = this.client.listObjects(bucket, prefix, true);
            stream.on('data', (obj) => items.push(obj));
            stream.on('error', reject);
            stream.on('end', () => resolve(items));
        });
    }

    /**
     * Get file as buffer
     */
    async getFile(bucket: string, key: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            this.client.getObject(bucket, key, (err, stream) => {
                if (err) return reject(err);
                stream.on('data', (chunk: Buffer) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
        });
    }
}

export const minioService = new MinioService();
