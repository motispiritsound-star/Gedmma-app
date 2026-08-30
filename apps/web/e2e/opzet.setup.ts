/**
 * Eenmalige opzet voor de e2e-tests: een gebruiker registreren, aanmelden en
 * een administratie opzetten. De sessie wordt bewaard zodat de andere tests
 * niet steeds opnieuw hoeven aan te melden - dat zou bovendien tegen de
 * brute-force-bescherming aanlopen, en die hoort er te zijn.
 */
import { expect, test as setup } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const SESSIE_BESTAND = 'e2e/.auth/gebruiker.json';
export const GEGEVENS_BESTAND = 'e2e/.auth/gegevens.json';

setup('gebruiker en administratie klaarzetten', async ({ page }) => {
  const uniek = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const email = `e2e-${uniek}@voorbeeld.test`;
  const wachtwoord = 'een lang wachtwoord voor de test';

  await page.goto('/');

  await page.getByRole('button', { name: /nog geen account/i }).click();
  await page.getByLabel(/je naam/i).fill('E2E Ondernemer');
  await page.getByLabel(/e-mailadres/i).fill(email);
  await page.getByLabel(/wachtwoord/i).fill(wachtwoord);
  await page.getByRole('button', { name: /account aanmaken/i }).click();

  await expect(page.getByRole('status')).toContainText(/aanmelden/i);

  await page.getByLabel(/e-mailadres/i).fill(email);
  await page.getByLabel(/wachtwoord/i).fill(wachtwoord);
  await page.getByRole('button', { name: /^aanmelden$/i }).click();

  await expect(page.getByRole('heading', { name: /kies een administratie/i })).toBeVisible();
  await page.getByLabel(/naam van de onderneming/i).fill('E2E Advies');
  await page.getByLabel(/^adres$/i).fill('Teststraat 1');
  await page.getByLabel(/postcode en plaats/i).fill('1234 AB Teststad');
  await page.getByLabel(/btw-identificatienummer/i).fill('NL123456789B01');
  await page.getByLabel(/kvk-nummer/i).first().fill('12345678');
  await page.getByRole('button', { name: /nieuwe administratie/i }).click();

  await expect(page.getByRole('heading', { name: /hoe gaat het met je bedrijf/i })).toBeVisible();

  mkdirSync(dirname(SESSIE_BESTAND), { recursive: true });
  await page.context().storageState({ path: SESSIE_BESTAND });
  writeFileSync(GEGEVENS_BESTAND, JSON.stringify({ email, wachtwoord }, null, 2));
});
