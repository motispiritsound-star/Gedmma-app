import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./test/global-setup.ts'],
    // The suite shares one PostgreSQL database, so files run one at a time.
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 30_000,
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
