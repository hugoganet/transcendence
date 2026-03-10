/**
 * Shared setup file for integration tests.
 * Loaded via vitest.integration.config.ts `setupFiles`.
 * Runs before each test file in the same worker context.
 *
 * Note: We intentionally do NOT teardown between test files. Multiple test files
 * run in the same worker process, sharing the same Express app and connections.
 * Disconnecting between files would break subsequent files. Process exit handles cleanup.
 */
import { setupApp } from "./app.js";

// Initialize the app (idempotent — only runs setup once per worker)
beforeAll(async () => {
  await setupApp();
});
