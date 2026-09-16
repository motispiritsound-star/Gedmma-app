/**
 * Het blad waar je de woorden van afleest terwijl je ze inspreekt.
 *
 * De opnamestudio in de app laat ze ook zien, maar die staat op het scherm
 * waar je op moet tikken. Dit is er om naast je te leggen of uit te printen:
 * groot genoeg om van een armlengte te lezen, met per woord de bestandsnaam
 * eronder voor wie ze los opneemt.
 *
 * De lijst komt uit OPNAME_NODIG en uit de map met opnames, dus wat er al
 * ingesproken is staat er niet meer op.
 *
 * Draaien met: node scripts/make-opnamelijst.mjs [--uit <bestand>]
 */
import { readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4363

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const UIT = arg('uit', path.join(ROOT, 'store', 'opnamelijst.html'))

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })

const al = new Set(
  (await readdir(path.join(ROOT, 'src', 'audio', 'woorden')).catch(() => []))
    .map((f) => f.replace(/\.[^.]+$/, '')),
)

const woorden = await page.evaluate(async (al) => {
  const [eigen, lex] = await Promise.all([
    import('/src/content/eigen.ts'),
    import('/src/content/lexicon.ts'),
  ])
  const opId = new Map(lex.allWords.map((w) => [w.id, w]))
  return eigen.OPNAME_NODIG
    .filter((id) => !al.includes(id))
    .map((id) => {
      const w = opId.get(id)
      return w ? { id, ar: w.ar, tr: w.tr, nl: w.nl, emoji: w.emoji ?? '' } : null
    })
    .filter(Boolean)
}, [...al])

await browser.close()
await server.close()

