/**
 * Captures marketing/explainer.html to video, in both languages.
 *
 * The page announces `window.__explainerDone` when its timeline has finished,
 * so the recorder stops on the animation rather than on a guessed duration.
 *
 *   npx tsx scripts/record-explainer.mts
 */
import { mkdir, rename, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const OUT = resolve(process.cwd(), 'marketing/video');
const PAGE = pathToFileURL(resolve(process.cwd(), 'marketing/explainer.html')).href;

async function capture(lang: 'nl' | 'en'): Promise<void> {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  // `manual` holds the timeline until we say go, and domcontentloaded means a
  // slow webfont cannot stretch the head of the recording.
  await page.goto(`${PAGE}?lang=${lang}&manual=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => (window as { startExplainer?: () => void }).startExplainer?.());
  await page.waitForFunction(
    () => (window as { __explainerDone?: boolean }).__explainerDone === true,
    undefined,
    { timeout: 90_000 },
  );

  const video = page.video();
  await context.close();
  await browser.close();
  if (video) await rename(await video.path(), resolve(OUT, `04-uitleg-${lang}.webm`));
  console.log(`  ✓ 04-uitleg-${lang}.webm`);
}

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  for (const lang of ['nl', 'en'] as const) {
    await rm(resolve(OUT, `04-uitleg-${lang}.webm`), { force: true });
  }
  console.log('Rendering the explainer …');
  await capture('nl');
  await capture('en');
  console.log(`\nKlaar. ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
