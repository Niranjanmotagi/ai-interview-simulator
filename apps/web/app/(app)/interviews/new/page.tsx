'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type {
  InterviewSessionDetailDto,
  ResumeListItemDto,
} from '@ai-interview/types';
import { api, ApiClientError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  targetRole: z.string().min(2, 'Enter the role you are practicing for').max(120),
  resumeId: z.string().optional(),
  jobDescription: z.string().max(15_000).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  roundType: z.enum(['behavioral', 'technical', 'system_design', 'hr', 'mixed']),
  questionCount: z.coerce.number().int().min(3).max(10),
});
type FormValues = z.infer<typeof schema>;

export default function NewInterviewPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  const resumes = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api<ResumeListItemDto[]>('/resumes'),
  });
  const analyzedResumes = (resumes.data ?? []).filter((r) => r.status === 'analyzed');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      difficulty: 'medium',
      roundType: 'mixed',
      questionCount: 5,
    },
  });

  const create = useMutation({
    mutationFn: (values: FormValues) =>
      api<InterviewSessionDetailDto>('/interviews', {
        method: 'POST',
        body: {
          targetRole: values.targetRole,
          difficulty: values.difficulty,
          roundType: values.roundType,
          questionCount: values.questionCount,
          ...(values.resumeId ? { resumeId: values.resumeId } : {}),
          ...(values.jobDescription?.trim() ? { jobDescription: values.jobDescription.trim() } : {}),
        },
      }),
    onSuccess: (session) => {
      router.push(`/interviews/${session.id}`);
    },
    onError: (err) => {
      setGenerating(false);
      if (err instanceof ApiClientError && err.code === 'QUOTA_EXCEEDED') {
        toast.error(err.message);
      } else {
        toast.error(err instanceof ApiClientError ? err.message : 'Could not create the interview');
      }
    },
  });

  function onSubmit(values: FormValues) {
    setGenerating(true);
    create.mutate(values);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">New mock interview</h1>
        <p className="text-sm text-muted-foreground">
          Questions are generated from your resume, the role, and the job description you paste.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interview setup</CardTitle>
          <CardDescription>
            {analyzedResumes.length === 0 &&
              'Tip: upload and analyze a resume first for fully personalized questions.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="targetRole">Target role</Label>
              <Input
                id="targetRole"
                placeholder="e.g. Frontend Engineer, Product Manager"
                {...form.register('targetRole')}
              />
              {form.formState.errors.targetRole && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.targetRole.message}
                </p>
              )}
            </div>

            {analyzedResumes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="resumeId">Resume</Label>
                <Select id="resumeId" {...form.register('resumeId')}>
                  <option value="">Latest analyzed resume (default)</option>
                  {analyzedResumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fileName}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job description (optional)</Label>
              <Textarea
                id="jobDescription"
                rows={5}
                placeholder="Paste the JD to align questions with the actual job…"
                {...form.register('jobDescription')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select id="difficulty" {...form.register('difficulty')}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roundType">Round type</Label>
                <Select id="roundType" {...form.register('roundType')}>
                  <option value="mixed">Mixed</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="technical">Technical</option>
                  <option value="system_design">System design</option>
                  <option value="hr">HR</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="questionCount">Questions</Label>
                <Select id="questionCount" {...form.register('questionCount')}>
                  {[3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={generating}>
              {generating ? 'Generating your questions…' : 'Generate interview'}
            </Button>
            {generating && (
              <p className="text-center text-xs text-muted-foreground">
                The AI is crafting questions from your profile — usually 5–15 seconds.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
