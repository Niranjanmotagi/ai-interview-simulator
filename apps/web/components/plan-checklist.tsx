'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ImprovementPlanDto } from '@ai-interview/types';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const PRIORITY_VARIANT = {
  high: 'destructive',
  medium: 'warning',
  low: 'secondary',
} as const;

export function PlanChecklist({ plan }: { plan: ImprovementPlanDto }) {
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: ({ itemId, done }: { itemId: string; done: boolean }) =>
      api<ImprovementPlanDto>(`/improvement-plans/${plan.id}/items/${itemId}`, {
        method: 'PATCH',
        body: { done },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['plans'] });
      void queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  return (
    <ul className="space-y-3">
      {plan.items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 rounded-md border p-3">
          <input
            type="checkbox"
            checked={item.done}
            onChange={(e) => toggle.mutate({ itemId: item.id, done: e.target.checked })}
            className="mt-1 h-4 w-4 accent-[hsl(243,75%,59%)]"
            aria-label={`Mark "${item.weakness}" ${item.done ? 'not done' : 'done'}`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('text-sm font-medium', item.done && 'line-through opacity-60')}>
                {item.weakness}
              </span>
              <Badge variant={PRIORITY_VARIANT[item.priority]}>{item.priority}</Badge>
            </div>
            <p className={cn('mt-1 text-sm text-muted-foreground', item.done && 'line-through opacity-60')}>
              {item.action}
            </p>
            {item.resources.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-2">
                {item.resources.map((r) => (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline-offset-2 hover:underline"
                  >
                    {r.title} ↗
                  </a>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
