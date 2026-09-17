/**
 * Checks the way back to a human, in every language.
 *
 * The feedback sheet has no server behind it: it builds a `mailto:` and hands
 * it to the parent's own mail app. That link is the whole feature, so this
 * reads the real hrefs off the real page and checks the subject is translated,
 * the address is the publisher's, and a word correction carries the word.
 *
 * Run with: node scripts/feedbackcheck.mjs
 */
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { readFileSync } from 'node:fs'
import { seeded } from './lib/profile.mjs'

/** Read straight out of the source, so the check cannot drift from the app. */
const field = (name) => (
  readFileSync('src/content/operator.ts', 'utf8').match(new RegExp(`${name}: '([^']*)'`))?.[1] ?? ''
)
const OPERATOR = { name: field('name'), email: field('email') }

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4315
const BASE = `http://127.0.0.1:${PORT}`

if (!OPERATOR.name || !OPERATOR.email) {
  console.error('src/content/operator.ts is empty, so the feedback button is hidden by design.')
  console.error('Fill in name and email before running this check.')
  process.exit(1)
}

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
page.on('pageerror', (e) => problems.push(String(e)))

const fail = (msg) => { problems.push(msg); console.log(`  x ${msg}`) }
const ok = (msg) => console.log(`  . ${msg}`)

/** Every mailto on screen, decoded back into subject and body. */
const mailtos = () => page.$$eval('a[href^="mailto:"]', (as) => as.map((a) => {
  const url = new URL(a.href)
  return {
    to: url.pathname,
    subject: url.searchParams.get('subject') ?? '',
    body: url.searchParams.get('body') ?? '',
  }
}))

const openSheet = async (trigger) => {
  await trigger.click()
  await page.waitForSelector('a[href^="mailto:"]', { timeout: 4000 })
}

const subjects = new Set()

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })

for (const lang of ['nl', 'fr', 'de', 'es', 'it', 'en']) {
  console.log(`\n${lang}`)
  await page.evaluate((s) => localStorage.setItem('darijakids.v1', JSON.stringify(s)), seeded(lang))

  // ------------------------------------------------------- the parents page
  await page.goto(`${BASE}/ouders`, { waitUntil: 'networkidle' })
  if (await page.locator('button.js-feedback').count() === 0) {
    fail(`${lang}: no feedback button on /ouders`)
  } else {
    await openSheet(page.locator('button.js-feedback').first())
    const reasons = (await mailtos()).filter((l) => l.subject)
    if (reasons.length !== 4) fail(`${lang}: /ouders sheet has ${reasons.length} reasons, expected 4`)
    else ok('four reasons, each with its own subject')
    for (const l of reasons) {
      if (l.to !== OPERATOR.email) fail(`${lang}: mail goes to ${l.to}, not ${OPERATOR.email}`)
      if (!l.subject.startsWith('Darijaforkids \u00b7 ')) fail(`${lang}: subject "${l.subject}" is missing the app name`)
      if (!/Darijaforkids \d/.test(l.body)) fail(`${lang}: body has no version footer`)
      subjects.add(l.subject)
    }
    const withUA = reasons.filter((l) => l.body.includes('Mozilla')).length
    if (withUA !== 1) fail(`${lang}: ${withUA} reasons carry the browser line, expected exactly 1`)
    else ok('only the bug report carries the browser line')
    await page.keyboard.press('Escape')
  }

  // ---------------------------------------------------- a dictionary word
  await page.goto(`${BASE}/woorden`, { waitUntil: 'networkidle' })
  await page.locator('button[aria-expanded]').first().click()
  const word = await page.locator('.ar').first().innerText()
  const link = page.locator('button').filter({ hasText: /\?$/ }).last()
  if (await link.count() === 0) fail(`${lang}: no word-correction link in the dictionary`)
  else {
    await openSheet(link)
    const links = (await mailtos()).filter((l) => l.subject)
    if (links.length !== 1) fail(`${lang}: word sheet offers ${links.length} reasons, expected 1`)
    else if (!links[0].body.includes(word)) fail(`${lang}: word "${word}" is not in the mail body`)
    else ok(`word correction carries ${word}`)
    await page.keyboard.press('Escape')
  }

  // ------------------------------------------------------------ the footer
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const foot = page.locator('footer button')
  if (await foot.count() === 0) fail(`${lang}: no contact link in the landing footer`)
  else {
    await openSheet(foot.first())
    if ((await mailtos()).length < 4) fail(`${lang}: footer sheet is empty`)
    else ok('footer link opens the sheet')
    await page.keyboard.press('Escape')
  }

  // ---------------------------------------------------------- the settings
  await page.goto(`${BASE}/instellingen`, { waitUntil: 'networkidle' })
  if (await page.locator('button.js-feedback').count() === 0) fail(`${lang}: no feedback row in the settings`)
  else {
    await openSheet(page.locator('button.js-feedback').first())
    if ((await mailtos()).length < 4) fail(`${lang}: settings sheet is empty`)
    else ok('settings row opens the sheet')
    await page.keyboard.press('Escape')
  }
}

// Six languages x four reasons, all different: nothing fell back to Dutch.
if (subjects.size !== 24) fail(`expected 24 distinct subjects, got ${subjects.size}`)
else console.log('\n. 24 distinct subject lines - every language translates its own')

await browser.close()
await server.close()

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`)
  for (const p of problems) console.error(` - ${p}`)
  process.exit(1)
}
console.log('\nfeedback: all good')
