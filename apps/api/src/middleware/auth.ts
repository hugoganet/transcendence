/**
 * @module auth
 * @description Route-level middleware that enforces authentication.
 * Applied on protected routes — not globally.
 */

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

/**
 * Rejects unauthenticated requests with 401 Unauthorized.
 *
 * Checks two conditions:
 * 1. `req.isAuthenticated()` — Passport confirms a valid session exists.
 * 2. `!req.session.pending2FA` — The user has completed 2FA verification
 *    (if enabled). A session with `pending2FA: true` means the password
 *    was correct but the TOTP code hasn't been verified yet.
 *
 * @param req - Express request object (populated by Passport via deserializeUser).
 * @param _res - Express response object (unused — errors go through next()).
 * @param next - Passes to the next middleware/route handler, or to errorHandler on failure.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (req.isAuthenticated() && !req.session?.pending2FA) {
    return next();
  }
  next(AppError.unauthorized("Authentication required"));
}
