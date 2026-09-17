/**
 * Het blad waarmee je peilt hoeveel stukken er te veel in de opname zitten.
 *
 * Het knipblad vraagt "hoort dit stuk bij dit woord?" en dat werkt, maar je
 * moet er dan van boven naar beneden doorheen. Sneller is peilen: op een
 * handjevol plekken luister je welk woord je hoort, en daaruit volgt vanzelf
 * hoeveel stukken er vóór die plek te veel zaten. Vijf keer luisteren in
 * plaats van negentig keer.
 *
 * Elk peilpunt toont de woorden die daar kunnen klinken: het woord dat er nu
 * staat (niets te veel), het woord ervoor (een te veel), en zo verder. Je tikt
 * aan wat je hoort. Meer hoeft niet.
 *
 * Draaien met:
 *   node scripts/make-peilblad.mjs opname.m4a --peil 25,45,50,60,75
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { bewerk, naarWav, readWav, writeWav } from './lib/wav.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4366

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const BESTAND = process.argv[2]
if (!BESTAND || BESTAND.startsWith('--')) {
  console.error('gebruik: node scripts/make-peilblad.mjs <opname> --peil 25,45,50,60,75')
  process.exit(1)
}
const UIT = arg('uit', path.join(ROOT, 'store', 'peilblad.html'))
const PAUZE = Number(arg('pauze', 0.3))
const PEIL = (arg('peil', '25,45,50,60,75') || '').split(',').map((n) => Number(n.trim())).filter(Boolean)
/** Hoeveel stukken er hoogstens te veel kunnen zitten, en dus hoeveel keuzes er per peilpunt zijn. */
const DIEPTE = Number(arg('diepte', 4))

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })

const woorden = await page.evaluate(async () => {
  const [e, lex, zin] = await Promise.all([
    import('/src/content/eigen.ts'),
    import('/src/content/lexicon.ts'),
    import('/src/content/sentences.ts'),
  ])
  // Op de opnamelijst staan ook zinnen, en die moeten hier net zo goed bij
  // naam te noemen zijn als een woord.
  const opId = new Map()
  for (const w of lex.allWords) opId.set(w.id, w)
  for (const z of zin.ALL_SENTENCES) if (!opId.has(z.id)) opId.set(z.id, z)
  return e.OPNAME_NODIG.map((id) => {
    const w = opId.get(id)
    return { id, ar: w?.ar ?? '?', tr: w?.tr ?? id, nl: w?.nl ?? '' }
  })
})

const { rate, samples } = readWav(await naarWav(path.resolve(BESTAND)))
const stukken = await page.evaluate(async ({ lijst, rate, pauze }) => {
  const { knip } = await import('/src/engine/knip.ts')
  return knip(Float32Array.from(lijst), rate, { pauze })
}, { lijst: Array.from(samples), rate, pauze: PAUZE })

await browser.close()
await server.close()

console.log(`${stukken.length} stukken, ${woorden.length} woorden`)

