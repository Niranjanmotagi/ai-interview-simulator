import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import * as controller from './auth.controller';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.validation';

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(controller.register),
);
authRouter.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(controller.login),
);
authRouter.post('/refresh', authLimiter, asyncHandler(controller.refresh));
authRouter.post('/logout', asyncHandler(controller.logout));
authRouter.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(controller.forgotPassword),
);
authRouter.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(controller.resetPassword),
);
authRouter.get('/me', requireAuth, asyncHandler(controller.me));
