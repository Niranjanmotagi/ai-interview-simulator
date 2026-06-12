import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { getApp, registerTestUser, STRONG_ANSWER, WEAK_ANSWER } from './helpers';

const CONFIG = {
  targetRole: 'Backend Engineer',
  difficulty: 'medium',
  roundType: 'behavioral',
  questionCount: 3,
};

async function createSession(token: string) {
  const res = await request(getApp())
    .post('/api/v1/interviews')
    .set('Authorization', `Bearer ${token}`)
    .send(CONFIG)
    .expect(201);
  return res.body.data;
}

describe('Interview engine (mock AI provider)', () => {
  it('runs the full loop: create → answer all → complete → summary + plan', async () => {
    const user = await registerTestUser();
    const auth = { Authorization: `Bearer ${user.accessToken}` };

    const session = await createSession(user.accessToken);
    expect(session.status).toBe('created');
    expect(session.questions.length).toBe(3);
    expect(session.questions[0].text.length).toBeGreaterThan(10);

    // Answer every question (strong answers → no follow-ups expected).
    let guard = 0;
    for (;;) {
      const next = await request(getApp())
        .get(`/api/v1/interviews/${session.id}/next`)
        .set(auth)
        .expect(200);
      if (next.body.data.done) {
        break;
      }
      const submit = await request(getApp())
        .post(`/api/v1/interviews/${session.id}/answers`)
        .set(auth)
        .send({ questionId: next.body.data.question.id, text: STRONG_ANSWER })
        .expect(201);

      const { evaluation } = submit.body.data;
      expect(evaluation.overallScore).toBeGreaterThanOrEqual(5);
      expect(evaluation.rubric.structure).toBeGreaterThan(0);
      expect(evaluation.modelAnswer.length).toBeGreaterThan(20);

      guard += 1;
      if (guard > 10) {
        throw new Error('Interview loop did not terminate');
      }
    }

    const complete = await request(getApp())
      .post(`/api/v1/interviews/${session.id}/complete`)
      .set(auth)
      .expect(200);

    const { summary, plan, evaluations } = complete.body.data;
    expect(summary.aggregateScore).toBeGreaterThan(0);
    expect(summary.narrative.length).toBeGreaterThan(50);
    expect(summary.topWeaknesses.length).toBeGreaterThan(0);
    expect(plan.items.length).toBeGreaterThan(0);
    expect(plan.items.some((i: { priority: string }) => i.priority === 'high')).toBe(true);
    expect(evaluations.length).toBe(3);

    // Summary endpoint returns the same data afterwards.
    const summaryRes = await request(getApp())
      .get(`/api/v1/interviews/${session.id}/summary`)
      .set(auth)
      .expect(200);
    expect(summaryRes.body.data.summary.id).toBe(summary.id);
  });

  it('inserts an adaptive follow-up after a weak answer', async () => {
    const user = await registerTestUser();
    const auth = { Authorization: `Bearer ${user.accessToken}` };
    const session = await createSession(user.accessToken);

    const next = await request(getApp())
      .get(`/api/v1/interviews/${session.id}/next`)
      .set(auth)
      .expect(200);

    const submit = await request(getApp())
      .post(`/api/v1/interviews/${session.id}/answers`)
      .set(auth)
      .send({ questionId: next.body.data.question.id, text: WEAK_ANSWER })
      .expect(201);

    expect(submit.body.data.evaluation.overallScore).toBeLessThan(5);
    expect(submit.body.data.followUp).not.toBeNull();
    expect(submit.body.data.followUp.type).toBe('followup');
    // The follow-up becomes the next question.
    expect(submit.body.data.next.question.id).toBe(submit.body.data.followUp.id);
    // Total grew by one.
    expect(submit.body.data.next.progress.total).toBe(4);
  });

  it('rejects answering the same question twice', async () => {
    const user = await registerTestUser();
    const auth = { Authorization: `Bearer ${user.accessToken}` };
    const session = await createSession(user.accessToken);
    const questionId = session.questions[0].id;

    await request(getApp())
      .post(`/api/v1/interviews/${session.id}/answers`)
      .set(auth)
      .send({ questionId, text: STRONG_ANSWER })
      .expect(201);

    const dup = await request(getApp())
      .post(`/api/v1/interviews/${session.id}/answers`)
      .set(auth)
      .send({ questionId, text: STRONG_ANSWER })
      .expect(409);
    expect(dup.body.error.code).toBe('ALREADY_ANSWERED');
  });

  it('enforces the free-tier monthly quota server-side', async () => {
    const user = await registerTestUser();
    for (let i = 0; i < 3; i++) {
      await createSession(user.accessToken);
    }
    const res = await request(getApp())
      .post('/api/v1/interviews')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(CONFIG)
      .expect(403);
    expect(res.body.error.code).toBe('QUOTA_EXCEEDED');
  });

  it('blocks access to another user’s session', async () => {
    const owner = await registerTestUser();
    const intruder = await registerTestUser();
    const session = await createSession(owner.accessToken);

    await request(getApp())
      .get(`/api/v1/interviews/${session.id}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(404); // ownership scoping returns not-found, never leaking existence
  });
});
