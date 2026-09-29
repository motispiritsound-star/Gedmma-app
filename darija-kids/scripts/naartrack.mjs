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
 * Google maakt zo'n rapport automatisch zodra je een bundel naar wélke track
 * dan ook uploadt, en draait hem dan op een rij echte toestellen — met een
 * filmpje en een stacktrace als er iets omvalt. Zonder beoordeling, zonder
 * risico voor de winkelvermelding.
 *
 *   npm run track                 naar interne test (de snelste, geen beoordeling)
 *   npm run track -- --proef      laat zien wat er zou gebeuren, raakt niets aan
 *   npm run track -- --track alpha        gesloten test
 *   npm run track -- --track beta         open test
 *   npm run track -- --aab <pad>          een andere bundel dan de laatste
 *   npm run track -- --oud       een bundel opsturen die ouder is dan de code
 *
 * Productie kan hier met opzet niet. Dat is een beoordeling en een publiek
 * moment; dat hoort een bewuste handeling in de console te zijn, niet iets wat
 * per ongeluk uit een script rolt.
 */
import { createSign } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
const TRACK = arg('track', 'internal')
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

/**
 * Dezelfde sleutel als `npm run play` en `npm run crashes`, en op dezelfde
 * manier gezocht: eerst de gewone plek, anders onder de thuismap. Een pad
 * tussen punthaken in een foutmelding is ooit letterlijk, mét punthaken, in
 * een veld bij Gumroad beland.
 */
function zoekSleutel() {
  const gegeven = arg('sleutel')
  if (gegeven) return existsSync(gegeven) ? gegeven : null
  const gewoon = path.join(os.homedir(), 'Documents', 'Darijaforkids-sleutel', 'play-api.json')
  if (existsSync(gewoon)) return gewoon
  return null
}

const SLEUTELPAD = zoekSleutel()
if (!PROEF && !SLEUTELPAD) {
  console.error('\nIk kan play-api.json niet vinden. Hij hoort hier te staan:\n')
  console.error(`  ${path.join(os.homedir(), 'Documents', 'Darijaforkids-sleutel', 'play-api.json')}\n`)
  process.exit(1)
}
const sleutel = PROEF ? { client_email: '(proef)' } : JSON.parse(readFileSync(SLEUTELPAD, 'utf8'))

async function token() {
  const nu = Math.floor(Date.now() / 1000)
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const basis = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: sleutel.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nu,
    exp: nu + 3600,
  })}`
  const handtekening = createSign('RSA-SHA256').update(basis).end().sign(sleutel.private_key, 'base64url')
  const antwoord = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${basis}.${handtekening}`,
    }),
  })
  const body = await antwoord.json()
  if (!antwoord.ok) throw new Error(`inloggen mislukt: ${JSON.stringify(body)}`)
  return body.access_token
}

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

let bewijs
try {
  bewijs = await token()
} catch (fout) {
  console.error(`${fout.message}\n`)
  console.error('De sleutel werd niet aangenomen. Kijk of het het juiste')
  console.error('serviceaccount is, en of de systeemklok klopt.\n')
  process.exit(1)
}

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
   * Vastleggen, en zo nodig zonder hem ter beoordeling te sturen.
   *
   * Eerst gewoon. Antwoordt Google met "Changes cannot be sent for review
   * automatically", dan staat er in deze app iets klaar dat een beoordeling
   * nodig heeft — bij ons: de app ligt onder handhaving. Met
   * `changesNotSentForReview=true` legt hij de edit wél vast maar stuurt hem
   * niet in; dat doe je dan zelf vanuit de console, op het moment dat jij dat
   * wilt.
   *
   * Voor waar dit script voor is maakt dat niets uit. Het rapport vóór
   * lancering wordt gemaakt van de geüploade bundel en heeft geen beoordeling
   * nodig. Sterker: niet insturen is hier juist goed — je wilt eerst dat
   * rapport lezen.
   */
  const leggenVast = (extra) =>
    api(bewijs, `/androidpublisher/v3/applications/${APP}/edits/${edit.id}:commit${extra}`, { method: 'POST' })

  let ingestuurd = true
  try {
    await leggenVast('')
  } catch (fout) {
    if (!(fout.status === 400 && /changesNotSentForReview/i.test(String(fout.message)))) throw fout
    await leggenVast('?changesNotSentForReview=true')
    ingestuurd = false
  }
  console.log('vastgelegd\n')
  if (!ingestuurd) {
    console.log('Let op: Google wilde dit niet vanzelf ter beoordeling sturen, dus dat is')
    console.log('niet gebeurd. De bundel stáát er wel, en daar gaat het hier om — het')
    console.log('rapport hieronder komt van de bundel, niet van een beoordeling.\n')
    console.log('Insturen doe je later zelf in de console, als het rapport schoon is.\n')
  }

  console.log('Google begint nu vanzelf aan het rapport vóór lancering. Dat duurt')
  console.log('meestal een half uur tot een uur: hij installeert de app op een rij')
  console.log('echte toestellen en klikt er doorheen.\n')
  console.log('Daarna staat er in Play Console bij Testen en publiceren -> Testen')
  console.log('-> Rapport vóór lancering wat hij zag, met een filmpje en een')
  console.log('stacktrace als er iets omviel.\n')
} catch (fout) {
  console.error(`\nDat is niet gelukt (${fout.status ?? '?'}).\n`)
  if (fout.status === 403) {
    console.error('Dit serviceaccount mag geen releases beheren. In Play Console staat')
    console.error('dat onder Gebruikers en rechten, bij "Releases naar testtracks".\n')
  } else if (fout.status === 400 && /versionCode/i.test(String(fout.message))) {
    console.error('Die versiecode is al in gebruik. Elke upload heeft een nieuwe nodig:\n')
    console.error('  npm run aab -- --versie 4 --naam 1.2\n')
  }
  console.error(String(fout.message).split('\n').slice(0, 14).join('\n'))
  console.error('')
  process.exit(1)
}
