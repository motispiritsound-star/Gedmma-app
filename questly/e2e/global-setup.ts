import { config } from 'dotenv'
import { prepareTestDatabase } from '../tests/setup/prepare-database'

/** Prepares the end-to-end database before Playwright starts the server. */
export default async function globalSetup() {
  config({ path: '.env.test', quiet: true, override: true })
  await prepareTestDatabase()
}
