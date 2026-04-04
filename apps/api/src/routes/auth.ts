/**
 * @file Auth Routes — handles register, login, logout, OAuth, 2FA, password reset.
 * FR: Routes d'authentification — gere inscription, connexion, deconnexion, OAuth, 2FA, reinitialisation mdp.
 */

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

/** Auth router — all /api/v1/auth endpoints. / FR: Routeur d'authentification. */
export const authRouter = Router();

// Must match the cookie name used by express-session (default: "connect.sid").
// If a custom `name` is ever set in config/session.ts, update this constant.
const SESSION_COOKIE_NAME = "connect.sid";

/** POST /register — create account, hash password, auto-login. / FR: Cree un compte, hash le mdp, auto-login. */
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

/** POST /login — verify credentials via Passport; sets pending2FA if enabled. / FR: Verifie les identifiants; active pending2FA si 2FA actif. */
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

/** POST /logout — destroy session in Redis and clear cookie. / FR: Detruit la session Redis et supprime le cookie. */
authRouter.post(
  "/logout",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      if (req.session) {
        req.session.destroy((destroyErr) => {
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
      }
    });
  },
);

/** GET /me — return current user or null if unauthenticated. / FR: Retourne l'utilisateur courant ou null si non authentifie. */
authRouter.get("/me", (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.json({ data: null });
  }
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

/** POST /forgot-password — send reset email; silent if email not found. / FR: Envoie un email de reinitialisation; silencieux si email inconnu. */
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

/** POST /reset-password — verify token, hash new password, invalidate sessions. / FR: Verifie le token, hash le nouveau mdp, invalide les sessions. */
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

/** POST /2fa/setup — generate TOTP secret and QR code. / FR: Genere le secret TOTP et le QR code. */
authRouter.post(
  "/2fa/setup",
  requireAuth,
  async (req: Request, res: Response) => {
    const result = await setup2FA((req.user as Express.User).id);
    res.json({ data: result });
  },
);

/** POST /2fa/verify-setup — confirm first TOTP code to enable 2FA. / FR: Confirme le premier code TOTP pour activer le 2FA. */
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

/** POST /2fa/verify — verify TOTP code at login (pending2FA only). / FR: Verifie le code TOTP a la connexion (pending2FA uniquement). */
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
    if (req.session) {
      delete req.session.pending2FA;
    }
    res.json({ data: sanitizeUser(req.user as Express.User) });
  },
);

/** POST /2fa/disable — disable 2FA after verifying current TOTP code. / FR: Desactive le 2FA apres verification du code TOTP. */
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

// GET /api/v1/auth/providers — returns which OAuth providers are configured
authRouter.get("/providers", (_req: Request, res: Response) => {
  res.json({
    data: {
      google: configuredStrategies.has("google"),
      facebook: configuredStrategies.has("facebook"),
    },
  });
});

/** GET /google — redirect to Google consent screen. / FR: Redirige vers l'ecran de consentement Google. */
authRouter.get(
  "/google",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isStrategyConfigured("google")) {
      return next(new AppError(503, "OAUTH_PROVIDER_UNAVAILABLE", "Google OAuth is not configured"));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (passport.authenticate as any)("google", { scope: ["profile", "email"], state: true })(req, res, next);
  },
);

/** GET /google/callback — exchange code for token, create/link user, redirect. / FR: Echange le code contre un token, cree/lie l'utilisateur, redirige. */
authRouter.get(
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isStrategyConfigured("google")) {
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=oauth_failed`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (passport.authenticate as any)(
      "google",
      (err: Error | null, user: Express.User | false) => {
        if (err || !user) {
          console.error("[Google OAuth] callback error:", err, "user:", user);
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

/** GET /facebook — redirect to Facebook consent screen. / FR: Redirige vers l'ecran de consentement Facebook. */
authRouter.get(
  "/facebook",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isStrategyConfigured("facebook")) {
      return next(new AppError(503, "OAUTH_PROVIDER_UNAVAILABLE", "Facebook OAuth is not configured"));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (passport.authenticate as any)("facebook", { scope: ["public_profile", "email"], state: true })(req, res, next);
  },
);

/** GET /facebook/callback — exchange code for token, create/link user, redirect. / FR: Echange le code contre un token, cree/lie l'utilisateur, redirige. */
authRouter.get(
  "/facebook/callback",
  (req: Request, res: Response, next: NextFunction) => {
    if (!isStrategyConfigured("facebook")) {
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=oauth_failed`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (passport.authenticate as any)(
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
