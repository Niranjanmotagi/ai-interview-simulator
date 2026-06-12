'use client';

import { motion } from 'framer-motion';
import type { EvaluationDto } from '@ai-interview/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { weaknessLabel } from '@/lib/utils';

const RUBRIC_LABELS: Record<keyof EvaluationDto['rubric'], string> = {
  relevance: 'Relevance',
  structure: 'Structure',
  depth: 'Depth',
  communication: 'Communication',
};

export function EvaluationCard({ evaluation }: { evaluation: EvaluationDto }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Feedback</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{evaluation.overallScore.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">/ 10</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(RUBRIC_LABELS) as (keyof EvaluationDto['rubric'])[]).map((key) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{RUBRIC_LABELS[key]}</span>
                  <span className="font-medium">{evaluation.rubric[key].toFixed(1)}</span>
                </div>
                <Progress value={evaluation.rubric[key] * 10} />
              </div>
            ))}
          </div>

          {evaluation.strengths.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-emerald-700">What worked</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {evaluation.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="mb-1 text-sm font-medium text-amber-700">How to improve</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {evaluation.improvements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          {evaluation.detectedWeaknessTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {evaluation.detectedWeaknessTags.map((tag) => (
                <Badge key={tag} variant="warning">
                  {weaknessLabel(tag)}
                </Badge>
              ))}
            </div>
          )}

          <details className="rounded-md border bg-muted/40 p-3">
            <summary className="cursor-pointer text-sm font-medium">Show model answer</summary>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {evaluation.modelAnswer}
            </p>
          </details>
        </CardContent>
      </Card>
    </motion.div>
  );
}
