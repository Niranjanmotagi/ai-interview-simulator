import type { Request, Response } from 'express';
import { env, isProd } from '../../config/env';
import { sendSuccess } from '../../utils/respond';
import { getAuth } from '../../middleware/auth';
import * as authService from './auth.service';
import type { IssuedRefresh } from './token.service';

export const REFRESH_COOKIE = 'aiis_refresh';
// Cookie is scoped to the auth router only — it is never sent with normal API
// calls, which shrinks the CSRF surface to refresh/logout.
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function setRefreshCookie(res: Response, refresh: IssuedRefresh): void {
  res.cookie(REFRESH_COOKIE, refresh.token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: REFRESH_COOKIE_PATH,
    expires: refresh.expiresAt,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: REFRESH_COOKIE_PATH,
  });
}

function requestMeta(req: Request) {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}

export async function register(req: Request, res: Response): Promise<void> {
  const { auth, refresh } = await authService.register(req.body, requestMeta(req));
  setRefreshCookie(res, refresh);
  sendSuccess(res, auth, 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { auth, refresh } = await authService.login(req.body, requestMeta(req));
  setRefreshCookie(res, refresh);
  sendSuccess(res, auth);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const raw: string | undefined = req.cookies?.[REFRESH_COOKIE];
  if (!raw) {
    clearRefreshCookie(res);
    res.status(401).json({
      success: false,
      error: { code: 'REFRESH_MISSING', message: 'No refresh token' },
    });
    return;
  }
  try {
    const { auth, refresh: rotated } = await authService.refresh(raw, requestMeta(req));
    setRefreshCookie(res, rotated);
    sendSuccess(res, auth);
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  sendSuccess(res, { loggedOut: true });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const appUrl = env.CORS_ORIGIN.split(',')[0]?.trim() ?? 'http://localhost:3000';
  await authService.forgotPassword(req.body.email, appUrl);
  // Identical response whether or not the account exists.
  sendSuccess(res, { sent: true });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  await authService.resetPassword(req.body);
  sendSuccess(res, { reset: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(getAuth(req).sub);
  sendSuccess(res, user);
}
