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
 *
 * Productie kan hier met opzet niet. Dat is een beoordeling en een publiek
 * moment; dat hoort een bewuste handeling in de console te zijn, niet iets wat
 * per ongeluk uit een script rolt.
 */
import { createSign } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
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

  await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits/${edit.id}:commit`, { method: 'POST' })
  console.log('vastgelegd\n')

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