console.log(`${woorden.length} woorden op de lijst`)

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Darija Kids — wat er ingesproken moet worden</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&family=Noto+Naskh+Arabic:wght@400;700&display=swap">
<style>
  :root {
    --ground:#fbf6ee; --panel:#fff; --sunken:#f3ebdd;
    --ink:#221a16; --ink-soft:#5f5449; --ink-faint:#8b8075;
    --line:#e4d8c5; --line-firm:#cfbfa6; --alam:#c1272d; --khatim:#006233; --zellige:#0f766e;
    --f-display:"Baloo 2",system-ui,sans-serif; --f-body:"IBM Plex Sans",system-ui,sans-serif;
    --f-mono:"IBM Plex Mono",ui-monospace,monospace; --f-ar:"Noto Naskh Arabic",serif;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --ground:#15110e; --panel:#1e1813; --sunken:#261e18;
    --ink:#f4ece1; --ink-soft:#b5a798; --ink-faint:#8a7d70;
    --line:#35291f; --line-firm:#4b3a2b; --alam:#f08a8e; --khatim:#63c68c; --zellige:#5ccfc0;
  } }
  *{box-sizing:border-box}
  body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--f-body);line-height:1.5}
  .wrap{max-width:44rem;margin:0 auto;padding:24px 16px 60px}
  .eyebrow{font-family:var(--f-mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint)}
  h1{font-family:var(--f-display);font-size:clamp(1.6rem,5.5vw,2.2rem);margin:4px 0 8px}
  .lede{color:var(--ink-soft);max-width:54ch}
  h2{font-family:var(--f-display);font-size:1.05rem;margin:26px 0 8px}
  .hoe{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:16px 0 8px}
  .hoe ol{margin:8px 0 0;padding-inline-start:20px}
  .hoe li{margin:5px 0}
  .let{border-inline-start:4px solid var(--alam);background:var(--panel);border-radius:0 12px 12px 0;padding:11px 14px;margin:14px 0}
  code{font-family:var(--f-mono);font-size:.85em;background:var(--sunken);padding:1px 5px;border-radius:5px;border:1px solid var(--line)}
  ol.lijst{list-style:none;margin:0;padding:0;counter-reset:w}
  ol.lijst li{counter-increment:w;display:flex;gap:14px;align-items:baseline;
    background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:8px}
  ol.lijst li::before{content:counter(w);font-family:var(--f-mono);font-size:.78rem;color:var(--ink-faint);
    min-width:1.6rem;text-align:end}
  .ar{font-family:var(--f-ar);direction:rtl;font-size:1.9rem;font-weight:700;line-height:1.35;min-width:5.5rem}
  .mid{min-width:0;flex:1}
  .tr{font-family:var(--f-display);font-weight:800;font-size:1.15rem;color:var(--zellige)}
  .nl{color:var(--ink-soft);font-size:.92rem}
  .naam{font-family:var(--f-mono);font-size:.72rem;color:var(--ink-faint);margin-top:2px}
  footer{margin-top:34px;padding-top:14px;border-top:1px solid var(--line);color:var(--ink-faint);font-size:.82rem}
  @media print {
    body{background:#fff} .hoe,.let{break-inside:avoid}
    ol.lijst li{break-inside:avoid;border-color:#ddd}
  }
</style>
</head><body>
<div class="wrap">
  <p class="eyebrow">Darija Kids</p>
  <h1>Deze ${woorden.length} woorden, één voor één</h1>
  <p class="lede">
    Van deze woorden is vastgesteld dat geen enkele computerstem ze goed zegt.
    Zeg ze zoals je ze thuis zou zeggen — niet netjes, niet langzaam, gewoon
    normaal.
  </p>

  <div class="hoe">
    <strong class="tr" style="font-size:1rem">De snelste manier</strong>
    <ol>
      <li>Open de demo, ga naar <strong>Jij → Opnemen → woorden</strong>.</li>
      <li>Tik op <em>Liever alles achter elkaar inlezen?</em></li>
      <li>Tik op <strong>Opnemen</strong> en lees deze lijst voor, met steeds
        <strong>een adempauze van een halve seconde</strong> tussen twee woorden.</li>
      <li>Tik op <strong>Stop</strong>. De app knipt ze uit elkaar en zet ze
        onder de juiste naam klaar. Klopt het aantal, tik dan op
        <em>Alle opslaan</em>.</li>
    </ol>
  </div>

  <div class="let">
    <strong>Stuur ze als <code>.wav</code> of <code>.webm</code>.</strong>
    Een spraakmemo van een iPhone is een <code>.m4a</code>, en daar kan ik hier
    niets mee — de studio in de app levert meteen het goede formaat en de goede
    namen. Neem je ze toch los op, noem het bestand dan naar de naam die onder
    elk woord staat.
  </div>

  <div class="hoe">
    <strong class="tr" style="font-size:1rem">Waar het op let</strong>
    <ol>
      <li>Een stille kamer. Geen muziek, geen afwasmachine.</li>
      <li>De telefoon op een armlengte, niet tegen je mond.</li>
      <li>Twijfel je over een woord? Sla het over en zeg het erbij — een woord
        dat verkeerd staat is erger dan een woord dat ontbreekt.</li>
      <li>Ga bij een verspreking gewoon door en zeg het woord opnieuw; los
        opnemen kan altijd nog.</li>
    </ol>
  </div>

  <h2>De lijst</h2>
  <ol class="lijst">
${woorden.map((w) => `    <li>
      <span class="ar">${esc(w.ar)}</span>
      <span class="mid">
        <span class="tr">${esc(w.tr)}</span>
        <span class="nl"> — ${esc(w.emoji)} ${esc(w.nl)}</span>
        <div class="naam">${esc(w.id)}.wav</div>
      </span>
    </li>`).join('\n')}
  </ol>

  <footer>
    Gemaakt met <code>npm run opnamelijst</code>. Wat al ingesproken is staat er
    niet meer op, dus draai hem opnieuw na elke ronde.
  </footer>
</div>
</body></html>
`

await writeFile(UIT, html)
console.log(`${path.relative(ROOT, UIT)} — ${(html.length / 1024).toFixed(0)} kB`)
