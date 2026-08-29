import { expect, test } from '@playwright/test';
import { ACCOUNTS, login, logout } from './fixtures';

/**
 * The definition of done for a family, end to end:
 * subscribe → add a child → find a verified activity → book with credits →
 * attendance is recorded → review it.
 */
test.describe('guardian journey', () => {
  test('a guardian books with credits, is checked in and leaves a review', async ({ page }) => {
    await login(page, ACCOUNTS.guardian);

    // --- credits before booking -------------------------------------------
    await page.goto('/nl/plans');
    const balanceText = await page.getByText(/^\d+ credits$/).first().innerText();
    const balanceBefore = Number(balanceText.split(' ')[0]);
    expect(balanceBefore).toBeGreaterThan(0);

    // --- find and book -----------------------------------------------------
    await page.goto('/nl/search?q=Turnen');
    await page.getByRole('link', { name: 'Turnen voor beginners' }).click();
    await expect(page.getByText('Geverifieerde aanbieder')).toBeVisible();
    const activityUrl = page.url();

    await page.getByLabel('Voor welk kind?').selectOption({ label: 'Nour' });
    await page.getByRole('button', { name: 'Boeken' }).first().click();
    await expect(page.getByTestId('booking-status')).toContainText('Bevestigd');

    // --- the exact address is released only after booking ------------------
    await page.goto(activityUrl);
    await expect(page.getByText('Amsterdamsestraatweg 512')).toBeVisible();

    // --- credits were deducted from the ledger -----------------------------
    await page.goto('/nl/plans');
    await expect(page.getByRole('cell', { name: /^Booking BK-/ }).first()).toBeVisible();
    const afterText = await page.getByText(/^\d+ credits$/).first().innerText();
    expect(Number(afterText.split(' ')[0])).toBe(balanceBefore - 2);

    // --- the booking is listed with its reference --------------------------
    await page.goto('/nl/bookings');
    const reference = await page.getByText(/Referentie: BK-/).first().innerText();
    expect(reference).toMatch(/BK-[A-Z0-9]{8}/);

    await logout(page);

    // --- the provider checks the child in ----------------------------------
    await login(page, ACCOUNTS.provider);
    await page.goto('/nl/provider');
    await page.getByRole('row', { name: /Turnen voor beginners/ }).first().getByRole('link', { name: 'Aanwezigheid' }).click();
    await expect(page.getByRole('heading', { name: 'Aanwezigheid' })).toBeVisible();
    await expect(page.getByText('Nour')).toBeVisible();
    await page.getByTestId('mark-attended').first().click();
    await expect(page.getByText('ATTENDED').first()).toBeVisible();

    await logout(page);

    // --- the guardian reviews the session ----------------------------------
    await login(page, ACCOUNTS.guardian);
    await page.goto('/nl/bookings');
    const reviewed = page.getByRole('listitem').filter({ hasText: 'Turnen voor beginners' }).first();
    await reviewed.getByLabel('Jouw ervaring').fill(
      'De begeleiding was rustig en duidelijk, en er was genoeg aandacht voor ieder kind in de groep.',
    );
    await reviewed.getByRole('button', { name: 'Beoordeling plaatsen' }).click();
    // Once the review exists the form is replaced by a confirmation.
    await expect(reviewed.getByText('Beoordeling geplaatst.')).toBeVisible();

    // --- and it shows up publicly, under the guardian's name ---------------
    await page.goto(activityUrl);
    await expect(page.getByText('De begeleiding was rustig en duidelijk')).toBeVisible();
    await expect(page.getByText('Fatima Haddad').first()).toBeVisible();
  });

  test('a child cannot be booked into an activity outside their age band', async ({ page }) => {
    await login(page, ACCOUNTS.guardian);
    // Building web apps is 15–17 only; the demo family has a 9–11 and a 12–14 child.
    await page.goto('/nl/search?q=Webapps');
    await page.getByRole('link', { name: 'Webapps bouwen' }).click();
    await expect(page.getByText('Geen kindprofiel in de juiste leeftijdsgroep')).toBeVisible();
  });

  test('cancelling in time returns the credits', async ({ page }) => {
    await login(page, ACCOUNTS.guardian);
    await page.goto('/nl/search?q=Sporenzoekers');
    await page.getByRole('link', { name: 'Sporenzoekers in het bos' }).click();
    await page.getByLabel('Voor welk kind?').selectOption({ label: 'Nour' });
    await page.getByRole('button', { name: 'Boeken' }).first().click();
    await expect(page.getByTestId('booking-status')).toContainText('Bevestigd');

    await page.goto('/nl/plans');
    const afterBooking = Number((await page.getByText(/^\d+ credits$/).first().innerText()).split(' ')[0]);

    await page.goto('/nl/bookings');
    const booking = page.getByRole('listitem').filter({ hasText: 'Sporenzoekers in het bos' }).first();
    await booking.getByRole('button', { name: 'Boeking annuleren' }).click();
    // Wait for the cancellation to be reflected before re-reading the balance.
    await expect(page.getByText('CANCELLED_BY_GUARDIAN')).toBeVisible();

    await page.goto('/nl/plans');
    const afterCancel = Number((await page.getByText(/^\d+ credits$/).first().innerText()).split(' ')[0]);
    expect(afterCancel).toBe(afterBooking + 2);
  });
});
