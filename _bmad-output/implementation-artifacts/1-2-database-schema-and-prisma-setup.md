# Story 1.2: Database Schema & Prisma Setup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a PostgreSQL database with Prisma ORM configured and initial schema designed,
So that backend services have a type-safe data access layer from day one.

## Acceptance Criteria

1. **Given** the apps/api workspace **When** `npx prisma migrate dev` is run **Then** the database is created with the initial schema including: User table (id, email, passwordHash, displayName, bio, avatarUrl, locale, ageConfirmed, createdAt, updatedAt) **And** Prisma Client is generated with TypeScript types

2. **Given** the Prisma setup **When** `npx prisma generate` is run **Then** the generated client is output to `apps/api/generated/prisma/` **And** TypeScript types are available for import throughout apps/api

3. **Given** the seed script **When** `npx prisma db seed` is run **Then** at least one test user is created in the database

4. **Given** `prisma/schema.prisma` **When** examined **Then** it follows naming conventions: PascalCase model names, camelCase field names

5. **Given** environment variables **When** `.env.example` is examined **Then** `DATABASE_URL` is documented with the correct PostgreSQL connection string format

## Tasks / Subtasks

- [x] Task 1: Install Prisma 7 dependencies in apps/api (AC: #1, #2)
  - [x] 1.1: Install runtime deps: `@prisma/client`, `@prisma/adapter-pg`, `pg`, `dotenv`
  - [x] 1.2: Install dev deps: `prisma`, `@types/pg`, `tsx`
  - [x] 1.3: Add Prisma scripts to apps/api/package.json: `db:generate`, `db:migrate`, `db:seed`, `db:studio`, `db:reset`
  - [x] 1.4: Add `db:generate` task to turbo.json pipeline (non-cached, dependency for build/dev)

- [x] Task 2: Configure Prisma 7 for the project (AC: #1, #2, #4)
  - [x] 2.1: Create `apps/api/prisma/schema.prisma` with generator (provider: "prisma-client", output: "../generated/prisma") and datasource (provider: "postgresql")
  - [x] 2.2: Create `apps/api/prisma.config.ts` with defineConfig — DATABASE_URL from env, migrations path, seed command
  - [x] 2.3: Add `import "dotenv/config"` at top of prisma.config.ts (Prisma 7 does NOT auto-load .env)
  - [x] 2.4: Add `generated/` to apps/api `.gitignore` (generated client should not be committed)

- [x] Task 3: Design initial User model in schema.prisma (AC: #1, #4)
  - [x] 3.1: Define User model with fields: id (String, uuid, @default(uuid())), email (String, @unique), passwordHash (String, optional — null for OAuth-only users), displayName (String, optional), bio (String, optional), avatarUrl (String, optional), locale (String, @default("en")), ageConfirmed (Boolean, @default(false)), createdAt (DateTime, @default(now())), updatedAt (DateTime, @updatedAt)
  - [x] 3.2: Add @@index on email (implicit via @unique) and createdAt
  - [x] 3.3: Use String @default(uuid()) for id field (not autoincrement Int — UUIDs are better for distributed systems and prevent enumeration attacks)

- [x] Task 4: Create PrismaClient singleton in apps/api (AC: #2)
  - [x] 4.1: Create `apps/api/src/config/database.ts` with PrismaClient singleton using @prisma/adapter-pg and pg.Pool
  - [x] 4.2: Add connection pooling configuration (pool size from env or default)
  - [x] 4.3: Export prisma instance for use across services
  - [x] 4.4: Add graceful shutdown handler (prisma.$disconnect() on SIGTERM/SIGINT)

- [x] Task 5: Run initial migration (AC: #1)
  - [x] 5.1: Run `npx prisma migrate dev --name init` to create initial migration
  - [x] 5.2: Verify migration files are created in `apps/api/prisma/migrations/`
  - [x] 5.3: Verify Prisma Client is generated in `apps/api/generated/prisma/`

- [x] Task 6: Create seed script (AC: #3)
  - [x] 6.1: Create `apps/api/prisma/seed.ts` using tsx runner
  - [x] 6.2: Seed at least one test user with realistic data (email: test@transcendence.local, displayName: "Test User", locale: "en", ageConfirmed: true)
  - [x] 6.3: Add seed command to prisma.config.ts migrations config: `seed: "tsx prisma/seed.ts"`
  - [x] 6.4: Verify `npx prisma db seed` runs successfully

- [x] Task 7: Update .env.example and verify integration (AC: #5)
  - [x] 7.1: Add `DATABASE_URL=postgresql://transcendence:transcendence@localhost:5432/transcendence?schema=public` to .env.example
  - [x] 7.2: Add `DATABASE_POOL_SIZE=10` to .env.example (optional, with default)
  - [x] 7.3: Create a basic integration test in `apps/api/src/config/database.test.ts` that verifies PrismaClient can be instantiated
  - [x] 7.4: Verify `pnpm build` still works across all workspaces after Prisma addition

## Dev Notes

### Critical: Prisma 7 Breaking Changes from v6

Prisma 7 (latest stable: 7.4.0, Feb 2026) has MAJOR breaking changes. The internal query engine was rewritten from Rust to TypeScript. Do NOT follow Prisma 5/6 tutorials — they are wrong for v7.

**Key breaking changes the developer MUST follow:**

1. **Generator provider renamed**: Use `provider = "prisma-client"` (NOT `"prisma-client-js"`)
2. **Output is REQUIRED**: Must specify `output = "../generated/prisma"` in generator block
3. **`prisma.config.ts` replaces schema URL**: Database URL goes in `prisma.config.ts`, NOT in schema.prisma datasource block
4. **Driver adapter REQUIRED**: Must use `@prisma/adapter-pg` with `pg` pool — Prisma 7 no longer manages its own DB connection
5. **ESM by default**: Prisma 7 ships as ES Modules
6. **`.env` NOT auto-loaded**: Must explicitly `import "dotenv/config"` in prisma.config.ts and application entry
7. **Imports from generated path**: Import `PrismaClient` from `../generated/prisma/index.js`, NOT from `@prisma/client`
8. **Seeding NOT automatic**: `prisma migrate dev` no longer runs seed. Run `npx prisma db seed` manually
9. **`$use()` middleware removed**: Use Client Extensions API instead (not needed for this story)

### Prisma 7 Schema Template

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  // URL configured in prisma.config.ts — NOT here
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String?
  displayName   String?
  bio           String?
  avatarUrl     String?
  locale        String    @default("en")
  ageConfirmed  Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([createdAt])
}
```

### Prisma Config File Template

```typescript
// apps/api/prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### PrismaClient Singleton Template

```typescript
// apps/api/src/config/database.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../generated/prisma/index.js";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DATABASE_POOL_SIZE || "10", 10),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### Seed Script Template

```typescript
// apps/api/prisma/seed.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../generated/prisma/index.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const testUser = await prisma.user.upsert({
    where: { email: "test@transcendence.local" },
    update: {},
    create: {
      email: "test@transcendence.local",
      displayName: "Test User",
      locale: "en",
      ageConfirmed: true,
    },
  });
  console.log("Seeded test user:", testUser.id);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
```

### Turbo Pipeline Update

Add `db:generate` to turbo.json:

```json
{
  "tasks": {
    "db:generate": {
      "cache": false
    },
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**"],
      "outputs": ["dist/**"]
    }
  }
}
```

### Required Packages

| Package | Type | Version | Purpose |
|---|---|---|---|
| `prisma` | devDependency | 7.4.x | CLI for migrations, generate, studio |
| `@prisma/client` | dependency | 7.4.x | Base client package |
| `@prisma/adapter-pg` | dependency | 7.4.x | PostgreSQL driver adapter (new in v7) |
| `pg` | dependency | latest | node-postgres driver |
| `@types/pg` | devDependency | latest | TypeScript types for pg |
| `dotenv` | dependency | latest | Explicit env loading (Prisma 7 requirement) |
| `tsx` | devDependency | latest | Run TypeScript seed scripts directly |

### Known Prisma 7 Gotchas

1. **TS2742 errors in pnpm monorepos**: TypeScript may fail to resolve `@prisma/client-runtime-utils` types through pnpm symlinks. Workaround: use explicit `paths` in tsconfig.json or add `shamefully-hoist=true` to .npmrc
2. **ESM import paths**: All imports from generated client must include `.js` extension (e.g., `../generated/prisma/index.js`) even though the actual file is `.ts`
3. **SSL in development**: For local PostgreSQL, SSL is not needed. For Docker PostgreSQL connecting from host, no SSL config required
4. **Multi-file schema bug**: `prismaSchemaFolder` had issues in 7.0.0. Use single schema.prisma file for now — it's sufficient for the initial User table

### Naming Conventions (from Architecture)

| Element | Convention | Example |
|---|---|---|
| Model names | PascalCase, singular | `User` |
| Field names | camelCase | `passwordHash`, `createdAt` |
| Foreign keys | `{relatedModel}Id` | `userId`, `missionId` |
| Enums | PascalCase name, UPPER_SNAKE values | `enum ExerciseType { INTERACTIVE_PLACEMENT }` |

### Schema Design Notes

- **id as UUID**: Using `String @default(uuid())` instead of autoincrement `Int` — prevents enumeration attacks (can't guess user IDs), better for future distributed scenarios, matches modern best practices
- **passwordHash optional**: Nullable because OAuth-only users don't have passwords (Story 2.3 will link OAuth accounts)
- **locale field**: Stores user's preferred language. Default "en". Used by i18n system (Epic 8) and curriculum content loader (Epic 3)
- **ageConfirmed**: Required by FR51 (age eligibility gate, 16+). Boolean flag set during registration

### What This Story Does NOT Include

- No Redis/session setup (Story 1.4)
- No Express security middleware (Story 1.3)
- No additional database tables beyond User (later stories add: UserProgress, ChapterProgress, TokenTransaction, Streak, Achievement, UserAchievement, Friendship, Notification, ExerciseAttempt)
- No Docker/PostgreSQL container (Story 1.5 — for now, developer uses local PostgreSQL or a Docker PostgreSQL standalone)
- No Prisma multi-file schema (single file is sufficient; can split later if needed)

### Database Requirement for Development

The developer needs a running PostgreSQL instance to run migrations. Options:
1. **Local PostgreSQL**: Install via Homebrew (`brew install postgresql@17`) or system package
2. **Docker standalone**: `docker run -d --name pg-transcendence -e POSTGRES_USER=transcendence -e POSTGRES_PASSWORD=transcendence -e POSTGRES_DB=transcendence -p 5432:5432 postgres:17`
3. **Use the Docker Compose setup from Story 1.5** (if available)

Recommended for this story: Option 2 (Docker standalone) — quick, disposable, matches production setup.

### Previous Story Intelligence (from 1.1)

**Learnings from Story 1.1:**
- TypeScript resolved to 5.9.3 instead of targeted 5.8.x — forward compatible, no issue
- ESLint fell back to v9 due to eslint-plugin-react-hooks v7 compatibility issues
- Express `app` variable needed explicit type annotation to avoid TS2742
- `onlyBuiltDependencies: [esbuild]` was added to pnpm-workspace.yaml for esbuild postinstall

**Existing files to modify (not create from scratch):**
- `.env.example` — add DATABASE_URL
- `turbo.json` — add db:generate task
- `apps/api/package.json` — add Prisma dependencies and scripts
- `.gitignore` — add `generated/` if not already covered

**Established patterns to follow:**
- Co-located tests (test file next to source file)
- TypeScript strict mode (no `any`, no `@ts-ignore`)
- camelCase for all TypeScript code
- Vitest for testing

### Project Structure Notes

- Prisma schema lives in `apps/api/prisma/schema.prisma` per architecture spec [Source: architecture.md#Complete Project Directory Structure]
- Generated client output to `apps/api/generated/prisma/` (Prisma 7 requirement)
- PrismaClient singleton in `apps/api/src/config/database.ts` per backend organization pattern [Source: architecture.md#Structure Patterns]
- Seed script in `apps/api/prisma/seed.ts` per architecture spec

### References

- [Source: architecture.md#Data Architecture] — PostgreSQL via Prisma ORM, schema as single source of truth
- [Source: architecture.md#Naming Patterns] — PascalCase tables, camelCase columns
- [Source: architecture.md#Complete Project Directory Structure] — Prisma file locations
- [Source: architecture.md#Architectural Boundaries] — Backend-to-DB: Prisma client, all access through service layer
- [Source: epics.md#Story 1.2] — Acceptance criteria and user story
- [Source: prd.md#Non-Functional Requirements] — NFR6: bcrypt for passwords, NFR8: .env for secrets
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma with Turborepo](https://www.prisma.io/docs/guides/turborepo)
- [Prisma in pnpm Workspaces](https://www.prisma.io/docs/guides/use-prisma-in-pnpm-workspaces)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Prisma 7 generated client no longer has `index.ts` — the main export file is `client.ts`. Import path corrected from `../generated/prisma/index.js` to `../generated/prisma/client.js`.
- TypeScript build failed with TS6059 (`rootDir` mismatch) because `generated/` is outside `src/`. Fixed by changing `rootDir` from `"src"` to `"."` and adding `"generated"` to `include` in `apps/api/tsconfig.json`.
- User opted for Supabase local development instead of standalone Docker PostgreSQL. DB runs on port 54322 via `supabase start`.

### Completion Notes List

- Installed Prisma 7.4.2 with all required dependencies (@prisma/client, @prisma/adapter-pg, pg, dotenv, prisma, @types/pg)
- Created schema.prisma with User model following all naming conventions (PascalCase model, camelCase fields, UUID id)
- Created prisma.config.ts with defineConfig, explicit dotenv import, seed command
- Created PrismaClient singleton with pg.Pool adapter, connection pooling, graceful shutdown
- Ran initial migration `20260307145010_init` successfully
- Created seed script — seeds test user (test@transcendence.local)
- Updated .env.example with DATABASE_URL and DATABASE_POOL_SIZE
- Created integration test verifying PrismaClient instantiation
- All tests pass (3/3 across api and web packages), build succeeds across all workspaces
- Added `generated/` to root .gitignore, `db:generate` task to turbo.json

### Change Log

- 2026-03-07: Story 1.2 implemented — Prisma 7 ORM setup with PostgreSQL, User model, migrations, seed, and integration test
- 2026-03-07: Code review fixes — (H1) Added db:generate as build dependency in turbo.json, (H2) Fixed pool leak in graceful shutdown by exposing pool reference, (H3) Moved signal handlers to explicit registerShutdownHandlers() to avoid import side effects, (M1) Expanded integration test to verify pool and shutdown handler exports, (M2) Added pnpm-lock.yaml and supabase/ to File List

### File List

- apps/api/package.json (modified — added Prisma deps and db scripts)
- apps/api/tsconfig.json (modified — adjusted rootDir and include for generated prisma)
- apps/api/prisma.config.ts (new)
- apps/api/prisma/schema.prisma (new)
- apps/api/prisma/seed.ts (new)
- apps/api/prisma/migrations/20260307145010_init/migration.sql (new)
- apps/api/prisma/migrations/migration_lock.toml (new)
- apps/api/src/config/database.ts (new)
- apps/api/src/config/database.test.ts (new)
- apps/api/.env (new — local dev only, gitignored)
- .env.example (modified — added DATABASE_URL and DATABASE_POOL_SIZE)
- .gitignore (modified — added generated/)
- turbo.json (modified — added db:generate task)
- eslint.config.ts (modified — added generated/ to ignores)
- pnpm-lock.yaml (modified — updated with Prisma dependencies)
- supabase/ (new — Supabase local dev configuration, gitignored by supabase/.gitignore)
