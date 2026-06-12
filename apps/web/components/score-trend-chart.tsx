'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendPointDto } from '@ai-interview/types';

export function ScoreTrendChart({ data }: { data: TrendPointDto[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Complete a few interviews to see your score trend.
      </div>
    );
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} tickLine={false} />
          <Tooltip
            formatter={(value: number) => [value.toFixed(1), 'Avg score']}
            labelFormatter={(label: string) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="hsl(243 75% 59%)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
