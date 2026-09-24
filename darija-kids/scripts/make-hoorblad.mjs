/**
 * Wat hoor je hier eigenlijk?
 *
 * Het knipblad vraagt naar stukken uit een opname; dit blad vraagt naar wat er
 * in de app staat. Dat is wat je nodig hebt als een reeks is verschoven: de
 * opnames zijn goed, ze staan alleen onder de verkeerde naam, en de enige
 * manier om te weten hoeveel plaatsen is iemand die luistert.
 *
 * Per regel de opname zoals de app hem afspeelt, en een keuzelijst met alle
 * regels die het zou kunnen zijn. Twee of drie antwoorden zijn meestal genoeg
 * om de verschuiving uit te rekenen; de rest volgt.
 *
 * Draaien met:
 *   node scripts/make-hoorblad.mjs --ids huis-1-a,dieren-2-a,… [--uit blad.html]
 *   node scripts/make-hoorblad.mjs --soort zinnen --van 40 --tot 70
 */
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 4420
const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const UIT = arg('uit', path.join(ROOT, 'store', 'hoorblad.html'))
const IDS = (arg('ids', '') || '').split(',').map((s) => s.trim()).filter(Boolean)
const SOORT = arg('soort', null)
const VAN = Number(arg('van', 1))
const TOT = Number(arg('tot', 0))

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()
const browser = await startChroom()
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })

const alles = await page.evaluate(async () => {
  const [abc, lex, zin] = await Promise.all([
    import('/src/content/alphabet.ts'),
    import('/src/content/lexicon.ts'),
    import('/src/content/sentences.ts'),
  ])
  return [
    ...abc.LETTERS.map((l) => ({ id: l.id, ar: l.ar, tr: l.tr, nl: `de letter ${l.name}`, map: 'letters' })),
    ...lex.allWords.map((w) => ({ id: w.id, ar: w.ar, tr: w.tr, nl: w.nl, map: 'woorden' })),
    ...zin.ALL_SENTENCES.map((z) => ({ id: z.id, ar: z.ar, tr: z.tr, nl: z.nl, map: 'zinnen' })),
  ]
})
await browser.close()
await server.close()

const opId = new Map(alles.map((i) => [i.id, i]))
/** Waar je uit kunt kiezen: alles van dezelfde soort, want daarbinnen schuift het. */
const soortVan = (id) => opId.get(id)?.map
const gevraagd = IDS.length
  ? IDS
  : alles.filter((i) => i.map === SOORT).slice(VAN - 1, TOT || undefined).map((i) => i.id)
if (!gevraagd.length) {
  console.error('geen regels gevraagd: gebruik --ids of --soort met --van/--tot')
  process.exit(1)
}
const soort = soortVan(gevraagd[0])
const keuzes = alles.filter((i) => i.map === soort)

/** De opnames reizen mee, want het gaat om wat je hoort. */
const klank = {}
for (const map of new Set(gevraagd.map(soortVan))) {
  for (const f of await readdir(path.join(ROOT, 'src', 'audio', map)).catch(() => [])) {
    const id = f.replace(/\.[^.]+$/, '')
    if (!gevraagd.includes(id)) continue
    const ext = path.extname(f).slice(1).toLowerCase()
    const type = ext === 'm4a' ? 'audio/mp4' : ext === 'wav' ? 'audio/wav' : `audio/${ext}`
    const bytes = await readFile(path.join(ROOT, 'src', 'audio', map, f))
    klank[id] = `data:${type};base64,${bytes.toString('base64')}`
  }
}

