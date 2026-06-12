import type {
  EvaluationDto,
  ImprovementPlanDto,
  InterviewSessionDetailDto,
  InterviewSessionDto,
  QuestionDto,
  SessionSummaryDto,
} from '@ai-interview/types';
import type {
  EvaluationDoc,
  ImprovementPlanDoc,
  InterviewSessionDoc,
  QuestionDoc,
  SessionSummaryDoc,
} from '../../models';

export function toQuestionDto(doc: QuestionDoc, answered: boolean): QuestionDto {
  return {
    id: doc._id.toString(),
    order: doc.order,
    type: doc.type,
    text: doc.text,
    rationale: doc.rationale,
    parentQuestionId: doc.parentQuestionId?.toString() ?? null,
    answered,
  };
}

export function toSessionDto(
  doc: InterviewSessionDoc,
  answeredCount: number,
): InterviewSessionDto {
  return {
    id: doc._id.toString(),
    config: {
      targetRole: doc.config.targetRole,
      jobDescription: doc.config.jobDescription,
      difficulty: doc.config.difficulty,
      roundType: doc.config.roundType,
      questionCount: doc.config.questionCount,
    },
    status: doc.status,
    resumeId: doc.resumeId?.toString() ?? null,
    questionCount: doc.questions.length,
    answeredCount,
    summaryId: doc.summaryId?.toString() ?? null,
    startedAt: doc.startedAt?.toISOString() ?? null,
    completedAt: doc.completedAt?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toSessionDetailDto(
  doc: InterviewSessionDoc,
  questions: QuestionDoc[],
  answeredIds: Set<string>,
): InterviewSessionDetailDto {
  const ordered = orderQuestions(doc, questions);
  return {
    ...toSessionDto(doc, countAnswered(questions, answeredIds)),
    questions: ordered.map((q) => toQuestionDto(q, answeredIds.has(q._id.toString()))),
  };
}

/** session.questions array is the ordering source of truth. */
export function orderQuestions(
  session: InterviewSessionDoc,
  questions: QuestionDoc[],
): QuestionDoc[] {
  const byId = new Map(questions.map((q) => [q._id.toString(), q]));
  return session.questions
    .map((id) => byId.get(id.toString()))
    .filter((q): q is QuestionDoc => Boolean(q));
}

function countAnswered(questions: QuestionDoc[], answeredIds: Set<string>): number {
  return questions.filter((q) => answeredIds.has(q._id.toString())).length;
}

export function toEvaluationDto(doc: EvaluationDoc): EvaluationDto {
  return {
    id: doc._id.toString(),
    answerId: doc.answerId.toString(),
    rubric: doc.rubric,
    overallScore: doc.overallScore,
    strengths: doc.strengths,
    improvements: doc.improvements,
    modelAnswer: doc.modelAnswer,
    detectedWeaknessTags: doc.detectedWeaknessTags,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toSummaryDto(doc: SessionSummaryDoc): SessionSummaryDto {
  return {
    id: doc._id.toString(),
    sessionId: doc.sessionId.toString(),
    aggregateScore: doc.aggregateScore,
    rubricAverages: doc.rubricAverages,
    topWeaknesses: doc.topWeaknesses,
    topStrengths: doc.topStrengths,
    narrative: doc.narrative,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toPlanDto(doc: ImprovementPlanDoc): ImprovementPlanDto {
  return {
    id: doc._id.toString(),
    sourceSummaryId: doc.sourceSummaryId.toString(),
    items: doc.items.map((item) => ({
      id: item._id.toString(),
      weakness: item.weakness,
      action: item.action,
      priority: item.priority,
      resources: item.resources.map((r) => ({ title: r.title, url: r.url })),
      done: item.done,
    })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
