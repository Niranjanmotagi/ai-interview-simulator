import type { RoomLanguage } from '@ai-interview/types';
import { logger } from '../config/logger';
import type { ExecutionService, RunRequest, RunResult } from './types';

/**
 * Executes code via a Piston engine (https://github.com/engineer-man/piston).
 * Piston sandboxes each run with `isolate`: per-process CPU/wall/memory limits,
 * a read-only filesystem, and no network — exactly the isolation the spec
 * requires, without us operating Docker. The public instance (emkc.org) works
 * out of the box; self-host for production throughput.
 */

// Our room language -> Piston language id (aliases Piston understands).
const PISTON_LANGUAGE: Record<RoomLanguage, string> = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'c++',
  go: 'go',
};

const FILE_NAME: Record<RoomLanguage, string> = {
  javascript: 'main.js',
  python: 'main.py',
  java: 'Main.java',
  cpp: 'main.cpp',
  go: 'main.go',
};

interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
}

interface PistonStage {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  cpu_time?: number;
  wall_time?: number;
  memory?: number;
}

interface PistonResponse {
  run: PistonStage;
  compile?: PistonStage;
}

export class PistonExecutor implements ExecutionService {
  readonly name = 'piston';
  private versions: Map<string, string> | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly runTimeoutMs: number,
    private readonly memoryLimitMb: number,
  ) {}

  async run({ language, code, stdin }: RunRequest): Promise<RunResult> {
    const version = await this.resolveVersion(language);
    const body = {
      language: PISTON_LANGUAGE[language],
      version,
      files: [{ name: FILE_NAME[language], content: code }],
      stdin,
      compile_timeout: 10_000,
      run_timeout: this.runTimeoutMs,
      run_memory_limit: this.memoryLimitMb > 0 ? this.memoryLimitMb * 1024 * 1024 : -1,
    };

    // Wall-clock guard so a hung engine can't hang the request forever.
    const controller = new AbortController();
    const guard = setTimeout(() => controller.abort(), this.runTimeoutMs + 15_000);
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      logger.error({ err }, 'Piston execute request failed');
      return errorResult('Execution engine is unreachable. Please try again.');
    } finally {
      clearTimeout(guard);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.error({ status: res.status, text }, 'Piston returned a non-2xx response');
      return errorResult(`Execution engine error (${res.status}).`);
    }

    const data = (await res.json()) as PistonResponse;
    return mapResult(data);
  }

  private async resolveVersion(language: RoomLanguage): Promise<string> {
    if (!this.versions) {
      const res = await fetch(`${this.baseUrl}/runtimes`);
      if (!res.ok) {
        throw new Error(`Piston /runtimes failed (${res.status})`);
      }
      const runtimes = (await res.json()) as PistonRuntime[];
      const map = new Map<string, string>();
      for (const rt of runtimes) {
        const ids = [rt.language, ...(rt.aliases ?? [])];
        for (const id of ids) {
          // Keep the highest version seen per language id.
          const prev = map.get(id);
          if (!prev || compareSemver(rt.version, prev) > 0) {
            map.set(id, rt.version);
          }
        }
      }
      this.versions = map;
    }
    const version = this.versions.get(PISTON_LANGUAGE[language]);
    if (!version) {
      throw new Error(`No Piston runtime available for ${language}`);
    }
    return version;
  }
}

function mapResult(data: PistonResponse): RunResult {
  const compile = data.compile;
  if (compile && compile.code !== 0 && (compile.stderr || compile.code !== null)) {
    return {
      status: 'compile_error',
      stdout: compile.stdout ?? '',
      stderr: compile.stderr || 'Compilation failed.',
      exitCode: compile.code,
      timeMs: msFrom(compile),
      memoryKb: kbFrom(compile),
    };
  }
  const run = data.run;
  const timedOut = run.signal === 'SIGKILL' && (run.code === null || run.code === 137);
  const status = timedOut ? 'timeout' : run.code === 0 ? 'success' : 'runtime_error';
  return {
    status,
    stdout: run.stdout ?? '',
    stderr: timedOut ? run.stderr || 'Process killed (time or memory limit exceeded).' : run.stderr ?? '',
    exitCode: run.code,
    timeMs: msFrom(run),
    memoryKb: kbFrom(run),
  };
}

function msFrom(stage: PistonStage): number | null {
  if (typeof stage.cpu_time === 'number') return stage.cpu_time;
  if (typeof stage.wall_time === 'number') return stage.wall_time;
  return null;
}

function kbFrom(stage: PistonStage): number | null {
  return typeof stage.memory === 'number' ? Math.round(stage.memory / 1024) : null;
}

function errorResult(message: string): RunResult {
  return { status: 'error', stdout: '', stderr: message, exitCode: null, timeMs: null, memoryKb: null };
}

/** Returns >0 if a>b, <0 if a<b, 0 if equal. Tolerant of non-numeric parts. */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
