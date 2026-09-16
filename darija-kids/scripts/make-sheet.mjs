/**
 * Builds one page with everything the app can say, for checking by ear.
 *
 * The data is pulled out of the app's own modules through a running dev
 * server rather than parsed out of the source, so what the page speaks is
 * exactly what the app speaks — the same spoken forms, the same borrowed
 * spellings, the same preferred voices. A sheet that drifts from the app is
 * worse than no sheet.
 *
 * Run with: node scripts/make-sheet.mjs [--out <bestand>]
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4340
const BASE = `http://127.0.0.1:${PORT}`
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}
const OUT = arg('out', 'uitspraak-alles.html')

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })

const data = await page.evaluate(async () => {
  const [alphabet, lexicon, sentences, pron, audio] = await Promise.all([
    import('/src/content/alphabet.ts'),
    import('/src/content/lexicon.ts'),
    import('/src/content/sentences.ts'),
    import('/src/content/pronunciation.ts'),
    import('/src/engine/audio.ts'),
  ])
  const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en']

  const letters = alphabet.LETTERS.map((l) => {
    const speech = pron.letterSpeech(l.id, l.ar, l.name)
    return {
      id: l.id,
      ar: l.ar,
      tr: l.tr,
      naam: l.name,
      klank: l.sound,
      spreek: speech.ar,
      latijn: speech.latin,
      liefst: speech.prefer,
    }
  })

  const woord = (w) => ({
    id: w.id,
    ar: w.ar,
    tr: w.tr,
    naam: w.nl,
    klank: '',
    spreek: pron.spokenForm(w.ar),
    latijn: Object.fromEntries(TALEN.map((t) => [t, audio.latinise(w.tr, t)])),
    liefst: [],
  })

  return {
    letters,
    woorden: lexicon.allWords.filter((w) => !w.phrase).map(woord),
    zinnen: [
      ...lexicon.allWords.filter((w) => w.phrase).map(woord),
      ...sentences.ALL_SENTENCES.map((z) => woord({ id: z.id, ar: z.ar, tr: z.tr, nl: z.nl })),
    ],
  }
})

await browser.close()
await server.close()

const counts = `${data.letters.length} letters, ${data.woorden.length} woorden, ${data.zinnen.length} zinnen`
console.log(counts)

const html = `<title>Alles Uitspreken</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&family=Noto+Naskh+Arabic:wght@400;700&display=swap">
<style>
  :root {
    --ground:#fbf6ee; --panel:#fff; --sunken:#f3ebdd;
    --ink:#221a16; --ink-soft:#5f5449; --ink-faint:#8b8075;
    --line:#e4d8c5; --line-firm:#cfbfa6;
    --alam:#c1272d; --khatim:#006233; --zellige:#0f766e; --saffron:#d97706;
    --f-display:"Baloo 2","Trebuchet MS",system-ui,sans-serif;
    --f-body:"IBM Plex Sans",system-ui,sans-serif;
    --f-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
    --f-ar:"Noto Naskh Arabic",serif;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --ground:#15110e; --panel:#1e1813; --sunken:#261e18;
    --ink:#f4ece1; --ink-soft:#b5a798; --ink-faint:#8a7d70;
    --line:#35291f; --line-firm:#4b3a2b;
    --alam:#f08a8e; --khatim:#63c68c; --zellige:#5ccfc0; --saffron:#f0a828;
  } }
  :root[data-theme="dark"] {
    --ground:#15110e; --panel:#1e1813; --sunken:#261e18;
    --ink:#f4ece1; --ink-soft:#b5a798; --ink-faint:#8a7d70;
    --line:#35291f; --line-firm:#4b3a2b;
    --alam:#f08a8e; --khatim:#63c68c; --zellige:#5ccfc0; --saffron:#f0a828;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--f-body);line-height:1.5}
  .wrap{max-width:54rem;margin:0 auto;padding-inline:16px;padding-block:24px 96px}
  h1{font-family:var(--f-display);font-size:clamp(1.6rem,5vw,2.2rem);margin:0 0 4px}
  p{margin:0}
  .lede{color:var(--ink-soft);max-width:56ch;font-size:.95rem}
  .eyebrow{font-family:var(--f-mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint)}

  .bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--ground);
       border-bottom:1px solid var(--line);padding-block:10px;margin-bottom:12px;display:grid;gap:8px}
  .rij{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  select,input[type=text],input[type=search]{font:inherit;padding:7px 10px;border-radius:9px;
       border:2px solid var(--line);background:var(--panel);color:var(--ink)}
  input[type=search]{flex:1;min-width:8rem}
  .tel{font-family:var(--f-mono);font-size:.78rem;color:var(--ink-faint)}
  .bad{color:var(--alam);font-weight:600}

  button{font:inherit;font-weight:600;cursor:pointer;border-radius:10px;border:2px solid var(--zellige);
         background:transparent;color:var(--zellige);padding:7px 12px}
  button:hover{background:var(--zellige);color:var(--panel)}
  button:focus-visible{outline:3px solid var(--saffron);outline-offset:2px}
  button.aan{background:var(--zellige);color:var(--panel)}
  button.mis{border-color:var(--alam);color:var(--alam)}
  button.mis.aan{background:var(--alam);color:#fff}
  button.klein{padding:5px 9px;font-size:.82rem;border-radius:8px}

  ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
  li{background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:10px 12px;
     display:grid;grid-template-columns:auto 1fr auto;gap:8px 12px;align-items:center}
  li.fout{border-color:var(--alam);box-shadow:inset 3px 0 0 var(--alam)}
  li.ok{opacity:.55}
  .ar{font-family:var(--f-ar);font-size:1.5rem;font-weight:700;direction:rtl}
  .tr{font-family:var(--f-display);font-weight:800;color:var(--zellige)}
  .nl{font-size:.86rem;color:var(--ink-soft)}
  .spreek{font-family:var(--f-mono);font-size:.72rem;color:var(--ink-faint);margin-top:2px}
  .spreek .ar{font-size:.95rem;color:var(--khatim)}
  .knoppen{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
  .uit{background:var(--sunken);border:1px solid var(--line);border-radius:10px;padding:12px;
       font-family:var(--f-mono);font-size:.76rem;white-space:pre-wrap;word-break:break-word;max-height:18rem;overflow:auto}
  .paneel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;margin-block:16px;display:grid;gap:10px}
  @media(max-width:560px){li{grid-template-columns:1fr}.knoppen{justify-content:flex-start}}
</style>

<div class="wrap">
  <span class="eyebrow">Darija Kids</span>
  <h1>Alles uitspreken</h1>
  <p class="lede">
    ${counts} — alles wat de app hardop kan zeggen, precies zoals de app het zegt.
    Luister, en tik <b>Fout</b> bij wat niet klopt. Onderaan staat je lijst klaar om
    te kopiëren. Je vinkjes blijven staan als je later terugkomt.
  </p>

  <div class="bar">
    <div class="rij">
      <select id="stem" aria-label="stem"></select>
      <label class="tel" for="tempo">tempo</label>
      <input id="tempo" type="range" min="0.4" max="1.1" step="0.05" value="0.7" style="width:90px">
      <span class="tel" id="tempoUit">0,70</span>
    </div>
    <div class="rij">
      <button data-tab="letters" class="aan">Letters</button>
      <button data-tab="woorden">Woorden</button>
      <button data-tab="zinnen">Zinnen</button>
      <input id="zoek" type="search" placeholder="zoeken…" aria-label="zoeken">
      <button id="alleenFout" class="klein">Alleen fout</button>
    </div>
    <p class="tel" id="stand">…</p>
  </div>

  <ul id="lijst"></ul>

  <div class="paneel">
    <div class="rij">
      <button id="toon">Toon mijn lijst</button>
      <button id="kopieer">Kopieer</button>
      <button id="wis">Wis alles</button>
    </div>
    <div class="uit" id="uitvoer">Nog niets aangevinkt.</div>
  </div>
</div>

<script>
const DATA = ${JSON.stringify(data)}
const TALEN = ['nl','fr','de','es','it','en']
const lijst = document.getElementById('lijst')
const keuze = document.getElementById('stem')
const tempo = document.getElementById('tempo')
const tempoUit = document.getElementById('tempoUit')
const stand = document.getElementById('stand')
const zoek = document.getElementById('zoek')
const uitvoer = document.getElementById('uitvoer')
let stemmen = []
let tab = 'letters'
let alleenFout = false
let staat = {}

try { staat = JSON.parse(localStorage.getItem('darija.check') || '{}') } catch (e) { staat = {} }
const bewaar = () => { try { localStorage.setItem('darija.check', JSON.stringify(staat)) } catch (e) {} }

const arabisch = (v) => v && v.lang.toLowerCase().startsWith('ar')
const taalVan = (v) => {
  const c = (v ? v.lang : 'nl').toLowerCase().split('-')[0]
  return TALEN.includes(c) ? c : 'en'
}
const stem = () => stemmen.find((v) => v.voiceURI === keuze.value) || null

/** The voice this one item should come out of, and the text for it. */
function plan(item) {
  const gekozen = stem()
  if (arabisch(gekozen)) return { v: gekozen, tekst: item.spreek }
  for (const taal of item.liefst || []) {
    const beter = stemmen.find((v) => v.lang.toLowerCase().startsWith(taal))
    if (beter) return { v: beter, tekst: item.latijn[taal] }
  }
  return { v: gekozen, tekst: item.latijn[taalVan(gekozen)] }
}

