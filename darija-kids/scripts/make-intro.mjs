/**
 * Records the intro film: thirty seconds of the real app, with sound.
 *
 * Nothing here is a mock-up and nothing is a soundalike. The screens are
 * photographed from the running app, and the music is rendered by the app's
 * own instruments — the same marimba, darbuka and hijaz melodies a child hears
 * after finishing a lesson. `dev/intro.ts` draws and tapes it; this script
 * starts the server, takes the photographs, and saves what comes back.
 *
 * Run with:
 *   node scripts/make-intro.mjs
 *   node scripts/make-intro.mjs --lang nl --shape verhaal
 *   node scripts/make-intro.mjs --still 6      (one frame, to check a layout)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { GO_ON, GOT_IT, seeded } from './lib/profile.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4312
const BASE = `http://127.0.0.1:${PORT}`
const OUT = path.join(ROOT, 'store', 'video')

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}

/** The five screens the film shows, in the order it shows them. */
const SCREENS = [
  { id: 'leren', path: '/leren' },
  { id: 'letters', path: '/letters' },
  { id: 'les', path: '/les/hruf-1', lesson: true },
  { id: 'woorden', path: '/woorden' },
  { id: 'profiel', path: '/profiel' },
]

/** The app, photographed at the size the film draws it. */
const photograph = async (browser, lang) => {
  const taken = {}
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate((state) => localStorage.setItem('darijakids.v1', JSON.stringify(state)), seeded(lang))

  for (const screen of SCREENS) {
    await page.goto(`${BASE}${screen.path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    if (screen.lesson) {
      // A lesson opens on its tip; step past it to an actual question.
      const tip = page.getByRole('button', { name: GO_ON })
      if (await tip.count()) await tip.first().click()
      await page.waitForTimeout(500)
      for (let i = 0; i < 4; i++) {
        const snap = page.locator('button', { hasText: GOT_IT })
        if (!(await snap.count())) break
        await snap.first().click({ force: true })
        await page.waitForTimeout(350)
      }
      await page.waitForTimeout(400)
    }
    taken[screen.id] = `data:image/png;base64,${(await page.screenshot()).toString('base64')}`
  }
  await context.close()
  return taken
}

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  server: {
    port: PORT,
    strictPort: true,
    // Nothing may reload this page: a take is half a minute of real time and
    // a reload halfway through loses it. The films land in the project, and
    // somebody editing a file while it records would do the same.
    hmr: false,
    watch: { ignored: ['**/store/**', '**/dist/**', '**/dist-demo/**'] },
  },
  logLevel: 'error',
})
await server.listen()

const browser = await chromium.launch({
  executablePath: CHROME,
  args: [
    // The film starts its own AudioContext and there is nobody to tap the
    // screen, so the browser has to be told that is expected.
    '--autoplay-policy=no-user-gesture-required',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
  ],
})

const langs = arg('lang', 'nl,fr,de,es,en').split(',')
const shapes = arg('shape', 'appstore,verhaal,vierkant,breed').split(',')
const still = arg('still', null)

const page = await (await browser.newContext({ viewport: { width: 700, height: 760 } })).newPage()
const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(`${m.text()} @ ${m.location().url}`))
page.on('pageerror', (e) => problems.push(String(e)))
page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()} ${r.url()}`))
page.on('requestfailed', (r) => problems.push(`mislukt ${r.url()}`))

for (const lang of langs) {
  console.log(`\n${lang} — de app fotograferen`)
  const taken = await photograph(browser, lang)
  await mkdir(path.join(OUT, lang), { recursive: true })
  await page.goto(`${BASE}/dev/intro.html`, { waitUntil: 'networkidle' })
  await page.evaluate(([l, shots]) => { (window.darijaShots ??= {})[l] = shots }, [lang, taken])

  for (const shape of shapes) {
    if (still !== null) {
      const url = await page.evaluate(
        ([l, s, t]) => window.darijaIntro.still(l, s, Number(t)),
        [lang, shape, still],
      )
      const file = path.join(OUT, lang, `beeld-${shape}-${still}s.png`)
      await writeFile(file, Buffer.from(url.split(',')[1], 'base64'))
      console.log(`  ${path.relative(ROOT, file)}`)
      continue
    }
    const started = Date.now()
    const url = await page.evaluate(
      ([l, s]) => window.darijaIntro.record(l, s),
      [lang, shape],
    )
    const kind = url.slice(5, url.indexOf(';'))
    const ext = kind.includes('mp4') ? 'mp4' : 'webm'
    const data = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64')
    const file = path.join(OUT, lang, `intro-${shape}.${ext}`)
    await writeFile(file, data)
    console.log(
      `  ${path.relative(ROOT, file)} — ${(data.length / 1e6).toFixed(1)} MB, ` +
        `${((Date.now() - started) / 1000).toFixed(0)}s`,
    )
  }
}

await browser.close()
await server.close()

if (still === null) {
  await writeFile(
    path.join(OUT, 'README.md'),
    `# Video\n\nGemaakt met \`npm run intro\`.\n\n` +
      `- \`intro-appstore\` — 886×1920, de app preview van de App Store\n` +
      `- \`intro-verhaal\` — 1080×1920, voor stories, reels en TikTok\n` +
      `- \`intro-vierkant\` — 1080×1080, voor Instagram en Facebook\n` +
      `- \`intro-breed\` — 1920×1080, voor YouTube en de website\n\n` +
      `Ruim 27 seconden, met geluid. De schermen zijn de echte app en de muziek ` +
      `komt uit \`src/engine/instruments.ts\` — dezelfde marimba, darbuka en ` +
      `hijaz-melodieën als in de app zelf.\n\n` +
      `Per taal een map. De App Store wil een app preview van 15 tot 30 seconden ` +
      `in 886×1920 (vandaar \`intro-appstore\`); Google Play wil een YouTube-link, ` +
      `dus daar gaat \`intro-breed\` heen. Controleer een opname met ` +
      `\`node scripts/checkvideo.mjs <bestand>\`.\n`,
  )
}

if (problems.length) {
  console.error(`\nfouten in de pagina:\n${problems.join('\n')}`)
  process.exit(1)
}
console.log('\nklaar')
