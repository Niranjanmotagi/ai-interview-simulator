'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Flame, Play, TrendingUp } from 'lucide-react';
import type { DashboardOverviewDto, TrendPointDto } from '@ai-interview/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatScore, ROUND_TYPE_LABELS } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreTrendChart } from '@/components/score-trend-chart';
import { PlanChecklist } from '@/components/plan-checklist';

const STATUS_VARIANT = {
  completed: 'success',
  in_progress: 'warning',
  created: 'secondary',
  abandoned: 'outline',
} as const;

export default function DashboardPage() {
  const user = useAuth((s) => s.user);

  const overview = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardOverviewDto>('/dashboard/overview'),
  });
  const trends = useQuery({
    queryKey: ['trends'],
    queryFn: () => api<TrendPointDto[]>('/analytics/trends?days=90'),
  });

  if (overview.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const data = overview.data;
  if (!data) {
    return <p className="text-muted-foreground">Could not load your dashboard. Refresh to retry.</p>;
  }

  const quotaText =
    data.quota.limit === null
      ? 'Unlimited interviews'
      : `${data.quota.remaining} of ${data.quota.limit} interviews left this month`;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Hey {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">{quotaText}</p>
        </div>
        <Link href="/interviews/new" className={buttonVariants({ size: 'lg' })}>
          <Play className="h-4 w-4" /> Start a mock interview
        </Link>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card plain className="bg-pastel-sky">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-semibold text-zinc-700">
              <TrendingUp className="h-4 w-4" /> Average score
            </CardDescription>
            <CardTitle className="text-4xl">{formatScore(data.averageScore)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-medium text-zinc-700/80">
            across {data.completedSessions} completed session{data.completedSessions === 1 ? '' : 's'}
          </CardContent>
        </Card>
        <Card plain className="bg-pastel-lemon">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-semibold text-zinc-700">
              <Flame className="h-4 w-4" /> Practice streak
            </CardDescription>
            <CardTitle className="text-4xl">
              {data.streakDays} day{data.streakDays === 1 ? '' : 's'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-medium text-zinc-700/80">
            practice daily to keep it alive 🔥
          </CardContent>
        </Card>
        <Card plain className="bg-pastel-mint">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-semibold text-zinc-700">
              <FileText className="h-4 w-4" /> Latest resume
            </CardDescription>
            <CardTitle className="text-4xl">
              {data.latestResume?.overallScore != null ? `${data.latestResume.overallScore}/100` : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-medium">
            {data.latestResume ? (
              <Link
                href={`/resumes/${data.latestResume.id}`}
                className="text-zinc-800 underline-offset-2 hover:underline"
              >
                {data.latestResume.fileName} <ArrowRight className="inline h-3 w-3" />
              </Link>
            ) : (
              <Link
                href="/resumes/upload"
                className="text-zinc-800 underline-offset-2 hover:underline"
              >
                Upload your resume to personalize interviews
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score trend (90 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart data={trends.data ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent sessions</CardTitle>
            <Link href="/interviews" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentSessions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No sessions yet — start your first mock interview.
              </p>
            ) : (
              <ul className="divide-y">
                {data.recentSessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <Link
                        href={
                          s.status === 'completed'
                            ? `/interviews/${s.id}/summary`
                            : `/interviews/${s.id}`
                        }
                        className="block truncate text-sm font-medium hover:text-primary"
                      >
                        {s.config.targetRole}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {ROUND_TYPE_LABELS[s.config.roundType]} · {formatDate(s.createdAt)}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[s.status]}>{s.status.replace('_', ' ')}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {data.activePlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your active improvement plan</CardTitle>
            <CardDescription>Generated from your latest session</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanChecklist plan={data.activePlan} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
