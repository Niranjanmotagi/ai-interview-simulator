import { Schema, model, type Document, type Types } from 'mongoose';
import type { ChatMessageType } from '@ai-interview/types';

export interface ChatMessageDoc extends Document<Types.ObjectId> {
  roomId: Types.ObjectId;
  userId: Types.ObjectId | null; // null for system messages (join/leave/etc.)
  authorName: string;
  type: ChatMessageType;
  text: string;
  createdAt: Date;
}

const chatMessageSchema = new Schema<ChatMessageDoc>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    authorName: { type: String, required: true },
    type: { type: String, enum: ['user', 'system'], default: 'user' },
    text: { type: String, required: true, maxlength: 4000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Chat history is always read in room + chronological order.
chatMessageSchema.index({ roomId: 1, createdAt: 1 });

export const ChatMessage = model<ChatMessageDoc>('ChatMessage', chatMessageSchema);