/** Per peilpunt: het stuk zelf, en de woorden die er kunnen klinken. */
const punten = PEIL.filter((n) => n >= 1 && n <= stukken.length).map((n) => {
  const s = stukken[n - 1]
  const deel = samples.slice(Math.floor(s.van * rate), Math.ceil(s.tot * rate))
  const klaar = bewerk(rate, deel)
  const wav = writeWav(rate, klaar ? klaar.samples : deel)
  const keuzes = []
  for (let k = 0; k <= DIEPTE; k++) {
    const w = woorden[n - k - 1]
    if (w) keuzes.push({ k, ...w })
  }
  return {
    nr: n,
    tijd: +s.van.toFixed(1),
    duur: +(s.tot - s.van).toFixed(2),
    keuzes,
    klank: `data:audio/wav;base64,${Buffer.from(wav).toString('base64')}`,
  }
})

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Peilblad — ${esc(path.basename(BESTAND))}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&family=Noto+Naskh+Arabic:wght@400;700&display=swap">
<style>
  :root{--ground:#fbf6ee;--panel:#fff;--sunken:#f3ebdd;--ink:#221a16;--ink-soft:#5f5449;
    --ink-faint:#8b8075;--line:#e4d8c5;--line-firm:#cfbfa6;--alam:#c1272d;--khatim:#006233;
    --zellige:#0f766e;
    --f-display:"Baloo 2",system-ui,sans-serif;--f-body:"IBM Plex Sans",system-ui,sans-serif;
    --f-mono:"IBM Plex Mono",monospace;--f-ar:"Noto Naskh Arabic",serif}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
    --ground:#15110e;--panel:#1e1813;--sunken:#261e18;--ink:#f4ece1;--ink-soft:#b5a798;
    --ink-faint:#8a7d70;--line:#35291f;--line-firm:#4b3a2b;--alam:#f08a8e;--khatim:#63c68c;
    --zellige:#5ccfc0}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--f-body);line-height:1.5}
  .wrap{max-width:44rem;margin:0 auto;padding:22px 16px 110px}
  .eyebrow{font-family:var(--f-mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint)}
  h1{font-family:var(--f-display);font-size:clamp(1.5rem,5vw,2rem);margin:4px 0 8px}
  .lede{color:var(--ink-soft);max-width:58ch}
  section{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:14px}
  .kop{display:flex;gap:12px;align-items:center;margin-bottom:10px}
  .nr{font-family:var(--f-mono);font-size:.72rem;color:var(--ink-faint)}
  button.speel{flex:0 0 auto;width:46px;height:46px;border-radius:14px;border:2px solid var(--zellige);
    background:transparent;color:var(--zellige);font-size:1.05rem;cursor:pointer}
  .vraag{font-family:var(--f-display);font-weight:800}
  .keuzes{display:grid;gap:7px}
  button.keuze{display:flex;gap:10px;align-items:center;text-align:start;width:100%;cursor:pointer;
    background:var(--sunken);border:1px solid var(--line);border-radius:12px;padding:9px 11px;color:var(--ink);
    font-family:var(--f-body)}
  button.keuze.aan{background:var(--khatim);border-color:var(--khatim);color:#fff}
  button.keuze.aan .nl,button.keuze.aan .tr{color:#fff}
  .ar{font-family:var(--f-ar);direction:rtl;font-size:1.3rem;font-weight:700;min-width:5rem}
  .tr{font-family:var(--f-display);font-weight:800;color:var(--zellige)}
  .nl{font-size:.82rem;color:var(--ink-soft)}
  .anders{margin-top:8px}
  .anders input{width:100%;font-family:var(--f-body);font-size:.9rem;padding:9px 11px;border-radius:11px;
    border:1px solid var(--line-firm);background:var(--sunken);color:var(--ink)}
  .uit{font-family:var(--f-mono);font-size:.82rem;white-space:pre-wrap;background:var(--sunken);
    border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:12px;user-select:all}
  .paneel{position:fixed;left:0;right:0;bottom:0;background:var(--panel);border-top:1px solid var(--line);
    padding:10px 16px;display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap}
  button.klein{font-family:var(--f-body);font-weight:600;font-size:.78rem;padding:8px 12px;border-radius:10px;
    border:1px solid var(--line-firm);background:var(--sunken);color:var(--ink-soft);cursor:pointer}
</style>
</head><body>
<div class="wrap">
  <p class="eyebrow">Darija Kids</p>
  <h1>Welk woord hoor je hier?</h1>
  <p class="lede">
    Er kwamen <strong>${stukken.length}</strong> stukken uit de opname voor
    <strong>${woorden.length}</strong> woorden, dus je hebt er een paar extra gezegd.
    Hieronder staan ${punten.length} losse stukken uit de opname. Speel er een af en tik aan
    welk woord je hoort — niet of het klopt, maar wat je hoort. Daarmee weet ik precies
    waar die extra stukken zitten en knip ik de rest vanzelf goed.
  </p>

  <div id="blad"></div>
  <div class="uit" id="uitvoer">Nog niets aangetikt.</div>
</div>

<div class="paneel">
  <button class="klein" id="kopieer">Kopieer het antwoord</button>
  <button class="klein" id="wis">Begin opnieuw</button>
</div>

<script>
const PUNTEN = ${JSON.stringify(punten)}
const blad = document.getElementById('blad')
const uitvoer = document.getElementById('uitvoer')
let keus = {}
try { keus = JSON.parse(localStorage.getItem('darija.peil') || '{}') } catch (e) {}
const bewaar = () => { try { localStorage.setItem('darija.peil', JSON.stringify(keus)) } catch (e) {} }

let bezig = null
function speel(src) {
  if (bezig) { bezig.pause(); bezig = null }
  bezig = new Audio(src)
  void bezig.play()
}

function toon() {
  const regels = PUNTEN.map((p) => {
    const k = keus[p.nr]
    if (k === undefined || k === null || k === '') return 'stuk ' + p.nr + ' = ?'
    if (typeof k === 'string') return 'stuk ' + p.nr + ' = ' + k + ' (zelf getypt)'
    const w = p.keuzes.find((c) => c.k === k)
    return 'stuk ' + p.nr + ' = ' + (w ? w.tr + ' (' + w.nl + ')' : '?')
  })
  uitvoer.textContent = regels.join('\\n')
}

for (const p of PUNTEN) {
  const sec = document.createElement('section')
  const kop = document.createElement('div')
  kop.className = 'kop'
  kop.innerHTML =
    '<button class="speel" type="button" aria-label="speel stuk ' + p.nr + '">\\u25B6</button>' +
    '<div><div class="vraag">Stuk ' + p.nr + '</div>' +
    '<div class="nr">op ' + p.tijd.toFixed(1) + 's \\u00b7 ' + p.duur.toFixed(2) + 's lang</div></div>'
  kop.querySelector('.speel').addEventListener('click', () => speel(p.klank))
  sec.append(kop)

  const keuzes = document.createElement('div')
  keuzes.className = 'keuzes'
  for (const c of p.keuzes) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'keuze' + (keus[p.nr] === c.k ? ' aan' : '')
    b.innerHTML =
      '<span class="ar">' + c.ar + '</span>' +
      '<span><span class="tr">' + c.tr + '</span><div class="nl">' + c.nl + '</div></span>'
    b.addEventListener('click', () => {
      keus[p.nr] = c.k
      bewaar()
      for (const el of keuzes.children) el.classList.remove('aan')
      b.classList.add('aan')
      veld.value = ''
      toon()
    })
    keuzes.append(b)
  }
  sec.append(keuzes)

  const anders = document.createElement('div')
  anders.className = 'anders'
  const veld = document.createElement('input')
  veld.type = 'text'
  veld.placeholder = 'Ik hoor iets anders \\u2014 typ het hier'
  if (typeof keus[p.nr] === 'string') veld.value = keus[p.nr]
  veld.addEventListener('input', () => {
    if (veld.value.trim()) {
      keus[p.nr] = veld.value.trim()
      for (const el of keuzes.children) el.classList.remove('aan')
    } else delete keus[p.nr]
    bewaar(); toon()
  })
  anders.append(veld)
  sec.append(anders)
  blad.append(sec)
}

document.getElementById('kopieer').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(uitvoer.textContent) } catch (e) {}
})
document.getElementById('wis').addEventListener('click', () => {
  keus = {}; bewaar()
  for (const el of document.querySelectorAll('.keuze')) el.classList.remove('aan')
  for (const el of document.querySelectorAll('.anders input')) el.value = ''
  toon()
})
toon()
</script>
</body></html>`

await writeFile(UIT, html)
console.log(`${punten.length} peilpunten -> ${UIT} (${(html.length / 1024).toFixed(0)} kB)`)
