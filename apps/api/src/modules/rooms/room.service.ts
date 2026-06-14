import crypto from 'node:crypto';
import { Types } from 'mongoose';
import type {
  ActivityType,
  ChatMessageType,
  CreateRoomInput,
  RoomLanguage,
  RunCodeInput,
  SnapshotReason,
} from '@ai-interview/types';
import {
  ActivityEvent,
  ChatMessage,
  CodeSnapshot,
  Execution,
  Room,
  RoomParticipant,
  User,
  type ActivityEventDoc,
  type ChatMessageDoc,
  type CodeSnapshotDoc,
  type ExecutionDoc,
  type RoomDoc,
  type RoomParticipantDoc,
} from '../../models';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';
import { getExecutionService } from '../../execution';

// Presence-chip / live-cursor palette (the design accents + a few neutrals).
const PARTICIPANT_COLORS = [
  '#22C55E', // green  — first joiner (typically the host)
  '#38BDF8', // sky
  '#A855F7', // purple
  '#F59E0B', // amber
  '#EC4899', // pink
  '#14B8A6', // teal
];

export function pickColor(index: number): string {
  return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length] as string;
}

// Crockford-ish base32 (no I/L/O/U/0/1) so invite codes are unambiguous to type.
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

function randomCode(len = 8): string {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return out;
}

async function uniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode();
    if (!(await Room.exists({ inviteCode: code }))) {
      return code;
    }
  }
  // Extremely unlikely; widen the space rather than fail the request.
  return randomCode(12);
}

// ---------------------------------------------------------------------------
// Membership / authorization
// ---------------------------------------------------------------------------

export interface Membership {
  room: RoomDoc;
  participant: RoomParticipantDoc;
  isHost: boolean;
}

/** Loads the room + the caller's membership; 404s for non-members (no existence leak). */
export async function getMembership(userId: string, roomId: string): Promise<Membership> {
  const room = await Room.findById(roomId);
  if (!room) {
    throw ApiError.notFound('Room');
  }
  const participant = await RoomParticipant.findOne({ roomId: room._id, userId });
  if (!participant) {
    throw ApiError.notFound('Room');
  }
  return { room, participant, isHost: room.hostId.toString() === userId };
}

/** Like getMembership but additionally requires the interviewer (host) role. */
export async function requireHost(userId: string, roomId: string): Promise<Membership> {
  const membership = await getMembership(userId, roomId);
  if (!membership.isHost) {
    throw ApiError.forbidden('Only the interviewer can perform this action');
  }
  return membership;
}

async function hostName(room: RoomDoc): Promise<string> {
  const host = await User.findById(room.hostId).select('name').lean();
  return host?.name ?? 'Interviewer';
}

async function participantCount(roomId: Types.ObjectId): Promise<number> {
  return RoomParticipant.countDocuments({ roomId });
}

// ---------------------------------------------------------------------------
// Create / list / detail
// ---------------------------------------------------------------------------

export async function createRoom(userId: string, input: CreateRoomInput): Promise<Membership> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists', 'USER_GONE');
  }

  const inviteCode = await uniqueInviteCode();
  const room = await Room.create({
    hostId: user._id,
    title: input.title,
    language: input.language,
    status: 'scheduled',
    inviteCode,
    problemPrompt: input.problemPrompt ?? null,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    currentCode: '',
  });

  const participant = await RoomParticipant.create({
    roomId: room._id,
    userId: user._id,
    role: 'interviewer',
    status: 'joined',
    displayName: user.name,
    color: pickColor(0),
  });

  return { room, participant, isHost: true };
}

export interface RoomListRow {
  room: RoomDoc;
  yourRole: RoomParticipantDoc['role'];
  hostName: string;
  participantCount: number;
}

export async function listRooms(
  userId: string,
  page: number,
  limit: number,
): Promise<{ rows: RoomListRow[]; total: number }> {
  const myParts = await RoomParticipant.find({ userId }).select('roomId role').lean();
  const roleByRoom = new Map(myParts.map((p) => [p.roomId.toString(), p.role]));
  const roomIds = myParts.map((p) => p.roomId);
  const total = roomIds.length;
  if (total === 0) {
    return { rows: [], total: 0 };
  }

  const rooms = await Room.find({ _id: { $in: roomIds } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const [countRows, hosts] = await Promise.all([
    RoomParticipant.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { roomId: { $in: rooms.map((r) => r._id) } } },
      { $group: { _id: '$roomId', count: { $sum: 1 } } },
    ]),
    User.find({ _id: { $in: rooms.map((r) => r.hostId) } })
      .select('name')
      .lean(),
  ]);
  const countByRoom = new Map(countRows.map((r) => [r._id.toString(), r.count]));
  const nameByHost = new Map(hosts.map((h) => [h._id.toString(), h.name]));

  const rows = rooms.map((room) => ({
    room,
    yourRole: roleByRoom.get(room._id.toString()) ?? 'observer',
    hostName: nameByHost.get(room.hostId.toString()) ?? 'Interviewer',
    participantCount: countByRoom.get(room._id.toString()) ?? 0,
  }));

  return { rows, total };
}

