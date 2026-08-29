import { execSync } from 'node:child_process';
import { afterAll, beforeAll } from 'vitest';

/**
 * Pushes the schema into the test database once per run. `prisma db push`
 * is idempotent, so a warm database costs a second and a cold one just works.
 */
beforeAll(() => {
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
});

afterAll(async () => {
  const { prisma } = await import('../../src/lib/db.ts');
  await prisma.$disconnect();
});
