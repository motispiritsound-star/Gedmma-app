import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` is a Next.js build-time guard with no runtime behaviour.
      'server-only': fileURLToPath(new URL('./tests/setup/server-only-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup/setup.ts'],
    globalSetup: ['./tests/setup/global-setup.ts'],
    // Integration tests share one database; running the files sequentially in a
    // single worker keeps the data deterministic without per-test schemas.
    pool: 'forks',
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
