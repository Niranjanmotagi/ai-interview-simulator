import type { ZodType } from 'zod';
import type {
  AIService,
  GenerateJsonRequest,
  GenerateJsonResult,
} from './types';

/**
 * Deterministic AIService implementation (AI_PROVIDER=mock).
 *
 * This is a real test double, not placeholder logic: it produces
 * schema-valid, input-sensitive output so the entire application loop
 * (upload → analyze → interview → evaluate → summarize → plan) runs
 * end-to-end in tests, CI, and offline demos without a Gemini key.
 * Evaluation scores are derived from measurable properties of the answer
 * (length, STAR signal words, concrete numbers), which makes test
 * assertions meaningful.
 */
export class MockAIProvider implements AIService {
  async generateJson<T>(
    req: GenerateJsonRequest,
    schema: ZodType<T>,
  ): Promise<GenerateJsonResult<T>> {
    const data = this.build(req);
    const parsed = schema.parse(data); // mock must satisfy the same contract
    return {
      data: parsed,
      usage: { tokensIn: estimateTokens(req.user), tokensOut: 350, model: 'mock' },
    };
  }

  private build(req: GenerateJsonRequest): unknown {
    switch (req.task) {
      case 'resume_structure':
        return this.resumeStructure(req);
      case 'resume_analysis':
        return this.resumeAnalysis(req);
      case 'question_gen':
        return this.questionGen(req);
      case 'evaluation':
        return this.evaluation(req);
      case 'summary':
        return this.summary(req);
      case 'improvement_plan':
        return this.improvementPlan(req);
      default:
        throw new Error(`MockAIProvider: unknown task ${String(req.task)}`);
    }
  }

