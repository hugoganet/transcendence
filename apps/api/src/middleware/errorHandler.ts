/**
 * @module errorHandler
 * @description Global error-handling middleware — the last middleware in the Express chain.
 *
 * Catches all errors thrown or passed via `next(err)` from routes, services,
 * and other middlewares, and returns a consistent JSON error response.
 *
 * Must be registered **after** all routes in app.ts (Express identifies error
 * handlers by their 4-parameter signature).
 */

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

/**
 * Converts errors into structured JSON responses. Handles three cases:
 *
 * 1. **AppError** — Known business errors (e.g., 401 Unauthorized, 404 Not Found).
 *    Returns the error's statusCode, code, message, and optional field-level details.
 *
 * 2. **ZodError** — Validation failures from the validate middleware.
 *    Returns 400 with per-field error messages (e.g., `{ "email": "Invalid email" }`).
 *
 * 3. **Unknown errors** — Unexpected exceptions (bugs, DB failures, etc.).
 *    Logs the full error to console for debugging, but returns a generic 500
 *    "Internal server error" to the client — no stack traces or internal details
 *    are ever exposed (security: prevents information leakage).
 *
 * @param err - The error caught by Express.
 * @param _req - Express request (unused).
 * @param res - Express response — used to send the JSON error.
 * @param _next - Express next function (unused — this is the end of the chain).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Case 1: Known business error with explicit status code
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

  // Case 2: Zod validation failure — transform into per-field error details
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

  // Case 3: Unexpected error — log internally, return generic message to client
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
}
