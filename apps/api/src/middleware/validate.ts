/**
 * @file Zod validation middleware for body, params, and query.
 * FR: Middleware de validation Zod pour body, params et query.
 */
import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/** Schemas to validate on the request. FR: Schemas a valider sur la requete. */
interface ValidateOptions {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/** Return middleware that parses request parts against Zod schemas. FR: Retourne un middleware qui parse les parties de la requete via Zod. */
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
