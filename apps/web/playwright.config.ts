import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests tegen de echte stack: de API met een echte database en de
 * webapp in een echte browser. Er wordt niets gemockt, want een e2e-test met
 * mocks bewijst niets.
 */
/**
 * Op een machine waar Chromium al klaarstaat (bijvoorbeeld een CI-image) wijst
 * CHROMIUM_PAD naar dat binaire bestand, zodat Playwright niets hoeft te
 * downloaden. Zonder die variabele gebruikt Playwright zijn eigen browser.
 */
const launchOptions = process.env.CHROMIUM_PAD ? { executablePath: process.env.CHROMIUM_PAD } : {};

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_URL ?? 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'nl-NL',
    timezoneId: 'Europe/Amsterdam',
  },
  /**
   * Playwright start de hele stack zelf: database-migraties, API en webapp.
   * Draait er al iets op poort 5173, dan wordt dat hergebruikt.
   */
  webServer: {
    command: 'npm run dev',
    cwd: '../..',
    // Alle e2e-verzoeken komen van hetzelfde adres; zonder verruiming loopt de
    // suite tegen de brute-force-bescherming aan die er juist hoort te zijn.
    // De factor wordt in productie genegeerd (zie apps/api/src/config.ts).
    env: { ...process.env, RATE_LIMIT_FACTOR: '200' },
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    { name: 'opzet', testMatch: /opzet\.setup\.ts/, use: { launchOptions } },
    {
      name: 'chromium',
      testMatch: /scenario\.spec\.ts/,
      dependencies: ['opzet'],
      use: { ...devices['Desktop Chrome'], launchOptions, storageState: 'e2e/.auth/gebruiker.json' },
    },
    {
      name: 'mobiel',
      testMatch: /mobiel\.spec\.ts/,
      dependencies: ['opzet'],
      use: { ...devices['Pixel 5'], launchOptions, storageState: 'e2e/.auth/gebruiker.json' },
    },
  ],
});
