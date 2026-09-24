/**
 * Zet De sleutels van Marokko: een deel, de hele reeks in één overzicht, of
 * de lijst met beelden die er nog bij gezocht moeten worden.
 *
 * Een leesboek is geen prentenboek: hier doet de tekst het werk. Maar een
 * lezer van elf kiest een boek in vier seconden van de plank, en die vier
 * seconden gaan over de omslag, het formaat en de eerste bladzijde die hij
 * openslaat. Deze reeks kleedt zich daarom als een echt geschiedenisboek en
 * niet als een schoolboek: een nachtblauwe omslag met de sleutel in goud, een
 * kaart met de plek erop, een tijdbalk waarop je ziet hoe ver terug dit is,
 * hoofdstukken die openen met een groot cijfer en een initiaal, en kaders met
 * wat er echt gebeurd is dwars door het verhaal heen.
 *
 * Achterin staat "Wat hiervan is echt gebeurd". Dat is geen bijlage maar het
 * beste deel van het boek, en het staat er daarom volledig in: wat waar is,
 * en wat verzonnen is, met zoveel woorden.
 *
 * Run with:
 *   node scripts/make-sleutels.mjs --deel 1
 *   node scripts/make-sleutels.mjs --opzet
 *   node scripts/make-sleutels.mjs --beeldenlijst
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'
import { H, hoekje, kaart, khatam, plaatVan, sleutel, tijdbalk, zellige } from './lib/historie.mjs'
import { schrijfOmslag } from './lib/omslag.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (naam, terugval = null) => {
  const gelijk = process.argv.find((a) => a.startsWith(`--${naam}=`))
  if (gelijk) return gelijk.slice(naam.length + 3)
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const OPZET = process.argv.includes('--opzet')
const LIJST = process.argv.includes('--beeldenlijst')
const NUMMER = Number(arg('deel', '1'))
const TAAL = arg('taal', 'nl')

/**
 * Voor wie dit exemplaar is; zie de uitleg in `make-prentenboek.mjs`.
 *
 * Bij een leesboek staat het in de voetregel naast het bladzijdenummer, waar
 * het niemand stoort en waar het op elke bladzijde staat.
 */
const VOOR = arg('voor', '')
const achtervoegsel = TAAL === 'nl' ? '' : `-${TAAL}`
const UIT = path.join(ROOT, 'store', 'sleutels',
  OPZET ? `de-reeks${achtervoegsel}.pdf` : `sleutels-${NUMMER}${achtervoegsel}.pdf`)

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
/** *schuin* wordt schuin. Meer opmaak heeft een roman niet nodig. */
const rijk = (t) => esc(t).replace(/\*([^*]+)\*/g, '<em>$1</em>')

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ REEKS }, talen, { rechtenVan }, ...delen] = await Promise.all([
  server.ssrLoadModule('/src/content/sleutels.ts'),
  server.ssrLoadModule('/src/content/sleutels-talen.ts'),
  server.ssrLoadModule('/src/content/rechten.ts'),
  ...Array.from({ length: 15 }, (_, i) => i + 1).map((n) => server.ssrLoadModule(`/src/content/sleutels-deel${n}.ts`)),
])
const { sleuteldeelIn, schilVanSleutel, SLEUTEL_VERTALINGEN } = talen
const S = schilVanSleutel(TAAL)
const DISCLAIMER = S.disclaimer
const RECHTEN = rechtenVan(TAAL)
await server.close()

/**
 * De reeks in de gevraagde taal.
 *
 * De tijdbalk en het blad "lees verder in deel zoveel" putten hieruit. Laat
 * je dat Nederlands staan, dan krijgt een Frans boek een Nederlandse tijdbalk
 * en een Nederlandse vooruitblik, wat opvalt op precies de verkeerde manier.
 */
const vertaling = SLEUTEL_VERTALINGEN[TAAL] ?? {}
const REEKS_T = REEKS.map((d) => {
  const v = vertaling[d.nummer]
  return v ? { ...d, titel: v.titel, jaar: v.jaar, waar: v.waar, flap: v.flap } : d
})

/** Welk deel is al geschreven. Een deel dat er niet is, krijgt alleen zijn opzet. */
const HOOFDSTUKKEN = Object.fromEntries(
  delen.map((mod, i) => [i + 1, mod[`DEEL${i + 1}_HOOFDSTUKKEN`]]),
)

