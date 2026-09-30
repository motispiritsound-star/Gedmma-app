/**
 * Twee platen over de mensen waar iedereen naar vraagt.
 *
 * Ibn Battuta en Tariq ibn Ziyad zijn de namen die een ouder herkent en die
 * een bericht doorgestuurd krijgen. Ze verdienen een eigen beeld, los van de
 * citaatplaten, want ze verkopen niet één deel maar de hele reeks.
 *
 * **Geen portretten.** Er bestaat van geen van beiden een gelijkend beeld, en
 * een verzonnen gezicht van een vereerde historische figuur ligt gevoelig bij
 * precies het publiek dat dit moet bereiken. Wat er wél is: een route van
 * honderdtwintigduizend kilometer, en een zeestraat van veertien. Die vertellen
 * het verhaal beter dan een gezicht dat niemand kan controleren.
 *
 * Alles komt uit `lib/historie.mjs`, dezelfde bibliotheek die de omslagen en de
 * kaarten in de boeken tekent — zo is dit geen los ontwerp maar hetzelfde boek.
 *
 * Elke regel op deze platen staat in het veld `echt` van het deel. Wat daar
 * niet in staat, staat hier niet op: dat Tariq zijn schepen verbrandde is pas
 * eeuwen later opgeschreven en geldt niet als feit, dus staat dát erop en niet
 * het verhaal zelf.
 *
 * Draaien met:
 *   node scripts/make-helden.mjs
 *   node scripts/make-helden.mjs --wie battuta
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'
import { H, khatam, zellige } from './lib/historie.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'brand', 'helden')

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* ─────────────────────────────────────────────────────── de twee taferelen */

/**
 * De reis van Ibn Battuta, als één boog over een sterrenhemel.
 *
 * Niet op een wereldkaart: die wordt op een telefoon een vlek. Een boog met
 * acht halteplaatsen leest in twee seconden, en dat is alle tijd die je krijgt.
 */
const HALTES = ['Tanger', 'Caïro', 'Mekka', 'Delhi', 'Malediven', 'China', 'Mali', 'Tanger']

