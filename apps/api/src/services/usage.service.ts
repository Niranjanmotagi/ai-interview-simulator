import type { Plan, QuotaDto } from '@ai-interview/types';
import { UsageEvent, type UsageEventType } from '../models';
import type { AIUsage } from '../ai/types';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

/** Quota period = calendar month (UTC). */
function periodBounds(now = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export async function recordUsage(
  userId: string,
  type: UsageEventType,
  usage?: AIUsage,
): Promise<void> {
  await UsageEvent.create({
    userId,
    type,
    tokensIn: usage?.tokensIn ?? 0,
    tokensOut: usage?.tokensOut ?? 0,
    model: usage?.model ?? 'n/a',
  });
}

export async function getMonthlyInterviewCount(userId: string): Promise<number> {
  const { start, end } = periodBounds();
  return UsageEvent.countDocuments({
    userId,
    type: 'interview_created',
    createdAt: { $gte: start, $lt: end },
  });
}

/**
 * Server-side quota enforcement — the free tier limit cannot be bypassed by
 * a modified client. Paid plans are unlimited in v1.
 */
export async function assertInterviewQuota(userId: string, plan: Plan): Promise<void> {
  if (plan !== 'free') {
    return;
  }
  const used = await getMonthlyInterviewCount(userId);
  if (used >= env.FREE_TIER_INTERVIEWS_PER_MONTH) {
    throw new ApiError(
      403,
      'QUOTA_EXCEEDED',
      `Free plan includes ${env.FREE_TIER_INTERVIEWS_PER_MONTH} mock interviews per month. Upgrade for unlimited practice.`,
      { limit: env.FREE_TIER_INTERVIEWS_PER_MONTH, used },
    );
  }
}

export async function getQuota(userId: string, plan: Plan): Promise<QuotaDto> {
  const { end } = periodBounds();
  const used = await getMonthlyInterviewCount(userId);
  const limit = plan === 'free' ? env.FREE_TIER_INTERVIEWS_PER_MONTH : null;
  return {
    plan,
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    periodEnd: end.toISOString(),
  };
}
