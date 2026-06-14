import { Schema, model, type Document, type Types } from 'mongoose';
import type { RoomRole } from '@ai-interview/types';

export type ParticipantStatus = 'invited' | 'joined' | 'left';

/**
 * Membership of a user in a room, with a room-scoped role. `displayName` and
 * `color` are snapshotted at join time so historical chat/recording stays
 * stable even if the user later renames their account.
 */
export interface RoomParticipantDoc extends Document<Types.ObjectId> {
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
  role: RoomRole;
  status: ParticipantStatus;
  displayName: string;
  color: string;
  joinedAt: Date;
  lastSeenAt: Date | null;
  createdAt: Date;
}

const participantSchema = new Schema<RoomParticipantDoc>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: ['interviewer', 'candidate', 'observer'],
      required: true,
    },
    status: { type: String, enum: ['invited', 'joined', 'left'], default: 'joined' },
    displayName: { type: String, required: true },
    color: { type: String, required: true },
    joinedAt: { type: Date, default: () => new Date() },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// One membership row per (room, user); also the lookup for "is this user in this room?".
participantSchema.index({ roomId: 1, userId: 1 }, { unique: true });

export const RoomParticipant = model<RoomParticipantDoc>('RoomParticipant', participantSchema);
