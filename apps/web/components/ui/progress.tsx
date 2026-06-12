import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0–100
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn(
        'relative h-2.5 w-full overflow-hidden rounded-full border border-zinc-900/30 bg-zinc-100',
        className,
      )}
      {...props}
    >
      <div
        className="h-full rounded-full bg-brand transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  ),
);
Progress.displayName = 'Progress';

export { Progress };
