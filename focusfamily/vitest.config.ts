import { defineConfig } from 'vitest/config';

/**
 * Root-level runner options. The API suite talks to one shared PostgreSQL
 * database and truncates it between files, so files must not overlap.
 */
export default defineConfig({
  test: {
    fileParallelism: false,
  },
});
