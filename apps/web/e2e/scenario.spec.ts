/**
 * Het hoofdscenario door de echte interface: een klant toevoegen, een factuur
 * maken en definitief maken, en controleren dat de cijfers meebewegen en
 * doorklikbaar zijn.
 */
import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('een klant toevoegen', async ({ page }) => {
  await page.goto('/relaties');

  await page.getByRole('button', { name: /nieuwe relatie/i }).click();
  await page.getByLabel(/^naam\s*\*?$/i).fill('E2E Klant');
  await page.getByLabel(/e-mailadres/i).first().fill('klant@voorbeeld.test');
  await page.getByLabel(/^adres$/i).fill('Klantweg 2');
  await page.getByLabel(/^postcode$/i).fill('4321 BA');
  await page.getByLabel(/^plaats$/i).fill('Elders');
  await page.getByRole('button', { name: /^opslaan$/i }).click();

  await expect(page.getByRole('cell', { name: 'E2E Klant' })).toBeVisible();
});

test('een factuur maken en definitief maken', async ({ page }) => {
  await page.goto('/facturen/nieuw');

  await page.getByLabel(/^klant/i).selectOption({ label: 'E2E Klant' });
  await page.getByLabel(/^omschrijving/i).fill('Advies voor de e2e-test');
  await page.getByLabel(/^prijs/i).fill('1000');

  // Het totaal wordt live meegerekend, inclusief 21% btw.
  await expect(page.getByText('€ 1.210,00').first()).toBeVisible();

  await page.getByRole('button', { name: /definitief maken/i }).click();
  await expect(page.getByRole('status').first()).toContainText(/nummer/i);
  await expect(page.getByText(/definitief|verzonden/i).first()).toBeVisible();
});

test('de factuur staat in het overzicht met de juiste status', async ({ page }) => {
  await page.goto('/facturen');
  await expect(page.getByRole('cell', { name: 'E2E Klant' })).toBeVisible();
  await expect(page.getByText('€ 1.210,00').first()).toBeVisible();
});

test('het dashboard toont de omzet', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /hoe gaat het met je bedrijf/i })).toBeVisible();
  await expect(page.getByText('€ 1.000,00').first()).toBeVisible();
});

test('de balans sluit en de winst-en-verliesrekening is doorklikbaar', async ({ page }) => {
  await page.goto('/cijfers');
  await expect(page.getByRole('status').filter({ hasText: /balans sluit/i })).toBeVisible();

  await page.getByRole('link', { name: /winst en verlies/i }).click();
  await expect(page.getByText('€ 1.000,00').first()).toBeVisible();

  // Van rapport naar grootboekkaart naar het brondocument.
  await page.getByRole('button', { name: /omzet hoog tarief/i }).click();
  await expect(page.getByRole('heading', { name: /omzet hoog tarief/i })).toBeVisible();
  await expect(page.getByRole('cell', { name: /VRK/ }).first()).toBeVisible();
});

test('het btw-overzicht toont het voorbehoud en sluit aan', async ({ page }) => {
  await page.goto('/cijfers/btw');
  await expect(page.getByText(/geen belastingadvies/i)).toBeVisible();
  await expect(page.getByRole('cell', { name: '1a' })).toBeVisible();
  await expect(page.getByText(/sluit precies aan/i)).toBeVisible();
});

test('de audit trail is compleet en ongeschonden', async ({ page }) => {
  await page.goto('/instellingen/audit');
  await expect(page.getByText(/niets achteraf gewijzigd/i)).toBeVisible();
  await expect(page.getByRole('cell', { name: 'verkoopfactuur.definitief' })).toBeVisible();
});

test('taal en donkere modus werken', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /hoe gaat het met je bedrijf/i })).toBeVisible();

  await page.getByLabel(/taal/i).selectOption('en');
  await expect(page.getByRole('heading', { name: /how is your business doing/i })).toBeVisible();
  await expect(page.getByText('Revenue', { exact: true }).first()).toBeVisible();

  await page.getByLabel(/appearance/i).selectOption('donker');
  await expect(page.locator('html')).toHaveAttribute('data-thema', 'donker');
});

test('de app is met het toetsenbord te bedienen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /hoe gaat het met je bedrijf/i })).toBeVisible();

  // De eerste tab-stop is de overslaan-link naar de inhoud.
  await page.keyboard.press('Tab');
  const eerste = await page.evaluate(() => document.activeElement?.textContent ?? '');
  expect(eerste.toLowerCase()).toContain('inhoud');

  // Elk interactief element in de navigatie is bereikbaar en heeft een naam.
  const links = page.getByRole('navigation', { name: /hoofdmenu/i }).getByRole('link');
  await expect(links).toHaveCount(7);
  for (const link of await links.all()) {
    await expect(link).toHaveAccessibleName(/\S/);
  }
});
