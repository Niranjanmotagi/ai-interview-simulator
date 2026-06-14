'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Play, Terminal } from 'lucide-react';
import type { ExecutionDto, ExecutionStatus } from '@ai-interview/types';

const STATUS_META: Record<ExecutionStatus, { label: string; cls: string }> = {
  running: { label: 'Running', cls: 'bg-amber-100 text-amber-700' },
  success: { label: 'Success', cls: 'bg-emerald-100 text-emerald-700' },
  compile_error: { label: 'Compile error', cls: 'bg-red-100 text-red-700' },
  runtime_error: { label: 'Runtime error', cls: 'bg-red-100 text-red-700' },
  timeout: { label: 'Timed out', cls: 'bg-amber-100 text-amber-700' },
  error: { label: 'Engine error', cls: 'bg-red-100 text-red-700' },
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
    if (running) {
      setOpen(true);
    }
  }, [running]);
  useEffect(() => {
    if (lastExecution && lastExecution.id !== lastSeen.current) {
      lastSeen.current = lastExecution.id;
      setOpen(true);
    }
  }, [lastExecution]);

  return (
    <div className="shrink-0 border-t border-zinc-200 bg-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <Terminal className="h-3.5 w-3.5" />
          Console
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        <span className="text-xs text-zinc-400">
          {running
            ? `Running${execRunner ? ` · ${execRunner}` : ''}…`
            : lastExecution
              ? STATUS_META[lastExecution.status].label
              : 'Ready'}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowStdin((v) => !v);
              setOpen(true);
            }}
            className={`rounded-md px-2 py-1 text-xs transition-colors hover:bg-zinc-100 ${showStdin ? 'text-indigo-600' : 'text-zinc-500'}`}
          >
            stdin
          </button>
          <button
            type="button"
            onClick={() => onRun(stdin.trim() ? stdin : undefined)}
            disabled={!canRun || running}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run
          </button>
        </div>
      </div>

      {open && (
        <div className="max-h-64 overflow-y-auto border-t border-zinc-100 bg-zinc-50 px-3 py-2.5">
          {showStdin && (
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Standard input (stdin) for this run…"
              rows={2}
              className="mb-3 w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-2 font-mono text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none"
            />
          )}

          {running ? (
            <div className="flex items-center gap-2 py-4 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Executing in a sandbox…
            </div>
          ) : lastExecution ? (
            <Result execution={lastExecution} />
          ) : (
            <p className="py-4 text-sm text-zinc-400">Run your code to see the output here.</p>
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
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${meta.cls}`}>{meta.label}</span>
        {execution.exitCode != null && <span className="text-zinc-400">exit {execution.exitCode}</span>}
        {execution.timeMs != null && <span className="text-zinc-400">{execution.timeMs} ms</span>}
        {execution.memoryKb != null && (
          <span className="text-zinc-400">{Math.round(execution.memoryKb / 1024)} MB</span>
        )}
        <span className="ml-auto text-zinc-400">by {execution.requestedByName}</span>
      </div>
      {execution.stdout && (
        <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-zinc-800">
          {execution.stdout}
        </pre>
      )}
      {execution.stderr && (
        <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-red-600">
          {execution.stderr}
        </pre>
      )}
      {!execution.stdout && !execution.stderr && <p className="font-mono text-xs text-zinc-400">(no output)</p>}
    </div>
  );
}
