/**
 * Eén plaat per reeks: waar de verhalen over gaan, in één beeld.
 *
 * De citaatplaten verkopen een deel en de heldenplaten een naam. Dit verkoopt
 * de reeks zelf — voor wie vraagt "wat is het eigenlijk?" en voor het bericht
 * dat je stuurt aan iemand die nog niets weet.
 *
 * **De sleutels van Marokko** krijgt zijn tijdlijn. Die staat al in
 * `lib/historie.mjs` en wordt ook achterin elk boek afgedrukt, dus wie de plaat
 * ziet en later het boek opslaat, herkent hem. Vijftien delen van Walili in het
 * jaar 200 tot een keukentafel in Utrecht, nu — en juist dat laatste deel is de
 * reden dat een ouder hier iets in ziet.
 *
 * **Sba de Atlasleeuw** krijgt zijn twaalf. Warm in plaats van nachtblauw, want
 * dit is voor kinderen van twee tot acht en hun ouders, en die lezen 's avonds
 * voor. Dezelfde omslag als op de verkooppagina.
 *
 * Draaien met:
 *   node scripts/make-reeksplaten.mjs
 *   node scripts/make-reeksplaten.mjs --wie sleutels
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { startChroom } from './lib/chroom.mjs'
import { H, khatam, sleutel, tijdbalk, zellige } from './lib/historie.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'brand', 'reeksplaten')

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* ------------------------------------------------------------------ laden */

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const { REEKS } = await server.ssrLoadModule('/src/content/sleutels.ts')
const { DELEN } = await server.ssrLoadModule('/src/content/prentenboek.ts')
const { SITE } = await server.ssrLoadModule('/src/site/copy.ts')
await server.close()

/* --------------------------------------------------------------- tekenen */

const letter = async (gewicht) => {
  const bytes = await readFile(path.join(ROOT, 'public', 'fonts', `baloo2-${gewicht}.woff2`))
  return `@font-face { font-family: 'Baloo 2'; font-weight: ${gewicht}; src: url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2') }`
}
const LETTERS = (await Promise.all([600, 800].map(letter))).join('\n  ')

const ster = (maat) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maat} ${maat}" width="${maat}" height="${maat}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ffd166"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#e2603c"/>
  </linearGradient></defs>
  <rect width="${maat}" height="${maat}" rx="${maat * 0.22}" fill="#131b30"/>
  ${khatam(maat / 2, maat / 2, maat * 0.36, 'url(#g)')}
  ${khatam(maat / 2, maat / 2, maat * 0.17, '#0d9488')}
  <circle cx="${maat / 2}" cy="${maat / 2}" r="${maat * 0.055}" fill="#fffaf3"/>
