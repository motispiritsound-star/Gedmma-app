/**
 * Zet een verhaal om in een luister-mee-boek.
 *
 * Niet om te lezen: om samen te horen. Elke regel staat er vier keer — het
 * Arabische schrift, de klank in Latijnse letters zodat een ouder het kán
 * voorlezen, de betekenis in zijn eigen taal, en het nummer van het spoor dat
 * de stem laat horen. De ouder leest niet vóór, hij luistert mee.
 *
 * Dit is voorlopig een proef van de vórm, met de verhalen die al in de app
 * staan. De reeks die verkocht gaat worden krijgt eigen verhalen (Jha, de
 * zeven steden) en eigen opnames; zie docs/WINKEL.md §2.
 *
 * Run with:
 *   node scripts/make-verhaalboek.mjs
 *   node scripts/make-verhaalboek.mjs --verhaal jedda --taal fr
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const TAAL = arg('taal', 'nl')
const WELK = arg('verhaal')
const UIT = arg('uit', path.join(ROOT, 'store', 'verhaalboek', `luister-mee-${TAAL}.pdf`))

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ STORIES }, { storyLine, storyIntro, storyTitle }] = await Promise.all([
  server.ssrLoadModule('/src/content/stories.ts'),
  server.ssrLoadModule('/src/content/localise.ts').catch(() => ({})),
])

/** De vertaling van een regel; buiten het Nederlands valt hij terug op wat er is. */
const betekenis = (regel) => (TAAL === 'nl' ? regel.nl : (storyLine?.(regel, TAAL) ?? regel.nl))
const titel = (v) => (TAAL === 'nl' ? v.title : (storyTitle?.(v, TAAL) ?? v.title))
const inleiding = (v) => (TAAL === 'nl' ? v.intro : (storyIntro?.(v, TAAL) ?? v.intro))

const verhalen = WELK ? STORIES.filter((v) => v.id === WELK) : STORIES
if (!verhalen.length) throw new Error(`geen verhaal met id ${WELK}`)

const [balo800, balo600, naskh] = await Promise.all([
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2')),
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-600.woff2')),
  readFile(path.join(ROOT, 'public', 'fonts', 'noto-naskh-arabic-700.woff2')),
]).then((b) => b.map((x) => x.toString('base64')))

/** Doorlopende spoornummers over het hele boek, zoals op de achterkant van een cd. */
let spoor = 0

const regelBlok = (regel) => {
  spoor += 1
  return `<div class="regel">
    <div class="spoor">${spoor}</div>
    <div class="tekst">
      <div class="wie">${esc(regel.speaker)}</div>
      <div class="ar">${esc(regel.ar)}</div>
      <div class="tr">${esc(regel.tr)}</div>
      <div class="nl">${esc(betekenis(regel))}</div>
    </div>
  </div>`
}

const verhaalBlad = (v) => `<section class="verhaal">
  <div class="kop">
    <div class="emoji">${v.emoji ?? '📖'}</div>
    <h2>${esc(titel(v))}</h2>
    <p class="inleiding">${esc(inleiding(v))}</p>
    <p class="hoe">Speel het spoor, luister, en zeg het daarna samen na.</p>
  </div>
  ${v.lines.map(regelBlok).join('')}
</section>`

