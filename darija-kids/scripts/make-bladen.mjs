/**
 * Zet elk boek om in losse bladzijden als afbeelding.
 *
 * De lezer op de website toont geen pdf maar plaatjes, en wel om één reden:
 * een pdf is één bestand dat je doorstuurt, en dertig losse bladzijden achter
 * een sleutel zijn dat niet.
 *
 * Wat eruit komt gaat naar R2, in de vorm die de worker verwacht:
 *   <reeks>/<deel>/<taal>/<nummer>.webp
 *
 * Run with:
 *   npm run bladen                       # alle delen in het Nederlands
 *   npm run bladen -- --deel 1           # één deel
 *   npm run bladen -- --taal fr          # één taal (standaard nl)
 *   npm run bladen -- --taal alles       # alle zes de talen
 *   npm run bladen -- --uploaden         # en meteen naar R2
 *   npm run bladen -- --opnieuw          # ook wat er al in de bak staat
 *
 * Alles bij elkaar is dat twaalf delen × zes talen × eenendertig bladzijden,
 * en dat duurt ruim een uur: ongeveer de helft schieten, de helft versturen.
 *
 * Elk deel gaat de deur uit zodra het geschoten is, en komt dan in
 * `store/bladen/gedaan.json` te staan. Valt hij om — en over een netwerk van
 * dit formaat valt er een keer iets om — draai dan dezelfde opdracht opnieuw:
 * wat er al in staat wordt overgeslagen.
 *
 * Dat was niet altijd zo, en het stond er wel. Het uploaden gebeurde pas
 * nadat alle tweeënzeventig combinaties geschoten waren, dus een fout in
 * minuut vijfentwintig liet nul bladzijden in de bak achter. En het ging met
 * één wrangler per bestand, achter elkaar: wrangler heeft ruim vier seconden
 * nodig om op te starten, en tweeduizenddriehonderd keer vier seconden is
 * bijna drie uur waarvan het meeste opstarten is. Nu zes tegelijk.
 *
 * De leesboeken zitten hier niet bij; die gaan met `npm run lezen -- --r2`.
 */
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { startChroom } from './lib/chroom.mjs'
import { pool, wranglerLos } from './lib/wrangler.mjs'
import { createServer } from 'vite'
import ffmpeg from 'ffmpeg-static'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'store', 'bladen')
const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const ALLEEN = arg('deel') ? Number(arg('deel')) : null
const ALLE_TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en']
const GEVRAAGD = arg('taal', 'nl')
const TALEN = GEVRAAGD === 'alles' ? ALLE_TALEN : [GEVRAAGD]
const UPLOADEN = process.argv.includes('--uploaden')
const OPNIEUW = process.argv.includes('--opnieuw')

/**
 * Wat er al in de bak staat, zodat een tweede poging verder gaat.
 *
 * Dit duurt uren en het loopt over het netwerk, dus het valt een keer om. Tot
 * nu toe begon je dan van voren af aan: alles opnieuw schieten, alles opnieuw
 * versturen. Nu staat er per deel en taal een regeltje in dit bestand zodra
 * die combinatie helemaal in de bak zit, en die wordt de volgende keer
 * overgeslagen. `--opnieuw` negeert het.
 */
const BOEKHOUDING = path.join(UIT, 'gedaan.json')
const gedaan = new Set(
  OPNIEUW ? [] : await readFile(BOEKHOUDING, 'utf8').then((t) => JSON.parse(t)).catch(() => []),
)
const bewaarGedaan = async () =>
  writeFile(BOEKHOUDING, `${JSON.stringify([...gedaan].sort(), null, 2)}\n`)

/**
 * Eén map naar R2, met zes tegelijk.
 *
 * Meteen na het schieten van dat deel, en niet aan het eind van alles. Dat
 * scheelt niets aan tijd en alles aan wat er overblijft als hij omvalt: het
 * uploaden stond achteraan, dus een fout in minuut vijfentwintig van het
 * schieten liet nul bladzijden achter terwijl het scherm zei van niet.
 */
