'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import * as Y from 'yjs';
import {
  SOCKET_EVENTS,
  type ActivityEventDto,
  type ActivityType,
  type AwarenessEvent,
  type ChatMessageDto,
  type CodeSnapshotListItemDto,
  type EditorPosition,
  type EditorSelection,
  type PresenceUser,
  type RoomDto,
  type RoomLanguage,
  type RoomRole,
  type RoomStateEvent,
} from '@ai-interview/types';
import { getAccessToken, refreshSession } from './api';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:4000'
    : '');

const toB64 = (u: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < u.length; i += 1) {
    s += String.fromCharCode(u[i] as number);
  }
  return btoa(s);
};

const fromB64 = (b: string): Uint8Array => {
  const bin = atob(b);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    u[i] = bin.charCodeAt(i);
  }
  return u;
};

export type RoomConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error' | 'ended';

export interface TypingUser {
  socketId: string;
  name: string;
}

export interface UseRoomResult {
  status: RoomConnectionStatus;
  errorMessage: string | null;
  ydoc: Y.Doc;
  room: RoomDto | null;
  language: RoomLanguage;
  yourRole: RoomRole;
  selfSocketId: string | null;
  presence: PresenceUser[];
  remoteCursors: Map<string, AwarenessEvent>;
  messages: ChatMessageDto[];
  typingUsers: TypingUser[];
  activity: ActivityEventDto[];
  snapshotJustCreated: CodeSnapshotListItemDto | null;
  sendChat: (text: string) => void;
  sendTyping: (isTyping: boolean) => void;
  sendAwareness: (cursor: EditorPosition | null, selection: EditorSelection | null) => void;
  changeLanguage: (language: RoomLanguage) => void;
  createSnapshot: (label?: string) => void;
  reportActivity: (type: ActivityType, meta?: Record<string, unknown>) => void;
}

/**
 * Connects to a CodeSync room: a single Socket.IO connection carrying the Yjs
 * CRDT (text), presence, awareness (remote cursors), chat, typing, and activity
 * monitoring. The Yjs document is the source of truth for the editor; this hook
 * relays its updates and applies remote ones with a `'remote'` origin so the
 * outgoing-update observer never echoes.
 */
