import { z } from 'zod';
import { objectIdSchema } from '../../middleware/validate';

export const createInterviewSchema = z
  .object({
    resumeId: objectIdSchema.optional(),
    targetRole: z.string().trim().min(2).max(120),
    jobDescription: z.string().trim().max(15_000).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    roundType: z.enum(['behavioral', 'technical', 'system_design', 'hr', 'mixed']),
    questionCount: z.number().int().min(1).max(10).optional(),
  })
  .strict();

export const submitAnswerSchema = z
  .object({
    questionId: objectIdSchema,
    text: z.string().trim().min(1, 'Answer cannot be empty').max(20_000),
    inputMode: z.enum(['text', 'voice']).optional(),
    durationSec: z.number().int().min(0).max(7200).optional(),
  })
  .strict();

export const sessionIdParams = z.object({ id: objectIdSchema });