const [balo800, balo600] = await Promise.all([
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2')),
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-600.woff2')),
]).then((b) => b.map((x) => x.toString('base64')))

/**
 * De opmaak.
 *
 * Twee soorten bladzijden: gewone met marges, en `vol` zonder — dat is wat
 * `@page vol{margin:0}` doet, en wat de omslag, de kaart en de platen tot aan
 * de snijrand laat lopen. Zonder die truc krijgt een geschiedenisboek de
 * uitstraling van een werkblad, en dat is precies de leeftijd die je ermee
 * kwijtraakt.
 */
const STIJL = `
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo800}) format('woff2');font-weight:800}
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo600}) format('woff2');font-weight:600}
  @page{size:A5;margin:19mm 16mm 20mm}
  @page vol{margin:0}
  *{margin:0;box-sizing:border-box}
  body{font-family:Georgia,'Times New Roman',serif;color:#241a13;font-size:11.3pt;line-height:1.62;
       -webkit-print-color-adjust:exact;print-color-adjust:exact}
  p{margin:0 0 3.5mm;text-align:justify;hyphens:auto}
  p.eerste{text-indent:0}
  p + p{text-indent:5mm;margin-top:-1mm}
  em{font-style:italic}
  h1,h2,h3{font-family:'Baloo 2',system-ui,sans-serif;font-weight:800;line-height:1.05}
  .vol{page:vol;width:148mm;height:210mm;overflow:hidden;page-break-after:always;position:relative}

  /* ── De omslag ─────────────────────────────────────────────────────── */
  .omslag{background:${H.nacht};color:${H.perkament};display:flex;flex-direction:column;
          align-items:center;justify-content:center;text-align:center;padding:16mm 14mm}
  .omslag .band{position:absolute;left:0;width:148mm;height:9mm;opacity:.9}
  .omslag .band.boven{top:9mm}.omslag .band.onder{bottom:9mm}
  .omslag .hoeken{position:absolute;inset:0}
  .omslag .reeksnaam{font-family:'Baloo 2';font-weight:800;font-size:11.5pt;letter-spacing:.32em;
                     text-transform:uppercase;color:${H.lichtGoud};margin-bottom:5mm}
  .omslag .sleutel{width:26mm;margin:0 auto 6mm}
  .omslag h1{font-size:33pt;letter-spacing:-.01em;margin-bottom:5mm;text-wrap:balance}
  .omslag .streep{width:34mm;height:2px;background:${H.goud};margin:0 auto 5mm}
  .omslag .jaar{font-family:'Baloo 2';font-weight:600;font-size:15pt;color:${H.lichtGoud};margin-bottom:2mm}
  .omslag .waar{font-size:10.5pt;font-style:italic;color:#c9c0ac;max-width:96mm;margin:0 auto}
  .omslag .merk{position:absolute;left:0;right:0;bottom:18mm;font-family:'Baloo 2';font-weight:600;
                font-size:9pt;letter-spacing:.2em;text-transform:uppercase;color:#8e9ab5}
  .omslag .deelnr{position:absolute;top:22mm;left:0;right:0;font-family:'Baloo 2';font-weight:800;font-size:9.5pt;
                  letter-spacing:.24em;text-transform:uppercase;color:${H.perkament}}
  .omslag .deelnr span{background:${H.rood};padding:2mm 5mm;border-radius:99px}

  /* ── Kaart, tijdbalk en platen ─────────────────────────────────────── */
  .plaatblad{background:${H.perkament};display:flex;flex-direction:column}
  .plaatblad .kop{font-family:'Baloo 2';font-weight:800;font-size:10pt;letter-spacing:.2em;
                  text-transform:uppercase;color:${H.perkament};background:${H.nacht};padding:6mm 14mm}
  .plaatblad .beeld{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
                    gap:6mm;padding:10mm 12mm;min-height:0}
  .plaatblad .lijst{border:1.5px solid ${H.inkt};padding:2.4mm;background:${H.perkament};
                    box-shadow:0 1.2mm 3.5mm rgba(36,26,19,.18);line-height:0}
  .plaatblad .lijst > svg{display:block;width:114mm;height:auto}
  .plaatblad .lijst > img{display:block;max-width:114mm;max-height:140mm;width:auto;height:auto}
  .plaatblad .soort{font-family:'Baloo 2',system-ui,sans-serif;font-weight:800;font-size:8.5pt;
                    letter-spacing:.24em;text-transform:uppercase;color:${H.rood}}
  .plaatblad .ornament{display:flex;align-items:center;gap:3mm;width:70mm}
  .plaatblad .ornament i{flex:1;height:1.2px;background:${H.goud};opacity:.7}
  .plaatblad .ornament svg{width:3.6mm;height:3.6mm;flex:none}
  .plaatblad .voet{padding:5mm 14mm 9mm;font-size:9.5pt;color:#6b5c47;font-style:italic;text-align:left}
  .balkblad .beeld{padding:8mm 6mm;justify-content:flex-start}
  .balkblad .beeld svg{width:100%;height:auto;max-height:none}

  /* ── Hoofdstukken ──────────────────────────────────────────────────── */
  .hfd{page-break-before:always}
  .opener{position:relative;margin-bottom:9mm;padding-top:14mm}
  .opener .cijfer{position:absolute;top:0;left:0;font-family:'Baloo 2';font-weight:800;font-size:56pt;
                  line-height:.8;color:${H.zand};opacity:.9;letter-spacing:-.04em}
  .opener .etiket{position:relative;font-family:'Baloo 2';font-weight:600;font-size:8.5pt;letter-spacing:.24em;
                  text-transform:uppercase;color:${H.rood};margin-bottom:2mm}
  .opener h2{position:relative;font-size:19pt;color:${H.inkt}}
  .opener .streep{position:relative;display:flex;align-items:center;gap:3mm;margin-top:4mm}
  .opener .streep i{flex:1;height:1.5px;background:${H.goud};opacity:.7}
  .opener .streep svg{width:4mm;height:4mm;flex:none}
  p.intro::first-letter{font-family:'Baloo 2';font-weight:800;font-size:31pt;line-height:.82;float:left;
                        margin:1mm 2mm 0 0;color:${H.rood}}

  /* ── Wist je dit ───────────────────────────────────────────────────── */
  .wist{background:${H.nacht};color:${H.perkament};border-radius:3mm;padding:6mm 7mm;margin:6mm 0 5mm;
        page-break-inside:avoid}
  .wist .kop{display:flex;align-items:center;gap:2.5mm;font-family:'Baloo 2';font-weight:800;font-size:9pt;
             letter-spacing:.22em;text-transform:uppercase;color:${H.lichtGoud};margin-bottom:3mm}
  .wist .kop svg{width:4.5mm;height:4.5mm}
  .wist p{text-indent:0;text-align:left;margin:0 0 2.5mm;font-size:10pt;line-height:1.5}
  .wist p:last-child{margin-bottom:0}

  /* ── Voorwerk en achterwerk ────────────────────────────────────────── */
  .let{background:#f6ecdc;border-left:3px solid ${H.goud};padding:5mm 6mm;margin-bottom:6mm}
  .let p{text-indent:0;margin-bottom:2.5mm;font-size:10.2pt;text-align:left}
  .let p:last-child{margin-bottom:0}
  .achterin{page-break-before:always}
  .achterin h2{font-size:17pt;color:${H.inkt};margin-bottom:5mm}
  .achterin h3{font-family:'Baloo 2';font-weight:800;font-size:10.5pt;letter-spacing:.14em;text-transform:uppercase;
               margin:7mm 0 2.5mm;color:${H.rood}}
  .achterin li{margin-bottom:2.5mm}
  .achterin ul{padding-left:5mm}
  .achterin .sleutelkader{display:flex;gap:5mm;align-items:flex-start;background:#f6ecdc;padding:5mm 6mm;border-radius:3mm}
  .achterin .sleutelkader svg{width:9mm;flex:none}
  .achterin .sleutelkader p{text-indent:0;margin:0;text-align:left}
  /* Van wie het is, en het verzoek het niet door te geven. Klein, achterin,
     en zonder dreigement — zie src/content/rechten.ts. */
  .achterin .rechten{text-indent:0;margin:7mm 0 0;font-size:8.2pt;line-height:1.5;
                     color:#6b5b48;text-align:left;border-top:.4mm solid #e4d8c2;padding-top:3mm}
  .wacht{page-break-before:always;color:#7a6a5d;font-style:italic}
  .verder{page-break-before:always;text-align:center;padding-top:30mm}
  .verder .etiket{font-family:'Baloo 2';font-weight:800;font-size:9pt;letter-spacing:.24em;
                  text-transform:uppercase;color:${H.rood};margin-bottom:4mm}
  .verder h2{font-size:21pt;margin-bottom:3mm}
  .verder .jaar{font-family:'Baloo 2';font-weight:600;font-size:12pt;color:${H.steen};margin-bottom:6mm}
  .verder p{text-align:center;text-indent:0;max-width:92mm;margin:0 auto}

  /* ── Het overzicht van de reeks ────────────────────────────────────── */
  .kaartje{page-break-inside:avoid;border-top:2px solid ${H.zand};padding:6mm 0 2mm}
  .kaartje .rij{display:flex;align-items:baseline;gap:3mm;margin-bottom:2mm}
  .kaartje .nr{font-family:'Baloo 2';font-weight:800;font-size:9pt;letter-spacing:.18em;text-transform:uppercase;
               color:${H.perkament};background:${H.rood};padding:1mm 3mm;border-radius:99px}
  .kaartje .jaar{font-family:'Baloo 2';font-weight:600;font-size:10.5pt;color:${H.steen}}
  .kaartje h2{font-size:15pt;margin-bottom:2mm}
`

