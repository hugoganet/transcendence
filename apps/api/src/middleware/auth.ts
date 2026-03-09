import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  next(AppError.unauthorized("Authentication required"));
}
