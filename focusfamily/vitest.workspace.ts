import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'domain',
      root: './packages/domain',
      environment: 'node',
      include: ['test/**/*.test.ts'],
    },
  },
  {
    test: {
      name: 'db',
      root: './packages/db',
      environment: 'node',
      include: ['test/**/*.test.ts'],
    },
  },
  {
    test: {
      name: 'api',
      root: './apps/api',
      environment: 'node',
      include: ['test/**/*.test.ts'],
      testTimeout: 30_000,
      hookTimeout: 60_000,
      globalSetup: ['./test/global-setup.ts'],
    },
  },
]);
