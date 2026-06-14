import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { getApp, registerTestUser } from './helpers';

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function createRoom(token: string, language = 'python') {
  const res = await request(getApp())
    .post('/api/v1/rooms')
    .set(auth(token))
    .send({ title: 'Exec room', language })
    .expect(201);
  return res.body.data;
}

describe('Code execution (mock executor)', () => {
  it('runs code and records a successful execution', async () => {
    const host = await registerTestUser();
    const room = await createRoom(host.accessToken);

    const res = await request(getApp())
      .post(`/api/v1/rooms/${room.id}/run`)
      .set(auth(host.accessToken))
      .send({ language: 'python', code: 'print("hi")', stdin: '42' })
      .expect(201);

    const exec = res.body.data;
    expect(exec.status).toBe('success');
    expect(exec.stdout).toContain('mock');
    expect(exec.stdout).toContain('42'); // stdin echoed
    expect(exec.exitCode).toBe(0);
    expect(exec.requestedByName).toBeTruthy();
  });

  it('reports a timeout for an obvious infinite loop', async () => {
    const host = await registerTestUser();
    const room = await createRoom(host.accessToken);

    const res = await request(getApp())
      .post(`/api/v1/rooms/${room.id}/run`)
      .set(auth(host.accessToken))
      .send({ language: 'python', code: 'while True:\n  pass' })
      .expect(201);

    expect(res.body.data.status).toBe('timeout');
  });

  it('records each run in the execution history (newest first) and as a run activity', async () => {
    const host = await registerTestUser();
    const room = await createRoom(host.accessToken);

    await request(getApp())
      .post(`/api/v1/rooms/${room.id}/run`)
      .set(auth(host.accessToken))
      .send({ language: 'python', code: 'print(1)' })
      .expect(201);
    await request(getApp())
      .post(`/api/v1/rooms/${room.id}/run`)
      .set(auth(host.accessToken))
      .send({ language: 'python', code: 'print(2)' })
      .expect(201);

    const history = await request(getApp())
      .get(`/api/v1/rooms/${room.id}/executions`)
      .set(auth(host.accessToken))
      .expect(200);
    expect(history.body.data.items.length).toBe(2);

    const activity = await request(getApp())
      .get(`/api/v1/rooms/${room.id}/activity`)
      .set(auth(host.accessToken))
      .expect(200);
    expect(activity.body.data.items.filter((a: { type: string }) => a.type === 'run').length).toBe(2);
  });

  it('lets a joined candidate run, but blocks non-members', async () => {
    const host = await registerTestUser();
    const candidate = await registerTestUser();
    const stranger = await registerTestUser();
    const room = await createRoom(host.accessToken);
    await request(getApp())
      .post(`/api/v1/rooms/join/${room.inviteCode}`)
      .set(auth(candidate.accessToken))
      .expect(200);

    await request(getApp())
      .post(`/api/v1/rooms/${room.id}/run`)
      .set(auth(candidate.accessToken))
      .send({ language: 'python', code: 'print(1)' })
      .expect(201);

    await request(getApp())
      .post(`/api/v1/rooms/${room.id}/run`)
      .set(auth(stranger.accessToken))
      .send({ language: 'python', code: 'print(1)' })
      .expect(404); // ownership scoping: not a member
  });

  it('fetches a single execution by id', async () => {
    const host = await registerTestUser();
    const room = await createRoom(host.accessToken);
    const run = await request(getApp())
      .post(`/api/v1/rooms/${room.id}/run`)
      .set(auth(host.accessToken))
      .send({ language: 'javascript', code: 'console.log(1)' })
      .expect(201);

    const detail = await request(getApp())
      .get(`/api/v1/rooms/${room.id}/executions/${run.body.data.id}`)
      .set(auth(host.accessToken))
      .expect(200);
    expect(detail.body.data.id).toBe(run.body.data.id);
    expect(detail.body.data.language).toBe('javascript');
  });
});
