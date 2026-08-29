import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ACCOUNTS, signIn } from './helpers.ts';

/**
 * Accessibility.
 *
 * The child-facing companion is the surface that matters most: it is designed
 * to be usable with the screen off, which only works if the controls are real
 * buttons with real names and every change is announced.
 */

const RULES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page }).withTags(RULES).analyze();
}

test.describe('public pages have no accessibility violations', () => {
  for (const path of ['/', '/boxes', '/boxes/junior-ruimteverkenner', '/login', '/signup', '/privacy', '/support']) {
    test(`${path} passes axe`, async ({ page }) => {
      await page.goto(path);
      const results = await scan(page);
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
});

test.describe('signed-in surfaces have no accessibility violations', () => {
  test('parent account pages pass axe', async ({ page }) => {
    await signIn(page, ACCOUNTS.parent);
    for (const path of [
      '/account',
      '/account/children',
      '/account/addresses',
      '/account/subscription',
      '/account/orders',
      '/account/invoices',
      '/account/activate',
      '/account/summary',
      '/account/privacy',
      '/play',
    ]) {
      await page.goto(path);
      const results = await scan(page);
      expect(results.violations, `${path}: ${JSON.stringify(results.violations, null, 2)}`).toEqual(
        [],
      );
    }
  });

  test('the studio and operations consoles pass axe', async ({ page }) => {
    await signIn(page, ACCOUNTS.admin);
    for (const path of [
      '/studio',
      '/studio/themes',
      '/studio/approvals',
      '/studio/drafts',
      '/ops',
      '/ops/inventory',
      '/ops/orders',
      '/ops/shipments',
      '/ops/codes',
      '/ops/support',
    ]) {
      await page.goto(path);
      const results = await scan(page);
      expect(results.violations, `${path}: ${JSON.stringify(results.violations, null, 2)}`).toEqual(
        [],
      );
    }
  });
});

test.describe('the companion is operable without looking at it', () => {
  /**
   * Opens whatever chapter the demo family is currently on. Deliberately not
   * pinned to chapter one: the companion resumes where a child left off, so a
   * test that assumed a fixed opening line would be testing the fixture rather
   * than the product.
   */
  async function openCompanion(page: import('@playwright/test').Page) {
    await page.goto('/play');
    await page.getByRole('link', { name: 'Start' }).first().click();
    // Client-side navigation: wait for each hop rather than clicking blind.
    await page.waitForURL(/\/play\/[^/]+$/);
    await page.getByRole('link', { name: 'Start' }).first().click();
    await page.waitForURL(/\/play\/[^/]+\/[^/?]+/);
    const spoken = page.getByTestId('companion-text');
    await expect(spoken).toBeVisible({ timeout: 20_000 });
    await expect(spoken).not.toBeEmpty();
    return spoken;
  }

  test('controls are named buttons and state changes are announced', async ({ page }) => {
    await signIn(page, ACCOUNTS.parent);
    await openCompanion(page);

    // Every control is a button with an accessible name — not an icon div.
    await expect(page.getByRole('button', { name: 'Afspelen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nog een keer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Langzamer' })).toBeVisible();

    // "Slower" is a toggle, and says so.
    await expect(page.getByRole('button', { name: 'Langzamer' })).toHaveAttribute(
      'aria-pressed',
      /true|false/,
    );

    // What is spoken is mirrored into a live region for screen readers.
    await expect(page.locator('[aria-live="polite"]')).toHaveCount(1);

    const results = await scan(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('the whole chapter can be driven from the keyboard alone', async ({ page }) => {
    await signIn(page, ACCOUNTS.parent);
    const spoken = await openCompanion(page);
    const opening = await spoken.textContent();

    const play = page.getByRole('button', { name: 'Afspelen' });
    await play.focus();
    await expect(play).toBeFocused();
    await page.keyboard.press('Enter');

    // Take whichever branch this node offers, by keyboard only.
    const choices = page.getByRole('group').getByRole('button');
    await expect(choices.first()).toBeVisible();
    await choices.first().focus();
    await expect(choices.first()).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(spoken).not.toHaveText(opening ?? '');
  });

  test('the skip link is the first thing a keyboard user reaches', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Naar de inhoud' })).toBeFocused();
  });

  test('the emulator page is reachable and labelled', async ({ page }) => {
    await signIn(page, ACCOUNTS.parent);
    await page.goto('/emulator');
    await expect(page.getByRole('heading', { name: /HardwareCompanionProtocol/ })).toBeVisible();
    const results = await scan(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
