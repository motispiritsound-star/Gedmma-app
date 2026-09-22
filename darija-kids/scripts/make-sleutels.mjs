/**
 * Zet De sleutels van Marokko: een deel, of de hele reeks in één overzicht.
 *
 * Een leesboek is geen prentenboek: hier doet de tekst het werk, en de opmaak
 * hoort onzichtbaar te zijn. Vandaar A5 staand, een schreefletter voor het
 * lopende verhaal, ruime regelafstand en hoofdstukken die op een nieuwe
 * bladzijde beginnen — de vorm waarin een kind van elf uren achter elkaar
 * leest zonder het te merken.
 *
 * Achterin staat "Wat hiervan is echt gebeurd". Dat is geen bijlage maar het
 * beste deel van het boek, en het staat er daarom volledig in: wat waar is,
 * en wat verzonnen is, met zoveel woorden.
 *
 * Run with:
 *   node scripts/make-sleutels.mjs --deel 1
 *   node scripts/make-sleutels.mjs --opzet
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const OPZET = process.argv.includes('--opzet')
const NUMMER = Number(arg('deel', '1'))
const UIT = path.join(ROOT, 'store', 'sleutels', OPZET ? 'de-reeks.pdf' : `sleutels-${NUMMER}.pdf`)

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
/** *schuin* wordt schuin. Meer opmaak heeft een roman niet nodig. */
const rijk = (t) => esc(t).replace(/\*([^*]+)\*/g, '<em>$1</em>')

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ REEKS, DISCLAIMER }, ...delen] = await Promise.all([
  server.ssrLoadModule('/src/content/sleutels.ts'),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => server.ssrLoadModule(`/src/content/sleutels-deel${n}.ts`)),
])
await server.close()

/** Welk deel is al geschreven. Een deel dat er niet is, krijgt alleen zijn opzet. */
const HOOFDSTUKKEN = Object.fromEntries(
  delen.map((mod, i) => [i + 1, mod[`DEEL${i + 1}_HOOFDSTUKKEN`]]),
)

const [balo800, balo600] = await Promise.all([
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2')),
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-600.woff2')),
]).then((b) => b.map((x) => x.toString('base64')))

const STIJL = `
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo800}) format('woff2');font-weight:800}
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo600}) format('woff2');font-weight:600}
  @page{size:A5;margin:20mm 18mm 22mm}
  *{margin:0;box-sizing:border-box}
  body{font-family:Georgia,'Times New Roman',serif;color:#241a13;font-size:11.5pt;line-height:1.62}
  p{margin:0 0 3.5mm;text-align:justify;hyphens:auto}
  p.eerste{text-indent:0}
  p + p{text-indent:5mm;margin-top:-1mm}
  em{font-style:italic}
  h1,h2,h3{font-family:'Baloo 2',system-ui,sans-serif;font-weight:800;line-height:1.1}
  .titelblad{height:245mm;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:6mm;page-break-after:always}
  .titelblad .reeks{font-family:'Baloo 2';font-weight:800;font-size:12pt;letter-spacing:.14em;text-transform:uppercase;color:#a9713f}
  .titelblad h1{font-size:30pt}
  .titelblad .jaar{font-size:13pt;color:#7a6a5d}
  .titelblad .waar{font-size:11pt;color:#7a6a5d;font-style:italic}
  .titelblad .nr{margin-top:14mm;font-family:'Baloo 2';font-weight:800;font-size:11pt;color:#a9713f}
  .hfd{page-break-before:always}
  .hfd .nr{font-family:'Baloo 2';font-weight:800;font-size:10pt;letter-spacing:.14em;
           text-transform:uppercase;color:#a9713f;margin-bottom:2mm}
  .hfd h2{font-size:17pt;margin-bottom:7mm}
  .achterin{page-break-before:always}
  .achterin h2{font-size:15pt;margin-bottom:5mm}
  .achterin h3{font-family:'Baloo 2';font-size:11pt;margin:6mm 0 2mm;color:#a9713f}
  .achterin li{margin-bottom:2.5mm}
  .achterin ul{padding-left:5mm}
  .let{background:#f6ecdc;border-left:3px solid #a9713f;padding:4mm 5mm;margin-bottom:5mm}
  .let p{text-indent:0;margin-bottom:2.5mm;font-size:10.5pt}
  .wacht{page-break-before:always;color:#7a6a5d;font-style:italic}
`

const achterin = (deel) => `<section class="achterin">
  <h2>Wat hiervan is echt gebeurd</h2>
  <div class="let">${DISCLAIMER.map((r) => `<p>${esc(r)}</p>`).join('')}</div>
  <h3>Dit is echt gebeurd</h3>
  <ul>${deel.echt.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
  <h3>Dit is verzonnen</h3>
  <ul>${deel.verzonnen.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
  <h3>De sleutel</h3>
  <p class="eerste">${esc(deel.sleutel)}</p>
</section>`

