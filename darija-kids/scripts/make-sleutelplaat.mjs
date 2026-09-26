/**
 * De plaat bij een deel van De sleutels van Marokko, in de andere vijf talen.
 *
 * Voor Sba maakt `make-deelplaat.mjs` de plaat uit twee losse dingen: het
 * geschilderde tafereel ligt in `store/prentenboek/platen/`, en de tekst komt
 * uit de inhoud. Zes talen is dan zes keer hetzelfde tafereel met andere
 * woorden erop.
 *
 * Bij De sleutels kan dat niet. Daar bestaan vijf platen, met de hand gemaakt,
 * en het tafereel zónder tekst is er niet meer — alleen het eindresultaat met
 * het kaartje er al op. Een Franse bezoeker zag daardoor bij Sba twaalf
 * geïllustreerde delen en bij De sleutels niets, en dat is vijf van de zes
 * taalversies van de verkooppagina.
 *
 * Dus: het kaartje wordt overgezet. Een nieuw kaartje op precies dezelfde
 * plek, iets ruimer dan het oude zodat er niets van uitsteekt, met de titel in
 * de taal die je leest. De tekening eronder blijft van Adil; alleen de woorden
 * zijn vertaald.
 *
 * Het Nederlands blijft zoals het is. Dat is het origineel, en er is geen
 * reden om een handgemaakte plaat te overschilderen met een nagemaakte.
 *
 * Draaien met:
 *   node scripts/make-sleutelplaat.mjs              # alle talen behalve nl
 *   node scripts/make-sleutelplaat.mjs --taal fr
 *   node scripts/make-sleutelplaat.mjs --deel 3
 *   node scripts/make-sleutelplaat.mjs --groot      # 1600 × 900
 *
 * Voor deel 6 tot en met 15 bestaat geen geschilderd tafereel. Die krijgen
 * geen leeg vak maar een getekende banner in de stijl van de reeks: het
 * nachtblauw van de omslagen, de zellige-band, de hoekornamenten, en rechts de
 * kaart van Marokko met de plek van dít deel erop.
 *
 * Dat laatste is met opzet en het is geen vulling. Elke banner wijst een
 * andere plek aan — Essaouira, het Rif, de Hoge Atlas — en dat is precies wat
 * een lezer van de lijst wil weten voordat hij doorklikt. Het is geen
 * illustratie van het verhaal; dat blijft de opdracht in
 * `store/sleutels/beeldenlijst.md`.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'
import ffmpeg from 'ffmpeg-static'
import { H, kaart, zellige } from './lib/historie.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BRON = path.join(ROOT, 'site-assets', 'sleutels', 'nl')
const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
/**
 * Welke delen een met de hand gemaakt tafereel hebben.
 *
 * Niet afleiden uit "ligt er een bestand": de Nederlandse map is tegelijk
 * bron en bestemming, en dan leest de volgende ronde zijn eigen banner als
 * een tafereel en zet er nóg een kaartje op. Dat is een lus die er goed
 * uitziet tot je hem van dichtbij bekijkt.
 *
 * Deze vijf zijn van Adil. Komt er een zesde, dan hoort hij hier erbij.
 */
const GESCHILDERD = new Set([1, 2, 3, 4, 5])

const ALLEEN = arg('deel') ? Number(arg('deel')) : null
const GEVRAAGD = arg('taal', 'alles')
const TALEN = GEVRAAGD === 'alles' ? ['nl', 'fr', 'de', 'es', 'it', 'en'] : [GEVRAAGD]
const GROOT = process.argv.includes('--groot')
const BREED = GROOT ? 1600 : 1200
const HOOG = GROOT ? 900 : 675
const KWALITEIT = GROOT ? '86' : '78'

/* ------------------------------------------------------------------ laden */

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ REEKS }, { DELEN }, { SITE }] = await Promise.all([
  server.ssrLoadModule('/src/content/sleutels.ts'),
  server.ssrLoadModule('/src/site/delen.ts'),
  server.ssrLoadModule('/src/site/copy.ts'),
])
await server.close()

/** De korte plaatsnaam op de plaat — dezelfde als in de lijst op de website. */
const PLEK = [
  'Walili', 'Tanger', 'Fes', 'Marrakech', 'Ceuta', 'Tanger', 'Fes', 'Ksar el-Kebir',
  'Marrakech', 'Essaouira', 'Salé', 'Rif', 'Rabat', 'Rabat', 'Atlas',
]
const DEELWOORD = { nl: 'DEEL', fr: 'PARTIE', de: 'TEIL', es: 'PARTE', it: 'PARTE', en: 'PART' }

