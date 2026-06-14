import { Schema, model, type Document, type Types } from 'mongoose';
import { ROOM_LANGUAGES, type ExecutionStatus, type RoomLanguage } from '@ai-interview/types';

/**
 * A single code-execution attempt in a room. Persisted for the interview
 * recording / analytics (execution count, what was run, results).
 */
export interface ExecutionDoc extends Document<Types.ObjectId> {
  roomId: Types.ObjectId;
  requestedById: Types.ObjectId;
  requestedByName: string;
  language: RoomLanguage;
  code: string;
  stdin: string;
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs: number | null;
  memoryKb: number | null;
  createdAt: Date;
}

const executionSchema = new Schema<ExecutionDoc>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    requestedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestedByName: { type: String, required: true },
    language: { type: String, enum: ROOM_LANGUAGES, required: true },
    code: { type: String, default: '' },
    stdin: { type: String, default: '' },
    status: {
      type: String,
      enum: ['running', 'success', 'compile_error', 'runtime_error', 'timeout', 'error'],
      default: 'running',
    },
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    exitCode: { type: Number, default: null },
    timeMs: { type: Number, default: null },
    memoryKb: { type: Number, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

executionSchema.index({ roomId: 1, createdAt: -1 });

export const Execution = model<ExecutionDoc>('Execution', executionSchema);
