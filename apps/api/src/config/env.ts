import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Monorepo root is 4 levels up from src/config/env.ts
config({ path: resolve(__dirname, "../../../../.env") });
