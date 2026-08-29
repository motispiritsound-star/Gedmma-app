import { execSync } from 'node:child_process'
import { Client } from 'pg'

/**
 * Brings a test database to a known state: migrations applied, every table
 * empty, seed content loaded.
 *
 * The TRUNCATE refuses to run unless the database name ends in `_test`, so a
 * mis-set DATABASE_URL fails loudly rather than destroying real data. Note that
 * `prisma migrate deploy` is used rather than `migrate reset`: it only applies
 * migrations and never drops the database.
 *
 * `pg` is used directly rather than Prisma so this module also loads under
 * Playwright's CommonJS transpiler.
 */
export async function prepareTestDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required (see .env.test).')

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, '')
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to prepare "${databaseName}": the test database name must end with "_test".`,
    )
  }

  const env = { ...process.env, NODE_ENV: 'test' as const, DATABASE_URL: databaseUrl }
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env })

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    const { rows } = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'`,
    )
    if (rows.length > 0) {
      const list = rows.map((row) => `"public"."${row.tablename}"`).join(', ')
      await client.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`)
    }
  } finally {
    await client.end()
  }

  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env })
}
