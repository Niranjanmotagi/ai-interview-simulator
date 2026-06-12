import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Resume } from '../src/models';
import { getApp, registerTestUser, SAMPLE_RESUME_TEXT } from './helpers';

/**
 * Binary parsing (pdf-parse/mammoth) is exercised at the unit level by the
 * parser's own dependencies; here we test the service pipeline from parsed
 * text through the AI analysis passes, which is where our logic lives.
 */
async function seedResume(userId: string) {
  return Resume.create({
    userId,
    fileName: 'resume.pdf',
    rawText: SAMPLE_RESUME_TEXT,
    status: 'parsed',
  });
}

describe('Resume analysis pipeline', () => {
  it('analyzes a parsed resume: structured profile + analysis persisted', async () => {
    const user = await registerTestUser();
    const resume = await seedResume(user.userId);

    const res = await request(getApp())
      .post(`/api/v1/resumes/${resume._id.toString()}/analyze`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    const data = res.body.data;
    expect(data.status).toBe('analyzed');
    expect(data.parsedProfile.skills).toContain('TypeScript');
    expect(data.analysis.strengths.length).toBeGreaterThan(0);
    expect(data.analysis.overallScore).toBeGreaterThan(0);
    expect(data.analysis.overallScore).toBeLessThanOrEqual(100);
  });

  it('returns cached analysis on repeat calls (no status churn)', async () => {
    const user = await registerTestUser();
    const resume = await seedResume(user.userId);
    const auth = { Authorization: `Bearer ${user.accessToken}` };

    const first = await request(getApp())
      .post(`/api/v1/resumes/${resume._id.toString()}/analyze`)
      .set(auth)
      .expect(200);
    const second = await request(getApp())
      .post(`/api/v1/resumes/${resume._id.toString()}/analyze`)
      .set(auth)
      .expect(200);
    expect(second.body.data.analysis.overallScore).toBe(first.body.data.analysis.overallScore);
  });

  it('scopes resume access by owner', async () => {
    const owner = await registerTestUser();
    const intruder = await registerTestUser();
    const resume = await seedResume(owner.userId);

    await request(getApp())
      .get(`/api/v1/resumes/${resume._id.toString()}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(404);
  });

  it('rejects uploads without a file', async () => {
    const user = await registerTestUser();
    const res = await request(getApp())
      .post('/api/v1/resumes')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(400);
    expect(res.body.error.message).toMatch(/No file uploaded/);
  });
});
