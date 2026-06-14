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

// ===========================================================================
// CodeSync — collaborative coding interview rooms
// ---------------------------------------------------------------------------
// A "room" is a live coding-interview session. Roles are scoped to the room
// (a global `user` can be the interviewer in one room and a candidate in
// another), which is why room RBAC lives here and not on UserRole.
// ===========================================================================

export type RoomRole = 'interviewer' | 'candidate' | 'observer';
export type RoomStatus = 'scheduled' | 'active' | 'ended';
export type RoomLanguage = 'java' | 'python' | 'javascript' | 'cpp' | 'go';

export const ROOM_LANGUAGES: RoomLanguage[] = ['java', 'python', 'javascript', 'cpp', 'go'];

export interface RoomParticipantDto {
  id: string;
  userId: string;
  name: string;
  role: RoomRole;
  color: string; // hex used for the live cursor / presence chip
  online: boolean;
  joinedAt: string;
  lastSeenAt: string | null;
}

export interface RoomDto {
  id: string;
  title: string;
  language: RoomLanguage;
  status: RoomStatus;
  hostId: string;
  hostName: string;
  inviteCode: string;
  problemPrompt: string | null;
  yourRole: RoomRole;
  participantCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export interface RoomDetailDto extends RoomDto {
  participants: RoomParticipantDto[];
  snapshotCount: number;
}

export interface CreateRoomInput {
  title: string;
  language: RoomLanguage;
  scheduledAt?: string | null;
  problemPrompt?: string | null;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export type ChatMessageType = 'user' | 'system';

export interface ChatMessageDto {
  id: string;
  roomId: string;
  type: ChatMessageType;
  userId: string | null; // null for system messages
  authorName: string;
  text: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Recording — code snapshots ("git-commit"-style history) + activity monitoring
// ---------------------------------------------------------------------------

export type SnapshotReason = 'manual' | 'auto' | 'execution' | 'room_end';

export interface CodeSnapshotListItemDto {
  id: string;
  label: string;
  reason: SnapshotReason;
  authorName: string;
  language: RoomLanguage;
  lineCount: number;
  createdAt: string;
}

export interface CodeSnapshotDto extends CodeSnapshotListItemDto {
  roomId: string;
  code: string;
}

export type ActivityType =
  | 'join'
  | 'leave'
  | 'paste'
  | 'copy'
  | 'cut'
  | 'tab_hidden'
  | 'tab_visible'
  | 'window_blur'
  | 'window_focus'
  | 'run'
  | 'language_change';

export interface ActivityEventDto {
  id: string;
  roomId: string;
  userId: string;
  authorName: string;
  type: ActivityType;
  meta: Record<string, unknown> | null;
  at: string;
}

export interface ActivitySummaryDto {
  pasteCount: number;
  copyCount: number;
  tabHiddenCount: number;
  windowBlurCount: number;
  runCount: number;
  focusScore: number; // 0–100; 100 = never left the tab/window
}

// ---------------------------------------------------------------------------
// Realtime (Socket.IO) — wire payloads shared by server and client
// ---------------------------------------------------------------------------

export const SOCKET_EVENTS = {
  ROOM_JOIN: 'room:join',
  ROOM_STATE: 'room:state',
  ROOM_ENDED: 'room:ended',
  PRESENCE_LIST: 'presence:list',
  PRESENCE_JOIN: 'presence:join',
  PRESENCE_LEAVE: 'presence:leave',
  DOC_UPDATE: 'doc:update',
  AWARENESS_UPDATE: 'awareness:update',
  TYPING: 'presence:typing',
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
  ACTIVITY: 'activity:event',
  SNAPSHOT_CREATE: 'snapshot:create',
  SNAPSHOT_CREATED: 'snapshot:created',
  LANGUAGE_CHANGE: 'language:change',
  LANGUAGE_CHANGED: 'language:changed',
  EXEC_RUN: 'exec:run',
  EXEC_STARTED: 'exec:started',
  EXEC_RESULT: 'exec:result',
  ERROR: 'room:error',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export interface PresenceUser {
  socketId: string;
  userId: string;
  name: string;
  role: RoomRole;
  color: string;
}

export interface RoomStateEvent {
  room: RoomDto;
  participants: RoomParticipantDto[];
  presence: PresenceUser[];
  docState: string | null; // base64-encoded Yjs document state for late joiners
  language: RoomLanguage;
  recentMessages: ChatMessageDto[];
}

export interface DocUpdateEvent {
  update: string; // base64-encoded Yjs update
  origin: string; // originating socketId
}

export interface EditorPosition {
  lineNumber: number;
  column: number;
}

export interface EditorSelection {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface AwarenessEvent {
  socketId: string;
  userId: string;
  name: string;
  color: string;
  role: RoomRole;
  cursor: EditorPosition | null;
  selection: EditorSelection | null;
}

export interface TypingEvent {
  socketId: string;
  userId: string;
  name: string;
  isTyping: boolean;
}

export interface ActivityInput {
  type: ActivityType;
  meta?: Record<string, unknown> | null;
}

export interface SocketErrorEvent {
  code: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Secure code execution
// ---------------------------------------------------------------------------

export type ExecutionStatus =
  | 'running'
  | 'success'
  | 'compile_error'
  | 'runtime_error'
  | 'timeout'
  | 'error';

export interface RunCodeInput {
  language: RoomLanguage;
  code: string;
  stdin?: string;
}

export interface ExecutionDto {
  id: string;
  roomId: string;
  requestedById: string;
  requestedByName: string;
  language: RoomLanguage;
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs: number | null;
  memoryKb: number | null;
  createdAt: string;
}

/** exec:started — broadcast the moment a run begins, so peers see "running…". */
export interface ExecStartedEvent {
  requestedById: string;
  requestedByName: string;
  language: RoomLanguage;
}

// ---------------------------------------------------------------------------
// AI interview assistant (CodeSync)
// ---------------------------------------------------------------------------

export interface CodingQuestionExample {
  input: string;
  output: string;
  explanation: string | null;
}

export interface CodingQuestionDto {
  title: string;
  difficulty: Difficulty;
  prompt: string;
  examples: CodingQuestionExample[];
  constraints: string[];
}

export interface GenerateQuestionInput {
  difficulty?: Difficulty;
  topic?: string | null;
}

/** Body for hint / explain / evaluate — the current editor code + language. */
export interface AiCodeInput {
  language: RoomLanguage;
  code: string;
}

export interface AiHintDto {
  hint: string;
}

export interface AiExplanationDto {
  explanation: string;
  complexity: { time: string; space: string };
}

export interface AiReportDto {
  id: string;
  roomId: string;
  language: RoomLanguage;
  createdByName: string;
  overallScore: number; // 0–100
  correctness: number; // 0–100
  problemSolving: number; // 0–100
  codeQuality: number; // 0–100
  communication: number; // 0–100
  timeComplexity: string;
  spaceComplexity: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  verdict: string;
  createdAt: string;
}
