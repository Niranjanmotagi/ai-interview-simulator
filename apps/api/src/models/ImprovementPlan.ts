import { Schema, model, type Document, type Types } from 'mongoose';

export interface ImprovementPlanItemSub {
  _id: Types.ObjectId;
  weakness: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  resources: { title: string; url: string }[];
  done: boolean;
}

export interface ImprovementPlanDoc extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  sourceSummaryId: Types.ObjectId;
  items: ImprovementPlanItemSub[];
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<ImprovementPlanDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sourceSummaryId: { type: Schema.Types.ObjectId, ref: 'SessionSummary', required: true },
    items: [
      {
        weakness: { type: String, required: true },
        action: { type: String, required: true },
        priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
        resources: [{ title: String, url: String, _id: false }],
        done: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
);

planSchema.index({ userId: 1, createdAt: -1 });

export const ImprovementPlan = model<ImprovementPlanDoc>('ImprovementPlan', planSchema);
