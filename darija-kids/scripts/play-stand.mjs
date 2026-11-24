/**
 * Wat staat er nu wérkelijk in Google Play, per taal?
 *
 * `npm run play` schrijft; dit leest, en meer niet. Het verschil doet ertoe,
 * want de vraag waar dit script voor gemaakt is — *staat er Franse tekst op de
 * Franse pagina?* — is niet te beantwoorden uit deze repo. De repo zegt wat er
 * verstuurd zóu worden. De winkel zegt wat er staat.
 *
 * Twee dingen kunnen uit elkaar lopen zonder dat iemand het merkt:
 *
 *   1. **De teksten.** Die zijn bij inzending 7 in zes talen toegevoegd, maar
 *      een taal die bij een latere upload wordt overgeslagen houdt stil zijn
 *      oude tekst. Dan vertelt de winkel in het Duits over een versie van drie
 *      releases geleden.
 *   2. **De beelden.** Die zijn per taal, en Play heeft geen terugval per
 *      beeld maar per vermelding: staat er voor `fr-FR` geen enkele
 *      schermafbeelding, dan toont Play die van de standaardvermelding — en
 *      dat zijn de Nederlandse. Je ziet dan een Franse beschrijving boven
 *      Nederlandse plaatjes, en in de console ziet dat er niet verkeerd uit,
 *      want daar staat het vak gewoon leeg.
 *
 * Dit script maakt een edit, leest alles uit en gooit de edit weg. Er wordt
 * niets gecommit, dus er kan niets veranderen: een edit die je niet commit
 * raakt de gepubliceerde vermelding niet aan. Voor de zekerheid staat de
 * DELETE in een `finally`, zodat er ook bij een fout niets blijft hangen.
 *
 *   npm run playstand                 alle zes de talen
 *   npm run playstand -- --taal fr-FR  één taal
 *   npm run playstand -- --sleutel C:\pad\naar\play-api.json
 *
 * De sleutel is dezelfde als die van `npm run play`: het serviceaccount uit
 * Google Cloud, standaard naast de ondertekensleutel. Hij hoort niet in deze
 * repo — het is een wachtwoord in bestandsvorm.
 */
import { createSign } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const APP = 'app.darijaforkids.learn'
const API = 'https://androidpublisher.googleapis.com'

/** De zes talen die deze app in de winkel spreekt, in de orde van de repo. */
const TALEN = ['nl-NL', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'en-US']

/** De soorten beeld die een vermelding per taal kan dragen. */
const BEELDEN = [
  ['telefoon', 'phoneScreenshots'],
  ['tablet 7"', 'sevenInchScreenshots'],
  ['tablet 10"', 'tenInchScreenshots'],
  ['uitgelicht', 'featureGraphic'],
  ['icoon', 'icon'],
]

const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : terugval
}

/** Een toegangsbewijs halen met de sleutel: JWT tekenen, inruilen bij Google. */
async function token(sleutel) {
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

/** Eén verzoek aan de API. Een 404 is hier geen fout maar een antwoord. */
async function api(bewijs, pad) {
  const antwoord = await fetch(`${API}${pad}`, { headers: { authorization: `Bearer ${bewijs}` } })
  const tekst = await antwoord.text()
  if (antwoord.status === 404) return null
  if (!antwoord.ok) throw new Error(`GET ${pad}\n${tekst}`)
  return tekst ? JSON.parse(tekst) : {}
}

const SLEUTELPAD = arg('sleutel', path.join(os.homedir(), 'Documents', 'Darijaforkids-sleutel', 'play-api.json'))
if (!existsSync(SLEUTELPAD)) {
  console.error(`\nGeen sleutel gevonden op:\n  ${SLEUTELPAD}\n`)
  console.error('Staat hij ergens anders, geef het pad mee:')
  console.error('  npm run playstand -- --sleutel C:\\pad\\naar\\play-api.json\n')
  process.exit(1)
}

const sleutel = JSON.parse(readFileSync(SLEUTELPAD, 'utf8'))
const alleen = arg('taal')
const talen = alleen ? [alleen] : TALEN

const bewijs = await token(sleutel)
const edit = await fetch(`${API}/androidpublisher/v3/applications/${APP}/edits`, {
  method: 'POST',
  headers: { authorization: `Bearer ${bewijs}` },
}).then((r) => r.json())

if (!edit.id) {
  console.error(`\nGeen edit gekregen van Google:\n${JSON.stringify(edit, null, 2)}\n`)
  process.exit(1)
}

/** Een tekst op één regel, ingekort, zodat de tabel leesbaar blijft. */
const kort = (tekst, breed) => {
  const een = (tekst ?? '').replace(/\s+/g, ' ').trim()
  return een.length > breed ? `${een.slice(0, breed - 1)}…` : een
}

try {
  console.log(`\nWat er nu in Google Play staat — ${APP}\n`)

  for (const taal of talen) {
    const vermelding = await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits/${edit.id}/listings/${taal}`)
    console.log(`\x1b[1m${taal}\x1b[0m`)
    if (!vermelding) {
      console.log('  geen vermelding — Play toont hier de standaardvermelding\n')
      continue
    }
    console.log(`  titel   ${kort(vermelding.title, 70)}`)
    console.log(`  kort    ${kort(vermelding.shortDescription, 70)}`)
    console.log(`  vol     ${kort(vermelding.fullDescription, 70)}`)
    console.log(`          (${(vermelding.fullDescription ?? '').length} tekens)`)

    for (const [naam, soort] of BEELDEN) {
      const beeld = await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits/${edit.id}/listings/${taal}/${soort}`)
      const aantal = beeld?.images?.length ?? 0
      /*
       * Nul is het antwoord waar dit script voor bestaat. Play laat het vak
       * leeg en toont stilletjes de beelden van de standaardvermelding, dus
       * nul betekent: hier staan de plaatjes van een andere taal.
       */
      const merk = aantal === 0 ? '  \x1b[33m← leeg: hier komen de beelden van de standaardvermelding\x1b[0m' : ''
      console.log(`  ${naam.padEnd(11)} ${String(aantal).padStart(2)}${merk}`)
    }
    console.log('')
  }
} finally {
  // Weggooien en niet committen: een edit die niet gecommit wordt, raakt de
  // gepubliceerde vermelding niet aan. In `finally`, zodat er ook na een fout
  // niets blijft hangen.
  await fetch(`${API}/androidpublisher/v3/applications/${APP}/edits/${edit.id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${bewijs}` },
  }).catch(() => { /* een edit die vanzelf verloopt is geen probleem */ })
}
