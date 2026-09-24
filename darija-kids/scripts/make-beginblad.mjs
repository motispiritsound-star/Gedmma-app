/**
 * Waar begint elke opname?
 *
 * Als er meerdere spraakmemo's tegelijk binnenkomen is de volgorde van de
 * bestandsnamen niet genoeg: een telefoon nummert ze zoals het hem uitkomt, en
 * één memo die halverwege is afgekapt zet alles erna een plaats op. Rekenen
 * helpt niet — losse woorden duren allemaal ongeveer even lang, dus de lengte
 * wijst geen plaats aan.
 *
 * Eén ding beslist het wel: het eerste woord. Dit blad zet van elke opname de
 * eerste twee stukken op een rij, met een veld om op te schrijven welke regel
 * je daar hoort. Negen keer luisteren en de rest volgt vanzelf.
 *
 * Draaien met:
 *   node scripts/make-beginblad.mjs opname1.m4a opname2.m4a … --uit blad.html
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'
import { bewerk, naarWav, readWav, writeWav } from './lib/wav.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 4404
const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const UIT = arg('uit', path.join(ROOT, 'store', 'beginblad.html'))
const HOEVEEL = Number(arg('stukken', 2))
const bestanden = process.argv.slice(2).filter((a) => !a.startsWith('--')
  && a !== UIT && a !== String(HOEVEEL))

if (!bestanden.length) {
  console.error('gebruik: node scripts/make-beginblad.mjs <opname…> [--uit blad.html]')
  process.exit(1)
}

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()
const browser = await startChroom()
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })

const opnames = []
for (const pad of bestanden) {
  const { rate, samples } = readWav(await naarWav(path.resolve(pad)))
  const stukken = await page.evaluate(async ({ lijst, rate }) => {
    const { knip } = await import('/src/engine/knip.ts')
    return knip(Float32Array.from(lijst), rate, { pauze: 0.3 })
  }, { lijst: Array.from(samples), rate })
  const klanken = stukken.slice(0, HOEVEEL).map((s) => {
    const deel = samples.slice(Math.floor(s.van * rate), Math.ceil(s.tot * rate))
    const klaar = bewerk(rate, deel)
    const wav = writeWav(rate, klaar ? klaar.samples : deel)
    return { duur: +(s.tot - s.van).toFixed(2), bron: `data:audio/wav;base64,${Buffer.from(wav).toString('base64')}` }
  })
  opnames.push({ naam: path.basename(pad), aantal: stukken.length, klanken })
}
await browser.close()
await server.close()

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Waar begint elke opname?</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&display=swap">
<style>
  :root{--ground:#fbf6ee;--panel:#fff;--sunken:#f3ebdd;--ink:#221a16;--ink-soft:#5f5449;
    --ink-faint:#8b8075;--line:#e4d8c5;--line-firm:#cfbfa6;--khatim:#006233;--zellige:#0f766e;
    --f-display:"Baloo 2",system-ui,sans-serif;--f-body:"IBM Plex Sans",system-ui,sans-serif;
    --f-mono:"IBM Plex Mono",monospace}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
    --ground:#15110e;--panel:#1e1813;--sunken:#261e18;--ink:#f4ece1;--ink-soft:#b5a798;
    --ink-faint:#8a7d70;--line:#35291f;--line-firm:#4b3a2b;--khatim:#63c68c;--zellige:#5ccfc0}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--f-body);line-height:1.55}
  .wrap{max-width:44rem;margin:0 auto;padding:24px 16px 90px}
  .eyebrow{font-family:var(--f-mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint)}
  h1{font-family:var(--f-display);font-size:clamp(1.5rem,5vw,2rem);margin:4px 0 8px}
  .lede{color:var(--ink-soft);max-width:58ch}
  section{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:14px}
  .kop{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
  .naam{font-family:var(--f-mono);font-size:.8rem;color:var(--ink-soft)}
  .tel{font-family:var(--f-mono);font-size:.72rem;color:var(--ink-faint)}
  button.speel{width:44px;height:44px;border-radius:13px;border:2px solid var(--zellige);
    background:transparent;color:var(--zellige);font-size:1rem;cursor:pointer}
  .knoppen{display:flex;gap:8px;align-items:center}
  label{display:block;font-size:.8rem;color:var(--ink-soft);margin-top:10px}
  input{width:100%;font-family:var(--f-body);font-size:1rem;padding:10px 12px;border-radius:11px;
    border:1px solid var(--line-firm);background:var(--sunken);color:var(--ink);margin-top:4px}
  .uit{font-family:var(--f-mono);font-size:.82rem;white-space:pre-wrap;background:var(--sunken);
    border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:14px;user-select:all}
  .paneel{position:fixed;left:0;right:0;bottom:0;background:var(--panel);border-top:1px solid var(--line);
    padding:10px 16px;display:flex;gap:8px;justify-content:center}
  button.klein{font-family:var(--f-body);font-weight:600;font-size:.78rem;padding:8px 12px;border-radius:10px;
    border:1px solid var(--line-firm);background:var(--sunken);color:var(--ink-soft);cursor:pointer}
</style>
</head><body>
<div class="wrap">
  <p class="eyebrow">Darijaforkids</p>
  <h1>Waar begint elke opname?</h1>
  <p class="lede">
    Er kwamen ${opnames.length} opnames tegelijk binnen en de volgorde van de
    bestandsnamen zegt niet genoeg. Speel per opname het eerste stuk af — en het
    tweede als je twijfelt — en schrijf op welk <strong>regelnummer</strong> van
    de opnamelijst je daar hoort. Meer heb ik niet nodig; de rest volgt uit de
    telling.
  </p>
  <div id="blad"></div>
  <div class="uit" id="uitvoer">Nog niets ingevuld.</div>
</div>
<div class="paneel">
  <button class="klein" id="kopieer">Kopieer het antwoord</button>
</div>
<script>
const OPNAMES = ${JSON.stringify(opnames)}
const blad = document.getElementById('blad')
const uitvoer = document.getElementById('uitvoer')
let keus = {}
try { keus = JSON.parse(localStorage.getItem('darija.begin') || '{}') } catch (e) {}
let bezig = null
const speel = (bron) => { if (bezig) bezig.pause(); bezig = new Audio(bron); void bezig.play() }

function toon() {
  uitvoer.textContent = OPNAMES
    .map((o) => o.naam + ' (' + o.aantal + ' stukken) = regel ' + (keus[o.naam] || '?'))
    .join('\\n')
}

for (const o of OPNAMES) {
  const sec = document.createElement('section')
  const kop = document.createElement('div')
  kop.className = 'kop'
  kop.innerHTML = '<span class="naam">' + o.naam + '</span><span class="tel">'
    + o.aantal + ' stukken</span>'
  const knoppen = document.createElement('div')
  knoppen.className = 'knoppen'
  o.klanken.forEach((k, i) => {
    const kn = document.createElement('button')
    kn.type = 'button'
    kn.className = 'speel'
    kn.textContent = i === 0 ? '\\u25B6' : '\\u25B6' + (i + 1)
    kn.title = 'stuk ' + (i + 1) + ' \\u2014 ' + k.duur + 's'
    kn.addEventListener('click', () => speel(k.bron))
    knoppen.append(kn)
  })
  kop.append(knoppen)
  sec.append(kop)
  const lab = document.createElement('label')
  lab.textContent = 'Welk regelnummer hoor je hier?'
  const veld = document.createElement('input')
  veld.type = 'text'
  veld.inputMode = 'numeric'
  veld.placeholder = 'bijvoorbeeld 14'
  veld.value = keus[o.naam] || ''
  veld.addEventListener('input', () => {
    keus[o.naam] = veld.value.trim()
    try { localStorage.setItem('darija.begin', JSON.stringify(keus)) } catch (e) {}
    toon()
  })
  lab.append(veld)
  sec.append(lab)
  blad.append(sec)
}
document.getElementById('kopieer').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(uitvoer.textContent) } catch (e) {}
})
toon()
</script>
</body></html>`

await writeFile(UIT, html)
console.log(`${opnames.length} opnames, ${opnames.map((o) => o.aantal).reduce((a, b) => a + b, 0)} stukken samen`)
console.log(`${path.relative(ROOT, UIT)} — ${(html.length / 1024).toFixed(0)} kB`)
