import { describe, expect, it } from 'vitest';
import { MockAIProvider } from '../src/ai/mock.provider';
import {
  evaluationOutputSchema,
  generatedQuestionsSchema,
  improvementPlanSchema,
  parsedProfileSchema,
  resumeAnalysisSchema,
  summaryOutputSchema,
} from '../src/ai/schemas';
import {
  buildEvaluationPrompt,
  buildImprovementPlanPrompt,
  buildQuestionGenPrompt,
  buildResumeAnalysisPrompt,
  buildResumeStructurePrompt,
  buildSummaryPrompt,
} from '../src/ai/prompts';

/**
 * Contract tests: every prompt builder's output must satisfy its schema when
 * run through a provider. This pins the schema/prompt pairing so a schema
 * change that breaks a task fails here, not in production.
 */
describe('AI contract: prompts ↔ schemas', () => {
  const provider = new MockAIProvider();
  const resumeText = 'Skills: TypeScript, React, Node.js. Built APIs serving 10k users, cut latency 30%.';

  it('resume_structure satisfies parsedProfileSchema', async () => {
    const { data } = await provider.generateJson(
      buildResumeStructurePrompt(resumeText),
      parsedProfileSchema,
    );
    expect(data.skills.length).toBeGreaterThan(0);
  });

  it('resume_analysis satisfies resumeAnalysisSchema', async () => {
    const profile = { skills: ['TypeScript'], experience: [], education: [], projects: [] };
    const { data } = await provider.generateJson(
      buildResumeAnalysisPrompt(resumeText, profile, ['Backend Engineer']),
      resumeAnalysisSchema,
    );
    expect(data.overallScore).toBeGreaterThanOrEqual(0);
    expect(data.overallScore).toBeLessThanOrEqual(100);
  });

  it('question_gen satisfies generatedQuestionsSchema for every round type', async () => {
    for (const roundType of ['behavioral', 'technical', 'system_design', 'hr', 'mixed'] as const) {
      const { data } = await provider.generateJson(
        buildQuestionGenPrompt({
          targetRole: 'Frontend Engineer',
          jobDescription: null,
          difficulty: 'medium',
          roundType,
          questionCount: 5,
          profile: null,
          historicalWeaknessTags: [],
        }),
        generatedQuestionsSchema,
      );
      expect(data.questions.length).toBeGreaterThan(0);
      if (roundType !== 'mixed') {
        expect(data.questions.every((q) => q.type === roundType)).toBe(true);
      }
    }
  });

  it('evaluation satisfies evaluationOutputSchema and scores scale with quality', async () => {
    const base = {
      questionText: 'Tell me about a challenge.',
      questionType: 'behavioral',
      targetRole: 'Engineer',
      difficulty: 'medium',
      isFollowUp: false,
      followUpsSoFar: 0,
    };
    const weak = await provider.generateJson(
      buildEvaluationPrompt({ ...base, answerText: 'I did stuff.' }),
      evaluationOutputSchema,
    );
    const strong = await provider.generateJson(
      buildEvaluationPrompt({
        ...base,
        answerText:
          'The situation was a failing deployment pipeline. My task was to stabilize releases. ' +
          'My action was rewriting the CI config, adding canary deploys and automated rollback. ' +
          'The result: deploy failures dropped 90% and release time fell from 2 hours to 15 minutes.',
      }),
      evaluationOutputSchema,
    );
    expect(strong.data.overallScore).toBeGreaterThan(weak.data.overallScore);
    expect(weak.data.followUp.needed).toBe(true);
    expect(strong.data.followUp.needed).toBe(false);
  });

  it('summary and improvement_plan satisfy their schemas', async () => {
    const summary = await provider.generateJson(
      buildSummaryPrompt({
        targetRole: 'Engineer',
        aggregateScore: 6.2,
        rubricAverages: { relevance: 6, structure: 5, depth: 6, communication: 7 },
        weaknessTags: ['no_structure', 'vague_metrics'],
        perQuestion: [{ question: 'Q1', score: 6, tags: ['no_structure'] }],
      }),
      summaryOutputSchema,
    );
    expect(summary.data.narrative.length).toBeGreaterThan(50);

    const plan = await provider.generateJson(
      buildImprovementPlanPrompt({
        targetRole: 'Engineer',
        topWeaknesses: summary.data.topWeaknesses,
        narrative: summary.data.narrative,
      }),
      improvementPlanSchema,
    );
    expect(plan.data.items.length).toBeGreaterThan(0);
  });
});
