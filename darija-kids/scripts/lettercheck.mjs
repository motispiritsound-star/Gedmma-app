/**
 * Listens to the alphabet.
 *
 * You cannot hear a headless browser, but you can hold a microphone to the
 * speech engine: this replaces the voice list and `speak`, then taps every
 * letter in the app and writes down exactly what was sent to be said — once
 * with an Arabic voice available, once with only a Dutch one.
 *
 * It exists because of two real complaints: ت came out sounding like a d, and
 * ج came out as "ziem", which is the sound of ز.
 *
 * Run with: node scripts/lettercheck.mjs
 */
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { seeded } from './lib/profile.mjs'

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4330
const BASE = `http://127.0.0.1:${PORT}`

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()

const browser = await chromium.launch({ executablePath: CHROME })
const fails = []

/** A page whose speech engine writes down what it was asked to say. */
const listener = async (voices) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const said = []
  page.on('pageerror', (e) => fails.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && fails.push(m.text()))
  await page.exposeFunction('gezegd', (lang, text) => said.push({ lang, text }))
  await page.addInitScript((langs) => {
    const fake = langs.map((lang) => ({
      lang, name: `Test ${lang}`, voiceURI: `test-${lang}`, localService: true, default: false,
    }))
    Object.defineProperty(speechSynthesis, 'getVoices', { value: () => fake })
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text } }
    speechSynthesis.speak = (u) => {
      // The engine is woken with a single space on the first utterance ever;
      // that is plumbing, not something anybody hears.
      if (u.text.trim()) window.gezegd(u.voice ? u.voice.lang : '', u.text)
      setTimeout(() => u.onend && u.onend(new Event('end')), 20)
    }
  }, voices)
  return { page, said }
}

/** Taps every letter on /letters and returns what each one said. */
const tapEveryLetter = async (page, said) => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate((s) => localStorage.setItem('darijakids.v1', JSON.stringify(s)), seeded('nl'))
  await page.goto(`${BASE}/letters`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  const tiles = page.locator('main button.aspect-square')
  const count = await tiles.count()
  if (count !== 28) {
    fails.push(`${count} lettertegels op /letters, verwacht 28`)
    return []
  }
  // Anything the page said while it was still settling belongs to the page,
  // not to the first letter.
  await page.waitForTimeout(500)
  said.length = 0

  const out = []
  for (let i = 0; i < count; i++) {
    said.length = 0
    await tiles.nth(i).click({ force: true })
    await page.waitForTimeout(90)
    out.push({ name: (await tiles.nth(i).getAttribute('aria-label')) ?? `#${i}`, said: said.map((s) => s.text) })
  }
  return out
}

/** Same walk, but it also writes down which voice each letter came out of. */
const tapEveryLetterWithLang = async (page, said) => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate((s) => localStorage.setItem('darijakids.v1', JSON.stringify(s)), seeded('nl'))
  await page.goto(`${BASE}/letters`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  said.length = 0
  const tiles = page.locator('main button.aspect-square')
  const out = []
  for (let i = 0; i < await tiles.count(); i++) {
    said.length = 0
    await tiles.nth(i).click({ force: true })
    await page.waitForTimeout(90)
    out.push({
      name: (await tiles.nth(i).getAttribute('aria-label')) ?? `#${i}`,
      text: said[0]?.text ?? '',
      lang: said[0]?.lang ?? '',
    })
  }
  return out
}

/* ------------------------------------------ with an Arabic voice present */

console.log('met een Arabische stem')
{
  const { page, said } = await listener(['ar-MA', 'nl-NL'])
  const spoken = await tapEveryLetter(page, said)
  for (const { name, said: texts } of spoken) {
    if (texts.length !== 1) { fails.push(`${name}: ${texts.length} keer uitgesproken — ${JSON.stringify(texts)}`); continue }
    const text = texts[0]
    // The name of the letter, not the bare shape: تاء rather than ت.
    if ([...text].length < 2) fails.push(`${name}: sprak de losse letter "${text}" uit in plaats van de naam`)
  }
  const byText = new Map()
  for (const { name, said: texts } of spoken) {
    const key = (texts[0] ?? '').replace(/[ً-ْ]/g, '')
    if (byText.has(key)) fails.push(`${name} en ${byText.get(key)} klinken allebei als "${key}"`)
    byText.set(key, name)
  }
  console.log(`  ${spoken.length} letters, ${byText.size} verschillende namen`)
  console.log(`  ت → ${spoken.find((s) => s.name === 'ta')?.said[0]} · ط → ${spoken.find((s) => s.name === 'ṭa')?.said[0]}`)
  await page.close()
}

/* ----------------------------------- with only a Dutch voice to borrow */

console.log('\nmet alleen een Nederlandse stem')
{
  const { page, said } = await listener(['nl-NL'])
  const spoken = await tapEveryLetter(page, said)
  const map = new Map(spoken.map((s) => [s.name, s.said[0] ?? '']))

  // The two complaints that started this, and their fixes.
  const wanted = {
    jim: 'zjiem',
    ta: 'taa',
    'ṭa': 'taa',
    shin: 'sjien',
    zay: 'zaai',
    ya: 'jaa',
    ghayn: 'gain',
    kha: 'chaa',
    nun: 'noen',
    mim: 'miem',
  }
  for (const [name, expect] of Object.entries(wanted)) {
    const got = map.get(name)
    if (got !== expect) fails.push(`${name}: zei "${got}" in plaats van "${expect}"`)
  }
  if (map.get('jim') === 'ziem') fails.push('ج klinkt nog steeds als "ziem"')
  console.log(`  ج → ${map.get('jim')} · ش → ${map.get('shin')} · ز → ${map.get('zay')} · ي → ${map.get('ya')}`)
  console.log(`  ${new Set([...map.values()]).size} verschillende klanken over ${map.size} letters`)
  await page.close()
}

/* ------------------- a device with several voices and no Arabic one ------ */

console.log('\nmet een Nederlandse, Spaanse en Franse stem (geen Arabisch)')
{
  const { page, said } = await listener(['nl-NL', 'es-ES', 'fr-FR', 'it-IT', 'en-GB'])
  const spoken = await tapEveryLetterWithLang(page, said)
  const byId = new Map(spoken.map((s) => [s.name, s]))

  // The letters a Dutch mouth cannot make should be handed to one that can.
  const wanted = { tha: 'es', ra: 'es', jim: 'fr', ghayn: 'fr', ya: 'nl', kha: 'nl' }
  for (const [name, taal] of Object.entries(wanted)) {
    const row = byId.get(name)
    if (!row) { fails.push(`${name}: niet gevonden`); continue }
    if (!row.lang.toLowerCase().startsWith(taal)) {
      fails.push(`${name}: uitgesproken door ${row.lang}, verwacht ${taal}`)
    }
  }
  // ث and ت must not come out as the same sound from the same mouth.
  const tha = byId.get('tha')
  const ta = byId.get('ta')
  if (tha && ta && tha.lang === ta.lang && tha.text === ta.text) {
    fails.push(`ث en ت klinken allebei als "${tha.text}" uit dezelfde mond`)
  }
  console.log(`  \u062B \u2192 ${tha?.text} (${tha?.lang}) \u00b7 \u0631 \u2192 ${byId.get('ra')?.text} (${byId.get('ra')?.lang})`)
  console.log(`  \u062C \u2192 ${byId.get('jim')?.text} (${byId.get('jim')?.lang})`)
  await page.close()
}

await browser.close()
await server.close()

if (fails.length) {
  console.error(`\nniet in orde:\n- ${fails.join('\n- ')}`)
  process.exit(1)
}
console.log('\nalles in orde')