export interface RoomDetail extends Membership {
  participants: RoomParticipantDoc[];
  hostName: string;
  snapshotCount: number;
}

export async function getRoomDetail(userId: string, roomId: string): Promise<RoomDetail> {
  const membership = await getMembership(userId, roomId);
  const [participants, snapshotCount, host] = await Promise.all([
    RoomParticipant.find({ roomId: membership.room._id }).sort({ joinedAt: 1 }),
    CodeSnapshot.countDocuments({ roomId: membership.room._id }),
    hostName(membership.room),
  ]);
  return { ...membership, participants, hostName: host, snapshotCount };
}

// ---------------------------------------------------------------------------
// Join (shared by REST POST /rooms/join/:code and the Socket.IO gateway)
// ---------------------------------------------------------------------------

export async function joinRoomByCode(userId: string, code: string): Promise<Membership> {
  const room = await Room.findOne({ inviteCode: code.toUpperCase() });
  if (!room) {
    throw ApiError.notFound('Room');
  }
  if (room.status === 'ended') {
    throw ApiError.conflict('This interview has already ended', 'ROOM_ENDED');
  }
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists', 'USER_GONE');
  }

  const isHost = room.hostId.toString() === userId;
  let participant = await RoomParticipant.findOne({ roomId: room._id, userId });
  if (!participant) {
    const count = await participantCount(room._id);
    try {
      participant = await RoomParticipant.create({
        roomId: room._id,
        userId: user._id,
        role: isHost ? 'interviewer' : 'candidate',
        status: 'joined',
        displayName: user.name,
        color: pickColor(count),
      });
    } catch (err) {
      // Two sockets racing the first join → unique-index violation; re-read.
      if (isDuplicateKey(err)) {
        participant = await RoomParticipant.findOne({ roomId: room._id, userId });
      }
      if (!participant) {
        throw err;
      }
    }
  }

  return { room, participant, isHost };
}

function isDuplicateKey(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000);
}

/** First socket activity flips a scheduled room to active. Idempotent. */
export async function markRoomActive(roomId: string): Promise<void> {
  await Room.updateOne(
    { _id: roomId, status: 'scheduled' },
    { $set: { status: 'active', startedAt: new Date() } },
  );
}

export async function setRoomLanguage(roomId: string, language: RoomLanguage): Promise<void> {
  await Room.updateOne({ _id: roomId }, { $set: { language } });
}

