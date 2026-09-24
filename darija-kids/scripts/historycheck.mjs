/**
 * Plays a real checkpoint and checks the history card that comes out of it.
 *
 * The card is the reward for passing a test, so the only honest way to check
 * it is to pass one: this walks the alphabet checkpoint question by question,
 * waits for the card, reads what it says, and then looks in the collection to
 * see that it stayed there.
 *
 * Run with: node scripts/historycheck.mjs
 */
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'
import { seeded, CHECK, ONWARD } from './lib/profile.mjs'

const PORT = 4317
const BASE = `http://127.0.0.1:${PORT}`
const SHOTS = process.env.SHOTS ?? ''

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()

const browser = await startChroom()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
page.on('pageerror', (e) => problems.push(String(e)))

const fails = []
const store = () => page.evaluate(() => JSON.parse(localStorage.getItem('darijakids.v1')))

/**
 * Plays a round to the end, and actually gets the answers right.
 *
 * A wrong answer goes back into the queue, so a camera that always taps the
 * first option never finishes. This remembers, per question, which options
 * came back wrong and picks one it has not ruled out yet — so every question
 * is right within four attempts and the round ends.
 */
const wrong = new Map()

const playRound = async (max = 400) => {
  for (let i = 0; i < max; i++) {
    // The history card carries a "Verder" of its own; without this the camera
    // would tap straight through the very thing it came to look at.
    if (await page.locator('[data-card]').count()) return true

    const onward = page.getByRole('button', { name: ONWARD })
    if (await onward.count()) {
      await onward.first().click({ force: true })
      await page.locator('[data-verdict]').first().waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(60)
      continue
    }

    const options = page.locator('[data-answer]')
    if (await options.count()) {
      const labels = await options.allInnerTexts()
      // The question is whatever is on screen minus the answers. Keying on the
      // heading alone would lump every "which letter is this?" together and
      // rule out the right answer for a letter it was never shown for.
      const key = labels
        .reduce((text, l) => text.split(l).join(''), await page.locator('main').innerText())
        .replace(/\s+/g, ' ').trim()
      const seen = wrong.get(key) ?? new Set()
      const pick = labels.findIndex((l) => !seen.has(l))
      const n = pick < 0 ? 0 : pick
      await options.nth(n).click({ force: true })
      await page.waitForTimeout(140)
      const verdict = await page.locator('[data-verdict]').first().getAttribute('data-verdict').catch(() => null)
      if (verdict && verdict !== 'goed') {
        seen.add(labels[n])
        wrong.set(key, seen)
      }
      continue
    }

    const field = page.locator('input[type="text"], textarea')
    if (await field.count()) {
      // A typed answer cannot be guessed; the round re-asks it and the app
      // shows the right spelling, which the next pass then types back.
      const key = (await page.locator('main').innerText()).replace(/\s+/g, ' ').trim()
      await field.first().fill(wrong.get(`a:${key}`) ?? 'x')
      await page.getByRole('button', { name: CHECK }).first().click({ force: true })
      await page.waitForTimeout(160)
      const bar = await page.locator('[data-verdict]').first().innerText().catch(() => '')
      const shown = bar.match(/[«"'\u2018\u201c]?\s*([^\n«»"']{2,40})\s*[»"'\u2019\u201d]?$/)
      if (shown) wrong.set(`a:${key}`, shown[1].trim())
      continue
    }

    return true
  }
  return false
}

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
// Hearts off: the camera is a bad speller and a checkpoint is long.
await page.evaluate((s) => localStorage.setItem('darijakids.v1', JSON.stringify(s)), seeded('nl', { hearts: false }))

