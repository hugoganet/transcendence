# E2E Tests

End-to-end tests using [Playwright](https://playwright.dev/).

## Prerequisites

Install Playwright browsers (one-time setup):

```bash
pnpm exec playwright install
```

Ensure the database is running and migrated:

```bash
pnpm --filter api db:migrate
```

## Running tests

```bash
# Run all E2E tests (starts API + web servers automatically)
pnpm test:e2e

# Run in headed mode (see the browser)
pnpm test:e2e -- --headed

# Run a specific test file
pnpm test:e2e -- e2e/api-smoke.spec.ts

# Run only chromium
pnpm test:e2e -- --project=chromium

# Show HTML report after a run
pnpm exec playwright show-report
```

## Structure

```
e2e/
  fixtures/
    auth.ts        # Auth helpers and test user utilities
  api-smoke.spec.ts  # API smoke tests (health, auth, curriculum)
```

## Configuration

See `playwright.config.ts` at the repo root. The config auto-starts both the API (port 3000) and web (port 5173) dev servers.
