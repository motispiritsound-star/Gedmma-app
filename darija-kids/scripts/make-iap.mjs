/**
 * Draws the promotional image for each in-app purchase.
 *
 * Apple wees versie 1.0 (build 5) hierop af. Hun eigen tekst:
 *
 *   "Each promoted in-app purchase requires a unique promotional image.
 *    Promotional images should not be screenshots, and should not be confused
 *    with your app icon. [...] PNG or high-quality JPEG at 1024 x 1024 pixels.
 *    [...] avoid putting important details in the lower left corner [...] we
 *    recommend that you don't overlay text."
 *
 * Wat er stond was bij alle drie de aankopen **het app-icoon**. Het veld heet
 * in App Store Connect "Image (Optional)" en zit boven *App Store Promotion*;
 * Apples zin "should not be confused with your app icon" was dus letterlijk
 * bedoeld, en "unique" ook: drie keer hetzelfde beeld is geen drie.
 *
 * Dit script maakt er drie die aan alle vier de eisen voldoen:
 *
 * 1. 1024×1024, PNG                    → de maat hieronder, nagemeten met file
 * 2. geen schermafdruk                 → getekend, niets uit de app gekopieerd
 * 3. niet te verwarren met het icoon    → het icoon is de ster op een donker
 *    vierkant, en dat stond er. Deze drie hebben Fnek als onderwerp, elk in
 *    een andere compositie op een andere achtergrond
 * 4. uniek per aankoop                  → jaar, maand en e-boek zijn elk anders
 *
 * Geen tekst erin. Dat is niet alleen Apples aanbeveling: een promotieafbeelding
 * met een prijs erin klopt niet meer zodra de winkel in een ander land een ander
 * bedrag laat zien, en een promotieafbeelding met een woord erin moet in zes
 * talen opnieuw. Linksonder blijft leeg, want daar zet Apple zelf de prijs.
 *
 * Draai met: npm run iapbeeld
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'store', 'iap-beelden')
const MAAT = 1024

/**
 * Fnek gezet op zijn zichtbare midden in plaats van op de hoek van zijn kader.
 * Zijn vorm loopt in een vak van 120 van y 8 tot 93, dus zijn midden ligt op
 * (60, 50.5) en niet op (60, 60). Zonder dit hangt hij in elk beeld te hoog —
 * dat was in de eerste versie van deze drie ook zo.
 */
const fnekOp = (cx, cy, maat) =>
  `<g transform="translate(${(cx - (60 * maat) / 120).toFixed(1)},${(cy - (50.5 * maat) / 120).toFixed(1)})">`
  + `${fnekVorm(maat)}</g>`

/** Een veld van flauwe zellige-sterren, zodat een vlakke achtergrond leeft. */
const veld = (stap, kleur) => {
  const uit = []
  for (let y = -stap; y < 1024 + stap; y += stap) {
    for (let x = -stap; x < 1024 + stap; x += stap) uit.push(ster(x, y, stap * 0.26, kleur))
  }
  return uit.join('')
}

/** De achtpuntige khatam van Marokkaanse zellige, dezelfde als in het icoon. */
const ster = (cx, cy, r, vulling, hoek = 0) => {
  const punten = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 8 + hoek
    const rad = i % 2 === 0 ? r : r * 0.42
    return `${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`
  })
  return `<polygon points="${punten.join(' ')}" fill="${vulling}" />`
}

/**
 * Fnek de fennek, hetzelfde gezicht als in de app — als losse vorm, want hij
 * wordt hieronder in een groter doek gezet en heeft dus geen eigen <svg> nodig.
 */
const fnekVorm = (maat) => `
<g transform="scale(${(maat / 120).toFixed(4)})">
  <path d="M30 44C22 22 26 8 34 10c8 2 14 16 16 28z" fill="url(#vacht)"/>
  <path d="M34 40c-5-14-3-22 0-21 4 1 8 11 9 20z" fill="#ffd8b1"/>
  <path d="M90 44c8-22 4-36-4-34-8 2-14 16-16 28z" fill="url(#vacht)"/>
  <path d="M86 40c5-14 3-22 0-21-4 1-8 11-9 20z" fill="#ffd8b1"/>
  <ellipse cx="60" cy="62" rx="34" ry="31" fill="url(#vacht)"/>
  <ellipse cx="60" cy="70" rx="23" ry="19" fill="#fff3e2"/>
  <path d="M39 54c3-5 9-5 12 0" stroke="#2b1d16" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M69 54c3-5 9-5 12 0" stroke="#2b1d16" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="63" rx="5" ry="3.8" fill="#2b1d16"/>
  <path d="M50 69c4 7 16 7 20 0" stroke="#2b1d16" stroke-width="3.2" fill="none" stroke-linecap="round"/>
</g>`

const goud = `<linearGradient id="goud" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0%" stop-color="#ffd166"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#e2603c"/>
</linearGradient>`

/**
 * De omhulling. De compositie staat iets boven het midden en naar rechts, zodat
 * linksonder leeg blijft — daar zet Apple de prijs over het beeld heen.
 */
const doek = (achtergrond, binnen) => `<!doctype html><meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box }
  body { width: ${MAAT}px; height: ${MAAT}px; overflow: hidden; position: relative; background: ${achtergrond} }
</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${MAAT}" height="${MAAT}" viewBox="0 0 ${MAAT} ${MAAT}"
     style="position:absolute;inset:0">
  <defs>
    ${goud}
    <linearGradient id="vacht" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7c873"/><stop offset="100%" stop-color="#e2984a"/>
    </linearGradient>
  </defs>
  ${binnen}
</svg>`

