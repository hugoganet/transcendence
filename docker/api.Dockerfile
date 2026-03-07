# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

# Copy workspace manifests first for Docker layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Generate Prisma client
RUN pnpm --filter @transcendence/api exec prisma generate

# Build shared package and API
RUN pnpm --filter @transcendence/shared build && \
    pnpm --filter @transcendence/api build

# ============================================
# Stage 2: Runtime
# ============================================
FROM node:22-alpine AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy full node_modules from builder (includes prisma CLI for migrations)
COPY --from=builder /app/node_modules/ node_modules/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Copy shared package (runtime dependency)
COPY --from=builder /app/packages/shared/ packages/shared/

# Copy API compiled output and Prisma artifacts
COPY --from=builder /app/apps/api/dist/ apps/api/dist/
COPY --from=builder /app/apps/api/package.json apps/api/
COPY --from=builder /app/apps/api/node_modules/ apps/api/node_modules/
COPY --from=builder /app/apps/api/prisma/ apps/api/prisma/
COPY --from=builder /app/apps/api/prisma.config.ts apps/api/
COPY --from=builder /app/apps/api/generated/ apps/api/generated/

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

WORKDIR /app/apps/api

EXPOSE 3000

# Run migrations then start server
# Note: tsx is used because Prisma 7 generates extensionless ESM imports
# that Node.js strict ESM resolution rejects. Tracked as tech debt.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/tsx dist/src/index.js"]
