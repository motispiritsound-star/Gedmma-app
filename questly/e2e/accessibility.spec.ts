import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { DEMO } from './helpers'

/**
 * Automated accessibility checks. These catch the mechanical WCAG failures -
 * contrast, names, roles, landmarks, labels - and are not a substitute for
 * manual testing with a screen reader and a keyboard.
 */
async function analyse(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
}

function summarise(results: Awaited<ReturnType<typeof analyse>>) {
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target).slice(0, 3),
  }))
}

test.describe('public pages', () => {
  for (const path of ['/', '/how-it-works', '/pricing', '/privacy', '/sign-in', '/register']) {
    test(`${path} has no automatically detectable accessibility issues`, async ({ page }) => {
      await page.goto(path)
      expect(summarise(await analyse(page))).toEqual([])
    })
  }
})

test.describe('family pages', () => {
  test.use({ storageState: 'e2e/.auth/parent.json' })

  const paths = [
    '/home',
    '/quests',
    '/quests/leaf-detective',
    '/dashboard',
    '/planner',
    '/children',
    '/settings',
    '/settings/subscription',
    '/settings/data',
  ]

  for (const path of paths) {
    test(`${path} has no automatically detectable accessibility issues`, async ({ page }) => {
      await page.goto(path)
      expect(summarise(await analyse(page))).toEqual([])
    })
  }

  test('every page exposes exactly one main landmark and one h1', async ({ page }) => {
    for (const path of ['/home', '/quests', '/dashboard', '/settings']) {
      await page.goto(path)
      await expect(page.locator('main'), path).toHaveCount(1)
      await expect(page.getByRole('heading', { level: 1 }), path).toHaveCount(1)
    }
  })

  test('Adventure Mode is accessible while an adventure is running', async ({ page }) => {
    await page.goto('/quests/density-tower')
    await page.getByRole('button', { name: /start dit avontuur|ga verder/i }).click()
    await expect(page).toHaveURL(/\/adventure\//)
    expect(summarise(await analyse(page))).toEqual([])

    for (const checkbox of await page.getByRole('checkbox').all()) {
      await checkbox.check()
    }
    await page.getByRole('button', { name: /we gaan/i }).click()
    await page.getByRole('button', { name: /we gaan/i }).click()
    await page.getByRole('button', { name: /we gaan/i }).click()
    await expect(page.getByText(/stap 1 van/i)).toBeVisible()
    expect(summarise(await analyse(page))).toEqual([])
  })
})

test.describe('admin pages', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' })

  for (const path of ['/admin', '/admin/quests', '/admin/quests/new', '/admin/audit', '/admin/users']) {
    test(`${path} has no automatically detectable accessibility issues`, async ({ page }) => {
      await page.goto(path)
      expect(summarise(await analyse(page))).toEqual([])
    })
  }
})

test('the sign-in flow is reachable with the keyboard alone', async ({ page }) => {
  await page.goto('/')

  // The first tab stop is the skip link.
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: /ga naar de hoofdinhoud|skip to main content/i })
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main')).toBeVisible()

  await page.goto('/sign-in')
  await page.getByLabel(/e-mailadres/i).focus()
  await page.keyboard.type(DEMO.parent.email)
  await page.keyboard.press('Tab')
  await page.keyboard.type(DEMO.parent.password)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/home/)
})
