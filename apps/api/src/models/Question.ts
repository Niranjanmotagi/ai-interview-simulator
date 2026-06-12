import { Schema, model, type Document, type Types } from 'mongoose';
import type { QuestionType } from '@ai-interview/types';

export interface QuestionDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  order: number;
  type: QuestionType;
  text: string;
  rationale: string;
  parentQuestionId: Types.ObjectId | null;
  createdAt: Date;
}

const questionSchema = new Schema<QuestionDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
    order: { type: Number, required: true },
    type: {
      type: String,
      enum: ['behavioral', 'technical', 'system_design', 'hr', 'followup'],
      required: true,
    },
    text: { type: String, required: true },
    rationale: { type: String, default: '' },
    parentQuestionId: { type: Schema.Types.ObjectId, ref: 'Question', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

questionSchema.index({ sessionId: 1, order: 1 });

export const Question = model<QuestionDoc>('Question', questionSchema);
