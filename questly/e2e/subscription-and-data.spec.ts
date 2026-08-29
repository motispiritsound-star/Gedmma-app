import { expect, test, type Page } from '@playwright/test'
import { uniqueEmail } from './helpers'

/**
 * The plan gates and the data-subject flows, exercised against the mock payment
 * provider - proving the application is fully usable with no Stripe account.
 */

async function registerFamily(page: Page, nickname: string) {
  const email = uniqueEmail('plan')
  await page.goto('/register')
  await page.getByLabel(/je naam/i).fill('Planouder')
  await page.getByLabel(/gezinsnaam/i).fill('Familie Plan')
  await page.getByLabel(/e-mailadres/i).fill(email)
  await page.getByLabel(/wachtwoord/i).fill('EenLangWachtwoord2026')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /account aanmaken/i }).click()

  await page.getByRole('button', { name: /^volgende$/i }).click()
  await page.getByLabel(/bijnaam/i).fill(nickname)
  await page.getByLabel(/leeftijdsgroep/i).selectOption('AGE_9_11')
  await page.getByRole('button', { name: /^opslaan$/i }).click()
  await page.getByRole('button', { name: /^volgende$/i }).click()
  await page.getByRole('button', { name: /bekijk onze avonturen/i }).click()
  await expect(page).toHaveURL(/\/home/)
  return email
}

test('a free family is gated, then upgrades through the mock provider', async ({ page }) => {
  await registerFamily(page, 'Sem')

  // The planner is a premium feature and says so.
  await page.goto('/planner')
  await expect(page.getByText(/plannen hoort bij family premium/i)).toBeVisible()

  // A second child profile is refused on the free plan.
  await page.goto('/children')
  await expect(page.getByText(/je plan staat 1 kindprofiel/i)).toBeVisible()

  // The library still shows premium adventures, marked as locked.
  await page.goto('/quests')
  await expect(page.getByText(/onderdeel van family premium/i).first()).toBeVisible()

  // Upgrade. No card details, because the mock provider is in use.
  await page.goto('/settings/subscription')
  await expect(page.getByText(/nagemaakte betaalprovider/i)).toBeVisible()
  await page.getByRole('button', { name: /upgrade naar family premium/i }).click()

  await expect(page).toHaveURL(/\/settings\/subscription\/confirm/)
  await expect(page.getByRole('heading', { name: /welkom bij family premium/i })).toBeVisible()

  // The gates are gone.
  await page.goto('/planner')
  await expect(page.getByRole('heading', { name: /weekplanner/i })).toBeVisible()
  await expect(page.getByText(/plannen hoort bij family premium/i)).toHaveCount(0)

  await page.goto('/children')
  await expect(page.getByText(/je plan staat 1 kindprofiel/i)).toHaveCount(0)
})

test('a parent can export the family data and request deletion', async ({ page }) => {
  await registerFamily(page, 'Noor')

  await page.goto('/settings/data')
  await expect(page.getByRole('heading', { name: /privacy en gegevens/i })).toBeVisible()

  // The export is a real download of real JSON.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: /mijn gegevens downloaden/i }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^questly-export-\d{4}-\d{2}-\d{2}\.json$/)

  // Deletion needs an explicit confirmation: submitting without it is refused.
  await page.getByRole('button', { name: /verwijdering aanvragen/i }).click()
  await expect(page.getByText(/typ delete in het veld hierboven/i)).toBeVisible()
  await expect(page).toHaveURL(/\/settings\/data/)

  await page.getByLabel(/typ delete om te bevestigen/i).fill('DELETE')
  await page.getByRole('button', { name: /verwijdering aanvragen/i }).click()

  // The session ends immediately; the account is gone from the family area.
  await expect(page).toHaveURL(/deletion=requested/)
  await page.goto('/home')
  await expect(page).toHaveURL(/\/sign-in/)
})

test('a weekly plan can be added and marked done', async ({ page }) => {
  await registerFamily(page, 'Sem')
  await page.goto('/settings/subscription')
  await page.getByRole('button', { name: /upgrade naar family premium/i }).click()
  await expect(page).toHaveURL(/confirm/)

  await page.goto('/planner')
  await page.getByRole('button', { name: /avontuur plannen/i }).first().click()
  await page.getByRole('combobox', { name: /kies een avontuur/i }).selectOption({ index: 1 })
  await page.getByRole('button', { name: /^opslaan$/i }).click()

  await expect(page.getByText(/^gepland$/i).first()).toBeVisible()
  await page.getByRole('button', { name: /markeer als gedaan/i }).first().click()
  await expect(page.getByText(/^gedaan$/i).first()).toBeVisible()
})