function zeg(item) {
  const { v, tekst } = plan(item)
  if (!v || !tekst) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(tekst)
  u.voice = v
  u.lang = v.lang
  u.rate = Number(tempo.value)
  speechSynthesis.speak(u)
}

function items() {
  const naald = zoek.value.trim().toLowerCase()
  return DATA[tab].filter((i) => {
    if (alleenFout && staat[i.id] !== 'fout') return false
    if (!naald) return true
    return (i.id + ' ' + i.tr + ' ' + i.naam + ' ' + i.ar).toLowerCase().includes(naald)
  })
}

function teken() {
  const rijen = items()
  lijst.innerHTML = ''
  for (const item of rijen) {
    const li = document.createElement('li')
    if (staat[item.id] === 'fout') li.className = 'fout'
    else if (staat[item.id] === 'ok') li.className = 'ok'

    const speel = document.createElement('button')
    speel.type = 'button'
    speel.textContent = '\\u25B6'
    speel.setAttribute('aria-label', 'spreek ' + item.tr + ' uit')
    speel.addEventListener('click', () => zeg(item))

    const midden = document.createElement('div')
    const p = plan(item)
    midden.innerHTML =
      '<div><span class="ar">' + item.ar + '</span> <span class="tr">' + item.tr + '</span></div>' +
      '<div class="nl">' + item.naam + (item.klank ? ' \\u00b7 ' + item.klank : '') + '</div>' +
      '<div class="spreek">' + (arabisch(p.v)
        ? 'zegt: <span class="ar">' + p.tekst + '</span>'
        : 'zegt: ' + p.tekst + ' (' + (p.v ? p.v.lang : 'geen stem') + ')') +
      ' \\u00b7 ' + item.id + '</div>'

    const knoppen = document.createElement('div')
    knoppen.className = 'knoppen'
    const goed = document.createElement('button')
    goed.type = 'button'
    goed.className = 'klein' + (staat[item.id] === 'ok' ? ' aan' : '')
    goed.textContent = 'Goed'
    const mis = document.createElement('button')
    mis.type = 'button'
    mis.className = 'klein mis' + (staat[item.id] === 'fout' ? ' aan' : '')
    mis.textContent = 'Fout'
    const zet = (waarde) => {
      if (staat[item.id] === waarde) delete staat[item.id]
      else staat[item.id] = waarde
      bewaar()
      teken()
      tel()
    }
    goed.addEventListener('click', () => zet('ok'))
    mis.addEventListener('click', () => zet('fout'))
    knoppen.append(goed, mis)

    li.append(speel, midden, knoppen)
    lijst.append(li)
  }
  if (!rijen.length) lijst.innerHTML = '<li><div class="nl">Niets gevonden.</div></li>'
}

