import { expect, test } from '@playwright/test';
import { ACCOUNTS, signIn, signOut } from './helpers.ts';

/**
 * The journey the MVP is judged on: a parent subscribes and orders in test
 * mode, activates a seeded box, and a child completes an audio-led chapter
 * end to end.
 */
test.describe('parent to child, end to end', () => {
  test('browses the catalogue without an account', async ({ page }) => {
    await page.goto('/boxes');
    await expect(page.getByRole('heading', { name: 'Alle dozen' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Junior Ruimteverkenner' })).toBeVisible();

    await page.getByRole('link', { name: 'Junior Ruimteverkenner' }).click();
    await expect(page.getByRole('heading', { name: 'Junior Ruimteverkenner' })).toBeVisible();
    // The safety notes are on the sales page, not hidden until after purchase.
    await expect(page.getByRole('heading', { name: 'Veiligheid' })).toBeVisible();
    await expect(page.getByText('Een kapotte ballon is gevaarlijk')).toBeVisible();
  });

  test('orders a box in test mode and pays with the mock provider', async ({ page }) => {
    await signIn(page, ACCOUNTS.parent);
    await page.goto('/boxes/natuurdetective');

    await page.getByRole('button', { name: 'Los bestellen' }).click();
    await expect(page.getByRole('heading', { name: 'Betalen (testmodus)' })).toBeVisible();
    await expect(page.getByText('Er wordt niets afgeschreven')).toBeVisible();

    await page.getByRole('button', { name: 'Betaling bevestigen' }).click();
    await expect(page.getByText('Betaald.')).toBeVisible();
    await expect(page.getByText('PAID')).toBeVisible();

    // The invoice exists straight away.
    await page.goto('/account/invoices');
    await expect(page.getByRole('cell', { name: /INV-WB-/ }).first()).toBeVisible();
  });

  test('manages a subscription: preview, skip, unskip', async ({ page }) => {
    await signIn(page, ACCOUNTS.parent);
    await page.goto('/account/subscription');

    await expect(page.getByRole('heading', { name: 'Voorbeeld van de verlenging' })).toBeVisible();

    // A previous run may have left the skip flag on; normalise first so the
    // test asserts on a state it created rather than one it inherited.
    const unskip = page.getByRole('button', { name: 'Toch niet overslaan' });
    if (await unskip.isVisible()) await unskip.click();
    await expect(page.locator('dl')).toContainText('Wordt verlengd');

    // The status shows in the preview list; the same sentence also labels the
    // toggle, so scope to the definition list.
    const status = page.locator('dl');
    await page.getByRole('button', { name: 'Sla één maand over' }).click();
    await expect(status).toContainText('De volgende verlenging wordt overgeslagen.');

    await page.getByRole('button', { name: 'Toch niet overslaan' }).click();
    await expect(status).toContainText('Wordt verlengd');
  });

  test('refuses an activation code that belongs to nobody', async ({ page }) => {
    await signIn(page, ACCOUNTS.parent);
    await page.goto('/account/activate');
    await page.getByLabel('Doos activeren').fill('WB-0000-0000-0000');
    await page.getByRole('button', { name: 'Activeer' }).click();
    // Scoped to main: Next.js keeps its own empty route-announcer alert alive.
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      /kennen we niet|hoort bij een ander/,
    );
  });

  test('a child completes a whole audio-led chapter', async ({ page }) => {
    await signIn(page, ACCOUNTS.parent);
    await page.goto('/play');

    await expect(page.getByRole('heading', { name: 'Luisteren' })).toBeVisible();
    await page.getByRole('link', { name: 'Start' }).first().click();

    // The chapter list shows what is released and what is not.
    await expect(page.getByRole('heading', { name: 'Hoofdstuk 1: De lancering' })).toBeVisible();
    await page.getByRole('link', { name: 'Start' }).first().click();

    // The companion loads the first line of narration. Assert on the spoken
    // line by test id: it is deliberately mirrored into an aria-live region,
    // so a plain text match finds it twice.
    const spoken = page.getByTestId('companion-text');
    await expect(spoken).toContainText('Hallo ruimteverkenner', { timeout: 20_000 });

    const play = page.getByRole('button', { name: 'Afspelen' });
    await expect(play).toBeVisible();

    // Walk the graph by pressing choices, which is exactly what the buttons on
    // the physical box will do. Autoplay is blocked in a headless browser, so
    // driving it by choice is also the only reliable path.
    await play.click();
    await page.getByRole('button', { name: 'Ik ben er klaar voor' }).click();
    await expect(spoken).toContainText('Hoe komt hij dan toch vooruit');

    // Take the hint branch: an answer that is wrong is not a failure state.
    await page.getByRole('button', { name: 'De vlammen duwen tegen de grond' }).click();
    await expect(spoken).toContainText('Denk eens aan een ballon');

    await page.getByRole('button', { name: 'De lucht gaat naar achteren' }).click();
    await expect(spoken).toContainText('Precies. De raket gooit hete gassen');

    await page.getByRole('button', { name: 'Verder' }).click();
    await expect(spoken).toContainText('Als een ballon knapt');

    await page.getByRole('button', { name: 'Begrepen' }).click();
    await expect(spoken).toContainText('Schuif het touw helemaal door het rietje');

    await page.getByRole('button', { name: 'Gelukt' }).click();
    await page.getByRole('button', { name: 'Klaar om te lanceren' }).click();
    await expect(spoken).toContainText('Drie… twee… één');

    await page.getByRole('button', { name: 'Hij vloog!' }).click();
    await expect(spoken).toContainText('Dat is precies wat een echte raket doet');
    // The celebration is a full line of narration; the chapter is only over
    // once a child has actually heard it.
    await expect(page.getByRole('status')).toContainText('Hoofdstuk klaar', { timeout: 45_000 });
  });

  test('the parent summary reports activity and never a grade', async ({ page }) => {
    await signIn(page, ACCOUNTS.parent);
    await page.goto('/account/summary');

    await expect(page.getByRole('heading', { name: 'Wat we gedaan hebben' })).toBeVisible();
    await expect(
      page.getByText('WonderBox geeft geen cijfers en meet geen ontwikkeling'),
    ).toBeVisible();
    await expect(page.getByText('Hoofdstukken afgerond')).toBeVisible();

    const body = (await page.locator('main').textContent()) ?? '';
    for (const forbidden of ['cijfer:', 'score', 'niveau', 'percentiel', 'achterstand']) {
      expect(body.toLowerCase()).not.toContain(forbidden);
    }
  });

  test('the language switch changes the interface and the content', async ({ page }) => {
    await page.goto('/boxes');
    await page.getByLabel('Taal / Language').selectOption('en');
    await page.getByRole('button', { name: 'OK' }).click();

    await expect(page.getByRole('heading', { name: 'All boxes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Junior Space Explorer' })).toBeVisible();
  });
});

test.describe('role separation is visible in the interface', () => {
  test('a content editor sees the studio and no families', async ({ page }) => {
    await signIn(page, ACCOUNTS.editor);
    await expect(page).toHaveURL(/\/studio/);

    await expect(page.getByRole('link', { name: 'Studio', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mijn WonderBox' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Operatie' })).toHaveCount(0);
    await expect(
      page.getByText('Deze rol heeft geen toegang tot gezinnen, adressen of bestellingen'),
    ).toBeVisible();

    // And the routes themselves are closed, not merely unlinked.
    await page.goto('/ops/orders');
    await expect(page).not.toHaveURL(/\/ops\/orders/);
    await page.goto('/account');
    await expect(page).not.toHaveURL(/\/account$/);
  });

  test('an editor cannot approve their own work', async ({ page }) => {
    await signIn(page, ACCOUNTS.editor);
    await page.goto('/studio/approvals');
    await expect(page.getByRole('heading', { name: 'Ter goedkeuring' })).toBeVisible();
    await expect(
      page.getByText('Een versie kan alleen gepubliceerd worden door iemand anders dan de auteur'),
    ).toBeVisible();
  });

  test('an AI draft is labelled and cannot skip review', async ({ page }) => {
    await signIn(page, ACCOUNTS.editor);
    await page.goto('/studio/drafts');

    await expect(
      page.getByText('AI-concepten zijn alleen voor redacteuren'),
    ).toBeVisible();

    await page.getByLabel('brief').fill('Schrijf een openingsvraag over zwaartekracht voor acht jaar.');
    await page.getByRole('button', { name: 'Concept genereren' }).click();

    await expect(page.getByText('Concept opgeslagen als DRAFT')).toBeVisible();
    await expect(page.getByText('DRAFT').first()).toBeVisible();
    // There is no publish control anywhere on this page.
    await expect(page.getByRole('button', { name: 'Publiceren' })).toHaveCount(0);
  });

  test('operations sees stock and addresses but no content tools', async ({ page }) => {
    await signIn(page, ACCOUNTS.ops);
    await expect(page).toHaveURL(/\/ops/);

    await page.goto('/ops/inventory');
    await expect(page.getByRole('heading', { name: 'Voorraad', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Beschikbaar' })).toBeVisible();

    await page.goto('/studio');
    await expect(page).not.toHaveURL(/\/studio/);
  });

  test('activation codes are never shown in full to an operator', async ({ page }) => {
    await signIn(page, ACCOUNTS.ops);
    await page.goto('/ops/codes');
    await expect(page.getByRole('heading', { name: 'Activatiecodes' })).toBeVisible();
    await expect(page.getByText('Alleen een gepeperde hash van de code wordt opgeslagen')).toBeVisible();

    const body = (await page.locator('main').textContent()) ?? '';
    // No full WB-XXXX-XXXX-XXXX anywhere on the page.
    expect(body).not.toMatch(/WB-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}/);
  });

  test('a parent cannot reach the studio or operations', async ({ page }) => {
    await signIn(page, ACCOUNTS.parent);
    await page.goto('/studio');
    await expect(page).not.toHaveURL(/\/studio/);
    await page.goto('/ops');
    await expect(page).not.toHaveURL(/\/ops/);
    await signOut(page);
  });

  test('an anonymous visitor is sent to log in, not shown someone else’s data', async ({ page }) => {
    await page.goto('/account/orders');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/play');
    await expect(page).toHaveURL(/\/login/);
  });
});
