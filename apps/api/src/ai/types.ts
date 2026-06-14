import type { ZodType } from 'zod';

export type ModelTier = 'fast' | 'smart';

export type AITask =
  | 'resume_structure'
  | 'resume_analysis'
  | 'question_gen'
  | 'evaluation'
  | 'summary'
  | 'improvement_plan'
  // CodeSync — collaborative coding interview assistant
  | 'coding_question'
  | 'coding_hint'
  | 'coding_explain'
  | 'code_evaluation';

export interface AIUsage {
  tokensIn: number;
  tokensOut: number;
  model: string;
}

export interface GenerateJsonRequest {
  task: AITask;
  system: string;
  user: string;
  tier: ModelTier;
  temperature?: number;
  maxOutputTokens?: number;
  /**
   * Structured inputs that produced the prompt. The Gemini provider ignores
   * this; the mock provider uses it to produce deterministic, input-sensitive
   * output so the full application loop is testable without network calls.
   */
  context?: Record<string, unknown>;
}

export interface GenerateJsonResult<T> {
  data: T;
  usage: AIUsage;
}

/**
 * Provider abstraction: business services depend on this interface only.
 * Swapping Gemini for another vendor (or adding fallback routing) is a
 * provider-level change, invisible to the rest of the codebase.
 */
export interface AIService {
  generateJson<T>(req: GenerateJsonRequest, schema: ZodType<T>): Promise<GenerateJsonResult<T>>;
}

export class AIOutputError extends Error {
  constructor(
    message: string,
    public readonly rawOutput: string,
  ) {
    super(message);
  }
}
