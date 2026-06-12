import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { validate, paginationQuerySchema } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimit';
import * as controller from './interview.controller';
import {
  createInterviewSchema,
  sessionIdParams,
  submitAnswerSchema,
} from './interview.validation';

export const interviewRouter = Router();
interviewRouter.use(requireAuth);

interviewRouter.post(
  '/',
  aiLimiter,
  validate({ body: createInterviewSchema }),
  asyncHandler(controller.create),
);
interviewRouter.get('/', validate({ query: paginationQuerySchema }), asyncHandler(controller.list));
interviewRouter.get('/:id', validate({ params: sessionIdParams }), asyncHandler(controller.detail));
interviewRouter.post(
  '/:id/start',
  validate({ params: sessionIdParams }),
  asyncHandler(controller.start),
);
interviewRouter.get(
  '/:id/next',
  validate({ params: sessionIdParams }),
  asyncHandler(controller.next),
);
interviewRouter.post(
  '/:id/answers',
  aiLimiter,
  validate({ params: sessionIdParams, body: submitAnswerSchema }),
  asyncHandler(controller.submitAnswer),
);
interviewRouter.post(
  '/:id/complete',
  aiLimiter,
  validate({ params: sessionIdParams }),
  asyncHandler(controller.complete),
);
interviewRouter.get(
  '/:id/summary',
  validate({ params: sessionIdParams }),
  asyncHandler(controller.summary),
);
interviewRouter.delete(
  '/:id',
  validate({ params: sessionIdParams }),
  asyncHandler(controller.remove),
);
