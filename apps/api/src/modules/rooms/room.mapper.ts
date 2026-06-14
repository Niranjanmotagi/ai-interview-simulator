import type {
  ActivityEventDto,
  ChatMessageDto,
  CodeSnapshotDto,
  CodeSnapshotListItemDto,
  ExecutionDto,
  RoomDetailDto,
  RoomDto,
  RoomParticipantDto,
  RoomRole,
} from '@ai-interview/types';
import type {
  ActivityEventDoc,
  ChatMessageDoc,
  CodeSnapshotDoc,
  ExecutionDoc,
  RoomDoc,
  RoomParticipantDoc,
} from '../../models';

export function toRoomDto(
  room: RoomDoc,
  ctx: { yourRole: RoomRole; hostName: string; participantCount: number },
): RoomDto {
  return {
    id: room._id.toString(),
    title: room.title,
    language: room.language,
    status: room.status,
    hostId: room.hostId.toString(),
    hostName: ctx.hostName,
    inviteCode: room.inviteCode,
    problemPrompt: room.problemPrompt,
    yourRole: ctx.yourRole,
    participantCount: ctx.participantCount,
    scheduledAt: room.scheduledAt?.toISOString() ?? null,
    startedAt: room.startedAt?.toISOString() ?? null,
    endedAt: room.endedAt?.toISOString() ?? null,
    createdAt: room.createdAt.toISOString(),
  };
}

export function toRoomDetailDto(
  room: RoomDoc,
  ctx: {
    yourRole: RoomRole;
    hostName: string;
    participants: RoomParticipantDoc[];
    onlineUserIds: Set<string>;
    snapshotCount: number;
  },
): RoomDetailDto {
  return {
    ...toRoomDto(room, {
      yourRole: ctx.yourRole,
      hostName: ctx.hostName,
      participantCount: ctx.participants.length,
    }),
    participants: ctx.participants.map((p) => toParticipantDto(p, ctx.onlineUserIds)),
    snapshotCount: ctx.snapshotCount,
  };
}

export function toParticipantDto(
  p: RoomParticipantDoc,
  onlineUserIds: Set<string>,
): RoomParticipantDto {
  return {
    id: p._id.toString(),
    userId: p.userId.toString(),
    name: p.displayName,
    role: p.role,
    color: p.color,
    online: onlineUserIds.has(p.userId.toString()),
    joinedAt: p.joinedAt.toISOString(),
    lastSeenAt: p.lastSeenAt?.toISOString() ?? null,
  };
}

export function toChatMessageDto(m: ChatMessageDoc): ChatMessageDto {
  return {
    id: m._id.toString(),
    roomId: m.roomId.toString(),
    type: m.type,
    userId: m.userId?.toString() ?? null,
    authorName: m.authorName,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
  };
}

export function toSnapshotListItemDto(s: CodeSnapshotDoc): CodeSnapshotListItemDto {
  return {
    id: s._id.toString(),
    label: s.label,
    reason: s.reason,
    authorName: s.authorName,
    language: s.language,
    lineCount: s.code.length === 0 ? 0 : s.code.split('\n').length,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toSnapshotDto(s: CodeSnapshotDoc): CodeSnapshotDto {
  return {
    ...toSnapshotListItemDto(s),
    roomId: s.roomId.toString(),
    code: s.code,
  };
}

export function toExecutionDto(e: ExecutionDoc): ExecutionDto {
  return {
    id: e._id.toString(),
    roomId: e.roomId.toString(),
    requestedById: e.requestedById.toString(),
    requestedByName: e.requestedByName,
    language: e.language,
    status: e.status,
    stdout: e.stdout,
    stderr: e.stderr,
    exitCode: e.exitCode,
    timeMs: e.timeMs,
    memoryKb: e.memoryKb,
    createdAt: e.createdAt.toISOString(),
  };
}

export function toActivityDto(a: ActivityEventDoc): ActivityEventDto {
  return {
    id: a._id.toString(),
    roomId: a.roomId.toString(),
    userId: a.userId.toString(),
    authorName: a.authorName,
    type: a.type,
    meta: a.meta,
    at: a.createdAt.toISOString(),
  };
}
