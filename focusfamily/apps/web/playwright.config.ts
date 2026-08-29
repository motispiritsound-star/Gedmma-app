import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 3100;
const API_PORT = 4100;
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/focusfamily_e2e?schema=public';

/**
 * The end-to-end suite runs the real stack: Fastify against PostgreSQL and a
 * production Next.js build in front of it. Nothing is stubbed, so a passing run
 * means the journeys in the README actually work.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list']] : [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    locale: 'nl-NL',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Some environments ship a Chromium build that does not match the
        // version Playwright would download. PLAYWRIGHT_CHROMIUM_EXECUTABLE
        // points at the one that is actually installed.
        ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
          ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }
          : {}),
      },
    },
  ],
  webServer: [
    {
      command: 'node apps/api/dist/main.js',
      cwd: '../..',
      port: API_PORT,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'production',
        PORT: String(API_PORT),
        HOST: '127.0.0.1',
        DATABASE_URL,
        SESSION_SECRET: 'end-to-end-session-secret-at-least-32-chars',
        ALLOWED_ORIGINS: `http://localhost:${WEB_PORT}`,
        WEB_BASE_URL: `http://localhost:${WEB_PORT}`,
        FOCUSFAMILY_USE_MOCK: '1',
      },
    },
    {
      command: `npx next start -p ${WEB_PORT}`,
      cwd: '.',
      port: WEB_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NODE_ENV: 'production',
        FOCUSFAMILY_API_URL: `http://127.0.0.1:${API_PORT}`,
        FOCUSFAMILY_WEB_ORIGIN: `http://localhost:${WEB_PORT}`,
      },
    },
  ],
});
