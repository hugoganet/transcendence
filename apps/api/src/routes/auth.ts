import { Router, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import passport, { configuredStrategies } from "../config/passport.js";
import { redisClient } from "../config/redis.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  totpCodeSchema,
} from "@transcendence/shared";
import {
  register,
  sanitizeUser,
  requestPasswordReset,
  resetPassword,
  setup2FA,
  verifyAndEnable2FA,
  verify2FALogin,
  disable2FA,
} from "../services/authService.js";
import { AppError } from "../utils/AppError.js";

export const authRouter = Router();

// Must match the cookie name used by express-session (default: "connect.sid").
// If a custom `name` is ever set in config/session.ts, update this constant.
const SESSION_COOKIE_NAME = "connect.sid";

// POST /api/v1/auth/register
authRouter.post(
  "/register",
  validate({ body: registerSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, ageConfirmed } = req.body;
    const user = await register(email, password, ageConfirmed);

    // Log the user in (creates session) with the full Prisma user
    req.login(user as Express.User, (err) => {
      if (err) return next(err);
      res.status(201).json({ data: sanitizeUser(user) });
    });
  },
);

// POST /api/v1/auth/login
authRouter.post(
  "/login",
  validate({ body: loginSchema }),
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      (err: Error | null, user: Express.User | false) => {
        if (err) return next(err);
        if (!user) {
          return next(
            new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password"),
          );
        }
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          if (user.twoFactorEnabled && req.session) {
            req.session.pending2FA = true;
            return res.json({ data: { requires2FA: true } });
          }
          res.json({ data: sanitizeUser(user as Express.User) });
        });
      },
    )(req, res, next);
  },
);

// POST /api/v1/auth/logout
authRouter.post(
  "/logout",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session?.destroy((destroyErr) => {
        if (destroyErr) return next(destroyErr);
        // Options must match session cookie config in config/session.ts
        res.clearCookie(SESSION_COOKIE_NAME, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
        res.json({ data: { message: "Logged out successfully" } });
      });
    });
  },
);

// GET /api/v1/auth/me
authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({ data: sanitizeUser(req.user as Express.User) });
});

// Stricter rate limiter for password reset requests (5 per 15 minutes per IP)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisClient.call(command, ...args) as Promise<never>,
    prefix: "rl:forgot-password:",
  }),
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
      },
    });
  },
});

// POST /api/v1/auth/forgot-password
authRouter.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate({ body: passwordResetRequestSchema }),
  async (req: Request, res: Response) => {
    await requestPasswordReset(req.body.email);
    res.json({
      data: {
        message:
          "If an account with that email exists, a reset link has been sent.",
      },
    });
  },
);

// Stricter rate limiter for password reset submissions (5 per 15 minutes per IP)
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisClient.call(command, ...args) as Promise<never>,
    prefix: "rl:reset-password:",
  }),
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
      },
    });
  },
});

// POST /api/v1/auth/reset-password
authRouter.post(
  "/reset-password",
  resetPasswordLimiter,
  validate({ body: passwordResetSchema }),
  async (req: Request, res: Response) => {
    await resetPassword(req.body.token, req.body.password);
    res.json({
      data: { message: "Password has been reset successfully." },
    });
  },
);

// Stricter rate limiter for 2FA verify endpoints (3 per 15 minutes per IP)
// Only 1,000,000 possible 6-digit codes — brute-force prevention is critical
const twoFactorVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisClient.call(command, ...args) as Promise<never>,
    prefix: "rl:2fa-verify:",
  }),
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
      },
    });
  },
});

// POST /api/v1/auth/2fa/setup
authRouter.post(
  "/2fa/setup",
  requireAuth,
  async (req: Request, res: Response) => {
    const result = await setup2FA((req.user as Express.User).id);
    res.json({ data: result });
  },
);

// POST /api/v1/auth/2fa/verify-setup
authRouter.post(
  "/2fa/verify-setup",
  requireAuth,
  twoFactorVerifyLimiter,
  validate({ body: totpCodeSchema }),
  async (req: Request, res: Response) => {
    await verifyAndEnable2FA((req.user as Express.User).id, req.body.code);
    res.json({
      data: { message: "Two-factor authentication has been enabled." },
    });
  },
);

// POST /api/v1/auth/2fa/verify (special auth — pending2FA session only)
// Auth check runs before rate limiter so unauthenticated requests don't consume rate limit quota
authRouter.post(
  "/2fa/verify",
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.session?.pending2FA) {
      return next(AppError.unauthorized("Authentication required"));
    }
    next();
  },
  twoFactorVerifyLimiter,
  validate({ body: totpCodeSchema }),
  async (req: Request, res: Response) => {
    await verify2FALogin((req.user as Express.User).id, req.body.code);
    delete req.session?.pending2FA;
    res.json({ data: sanitizeUser(req.user as Express.User) });
  },
);

// POST /api/v1/auth/2fa/disable
authRouter.post(
  "/2fa/disable",
  requireAuth,
  twoFactorVerifyLimiter,
  validate({ body: totpCodeSchema }),
  async (req: Request, res: Response) => {
    await disable2FA((req.user as Express.User).id, req.body.code);
    res.json({
      data: { message: "Two-factor authentication has been disabled." },
    });
  },
);

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

function isStrategyConfigured(name: string): boolean {
  return configuredStrategies.has(name);
}

// GET /api/v1/auth/google — initiates Google OAuth flow
authRouter.get(
  "/google",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isStrategyConfigured("google")) {
      return next(new AppError(503, "OAUTH_PROVIDER_UNAVAILABLE", "Google OAuth is not configured"));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    passport.authenticate("google", { scope: ["profile", "email"], state: true } as any)(req, res, next);
  },
);

// GET /api/v1/auth/google/callback — handles Google callback
authRouter.get(
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isStrategyConfigured("google")) {
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=oauth_failed`);
    }
    passport.authenticate(
      "google",
      (err: Error | null, user: Express.User | false) => {
        if (err || !user) {
          return res.redirect(`${FRONTEND_URL}/auth/callback?error=oauth_failed`);
        }
        req.login(user, (loginErr) => {
          if (loginErr) {
            return res.redirect(`${FRONTEND_URL}/auth/callback?error=oauth_failed`);
          }
          res.redirect(`${FRONTEND_URL}/auth/callback?success=true`);
        });
      },
    )(req, res, next);
  },
);

// GET /api/v1/auth/facebook — initiates Facebook OAuth flow
authRouter.get(
  "/facebook",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isStrategyConfigured("facebook")) {
      return next(new AppError(503, "OAUTH_PROVIDER_UNAVAILABLE", "Facebook OAuth is not configured"));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    passport.authenticate("facebook", { scope: ["public_profile", "email"], state: true } as any)(req, res, next);
  },
);

// GET /api/v1/auth/facebook/callback — handles Facebook callback
authRouter.get(
  "/facebook/callback",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isStrategyConfigured("facebook")) {
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=oauth_failed`);
    }
    passport.authenticate(
      "facebook",
      (err: Error | null, user: Express.User | false) => {
        if (err || !user) {
          return res.redirect(`${FRONTEND_URL}/auth/callback?error=oauth_failed`);
        }
        req.login(user, (loginErr) => {
          if (loginErr) {
            return res.redirect(`${FRONTEND_URL}/auth/callback?error=oauth_failed`);
          }
          res.redirect(`${FRONTEND_URL}/auth/callback?success=true`);
        });
      },
    )(req, res, next);
  },
);