const NACHT = 'radial-gradient(circle at 58% 42%, #24305a, #131b30 62%, #0a0e1c)'
const WARM = 'radial-gradient(circle at 58% 42%, #ffdca6, #f0915c 58%, #d8512f)'
const DIEP = 'radial-gradient(circle at 58% 42%, #1a6f6a, #0f4b4d 60%, #07282c)'

/**
 * Het jaarabonnement: Fnek in een gouden medaillon, met twaalf zellige-sterren
 * eromheen — één per maand van het jaar dat je vooruit betaalt.
 *
 * Waarom niet de ster zelf, zoals hier eerst stond: het icoon ís die ster op
 * een donker vlak. Een promotieafbeelding die daar alleen een ring omheen zet
 * is "confused with your app icon", en dat is precies wat Apple noemt. Fnek is
 * het gezicht uit de app en van het icoon te onderscheiden.
 */
const jaar = () => {
  const ring = Array.from({ length: 12 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 12 - Math.PI / 2
    return ster(560 + Math.cos(a) * 342, 430 + Math.sin(a) * 342, 40, 'rgba(255,209,102,.62)', a)
  }).join('')
  return doek(NACHT, `
    ${ring}
    <circle cx="560" cy="430" r="252" fill="url(#goud)"/>
    <circle cx="560" cy="430" r="228" fill="#16203c"/>
    ${fnekOp(560, 430, 568)}`)
}

/**
 * Het maandabonnement: Fnek van dichtbij, tot buiten de rand, op warm.
 *
 * Bewust een ander soort beeld dan het jaarabonnement. Die twee staan in de
 * winkel onder elkaar, en twee keer hetzelfde gezicht in een rondje is dan
 * geen "unique promotional image" maar dezelfde plaat in een andere kleur.
 */
const maand = () => doek(WARM, `
  ${veld(186, 'rgba(255,255,255,.12)')}
  ${fnekOp(552, 452, 1010)}`)

/** Het e-boek: een open boek, met Fnek die over de bovenrand meekijkt. */
const boek = () => doek(DIEP, `
  <g transform="translate(0,16)">
    ${fnekOp(560, 230, 360)}
    <path d="M150 300 Q560 236 970 300 L970 742 Q560 678 150 742 Z" fill="#fffaf3"/>
    <path d="M150 300 Q560 236 560 262 L560 706 Q560 678 150 742 Z" fill="#f3e6d2"/>
    <path d="M556 258 L564 258 L564 708 L556 708 Z" fill="#d8c6ad"/>
    ${Array.from({ length: 7 }, (_, i) =>
      `<rect x="212" y="${372 + i * 46}" width="${300 - (i % 3) * 52}" height="13" rx="6" fill="#d8c6ad"/>`).join('')}
    ${Array.from({ length: 7 }, (_, i) =>
      `<rect x="${628 + (i % 3) * 52}" y="${372 + i * 46}" width="${300 - (i % 3) * 52}" height="13" rx="6" fill="#e4d6be"/>`).join('')}
  </g>`)

/** De drie aankopen, met de id zoals hij in App Store Connect staat. */
const BEELDEN = [
  ['app.darijaforkids.yearly', jaar, 'jaarabonnement — Fnek in een medaillon met twaalf sterren eromheen'],
  ['app.darijaforkids.monthly', maand, 'maandabonnement — Fnek alleen, groot, op warm'],
  ['app.darijaforkids.ebook', boek, 'e-boek — een open boek met Fnek die over de rand meekijkt'],
]

await mkdir(OUT, { recursive: true })
const browser = await startChroom()
const page = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage()
await page.setViewportSize({ width: MAAT, height: MAAT })

const gemaakt = []
for (const [id, teken, wat] of BEELDEN) {
  await page.setContent(teken())
  await page.waitForTimeout(140)
  const bestand = path.join(OUT, `${id}.png`)
  await page.screenshot({ path: bestand })
  gemaakt.push([id, wat])
  console.log(`${path.relative(ROOT, bestand).split(path.sep).join('/')}  ${MAAT}×${MAAT}  ${wat}`)
}
await browser.close()

await writeFile(
  path.join(OUT, 'README.md'),
  `# Promotieafbeeldingen voor de aankopen\n\nGemaakt met \`npm run iapbeeld\`. Niet met de hand bijwerken.\n\n`
    + `Apple wees versie 1.0 (build 5) af omdat bij alle drie de aankopen het\n`
    + `app-icoon in dit veld stond. Het heet in App Store Connect "Image\n`
    + `(Optional)" en zit boven *App Store Promotion*.\n\n`
    + `> Each promoted in-app purchase requires a unique promotional image.\n`
    + `> Promotional images should not be screenshots, and should not be confused\n`
    + `> with your app icon. [...] PNG or high-quality JPEG at 1024 x 1024 pixels.\n`
    + `> [...] avoid putting important details in the lower left corner [...] we\n`
    + `> recommend that you don't overlay text.\n\n`
    + gemaakt.map(([id, wat]) => `- \`${id}.png\` — ${wat}\n`).join('')
    + `\nGeen tekst erin, in geen van de drie: Apple raadt het af, en een prijs of\n`
    + `een woord in het beeld klopt niet meer in een ander land of een andere taal.\n`
    + `Linksonder is leeg gehouden, want daar legt Apple de prijs over het beeld.\n\n`
    + `## Uploaden\n\nApp Store Connect → Monetization → In-App Purchases → de aankoop\n`
    + `→ Promotional Image. Eén beeld per aankoop, en de naam van het bestand is de\n`
    + `product-id, zodat er geen twee verwisseld kunnen worden.\n`,
)
console.log(`\n${gemaakt.length} beelden in store/iap-beelden/`)
