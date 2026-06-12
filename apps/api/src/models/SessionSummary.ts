import { Schema, model, type Document, type Types } from 'mongoose';
import type { RubricScores } from '@ai-interview/types';

export interface SessionSummaryDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
  aggregateScore: number;
  rubricAverages: RubricScores;
  topWeaknesses: string[];
  topStrengths: string[];
  narrative: string;
  createdAt: Date;
}

const summarySchema = new Schema<SessionSummaryDoc>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
      unique: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    aggregateScore: { type: Number, min: 0, max: 10, required: true },
    rubricAverages: {
      type: {
        relevance: Number,
        structure: Number,
        depth: Number,
        communication: Number,
      },
      required: true,
      _id: false,
    },
    topWeaknesses: { type: [String], default: [] },
    topStrengths: { type: [String], default: [] },
    narrative: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

summarySchema.index({ userId: 1, createdAt: -1 });

export const SessionSummary = model<SessionSummaryDoc>('SessionSummary', summarySchema);
