import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth, getAuth } from '../../middleware/auth';
import { validate, objectIdSchema } from '../../middleware/validate';
import { sendSuccess } from '../../utils/respond';
import { ApiError } from '../../utils/ApiError';
import { ImprovementPlan } from '../../models';
import { toPlanDto } from '../interviews/interview.mapper';

export const improvementRouter = Router();
improvementRouter.use(requireAuth);

improvementRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const plans = await ImprovementPlan.find({ userId: getAuth(req).sub })
      .sort({ createdAt: -1 })
      .limit(20);
    sendSuccess(res, plans.map(toPlanDto));
  }),
);

improvementRouter.patch(
  '/:id/items/:itemId',
  validate({
    params: z.object({ id: objectIdSchema, itemId: objectIdSchema }),
    body: z.object({ done: z.boolean() }).strict(),
  }),
  asyncHandler(async (req, res) => {
    const plan = await ImprovementPlan.findOne({ _id: req.params.id, userId: getAuth(req).sub });
    if (!plan) {
      throw ApiError.notFound('Improvement plan');
    }
    const item = plan.items.find((i) => i._id.toString() === req.params.itemId);
    if (!item) {
      throw ApiError.notFound('Plan item');
    }
    item.done = req.body.done;
    await plan.save();
    sendSuccess(res, toPlanDto(plan));
  }),
);
