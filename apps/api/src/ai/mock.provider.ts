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
      case 'coding_question':
        return this.codingQuestion(req);
      case 'coding_hint':
        return this.codingHint(req);
      case 'coding_explain':
        return this.codingExplain(req);
      case 'code_evaluation':
        return this.codeEvaluation(req);
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

  // --- CodeSync coding assistant (deterministic, input-sensitive) ----------

  private codingQuestion(req: GenerateJsonRequest) {
    const difficulty = String(req.context?.difficulty ?? 'easy') as 'easy' | 'medium' | 'hard';
    const bank = {
      easy: {
        title: 'Two Sum',
        prompt:
          'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. Each input has exactly one solution and you may not use the same element twice.',
        examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9.' }],
        constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
      },
      medium: {
        title: 'Group Anagrams',
        prompt:
          'Given an array of strings, group the anagrams together. An anagram is a word formed by rearranging the letters of another. Return the groups in any order.',
        examples: [{ input: '["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]', explanation: null }],
        constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100'],
      },
      hard: {
        title: 'LRU Cache',
        prompt:
          'Design a data structure for a Least Recently Used (LRU) cache supporting get(key) and put(key, value) in O(1) average time. When capacity is exceeded, evict the least recently used item.',
        examples: [{ input: 'capacity = 2; put(1,1); put(2,2); get(1); put(3,3); get(2)', output: '1, then -1', explanation: 'Key 2 was evicted as least recently used.' }],
        constraints: ['1 <= capacity <= 3000', 'At most 10^5 calls to get and put'],
      },
    };
    const q = bank[difficulty] ?? bank.easy;
    return { ...q, difficulty };
  }

  private codingHint(req: GenerateJsonRequest) {
    const code = String(req.context?.code ?? '');
    const nested = hasNestedLoop(code);
    const hint = nested
      ? 'Your current approach looks like it scans the data more than once. Consider a hash map to remember values you have already seen — that often turns an O(n²) scan into a single O(n) pass.'
      : code.trim().length === 0
        ? 'Start by clarifying the brute-force solution, then ask what repeated work you could cache to speed it up.'
        : 'Think about the edge cases (empty input, duplicates, negative numbers) and whether a single pass with extra space could simplify the logic.';
    return { hint };
  }

  private codingExplain(req: GenerateJsonRequest) {
    const code = String(req.context?.code ?? '');
    const nested = hasNestedLoop(code);
    return {
      explanation:
        code.trim().length === 0
          ? 'The editor is currently empty, so there is nothing to explain yet. Write a solution and ask again.'
          : 'This code reads the input, iterates over the elements, and computes a result that it returns at the end. ' +
            (nested
              ? 'It uses nested iteration, comparing pairs of elements, which is the main cost.'
              : 'It performs a single pass and uses auxiliary storage to avoid repeated work.'),
      complexity: { time: nested ? 'O(n^2)' : 'O(n)', space: usesMap(code) ? 'O(n)' : 'O(1)' },
    };
  }

  private codeEvaluation(req: GenerateJsonRequest) {
    const code = String(req.context?.code ?? '');
    const lines = code.split('\n').filter((l) => l.trim().length > 0).length;
    const nested = hasNestedLoop(code);
    const map = usesMap(code);
    const hasReturn = /\breturn\b|println|printf|console\.log|fmt\.Print|cout/i.test(code);
    const hasComments = /\/\/|#|\/\*/.test(code);

    const correctness = clampPct(50 + (hasReturn ? 25 : 0) + (lines >= 4 ? 15 : 0) + (map ? 5 : 0));
    const problemSolving = clampPct(map ? 82 : nested ? 52 : 66);
    const codeQuality = clampPct(48 + (hasComments ? 16 : 0) + (lines > 0 && lines <= 60 ? 18 : 0) + (map ? 6 : 0));
    const communication = clampPct(hasComments ? 72 : 54);
    const overall = clampPct((correctness + problemSolving + codeQuality + communication) / 4);

    const strengths: string[] = [];
    if (hasReturn) strengths.push('Produces and returns/prints a result.');
    if (map) strengths.push('Uses a hash map to keep the core loop linear.');
    if (hasComments) strengths.push('Includes comments that aid readability.');
    if (strengths.length === 0) strengths.push('Provides a starting structure to build on.');

    const weaknesses: string[] = [];
    if (nested) weaknesses.push('Nested iteration suggests an O(n²) approach that may not scale.');
    if (!hasComments) weaknesses.push('No comments — intent is harder to follow.');
    if (lines < 4) weaknesses.push('Solution looks incomplete or very short.');

    const suggestions: string[] = [];
    if (nested) suggestions.push('Trade space for time with a set/map to remove the inner loop.');
    if (!hasComments) suggestions.push('Add a brief comment explaining the algorithm and key invariant.');
    suggestions.push('Add handling for edge cases: empty input, duplicates, and boundary values.');

    return {
      overallScore: overall,
      correctness,
      problemSolving,
      codeQuality,
      communication,
      timeComplexity: nested ? 'O(n^2)' : 'O(n)',
      spaceComplexity: map ? 'O(n)' : 'O(1)',
      strengths,
      weaknesses,
      suggestions: suggestions.slice(0, 5),
      verdict:
        overall >= 75
          ? 'Strong submission — correct approach with good complexity; minor polish needed.'
          : overall >= 55
            ? 'Reasonable attempt that meets the bar but has clear room to improve.'
            : 'Below bar — the approach needs rework on correctness and efficiency.',
    };
  }
}

function hasNestedLoop(code: string): boolean {
  const loops = (code.match(/\b(for|while)\b/g) ?? []).length;
  return loops >= 2;
}

function usesMap(code: string): boolean {
  return /\b(map|dict|set|hashmap|unordered_map|defaultdict|counter)\b|\{\s*\}|new Map\(|new Set\(/i.test(code);
}

function clampPct(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)));
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
