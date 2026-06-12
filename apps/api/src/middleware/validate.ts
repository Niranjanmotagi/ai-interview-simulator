import type { NextFunction, Request, Response } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Validates and *replaces* req.body/query/params with the parsed output,
 * so handlers only ever see typed, stripped data (unknown fields rejected
 * where schemas use .strict()).
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // Express 5 makes req.query a getter; assigning properties keeps both happy.
        Object.assign(req.query, parsed);
      }
      if (schemas.params) {
        Object.assign(req.params, schemas.params.parse(req.params));
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        next(
          ApiError.badRequest('Validation failed', {
            issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          }),
        );
        return;
      }
      next(err);
    }
  };
}

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
