import http from 'node:http';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDb, disconnectDb } from './config/db';
import { createApp } from './app';

async function main(): Promise<void> {
  await connectDb();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API listening');
  });

  // Graceful shutdown: stop accepting connections, drain, close DB.
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    // Hard exit if draining hangs (e.g. long AI call mid-flight).
    setTimeout(() => process.exit(1), 15_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
