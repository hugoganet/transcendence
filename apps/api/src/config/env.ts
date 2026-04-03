/**
 * @file Loads .env from monorepo root, then optional API-local override.
 * FR: Charge le .env racine du monorepo, puis surcharge locale API optionnelle.
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Monorepo root is 4 levels up from src/config/env.ts
config({ path: resolve(__dirname, "../../../../.env") });

const apiEnv = resolve(__dirname, "../../.env");
if (existsSync(apiEnv)) {
  config({ path: apiEnv, override: true });
}