/**
 * Een plaat bij een weetje, in de letters en de kleuren van de app.
 *
 * Het kanaal post elke donderdag een weetje -- `docs/LANCERING.md` §15 -- en
 * een weetje zonder beeld scrollt voorbij. Dit maakt er een plaat bij: 1080
 * bij 1350, de maat die in WhatsApp, op Instagram en in een familiegroep
 * allemaal heel in beeld komt.
 *
 * Waarom een script en niet één plaatje: er komt er elke week een. Iets wat
 * je elke week met de hand doet, doe je drie weken.
 *
 * Draaien:
 *   node scripts/make-weetje.mjs --kop "Die 3 is geen cijfer" --groot "3" \
 *     --regel "In 3afak, ma3lish en ssalamu 3alaykum" \
 *     --regel "staat de 3 voor de Arabische letter ع" \
 *     --voet "44 woorden in Darijaforkids schrijven hem zo"
 *
 * `--groot` is optioneel en zet één teken groot in beeld. `--regel` mag zo
 * vaak als je wil; elke regel komt onder de vorige. `--naam` bepaalt de
 * bestandsnaam.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'store', 'weetjes')

const args = process.argv.slice(2)
const arg = (naam, terug = '') => {
  // `>= 0`, niet `> 0`: de vlag die je als eerste typt staat op plek nul, en
  // die werd met `> 0` stilletjes genegeerd. Gevonden doordat --naam vooraan
  // stond en het bestand alsnog weetje.png heette.
  const i = args.indexOf(`--${naam}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : terug
}
/** Alle waarden van een vlag die vaker mag voorkomen. */
const alle = (naam) =>
  args.flatMap((a, i) => (a === `--${naam}` && args[i + 1] ? [args[i + 1]] : []))

const kop = arg('kop', 'Wist je dat')
const groot = arg('groot')
const regels = alle('regel')
const voet = arg('voet')
const naam = arg('naam', 'weetje')

/**
 * De letters als data in de pagina.
 *
 * Een plaat die zijn lettertype bij een server ophaalt, is een plaat die er
 * anders uitziet als die server er niet is. Zie `make-social.mjs`, waar
 * dezelfde reden staat.
 */
const letter = async (bestand) =>
  `data:font/woff2;base64,${(await readFile(path.join(ROOT, 'public', 'fonts', bestand))).toString('base64')}`

const baloo = await letter('baloo2-800.woff2')
const naskh = await letter('noto-naskh-arabic-700.woff2')

/* De kleuren komen uit src/index.css en staan hier één keer overgeschreven;
   een plaat die niet op de app lijkt is reclame voor iets anders. */
const NACHT = '#0d1220'
const SAFFRAAN = '#f59e0b'
const ZELLIGE = '#0f766e'

/**
 * Het stermotief van de vlag, zoals `ui/Khatim.tsx` hem tekent.
 *
 * En net als daar: **één lijn, geen vulling.** De khatim op de Marokkaanse
 * vlag is één doorlopende streep die zichzelf vijf keer kruist -- een zegel,
 * geen sticker. Vul je hem, dan is het een ster zoals op elke beloningskaart
 * en leest hij niet meer als Marokkaans. De eerste versie van deze plaat had
 * hem gevuld en zag er daardoor uit als iets anders.
 */
const STER = 'M50 2 L78.5 89.7 L3.8 35.5 L96.2 35.5 L21.5 89.7 Z'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: Baloo; src: url(${baloo}) format('woff2'); font-weight: 800 }
  @font-face { font-family: Naskh; src: url(${naskh}) format('woff2'); font-weight: 700 }
  * { margin: 0; padding: 0; box-sizing: border-box }
  body {
    width: 1080px; height: 1350px; background: ${NACHT};
    font-family: Baloo, sans-serif; color: #fff; overflow: hidden;
    display: flex; flex-direction: column; justify-content: center;
    padding: 96px 88px; position: relative;
  }
  /* Hetzelfde sterrenveld als op de slotkaart van de film: het merk is het
     patroon, niet een logo in een hoek. */
  .veld { position: absolute; inset: 0; opacity: .12 }
  .kop { font-size: 76px; line-height: 1.08; color: ${SAFFRAAN}; margin-bottom: 44px }
  .groot {
    font-size: 300px; line-height: 1; color: #fff; margin: 0 0 36px;
    text-shadow: 0 0 80px rgba(245,158,11,.45);
  }
  .regels { font-size: 46px; line-height: 1.42; font-weight: 600 }
  .regels p + p { margin-top: 10px }
  .voet {
    margin-top: 56px; padding-top: 32px; border-top: 3px solid rgba(255,255,255,.14);
    font-size: 34px; color: #cbd5e1; line-height: 1.35;
  }
  .merk {
    position: absolute; left: 88px; right: 88px; bottom: 72px;
    display: flex; align-items: center; gap: 18px; font-size: 32px; color: ${SAFFRAAN};
  }
</style>
<svg class="veld" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs><pattern id="p" width="180" height="180" patternUnits="userSpaceOnUse">
    <path d="${STER}" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" transform="translate(40 40)"/>
  </pattern></defs>
  <rect width="1080" height="1350" fill="url(#p)"/>
</svg>
<div class="kop">${esc(kop)}</div>
${groot ? `<div class="groot">${esc(groot)}</div>` : ''}
<div class="regels">${regels.map((r) => `<p>${esc(r)}</p>`).join('')}</div>
${voet ? `<div class="voet">${esc(voet)}</div>` : ''}
<div class="merk">
  <svg width="38" height="38" viewBox="0 0 100 100"><path d="${STER}" fill="none" stroke="${SAFFRAAN}" stroke-width="7" stroke-linejoin="round"/></svg>
  <span>Darijaforkids</span>
  <span style="margin-inline-start:auto;color:${ZELLIGE};font-family:Naskh">دارجة</span>
</div>
`

const browser = await startChroom()
const page = await browser.newPage()
await page.setViewportSize({ width: 1080, height: 1350 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await mkdir(UIT, { recursive: true })
const uit = path.join(UIT, `${naam}.png`)
await page.screenshot({ path: uit })
await browser.close()

console.log(`\n${path.relative(ROOT, uit)}\n`)