await page.goto(`${BASE}/les/hruf-toets`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
// A tip sheet may stand in front of the first question.
const go = page.getByRole('button', { name: /^(Snap ik!|Start|Yallah)/ })
if (await go.count()) await go.first().click({ force: true }).catch(() => {})
await page.waitForTimeout(300)

if (!(await playRound())) fails.push('de toets liep niet af')

await page.waitForTimeout(1500)
const cardText = (await page.locator('body').innerText()).replace(/\n+/g, ' / ')
if (!/kaart uit de geschiedenis/i.test(cardText)) {
  fails.push(`geen geschiedeniskaart na de toets — scherm: ${cardText.slice(0, 200)}`)
} else {
  console.log(`kaart: ${cardText.split(' / ').slice(0, 4).join(' · ')}`)
  // Beat two tells the story; the punchline is deliberately still held back.
  if (!/Tweeduizend jaar geleden/.test(cardText)) fails.push('het verhaal staat niet op de kaart')
  if (/Wist je dat\?/.test(cardText)) fails.push('de clou stond er al voordat hij verteld was')
}
if (SHOTS) await page.screenshot({ path: `${SHOTS}/hist-beat-verhaal.png` })

// Without a voice the story beat is paced by reading time; a beat that ends
// the instant it begins is the bug that let a fragment flash past its own
// story on every device that cannot speak.
{
  await page.locator('[data-card][data-beat="verhaal"]').waitFor({ timeout: 5000 })
    .catch(() => fails.push('het fragment kwam nooit bij het verhaal'))
  await page.waitForTimeout(2500)
  const still = await page.locator('[data-card]').getAttribute('data-beat')
  if (still !== 'verhaal') fails.push(`het verhaal schoot door naar "${still}" binnen vier seconden`)
  else console.log('tempo: het verhaal blijft staan zonder stem')
}

// It has to be in the collection before the button is even pressed: the card
// is earned by passing, not by watching.
const afterCard = await store()
if (!afterCard.history?.length) fails.push('de kaart belandde niet in de verzameling')
else console.log(`verzameling: ${JSON.stringify(afterCard.history)}`)

// The fragment plays in beats and only offers "Verder" when it has finished
// telling; tapping through it is what a child in a hurry would do too.
for (let i = 0; i < 6; i++) {
  const beat = await page.locator('[data-card]').getAttribute('data-beat')
  if (beat === 'klaar') break
  await page.locator('[data-card] button').first().click({ force: true })
  await page.waitForTimeout(350)
}
const lastBeat = await page.locator('[data-card]').getAttribute('data-beat')
if (lastBeat !== 'klaar') fails.push(`het fragment bleef hangen op "${lastBeat}"`)
else console.log('fragment: opening -> verhaal -> wist -> klaar')
const endText = (await page.locator('body').innerText()).replace(/\n+/g, ' / ')
if (!/Wist je dat\?/.test(endText)) fails.push('de clou kwam nooit')
if (!/olijfpersen/.test(endText)) fails.push('de clou is leeg')
if (SHOTS) await page.screenshot({ path: `${SHOTS}/hist-beat-wist.png` })
await page.getByRole('button', { name: /^(Verder|Continue)$/ }).first().click({ force: true })
await page.waitForTimeout(700)
if (!/Les klaar|Foutloos/.test(await page.locator('body').innerText())) {
  fails.push('na de kaart kwam de uitslag niet')
}

await page.goto(`${BASE}/geschiedenis`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const collection = (await page.locator('main, body').first().innerText()).replace(/\n+/g, ' / ')
if (!/1 van de 14 kaarten/.test(collection)) fails.push(`verkeerde teller: ${collection.slice(0, 160)}`)
// One card in fourteen is a sliver, not a full bar: Progress takes a fraction
// and a percentage passed to it clamps to 100%.
const bar = await page.evaluate(() => {
  const fill = document.querySelector('[class*="bg-mint-500"]')
  const track = fill?.parentElement
  return fill && track ? fill.getBoundingClientRect().width / track.getBoundingClientRect().width : -1
})
if (bar < 0) fails.push('geen voortgangsbalk op de verzamelpagina')
else if (bar > 0.2) fails.push(`de balk staat op ${Math.round(bar * 100)}% bij 1 van de 14`)
console.log(`balk: ${Math.round(bar * 100)}%`)

const locked = await page.locator('button[disabled]').count()
if (locked !== 13) fails.push(`${locked} kaarten op slot, verwacht 13`)
console.log(`verzamelpagina: ${locked} op slot`)
if (SHOTS) await page.screenshot({ path: `${SHOTS}/hist-verzameling.png`, fullPage: true })

// Every card readable, in every language, without a console error.
for (const lang of ['nl', 'fr', 'de', 'es', 'it', 'en']) {
  await page.evaluate(
    ([l, ids]) => {
      const s = JSON.parse(localStorage.getItem('darijakids.v1'))
      s.settings.lang = l
      s.history = ids
      localStorage.setItem('darijakids.v1', JSON.stringify(s))
    },
    [lang, ['walili', 'tariq', 'fes', 'fatima', 'marrakech', 'zaynab', 'idrisi',
      'battuta', 'wazzan', 'mansour', 'amerika', 'leeuw', 'istiqlal', 'tifinagh']],
  )
  await page.goto(`${BASE}/geschiedenis`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const open = await page.locator('button[aria-expanded]').count()
  if (open !== 14) fails.push(`${lang}: ${open} open te klappen kaarten, verwacht 14`)
  await page.locator('button[aria-expanded]').nth(3).click()
  await page.waitForTimeout(250)
  const body = await page.locator('button[aria-expanded="true"]').locator('..').innerText()
  const teller = await page.locator('button').filter({ hasText: /^[\u25b6\u25fc]/ }).count()
  if (teller !== 1) fails.push(`${lang}: ${teller} voorleesknoppen op een open kaart, verwacht 1`)
  if (body.length < 200) fails.push(`${lang}: kaart 4 heeft nauwelijks tekst`)
  console.log(`${lang}: 14 kaarten · ${body.replace(/\s+/g, ' ').slice(0, 58)}`)
  if (SHOTS && lang === 'fr') await page.screenshot({ path: `${SHOTS}/hist-fr.png` })
}

/**
 * The light theme on a dark phone.
 *
 * Tailwind's `dark:` follows the operating system and the app's own tokens
 * follow `data-theme`, so without the custom variant in index.css a learner
 * who picked the light theme on a dark phone gets dark-mode text colours on a
 * cream background. The year on a history card is the easiest place to see it.
 */
{
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' })
  const colourOfYear = async (theme) => {
    await phone.goto(`${BASE}/`, { waitUntil: 'networkidle' })
    await phone.evaluate((s) => localStorage.setItem('darijakids.v1', JSON.stringify(s)), {
      ...seeded('nl', { theme }), history: ['walili'],
    })
    await phone.goto(`${BASE}/geschiedenis`, { waitUntil: 'networkidle' })
    await phone.waitForTimeout(500)
    return phone.evaluate(() => {
      const year = [...document.querySelectorAll('span, p')].find((e) => e.textContent?.trim() === '± 200')
      return year ? getComputedStyle(year).color : ''
    })
  }
  const light = await colourOfYear('light')
  const dark = await colourOfYear('dark')
  if (!light || !dark) fails.push('het jaartal was niet te vinden om de kleur van af te lezen')
  else if (light === dark) fails.push(`licht en donker geven hetzelfde jaartal: ${light}`)
  else console.log(`thema op een donkere telefoon: licht ${light} · donker ${dark}`)
  await phone.close()
}

/**
 * The narrator, on a device that has a voice.
 *
 * Headless Chromium ships none, which is the honest test of the fallback —
 * the beats above ran on their timers and the fragment still finished. This
 * is the other half: a made-up voice list per language, and a check that the
 * card asks for the right one and actually hands it the right words.
 */
{
  const spoken = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const asked = []
  await spoken.exposeFunction('gesproken', (lang, text) => asked.push({ lang, text }))
  await spoken.addInitScript(() => {
    const fake = ['nl-NL', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'en-GB', 'ar-MA'].map((lang) => ({
      lang, name: `Test ${lang}`, voiceURI: `test-${lang}`, localService: true, default: false,
    }))
    Object.defineProperty(speechSynthesis, 'getVoices', { value: () => fake })
    // The real utterance refuses a voice that is not a real SpeechSynthesisVoice,
    // and there is no way to make one, so the utterance is a double as well.
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text } }
    speechSynthesis.speak = (u) => {
      window.gesproken(u.voice ? u.voice.lang : '', u.text)
      setTimeout(() => u.onend && u.onend(new Event('end')), 60)
    }
  })

  for (const lang of ['nl', 'fr', 'it']) {
    asked.length = 0
    await spoken.goto(`${BASE}/`, { waitUntil: 'networkidle' })
    await spoken.evaluate((s) => localStorage.setItem('darijakids.v1', JSON.stringify(s)), seeded(lang))
    await spoken.goto(`${BASE}/kaart/fatima`, { waitUntil: 'networkidle' })
    await spoken.waitForTimeout(4200)
    const mine = asked.filter((a) => a.text.length > 30)
    if (mine.length < 2) fails.push(`${lang}: de verteller zei ${mine.length} stukken, verwacht 2`)
    else if (!mine.every((a) => a.lang.startsWith(lang))) {
      fails.push(`${lang}: voorgelezen met ${mine.map((a) => a.lang).join(', ')}`)
    } else console.log(`verteller ${lang}: ${mine.length} stukken in ${mine[0].lang} · "${mine[0].text.slice(0, 40)}…"`)
    const beat = await spoken.locator('[data-card]').getAttribute('data-beat')
    if (beat !== 'klaar') fails.push(`${lang}: het fragment eindigde op "${beat}" met een stem erbij`)
  }
  await spoken.close()
}

await browser.close()
await server.close()

if (problems.length) fails.push(...problems)
if (fails.length) {
  console.error(`\nniet in orde:\n- ${fails.join('\n- ')}`)
  process.exit(1)
}
console.log('\nalles in orde')
