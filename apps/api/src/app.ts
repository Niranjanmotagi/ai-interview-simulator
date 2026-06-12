import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOrigins } from './config/env';
import { generalLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authRouter } from './modules/auth/auth.routes';
import { accountRouter } from './modules/users/account.routes';
import { resumeRouter } from './modules/resumes/resume.routes';
import { interviewRouter } from './modules/interviews/interview.routes';
import { evaluationRouter } from './modules/evaluations/evaluation.routes';
import { improvementRouter } from './modules/improvement/improvement.routes';
import { analyticsRouter, dashboardRouter } from './modules/analytics/analytics.routes';

export function createApp(): Express {
  const app = express();

  // Render terminates TLS at its proxy; trust it for correct req.ip / secure cookies.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true, // the refresh cookie crosses origins in production
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(generalLimiter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  const v1 = express.Router();
  v1.use('/auth', authRouter);
  v1.use('/account', accountRouter);
  v1.use('/resumes', resumeRouter);
  v1.use('/interviews', interviewRouter);
  v1.use('/answers', evaluationRouter);
  v1.use('/improvement-plans', improvementRouter);
  v1.use('/dashboard', dashboardRouter);
  v1.use('/analytics', analyticsRouter);
  app.use('/api/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
