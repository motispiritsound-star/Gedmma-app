/**
 * Het blad waarop je nakijkt of de stukken bij de goede woorden staan.
 *
 * Eén doorlopende opname knippen gaat goed zolang er precies zoveel stukken
 * uitkomen als er woorden gevraagd zijn. Klopt dat niet — een woord dat je
 * opnieuw zei, een kuch, een woord dat in tweeën viel — dan schuift alles
 * daarna een plaats op en staat het onder de verkeerde naam. Dat is niet met
 * rekenen op te lossen: alleen wie de taal spreekt hoort waar het misgaat.
 *
 * Dus staat hier elk stuk, op volgorde, met het woord waar het volgens de
 * telling bij hoort. Je luistert, en waar het spoor loopt te lopen vink je het
 * stuk aan dat niet meetelt. Onderaan komt de regel eruit waarmee ik het
 * opnieuw knip, nu wel goed.
 *
 * Draaien met:
 *   node scripts/make-knipblad.mjs opname.m4a --voorrang
 *   node scripts/make-knipblad.mjs opname.m4a --voorrang --rond 3,16,43,47
 *
 * Met `--rond` staan alleen de stukken rond die nummers erin. Alle stukken
 * meebakken maakt het blad een paar megabyte, en dat opent niet op een
 * telefoon; een handvol wel. Handig als er al een vermoeden is waar het
 * misgaat en alleen dat nog nagehoord hoeft te worden.
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { bewerk, naarWav, readWav, writeWav } from './lib/wav.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4365

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const BESTAND = process.argv[2]
if (!BESTAND || BESTAND.startsWith('--')) {
  console.error('gebruik: node scripts/make-knipblad.mjs <opname> --voorrang')
  process.exit(1)
}
const UIT = arg('uit', path.join(ROOT, 'store', 'knipblad.html'))
const PAUZE = Number(arg('pauze', 0.3))
/** Alleen de stukken rond deze nummers, met dit aantal ernaast. */
const ROND = (arg('rond', '') || '').split(',').map((n) => Number(n.trim())).filter(Boolean)
const RAAM = Number(arg('raam', 2))

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })

const eigenIds = arg('ids', null)
const woorden = await page.evaluate(async (eigen) => {
  const [e, lex] = await Promise.all([
    import('/src/content/eigen.ts'),
    import('/src/content/lexicon.ts'),
  ])
  const opId = new Map(lex.allWords.map((w) => [w.id, w]))
  const ids = eigen ? eigen.split(',').map((s) => s.trim()).filter(Boolean) : e.OPNAME_NODIG
  return ids.map((id) => {
    const w = opId.get(id)
    return { id, ar: w?.ar ?? '?', tr: w?.tr ?? id, nl: w?.nl ?? '' }
  })
}, eigenIds)

const { rate, samples } = readWav(await naarWav(path.resolve(BESTAND)))
const stukken = await page.evaluate(async ({ lijst, rate, pauze }) => {
  const { knip } = await import('/src/engine/knip.ts')
  return knip(Float32Array.from(lijst), rate, { pauze })
}, { lijst: Array.from(samples), rate, pauze: PAUZE })

await browser.close()
await server.close()

console.log(`${stukken.length} stukken, ${woorden.length} woorden`)

/**
 * Welke stukken er in het blad komen.
 *
 * Standaard alle. Met `--rond` alleen de omgeving van de nummers die je
 * opgeeft, want een blad van drie megabyte opent niet op een telefoon en het
 * gaat meestal maar om een paar plekken.
 */
const zichtbaar = new Set()
if (ROND.length) {
  for (const n of ROND) {
    for (let d = Math.max(1, n - RAAM); d <= Math.min(stukken.length, n + RAAM); d++) zichtbaar.add(d)
  }
} else {
  for (let d = 1; d <= stukken.length; d++) zichtbaar.add(d)
}