/* ── De beelden ───────────────────────────────────────────────────────── */

/**
 * De beelden bij een deel.
 *
 * `store/sleutels/platen/<deel>/` met per beeld een bestand en een regel
 * ernaast in `bronnen.txt`: bestandsnaam, onderschrift, bron en licentie,
 * gescheiden door een verticale streep. Die regels komen achterin terecht als
 * verantwoording — bij foto's is dat geen nette gewoonte maar een voorwaarde,
 * en bij een boek dat verkocht wordt geldt dat dubbel.
 *
 * Voor deze reeks horen hier echte opnames en historische bronnen: de
 * mozaïekvloer van Walili, de binnenhof van de Qarawiyyin, de kaart van
 * al-Idrisi, de ruïne van het Badi-paleis. Een lezer van twaalf gelooft een
 * foto en herkent een plaatje. Zolang die map leeg is staat er de getekende
 * plaat uit `lib/historie.mjs` — dat is een noodverband, geen eindpunt, en
 * `--beeldenlijst` zegt precies welke opname waar hoort.
 */
const beelden = (nummer) => {
  const map = path.join(ROOT, 'store', 'sleutels', 'platen', String(nummer))
  if (!existsSync(map)) return []
  const regels = existsSync(path.join(map, 'bronnen.txt'))
    ? readFileSync(path.join(map, 'bronnen.txt'), 'utf8').split('\n')
    : []
  const bij = Object.fromEntries(regels
    .map((r) => r.split('|').map((d) => d.trim()))
    .filter((d) => d.length >= 2)
    .map(([bestand, onderschrift, bron = '']) => [bestand, { onderschrift, bron }]))
  return readdirSync(map)
    .filter((n) => /\.(jpe?g|png|webp)$/i.test(n))
    .sort()
    .map((n) => ({ pad: path.join(map, n), ...(bij[n] ?? { onderschrift: '', bron: '' }) }))
}

