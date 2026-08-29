import { defineConfig } from 'vitest/config';

/**
 * Tests run against a real PostgreSQL database, not a mock.
 *
 * The interesting claims in this codebase — a stock reservation that survives
 * concurrency, a unique index that makes offline replay idempotent — are
 * claims about the database. Mocking Prisma would test the mock.
 *
 * `fileParallelism: false` keeps the files from truncating each other's rows;
 * concurrency *within* a file (which is what the reservation test needs) still
 * happens for real.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    fileParallelism: false,
    setupFiles: ['./tests/helpers/setup.ts'],
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgresql://wonderbox:wonderbox@127.0.0.1:5432/wonderbox_test',
      SESSION_SECRET: 'test-only-session-secret-0123456789abcdef',
      ACTIVATION_CODE_PEPPER: 'test-activation-pepper',
      PAYMENT_PROVIDER: 'mock',
      SHIPPING_PROVIDER: 'mock',
      STORAGE_DRIVER: 'local',
      STORAGE_LOCAL_ROOT: '.storage-test',
      AI_DRAFT_PROVIDER: 'mock',
      SPEECH_TO_TEXT_ENABLED: 'false',
    },
  },
});