  private resumeStructure(req: GenerateJsonRequest) {
    const text = String(req.context?.rawText ?? req.user);
    const knownSkills = [
      'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express',
      'MongoDB', 'SQL', 'Python', 'Java', 'AWS', 'Docker', 'Git', 'REST',
      'GraphQL', 'CSS', 'HTML', 'Tailwind', 'CI/CD', 'Kubernetes',
    ];
    const skills = knownSkills.filter((s) =>
      new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text),
    );
    return {
      skills: skills.length > 0 ? skills : ['Communication', 'Problem solving'],
      experience: [
        {
          title: 'Software Engineer',
          company: 'Extracted from resume',
          duration: '2022 – Present',
          bullets: ['Built and maintained production features end to end.'],
        },
      ],
      education: [
        { degree: 'B.Tech, Computer Science', institution: 'Extracted from resume', year: '2022' },
      ],
      projects: [{ name: 'Portfolio project', summary: 'Project extracted from resume text.' }],
    };
  }

  private resumeAnalysis(req: GenerateJsonRequest) {
    const text = String(req.context?.rawText ?? '');
    const hasMetrics = /\d+\s*%|\d+x|\$\d+|\b\d{2,}\b/.test(text);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const score = Math.max(
      35,
      Math.min(88, 40 + (hasMetrics ? 20 : 0) + Math.min(28, Math.floor(wordCount / 25))),
    );
    return {
      strengths: [
        'Clear technical skill set relevant to the target role',
        hasMetrics
          ? 'Uses quantified, results-oriented bullet points'
          : 'Concise, readable structure',
      ],
      weaknesses: [
        hasMetrics
          ? 'Some bullets describe tasks rather than outcomes'
          : 'Bullets lack quantified impact (numbers, percentages, scale)',
        'Summary section does not target a specific role',
      ],
      atsKeywordGaps: ['REST APIs', 'unit testing', 'agile', 'cloud deployment'],
      suggestedRewrites: [
        {
          original: 'Worked on the backend of the main product.',
          improved:
            'Designed and shipped 4 REST API services (Node.js/Express) serving 10k+ daily requests, cutting p95 latency 30%.',
        },
      ],
      overallScore: score,
    };
  }

  private questionGen(req: GenerateJsonRequest) {
    const count = Number(req.context?.questionCount ?? 5);
    const role = String(req.context?.targetRole ?? 'Software Engineer');
    const roundType = String(req.context?.roundType ?? 'mixed');
    const bank: Record<string, { type: string; text: string; rationale: string }[]> = {
      behavioral: [
        {
          type: 'behavioral',
          text: `Tell me about a time you had to deliver under a tight deadline as a ${role}. What did you do, and what was the result?`,
          rationale: 'Tests prioritization and outcome orientation (STAR structure expected).',
        },
        {
          type: 'behavioral',
          text: 'Describe a disagreement with a teammate about a technical decision. How did you resolve it?',
          rationale: 'Probes collaboration and conflict resolution.',
        },
        {
          type: 'behavioral',
          text: 'Tell me about a project you are most proud of from your resume. What was your specific contribution?',
          rationale: 'Anchored on the candidate resume to verify ownership.',
        },
        {
          type: 'behavioral',
          text: 'Describe a time you received critical feedback. How did you respond?',
          rationale: 'Tests coachability and self-awareness.',
        },
        {
          type: 'behavioral',
          text: 'Tell me about a time you failed to meet a goal. What did you learn?',
          rationale: 'Tests honesty and growth mindset.',
        },
      ],
      technical: [
        {
          type: 'technical',
          text: `Walk me through how you would design and structure a REST API for a feature you built recently. What trade-offs did you consider relevant to a ${role} role?`,
          rationale: 'Tests applied API design knowledge against real experience.',
        },
        {
          type: 'technical',
          text: 'How do you decide between SQL and a document database for a new service? Give a concrete example.',
          rationale: 'Tests data modeling judgment.',
        },
        {
          type: 'technical',
          text: 'Explain how you would debug a production endpoint whose p95 latency doubled overnight.',
          rationale: 'Tests systematic debugging under pressure.',
        },
        {
          type: 'technical',
          text: 'What does idempotency mean in API design, and when have you needed it?',
          rationale: 'Tests depth on a practical reliability concept.',
        },
        {
          type: 'technical',
          text: 'How would you secure a public API endpoint that handles user uploads?',
          rationale: 'Tests security awareness.',
        },
      ],
      system_design: [
        {
          type: 'system_design',
          text: 'Design a URL shortener that handles 100M redirects/day. Walk through storage, caching, and failure modes.',
          rationale: 'Classic scoped system design problem.',
        },
        {
          type: 'system_design',
          text: 'Design the backend for a real-time collaborative document editor.',
          rationale: 'Tests consistency model reasoning.',
        },
        {
          type: 'system_design',
          text: 'How would you scale a read-heavy product catalog from 1k to 1M users?',
          rationale: 'Tests incremental scaling judgment.',
        },
        {
          type: 'system_design',
          text: 'Design a rate limiter for a public API. Compare at least two algorithms.',
          rationale: 'Tests algorithmic trade-off analysis.',
        },
        {
          type: 'system_design',
          text: 'Design a notification system supporting email, push, and in-app channels.',
          rationale: 'Tests fan-out and queueing design.',
        },
      ],
      hr: [
        {
          type: 'hr',
          text: `Why do you want to work as a ${role}, and what are you looking for in your next team?`,
          rationale: 'Standard motivation and fit screen.',
        },
        {
          type: 'hr',
          text: 'Where do you see your career in three years?',
          rationale: 'Tests goal clarity.',
        },
        {
          type: 'hr',
          text: 'What would your previous manager say is your biggest area for growth?',
          rationale: 'Tests self-awareness.',
        },
        {
          type: 'hr',
          text: 'Why are you leaving (or why did you leave) your current position?',
          rationale: 'Standard screen for professionalism.',
        },
        {
          type: 'hr',
          text: 'What salary range are you targeting, and how did you arrive at it?',
          rationale: 'Tests preparation and negotiation readiness.',
        },
      ],
    };

    let pool: { type: string; text: string; rationale: string }[];
    if (roundType === 'mixed') {
      pool = [
        ...(bank.behavioral ?? []),
        ...(bank.technical ?? []),
        ...(bank.hr ?? []),
      ].filter((_, i) => i % 2 === 0 || i < 4);
    } else {
      pool = bank[roundType] ?? bank.behavioral ?? [];
    }
    return { questions: pool.slice(0, Math.max(1, Math.min(count, pool.length))) };
  }

  private evaluation(req: GenerateJsonRequest) {
    const answer = String(req.context?.answerText ?? '');
    const words = answer.split(/\s+/).filter(Boolean).length;
    const hasStar = /\b(situation|task|action|result|outcome|impact)\b/i.test(answer);
    const hasNumbers = /\d/.test(answer);

    const relevance = clamp10(3 + Math.min(5, words / 30) + (hasStar ? 1 : 0));
    const structure = clamp10(2 + (hasStar ? 4 : 0) + Math.min(3, words / 50));
    const depth = clamp10(2 + Math.min(4, words / 40) + (hasNumbers ? 2 : 0));
    const communication = clamp10(4 + Math.min(4, words / 45));
    const overall = clamp10((relevance + structure + depth + communication) / 4);

    const tags: string[] = [];
    if (words < 40) tags.push('too_short');
    if (!hasStar) tags.push('no_structure');
    if (!hasNumbers) tags.push('vague_metrics');

    const weak = overall < 5;
    return {
      rubric: { relevance, structure, depth, communication },
      overallScore: overall,
      strengths:
        words >= 40
          ? ['Directly engages with the question', 'Reasonable level of detail']
          : ['Attempts to address the question'],
      improvements: [
        ...(hasStar ? [] : ['Structure the answer using STAR: Situation, Task, Action, Result.']),
        ...(hasNumbers ? [] : ['Quantify the impact — numbers make results credible.']),
        ...(words < 40 ? ['Expand the answer; aim for 60–150 words with a concrete example.'] : []),
        'Close with the outcome and what you learned.',
      ].slice(0, 4),
      modelAnswer:
        'A strong answer follows STAR: briefly set the Situation and your Task, spend most of the time on the specific Actions you personally took, and close with a quantified Result (e.g., "reduced build time 40%") plus one lesson learned.',
      detectedWeaknessTags: tags,
      followUp: {
        needed: weak,
        question: weak
          ? 'Can you walk me through one specific example in more detail — what exactly did you do, and what measurable result did it produce?'
          : null,
      },
    };
  }

  private summary(req: GenerateJsonRequest) {
    const avg = Number(req.context?.aggregateScore ?? 6);
    const tags = (req.context?.weaknessTags as string[] | undefined) ?? [];
    // Schema requires ≥1 weakness: a strong session still gets a growth area.
    const weaknesses = tags.length > 0 ? tags : ['depth_could_improve'];
    return {
      narrative:
        `Overall performance averaged ${avg.toFixed(1)}/10 across the session. ` +
        'Answers were strongest where you grounded them in concrete experience, and weakest where structure and quantified outcomes were missing. ' +
        'Focus next on STAR-structured storytelling and leading with measurable results — both are fast, high-leverage fixes before your next interview.',
      topStrengths: ['Engages directly with questions', 'Relevant technical grounding'],
      topWeaknesses: weaknesses.slice(0, 5).map(humanizeTag),
    };
  }

  private improvementPlan(req: GenerateJsonRequest) {
    const provided = (req.context?.topWeaknesses as string[] | undefined) ?? [];
    const weaknesses = provided.length > 0 ? provided : ['Lack of answer structure'];
    const catalog: Record<string, { action: string; resources: { title: string; url: string }[] }> = {
      structure: {
        action:
          'Practice the STAR framework: write out 5 stories from your resume in Situation/Task/Action/Result format, then rehearse each aloud in under 2 minutes.',
        resources: [
          {
            title: 'STAR interview method guide',
            url: 'https://www.themuse.com/advice/star-interview-method',
          },
        ],
      },
      metrics: {
        action:
          'Add a number to every story: scale (users, requests), improvement (%, time saved), or scope (team size, budget). Rewrite your top 5 resume bullets with metrics.',
        resources: [
          {
            title: 'Quantifying resume accomplishments',
            url: 'https://hbr.org/2020/12/what-makes-a-great-resume',
          },
        ],
      },
      depth: {
        action:
          'For each project on your resume, prepare a "deep dive" answer: the hardest technical decision, the alternative you rejected, and why.',
        resources: [
          { title: 'Answering technical deep-dive questions', url: 'https://interviewing.io/guides' },
        ],
      },
    };

    const items = weaknesses.slice(0, 4).map((w, i) => {
      const key = /structur/i.test(w) ? 'structure' : /metric|vague|quantif/i.test(w) ? 'metrics' : 'depth';
      const entry = catalog[key] ?? catalog.structure!;
      return {
        weakness: w,
        action: entry.action,
        priority: (i === 0 ? 'high' : i === 1 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        resources: entry.resources,
      };
    });
    return { items };
  }
}

function clamp10(n: number): number {
  return Math.round(Math.max(0, Math.min(10, n)) * 10) / 10;
}

function humanizeTag(tag: string): string {
  const map: Record<string, string> = {
    no_structure: 'Lack of answer structure (STAR)',
    vague_metrics: 'Missing quantified results',
    too_short: 'Answers too brief',
    off_topic: 'Drifting off-topic',
    too_long: 'Rambling answers',
  };
  return map[tag] ?? tag.replace(/_/g, ' ');
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
