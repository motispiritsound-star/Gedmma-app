import { expect, test } from '@playwright/test'
import { uniqueEmail } from './helpers'

/**
 * The full core journey: register, onboard, pick an adventure, run Adventure
 * Mode, complete it, approve it, and see it in the family dashboard.
 */
test('a parent can register, onboard and complete an adventure', async ({ page }) => {
  const email = uniqueEmail('journey')

  // --- register ------------------------------------------------------------
  await page.goto('/register')
  await page.getByLabel(/je naam/i).fill('Testouder')
  await page.getByLabel(/gezinsnaam/i).fill('Familie Playwright')
  await page.getByLabel(/e-mailadres/i).fill(email)
  await page.getByLabel(/wachtwoord/i).fill('EenLangWachtwoord2026')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /account aanmaken/i }).click()

  await expect(page).toHaveURL(/\/onboarding/)
  await expect(page.getByRole('heading', { name: /richt je gezin in/i })).toBeVisible()

  // --- onboarding: family --------------------------------------------------
  await expect(page.getByLabel(/gezinsnaam/i)).toHaveValue('Familie Playwright')
  await page.getByRole('button', { name: /^volgende$/i }).click()

  // --- onboarding: child profile ------------------------------------------
  await page.getByLabel(/bijnaam/i).fill('Noor')
  await page.getByLabel(/leeftijdsgroep/i).selectOption('AGE_6_8')
  await page.getByText('Dieren', { exact: true }).click()
  await page.getByRole('button', { name: /^opslaan$/i }).click()

  await expect(page.getByText('Noor')).toBeVisible()
  await page.getByRole('button', { name: /^volgende$/i }).click()

  // --- onboarding: preferences --------------------------------------------
  await expect(page.getByLabel(/gewenste uitdaging/i)).toBeVisible()
  await page.getByRole('button', { name: /bekijk onze avonturen/i }).click()

  // --- home ----------------------------------------------------------------
  await expect(page).toHaveURL(/\/home/)
  await expect(page.getByRole('heading', { name: /hallo testouder/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /voorgestelde avonturen/i })).toBeVisible()

  // Every suggestion explains itself.
  await expect(page.getByText(/waarom deze\?/i).first()).toBeVisible()

  // --- open an adventure ---------------------------------------------------
  // Follow the first suggestion rather than a fixed URL: on the free plan only
  // the rotating selection is open, and the feed only ever suggests those.
  const firstSuggestion = page.locator('article').first()
  const suggestionTitle = await firstSuggestion.getByRole('heading').innerText()
  await firstSuggestion.getByRole('link').first().click()

  await expect(page.getByRole('heading', { level: 1, name: suggestionTitle })).toBeVisible()
  await expect(page.getByText(/wat je nodig hebt/i)).toBeVisible()
  await expect(page.getByText(/stap voor stap/i)).toBeVisible()

  await page.getByRole('button', { name: /start dit avontuur/i }).click()

  // --- Adventure Mode ------------------------------------------------------
  await expect(page).toHaveURL(/\/adventure\//)
  await expect(page.getByRole('heading', { name: /maak je klaar/i })).toBeVisible()

  // The "we are off" button stays disabled until the checklist is ticked.
  const goButton = page.getByRole('button', { name: /we gaan/i })
  await expect(goButton).toBeDisabled()
  for (const checkbox of await page.getByRole('checkbox').all()) {
    await checkbox.check()
  }
  await expect(goButton).toBeEnabled()
  await goButton.click()

  // Countdown, then the message that matters.
  await page.getByRole('button', { name: /we gaan/i }).click()
  await expect(page.getByRole('heading', { name: /leg het apparaat weg/i })).toBeVisible()
  await expect(page.getByText(/meet alleen de tijd die je hier zelf opgeeft/i)).toBeVisible()
  await page.getByRole('button', { name: /we gaan/i }).click()

  // Steps.
  await expect(page.getByText(/stap 1 van/i)).toBeVisible()
  await page.getByRole('button', { name: /volgende stap/i }).click()
  await expect(page.getByText(/stap 2 van/i)).toBeVisible()

  // Jump to the final step and finish.
  const stepButtons = page.getByRole('button', { name: /stap \d+ van/i })
  await stepButtons.last().click()
  await page.getByRole('button', { name: /we zijn klaar/i }).click()

  // --- completion ----------------------------------------------------------
  await expect(page).toHaveURL(/\/complete$/)
  await expect(page.getByRole('heading', { name: /hoe ging het\?/i })).toBeVisible()

  await page.getByRole('checkbox', { name: /noor/i }).check()
  await page.getByLabel(/hoe lang waren jullie/i).fill('50')
  await page.getByRole('textbox').first().fill('Dat ging beter dan verwacht.')
  await page.getByRole('button', { name: /ter goedkeuring versturen/i }).click()

  await expect(page.getByRole('heading', { name: /goed gedaan/i })).toBeVisible()
  await expect(page.getByText(/moet dit avontuur nog goedkeuren/i)).toBeVisible()

  // --- parent approval -----------------------------------------------------
  await page.getByRole('button', { name: /^goedkeuren$/i }).click()
  await expect(page.getByText(/staat nu in jullie gezinsverhaal/i)).toBeVisible()
  await expect(page.getByText(/nieuwe badges/i)).toBeVisible()
  await expect(page.getByText(/eerste avontuur/i)).toBeVisible()

  // --- dashboard -----------------------------------------------------------
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: /gezinsoverzicht/i })).toBeVisible()
  await expect(page.getByText(/opgegeven offline tijd/i).first()).toBeVisible()
  await expect(page.getByText(/geen meting van schermtijd/i)).toBeVisible()
  await expect(page.getByText('Noor').first()).toBeVisible()
})

test('the quest library filters down to matching adventures', async ({ page, context }) => {
  await context.addCookies([
    { name: 'questly_locale', value: 'nl', url: 'http://127.0.0.1:3100' },
  ])
  const email = uniqueEmail('library')

  await page.goto('/register')
  await page.getByLabel(/je naam/i).fill('Filterouder')
  await page.getByLabel(/gezinsnaam/i).fill('Familie Filter')
  await page.getByLabel(/e-mailadres/i).fill(email)
  await page.getByLabel(/wachtwoord/i).fill('EenLangWachtwoord2026')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /account aanmaken/i }).click()

  await page.getByRole('button', { name: /^volgende$/i }).click()
  await page.getByLabel(/bijnaam/i).fill('Sem')
  await page.getByLabel(/leeftijdsgroep/i).selectOption('AGE_12_15')
  await page.getByRole('button', { name: /^opslaan$/i }).click()
  await page.getByRole('button', { name: /^volgende$/i }).click()
  await page.getByRole('button', { name: /bekijk onze avonturen/i }).click()

  await page.goto('/quests')
  await expect(page.getByRole('heading', { name: /avonturenbibliotheek/i })).toBeVisible()

  await page.getByLabel(/^categorie$/i).selectOption('cooking')
  await page.getByRole('button', { name: /^filters$/i }).click()

  await expect(page).toHaveURL(/category=cooking/)
  const cards = page.locator('article')
  await expect(cards.first()).toBeVisible()
  const count = await cards.count()
  expect(count).toBeGreaterThan(0)
  for (let index = 0; index < count; index += 1) {
    await expect(cards.nth(index)).toContainText(/koken/i)
  }
})
