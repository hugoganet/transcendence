/**
 * @module env
 * @description Loads environment variables from .env files using dotenv.
 *
 * Must be imported before any other config module to ensure env vars are
 * available. Loads two files in order:
 * 1. Monorepo root `.env` (4 levels up from `src/config/env.ts`).
 * 2. API-local `.env` (`apps/api/.env`), if it exists — overrides root values.
 */

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Load monorepo root .env (shared variables: DATABASE_URL, REDIS_URL, etc.) */
config({ path: resolve(__dirname, "../../../../.env") });

/** Load API-local .env if present (overrides root values for API-specific config) */
const apiEnv = resolve(__dirname, "../../.env");
if (existsSync(apiEnv)) {
  config({ path: apiEnv, override: true });
}