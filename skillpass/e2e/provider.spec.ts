import { expect, test } from '@playwright/test';
import { ACCOUNTS, login, logout } from './fixtures';

test.describe('provider workspace', () => {
  test('shows only its own schedule, utilisation and revenue', async ({ page }) => {
    await login(page, ACCOUNTS.providerOwner);
    await page.goto('/nl/provider');

    await expect(page.getByRole('heading', { name: 'Aanbiederdashboard' })).toBeVisible();
    await expect(page.getByText('Sportclub De Vechtstroom')).toBeVisible();
    await expect(page.getByText('APPROVED').first()).toBeVisible();

    // Its own activities are listed…
    await expect(page.getByRole('heading', { name: 'Turnen voor beginners', level: 3 })).toBeVisible();
    // …and another provider's are not.
    await expect(page.getByRole('heading', { name: '3D-ontwerpen en printen' })).toHaveCount(0);

    await expect(page.getByText('Bezetting').first()).toBeVisible();
    await expect(page.getByText('Geschatte omzet').first()).toBeVisible();
  });

  test('cannot open another provider’s session roster', async ({ page }) => {
    // Capture a session URL belonging to Sportclub De Vechtstroom.
    await login(page, ACCOUNTS.providerOwner);
    await page.goto('/nl/provider');
    const rosterHref = await page.getByRole('link', { name: 'Aanwezigheid' }).first().getAttribute('href');
    expect(rosterHref).toBeTruthy();
    await logout(page);

    // A different provider may not read it, even with the exact URL.
    await login(page, ACCOUNTS.otherProviderOwner);
    const response = await page.goto(rosterHref!);
    expect(response?.status()).toBe(404);
    await expect(page.getByText('Nour')).toHaveCount(0);
  });

  test('a new provider applies and lands in the verification queue, unpublished', async ({ page }) => {
    const email = `nieuwe.club+${Date.now()}@example.com`;

    // Anyone with an account can apply to become a provider.
    await page.goto('/nl/auth/register');
    await page.getByLabel('Jouw naam').fill('Clubeigenaar');
    await page.getByLabel('Naam van je gezin').fill('Clubeigenaar');
    await page.getByLabel('E-mailadres').fill(email);
    await page.getByLabel('Wachtwoord').fill('zonnebloem-fiets-42');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Account aanmaken' }).click();
    await page.getByTestId('dev-verify-link').click();

    await page.goto('/nl/provider/onboarding');
    await expect(page.getByText('Een ingevuld KVK-nummer of verzekeringsnummer is géén automatisch bewijs')).toBeVisible();

    const form = page.getByTestId('provider-onboarding-form');
    await form.getByLabel('Statutaire naam').fill('Nieuwe Club V.O.F.');
    await form.getByLabel('Naam op het platform').fill('Nieuwe Testclub');
    await form
      .getByLabel('Wat bied je aan?')
      .fill('Wij geven wekelijkse sport- en spellessen voor kinderen van 6 tot 12 jaar in Utrecht Noord.');
    await form.getByLabel('KVK-nummer').fill('87654321');
    await form.getByLabel('Contactpersoon').fill('Clubeigenaar');
    await form.getByLabel('E-mailadres').fill('info@nieuwetestclub.local');
    await form.getByRole('checkbox').check();
    await form.getByRole('button', { name: 'Aanmelding versturen' }).click();

    // The application is pending and nothing can be published yet.
    await page.waitForURL('**/nl/provider');
    await expect(page.getByText('Je aanmelding wordt beoordeeld')).toBeVisible();
    await expect(page.getByText('PENDING_REVIEW').first()).toBeVisible();

    // It is not discoverable by families either.
    await page.goto('/nl/search?q=Nieuwe Testclub');
    await expect(page.getByText('Geen activiteiten gevonden')).toBeVisible();
  });

  test('an instructor may check in but not publish', async ({ page }) => {
    await login(page, 'instructor@skillpass.local');
    await page.goto('/nl/provider');
    // The dashboard is readable…
    await expect(page.getByRole('heading', { name: 'Aanbiederdashboard' })).toBeVisible();

    // …but publishing is refused by the permission check.
    await page.getByRole('button', { name: /Publiceren|Offline halen/ }).first().click();
    await expect(page.getByText(/activities:publish|Missing permission/)).toBeVisible();
  });
});
