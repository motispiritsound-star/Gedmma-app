import { expect, test } from '@playwright/test';

/**
 * Registration through to a paid subscription, entirely in mock mode:
 * register → verify email → add a child → subscribe → mock checkout →
 * signed webhook → credits appear in the ledger.
 */
test('a new family registers, verifies, adds a child and subscribes', async ({ page }) => {
  const email = `nieuwe.ouder+${Date.now()}@example.com`;

  await page.goto('/nl/auth/register');
  await page.getByLabel('Jouw naam').fill('Nieuwe Ouder');
  await page.getByLabel('Naam van je gezin').fill('Familie Testers');
  await page.getByLabel('E-mailadres').fill(email);
  await page.getByLabel('Wachtwoord').fill('zonnebloem-fiets-42');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Account aanmaken' }).click();

  // The account exists but is not verified yet.
  await expect(page.getByRole('heading', { name: 'Bevestig je e-mailadres' })).toBeVisible();

  // In mock-email mode the verification link is surfaced for development.
  await page.getByTestId('dev-verify-link').click();
  await expect(page.getByText('Je e-mailadres is bevestigd')).toBeVisible();
  await page.getByTestId('verified-continue').click();

  // --- add a child profile using an age band, never a date of birth --------
  await expect(page.getByRole('heading', { name: 'Mijn gezin' })).toBeVisible();
  const form = page.getByTestId('add-child-form');
  await form.getByLabel('Roepnaam').fill('Test');
  await form.getByLabel('Leeftijdsgroep').selectOption('AGE_9_11');
  await form.getByRole('checkbox', { name: 'Tekenen' }).check();
  await form.getByRole('button', { name: 'Kindprofiel toevoegen' }).click();
  await expect(page.getByText('Kindprofiel toegevoegd.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Test', level: 3 })).toBeVisible();

  // --- subscribe through the mock payment provider -------------------------
  await page.goto('/nl/plans');
  await expect(page.getByText('Betalingen draaien in test-/mockmodus. Er wordt geen echt geld verwerkt.')).toBeVisible();
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Gezin maandelijks' })
    .getByRole('button', { name: 'Kies dit abonnement' })
    .click();

  await expect(page.getByRole('heading', { name: 'Confirm your payment' })).toBeVisible();
  await page.getByTestId('mock-pay').click();

  // The webhook grants the monthly credits; the ledger shows them.
  await page.waitForURL('**/nl/plans**');
  await expect(page.getByText('8 credits', { exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Monthly credits/ })).toBeVisible();
});

test('registration refuses a password that is too short', async ({ page }) => {
  await page.goto('/en/auth/register');
  await page.getByLabel('Your name').fill('Short Password');
  await page.getByLabel('Family name').fill('Test');
  await page.getByLabel('Email address').fill(`short+${Date.now()}@example.com`);
  // Bypass the browser's own minlength so the server rule is what answers.
  await page.getByLabel('Password').evaluate((input: HTMLInputElement) => {
    input.removeAttribute('minlength');
    input.value = 'short';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('alert').first()).toContainText('at least 12 characters');
});
