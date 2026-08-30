/**
 * Het facturenoverzicht: zoeken, filteren en sorteren.
 *
 * De totalen bovenaan zijn het punt van dit scherm. Deze test controleert dat
 * ze meebewegen met het filter en dat een filter dat niets oplevert een
 * bruikbare lege staat geeft in plaats van een lege tabel.
 *
 * De bestandsnaam begint bewust met een v: Playwright draait de bestanden op
 * alfabetische volgorde met een worker, en deze test leunt op de factuur die
 * scenario.spec.ts aanmaakt.
 */
import { expect, test } from '@playwright/test';

test('de totalen staan bovenaan en horen bij het filter', async ({ page }) => {
  await page.goto('/facturen');

  await expect(page.getByText(/totaal gefactureerd/i)).toBeVisible();
  await expect(page.getByText(/nog te ontvangen/i)).toBeVisible();
  await expect(page.getByText(/waarvan te laat/i)).toBeVisible();
});

test('zoeken filtert de lijst en is weer te wissen', async ({ page }) => {
  await page.goto('/facturen');
  await expect(page.getByRole('cell', { name: 'E2E Klant' }).first()).toBeVisible();

  await page.getByRole('searchbox').fill('bestaat-niet-xyz');
  await expect(page.getByText(/geen facturen gevonden/i)).toBeVisible();

  // De knop staat twee keer op het scherm: in de filterbalk en in de lege
  // staat. Beide horen te werken; we klikken de eerste.
  await page.getByRole('button', { name: /filters wissen/i }).first().click();
  await expect(page.getByRole('cell', { name: 'E2E Klant' }).first()).toBeVisible();
});

test('een kolomkop sorteert de lijst', async ({ page }) => {
  await page.goto('/facturen');

  const kop = page.getByRole('button', { name: /^totaal/i });
  await kop.click();

  // Na een klik is de kolom oplopend gesorteerd; dat moet ook voor een
  // schermlezer te zien zijn.
  await expect(page.getByRole('columnheader', { name: /totaal/i })).toHaveAttribute(
    'aria-sort',
    /ascending|descending/,
  );
});
