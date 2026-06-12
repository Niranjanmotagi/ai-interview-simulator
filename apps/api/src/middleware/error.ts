import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import mongoose from 'mongoose';
import type { ApiErrorBody } from '@ai-interview/types';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { isProd } from '../config/env';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.path} not found`));
}

/**
 * Single funnel for every error. Operational errors map to their status/code;
 * everything else becomes an opaque 500 (stack logged, never leaked to clients).
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof MulterError) {
    apiError =
      err.code === 'LIMIT_FILE_SIZE'
        ? new ApiError(413, 'FILE_TOO_LARGE', 'Uploaded file exceeds the size limit')
        : ApiError.badRequest(`Upload error: ${err.message}`);
  } else if (err instanceof mongoose.Error.CastError) {
    apiError = ApiError.badRequest('Malformed identifier');
  } else if (err instanceof mongoose.Error.ValidationError) {
    apiError = ApiError.badRequest('Database validation failed', {
      issues: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    });
  } else if (isDuplicateKeyError(err)) {
    apiError = ApiError.conflict('A record with this value already exists', 'DUPLICATE');
  } else {
    apiError = ApiError.internal();
  }

  if (apiError.status >= 500) {
    logger.error({ err, method: req.method, path: req.path }, 'Unhandled error');
  } else {
    logger.debug(
      { code: apiError.code, status: apiError.status, path: req.path },
      'Request error',
    );
  }

  const body: ApiErrorBody = {
    success: false,
    error: {
      code: apiError.code,
      message:
        apiError.status >= 500 && isProd ? 'Internal server error' : apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  };
  res.status(apiError.status).json(body);
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  );
}
