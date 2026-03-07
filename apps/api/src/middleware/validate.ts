import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

interface ValidateOptions {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

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
