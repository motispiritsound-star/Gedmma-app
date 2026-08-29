import { expect, test } from '@playwright/test'
import { DEMO, signIn, uniqueEmail } from './helpers'

test.describe('administration', () => {
  test('a parent cannot reach the admin area', async ({ page }) => {
    const email = uniqueEmail('parent-guard')

    await page.goto('/register')
    await page.getByLabel(/je naam/i).fill('Gewone ouder')
    await page.getByLabel(/gezinsnaam/i).fill('Familie Guard')
    await page.getByLabel(/e-mailadres/i).fill(email)
    await page.getByLabel(/wachtwoord/i).fill('EenLangWachtwoord2026')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /account aanmaken/i }).click()
    await expect(page).toHaveURL(/\/onboarding/)

    for (const path of ['/admin', '/admin/quests', '/admin/audit', '/admin/users']) {
      await page.goto(path)
      await expect(page, `parents must not reach ${path}`).toHaveURL(/\/home|\/onboarding/)
    }
  })

  test('a signed-out visitor is sent to sign in', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/sign-in/)

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('a content admin can create, preview and publish a quest', async ({ page }) => {
    await signIn(page, DEMO.contentAdmin.email, DEMO.contentAdmin.password)
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByRole('heading', { name: /beheerdashboard/i })).toBeVisible()

    await page.goto('/admin/quests/new')
    await expect(page.getByRole('heading', { name: /nieuw avontuur/i })).toBeVisible()

    const slug = `e2e-avontuur-${Date.now().toString(36)}`
    await page.getByLabel(/^slug$/i).fill(slug)
    // A wrapping <label> around a <select> also contains the option text, so the
    // select is addressed by its accessible name rather than by label text.
    await page.getByRole('combobox', { name: 'Categorie' }).selectOption('science')

    const field = (name: string) => page.getByRole('textbox', { name, exact: true })

    // Dutch translation (the editor opens on the interface language).
    await field('Title').fill('Testavontuur uit de browser')
    await field('Short description').fill('Een korte omschrijving voor de test.')
    await field('Story').fill('Een verhaal dat lang genoeg is om te bewaren en te tonen.')
    await field('Educational objective').fill('Kinderen leren testen.')
    await field('Expected result').fill('Een werkend avontuur.')
    await page.getByRole('textbox', { name: /voordat je begint/i }).fill('Maak de tafel leeg')
    await page.getByRole('textbox', { name: /praat er daarna over/i }).fill('Wat ging er goed?')

    // English translation.
    await page.getByRole('tab', { name: 'English' }).click()
    await field('Title').fill('Test adventure from the browser')
    await field('Short description').fill('A short description for the test.')
    await field('Story').fill('A story long enough to be stored and shown to a family.')
    await field('Educational objective').fill('Children learn to test.')
    await field('Expected result').fill('A working adventure.')
    await page.getByRole('textbox', { name: /voordat je begint/i }).fill('Clear the table')
    await page.getByRole('textbox', { name: /praat er daarna over/i }).fill('What went well?')

    // One step, in both languages.
    await page.getByRole('textbox', { name: 'Step 1 title (nl)' }).fill('Zet klaar')
    await page
      .getByRole('textbox', { name: 'Step 1 instruction (nl)' })
      .fill('Leg alles klaar op tafel.')
    await page.getByRole('textbox', { name: 'Step 1 title (en)' }).fill('Set up')
    await page
      .getByRole('textbox', { name: 'Step 1 instruction (en)' })
      .fill('Lay everything out on the table.')

    await page.getByRole('button', { name: /^opslaan$/i }).click()

    // Saved: we are on the edit page for the new quest.
    await expect(page).toHaveURL(/\/admin\/quests\/[a-z0-9]+$/)
    await expect(page.getByText('DRAFT')).toBeVisible()

    // Preview shows both languages side by side.
    await page.getByRole('link', { name: /voorbeeld/i }).click()
    await expect(page.getByRole('heading', { name: /voorbeeld/i })).toBeVisible()
    await expect(page.getByText('Testavontuur uit de browser').first()).toBeVisible()
    await expect(page.getByText('Test adventure from the browser').first()).toBeVisible()

    // Publish it.
    await page.goBack()
    await page.getByRole('button', { name: /^publiceren$/i }).click()
    await expect(page.getByText('PUBLISHED')).toBeVisible()

    // A family can now find it.
    await signIn(page, DEMO.parent.email, DEMO.parent.password)
    await page.goto(`/quests/${slug}`)
    await expect(page.getByRole('heading', { name: 'Testavontuur uit de browser' })).toBeVisible()
    await expect(page.getByText('Zet klaar')).toBeVisible()
  })

  test('a content admin cannot see platform administration', async ({ page }) => {
    await signIn(page, DEMO.contentAdmin.email, DEMO.contentAdmin.password)
    await expect(page.getByRole('link', { name: /auditlog/i })).toHaveCount(0)
    await page.goto('/admin/audit')
    await expect(page).toHaveURL(/\/admin$/)
  })

  test('a platform admin can read the audit log', async ({ page }) => {
    await signIn(page, DEMO.platformAdmin.email, DEMO.platformAdmin.password)
    await page.goto('/admin/audit')
    await expect(page.getByRole('heading', { name: /auditlog/i })).toBeVisible()
    await expect(page.getByText('user.registered').first()).toBeVisible()
    // IP addresses are never shown in the clear.
    await expect(page.getByText(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/)).toHaveCount(0)
  })
})
