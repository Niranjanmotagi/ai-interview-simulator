'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareText, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { InterviewSessionDto, Paginated } from '@ai-interview/types';
import { api } from '@/lib/api';
import { formatDate, ROUND_TYPE_LABELS } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_VARIANT = {
  completed: 'success',
  in_progress: 'warning',
  created: 'secondary',
  abandoned: 'outline',
} as const;

export default function InterviewsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const sessions = useQuery({
    queryKey: ['interviews', page],
    queryFn: () => api<Paginated<InterviewSessionDto>>(`/interviews?page=${page}&limit=10`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/interviews/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Session deleted');
      void queryClient.invalidateQueries({ queryKey: ['interviews'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Could not delete session'),
  });

  const data = sessions.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Interviews</h1>
          <p className="text-sm text-muted-foreground">Your mock interview history.</p>
        </div>
        <Link href="/interviews/new" className={buttonVariants({})}>
          <Play className="h-4 w-4" /> New interview
        </Link>
      </div>

      {sessions.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <MessageSquareText className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No interviews yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Set up your first mock interview — pick a role, difficulty, and round type.
            </p>
            <Link href="/interviews/new" className={buttonVariants({ className: 'mt-2' })}>
              Start your first interview
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {data!.items.map((s) => {
              const href =
                s.status === 'completed' ? `/interviews/${s.id}/summary` : `/interviews/${s.id}`;
              return (
                <Card key={s.id}>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <Link href={href} className="min-w-0 flex-1">
                      <p className="truncate font-medium hover:text-primary">
                        {s.config.targetRole}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ROUND_TYPE_LABELS[s.config.roundType]} · {s.config.difficulty} ·{' '}
                        {s.answeredCount}/{s.questionCount} answered · {formatDate(s.createdAt)}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_VARIANT[s.status]}>{s.status.replace('_', ' ')}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete session"
                        onClick={() => {
                          if (window.confirm('Delete this session and all its feedback?')) {
                            remove.mutate(s.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {data!.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data!.page} of {data!.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data!.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