const naarR2 = async (map) => {
  const bestanden = []
  const loop = async (waar) => {
    for (const naam of await readdir(waar, { withFileTypes: true })) {
      const vol = path.join(waar, naam.name)
      if (naam.isDirectory()) await loop(vol)
      else bestanden.push(vol)
    }
  }
  await loop(map)
  try {
    await pool(bestanden, (vol) => {
      const sleutel = path.relative(UIT, vol).replace(/\\/g, '/')
      return wranglerLos(['r2', 'object', 'put', `darijaforkids-boeken/${sleutel}`,
        '--file', vol, '--remote',
        '--content-type', vol.endsWith('.json') ? 'application/json' : 'image/webp'])
    })
  } catch (fout) {
    /**
     * Eén leesbare regel, niet de stapel van Node.
     *
     * Wat hier misgaat is bijna altijd hetzelfde: niet ingelogd, of het
     * netwerk viel even weg. Allebei is te verhelpen, maar niet als je een
     * stacktrace van acht regels voor je hebt waarin geen van beide staat.
     */
    const tekst = String(fout.message || fout).replace(/\u001b\[[0-9;]*m/g, '')
    console.error(`\nHet uploaden viel om bij ${path.relative(ROOT, map)}.\n`)
    if (/CLOUDFLARE_API_TOKEN|not logged in|authenticat/i.test(tekst)) {
      console.error('Wrangler weet niet wie je bent. Log één keer in:\n')
      console.error('  cd server')
      console.error('  npx wrangler login')
      console.error('  cd ..\n')
    } else if (/fetch failed|ENOTFOUND|ETIMEDOUT|ECONNRESET|network/i.test(tekst)) {
      console.error('Dat was het netwerk, niet jouw boeken.\n')
    }
    console.error(`Wat wrangler zei:\n\n${tekst.split('\n').filter(Boolean).slice(-3).map((r) => `  ${r}`).join('\n')}\n`)
    console.error('Draai dezelfde opdracht gewoon opnieuw. Wat al in de bak staat')
    console.error('wordt overgeslagen, dus je begint niet van voren af aan.\n')
    process.exit(1)
  }
  return bestanden.length
}

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ DELEN }, { deelIn }] = await Promise.all([
  server.ssrLoadModule('/src/content/prentenboek.ts'),
  server.ssrLoadModule('/src/content/prentenboek-talen.ts'),
])

const browser = await startChroom()

/**
 * Eén boek uit elkaar halen.
 *
 * De zetters schrijven hun html naar /tmp voordat ze er een pdf van maken.
 * Die html pakken we hier op en schieten we bladzijde voor bladzijde. Dat is
 * nauwkeuriger dan een pdf terugrekenen naar plaatjes, en het scheelt een
 * pdf-bibliotheek.
 */
const bladenVan = async (reeks, nummer, taal, htmlPad, kiezer) => {
  const map = path.join(UIT, reeks, String(nummer), taal)
  await rm(map, { recursive: true, force: true })
  await mkdir(map, { recursive: true })

  const blad = await browser.newPage({ viewport: kiezer.venster, deviceScaleFactor: 2 })
  await blad.goto(pathToFileURL(htmlPad).href, { waitUntil: 'networkidle' })
  const secties = await blad.$$(kiezer.sectie)
  const soorten = await blad.$$eval(kiezer.sectie, (els) => els.map((e) => e.className))

  for (const [i, sectie] of secties.entries()) {
    const png = path.join(map, `${i + 1}.png`)
    await sectie.screenshot({ path: png })
    execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', png,
      '-c:v', 'libwebp', '-quality', '82', '-compression_level', '6', '-preset', 'picture',
      png.replace(/\.png$/, '.webp')])
    await rm(png)
  }
  await blad.close()
  return soorten
}

let totaal = 0
const begonnen = Date.now()

