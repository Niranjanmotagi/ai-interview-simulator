import { env } from '../config/env';
import { logger } from '../config/logger';
import { MockExecutor } from './mock.provider';
import { PistonExecutor } from './piston.provider';
import type { ExecutionService } from './types';

let instance: ExecutionService | null = null;

export function getExecutionService(): ExecutionService {
  if (!instance) {
    if (env.EXECUTION_PROVIDER === 'piston') {
      instance = new PistonExecutor(env.PISTON_URL, env.EXEC_RUN_TIMEOUT_MS, env.EXEC_MEMORY_LIMIT_MB);
      logger.info({ url: env.PISTON_URL }, 'Execution provider: Piston (sandboxed)');
    } else {
      instance = new MockExecutor();
      logger.info('Execution provider: mock (deterministic, no real execution)');
    }
  }
  return instance;
}

/** Test seam: inject a provider without touching env state. */
export function setExecutionService(service: ExecutionService): void {
  instance = service;
}

export * from './types';
