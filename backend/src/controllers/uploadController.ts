// ============================================================
// Chain Host — Upload Controller (MinIO)
// ============================================================

import { Router, Response } from 'express';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { minioService } from '../services/minioService';
import { AppError } from '../middleware/errorHandler';

export const uploadRouter = Router();

uploadRouter.use(authenticate);

// Configure multer with size limits
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
        files: 10,
    },
    fileFilter: (_req, file, cb) => {
        // Block dangerous file types
        const blocked = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.dll'];
        const ext = file.originalname.toLowerCase().split('.').pop();
        if (ext && blocked.some((b) => b === `.${ext}`)) {
            cb(new AppError('File type not allowed', 400) as any);
            return;
        }
        cb(null, true);
    },
});

// ── POST /file — Upload single file ────────────────────
uploadRouter.post('/file', upload.single('file'), async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.file) {
            throw new AppError('No file provided', 400);
        }

        const result = await minioService.uploadFile(
            process.env.MINIO_BUCKET_UPLOADS || 'user-uploads',
            `${req.user!.id}/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            req.file.mimetype,
        );

        res.json({
            url: result.url,
            key: result.key,
            size: req.file.size,
            mimeType: req.file.mimetype,
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /site — Upload site files (zip) ────────────────
uploadRouter.post('/site', upload.single('archive'), async (req: AuthRequest, res: Response, next) => {
    try {
        if (!req.file) {
            throw new AppError('No archive provided', 400);
        }

        const websiteId = req.body.websiteId;
        if (!websiteId) {
            throw new AppError('websiteId required', 400);
        }

        const result = await minioService.uploadFile(
            process.env.MINIO_BUCKET_SITES || 'hosted-sites',
            `${websiteId}/${Date.now()}-site.zip`,
            req.file.buffer,
            'application/zip',
        );

        res.json({
            url: result.url,
            key: result.key,
            size: req.file.size,
        });
    } catch (err) {
        next(err);
    }
});
