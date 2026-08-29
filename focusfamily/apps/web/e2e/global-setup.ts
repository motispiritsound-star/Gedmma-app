import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * Rebuild the demo family before every end-to-end run.
 *
 * The journeys write real data - a check-in, a completed focus moment, a
 * scheduled deletion - so a second run against yesterday's database would test
 * something other than the flow it claims to test.
 */
export default function globalSetup(): void {
  const root = path.resolve(process.cwd(), '../..');
  const env = {
    ...process.env,
    DATABASE_URL:
      process.env.E2E_DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/focusfamily_e2e?schema=public',
  };
  execFileSync('npx', ['prisma', 'migrate', 'deploy', '--schema', 'packages/db/prisma/schema.prisma'], {
    cwd: root,
    env,
    stdio: 'pipe',
  });
  execFileSync('node', ['packages/db/dist/seed.js'], { cwd: root, env, stdio: 'pipe' });
}
