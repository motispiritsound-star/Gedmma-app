/**
 * De Review Screenshots die Apple bij elke in-app aankoop vraagt.
 *
 * De opnames in `shots/` zijn 430 x 932 — dat is de maat waarop de app is
 * ontworpen, maar App Store Connect keurt hem af: een review-screenshot moet
 * minstens 640 x 920 zijn. Vandaar dezelfde pagina, maar met een pixeldichtheid
 * van 3, wat 1290 x 2796 oplevert: precies een iPhone 16 Pro Max. Dat is geen
 * opgeblazen plaatje maar een echte opname op die resolutie, dus de tekst
 * blijft scherp.
 *
 * Er komen er twee uit, want er zijn twee soorten producten:
 *
 *   abonnement  het kale scherm met de twee keuzeblokken — voor Jaar en Maand
 *   boek        het e-boek, in het oranje kader van de winkelplaatjes
 *
 * Het verschil zit niet in de smaak maar in wat er te zien moet zijn. Bij een
 * abonnement moet de recensent de twee prijzen naast elkaar zien staan, en
 * daar helpt een kader niet bij. Het e-boek is één product met één prijs, en
 * dan is er ruimte over die beter besteed is aan waar het over gaat.
 *
 * Alle woorden komen uit de app zelf, uit `t.unlock.boek` en `EBOOK`, dus dit
 * bestand bevat geen tekst die apart bijgehouden moet worden en klopt in alle
 * zes de talen zodra de app klopt.
 *
 * Draaien met:
 *   node scripts/make-reviewshot.mjs                    beide, in het Nederlands
 *   node scripts/make-reviewshot.mjs --soort boek
 *   node scripts/make-reviewshot.mjs --taal fr
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'

const PORT = 4399
const BASE = `http://127.0.0.1:${PORT}`
const BREED = 1290
const HOOG = 2796

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const TAAL = arg('taal', 'nl')
const SOORT = arg('soort', 'beide')
const UIT = arg('uit', path.join('store', 'review-screenshot'))

/**
 * De Marokkaanse vlag, getekend in plaats van als emoji.
 *
 * Chromium heeft op deze machine geen lettertype met vlaggen, dus een emoji
 * komt eruit als de letters "MA". Hetzelfde pentagram als op de winkelplaatjes.
 */
const VLAG = (breedte) => {
  const punt = (i) => {
    const hoek = ((-90 + i * 72) * Math.PI) / 180
    return [45 + 14 * Math.cos(hoek), 30 + 14 * Math.sin(hoek)]
  }
  const ster = [0, 2, 4, 1, 3].map(punt).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  return `<svg width="${breedte}" height="${Math.round((breedte * 2) / 3)}" viewBox="0 0 90 60">
    <rect width="90" height="60" rx="4" fill="#C1272D"/>
    <path d="${ster} Z" fill="none" stroke="#006233" stroke-width="2.4" stroke-linejoin="round"/>
  </svg>`
}

/**
 * De eerste helft van een zin.
 *
 * De app scheidt de kern van de toelichting met een kwadraatje of een
 * dubbele punt — "Alle woorden, alle letters en de grammatica — het hele pad
 * op papier" — en voor een kop is die eerste helft precies genoeg. Welk teken
 * het is verschilt per taal, dus staan ze er allebei in.
 */
const kern = (zin) => zin.split(/\s[—:]\s/)[0].trim()

const ontsnap = (tekst) => String(tekst).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

/**
 * Het oranje kader om de boekopname: kicker met vlag, kop, één prijsblok en
 * een voetregel, met daaronder de bovenkant van het scherm zelf. Dezelfde
 * maten en kleuren als `heroFrame` in make-screenshots.mjs, zodat dit plaatje
 * naast de winkelplaatjes niet uit de toon valt.
 */
const boekFrame = (capture, b) => {
  const pad = Math.round(BREED * 0.055)
  /**
   * De hoogte van het kopblok. Niet kleiner maken: de kop telt vier regels —
   * kicker, titel, prijsblok, voetregel — en zodra het vak krapper is dan die
   * vier, schuift de kaart eroverheen in plaats van eronder.
   */
  const kop = Math.round(HOOG * 0.33)
  return `<!doctype html><meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box }
  body {
    width: ${BREED}px; height: ${HOOG}px; overflow: hidden;
    display: flex; flex-direction: column;
    background: linear-gradient(160deg, #ffd79a, #f0915c 55%, #e2603c);
    font-family: Figtree, 'Segoe UI', system-ui, sans-serif; color: #2b1d16;
  }
  .kop {
    height: ${kop}px; flex: none; padding: ${Math.round(HOOG * 0.035)}px ${pad}px 0;
    display: flex; flex-direction: column; align-items: center; text-align: center;
  }
  .kicker {
    display: flex; align-items: center; gap: ${Math.round(BREED * 0.022)}px;
    font-size: ${Math.round(BREED * 0.034)}px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .08em; color: #7a3a1e;
  }
  .kicker svg { display: block; box-shadow: 0 2px 6px rgba(43,29,22,.25); border-radius: 4px }
  h1 {
    margin-top: ${Math.round(HOOG * 0.016)}px;
    font-size: ${Math.round(BREED * 0.072)}px; font-weight: 900;
    letter-spacing: -0.02em; line-height: 1.1; text-wrap: balance;
  }
  .pil {
    margin-top: ${Math.round(HOOG * 0.026)}px;
    background: rgba(255,251,243,.95);
    border-radius: ${Math.round(BREED * 0.042)}px;
    padding: ${Math.round(HOOG * 0.016)}px ${Math.round(BREED * 0.075)}px;
    box-shadow: 0 ${Math.round(BREED * 0.008)}px ${Math.round(BREED * 0.028)}px rgba(43,29,22,.22);
  }
  .pil .groot { font-size: ${Math.round(BREED * 0.062)}px; font-weight: 900; letter-spacing: -0.02em }
  .pil .klein { margin-top: ${Math.round(HOOG * 0.004)}px; font-size: ${Math.round(BREED * 0.028)}px; color: #6b4a37 }
  .voet {
    margin-top: ${Math.round(HOOG * 0.02)}px;
    font-size: ${Math.round(BREED * 0.031)}px; font-weight: 700; color: #7a3a1e;
    text-wrap: balance;
  }
  /* Het vak is zo hoog als de kaart, niet andersom: een vaste hoogte laat
     ofwel een rand leeg ofwel de kaart uitrekken, en allebei zien er uit als
     een fout. Wat overblijft is oranje, en dat hoort daar. */
  .vak {
    flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center;
    padding: 0 ${pad}px ${pad}px;
  }
  .screen {
    width: 100%; max-height: 100%;
    border-radius: ${Math.round(BREED * 0.052)}px; overflow: hidden;
    box-shadow: 0 ${Math.round(BREED * 0.02)}px ${Math.round(BREED * 0.06)}px rgba(43,29,22,.32);
    background: #fffaf3;
  }
  .screen img { display: block; width: 100% }
</style>
<div class="kop">
  <div class="kicker">${VLAG(Math.round(BREED * 0.062))}<span>${ontsnap(b.kicker)}</span></div>
  <h1>${ontsnap(b.titel)}</h1>
  <div class="pil">
    <div class="groot">${ontsnap(b.prijs)}</div>
    <div class="klein">${ontsnap(b.eenmalig)}</div>
  </div>
  <div class="voet">${ontsnap(b.voet)}</div>
</div>
<div class="vak"><div class="screen"><img src="data:image/png;base64,${capture}"></div></div>`
}

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()

