import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Covers the parts of the app that are plain TypeScript: translations, the
 * posting draft and the formatters. Screens are exercised by hand and, later,
 * by a Detox suite on a device.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
