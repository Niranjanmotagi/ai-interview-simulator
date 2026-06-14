import http from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { io as ioClient, type Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { SOCKET_EVENTS } from '@ai-interview/types';
import { createApp } from '../src/app';
import { attachRealtime } from '../src/realtime/gateway';
import { getApp, registerTestUser } from './helpers';

let server: http.Server;
let io: ReturnType<typeof attachRealtime>;
let port: number;
const sockets: Socket[] = [];

beforeAll(async () => {
  server = http.createServer(createApp());
  io = attachRealtime(server, ['*']);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address();
  port = typeof addr === 'object' && addr ? addr.port : 0;
});

afterAll(async () => {
  for (const s of sockets) {
    s.close();
  }
  await new Promise<void>((resolve) => io.close(() => resolve()));
});

function connect(token: string): Socket {
  const socket = ioClient(`http://localhost:${port}`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  });
  sockets.push(socket);
  return socket;
}

function once<T = unknown>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve as (p: T) => void));
}

function waitFor<T = unknown>(socket: Socket, event: string, pred: (p: T) => boolean): Promise<T> {
  return new Promise((resolve) => {
    const handler = (payload: T) => {
      if (pred(payload)) {
        socket.off(event, handler);
        resolve(payload);
      }
    };
    socket.on(event, handler);
  });
}

async function createRoom(token: string): Promise<{ id: string; inviteCode: string }> {
  const res = await request(getApp())
    .post('/api/v1/rooms')
    .set({ Authorization: `Bearer ${token}` })
    .send({ title: 'Live coding', language: 'javascript' })
    .expect(201);
  return { id: res.body.data.id, inviteCode: res.body.data.inviteCode };
}

describe('Realtime collaboration gateway', () => {
  it('rejects a socket without a valid access token', async () => {
    const socket = connect('not-a-real-jwt');
    const err = await once<Error>(socket, 'connect_error');
    expect(err.message).toBe('UNAUTHORIZED');
  });

  it('syncs presence, chat and Yjs document updates between two participants', async () => {
    const host = await registerTestUser();
    const cand = await registerTestUser();
    const room = await createRoom(host.accessToken);

    // Host joins → receives full room state.
    const hostSocket = connect(host.accessToken);
    await once(hostSocket, 'connect');
    hostSocket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode: room.inviteCode });
    const state = await once<{ room: { yourRole: string }; participants: unknown[]; docState: string }>(
      hostSocket,
      SOCKET_EVENTS.ROOM_STATE,
    );
    expect(state.room.yourRole).toBe('interviewer');
    expect(state.participants.length).toBe(1);
    expect(typeof state.docState).toBe('string');

    // Candidate joins → host observes the presence:join with the candidate role.
    const presenceJoin = once<{ role: string }>(hostSocket, SOCKET_EVENTS.PRESENCE_JOIN);
    const candSocket = connect(cand.accessToken);
    await once(candSocket, 'connect');
    candSocket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode: room.inviteCode });
    await once(candSocket, SOCKET_EVENTS.ROOM_STATE);
    expect((await presenceJoin).role).toBe('candidate');

    // Chat: candidate → host (skip system join messages).
    const chatPromise = waitFor<{ type: string; text: string; authorName: string }>(
      hostSocket,
      SOCKET_EVENTS.CHAT_MESSAGE,
      (m) => m.type === 'user',
    );
    candSocket.emit(SOCKET_EVENTS.CHAT_SEND, { text: 'Shall we start with two-sum?' });
    const chat = await chatPromise;
    expect(chat.text).toBe('Shall we start with two-sum?');
    expect(chat.authorName).toBeTruthy();

    // Collaborative edit: a real Yjs update from host is relayed verbatim to candidate.
    const doc = new Y.Doc();
    doc.getText('monaco').insert(0, 'function solve() {}');
    const update = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
    const docPromise = once<{ update: string; origin: string }>(candSocket, SOCKET_EVENTS.DOC_UPDATE);
    hostSocket.emit(SOCKET_EVENTS.DOC_UPDATE, { update });
    const relayed = await docPromise;
    expect(relayed.update).toBe(update);
    expect(relayed.origin).toBe(hostSocket.id);
  });
});
