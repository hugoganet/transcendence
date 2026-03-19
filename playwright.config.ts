import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: [
    {
      command: 'pnpm --filter api dev',
      port: 3000,
      reuseExistingServer: true,
      timeout: 10000,
    },
    {
      command: 'pnpm --filter web dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 10000,
    },
  ],
});
