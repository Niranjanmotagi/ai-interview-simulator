import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { extractRefreshCookie, getApp, registerTestUser } from './helpers';

describe('Auth', () => {
  it('registers a user and returns access token + refresh cookie', async () => {
    const res = await request(getApp())
      .post('/api/v1/auth/register')
      .send({ name: 'Aisha', email: 'aisha@example.com', password: 'Password123' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe('aisha@example.com');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(extractRefreshCookie(res.headers['set-cookie'])).toContain('aiis_refresh=');
  });

  it('rejects duplicate email with 409', async () => {
    await registerTestUser({ email: 'dup@example.com' });
    const res = await request(getApp())
      .post('/api/v1/auth/register')
      .send({ name: 'Dup', email: 'dup@example.com', password: 'Password123' })
      .expect(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects weak passwords with validation details', async () => {
    const res = await request(getApp())
      .post('/api/v1/auth/register')
      .send({ name: 'Weak', email: 'weak@example.com', password: 'short' })
      .expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.details.issues.length).toBeGreaterThan(0);
  });

  it('rejects login with wrong password using a generic error', async () => {
    const user = await registerTestUser();
    const res = await request(getApp())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'WrongPassword1' })
      .expect(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns the current user from /auth/me', async () => {
    const user = await registerTestUser();
    const res = await request(getApp())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);
    expect(res.body.data.id).toBe(user.userId);
  });

  it('rejects /auth/me without a token', async () => {
    const res = await request(getApp()).get('/api/v1/auth/me').expect(401);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });

  it('rotates the refresh token and detects reuse of the old one', async () => {
    const user = await registerTestUser();

    // First refresh: succeeds, rotates the cookie.
    const first = await request(getApp())
      .post('/api/v1/auth/refresh')
      .set('Cookie', user.refreshCookie)
      .expect(200);
    const rotatedCookie = extractRefreshCookie(first.headers['set-cookie']);
    expect(rotatedCookie).not.toBe(user.refreshCookie);
    expect(first.body.data.accessToken).toBeTruthy();

    // Replaying the ORIGINAL token = reuse → 401 and family revocation.
    const replay = await request(getApp())
      .post('/api/v1/auth/refresh')
      .set('Cookie', user.refreshCookie)
      .expect(401);
    expect(replay.body.error.code).toBe('REFRESH_REUSED');

    // The rotated token is now also dead (whole family revoked).
    const afterRevoke = await request(getApp())
      .post('/api/v1/auth/refresh')
      .set('Cookie', rotatedCookie)
      .expect(401);
    expect(['REFRESH_REUSED', 'REFRESH_INVALID']).toContain(afterRevoke.body.error.code);
  });

  it('logout revokes the refresh family', async () => {
    const user = await registerTestUser();
    await request(getApp())
      .post('/api/v1/auth/logout')
      .set('Cookie', user.refreshCookie)
      .expect(200);

    const res = await request(getApp())
      .post('/api/v1/auth/refresh')
      .set('Cookie', user.refreshCookie)
      .expect(401);
    expect(res.body.error.code).toBe('REFRESH_REUSED');
  });
});
