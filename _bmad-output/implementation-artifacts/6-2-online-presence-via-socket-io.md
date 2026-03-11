# Story 6.2: Online Presence via Socket.IO

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see which of my friends are currently online,
So that I feel part of an active learning community.

## Acceptance Criteria

1. **Given** a user connects via Socket.IO,
   **When** the connection is authenticated (session cookie validated on handshake),
   **Then** `presence:online` event is emitted to all their ACCEPTED friends who are currently connected,
   **And** the user's ID is added to the Redis SET `online-users`.

2. **Given** a user disconnects,
   **When** the Socket.IO connection drops,
   **Then** `presence:offline` event is emitted to their friends **after a debounce period** (e.g., 5-10 seconds) to handle brief reconnects,
   **And** the user's ID is removed from the Redis SET `online-users`,
   **But only if** the user has NO other active Socket.IO connections (multi-tab support).

3. **Given** a user has multiple browser tabs/connections open,
   **When** one tab disconnects,
   **Then** no `presence:offline` event is emitted (other connections still active),
   **And** the user remains in the Redis SET `online-users`.

4. **Given** a user has multiple tabs and ALL disconnect,
   **When** the debounce period expires with no reconnection,
   **Then** `presence:offline` is emitted to friends,
   **And** the user's ID is removed from Redis SET `online-users`.

5. **Given** the presence system,
   **When** online status is queried via `GET /api/v1/friends` (Story 6.1),
   **Then** the `online` field accurately reflects real-time Socket.IO presence via the Redis SET `online-users`.

6. **Given** the presence events,
   **When** emitted,
   **Then** `presence:online` payload is `{ userId: string }`,
   **And** `presence:offline` payload is `{ userId: string }`,
   **And** events are only sent to the user's ACCEPTED friends (not all connected users).

7. **Given** a user who reconnects within the debounce window,
   **When** their new Socket.IO connection authenticates,
   **Then** no `presence:offline` was emitted (debounce timer cleared),
   **And** no duplicate `presence:online` is emitted (already tracked as online).

## Tasks / Subtasks

