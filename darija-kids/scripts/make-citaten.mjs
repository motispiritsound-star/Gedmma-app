/**
 * Citaatplaten uit De sleutels van Marokko, voor het kanaal.
 *
 * Eén plaat per citaat, in vierkant en staand: de geschilderde plaat van het
 * deel als achtergrond, de zin eroverheen, en eronder waar hij vandaan komt —
 * reeks, deel, hoofdstuk — plus het adres van de leesboeken in de taal van de
 * plaat.
 *
 * Waarom een script en niet een ontwerpprogramma: hetzelfde argument als bij
 * `make-marketing.mjs`. Er zijn zes talen en vijftien delen, en een citaat dat
 * met de hand in een beeld is gezet moet met de hand opnieuw zodra er een woord
 * verandert. Zo is het één opdracht.
 *
 * **De zin wordt nagekeken.** Elk citaat hieronder wordt opgezocht in het
 * hoofdstuk waar het vandaan zegt te komen. Staat hij er niet — omdat er in het
 * boek iets is herschreven — dan stopt dit script met de naam van het citaat,
 * in plaats van een plaat te maken met een bronvermelding die niet klopt. Een
 * verkeerd toegeschreven citaat is erger dan geen citaat: de hele reeks wordt
 * verkocht op de belofte dat wat er staat, er ook echt staat.
 *
 * Draaien met:
 *   node scripts/make-citaten.mjs                  — alles, in het Nederlands
 *   node scripts/make-citaten.mjs --taal nl,fr     — meer talen
 *   node scripts/make-citaten.mjs --citaat 3-1     — er één, om te kijken
 *   node scripts/make-citaten.mjs --video          — ook bewegende fragmenten
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { startChroom } from './lib/chroom.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'brand', 'citaten')

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}

/**
 * De citaten, met de bron erbij.
 *
 * Met de hand gekozen en niet door een regel gevonden, want een goed citaat is
 * een oordeel. Wat ze gemeen hebben: ze staan allemaal vooraan in hun
 * hoofdstuk, ze vertellen in één zin wie er voor je staat, en geen ervan
 * verklapt iets.
 *
 * `hoofdstuk` is het nummer zoals het in het boek staat, niet de plek in de
 * reeks — dat scheelt als er ooit een hoofdstuk bij komt.
 */
const CITATEN = [
  { deel: 3, hoofdstuk: 1, zin: 'Hind was dertien en ze droeg water, en dat was alles wat iemand van haar wist.' },
  { deel: 6, hoofdstuk: 1, zin: 'Op de ochtend dat ze vertrokken, huilde Musa niet, en daar is hij later trots op geweest en heeft hij zich later voor geschaamd.' },
  { deel: 1, hoofdstuk: 1, zin: 'Tala werd wakker van de geur.' },
  { deel: 13, hoofdstuk: 1, zin: 'Nadia was veertien en ze rook naar inkt, en dat is haar hele jeugd in één zin.' },
  { deel: 8, hoofdstuk: 1, zin: 'Driss was veertien en hij sloeg de trom, en dat betekent iets anders dan je denkt.' },
  { deel: 5, hoofdstuk: 1, zin: 'Sanaa was veertien en ze kon inkt maken die niet verbleekte, en dat was in haar familie het enige wat telde.' },
  { deel: 12, hoofdstuk: 1, zin: 'Itto was vijftien en haar vader gaf les in een kamer met zeven kinderen en geen ramen.' },
  { deel: 11, hoofdstuk: 1, zin: 'Brahim was veertien en hij schreef brieven over die hij niet begreep.' },
  { deel: 2, hoofdstuk: 1, zin: 'Ayyur was twaalf en hij was goed in twee dingen: paarden en wachten.' },
]

