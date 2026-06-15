'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Play, Terminal } from 'lucide-react';
import type { ExecutionDto, ExecutionStatus } from '@ai-interview/types';

const STATUS_META: Record<ExecutionStatus, { label: string; cls: string }> = {
  running: { label: 'running', cls: 'bg-amber-400/15 text-amber-300' },
  success: { label: 'success', cls: 'bg-lime-300/15 text-lime-300' },
  compile_error: { label: 'compile error', cls: 'bg-red-400/15 text-red-300' },
  runtime_error: { label: 'runtime error', cls: 'bg-red-400/15 text-red-300' },
  timeout: { label: 'timed out', cls: 'bg-amber-400/15 text-amber-300' },
  error: { label: 'engine error', cls: 'bg-red-400/15 text-red-300' },
};

interface Props {
  execStatus: 'idle' | 'running';
  execRunner: string | null;
  lastExecution: ExecutionDto | null;
  canRun: boolean;
  onRun: (stdin?: string) => void;
}

export function OutputConsole({ execStatus, execRunner, lastExecution, canRun, onRun }: Props) {
  const [open, setOpen] = useState(false);
  const [showStdin, setShowStdin] = useState(false);
  const [stdin, setStdin] = useState('');
  const running = execStatus === 'running';
  const lastSeen = useRef<string | null>(null);

  useEffect(() => {
    if (running) setOpen(true);
  }, [running]);
  useEffect(() => {
    if (lastExecution && lastExecution.id !== lastSeen.current) {
      lastSeen.current = lastExecution.id;
      setOpen(true);
    }
  }, [lastExecution]);

  return (
    <div className="shrink-0 border-t border-white/10 bg-[#0a0a0b]">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-200">
          <Terminal className="h-3.5 w-3.5" />
          console
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
        <span className="font-mono text-[11px] text-zinc-600">
          {running ? `running${execRunner ? ` · ${execRunner}` : ''}…` : lastExecution ? STATUS_META[lastExecution.status].label : 'ready'}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => { setShowStdin((v) => !v); setOpen(true); }} className={`rounded px-2 py-1 font-mono text-[11px] transition-colors hover:bg-white/5 ${showStdin ? 'text-lime-300' : 'text-zinc-500'}`}>
            stdin
          </button>
          <button type="button" onClick={() => onRun(stdin.trim() ? stdin : undefined)} disabled={!canRun || running} className="flex items-center gap-1.5 rounded-md bg-lime-300 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-lime-200 disabled:opacity-40">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run
          </button>
        </div>
      </div>

      {open && (
        <div className="max-h-64 overflow-y-auto border-t border-white/10 px-3 py-2.5">
          {showStdin && (
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="stdin for this run…"
              rows={2}
              className="mb-3 w-full resize-none rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-lime-300/40 focus:outline-none"
            />
          )}
          {running ? (
            <div className="flex items-center gap-2 py-4 font-mono text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> executing in sandbox…
            </div>
          ) : lastExecution ? (
            <Result execution={lastExecution} />
          ) : (
            <p className="py-4 font-mono text-sm text-zinc-600">run your code to see output here.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Result({ execution }: { execution: ExecutionDto }) {
  const meta = STATUS_META[execution.status];
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <span className={`rounded px-2 py-0.5 font-medium uppercase tracking-wider ${meta.cls}`}>{meta.label}</span>
        {execution.exitCode != null && <span className="text-zinc-600">exit {execution.exitCode}</span>}
        {execution.timeMs != null && <span className="text-zinc-600">{execution.timeMs}ms</span>}
        {execution.memoryKb != null && <span className="text-zinc-600">{Math.round(execution.memoryKb / 1024)}MB</span>}
        <span className="ml-auto text-zinc-600">by {execution.requestedByName}</span>
      </div>
      {execution.stdout && <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-zinc-200">{execution.stdout}</pre>}
      {execution.stderr && <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-red-300">{execution.stderr}</pre>}
      {!execution.stdout && !execution.stderr && <p className="font-mono text-xs text-zinc-600">(no output)</p>}
    </div>
  );
}
