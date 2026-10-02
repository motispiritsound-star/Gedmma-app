/**
 * De bundel naar een testtrack sturen, en daarmee een rapport vóór lancering
 * uitlokken.
 *
 * Dit script bestaat door een les die duur was. Versie 2 is rechtstreeks naar
 * productie gegaan, en Google wees hem af met "Crashes: Your app crashes after
 * opening" en haalde de app uit de winkel. Toen we het rapport vóór lancering
 * wilden lezen, stond daar: "Upload artifacts to generate pre-launch reports."
 * Er wás er nooit een geweest.
 *
 * Dat betekent dat de eerste keer dat iemand die app op een echt toestel
 * draaide, de beoordelaar was die hem afwees. Er is een goedkopere manier:
 * Google maakt zo'n rapport van een geüploade bundel en draait hem op een rij
 * echte toestellen — met een filmpje en een stacktrace als er iets omvalt.
 * Zonder beoordeling, zonder risico voor de winkelvermelding.
 *
 * Hier stond eerst dat dat gebeurt "zodra je een bundel naar wélke track dan
 * ook uploadt", en dat de interne test de snelste weg was. Dat had ik niet
 * nagekeken. Na een upload naar de interne test bleef het scherm zeggen
 * "Upload artifacts to generate pre-launch reports", met daarbij Google's
 * eigen suggestie: *we suggest uploading a bundle to your closed testing
 * track*. De gesloten test is daarom het standaarddoel geworden.
 *
 * En dáárna stond hier dat uploaden alleen al genoeg was: "het rapport komt
 * van de bundel, niet van een beoordeling." Ook dat klopte niet, en het heeft
 * twee bundels gekost. Versiecode 5 en 7 zijn allebei netjes geüpload en op de
 * baan gezet, en bij allebei bleef het rapport leeg. In de console staat waarom:
 *
 *     1.3 — Not yet sent for review. 1 version code
 *
 * Een release die niet is ingestuurd staat stil. Google doet er niets mee, de
 * testers krijgen hem niet, en er valt niets te rapporteren. Insturen is dus
 * geen extraatje achteraf maar de stap die het rapport uitlokt — en op een
 * testbaan is dat een lichte beoordeling die de winkelvermelding niet raakt.
 *
 * Vandaar `--insturen`. Het blijft uit staan als standaard, want insturen is
 * een handeling naar buiten en die hoort gevraagd te worden; maar wie hem
 * weglaat krijgt nu te lezen dat de release stilstaat, in plaats van de belofte
 * van een rapport dat nooit komt.
 *
 *   npm run track                 naar gesloten test, blijft staan tot je hem instuurt
 *   npm run track -- --insturen   en meteen insturen, zodat het rapport begint
 *   npm run track -- --track internal     interne test, geeft mogelijk geen rapport
 *   npm run track -- --proef      laat zien wat er zou gebeuren, raakt niets aan
 *   npm run track -- --track beta         open test
 *   npm run track -- --aab <pad>          een andere bundel dan de laatste
 *   npm run track -- --oud       een bundel opsturen die ouder is dan de code
 *
 * Productie kan hier met opzet niet. Dat is een beoordeling en een publiek
 * moment; dat hoort een bewuste handeling in de console te zijn, niet iets wat
 * per ongeluk uit een script rolt.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { nieuwsteVan } from './lib/bron.mjs'
import { nieuwsVoor, teLang, MAX } from './lib/nieuws.mjs'
import { leesSleutel, tokenOfStop } from './lib/play.mjs'
import { hoogste, hoogsteNaam } from './lib/versies.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APP = 'app.darijaforkids.learn'
const API = 'https://androidpublisher.googleapis.com'
const STANDAARD_AAB = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')

const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const PROEF = process.argv.includes('--proef')
/** Met opzet een bundel opsturen die ouder is dan de code. Zie de controle onder. */
const OUD = process.argv.includes('--oud')

/** De tracks waar dit script heen mag. `production` staat er bewust niet bij. */
const TRACKS = {
  internal: 'interne test',
  alpha: 'gesloten test',
  beta: 'open test',
}
const INSTUREN = process.argv.includes('--insturen')
/**
 * De bouwopdracht met echte nummers erin, net als in `watzitin.mjs`.
 *
 * Niet `--versie <n>`: punthaken belanden letterlijk in de terminal. En niet
 * een nummer uit build.gradle alleen -- dat bestand gaat niet terug de
 * repository in, dus in een verse kloon staat daar 1 terwijl Play er al zeven
 * heeft gezien. `docs/versies.json` weet dat wel.
 */
