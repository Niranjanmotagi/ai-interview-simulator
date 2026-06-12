import { Schema, model, type Document, type Types } from 'mongoose';

export interface AnswerDoc extends Document<Types.ObjectId> {
  questionId: Types.ObjectId;
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  inputMode: 'text' | 'voice';
  durationSec: number | null;
  createdAt: Date;
}

const answerSchema = new Schema<AnswerDoc>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, unique: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, maxlength: 20_000 },
    inputMode: { type: String, enum: ['text', 'voice'], default: 'text' },
    durationSec: { type: Number, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Answer = model<AnswerDoc>('Answer', answerSchema);
