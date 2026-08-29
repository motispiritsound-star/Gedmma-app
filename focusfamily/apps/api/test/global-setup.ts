import { execFileSync } from 'node:child_process';
import { TEST_DATABASE_URL } from './helpers.js';

/**
 * Applies the migrations to the test database once per run. If PostgreSQL is
 * not reachable the whole API project is skipped with a clear message rather
 * than failing in a way that looks like a code problem.
 */
export default function setup(): void {
  try {
    execFileSync(
      'npx',
      ['prisma', 'migrate', 'deploy', '--schema', 'packages/db/prisma/schema.prisma'],
      {
        cwd: new URL('../../..', import.meta.url).pathname,
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
        stdio: 'pipe',
      },
    );
  } catch (error) {
    throw new Error(
      `Could not prepare the API test database at ${TEST_DATABASE_URL}. ` +
        'Start PostgreSQL and create the database, or set TEST_DATABASE_URL.',
      { cause: error },
    );
  }
}
