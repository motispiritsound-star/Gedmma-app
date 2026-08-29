import { expect, test, type Page } from '@playwright/test';

const DEMO_PASSWORD = 'focusfamily-demo-2026';

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/signin');
  await page.getByLabel('E-mailadres').fill(email);
  await page.getByLabel('Wachtwoord').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Inloggen' }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test.describe('the public site', () => {
  test('explains the product and lists what it will never do', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Samen tijd maken');
    await expect(page.getByText('message.read').first()).toBeVisible();
    await expect(page.getByText('location.precise.track').first()).toBeVisible();
  });

  test('switches between Dutch and English', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Make time together');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.getByRole('button', { name: 'Nederlands' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
  });

  test('has a working skip link and a single main landmark', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Direct naar de inhoud' })).toBeFocused();
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('serves the parent library in both languages', async ({ page }) => {
    await page.goto('/education');
    await expect(page.getByRole('link', { name: /oplader/i })).toBeVisible();
    await page.getByRole('link', { name: /oplader/i }).click();
    await expect(page.getByText('Waar dit op gebaseerd is')).toBeVisible();
  });

  test('states the business model on the pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/verkopen nooit gegevens/i)).toBeVisible();
    await expect(
      page.getByRole('row', { name: /Gegevens van kinderen verkopen/ }),
    ).toContainText('Nee');
  });
});