</svg>`

/**
 * De sleutel met zijn mijlpalen, voor het vierkant.
 *
 * De volle tijdbalk is vijftien regels hoog en past alleen staand. Op een
 * vierkant gaat het om de boog zelf: van een Romeinse stad naar een keukentafel
 * in Nederland. Zes jaartallen zijn genoeg om die boog te laten zien.
 */
const MIJLPALEN = [
  ['± 200', 'Walili'], ['859', 'Fes'], ['1325', 'Tanger'],
  ['1777', 'Salé'], ['1926', 'Het Rif'], ['Nu', 'Utrecht'],
]

const boog = () => {
  const b = 1200, h = 400
  const x = (i) => 250 + (i / (MIJLPALEN.length - 1)) * (b - 340)
  const y = (i) => 210 - Math.sin((i / (MIJLPALEN.length - 1)) * Math.PI) * 86
  return `<svg viewBox="0 0 ${b} ${h}" xmlns="http://www.w3.org/2000/svg">
    ${sleutel(120, 196, 0.86, H.goud)}
    <path d="${MIJLPALEN.map((_, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(i).toFixed(1)}`).join(' ')}"
      fill="none" stroke="${H.goud}" stroke-width="3.5" stroke-dasharray="11 13" stroke-linecap="round" opacity=".85"/>
    ${MIJLPALEN.map(([jaar, plek], i) => {
      const eind = i === MIJLPALEN.length - 1
      return `${khatam(x(i), y(i), eind ? 16 : 11, eind ? H.rood : H.goud)}
        <text x="${x(i).toFixed(1)}" y="${(y(i) - 34).toFixed(1)}" text-anchor="middle"
          font-family="'Baloo 2',system-ui,sans-serif" font-weight="800" font-size="30"
          fill="${eind ? H.rood : H.perkament}">${esc(jaar)}</text>
        <text x="${x(i).toFixed(1)}" y="${(y(i) + 46).toFixed(1)}" text-anchor="middle"
          font-family="Georgia,serif" font-style="italic" font-size="25"
          fill="${H.perkament}" opacity=".78">${esc(plek)}</text>`
    }).join('')}
  </svg>`
}

/** De volle tijdlijn, op perkament zoals achterin de boeken. */
const balk = () => `<div class="perkament">${tijdbalk(REEKS, -1)}</div>`

/* ------------------------------------------------------------- de platen */

const sleutelsPlaat = (w, h) => {
  const rand = Math.round(w * 0.075)
  const staand = h > w
  const band = Math.round(h * 0.022)

  return `<!doctype html><meta charset="utf-8"><style>
  ${LETTERS}
  * { margin: 0; box-sizing: border-box }
  body {
    width: ${w}px; height: ${h}px; overflow: hidden; position: relative;
    background: ${H.nacht}; color: ${H.perkament};
    font-family: 'Baloo 2', 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif;
    display: flex; flex-direction: column;
    padding: ${band + Math.round(h * 0.028)}px ${rand}px ${band + Math.round(h * 0.028)}px;
  }
  .band { position: absolute; left: 0; right: 0; height: ${band}px; opacity: .85 }
  .band.boven { top: 0 } .band.onder { bottom: 0 }
  .band svg { width: 100%; height: 100% }
  .afzender {
    flex: 0 0 auto; display: flex; align-items: center; gap: ${Math.round(w * 0.018)}px;
    font-size: ${Math.round(w * 0.028)}px; font-weight: 800;
    letter-spacing: .05em; text-transform: uppercase; color: ${H.lichtGoud};
    margin-bottom: ${Math.round(h * 0.020)}px;
  }
  .afzender .punt { opacity: .5 }
  h1 {
    flex: 0 0 auto;
    font-size: ${Math.round(w * (staand ? 0.080 : 0.072))}px; font-weight: 800;
    line-height: 1.04; letter-spacing: -0.02em;
  }
  .onderkop {
    flex: 0 0 auto; margin-top: ${Math.round(h * 0.008)}px;
    font-size: ${Math.round(w * 0.034)}px; font-weight: 600; color: ${H.lichtGoud};
  }
  .beeld {
    flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center;
    margin: ${Math.round(h * 0.022)}px ${staand ? 0 : Math.round(-w * 0.04)}px;
  }
  .beeld > svg { width: 100%; height: 100% }
  /* De tijdbalk is voor papier getekend en heeft dus een lichte ondergrond. */
  .perkament {
    width: 100%; height: 100%; background: ${H.perkament};
    border-radius: ${Math.round(w * 0.024)}px; overflow: hidden;
    padding: ${Math.round(w * 0.022)}px ${Math.round(w * 0.016)}px;
    display: flex; align-items: center;
  }
  .perkament svg { width: 100%; height: auto; max-height: 100% }
  .slot {
    flex: 0 0 auto;
    font-size: ${Math.round(w * (staand ? 0.032 : 0.030))}px; font-weight: 600;
    line-height: 1.34; opacity: .92;
  }
  .slot b { font-weight: 800; color: ${H.lichtGoud} }
  .voet {
    flex: 0 0 auto; margin-top: ${Math.round(h * 0.024)}px;
    display: flex; flex-direction: column; align-items: flex-start; gap: ${Math.round(h * 0.014)}px;
  }
  .bron { font-size: ${Math.round(w * 0.026)}px; font-weight: 600; opacity: .72 }
  .adres {
    font-size: ${Math.round(w * 0.028)}px; font-weight: 800;
    background: ${H.goud}; color: ${H.inkt}; border-radius: 999px;
    padding: ${Math.round(w * 0.015)}px ${Math.round(w * 0.036)}px;
  }
</style>
<div class="band boven"><svg viewBox="0 0 560 32" preserveAspectRatio="none">${zellige(0, 0, 560, 32, H.goud)}</svg></div>
<div class="band onder"><svg viewBox="0 0 560 32" preserveAspectRatio="none">${zellige(0, 0, 560, 32, H.goud)}</svg></div>

<div class="afzender">
  ${ster(Math.round(w * 0.055))}
  <span>Darijaforkids</span><span class="punt">&middot;</span><span>Leesboeken</span>
</div>
<h1>De sleutels van Marokko</h1>
<div class="onderkop">Vijftien delen &middot; tweeduizend jaar &middot; 9 – 15 jaar</div>

<div class="beeld">${staand ? balk() : boog()}</div>

