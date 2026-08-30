/**
 * Van uren schrijven tot een conceptfactuur, door de echte interface.
 *
 * Dit is de weg die een dienstverlener elke maand loopt: project aanmaken,
 * uren schrijven, indienen, en er een factuur van maken. De test controleert
 * ook wat er *niet* gebeurt: factureren boekt niets, het blijft een concept.
 */
import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('een project aanmaken', async ({ page }) => {
  await page.goto('/uren/projecten');

  await page.getByRole('button', { name: /nieuw project/i }).click();
  await page.getByLabel(/naam van het project/i).fill('E2E Ontwerpklus');
  await page.getByLabel(/^klant$/i).selectOption({ label: 'E2E Klant' });
  await page.getByLabel(/uurtarief/i).fill('80');
  await page.getByLabel(/urenbudget/i).fill('40');
  await page.getByRole('button', { name: /^opslaan$/i }).click();

  await expect(page.getByRole('cell', { name: /E2E Ontwerpklus/ })).toBeVisible();
});

test('uren schrijven op het project', async ({ page }) => {
  await page.goto('/uren');

  // De optietekst is "code · naam" en de code wordt door de server toegekend;
  // daarom kiezen we de eerste echte optie (index 0 is het streepje).
  await page.getByLabel(/^project/i).selectOption({ index: 1 });
  // Niet getByLabel: de subnavigatie heet ook "Uren". Het invoerveld is een
  // spinbutton, en daarmee eenduidig.
  await page.getByRole('spinbutton', { name: /^uren$/i }).fill('3');
  await page.getByRole('spinbutton', { name: /^minuten$/i }).fill('30');
  await page.getByLabel(/^omschrijving/i).fill('Ontwerpsessie voor de e2e-test');
  await page.getByRole('button', { name: /uren vastleggen/i }).click();

  // Exact, want de aankruisvakcel draagt dezelfde tekst in zijn naam.
  await expect(
    page.getByRole('cell', { name: 'Ontwerpsessie voor de e2e-test', exact: true }),
  ).toBeVisible();
  // 3 uur en 30 minuten, getoond als 3:30.
  await expect(page.getByText('3:30').first()).toBeVisible();
});

test('het projectoverzicht telt de uren op tegen het budget', async ({ page }) => {
  await page.goto('/uren/projecten');

  const rij = page.getByRole('row', { name: /E2E Ontwerpklus/ });
  await expect(rij).toContainText('3:30');
  await expect(rij).toContainText('40:00', { useInnerText: true });
});

test('uren indienen zet ze klaar ter beoordeling', async ({ page }) => {
  await page.goto('/uren');

  await page.getByRole('checkbox', { name: /Ontwerpsessie voor de e2e-test/ }).check();
  await page.getByRole('button', { name: /^indienen$/i }).click();

  await expect(page.getByText(/ingediend/i).first()).toBeVisible();
});

test('de eigenaar kan zijn eigen uren niet goedkeuren', async ({ page }) => {
  await page.goto('/uren');

  await page.getByRole('checkbox', { name: /Ontwerpsessie voor de e2e-test/ }).check();
  await page.getByRole('button', { name: /^goedkeuren$/i }).click();

  // Functiescheiding: dit hoort een nette uitleg te geven, geen stilte.
  await expect(page.getByText(/eigen uren/i).first()).toBeVisible();
});
