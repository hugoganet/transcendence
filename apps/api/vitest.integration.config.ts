import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/__tests__/integration/**/*.test.ts"],
    globalSetup: ["src/__tests__/setup-integration.ts"],
    setupFiles: ["src/__tests__/integration/helpers/setup.ts"],
    sequence: { concurrent: false },
    testTimeout: 15_000,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ??
        "postgresql://postgres:postgres@127.0.0.1:54322/transcendence_test",
      NODE_ENV: "test",
      SESSION_SECRET: "integration-test-secret",
      SESSION_TTL_SECONDS: "1800",
      REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379/1",
      RATE_LIMIT_WINDOW_MS: "900000",
      RATE_LIMIT_MAX: "10000",
    },
  },
});