<div class="slot">
  Eén bronzen sleutel gaat van hand tot hand, van kind tot kind. Van een Romeinse
  stad bij Meknès tot <b>een doos bij jeddti in Utrecht</b> — waar hij bij jou
  thuis aankomt.
</div>

<div class="voet">
  <div class="bron">De gebeurtenissen zijn echt. De kinderen die ze vertellen niet — en achterin elk deel staat precies wat wat is.</div>
  <div class="adres">darijaforkids.eu/leesboeken</div>
</div>`
}

const sbaPlaat = (w, h, omslag) => {
  const rand = Math.round(w * 0.075)
  const staand = h > w
  const WARM = 'linear-gradient(150deg,#ffd79a,#f0915c 58%,#e2603c)'
  /* De titels voluit. Eerst stond hier een regel die "Sba en de " wegknipte,
     en dan houd je "naar school" en "mijn land" over — dat leest als een
     boodschappenlijst. Twaalf keer zijn naam is voor een reeks geen herhaling
     maar het punt: de lezer moet die naam onthouden. */
  const titels = DELEN.map((d) => d.titel)

  return `<!doctype html><meta charset="utf-8"><style>
  ${LETTERS}
  * { margin: 0; box-sizing: border-box }
  body {
    width: ${w}px; height: ${h}px; overflow: hidden;
    background: ${WARM}; color: #2b1d16;
    font-family: 'Baloo 2', 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif;
    display: flex; flex-direction: column;
    padding: ${Math.round(h * (staand ? 0.05 : 0.042))}px ${rand}px;
  }
  .afzender {
    flex: 0 0 auto; display: flex; align-items: center; gap: ${Math.round(w * 0.018)}px;
    font-size: ${Math.round(w * 0.028)}px; font-weight: 800;
    letter-spacing: .05em; text-transform: uppercase; color: #7a2d13;
    margin-bottom: ${Math.round(h * 0.022)}px;
  }
  .afzender .punt { opacity: .5 }
  .top { flex: 0 0 auto; display: flex; gap: ${Math.round(w * 0.04)}px; align-items: center }
  .omslag {
    flex: 0 0 ${Math.round(w * (staand ? 0.36 : 0.30))}px;
    border-radius: ${Math.round(w * 0.024)}px; overflow: hidden;
    box-shadow: 0 ${Math.round(w * 0.016)}px ${Math.round(w * 0.05)}px rgba(43,29,22,.4);
  }
  .omslag img { display: block; width: 100% }
  h1 {
    font-size: ${Math.round(w * (staand ? 0.078 : 0.066))}px; font-weight: 800;
    line-height: 1.04; letter-spacing: -0.02em;
  }
  .onderkop {
    margin-top: ${Math.round(h * 0.008)}px;
    font-size: ${Math.round(w * 0.031)}px; font-weight: 600; color: #7a2d13;
  }
  .uitleg {
    flex: 0 0 auto; margin-top: ${Math.round(h * 0.024)}px;
    font-size: ${Math.round(w * (staand ? 0.031 : 0.028))}px; font-weight: 600;
    line-height: 1.34; opacity: .9;
  }
  .uitleg b { font-weight: 800 }
  .delen {
    flex: 1 1 auto; min-height: 0; overflow: hidden;
    margin: ${Math.round(h * 0.022)}px 0;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: ${Math.round(h * 0.009)}px ${Math.round(w * 0.03)}px;
    align-content: center;
  }
  .deel {
    display: flex; gap: ${Math.round(w * 0.014)}px; align-items: baseline;
    font-size: ${Math.round(w * 0.0225)}px; font-weight: 600; opacity: .92;
    line-height: 1.25;
  }
  .deel .nr {
    flex: 0 0 auto; font-weight: 800; color: #7a2d13;
    font-variant-numeric: tabular-nums;
  }
  .voet {
    flex: 0 0 auto; display: flex; flex-direction: column;
    align-items: flex-start; gap: ${Math.round(h * 0.014)}px;
  }
  .adres {
    font-size: ${Math.round(w * 0.028)}px; font-weight: 800;
    background: #2b1d16; color: #ffd79a; border-radius: 999px;
    padding: ${Math.round(w * 0.015)}px ${Math.round(w * 0.036)}px;
  }
</style>
<div class="afzender">
  ${ster(Math.round(w * 0.055))}
  <span>Darijaforkids</span><span class="punt">&middot;</span><span>Leesboeken</span>
</div>

<div class="top">
  <div class="omslag"><img src="data:image/webp;base64,${omslag}"></div>
  <div>
    <h1>Sba de Atlasleeuw</h1>
    <div class="onderkop">Twaalf prentenboeken &middot; 2 – 8 jaar</div>
  </div>
