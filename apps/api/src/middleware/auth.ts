/**
 * @file Auth Middleware — guards routes that require an authenticated session.
 * FR: Middleware Auth — protege les routes necessitant une session authentifiee.
 */
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

/**
 * Rejects the request if the user is not authenticated or has pending 2FA.
 * FR: Rejette la requete si l'utilisateur n'est pas authentifie ou a une 2FA en attente.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (req.isAuthenticated() && !req.session?.pending2FA) {
    return next();
  }
  next(AppError.unauthorized("Authentication required"));
}
