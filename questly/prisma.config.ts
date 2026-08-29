import { defineConfig } from 'prisma/config'

/**
 * Prisma 7 reads migration/CLI configuration from this file rather than from
 * the schema. `DATABASE_URL` is loaded from `.env` (or `.env.test` when
 * `DOTENV_CONFIG_PATH` points at it) before the CLI runs.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
