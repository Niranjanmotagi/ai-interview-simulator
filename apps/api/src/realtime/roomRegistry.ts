import * as Y from 'yjs';
import type { PresenceUser, RoomLanguage } from '@ai-interview/types';
import { CodeSnapshot, Room } from '../models';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * In-memory authoritative state for *currently active* rooms.
 *
 * Each live room owns a Yjs document (the CRDT shared by all editors). The
 * server is a relay + the single source of truth for late joiners: a new socket
 * receives `Y.encodeStateAsUpdate(doc)` and is instantly consistent.
 *
 * Durability: the encoded state is debounce-persisted to Mongo (`Room.docState`)
 * plus a denormalized plain-text copy (`Room.currentCode`), and the content is
 * periodically auto-snapshotted for the interview recording. On a cold start the
 * doc is rehydrated from `Room.docState`.
 *
 * Scaling note: this is single-instance authoritative. To run N API replicas,
 * add the Socket.IO Redis adapter for fan-out and pin each room to one instance
 * (consistent hashing) or move the doc into y-redis — the gateway interface here
 * does not change. See docs/ARCHITECTURE.md.
 */

const TEXT_KEY = 'monaco';

interface LiveRoom {
  roomId: string;
  doc: Y.Doc;
  language: RoomLanguage;
  members: Map<string, PresenceUser>; // socketId -> presence
  dirty: boolean;
  persistTimer: NodeJS.Timeout | null;
  lastSnapshotText: string;
  lastSnapshotAt: number;
}

const liveRooms = new Map<string, LiveRoom>();

function getText(live: LiveRoom): string {
  return live.doc.getText(TEXT_KEY).toString();
}

export function ensureLiveRoom(
  roomId: string,
  language: RoomLanguage,
  docState: Buffer | null,
): void {
  if (liveRooms.has(roomId)) {
    return;
  }
  const doc = new Y.Doc();
  if (docState && docState.length > 0) {
    Y.applyUpdate(doc, new Uint8Array(docState));
  }
  liveRooms.set(roomId, {
    roomId,
    doc,
    language,
    members: new Map(),
    dirty: false,
    persistTimer: null,
    lastSnapshotText: docState ? doc.getText(TEXT_KEY).toString() : '',
    lastSnapshotAt: Date.now(),
  });
}

export function addMember(roomId: string, member: PresenceUser): void {
  liveRooms.get(roomId)?.members.set(member.socketId, member);
}

export function removeMember(
  roomId: string,
  socketId: string,
): { member: PresenceUser | null; remaining: number } {
  const live = liveRooms.get(roomId);
  if (!live) {
    return { member: null, remaining: 0 };
  }
  const member = live.members.get(socketId) ?? null;
  live.members.delete(socketId);
  return { member, remaining: live.members.size };
}

export function presenceFor(roomId: string): PresenceUser[] {
  return [...(liveRooms.get(roomId)?.members.values() ?? [])];
}

/** Distinct user ids currently connected — powers the REST detail `online` flag. */
export function getOnlineUserIds(roomId: string): Set<string> {
  const ids = new Set<string>();
  for (const m of liveRooms.get(roomId)?.members.values() ?? []) {
    ids.add(m.userId);
  }
  return ids;
}

export function setLanguage(roomId: string, language: RoomLanguage): void {
  const live = liveRooms.get(roomId);
  if (live) {
    live.language = language;
  }
}

export function getLanguage(roomId: string): RoomLanguage | null {
  return liveRooms.get(roomId)?.language ?? null;
}

export function applyDocUpdate(roomId: string, update: Uint8Array): void {
  const live = liveRooms.get(roomId);
  if (!live) {
    return;
  }
  Y.applyUpdate(live.doc, update);
  markDirty(live);
}

/** Full document state for a late joiner, base64-encoded for a JSON-safe frame. */
export function encodeStateBase64(roomId: string): string | null {
  const live = liveRooms.get(roomId);
  if (!live) {
    return null;
  }
  return Buffer.from(Y.encodeStateAsUpdate(live.doc)).toString('base64');
}

export function getRoomText(roomId: string): string {
  const live = liveRooms.get(roomId);
  return live ? getText(live) : '';
}

function markDirty(live: LiveRoom): void {
  live.dirty = true;
  if (live.persistTimer) {
    return;
  }
  live.persistTimer = setTimeout(() => {
    void persist(live);
  }, env.REALTIME_PERSIST_DEBOUNCE_MS);
  live.persistTimer.unref?.();
}

async function persist(live: LiveRoom): Promise<void> {
  if (live.persistTimer) {
    clearTimeout(live.persistTimer);
    live.persistTimer = null;
  }
  if (!live.dirty) {
    return;
  }
  live.dirty = false;

  const code = getText(live);
  try {
    await Room.updateOne(
      { _id: live.roomId },
      { $set: { docState: Buffer.from(Y.encodeStateAsUpdate(live.doc)), currentCode: code } },
    );
    await maybeAutoSnapshot(live, code);
  } catch (err) {
    logger.error({ err, roomId: live.roomId }, 'Failed to persist room doc');
    live.dirty = true; // retry on the next update
  }
}

async function maybeAutoSnapshot(live: LiveRoom, code: string): Promise<void> {
  const changed = code.trim().length > 0 && code !== live.lastSnapshotText;
  const due = Date.now() - live.lastSnapshotAt >= env.REALTIME_AUTOSNAPSHOT_MS;
  if (!changed || !due) {
    return;
  }
  live.lastSnapshotText = code;
  live.lastSnapshotAt = Date.now();
  await CodeSnapshot.create({
    roomId: live.roomId,
    authorId: null,
    authorName: 'Auto-save',
    language: live.language,
    code,
    label: `Auto snapshot · ${new Date().toISOString()}`,
    reason: 'auto',
  });
}

/** Persist + drop a room from memory once the last participant leaves. */
export async function flushAndEvict(roomId: string): Promise<void> {
  const live = liveRooms.get(roomId);
  if (!live) {
    return;
  }
  await persist(live);
  live.doc.destroy();
  liveRooms.delete(roomId);
}

/** Graceful-shutdown hook: flush every live room. */
export async function flushAll(): Promise<void> {
  await Promise.all([...liveRooms.keys()].map((id) => flushAndEvict(id)));
}
