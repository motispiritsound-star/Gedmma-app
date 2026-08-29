import { execSync } from 'node:child_process';
import { config as loadDotenv } from 'dotenv';

/**
 * Applies migrations to the test database once per run. The test database is
 * separate from the development one (TEST_DATABASE_URL) and is truncated
 * between test files, never seeded implicitly.
 */
export default function setup() {
  loadDotenv({ override: false, quiet: true });
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('TEST_DATABASE_URL is not set. Copy .env.example to .env (see README.md).');
  }
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
