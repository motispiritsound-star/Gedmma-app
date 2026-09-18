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
import { readFile, readdir, writeFile } from 'node:fs/promises'
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
/**
 * Hoeveel regels je in één opname doet.
 *
 * Eén lange opname van honderdvijftig woorden is een half uur waarin één
 * verspreking alles erna een plaats laat opschuiven. Twintig is kort genoeg om
 * zonder morren over te doen, en lang genoeg om niet de hele avond te starten
 * en te stoppen.
 */
const BLOK = Number(arg('blok', 20))
/**
 * Alleen wat nog wacht, met de nummers die het al had.
 *
 * Een nieuwe lijst hernummert vanaf één, en dan wijst "blok 5" naar andere
 * regels dan toen hij werd voorgelezen. Met --rest blijft de vastgelegde
 * volgorde staan: wat is ingesproken valt weg, de rest houdt zijn nummer en
 * zijn blok. De vastlegging zelf wordt dan niet overschreven.
 */
const REST = process.argv.includes('--rest')
/**
 * Alles wat nog een mens nodig heeft, niet alleen de opnamelijst.
 *
 * OPNAME_NODIG is de lijst van wat geen enkele stem goed zegt. Maar er is meer
 * dat nog geen stem heeft: de woorden die met een geleende stem door de keuring
 * kwamen, en een letter waarvan de opname is afgekeurd. Wie de app helemaal in
 * één stem wil horen, heeft die lijst nodig — letters eerst, dan woorden, dan
 * zinnen, in de volgorde waarin de app ze leert.
 */
const ALLES = process.argv.includes('--alles')

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })

/** Wat er al is ingesproken, in welke map dan ook. */
const al = new Set()
for (const map of ['letters', 'woorden', 'zinnen']) {
  for (const f of await readdir(path.join(ROOT, 'src', 'audio', map)).catch(() => [])) {
    if (/\.(wav|webm|m4a|mp3|ogg)$/i.test(f)) al.add(f.replace(/\.[^.]+$/, ''))
  }
}

/** Met --rest de vastgelegde volgorde, anders de lijst zoals hij nu geldt. */
const vastgelegd = REST
  ? JSON.parse(await readFile(path.join(ROOT, 'store', 'opnamelijst.json'), 'utf8'))
  : null

const woorden = await page.evaluate(async ({ al, vast, alles }) => {
  const [eigen, lex, zin] = await Promise.all([
    import('/src/content/eigen.ts'),
    import('/src/content/lexicon.ts'),
    import('/src/content/sentences.ts'),
  ])
  // Een zin hoort in een andere map dan een woord, en die map staat in de
  // bestandsnaam eronder — anders landt een opname waar niemand hem zoekt.
  const opId = new Map()
  for (const l of (await import('/src/content/alphabet.ts')).LETTERS) {
    opId.set(l.id, { ar: l.ar, tr: l.tr, nl: `de letter ${l.name}`, emoji: '', map: 'letters' })
  }
  for (const w of lex.allWords) if (!opId.has(w.id)) opId.set(w.id, { ...w, map: 'woorden' })
  for (const z of zin.ALL_SENTENCES) if (!opId.has(z.id)) opId.set(z.id, { ...z, map: 'zinnen' })
  const bron = vast ?? (alles
    ? [
      ...(await import('/src/content/alphabet.ts')).LETTERS.map((l) => l.id),
      ...lex.allWords.map((w) => w.id),
      ...zin.ALL_SENTENCES.map((z) => z.id),
    ]
    : eigen.OPNAME_NODIG)
  return bron
    .map((id, i) => ({ id, nr: i + 1 }))
    .filter(({ id }) => !al.includes(id))
    .map(({ id, nr }) => {
      const w = opId.get(id)
      return w ? { id, nr, ar: w.ar, tr: w.tr, nl: w.nl, emoji: w.emoji ?? '', map: w.map } : null
    })
    .filter(Boolean)
}, { al: [...al], vast: vastgelegd?.ids ?? null, alles: ALLES })

await browser.close()
await server.close()