/**
 * Wat er boven en onder het citaat staat, per taal.
 *
 * `voorlezen` zegt met opzet niet "luisterboek" en niet "met verteller". Het
 * voorlezen gebeurt met de stem van het toestel — dat is verscheept en het
 * werkt. De ingesproken vertelstem die `make-vertelstem.mjs` kan maken bestaat
 * nog niet: `store/lezen/luister/` is er niet en de worker heeft geen route
 * voor geluid. Op een beeld dat rondgestuurd wordt hoort geen belofte die de
 * koper niet kan innen.
 *
 * `toelichting` vertelt waar de reeks over gáát, en dat stond er eerst niet op.
 * Een citaat plus een omslag laat zien dat er een boek is; het zegt niet dat
 * dit tweeduizend jaar Marokkaanse geschiedenis is waarin één sleutel van kind
 * op kind overgaat. Dat is het hele idee van de reeks, en wie het beeld
 * doorgestuurd krijgt heeft geen flaptekst ernaast.
 *
 * `kort` is dezelfde gedachte voor het vierkant, waar minder hoogte is.
 */
const BRONWOORD = {
  nl: {
    reeks: 'De sleutels van Marokko', deel: 'Deel', hoofdstuk: 'Hoofdstuk', boeken: 'Leesboeken',
    voorlezen: 'Laat voorlezen',
    toelichting: 'Tweeduizend jaar Marokkaanse geschiedenis in vijftien verhalen. Eén sleutel gaat van kind tot kind, van eeuw tot eeuw.',
    kort: 'Eén sleutel door tweeduizend jaar Marokko, van kind tot kind.',
  },
  fr: {
    reeks: 'Les clés du Maroc', deel: 'Tome', hoofdstuk: 'Chapitre', boeken: 'Livres',
    voorlezen: 'Lecture à voix haute',
    toelichting: 'Deux mille ans d’histoire marocaine en quinze récits. Une même clé passe d’enfant en enfant, de siècle en siècle.',
    kort: 'Une clé à travers deux mille ans de Maroc, d’enfant en enfant.',
  },
  de: {
    reeks: 'Die Schlüssel Marokkos', deel: 'Band', hoofdstuk: 'Kapitel', boeken: 'Bücher',
    voorlezen: 'Vorlesen lassen',
    toelichting: 'Zweitausend Jahre marokkanische Geschichte in fünfzehn Geschichten. Ein Schlüssel wandert von Kind zu Kind, von Jahrhundert zu Jahrhundert.',
    kort: 'Ein Schlüssel durch zweitausend Jahre Marokko, von Kind zu Kind.',
  },
  es: {
    reeks: 'Las llaves de Marruecos', deel: 'Tomo', hoofdstuk: 'Capítulo', boeken: 'Libros',
    voorlezen: 'Lectura en voz alta',
    toelichting: 'Dos mil años de historia de Marruecos en quince relatos. Una misma llave pasa de niño en niño, de siglo en siglo.',
    kort: 'Una llave a través de dos mil años de Marruecos, de niño en niño.',
  },
  it: {
    reeks: 'Le chiavi del Marocco', deel: 'Volume', hoofdstuk: 'Capitolo', boeken: 'Libri',
    voorlezen: 'Lettura ad alta voce',
    toelichting: 'Duemila anni di storia del Marocco in quindici storie. Una chiave passa di bambino in bambino, di secolo in secolo.',
    kort: 'Una chiave attraverso duemila anni di Marocco, di bambino in bambino.',
  },
  en: {
    reeks: 'The Keys of Morocco', deel: 'Part', hoofdstuk: 'Chapter', boeken: 'Books',
    voorlezen: 'Read aloud',
    toelichting: 'Two thousand years of Moroccan history in fifteen stories. One key passes from child to child, from century to century.',
    kort: 'One key through two thousand years of Morocco, child to child.',
  },
}

/** De achtpuntige khatam uit het icoon, zodat elke post dezelfde afzender heeft. */
const ster = (cx, cy, r, vul) => {
  const punten = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 8
    const straal = i % 2 === 0 ? r : r * 0.42
    return `${(cx + Math.cos(a) * straal).toFixed(2)},${(cy + Math.sin(a) * straal).toFixed(2)}`
  })
  return `<polygon points="${punten.join(' ')}" fill="${vul}" />`
}