const ornament = `<div class="ornament"><i></i><svg viewBox="-20 -20 40 40">${khatam(0, 0, 18, H.goud)}</svg><i></i></div>`

const blad = (kop, beeld, voet, soort = '') => `<section class="vol plaatblad">
  <div class="kop">${esc(kop)}</div>
  <div class="beeld">
    ${soort ? `<div class="soort">${esc(soort)}</div>` : ''}
    <div class="lijst">${beeld}</div>
    ${ornament}
  </div>
  <div class="voet">${voet ? esc(voet) : ''}</div>
</section>`

const kaal = (kop, beeld, voet) => `<section class="vol plaatblad balkblad">
  <div class="kop">${esc(kop)}</div>
  <div class="beeld">${beeld}</div>
  <div class="voet">${voet ? esc(voet) : ''}</div>
</section>`

const fotoBlad = (b, kop) => blad(kop, `<img src="file://${b.pad}" alt="">`, b.onderschrift, 'Foto')

/* ── De bladzijden ────────────────────────────────────────────────────── */

const omslag = (deel) => `<section class="vol omslag">
  <svg class="band boven" viewBox="0 0 560 34" preserveAspectRatio="none">${zellige(0, 1, 560, 32, H.goud)}</svg>
  <svg class="band onder" viewBox="0 0 560 34" preserveAspectRatio="none">${zellige(0, 1, 560, 32, H.goud)}</svg>
  <svg class="hoeken" viewBox="0 0 560 794">
    ${hoekje(40, 96, 0.9, 0)}${hoekje(520, 96, 0.9, 90)}
    ${hoekje(520, 698, 0.9, 180)}${hoekje(40, 698, 0.9, 270)}
  </svg>
  <div class="deelnr"><span>${esc(S.deelVan(deel.nummer))}</span></div>
  <svg class="sleutel" viewBox="-90 -170 180 280">${sleutel(0, 0, 1, H.lichtGoud)}</svg>
  <div class="reeksnaam">${esc(S.reeksnaam)}</div>
  <h1>${esc(deel.titel)}</h1>
  <div class="streep"></div>
  <div class="jaar">${esc(deel.jaar)}</div>
  <div class="waar">${esc(deel.waar)}</div>
  <div class="merk">${esc(S.merk)}</div>
</section>`

