import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

/**
 * The production build is part of the definition of done: type errors and
 * server/client boundary mistakes must fail the suite, not the deploy.
 * Skip locally with SKIP_BUILD_TEST=1 when iterating on unrelated tests.
 */
const shouldRun = process.env.SKIP_BUILD_TEST !== '1';

describe.skipIf(!shouldRun)('production build', () => {
  it('type-checks and builds successfully', () => {
    expect(() =>
      execSync('npm run build', {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'production' },
      }),
    ).not.toThrow();
  }, 600_000);
});
