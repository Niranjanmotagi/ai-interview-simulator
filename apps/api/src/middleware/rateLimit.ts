import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { isTest } from '../config/env';

/**
 * Three tiers of limits:
 *  - general: broad API protection
 *  - auth: brute-force protection on credential endpoints
 *  - ai: cost protection on Gemini-backed routes (keyed per-user when possible)
 * In production behind a proxy/LB swap the in-memory store for a Redis store —
 * the express-rate-limit API is store-pluggable, nothing else changes.
 */
const skip = () => isTest;

const keyByUserOrIp = (req: Request): string => req.auth?.sub ?? req.ip ?? 'unknown';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, try again later' },
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  keyGenerator: keyByUserOrIp,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'AI request limit reached, try again later' },
  },
});
