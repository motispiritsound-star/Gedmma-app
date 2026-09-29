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
 * track*. De gesloten test is daarom het standaarddoel geworden. Hij is
 * net zo onzichtbaar en net zo vrij van beoordeling als de interne, en hij
 * doet wel waar dit script voor bestaat.
 *
 *   npm run track                 naar gesloten test (geen beoordeling)
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
import { leesSleutel, tokenOfStop } from './lib/play.mjs'

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
  console.error('  npm run aab -- --versie 3 --naam 1.2\n')
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
 */
const nieuwsteBron = (map) => {
  let nieuwste = 0
  const langs = (m) => {
    for (const naam of readdirSync(m, { withFileTypes: true })) {
      const pad = path.join(m, naam.name)
      if (naam.isDirectory()) langs(pad)
      else nieuwste = Math.max(nieuwste, statSync(pad).mtimeMs)
    }
  }
  if (existsSync(map)) langs(map)
  return nieuwste
}

const bron = OUD ? 0 : Math.max(nieuwsteBron(path.join(ROOT, 'src')), nieuwsteBron(path.join(ROOT, 'public')))
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
  console.error('  npm run aab -- --versie 4 --naam 1.2\n')
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

  await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits/${edit.id}/tracks/${TRACK}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      track: TRACK,
      releases: [{ versionCodes: [String(bundel.versionCode)], status: 'completed' }],
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

  let ingestuurd = false
  try {
    await leggenVast('?changesNotSentForReview=true')
  } catch (fout) {
    // Kent deze app de vlag niet, dan is er niets dat op beoordeling wacht en
    // is de gewone vorm juist. Alleen dán, en niet bij een 403.
    if (fout.status !== 400) throw fout
    await leggenVast('')
    ingestuurd = true
  }
  console.log('vastgelegd\n')
  if (!ingestuurd) {
    console.log('Hij is niet ter beoordeling gestuurd, en dat is met opzet. De bundel')
    console.log('stáát er, en daar gaat het hier om — het rapport hieronder komt van de')
    console.log('bundel, niet van een beoordeling.\n')
    console.log('Insturen doe je later zelf in de console, als dat rapport schoon is.\n')
  }

  console.log('Google begint nu vanzelf aan het rapport vóór lancering. Dat duurt')
  console.log('meestal een half uur tot een uur: hij installeert de app op een rij')
  console.log('echte toestellen en klikt er doorheen.\n')
  console.log('Daarna staat er in Play Console bij Testen en publiceren -> Testen')
  console.log('-> Rapport vóór lancering wat hij zag, met een filmpje en een')
  console.log('stacktrace als er iets omviel.\n')
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
    console.error('Wil je niet wachten: de bundel hieronder kun je ook met de hand')
    console.error('uploaden bij Testen en publiceren -> Testen -> Interne test.\n')
    console.error(`  ${AAB}\n`)
  } else if (fout.status === 403) {
    console.error('Dit serviceaccount mag hier niet bij. In Play Console staat dat onder')
    console.error('Gebruikers en rechten.\n')
  } else if (fout.status === 400 && /versionCode/i.test(String(fout.message))) {
    console.error('Die versiecode is al in gebruik. Elke upload heeft een nieuwe nodig:\n')
    console.error('  npm run aab -- --versie 4 --naam 1.2\n')
  }
  console.error(String(fout.message).split('\n').slice(0, 14).join('\n'))
  console.error('')
  process.exit(1)
}
