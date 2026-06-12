import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { RefreshToken } from '../../models';
import type { UserDoc } from '../../models';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

export interface RefreshMeta {
  userAgent?: string;
  ip?: string;
}

export interface IssuedRefresh {
  token: string;
  family: string;
  expiresAt: Date;
}

/** Short-lived access JWT with minimal claims (sub, role, plan). */
export function signAccessToken(user: Pick<UserDoc, 'role' | 'plan'> & { id: string }): string {
  return jwt.sign({ role: user.role, plan: user.plan }, env.JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: `${env.ACCESS_TOKEN_TTL_MIN}m`,
  });
}

/**
 * Refresh tokens are 384-bit random values. Only an HMAC of the token is
 * persisted, keyed with the refresh secret, so neither a DB dump nor a log
 * leak yields a usable token.
 */
export function hashRefreshToken(raw: string): string {
  return crypto.createHmac('sha256', env.JWT_REFRESH_SECRET).update(raw).digest('hex');
}

export async function issueRefreshToken(
  userId: string,
  meta: RefreshMeta = {},
  family?: string,
): Promise<IssuedRefresh> {
  const token = crypto.randomBytes(48).toString('hex');
  const fam = family ?? crypto.randomUUID();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId,
    tokenHash: hashRefreshToken(token),
    family: fam,
    expiresAt,
    revoked: false,
    userAgent: meta.userAgent ?? null,
    ip: meta.ip ?? null,
  });

  return { token, family: fam, expiresAt };
}

export interface RotationResult extends IssuedRefresh {
  userId: string;
}

/**
 * Rotation with reuse detection:
 *  - unknown token            → 401 (nothing to do)
 *  - revoked token presented  → replay attack signal: revoke the entire family
 *  - expired token            → 401, client must log in again
 *  - valid token              → revoke it, issue a fresh one in the same family
 */
export async function rotateRefreshToken(
  raw: string,
  meta: RefreshMeta = {},
): Promise<RotationResult> {
  const doc = await RefreshToken.findOne({ tokenHash: hashRefreshToken(raw) });

  if (!doc) {
    throw ApiError.unauthorized('Invalid refresh token', 'REFRESH_INVALID');
  }

  if (doc.revoked) {
    await RefreshToken.updateMany({ family: doc.family }, { $set: { revoked: true } });
    logger.warn(
      { userId: doc.userId.toString(), family: doc.family },
      'Refresh token reuse detected — family revoked',
    );
    throw ApiError.unauthorized('Refresh token reuse detected', 'REFRESH_REUSED');
  }

  if (doc.expiresAt.getTime() <= Date.now()) {
    throw ApiError.unauthorized('Refresh token expired', 'REFRESH_EXPIRED');
  }

  doc.revoked = true;
  await doc.save();

  const issued = await issueRefreshToken(doc.userId.toString(), meta, doc.family);
  return { ...issued, userId: doc.userId.toString() };
}

export async function revokeFamilyByToken(raw: string): Promise<void> {
  const doc = await RefreshToken.findOne({ tokenHash: hashRefreshToken(raw) });
  if (doc) {
    await RefreshToken.updateMany({ family: doc.family }, { $set: { revoked: true } });
  }
}

export async function revokeAllForUser(userId: string): Promise<void> {
  await RefreshToken.updateMany({ userId }, { $set: { revoked: true } });
}
