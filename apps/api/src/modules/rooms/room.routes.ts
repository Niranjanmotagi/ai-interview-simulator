import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { validate, paginationQuerySchema } from '../../middleware/validate';
import { aiLimiter, execLimiter } from '../../middleware/rateLimit';
import * as controller from './room.controller';
import {
  aiCodeSchema,
  createRoomSchema,
  executionParams,
  generateQuestionSchema,
  joinParams,
  roomIdParams,
  runCodeSchema,
  snapshotParams,
} from './room.validation';

export const roomRouter = Router();
roomRouter.use(requireAuth);

roomRouter.post('/', validate({ body: createRoomSchema }), asyncHandler(controller.create));
roomRouter.get('/', validate({ query: paginationQuerySchema }), asyncHandler(controller.list));

// Declared before "/:id" so the literal segment wins for the join action.
roomRouter.post('/join/:code', validate({ params: joinParams }), asyncHandler(controller.join));

roomRouter.get('/:id', validate({ params: roomIdParams }), asyncHandler(controller.detail));
roomRouter.post('/:id/end', validate({ params: roomIdParams }), asyncHandler(controller.end));
roomRouter.delete('/:id', validate({ params: roomIdParams }), asyncHandler(controller.remove));

roomRouter.get(
  '/:id/messages',
  validate({ params: roomIdParams, query: paginationQuerySchema }),
  asyncHandler(controller.messages),
);
roomRouter.get(
  '/:id/snapshots',
  validate({ params: roomIdParams, query: paginationQuerySchema }),
  asyncHandler(controller.snapshots),
);
roomRouter.get(
  '/:id/snapshots/:snapId',
  validate({ params: snapshotParams }),
  asyncHandler(controller.snapshotDetail),
);
roomRouter.get(
  '/:id/activity',
  validate({ params: roomIdParams, query: paginationQuerySchema }),
  asyncHandler(controller.activity),
);

roomRouter.post(
  '/:id/run',
  execLimiter,
  validate({ params: roomIdParams, body: runCodeSchema }),
  asyncHandler(controller.run),
);
roomRouter.get(
  '/:id/executions',
  validate({ params: roomIdParams, query: paginationQuerySchema }),
  asyncHandler(controller.executions),
);
roomRouter.get(
  '/:id/executions/:execId',
  validate({ params: executionParams }),
  asyncHandler(controller.executionDetail),
);

// AI assistant (Gemini-backed; mock provider offline). Rate-limited per user.
roomRouter.post(
  '/:id/ai/question',
  aiLimiter,
  validate({ params: roomIdParams, body: generateQuestionSchema }),
  asyncHandler(controller.aiQuestion),
);
roomRouter.post(
  '/:id/ai/hint',
  aiLimiter,
  validate({ params: roomIdParams, body: aiCodeSchema }),
  asyncHandler(controller.aiHint),
);
roomRouter.post(
  '/:id/ai/explain',
  aiLimiter,
  validate({ params: roomIdParams, body: aiCodeSchema }),
  asyncHandler(controller.aiExplain),
);
roomRouter.post(
  '/:id/ai/evaluate',
  aiLimiter,
  validate({ params: roomIdParams, body: aiCodeSchema }),
  asyncHandler(controller.aiEvaluate),
);
roomRouter.get(
  '/:id/ai/reports',
  validate({ params: roomIdParams, query: paginationQuerySchema }),
  asyncHandler(controller.aiReports),
);
