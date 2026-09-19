/**
 * Walks the whole app looking for the two failures nothing else catches: a
 * screen that throws, and a screen that renders nothing.
 *
 * Unit tests cover the rules and the check scripts cover one feature each.
 * What neither of them does is open every page the way a person does — in six
 * languages, light and dark, on a small phone and a tablet, once as somebody
 * who has just installed the app and once as somebody halfway through the
 * course. A crash on a page nobody thought to open is exactly the review that
 * comes back rejected.
 *
 * Run with: node scripts/sweep.mjs [--taal nl] [--breed]
 */
import { chromium } from 'playwright'
import { createServer } from 'vite'

const PORT = 4392
const BASE = `http://127.0.0.1:${PORT}`
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const BREED = process.argv.includes('--breed')
const TALEN = arg('taal') ? [arg('taal')] : ['nl', 'fr', 'de', 'es', 'it', 'en']

/** Every route a person can reach, plus the ones only the demo shows. */
const ROUTES = [
  '/', '/leren', '/herhalen', '/woorden', '/letters', '/verhalen', '/spelen',
  '/bonus', '/profiel', '/geschiedenis', '/ouders', '/instellingen',
  '/privacy', '/voorwaarden', '/volledig',
  '/uitspraak', '/opname', '/kaart/tariq', '/film/walili',
]

/** A learner who is not on their first day: six units in, subscription running. */
const HALVERWEGE = {
  xp: 940, streak: 12, bestStreak: 12, unlocked: true, unlockedAt: 1, ebook: true,
  langPicked: true,
  lessons: Object.fromEntries(
    ['salam-1', 'salam-2', 'salam-toets', 'ana-1', 'ana-toets', 'l3a2ila-1', 'l3a2ila-toets']
      .map((id) => [id, { stars: 3, runs: 1, bestScore: 1, lastDone: 1 }]),
  ),
}

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ executablePath: CHROME })

const klachten = []
let gelopen = 0

/** One pass over every route, in one language, theme, size and state. */
async function loop({ taal, thema, breedte, hoogte, staat, naam }) {
  const ctx = await browser.newContext({
    viewport: { width: breedte, height: hoogte },
    // Motion off: an animation mid-flight reads as an empty page.
    reducedMotion: 'reduce',
  })
  const page = await ctx.newPage()
  const fouten = []
  page.on('pageerror', (e) => fouten.push(String(e)))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    // A missing favicon in a dev server is not a bug in the app.
    if (/favicon|net::ERR_FILE/.test(m.text())) return
    fouten.push(m.text())
  })

  await page.addInitScript(
    ([taal, thema, staat]) => {
      localStorage.setItem('darijakids.v1', JSON.stringify({
        ...staat, settings: { lang: taal, theme: thema, sound: false, voorlezen: false },
      }))
    },
    [taal, thema, staat],
  )

  for (const route of ROUTES) {
    fouten.length = 0
    await page.goto(BASE + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(350)
    gelopen++
    const tekst = (await page.evaluate(() => document.body.innerText)).trim()
    if (tekst.length < 30) klachten.push(`${naam} ${route}: lege pagina`)

    // A page wider than the phone is the commonest visible bug there is: a
    // long German word, a price, an Arabic sentence that will not wrap. You
    // see it as a sideways wobble, and a reviewer sees it as sloppy.
    const breed = await page.evaluate(() => {
      const el = document.documentElement
      if (el.scrollWidth <= el.clientWidth + 1) return null
      const schuldig = [...document.querySelectorAll('body *')]
        .map((n) => ({ n, r: n.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.right > el.clientWidth + 1)
        .sort((a, b) => b.r.right - a.r.right)[0]
      return {
        over: el.scrollWidth - el.clientWidth,
        wie: schuldig ? `${schuldig.n.tagName.toLowerCase()}.${String(schuldig.n.className).slice(0, 60)}` : '?',
        tekst: schuldig ? (schuldig.n.textContent || '').trim().slice(0, 40) : '',
      }
    })
    if (breed) klachten.push(`${naam} ${route}: ${breed.over}px te breed — ${breed.wie} "${breed.tekst}"`)
    for (const f of fouten) klachten.push(`${naam} ${route}: ${f.slice(0, 160)}`)
  }
  await ctx.close()
}

for (const taal of TALEN) {
  await loop({ taal, thema: 'light', breedte: 390, hoogte: 844, staat: { langPicked: true }, naam: `${taal} nieuw` })
  await loop({ taal, thema: 'dark', breedte: 390, hoogte: 844, staat: HALVERWEGE, naam: `${taal} donker` })
  if (BREED) {
    await loop({ taal, thema: 'light', breedte: 820, hoogte: 1180, staat: HALVERWEGE, naam: `${taal} tablet` })
    // De grootste iPad, staand en liggend. Liggend is de maat waarop een
    // telefoonlayout het meest opvalt: alles blijft dan in een smalle kolom
    // midden op een scherm dat twee keer zo breed is.
    await loop({ taal, thema: 'light', breedte: 1024, hoogte: 1366, staat: HALVERWEGE, naam: `${taal} ipad staand` })
    await loop({ taal, thema: 'light', breedte: 1366, hoogte: 1024, staat: HALVERWEGE, naam: `${taal} ipad liggend` })
    // The narrowest phone still sold. If it fits here it fits anywhere.
    await loop({ taal, thema: 'light', breedte: 320, hoogte: 568, staat: HALVERWEGE, naam: `${taal} smal` })
  }
}

await browser.close()
await server.close()

console.log(`${gelopen} schermen bekeken`)
if (!klachten.length) {
  console.log('alles in orde')
  process.exit(0)
}
console.log(`\n${klachten.length} klachten:`)
for (const k of klachten) console.log('  ' + k)
process.exit(1)