export async function touchParticipant(roomId: string, userId: string): Promise<void> {
  await RoomParticipant.updateOne(
    { roomId, userId },
    { $set: { lastSeenAt: new Date() } },
  );
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export async function endRoom(userId: string, roomId: string): Promise<RoomDoc> {
  const { room } = await requireHost(userId, roomId);
  if (room.status === 'ended') {
    return room; // idempotent
  }
  room.status = 'ended';
  room.endedAt = new Date();
  await room.save();

  await createSnapshot(roomId, {
    authorId: userId,
    authorName: await hostName(room),
    language: room.language,
    code: room.currentCode,
    label: 'Final code (interview ended)',
    reason: 'room_end',
  });

  return room;
}

export async function deleteRoom(userId: string, roomId: string): Promise<void> {
  const { room } = await requireHost(userId, roomId);
  await Promise.all([
    RoomParticipant.deleteMany({ roomId: room._id }),
    ChatMessage.deleteMany({ roomId: room._id }),
    CodeSnapshot.deleteMany({ roomId: room._id }),
    ActivityEvent.deleteMany({ roomId: room._id }),
    Execution.deleteMany({ roomId: room._id }),
  ]);
  await room.deleteOne();
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export async function listMessages(
  userId: string,
  roomId: string,
  page: number,
  limit: number,
): Promise<{ messages: ChatMessageDoc[]; total: number }> {
  const { room } = await getMembership(userId, roomId);
  const [messages, total] = await Promise.all([
    ChatMessage.find({ roomId: room._id })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ChatMessage.countDocuments({ roomId: room._id }),
  ]);
  return { messages, total };
}

/** Latest `limit` messages in chronological order — used to seed a joiner's chat. */
export async function getRecentMessages(roomId: string, limit: number): Promise<ChatMessageDoc[]> {
  const rows = await ChatMessage.find({ roomId }).sort({ createdAt: -1 }).limit(limit);
  return rows.reverse();
}

export async function createMessage(
  roomId: string,
  input: { userId: string | null; authorName: string; type: ChatMessageType; text: string },
): Promise<ChatMessageDoc> {
  return ChatMessage.create({
    roomId,
    userId: input.userId,
    authorName: input.authorName,
    type: input.type,
    text: input.text.slice(0, 4000),
  });
}

// ---------------------------------------------------------------------------
// Recording — snapshots
// ---------------------------------------------------------------------------

export async function listSnapshots(
  userId: string,
  roomId: string,
  page: number,
  limit: number,
): Promise<{ snapshots: CodeSnapshotDoc[]; total: number }> {
  const { room } = await getMembership(userId, roomId);
  const [snapshots, total] = await Promise.all([
    CodeSnapshot.find({ roomId: room._id })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    CodeSnapshot.countDocuments({ roomId: room._id }),
  ]);
  return { snapshots, total };
}

export async function getSnapshot(
  userId: string,
  roomId: string,
  snapId: string,
): Promise<CodeSnapshotDoc> {
  const { room } = await getMembership(userId, roomId);
  const snapshot = await CodeSnapshot.findOne({ _id: snapId, roomId: room._id });
  if (!snapshot) {
    throw ApiError.notFound('Snapshot');
  }
  return snapshot;
}

export async function createSnapshot(
  roomId: string,
  input: {
    authorId: string | null;
    authorName: string;
    language: RoomLanguage;
    code: string;
    label: string;
    reason: SnapshotReason;
  },
): Promise<CodeSnapshotDoc> {
  return CodeSnapshot.create({ roomId, ...input });
}

// ---------------------------------------------------------------------------
// Monitoring — activity events
// ---------------------------------------------------------------------------

export async function listActivity(
  userId: string,
  roomId: string,
  page: number,
  limit: number,
): Promise<{ events: ActivityEventDoc[]; total: number }> {
  const { room } = await requireHost(userId, roomId); // monitoring is interviewer-only
  const [events, total] = await Promise.all([
    ActivityEvent.find({ roomId: room._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ActivityEvent.countDocuments({ roomId: room._id }),
  ]);
  return { events, total };
}

export async function recordActivity(
  roomId: string,
  input: {
    userId: string;
    authorName: string;
    type: ActivityType;
    meta?: Record<string, unknown> | null;
  },
): Promise<ActivityEventDoc> {
  return ActivityEvent.create({
    roomId,
    userId: input.userId,
    authorName: input.authorName,
    type: input.type,
    meta: input.meta ?? null,
  });
}

// ---------------------------------------------------------------------------
// Secure code execution
// ---------------------------------------------------------------------------

/** REST entry point: membership-checked run. */
export async function runInRoom(
  userId: string,
  roomId: string,
  input: RunCodeInput,
): Promise<ExecutionDoc> {
  const { participant } = await getMembership(userId, roomId);
  return performRun(roomId, userId, participant.displayName, input);
}

/**
 * Records an Execution, runs it on the sandboxed executor, and persists the
 * result. Also logs a `run` activity event. Shared by the REST endpoint and the
 * Socket.IO gateway (which additionally broadcasts the result to the room).
 */
export async function performRun(
  roomId: string,
  requesterId: string,
  requesterName: string,
  input: RunCodeInput,
): Promise<ExecutionDoc> {
  const code = input.code ?? '';
  if (Buffer.byteLength(code, 'utf8') > env.EXEC_MAX_CODE_BYTES) {
    throw ApiError.badRequest('Code exceeds the maximum allowed size');
  }
  const stdin = input.stdin ?? '';

  const execution = await Execution.create({
    roomId,
    requestedById: requesterId,
    requestedByName: requesterName,
    language: input.language,
    code,
    stdin,
    status: 'running',
  });

  await recordActivity(roomId, {
    userId: requesterId,
    authorName: requesterName,
    type: 'run',
    meta: { language: input.language, executionId: execution._id.toString() },
  });

  try {
    const result = await getExecutionService().run({ language: input.language, code, stdin });
    execution.status = result.status;
    execution.stdout = result.stdout;
    execution.stderr = result.stderr;
    execution.exitCode = result.exitCode;
    execution.timeMs = result.timeMs;
    execution.memoryKb = result.memoryKb;
  } catch (err) {
    execution.status = 'error';
    execution.stderr = 'The execution engine failed to run this code.';
  }
  await execution.save();
  return execution;
}

export async function listExecutions(
  userId: string,
  roomId: string,
  page: number,
  limit: number,
): Promise<{ executions: ExecutionDoc[]; total: number }> {
  const { room } = await getMembership(userId, roomId);
  const [executions, total] = await Promise.all([
    Execution.find({ roomId: room._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Execution.countDocuments({ roomId: room._id }),
  ]);
  return { executions, total };
}

export async function getExecution(
  userId: string,
  roomId: string,
  execId: string,
): Promise<ExecutionDoc> {
  const { room } = await getMembership(userId, roomId);
  const execution = await Execution.findOne({ _id: execId, roomId: room._id });
  if (!execution) {
    throw ApiError.notFound('Execution');
  }
  return execution;
}
