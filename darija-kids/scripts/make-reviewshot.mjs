/**
 * Het abonnementsscherm op ware grootte, voor de Review Screenshot die Apple
 * bij elke in-app aankoop vraagt.
 *
 * De opnames in `shots/` zijn 430 x 932 — dat is de maat waarop de app is
 * ontworpen, maar App Store Connect keurt hem af: een review-screenshot moet
 * minstens 640 x 920 zijn. Vandaar dezelfde pagina, maar met een pixeldichtheid
 * van 3, wat 1290 x 2796 oplevert: precies een iPhone 16 Pro Max. Dat is geen
 * opgeblazen plaatje maar een echte opname op die resolutie, dus de tekst
 * blijft scherp.
 *
 * Draaien met: node scripts/make-reviewshot.mjs [--taal nl]
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const PORT = 4399
const BASE = `http://127.0.0.1:${PORT}`
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const TAAL = arg('taal', 'nl')
const UIT = arg('uit', path.join('store', 'review-screenshot'))

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()

const browser = await chromium.launch({ executablePath: CHROME })
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  reducedMotion: 'reduce',
})
const page = await ctx.newPage()
/**
 * Deze opname gaat naar Apple, dus doet de app alsof hij op iOS draait: daar
 * deelt een abonnement met de gezinsgroep en dat zegt het scherm ook. In een
 * browser zou de Android-tekst verschijnen, en dan ziet de recensent iets
 * anders dan de koper.
 */
await page.addInitScript(() => {
  Object.defineProperty(window, 'Capacitor', { value: { getPlatform: () => 'ios' } })
})
/** Een gebruiker die al even bezig is: de balk bovenin staat dan niet leeg. */
await page.addInitScript((taal) => {
  localStorage.setItem('darijakids.v1', JSON.stringify({
    settings: { lang: taal }, langPicked: true, xp: 43, streak: 1, hearts: 5, gems: 6,
  }))
}, TAAL)

await mkdir(UIT, { recursive: true })
await page.goto(`${BASE}/volledig`, { waitUntil: 'networkidle' })
/**
 * In een browser is er geen winkel, dus waar op een toestel de koopknop staat,
 * staat hier een regel dat kopen in de app gebeurt. Die regel bestaat op een
 * telefoon niet, en een recensent die hem leest denkt dat hij naar een website
 * kijkt.
 */
await page.addStyleTag({ content: '[data-web-only] { display: none !important }' })
await page.waitForTimeout(800)
/**
 * Apple wil op de review-opname zien waar het abonnement wordt aangeboden, dus
 * de twee keuzeblokken met de prijs moeten erop staan. Die staan onder de vouw,
 * vandaar dat we er eerst heen scrollen.
 */
await page.mouse.move(215, 500)
await page.mouse.wheel(0, 640)
await page.waitForTimeout(800)
const uit = path.join(UIT, `abonnement-${TAAL}-1290x2796.png`)
await page.screenshot({ path: uit })
console.log('geschreven:', uit)

await browser.close()
await server.close()