const rijen = gevraagd.map((id) => ({ ...opId.get(id), bron: klank[id] ?? null }))
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wat hoor je hier?</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&family=Noto+Naskh+Arabic:wght@400;700&display=swap">
<style>
  :root{--ground:#fbf6ee;--panel:#fff;--sunken:#f3ebdd;--ink:#221a16;--ink-soft:#5f5449;
    --ink-faint:#8b8075;--line:#e4d8c5;--line-firm:#cfbfa6;--alam:#c1272d;--khatim:#006233;--zellige:#0f766e;
    --f-display:"Baloo 2",system-ui,sans-serif;--f-body:"IBM Plex Sans",system-ui,sans-serif;
    --f-mono:"IBM Plex Mono",monospace;--f-ar:"Noto Naskh Arabic",serif}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
    --ground:#15110e;--panel:#1e1813;--sunken:#261e18;--ink:#f4ece1;--ink-soft:#b5a798;
    --ink-faint:#8a7d70;--line:#35291f;--line-firm:#4b3a2b;--alam:#f08a8e;--khatim:#63c68c;--zellige:#5ccfc0}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--f-body);line-height:1.55}
  .wrap{max-width:46rem;margin:0 auto;padding:24px 16px 96px}
  .eyebrow{font-family:var(--f-mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint)}
  h1{font-family:var(--f-display);font-size:clamp(1.5rem,5vw,2rem);margin:4px 0 8px}
  .lede{color:var(--ink-soft);max-width:60ch}
  section{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:12px}
  section.klaar{border-color:var(--khatim)}
  .kop{display:flex;gap:12px;align-items:flex-start}
  button.speel{flex:0 0 auto;width:44px;height:44px;border-radius:13px;border:2px solid var(--zellige);
    background:transparent;color:var(--zellige);font-size:1rem;cursor:pointer}
  .staat{flex:1;min-width:0}
  .ar{font-family:var(--f-ar);direction:rtl;font-size:1.2rem;font-weight:700}
  .tr{font-family:var(--f-display);font-weight:800;color:var(--zellige)}
  .nl{font-size:.84rem;color:var(--ink-soft)}
  .nr{font-family:var(--f-mono);font-size:.7rem;color:var(--ink-faint)}
  label{display:block;font-size:.8rem;color:var(--ink-soft);margin-top:10px}
  select,input{width:100%;font-family:var(--f-body);font-size:.95rem;padding:9px 11px;border-radius:11px;
    border:1px solid var(--line-firm);background:var(--sunken);color:var(--ink);margin-top:4px}
  .uit{font-family:var(--f-mono);font-size:.82rem;white-space:pre-wrap;background:var(--sunken);
    border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:14px;user-select:all}
  .paneel{position:fixed;left:0;right:0;bottom:0;background:var(--panel);border-top:1px solid var(--line);
    padding:10px 16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  button.klein{font-family:var(--f-body);font-weight:600;font-size:.78rem;padding:8px 12px;border-radius:10px;
    border:1px solid var(--line-firm);background:var(--sunken);color:var(--ink-soft);cursor:pointer}
  .stand{font-family:var(--f-mono);font-size:.8rem;color:var(--ink-faint);align-self:center}
</style>
</head><body>
<div class="wrap">
  <p class="eyebrow">Darijaforkids</p>
  <h1>Wat hoor je hier?</h1>
  <p class="lede">
    Van ${rijen.length} regels staat de opname mogelijk onder de verkeerde naam.
    De opnames zelf zijn goed — ze zitten alleen een paar plaatsen verschoven, en
    alleen iemand die luistert kan zeggen hoeveel. Speel af, en kies in de lijst
    <strong>wat je werkelijk hoort</strong>. Twee of drie zijn meestal genoeg;
    daarmee reken ik de rest uit.
  </p>
  <div id="blad"></div>
  <div class="uit" id="uitvoer">Nog niets ingevuld.</div>
</div>
<div class="paneel">
  <span class="stand" id="stand"></span>
  <button class="klein" id="kopieer">Kopieer het antwoord</button>
  <button class="klein" id="wis">Begin opnieuw</button>
</div>
<script>
const RIJEN = ${JSON.stringify(rijen)}
const KEUZES = ${JSON.stringify(keuzes.map((k) => ({ id: k.id, tr: k.tr, nl: k.nl })))}
const blad = document.getElementById('blad')
const uitvoer = document.getElementById('uitvoer')
const stand = document.getElementById('stand')
let keus = {}
try { keus = JSON.parse(localStorage.getItem('darija.hoor') || '{}') } catch (e) {}
const bewaar = () => { try { localStorage.setItem('darija.hoor', JSON.stringify(keus)) } catch (e) {} }
let bezig = null
const speel = (bron) => { if (bezig) bezig.pause(); bezig = new Audio(bron); void bezig.play() }

function toon() {
  const ingevuld = RIJEN.filter((r) => keus[r.id])
  stand.textContent = ingevuld.length + ' van ' + RIJEN.length
  uitvoer.textContent = ingevuld.length
    ? ingevuld.map((r) => 'bij ' + r.id + ' hoor ik: ' + keus[r.id]).join('\\n')
    : 'Nog niets ingevuld.'
  for (const r of RIJEN) {
    document.getElementById('sec-' + r.id).classList.toggle('klaar', Boolean(keus[r.id]))
  }
}

for (const r of RIJEN) {
  const sec = document.createElement('section')
  sec.id = 'sec-' + r.id
  const kop = document.createElement('div')
  kop.className = 'kop'
  kop.innerHTML = '<button class="speel" type="button">\\u25B6</button>'
    + '<div class="staat"><div class="ar">' + r.ar + '</div>'
    + '<div><span class="tr">' + r.tr + '</span></div>'
    + '<div class="nl">' + r.nl + '</div>'
    + '<div class="nr">staat nu onder ' + r.id + '</div></div>'
  kop.querySelector('.speel').addEventListener('click', () => r.bron && speel(r.bron))
  sec.append(kop)

  const lab = document.createElement('label')
  lab.textContent = 'Wat hoor je werkelijk?'
  const kies = document.createElement('select')
  kies.innerHTML = '<option value="">— kies —</option>'
    + '<option value="klopt">dit klopt, ik hoor wat er staat</option>'
    + KEUZES.map((k) => '<option value="' + k.id + '">' + k.tr + ' — ' + k.nl + '</option>').join('')
  kies.value = keus[r.id] && KEUZES.some((k) => k.id === keus[r.id]) || keus[r.id] === 'klopt' ? keus[r.id] : ''
  kies.addEventListener('change', () => {
    if (kies.value) keus[r.id] = kies.value; else delete keus[r.id]
    bewaar(); toon()
  })
  lab.append(kies)
  sec.append(lab)
  blad.append(sec)
}
document.getElementById('kopieer').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(uitvoer.textContent) } catch (e) {}
})
document.getElementById('wis').addEventListener('click', () => { keus = {}; bewaar(); location.reload() })
toon()
</script>
</body></html>`

await writeFile(UIT, html)
console.log(`${rijen.length} regels, ${keuzes.length} keuzes`)
console.log(`${path.relative(ROOT, UIT)} — ${(html.length / 1024).toFixed(0)} kB`)
