import type { Request, Response } from 'express';
import { sendSuccess, buildPaginated } from '../../utils/respond';
import { getAuth } from '../../middleware/auth';
import { getOnlineUserIds } from '../../realtime/roomRegistry';
import * as service from './room.service';
import {
  toActivityDto,
  toChatMessageDto,
  toRoomDetailDto,
  toRoomDto,
  toSnapshotDto,
  toSnapshotListItemDto,
} from './room.mapper';

export async function create(req: Request, res: Response): Promise<void> {
  const { room, participant } = await service.createRoom(getAuth(req).sub, req.body);
  sendSuccess(
    res,
    toRoomDto(room, { yourRole: participant.role, hostName: participant.displayName, participantCount: 1 }),
    201,
  );
}

export async function list(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const { rows, total } = await service.listRooms(getAuth(req).sub, page, limit);
  const items = rows.map((r) =>
    toRoomDto(r.room, {
      yourRole: r.yourRole,
      hostName: r.hostName,
      participantCount: r.participantCount,
    }),
  );
  sendSuccess(res, buildPaginated(items, total, page, limit));
}

export async function detail(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const d = await service.getRoomDetail(getAuth(req).sub, id);
  sendSuccess(
    res,
    toRoomDetailDto(d.room, {
      yourRole: d.participant.role,
      hostName: d.hostName,
      participants: d.participants,
      onlineUserIds: getOnlineUserIds(id),
      snapshotCount: d.snapshotCount,
    }),
  );
}

export async function join(req: Request, res: Response): Promise<void> {
  const { room, participant } = await service.joinRoomByCode(
    getAuth(req).sub,
    req.params.code as string,
  );
  const count = (await service.getRoomDetail(getAuth(req).sub, room._id.toString())).participants
    .length;
  sendSuccess(
    res,
    toRoomDto(room, {
      yourRole: participant.role,
      hostName: room.hostId.toString() === participant.userId.toString() ? participant.displayName : '',
      participantCount: count,
    }),
  );
}

export async function end(req: Request, res: Response): Promise<void> {
  const userId = getAuth(req).sub;
  const id = req.params.id as string;
  const room = await service.endRoom(userId, id);
  const d = await service.getRoomDetail(userId, id);
  sendSuccess(
    res,
    toRoomDto(room, {
      yourRole: d.participant.role,
      hostName: d.hostName,
      participantCount: d.participants.length,
    }),
  );
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.deleteRoom(getAuth(req).sub, req.params.id as string);
  sendSuccess(res, { deleted: true });
}

export async function messages(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 50);
  const { messages: rows, total } = await service.listMessages(
    getAuth(req).sub,
    req.params.id as string,
    page,
    limit,
  );
  sendSuccess(res, buildPaginated(rows.map(toChatMessageDto), total, page, limit));
}

export async function snapshots(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 50);
  const { snapshots: rows, total } = await service.listSnapshots(
    getAuth(req).sub,
    req.params.id as string,
    page,
    limit,
  );
  sendSuccess(res, buildPaginated(rows.map(toSnapshotListItemDto), total, page, limit));
}

export async function snapshotDetail(req: Request, res: Response): Promise<void> {
  const snap = await service.getSnapshot(
    getAuth(req).sub,
    req.params.id as string,
    req.params.snapId as string,
  );
  sendSuccess(res, toSnapshotDto(snap));
}

export async function activity(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 50);
  const { events, total } = await service.listActivity(
    getAuth(req).sub,
    req.params.id as string,
    page,
    limit,
  );
  sendSuccess(res, buildPaginated(events.map(toActivityDto), total, page, limit));
}
