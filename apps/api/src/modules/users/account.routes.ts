import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth, getAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendSuccess } from '../../utils/respond';
import { ApiError } from '../../utils/ApiError';
import {
  Answer,
  Evaluation,
  ImprovementPlan,
  InterviewSession,
  Question,
  RefreshToken,
  Resume,
  SessionSummary,
  UsageEvent,
  User,
} from '../../models';
import { getQuota } from '../../services/usage.service';
import { removeAllForUser } from '../resumes/resume.storage';
import { toUserDto } from './user.mapper';
import type { UsageSummaryDto } from '@ai-interview/types';

export const accountRouter = Router();
accountRouter.use(requireAuth);

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    targetRoles: z.array(z.string().trim().min(2).max(120)).max(10).optional(),
    experienceLevel: z.enum(['student', 'grad', 'mid', 'switcher']).optional(),
  })
  .strict();

accountRouter.patch(
  '/profile',
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      getAuth(req).sub,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!user) {
      throw ApiError.notFound('User');
    }
    sendSuccess(res, toUserDto(user));
  }),
);

accountRouter.get(
  '/usage',
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const [quota, events] = await Promise.all([
      getQuota(auth.sub, auth.plan),
      UsageEvent.aggregate<{
        _id: string;
        count: number;
        tokensIn: number;
        tokensOut: number;
      }>([
        { $match: { userId: new Types.ObjectId(auth.sub) } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            tokensIn: { $sum: '$tokensIn' },
            tokensOut: { $sum: '$tokensOut' },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);
    const body: UsageSummaryDto = {
      quota,
      events: events.map((e) => ({
        type: e._id,
        count: e.count,
        tokensIn: e.tokensIn,
        tokensOut: e.tokensOut,
      })),
    };
    sendSuccess(res, body);
  }),
);

/**
 * Right-to-erasure: deletes the account and every owned document across all
 * collections, plus stored resume files. Order: children first, user last,
 * so a mid-failure leaves a retryable state rather than orphaned PII.
 */
accountRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    const userId = getAuth(req).sub;

    const sessionIds = await InterviewSession.find({ userId }).distinct('_id');
    await Promise.all([
      Question.deleteMany({ sessionId: { $in: sessionIds } }),
      Answer.deleteMany({ userId }),
      Evaluation.deleteMany({ sessionId: { $in: sessionIds } }),
      SessionSummary.deleteMany({ userId }),
      ImprovementPlan.deleteMany({ userId }),
    ]);
    await Promise.all([
      InterviewSession.deleteMany({ userId }),
      Resume.deleteMany({ userId }),
      UsageEvent.deleteMany({ userId }),
      RefreshToken.deleteMany({ userId }),
    ]);
    await removeAllForUser(userId);
    await User.findByIdAndDelete(userId);

    sendSuccess(res, { deleted: true });
  }),
);