export function useRoom(roomCode: string): UseRoomResult {
  const ydocRef = useRef<Y.Doc>(null as unknown as Y.Doc);
  if (ydocRef.current === null) {
    ydocRef.current = new Y.Doc();
  }
  const socketRef = useRef<Socket | null>(null);

  const [status, setStatus] = useState<RoomConnectionStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDto | null>(null);
  const [language, setLanguage] = useState<RoomLanguage>('javascript');
  const [yourRole, setYourRole] = useState<RoomRole>('observer');
  const [selfSocketId, setSelfSocketId] = useState<string | null>(null);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, AwarenessEvent>>(new Map());
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [activity, setActivity] = useState<ActivityEventDto[]>([]);
  const [snapshotJustCreated, setSnapshotJustCreated] = useState<CodeSnapshotListItemDto | null>(null);

  useEffect(() => {
    const ydoc = ydocRef.current;
    let disposed = false;
    let socket: Socket;

    const onDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote' || !socketRef.current) {
        return; // never re-emit updates we received from the network
      }
      socketRef.current.emit(SOCKET_EVENTS.DOC_UPDATE, { update: toB64(update) });
    };

    void (async () => {
      let token = getAccessToken();
      if (!token) {
        await refreshSession();
        token = getAccessToken();
      }
      if (disposed) {
        return;
      }

      socket = io(SOCKET_URL || undefined, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 6,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setSelfSocketId(socket.id ?? null);
        setStatus('connecting');
        socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode });
      });

      socket.on('connect_error', (err: Error) => {
        setStatus('error');
        setErrorMessage(err.message === 'UNAUTHORIZED' ? 'Your session expired — please sign in again.' : 'Connection failed.');
      });

      socket.io.on('reconnect_attempt', () => setStatus('reconnecting'));

      socket.on(SOCKET_EVENTS.ROOM_STATE, (state: RoomStateEvent) => {
        if (state.docState) {
          Y.applyUpdate(ydoc, fromB64(state.docState), 'remote');
        }
        setRoom(state.room);
        setLanguage(state.language);
        setYourRole(state.room.yourRole);
        setPresence(state.presence);
        setMessages(state.recentMessages);
        setStatus('connected');
      });

      socket.on(SOCKET_EVENTS.DOC_UPDATE, (payload: { update: string }) => {
        Y.applyUpdate(ydoc, fromB64(payload.update), 'remote');
      });

      socket.on(SOCKET_EVENTS.PRESENCE_LIST, (list: PresenceUser[]) => setPresence(list));

      socket.on(SOCKET_EVENTS.PRESENCE_LEAVE, ({ socketId }: { socketId: string }) => {
        setRemoteCursors((prev) => {
          if (!prev.has(socketId)) {
            return prev;
          }
          const next = new Map(prev);
          next.delete(socketId);
          return next;
        });
        setTypingUsers((prev) => prev.filter((t) => t.socketId !== socketId));
      });

      socket.on(SOCKET_EVENTS.AWARENESS_UPDATE, (evt: AwarenessEvent) => {
        setRemoteCursors((prev) => {
          const next = new Map(prev);
          next.set(evt.socketId, evt);
          return next;
        });
      });

      socket.on(SOCKET_EVENTS.TYPING, (evt: { socketId: string; name: string; isTyping: boolean }) => {
        setTypingUsers((prev) => {
          const without = prev.filter((t) => t.socketId !== evt.socketId);
          return evt.isTyping ? [...without, { socketId: evt.socketId, name: evt.name }] : without;
        });
      });

      socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg: ChatMessageDto) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on(SOCKET_EVENTS.ACTIVITY, (evt: ActivityEventDto) => {
        setActivity((prev) => [evt, ...prev].slice(0, 100));
      });

      socket.on(SOCKET_EVENTS.LANGUAGE_CHANGED, ({ language: lang }: { language: RoomLanguage }) => {
        setLanguage(lang);
      });

      socket.on(SOCKET_EVENTS.SNAPSHOT_CREATED, (snap: CodeSnapshotListItemDto) => {
        setSnapshotJustCreated(snap);
      });

      socket.on(SOCKET_EVENTS.ROOM_ENDED, () => setStatus('ended'));

      socket.on(SOCKET_EVENTS.ERROR, (e: { code: string; message: string }) => {
        setErrorMessage(e.message);
        if (e.code === 'ROOM_ENDED') {
          setStatus('ended');
        } else {
          // A failure before we ever synced (e.g. join rejected) shouldn't sit on
          // "connecting" forever; a transient error mid-session keeps us connected.
          setStatus((prev) => (prev === 'connected' ? prev : 'error'));
        }
      });

      ydoc.on('update', onDocUpdate);
    })();

    return () => {
      disposed = true;
      ydoc.off('update', onDocUpdate);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [roomCode]);

  // NB: we intentionally do NOT destroy the Yjs doc on unmount. React StrictMode
  // (dev) double-invokes effects, which would destroy the live doc between the two
  // mounts and leave the editor bound to a dead document. The doc holds no native
  // resources — it is reclaimed by GC when the component is gone.

  // Window/tab integrity signals for candidate activity monitoring.
  useEffect(() => {
    const emit = (type: ActivityType) => socketRef.current?.emit(SOCKET_EVENTS.ACTIVITY, { type });
    const onVisibility = () => emit(document.hidden ? 'tab_hidden' : 'tab_visible');
    const onBlur = () => emit('window_blur');
    const onFocus = () => emit('window_focus');
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const sendChat = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed) {
      socketRef.current?.emit(SOCKET_EVENTS.CHAT_SEND, { text: trimmed });
    }
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    socketRef.current?.emit(SOCKET_EVENTS.TYPING, { isTyping });
  }, []);

  const sendAwareness = useCallback(
    (cursor: EditorPosition | null, selection: EditorSelection | null) => {
      socketRef.current?.emit(SOCKET_EVENTS.AWARENESS_UPDATE, { cursor, selection });
    },
    [],
  );

  const changeLanguage = useCallback((lang: RoomLanguage) => {
    socketRef.current?.emit(SOCKET_EVENTS.LANGUAGE_CHANGE, { language: lang });
  }, []);

  const createSnapshot = useCallback((label?: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.SNAPSHOT_CREATE, { label });
  }, []);

  const reportActivity = useCallback((type: ActivityType, meta?: Record<string, unknown>) => {
    socketRef.current?.emit(SOCKET_EVENTS.ACTIVITY, { type, meta });
  }, []);

  return {
    status,
    errorMessage,
    ydoc: ydocRef.current,
    room,
    language,
    yourRole,
    selfSocketId,
    presence,
    remoteCursors,
    messages,
    typingUsers,
    activity,
    snapshotJustCreated,
    sendChat,
    sendTyping,
    sendAwareness,
    changeLanguage,
    createSnapshot,
    reportActivity,
  };
}
