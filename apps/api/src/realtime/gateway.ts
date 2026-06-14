import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import {
  SOCKET_EVENTS,
  type ActivityInput,
  type AwarenessEvent,
  type PresenceUser,
  type RoomLanguage,
} from '@ai-interview/types';
import { env } from '../config/env';
import { logger } from '../config/logger';
import * as roomService from '../modules/rooms/room.service';
import { toChatMessageDto, toParticipantDto, toRoomDto, toSnapshotListItemDto } from '../modules/rooms/room.mapper';
import * as registry from './roomRegistry';

interface SocketState {
  userId: string;
  roomId: string | null;
  member: PresenceUser | null;
}

type AppSocket = Socket & { data: SocketState };

const ROOM_PREFIX = 'room:';
const channel = (roomId: string) => `${ROOM_PREFIX}${roomId}`;

const toBytes = (b64: string): Uint8Array => new Uint8Array(Buffer.from(b64, 'base64'));

export function attachRealtime(server: HttpServer, corsOrigins: string[]): Server {
  const io = new Server(server, {
    cors: { origin: corsOrigins, credentials: true, methods: ['GET', 'POST'] },
    maxHttpBufferSize: 2_000_000, // generous for Yjs frames, bounded against abuse
  });

  // --- Auth: same access token as the REST API, presented in the handshake. ---
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as unknown;
    if (typeof token !== 'string') {
      next(new Error('UNAUTHORIZED'));
      return;
    }
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
      if (typeof payload.sub !== 'string') {
        throw new Error('Malformed token');
      }
      (socket as AppSocket).data = { userId: payload.sub, roomId: null, member: null };
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => registerHandlers(io, socket as AppSocket));
  return io;
}

