import { expect, test } from '@playwright/test'
import { switchLanguage } from './helpers'

test.describe('public pages', () => {
  test('the landing page presents the offer honestly', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Questly/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // The honesty section is a product requirement, not decoration.
    await expect(page.getByText(/Wat Questly niet doet/i)).toBeVisible()
    await expect(page.getByText(/blokkeert geen apps/i)).toBeVisible()

    await expect(page.getByRole('link', { name: /gratis beginnen/i }).first()).toBeVisible()
  })

  test('renders in Dutch and switches to English', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
    await expect(page.getByRole('heading', { name: /Echte avonturen/i })).toBeVisible()

    await switchLanguage(page, 'EN')
    await expect(page.getByRole('heading', { name: /Real adventures/i })).toBeVisible()
    await expect(page.getByText(/What Questly does not do/i)).toBeVisible()

    await switchLanguage(page, 'NL')
    await expect(page.getByRole('heading', { name: /Echte avonturen/i })).toBeVisible()
  })

  test('shows pricing with the mock payment notice', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByRole('heading', { name: /prijzen/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Family Premium/i })).toBeVisible()
    await expect(page.getByText(/nagemaakte betaalprovider/i)).toBeVisible()
  })

  test('states plainly what is stored about children', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByText(/Geen openbare kinderprofielen/i)).toBeVisible()
    await expect(page.getByText(/juridische toetsing/i)).toBeVisible()
  })

  test('serves a web app manifest and a service worker', async ({ request }) => {
    const manifest = await request.get('/manifest.webmanifest')
    expect(manifest.ok()).toBe(true)
    const parsed = await manifest.json()
    expect(parsed.name).toContain('Questly')
    expect(parsed.icons.length).toBeGreaterThan(0)

    const worker = await request.get('/sw.js')
    expect(worker.ok()).toBe(true)
    expect(await worker.text()).toContain('questly-v1')
  })

  test('sets the security headers', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['x-frame-options']).toBe('DENY')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
  })
})