- [x] Task 1: Create presence handler module (AC: #1, #2, #3, #4, #6, #7)
  - [x] 1.1 Create `apps/api/src/socket/presence.ts`:
    - Import `redisClient` from `../config/redis.js`
    - Import `prisma` from `../config/database.js`
    - Define `ONLINE_USERS_KEY = "online-users"` and `DISCONNECT_DEBOUNCE_MS = 5000` (5 seconds)
  - [x] 1.2 Implement `handleUserConnect(io, socket)`:
    - Extract `userId` from `socket.data.userId`
    - Join the user-specific room `user:${userId}` for targeted events
    - Check if user is already in Redis SET `online-users` (multi-tab: already online)
    - If NOT already online:
      - Add `userId` to Redis SET `online-users` via `redisClient.sadd(ONLINE_USERS_KEY, userId)`
      - Query ACCEPTED friends from DB (both directions, same query pattern as `friendService.getFriends`)
      - For each friend, emit `presence:online` to room `user:${friendId}` via `io.to(\`user:${friendId}\`).emit("presence:online", { userId })`
    - If already online (multi-tab): no presence event, just join room
  - [x] 1.3 Implement `handleUserDisconnect(io, socket)` with debounce:
    - Extract `userId` from `socket.data.userId`
    - Set a debounce timer (`setTimeout`):
      - After `DISCONNECT_DEBOUNCE_MS`, check if user has ANY remaining sockets via `io.in(\`user:${userId}\`).fetchSockets()`
      - If `sockets.length === 0` (truly offline):
        - Remove `userId` from Redis SET `online-users` via `redisClient.srem(ONLINE_USERS_KEY, userId)`
        - Query ACCEPTED friends from DB
        - For each friend, emit `presence:offline` to room `user:${friendId}` via `io.to(\`user:${friendId}\`).emit("presence:offline", { userId })`
      - If sockets remain (other tabs): do nothing
    - On new connect for same userId: clear any pending debounce timer (use a `Map<string, NodeJS.Timeout>`)
  - [x] 1.4 Export `handleUserConnect` and `handleUserDisconnect` functions
  - [x] 1.5 Export `ONLINE_USERS_KEY` constant (for test use)

- [x] Task 2: Integrate presence handlers into Socket.IO server (AC: #1, #2)
  - [x] 2.1 Modify `apps/api/src/socket/index.ts`:
    - Import `handleUserConnect` and `handleUserDisconnect` from `./presence.js`
    - In the `connection` handler, after auth check and `socket.data.userId` assignment:
      - Call `handleUserConnect(io, socket)`
    - In the `disconnect` handler:
      - Call `handleUserDisconnect(io, socket)`
  - [x] 2.2 Ensure the `connection` handler joins `user:${userId}` room (done in presence handler)
  - [x] 2.3 Verify existing Socket.IO tests still pass

- [x] Task 3: Add helper for querying accepted friend IDs (AC: #6)
  - [x] 3.1 Add `getAcceptedFriendIds(userId: string): Promise<string[]>` to `apps/api/src/socket/presence.ts`:
    - Query `prisma.friendship.findMany` where status `ACCEPTED` and user is requester OR addressee
    - Return array of friend user IDs (the "other" user in each friendship)
    - This is a read-only DB query, not a service layer function — keeping it in the socket module to avoid circular dependencies
  - [x] 3.2 Note: Do NOT import `friendService` — the socket module should query Prisma directly to avoid coupling. The query is simple (findMany with OR + select IDs). This follows the same pattern as the socket/index.ts module which operates independently.

- [x] Task 4: Add unit tests for presence module (AC: #1-#7)
  - [x] 4.1 Create `apps/api/src/socket/presence.test.ts`:
    - Mock `redisClient` (sadd, srem, sismember)
    - Mock `prisma.friendship.findMany`
    - Mock Socket.IO `io` and `socket` objects
    - Test `handleUserConnect`:
      - First connection: adds to Redis SET, emits `presence:online` to each friend's room
      - Second connection (multi-tab): does NOT re-emit `presence:online`, does NOT re-add to Redis
    - Test `handleUserDisconnect`:
      - Last connection closes: after debounce, removes from Redis SET, emits `presence:offline` to friends
      - Tab closes but other tab remains: no `presence:offline`, no Redis removal
      - Reconnect within debounce: timer cleared, no offline emitted
    - Test `getAcceptedFriendIds`:
      - Returns correct IDs for bidirectional friendships
      - Returns empty array when no friends

- [x] Task 5: Add integration tests (AC: #1, #2, #5)
  - [x] 5.1 Create `apps/api/src/__tests__/integration/presence.test.ts`:
    - Use real Socket.IO client (`socket.io-client`) connecting to test server
    - Create 2 test users who are ACCEPTED friends
    - User A connects via Socket.IO → verify User B (also connected) receives `presence:online` event with `{ userId: userA.id }`
    - User A disconnects → verify User B receives `presence:offline` event after debounce
    - Verify `GET /api/v1/friends` returns `online: true` when friend is connected, `online: false` when disconnected
    - Test multi-tab: User A opens 2 connections, closes 1 → User B does NOT receive `presence:offline`
    - Test debounce: User A disconnects and reconnects within debounce window → no `presence:offline` emitted
  - [x] 5.2 Integration test setup:
    - Use the existing `setupApp`/`teardownApp` helpers from `apps/api/src/__tests__/integration/helpers/`
    - Create Socket.IO clients with session cookies from authenticated test users
    - Use `await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS + 100))` to wait past debounce
  - [x] 5.3 Verify all existing integration tests still pass

- [x] Task 6: Cleanup and verify (AC: all)
  - [x] 6.1 Run full test suite: `pnpm test` + `pnpm test:integration`
  - [x] 6.2 Verify `GET /api/v1/friends` returns accurate `online` status (Story 6.1 integration)
  - [x] 6.3 Verify no regressions in existing Socket.IO tests

## Dev Notes

### Critical Architecture Patterns

- **Socket.IO event format:** `domain:action`, all lowercase. Events `presence:online` and `presence:offline` are already defined in `ServerToClientEvents` interface at `apps/api/src/socket/index.ts:17-18`. Payloads must be `{ userId: string }` per the existing type definition (line 17: `(userId: string) => void` — note: this takes userId as a direct string argument, not wrapped in an object. Check the exact typing before implementing).

- **Redis SET `online-users`:** Already used by `friendService.getFriends()` (Story 6.1) via `redisClient.smembers("online-users")` with graceful fallback to empty set. This story implements the WRITE side. The key name `online-users` is hardcoded in `friendService.ts:126` — use the same key.

- **Thin socket handler pattern:** The socket module (`apps/api/src/socket/`) operates independently from the service layer. It can query Prisma directly for simple reads (friend IDs). Do NOT import friendService into the socket module — this avoids circular dependency risk and keeps the socket module self-contained.

- **Room-based targeting:** Use Socket.IO rooms `user:${userId}` to target specific users. This works across multiple server instances with the Redis adapter already configured. Emit to `io.to(\`user:${friendId}\`).emit(...)` — never broadcast to all connected sockets.

### Multi-Tab / Multi-Connection Handling

This is the single most important design decision for this story:

1. **On connect:** Check if user is ALREADY in Redis SET `online-users` (via `SISMEMBER`). If yes, this is a second tab — join room but skip presence:online emission. If no, add to SET and emit.

2. **On disconnect:** Do NOT immediately remove from Redis or emit offline. Start a debounce timer. After timer expires, check `io.in(\`user:${userId}\`).fetchSockets()` to see if any connections remain. Only if zero sockets remain, remove from Redis and emit offline.

3. **On reconnect during debounce:** Clear the pending timer via the `disconnectTimers` Map. No offline event is emitted. No duplicate online event is emitted (user is still in Redis SET).

```typescript
// Disconnect timer map — module-level state
const disconnectTimers = new Map<string, NodeJS.Timeout>();

// On connect:
if (disconnectTimers.has(userId)) {
  clearTimeout(disconnectTimers.get(userId)!);
  disconnectTimers.delete(userId);
}
const isAlreadyOnline = await redisClient.sismember(ONLINE_USERS_KEY, userId);
if (!isAlreadyOnline) {
  await redisClient.sadd(ONLINE_USERS_KEY, userId);
  // emit presence:online to friends...
}

// On disconnect:
const timer = setTimeout(async () => {
  const sockets = await io.in(`user:${userId}`).fetchSockets();
  if (sockets.length === 0) {
    await redisClient.srem(ONLINE_USERS_KEY, userId);
    // emit presence:offline to friends...
  }
  disconnectTimers.delete(userId);
}, DISCONNECT_DEBOUNCE_MS);
disconnectTimers.set(userId, timer);
```

### Socket.IO `fetchSockets()` with Redis Adapter

`io.in(room).fetchSockets()` queries across ALL server instances when the Redis adapter is configured. This is critical for multi-tab detection in a clustered environment. Returns an array of `RemoteSocket` objects.

### Friend Query for Presence Events

When emitting presence events, query ACCEPTED friends directly from Prisma:

```typescript
async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: userId },
        { addresseeId: userId },
      ],
    },
    select: {
      requesterId: true,
      addresseeId: true,
    },
  });

  return friendships.map(f =>
    f.requesterId === userId ? f.addresseeId : f.requesterId
  );
}
```

### Existing Code Inventory

| File | Relevance |
|------|-----------|
| `apps/api/src/socket/index.ts` | Modify: add presence handler calls in connection/disconnect |
| `apps/api/src/socket/index.test.ts` | Must still pass after changes |
| `apps/api/src/config/redis.ts` | Import: `redisClient` (ioredis) for SET operations |
| `apps/api/src/services/friendService.ts:124-131` | READ side: `getOnlineUserIds()` already uses `smembers("online-users")` |
| `apps/api/src/index.ts` | No changes — `io` is already exported for reference |
| `apps/api/src/config/database.ts` | Import: `prisma` for friendship queries |

### Event Type Compatibility Check

The `ServerToClientEvents` interface at `socket/index.ts:16-18` defines:
```typescript
"presence:online": (userId: string) => void;
"presence:offline": (userId: string) => void;
```

**Important:** The events take `userId` as a direct `string` parameter, NOT an object `{ userId: string }`. The AC says payload is `{ userId: string }` but the existing typed interface uses a bare string. **Decision:** Follow the existing type definition (bare string). The AC describes intent — the typed interface is the source of truth. Emit: `io.to(...).emit("presence:online", userId)`.

If the team prefers `{ userId: string }` object payload for consistency with other events (like `notification:push`), update the `ServerToClientEvents` interface first. But this is the dev's call — keep it simple and match the existing types.

### Project Structure Notes

**New files:**
```
apps/api/src/socket/presence.ts          # Presence handler module
apps/api/src/socket/presence.test.ts     # Unit tests
apps/api/src/__tests__/integration/presence.test.ts  # Integration tests
```

**Modified files:**
```
apps/api/src/socket/index.ts             # Add presence handler calls in connection/disconnect
```

**No changes needed:**
```
apps/api/src/services/friendService.ts   # READ side already works, no modifications
apps/api/prisma/schema.prisma            # No new tables or columns
apps/api/src/app.ts                      # No new routes
packages/shared/                          # No new schemas needed
```

### Previous Story Intelligence

From Story 6.1 (Friends System API):
- `Friendship` table with bidirectional relations: `@@unique([requesterId, addresseeId])`, check both directions with `OR` clause
- `friendService.getFriends()` already reads Redis SET `online-users` via `smembers()` with graceful fallback
- Redis `redisClient` is ioredis at `apps/api/src/config/redis.ts` — use `sadd`, `srem`, `sismember`, `smembers`
- Test helpers: `createAndLoginUser()`, `resetDatabase()`, `setupApp()`, `teardownApp()` in `apps/api/src/__tests__/integration/helpers/`
- Current test counts: 447 API unit + 94 integration tests passing
- Socket.IO test uses `socket.io-client` with `ioc()` and `transports: ["websocket"]`

### Edge Cases

1. **Server restart:** Redis SET `online-users` persists across restarts but Socket.IO connections are lost. The SET may contain stale user IDs. This is acceptable for MVP — the friends list endpoint checks at query time, and stale entries self-correct when users reconnect. A cleanup job could be added post-MVP.

2. **Redis unavailable:** `handleUserConnect` and `handleUserDisconnect` should catch Redis errors gracefully. If Redis is down, presence is best-effort — don't crash the socket server.

3. **User deleted while online:** Friendship cascade deletion handles the DB side. The user's socket will eventually disconnect and be cleaned up naturally.

4. **Concurrent friend request acceptance:** If User A and User B become friends while both are online, they won't receive presence events for that connection. This is fine — the next `GET /api/v1/friends` call will show accurate online status.

### Performance Budget

| Operation | Estimated Time |
|-----------|---------------|
| `sismember` check on connect | ~1ms |
| `sadd` to Redis SET | ~1ms |
| `findMany` for friend IDs (indexed) | ~3-5ms |
| `io.to().emit()` per friend (Redis adapter) | ~1-2ms each |
| `fetchSockets()` on disconnect debounce | ~2-5ms |
| **Total connect flow (N friends)** | **~5ms + N*2ms** |
| **Total disconnect flow** | **5s debounce + ~5ms + N*2ms** |

### Testing Strategy

- **Unit tests (presence.test.ts):** Mock Redis, Prisma, and Socket.IO. Test logic: connect adds to SET + emits, disconnect with debounce removes + emits, multi-tab prevention, timer management.
- **Integration tests (presence.test.ts):** Real Socket.IO connections + real Redis + real DB. Verify end-to-end flow: connect → friend receives event → disconnect after debounce → friend receives offline. Also verify `GET /api/v1/friends` online field accuracy.

### Debounce Timer Cleanup

The `disconnectTimers` Map is module-level state. For testing, export a `clearAllDisconnectTimers()` function for test cleanup in `afterEach`. This prevents timer leaks between tests.

```typescript
export function clearAllDisconnectTimers(): void {
  for (const timer of disconnectTimers.values()) {
    clearTimeout(timer);
  }
  disconnectTimers.clear();
}
```

### References

- [Source: apps/api/src/socket/index.ts — Socket.IO server setup, typed events, session auth]
- [Source: apps/api/src/socket/index.test.ts — Socket.IO test patterns with mocked Redis adapter]
- [Source: apps/api/src/services/friendService.ts:124-131 — Redis `online-users` SET read pattern]
- [Source: apps/api/src/config/redis.ts — ioredis client export]
- [Source: apps/api/prisma/schema.prisma:196-208 — Friendship model with bidirectional relations]
- [Source: _bmad-output/planning-artifacts/architecture.md — Socket.IO events, presence:online/offline, Redis adapter]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6 Story 6.2 requirements]
- [Source: _bmad-output/implementation-artifacts/6-1-friends-system-api.md — Previous story context, patterns]
- [Source: docs/project-context.md — API patterns, test organization]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Session auth fix: `io.engine.use(sessionMw)` was replaced with `io.use()` Socket.IO middleware because Passport stores user ID in `session.passport.user`, not `session.userId`. The `io.engine.use()` approach created empty sessions. Fixed by using `io.use()` and reading `req.session.passport.user` for the userId.

### Completion Notes List

- Created `apps/api/src/socket/presence.ts` — self-contained presence handler with `handleUserConnect`, `handleUserDisconnect`, `getAcceptedFriendIds`, and `clearAllDisconnectTimers`
- Modified `apps/api/src/socket/index.ts` — integrated presence handlers, fixed session auth to read Passport's `session.passport.user` instead of `session.userId`, switched from `io.engine.use()` to `io.use()` for session middleware
- All presence events follow existing typed interface: `presence:online(userId: string)` and `presence:offline(userId: string)` — bare string, not wrapped object
- Redis SET `online-users` is correctly populated (WRITE side), integrating with Story 6.1's READ side in `friendService.getFriends()`
- Multi-tab support: SISMEMBER check prevents duplicate online events; debounce + fetchSockets prevents premature offline events
- 5-second debounce on disconnect handles brief reconnects
- Error handling: Redis failures are caught silently (best-effort presence)
- Test counts: 456 unit tests (9 new) + 99 integration tests (5 new) — 0 regressions

### File List

**New files:**
- `apps/api/src/socket/presence.ts` — Presence handler module (connect/disconnect/debounce/friend query)
- `apps/api/src/socket/presence.test.ts` — 9 unit tests (mocked Redis, Prisma, Socket.IO)
- `apps/api/src/__tests__/integration/presence.test.ts` — 6 integration tests (real Socket.IO, Redis, DB)

**Modified files:**
- `apps/api/src/socket/index.ts` — Added presence handler imports/calls, fixed session auth for Passport, switched to io.use() middleware, added .catch() for async presence calls
- `apps/api/src/socket/index.test.ts` — Added vi.mock for presence module (test isolation fix)

## Change Log

- **2026-03-11:** Implemented online presence via Socket.IO (Story 6.2). Added presence handler module with multi-tab support, 5s disconnect debounce, room-based friend targeting, and Redis SET integration. Fixed Socket.IO session authentication to read Passport session data. Added 14 tests (9 unit + 5 integration).
- **2026-03-11 (Code Review):** Fixed 6 issues found during adversarial review:
  - **H1:** Replaced non-atomic `sismember`+`sadd` with atomic `sadd` return value check to prevent TOCTOU race on concurrent tab opens
  - **H2:** Added timer clearing in `handleUserDisconnect` to prevent orphaned timers causing duplicate `presence:offline` events
  - **H3:** Added `.catch()` to async `handleUserConnect`/`handleUserDisconnect` calls in socket connection handler to prevent unhandled promise rejections
  - **M1:** Added `vi.mock("./presence.js")` in `index.test.ts` to isolate unit tests from Prisma/Redis imports
  - **M2:** Removed `console.log` statements from production socket code
  - **M3:** Added AC #4 integration test (all multi-tabs disconnect → single offline event)
