import { env } from '../config/env';
import { logger } from '../config/logger';
import { GeminiProvider } from './gemini.provider';
import { MockAIProvider } from './mock.provider';
import type { AIService } from './types';

let instance: AIService | null = null;

export function getAIService(): AIService {
  if (!instance) {
    if (env.AI_PROVIDER === 'gemini') {
      instance = new GeminiProvider(env.GEMINI_API_KEY as string);
      logger.info(
        { fast: env.GEMINI_FAST_MODEL, smart: env.GEMINI_SMART_MODEL },
        'AI provider: Gemini',
      );
    } else {
      instance = new MockAIProvider();
      logger.info('AI provider: mock (deterministic, no external calls)');
    }
  }
  return instance;
}

/** Test seam: lets the suite inject a provider without touching env state. */
export function setAIService(service: AIService): void {
  instance = service;
}

export * from './types';
export * from './schemas';
export * from './prompts';
