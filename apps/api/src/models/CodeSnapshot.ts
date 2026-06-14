import { Schema, model, type Document, type Types } from 'mongoose';
import { ROOM_LANGUAGES, type RoomLanguage, type SnapshotReason } from '@ai-interview/types';

/**
 * An immutable point-in-time copy of the room's code. The ordered stream of
 * snapshots is the interview "recording" — replayable like a series of commits.
 */
export interface CodeSnapshotDoc extends Document<Types.ObjectId> {
  roomId: Types.ObjectId;
  authorId: Types.ObjectId | null;
  authorName: string;
  language: RoomLanguage;
  code: string;
  label: string;
  reason: SnapshotReason;
  createdAt: Date;
}

const codeSnapshotSchema = new Schema<CodeSnapshotDoc>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    authorName: { type: String, required: true },
    language: { type: String, enum: ROOM_LANGUAGES, required: true },
    code: { type: String, default: '' },
    label: { type: String, required: true, maxlength: 200 },
    reason: {
      type: String,
      enum: ['manual', 'auto', 'execution', 'room_end'],
      default: 'manual',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

codeSnapshotSchema.index({ roomId: 1, createdAt: 1 });

export const CodeSnapshot = model<CodeSnapshotDoc>('CodeSnapshot', codeSnapshotSchema);