const merk = (maat) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maat} ${maat}" width="${maat}" height="${maat}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ffd166"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#e2603c"/>
  </linearGradient></defs>
  <rect width="${maat}" height="${maat}" rx="${maat * 0.22}" fill="#131b30"/>
  ${ster(maat / 2, maat / 2, maat * 0.36, 'url(#g)')}
  ${ster(maat / 2, maat / 2, maat * 0.17, '#0d9488')}
  <circle cx="${maat / 2}" cy="${maat / 2}" r="${maat * 0.055}" fill="#fffaf3"/>
</svg>`

/* ------------------------------------------------------------------ laden */

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
})
const { REEKS } = await server.ssrLoadModule('/src/content/sleutels.ts')
const { SITE_URL, PATHS } = await server.ssrLoadModule('/src/site/links.ts')

/** De hoofdstukken van één deel; elk deel woont in zijn eigen bestand. */
const hoofdstukkenVan = async (n) => {
  const mod = await server.ssrLoadModule(`/src/content/sleutels-deel${n}.ts`)
  const lijst = mod[`DEEL${n}_HOOFDSTUKKEN`]
  if (!lijst) throw new Error(`sleutels-deel${n}.ts heeft geen DEEL${n}_HOOFDSTUKKEN`)
  return lijst
}

/* --------------------------------------------------------------- nakijken */

const VIDEO = process.argv.includes('--video')
const gekozen = arg('citaat', null)
const werk = []

for (const c of CITATEN) {
  const naam = `${c.deel}-${c.hoofdstuk}`
  if (gekozen && gekozen !== naam) continue

  const deel = REEKS.find((d) => d.nummer === c.deel)
  if (!deel) throw new Error(`deel ${c.deel} staat niet in REEKS`)

  const hoofdstuk = (await hoofdstukkenVan(c.deel)).find((h) => h.nummer === c.hoofdstuk)
  if (!hoofdstuk) throw new Error(`deel ${c.deel} heeft geen hoofdstuk ${c.hoofdstuk}`)

  if (!hoofdstuk.tekst.some((alinea) => alinea.includes(c.zin))) {
    console.error(`\nDit citaat staat niet in deel ${c.deel}, hoofdstuk ${c.hoofdstuk}:\n`)
    console.error(`  "${c.zin}"\n`)
    console.error('Is de tekst in het boek herschreven? Zoek de zin op zoals hij nu luidt')
    console.error('en zet hem hierboven in CITATEN, of haal het citaat weg. Een plaat met')
    console.error('een bron die niet klopt, kost meer dan een plaat minder.\n')
    process.exit(1)
  }

  werk.push({ ...c, naam, deel, hoofdstuk })
}

if (!werk.length) {
  console.error(`\nGeen citaat gevonden${gekozen ? ` voor --citaat ${gekozen}` : ''}.`)
  console.error(`Wat er is: ${CITATEN.map((c) => `${c.deel}-${c.hoofdstuk}`).join(', ')}\n`)
  process.exit(1)
}

/* ----------------------------------------------------------------- tekenen */

/** Het lettertype als data in de pagina; zie make-social.mjs voor het waarom. */
const letter = async (gewicht) => {
  const bytes = await readFile(path.join(ROOT, 'public', 'fonts', `baloo2-${gewicht}.woff2`))
  return `@font-face { font-family: 'Baloo 2'; font-weight: ${gewicht}; src: url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2') }`
}
const LETTERS = (await Promise.all([600, 800].map(letter))).join('\n  ')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * De maat van de letter hangt af van de lengte van de zin.
 *
 * Eén vaste maat werkt niet: "Tala werd wakker van de geur." is dertig tekens
 * en de zin uit deel 6 is er honderdveertig. Met één maat is de eerste een
 * fluistering in een leeg vlak en loopt de tweede van de plaat af.
 */
const korps = (zin, w, ruim) => {
  const n = zin.length
  const deel = n < 45 ? 0.072 : n < 80 ? 0.056 : n < 120 ? 0.046 : 0.039
  return Math.round(w * deel * (ruim ? 1.14 : 1))
}

/** De warme achtergrond van het merk; dezelfde als op de andere posts. */
const WARM = 'linear-gradient(150deg,#ffd79a,#f0915c 58%,#e2603c)'

