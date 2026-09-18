/**
 * Waar het project staat, op één bladzijde.
 *
 * Niet uit het hoofd opgeschreven maar uit de app zelf gelezen: hoeveel
 * letters, woorden en zinnen er een stem hebben, welke regels van de
 * opnamelijst nog wachten, en in welke blokken die vallen. Een overzicht dat
 * uit de werkelijkheid komt loopt niet achter, en dat is het enige soort
 * overzicht dat na een week nog iets waard is.
 *
 * Draaien met: node scripts/make-stand.mjs [--uit <bestand>]
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4390
const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const UIT = arg('uit', path.join(ROOT, 'store', 'stand.html'))

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })

const data = await page.evaluate(async () => {
  const [clips, abc, lex, zin, op] = await Promise.all([
    import('/src/engine/clips.ts'),
    import('/src/content/alphabet.ts'),
    import('/src/content/lexicon.ts'),
    import('/src/content/sentences.ts'),
    import('/src/content/operator.ts'),
  ])
  // Letters horen er net zo goed bij: er staat er een op de opnamelijst, en
  // zonder die kennis telt hij als niet ingesproken terwijl hij er staat.
  const opId = new Map()
  for (const l of abc.LETTERS) opId.set(l.id, { ar: l.ar, tr: l.tr, nl: `de letter ${l.name}` })
  for (const w of lex.allWords) if (!opId.has(w.id)) opId.set(w.id, { ar: w.ar, tr: w.tr, nl: w.nl })
  for (const z of zin.ALL_SENTENCES) if (!opId.has(z.id)) opId.set(z.id, { ar: z.ar, tr: z.tr, nl: z.nl })
  return {
    telling: clips.clipCounts(),
    klaar: [...opId.keys()].filter((id) => clips.hasClip(id)),
    woord: Object.fromEntries(opId),
    uitgever: { ...op.OPERATOR, handelaar: op.traderKnown() },
  }
})
await browser.close()
await server.close()

const vast = JSON.parse(await readFile(path.join(ROOT, 'store', 'opnamelijst.json'), 'utf8'))
const klaar = new Set(data.klaar)
const rest = vast.ids.filter((id) => !klaar.has(id))
const GROOTTE = vast.blok || 20

/** Per blok: welke regels, hoeveel er al staan, en waar het begint. */
const blokken = []
for (let i = 0; i < vast.ids.length; i += GROOTTE) {
  const ids = vast.ids.slice(i, i + GROOTTE)
  const af = ids.filter((id) => klaar.has(id)).length
  blokken.push({
    nr: blokken.length + 1,
    van: i + 1,
    tot: i + ids.length,
    af,
    totaal: ids.length,
    eerste: data.woord[ids.find((id) => !klaar.has(id)) ?? ids[0]],
  })
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const t = data.telling
const balk = (af, totaal) => `<div class="balk"><span style="width:${(af / totaal) * 100}%"></span></div>`

const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Darijaforkids — de stand</title>
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
  body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--f-body);line-height:1.55}
  .wrap{max-width:46rem;margin:0 auto;padding:24px 16px 60px}
  .eyebrow{font-family:var(--f-mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint)}
  h1{font-family:var(--f-display);font-size:clamp(1.6rem,5vw,2.2rem);margin:4px 0 6px}
  h2{font-family:var(--f-display);font-size:1.15rem;margin:30px 0 10px}
  .lede{color:var(--ink-soft);max-width:60ch}
  .kaart{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;margin-top:12px}
  .rij{display:flex;gap:12px;align-items:baseline;justify-content:space-between;padding:7px 0}
  .rij + .rij{border-top:1px solid var(--line)}
  .naam{font-weight:600}
  .cijfer{font-family:var(--f-mono);font-size:.85rem;color:var(--ink-soft);white-space:nowrap}
  .balk{height:8px;border-radius:99px;background:var(--sunken);overflow:hidden;margin-top:6px}
  .balk span{display:block;height:100%;background:var(--khatim)}
  table{width:100%;border-collapse:collapse;font-size:.9rem}
  th,td{text-align:start;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
  th{font-family:var(--f-mono);font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-faint)}
  td.nr{font-family:var(--f-mono);color:var(--ink-faint);white-space:nowrap}
  .af{color:var(--khatim);font-weight:600}
  .open{color:var(--alam);font-weight:600}
  .ar{font-family:var(--f-ar);direction:rtl;font-size:1.1rem}
  .tr{font-family:var(--f-display);font-weight:800;color:var(--zellige)}
  ul{margin:8px 0 0;padding-inline-start:20px}
  li{margin:6px 0;color:var(--ink-soft)}
  li strong{color:var(--ink)}
  .vraag{border-inline-start:3px solid var(--saffron);padding-inline-start:12px}
  footer{margin-top:36px;color:var(--ink-faint);font-size:.8rem}