const [balo800, balo600] = await Promise.all([
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2')),
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-600.woff2')),
]).then((b) => b.map((x) => x.toString('base64')))

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * De accentkleur van dit deel, uit de plaat zelf.
 *
 * Elk deel heeft zijn eigen kleur op de balk links van het kaartje — turkoois
 * voor Fes, roest voor Marrakech, brons voor Ceuta. Die staat nergens
 * opgeschreven; hij zit in het beeld. Eén pixel uit die balk halen is
 * betrouwbaarder dan hem overtypen, en het blijft kloppen als er ooit een
 * plaat opnieuw gemaakt wordt.
 */
/**
 * De banner voor een deel zonder geschilderd tafereel.
 *
 * Alles komt uit `lib/historie.mjs`, dezelfde bibliotheek die de omslagen en
 * de kaarten in de boeken tekent. Zo is het geen los ontwerp maar hetzelfde
 * boek, uitgeklapt naar zestien bij negen.
 *
 * De kaart tekent zijn eigen perkamenten vlak; dat wordt hier weggehaald,
 * want hij ligt op nachtblauw.
 */
const getekend = (nummer) => {
  const plattegrond = kaart(nummer)
    .replace(/<rect width="1000" height="1180"[^>]*\/>/, '')
    .replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
  /* De kaart is staand (1000 × 1180) en de banner ligt. Hij vult de rechter
     helft op volle hoogte tussen de twee banden, en het kaartje met de titel
     staat links — dezelfde verdeling als op een geschilderd tafereel. */
  const hoog = 770
  const schaal = hoog / 1180
  const breed = 1000 * schaal
  return `<svg class="tafereel" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg">
    <rect width="1600" height="900" fill="${H.nacht}"/>
    <g transform="translate(${(1600 - breed - 80).toFixed(0)} ${((900 - hoog) / 2).toFixed(0)}) scale(${schaal.toFixed(4)})" opacity=".62">${plattegrond}</g>
    <g opacity=".9">
      <svg x="0" y="24" width="1600" height="30" viewBox="0 0 560 34" preserveAspectRatio="none">${zellige(0, 1, 560, 32, H.goud)}</svg>
      <svg x="0" y="846" width="1600" height="30" viewBox="0 0 560 34" preserveAspectRatio="none">${zellige(0, 1, 560, 32, H.goud)}</svg>
    </g>
  </svg>`
}

const accentVan = (bestand) => {
  const rauw = execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', bestand,
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1e9 })
  const i = (200 * 1600 + 56) * 3
  return `#${[rauw[i], rauw[i + 1], rauw[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/* ------------------------------------------------------------------ zetten */

/**
 * Het kaartje heeft een vaste maat, en dat is de hele truc.
 *
 * Het oude kaartje staat al op de tekening en gaat er niet meer af. Het nieuwe
 * moet het dus bedekken — en een kaartje dat met zijn tekst meegroeit is soms
 * kleiner dan het oude, en dan steekt er een hoek Nederlands onderuit. Vandaar
 * één maat, ruimer dan de grootste van de vijf, met de tekst verticaal
 * gecentreerd.
 *
 * De titel krimpt mee met zijn lengte in plaats van het kaartje te laten
 * groeien: "La ville qui n'existait pas encore" is bijna twee keer zo lang als
 * "De overkant".
 */
const titelmaat = (titel) => {
  const n = [...String(titel)].length
  return n <= 22 ? 76 : n <= 30 ? 64 : n <= 38 ? 54 : 46
}

const blad = (deel, taal, nummer, achtergrond, accent) => `<!doctype html><html lang="${taal}"><meta charset="utf-8"><style>
@font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo800}) format('woff2');font-weight:800}
@font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo600}) format('woff2');font-weight:600}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1600px;height:900px;overflow:hidden;position:relative;font-family:'Baloo 2',system-ui,sans-serif;
     transform-origin:0 0;transform:scale(${BREED / 1600})}
