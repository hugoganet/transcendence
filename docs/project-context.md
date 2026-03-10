# Project Context — Transcendence

## Overview

Gamified blockchain learning platform. Monorepo with `apps/api` (Express 5 + Prisma), `apps/web` (React 19 + Vite), and `packages/shared` (Zod schemas + types).

## Key Patterns

### WithClient Transaction Pattern

All services that run inside `completeMission()`'s `prisma.$transaction()` block **must** follow this pattern:

```typescript
import { prisma } from "../config/database.js";

// 1. Define a minimal client type — only the Prisma models this service needs
type DbClient = Pick<typeof prisma, "user">;

// 2. Core function accepts a client (real prisma or transaction)
export async function doSomethingWithClient(
  client: DbClient,
  userId: string,
): Promise<ReturnType> {
  // Use client.model.method() — never import prisma directly here
  return client.user.update({ where: { id: userId }, data: { ... } });
}
```

**Why:** `completeMission()` runs a single `$transaction` with 9 steps (progress, chapter/category completion, self-assessment, tokens, streak, achievements, reveals). Each step is a `WithClient` function that receives the transaction client, ensuring atomicity.

**Services using this pattern:**
- `tokenService.ts` → `creditMissionTokensWithClient(tx, userId, missionId, title)`
- `streakService.ts` → `updateStreakWithClient(tx, userId)`
- `achievementService.ts` → `checkAndAwardAchievementsWithClient(tx, userId, context)`
- `revealService.ts` → `triggerRevealWithClient(tx, userId, mechanic)`

**Rules:**
- New services hooking into `completeMission()` must use `WithClient` suffix
- `DbClient` type should be as narrow as possible (`Pick<typeof prisma, "model1" | "model2">`)
- Never import `prisma` directly in `WithClient` functions — always use the passed `client`
- When adding a new hook, update `apps/api/src/__fixtures__/completeMissionMocks.ts` (docs + defaults) and add `vi.mock()` in `curriculumService.test.ts` + `curriculum.test.ts`

### API Response Format

```typescript
// Success
{ data: T }

// Success with pagination
{ data: T[], meta: { page, pageSize, total } }

// Error
{ error: { code: "UPPER_SNAKE_CASE", message: string, details?: Record<string, string> } }
```

### Thin Route Handlers

Route files (`apps/api/src/routes/*.ts`) must not contain business logic. They:
1. Apply middleware (`requireAuth`, `validate()`)
2. Call a service function
3. Return `res.json({ data: result })`

### Test Organization

- **Unit tests:** Co-located with source (`service.test.ts` next to `service.ts`)
- **Integration tests:** `apps/api/src/__tests__/integration/`
- **Shared fixtures:** `apps/api/src/__fixtures__/`
- **Test helpers:** `apps/api/src/__tests__/integration/helpers/`

### completeMission Dependencies Mock

When testing code that imports `curriculumService` (directly or transitively), you must mock all `completeMission` dependencies. Due to Vitest hoisting, `vi.mock()` calls must be inline string literals — they can't be wrapped in a helper function.

See `apps/api/src/__fixtures__/completeMissionMocks.ts` for:
- Copy-paste `vi.mock()` blocks (service and route variants)
- `setupCompleteMissionDefaults(mockPrisma)` — call in `beforeEach()` to set safe Prisma defaults
- Checklist of files to update when adding a new WithClient service

## Curriculum Data Reference

Real curriculum: 6 categories, 18 chapters, 69 missions.

**Progressive reveal trigger missions:**

| Mission ID | Mechanic | Notes |
|---|---|---|
| 2.2.4 | tokensRevealed | Category 2, Chapter 2, Mission 4 |
| 3.1.4 | walletRevealed | Category 3, Chapter 1, Mission 4 |
| 3.3.3 | gasRevealed | Category 3, Chapter 3, Mission 3 |
| 6.3.4 | dashboardRevealed | Category 6, Chapter 3, Mission 4 |

**Category 1 missions (for integration test fixtures):**
- 1.1.1–1.1.3, 1.2.1–1.2.5, 1.3.1–1.3.3 (11 missions)

**Exercise types:** SI (43%), CM (25%), IP (17%), ST (15%)
