import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'

config({ path: '.env.test', quiet: true, override: true })

const PORT = 3100
const baseURL = `http://127.0.0.1:${PORT}`

/**
 * End-to-end configuration.
 *
 * The suite runs against a production build on the `questly_test` database, so
 * it exercises the same code path a deployment does. `PLAYWRIGHT_CHROMIUM_PATH`
 * is an escape hatch for environments that ship their own Chromium build.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'nl-NL',
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },
  projects: [
    // Signs in once per role and stores the session for the suites that need it.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  webServer: {
    command: `npx next build && npx next start --port ${PORT}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      SESSION_SECRET: process.env.SESSION_SECRET ?? '',
      APP_URL: baseURL,
      DEFAULT_LOCALE: 'nl',
      MEDIA_DRIVER: 'local',
      MEDIA_LOCAL_DIR: './.data/media-e2e',
      PAYMENT_DRIVER: 'mock',
      EMAIL_DRIVER: 'console',
      AI_DRIVER: 'none',
      LOG_LEVEL: 'error',
    },
  },
})
