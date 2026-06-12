import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth, getAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendSuccess } from '../../utils/respond';
import * as service from './analytics.service';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    sendSuccess(res, await service.getDashboardOverview(auth.sub, auth.plan));
  }),
);

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

analyticsRouter.get(
  '/trends',
  validate({ query: z.object({ days: z.coerce.number().int().min(7).max(365).default(90) }) }),
  asyncHandler(async (req, res) => {
    const days = Number(req.query.days ?? 90);
    sendSuccess(res, await service.getScoreTrends(getAuth(req).sub, days));
  }),
);

analyticsRouter.get(
  '/weaknesses',
  asyncHandler(async (req, res) => {
    sendSuccess(res, await service.getWeaknessAggregation(getAuth(req).sub));
  }),
);
