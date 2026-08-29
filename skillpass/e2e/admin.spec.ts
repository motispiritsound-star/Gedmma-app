import { expect, test } from '@playwright/test';
import { ACCOUNTS, login, logout } from './fixtures';

test.describe('platform administration', () => {
  test('verifies a pending provider, after which it can publish', async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await page.goto('/nl/admin/providers');

    const application = page.getByRole('listitem').filter({ hasText: 'Levensles Utrecht' });
    await expect(application).toBeVisible();
    await expect(page.getByText('Goedkeuring is een menselijk oordeel')).toBeVisible();

    // The checklist has to be worked through document by document; the provider
    // itself cannot be approved while any item is still outstanding.
    const documents = ['CHAMBER_OF_COMMERCE', 'LIABILITY_INSURANCE', 'VOG_DECLARATION', 'SAFEGUARDING_POLICY'];
    for (const document of documents) {
      const row = application.getByRole('listitem').filter({ hasText: document });
      await row.getByRole('button', { name: 'Goedkeuren' }).click();
      await expect(row.getByText('APPROVED')).toBeVisible();
    }

    await application.getByTestId('approve-provider').click();
    // Approval takes the application out of the queue entirely.
    await expect(page.getByRole('listitem').filter({ hasText: 'Levensles Utrecht' })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('listitem').filter({ hasText: 'Levensles Utrecht' })).toHaveCount(0);

    await logout(page);

    // And the provider can now publish and be discovered.
    await login(page, ACCOUNTS.pendingProviderOwner);
    await page.goto('/nl/provider');
    await expect(page.getByText('APPROVED').first()).toBeVisible();
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Fietsreparatie voor tieners' })
      .getByRole('button', { name: 'Publiceren' })
      .click();
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Fietsreparatie voor tieners' }).getByText('PUBLISHED'),
    ).toBeVisible();

    await logout(page);
    await page.goto('/nl/search?q=Fietsreparatie');
    await expect(page.getByRole('link', { name: 'Fietsreparatie voor tieners' })).toBeVisible();
  });

  test('shows platform statistics and an append-only audit trail', async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await page.goto('/nl/admin');

    await expect(page.getByRole('heading', { name: 'Platformbeheer' })).toBeVisible();
    await expect(page.getByText('Ouders')).toBeVisible();
    await expect(page.getByText('Kindprofielen')).toBeVisible();
    await expect(page.getByText('Credits uitstaand')).toBeVisible();

    await page.goto('/nl/admin/audit');
    await expect(page.getByText('Het auditlog is append-only')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'seed.completed' })).toBeVisible();

    await page.goto('/nl/admin/audit?action=admin.');
    await expect(page.getByRole('cell', { name: /admin\./ }).first()).toBeVisible();
  });

  test('handles an incident and escalates a safeguarding case', async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await page.goto('/nl/admin/incidents');

    const injury = page.getByRole('listitem').filter({ hasText: 'Verstuikte enkel' });
    await expect(injury).toBeVisible();
    await injury.getByLabel('Notitie').fill('Mat vervangen en met de begeleider besproken.');
    await injury.getByRole('button', { name: 'Afronden' }).click();
    await expect(injury.getByText('RESOLVED')).toBeVisible();

    // Case notes are not offered to a plain administrator.
    const safeguarding = page.getByRole('listitem').filter({ hasText: 'Zorgmelding over toezicht' });
    await expect(safeguarding.getByRole('button', { name: 'Dossier bijwerken' })).toHaveCount(0);
  });

  test('the safeguarding officer can work a restricted case', async ({ page }) => {
    await login(page, 'safeguarding@skillpass.local');
    await page.goto('/nl/admin/incidents');

    const safeguarding = page.getByRole('listitem').filter({ hasText: 'Zorgmelding over toezicht' });
    await safeguarding.getByLabel('Notitie').fill('Rooster opgevraagd bij de aanbieder.');
    await safeguarding.getByLabel('Dossierstatus').selectOption('REFERRED_TO_AUTHORITY');
    await safeguarding.getByRole('button', { name: 'Dossier bijwerken' }).click();
    await expect(safeguarding.getByText('Opgeslagen.')).toBeVisible();
  });

  test('refuses the admin area to a guardian', async ({ page }) => {
    await login(page, ACCOUNTS.guardian);
    for (const path of ['/nl/admin', '/nl/admin/providers', '/nl/admin/incidents', '/nl/admin/audit']) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should not be reachable`).toBe(404);
    }
    // The admin link is not even offered in the navigation.
    await page.goto('/nl/search');
    await expect(page.getByRole('link', { name: 'Beheer' })).toHaveCount(0);
  });
});
