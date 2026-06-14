import { Schema, model, type Document, type Types } from 'mongoose';
import { ROOM_LANGUAGES, type RoomLanguage, type RoomStatus } from '@ai-interview/types';

/**
 * A live coding-interview room. `docState` holds the encoded Yjs CRDT document
 * so a server restart (or a late joiner) can rehydrate the exact shared buffer;
 * `currentCode` is a denormalized plain-text copy used for snapshots/execution.
 */
export interface RoomDoc extends Document<Types.ObjectId> {
  hostId: Types.ObjectId;
  title: string;
  language: RoomLanguage;
  status: RoomStatus;
  inviteCode: string;
  problemPrompt: string | null;
  docState: Buffer | null;
  currentCode: string;
  scheduledAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<RoomDoc>(
  {
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    language: { type: String, enum: ROOM_LANGUAGES, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'scheduled',
      index: true,
    },
    inviteCode: { type: String, required: true, unique: true },
    problemPrompt: { type: String, default: null, maxlength: 8000 },
    docState: { type: Buffer, default: null },
    currentCode: { type: String, default: '' },
    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Dashboard query: "rooms I host, newest first".
roomSchema.index({ hostId: 1, createdAt: -1 });

export const Room = model<RoomDoc>('Room', roomSchema);
