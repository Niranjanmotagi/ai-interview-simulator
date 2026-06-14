import { Schema, model, type Document, type Types } from 'mongoose';
import { ROOM_LANGUAGES, type RoomLanguage } from '@ai-interview/types';

/**
 * An AI evaluation of a code submission in a room — the interviewer-facing
 * report (scores, complexity, strengths/weaknesses/suggestions). Persisted so
 * it appears in the interview recording and the candidate's feedback.
 */
export interface AIReportDoc extends Document<Types.ObjectId> {
  roomId: Types.ObjectId;
  createdById: Types.ObjectId;
  createdByName: string;
  language: RoomLanguage;
  code: string;
  overallScore: number;
  correctness: number;
  problemSolving: number;
  codeQuality: number;
  communication: number;
  timeComplexity: string;
  spaceComplexity: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  verdict: string;
  createdAt: Date;
}

const aiReportSchema = new Schema<AIReportDoc>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, required: true },
    language: { type: String, enum: ROOM_LANGUAGES, required: true },
    code: { type: String, default: '' },
    overallScore: { type: Number, required: true },
    correctness: { type: Number, required: true },
    problemSolving: { type: Number, required: true },
    codeQuality: { type: Number, required: true },
    communication: { type: Number, required: true },
    timeComplexity: { type: String, default: '' },
    spaceComplexity: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
    verdict: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

aiReportSchema.index({ roomId: 1, createdAt: -1 });

export const AIReport = model<AIReportDoc>('AIReport', aiReportSchema);
