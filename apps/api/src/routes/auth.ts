import { Router, type Request, type Response, type NextFunction } from "express";
import passport, { configuredStrategies } from "../config/passport.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "@transcendence/shared";
import { register, sanitizeUser } from "../services/authService.js";
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
    try {
      const { email, password, ageConfirmed } = req.body;
      const user = await register(email, password, ageConfirmed);

      // Log the user in (creates session) with the full Prisma user
      req.login(user as Express.User, (err) => {
        if (err) return next(err);
        res.status(201).json({ data: sanitizeUser(user) });
      });
    } catch (err) {
      next(err);
    }
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
          res.json({ data: sanitizeUser(user) });
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
    });
  },
);

// GET /api/v1/auth/me
authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({ data: sanitizeUser(req.user as Express.User) });
});

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
    passport.authenticate("google", { scope: ["profile", "email"], state: true })(req, res, next);
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
    passport.authenticate("facebook", { scope: ["public_profile", "email"], state: true })(req, res, next);
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
