import { Schema, model, type Document, type Types } from 'mongoose';
import type { RubricScores } from '@ai-interview/types';

export interface EvaluationDoc extends Document<Types.ObjectId> {
  answerId: Types.ObjectId;
  sessionId: Types.ObjectId;
  rubric: RubricScores;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  detectedWeaknessTags: string[];
  createdAt: Date;
}

const evaluationSchema = new Schema<EvaluationDoc>(
  {
    answerId: { type: Schema.Types.ObjectId, ref: 'Answer', required: true, unique: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', required: true, index: true },
    rubric: {
      type: {
        relevance: { type: Number, min: 0, max: 10, required: true },
        structure: { type: Number, min: 0, max: 10, required: true },
        depth: { type: Number, min: 0, max: 10, required: true },
        communication: { type: Number, min: 0, max: 10, required: true },
      },
      required: true,
      _id: false,
    },
    overallScore: { type: Number, min: 0, max: 10, required: true },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    modelAnswer: { type: String, default: '' },
    detectedWeaknessTags: { type: [String], default: [], index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Evaluation = model<EvaluationDoc>('Evaluation', evaluationSchema);
