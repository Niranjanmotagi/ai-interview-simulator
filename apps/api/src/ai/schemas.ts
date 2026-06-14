import { z } from 'zod';

/**
 * Every AI call must return JSON matching one of these schemas.
 * Malformed output is repaired once (re-ask with the validation error)
 * and otherwise rejected — unvalidated model output never reaches the DB.
 */

const score10 = z.number().min(0).max(10);

export const parsedProfileSchema = z.object({
  skills: z.array(z.string()).max(60),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      duration: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      year: z.string(),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      summary: z.string(),
    }),
  ),
});
export type ParsedProfileOutput = z.infer<typeof parsedProfileSchema>;

export const resumeAnalysisSchema = z.object({
  strengths: z.array(z.string()).min(1).max(10),
  weaknesses: z.array(z.string()).min(1).max(10),
  atsKeywordGaps: z.array(z.string()).max(20),
  suggestedRewrites: z
    .array(z.object({ original: z.string(), improved: z.string() }))
    .max(10),
  overallScore: z.number().min(0).max(100),
});
export type ResumeAnalysisOutput = z.infer<typeof resumeAnalysisSchema>;

export const generatedQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        type: z.enum(['behavioral', 'technical', 'system_design', 'hr']),
        text: z.string().min(10),
        rationale: z.string(),
      }),
    )
    .min(1)
    .max(10),
});
export type GeneratedQuestionsOutput = z.infer<typeof generatedQuestionsSchema>;

export const evaluationOutputSchema = z.object({
  rubric: z.object({
    relevance: score10,
    structure: score10,
    depth: score10,
    communication: score10,
  }),
  overallScore: score10,
  strengths: z.array(z.string()).max(8),
  improvements: z.array(z.string()).min(1).max(8),
  modelAnswer: z.string().min(20),
  detectedWeaknessTags: z.array(z.string()).max(8),
  followUp: z.object({
    needed: z.boolean(),
    question: z.string().nullable(),
  }),
});
export type EvaluationOutput = z.infer<typeof evaluationOutputSchema>;

export const summaryOutputSchema = z.object({
  narrative: z.string().min(50),
  topStrengths: z.array(z.string()).min(1).max(5),
  topWeaknesses: z.array(z.string()).min(1).max(5),
});
export type SummaryOutput = z.infer<typeof summaryOutputSchema>;

export const improvementPlanSchema = z.object({
  items: z
    .array(
      z.object({
        weakness: z.string(),
        action: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
        resources: z.array(z.object({ title: z.string(), url: z.string() })).max(4),
      }),
    )
    .min(1)
    .max(8),
});
export type ImprovementPlanOutput = z.infer<typeof improvementPlanSchema>;

// ---------------------------------------------------------------------------
// CodeSync — coding interview assistant
// ---------------------------------------------------------------------------

const score100 = z.number().min(0).max(100);

export const codingQuestionSchema = z.object({
  title: z.string().min(3),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  prompt: z.string().min(20),
  examples: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().nullable(),
      }),
    )
    .min(1)
    .max(4),
  constraints: z.array(z.string()).max(8),
});
export type CodingQuestionOutput = z.infer<typeof codingQuestionSchema>;

export const codingHintSchema = z.object({ hint: z.string().min(5) });
export type CodingHintOutput = z.infer<typeof codingHintSchema>;

export const codingExplanationSchema = z.object({
  explanation: z.string().min(20),
  complexity: z.object({ time: z.string(), space: z.string() }),
});
export type CodingExplanationOutput = z.infer<typeof codingExplanationSchema>;

export const codeEvaluationSchema = z.object({
  overallScore: score100,
  correctness: score100,
  problemSolving: score100,
  codeQuality: score100,
  communication: score100,
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  strengths: z.array(z.string()).min(1).max(8),
  weaknesses: z.array(z.string()).max(8),
  suggestions: z.array(z.string()).max(8),
  verdict: z.string().min(10),
});
export type CodeEvaluationOutput = z.infer<typeof codeEvaluationSchema>;
