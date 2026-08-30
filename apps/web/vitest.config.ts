import { defineConfig, mergeConfig } from 'vitest/config';
import basis from './vite.config.ts';

export default mergeConfig(
  basis,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./test/opzet.ts'],
      include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    },
  }),
);
