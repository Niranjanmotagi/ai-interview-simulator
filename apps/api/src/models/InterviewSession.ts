import { Schema, model, type Document, type Types } from 'mongoose';
import type { Difficulty, RoundType, SessionStatus } from '@ai-interview/types';

export interface InterviewConfigSub {
  targetRole: string;
  jobDescription: string | null;
  difficulty: Difficulty;
  roundType: RoundType;
  questionCount: number;
}

export interface InterviewSessionDoc extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  resumeId: Types.ObjectId | null;
  config: InterviewConfigSub;
  status: SessionStatus;
  questions: Types.ObjectId[];
  summaryId: Types.ObjectId | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

const sessionSchema = new Schema<InterviewSessionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', default: null, index: true },
    config: {
      type: {
        targetRole: { type: String, required: true },
        jobDescription: { type: String, default: null },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
        roundType: {
          type: String,
          enum: ['behavioral', 'technical', 'system_design', 'hr', 'mixed'],
          required: true,
        },
        questionCount: { type: Number, required: true, min: 1, max: 10 },
      },
      required: true,
      _id: false,
    },
    status: {
      type: String,
      enum: ['created', 'in_progress', 'completed', 'abandoned'],
      default: 'created',
      index: true,
    },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    summaryId: { type: Schema.Types.ObjectId, ref: 'SessionSummary', default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

sessionSchema.index({ userId: 1, createdAt: -1 });

export const InterviewSession = model<InterviewSessionDoc>('InterviewSession', sessionSchema);
