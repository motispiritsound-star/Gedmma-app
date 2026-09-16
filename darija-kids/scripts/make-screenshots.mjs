/**
 * Photographs the real app in the sizes both stores demand.
 *
 * Not mock-ups: every screenshot is the app itself, running in a browser at
 * the device's own resolution, with a lived-in profile seeded first — a streak
 * going, some gems, a few lessons behind it — because an empty app sells
 * nothing. Each shot is framed with a caption in the language of the listing.
 *
 * Run `npm run preview` first, then:
 *   node scripts/make-screenshots.mjs [baseUrl] [outDir]
 *   node scripts/make-screenshots.mjs --lang nl --device iphone
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { GO_ON, GOT_IT, seeded } from './lib/profile.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}
const positional = process.argv.slice(2).filter((a) => !a.startsWith('--') && !process.argv[process.argv.indexOf(a) - 1]?.startsWith('--'))

const BASE = positional[0] ?? 'http://127.0.0.1:4173'
const OUT = positional[1] ?? path.join(ROOT, 'store', 'screenshots')

/**
 * What each store wants, in pixels.
 *
 * Apple asks for one iPhone size and one iPad size and derives the rest;
 * Google wants a phone and, optionally, two tablets. `viewport` is the logical
 * size the app is laid out at, and the shot is scaled up to `w × h` from there.
 */
const DEVICES = {
  iphone: { w: 1290, h: 2796, viewport: { width: 430, height: 932 }, store: 'App Store · iPhone 6.9"' },
  ipad: { w: 2048, h: 2732, viewport: { width: 1024, height: 1366 }, store: 'App Store · iPad 13"' },
  play: { w: 1080, h: 1920, viewport: { width: 432, height: 768 }, store: 'Google Play · telefoon' },
  'play-7': { w: 1200, h: 1920, viewport: { width: 600, height: 960 }, store: 'Google Play · 7-inch tablet' },
  'play-10': { w: 1600, h: 2560, viewport: { width: 800, height: 1280 }, store: 'Google Play · 10-inch tablet' },
}

/** The six screens, and what each one is there to say. */
const SHOTS = [
  {
    id: '1-pad',
    path: '/leren',
    caption: {
      nl: 'Een pad van 17 units,\nvan alfabet tot souq',
      fr: 'Un parcours de 17 unités,\nde l’alphabet au souk',
      de: 'Ein Pfad aus 17 Einheiten,\nvom Alphabet bis zum Souk',
      es: 'Un camino de 17 unidades,\ndel alfabeto al zoco',
      en: 'A path of 17 units,\nfrom the alphabet to the souq',
    },
  },
  {
    id: '2-letters',
    path: '/letters',
    caption: {
      nl: 'Het Arabische schrift,\nletter voor letter',
      fr: 'L’écriture arabe,\nlettre par lettre',
      de: 'Die arabische Schrift,\nBuchstabe für Buchstabe',
      es: 'La escritura árabe,\nletra a letra',
      en: 'The Arabic script,\nletter by letter',
    },
  },
  {
    id: '3-les',
    path: '/les/hruf-1',
    lesson: true,
    caption: {
      nl: 'Korte lessen die klinken\nen meteen belonen',
      fr: 'Des leçons courtes,\nsonores et gratifiantes',
      de: 'Kurze Lektionen, die klingen\nund sofort belohnen',
      es: 'Lecciones cortas que suenan\ny recompensan al momento',
      en: 'Short lessons that sound,\nand reward straight away',
    },
  },
  {
    id: '4-woorden',
    path: '/woorden',
    caption: {
      nl: '304 woorden en 100 zinnen,\nelk met uitspraak',
      fr: '304 mots et 100 phrases,\nchacun avec la prononciation',
      de: '304 Wörter und 100 Sätze,\njedes mit Aussprache',
      es: '304 palabras y 100 frases,\ncada una con pronunciación',
      en: '304 words and 100 sentences,\nevery one spoken',
    },
  },
  {
    id: '5-verhalen',
    path: '/verhalen',
    caption: {
      nl: 'Echte gesprekken,\nzin voor zin te vertalen',
      fr: 'De vraies conversations,\nphrase par phrase',
      de: 'Echte Gespräche,\nSatz für Satz übersetzbar',
      es: 'Conversaciones de verdad,\nfrase a frase',
      en: 'Real conversations,\ntranslated line by line',
    },
  },
  {
    id: '6-jij',
    path: '/profiel',
    caption: {
      nl: 'Beloningen, reeksen\nen een dagdoel',
      fr: 'Récompenses, séries\net un objectif quotidien',
      de: 'Belohnungen, Serien\nund ein Tagesziel',
      es: 'Recompensas, rachas\ny un objetivo diario',
      en: 'Rewards, streaks\nand a daily goal',
    },
  },
]

