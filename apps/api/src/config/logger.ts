import pino from 'pino';
import { env, isProd, isTest } from './env';

/**
 * Structured JSON logs in production (machine-parseable on Render),
 * pretty logs in development, silent in tests.
 * Redaction guards against accidentally logging credentials or cookies.
 */
export const logger = pino({
  level: isTest ? 'silent' : env.NODE_ENV === 'development' ? 'debug' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },
  transport: !isProd && !isTest ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});
