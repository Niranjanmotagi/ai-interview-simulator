import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../../config/env';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { validate, objectIdSchema } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimit';
import { ALLOWED_MIME_TYPES } from './resume.parser';
import * as controller from './resume.controller';

/**
 * Memory storage: files are parsed in-process and only then persisted —
 * nothing user-controlled ever lands on disk under a user-supplied name.
 */
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF and DOCX files are accepted'));
    }
  },
});

const idParams = z.object({ id: objectIdSchema });

export const resumeRouter = Router();
resumeRouter.use(requireAuth);

resumeRouter.post('/', uploadMiddleware.single('file'), asyncHandler(controller.upload));
resumeRouter.post(
  '/:id/analyze',
  aiLimiter,
  validate({ params: idParams }),
  asyncHandler(controller.analyze),
);
resumeRouter.get('/', asyncHandler(controller.list));
resumeRouter.get('/:id', validate({ params: idParams }), asyncHandler(controller.detail));
resumeRouter.delete('/:id', validate({ params: idParams }), asyncHandler(controller.remove));