/**
 * De plaat wordt getoond, niet beschreven.
 *
 * Eerste poging was de plaat als achtergrond met de zin eroverheen. Dat kan
 * niet: deze platen zijn omslagen, met de titel van het deel er al in gedrukt.
 * Een citaat eroverheen leverde twee koppen over elkaar op en een titelblok dat
 * half buiten beeld viel. En kaal bestaan ze niet meer — `make-sleutelplaat.mjs`
 * zegt het zelf: *"het tafereel zónder tekst is er niet meer"*.
 *
 * Dus staat de omslag er nu als omslag: een boek met een schaduw, boven de
 * zin. Dat is voor een verkooppost ook het betere beeld — een lezer ziet het
 * ding dat hij kan kopen in plaats van een achtergrond.
 */
const kaart = (w, h, c, taal, beeld) => {
  const woord = BRONWOORD[taal]
  const adres = `${SITE_URL}${PATHS[taal].books}`.replace(/^https?:\/\//, '')
  const rand = Math.round(w * 0.075)
  const staand = h > w

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
  /* De afzender, op elke post dezelfde. */
  .afzender {
    flex: 0 0 auto; display: flex; align-items: center; gap: ${Math.round(w * 0.018)}px;
    font-size: ${Math.round(w * 0.030)}px; font-weight: 800;
    letter-spacing: .05em; text-transform: uppercase; color: #7a2d13;
    margin-bottom: ${Math.round(h * 0.026)}px;
  }
  .afzender .punt { opacity: .5 }
  /* De omslag, als een boek dat op tafel ligt. */
  /* In het vierkant iets smaller: daar moet dezelfde tekst in minder hoogte. */
  .omslag {
    position: relative; width: ${staand ? 100 : 74}%; margin: 0 auto; flex: 0 0 auto;
    border-radius: ${Math.round(w * 0.028)}px; overflow: hidden;
    box-shadow: 0 ${Math.round(w * 0.018)}px ${Math.round(w * 0.055)}px rgba(43,29,22,.42);
  }
  .omslag img { display: block; width: 100% }
  /* Dat er voorgelezen kan worden, hoort op het boek en niet in een voetnoot. */
  .luister {
    position: absolute; right: ${Math.round(w * 0.025)}px; bottom: ${Math.round(w * 0.025)}px;
    display: flex; align-items: center; gap: ${Math.round(w * 0.012)}px;
    background: rgba(23,16,12,.86); color: #ffd79a;
    border-radius: 999px; padding: ${Math.round(w * 0.013)}px ${Math.round(w * 0.028)}px;
    font-size: ${Math.round(w * 0.027)}px; font-weight: 800;
    backdrop-filter: blur(2px);
  }
  .citaat {
    flex: 1 1 auto; min-height: 0; overflow: hidden;
    display: flex; flex-direction: column; justify-content: center;
    padding: ${Math.round(h * (staand ? 0.038 : 0.028))}px 0;
  }
  .aanhaling {
    font-size: ${Math.round(w * 0.10)}px; font-weight: 800;
    line-height: .55; color: #a8431f; margin-bottom: ${Math.round(h * 0.012)}px;
  }
  /* Niet laten krimpen door flex: dan meet de krimplus hieronder niets. */
  blockquote {
    flex: 0 0 auto;
    font-size: ${korps(c.zin, w, staand)}px; font-weight: 800;
    line-height: 1.19; letter-spacing: -0.015em; color: #2b1d16;
  }
  .voet { flex: 0 0 auto }
  .streep {
    width: ${Math.round(w * 0.13)}px; height: ${Math.max(3, Math.round(w * 0.005))}px;
    background: #a8431f; border-radius: 999px;
    margin-bottom: ${Math.round(h * 0.018)}px;
  }
  .bron { font-size: ${Math.round(w * 0.029)}px; line-height: 1.42 }
  .reeks { font-weight: 800; color: #7a2d13; letter-spacing: .05em; text-transform: uppercase }
  .plek { font-weight: 600; opacity: .78 }
  .uitleg {
    margin-top: ${Math.round(h * 0.015)}px;
    font-size: ${Math.round(w * 0.028)}px; font-weight: 600;
    line-height: 1.35; opacity: .84; max-width: ${Math.round(w * 0.9)}px;
  }
  .adres {
    display: inline-block; margin-top: ${Math.round(h * 0.022)}px;
    font-size: ${Math.round(w * 0.030)}px; font-weight: 800;
    background: #2b1d16; color: #ffd79a; border-radius: 999px;
    padding: ${Math.round(w * 0.016)}px ${Math.round(w * 0.042)}px;
  }
</style>
<div class="afzender">
  ${merk(Math.round(w * 0.058))}
  <span>Darijaforkids</span><span class="punt">&middot;</span><span>${esc(woord.boeken)}</span>
</div>
<div class="omslag">
  <img src="data:image/webp;base64,${beeld}">
  <div class="luister">
    <svg width="${Math.round(w * 0.030)}" height="${Math.round(w * 0.030)}" viewBox="0 0 24 24" fill="none" stroke="#ffd79a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>
    </svg>
    <span>${esc(woord.voorlezen)}</span>
  </div>
</div>
<div class="citaat">
  <div class="aanhaling">&ldquo;</div>
  <blockquote>${esc(c.zin)}</blockquote>
</div>
<div class="voet">
  <div class="streep"></div>
  <div class="bron">
    <div class="reeks">${esc(woord.reeks)}</div>
    <div class="plek">${esc(woord.deel)} ${c.deel.nummer} &middot; ${esc(woord.hoofdstuk)} ${c.hoofdstuk.nummer} &middot; ${esc(c.hoofdstuk.titel)}</div>
  </div>
  <div class="uitleg">${esc(staand ? woord.toelichting : woord.kort)}</div>
  <div class="adres">${esc(adres)}</div>
</div>`
}

/**
 * De zin kleiner maken tot hij past, in de browser zelf.
 *
 * Schatten op tekenaantal ging twee keer mis. Eerst liep bij deel 3 de derde
 * regel dwars door de bronvermelding heen; daarna, met een lus die de
 * blockquote met zijn eigen vak vergeleek, werd de langste zin na één regel
 * afgesneden — want een flex-kind krimpt mee, en dan meet je een vak dat zich
 * al heeft aangepast in plaats van de tekst die er niet in past.
 *
 * Dus: de blockquote krimpt niet meer mee (`flex: 0 0 auto`), en we kijken of
 * het omhullende vak overloopt. Dat is de vraag die we echt stellen.
 *
 * Meten kost een paar milliseconden; raden kost een plaat.
 */
const passend = async (pagina) => {
  const gelukt = await pagina.evaluate(() => {
    const vak = document.querySelector('.citaat')
    const zin = document.querySelector('blockquote')
    let maat = parseFloat(getComputedStyle(zin).fontSize)
    // Twintig stappen van vier procent halen een zin desnoods tot op 44%.
    for (let i = 0; i < 20 && vak.scrollHeight > vak.clientHeight; i++) {
      maat *= 0.96
      zin.style.fontSize = `${maat}px`
    }
    return vak.scrollHeight <= vak.clientHeight
  })
  if (!gelukt) throw new Error('de zin past niet, ook niet verkleind — is het vlak te klein geworden?')
}

const FORMATEN = [
  { naam: 'vierkant', w: 1080, h: 1080 },
  { naam: 'verhaal', w: 1080, h: 1920 },
]

/**
 * Een bewegend fragment van dezelfde kaart, voor wie liever een filmpje post.
 *
 * Er is geen ffmpeg nodig: Chromium neemt zelf op. De kaart is dezelfde — er
 * gaat alleen langzaam beweging in de omslag en de zin komt op. Zeven seconden
 * is lang genoeg om de zin te lezen en kort genoeg om uitgekeken te worden.
 *
 * Het wordt een webm. WhatsApp en Instagram nemen dat aan; wil je mp4, dan zet
 * elke omzetter het om, maar dan heb je ffmpeg nodig en dat staat niet overal.
 */
const BEWEGING = `
<style>
  .omslag img { animation: duw 8s ease-out forwards; transform-origin: 55% 40% }
  @keyframes duw { from { transform: scale(1) } to { transform: scale(1.08) } }
  .citaat, .voet { animation: op .9s ease-out both }
  .citaat { animation-delay: .5s }
  .voet { animation-delay: 1.4s }
  @keyframes op { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
</style>`

const browser = await startChroom()
const pagina = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage()

for (const taal of arg('taal', 'nl').split(',')) {
  if (!BRONWOORD[taal]) throw new Error(`onbekende taal: ${taal}`)
  const map = path.join(UIT, taal)
  await mkdir(map, { recursive: true })

  for (const c of werk) {
    const plaat = path.join(ROOT, 'site-assets', 'sleutels', taal, `deel-${String(c.deel.nummer).padStart(2, '0')}.webp`)
    let beeld
    try {
      beeld = (await readFile(plaat)).toString('base64')
    } catch {
      console.error(`\nDe plaat van deel ${c.deel.nummer} ontbreekt in het ${taal}:`)
      console.error(`  ${path.relative(ROOT, plaat)}`)
      console.error('\nMaak hem met: npm run sleutelplaten\n')
      process.exit(1)
    }

    for (const f of FORMATEN) {
      await pagina.setViewportSize({ width: f.w, height: f.h })
      await pagina.setContent(kaart(f.w, f.h, c, taal, beeld))
      await pagina.evaluate(() => document.fonts.ready)
      await pagina.waitForTimeout(150)
      await passend(pagina)
      const romp = `deel${String(c.deel.nummer).padStart(2, '0')}-h${c.hoofdstuk.nummer}-${f.naam}`
      const bestand = path.join(map, `${romp}.png`)
      await pagina.screenshot({ path: bestand })
      console.log(path.relative(ROOT, bestand))

      if (!VIDEO) continue

      // Een eigen context per opname: Chromium schrijft het bestand pas weg
      // als de pagina dicht is, en de naam kiest hij zelf.
      const opname = await browser.newContext({
        viewport: { width: f.w, height: f.h },
        recordVideo: { dir: map, size: { width: f.w, height: f.h } },
      })
      const film = await opname.newPage()
      await film.setContent(kaart(f.w, f.h, c, taal, beeld) + BEWEGING)
      await film.evaluate(() => document.fonts.ready)
      await passend(film)
      await film.waitForTimeout(7000)
      const bron = await film.video().path()
      await opname.close()
      const doel = path.join(map, `${romp}.webm`)
      await rename(bron, doel)
      console.log(path.relative(ROOT, doel))
    }
  }
}

await browser.close()
await server.close()

await writeFile(
  path.join(UIT, 'README.md'),
  `# Citaatplaten\n\nGemaakt met \`npm run citaten\`. Niet met de hand bijwerken — de volgende\n` +
    `ronde overschrijft alles. Deze map staat in \`.gitignore\`; hij hoort niet in\n` +
    `de repository en komt met één opdracht terug.\n\n` +
    `Per taal een map, per citaat twee formaten: **vierkant** (1080×1080) voor een\n` +
    `WhatsApp-kanaal en de feed, **staand** (1080×1920) voor stories en Reels.\n` +
    (VIDEO
      ? `Naast elke plaat staat hetzelfde beeld als \`.webm\` van zeven seconden:\n` +
        `de omslag komt langzaam dichterbij en de zin komt op. WhatsApp en\n` +
        `Instagram nemen webm aan.\n`
      : `Met \`npm run citaten -- --video\` komt er naast elke plaat een bewegend\n` +
        `fragment van zeven seconden.\n`) +
    `\nWat er op staat: de omslag van het deel, een zin uit het boek zelf, waar die\n` +
    `zin vandaan komt, waar de reeks over gaat, dat er voorgelezen kan worden, en\n` +
    `het adres van de leesboeken in de taal van de plaat.\n\n` +
    `Elke zin wordt vóór het tekenen opgezocht in het hoofdstuk waar hij vandaan\n` +
    `zegt te komen. Klopt dat niet meer, dan stopt het script in plaats van een\n` +
    `plaat te maken met een verkeerde bron.\n\n` +
    werk.map((c) => `- \`${c.naam}\` — deel ${c.deel.nummer}, ${c.deel.titel}`).join('\n') +
    `\n\nDe bijschriften staan in [store/kanaal-sleutels.md](../../store/kanaal-sleutels.md).\n`,
)
console.log(`\n${werk.length} citaten, klaar`)
