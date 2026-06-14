import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { getApp, registerTestUser } from './helpers';

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function createRoom(token: string, overrides: Record<string, unknown> = {}) {
  const res = await request(getApp())
    .post('/api/v1/rooms')
    .set(auth(token))
    .send({ title: 'System Design Round', language: 'python', ...overrides })
    .expect(201);
  return res.body.data;
}

describe('Rooms REST', () => {
  it('creates a room with the creator as interviewer and a unique invite code', async () => {
    const host = await registerTestUser();
    const room = await createRoom(host.accessToken);
    expect(room.yourRole).toBe('interviewer');
    expect(room.status).toBe('scheduled');
    expect(room.inviteCode).toMatch(/^[2-9A-Z]{8}$/);
    expect(room.participantCount).toBe(1);
  });

  it('lets a second user join by code as a candidate', async () => {
    const host = await registerTestUser();
    const cand = await registerTestUser();
    const room = await createRoom(host.accessToken);

    const joined = await request(getApp())
      .post(`/api/v1/rooms/join/${room.inviteCode}`)
      .set(auth(cand.accessToken))
      .expect(200);
    expect(joined.body.data.yourRole).toBe('candidate');
    expect(joined.body.data.participantCount).toBe(2);

    const detail = await request(getApp())
      .get(`/api/v1/rooms/${room.id}`)
      .set(auth(host.accessToken))
      .expect(200);
    expect(detail.body.data.participants.length).toBe(2);
    const roles = detail.body.data.participants.map((p: { role: string }) => p.role).sort();
    expect(roles).toEqual(['candidate', 'interviewer']);
  });

  it('joining is idempotent — re-joining keeps a single membership', async () => {
    const host = await registerTestUser();
    const cand = await registerTestUser();
    const room = await createRoom(host.accessToken);
    await request(getApp()).post(`/api/v1/rooms/join/${room.inviteCode}`).set(auth(cand.accessToken)).expect(200);
    const again = await request(getApp())
      .post(`/api/v1/rooms/join/${room.inviteCode}`)
      .set(auth(cand.accessToken))
      .expect(200);
    expect(again.body.data.participantCount).toBe(2);
  });

  it('hides room existence from non-members (404, not 403)', async () => {
    const host = await registerTestUser();
    const stranger = await registerTestUser();
    const room = await createRoom(host.accessToken);
    await request(getApp())
      .get(`/api/v1/rooms/${room.id}`)
      .set(auth(stranger.accessToken))
      .expect(404);
  });

  it('only the interviewer can end the room, and ending writes a final snapshot', async () => {
    const host = await registerTestUser();
    const cand = await registerTestUser();
    const room = await createRoom(host.accessToken);
    await request(getApp()).post(`/api/v1/rooms/join/${room.inviteCode}`).set(auth(cand.accessToken)).expect(200);

    // Candidate is a member but not the host → 403.
    await request(getApp()).post(`/api/v1/rooms/${room.id}/end`).set(auth(cand.accessToken)).expect(403);

    const ended = await request(getApp())
      .post(`/api/v1/rooms/${room.id}/end`)
      .set(auth(host.accessToken))
      .expect(200);
    expect(ended.body.data.status).toBe('ended');

    const snaps = await request(getApp())
      .get(`/api/v1/rooms/${room.id}/snapshots`)
      .set(auth(host.accessToken))
      .expect(200);
    expect(snaps.body.data.items.some((s: { reason: string }) => s.reason === 'room_end')).toBe(true);
  });

  it('rejects joining an ended room', async () => {
    const host = await registerTestUser();
    const cand = await registerTestUser();
    const room = await createRoom(host.accessToken);
    await request(getApp()).post(`/api/v1/rooms/${room.id}/end`).set(auth(host.accessToken)).expect(200);

    const res = await request(getApp())
      .post(`/api/v1/rooms/join/${room.inviteCode}`)
      .set(auth(cand.accessToken))
      .expect(409);
    expect(res.body.error.code).toBe('ROOM_ENDED');
  });

  it('activity monitoring is interviewer-only', async () => {
    const host = await registerTestUser();
    const cand = await registerTestUser();
    const room = await createRoom(host.accessToken);
    await request(getApp()).post(`/api/v1/rooms/join/${room.inviteCode}`).set(auth(cand.accessToken)).expect(200);

    await request(getApp()).get(`/api/v1/rooms/${room.id}/activity`).set(auth(cand.accessToken)).expect(403);
    await request(getApp()).get(`/api/v1/rooms/${room.id}/activity`).set(auth(host.accessToken)).expect(200);
  });

  it('lists only rooms the caller participates in', async () => {
    const a = await registerTestUser();
    const b = await registerTestUser();
    await createRoom(a.accessToken, { title: 'A room' });
    await createRoom(b.accessToken, { title: 'B room' });

    const listA = await request(getApp()).get('/api/v1/rooms').set(auth(a.accessToken)).expect(200);
    expect(listA.body.data.items.length).toBe(1);
    expect(listA.body.data.items[0].title).toBe('A room');
  });

  it('cascades deletes and rejects unknown rooms afterwards', async () => {
    const host = await registerTestUser();
    const room = await createRoom(host.accessToken);
    await request(getApp()).delete(`/api/v1/rooms/${room.id}`).set(auth(host.accessToken)).expect(200);
    await request(getApp()).get(`/api/v1/rooms/${room.id}`).set(auth(host.accessToken)).expect(404);
  });

  it('rejects invalid create payloads', async () => {
    const host = await registerTestUser();
    await request(getApp())
      .post('/api/v1/rooms')
      .set(auth(host.accessToken))
      .send({ title: '', language: 'cobol' })
      .expect(400);
  });
});