function volgendeBouw() {
  const gradle = path.join(ROOT, 'android', 'app', 'build.gradle')
  const bron = existsSync(gradle) ? readFileSync(gradle, 'utf8') : ''
  const code = Math.max(Number(bron.match(/versionCode (\d+)/)?.[1]) || 0, hoogste(ROOT))
  const naam = hoogsteNaam(ROOT) ?? bron.match(/versionName "([^"]*)"/)?.[1]
  if (!code || !naam) return 'npm run aab'
  return `npm run aab -- --versie ${code + 1} --naam ${naam}`
}

const TRACK = arg('track', 'alpha')
if (!(TRACK in TRACKS)) {
  console.error(`\n"${TRACK}" is hier geen track. Kies uit:\n`)
  for (const [naam, wat] of Object.entries(TRACKS)) console.error(`  --track ${naam.padEnd(10)} ${wat}`)
  console.error('\nProductie kan hier niet. Dat is een beoordeling en een publiek moment,')
  console.error('en dat hoort een bewuste handeling in de console te zijn.\n')
  process.exit(1)
}

/* ------------------------------------------------------------------ bundel */

const AAB = arg('aab', STANDAARD_AAB)
if (!existsSync(AAB)) {
  console.error(`\nGeen bundel op:\n  ${AAB}\n`)
  console.error('Bouw hem eerst:\n')
  console.error(`  ${volgendeBouw()}\n`)
  process.exit(1)
}

/**
 * Hoort deze bundel nog bij de code die er nu staat?
 *
 * Dit is de vraag die hier ontbrak. `maak-aab.mjs` stelt hem wel — die
 * vergelijkt de nieuwste bronregel met wat het Android-project in ging — maar
 * dit script pakt gewoon het bestand dat op die plek ligt. Dat is een bestand
 * dat blijft liggen: bouwen kan mislukken terwijl de vorige bundel er nog
 * staat, en dan uploadt `npm run track` daarna de app van vorige week zonder
 * dat er iets misgaat wat je kunt zien.
 *
 * Dat is hier geen verzonnen scenario. `npm run build` is op Windows stuk
 * geweest, en de keten is hard: faalt `build`, dan draait `cap sync` niet en
 * `maak-aab` ook niet — maar `track` wel. Dan zit er in de winkel iets anders
 * dan wat je denkt te hebben opgestuurd, en ga je een afwijzing zoeken in code
 * die er nooit in zat.
 *
 * De telling staat in `lib/bron.mjs`, gedeeld met `maak-aab.mjs`, en slaat
 * testbestanden over -- die komen niet in de bundel, dus ze zeggen niets over
 * hoe oud hij is.
 */
const bron = OUD ? 0 : nieuwsteVan(path.join(ROOT, 'src'), path.join(ROOT, 'public'))
const gebouwd = statSync(AAB).mtimeMs
if (bron > gebouwd) {
  const dagen = Math.round((bron - gebouwd) / 86400000)
  const ouder = dagen >= 1 ? `${dagen} dag${dagen === 1 ? '' : 'en'}` : 'korter dan een dag'
  console.error('\nDeze bundel is ouder dan de code.\n')
  console.error(`  bundel gebouwd op   ${new Date(gebouwd).toLocaleString('nl-NL')}`)
  console.error(`  code aangeraakt op  ${new Date(bron).toLocaleString('nl-NL')}`)
  console.error(`  verschil            ${ouder}\n`)
  console.error('Zou ik hem nu opsturen, dan staat er in de winkel iets anders dan wat')
  console.error('er nu in src/ staat — en dat merk je pas als je een afwijzing gaat')
  console.error('zoeken in code die er niet in zit.\n')
  console.error('Bouw hem opnieuw, met een versiecode die nog niet gebruikt is:\n')
  console.error(`  ${volgendeBouw()}\n`)
  console.error('Wil je deze bundel tóch opsturen, dan moet dat met opzet:\n')
  console.error('  npm run track -- --oud\n')
  process.exit(1)
}

/* ----------------------------------------------------------------- sleutel */

/*
 * De sleutel. Het zoeken en het inlezen staan in lib/play.mjs, omdat de vier
 * Play-scripts hem alle vier nodig hebben en ze het niet allemaal op dezelfde
 * manier deden -- crashcheck doorzocht de thuismap, dit script keek maar op
 * één plek.
 *
 * In de proefstand wordt er niets verstuurd, dus is er ook geen sleutel nodig.
 */
const sleutel = PROEF ? { client_email: '(proef)' } : leesSleutel(arg('sleutel'))

async function api(bewijs, pad, opties = {}) {
  const antwoord = await fetch(`${API}${pad}`, {
    ...opties,
    headers: { authorization: `Bearer ${bewijs}`, ...(opties.headers ?? {}) },
  })
  const tekst = await antwoord.text()
  if (!antwoord.ok) {
    const fout = new Error(`${opties.method ?? 'GET'} ${pad.split('?')[0]}\n${tekst}`)
    fout.status = antwoord.status
    throw fout
  }
  return tekst ? JSON.parse(tekst) : {}
}

