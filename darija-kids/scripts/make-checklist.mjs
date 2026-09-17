/**
 * Zet de checklist uit LAUNCH.md om in een pagina die je kunt afvinken.
 *
 * Een markdown-bestand met `- [ ]` erin is een checklist voor wie het in een
 * editor opent en voor niemand anders. Dit maakt er één bestand van dat je
 * dubbelklikt: echte vakjes, die onthouden wat je aanvinkt, met de links waar
 * ze horen en een teller die zegt hoe ver je bent.
 *
 * De inhoud komt uit LAUNCH.md, niet uit een tweede lijst — anders lopen ze
 * uit elkaar en is de verkeerde de laatste die je leest.
 *
 * Draaien met: node scripts/make-checklist.mjs [--uit <bestand>]
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const UIT = arg('uit', path.join(ROOT, 'store', 'lanceer-checklist.html'))

const md = await readFile(path.join(ROOT, 'docs', 'LAUNCH.md'), 'utf8')

/* --------------------------------------------------------- uit de markdown */

const tussen = (van, tot) => {
  const a = md.indexOf(van)
  const b = tot ? md.indexOf(tot, a + van.length) : md.length
  return md.slice(a, b < 0 ? md.length : b)
}

const lijstDeel = tussen('## De checklist', '\n## 0. Vandaag nog')
const linkDeel = tussen('## Alle links op één plek')

