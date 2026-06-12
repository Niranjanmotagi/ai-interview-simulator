import { Schema, model, type Document, type Types } from 'mongoose';

export type UsageEventType =
  | 'resume_structure'
  | 'resume_analysis'
  | 'question_gen'
  | 'followup_gen'
  | 'evaluation'
  | 'summary'
  | 'improvement_plan'
  | 'interview_created';

// `model` (the AI model name) collides with Mongoose's Document#model method,
// so that key is omitted from the base type and redeclared as our field.
export interface UsageEventDoc extends Omit<Document<Types.ObjectId>, 'model'> {
  userId: Types.ObjectId;
  type: UsageEventType;
  tokensIn: number;
  tokensOut: number;
  model: string;
  createdAt: Date;
}

const usageEventSchema = new Schema<UsageEventDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'resume_structure',
        'resume_analysis',
        'question_gen',
        'followup_gen',
        'evaluation',
        'summary',
        'improvement_plan',
        'interview_created',
      ],
      index: true,
    },
    tokensIn: { type: Number, default: 0 },
    tokensOut: { type: Number, default: 0 },
    model: { type: String, default: 'n/a' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

usageEventSchema.index({ userId: 1, createdAt: -1 });

export const UsageEvent = model<UsageEventDoc>('UsageEvent', usageEventSchema);
