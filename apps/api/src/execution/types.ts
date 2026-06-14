import type { ExecutionStatus, RoomLanguage } from '@ai-interview/types';

export interface RunRequest {
  language: RoomLanguage;
  code: string;
  stdin: string;
}

export interface RunResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs: number | null;
  memoryKb: number | null;
}

/**
 * Strategy interface for code execution. Implementations MUST run untrusted code
 * in an isolated sandbox with CPU/wall/memory limits and no network/filesystem
 * access — the API host never executes candidate code itself.
 */
export interface ExecutionService {
  readonly name: string;
  run(req: RunRequest): Promise<RunResult>;
}
