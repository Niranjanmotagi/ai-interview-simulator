'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { ResumeListItemDto } from '@ai-interview/types';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_VARIANT = {
  analyzed: 'success',
  parsed: 'warning',
  uploaded: 'secondary',
  failed: 'destructive',
} as const;

export default function ResumesPage() {
  const queryClient = useQueryClient();
  const resumes = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api<ResumeListItemDto[]>('/resumes'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/resumes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Resume deleted');
      void queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
    onError: () => toast.error('Could not delete resume'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Resumes</h1>
          <p className="text-sm text-muted-foreground">
            Your interviews are personalized from the most recent analyzed resume.
          </p>
        </div>
        <Link href="/resumes/upload" className={buttonVariants({})}>
          <Upload className="h-4 w-4" /> Upload resume
        </Link>
      </div>

      {resumes.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (resumes.data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No resumes yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Upload a PDF or DOCX resume to unlock personalized questions and resume feedback.
            </p>
            <Link href="/resumes/upload" className={buttonVariants({ className: 'mt-2' })}>
              Upload your first resume
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resumes.data!.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <Link href={`/resumes/${r.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium hover:text-primary">{r.fileName}</p>
                  <p className="text-xs text-muted-foreground">Uploaded {formatDate(r.createdAt)}</p>
                </Link>
                <div className="flex items-center gap-3">
                  {r.overallScore != null && (
                    <span className="text-sm font-semibold">{r.overallScore}/100</span>
                  )}
                  <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${r.fileName}`}
                    onClick={() => {
                      if (window.confirm(`Delete "${r.fileName}"? This cannot be undone.`)) {
                        remove.mutate(r.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