const kaartBlad = (deel) =>
  kaal(S.waarSpeelt, kaart(deel.nummer), `${deel.waar}. ${S.kaartNoot}`)

const balkBlad = (deel) => kaal(S.inDeTijd, tijdbalk(REEKS_T, deel.nummer), S.balkNoot)

/**
 * De kaders met feiten, verdeeld over het boek.
 *
 * Wat achterin bij "Dit is echt gebeurd" staat, staat daar aan het eind — en
 * daar leest een kind het pas als hij het boek al uit heeft. Dezelfde feiten
 * halverwege een hoofdstuk, in een kader dat eruit springt, zijn de reden dat
 * hij het aan tafel navertelt. Ze staan dus twee keer, en dat is geen
 * verspilling maar het idee.
 */
const wistjedat = (regels) => `<aside class="wist">
  <div class="kop"><svg viewBox="-20 -20 40 40">${khatam(0, 0, 18, H.lichtGoud)}</svg>${esc(S.wistJeDit)}</div>
  ${regels.map((r) => `<p>${esc(r)}</p>`).join('')}
</aside>`

/** Feiten evenredig over de hoofdstukken uitstrooien, nooit twee achter elkaar. */
const verdeel = (feiten, aantal) => {
  const op = {}
  if (!aantal || !feiten.length) return op
  const stap = Math.max(1, Math.floor(aantal / (feiten.length + 1)))
  feiten.forEach((feit, i) => {
    const waar = Math.min(aantal - 1, (i + 1) * stap)
    ;(op[waar] ??= []).push(feit)
  })
  return op
}

const achterin = (deel) => `<section class="achterin">
  <h2>${esc(S.achterinKop)}</h2>
  <div class="let">${DISCLAIMER.map((r) => `<p>${esc(r)}</p>`).join('')}</div>
  <h3>${esc(S.echtKop)}</h3>
  <ul>${deel.echt.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
  <h3>${esc(S.verzonnenKop)}</h3>
  <ul>${deel.verzonnen.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
  <h3>${esc(S.sleutelKop)}</h3>
  <div class="sleutelkader">
    <svg viewBox="-90 -170 180 280">${sleutel(0, 0, 1, H.goud)}</svg>
    <p>${esc(deel.sleutel)}</p>
  </div>
  <p class="rechten">${esc(RECHTEN.kop)}<br>${esc(RECHTEN.zin)}</p>
</section>`

const verder = (deel) => {
  const na = REEKS_T.find((d) => d.nummer === deel.nummer + 1)
  return na ? `<section class="verder">
    <div class="etiket">${esc(S.leesVerder(na.nummer))}</div>
    <h2>${esc(na.titel)}</h2>
    <div class="jaar">${esc(na.jaar)} · ${esc(na.waar)}</div>
    <p>${esc(na.flap)}</p>
  </section>` : `<section class="verder">
    <div class="etiket">${esc(S.laatsteDeel)}</div>
    <h2>En nu is de sleutel van jou</h2>
    <p>Vijftien delen, tweeduizend jaar, en steeds hetzelfde stukje ijzer met een achtpuntige ster erop. Vraag thuis eens wat er in jullie doos zit.</p>
  </section>`
}

const verantwoording = (lijst) => lijst.length ? `<section class="achterin">
  <h2>${esc(S.beeldenKop)}</h2>
  <p class="eerste">${esc(S.beeldenNoot)}</p>
  <ul>${lijst.map((b) => `<li>${esc(b.onderschrift || path.basename(b.pad))}${b.bron ? ` — ${esc(b.bron)}` : ''}</li>`).join('')}</ul>
</section>` : ''

