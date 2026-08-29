import { expect, test, type Page } from '@playwright/test'
import { uniqueEmail } from './helpers'

/**
 * Private family media, exercised through the browser: one family uploads a
 * photograph, and a second family cannot fetch it even with the exact URL.
 */

/** A real, decodable 1x1 PNG - the browser must be able to render it. */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

async function registerAndOnboard(page: Page, nickname: string) {
  const email = uniqueEmail('media')
  await page.goto('/register')
  await page.getByLabel(/je naam/i).fill('Media-ouder')
  await page.getByLabel(/gezinsnaam/i).fill(`Familie ${nickname}`)
  await page.getByLabel(/e-mailadres/i).fill(email)
  await page.getByLabel(/wachtwoord/i).fill('EenLangWachtwoord2026')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /account aanmaken/i }).click()

  await page.getByRole('button', { name: /^volgende$/i }).click()
  await page.getByLabel(/bijnaam/i).fill(nickname)
  await page.getByLabel(/leeftijdsgroep/i).selectOption('AGE_9_11')
  await page.getByRole('button', { name: /^opslaan$/i }).click()
  await page.getByRole('button', { name: /^volgende$/i }).click()

  // Approval off, so the memory appears on the dashboard right away.
  await page.getByRole('checkbox', { name: /een ouder keurt/i }).uncheck()
  await page.getByRole('button', { name: /bekijk onze avonturen/i }).click()
  await expect(page).toHaveURL(/\/home/)

  // Upgrade through the mock provider so the whole library is reachable; the
  // free plan only unlocks a rotating subset.
  await page.goto('/settings/subscription')
  await page.getByRole('button', { name: /upgrade naar family premium/i }).click()
  await expect(page).toHaveURL(/confirm/)
  return email
}

test('a photograph stays private to the family that uploaded it', async ({ browser }) => {
  const ownerContext = await browser.newContext()
  const owner = await ownerContext.newPage()
  await registerAndOnboard(owner, 'Noor')

  // Run an adventure and upload a photograph with it.
  await owner.goto('/quests/story-in-six-objects')
  await owner.getByRole('button', { name: /start dit avontuur/i }).click()
  await expect(owner).toHaveURL(/\/adventure\//)
  await expect(owner.getByRole('heading', { name: /maak je klaar/i })).toBeVisible()
  for (const checkbox of await owner.getByRole('checkbox').all()) await checkbox.check()
  await owner.getByRole('button', { name: /we gaan/i }).click()
  await owner.getByRole('button', { name: /we gaan/i }).click()
  await owner.getByRole('button', { name: /we gaan/i }).click()
  await owner.getByRole('button', { name: /stap \d+ van/i }).last().click()
  await owner.getByRole('button', { name: /we zijn klaar/i }).click()

  await owner.getByRole('checkbox', { name: /noor/i }).check()
  await owner.getByLabel(/hoe lang waren jullie/i).fill('40')
  await owner.getByLabel(/privénotitie/i).fill('Een herinnering die privé blijft.')
  await owner.getByLabel(/foto/i).setInputFiles({
    name: 'herinnering.png',
    mimeType: 'image/png',
    buffer: TINY_PNG,
  })
  await owner.getByRole('button', { name: /avontuur afronden/i }).click()
  await expect(owner.getByRole('heading', { name: /goed gedaan/i })).toBeVisible()

  // The owning family sees the photograph on the dashboard.
  await owner.goto('/dashboard')
  const image = owner.locator('img[src^="/api/media/"]').first()
  await expect(image).toBeVisible()
  const signedUrl = await image.getAttribute('src')
  expect(signedUrl).toMatch(/^\/api\/media\/[a-z0-9]+\?expires=\d+&signature=[\w-]+$/)

  // Fetched from inside the page, so the request carries that family's session.
  const fetchAs = (target: Page, url: string) =>
    target.evaluate(async (href: string) => {
      const response = await fetch(href)
      return {
        status: response.status,
        contentType: response.headers.get('content-type'),
        cacheControl: response.headers.get('cache-control'),
      }
    }, url)

  const ownerResponse = await fetchAs(owner, signedUrl!)
  expect(ownerResponse.status).toBe(200)
  expect(ownerResponse.contentType).toBe('image/png')
  expect(ownerResponse.cacheControl).toContain('private')

  // A second family, with the exact signed URL, is refused.
  const strangerContext = await browser.newContext()
  const stranger = await strangerContext.newPage()
  await registerAndOnboard(stranger, 'Sem')
  expect((await fetchAs(stranger, signedUrl!)).status).toBe(403)

  // And a signed-out visitor gets nothing either.
  const anonymousContext = await browser.newContext()
  const anonymous = await anonymousContext.newPage()
  await anonymous.goto('/')
  expect((await fetchAs(anonymous, signedUrl!)).status).toBe(401)

  // Tampering with the signature fails even for the owner.
  const tampered = signedUrl!.replace(/signature=[\w-]+/, 'signature=forged')
  expect((await fetchAs(owner, tampered)).status).toBe(403)

  await ownerContext.close()
  await strangerContext.close()
  await anonymousContext.close()
})
