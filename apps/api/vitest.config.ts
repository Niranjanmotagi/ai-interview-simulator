import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@ai-interview/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    hookTimeout: 120_000,
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
