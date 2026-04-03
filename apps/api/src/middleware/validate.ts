/**
 * @module validate
 * @description Route-level middleware that validates request data against Zod schemas.
 *
 * Uses the same Zod schemas defined in `packages/shared` — ensuring frontend
 * and backend enforce identical validation rules. If validation fails, Zod throws
 * a ZodError which is caught by the global errorHandler and returned as a 400
 * with per-field error details.
 */

import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/** Specifies which parts of the request to validate. */
interface ValidateOptions {
  /** Zod schema for req.body (POST/PUT/PATCH payloads). */
  body?: ZodSchema;
  /** Zod schema for req.params (URL path parameters like :exerciseId). */
  params?: ZodSchema;
  /** Zod schema for req.query (URL query string parameters). */
  query?: ZodSchema;
}

/**
 * Returns an Express middleware that validates req.body, req.params,
 * and/or req.query against the provided Zod schemas.
 *
 * On success, replaces the raw values with parsed/typed versions and calls next().
 * On failure, Zod throws a ZodError → caught by errorHandler → 400 response.
 *
 * @param schemas - Object specifying which request parts to validate.
 * @returns Express middleware function.
 *
 * @example
 * ```typescript
 * router.post("/register", validate({ body: registerSchema }), handler);
 * router.get("/missions/:missionId", validate({ params: missionIdSchema }), handler);
 * ```
 */
export function validate(schemas: ValidateOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.params) {
      const parsed = schemas.params.parse(req.params);
      Object.assign(req.params, parsed);
    }
    if (schemas.query) {
      const parsed = schemas.query.parse(req.query);
      res.locals.query = parsed;
    }
    next();
  };
}
