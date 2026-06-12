import { GoogleGenAI } from '@google/genai';
import type { ZodType } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';
import {
  AIOutputError,
  type AIService,
  type GenerateJsonRequest,
  type GenerateJsonResult,
} from './types';

const MAX_TRANSIENT_RETRIES = 3;
const BASE_BACKOFF_MS = 750;

/**
 * Gemini implementation of AIService.
 *  - JSON mode (responseMimeType) for structured output
 *  - zod validation with a single "repair" re-ask on schema violations
 *  - exponential backoff on transient errors (429/5xx)
 *  - model tiering: fast model for generation, smart model for evaluation
 */
export class GeminiProvider implements AIService {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateJson<T>(
    req: GenerateJsonRequest,
    schema: ZodType<T>,
  ): Promise<GenerateJsonResult<T>> {
    const model = req.tier === 'smart' ? env.GEMINI_SMART_MODEL : env.GEMINI_FAST_MODEL;

    try {
      return await this.callAndValidate(req, schema, model, req.user);
    } catch (err) {
      if (err instanceof AIOutputError) {
        // One repair pass: show the model its own output and the validation error.
        logger.warn({ task: req.task, model }, 'AI output failed validation — attempting repair');
        const repairPrompt = [
          req.user,
          '',
          'Your previous response was invalid JSON for the required schema.',
          `Previous response:\n${truncate(err.rawOutput, 4000)}`,
          `Validation error: ${err.message}`,
          'Respond again with ONLY valid JSON matching the schema. No prose, no markdown fences.',
        ].join('\n');
        return await this.callAndValidate(req, schema, model, repairPrompt);
      }
      throw err;
    }
  }

  private async callAndValidate<T>(
    req: GenerateJsonRequest,
    schema: ZodType<T>,
    model: string,
    userPrompt: string,
  ): Promise<GenerateJsonResult<T>> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_TRANSIENT_RETRIES; attempt++) {
      try {
        const response = await this.client.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: req.system,
            responseMimeType: 'application/json',
            temperature: req.temperature ?? 0.4,
            maxOutputTokens: req.maxOutputTokens ?? 8192,
          },
        });

        const raw = response.text ?? '';
        const usage = {
          tokensIn: response.usageMetadata?.promptTokenCount ?? 0,
          tokensOut: response.usageMetadata?.candidatesTokenCount ?? 0,
          model,
        };

        const json = extractJson(raw);
        const parsed = schema.safeParse(json);
        if (!parsed.success) {
          throw new AIOutputError(
            parsed.error.issues
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; '),
            raw,
          );
        }
        return { data: parsed.data, usage };
      } catch (err) {
        if (err instanceof AIOutputError) {
          throw err; // schema problem — handled by the repair pass, not by retrying
        }
        lastError = err;
        if (attempt < MAX_TRANSIENT_RETRIES - 1 && isTransient(err)) {
          const delay = BASE_BACKOFF_MS * 2 ** attempt;
          logger.warn(
            { task: req.task, model, attempt: attempt + 1, delay },
            'Transient Gemini error — retrying',
          );
          await sleep(delay);
          continue;
        }
        break;
      }
    }

    logger.error({ err: lastError, task: req.task, model }, 'Gemini call failed');
    throw ApiError.serviceUnavailable(
      'The AI service is temporarily unavailable. Please try again shortly.',
    );
  }
}

function extractJson(raw: string): unknown {
  // JSON mode normally returns bare JSON, but be tolerant of code fences.
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new AIOutputError('Response was not parseable JSON', raw);
  }
}

function isTransient(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: unknown }).status)
      : undefined;
  if (status && [429, 500, 502, 503, 504].includes(status)) {
    return true;
  }
  return /429|500|502|503|504|RESOURCE_EXHAUSTED|UNAVAILABLE|timeout|fetch failed/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
