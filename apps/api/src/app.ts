import "dotenv/config";
import express, { type Express, type RequestHandler } from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { AppError } from "./utils/AppError.js";

const app: Express = express();

// 1. Security headers
app.use(helmet());

// 2. CORS policy (credentials: true for cross-origin cookie sending)
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);

// 3. Body parsing
app.use(express.json());

// 4. Rate limiting
app.use(rateLimiter);

// Session middleware slot — registered via registerRoutes() after session is available
// 5. Routes, 6. 404, 7. Error handler are deferred to registerRoutes()

function registerRoutes(sessionMw?: RequestHandler) {
  if (sessionMw) {
    app.use(sessionMw);
  }

  // 5. Routes
  app.get("/api/v1/health", (_req, res) => {
    res.json({ data: { status: "ok" } });
  });

  // 6. 404 catch-all (Express 5 named wildcard)
  app.all("/{*splat}", (_req, _res, next) => {
    next(AppError.notFound("Route not found"));
  });

  // 7. Global error handler (must be last)
  app.use(errorHandler);
}

export { app, registerRoutes };
