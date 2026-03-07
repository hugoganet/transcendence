# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

# Copy workspace manifests first for Docker layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

# Build shared package and web app
RUN pnpm --filter @transcendence/shared build && \
    pnpm --filter @transcendence/web build

# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:stable-alpine AS runtime

# Copy built static files
COPY --from=builder /app/apps/web/dist/ /usr/share/nginx/html/

# Copy Nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
