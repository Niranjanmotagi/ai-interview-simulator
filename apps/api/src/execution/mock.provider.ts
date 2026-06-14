import type { ExecutionService, RunRequest, RunResult } from './types';

/**
 * Deterministic, offline executor. It does NOT run real code — it returns a
 * predictable result so the product loop, tests, and CI work without an external
 * engine. It still exercises the two important branches: a normal success and a
 * timeout (when the code contains an obvious infinite loop), so the UI's
 * loading/timeout handling is testable.
 */
const INFINITE_LOOP = /while\s*\(\s*true\s*\)|while\s+True\s*:|for\s*\(\s*;\s*;\s*\)|loop\s*\{/;

export class MockExecutor implements ExecutionService {
  readonly name = 'mock';

  async run({ language, code, stdin }: RunRequest): Promise<RunResult> {
    if (INFINITE_LOOP.test(code)) {
      return {
        status: 'timeout',
        stdout: '',
        stderr: 'Process exceeded the time limit (mock executor: detected an infinite loop).',
        exitCode: null,
        timeMs: 5000,
        memoryKb: null,
      };
    }
    const out = [`[mock ${language} runner] compiled and executed successfully.`];
    if (stdin.trim()) {
      out.push(`stdin received: ${stdin.trim()}`);
    }
    out.push('(Set EXECUTION_PROVIDER=piston for real sandboxed execution.)');
    return {
      status: 'success',
      stdout: `${out.join('\n')}\n`,
      stderr: '',
      exitCode: 0,
      timeMs: 12,
      memoryKb: 4096,
    };
  }
}