const reis = () => {
  const b = 1200, h = 440
  const punt = (i) => {
    const t = i / (HALTES.length - 1)
    return [110 + t * (b - 220), h - 120 - Math.sin(t * Math.PI) * 190]
  }
  const pad = HALTES.map((_, i) => {
    const [x, y] = punt(i)
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  return `<svg viewBox="0 0 ${b} ${h}" xmlns="http://www.w3.org/2000/svg">
    ${Array.from({ length: 46 }, (_, i) => {
      const x = ((i * 137) % b), y = ((i * 89) % (h - 140)), r = i % 5 === 0 ? 2.6 : 1.5
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${H.lichtGoud}" opacity="${i % 3 ? '.20' : '.34'}"/>`
    }).join('')}
    <path d="${pad}" fill="none" stroke="${H.goud}" stroke-width="3.5"
      stroke-linecap="round" stroke-dasharray="11 13" opacity=".85"/>
    ${HALTES.map((naam, i) => {
      const [x, y] = punt(i)
      const eind = i === 0 || i === HALTES.length - 1
      const onder = i % 2 === 1
      return `${khatam(x, y, eind ? 15 : 10, eind ? H.rood : H.goud)}
        <text x="${x.toFixed(1)}" y="${(y + (onder ? 46 : -30)).toFixed(1)}" text-anchor="middle"
          font-family="Georgia,serif" font-size="27" fill="${H.perkament}" opacity=".94">${esc(naam)}</text>`
    }).join('')}
  </svg>`
}

/**
 * De zeestraat, met de rots die zijn naam draagt.
 *
 * Veertien kilometer water tussen twee werelddelen: dat is het hele verhaal
 * van deel 2, en het is met twee kustlijnen te vertellen.
 */
const zeestraat = () => {
  const b = 1200, h = 440
  return `<svg viewBox="0 0 ${b} ${h}" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 78 L${b} 78 L${b} 0 L0 0 Z" fill="${H.zand}" opacity=".30"/>
    <path d="M0 78 C 220 96, 420 62, 610 84 S 980 70, ${b} 92 L${b} 0 L0 0 Z"
      fill="${H.steen}" opacity=".55"/>
    <path d="M0 372 C 240 350, 430 386, 640 358 S 990 380, ${b} 352 L${b} ${h} L0 ${h} Z"
      fill="${H.steen}" opacity=".7"/>
    <g fill="none" stroke="${H.lichtGoud}" stroke-width="2.2" opacity=".32" stroke-linecap="round">
      ${Array.from({ length: 7 }, (_, i) => {
        const y = 140 + i * 30
        return `<path d="M${60 + (i % 3) * 40} ${y} q 46 -13 92 0 t 92 0 t 92 0 t 92 0 t 92 0 t 92 0"/>`
      }).join('')}
    </g>
    ${/* De rots: Jabal Tariq, de berg van Tariq. */ ''}
    <g transform="translate(905 0)">
      <path d="M0 92 L58 -14 L116 92 Z" fill="${H.steen}" opacity=".95"/>
      ${khatam(58, 34, 13, H.rood)}
      <text x="58" y="136" text-anchor="middle" font-family="Georgia,serif" font-weight="bold"
        font-size="29" fill="${H.rood}">Jabal Tariq</text>
      <text x="58" y="168" text-anchor="middle" font-family="Georgia,serif" font-style="italic"
        font-size="24" fill="${H.perkament}" opacity=".8">Gibraltar</text>
    </g>
    ${/* De schepen, van zuid naar noord. */ ''}
    ${[[250, 300], [430, 258], [620, 286], [790, 236]].map(([x, y], i) => `
      <g transform="translate(${x} ${y}) scale(${(1 - i * 0.07).toFixed(2)})" opacity=".92">
        <path d="M-34 0 q 34 22 68 0 z" fill="${H.perkament}"/>
        <path d="M0 -2 L0 -54" stroke="${H.perkament}" stroke-width="3"/>
        <path d="M2 -52 L36 -12 L2 -12 Z" fill="${H.lichtGoud}"/>
      </g>`).join('')}
    <path d="M150 330 C 420 300, 700 274, 930 130" fill="none" stroke="${H.goud}"
      stroke-width="3.5" stroke-dasharray="11 13" stroke-linecap="round" opacity=".8"/>
    <text x="90" y="404" font-family="Georgia,serif" font-style="italic" font-size="26"
      fill="${H.perkament}" opacity=".75">Noord-Afrika</text>
    <text x="90" y="46" font-family="Georgia,serif" font-style="italic" font-size="26"
      fill="${H.perkament}" opacity=".75">Al-Andalus</text>
  </svg>`
}

/* ──────────────────────────────────────────────────────────── wat er staat */

const HELDEN = {
  battuta: {
    naam: 'Ibn Battuta',
    kop: 'Dertig jaar onderweg',
    jaar: '1325 – 1354',
    deel: 6,
    tafereel: reis,
    regels: [
      'Vertrok in 1325 uit Tanger, eenentwintig jaar oud, voor de bedevaart naar Mekka.',
      'Kwam bijna dertig jaar later terug. Meer dan honderdtwintigduizend kilometer — veel verder dan Marco Polo.',
      'Rechter in Delhi, rechter op de Malediven, gezant naar China. Zijn vloot verging bij de kust van India.',
      'Thuis dicteerde hij zijn verhaal aan Ibn Juzayy. Dat boek heet de Rihla.',
    ],
    kort: [
      'Vertrok in 1325 uit Tanger, eenentwintig jaar oud. Kwam dertig jaar later terug.',
      'Honderdtwintigduizend kilometer — veel verder dan Marco Polo.',
    ],
  },
  tariq: {
    naam: 'Tariq ibn Ziyad',
    kop: 'De overkant',
    jaar: '711',
    deel: 2,
    tafereel: zeestraat,
    regels: [
      'Een Amazigh-legerleider die in 711 met zijn leger de zeestraat overstak naar het zuiden van het huidige Spanje.',
      'Het grootste deel van dat leger bestond uit Amazigh-soldaten uit Noord-Afrika.',
      'De rots waar hij landde draagt nog zijn naam: Jabal Tariq, de berg van Tariq — verbasterd tot Gibraltar.',
      'Dat hij zijn schepen liet verbranden, is pas eeuwen later opgeschreven. Historici houden het niet voor een feit — en in het boek staat dat er eerlijk bij.',
    ],
    kort: [
      'Een Amazigh-legerleider die in 711 met zijn leger de zeestraat overstak.',
      'De rots waar hij landde heet nog Jabal Tariq — verbasterd tot Gibraltar.',
    ],
  },
}

/* ───────────────────────────────────────────────────────────────── tekenen */

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

const plaat = (w, h, held) => {
  const rand = Math.round(w * 0.075)
  const staand = h > w
  const band = Math.round(h * 0.022)

  return `<!doctype html><meta charset="utf-8"><style>
  ${LETTERS}
  * { margin: 0; box-sizing: border-box }
  body {
    width: ${w}px; height: ${h}px; overflow: hidden;
    background: ${H.nacht}; color: ${H.perkament};
    font-family: 'Baloo 2', 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif;
    display: flex; flex-direction: column;
    padding: ${band + Math.round(h * 0.03)}px ${rand}px ${band + Math.round(h * 0.03)}px;
    position: relative;
  }
  /* De zellige-banden boven en onder, net als op de omslagen. */
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
  .kop { flex: 0 0 auto }
  h1 {
    font-size: ${Math.round(w * (staand ? 0.088 : 0.078))}px; font-weight: 800;
    line-height: 1.04; letter-spacing: -0.02em; color: ${H.perkament};
  }
  .onderkop {
    margin-top: ${Math.round(h * 0.008)}px;
    font-size: ${Math.round(w * 0.036)}px; font-weight: 600; color: ${H.lichtGoud};
  }
  .jaar {
    display: inline-block; margin-left: ${Math.round(w * 0.014)}px;
    background: ${H.goud}; color: ${H.inkt}; border-radius: 999px;
    font-size: ${Math.round(w * 0.028)}px; font-weight: 800;
    padding: ${Math.round(w * 0.005)}px ${Math.round(w * 0.020)}px;
    vertical-align: ${staand ? 'middle' : 'baseline'};
  }
  /* Het tafereel vult de breedte. Met een vaste hoogte op een liggende viewBox
     laat de browser er lucht omheen en zweeft de route in een leeg vlak; dat
     was de eerste versie en het zag er verloren uit. */
  /* Een vaste hoogte, geen flex-rest. Toen het tafereel kreeg wat de vier
     tekstregels overlieten, was dat op een vierkant zo weinig dat de zeestraat
     een streepje werd. Het beeld is de reden dat iemand kijkt; de tekst mag
     krimpen, het beeld niet. */
  .tafereel {
    flex: 0 0 ${Math.round(h * (staand ? 0.24 : 0.30))}px;
    display: flex; align-items: center; justify-content: center;
    margin: ${Math.round(h * 0.022)}px ${Math.round(-w * 0.04)}px;
  }
  .tafereel svg { width: 100%; height: 100%; }
  .regels {
    flex: 1 1 auto; min-height: 0; overflow: hidden;
    display: flex; flex-direction: column; justify-content: center;
    gap: ${Math.round(h * 0.012)}px;
  }
  .regel {
    display: flex; gap: ${Math.round(w * 0.018)}px; align-items: flex-start;
    font-size: ${Math.round(w * (staand ? 0.030 : 0.026))}px; font-weight: 600;
    line-height: 1.32; opacity: .92;
  }
  .regel .stip {
    flex: 0 0 auto; width: ${Math.round(w * 0.012)}px; height: ${Math.round(w * 0.012)}px;
    border-radius: 999px; background: ${H.goud};
    margin-top: ${Math.round(w * 0.013)}px;
  }
  /* Onder elkaar, niet naast elkaar: "De sleutels van Marokko" naast een knop
     van vijfentwintig tekens brak over drie regels. */
  .voet {
    flex: 0 0 auto; margin-top: ${Math.round(h * 0.024)}px;
    display: flex; flex-direction: column; align-items: flex-start;
    gap: ${Math.round(h * 0.016)}px;
  }
  .bron { font-size: ${Math.round(w * 0.026)}px; font-weight: 800; line-height: 1.4 }
  .bron .reeks { color: ${H.lichtGoud}; letter-spacing: .05em; text-transform: uppercase }
  .bron .deel { font-weight: 600; opacity: .72 }
  .adres {
    flex: 0 0 auto;
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

<div class="kop">
  <h1>${esc(held.naam)}<span class="jaar">${esc(held.jaar)}</span></h1>
  <div class="onderkop">${esc(held.kop)}</div>
</div>

<div class="tafereel">${held.tafereel()}</div>

<div class="regels">
  ${(staand ? held.regels : held.kort).map((r) => `<div class="regel"><span class="stip"></span><span>${esc(r)}</span></div>`).join('')}
</div>

<div class="voet">
  <div class="bron">
    <div class="reeks">De sleutels van Marokko</div>
    <div class="deel">Deel ${held.deel} &middot; vijftien delen, 9 – 15 jaar</div>
  </div>
  <div class="adres">darijaforkids.eu/leesboeken</div>
</div>`
}

/* ───────────────────────────────────────────────────────────────── zetten */

const FORMATEN = [
  { naam: 'vierkant', w: 1080, h: 1080 },
  { naam: 'verhaal', w: 1080, h: 1920 },
]

const gekozen = arg('wie', null)
const lijst = Object.entries(HELDEN).filter(([id]) => !gekozen || id === gekozen)
if (!lijst.length) {
  console.error(`\nGeen held gevonden voor --wie ${gekozen}. Wat er is: ${Object.keys(HELDEN).join(', ')}\n`)
  process.exit(1)
}

await mkdir(UIT, { recursive: true })
const browser = await startChroom()
const pagina = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage()

for (const [id, held] of lijst) {
  for (const f of FORMATEN) {
    await pagina.setViewportSize({ width: f.w, height: f.h })
    await pagina.setContent(plaat(f.w, f.h, held))
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
  `# De twee trekpleisters\n\nGemaakt met \`npm run helden\`. Deze map staat in \`.gitignore\`.\n\n` +
    `Ibn Battuta en Tariq ibn Ziyad zijn de namen die een ouder herkent en die\n` +
    `een bericht doorgestuurd krijgen. Ze verkopen niet één deel maar de reeks,\n` +
    `en daarom hebben ze een eigen plaat naast de citaten.\n\n` +
    `**Geen portretten.** Van geen van beiden bestaat een gelijkend beeld, en een\n` +
    `verzonnen gezicht van een vereerde historische figuur ligt gevoelig bij juist\n` +
    `dit publiek. Wat er wel is: een route van honderdtwintigduizend kilometer en\n` +
    `een zeestraat van veertien.\n\n` +
    `Elke regel staat in het veld \`echt\` van het deel. Dat Tariq zijn schepen\n` +
    `verbrandde staat er dus niet op — wel dat het pas eeuwen later is\n` +
    `opgeschreven en niet als feit geldt.\n`,
)
console.log(`\n${lijst.length} × 2 platen, klaar`)
