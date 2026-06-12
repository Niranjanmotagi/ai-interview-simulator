'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, CornerDownRight, Flag } from 'lucide-react';
import { toast } from 'sonner';
import type {
  EvaluationDto,
  InterviewSessionDetailDto,
  NextQuestionDto,
  QuestionDto,
  SubmitAnswerResult,
} from '@ai-interview/types';
import { api, ApiClientError } from '@/lib/api';
import { ROUND_TYPE_LABELS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { EvaluationCard } from '@/components/evaluation-card';

type TurnPhase = 'answering' | 'feedback';

export default function LiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [answerText, setAnswerText] = useState('');
  const [phase, setPhase] = useState<TurnPhase>('answering');
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationDto | null>(null);
  const [lastFollowUp, setLastFollowUp] = useState<QuestionDto | null>(null);
  const [completing, setCompleting] = useState(false);

  const session = useQuery({
    queryKey: ['interview', sessionId],
    queryFn: () => api<InterviewSessionDetailDto>(`/interviews/${sessionId}`),
  });

  const next = useQuery({
    queryKey: ['interview-next', sessionId],
    queryFn: () => api<NextQuestionDto>(`/interviews/${sessionId}/next`),
  });

  const submit = useMutation({
    mutationFn: (input: { questionId: string; text: string }) =>
      api<SubmitAnswerResult>(`/interviews/${sessionId}/answers`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: (result) => {
      setLastEvaluation(result.evaluation);
      setLastFollowUp(result.followUp);
      setPhase('feedback');
      setAnswerText('');
      queryClient.setQueryData(['interview-next', sessionId], result.next);
      void queryClient.invalidateQueries({ queryKey: ['interview', sessionId] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not submit your answer');
    },
  });

  const complete = useMutation({
    mutationFn: () => api(`/interviews/${sessionId}/complete`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.push(`/interviews/${sessionId}/summary`);
    },
    onError: (err) => {
      setCompleting(false);
      toast.error(err instanceof ApiClientError ? err.message : 'Could not complete the session');
    },
  });

  if (session.isLoading || next.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const sessionData = session.data;
  const nextData = next.data;
  if (!sessionData || !nextData) {
    return <p className="text-muted-foreground">Session not found.</p>;
  }

  if (sessionData.status === 'completed') {
    router.replace(`/interviews/${sessionId}/summary`);
    return null;
  }

  const { progress } = nextData;
  const progressPct = progress.total === 0 ? 0 : (progress.answered / progress.total) * 100;
  const currentQuestion = nextData.question;
  const allDone = nextData.done;

  function handleSubmit() {
    if (!currentQuestion) {
      return;
    }
    const text = answerText.trim();
    if (text.length === 0) {
      toast.error('Write your answer first');
      return;
    }
    submit.mutate({ questionId: currentQuestion.id, text });
  }

  function handleNextQuestion() {
    setPhase('answering');
    setLastEvaluation(null);
    setLastFollowUp(null);
  }

  function handleFinish() {
    setCompleting(true);
    complete.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{sessionData.config.targetRole}</h1>
          <p className="text-sm text-muted-foreground">
            {ROUND_TYPE_LABELS[sessionData.config.roundType]} · {sessionData.config.difficulty}
          </p>
        </div>
        <Badge variant="secondary">
          {progress.answered} / {progress.total} answered
        </Badge>
      </div>
      <Progress value={progressPct} />

      <AnimatePresence mode="wait">
        {allDone ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {phase === 'feedback' && lastEvaluation && (
              <div className="mb-6">
                <EvaluationCard evaluation={lastEvaluation} />
              </div>
            )}
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <div>
                  <p className="text-lg font-semibold">All questions answered!</p>
                  <p className="text-sm text-muted-foreground">
                    Generate your session summary, weakness analysis, and improvement plan.
                  </p>
                </div>
                <Button size="lg" onClick={handleFinish} loading={completing}>
                  <Flag className="h-4 w-4" />
                  {completing ? 'Generating your debrief…' : 'Finish & see results'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : phase === 'feedback' && lastEvaluation ? (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <EvaluationCard evaluation={lastEvaluation} />
            {lastFollowUp && (
              <Card className="border-amber-300 bg-amber-50/50">
                <CardContent className="flex items-start gap-3 p-4 text-sm">
                  <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p>
                    <span className="font-medium">The interviewer wants to dig deeper.</span> A
                    follow-up question has been added — it&apos;s up next.
                  </p>
                </CardContent>
              </Card>
            )}
            <div className="flex justify-end">
              <Button onClick={handleNextQuestion}>
                Next question <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ) : currentQuestion ? (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={currentQuestion.type === 'followup' ? 'warning' : 'secondary'}>
                    {ROUND_TYPE_LABELS[currentQuestion.type] ?? currentQuestion.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Question {progress.answered + 1} of {progress.total}
                  </span>
                </div>
                <CardTitle className="text-lg leading-relaxed">{currentQuestion.text}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  rows={8}
                  placeholder="Type your answer. For behavioral questions, aim for STAR: Situation, Task, Action, Result…"
                  disabled={submit.isPending}
                  aria-label="Your answer"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {answerText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                  <Button onClick={handleSubmit} loading={submit.isPending}>
                    {submit.isPending ? 'Evaluating…' : 'Submit answer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
