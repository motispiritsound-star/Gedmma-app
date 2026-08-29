import { expect, test } from '@playwright/test';
import { ACCOUNTS, login } from './fixtures';

test.describe('safety and privacy guarantees in the interface', () => {
  test('a child profile has no public page and no login', async ({ page }) => {
    await login(page, ACCOUNTS.guardian);
    await page.goto('/nl/family');

    // The nickname exists inside the guardian's own family page…
    await expect(page.getByRole('heading', { name: 'Nour', level: 3 })).toBeVisible();
    // …and there is no child-facing route to visit.
    for (const path of ['/nl/children', '/nl/profiles/nour', '/nl/child/nour']) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} must not exist`).toBe(404);
    }
  });

  test('the family page asks for an age band, not a date of birth', async ({ page }) => {
    await login(page, ACCOUNTS.guardian);
    await page.goto('/nl/family');

    await expect(page.getByText('We vragen geen geboortedatum')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toHaveCount(0);
  });

  test('states plainly that providers never contact a child directly', async ({ page }) => {
    await page.goto('/nl');
    await expect(
      page.getByText('Aanbieders communiceren altijd met de ouder of verzorger, nooit rechtstreeks met een kind.').first(),
    ).toBeVisible();
  });

  test('a provider roster shows a nickname and safety notes, not a full identity', async ({ page }) => {
    // The seeded family holds a booking on the first micro:bit session.
    await login(page, ACCOUNTS.otherProviderOwner);
    await page.goto('/nl/provider');
    await page
      .getByRole('row', { name: /Programmeren met micro:bit/ })
      .first()
      .getByRole('link', { name: 'Aanwezigheid' })
      .click();

    await expect(page.getByText('Je ziet alleen de roepnaam')).toBeVisible();
    // A nickname and the notes needed to run the session safely…
    await expect(page.getByText('Sami')).toBeVisible();
    await expect(page.getByText('Pinda-allergie')).toBeVisible();
    // …contact always routed through the guardian.
    await expect(page.getByText('Contact via de ouder').first()).toBeVisible();
  });

  test('a guardian can download their own data as JSON', async ({ page }) => {
    await login(page, ACCOUNTS.guardian);
    // Fetch from inside the page so the session cookie travels with it.
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/account/export');
      return {
        status: response.status,
        disposition: response.headers.get('content-disposition'),
        body: await response.json(),
      };
    });

    expect(result.status).toBe(200);
    expect(result.disposition).toContain('attachment');
    expect(result.body.account.email).toBe('guardian@skillpass.local');
    expect(result.body.children.length).toBe(2);
    expect(Array.isArray(result.body.creditLedger)).toBe(true);
  });

  test('the data export is refused without a session', async ({ page }) => {
    const response = await page.request.get('/api/account/export');
    expect(response.status()).toBe(401);
  });

  test('rejects a payment webhook with a bad signature', async ({ request }) => {
    const response = await request.post('/api/webhooks/payments', {
      headers: { 'content-type': 'application/json', 'x-skillpass-signature': 'sha256=deadbeef' },
      data: { id: 'evt_forged', type: 'checkout.completed', data: { externalRef: 'mock_cs_seeded_family' } },
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error.code).toBe('invalid_webhook');
  });

  test('sets conservative security headers', async ({ page }) => {
    const response = await page.goto('/nl');
    const headers = response!.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('reports adapter configuration on the health endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    // Everything runs on offline adapters out of the box.
    expect(body.adapters).toMatchObject({ payments: 'mock', email: 'mock', storage: 'local', geo: 'mock' });
  });
});
