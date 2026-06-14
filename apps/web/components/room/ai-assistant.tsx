'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Lightbulb, Loader2, ScrollText, Sparkles, Wand2, X } from 'lucide-react';
import type {
  AiExplanationDto,
  AiReportDto,
  CodingQuestionDto,
  Difficulty,
  RoomLanguage,
} from '@ai-interview/types';
import { aiEvaluate, aiExplain, aiHint, generateQuestion } from '@/lib/codesync';
import { ApiClientError } from '@/lib/api';

type Result =
  | { kind: 'hint'; hint: string }
  | { kind: 'explain'; data: AiExplanationDto }
  | { kind: 'question'; data: CodingQuestionDto }
  | { kind: 'report'; data: AiReportDto };

interface Props {
  roomId: string;
  language: RoomLanguage;
  isInterviewer: boolean;
  getCode: () => string;
}

export function AiAssistant({ roomId, language, isInterviewer, getCode }: Props) {
  const [open, setOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [result, setResult] = useState<Result | null>(null);

  const onError = (e: unknown) =>
    toast.error(e instanceof ApiClientError ? e.message : 'AI request failed');

  const hint = useMutation({
    mutationFn: () => aiHint(roomId, { language, code: getCode() }),
    onSuccess: (d) => setResult({ kind: 'hint', hint: d.hint }),
    onError,
  });
  const explain = useMutation({
    mutationFn: () => aiExplain(roomId, { language, code: getCode() }),
    onSuccess: (d) => setResult({ kind: 'explain', data: d }),
    onError,
  });
  const question = useMutation({
    mutationFn: () => generateQuestion(roomId, { difficulty }),
    onSuccess: (d) => setResult({ kind: 'question', data: d }),
    onError,
  });
  const evaluate = useMutation({
    mutationFn: () => aiEvaluate(roomId, { language, code: getCode() }),
    onSuccess: (d) => setResult({ kind: 'report', data: d }),
    onError,
  });

  const busy = hint.isPending || explain.isPending || question.isPending || evaluate.isPending;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 hover:bg-indigo-500"
        aria-label="Open AI assistant"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-zinc-900/30" />
          <div
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-zinc-900">
                <Sparkles className="h-4 w-4 text-indigo-600" /> AI Assistant
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-2 border-b border-zinc-200 p-4">
              <div className="grid grid-cols-2 gap-2">
                <ActionButton icon={<Lightbulb className="h-4 w-4" />} label="Get a hint" onClick={() => hint.mutate()} disabled={busy} loading={hint.isPending} />
                <ActionButton icon={<ScrollText className="h-4 w-4" />} label="Explain code" onClick={() => explain.mutate()} disabled={busy} loading={explain.isPending} />
              </div>
              {isInterviewer && (
                <>
                  <div className="flex gap-2">
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-700 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <ActionButton
                      icon={<Wand2 className="h-4 w-4" />}
                      label="Generate question"
                      onClick={() => question.mutate()}
                      disabled={busy}
                      loading={question.isPending}
                      className="flex-1"
                    />
                  </div>
                  <ActionButton
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Evaluate solution"
                    onClick={() => evaluate.mutate()}
                    disabled={busy}
                    loading={evaluate.isPending}
                    primary
                    className="w-full"
                  />
                </>
              )}
            </div>

            {/* Result */}
            <div className="flex-1 overflow-y-auto p-4">
              {busy ? (
                <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              ) : result ? (
                <ResultView result={result} />
              ) : (
                <p className="py-8 text-center text-sm text-zinc-400">
                  Ask for a hint, explain your code, or {isInterviewer ? 'generate a question and evaluate the solution.' : 'review your approach.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  loading,
  primary,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  primary?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
        primary
          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
          : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
      } ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function ResultView({ result }: { result: Result }) {
  if (result.kind === 'hint') {
    return (
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600">
          <Lightbulb className="h-3.5 w-3.5" /> Hint
        </p>
        <p className="text-sm leading-relaxed text-zinc-700">{result.hint}</p>
      </div>
    );
  }
  if (result.kind === 'explain') {
    return (
      <div>
        <p className="text-sm leading-relaxed text-zinc-700">{result.data.explanation}</p>
        <div className="mt-3 flex gap-2">
          <Badge label={`Time ${result.data.complexity.time}`} />
          <Badge label={`Space ${result.data.complexity.space}`} />
        </div>
      </div>
    );
  }
  if (result.kind === 'question') {
    const q = result.data;
    return (
      <div>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold tracking-tight text-zinc-900">{q.title}</h3>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium capitalize text-indigo-600">{q.difficulty}</span>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700">{q.prompt}</p>
        {q.examples.map((e, i) => (
          <div key={i} className="mt-3 rounded-lg bg-zinc-50 p-3 font-mono text-xs text-zinc-700">
            <div>Input: {e.input}</div>
            <div>Output: {e.output}</div>
            {e.explanation && <div className="mt-1 text-zinc-500">{e.explanation}</div>}
          </div>
        ))}
        {q.constraints.length > 0 && (
          <ul className="mt-3 list-inside list-disc text-xs text-zinc-500">
            {q.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-zinc-400">Saved as the room's problem statement.</p>
      </div>
    );
  }
  return <Report report={result.data} />;
}

function Report({ report }: { report: AiReportDto }) {
  const scoreColor = report.overallScore >= 75 ? '#16a34a' : report.overallScore >= 55 ? '#d97706' : '#dc2626';
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4" style={{ borderColor: scoreColor }}>
          <span className="text-2xl font-bold" style={{ color: scoreColor }}>{report.overallScore}</span>
          <span className="text-[10px] text-zinc-400">overall</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-800">{report.verdict}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge label={`Time ${report.timeComplexity}`} />
            <Badge label={`Space ${report.spaceComplexity}`} />
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <ScoreBar label="Correctness" value={report.correctness} />
        <ScoreBar label="Problem solving" value={report.problemSolving} />
        <ScoreBar label="Code quality" value={report.codeQuality} />
        <ScoreBar label="Communication" value={report.communication} />
      </div>

      <ListBlock title="Strengths" items={report.strengths} color="text-emerald-700" />
      <ListBlock title="Weaknesses" items={report.weaknesses} color="text-amber-700" />
      <ListBlock title="Suggestions" items={report.suggestions} color="text-indigo-700" />
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? '#16a34a' : value >= 55 ? '#d97706' : '#dc2626';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="font-medium text-zinc-700">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function ListBlock({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="mt-4">
      <p className={`mb-1 text-xs font-semibold uppercase tracking-wider ${color}`}>{title}</p>
      <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-600">{label}</span>
  );
}