/** De blokken met hun vinkjes, in de volgorde waarin ze in het plan staan. */
const blokken = []
for (const regel of lijstDeel.split('\n')) {
  const kop = regel.match(/^### (.+)$/)
  if (kop) { blokken.push({ titel: kop[1], punten: [] }); continue }
  const punt = regel.match(/^- \[([ x])\] (.+)$/)
  if (punt && blokken.length) {
    blokken[blokken.length - 1].punten.push({ af: punt[1] === 'x', tekst: punt[2] })
  }
}

/** De linktabellen, per kopje. */
const links = []
for (const regel of linkDeel.split('\n')) {
  const kop = regel.match(/^### (.+)$/)
  if (kop) { links.push({ titel: kop[1], rijen: [] }); continue }
  const rij = regel.match(/^\| (.+?) \| (.+?) \|$/)
  if (!rij || /^-+$/.test(rij[1]) || rij[1] === '' ) continue
  if (!links.length) continue
  links[links.length - 1].rijen.push({ wat: rij[1], waar: rij[2] })
}

const totaal = blokken.reduce((n, b) => n + b.punten.length, 0)
const af = blokken.reduce((n, b) => n + b.punten.filter((p) => p.af).length, 0)
console.log(`${blokken.length} blokken, ${totaal} vinkjes, ${af} al af`)
console.log(`${links.length} linktabellen, ${links.reduce((n, l) => n + l.rijen.length, 0)} links`)

/* ------------------------------------------------------------- de opmaak */

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/** Markdown die in één regel voorkomt: code, vet, en een kale URL. */
const rijk = (s) => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, tekst, url) =>
    url.startsWith('http') ? `<a href="${url}" target="_blank" rel="noreferrer">${tekst}</a>` : `<code>${tekst}</code>`)
  .replace(/(^|\s)(https:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noreferrer">$2</a>')
  .replace(/\(§([^)]+)\)/g, '<span class="para">§$1</span>')

const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Darijaforkids — lanceerchecklist</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&display=swap">
<style>
  :root {
    --ground:#fbf6ee; --panel:#fff; --sunken:#f3ebdd;
    --ink:#221a16; --ink-soft:#5f5449; --ink-faint:#8b8075;
    --line:#e4d8c5; --line-firm:#cfbfa6;
    --alam:#c1272d; --khatim:#006233; --zellige:#0f766e; --saffron:#d97706;
    --f-display:"Baloo 2","Trebuchet MS",system-ui,sans-serif;
    --f-body:"IBM Plex Sans",system-ui,sans-serif;
    --f-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --ground:#15110e; --panel:#1e1813; --sunken:#261e18;
    --ink:#f4ece1; --ink-soft:#b5a798; --ink-faint:#8a7d70;
    --line:#35291f; --line-firm:#4b3a2b;
    --alam:#f08a8e; --khatim:#63c68c; --zellige:#5ccfc0; --saffron:#f0a828;
  } }
  *{box-sizing:border-box}
  body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--f-body);line-height:1.55}
  .wrap{max-width:46rem;margin:0 auto;padding:24px 16px 80px}
  .eyebrow{font-family:var(--f-mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint)}
  h1{font-family:var(--f-display);font-size:clamp(1.7rem,6vw,2.4rem);margin:4px 0 6px}
  .lede{color:var(--ink-soft);max-width:54ch}
  h2{font-family:var(--f-display);font-size:1.15rem;margin:28px 0 10px;display:flex;align-items:baseline;gap:10px}
  h2 .van{font-family:var(--f-mono);font-size:.72rem;font-weight:500;color:var(--ink-faint);letter-spacing:.06em}

  .balk{position:sticky;top:0;z-index:5;background:var(--ground);padding:12px 0 10px;border-bottom:1px solid var(--line);margin-bottom:6px}
  .meter{height:12px;border-radius:99px;background:var(--sunken);overflow:hidden;border:1px solid var(--line)}
  .meter i{display:block;height:100%;background:var(--khatim);width:0;transition:width .25s ease}
  .stand{font-family:var(--f-mono);font-size:.78rem;color:var(--ink-soft);margin-top:7px;display:flex;gap:14px;flex-wrap:wrap}
  .stand b{color:var(--ink)}
  button.klein{font-family:var(--f-body);font-weight:600;font-size:.78rem;padding:5px 11px;border-radius:9px;
    border:1px solid var(--line-firm);background:var(--panel);color:var(--ink-soft);cursor:pointer}
  button.klein:hover{color:var(--ink)}

  ul{list-style:none;margin:0;padding:0;display:grid;gap:7px}
  li{background:var(--panel);border:1px solid var(--line);border-radius:13px}
  li label{display:flex;gap:11px;align-items:flex-start;padding:11px 13px;cursor:pointer}
  li input{appearance:none;flex:0 0 auto;width:22px;height:22px;margin-top:1px;border-radius:7px;
    border:2px solid var(--line-firm);background:var(--sunken);cursor:pointer;position:relative}
  li input:checked{background:var(--khatim);border-color:var(--khatim)}
  li input:checked::after{content:"";position:absolute;left:6px;top:2px;width:5px;height:11px;
    border:solid #fff;border-width:0 2.5px 2.5px 0;transform:rotate(42deg)}
  li.af{opacity:.55}
  li.af span.tekst{text-decoration:line-through;text-decoration-color:var(--ink-faint)}
  .tekst{min-width:0}
  code{font-family:var(--f-mono);font-size:.84em;background:var(--sunken);padding:1px 5px;border-radius:5px;
    border:1px solid var(--line);word-break:break-word}
  .para{font-family:var(--f-mono);font-size:.7rem;color:var(--ink-faint);white-space:nowrap}
  a{color:var(--zellige);word-break:break-word}

  table{width:100%;border-collapse:collapse;margin-top:4px}
  td{padding:7px 4px;border-bottom:1px solid var(--line);vertical-align:top;font-size:.9rem}
  td:first-child{width:38%;color:var(--ink-soft)}
  .vink{color:var(--khatim);font-weight:700}
  footer{margin-top:36px;padding-top:16px;border-top:1px solid var(--line);color:var(--ink-faint);font-size:.82rem}
</style>
</head><body>
<div class="wrap">
  <p class="eyebrow">Darijaforkids</p>
  <h1>Lanceerchecklist</h1>
  <p class="lede">
    Alles van "de app is af" tot "hij staat in de winkel", in de volgorde waarin
    het moet. Wat de code kon doen staat al aan. Je vinkjes blijven bewaard als
    je deze pagina later weer opent.
  </p>

  <div class="balk">
    <div class="meter"><i id="vuller"></i></div>
    <div class="stand">
      <span id="stand"></span>
      <span id="rest"></span>
      <button class="klein" id="wis" type="button">Alles uitvinken</button>
    </div>
  </div>

${blokken.map((b, bi) => `  <h2>${esc(b.titel)}<span class="van" id="tel-${bi}"></span></h2>
  <ul>
${b.punten.map((p, pi) => `    <li data-blok="${bi}">
      <label>
        <input type="checkbox" data-id="${bi}-${pi}"${p.af ? ' data-vast="1"' : ''}>
        <span class="tekst">${rijk(p.tekst)}</span>
      </label>
    </li>`).join('\n')}
  </ul>`).join('\n\n')}

  <h2>Alle links op één plek</h2>
  <p class="lede">De Apple-links zijn nagelopen en werken. De rest kon ik vanaf
  hier niet bereiken — ze staan op naam en zijn stabiel, maar loop ze even na.</p>
${links.map((l) => `  <h2 style="font-size:1rem;margin-top:18px">${esc(l.titel)}</h2>
  <table>
${l.rijen.map((r) => `    <tr><td>${rijk(r.wat)}</td><td>${rijk(r.waar).replace('✓', '<span class="vink">nagelopen</span>')}</td></tr>`).join('\n')}
  </table>`).join('\n')}

  <footer>
    Gemaakt uit <code>docs/LAUNCH.md</code> met <code>npm run checklist</code>, zodat de
    twee niet uit elkaar kunnen lopen. Staat daar de uitleg bij elke stap.
  </footer>
</div>

<script>
const VAST = ${JSON.stringify(blokken.flatMap((b, bi) => b.punten.map((p, pi) => (p.af ? `${bi}-${pi}` : null)).filter(Boolean)))}
const vakjes = [...document.querySelectorAll('input[type=checkbox]')]
let staat = {}
try { staat = JSON.parse(localStorage.getItem('darija.lanceer') || '{}') } catch (e) { staat = {} }
// Wat de code al gedaan heeft staat aan en blijft aan, tenzij je het zelf uitzet.
for (const id of VAST) if (!(id in staat)) staat[id] = true

const bewaar = () => { try { localStorage.setItem('darija.lanceer', JSON.stringify(staat)) } catch (e) {} }

function teken() {
  let af = 0
  const perBlok = {}
  for (const v of vakjes) {
    const id = v.dataset.id
    const aan = !!staat[id]
    v.checked = aan
    v.closest('li').classList.toggle('af', aan)
    const b = v.closest('li').dataset.blok
    perBlok[b] = perBlok[b] || { af: 0, n: 0 }
    perBlok[b].n++
    if (aan) { af++; perBlok[b].af++ }
  }
  const n = vakjes.length
  document.getElementById('vuller').style.width = (af / n * 100) + '%'
  document.getElementById('stand').innerHTML = '<b>' + af + ' van ' + n + '</b> gedaan'
  document.getElementById('rest').textContent = af === n ? 'klaar om in te dienen' : (n - af) + ' te gaan'
  for (const [b, t] of Object.entries(perBlok)) {
    const el = document.getElementById('tel-' + b)
    if (el) el.textContent = t.af + '/' + t.n
  }
}

for (const v of vakjes) {
  v.addEventListener('change', () => { staat[v.dataset.id] = v.checked; bewaar(); teken() })
}
document.getElementById('wis').addEventListener('click', () => { staat = {}; bewaar(); teken() })
teken()
</script>
</body></html>
`

await writeFile(UIT, html)
console.log(`${path.relative(ROOT, UIT)} — ${(html.length / 1024).toFixed(0)} kB`)