/** The frame around the shot: a caption, then the screen itself. */
const frame = (device, capture, caption) => {
  const pad = Math.round(device.w * 0.055)
  const head = Math.round(device.h * 0.155)
  const lines = caption.split('\n')
  return `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family: 'Fig'; src: local('Figtree'), local('Arial'); }
  * { margin: 0; box-sizing: border-box }
  body {
    width: ${device.w}px; height: ${device.h}px; overflow: hidden;
    background: linear-gradient(160deg, #ffd79a, #f0915c 55%, #e2603c);
    font-family: Figtree, 'Segoe UI', system-ui, sans-serif;
  }
  .caption {
    height: ${head}px; display: flex; flex-direction: column; justify-content: center;
    align-items: center; text-align: center; padding: 0 ${pad}px;
    color: #2b1d16; font-weight: 800; letter-spacing: -0.01em;
    font-size: ${Math.round(device.w * 0.062)}px; line-height: 1.22;
  }
  .screen {
    margin: 0 ${pad}px; height: ${device.h - head - pad}px;
    border-radius: ${Math.round(device.w * 0.052)}px; overflow: hidden;
    box-shadow: 0 ${Math.round(device.w * 0.02)}px ${Math.round(device.w * 0.06)}px rgba(43,29,22,.32);
    background: #fffaf3;
  }
  .screen img { display: block; width: 100%; }
</style>
<div class="caption">${lines.map((l) => `<div>${l}</div>`).join('')}</div>
<div class="screen"><img src="data:image/png;base64,${capture}"></div>`
}

const shoot = async (browser, composer, lang, deviceKey) => {
  const device = DEVICES[deviceKey]
  const dir = path.join(OUT, lang, deviceKey)
  await mkdir(dir, { recursive: true })

  // The app is captured at the device's real pixel count, so it stays sharp
  // when it lands in the frame. The frame itself is drawn at one pixel per
  // pixel — a store rejects a 6.9" screenshot that is three times 6.9".
  const context = await browser.newContext({
    viewport: device.viewport,
    deviceScaleFactor: Math.max(2, device.w / device.viewport.width),
  })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate((state) => localStorage.setItem('darijakids.v1', JSON.stringify(state)), seeded(lang))

  for (const shot of SHOTS) {
    await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    if (shot.lesson) {
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
    const capture = (await page.screenshot()).toString('base64')
    await composer.setViewportSize({ width: device.w, height: device.h })
    await composer.setContent(frame(device, capture, shot.caption[lang]))
    await composer.waitForTimeout(150)
    const file = path.join(dir, `${shot.id}.png`)
    await composer.screenshot({ path: file })
    console.log(path.relative(ROOT, file))
  }

  await context.close()
}

const langs = (arg('lang', 'nl,fr,de,es,en')).split(',')
const devices = (arg('device', Object.keys(DEVICES).join(','))).split(',')

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: CHROME })
const frameContext = await browser.newContext({ deviceScaleFactor: 1 })
const composer = await frameContext.newPage()
for (const lang of langs) {
  for (const device of devices) {
    if (!DEVICES[device]) throw new Error(`onbekend formaat: ${device}`)
    await shoot(browser, composer, lang, device)
  }
}
await browser.close()

await writeFile(
  path.join(OUT, 'README.md'),
  `# Schermafbeeldingen\n\nGemaakt met \`npm run screenshots\` uit de echte app — geen mock-ups.\n\n` +
    Object.entries(DEVICES).map(([k, d]) => `- \`${k}/\` — ${d.store} (${d.w}×${d.h})`).join('\n') +
    `\n\nPer taal een map. Upload ze in dezelfde volgorde als de bestandsnamen.\n`,
)
console.log('\\nklaar')
