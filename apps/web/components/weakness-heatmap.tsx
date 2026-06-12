'use client';

import type { WeaknessAggDto } from '@ai-interview/types';
import { weaknessLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * Weakness "heatmap": tag tiles whose intensity scales with frequency.
 * Communicates the same signal as a grid heatmap with far less chrome.
 */
export function WeaknessHeatmap({ data }: { data: WeaknessAggDto[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No weaknesses detected yet — finish an interview to populate this.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((d) => {
        const intensity = d.count / max; // 0..1
        return (
          <div
            key={d.tag}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium',
              intensity > 0.66
                ? 'bg-red-100 text-red-900'
                : intensity > 0.33
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-emerald-100 text-emerald-900',
            )}
            title={`${d.count} occurrence${d.count === 1 ? '' : 's'}`}
          >
            {weaknessLabel(d.tag)}
            <span className="ml-2 text-xs opacity-70">×{d.count}</span>
          </div>
        );
      })}
    </div>
  );
}