</style>
</head><body>
<div class="wrap">
  <p class="eyebrow">Darijaforkids · ${new Date().toISOString().slice(0, 10)}</p>
  <h1>Waar we staan</h1>
  <p class="lede">
    Alles hieronder is uit de app zelf gelezen, niet uit mijn hoofd opgeschreven.
    Wat hier groen staat, staat ook echt in de app.
  </p>

  <h2>De stem</h2>
  <div class="kaart">
    <div class="rij"><span class="naam">Letters</span><span class="cijfer">${t.letters} / ${t.lettersTotal}</span></div>
    ${balk(t.letters, t.lettersTotal)}
    <div class="rij"><span class="naam">Woorden</span><span class="cijfer">${t.woorden} / ${t.woordenTotal}</span></div>
    ${balk(t.woorden, t.woordenTotal)}
    <div class="rij"><span class="naam">Zinnen</span><span class="cijfer">${t.zinnen} / ${t.zinnenTotal}</span></div>
    ${balk(t.zinnen, t.zinnenTotal)}
  </div>
  <p class="lede" style="margin-top:12px">
    Van de opnamelijst van ${vast.ids.length} regels zijn er
    <strong>${vast.ids.length - rest.length}</strong> ingesproken en staan er
    <strong>${rest.length}</strong> open. De woorden die je goed vond blijven een
    computerstem houden; die tellen niet mee in wat er nog moet.
  </p>

  <h2>De blokken</h2>
  <table>
    <tr><th>Blok</th><th>Regels</th><th>Stand</th><th>Begint bij</th></tr>
    ${blokken.map((b) => `<tr>
      <td class="nr">${b.nr}</td>
      <td class="nr">${b.van}–${b.tot}</td>
      <td class="${b.af === b.totaal ? 'af' : 'open'}">${b.af === b.totaal ? 'klaar' : `${b.af} van ${b.totaal}`}</td>
      <td>${b.af === b.totaal ? '<span style="color:var(--ink-faint)">—</span>'
        : `<span class="ar">${esc(b.eerste?.ar)}</span> <span class="tr">${esc(b.eerste?.tr)}</span>`}</td>
    </tr>`).join('\n    ')}
  </table>

  <h2>Wat ik van jou nodig heb</h2>
  <div class="kaart vraag">
    <ul>
      <li><strong>Blok 4 nakijken.</strong> Je las twee regels door over de blokgrens heen —
        tweeëntwintig in plaats van twintig — dus ik heb ze tot en met regel 82 geplaatst.
        In <code>blok4-controle.html</code> staan twee rijen waar ik twijfel:
        <em>3end jeddi bgra w m3za</em> duurt maar 1,2 seconde en
        <em>ana ferhan lyum</em> juist 3,2.</li>
      <li><strong>Het adres van Venship</strong> — straat, postcode, plaats. Het laatste veld
        voordat de handelaarsgegevens compleet zijn; een postbus wordt niet geaccepteerd.</li>
      <li><strong>Btw-nummer</strong>, of de bevestiging dat je onder de kleineondernemersregeling valt.</li>
      <li><strong>Verkopersnaam</strong>: tonen de winkels <em>Venship</em> of <em>Darijaforkids</em>?</li>
      <li><strong>De letter خ (kha)</strong> — die opname is twee keer afgekeurd en wacht nog.</li>
      <li><strong>Domein en sociale media</strong>: <code>darijaforkids.app</code>,
        <code>darijaforkids.com</code> en <code>@darijaforkids</code> staan in de teksten maar
        zijn nog niet vastgelegd.</li>
    </ul>
  </div>

  <h2>Hoe je verdergaat</h2>
  <div class="kaart">
    <ul>
      <li>Neem op in blokken van ${GROOTTE}, met een halve seconde stilte tussen twee regels.</li>
      <li>Zeg erbij welk blok het is. De nummering ligt vast, dus die blijft kloppen.</li>
      <li>Een zin spreek je in één adem uit — alleen tussen de regels pauzeren.</li>
      <li>Verspreek je je? Doorgaan en de regel opnieuw zeggen; ik houd de tweede.</li>
      <li>Een spraakmemo van je telefoon is prima, elk formaat.</li>
    </ul>
  </div>

  <footer>
    Gemaakt met <code>npm run stand</code>. De opnamelijst is die van ${vast.gemaakt}.
  </footer>
</div>
</body></html>`

await writeFile(UIT, html)
console.log(`${vast.ids.length - rest.length} van ${vast.ids.length} ingesproken`)
console.log(`${path.relative(ROOT, UIT)} — ${(html.length / 1024).toFixed(0)} kB`)
