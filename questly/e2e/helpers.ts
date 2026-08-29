import { randomUUID } from 'node:crypto'
import { expect, type Page } from '@playwright/test'

export const DEMO = {
  parent: { email: 'ouder@questly.test', password: 'AvontuurThuis2026' },
  contentAdmin: { email: 'redactie@questly.test', password: 'RedactieQuestly2026' },
  platformAdmin: { email: 'admin@questly.test', password: 'BeheerQuestly2026' },
}

export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@questly.test`
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: /uitloggen|sign out/i }).first().click()
  await page.waitForURL(/\/$|\/\?/)
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in')
  // Signing in while already signed in redirects away; start from a clean slate.
  if (!page.url().includes('/sign-in')) {
    await signOut(page)
    await page.goto('/sign-in')
  }
  await page.getByLabel(/e-mailadres|e-mail address/i).fill(email)
  await page.getByLabel(/wachtwoord|password/i).fill(password)
  await page.getByRole('button', { name: /inloggen|sign in/i }).click()
  // The sign-in action redirects; wait for it so the next navigation does not
  // race the in-flight request.
  await page.waitForURL(/\/(home|admin|onboarding)/)
}

/** Switches the interface language and waits for the server to re-render. */
export async function switchLanguage(page: Page, to: 'NL' | 'EN'): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^${to}`) }).first().click()
  await expect(page.locator('html')).toHaveAttribute('lang', to.toLowerCase())
}
