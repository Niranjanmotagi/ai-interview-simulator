'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import type { SessionSummaryResponse } from '@ai-interview/types';
import { api } from '@/lib/api';
import { weaknessLabel } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EvaluationCard } from '@/components/evaluation-card';
import { PlanChecklist } from '@/components/plan-checklist';

const RUBRIC_LABELS = {
  relevance: 'Relevance',
  structure: 'Structure',
  depth: 'Depth',
  communication: 'Communication',
} as const;

export default function SessionSummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);

  const summary = useQuery({
    queryKey: ['summary', sessionId],
    queryFn: () => api<SessionSummaryResponse>(`/interviews/${sessionId}/summary`),
  });

  if (summary.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const data = summary.data;
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-muted-foreground">
          No summary yet — finish the interview to generate one.
        </p>
        <Link
          href={`/interviews/${sessionId}`}
          className={buttonVariants({ variant: 'outline', className: 'mt-4' })}
        >
          Back to session
        </Link>
      </div>
    );
  }

  const { summary: s, plan, evaluations } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/interviews"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All interviews
        </Link>
        <Link href="/interviews/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <RotateCcw className="h-3.5 w-3.5" /> Practice again
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="text-center">
            <CardDescription>Session score</CardDescription>
            <CardTitle className="text-5xl">{s.aggregateScore.toFixed(1)}</CardTitle>
            <CardDescription>out of 10</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(Object.keys(RUBRIC_LABELS) as (keyof typeof RUBRIC_LABELS)[]).map((key) => (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{RUBRIC_LABELS[key]}</span>
                    <span className="font-medium">{s.rubricAverages[key].toFixed(1)}</span>
                  </div>
                  <Progress value={s.rubricAverages[key] * 10} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coach&apos;s debrief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {s.narrative}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-emerald-700">Top strengths</p>
              <div className="flex flex-wrap gap-1.5">
                {s.topStrengths.map((t) => (
                  <Badge key={t} variant="success">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-amber-700">Top weaknesses</p>
              <div className="flex flex-wrap gap-1.5">
                {s.topWeaknesses.map((t) => (
                  <Badge key={t} variant="warning">
                    {weaknessLabel(t)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your improvement plan</CardTitle>
            <CardDescription>
              Prioritized actions generated from this session. Check items off as you complete them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlanChecklist plan={plan} />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Question-by-question review</h2>
        {evaluations.map((row, i) => (
          <details key={row.question.id} className="group rounded-xl border bg-card" open={i === 0}>
            <summary className="cursor-pointer list-none p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{row.question.text}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    Your answer: {row.answerText}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-bold">
                  {row.evaluation.overallScore.toFixed(1)}
                </span>
              </div>
            </summary>
            <div className="border-t p-4">
              <EvaluationCard evaluation={row.evaluation} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
