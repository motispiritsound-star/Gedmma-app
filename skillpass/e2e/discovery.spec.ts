import { expect, test } from '@playwright/test';

test.describe('discovery is bilingual and public', () => {
  test('serves the Dutch home page and switches to English', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/nl$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Eén abonnement');

    await page.getByRole('link', { name: 'en', exact: true }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('One subscription');
  });

  test('shows the same activity in Dutch and in English', async ({ page }) => {
    await page.goto('/nl/search?q=Turnen');
    await expect(page.getByRole('link', { name: 'Turnen voor beginners' })).toBeVisible();

    await page.goto('/en/search?q=Gymnastics');
    await expect(page.getByRole('link', { name: 'Gymnastics for beginners' })).toBeVisible();
  });

  test('filters by category and age band', async ({ page }) => {
    await page.goto('/nl/search?category=TECHNOLOGY&ageBand=AGE_12_14');
    await expect(page.getByText(/activiteiten gevonden/)).toBeVisible();
    await expect(page.getByRole('link', { name: /3D-ontwerpen en printen/ })).toBeVisible();
    // A gymnastics class for 6–11 year olds must not appear under this filter.
    await expect(page.getByRole('link', { name: 'Turnen voor beginners' })).toHaveCount(0);
  });

  test('hides the exact address from anonymous visitors', async ({ page }) => {
    await page.goto('/nl/search?q=Turnen');
    await page.getByRole('link', { name: 'Turnen voor beginners' }).click();

    await expect(page.getByText('Locatie bij benadering')).toBeVisible();
    await expect(page.getByText('Amsterdamsestraatweg 512')).toHaveCount(0);
    // Booking requires an account.
    await expect(page.getByRole('link', { name: 'Inloggen' }).first()).toBeVisible();
  });

  test('offers a map view built from approximate positions', async ({ page }) => {
    await page.goto('/nl/search?view=map');
    await expect(page.getByRole('img', { name: /Locatie bij benadering/ })).toBeVisible();
  });
});
