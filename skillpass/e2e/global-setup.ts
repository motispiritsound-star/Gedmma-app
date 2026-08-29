import { execFileSync, execSync } from 'node:child_process';

/**
 * Rebuilds the development database from the seed before every e2e run, so the
 * journeys always start from the documented demo dataset.
 */
export default function globalSetup() {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  execFileSync('node', ['--experimental-strip-types', 'prisma/seed.ts'], { stdio: 'inherit' });
}