console.log(`${woorden.length} op de lijst (`
  + ['letters', 'woorden', 'zinnen']
    .map((m) => `${woorden.filter((w) => w.map === m).length} ${m}`)
    .join(', ') + ')')

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Darijaforkids — wat er ingesproken moet worden</title>
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
  ol.lijst{list-style:none;margin:0;padding:0}
  ol.lijst li.grens{border:0;background:none;padding:14px 0 6px;
    justify-content:center;color:var(--alam);font-weight:600;font-size:.8rem}
  ol.lijst li.grens::before{content:none}
  ol.lijst li{display:flex;gap:14px;align-items:baseline;
    background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:8px}
  ol.lijst li::before{content:attr(data-nr);font-family:var(--f-mono);font-size:.78rem;color:var(--ink-faint);
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
  <p class="eyebrow">Darijaforkids</p>
  <h1>${REST
    ? `Nog ${woorden.length} regels, vanaf nummer ${woorden[0]?.nr ?? 1}`
    : ALLES
      ? `Alles wat nog geen stem heeft — ${woorden.length} regels`
      : `Deze ${woorden.length} woorden, één voor één`}</h1>
  <p class="lede">
    ${REST
      ? 'Wat je al hebt ingesproken staat er niet meer op, maar de nummers zijn'
        + ' gebleven: regel 83 blijft regel 83, ook nu de regels ervoor weg zijn.'
        + ' Zo blijven de blokken kloppen.'
      : ALLES
        ? 'Alles in de app dat nog geen menselijke stem heeft, op volgorde: eerst de'
          + ' letters, dan de woorden zoals de lessen ze leren, dan de zinnen. Is dit'
          + ' af, dan zegt niets in de app nog iets met een computerstem.'
        : 'Van deze woorden staat er nog geen stem in de app: geen computerstem zegt'
          + ' ze goed, en wat er al aan opnames was is bij het nahoren afgekeurd.'}
    Zeg ze zoals je ze thuis zou zeggen — niet netjes, niet langzaam, gewoon normaal.
  </p>

  <div class="hoe">
    <strong class="tr" style="font-size:1rem">De snelste manier</strong>
    <ol>
      <li>Open <code>darijaforkids-demo.html</code> — het bestand dat je van mij
        kreeg — en tik onderin op <strong>Jij</strong>, dan op
        <strong>Aanpassen</strong>. Helemaal onderaan staat bij
        <em>Voor de makers</em> de knop <strong>Opnamestudio</strong>.</li>
      <li>Tik daar op <strong>WOORDEN</strong> (hij opent op Letters) en dan op
        <em>Liever alles achter elkaar inlezen?</em></li>
      <li>Tik op <strong>Opnemen</strong> en lees deze lijst voor, met steeds
        <strong>een adempauze van een halve seconde</strong> tussen twee woorden.</li>
      <li>Tik op <strong>Stop</strong>. De app knipt ze uit elkaar en zet ze
        onder de juiste naam klaar. Klopt het aantal, tik dan op
        <em>Alle opslaan</em>.</li>
    </ol>
  </div>

  <div class="let">
    <strong>Elk formaat mag.</strong> Een spraakmemo van een iPhone
    (<code>.m4a</code>) gaat net zo goed als <code>.wav</code> of
    <code>.webm</code> — die reken ik hier om. De studio in de app is wel het
    makkelijkst, want die levert meteen de goede namen. Neem je ze los op, noem
    het bestand dan naar de naam die onder elk woord staat, of spreek ze
    achter elkaar in en zeg erbij in welke volgorde.
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
      <li><strong>Neem op in blokken van twintig.</strong> De nummers naast de
        regels tellen door, dus zeg er bij elke opname bij welke nummers erin
        zitten. Eén lange opname van honderdvijftig woorden is een half uur
        waarin één verspreking alles erna een plaats laat opschuiven; een blok
        van twintig is in een minuut opnieuw gedaan.</li>
    </ol>
  </div>

  <h2>De lijst</h2>
  <ol class="lijst">
${woorden.map((w, i) => `${w.nr > 1 && (w.nr - 1) % BLOK === 0 ? `    <li class="grens"><span class="mid">— hier stoppen: blok ${(w.nr - 1) / BLOK + 1} begint —</span></li>\n` : ''}    <li data-nr="${w.nr}">
      <span class="ar">${esc(w.ar)}</span>
      <span class="mid">
        <span class="tr">${esc(w.tr)}</span>
        <span class="nl"> — ${esc(w.emoji)} ${esc(w.nl)}</span>
        <div class="naam">${esc(w.map)}/${esc(w.id)}.wav</div>
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

/**
 * De volgorde vastleggen, want die verschuift onder je handen.
 *
 * De lijst laat weg wat al een stem heeft. Zodra er een blok binnenkomt is de
 * lijst dus korter, en wijst "blok 3" naar heel andere regels dan toen hij werd
 * voorgelezen. Daarom schrijft de lijst zijn eigen volgorde weg: de knipper
 * telt zijn blokken daarin, niet in de lijst van vandaag.
 */
const SNAPSHOT = path.join(ROOT, 'store', 'opnamelijst.json')
if (!REST) await writeFile(SNAPSHOT, JSON.stringify({
  gemaakt: new Date().toISOString().slice(0, 10),
  blok: BLOK,
  ids: woorden.map((w) => w.id),
}, null, 2) + '\n')
console.log(REST
  ? `nummering overgenomen uit ${path.relative(ROOT, SNAPSHOT)} van ${vastgelegd.gemaakt}`
  : `volgorde vastgelegd in ${path.relative(ROOT, SNAPSHOT)}`)
console.log(`${path.relative(ROOT, UIT)} — ${(html.length / 1024).toFixed(0)} kB`)
