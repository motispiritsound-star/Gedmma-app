/**
 * Drives the built app in a real browser: walks the landing page, the path, a
 * lesson and the dictionary, fails on any console error, and leaves screenshots
 * behind. Run against `npm run preview`.
 *
 * Run with: node scripts/smoke.mjs [baseUrl] [outDir]
 */
import { mkdir } from 'node:fs/promises'
import { startChroom } from './lib/chroom.mjs'

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173'
const OUT = process.argv[3] ?? 'shots'

await mkdir(OUT, { recursive: true })
const browser = await startChroom()
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })

const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
page.on('pageerror', (e) => problems.push(String(e)))

const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }); console.log('· ' + name) }

// A fresh visitor is asked for a language before anything else.
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await shot('00-welkom')
const welcome = page.getByRole('dialog')
if (!(await welcome.count())) throw new Error('het welkomstscherm verscheen niet')

// The rest of the walk runs in Dutch, so the labels below are predictable.
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('bladi.v1') ?? '{}')
  raw.langPicked = true
  raw.settings = { ...(raw.settings ?? {}), lang: 'nl' }
  localStorage.setItem('bladi.v1', JSON.stringify(raw))
})
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await shot('01-landing')

await page.getByRole('link', { name: /Start met les 1|Ga verder/ }).first().click()
await page.waitForURL(/leren|les/)
await shot('02-pad')

if (!page.url().includes('/les/')) {
  await page.getByRole('link', { name: /openen/ }).first().click()
  await page.waitForURL(/\/les\//)
}
await page.waitForTimeout(400)
// The first lesson opens on a tip; dismiss it, then walk the teaching cards.
const tip = page.getByRole('button', { name: 'Aan de slag' })
if (await tip.count()) await tip.click()
await shot('03-nieuw-woord')

for (let i = 0; i < 6; i++) {
  const snap = page.getByRole('button', { name: 'Snap ik!' })
  if (await snap.count()) { await snap.click({ force: true }); await page.waitForTimeout(250); continue }
  break
}
await shot('04-oefening')

// Answer whatever exercise is on screen, twice.
for (let i = 0; i < 2; i++) {
  const options = page.locator('.btn3d').filter({ hasNot: page.locator('input') })
  if (await options.count()) await options.first().click({ force: true })
  await page.waitForTimeout(400)
  const verder = page.getByRole('button', { name: /Verder|Afronden/ })
  if (await verder.count()) await verder.click({ force: true })
  await page.waitForTimeout(300)
}
await shot('05-feedback')

await page.goto(`${BASE}/woorden`, { waitUntil: 'networkidle' })
await page.getByRole('searchbox').fill('thee')
await page.waitForTimeout(300)
await shot('06-woordenboek')

await page.goto(`${BASE}/letters`, { waitUntil: 'networkidle' })
await shot('07-letters')

await page.goto(`${BASE}/verhalen/souq`, { waitUntil: 'networkidle' })
await shot('08-verhaal')

await page.goto(`${BASE}/profiel`, { waitUntil: 'networkidle' })
await shot('09-profiel')

// And the desktop view of the landing page.
const wide = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await wide.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await wide.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('bladi.v1') ?? '{}')
  raw.langPicked = true
  localStorage.setItem('bladi.v1', JSON.stringify(raw))
})
await wide.reload({ waitUntil: 'networkidle' })
await wide.screenshot({ path: `${OUT}/10-landing-breed.png` })
console.log('· 10-landing-breed')

await browser.close()

if (problems.length) {
  console.error('\nConsolefouten:\n' + problems.map((p) => '  ✗ ' + p).join('\n'))
  process.exit(1)
}
console.log('\nGeen consolefouten.')
