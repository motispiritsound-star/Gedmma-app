import { execSync } from 'node:child_process';

/**
 * Points the suite at a dedicated database and brings its schema up to date.
 * `db push` rather than `migrate deploy`, because the test database is
 * disposable and does not need migration history.
 */
export default function setup() {
  process.env.NODE_ENV = 'test';
  const databaseUrl =
    process.env.TEST_DATABASE_URL ??
    'postgresql://buurklus:buurklus@localhost:5432/buurklus_test?schema=public';
  process.env.DATABASE_URL = databaseUrl;

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  execSync('npx tsx prisma/seed.ts', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl, SKIP_DEMO_SEED: 'true' },
  });
}
