import { z } from 'zod';
import { ROOM_LANGUAGES } from '@ai-interview/types';
import { objectIdSchema } from '../../middleware/validate';

const languageSchema = z.enum(ROOM_LANGUAGES as [string, ...string[]]);

export const createRoomSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(120),
    language: languageSchema,
    scheduledAt: z.string().datetime().nullish(),
    problemPrompt: z.string().trim().max(8000).nullish(),
  })
  .strict();

export const roomIdParams = z.object({ id: objectIdSchema }).strict();

export const snapshotParams = z
  .object({ id: objectIdSchema, snapId: objectIdSchema })
  .strict();

export const joinParams = z
  .object({ code: z.string().trim().min(4).max(32) })
  .strict();

export const runCodeSchema = z
  .object({
    language: languageSchema,
    code: z.string().max(200_000),
    stdin: z.string().max(50_000).optional(),
  })
  .strict();

export const executionParams = z
  .object({ id: objectIdSchema, execId: objectIdSchema })
  .strict();