for (const taal of TALEN) {
  for (const deel of DELEN) {
    if (ALLEEN && deel.nummer !== ALLEEN) continue
    if (gedaan.has(`${deel.nummer}/${taal}`)) {
      console.log(`${taal}  deel ${String(deel.nummer).padStart(2)} — staat er al, overgeslagen`)
      continue
    }
    // `process.execPath` en niet 'node': op Windows vindt een programma dat
    // Node rechtstreeks start niet altijd wat er in PATH staat.
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'make-prentenboek.mjs'),
      '--deel', String(deel.nummer), '--taal', taal], { stdio: 'pipe' })
    const soorten = await bladenVan('sba', deel.nummer, taal, path.join(tmpdir(), `.prentenboek-${taal}.html`),
      { venster: { width: 794, height: 560 }, sectie: 'section' })

    /**
     * De voorleestekst gaat mee, naast de plaatjes.
     *
     * Een bladzijde van een prentenboek is een plaatje, en een plaatje zwijgt.
     * De tekst die eronder hoort staat in de inhoud, met zoveel woorden: "dit
     * wordt hardop gelezen". Dus gaat hij mee als bladzijde nul — dezelfde
     * plek waar een leesboek zijn hele tekst heeft — en dan kan de lezer op de
     * website er een stem onder zetten.
     *
     * `bladzijden` zegt welke tekst bij welke bladzijde hoort, en wordt hier
     * uit het boek zelf afgelezen in plaats van uitgerekend. Een prentenboek
     * begint namelijk met vier bladzijden voorwerk — omslag, titel, waar het
     * speelt, wie er meedoen — en eindigt met drie bladzijden nawerk. Reken je
     * dat uit met een formule, dan verschuift de stem onder elke plaat zodra
     * er ooit een bladzijde bij komt, en dan leest hij het verkeerde verhaal
     * voor bij de goede tekening. Dat merkt niemand aan de bouw.
     */
    let verteld = 0
    const bladzijden = soorten.map((klasse) => {
      const namen = String(klasse).split(/\s+/)
      if (!namen.includes('blad') && !namen.includes('verhaalblad')) return null
      // Een blad is twee bladzijden: de plaat, en het verhaal ernaast.
      return Math.floor(verteld++ / 2)
    })

    const vertaald = taal === 'nl' ? deel : deelIn(taal, deel.nummer)
    await writeFile(path.join(UIT, 'sba', String(deel.nummer), taal, 'boek.json'), JSON.stringify({
      nummer: deel.nummer, titel: vertaald.titel, ondertitel: vertaald.ondertitel, waar: vertaald.waar,
      bladzijden,
      bladen: vertaald.bladen.map((b) => ({ tekst: b.tekst, woord: b.woord, echo: b.echo })),
    }))

    totaal += soorten.length
    let erheen = ''
    if (UPLOADEN) {
      const n = await naarR2(path.join(UIT, 'sba', String(deel.nummer), taal))
      gedaan.add(`${deel.nummer}/${taal}`)
      await bewaarGedaan()
      erheen = `, ${n} in de bak`
    }
    const minuten = Math.round((Date.now() - begonnen) / 60000)
    console.log(`${taal}  deel ${String(deel.nummer).padStart(2)} — ${soorten.length} bladzijden, ` +
                `${verteld / 2} met verhaal${erheen}  (${totaal} in ${minuten} min)`)
  }
}

/**
 * De leesboeken staan hier niet meer.
 *
 * Ze gaan als tekst en niet als plaatje — een roman van dertig bladzijden in
 * beeld is drie megabyte die op een telefoon niet meeschaalt: je kunt niet
 * groter zetten, de regels lopen niet door, en wie slecht ziet kan er niets
 * mee. Tekst is hier gewoon het goede medium.
 *
 * Maar ze stonden hier verkeerd. Dit script kent één taal per keer en las de
 * Nederlandse bron, dus `--taal fr` schreef Nederlandse tekst in de Franse
 * map. Dat merk je niet aan de bouw en niet aan de bestandsnamen; dat merkt
 * een Franse koper.
 *
 * `scripts/leesuitgave.mjs` doet het wél goed: dat legt de vertaling alinea
 * voor alinea naast het Nederlands, en er staat een test op. Vandaar:
 *
 *   npm run lezen -- --r2
 *
 * Dit script gaat alleen nog over de prentenboeken, want daar zijn de
 * bladzijden echt plaatjes.
 */

await browser.close()
await server.close()
console.log(`\n${totaal} bladzijden in ${path.relative(ROOT, UIT)}/\n`)

if (UPLOADEN) console.log('Alles staat in de bak.\n')
else console.log('Nog niet in de bak: draai opnieuw met --uploaden.\n')
