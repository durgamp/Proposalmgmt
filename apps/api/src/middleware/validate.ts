import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Used by all routes: validate({ body: schema }) or validate({ query: schema })
export function validate(options: { body?: ZodSchema; query?: ZodSchema }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (options.body) req.body = options.body.parse(req.body);
      if (options.query) req.query = options.query.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      // Pass ZodError directly — errorHandler already handles it with a 400 response
      next(err);
    }
  };
}

// Kept for any direct usages elsewhere
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema });
}

export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema });
}
