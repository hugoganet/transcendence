import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

const router = Router();

const specPath = path.join(import.meta.dirname, "openapi.yaml");
const spec = yaml.parse(fs.readFileSync(specPath, "utf-8"));

// swagger-ui-express is CJS — dynamic import for ESM compatibility
const swaggerUi = await import("swagger-ui-express");

router.use("/", swaggerUi.serve, swaggerUi.setup(spec, {
  customSiteTitle: "Transcendence API Docs",
}));

export default router;