</div>

<div class="uitleg">
  Elke bladzijde is Nederlands, met <b>één woord Darija erin</b> — en de ontdekking
  van dat woord is het verhaal. Sba is een leeuw uit de Atlas; hij neemt zes
  kinderen mee door Marokko. <b>Voorlezen kan zonder dat je zelf Darija kent:</b>
  hoe je het woord zegt, staat er gewoon bij.
</div>

<div class="delen">
  ${titels.map((t, i) => `<div class="deel"><span class="nr">${i + 1}</span><span>${esc(t)}</span></div>`).join('')}
</div>

<div class="voet">
  <div class="adres">darijaforkids.eu/leesboeken</div>
</div>`
}

/**
 * De app, met het argument dat geen andere taal-app kan maken.
 *
 * Alle tekst komt uit `src/site/copy.ts`, dezelfde bron als de website. Dat is
 * geen netheid maar noodzaak: een cijfer dat hier wordt overgetypt loopt uit de
 * pas zodra er een opname bij komt, en dan staat er op een beeld dat maanden
 * rondgaat iets anders dan op de site waar het naartoe wijst.
 *
 * De kop is de derde uit `heroKop` — de taal van oma die in één generatie
 * verdwijnt. Dat is de sterkste zin in dit hele project en hij stond alleen op
 * de startpagina.
 *
 * **Geen winkelnamen en geen downloadknop.** De app ligt nog bij Apple en
 * Google in beoordeling. Tot hij er is staat er "binnenkort" en wijst de plaat
 * naar de website, want een beeld dat rondgestuurd wordt overleeft de dag
 * waarop je het maakt.
 */
const appPlaat = (w, h) => {
  const c = SITE.nl
  const rand = Math.round(w * 0.075)
  const staand = h > w
  const band = Math.round(h * 0.022)

  return `<!doctype html><meta charset="utf-8"><style>
  ${LETTERS}
  * { margin: 0; box-sizing: border-box }
  body {
    width: ${w}px; height: ${h}px; overflow: hidden; position: relative;
    background: ${H.nacht}; color: ${H.perkament};
    font-family: 'Baloo 2', 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif;
    display: flex; flex-direction: column;
    padding: ${band + Math.round(h * 0.030)}px ${rand}px ${band + Math.round(h * 0.030)}px;
  }
  .band { position: absolute; left: 0; right: 0; height: ${band}px; opacity: .85 }
  .band.boven { top: 0 } .band.onder { bottom: 0 }
  .band svg { width: 100%; height: 100% }
  .afzender {
    flex: 0 0 auto; display: flex; align-items: center; gap: ${Math.round(w * 0.018)}px;
    font-size: ${Math.round(w * 0.028)}px; font-weight: 800;
    letter-spacing: .05em; text-transform: uppercase; color: ${H.lichtGoud};
    margin-bottom: ${Math.round(h * 0.022)}px;
  }
  .afzender .punt { opacity: .5 }
  h1 {
    flex: 0 0 auto;
    font-size: ${Math.round(w * (staand ? 0.078 : 0.068))}px; font-weight: 800;
    line-height: 1.06; letter-spacing: -0.02em;
  }
  h1 em { font-style: normal; color: ${H.lichtGoud} }
  .stem {
    flex: 0 0 auto; margin-top: ${Math.round(h * 0.024)}px;
    font-size: ${Math.round(w * (staand ? 0.031 : 0.028))}px; font-weight: 600;
    line-height: 1.34; opacity: .9;
  }
  .stem b { font-weight: 800; color: ${H.lichtGoud} }
  .cijfers {
    flex: 1 1 auto; min-height: 0; overflow: hidden;
    margin: ${Math.round(h * 0.026)}px 0;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: ${Math.round(h * 0.018)}px ${Math.round(w * 0.04)}px; align-content: center;
  }
  .cijfer { display: flex; flex-direction: column; gap: ${Math.round(h * 0.003)}px }
  .cijfer .n {
    font-size: ${Math.round(w * 0.072)}px; font-weight: 800;
    line-height: 1; color: ${H.goud}; font-variant-numeric: tabular-nums;
  }
  .cijfer .w {
    font-size: ${Math.round(w * 0.024)}px; font-weight: 600;
    line-height: 1.3; opacity: .82;
  }
  .voet {
    flex: 0 0 auto; display: flex; flex-direction: column;
    align-items: flex-start; gap: ${Math.round(h * 0.014)}px;
  }
  .binnenkort {
    display: inline-flex; align-items: center; gap: ${Math.round(w * 0.012)}px;
    font-size: ${Math.round(w * 0.027)}px; font-weight: 800;
    color: ${H.lichtGoud};
  }
  .binnenkort .stip {
    width: ${Math.round(w * 0.013)}px; height: ${Math.round(w * 0.013)}px;
    border-radius: 999px; background: ${H.rood};
  }
  .adres {
    font-size: ${Math.round(w * 0.028)}px; font-weight: 800;
    background: ${H.goud}; color: ${H.inkt}; border-radius: 999px;
    padding: ${Math.round(w * 0.015)}px ${Math.round(w * 0.036)}px;
  }
