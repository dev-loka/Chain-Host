# ============================================================
# Chain Host Backend — Multi-stage Docker Build
# ============================================================

# ── Stage 1: Dependencies ────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production && \
    cp -R node_modules /prod_node_modules && \
    npm ci

# ── Stage 2: Build ───────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && \
    npm run build

# ── Stage 3: Production ─────────────────────────────────
FROM node:24-alpine AS production
WORKDIR /app

# Security: non-root user
RUN addgroup -g 1001 -S chainhost && \
    adduser -S chainhost -u 1001 -G chainhost

# Copy production dependencies and built code
COPY --from=deps /prod_node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1))"

USER chainhost

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