/** Elk stuk reist mee als data, zodat het blad één bestand blijft. */
const klank = stukken.map((s, i) => {
  if (!zichtbaar.has(i + 1)) return ''
  const deel = samples.slice(Math.floor(s.van * rate), Math.ceil(s.tot * rate))
  const klaar = bewerk(rate, deel)
  const wav = writeWav(rate, klaar ? klaar.samples : deel)
  return `data:audio/wav;base64,${Buffer.from(wav).toString('base64')}`
})

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Knipblad — ${esc(path.basename(BESTAND))}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&family=Noto+Naskh+Arabic:wght@400;700&display=swap">
<style>
  :root{--ground:#fbf6ee;--panel:#fff;--sunken:#f3ebdd;--ink:#221a16;--ink-soft:#5f5449;
    --ink-faint:#8b8075;--line:#e4d8c5;--line-firm:#cfbfa6;--alam:#c1272d;--khatim:#006233;
    --zellige:#0f766e;--saffron:#d97706;
    --f-display:"Baloo 2",system-ui,sans-serif;--f-body:"IBM Plex Sans",system-ui,sans-serif;
    --f-mono:"IBM Plex Mono",monospace;--f-ar:"Noto Naskh Arabic",serif}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
    --ground:#15110e;--panel:#1e1813;--sunken:#261e18;--ink:#f4ece1;--ink-soft:#b5a798;
    --ink-faint:#8a7d70;--line:#35291f;--line-firm:#4b3a2b;--alam:#f08a8e;--khatim:#63c68c;
    --zellige:#5ccfc0;--saffron:#f0a828}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--f-body);line-height:1.5}
  .wrap{max-width:46rem;margin:0 auto;padding:22px 16px 90px}
  .eyebrow{font-family:var(--f-mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint)}
  h1{font-family:var(--f-display);font-size:clamp(1.5rem,5vw,2rem);margin:4px 0 8px}
  .lede{color:var(--ink-soft);max-width:56ch}
  .balk{position:sticky;top:0;z-index:5;background:var(--ground);padding:12px 0;border-bottom:1px solid var(--line);margin-bottom:10px}
  .stand{font-family:var(--f-mono);font-size:.8rem}
  .stand.goed{color:var(--khatim)} .stand.mis{color:var(--alam)}
  ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
  li{display:flex;gap:11px;align-items:center;background:var(--panel);border:1px solid var(--line);
    border-radius:12px;padding:9px 12px}
  li.over{opacity:.45;border-style:dashed}
  li.over .woord{text-decoration:line-through}
  .nr{font-family:var(--f-mono);font-size:.72rem;color:var(--ink-faint);min-width:1.8rem;text-align:end}
  button.speel{flex:0 0 auto;width:38px;height:38px;border-radius:11px;border:2px solid var(--zellige);
    background:transparent;color:var(--zellige);font-size:.9rem;cursor:pointer}
  .woord{flex:1;min-width:0}
  .ar{font-family:var(--f-ar);direction:rtl;font-size:1.25rem;font-weight:700}
  .tr{font-family:var(--f-display);font-weight:800;color:var(--zellige)}
  .nl{font-size:.82rem;color:var(--ink-soft)}
  .tijd{font-family:var(--f-mono);font-size:.68rem;color:var(--ink-faint);white-space:nowrap}
  button.klein{font-family:var(--f-body);font-weight:600;font-size:.74rem;padding:5px 10px;border-radius:9px;
    border:1px solid var(--line-firm);background:var(--sunken);color:var(--ink-soft);cursor:pointer}
  button.klein.aan{background:var(--alam);border-color:var(--alam);color:#fff}
  .uit{font-family:var(--f-mono);font-size:.82rem;white-space:pre-wrap;background:var(--sunken);
    border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px;user-select:all}
  .paneel{position:fixed;left:0;right:0;bottom:0;background:var(--panel);border-top:1px solid var(--line);
    padding:10px 16px;display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap}
</style>
</head><body>
<div class="wrap">
  <p class="eyebrow">Darija Kids</p>
  <h1>Staat elk stuk bij het goede woord?</h1>
  <p class="lede">
    Er kwamen <strong>${stukken.length}</strong> stukken uit de opname en er zijn
    <strong>${woorden.length}</strong> woorden. Luister van boven naar beneden.
    Zodra een stuk niet bij het woord ernaast hoort, is er daarvóór iets te veel:
    een woord dat je opnieuw zei, een kuch, of een woord dat in tweeën viel.
    Tik dat stuk aan met <em>telt niet mee</em> — alles erna schuift dan een
    plaats terug, en je hoort meteen of het weer klopt.
  </p>

  <div class="balk">
    <div class="stand" id="stand"></div>
  </div>

  <ul id="lijst"></ul>
</div>

<div class="paneel">
  <button class="klein" id="kopieer">Kopieer de regel voor Claude</button>
  <button class="klein" id="wis">Begin opnieuw</button>
</div>
<div class="wrap" style="padding-top:0"><div class="uit" id="uitvoer"></div></div>

<script>
const KLANK = ${JSON.stringify(klank)}
const ZICHTBAAR = ${JSON.stringify([...zichtbaar].sort((a, b) => a - b))}
const STUKKEN = ${JSON.stringify(stukken.map((s) => [+s.van.toFixed(2), +(s.tot - s.van).toFixed(2)]))}
const WOORDEN = ${JSON.stringify(woorden)}
const lijst = document.getElementById('lijst')
const stand = document.getElementById('stand')
const uitvoer = document.getElementById('uitvoer')
let over = new Set()
try { over = new Set(JSON.parse(localStorage.getItem('darija.knip') || '[]')) } catch (e) {}
const bewaar = () => { try { localStorage.setItem('darija.knip', JSON.stringify([...over])) } catch (e) {} }

let bezig = null
function speel(i) {
  if (bezig) { bezig.pause(); bezig = null }
  bezig = new Audio(KLANK[i])
  void bezig.play()
}

function teken() {
  lijst.innerHTML = ''
  let w = 0
  const TOON = new Set(ZICHTBAAR)
  for (let i = 0; i < STUKKEN.length; i++) {
    const weg = over.has(i + 1)
    const woord = weg ? null : WOORDEN[w++]
    if (!TOON.has(i + 1)) { if (!weg) w = w; continue }
    const li = document.createElement('li')
    if (weg) li.className = 'over'
    li.innerHTML =
      '<span class="nr">' + (i + 1) + '</span>' +
      '<button class="speel" type="button" aria-label="speel stuk ' + (i + 1) + '">\\u25B6</button>' +
      '<span class="woord">' +
        (woord
          ? '<span class="ar">' + woord.ar + '</span> <span class="tr">' + woord.tr + '</span>' +
            '<div class="nl">' + woord.nl + '</div>'
          : '<span class="tr">telt niet mee</span>') +
      '</span>' +
      '<span class="tijd">' + STUKKEN[i][0].toFixed(1) + 's \\u00b7 ' + STUKKEN[i][1].toFixed(2) + 's</span>'
    const knop = document.createElement('button')
    knop.type = 'button'
    knop.className = 'klein' + (weg ? ' aan' : '')
    knop.textContent = weg ? 'telt niet mee' : 'schrap'
    knop.addEventListener('click', () => {
      if (over.has(i + 1)) over.delete(i + 1); else over.add(i + 1)
      bewaar(); teken(); toon()
    })
    li.querySelector('.speel').addEventListener('click', () => speel(i))
    li.append(knop)
    lijst.append(li)
  }
  const rest = STUKKEN.length - over.size
  stand.className = 'stand ' + (rest === WOORDEN.length ? 'goed' : 'mis')
  stand.textContent = rest === WOORDEN.length
    ? rest + ' stukken voor ' + WOORDEN.length + ' woorden \\u2014 dat klopt'
    : rest + ' stukken voor ' + WOORDEN.length + ' woorden \\u2014 ' +
      (rest > WOORDEN.length ? (rest - WOORDEN.length) + ' te veel' : (WOORDEN.length - rest) + ' te weinig')
}

function toon() {
  uitvoer.textContent = over.size
    ? '--sla-over ' + [...over].sort((a, b) => a - b).join(',')
    : 'Nog niets geschrapt.'
}

document.getElementById('kopieer').addEventListener('click', async () => {
  toon()
  try { await navigator.clipboard.writeText(uitvoer.textContent) } catch (e) {}
})
document.getElementById('wis').addEventListener('click', () => { over = new Set(); bewaar(); teken(); toon() })
teken(); toon()
</script>
</body></html>
`

await writeFile(UIT, html)
console.log(`${path.relative(ROOT, UIT)} — ${(html.length / 1024 / 1024).toFixed(1)} MB`)