/* -------------------------------------------------------------------- doen */

const mb = (statSync(AAB).size / 1048576).toFixed(1)
console.log(`\nBundel: ${AAB}`)
console.log(`        ${mb} MB`)
console.log(`Track:  ${TRACK} (${TRACKS[TRACK]})`)
console.log(`Als:    ${sleutel.client_email}\n`)

if (PROEF) {
  console.log('Proef. Er is niets verstuurd.\n')
  console.log('Zonder --proef doet hij dit:\n')
  console.log('  1. een edit openen bij Google')
  console.log('  2. de bundel uploaden')
  console.log(`  3. hem op de track ${TRACK} zetten`)
  console.log('  4. de edit vastleggen\n')
  process.exit(0)
}

const bewijs = await tokenOfStop(sleutel)

try {
  const edit = await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits`, { method: 'POST' })
  console.log(`edit ${edit.id} geopend`)

  // De bundel gaat langs het upload-adres, niet het gewone. Dat is dezelfde
  // vorm die play-vermelding.mjs voor de schermafdrukken gebruikt.
  const bundel = await api(
    bewijs,
    `/upload/androidpublisher/v3/applications/${APP}/edits/${edit.id}/bundles?uploadType=media`,
    { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: readFileSync(AAB) },
  )
  console.log(`bundel geüpload, versiecode ${bundel.versionCode}`)

  /*
   * "Wat is er nieuw", per taal, uit `store/wat-is-nieuw-<versienaam>.md`.
   *
   * Zes talen met de hand overtikken in de console is zes kansen om er een te
   * vergeten, en niemand die het nakijkt. De versienaam komt uit de bundel
   * zelf, dus het juiste bestand wordt vanzelf gepakt.
   */
  const notities = nieuwsVoor(ROOT, bundel.versionName ?? '')
  const lang = teLang(notities)
  if (lang.length) {
    console.error(`\nDeze teksten zijn langer dan de ${MAX} tekens die Play toestaat:\n`)
    for (const n of lang) console.error(`  ${n.language}  ${n.text.length}`)
    console.error(`\nKort ze in in store/wat-is-nieuw-${bundel.versionName}.md en draai opnieuw.\n`)
    process.exit(1)
  }
  if (notities.length) console.log(`notities gevonden voor ${bundel.versionName}: ${notities.map((n) => n.language).join(', ')}`)
  else console.log(`geen store/wat-is-nieuw-${bundel.versionName}.md -- deze release krijgt geen notities`)

  await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits/${edit.id}/tracks/${TRACK}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      track: TRACK,
      releases: [
        {
          versionCodes: [String(bundel.versionCode)],
          status: 'completed',
          ...(notities.length ? { releaseNotes: notities } : {}),
        },
      ],
    }),
  })
  console.log(`op de track ${TRACK} gezet`)

  /*
   * Vastleggen, en nadrukkelijk zonder hem ter beoordeling te sturen.
   *
   * Eerst probeerde dit script een gewone commit en zette het pas
   * `changesNotSentForReview=true` als Google antwoordde met "Changes cannot
   * be sent for review automatically". Dat was te slim. Insturen is niet wat
   * dit script wil: het rapport vóór lancering wordt gemaakt van de geüploade
   * bundel en heeft geen beoordeling nodig. Niet insturen is hier juist het
   * doel — je wilt dat rapport eerst lezen.
   *
   * En het kostte een ronde. Met de gewone commit kwam er een 403 terug op de
   * stap ná een geslaagde upload en een geslaagde track-wijziging, wat de
   * indruk wekt dat het serviceaccount de bundel er wel op mag zetten maar hem
   * niet mag vastleggen. Insturen ter beoordeling is een eigen bevoegdheid, en
   * die vragen we nu niet meer aan.
   *
   * De vlag staat dus vooraan. Weigert Google hém, dan pas de gewone vorm.
   */
  const leggenVast = (extra) =>
    api(bewijs, `/androidpublisher/v3/applications/${APP}/edits/${edit.id}:commit${extra}`, { method: 'POST' })

  let ingestuurd = INSTUREN
  if (INSTUREN) {
    await leggenVast('')
  } else {
    try {
      await leggenVast('?changesNotSentForReview=true')
    } catch (fout) {
      // Kent deze app de vlag niet, dan is er niets dat op beoordeling wacht en
      // is de gewone vorm juist. Alleen dán, en niet bij een 403.
      if (fout.status !== 400) throw fout
      await leggenVast('')
      ingestuurd = true
    }
  }
  console.log('vastgelegd\n')

  if (ingestuurd) {
    console.log('Hij is ter beoordeling gestuurd op de testbaan. Dat is een lichte')
    console.log('beoordeling: hij raakt de winkelvermelding niet, en productie blijft')
    console.log('staan waar hij staat.\n')
    console.log('Daarna begint Google aan het rapport vóór lancering: hij installeert de')
    console.log('app op een rij echte toestellen en klikt er doorheen. Dat staat in Play')
    console.log('Console bij Test and release -> Testing -> Pre-launch report, met een')
    console.log('filmpje en een stacktrace als er iets omviel.\n')
  } else {
    /*
     * Zonder insturen gebeurt er niets, en dat is hier twee keer misverstaan.
     *
     * Eerder stond op deze plek dat het rapport van de bundel komt en geen
     * beoordeling nodig heeft. Versiecode 5 en 7 zijn allebei zo geüpload, en
     * bij allebei bleef het rapport leeg -- in de console staat bij de release
     * "Not yet sent for review". Een release die stilstaat levert niets op.
     */
    console.log('LET OP: hij staat stil.\n')
    console.log('De bundel is geüpload en aan de baan toegewezen, maar de release is niet')
    console.log('ter beoordeling gestuurd. In de console staat er bij: "Not yet sent for')
    console.log('review". Google doet er dan niets mee: de testers krijgen hem niet, en')
    console.log('er komt géén rapport vóór lancering.\n')
    console.log('Insturen op een testbaan is licht -- het raakt de winkelvermelding niet')
    console.log('en productie blijft staan waar hij staat. Doe dat dus gewoon:\n')
    console.log('  npm run track -- --insturen\n')
    console.log('Of in de console bij Publishing overview, waar de wachtende wijziging')
    console.log('staat.\n')
  }
} catch (fout) {
  console.error(`\nDat is niet gelukt (${fout.status ?? '?'}).\n`)
  if (fout.status === 403 && /:commit/.test(String(fout.message))) {
    /*
     * Een 403 op precies deze stap is welbepaald, en dat is te zien aan wat
     * eraan voorafging: de edit openen is gelukt, de bundel uploaden is
     * gelukt, en hem op de track zetten ook. Het serviceaccount mag dus alles
     * klaarzetten. Alleen het vastleggen — de stap die het echt laat gelden —
     * wordt geweigerd. Google toetst releaserechten daar, en niet eerder.
     *
     * Dat betekent ook: er is niets kapot en er is niets half gebeurd. Een
     * edit die niet is vastgelegd bestaat niet; de versiecode blijft vrij.
     */
    console.error('De bundel is geüpload en op de track gezet, maar niet vastgelegd.')
    console.error('Alleen die laatste stap wordt geweigerd, en daar toetst Google de')
    console.error('releaserechten — niet eerder. Er is dus niets half gebeurd: een edit')
    console.error('die niet is vastgelegd bestaat niet, en de versiecode blijft vrij.\n')
    console.error('Dit serviceaccount mag klaarzetten maar niet uitbrengen:\n')
    console.error(`  ${sleutel.client_email}\n`)
    console.error('In Play Console staat dat bij Gebruikers en rechten. Zoek dat adres')
    console.error('op, open App-rechten, en zet in de groep Releases het recht aan dat')
    console.error('over testtracks gaat. Daarna deze opdracht gewoon opnieuw draaien —')
    console.error('het kan een paar minuten duren voor Google het doorheeft.\n')
    /*
     * Gesloten test, niet intern. Hier stond "Interne test", en dat spreekt de
     * kop van dit bestand tegen: een upload naar de interne test leverde geen
     * rapport vóór lancering op, en dat rapport is de enige reden waarom dit
     * script bestaat. Wie de handmatige weg neemt omdat de rechten nog niet
     * kloppen, moet niet in dezelfde val lopen.
     */
    console.error('Wil je niet wachten: de bundel hieronder kun je ook met de hand')
    console.error('uploaden bij Testen en publiceren -> Testen -> Gesloten test.')
    console.error('Gesloten en niet intern: de interne test geeft geen rapport vóór')
    console.error('lancering, en daar is het hier om te doen.\n')
    console.error(`  ${AAB}\n`)
  } else if (fout.status === 403) {
    console.error('Dit serviceaccount mag hier niet bij. In Play Console staat dat onder')
    console.error('Gebruikers en rechten.\n')
  } else if (fout.status === 400 && /versionCode/i.test(String(fout.message))) {
    console.error('Die versiecode is al in gebruik. Elke upload heeft een nieuwe nodig:\n')
    console.error(`  ${volgendeBouw()}\n`)
  }
  console.error(String(fout.message).split('\n').slice(0, 14).join('\n'))
  console.error('')
  process.exit(1)
}
