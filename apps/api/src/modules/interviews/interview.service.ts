import { Types } from 'mongoose';
import type {
  CreateInterviewInput,
  NextQuestionDto,
  RubricScores,
  SessionSummaryResponse,
  SubmitAnswerResult,
} from '@ai-interview/types';
import {
  Answer,
  Evaluation,
  ImprovementPlan,
  InterviewSession,
  Question,
  Resume,
  SessionSummary,
  User,
  type InterviewSessionDoc,
  type QuestionDoc,
} from '../../models';
import { ApiError } from '../../utils/ApiError';
import { getAIService } from '../../ai';
import {
  buildEvaluationPrompt,
  buildImprovementPlanPrompt,
  buildQuestionGenPrompt,
  buildSummaryPrompt,
} from '../../ai/prompts';
import {
  evaluationOutputSchema,
  generatedQuestionsSchema,
  improvementPlanSchema,
  summaryOutputSchema,
} from '../../ai/schemas';
import { assertInterviewQuota, recordUsage } from '../../services/usage.service';
import {
  orderQuestions,
  toEvaluationDto,
  toPlanDto,
  toQuestionDto,
  toSummaryDto,
} from './interview.mapper';

const MAX_FOLLOWUPS_PER_SESSION = 2;
const DEFAULT_QUESTION_COUNT = 5;

// ---------------------------------------------------------------------------
// Session creation (question generation engine)
// ---------------------------------------------------------------------------

export async function createSession(
  userId: string,
  input: CreateInterviewInput,
): Promise<InterviewSessionDoc> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists', 'USER_GONE');
  }

  // Quota is checked against the DB plan, not the (possibly stale) JWT claim.
  await assertInterviewQuota(userId, user.plan);

  // Personalization context: explicit resume, or the latest analyzed one.
  let resume = null;
  if (input.resumeId) {
    resume = await Resume.findOne({ _id: input.resumeId, userId });
    if (!resume) {
      throw ApiError.notFound('Resume');
    }
  } else {
    resume = await Resume.findOne({ userId, status: 'analyzed' }).sort({ createdAt: -1 });
  }

  const historicalWeaknessTags = await getHistoricalWeaknessTags(userId);
  const questionCount = input.questionCount ?? DEFAULT_QUESTION_COUNT;

  const ai = getAIService();
  const generated = await ai.generateJson(
    buildQuestionGenPrompt({
      targetRole: input.targetRole,
      jobDescription: input.jobDescription ?? null,
      difficulty: input.difficulty,
      roundType: input.roundType,
      questionCount,
      profile: resume?.parsedProfile ?? null,
      historicalWeaknessTags,
    }),
    generatedQuestionsSchema,
  );
  await recordUsage(userId, 'question_gen', generated.usage);

  // Dedupe near-identical questions; tolerate the model returning fewer.
  const unique = dedupeQuestions(generated.data.questions).slice(0, questionCount);
  if (unique.length === 0) {
    throw ApiError.serviceUnavailable('Question generation returned no usable questions');
  }

  const session = await InterviewSession.create({
    userId,
    resumeId: resume?._id ?? null,
    config: {
      targetRole: input.targetRole,
      jobDescription: input.jobDescription ?? null,
      difficulty: input.difficulty,
      roundType: input.roundType,
      questionCount: unique.length,
    },
    status: 'created',
    questions: [],
  });

  const questionDocs = await Question.insertMany(
    unique.map((q, i) => ({
      sessionId: session._id,
      order: i + 1,
      type: q.type,
      text: q.text,
      rationale: q.rationale,
      parentQuestionId: null,
    })),
  );

  session.questions = questionDocs.map((q) => q._id);
  await session.save();

  await recordUsage(userId, 'interview_created');
  return session;
}

