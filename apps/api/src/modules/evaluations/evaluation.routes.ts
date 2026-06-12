import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth, getAuth } from '../../middleware/auth';
import { validate, objectIdSchema } from '../../middleware/validate';
import { sendSuccess } from '../../utils/respond';
import { ApiError } from '../../utils/ApiError';
import { Answer, Evaluation } from '../../models';
import { toEvaluationDto } from '../interviews/interview.mapper';

export const evaluationRouter = Router();
evaluationRouter.use(requireAuth);

evaluationRouter.get(
  '/:id/evaluation',
  validate({ params: z.object({ id: objectIdSchema }) }),
  asyncHandler(async (req, res) => {
    const userId = getAuth(req).sub;
    // Ownership check rides on the answer document.
    const answer = await Answer.findOne({ _id: req.params.id, userId }).lean();
    if (!answer) {
      throw ApiError.notFound('Answer');
    }
    const evaluation = await Evaluation.findOne({ answerId: answer._id });
    if (!evaluation) {
      throw ApiError.notFound('Evaluation');
    }
    sendSuccess(res, toEvaluationDto(evaluation));
  }),
);
