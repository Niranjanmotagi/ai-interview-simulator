import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { validate, paginationQuerySchema } from '../../middleware/validate';
import { execLimiter } from '../../middleware/rateLimit';
import * as controller from './room.controller';
import {
  createRoomSchema,
  executionParams,
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
