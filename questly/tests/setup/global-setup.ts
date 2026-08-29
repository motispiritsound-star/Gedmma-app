import { config } from 'dotenv'
import { prepareTestDatabase } from './prepare-database'

/** Prepares the integration-test database once per vitest run. */
export default async function globalSetup() {
  // `override` so an exported DATABASE_URL from the shell cannot point the
  // suite at a development database.
  config({ path: '.env.test', quiet: true, override: true })
  await prepareTestDatabase()
}