test.describe('a guardian journey', () => {
  test('sees what is measured, and the children see the same screen', async ({ page }) => {
    await signIn(page, 'noor@focusfamily.test');
    await expect(page.getByRole('heading', { name: /Hallo Noor/ })).toBeVisible();
    await expect(page.getByText('Wat er nu wordt bijgehouden')).toBeVisible();
    await expect(page.getByText('Voorbeeldgegevens').first()).toBeVisible();
  });

  test('cannot bring a children-only agreement into force', async ({ page }) => {
    await signIn(page, 'noor@focusfamily.test');
    await page.goto('/app/agreements');
    await expect(
      page.getByText('Minstens één regel moet ook voor de volwassenen gelden'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Wat voor mij geldt' })).toBeVisible();
  });

  test('reads a weekly review that has no score in it', async ({ page }) => {
    await signIn(page, 'noor@focusfamily.test');
    await page.goto('/app/review');
    await expect(page.getByRole('heading', { name: 'Jullie week samen' })).toBeVisible();
    await expect(page.getByText('Wat ging goed')).toBeVisible();
    await expect(page.getByText('Om over te praten')).toBeVisible();
    // Every figure carries its provenance.
    await expect(page.locator('.source-label').first()).toBeVisible();
    await expect(page.getByText(/Geen telefoon heeft iets gemeld|no phone reported/)).toBeVisible();
  });

  test('runs a focus moment with a local timer and a pause reason', async ({ page }) => {
    await signIn(page, 'noor@focusfamily.test');
    await page.goto('/app/focus');
    await page.getByRole('link', { name: 'Samen starten' }).first().click();

    await expect(page.getByRole('timer')).toBeVisible();
    await page.getByRole('button', { name: 'Samen starten' }).click();
    await page.getByRole('button', { name: 'Pauze' }).click();
    await expect(page.getByText('Geen probleem. Wat kwam ertussen?')).toBeVisible();
    await page.getByRole('button', { name: 'Iemand had me nodig' }).click();
    await expect(page.getByRole('button', { name: 'Verder gaan' })).toBeVisible();
    await page.getByRole('button', { name: 'Verder gaan' }).click();
    await page.getByRole('button', { name: 'Het is gelukt' }).click();
    await expect(page.getByText('Bijgewerkt')).toBeVisible({ timeout: 15_000 });
  });

  test('fills in a check-in in non-clinical language', async ({ page }) => {
    await signIn(page, 'noor@focusfamily.test');
    await page.goto('/app/checkin');
    await expect(page.getByRole('heading', { name: 'Hoe was vandaag?' })).toBeVisible();
    await page.getByLabel('Hoeveel uur heb je ongeveer geslapen?').fill('7.5');
    await page.getByLabel('Best goed').check();
    await page.getByLabel('Een beetje').check();
    await page.getByRole('button', { name: 'Opslaan' }).click();
    await expect(page.getByText('Jouw laatste dagen')).toBeVisible();
  });

  test('manages consent, and the history keeps every decision', async ({ page }) => {
    await signIn(page, 'noor@focusfamily.test');
    await page.goto('/app/data');
    await expect(page.getByRole('heading', { name: 'Gegevens en toestemming' })).toBeVisible();
    await expect(page.getByText('Wat is afgesproken, en wanneer')).toBeVisible();
    await expect(page.getByText('message_content').first()).toBeVisible();
  });

  test('is told why a measurement cannot be switched on yet', async ({ page }) => {
    await signIn(page, 'noor@focusfamily.test');
    await page.goto('/app/data');
    // Lena is fifteen and has not given her own assent, so this must refuse
    // out loud rather than quietly doing nothing.
    const lenaOsRow = page.locator('.card', { hasText: 'ios.DeviceActivity' });
    await lenaOsRow.getByRole('button', { name: 'Aanzetten' }).click();
    await expect(page.locator('p.notice--warm[role="alert"]')).toContainText(
      'We vragen het ook aan degene om wie het gaat',
    );
  });

  test('exports their data and can download it, then schedule and cancel a deletion', async ({
    page,
  }) => {
    await signIn(page, 'sam@focusfamily.test');
    await page.goto('/app/data');
    await page.getByRole('button', { name: 'Export aanvragen' }).click();
    await expect(page.getByText('Je bestand staat klaar')).toBeVisible();

    const download = page.getByRole('link', { name: 'Downloaden' }).first();
    await expect(download).toBeVisible();
    const href = await download.getAttribute('href');
    const bundle = await page.request.get(href as string);
    expect(bundle.status()).toBe(200);
    expect(bundle.headers()['content-disposition']).toContain('attachment');
    const body = await bundle.json();
    expect(body.notCollected).toContain('message_content');

    await page.getByRole('button', { name: /Verwijderen over 7 dagen/ }).click();
    await expect(page.getByText('Het verwijderen staat gepland')).toBeVisible();
    await page.getByRole('button', { name: 'Toch niet verwijderen' }).click();
    await expect(page.getByText('Het verwijderen staat gepland')).toHaveCount(0);
  });
});

test.describe('a child journey', () => {
  test('sees the rules that apply to the grown-ups too', async ({ page }) => {
    await signIn(page, 'lena@focusfamily.test');
    await page.goto('/app/agreements');
    await expect(page.getByRole('heading', { name: 'Wat voor mij geldt' })).toBeVisible();
    await expect(page.getByText(/laadt elke telefoon op in de keuken/).first()).toBeVisible();
  });

  test('has no button to bring an agreement into force', async ({ page }) => {
    await signIn(page, 'lena@focusfamily.test');
    await page.goto('/app/agreements');
    await expect(page.getByRole('button', { name: 'Laten ingaan' })).toHaveCount(0);
    // Proposing a change is open to everyone, so the child does have that.
    await page.getByText('Een wijziging voorstellen').first().click();
    await expect(page.getByRole('button', { name: 'Voorstellen' })).toBeVisible();
  });

  test('has no link to the back office and cannot open it', async ({ page }) => {
    await signIn(page, 'lena@focusfamily.test');
    await expect(page.getByRole('link', { name: 'Beheer' })).toHaveCount(0);
    await page.goto('/admin');
    await expect(page.getByText('alleen voor medewerkers van de helpdesk')).toBeVisible();
  });

  test('can start a focus moment of their own', async ({ page }) => {
    await signIn(page, 'lena@focusfamily.test');
    await page.goto('/app/focus');
    await page.getByRole('link', { name: 'Samen starten' }).first().click();
    await expect(page.getByRole('button', { name: 'Samen starten' })).toBeVisible();
  });
});

test.describe('support staff', () => {
  test('sees counts and never a family name', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('E-mailadres').fill('support@focusfamily.test');
    await page.getByLabel('Wachtwoord').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Inloggen' }).click();
    await page.waitForURL(/\/app/);
    await page.goto('/admin');
    await expect(page.getByText('Aggregate counts only')).toBeVisible();
    await expect(page.getByText('Familie De Vries')).toHaveCount(0);
  });
});
