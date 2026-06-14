'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Play, Terminal } from 'lucide-react';
import type { ExecutionDto, ExecutionStatus } from '@ai-interview/types';

const STATUS_META: Record<ExecutionStatus, { label: string; cls: string }> = {
  running: { label: 'Running', cls: 'bg-amber-400/15 text-amber-300' },
  success: { label: 'Success', cls: 'bg-emerald-400/15 text-emerald-300' },
  compile_error: { label: 'Compile error', cls: 'bg-red-400/15 text-red-300' },
  runtime_error: { label: 'Runtime error', cls: 'bg-red-400/15 text-red-300' },
  timeout: { label: 'Timed out', cls: 'bg-amber-400/15 text-amber-300' },
  error: { label: 'Engine error', cls: 'bg-red-400/15 text-red-300' },
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

  // Auto-expand when a run starts or a fresh result lands.
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
    <div className="shrink-0 border-t border-white/10 bg-[#0a0b0e]">
      {/* Bar */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white/90"
        >
          <Terminal className="h-3.5 w-3.5" />
          Console
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        <span className="text-xs text-white/35">
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
            className={`rounded-md px-2 py-1 text-xs transition-colors hover:bg-white/5 ${showStdin ? 'text-sky-300' : 'text-white/50'}`}
          >
            stdin
          </button>
          <button
            type="button"
            onClick={() => onRun(stdin.trim() ? stdin : undefined)}
            disabled={!canRun || running}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-[#06140c] shadow-[0_0_18px_-6px_rgba(34,197,94,0.6)] transition-all hover:bg-emerald-400 disabled:opacity-40"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run
          </button>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="max-h-64 overflow-y-auto border-t border-white/5 px-3 py-2.5">
          {showStdin && (
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Standard input (stdin) for this run…"
              rows={2}
              className="mb-3 w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 font-mono text-xs text-white/80 placeholder:text-white/25 focus:border-sky-500/40 focus:outline-none"
            />
          )}

          {running ? (
            <div className="flex items-center gap-2 py-4 text-sm text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" /> Executing in a sandbox…
            </div>
          ) : lastExecution ? (
            <Result execution={lastExecution} />
          ) : (
            <p className="py-4 text-sm text-white/30">Run your code to see the output here.</p>
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
        {execution.exitCode != null && <span className="text-white/40">exit {execution.exitCode}</span>}
        {execution.timeMs != null && <span className="text-white/40">{execution.timeMs} ms</span>}
        {execution.memoryKb != null && (
          <span className="text-white/40">{Math.round(execution.memoryKb / 1024)} MB</span>
        )}
        <span className="ml-auto text-white/30">by {execution.requestedByName}</span>
      </div>
      {execution.stdout && (
        <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-white/85">
          {execution.stdout}
        </pre>
      )}
      {execution.stderr && (
        <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-red-300/90">
          {execution.stderr}
        </pre>
      )}
      {!execution.stdout && !execution.stderr && (
        <p className="font-mono text-xs text-white/30">(no output)</p>
      )}
    </div>
  );
}
