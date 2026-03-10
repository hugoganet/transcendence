/**
 * Shared setup file for integration tests.
 * Loaded via vitest.integration.config.ts `setupFiles`.
 * Runs once before any test file in the same worker context.
 */
import { setupApp, teardownApp } from "./app.js";

// Initialize the app once for all integration test files
beforeAll(async () => {
  await setupApp();
});

// Clean up after all integration test files complete
afterAll(async () => {
  await teardownApp();
});
