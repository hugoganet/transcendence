# Story 6.1: Friends System API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to add and remove friends and see their online status,
So that I feel connected to other learners.

## Acceptance Criteria

1. **Given** an authenticated user,
   **When** they call `POST /api/v1/friends/:userId`,
   **Then** a friend request is sent and recorded in the database with status `PENDING`,
   **And** the response includes the created friendship record,
   **And** the response follows `{ data: T }` format.

2. **Given** a user who receives a friend request,
   **When** the recipient calls `POST /api/v1/friends/:userId/accept`,
   **Then** the friendship status changes to `ACCEPTED`,
   **And** both users appear in each other's friend lists.

3. **Given** an authenticated user,
   **When** they call `DELETE /api/v1/friends/:userId`,
   **Then** the friendship is removed from both sides (regardless of status),
   **And** a 204 No Content response is returned.

4. **Given** an authenticated user,
   **When** they call `GET /api/v1/friends`,
   **Then** their friend list is returned with each friend's `displayName`, `avatarUrl`, and `online` status (boolean),
   **And** only `ACCEPTED` friendships are included,
   **And** the response follows `{ data: T[] }` format.

5. **Given** an authenticated user,
   **When** they call `GET /api/v1/friends/requests`,
   **Then** pending incoming friend requests are returned with requester's `displayName` and `avatarUrl`,
   **And** the response follows `{ data: T[] }` format.

6. **Given** a user sending a friend request to themselves,
   **When** the request is processed,
   **Then** a 400 error is returned with code `CANNOT_FRIEND_SELF`.

7. **Given** a user sending a duplicate friend request (friendship already exists),
   **When** the request is processed,
   **Then** a 409 error is returned with code `FRIENDSHIP_ALREADY_EXISTS`.

8. **Given** a user accepting a friend request that doesn't exist or isn't pending,
   **When** the request is processed,
   **Then** a 404 error is returned with code `FRIEND_REQUEST_NOT_FOUND`.

9. **Given** a user removing a friendship that doesn't exist,
   **When** the request is processed,
   **Then** a 404 error is returned with code `FRIENDSHIP_NOT_FOUND`.

10. **Given** the friends system,
    **When** DB tables are needed,
    **Then** a `Friendship` table is created with `id`, `requesterId`, `addresseeId`, `status` (enum: `PENDING`, `ACCEPTED`), `createdAt`, `updatedAt`,
    **And** a unique constraint ensures no duplicate friendships between the same pair of users,
    **And** cascade deletion is configured so friendships are removed when either user is deleted.

11. **Given** any friends endpoint,
    **When** called without authentication,
    **Then** a 401 error is returned with code `UNAUTHORIZED`.

12. **Given** a user sending a friend request to a non-existent user,
    **When** the request is processed,
    **Then** a 404 error is returned with code `USER_NOT_FOUND`.

## Tasks / Subtasks