const deelBoek = (deel) => {
  const hfd = deel.hoofdstukken ?? []
  const plaatjes = beelden(deel.nummer)
  const feiten = verdeel(deel.echt, hfd.length)
  /* De getekende plaat staat er alleen zolang er geen opname van deze plek is. */
  const opening = plaatjes.length
    ? fotoBlad(plaatjes[0], deel.waar)
    : blad(deel.waar, plaatVan(deel.nummer), S.prentNoot, S.prent)

  return `<!doctype html><html lang="${TAAL}"><meta charset="utf-8"><style>${STIJL}</style><body>
${omslag(deel)}
${kaartBlad(deel)}
${balkBlad(deel)}
${opening}

<section class="hfd">
  <div class="opener">
    <div class="etiket">Voor je begint</div>
    <h2>De afspraak met de lezer</h2>
    <div class="streep"><i></i><svg viewBox="-20 -20 40 40">${khatam(0, 0, 18, H.goud)}</svg><i></i></div>
  </div>
  <div class="let">${DISCLAIMER.map((r) => `<p>${esc(r)}</p>`).join('')}</div>
  <p class="eerste">${esc(deel.flap)}</p>
  <p style="text-indent:0;margin-top:5mm"><em>Verteld door ${esc(deel.verteller)}.</em></p>
</section>

${hfd.map((h, i) => `<section class="hfd">
  <div class="opener">
    <div class="cijfer">${String(h.nummer).padStart(2, '0')}</div>
    <div class="etiket">${esc(S.hoofdstuk(h.nummer))}</div>
    <h2>${esc(h.titel)}</h2>
    <div class="streep"><i></i><svg viewBox="-20 -20 40 40">${khatam(0, 0, 18, H.goud)}</svg><i></i></div>
  </div>
  ${h.tekst.map((alinea, j) => `<p class="${j === 0 ? 'eerste intro' : ''}">${rijk(alinea)}</p>`).join('')}
  ${feiten[i] ? wistjedat(feiten[i]) : ''}
</section>${plaatjes[i + 1] ? fotoBlad(plaatjes[i + 1], deel.waar) : ''}`).join('')}

${hfd.length ? `<section class="wacht"><p class="eerste">Hier is deel ${deel.nummer} tot nu toe geschreven. De volgende hoofdstukken volgen.</p></section>` : ''}

${achterin(deel)}
${verantwoording(plaatjes)}
${verder(deel)}
</body></html>`
}

const opzet = () => `<!doctype html><html lang="${TAAL}"><meta charset="utf-8"><style>${STIJL}</style><body>
<section class="vol omslag">
  <svg class="band boven" viewBox="0 0 560 34" preserveAspectRatio="none">${zellige(0, 1, 560, 32, H.goud)}</svg>
  <svg class="band onder" viewBox="0 0 560 34" preserveAspectRatio="none">${zellige(0, 1, 560, 32, H.goud)}</svg>
  <svg class="hoeken" viewBox="0 0 560 794">
    ${hoekje(40, 96, 0.9, 0)}${hoekje(520, 96, 0.9, 90)}
    ${hoekje(520, 698, 0.9, 180)}${hoekje(40, 698, 0.9, 270)}
  </svg>
  <svg class="sleutel" viewBox="-90 -170 180 280">${sleutel(0, 0, 1, H.lichtGoud)}</svg>
  <div class="reeksnaam">${esc(S.reeksnaam)}</div>
  <h1>Vijftien delen</h1>
  <div class="streep"></div>
  <div class="jaar">Tweeduizend jaar, één sleutel</div>
  <div class="waar">Voor lezers vanaf negen jaar</div>
  <div class="merk">Darija for Kids</div>
</section>

${kaal('De hele reeks op één streep', tijdbalk(REEKS, 0), 'Van de Romeinse olijfpers tot een doos op een zolder in Utrecht.')}

<section class="hfd">
  <div class="opener">
    <div class="etiket">Voor je begint</div>
    <h2>De afspraak met de lezer</h2>
    <div class="streep"><i></i><svg viewBox="-20 -20 40 40">${khatam(0, 0, 18, H.goud)}</svg><i></i></div>
  </div>
  <div class="let">${DISCLAIMER.map((r) => `<p>${esc(r)}</p>`).join('')}</div>
  <p class="eerste">Elk deel wordt verteld door iemand die er toen leefde en die ongeveer even oud is als de lezer. De sleutel gaat van deel tot deel door, van hand tot hand, tot hij in het vijftiende deel op een zolder in Nederland ligt.</p>
</section>

${REEKS.map((deel) => `<section class="kaartje">
  <div class="rij"><span class="nr">Deel ${deel.nummer}</span><span class="jaar">${esc(deel.jaar)}</span></div>
  <h2>${esc(deel.titel)}</h2>
  <p class="eerste">${esc(deel.flap)}</p>
  <p style="text-indent:0"><em>${esc(deel.waar)}. Verteld door ${esc(deel.verteller)}.</em></p>
  ${wistjedat(deel.echt.slice(0, 2))}
