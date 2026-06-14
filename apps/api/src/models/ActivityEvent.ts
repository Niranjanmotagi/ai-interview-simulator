import { Schema, model, type Document, type Types } from 'mongoose';
import type { ActivityType } from '@ai-interview/types';

const ACTIVITY_TYPES: ActivityType[] = [
  'join',
  'leave',
  'paste',
  'copy',
  'cut',
  'tab_hidden',
  'tab_visible',
  'window_blur',
  'window_focus',
  'run',
  'language_change',
];

/**
 * A monitored candidate-integrity / engagement signal (paste, tab switch,
 * window blur, run, …). Aggregated into the focus score and the interviewer's
 * activity timeline.
 */
export interface ActivityEventDoc extends Document<Types.ObjectId> {
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
  authorName: string;
  type: ActivityType;
  meta: Record<string, unknown> | null;
  createdAt: Date;
}

const activityEventSchema = new Schema<ActivityEventDoc>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityEventSchema.index({ roomId: 1, createdAt: 1 });
activityEventSchema.index({ roomId: 1, userId: 1 });

export const ActivityEvent = model<ActivityEventDoc>('ActivityEvent', activityEventSchema);