/* De woorden komen uit de app, niet uit dit bestand. */
const { STRINGS } = await server.ssrLoadModule('/src/i18n/index.ts')
const { EBOOK } = await server.ssrLoadModule('/src/engine/billing.ts')
const t = STRINGS[TAAL]
if (!t) throw new Error(`Onbekende taal: ${TAAL}`)
const koop = t.unlock.boek.koop(EBOOK.list)
const BOEK = {
  kicker: t.unlock.boek.titel,
  titel: kern(t.unlock.boek.sub),
  prijs: EBOOK.list,
  /** "eenmalig", "une seule fois", "einmalig" — wat er in de app achter de prijs staat. */
  eenmalig: koop.split(/\s—\s/).pop().replace(EBOOK.list, '').trim(),
  voet: kern(t.unlock.boek.bijJaar),
}

const browser = await startChroom()
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

const geschreven = []

if (SOORT === 'beide' || SOORT === 'abonnement') {
  /**
   * Apple wil op de review-opname zien waar het abonnement wordt aangeboden,
   * dus de twee keuzeblokken met de prijs moeten erop staan. Die staan onder
   * de vouw, vandaar dat we er eerst heen scrollen.
   */
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)
  await page.mouse.move(215, 500)
  await page.mouse.wheel(0, 640)
  await page.waitForTimeout(800)
  const uit = path.join(UIT, `abonnement-${TAAL}-1290x2796.png`)
  await page.screenshot({ path: uit })
  geschreven.push(uit)
}

if (SOORT === 'beide' || SOORT === 'boek') {
  /**
   * Naar de boekkaart toe in plaats van een vast aantal pixels: de tekst
   * erboven verandert mee met de prijzen, en dan klopt een getal niet meer.
   * Een stukje eronder blijven, zodat de kop van de kaart niet tegen de
   * bovenrand plakt.
   */
  /**
   * De kaart zelf, niet het scherm eromheen.
   *
   * Het e-boek staat onderaan `/volledig`, dus er valt niet genoeg te scrollen
   * om hem bovenaan te krijgen — de pagina is op en houdt op. En het hoeft
   * ook niet: dit plaatje gaat over één product, dus dan staat dat product
   * erop en verder niets. Playwright fotografeert een element net zo scherp
   * als een scherm, met dezelfde driedubbele pixeldichtheid.
   */
  const kaart = page.locator('[data-boekkaart]')
  if (!(await kaart.count())) throw new Error('geen [data-boekkaart] op /volledig — staat de kaart er nog?')
  await kaart.scrollIntoViewIfNeeded()
  // De balken boven- en onderin staan vast op hun plek en liggen dus óver de
  // kaart heen; in een opname van alleen de kaart hebben ze niets te zoeken.
  const balkenWeg = await page.addStyleTag({ content: 'nav { display: none !important }' })
  await page.waitForTimeout(400)
  const capture = (await kaart.screenshot()).toString('base64')
  await balkenWeg.evaluate((el) => el.remove())

  /**
   * Het kader wordt op ware grootte getekend, dus zonder de driedubbele
   * pixeldichtheid van de telefoon — anders komt er 3870 x 8388 uit en keurt
   * App Store Connect hem af op formaat.
   */
  const kaderCtx = await browser.newContext({
    viewport: { width: BREED, height: HOOG },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const kader = await kaderCtx.newPage()
  await kader.setContent(boekFrame(capture, BOEK), { waitUntil: 'load' })
  await kader.waitForTimeout(300)
  const uit = path.join(UIT, `ebook-${TAAL}-1290x2796.png`)
  await kader.screenshot({ path: uit })
  await kaderCtx.close()
  geschreven.push(uit)
}

if (!geschreven.length) throw new Error(`onbekende --soort: ${SOORT} (abonnement, boek of beide)`)
for (const uit of geschreven) console.log('geschreven:', uit)

await browser.close()
await server.close()