</section>`).join('')}
</body></html>`

/* ── De beeldenlijst ──────────────────────────────────────────────────── */

/**
 * Welke opname waar hoort, per deel.
 *
 * Voor deze reeks koopt of zoekt de uitgever echte beelden; dit bestand zegt
 * welke. Publiek domein en vrije licenties zijn hier geen bezuiniging maar de
 * juiste bron: bij historisch materiaal is het origineel meestal oud genoeg
 * om rechtenvrij te zijn, en een museum of Wikimedia Commons noemt de maker
 * er netjes bij. Die naam gaat mee naar `bronnen.txt` en komt achterin het
 * boek te staan.
 */
const BEELDEN = {
  1: ['De mozaïekvloeren van Volubilis, in de open lucht', 'De boog van Caracalla', 'Een Romeinse olijfpers, opgegraven of nagebouwd', 'Het Zerhoun-gebergte vanaf de ruïnes'],
  2: ['De zeestraat van Gibraltar vanaf de Marokkaanse kust', 'De kasbah van Tanger', 'De rots van Gibraltar (Jebel Tariq) vanaf zee', 'Een middeleeuwse kaart van de zeestraat'],
  3: ['De binnenhof van de Qarawiyyin in Fes', 'De waterklok van Fes', 'Een handschrift uit de bibliotheek van de Qarawiyyin', 'De medina van Fes van bovenaf'],
  4: ['De Koutoubia-moskee in Marrakech', 'De Hoge Atlas met sneeuw, gezien vanaf de vlakte', 'Een khettara — de ondergrondse waterleiding', 'De stadsmuur van Marrakech in rode aarde'],
  5: ['De wereldkaart van al-Idrisi, met het zuiden boven', 'De Tabula Rogeriana', 'De kust van Ceuta', 'De kathedraal van Palermo, gebouwd onder Roger II'],
  6: ['Het graf van Ibn Battuta in Tanger', 'De grote moskee van Djenné', 'Een kameelkaravaan in de Sahara', 'De Kaaba in Mekka, oude opname'],
  7: ['Een portret dat doorgaat voor Leo Africanus', 'De eerste druk van zijn Beschrijving van Afrika', 'De Engelenburcht in Rome', 'De bibliotheek van het Vaticaan'],
  8: ['De rivier de Loukkos bij Ksar el-Kebir', 'Het slagveld van de Drie Koningen op een oude prent', 'Een Portugees harnas uit de zestiende eeuw', 'Het graf van koning Sebastiaan in Lissabon'],
  9: ['De ruïne van het Badi-paleis in Marrakech', 'Een ooievaarsnest op de muren van het Badi', 'Suikerriet en een oude suikermolen in de Souss', 'De Saadiaanse graven'],
  10: ['De witte stadsmuur van Essaouira aan zee', 'De Scala du Port met de kanonnen', 'De haven met de blauwe boten', 'Het stratenplan van Essaouira op papier'],
  11: ['Het verdrag tussen Marokko en de Verenigde Staten, 1786', 'Het Amerikaanse legatiegebouw in Tanger', 'De haven van Salé', 'Een achttiende-eeuws zeilschip'],
  12: ['Het Rifgebergte', 'Een foto van Abdelkrim el-Khattabi', 'Een dorp in het Rif', 'De baai van Al Hoceima'],
  13: ['Mohammed V bij zijn terugkeer in 1955', 'De Hassan-toren in Rabat', 'Een krantenkop uit november 1955', 'Het mausoleum van Mohammed V'],
  14: ['Het parlementsgebouw in Rabat', 'De grondwet van 2011 op papier', 'Een dorpsschool in de Hoge Atlas', 'Tifinagh-letters op een straatnaambord'],
  15: ['Een oude koffer of houten kist met papieren', 'Een dorp in de Hoge Atlas vandaag', 'Een Marokkaanse familie in Nederland, jaren zeventig', 'Een oude sleutel op een tafel'],
}

