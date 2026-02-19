// ============================================================
// Chain Host — Winston Logger
// ============================================================

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat,
    ),
    defaultMeta: { service: 'chainhost-api' },
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), logFormat),
        }),
        new winston.transports.File({
            filename: '/tmp/chainhost-error.log',
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: '/tmp/chainhost-combined.log',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
        }),
    ],
});
