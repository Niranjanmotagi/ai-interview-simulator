import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';

let app: Express | null = null;

export function getApp(): Express {
  if (!app) {
    app = createApp();
  }
  return app;
}

export interface TestUser {
  accessToken: string;
  refreshCookie: string;
  userId: string;
  email: string;
}

let counter = 0;

export async function registerTestUser(overrides: Partial<{ email: string }> = {}): Promise<TestUser> {
  counter += 1;
  const email = overrides.email ?? `user${counter}-${Date.now()}@example.com`;
  const res = await request(getApp())
    .post('/api/v1/auth/register')
    .send({ name: 'Test User', email, password: 'Password123' })
    .expect(201);

  const cookies = res.headers['set-cookie'];
  const refreshCookie = extractRefreshCookie(cookies);
  return {
    accessToken: res.body.data.accessToken,
    refreshCookie,
    userId: res.body.data.user.id,
    email,
  };
}

export function extractRefreshCookie(setCookie: string | string[] | undefined): string {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const cookie = list.find((c) => c.startsWith('aiis_refresh='));
  if (!cookie) {
    throw new Error('Refresh cookie not set');
  }
  return cookie.split(';')[0]!;
}

export const SAMPLE_RESUME_TEXT = [
  'Niranjan Example — Software Engineer',
  'Skills: TypeScript, React, Node.js, Express, MongoDB, Docker, AWS',
  'Experience: Software Engineer at Acme Corp (2022 – Present).',
  'Built REST APIs serving 50k requests/day, reduced p95 latency by 35%.',
  'Led migration to TypeScript across 12 services with zero downtime.',
  'Education: B.Tech Computer Science, 2022.',
  'Projects: AI Interview Simulator — full-stack mock interview platform.',
].join('\n');

export const STRONG_ANSWER =
  'In my previous role the situation was that our checkout API was timing out during peak sales. ' +
  'My task was to find and fix the bottleneck within one sprint. The action I took was profiling the ' +
  'endpoint, identifying an N+1 query, adding a compound index, and introducing a Redis cache for the ' +
  'hot product lookups. I also added load tests to CI so regressions would be caught early. ' +
  'The result was p95 latency dropping from 2.3 seconds to 280 milliseconds, a 40% reduction in ' +
  'infrastructure cost, and zero timeout incidents in the following quarter. I learned to always ' +
  'measure before optimizing.';

export const WEAK_ANSWER = 'I would just try my best and work hard.';