const beeldenlijst = () => [
  '# De beelden van De sleutels van Marokko', '',
  'Deze reeks is voor lezers van negen tot vijftien. Die leeftijd gelooft een',
  'foto en herkent een plaatje: hier horen echte opnames en historische',
  'bronnen, geen tekeningen. Zolang een map leeg is drukt het boek de getekende',
  'plaat af die in `scripts/lib/historie.mjs` staat — dat is een noodverband.', '',
  '## Hoe je ze erin zet', '',
  '1. Maak `store/sleutels/platen/<deel>/` aan.',
  '2. Zet de beelden erin met een naam die de volgorde bepaalt: `01-...jpg`,',
  '   `02-...jpg`. Het eerste beeld komt vooraan, de rest na de hoofdstukken.',
  '3. Zet ernaast `bronnen.txt`, met per regel:',
  '   `bestandsnaam | onderschrift | maker, bron, licentie`',
  '4. Draai `npm run sleutels -- --deel <nummer>`. De verantwoording achterin',
  '   wordt uit `bronnen.txt` opgebouwd.', '',
  '## Waar je ze haalt', '',
  '- **Wikimedia Commons** — het meeste hieronder staat er, met de licentie erbij.',
  '- **Rijksmuseum, Bibliothèque nationale de France, Library of Congress** —',
  '  kaarten, prenten en oude foto\'s, vaak publiek domein en op hoge resolutie.',
  '- **Eigen opnames.** Voor de delen die nu spelen is dat het mooist.', '',
  'Let op: een beeld van 4 cm breed op papier heeft minstens 1200 pixels nodig.',
  'Neem het origineel, niet het voorbeeldplaatje.', '',
  ...REEKS.flatMap((d) => [
    `## Deel ${d.nummer} — ${d.titel} (${d.jaar})`, '',
    `${d.waar}.`, '',
    ...(BEELDEN[d.nummer] ?? []).map((b, i) => `${i + 1}. ${b}`), '',
  ]),
].join('\n')

/* ── Uitvoeren ────────────────────────────────────────────────────────── */

if (LIJST) {
  const uit = path.join(ROOT, 'store', 'sleutels', 'beeldenlijst.md')
  await mkdir(path.dirname(uit), { recursive: true })
  await writeFile(uit, beeldenlijst())
  console.log(`\n${path.relative(ROOT, uit)} — ${REEKS.length} delen\n`)
  process.exit(0)
}

const basis = { ...REEKS.find((d) => d.nummer === NUMMER), hoofdstukken: HOOFDSTUKKEN[NUMMER] ?? [] }
if (TAAL !== 'nl' && !vertaling[NUMMER]) {
  console.log(`\nLet op: deel ${NUMMER} is nog niet in het ${TAAL} vertaald. Dit boek komt in het Nederlands.\n`)
}
const html = OPZET ? opzet() : deelBoek(sleuteldeelIn(TAAL, basis))
await mkdir(path.dirname(UIT), { recursive: true })
const tijdelijk = path.join(tmpdir(), `.sleutels-${OPZET ? 'opzet' : NUMMER}.html`)
await writeFile(tijdelijk, html)

const browser = await startChroom()
const bladzijde = await browser.newPage()
await bladzijde.goto(`file://${tijdelijk}`, { waitUntil: 'networkidle' })
await bladzijde.emulateMedia({ media: 'print' })
await bladzijde.pdf({
  path: UIT, format: 'A5', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true, headerTemplate: '<div></div>',
  footerTemplate: `<div style="width:100%;font-size:7.5px;color:#9b8d80;font-family:Georgia,serif;padding:0 18mm;
      display:flex;justify-content:${VOOR ? 'space-between' : 'center'}">
      ${VOOR ? `<span>${esc(VOOR)}</span>` : ''}<span class="pageNumber"></span></div>`,
})
/** De omslag als plaatje voor de website; zie lib/omslag.mjs. */
const OMSLAG = arg('omslag')
if (OMSLAG) {
  await schrijfOmslag(bladzijde, path.resolve(OMSLAG))
  console.log(`omslag → ${OMSLAG}`)
}
await browser.close()

const rauw = await readFile(UIT)
const bladen = (rauw.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
console.log(`\n${path.relative(ROOT, UIT)} — ${bladen} bladzijden, ${(rauw.length / 1e6).toFixed(1)} MB\n`)