function tel() {
  const alles = [...DATA.letters, ...DATA.woorden, ...DATA.zinnen]
  const gedaan = alles.filter((i) => staat[i.id]).length
  const fout = alles.filter((i) => staat[i.id] === 'fout').length
  stand.innerHTML = gedaan + ' van ' + alles.length + ' nagelopen'
    + (fout ? ' \\u00b7 <span class="bad">' + fout + ' fout</span>' : '')
}

function toon() {
  const alles = [...DATA.letters, ...DATA.woorden, ...DATA.zinnen]
  const fout = alles.filter((i) => staat[i.id] === 'fout')
  if (!fout.length) { uitvoer.textContent = 'Nog niets als fout aangevinkt.'; return }
  uitvoer.textContent = 'Fout uitgesproken (' + fout.length + '):\\n\\n'
    + fout.map((i) => i.id + '  ' + i.ar + '  ' + i.tr + '  \\u2192 zegt nu: ' + plan(i).tekst).join('\\n')
}

for (const knop of document.querySelectorAll('[data-tab]')) {
  knop.addEventListener('click', () => {
    tab = knop.dataset.tab
    for (const k of document.querySelectorAll('[data-tab]')) k.classList.toggle('aan', k === knop)
    teken()
  })
}
document.getElementById('alleenFout').addEventListener('click', (e) => {
  alleenFout = !alleenFout
  e.currentTarget.classList.toggle('aan', alleenFout)
  teken()
})
zoek.addEventListener('input', teken)
tempo.addEventListener('input', () => { tempoUit.textContent = Number(tempo.value).toFixed(2).replace('.', ',') })
document.getElementById('toon').addEventListener('click', toon)
document.getElementById('kopieer').addEventListener('click', async () => {
  toon()
  try { await navigator.clipboard.writeText(uitvoer.textContent) } catch (e) {}
})
document.getElementById('wis').addEventListener('click', () => { staat = {}; bewaar(); teken(); tel(); toon() })

function laad() {
  stemmen = speechSynthesis.getVoices()
  if (!stemmen.length) return
  const ar = stemmen.filter(arabisch)
  keuze.innerHTML = ''
  for (const v of [...ar, ...stemmen.filter((x) => !arabisch(x))]) {
    const o = document.createElement('option')
    o.value = v.voiceURI
    o.textContent = (arabisch(v) ? '\\u2605 ' : '') + v.name + ' (' + v.lang + ')'
    keuze.append(o)
  }
  teken()
  tel()
}
keuze.addEventListener('change', teken)
speechSynthesis.addEventListener('voiceschanged', laad)
laad()
setTimeout(laad, 400)
</script>
`

await writeFile(path.resolve(OUT), html)
console.log(`${OUT} — ${(html.length / 1024).toFixed(0)} kB`)
