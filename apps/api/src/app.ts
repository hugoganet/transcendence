import "dotenv/config";
import express, { type Express, type RequestHandler } from "express";
import helmet from "helmet";
import cors from "cors";
import passport from "./config/passport.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { AppError } from "./utils/AppError.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { disclaimersRouter } from "./routes/disclaimers.js";
import { curriculumRouter } from "./routes/curriculum.js";
import { tooltipsRouter } from "./routes/tooltips.js";
import { exercisesRouter } from "./routes/exercises.js";
import { tokensRouter } from "./routes/tokens.js";
import { gamificationRouter } from "./routes/gamification.js";
import { friendsRouter } from "./routes/friends.js";

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

// 4. Form body parsing (required for Passport)
app.use(express.urlencoded({ extended: false }));

// 5. Rate limiting
app.use(rateLimiter);

// Session middleware slot — registered via registerRoutes() after session is available
// 6. Routes, 7. 404, 8. Error handler are deferred to registerRoutes()

function registerRoutes(sessionMw?: RequestHandler) {
  if (sessionMw) {
    app.use(sessionMw);
  }

  // Passport initialization (after session middleware)
  app.use(passport.initialize());
  app.use(passport.session());

  // 6. Routes
  app.get("/api/v1/health", (_req, res) => {
    res.json({ data: { status: "ok" } });
  });
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/disclaimers", disclaimersRouter);
  app.use("/api/v1/curriculum", curriculumRouter);
  app.use("/api/v1/tooltips", tooltipsRouter);
  app.use("/api/v1/exercises", exercisesRouter);
  app.use("/api/v1/tokens", tokensRouter);
  app.use("/api/v1/gamification", gamificationRouter);
  app.use("/api/v1/friends", friendsRouter);

  // 7. 404 catch-all (Express 5 named wildcard)
  app.all("/{*splat}", (_req, _res, next) => {
    next(AppError.notFound("Route not found"));
  });

  // 8. Global error handler (must be last)
  app.use(errorHandler);
}

export { app, registerRoutes };
