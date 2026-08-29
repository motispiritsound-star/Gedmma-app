/**
 * Records the app in use, as video.
 *
 * These are real screen captures of the running application — not mock-ups and
 * not renders. Three cuts, each one a complete piece of the story:
 *
 *   1. ouder-bestelt   a parent orders a box and pays in test mode
 *   2. kind-luistert   a child works through a chapter, hint branch and all
 *   3. redactie-keurt  an editor writes, an approver publishes
 *
 * Run against a seeded database with the dev server up:
 *   npm run db:seed && npm run dev
 *   npx tsx scripts/record-demo.mts
 *
 * Output lands in marketing/video/ as WebM. Every cut is paced for a viewer,
 * not for a test runner: there are deliberate pauses so a person can read the
 * screen, and the voice-over script in marketing/VIDEO.md is timed to match.
 */
import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, type Page } from '@playwright/test';

const BASE = process.env.APP_URL ?? 'http://localhost:3000';
const OUT = resolve(process.cwd(), 'marketing/video');
const PASSWORD = 'wonderbox-demo';

/** Human-paced beat. Long enough to read a heading, short enough not to drag. */
const beat = (page: Page, ms = 1400) => page.waitForTimeout(ms);

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('E-mailadres').fill(email);
  await page.getByLabel('Wachtwoord').fill(PASSWORD);
  await beat(page, 600);
  await page.getByRole('button', { name: 'Inloggen' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

async function record(
  name: string,
  fn: (page: Page) => Promise<void>,
): Promise<void> {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'nl-NL',
    recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
    // Autoplay would otherwise be blocked, and the narration is the point.
    permissions: [],
  });
  const page = await context.newPage();

  try {
    await fn(page);
    await beat(page, 1200);
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();
    if (video) {
      const produced = await video.path();
      await rename(produced, resolve(OUT, `${name}.webm`));
    }
  }
  console.log(`  ✓ ${name}.webm`);
}

async function parentOrders(page: Page): Promise<void> {
  await page.goto(`${BASE}/`);
  await beat(page, 2200);

  await page.getByRole('link', { name: 'Bekijk alle dozen' }).click();
  await beat(page, 1800);

  await page.getByRole('link', { name: 'Natuurdetective' }).click();
  await beat(page, 2000);
  // Linger on the safety block: it is on the sales page on purpose.
  await page.getByRole('heading', { name: 'Veiligheid' }).scrollIntoViewIfNeeded();
  await beat(page, 2400);

  await signIn(page, 'ouder@wonderbox.test');
  await page.goto(`${BASE}/boxes/natuurdetective`);
  await beat(page, 1000);

  await page.getByRole('button', { name: 'Los bestellen' }).click();
  await page.waitForURL(/\/checkout\/mock\//);
  await beat(page, 2400);

  await page.getByRole('button', { name: 'Betaling bevestigen' }).click();
  await page.waitForURL(/\/account\/orders\//);
  await beat(page, 2400);

  await page.goto(`${BASE}/account/activate`);
  await beat(page, 1600);
}

async function childListens(page: Page): Promise<void> {
  await signIn(page, 'ouder@wonderbox.test');
  await page.goto(`${BASE}/play`);
  await beat(page, 1800);

  await page.getByRole('link', { name: 'Start' }).first().click();
  await page.waitForURL(/\/play\/[^/]+$/);
  await beat(page, 2200);

  // Chapter two rather than one: the demo family has already listened to part
  // of chapter one, so it would resume mid-story. This one opens clean.
  const chapter = page
    .locator('li')
    .filter({ hasText: 'Aankomst op de maan' })
    .getByRole('link', { name: 'Start' });
  await chapter.click();
  await page.waitForURL(/\/play\/[^/]+\/[^/?]+/);

  const spoken = page.getByTestId('companion-text');
  await spoken.waitFor({ timeout: 20_000 });
  await beat(page, 2000);

  await page.getByRole('button', { name: 'Afspelen' }).click();
  await beat(page, 3000);

  await page.getByRole('button', { name: 'Verder' }).click();
  await beat(page, 3400);

  // Show "slower" before the question is answered: it is the second-most-used
  // button on the box and the reason a seven-year-old stays with it.
  await page.getByRole('button', { name: 'Langzamer' }).click();
  await beat(page, 2800);

  // Then the wrong answer, on purpose. Being wrong routes to a hint that
  // rejoins the story — there is no buzzer anywhere in this product.
  await page.getByRole('button', { name: 'Geen idee' }).click();
  await beat(page, 3400);

  await page.getByRole('button', { name: 'Dan blijft het staan' }).click();
  await beat(page, 3400);

  await page.getByRole('button', { name: 'Verder' }).click();
  await beat(page, 3000);

  await page.goto(`${BASE}/account/summary`);
  await beat(page, 3400);
}

async function editorPublishes(page: Page): Promise<void> {
  await signIn(page, 'editor@wonderbox.test');
  await beat(page, 2000);

  await page.goto(`${BASE}/studio/drafts`);
  await beat(page, 2400);
  await page
    .getByLabel('brief')
    .fill('Een openingsvraag over zwaartekracht voor een kind van acht.');
  await beat(page, 1200);
  await page.getByRole('button', { name: 'Concept genereren' }).click();
  await beat(page, 2600);

  await page.goto(`${BASE}/studio/approvals`);
  await beat(page, 2400);

  await signIn(page, 'approver@wonderbox.test');
  await page.goto(`${BASE}/studio/approvals`);
  await beat(page, 2800);
}

async function main(): Promise<void> {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  console.log(`Recording against ${BASE} …`);
  await record('01-ouder-bestelt', parentOrders);
  await record('02-kind-luistert', childListens);
  await record('03-redactie-keurt', editorPublishes);

  // Playwright leaves its own temp names behind if a cut failed mid-way.
  for (const file of await readdir(OUT)) {
    if (!/^\d\d-/.test(file)) await rm(resolve(OUT, file), { force: true });
  }
  console.log(`\nKlaar. ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