- [x] Task 1: Add Friendship model and FriendshipStatus enum to Prisma schema (AC: #10)
  - [x] 1.1 Add `FriendshipStatus` enum to `apps/api/prisma/schema.prisma`:
    - `enum FriendshipStatus { PENDING ACCEPTED }`
  - [x] 1.2 Add `Friendship` model to schema:
    ```prisma
    model Friendship {
      id          String           @id @default(cuid())
      requesterId String
      addresseeId String
      status      FriendshipStatus @default(PENDING)
      createdAt   DateTime         @default(now())
      updatedAt   DateTime         @updatedAt
      requester   User             @relation("FriendshipRequester", fields: [requesterId], references: [id], onDelete: Cascade)
      addressee   User             @relation("FriendshipAddressee", fields: [addresseeId], references: [id], onDelete: Cascade)

      @@unique([requesterId, addresseeId])
      @@index([addresseeId])
    }
    ```
  - [x] 1.3 Add self-referential relations to `User` model:
    ```prisma
    sentFriendRequests     Friendship[] @relation("FriendshipRequester")
    receivedFriendRequests Friendship[] @relation("FriendshipAddressee")
    ```
  - [x] 1.4 Run `npx prisma migrate dev --name add-friendship-table`
  - [x] 1.5 Verify Prisma Client types are regenerated
  - [x] 1.6 Verify all existing tests still pass (`pnpm test` from repo root)

- [x] Task 2: Create friend Zod schemas and types in packages/shared (AC: #1, #4, #5)
  - [x] 2.1 Create `packages/shared/src/schemas/friend.ts`:
    - `friendUserIdParamSchema`: `z.object({ userId: z.string().uuid() })`
    - `friendListEntrySchema`: `z.object({ id: z.string(), displayName: z.string().nullable(), avatarUrl: z.string().nullable(), online: z.boolean() })`
    - `friendRequestEntrySchema`: `z.object({ id: z.string(), displayName: z.string().nullable(), avatarUrl: z.string().nullable(), createdAt: z.string() })`
    - `friendshipResponseSchema`: `z.object({ id: z.string(), requesterId: z.string(), addresseeId: z.string(), status: z.enum(["PENDING", "ACCEPTED"]), createdAt: z.string() })`
  - [x] 2.2 Create `packages/shared/src/types/friend.ts`:
    - `FriendListEntry`, `FriendRequestEntry`, `FriendshipResponse` types inferred from schemas
  - [x] 2.3 Export new schemas and types from `packages/shared/src/index.ts`
  - [x] 2.4 Add tests for schemas in `packages/shared/src/schemas/friend.test.ts`

- [x] Task 3: Create friendService.ts with business logic (AC: #1-#9, #12)
  - [x] 3.1 Create `apps/api/src/services/friendService.ts`
  - [x] 3.2 Import `prisma` from `../config/database.js` and `AppError` from `../utils/AppError.js`
  - [x] 3.3 Implement `sendFriendRequest(requesterId: string, addresseeId: string): Promise<FriendshipResponse>`:
    - Validate `requesterId !== addresseeId` (AC: #6 → `CANNOT_FRIEND_SELF`)
    - Verify addressee exists via `prisma.user.findUnique` (AC: #12 → `USER_NOT_FOUND`)
    - Check for existing friendship in EITHER direction: `(requesterId, addresseeId)` OR `(addresseeId, requesterId)` (AC: #7 → `FRIENDSHIP_ALREADY_EXISTS`)
    - Create `Friendship` with status `PENDING`
    - Return serialized response
  - [x] 3.4 Implement `acceptFriendRequest(addresseeId: string, requesterId: string): Promise<FriendshipResponse>`:
    - Find `Friendship` where `requesterId = requesterId AND addresseeId = addresseeId AND status = PENDING`
    - If not found, throw `FRIEND_REQUEST_NOT_FOUND` (AC: #8)
    - Update status to `ACCEPTED`
    - Return serialized response
  - [x] 3.5 Implement `removeFriend(userId: string, friendId: string): Promise<void>`:
    - Find `Friendship` in EITHER direction: `(userId, friendId)` OR `(friendId, userId)`
    - If not found, throw `FRIENDSHIP_NOT_FOUND` (AC: #9)
    - Delete the friendship record
  - [x] 3.6 Implement `getFriends(userId: string): Promise<FriendListEntry[]>`:
    - Query all `ACCEPTED` friendships where user is requester OR addressee
    - For each friendship, extract the OTHER user's `id`, `displayName`, `avatarUrl`
    - For `online` status: check Redis set `online-users` for each friend's ID (using the Redis client from `apps/api/src/config/redis.ts` or the session Redis client)
    - Return typed array
  - [x] 3.7 Implement `getPendingRequests(userId: string): Promise<FriendRequestEntry[]>`:
    - Query `Friendship` where `addresseeId = userId AND status = PENDING`
    - Include requester's `displayName` and `avatarUrl`
    - Return typed array with `createdAt` as ISO string
  - [x] 3.8 Add helper `serializeFriendship(friendship): FriendshipResponse`:
    - Map DB record to API format (dates to ISO strings)
  - [x] 3.9 Add unit tests: `apps/api/src/services/friendService.test.ts`:
    - `sendFriendRequest` creates PENDING friendship
    - `sendFriendRequest` rejects self-friending (CANNOT_FRIEND_SELF)
    - `sendFriendRequest` rejects duplicate request (FRIENDSHIP_ALREADY_EXISTS)
    - `sendFriendRequest` rejects duplicate in reverse direction
    - `sendFriendRequest` rejects non-existent addressee (USER_NOT_FOUND)
    - `acceptFriendRequest` changes status to ACCEPTED
    - `acceptFriendRequest` rejects if no pending request (FRIEND_REQUEST_NOT_FOUND)
    - `removeFriend` deletes friendship
    - `removeFriend` works regardless of direction (requester or addressee can remove)
    - `removeFriend` rejects if no friendship (FRIENDSHIP_NOT_FOUND)
    - `getFriends` returns only ACCEPTED friendships
    - `getFriends` includes online status
    - `getFriends` returns friends from both directions
    - `getPendingRequests` returns only PENDING incoming requests

- [x] Task 4: Create friends route file (AC: #1-#5, #11)
  - [x] 4.1 Create `apps/api/src/routes/friends.ts`:
    - `POST /:userId` — send friend request (requireAuth, validate params)
    - `POST /:userId/accept` — accept friend request (requireAuth, validate params)
    - `DELETE /:userId` — remove friend (requireAuth, validate params)
    - `GET /` — list friends (requireAuth)
    - `GET /requests` — list pending requests (requireAuth)
  - [x] 4.2 Follow thin route handler pattern: validate → call service → return response
  - [x] 4.3 POST endpoints return 201, DELETE returns 204, GET returns 200
  - [x] 4.4 Add route tests: `apps/api/src/routes/friends.test.ts`:
    - All endpoints return 401 without auth
    - POST /:userId calls sendFriendRequest and returns 201
    - POST /:userId/accept calls acceptFriendRequest and returns 200
    - DELETE /:userId calls removeFriend and returns 204
    - GET / calls getFriends and returns 200 with data array
    - GET /requests calls getPendingRequests and returns 200 with data array
    - Invalid UUID param returns 400

- [x] Task 5: Mount friends router in app.ts (AC: #11)
  - [x] 5.1 Import `friendsRouter` in `apps/api/src/app.ts`
  - [x] 5.2 Add `app.use("/api/v1/friends", friendsRouter)` after the gamification router
  - [x] 5.3 Verify health check and all existing routes still work

- [x] Task 6: Add integration tests (AC: #1-#12)
  - [x] 6.1 Create `apps/api/src/__tests__/integration/friends.test.ts`:
    - GET /friends without auth → 401
    - POST /friends/:userId without auth → 401
    - Send friend request → 201 with PENDING friendship
    - Accept friend request → 200 with ACCEPTED friendship
    - Get friends list → only ACCEPTED friends returned with displayName, avatarUrl, online
    - Get pending requests → only PENDING incoming requests
    - Self-friend request → 400 CANNOT_FRIEND_SELF
    - Duplicate friend request → 409 FRIENDSHIP_ALREADY_EXISTS
    - Accept non-existent request → 404 FRIEND_REQUEST_NOT_FOUND
    - Remove friend → 204
    - Remove non-existent friend → 404 FRIENDSHIP_NOT_FOUND
    - Friend request to non-existent user → 404 USER_NOT_FOUND
    - Bidirectional: both users see each other in friends list after acceptance
    - Removal: neither user sees the other after removal
  - [x] 6.2 Update `apps/api/src/__tests__/integration/helpers/db.ts`:
    - Add `"Friendship"` to the TRUNCATE list in `resetDatabase()`
  - [x] 6.3 Verify all existing tests still pass (`pnpm test` + `pnpm test:integration`)

## Dev Notes

### Critical Architecture Patterns

- **Thin route handler:** Friends route handlers call `friendService` functions and return responses. No business logic in routes. [Source: architecture.md - Implementation Patterns]

- **Standard response format:** Success: `{ data: T }` for single items, `{ data: T[] }` for lists. No pagination on friends list (typical user has <100 friends; add pagination later if needed). 201 for creation, 204 for deletion. [Source: architecture.md - Format Patterns]

- **DB field naming:** PascalCase table `Friendship`, camelCase columns `requesterId`/`addresseeId`. Enum `FriendshipStatus` with UPPER_SNAKE values. [Source: architecture.md - DB Conventions]

- **Self-referential relation:** The `Friendship` model references `User` twice via two named relations (`FriendshipRequester`, `FriendshipAddressee`). Prisma requires named relations when multiple relations reference the same model.

- **Bidirectional friendship queries:** When querying "all friends of user X", must check BOTH directions:
  ```typescript
  prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: userId },
        { addresseeId: userId },
      ],
    },
    include: {
      requester: { select: { id: true, displayName: true, avatarUrl: true } },
      addressee: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
  ```
  Then for each result, the "friend" is `requester` if `addresseeId === userId`, or `addressee` if `requesterId === userId`.

- **Duplicate prevention:** The `@@unique([requesterId, addresseeId])` constraint prevents exact duplicates, but we must ALSO check the reverse direction `(addresseeId, requesterId)` in application code before creating. Otherwise User A → User B and User B → User A would both succeed at the DB level.

### Online Status via Redis

Story 6.2 (Online Presence via Socket.IO) will implement the full presence system. For Story 6.1, the `online` field in `getFriends` should use a Redis-based lookup:

- The Socket.IO server already tracks connected users (see `apps/api/src/socket/index.ts`).
- For now, use a Redis SET `online-users` that Socket.IO maintains (Story 6.2 will implement the write side).
- In `friendService.getFriends()`, after getting the friend list from Prisma, check Redis `SISMEMBER online-users <friendId>` for each friend.
- If Redis is unavailable or the key doesn't exist yet (before Story 6.2), default `online` to `false`.

**Important:** Keep the Redis lookup lightweight. Use `SMEMBERS` once to get all online users, then intersect with friend IDs in memory (O(1) per friend), rather than N individual `SISMEMBER` calls.

```typescript
import { redis } from "../config/redis.js";

async function getOnlineUserIds(): Promise<Set<string>> {
  try {
    const members = await redis.smembers("online-users");
    return new Set(members);
  } catch {
    return new Set(); // Graceful fallback
  }
}
```

If no Redis client is available yet at `../config/redis.ts`, check for an existing Redis export or use the session Redis client. If neither exists, create a minimal Redis client module. Check the codebase first.

### Route Placement Decision

The epics specify `POST /api/v1/friends/:userId`, `DELETE /api/v1/friends/:userId`, `GET /api/v1/friends`. Create a dedicated `friends.ts` route file (not in `users.ts`) because:
1. Consistent with the existing pattern of one route file per resource domain
2. The friends resource has its own CRUD operations
3. Cleaner separation of concerns

### Unique Constraint Strategy

The `@@unique([requesterId, addresseeId])` prevents the same user from sending multiple requests to the same person. However, it does NOT prevent the reverse (B→A when A→B exists). The service layer MUST check both directions:

```typescript
const existing = await prisma.friendship.findFirst({
  where: {
    OR: [
      { requesterId, addresseeId },
      { requesterId: addresseeId, addresseeId: requesterId },
    ],
  },
});
if (existing) throw AppError.conflict("Friendship already exists", { code: "FRIENDSHIP_ALREADY_EXISTS" });
```

### API Endpoint Design

```
POST /api/v1/friends/:userId
  Auth: Required
  Params: { userId: UUID }
  201: { data: { id, requesterId, addresseeId, status: "PENDING", createdAt } }
  400: CANNOT_FRIEND_SELF | INVALID_INPUT
  401: UNAUTHORIZED
  404: USER_NOT_FOUND
  409: FRIENDSHIP_ALREADY_EXISTS

POST /api/v1/friends/:userId/accept
  Auth: Required
  Params: { userId: UUID }
  200: { data: { id, requesterId, addresseeId, status: "ACCEPTED", createdAt, updatedAt } }
  401: UNAUTHORIZED
  404: FRIEND_REQUEST_NOT_FOUND

DELETE /api/v1/friends/:userId
  Auth: Required
  Params: { userId: UUID }
  204: (no body)
  401: UNAUTHORIZED
  404: FRIENDSHIP_NOT_FOUND

GET /api/v1/friends
  Auth: Required
  200: { data: [{ id, displayName, avatarUrl, online }] }
  401: UNAUTHORIZED

GET /api/v1/friends/requests
  Auth: Required
  200: { data: [{ id, displayName, avatarUrl, createdAt }] }
  401: UNAUTHORIZED
```

### Project Structure Notes

**New files:**
```
apps/api/prisma/migrations/<timestamp>_add_friendship_table/migration.sql
apps/api/src/services/friendService.ts
apps/api/src/services/friendService.test.ts
apps/api/src/routes/friends.ts
apps/api/src/routes/friends.test.ts
apps/api/src/__tests__/integration/friends.test.ts
packages/shared/src/schemas/friend.ts
packages/shared/src/schemas/friend.test.ts
packages/shared/src/types/friend.ts
```

**Modified files:**
```
apps/api/prisma/schema.prisma                          # Add Friendship model + FriendshipStatus enum + User relations
apps/api/src/app.ts                                    # Import + mount friendsRouter
packages/shared/src/index.ts                           # Export new schemas/types
apps/api/src/__tests__/integration/helpers/db.ts       # Add "Friendship" to TRUNCATE list
```

**No changes needed:**
```
apps/api/src/services/curriculumService.ts             # Friends are independent of completeMission
apps/api/src/__fixtures__/completeMissionMocks.ts      # No new WithClient services for this story
apps/api/src/socket/index.ts                           # Socket.IO presence is Story 6.2
```

### Previous Story Intelligence

From Story 5.6 (Progressive Mechanic Reveal API — last completed story):
- Final test counts: 302 shared + 419 API unit + 28 web = 749 unit tests. 76 integration tests. All passing.
- All existing patterns stable: requireAuth, validate(), thin routes, service layer, co-located tests.
- Integration test helpers: `createAndLoginUser()`, `resetDatabase()`, `testPrisma` from `apps/api/src/__tests__/integration/helpers/`.
- Commit pattern: `feat(social): description (Story 6.1)`.

From Epic 5 Retrospective:
- **Team agreement (NEW):** Include real curriculum data references in dev notes. Not directly relevant for Story 6.1 (no curriculum interaction), but maintain the standard.
- **Mock cascade note:** Story 6.1 does NOT hook into `completeMission()`, so no mock cascade concerns.
- **Tech debt carried:** locale fallback duplication (Medium), authService.ts too large (Low), mock cascade (Medium), completeMission complexity (Low). None affect Story 6.1.
- **Architecture note from retro:** "User model is becoming a god object." Story 6.1 uses a separate `Friendship` join table — this is the recommended approach from the retro.

### Git Intelligence

Recent commits (last 5):
- `8bb05a8` chore(epic-5): add retrospective, project-context, and shared test helpers
- `a74bef5` feat(gamification): add progressive mechanic reveal API (Story 5.6)
- `260e776` feat(gamification): add leaderboard API (Story 5.5)
- `2d14bbb` feat(gamification): add achievements API (Story 5.4)
- `0aa1e9b` feat(gamification): add streak tracking API (Story 5.3)

Patterns confirmed:
- Commit message format: `feat(<domain>): description (Story X.Y)`
- Co-located test files consistently maintained
- Prisma migrations named descriptively: `add_*`

### Edge Cases to Handle

1. **Self-friending:** User A sends friend request to User A → 400 `CANNOT_FRIEND_SELF`. Check at service layer.

2. **Reverse duplicate:** User A→B exists, User B→A attempted → 409 `FRIENDSHIP_ALREADY_EXISTS`. Must check both directions.

3. **Accept own request:** User A accepts a request they sent (not a request they received) → 404 `FRIEND_REQUEST_NOT_FOUND` because the query filters by `addresseeId = authenticated user`.

4. **Concurrent requests:** User A→B and User B→A sent simultaneously → The `@@unique([requesterId, addresseeId])` prevents exact duplicates. The application-level check for reverse direction handles the cross case. If a race condition occurs, the second insert will fail at the DB level with a unique constraint violation — catch this Prisma error and return 409.

5. **Cascade deletion:** If User B is deleted, all friendships involving User B are automatically deleted (`onDelete: Cascade` on both relations). User A's friend list updates automatically.

6. **Accept already-accepted friendship:** Query filters `status = PENDING`, so accepting an already-accepted friendship returns 404 `FRIEND_REQUEST_NOT_FOUND` — safe and idempotent-ish.

7. **Online status before Story 6.2:** The `online` field should gracefully default to `false` if the Redis `online-users` set doesn't exist yet. This ensures Story 6.1 can ship independently.

### Performance Budget

Target: <200ms end-to-end for all endpoints.

| Operation | Estimated Time |
|-----------|---------------|
| Auth middleware | ~1ms |
| `sendFriendRequest`: 3 queries (check user, check existing, create) | ~5-8ms |
| `acceptFriendRequest`: 2 queries (find, update) | ~3-5ms |
| `removeFriend`: 2 queries (find, delete) | ~3-5ms |
| `getFriends`: 1 query (findMany with include) + Redis lookup | ~5-10ms |
| `getPendingRequests`: 1 query (findMany with include) | ~3-5ms |
| **All endpoints well within budget** | **< 15ms** |

### Existing Code to Reuse

1. **`requireAuth` middleware** — Session authentication. [Source: apps/api/src/middleware/auth.ts]
2. **`validate()` middleware** — Zod validation with body/params/query support. [Source: apps/api/src/middleware/validate.ts]
3. **`AppError`** — For typed errors (badRequest, unauthorized, notFound, conflict, forbidden). [Source: apps/api/src/utils/AppError.ts]
4. **Integration test helpers** — `createAndLoginUser()`, `resetDatabase()`, `setupApp()`, `teardownApp()`. [Source: apps/api/src/__tests__/integration/helpers/]
5. **Route test pattern** — Mock Prisma + supertest with mocked services. [Source: apps/api/src/routes/users.test.ts, gamification.test.ts]

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 6 Story 6.1 Friends System API]
- [Source: _bmad-output/planning-artifacts/architecture.md - DB Conventions, API Patterns, Socket.IO Events]
- [Source: _bmad-output/planning-artifacts/architecture.md - REST API structure, route handler patterns]
- [Source: docs/project-context.md - WithClient pattern, API response format, test organization]
- [Source: apps/api/prisma/schema.prisma - User model, relation patterns, naming conventions]
- [Source: apps/api/src/app.ts - Route mounting pattern]
- [Source: apps/api/src/routes/users.ts - Thin route handler example]
- [Source: apps/api/src/routes/gamification.ts - Paginated response example]
- [Source: apps/api/src/middleware/auth.ts - requireAuth middleware]
- [Source: apps/api/src/middleware/validate.ts - Zod validation middleware]
- [Source: apps/api/src/socket/index.ts - Socket.IO setup, presence events, session auth]
- [Source: apps/api/src/__tests__/integration/helpers/ - Test helper patterns]
- [Source: _bmad-output/implementation-artifacts/5-6-progressive-mechanic-reveal-api.md - Previous story patterns]
- [Source: _bmad-output/implementation-artifacts/epic-5-retro-2026-03-10.md - Retro insights, team agreements]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- friendService.test.ts initial run: 6 failures due to `toThrow()` matching on `message` instead of `code` property. Fixed by switching to `toMatchObject({ code: "..." })`.

### Completion Notes List

- Task 1: Added `FriendshipStatus` enum and `Friendship` model to Prisma schema with named self-referential relations on `User`. Migration `20260311094254_add_friendship_table` applied successfully. All 748 existing tests pass.
- Task 2: Created Zod schemas (`friendUserIdParamSchema`, `friendListEntrySchema`, `friendRequestEntrySchema`, `friendshipResponseSchema`) and inferred TypeScript types in `packages/shared`. 12 schema tests added, all pass.
- Task 3: Implemented `friendService.ts` with 5 functions: `sendFriendRequest`, `acceptFriendRequest`, `removeFriend`, `getFriends`, `getPendingRequests`. Uses `SMEMBERS` for efficient Redis online-status lookup with graceful fallback. 15 unit tests added.
- Task 4: Created thin `friends.ts` route file with 5 endpoints following existing patterns (requireAuth, validate, service call, response). 11 route unit tests added.
- Task 5: Mounted `friendsRouter` at `/api/v1/friends` in `app.ts` after gamification router. All 444 API unit tests pass.
- Task 6: Created 17 integration tests covering all ACs (#1-#12), bidirectional behavior, and error cases. Added `"Friendship"` to TRUNCATE list. All 93 integration tests pass.

### File List

**New files:**
- `apps/api/prisma/migrations/20260311094254_add_friendship_table/migration.sql`
- `apps/api/src/services/friendService.ts`
- `apps/api/src/services/friendService.test.ts`
- `apps/api/src/routes/friends.ts`
- `apps/api/src/routes/friends.test.ts`
- `apps/api/src/__tests__/integration/friends.test.ts`
- `packages/shared/src/schemas/friend.ts`
- `packages/shared/src/schemas/friend.test.ts`
- `packages/shared/src/types/friend.ts`

**Modified files:**
- `apps/api/prisma/schema.prisma` — Added FriendshipStatus enum, Friendship model, User relations
- `apps/api/src/app.ts` — Import + mount friendsRouter
- `packages/shared/src/index.ts` — Export friend schemas and types
- `apps/api/src/__tests__/integration/helpers/db.ts` — Added "Friendship" to TRUNCATE list

## Senior Developer Review (AI)

**Reviewed:** 2026-03-11
**Reviewer:** Claude Opus 4.6 (adversarial code review)
**Outcome:** Approved with fixes applied

### Findings (6 total: 1 HIGH, 3 MEDIUM, 2 LOW)

**FIXED:**
1. **[HIGH] P2002 race condition** — `sendFriendRequest` now catches Prisma unique constraint violations and returns 409 instead of 500. (`friendService.ts:67-76`)
2. **[MEDIUM] Reverse-direction race condition** — Added post-create check for concurrent B→A when A→B was just created. Cleans up own record and returns 409. (`friendService.ts:56-64`)
3. **[MEDIUM] Missing `updatedAt` in accept response** — Added `updatedAt` to `friendshipResponseSchema`, `serializeFriendship`, and `FriendshipRecord` interface. All related tests updated.
4. **[MEDIUM] Missing integration test for PENDING removal** — Added test confirming a pending friend request can be declined via DELETE.
5. **[LOW] Loose `FriendshipRecord` type** — Narrowed `status` from `string` to `"PENDING" | "ACCEPTED"`, removed unsafe `as` cast.

**NOT FIXED (acceptable):**
6. **[LOW] Route test mock boilerplate** — 45+ lines of transitive dependency mocks. Follows existing project patterns; not specific to this story.

### Test Results Post-Fix
- Unit tests: 447 passed (API) + 28 passed (web) + shared
- Integration tests: 94 passed (1 new test added)

## Change Log

- 2026-03-11: Code review fixes — P2002 error handling, reverse race condition mitigation, updatedAt in accept response, PENDING removal integration test, type safety improvements
- 2026-03-11: Implemented Friends System API (Story 6.1) — Friendship model, service layer with bidirectional queries, 5 REST endpoints, Redis-based online status, comprehensive test coverage (61 new tests across unit/integration)
