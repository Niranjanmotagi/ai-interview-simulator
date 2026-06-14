import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { getApp, registerTestUser } from './helpers';

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function createRoom(token: string, language = 'python') {
  const res = await request(getApp())
    .post('/api/v1/rooms')
    .set(auth(token))
    .send({ title: 'AI room', language })
    .expect(201);
  return res.body.data;
}

const NESTED_LOOP_CODE = 'for i in range(n):\n  for j in range(n):\n    if a[i]+a[j]==t: return [i,j]';
const MAP_CODE = 'def two_sum(nums, t):\n  seen = {}\n  for i,n in enumerate(nums):\n    if t-n in seen: return [seen[t-n], i]\n    seen[n]=i';

describe('AI interview assistant (mock provider)', () => {
  it('lets the interviewer generate a question and sets it as the room problem', async () => {
    const host = await registerTestUser();
    const room = await createRoom(host.accessToken);

    const res = await request(getApp())
      .post(`/api/v1/rooms/${room.id}/ai/question`)
      .set(auth(host.accessToken))
      .send({ difficulty: 'easy' })
      .expect(201);

    expect(res.body.data.title).toBeTruthy();
    expect(res.body.data.difficulty).toBe('easy');
    expect(res.body.data.examples.length).toBeGreaterThan(0);

    const detail = await request(getApp())
      .get(`/api/v1/rooms/${room.id}`)
      .set(auth(host.accessToken))
      .expect(200);
    expect(detail.body.data.problemPrompt).toContain(res.body.data.title);
  });

  it('blocks a candidate from generating a question or evaluating', async () => {
    const host = await registerTestUser();
    const cand = await registerTestUser();
    const room = await createRoom(host.accessToken);
    await request(getApp()).post(`/api/v1/rooms/join/${room.inviteCode}`).set(auth(cand.accessToken)).expect(200);

    await request(getApp())
      .post(`/api/v1/rooms/${room.id}/ai/question`)
      .set(auth(cand.accessToken))
      .send({ difficulty: 'easy' })
      .expect(403);
    await request(getApp())
      .post(`/api/v1/rooms/${room.id}/ai/evaluate`)
      .set(auth(cand.accessToken))
      .send({ language: 'python', code: MAP_CODE })
      .expect(403);
  });

  it('returns a non-spoiler hint, nudging away from nested loops', async () => {
    const host = await registerTestUser();
    const room = await createRoom(host.accessToken);
    const res = await request(getApp())
      .post(`/api/v1/rooms/${room.id}/ai/hint`)
      .set(auth(host.accessToken))
      .send({ language: 'python', code: NESTED_LOOP_CODE })
      .expect(200);
    expect(res.body.data.hint).toMatch(/hash map/i);
  });

  it('explains code and estimates complexity', async () => {
    const host = await registerTestUser();
    const room = await createRoom(host.accessToken);
    const res = await request(getApp())
      .post(`/api/v1/rooms/${room.id}/ai/explain`)
      .set(auth(host.accessToken))
      .send({ language: 'python', code: MAP_CODE })
      .expect(200);
    expect(res.body.data.explanation.length).toBeGreaterThan(20);
    expect(res.body.data.complexity.time).toBe('O(n)');
  });

  it('evaluates a submission into a stored report (interviewer)', async () => {
    const host = await registerTestUser();
    const room = await createRoom(host.accessToken);

    const res = await request(getApp())
      .post(`/api/v1/rooms/${room.id}/ai/evaluate`)
      .set(auth(host.accessToken))
      .send({ language: 'python', code: MAP_CODE })
      .expect(201);

    const r = res.body.data;
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.timeComplexity).toBe('O(n)');
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.verdict.length).toBeGreaterThan(10);

    const list = await request(getApp())
      .get(`/api/v1/rooms/${room.id}/ai/reports`)
      .set(auth(host.accessToken))
      .expect(200);
    expect(list.body.data.items.length).toBe(1);
    expect(list.body.data.items[0].id).toBe(r.id);
  });
});
