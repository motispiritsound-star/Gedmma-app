/**
 * De plaat bij één deel: het geschilderde tafereel met de titel erop.
 *
 * Adil maakte er vijf met de hand voor De sleutels van Marokko — een wijd
 * beeld van 1600 × 900 met linksboven een kaartje: de reeksnaam klein
 * erboven, de titel groot, en onderin het deelnummer met de plaats erachter.
 * Dit script doet hetzelfde voor Sba de Atlasleeuw, waar alle twaalf delen al
 * een geschilderd tafereel hebben liggen.
 *
 * Waarom niet met de hand: twaalf delen × zes talen is tweeënzeventig platen,
 * en elke keer dat een titel verandert mogen ze allemaal opnieuw. Een tekening
 * teken je één keer; de tekst erop hoort uit de inhoud te komen.
 *
 * Draaien met:
 *   node scripts/make-deelplaat.mjs                  # alle twaalf, Nederlands
 *   node scripts/make-deelplaat.mjs --deel 3
 *   node scripts/make-deelplaat.mjs --taal fr
 *   node scripts/make-deelplaat.mjs --taal alles
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'
import ffmpeg from 'ffmpeg-static'
import { H } from './lib/historie.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PLATEN = path.join(ROOT, 'store', 'prentenboek', 'platen')
const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const ALLEEN = arg('deel') ? Number(arg('deel')) : null
const GEVRAAGD = arg('taal', 'nl')
const TALEN = GEVRAAGD === 'alles' ? ['nl', 'fr', 'de', 'es', 'it', 'en'] : [GEVRAAGD]

/* ------------------------------------------------------------------ laden */

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ DELEN }, { deelIn }, { SITE }] = await Promise.all([
  server.ssrLoadModule('/src/content/prentenboek.ts'),
  server.ssrLoadModule('/src/content/prentenboek-talen.ts'),
  server.ssrLoadModule('/src/site/copy.ts'),
])
await server.close()

const [balo800, balo600] = await Promise.all([
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2')),
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-600.woff2')),
]).then((b) => b.map((x) => x.toString('base64')))

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* ------------------------------------------------------------------ zetten */

/** Het woord "deel" in de zes talen; kort genoeg om in een pil te passen. */
const DEELWOORD = { nl: 'DEEL', fr: 'PARTIE', de: 'TEIL', es: 'PARTE', it: 'PARTE', en: 'PART' }

const blad = (deel, taal, achtergrond) => {
  const reeks = SITE[taal]?.boekKleinTitel ?? 'Sba de Atlasleeuw'
  return `<!doctype html><html lang="${taal}"><meta charset="utf-8"><style>
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo800}) format('woff2');font-weight:800}
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo600}) format('woff2');font-weight:600}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1600px;height:900px;overflow:hidden;position:relative;font-family:'Baloo 2',system-ui,sans-serif}
  .tafereel{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  /* Een kaartje op de plaat in plaats van tekst erop: een geschilderd tafereel
     heeft overal detail, en tekst die daar los overheen ligt wordt op de helft
     van de platen onleesbaar. */
  .kaart{position:absolute;left:64px;top:44px;max-width:700px;
    background:#f2ece0;border-radius:26px;padding:34px 44px 30px 46px;
    border-left:16px solid ${H.groen};border-top:6px solid ${H.goud};
    box-shadow:0 26px 60px -24px rgb(0 0 0 / 55%)}
  .reeks{font-weight:800;font-size:25px;letter-spacing:.04em;text-transform:uppercase;color:${H.inkt};opacity:.88}
  .titel{font-weight:800;font-size:76px;line-height:1.02;color:${H.inkt};margin:14px 0 22px;letter-spacing:-.015em}
  .voet{display:flex;align-items:center;gap:26px}
  .pil{background:${H.groen};color:#fff;font-weight:800;font-size:25px;letter-spacing:.09em;
    padding:9px 30px;border-radius:999px}
  .waar{font-weight:600;font-size:31px;color:${H.inkt};opacity:.82;text-transform:uppercase;letter-spacing:.02em}
  </style>
  <img class="tafereel" src="${achtergrond}" alt="">
  <div class="kaart">
    <div class="reeks">${esc(reeks)}</div>
    <div class="titel">${esc(deel.titel)}</div>
    <div class="voet">
      <span class="pil">${esc(DEELWOORD[taal] ?? DEELWOORD.nl)} ${deel.nummer}</span>
      <span class="waar">${esc(deel.waar ?? '')}</span>
    </div>
  </div>
  </html>`
}

/* ------------------------------------------------------------------ maken */

const browser = await startChroom()
let gemaakt = 0

for (const taal of TALEN) {
  const uit = path.join(ROOT, 'site-assets', 'sba', taal === 'nl' ? '' : taal)
  await mkdir(uit, { recursive: true })

  for (const nl of DELEN) {
    if (ALLEEN && nl.nummer !== ALLEEN) continue
    const tafereel = path.join(PLATEN, String(nl.nummer), 'achtergrond.jpg')
    if (!existsSync(tafereel)) {
      console.log(`deel ${nl.nummer}: geen geschilderd tafereel, overgeslagen`)
      continue
    }
    const deel = taal === 'nl' ? nl : deelIn(taal, nl.nummer)

    /**
     * De html naar een bestand, niet via `setContent`.
     *
     * Een bladzijde die met `setContent` is gevuld heet `about:blank`, en
     * Chromium laat zo'n bladzijde geen `file://`-beeld inladen. Je krijgt dan
     * het kaartje netjes op een wit vlak: alle tekst goed, en het geschilderde
     * tafereel weg.
     */
    const htmlPad = path.join(tmpdir(), `.deelplaat-${taal}-${nl.nummer}.html`)
    await writeFile(htmlPad, blad(deel, taal, pathToFileURL(tafereel).href), 'utf8')

    const bladzijde = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
    await bladzijde.goto(pathToFileURL(htmlPad).href, { waitUntil: 'networkidle' })
    const png = path.join(uit, `deel-${String(nl.nummer).padStart(2, '0')}.png`)
    await bladzijde.screenshot({ path: png })
    await bladzijde.close()
    await rm(htmlPad, { force: true })

    execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', png,
      '-c:v', 'libwebp', '-quality', '86', '-compression_level', '6', '-preset', 'picture',
      png.replace(/\.png$/, '.webp')])
    await rm(png)
    gemaakt += 1
    console.log(`${taal}  deel ${String(nl.nummer).padStart(2, ' ')} — ${deel.titel}`)
  }
}

await browser.close()
console.log(`\n${gemaakt} platen in site-assets/sba/\n`)
