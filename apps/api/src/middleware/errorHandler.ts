/**
 * @file Error Handler — centralised Express error middleware for AppError, Zod, and unknown errors.
 * FR: Gestionnaire d'erreurs — middleware Express centralise pour AppError, Zod et erreurs inconnues.
 */
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

/**
 * Global error handler that formats AppError, ZodError, and fallback 500 responses.
 * FR: Gestionnaire global qui formate les AppError, ZodError et les reponses 500 par defaut.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "value";
      details[path] = issue.message;
    }
    res.status(400).json({
      error: {
        code: "INVALID_INPUT",
        message: "Validation failed",
        details,
      },
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
}