const html = `<!doctype html><html lang="${TAAL}"><meta charset="utf-8">
<style>
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo800}) format('woff2');font-weight:800}
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo600}) format('woff2');font-weight:600}
  @font-face{font-family:'Naskh';src:url(data:font/woff2;base64,${naskh}) format('woff2');font-weight:700}
  @page{size:A5;margin:14mm 13mm 16mm}
  *{margin:0;box-sizing:border-box}
  body{font-family:'Baloo 2',system-ui,sans-serif;font-weight:600;color:#2b1d16;background:#fffaf3}
  /* A5 is 210mm hoog; hier gaan de marges van @page nog af. Zet hem te hoog
     en de titelpagina duwt een lege bladzijde voor zich uit. */
  .titelblad{height:178mm;display:flex;flex-direction:column;align-items:center;justify-content:center;
             text-align:center;gap:10mm}
  .titelblad h1{font-size:34pt;font-weight:800;line-height:1.05;letter-spacing:-.01em}
  .titelblad .onder{font-size:13pt;opacity:.75;max-width:75mm;line-height:1.4}
  .titelblad .merk{margin-top:6mm;font-size:11pt;font-weight:800;opacity:.6}
  .verhaal{page-break-before:always}
  .kop{margin-bottom:9mm;padding-bottom:5mm;border-bottom:2px solid rgba(43,29,22,.12)}
  .kop .emoji{font-size:22pt;line-height:1}
  .kop h2{font-size:20pt;font-weight:800;margin-top:2mm}
  .inleiding{margin-top:2mm;font-size:10.5pt;opacity:.8;line-height:1.45}
  .hoe{margin-top:3mm;font-size:9pt;opacity:.55;font-style:italic}
  .regel{display:flex;gap:5mm;padding:4.5mm 0;border-bottom:1px solid rgba(43,29,22,.07);
         page-break-inside:avoid}
  .spoor{flex:0 0 9mm;height:9mm;border-radius:50%;background:#f59e0b;color:#2b1d16;
         font-size:10pt;font-weight:800;display:flex;align-items:center;justify-content:center}
  .tekst{flex:1 1 auto;min-width:0}
  .wie{font-size:8.5pt;font-weight:800;text-transform:uppercase;letter-spacing:.07em;
       color:#0d9488;margin-bottom:1.5mm}
  .ar{font-family:'Naskh',serif;font-weight:700;direction:rtl;text-align:right;
      font-size:20pt;line-height:1.7}
  .tr{margin-top:1mm;font-size:11.5pt;font-weight:800;color:#b45309}
  .nl{margin-top:1mm;font-size:10.5pt;opacity:.78}
  .slot{page-break-before:always;padding-top:20mm;text-align:center}
  .slot h2{font-size:16pt;font-weight:800}
  .slot p{margin-top:4mm;font-size:10.5pt;opacity:.78;line-height:1.5}
</style>
<body>
<div class="titelblad">
  <div style="font-size:40pt">🫖</div>
  <h1>Luister mee</h1>
  <p class="onder">Marokkaanse verhalen om samen te horen. Het schrift, de klank, de betekenis — en de stem die voorleest.</p>
  <div class="merk">Darijaforkids</div>
</div>
${verhalen.map(verhaalBlad).join('\n')}
<section class="slot">
  <h2>Hoe je dit boek gebruikt</h2>
  <p>Bij elke regel staat een nummer. Speel dat spoor, luister samen, en zeg het daarna na. Het schrift hoeft je kind nog niet te kunnen lezen — het hoort het eerst, en herkent het daarna.</p>
  <p>De opnames horen bij dit boek en staan in de app.</p>
  <p>darijaforkids.eu</p>
</section>
</body></html>`

await mkdir(path.dirname(UIT), { recursive: true })
const tijdelijk = path.join(tmpdir(), `.verhaalboek-${TAAL}.html`)
await writeFile(tijdelijk, html)

const browser = await startChroom()
const blad = await browser.newPage()
await blad.goto(`file://${tijdelijk}`, { waitUntil: 'networkidle' })
await blad.emulateMedia({ media: 'print' })
await blad.pdf({
  path: UIT, format: 'A5', printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="width:100%;font-size:7px;color:#8b8075;text-align:center;font-family:sans-serif">Darijaforkids &middot; <span class="pageNumber"></span></div>',
  margin: { top: '14mm', bottom: '16mm', left: '13mm', right: '13mm' },
})
await browser.close()
await server.close()

const grootte = (await readFile(UIT)).length
console.log(`\n${path.relative(ROOT, UIT)} — ${verhalen.length} verhalen, ${spoor} sporen, ${(grootte / 1e6).toFixed(1)} MB\n`)