.tafereel{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.kaart{position:absolute;left:48px;top:30px;width:724px;height:372px;
  background:#ece4d7;border-radius:26px;padding:30px 44px 26px 46px;
  border-left:16px solid ${accent};border-top:6px solid ${H.goud};
  box-shadow:0 26px 60px -24px rgb(0 0 0 / 55%);
  display:flex;flex-direction:column;justify-content:center;gap:18px}
.reeks{font-weight:800;font-size:25px;letter-spacing:.04em;text-transform:uppercase;color:${H.inkt};opacity:.88;line-height:1.15}
.titel{font-weight:800;font-size:${titelmaat(deel.titel)}px;line-height:1.04;color:${H.inkt};letter-spacing:-.015em}
.voet{display:flex;align-items:center;gap:26px}
.pil{background:${accent};color:#fff;font-weight:800;font-size:25px;letter-spacing:.09em;
  padding:9px 30px;border-radius:999px;white-space:nowrap}
.waar{font-weight:600;font-size:31px;color:${H.inkt};opacity:.82;text-transform:uppercase;letter-spacing:.02em}
</style>
${achtergrond ? `<img class="tafereel" src="${achtergrond}" alt="">` : getekend(nummer)}
<div class="kaart">
  <div class="reeks">${esc(SITE[taal].plaatOndertitel)}</div>
  <div class="titel">${esc(deel.titel)}</div>
  <div class="voet">
    <span class="pil">${esc(DEELWOORD[taal] ?? DEELWOORD.nl)} ${nummer}</span>
    <span class="waar">${esc(deel.jaar)} · ${esc(deel.waar)}</span>
  </div>
</div>
</html>`

/* ------------------------------------------------------------------ maken */

const browser = await startChroom()
let gemaakt = 0
let overgeslagen = 0

for (const taal of TALEN) {
  const uit = path.join(ROOT, 'site-assets', 'sleutels', taal)
  await mkdir(uit, { recursive: true })

  for (const basis of REEKS) {
    if (ALLEEN && basis.nummer !== ALLEEN) continue
    const naam = `deel-${String(basis.nummer).padStart(2, '0')}.webp`
    const geschilderd = GESCHILDERD.has(basis.nummer)
    const tafereel = path.join(BRON, naam)
    /* Het Nederlands van een geschilderd deel is het origineel. Daar ligt de
       plaat al, met het kaartje er met de hand op; die zetten we niet over. */
    if (geschilderd && taal === 'nl') { overgeslagen += 1; continue }
    if (geschilderd && !existsSync(tafereel)) { overgeslagen += 1; continue }

    const titel = DELEN[taal].sleutels[basis.nummer - 1]
    const jaar = basis.jaar === 'Nu' ? SITE[taal].nu ?? basis.jaar : basis.jaar
    const deel = { titel, jaar, waar: PLEK[basis.nummer - 1] }
    /* Zonder tafereel geen kleur om uit te lezen. Dan het rood van de
       omslagen: daar staat het deelnummer ook in een rode pil, en wit op goud
       leest slechter dan wit op rood. */
    const accent = geschilderd ? accentVan(tafereel) : H.rood

    const htmlPad = path.join(tmpdir(), `.sleutelplaat-${taal}-${basis.nummer}.html`)
    await writeFile(htmlPad, blad(deel, taal, basis.nummer,
      geschilderd ? pathToFileURL(tafereel).href : null, accent), 'utf8')

    const bladzijde = await browser.newPage({ viewport: { width: BREED, height: HOOG }, deviceScaleFactor: 1 })
    await bladzijde.goto(pathToFileURL(htmlPad).href, { waitUntil: 'networkidle' })
    const png = path.join(uit, naam.replace(/\.webp$/, '.png'))
    await bladzijde.screenshot({ path: png })
    await bladzijde.close()
    await rm(htmlPad, { force: true })

    execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', png,
      '-c:v', 'libwebp', '-quality', KWALITEIT, '-compression_level', '6', '-preset', 'picture',
      png.replace(/\.png$/, '.webp')])
    await rm(png)
    gemaakt += 1
    console.log(`${taal}  deel ${String(basis.nummer).padStart(2, ' ')} — ${titel}  (${geschilderd ? accent : 'getekend'})`)
  }
}

await browser.close()
console.log(`\n${gemaakt} platen van ${BREED} × ${HOOG} in site-assets/sleutels/`)
if (overgeslagen) console.log(`${overgeslagen} keer overgeslagen — het Nederlands van een geschilderd deel is het origineel.\n`)
