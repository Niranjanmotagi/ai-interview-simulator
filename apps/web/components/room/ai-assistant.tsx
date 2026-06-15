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

  const onError = (e: unknown) => toast.error(e instanceof ApiClientError ? e.message : 'AI request failed');

  const hint = useMutation({ mutationFn: () => aiHint(roomId, { language, code: getCode() }), onSuccess: (d) => setResult({ kind: 'hint', hint: d.hint }), onError });
  const explain = useMutation({ mutationFn: () => aiExplain(roomId, { language, code: getCode() }), onSuccess: (d) => setResult({ kind: 'explain', data: d }), onError });
  const question = useMutation({ mutationFn: () => generateQuestion(roomId, { difficulty }), onSuccess: (d) => setResult({ kind: 'question', data: d }), onError });
  const evaluate = useMutation({ mutationFn: () => aiEvaluate(roomId, { language, code: getCode() }), onSuccess: (d) => setResult({ kind: 'report', data: d }), onError });

  const busy = hint.isPending || explain.isPending || question.isPending || evaluate.isPending;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-lime-300 text-black shadow-lg shadow-lime-300/20 transition-all hover:scale-105 hover:bg-lime-200"
        aria-label="Open AI assistant"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0b0b0d]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-zinc-300">
                <Sparkles className="h-4 w-4 text-lime-300" /> ai assistant
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 border-b border-white/10 p-4">
              <div className="grid grid-cols-2 gap-2">
                <ActionButton icon={<Lightbulb className="h-4 w-4" />} label="Get a hint" onClick={() => hint.mutate()} disabled={busy} loading={hint.isPending} />
                <ActionButton icon={<ScrollText className="h-4 w-4" />} label="Explain code" onClick={() => explain.mutate()} disabled={busy} loading={explain.isPending} />
              </div>
              {isInterviewer && (
                <>
                  <div className="flex gap-2">
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 font-mono text-xs uppercase tracking-wider text-zinc-300 focus:border-lime-300/50 focus:outline-none">
                      <option value="easy" className="bg-[#111]">easy</option>
                      <option value="medium" className="bg-[#111]">medium</option>
                      <option value="hard" className="bg-[#111]">hard</option>
                    </select>
                    <ActionButton icon={<Wand2 className="h-4 w-4" />} label="Generate question" onClick={() => question.mutate()} disabled={busy} loading={question.isPending} className="flex-1" />
                  </div>
                  <ActionButton icon={<Sparkles className="h-4 w-4" />} label="Evaluate solution" onClick={() => evaluate.mutate()} disabled={busy} loading={evaluate.isPending} primary className="w-full" />
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {busy ? (
                <div className="flex items-center gap-2 py-8 font-mono text-sm text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> thinking…
                </div>
              ) : result ? (
                <ResultView result={result} />
              ) : (
                <p className="py-8 text-center font-mono text-xs text-zinc-600">
                  ask for a hint, explain code, or {isInterviewer ? 'generate a question and evaluate the solution.' : 'review your approach.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActionButton({ icon, label, onClick, disabled, loading, primary, className = '' }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; loading?: boolean; primary?: boolean; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
        primary ? 'bg-lime-300 text-black hover:bg-lime-200' : 'border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-lime-300/40 hover:text-white'
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
      <div className="rounded-lg border border-lime-300/20 bg-lime-300/[0.06] p-4">
        <p className="mb-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-lime-300">
          <Lightbulb className="h-3.5 w-3.5" /> hint
        </p>
        <p className="text-sm leading-relaxed text-zinc-200">{result.hint}</p>
      </div>
    );
  }
  if (result.kind === 'explain') {
    return (
      <div>
        <p className="text-sm leading-relaxed text-zinc-300">{result.data.explanation}</p>
        <div className="mt-3 flex gap-2">
          <Badge label={`time ${result.data.complexity.time}`} />
          <Badge label={`space ${result.data.complexity.space}`} />
        </div>
      </div>
    );
  }
  if (result.kind === 'question') {
    const q = result.data;
    return (
      <div>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold tracking-tight text-white">{q.title}</h3>
          <span className="rounded border border-lime-300/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime-300">{q.difficulty}</span>
        </div>
        <p className="text-sm leading-relaxed text-zinc-300">{q.prompt}</p>
        {q.examples.map((e, i) => (
          <div key={i} className="mt-3 rounded-md border border-white/10 bg-white/[0.02] p-3 font-mono text-xs text-zinc-300">
            <div><span className="text-zinc-600">in </span>{e.input}</div>
            <div><span className="text-zinc-600">out </span>{e.output}</div>
            {e.explanation && <div className="mt-1 text-zinc-500">{e.explanation}</div>}
          </div>
        ))}
        {q.constraints.length > 0 && (
          <ul className="mt-3 list-inside list-disc font-mono text-[11px] text-zinc-500">
            {q.constraints.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        )}
        <p className="mt-3 font-mono text-[11px] text-zinc-600">// saved as the room's problem</p>
      </div>
    );
  }
  return <Report report={result.data} />;
}

function Report({ report }: { report: AiReportDto }) {
  const color = report.overallScore >= 75 ? '#bef264' : report.overallScore >= 55 ? '#fbbf24' : '#f87171';
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-2" style={{ borderColor: color }}>
          <span className="font-mono text-2xl font-bold" style={{ color }}>{report.overallScore}</span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">overall</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-200">{report.verdict}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge label={`time ${report.timeComplexity}`} />
            <Badge label={`space ${report.spaceComplexity}`} />
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <ScoreBar label="correctness" value={report.correctness} />
        <ScoreBar label="problem solving" value={report.problemSolving} />
        <ScoreBar label="code quality" value={report.codeQuality} />
        <ScoreBar label="communication" value={report.communication} />
      </div>

      <ListBlock title="strengths" items={report.strengths} color="text-lime-300" />
      <ListBlock title="weaknesses" items={report.weaknesses} color="text-amber-400" />
      <ListBlock title="suggestions" items={report.suggestions} color="text-sky-400" />
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? '#bef264' : value >= 55 ? '#fbbf24' : '#f87171';
  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-[11px]">
        <span className="uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="font-medium text-zinc-300">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function ListBlock({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <p className={`mb-1 font-mono text-[11px] uppercase tracking-wider ${color}`}>// {title}</p>
      <ul className="list-inside list-disc space-y-1 text-sm text-zinc-400">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-zinc-400">{label}</span>;
}
