import { test as setup, expect } from '@playwright/test'
import { DEMO } from './helpers'

/**
 * Signs in once per role and stores the session, so the rest of the suite does
 * not repeatedly hit the sign-in endpoint - which is deliberately rate limited.
 */

setup('authenticate as a parent', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel(/e-mailadres/i).fill(DEMO.parent.email)
  await page.getByLabel(/wachtwoord/i).fill(DEMO.parent.password)
  await page.getByRole('button', { name: /inloggen/i }).click()
  await expect(page).toHaveURL(/\/home/)
  await page.context().storageState({ path: 'e2e/.auth/parent.json' })
})

setup('authenticate as a platform admin', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel(/e-mailadres/i).fill(DEMO.platformAdmin.email)
  await page.getByLabel(/wachtwoord/i).fill(DEMO.platformAdmin.password)
  await page.getByRole('button', { name: /inloggen/i }).click()
  await expect(page).toHaveURL(/\/admin/)
  await page.context().storageState({ path: 'e2e/.auth/admin.json' })
})