</style>
<div class="band boven"><svg viewBox="0 0 560 32" preserveAspectRatio="none">${zellige(0, 0, 560, 32, H.goud)}</svg></div>
<div class="band onder"><svg viewBox="0 0 560 32" preserveAspectRatio="none">${zellige(0, 0, 560, 32, H.goud)}</svg></div>

<div class="afzender">
  ${ster(Math.round(w * 0.055))}
  <span>Darijaforkids</span><span class="punt">&middot;</span><span>De app</span>
</div>

<h1>De taal van oma verdwijnt in&nbsp;één generatie.<br><em>Tenzij je nu begint.</em></h1>

<div class="stem">
  Er <b>bestáát geen Darija-stem</b>. Elke synthesizer ter wereld is getraind op
  Standaardarabisch. Daarom is elk woord, elke zin en elke letter in deze app
  ingesproken door een Marokkaanse stem — één voor één.
</div>

<div class="cijfers">
  ${c.stemPunten.map(([n, wat]) => `<div class="cijfer"><span class="n">${esc(n)}</span><span class="w">${esc(wat)}</span></div>`).join('')}
</div>

<div class="voet">
  <div class="binnenkort"><span class="stip"></span><span>Binnenkort &middot; twee minuten per dag &middot; vanaf 6 jaar</span></div>
  <div class="adres">darijaforkids.eu</div>
</div>`
}

/* ---------------------------------------------------------------- zetten */

const FORMATEN = [
  { naam: 'vierkant', w: 1080, h: 1080 },
  { naam: 'verhaal', w: 1080, h: 1920 },
]

const omslagSba = (await readFile(path.join(ROOT, 'site-assets', 'boeken', 'sba.webp'))).toString('base64')

const PLATEN = {
  sleutels: (w, h) => sleutelsPlaat(w, h),
  sba: (w, h) => sbaPlaat(w, h, omslagSba),
  app: (w, h) => appPlaat(w, h),
}

const gekozen = arg('wie', null)
const lijst = Object.entries(PLATEN).filter(([id]) => !gekozen || id === gekozen)
if (!lijst.length) {
  console.error(`\nGeen plaat voor --wie ${gekozen}. Wat er is: ${Object.keys(PLATEN).join(', ')}\n`)
  process.exit(1)
}

await mkdir(UIT, { recursive: true })
const browser = await startChroom()
const pagina = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage()

for (const [id, maak] of lijst) {
  for (const f of FORMATEN) {
    await pagina.setViewportSize({ width: f.w, height: f.h })
    await pagina.setContent(maak(f.w, f.h))
    await pagina.evaluate(() => document.fonts.ready)
    await pagina.waitForTimeout(150)
    const bestand = path.join(UIT, `${id}-${f.naam}.png`)
    await pagina.screenshot({ path: bestand })
    console.log(path.relative(ROOT, bestand))
  }
}

await browser.close()

await writeFile(
  path.join(UIT, 'README.md'),
  `# De twee reeksen in één beeld\n\nGemaakt met \`npm run reeksplaten\`. Deze map staat in \`.gitignore\`.\n\n` +
    `De citaatplaten verkopen een deel, de heldenplaten een naam; deze twee\n` +
    `verkopen de reeks. Voor wie vraagt "wat is het eigenlijk?" en voor het\n` +
    `bericht aan iemand die nog niets weet.\n\n` +
    `**De sleutels van Marokko** — staand de volle tijdlijn van vijftien delen,\n` +
    `dezelfde die achterin elk boek staat. Vierkant een korte boog van zes\n` +
    `mijlpalen, want vijftien regels passen daar niet.\n\n` +
    `**Sba de Atlasleeuw** — warm in plaats van nachtblauw, want dit is voor\n` +
    `kinderen van twee tot acht en er wordt 's avonds uit voorgelezen.\n`,
)
console.log(`\n${lijst.length} × 2 platen, klaar`)
