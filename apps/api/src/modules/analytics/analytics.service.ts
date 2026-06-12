import { Types } from 'mongoose';
import type {
  DashboardOverviewDto,
  TrendPointDto,
  WeaknessAggDto,
  Plan,
} from '@ai-interview/types';
import {
  Evaluation,
  ImprovementPlan,
  InterviewSession,
  Resume,
  SessionSummary,
} from '../../models';
import { getQuota } from '../../services/usage.service';
import { toPlanDto, toSessionDto } from '../interviews/interview.mapper';
import { toResumeListItemDto } from '../resumes/resume.mapper';
import { answeredCountBySession } from '../interviews/interview.service';

export async function getDashboardOverview(
  userId: string,
  plan: Plan,
): Promise<DashboardOverviewDto> {
  const uid = new Types.ObjectId(userId);

  const [totalSessions, completedSessions, scoreAgg, recentSessions, latestResume, activePlan, quota] =
    await Promise.all([
      InterviewSession.countDocuments({ userId: uid }),
      InterviewSession.countDocuments({ userId: uid, status: 'completed' }),
      SessionSummary.aggregate<{ _id: null; avg: number }>([
        { $match: { userId: uid } },
        { $group: { _id: null, avg: { $avg: '$aggregateScore' } } },
      ]),
      InterviewSession.find({ userId: uid }).sort({ createdAt: -1 }).limit(5),
      Resume.findOne({ userId: uid }).sort({ createdAt: -1 }),
      ImprovementPlan.findOne({ userId: uid }).sort({ createdAt: -1 }),
      getQuota(userId, plan),
    ]);

  const answeredCounts = await answeredCountBySession(recentSessions.map((s) => s._id));
  const streakDays = await computeStreak(uid);

  return {
    totalSessions,
    completedSessions,
    averageScore: scoreAgg[0] ? Math.round(scoreAgg[0].avg * 10) / 10 : null,
    streakDays,
    quota,
    recentSessions: recentSessions.map((s) =>
      toSessionDto(s, answeredCounts.get(s._id.toString()) ?? 0),
    ),
    latestResume: latestResume ? toResumeListItemDto(latestResume) : null,
    activePlan: activePlan ? toPlanDto(activePlan) : null,
  };
}

/** Consecutive days (ending today or yesterday) with at least one session. */
async function computeStreak(userId: Types.ObjectId): Promise<number> {
  const rows = await InterviewSession.aggregate<{ _id: string }>([
    { $match: { userId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 60 },
  ]);
  const days = new Set(rows.map((r) => r._id));

  let streak = 0;
  const cursor = new Date();
  // A streak may still be alive if the user practiced yesterday but not yet today.
  if (!days.has(isoDay(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (days.has(isoDay(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getScoreTrends(userId: string, days: number): Promise<TrendPointDto[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await SessionSummary.aggregate<{
    _id: string;
    score: number;
    sessions: number;
  }>([
    { $match: { userId: new Types.ObjectId(userId), createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        score: { $avg: '$aggregateScore' },
        sessions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({
    date: r._id,
    score: Math.round(r.score * 10) / 10,
    sessions: r.sessions,
  }));
}

export async function getWeaknessAggregation(userId: string): Promise<WeaknessAggDto[]> {
  const sessionIds = await InterviewSession.find({ userId }).distinct('_id');
  if (sessionIds.length === 0) {
    return [];
  }
  const rows = await Evaluation.aggregate<{ _id: string; count: number }>([
    { $match: { sessionId: { $in: sessionIds } } },
    { $unwind: '$detectedWeaknessTags' },
    { $group: { _id: '$detectedWeaknessTags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ]);
  return rows.map((r) => ({ tag: r._id, count: r.count }));
}
