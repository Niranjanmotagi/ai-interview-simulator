import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { AuthResponse } from '@ai-interview/types';
import { User } from '../../models';
import { ApiError } from '../../utils/ApiError';
import { mailer } from '../../services/mailer';
import { toUserDto } from '../users/user.mapper';
import {
  issueRefreshToken,
  revokeAllForUser,
  revokeFamilyByToken,
  rotateRefreshToken,
  signAccessToken,
  type IssuedRefresh,
  type RefreshMeta,
} from './token.service';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface AuthResult {
  auth: AuthResponse;
  refresh: IssuedRefresh;
}

export async function register(
  input: { name: string; email: string; password: string },
  meta: RefreshMeta,
): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email }).lean();
  if (existing) {
    throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role, plan: user.plan });
  const refresh = await issueRefreshToken(user._id.toString(), meta);

  return { auth: { accessToken, user: toUserDto(user) }, refresh };
}

export async function login(
  input: { email: string; password: string },
  meta: RefreshMeta,
): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  // Constant-shape failure: same error for unknown email and wrong password.
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role, plan: user.plan });
  const refresh = await issueRefreshToken(user._id.toString(), meta);

  return { auth: { accessToken, user: toUserDto(user) }, refresh };
}

export async function refresh(rawToken: string, meta: RefreshMeta): Promise<AuthResult> {
  const rotated = await rotateRefreshToken(rawToken, meta);

  const user = await User.findById(rotated.userId);
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists', 'USER_GONE');
  }

  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role, plan: user.plan });
  return {
    auth: { accessToken, user: toUserDto(user) },
    refresh: { token: rotated.token, family: rotated.family, expiresAt: rotated.expiresAt },
  };
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (rawToken) {
    await revokeFamilyByToken(rawToken);
  }
}

export async function forgotPassword(email: string, appUrl: string): Promise<void> {
  const found = await User.findOne({ email }).select('+passwordResetTokenHash');
  // Always behave identically whether or not the account exists (no user enumeration).
  if (!found) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  found.set({
    passwordResetTokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
    passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });
  await found.save();

  const resetUrl = `${appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
  await mailer.sendPasswordReset(email, resetUrl);
}

export async function resetPassword(input: {
  email: string;
  token: string;
  password: string;
}): Promise<void> {
  const user = await User.findOne({ email: input.email }).select(
    '+passwordResetTokenHash +passwordResetExpiresAt +passwordHash',
  );
  const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

  if (
    !user ||
    !user.passwordResetTokenHash ||
    user.passwordResetTokenHash !== tokenHash ||
    !user.passwordResetExpiresAt ||
    user.passwordResetExpiresAt.getTime() <= Date.now()
  ) {
    throw ApiError.badRequest('Reset link is invalid or has expired');
  }

  user.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  // Credential change invalidates every session on every device.
  await revokeAllForUser(user._id.toString());
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User');
  }
  return toUserDto(user);
}
