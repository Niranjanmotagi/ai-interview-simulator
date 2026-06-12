/**
 * Shared domain types for the AI Interview Simulator.
 * These DTOs describe API payloads — the wire format between apps/api and apps/web.
 */

// ---------------------------------------------------------------------------
// API envelope
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Users & auth
// ---------------------------------------------------------------------------

export type UserRole = 'user' | 'admin';
export type Plan = 'free' | 'pro' | 'pro_plus';
export type ExperienceLevel = 'student' | 'grad' | 'mid' | 'switcher';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: Plan;
  emailVerified: boolean;
  targetRoles: string[];
  experienceLevel: ExperienceLevel | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Resumes
// ---------------------------------------------------------------------------

export type ResumeStatus = 'uploaded' | 'parsed' | 'analyzed' | 'failed';

export interface ResumeExperience {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

export interface ResumeEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface ResumeProject {
  name: string;
  summary: string;
}

export interface ParsedProfile {
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
}

export interface SuggestedRewrite {
  original: string;
  improved: string;
}

export interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  atsKeywordGaps: string[];
  suggestedRewrites: SuggestedRewrite[];
  overallScore: number;
}

export interface ResumeDto {
  id: string;
  fileName: string;
  status: ResumeStatus;
  parsedProfile: ParsedProfile | null;
  analysis: ResumeAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeListItemDto {
  id: string;
  fileName: string;
  status: ResumeStatus;
  overallScore: number | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------

export type Difficulty = 'easy' | 'medium' | 'hard';
export type RoundType = 'behavioral' | 'technical' | 'system_design' | 'hr' | 'mixed';
export type SessionStatus = 'created' | 'in_progress' | 'completed' | 'abandoned';
export type QuestionType = 'behavioral' | 'technical' | 'system_design' | 'hr' | 'followup';

export interface InterviewConfig {
  targetRole: string;
  jobDescription: string | null;
  difficulty: Difficulty;
  roundType: RoundType;
  questionCount: number;
}

export interface CreateInterviewInput {
  resumeId?: string;
  targetRole: string;
  jobDescription?: string;
  difficulty: Difficulty;
  roundType: RoundType;
  questionCount?: number;
}

export interface QuestionDto {
  id: string;
  order: number;
  type: QuestionType;
  text: string;
  rationale: string;
  parentQuestionId: string | null;
  answered: boolean;
}

export interface InterviewSessionDto {
  id: string;
  config: InterviewConfig;
  status: SessionStatus;
  resumeId: string | null;
  questionCount: number;
  answeredCount: number;
  summaryId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface InterviewSessionDetailDto extends InterviewSessionDto {
  questions: QuestionDto[];
}

export interface NextQuestionDto {
  done: boolean;
  question: QuestionDto | null;
  progress: { answered: number; total: number };
}

export interface SubmitAnswerInput {
  questionId: string;
  text: string;
  inputMode?: 'text' | 'voice';
  durationSec?: number;
}

// ---------------------------------------------------------------------------
// Evaluation & feedback
// ---------------------------------------------------------------------------

export interface RubricScores {
  relevance: number;
  structure: number;
  depth: number;
  communication: number;
}

export interface EvaluationDto {
  id: string;
  answerId: string;
  rubric: RubricScores;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  detectedWeaknessTags: string[];
  createdAt: string;
}

export interface SubmitAnswerResult {
  answerId: string;
  evaluation: EvaluationDto;
  followUp: QuestionDto | null;
  next: NextQuestionDto;
}

export interface SessionSummaryDto {
  id: string;
  sessionId: string;
  aggregateScore: number;
  rubricAverages: RubricScores;
  topWeaknesses: string[];
  topStrengths: string[];
  narrative: string;
  createdAt: string;
}

export interface ImprovementPlanItemDto {
  id: string;
  weakness: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  resources: { title: string; url: string }[];
  done: boolean;
}

export interface ImprovementPlanDto {
  id: string;
  sourceSummaryId: string;
  items: ImprovementPlanItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummaryResponse {
  summary: SessionSummaryDto;
  plan: ImprovementPlanDto | null;
  evaluations: {
    question: QuestionDto;
    answerText: string;
    evaluation: EvaluationDto;
  }[];
}

// ---------------------------------------------------------------------------
// Dashboard & analytics
// ---------------------------------------------------------------------------

export interface QuotaDto {
  plan: Plan;
  used: number;
  limit: number | null; // null = unlimited
  remaining: number | null;
  periodEnd: string;
}

export interface DashboardOverviewDto {
  totalSessions: number;
  completedSessions: number;
  averageScore: number | null;
  streakDays: number;
  quota: QuotaDto;
  recentSessions: InterviewSessionDto[];
  latestResume: ResumeListItemDto | null;
  activePlan: ImprovementPlanDto | null;
}

export interface TrendPointDto {
  date: string; // YYYY-MM-DD
  score: number;
  sessions: number;
}

export interface WeaknessAggDto {
  tag: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export interface UsageSummaryDto {
  quota: QuotaDto;
  events: {
    type: string;
    count: number;
    tokensIn: number;
    tokensOut: number;
  }[];
}

export interface UpdateProfileInput {
  name?: string;
  targetRoles?: string[];
  experienceLevel?: ExperienceLevel;
}
