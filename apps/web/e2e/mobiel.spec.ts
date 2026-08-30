/**
 * Op een telefoonformaat verandert de indeling: het menu wordt een tabbalk
 * onderaan en tabellen worden kaarten. Deze test controleert dat de app dan
 * nog steeds volledig bruikbaar is.
 */
import { expect, test } from '@playwright/test';

test('de navigatie staat onderaan en alles blijft bereikbaar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /hoe gaat het met je bedrijf/i })).toBeVisible();

  const menu = page.getByRole('navigation', { name: /hoofdmenu/i });
  await expect(menu).toBeVisible();

  const venster = page.viewportSize();
  const positie = await menu.boundingBox();
  expect(positie).not.toBeNull();
  expect(positie!.y).toBeGreaterThan((venster?.height ?? 800) / 2);

  await menu.getByRole('link', { name: /facturen/i }).click();
  await expect(page.getByRole('heading', { name: /^facturen$/i })).toBeVisible();
});

test('de pagina scrollt niet horizontaal', async ({ page }) => {
  for (const pad of ['/', '/facturen', '/relaties', '/bank', '/cijfers']) {
    await page.goto(pad);
    await page.waitForTimeout(300);
    const overloop = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overloop, `${pad} scrollt horizontaal`).toBeLessThanOrEqual(1);
  }
});

test('knoppen zijn groot genoeg om met een duim te raken', async ({ page }) => {
  await page.goto('/relaties');
  await page.getByRole('button', { name: /nieuwe relatie/i }).click();

  for (const knop of await page.getByRole('button').all()) {
    if (!(await knop.isVisible())) continue;
    const doos = await knop.boundingBox();
    if (!doos) continue;
    expect(doos.height, `knop "${(await knop.textContent())?.trim()}" is te klein`).toBeGreaterThanOrEqual(32);
  }
});