function registerHandlers(io: Server, socket: AppSocket): void {
  socket.on(SOCKET_EVENTS.ROOM_JOIN, safe(socket, (payload) => handleJoin(io, socket, payload)));
  socket.on(SOCKET_EVENTS.DOC_UPDATE, safe(socket, (payload) => handleDocUpdate(socket, payload)));
  socket.on(SOCKET_EVENTS.AWARENESS_UPDATE, safe(socket, (payload) => handleAwareness(socket, payload)));
  socket.on(SOCKET_EVENTS.TYPING, safe(socket, (payload) => handleTyping(socket, payload)));
  socket.on(SOCKET_EVENTS.CHAT_SEND, safe(socket, (payload) => handleChat(io, socket, payload)));
  socket.on(SOCKET_EVENTS.ACTIVITY, safe(socket, (payload) => handleActivity(io, socket, payload)));
  socket.on(SOCKET_EVENTS.SNAPSHOT_CREATE, safe(socket, (payload) => handleSnapshot(io, socket, payload)));
  socket.on(SOCKET_EVENTS.LANGUAGE_CHANGE, safe(socket, (payload) => handleLanguage(io, socket, payload)));
  socket.on('disconnect', () => {
    void handleDisconnect(io, socket);
  });
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleJoin(
  io: Server,
  socket: AppSocket,
  payload: { roomCode?: unknown },
): Promise<void> {
  const code = typeof payload?.roomCode === 'string' ? payload.roomCode : '';
  if (!code) {
    emitError(socket, 'BAD_REQUEST', 'roomCode is required');
    return;
  }

  const { room, participant } = await roomService.joinRoomByCode(socket.data.userId, code);
  const roomId = room._id.toString();
  await roomService.markRoomActive(roomId);

  registry.ensureLiveRoom(roomId, room.language, room.docState);
  const member: PresenceUser = {
    socketId: socket.id,
    userId: socket.data.userId,
    name: participant.displayName,
    role: participant.role,
    color: participant.color,
  };
  registry.addMember(roomId, member);

  socket.data.roomId = roomId;
  socket.data.member = member;
  await socket.join(channel(roomId));

  // Snapshot the room for this joiner.
  const detail = await roomService.getRoomDetail(socket.data.userId, roomId);
  const onlineIds = registry.getOnlineUserIds(roomId);
  socket.emit(SOCKET_EVENTS.ROOM_STATE, {
    room: toRoomDto(room, {
      yourRole: participant.role,
      hostName: detail.hostName,
      participantCount: detail.participants.length,
    }),
    participants: detail.participants.map((p) => toParticipantDto(p, onlineIds)),
    presence: registry.presenceFor(roomId),
    docState: registry.encodeStateBase64(roomId),
    language: room.language,
    recentMessages: (await roomService.getRecentMessages(roomId, 50)).map(toChatMessageDto),
  });

  // Tell everyone else, and log a system chat line + a join activity event.
  socket.to(channel(roomId)).emit(SOCKET_EVENTS.PRESENCE_JOIN, member);
  io.to(channel(roomId)).emit(SOCKET_EVENTS.PRESENCE_LIST, registry.presenceFor(roomId));
  await emitSystemMessage(io, roomId, `${participant.displayName} joined the room`);
  await roomService.recordActivity(roomId, {
    userId: socket.data.userId,
    authorName: participant.displayName,
    type: 'join',
  });
}

function handleDocUpdate(socket: AppSocket, payload: { update?: unknown }): void {
  const roomId = socket.data.roomId;
  if (!roomId || typeof payload?.update !== 'string') {
    return;
  }
  registry.applyDocUpdate(roomId, toBytes(payload.update));
  // Relay to peers only — the sender already applied it locally.
  socket.to(channel(roomId)).emit(SOCKET_EVENTS.DOC_UPDATE, {
    update: payload.update,
    origin: socket.id,
  });
}

function handleAwareness(
  socket: AppSocket,
  payload: { cursor?: AwarenessEvent['cursor']; selection?: AwarenessEvent['selection'] },
): void {
  const roomId = socket.data.roomId;
  const member = socket.data.member;
  if (!roomId || !member) {
    return;
  }
  const event: AwarenessEvent = {
    socketId: socket.id,
    userId: member.userId,
    name: member.name,
    color: member.color,
    role: member.role,
    cursor: payload?.cursor ?? null,
    selection: payload?.selection ?? null,
  };
  socket.to(channel(roomId)).emit(SOCKET_EVENTS.AWARENESS_UPDATE, event); // ephemeral, not persisted
}

function handleTyping(socket: AppSocket, payload: { isTyping?: unknown }): void {
  const roomId = socket.data.roomId;
  const member = socket.data.member;
  if (!roomId || !member) {
    return;
  }
  socket.to(channel(roomId)).emit(SOCKET_EVENTS.TYPING, {
    socketId: socket.id,
    userId: member.userId,
    name: member.name,
    isTyping: Boolean(payload?.isTyping),
  });
}

async function handleChat(
  io: Server,
  socket: AppSocket,
  payload: { text?: unknown },
): Promise<void> {
  const roomId = socket.data.roomId;
  const member = socket.data.member;
  const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
  if (!roomId || !member || !text) {
    return;
  }
  const message = await roomService.createMessage(roomId, {
    userId: member.userId,
    authorName: member.name,
    type: 'user',
    text,
  });
  io.to(channel(roomId)).emit(SOCKET_EVENTS.CHAT_MESSAGE, toChatMessageDto(message));
}

async function handleActivity(
  io: Server,
  socket: AppSocket,
  payload: ActivityInput,
): Promise<void> {
  const roomId = socket.data.roomId;
  const member = socket.data.member;
  if (!roomId || !member || !payload?.type) {
    return;
  }
  const event = await roomService.recordActivity(roomId, {
    userId: member.userId,
    authorName: member.name,
    type: payload.type,
    meta: payload.meta ?? null,
  });
  // Surface to the interviewer's live monitor (clients gate on role).
  io.to(channel(roomId)).emit(SOCKET_EVENTS.ACTIVITY, {
    id: event._id.toString(),
    roomId,
    userId: member.userId,
    authorName: member.name,
    type: payload.type,
    meta: payload.meta ?? null,
    at: event.createdAt.toISOString(),
  });
}

async function handleSnapshot(
  io: Server,
  socket: AppSocket,
  payload: { label?: unknown },
): Promise<void> {
  const roomId = socket.data.roomId;
  const member = socket.data.member;
  if (!roomId || !member) {
    return;
  }
  const code = registry.getRoomText(roomId);
  const label = typeof payload?.label === 'string' && payload.label.trim() ? payload.label.trim() : `Snapshot by ${member.name}`;
  const snapshot = await roomService.createSnapshot(roomId, {
    authorId: member.userId,
    authorName: member.name,
    language: registry.getLanguage(roomId) ?? 'javascript',
    code,
    label,
    reason: 'manual',
  });
  io.to(channel(roomId)).emit(SOCKET_EVENTS.SNAPSHOT_CREATED, toSnapshotListItemDto(snapshot));
}

async function handleLanguage(
  io: Server,
  socket: AppSocket,
  payload: { language?: unknown },
): Promise<void> {
  const roomId = socket.data.roomId;
  const member = socket.data.member;
  if (!roomId || !member) {
    return;
  }
  if (member.role !== 'interviewer') {
    emitError(socket, 'FORBIDDEN', 'Only the interviewer can change the language');
    return;
  }
  const language = payload?.language as RoomLanguage;
  await roomService.setRoomLanguage(roomId, language);
  registry.setLanguage(roomId, language);
  io.to(channel(roomId)).emit(SOCKET_EVENTS.LANGUAGE_CHANGED, { language });
  await roomService.recordActivity(roomId, {
    userId: member.userId,
    authorName: member.name,
    type: 'language_change',
    meta: { language },
  });
}

async function handleDisconnect(io: Server, socket: AppSocket): Promise<void> {
  const roomId = socket.data.roomId;
  const member = socket.data.member;
  if (!roomId || !member) {
    return;
  }
  const { remaining } = registry.removeMember(roomId, socket.id);
  socket.to(channel(roomId)).emit(SOCKET_EVENTS.PRESENCE_LEAVE, {
    socketId: socket.id,
    userId: member.userId,
  });
  io.to(channel(roomId)).emit(SOCKET_EVENTS.PRESENCE_LIST, registry.presenceFor(roomId));
  // Cleanup writes must never crash the process (e.g. during shutdown/teardown).
  try {
    await roomService.touchParticipant(roomId, member.userId);
    await roomService.recordActivity(roomId, {
      userId: member.userId,
      authorName: member.name,
      type: 'leave',
    });
    await emitSystemMessage(io, roomId, `${member.name} left the room`);
    if (remaining === 0) {
      await registry.flushAndEvict(roomId);
    }
  } catch (err) {
    logger.error({ err, roomId }, 'Disconnect cleanup failed');
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function emitSystemMessage(io: Server, roomId: string, text: string): Promise<void> {
  const message = await roomService.createMessage(roomId, {
    userId: null,
    authorName: 'System',
    type: 'system',
    text,
  });
  io.to(channel(roomId)).emit(SOCKET_EVENTS.CHAT_MESSAGE, toChatMessageDto(message));
}

function emitError(socket: AppSocket, code: string, message: string): void {
  socket.emit(SOCKET_EVENTS.ERROR, { code, message });
}

/** Wraps an async handler so a thrown error becomes a room:error frame, never a crash. */
function safe<T>(
  socket: AppSocket,
  handler: (payload: T) => void | Promise<void>,
): (payload: T) => void {
  return (payload: T) => {
    Promise.resolve(handler(payload)).catch((err) => {
      logger.error({ err, socketId: socket.id }, 'Socket handler error');
      // Surface the operational error code (e.g. ROOM_ENDED) so the client can react.
      const code =
        err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string'
          ? (err as { code: string }).code
          : 'SOCKET_ERROR';
      const message = err instanceof Error ? err.message : 'Unexpected error';
      emitError(socket, code, message);
    });
  };
}
