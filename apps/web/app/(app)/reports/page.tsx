'use client';

import { useQuery } from '@tanstack/react-query';
import type { ImprovementPlanDto, TrendPointDto, WeaknessAggDto } from '@ai-interview/types';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreTrendChart } from '@/components/score-trend-chart';
import { WeaknessHeatmap } from '@/components/weakness-heatmap';
import { PlanChecklist } from '@/components/plan-checklist';

export default function ReportsPage() {
  const trends = useQuery({
    queryKey: ['trends', 90],
    queryFn: () => api<TrendPointDto[]>('/analytics/trends?days=90'),
  });
  const weaknesses = useQuery({
    queryKey: ['weaknesses'],
    queryFn: () => api<WeaknessAggDto[]>('/analytics/weaknesses'),
  });
  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: () => api<ImprovementPlanDto[]>('/improvement-plans'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Reports & progress</h1>
        <p className="text-sm text-muted-foreground">
          Trends, recurring weaknesses, and your improvement plans in one place.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score trend</CardTitle>
          <CardDescription>Average session score per day, last 90 days.</CardDescription>
        </CardHeader>
        <CardContent>
          {trends.isLoading ? <Skeleton className="h-56" /> : <ScoreTrendChart data={trends.data ?? []} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weakness heatmap</CardTitle>
          <CardDescription>
            How often each weakness shows up in your evaluated answers — red means most frequent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weaknesses.isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <WeaknessHeatmap data={weaknesses.data ?? []} />
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Improvement plans</h2>
        {plans.isLoading ? (
          <Skeleton className="h-40" />
        ) : (plans.data?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Complete an interview to generate your first improvement plan.
            </CardContent>
          </Card>
        ) : (
          plans.data!.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="text-base">Plan from {formatDate(plan.createdAt)}</CardTitle>
                <CardDescription>
                  {plan.items.filter((i) => i.done).length} of {plan.items.length} actions done
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlanChecklist plan={plan} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