async function getHistoricalWeaknessTags(userId: string): Promise<string[]> {
  const rows = await SessionSummary.aggregate<{ _id: string; count: number }>([
    { $match: { userId: new Types.ObjectId(userId) } },
    { $sort: { createdAt: -1 } },
    { $limit: 10 },
    { $unwind: '$topWeaknesses' },
    { $group: { _id: '$topWeaknesses', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  return rows.map((r) => r._id);
}

function dedupeQuestions<T extends { text: string }>(questions: T[]): T[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    const key = q.text.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 80);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Session retrieval & lifecycle
// ---------------------------------------------------------------------------

export async function getOwnedSession(
  userId: string,
  sessionId: string,
): Promise<InterviewSessionDoc> {
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    throw ApiError.notFound('Interview session');
  }
  return session;
}

export async function listSessions(
  userId: string,
  page: number,
  limit: number,
): Promise<{ sessions: InterviewSessionDoc[]; answeredCounts: Map<string, number>; total: number }> {
  const [sessions, total] = await Promise.all([
    InterviewSession.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    InterviewSession.countDocuments({ userId }),
  ]);
  const answeredCounts = await answeredCountBySession(sessions.map((s) => s._id));
  return { sessions, answeredCounts, total };
}

export async function answeredCountBySession(
  sessionIds: Types.ObjectId[],
): Promise<Map<string, number>> {
  if (sessionIds.length === 0) {
    return new Map();
  }
  const rows = await Answer.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { sessionId: { $in: sessionIds } } },
    { $group: { _id: '$sessionId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
}

export async function startSession(userId: string, sessionId: string): Promise<InterviewSessionDoc> {
  const session = await getOwnedSession(userId, sessionId);
  if (session.status === 'completed' || session.status === 'abandoned') {
    throw ApiError.conflict('This session is already finished', 'SESSION_FINISHED');
  }
  if (session.status === 'created') {
    session.status = 'in_progress';
    session.startedAt = new Date();
    await session.save();
  }
  return session;
}

export async function getNextQuestion(
  userId: string,
  sessionId: string,
): Promise<NextQuestionDto> {
  const session = await getOwnedSession(userId, sessionId);
  const questions = await Question.find({ sessionId: session._id });
  const answered = await answeredQuestionIds(session._id);
  const ordered = orderQuestions(session, questions);

  const next = ordered.find((q) => !answered.has(q._id.toString())) ?? null;
  return {
    done: next === null,
    question: next ? toQuestionDto(next, false) : null,
    progress: { answered: answered.size, total: ordered.length },
  };
}

async function answeredQuestionIds(sessionId: Types.ObjectId): Promise<Set<string>> {
  const answers = await Answer.find({ sessionId }).select('questionId').lean();
  return new Set(answers.map((a) => a.questionId.toString()));
}

// ---------------------------------------------------------------------------
// Answer submission (evaluation engine + adaptive follow-ups)
// ---------------------------------------------------------------------------

export async function submitAnswer(
  userId: string,
  sessionId: string,
  input: { questionId: string; text: string; inputMode?: 'text' | 'voice'; durationSec?: number },
): Promise<SubmitAnswerResult> {
  const session = await getOwnedSession(userId, sessionId);
  if (session.status === 'completed' || session.status === 'abandoned') {
    throw ApiError.conflict('This session is already finished', 'SESSION_FINISHED');
  }

  const question = await Question.findOne({ _id: input.questionId, sessionId: session._id });
  if (!question) {
    throw ApiError.notFound('Question');
  }

  const existing = await Answer.findOne({ questionId: question._id }).lean();
  if (existing) {
    throw ApiError.conflict('This question has already been answered', 'ALREADY_ANSWERED');
  }

  if (session.status === 'created') {
    session.status = 'in_progress';
    session.startedAt = new Date();
    await session.save();
  }

  const answer = await Answer.create({
    questionId: question._id,
    sessionId: session._id,
    userId,
    text: input.text,
    inputMode: input.inputMode ?? 'text',
    durationSec: input.durationSec ?? null,
  });

  const followUpsSoFar = await Question.countDocuments({
    sessionId: session._id,
    type: 'followup',
  });

  const ai = getAIService();
  const evaluated = await ai.generateJson(
    buildEvaluationPrompt({
      questionText: question.text,
      questionType: question.type,
      answerText: input.text,
      targetRole: session.config.targetRole,
      difficulty: session.config.difficulty,
      isFollowUp: question.type === 'followup',
      followUpsSoFar,
    }),
    evaluationOutputSchema,
  );
  await recordUsage(userId, 'evaluation', evaluated.usage);

  const evaluation = await Evaluation.create({
    answerId: answer._id,
    sessionId: session._id,
    rubric: evaluated.data.rubric,
    overallScore: evaluated.data.overallScore,
    strengths: evaluated.data.strengths,
    improvements: evaluated.data.improvements,
    modelAnswer: evaluated.data.modelAnswer,
    detectedWeaknessTags: evaluated.data.detectedWeaknessTags,
  });

  // Adaptive follow-up: inserted directly after the current question, capped
  // per session so a struggling candidate is not trapped in an endless probe.
  let followUpDoc: QuestionDoc | null = null;
  const followUpText = evaluated.data.followUp.question;
  if (
    evaluated.data.followUp.needed &&
    followUpText &&
    question.type !== 'followup' &&
    followUpsSoFar < MAX_FOLLOWUPS_PER_SESSION
  ) {
    followUpDoc = await insertFollowUp(session, question, followUpText);
    await recordUsage(userId, 'followup_gen');
  }

  const next = await getNextQuestion(userId, sessionId);

  return {
    answerId: answer._id.toString(),
    evaluation: toEvaluationDto(evaluation),
    followUp: followUpDoc ? toQuestionDto(followUpDoc, false) : null,
    next,
  };
}

async function insertFollowUp(
  session: InterviewSessionDoc,
  parent: QuestionDoc,
  text: string,
): Promise<QuestionDoc> {
  await Question.updateMany(
    { sessionId: session._id, order: { $gt: parent.order } },
    { $inc: { order: 1 } },
  );

  const followUp = await Question.create({
    sessionId: session._id,
    order: parent.order + 1,
    type: 'followup',
    text,
    rationale: 'Adaptive follow-up generated from the previous answer.',
    parentQuestionId: parent._id,
  });

  const idx = session.questions.findIndex((id) => id.equals(parent._id));
  session.questions.splice(idx + 1, 0, followUp._id);
  await session.save();

  return followUp;
}

// ---------------------------------------------------------------------------
// Completion (summary + improvement plan)
// ---------------------------------------------------------------------------

export async function completeSession(
  userId: string,
  sessionId: string,
): Promise<SessionSummaryResponse> {
  const session = await getOwnedSession(userId, sessionId);
  if (session.status === 'completed') {
    return getSummary(userId, sessionId); // idempotent
  }
  if (session.status === 'abandoned') {
    throw ApiError.conflict('This session was abandoned', 'SESSION_FINISHED');
  }

  const evaluations = await Evaluation.find({ sessionId: session._id });
  if (evaluations.length === 0) {
    throw ApiError.badRequest('Answer at least one question before completing the session');
  }

  // Aggregates are computed in code — deterministic math is not delegated to the model.
  const rubricAverages: RubricScores = average(evaluations.map((e) => e.rubric));
  const aggregateScore = round1(
    evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length,
  );
  const tagFrequency = new Map<string, number>();
  for (const e of evaluations) {
    for (const tag of e.detectedWeaknessTags) {
      tagFrequency.set(tag, (tagFrequency.get(tag) ?? 0) + 1);
    }
  }
  const weaknessTags = [...tagFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  const questions = await Question.find({ sessionId: session._id });
  const questionById = new Map(questions.map((q) => [q._id.toString(), q]));
  const answers = await Answer.find({ sessionId: session._id });
  const answerById = new Map(answers.map((a) => [a._id.toString(), a]));

  const perQuestion = evaluations.map((e) => {
    const ans = answerById.get(e.answerId.toString());
    const q = ans ? questionById.get(ans.questionId.toString()) : undefined;
    return {
      question: q?.text ?? 'unknown',
      score: e.overallScore,
      tags: e.detectedWeaknessTags,
    };
  });

  const ai = getAIService();
  const summarized = await ai.generateJson(
    buildSummaryPrompt({
      targetRole: session.config.targetRole,
      aggregateScore,
      rubricAverages,
      weaknessTags,
      perQuestion,
    }),
    summaryOutputSchema,
  );
  await recordUsage(userId, 'summary', summarized.usage);

  const summary = await SessionSummary.create({
    sessionId: session._id,
    userId,
    aggregateScore,
    rubricAverages,
    topWeaknesses: summarized.data.topWeaknesses,
    topStrengths: summarized.data.topStrengths,
    narrative: summarized.data.narrative,
  });

  const planned = await ai.generateJson(
    buildImprovementPlanPrompt({
      targetRole: session.config.targetRole,
      topWeaknesses: summarized.data.topWeaknesses,
      narrative: summarized.data.narrative,
    }),
    improvementPlanSchema,
  );
  await recordUsage(userId, 'improvement_plan', planned.usage);

  const plan = await ImprovementPlan.create({
    userId,
    sourceSummaryId: summary._id,
    items: planned.data.items.map((item) => ({ ...item, done: false })),
  });

  session.status = 'completed';
  session.completedAt = new Date();
  session.summaryId = summary._id;
  await session.save();

  return buildSummaryResponse(session, summary._id.toString(), plan._id.toString());
}

export async function getSummary(
  userId: string,
  sessionId: string,
): Promise<SessionSummaryResponse> {
  const session = await getOwnedSession(userId, sessionId);
  if (!session.summaryId) {
    throw ApiError.notFound('Session summary');
  }
  return buildSummaryResponse(session, session.summaryId.toString(), null);
}

async function buildSummaryResponse(
  session: InterviewSessionDoc,
  summaryId: string,
  planId: string | null,
): Promise<SessionSummaryResponse> {
  const summary = await SessionSummary.findById(summaryId);
  if (!summary) {
    throw ApiError.notFound('Session summary');
  }
  const plan = planId
    ? await ImprovementPlan.findById(planId)
    : await ImprovementPlan.findOne({ sourceSummaryId: summary._id });

  const [questions, answers, evaluations] = await Promise.all([
    Question.find({ sessionId: session._id }),
    Answer.find({ sessionId: session._id }),
    Evaluation.find({ sessionId: session._id }),
  ]);
  const questionById = new Map(questions.map((q) => [q._id.toString(), q]));
  const answerById = new Map(answers.map((a) => [a._id.toString(), a]));

  const detail = evaluations
    .map((e) => {
      const ans = answerById.get(e.answerId.toString());
      const q = ans ? questionById.get(ans.questionId.toString()) : undefined;
      if (!ans || !q) {
        return null;
      }
      return {
        question: toQuestionDto(q, true),
        answerText: ans.text,
        evaluation: toEvaluationDto(e),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.question.order - b.question.order);

  return {
    summary: toSummaryDto(summary),
    plan: plan ? toPlanDto(plan) : null,
    evaluations: detail,
  };
}

// ---------------------------------------------------------------------------
// Deletion (cascade)
// ---------------------------------------------------------------------------

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  const session = await getOwnedSession(userId, sessionId);
  await Promise.all([
    Question.deleteMany({ sessionId: session._id }),
    Answer.deleteMany({ sessionId: session._id }),
    Evaluation.deleteMany({ sessionId: session._id }),
    SessionSummary.deleteMany({ sessionId: session._id }),
    session.summaryId
      ? ImprovementPlan.deleteMany({ sourceSummaryId: session.summaryId })
      : Promise.resolve(null),
  ]);
  await session.deleteOne();
}

// ---------------------------------------------------------------------------

function average(rubrics: RubricScores[]): RubricScores {
  const n = rubrics.length || 1;
  return {
    relevance: round1(rubrics.reduce((s, r) => s + r.relevance, 0) / n),
    structure: round1(rubrics.reduce((s, r) => s + r.structure, 0) / n),
    depth: round1(rubrics.reduce((s, r) => s + r.depth, 0) / n),
    communication: round1(rubrics.reduce((s, r) => s + r.communication, 0) / n),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
