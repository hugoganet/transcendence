# Story 1.5: Docker Compose & HTTPS Deployment

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the entire platform to start with a single `docker compose up` command,
So that the application is deployable and accessible via HTTPS.

## Acceptance Criteria

1. **Given** a configured `.env` file (from `.env.example`) **When** `docker compose up` is run **Then** 4 services start: web (Nginx), api (Express), db (PostgreSQL), redis

2. **Given** the running services **When** Nginx receives requests **Then** it serves static frontend files and reverse-proxies `/api/*` to Express and `/socket.io/*` to Socket.IO

3. **Given** the Nginx service **When** HTTPS is configured **Then** self-signed certificates are used for local development and HTTP requests are redirected to HTTPS

4. **Given** all 4 services running **When** connectivity is checked **Then** API can reach DB and Redis, and all services report healthy via health checks

5. **Given** the deployment **When** the health check endpoint is accessed **Then** `https://localhost/api/v1/health` returns 200 OK

6. **Given** the docker directory **When** Dockerfiles are inspected **Then** Dockerfiles exist for web and api services in `docker/`

7. **Given** the `.env.example` file **When** reviewed **Then** all required environment variables are documented including Docker-specific ones (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)

## Tasks / Subtasks

- [x] Task 1: Create directory structure for Docker files (AC: #6)
  - [x] 1.1: Create `docker/` directory at project root
  - [x] 1.2: Create `docker/nginx/` directory for Nginx config
  - [x] 1.3: Create `docker/nginx/certs/` directory for self-signed certificates (gitignored)

- [x] Task 2: Create API Dockerfile with multi-stage build (AC: #1, #6)
  - [x] 2.1: Create `docker/api.Dockerfile` with build stage (Node 22 Alpine + pnpm + TypeScript compile) and runtime stage (Node 22 Alpine, non-root user)
  - [x] 2.2: Build stage: copy workspace manifests first (pnpm-workspace.yaml, pnpm-lock.yaml, root package.json, packages/shared/package.json, apps/api/package.json) for Docker layer caching
  - [x] 2.3: Build stage: `pnpm install --frozen-lockfile`, copy source, `pnpm run build` in apps/api, then run Prisma generate (`pnpm exec prisma generate`)
  - [x] 2.4: Build stage: `pnpm prune --prod` to strip dev dependencies — DEVIATION: skipped pnpm prune due to pnpm 10 TTY requirement and prisma CLI needing to be available at runtime for migrations; full node_modules copied to runtime instead
  - [x] 2.5: Runtime stage: copy compiled `dist/`, production `node_modules/`, `packages/shared/`, prisma schema + migrations + generated client, and `package.json`
  - [x] 2.6: Runtime stage: create non-root user (`appuser`), set `WORKDIR /app/apps/api`, expose port 3000
  - [x] 2.7: Runtime stage: entrypoint runs Prisma migrations (`npx prisma migrate deploy`) then starts server (`npx tsx dist/src/index.js`) — DEVIATION: uses tsx instead of node to handle Prisma-generated extensionless ESM imports; entry point is `dist/src/index.js` because tsconfig rootDir="."

- [x] Task 3: Create Web (Nginx) Dockerfile with multi-stage build (AC: #1, #2, #6)
  - [x] 3.1: Create `docker/web.Dockerfile` with build stage (Node 22 Alpine + pnpm + Vite build) and serve stage (nginx:stable-alpine)
  - [x] 3.2: Build stage: copy workspace manifests first for caching, then `pnpm install --frozen-lockfile`, copy source, run `pnpm run build` in apps/web
  - [x] 3.3: Serve stage: copy built `dist/` from builder to `/usr/share/nginx/html`
  - [x] 3.4: Serve stage: copy Nginx config from `docker/nginx/nginx.conf` to `/etc/nginx/nginx.conf`
  - [x] 3.5: Expose ports 80 and 443, run `nginx -g "daemon off;"`

- [x] Task 4: Create Nginx configuration (AC: #2, #3, #5)
  - [x] 4.1: Create `docker/nginx/nginx.conf` with `http{}` block including `map $http_upgrade $connection_upgrade` for WebSocket support
  - [x] 4.2: Configure HTTPS server block (port 443) with self-signed cert paths (`/etc/nginx/certs/local-cert.pem`, `/etc/nginx/certs/local-key.pem`)
  - [x] 4.3: Configure `location /` to serve static files with `try_files $uri $uri/ /index.html` for SPA routing
  - [x] 4.4: Configure `location /api/` to `proxy_pass http://api:3000` with proper headers (Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)
  - [x] 4.5: Configure `location /socket.io/` to `proxy_pass http://api:3000` with WebSocket upgrade headers (`Upgrade`, `Connection`) and extended timeouts (`proxy_read_timeout 86400s`)
  - [x] 4.6: Configure HTTP-to-HTTPS redirect server block (port 80 -> 301 to HTTPS)
  - [x] 4.7: Add `ssl_protocols TLSv1.2 TLSv1.3` and disable SSLv3

- [x] Task 5: Create docker-compose.yml (AC: #1, #4)
  - [x] 5.1: Create `docker-compose.yml` at project root with 4 services: `db`, `redis`, `api`, `web`
  - [x] 5.2: `db` service: `postgres:17`, env vars from `.env`, named volume `db_data` for persistence, health check with `pg_isready`, `start_period: 20s`
  - [x] 5.3: `redis` service: `redis:7-alpine`, health check with `redis-cli ping`, `start_period: 10s`
  - [x] 5.4: `api` service: build from `docker/api.Dockerfile` with context `.`, env vars (DATABASE_URL pointing to `db:5432`, REDIS_URL to `redis:6379`, NODE_ENV=production), `depends_on` db and redis with `condition: service_healthy`, health check hitting `http://127.0.0.1:3000/api/v1/health` via `wget` — NOTE: uses 127.0.0.1 instead of localhost due to Alpine IPv6 resolution
  - [x] 5.5: `web` service: build from `docker/web.Dockerfile` with context `.`, ports configurable via env vars (default 80:80 and 443:443), volume mount `./docker/nginx/certs:/etc/nginx/certs:ro`, `depends_on` api with `condition: service_healthy`
  - [x] 5.6: Define `backend` network for all services, `db_data` named volume
  - [x] 5.7: Use `.env` for variable substitution (docker compose reads `.env` automatically)

- [x] Task 6: Create self-signed certificate generation script (AC: #3)
  - [x] 6.1: Create `docker/generate-certs.sh` script that generates self-signed certs using `openssl` (fallback if mkcert not installed) or `mkcert` (preferred)
  - [x] 6.2: Script generates `docker/nginx/certs/local-cert.pem` and `docker/nginx/certs/local-key.pem`
  - [x] 6.3: Add `docker/nginx/certs/*.pem` to `.gitignore`
  - [x] 6.4: Script is idempotent — skips generation if certs already exist

- [x] Task 7: Create .dockerignore file (AC: #1)
  - [x] 7.1: Create `.dockerignore` at project root excluding: `**/node_modules`, `.git`, `**/dist`, `.env`, `*.md`, `.vscode`, `.claude`, `_bmad-output`, `_bmad`, `tests/e2e`, `docker/nginx/certs` — NOTE: uses `**/*` glob patterns for nested matching

- [x] Task 8: Update .env.example with Docker-specific variables (AC: #7)
  - [x] 8.1: Add PostgreSQL variables: `POSTGRES_USER=transcendence`, `POSTGRES_PASSWORD=transcendence`, `POSTGRES_DB=transcendence`
  - [x] 8.2: Add Docker-specific DATABASE_URL: comment showing Docker format `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public` vs local format
  - [x] 8.3: Add `NODE_ENV=development` variable
  - [x] 8.4: Add `VITE_API_URL=https://localhost` (for frontend API base URL)

- [x] Task 9: Update API for Docker compatibility (AC: #4)
  - [x] 9.1: Ensure `apps/api/src/index.ts` listens on `0.0.0.0` (not just localhost) — required for Docker container networking
  - [x] 9.2: Add `prisma migrate deploy` as a `db:migrate:deploy` script in `apps/api/package.json` (production migration command, no prompt)
  - [x] 9.3: Verify health endpoint `GET /api/v1/health` returns `{ data: { status: "ok" } }` (already exists from Story 1.3)

- [x] Task 10: End-to-end Docker validation (AC: #1, #2, #3, #4, #5)
  - [x] 10.1: Run `docker compose build` — verified both Dockerfiles build without errors
  - [x] 10.2: Run `docker compose up` — verified all 4 services start and report healthy
  - [x] 10.3: Test `https://localhost:8443/api/v1/health` returns 200 with `{ data: { status: "ok" } }` (tested on port 8443 due to host nginx occupying 443)
  - [x] 10.4: Test `https://localhost:8443` serves the Vite React app (HTML with root div)
  - [x] 10.5: Test HTTP redirect: `http://localhost:8080/api/v1/health` redirects to HTTPS (301)
  - [x] 10.6: Verify `docker compose down` cleanly stops all services
  - [x] 10.7: Verify `docker compose up` again works (DB data persists via named volume)

## Dev Notes

### Critical: Docker Service Architecture

The architecture specifies exactly 4 Docker services:

```
┌──────────────────────────────────────────────────┐
│  web (nginx:stable-alpine)                       │
│  Ports: 80, 443 (exposed to host)               │
│  Serves: static frontend + reverse proxy         │
│  Routes:                                          │
│    /          → static files (Vite build)        │
│    /api/*     → http://api:3000                  │
│    /socket.io/* → http://api:3000 (WebSocket)    │
│  HTTPS: self-signed certs mounted as volume      │
└──────────────────────┬───────────────────────────┘
                       │ proxy_pass
┌──────────────────────▼───────────────────────────┐
│  api (Node 22, Express 5)                        │
│  Port: 3000 (internal only)                      │
│  Runs: Prisma migrate deploy → node dist/index.js│
│  Connects to: db:5432, redis:6379                │
└──────────────┬──────────────────┬────────────────┘
               │                  │
┌──────────────▼──────┐ ┌────────▼─────────────────┐
│  db (postgres:17)   │ │  redis (redis:7-alpine)  │
│  Port: 5432 (int.)  │ │  Port: 6379 (internal)   │
│  Volume: db_data    │ │  No persistence needed   │
└─────────────────────┘ └──────────────────────────┘
```

[Source: architecture.md#Infrastructure & Deployment]

### Critical: Prisma 7 Migration in Docker

Prisma 7 uses `prisma.config.ts` for configuration (not the old `prisma/schema.prisma` datasource URL). The migration command for production is:

```bash
prisma migrate deploy  # applies pending migrations, no interactive prompts
```

This must run BEFORE the Express server starts. The API Dockerfile entrypoint should chain:
1. `prisma migrate deploy` — apply any pending migrations
2. `node dist/index.js` — start the server

**Important:** The Prisma client is generated at build time (in the Dockerfile build stage), but migrations run at container startup time (when DB is available).

**Prisma 7 generates to `apps/api/generated/prisma/`** — this directory must be included in the runtime stage COPY.

### Critical: pnpm Monorepo in Docker

The project uses pnpm workspaces. Docker builds must:
1. Copy workspace manifests first (for layer caching)
2. Use `pnpm install --frozen-lockfile` (never `pnpm install` alone — ensures reproducible builds)
3. The `packages/shared` workspace is a dependency of both `apps/web` and `apps/api` — it must be available at build time

**pnpm in Node 22 Alpine:** Use `corepack enable && corepack prepare pnpm@latest --activate` in the Dockerfile. Corepack ships with Node 22.

### Critical: Socket.IO WebSocket Proxying via Nginx

Socket.IO uses HTTP long-polling as initial transport, then upgrades to WebSocket. Nginx must:
1. Set `proxy_http_version 1.1` (default is 1.0, which doesn't support WebSocket upgrade)
2. Forward `Upgrade` and `Connection` headers explicitly (they're hop-by-hop headers, stripped by default)
3. Use `map $http_upgrade $connection_upgrade` in the `http{}` context for the Connection header value
4. Set extended timeouts — `proxy_read_timeout 86400s` prevents Nginx from closing long-lived WebSocket connections

The `map` block MUST be in the `http{}` context, NOT inside `server{}`. Placing it inside `server{}` causes a config parse error.

[Source: architecture.md#Communication Patterns, Socket.IO docs — reverse proxy]

### Critical: Express Must Listen on 0.0.0.0 in Docker

The current `index.ts` uses `httpServer.listen(PORT)` without specifying a host. In Node.js, this defaults to `0.0.0.0` on most systems, but to be explicit and safe in Docker, ensure the server binds to all interfaces:

```typescript
httpServer.listen(PORT, "0.0.0.0", () => { ... });
```

This is required because Docker uses bridge networking — the container's network interface is different from the host's `localhost`.

### Critical: Database URL Differences (Local vs Docker)

The DATABASE_URL changes between local dev and Docker:

| Context | DATABASE_URL |
|---|---|
| Local dev | `postgresql://transcendence:transcendence@localhost:5432/transcendence?schema=public` |
| Docker | `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public` |

In Docker, the hostname is `db` (the service name), not `localhost`. The `docker-compose.yml` should construct the URL from individual POSTGRES_* vars or document the Docker-specific URL format clearly.

Similarly, REDIS_URL changes from `redis://localhost:6379` to `redis://redis:6379`.

### Architecture Compliance

**NFR7 (HTTPS everywhere):** Nginx handles HTTPS termination with self-signed certs. All client-server communication goes through Nginx HTTPS. [Source: architecture.md#Infrastructure & Deployment]

**NFR23 (Single `docker compose up`):** All 4 services defined in one `docker-compose.yml`. Health checks + `depends_on` conditions ensure proper startup order: db/redis first → api (after DB/Redis healthy) → web (after API healthy). [Source: architecture.md#Infrastructure & Deployment]

**NFR24 (.env.example documented):** All required variables documented including Docker-specific ones. [Source: architecture.md#Infrastructure & Deployment]

**API response format:** Health endpoint returns `{ data: { status: "ok" } }` per the standard format. [Source: architecture.md#Format Patterns]

**Middleware order preserved:** Helmet → CORS → JSON → RateLimiter → Session → Routes → 404 → ErrorHandler. [Source: architecture.md#Authentication & Security]

### Project Structure Notes

- `docker/api.Dockerfile` and `docker/web.Dockerfile` per architecture spec [Source: architecture.md#Complete Project Directory Structure — `docker/` directory]
- `docker/nginx.conf` becomes `docker/nginx/nginx.conf` for cleaner organization (with certs subdirectory)
- `docker-compose.yml` at project root [Source: architecture.md#Complete Project Directory Structure]
- No database or Redis ports exposed to host — only nginx 80/443 [Source: architecture.md security best practices]
- DB data persisted via Docker named volume `db_data`

### Library & Framework Requirements

| Technology | Version | Purpose | Notes |
|---|---|---|---|
| Docker Compose | v2 (built into Docker Desktop) | Service orchestration | Use `docker compose` (v2), not `docker-compose` (v1) |
| nginx | `stable-alpine` (1.28.x) | Reverse proxy + static file serving | Alpine variant for smaller image |
| PostgreSQL | `17` | Database | Latest stable as of March 2026 |
| Redis | `7-alpine` | Session store + Socket.IO adapter | v7 for stability (v8 has ACL changes) |
| Node.js | `22-alpine` | Build + runtime for API | LTS, ships with corepack for pnpm |
| pnpm | latest (via corepack) | Package manager | Used in Dockerfile via `corepack enable` |

**Note on Redis version:** Using Redis 7 (not 8) for stability. Redis 8.x introduces stricter default ACLs that may require additional configuration. The project's current Redis usage (sessions, rate limiting, Socket.IO adapter) works perfectly with Redis 7.

### File Structure Requirements

**Files to CREATE:**
- `docker/api.Dockerfile` — Multi-stage Node.js API build
- `docker/web.Dockerfile` — Multi-stage Vite build + Nginx serve
- `docker/nginx/nginx.conf` — Nginx reverse proxy + HTTPS + WebSocket config
- `docker/generate-certs.sh` — Self-signed certificate generation script
- `docker-compose.yml` — 4-service orchestration
- `.dockerignore` — Docker build exclusions

**Files to MODIFY:**
- `.env.example` — Add Docker-specific variables (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, VITE_API_URL)
- `.gitignore` — Add `docker/nginx/certs/*.pem`
- `apps/api/src/index.ts` — Add explicit `0.0.0.0` bind (if not already the default behavior)
- `apps/api/package.json` — Add `db:migrate:deploy` script

**Files NOT to touch:**
- `apps/api/src/app.ts` — No changes needed
- `apps/api/src/config/*` — All config files read from env vars, already Docker-compatible
- `apps/api/src/socket/*` — Socket.IO setup unchanged
- `apps/api/src/middleware/*` — All middleware unchanged
- `apps/web/vite.config.ts` — Vite build works as-is
- `packages/shared/*` — No changes
- `turbo.json` — Build pipeline unchanged

### Testing Requirements

**This story has NO unit tests to write.** Testing is done via Docker validation:

1. `docker compose build` — both images build successfully
2. `docker compose up -d` — all 4 services start
3. Health checks pass for all services (via `docker compose ps`)
4. `https://localhost/api/v1/health` returns 200
5. `https://localhost` serves the React SPA
6. `http://localhost` redirects to HTTPS
7. `docker compose down && docker compose up -d` — services restart cleanly, DB data persists

**Existing tests:** All 53 tests from Stories 1.1-1.4 must still pass locally (no regressions in source code).

### Previous Story Intelligence (from 1-4)

**Key patterns established:**
- Express server uses `node:http` createServer with Socket.IO attached — Dockerfile CMD must run `node dist/index.js` (the compiled entry point)
- Graceful shutdown handles: httpServer.close → io.close → disconnectSessionRedis → disconnectRedis → prisma.$disconnect → prismaPool.end — Docker sends SIGTERM on `docker compose down`
- Two Redis client libraries: `ioredis` (rate limiter, Socket.IO adapter) and `redis`/node-redis (sessions via connect-redis) — both connect to same REDIS_URL
- ESM throughout: `"type": "module"` in package.json, `.js` extensions in imports
- Build command: `tsc -b` for API, `tsc -b && vite build` for web

**Code patterns from recent commits:**
- `apps/api/src/config/session.ts` reads `REDIS_URL` from env — Docker-compatible
- `apps/api/src/config/redis.ts` reads `REDIS_URL` from env — Docker-compatible
- `apps/api/src/config/database.ts` reads `DATABASE_URL` from env — Docker-compatible
- Prisma 7 config in `apps/api/prisma.config.ts` reads `DATABASE_URL` via `env("DATABASE_URL")`

### What This Story Does NOT Include

- No Passport.js authentication (Story 2.1)
- No frontend routing or pages beyond the default Vite scaffold (Story 1.6, Epic 2)
- No CI/CD pipeline (deferred post-MVP per architecture)
- No production certificate management (Let's Encrypt, etc.) — self-signed only
- No horizontal scaling or load balancing
- No monitoring or logging infrastructure
- No Docker volume for avatar uploads (Story 2.6)
- No content/ directory JSON files in Docker (Story 3.1)

### Environment Variables Summary

Updated `.env.example` should contain:
```bash
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (local dev)
DATABASE_URL=postgresql://transcendence:transcendence@localhost:5432/transcendence?schema=public
DATABASE_POOL_SIZE=10

# Database (Docker — used by docker-compose)
POSTGRES_USER=transcendence
POSTGRES_PASSWORD=transcendence
POSTGRES_DB=transcendence
# In Docker, DATABASE_URL becomes: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public

# Redis
REDIS_URL=redis://localhost:6379
# In Docker, REDIS_URL becomes: redis://redis:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Session
SESSION_SECRET=change-me-in-production
SESSION_TTL_SECONDS=1800

# Frontend (Vite — baked at build time)
VITE_API_URL=https://localhost
```

### References

- [Source: architecture.md#Infrastructure & Deployment] — Docker 4-service architecture, Nginx reverse proxy, HTTPS termination
- [Source: architecture.md#Complete Project Directory Structure] — `docker/` directory with Dockerfiles, `docker-compose.yml` at root
- [Source: architecture.md#Authentication & Security] — HTTPS enforcement via Nginx, session cookies require HTTPS in production
- [Source: architecture.md#Communication Patterns] — Socket.IO WebSocket events proxied via Nginx
- [Source: epics.md#Story 1.5] — Acceptance criteria and user story
- [Docker Compose health checks — depends_on with condition: service_healthy](https://docs.docker.com/compose/compose-file/05-services/#depends_on)
- [Socket.IO — Behind a reverse proxy (nginx WebSocket config)](https://socket.io/docs/v3/reverse-proxy/)
- [nginx WebSocket proxying (official docs)](https://nginx.org/en/docs/http/websocket.html)
- [pnpm Docker guide (official docs)](https://pnpm.io/docker)
- [Turborepo Docker guide](https://turborepo.dev/docs/guides/tools/docker)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `.dockerignore` patterns needed `**/` prefix for nested directory matching (Docker patterns without `/` only match at root level)
- `pnpm prune --prod` fails in Docker non-TTY environment; `CI=true` fixes TTY check but `prisma` CLI is needed at runtime for migrations, so pruning was skipped entirely
- `pnpm deploy` requires `inject-workspace-packages=true` in pnpm 10, not compatible with current setup
- Prisma 7 generated code uses extensionless ESM imports (`./internal/class`); Node.js ESM strict resolution fails on these; solution: use `tsx` to run compiled output
- API tsconfig has `rootDir: "."` (to include `generated/` dir), so compiled output goes to `dist/src/` not `dist/`; fixed `start` script and Docker CMD accordingly
- API tsconfig needed `declaration: false` override because `tsc` with `declaration: true` fails on complex Redis/Express inferred types in Docker's pnpm layout
- Alpine Linux resolves `localhost` to IPv6 `::1` which fails for health checks; fixed by using `127.0.0.1` explicitly
- `SESSION_SECRET` validation rejects default value in `NODE_ENV=production`; docker-compose provides a non-default fallback
- `pnpm-workspace.yaml` needed `@prisma/engines` and `prisma` in `onlyBuiltDependencies` to allow Prisma postinstall scripts in Docker

### Completion Notes List

- All 4 Docker services (db, redis, api, web) build and run successfully with health checks
- HTTPS with self-signed certificates working via Nginx reverse proxy
- HTTP-to-HTTPS redirect (301) working
- API health endpoint returns `{"data":{"status":"ok"}}` via HTTPS through Nginx
- Vite React SPA served correctly with SPA fallback routing
- Socket.IO WebSocket proxying configured with upgrade headers and extended timeouts
- Prisma migrations run automatically at container startup before Express server starts
- Docker ports are configurable via WEB_HTTP_PORT / WEB_HTTPS_PORT env vars (defaults: 80/443)
- All 54 existing tests pass locally with no regressions
- No unit tests needed per story spec — validation is via Docker end-to-end testing

### Change Log

- 2026-03-07: Implemented Story 1.5 — Docker Compose & HTTPS Deployment
- 2026-03-07: Code review fixes — FRONTEND_URL override, npx→direct paths, security headers, gzip, healthcheck, restart policies, env defaults

### File List

**Files CREATED:**
- `docker/api.Dockerfile` — Multi-stage Node.js API build (builder + runtime)
- `docker/web.Dockerfile` — Multi-stage Vite build + Nginx serve
- `docker/nginx/nginx.conf` — Nginx reverse proxy, HTTPS, WebSocket, SPA routing
- `docker/generate-certs.sh` — Self-signed certificate generation (mkcert or openssl)
- `docker-compose.yml` — 4-service orchestration (db, redis, api, web)
- `.dockerignore` — Docker build context exclusions

**Files MODIFIED:**
- `.env.example` — Added Docker-specific vars (POSTGRES_USER/PASSWORD/DB, NODE_ENV, VITE_API_URL)
- `.gitignore` — Added `docker/nginx/certs/*.pem`
- `apps/api/src/index.ts` — Added explicit `0.0.0.0` bind and `Number(PORT)` cast
- `apps/api/package.json` — Added `db:migrate:deploy` script, fixed `start` script path to `dist/src/index.js`
- `apps/api/tsconfig.json` — Added `declaration: false`, `declarationMap: false` for Docker build compatibility
- `pnpm-workspace.yaml` — Added `@prisma/engines` and `prisma` to `onlyBuiltDependencies`
