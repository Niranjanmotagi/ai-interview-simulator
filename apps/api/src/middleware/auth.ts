import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Plan, UserRole } from '@ai-interview/types';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  plan: Plan;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
    }
  }
}

/**
 * Verifies the Bearer access token and attaches minimal claims to req.auth.
 * Ownership checks happen in services by scoping every query with userId.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Missing access token', 'TOKEN_MISSING'));
    return;
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string') {
      throw new Error('Malformed token subject');
    }
    req.auth = {
      sub: payload.sub,
      role: (payload.role as UserRole) ?? 'user',
      plan: (payload.plan as Plan) ?? 'free',
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Access token expired', 'TOKEN_EXPIRED'));
      return;
    }
    next(ApiError.unauthorized('Invalid access token', 'TOKEN_INVALID'));
  }
}

export function requireRole(role: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(ApiError.unauthorized());
      return;
    }
    if (req.auth.role !== role) {
      next(ApiError.forbidden('Insufficient permissions'));
      return;
    }
    next();
  };
}

/** Convenience accessor that narrows req.auth for handlers behind requireAuth. */
export function getAuth(req: Request): AccessTokenPayload {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  return req.auth;
}