const deelBoek = (deel) => {
  const hfd = HOOFDSTUKKEN[deel.nummer] ?? []
  return `<!doctype html><html lang="nl"><meta charset="utf-8"><style>${STIJL}</style><body>
<section class="titelblad">
  <div class="reeks">De sleutels van Marokko</div>
  <h1>${esc(deel.titel)}</h1>
  <div class="jaar">${esc(deel.jaar)}</div>
  <div class="waar">${esc(deel.waar)}</div>
  <div class="nr">Deel ${deel.nummer} van vijftien</div>
</section>

<section class="hfd">
  <h2>Voor je begint</h2>
  <div class="let">${DISCLAIMER.map((r) => `<p>${esc(r)}</p>`).join('')}</div>
  <p class="eerste">${esc(deel.flap)}</p>
  <p style="text-indent:0;margin-top:5mm"><em>Verteld door ${esc(deel.verteller)}.</em></p>
</section>

${hfd.map((h) => `<section class="hfd">
  <div class="nr">Hoofdstuk ${h.nummer}</div>
  <h2>${esc(h.titel)}</h2>
  ${h.tekst.map((alinea, i) => `<p class="${i === 0 ? 'eerste' : ''}">${rijk(alinea)}</p>`).join('')}
</section>`).join('')}

${hfd.length ? `<section class="wacht"><p class="eerste">Hier is deel ${deel.nummer} tot nu toe geschreven. De volgende hoofdstukken volgen.</p></section>` : ''}

${achterin(deel)}
</body></html>`
}

const opzet = () => `<!doctype html><html lang="nl"><meta charset="utf-8"><style>${STIJL}</style><body>
<section class="titelblad">
  <div class="reeks">De sleutels van Marokko</div>
  <h1>Vijftien delen</h1>
  <div class="jaar">Tweeduizend jaar, één sleutel</div>
  <div class="waar">Voor lezers vanaf negen jaar</div>
</section>

<section class="hfd">
  <h2>De afspraak met de lezer</h2>
  <div class="let">${DISCLAIMER.map((r) => `<p>${esc(r)}</p>`).join('')}</div>
  <p class="eerste">Elk deel wordt verteld door iemand die er toen leefde en die ongeveer even oud is als de lezer. De sleutel gaat van deel tot deel door, van hand tot hand, tot hij in het vijftiende deel op een zolder in Nederland ligt.</p>
</section>

${REEKS.map((deel) => `<section class="hfd">
  <div class="nr">Deel ${deel.nummer} · ${esc(deel.jaar)}</div>
  <h2>${esc(deel.titel)}</h2>
  <p class="eerste">${esc(deel.flap)}</p>
  <p style="text-indent:0"><em>${esc(deel.waar)}. Verteld door ${esc(deel.verteller)}.</em></p>
  <h3 style="font-family:'Baloo 2';font-size:11pt;margin:6mm 0 2mm;color:#a9713f">Dit is echt gebeurd</h3>
  <ul style="padding-left:5mm">${deel.echt.map((r) => `<li style="margin-bottom:2.5mm">${esc(r)}</li>`).join('')}</ul>
  <h3 style="font-family:'Baloo 2';font-size:11pt;margin:6mm 0 2mm;color:#a9713f">Dit is verzonnen</h3>
  <ul style="padding-left:5mm">${deel.verzonnen.map((r) => `<li style="margin-bottom:2.5mm">${esc(r)}</li>`).join('')}</ul>
  <h3 style="font-family:'Baloo 2';font-size:11pt;margin:6mm 0 2mm;color:#a9713f">De sleutel</h3>
  <p class="eerste">${esc(deel.sleutel)}</p>
</section>`).join('')}
</body></html>`

const html = OPZET ? opzet() : deelBoek(REEKS.find((d) => d.nummer === NUMMER))
await mkdir(path.dirname(UIT), { recursive: true })
const tijdelijk = path.join(tmpdir(), `.sleutels-${OPZET ? 'opzet' : NUMMER}.html`)
await writeFile(tijdelijk, html)

const browser = await chromium.launch({ executablePath: CHROME })
const blad = await browser.newPage()
await blad.goto(`file://${tijdelijk}`, { waitUntil: 'networkidle' })
await blad.emulateMedia({ media: 'print' })
await blad.pdf({
  path: UIT, format: 'A5', printBackground: true,
  displayHeaderFooter: true, headerTemplate: '<div></div>',
  footerTemplate: '<div style="width:100%;font-size:7.5px;color:#9b8d80;text-align:center;font-family:Georgia,serif"><span class="pageNumber"></span></div>',
  margin: { top: '20mm', bottom: '22mm', left: '18mm', right: '18mm' },
})
await browser.close()

const grootte = (await readFile(UIT)).length
console.log(`\n${path.relative(ROOT, UIT)} — ${(grootte / 1e6).toFixed(1)} MB\n`)
