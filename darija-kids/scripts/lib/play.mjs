/**
 * Inloggen bij Google Play, op één plek.
 *
 * Vier scripts praten met Play: `crashes`, `track`, `rechten` en de
 * winkelvermelding. Ze deden alle vier dezelfde JWT-dans, en ze zochten alle
 * vier de sleutel op — maar niet op dezelfde manier. `crashcheck.mjs`
 * doorzocht de hele thuismap; de andere twee keken alleen in
 * `Documents/Darijaforkids-sleutel`. Staat die sleutel ergens anders, dan werkt
 * de ene opdracht wel en de andere niet, met een foutmelding die niets over dat
 * verschil zegt. Dat is een halve middag zoeken naar iets wat er niet is.
 *
 * Wat hier níét staat is `api()`. Dat verschilt per script met reden: de
 * foutmeldingen zijn anders omdat de fouten anders zijn — een 403 bij
 * `:commit` betekent iets anders dan een 403 op de gebruikerslijst. Dat is
 * geen duplicaat maar inhoud.
 */
import { createSign } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** Waar hij hoort te staan. Wordt ook in de foutmelding getoond. */
export const GEWONE_PLEK = path.join(os.homedir(), 'Documents', 'Darijaforkids-sleutel', 'play-api.json')

/**
 * De sleutel zoeken: eerst waar hij hoort, dan onder de thuismap.
 *
 * Het doorzoeken is begrensd op vijf mappen diep en slaat `node_modules` en
 * verborgen mappen over, anders loopt hij op een volle schijf minuten te
 * malen. `gezien` vangt de lus af die een symbolische koppeling kan maken.
 */
export function zoekSleutel(gegeven = null) {
  if (gegeven) return existsSync(gegeven) ? gegeven : null
  if (existsSync(GEWONE_PLEK)) return GEWONE_PLEK

  const gezien = new Set()
  const zoek = (map, diepte) => {
    if (diepte > 5 || gezien.has(map)) return null
    gezien.add(map)
    let inhoud
    try {
      inhoud = readdirSync(map, { withFileTypes: true })
    } catch {
      return null // geen toegang; dan staat hij hier toch niet
    }
    for (const ding of inhoud) {
      if (ding.isFile() && ding.name === 'play-api.json') return path.join(map, ding.name)
    }
    for (const ding of inhoud) {
      if (!ding.isDirectory() || ding.name.startsWith('.') || ding.name === 'node_modules') continue
      const gevonden = zoek(path.join(map, ding.name), diepte + 1)
      if (gevonden) return gevonden
    }
    return null
  }
  return zoek(os.homedir(), 0)
}

/**
 * De sleutel inlezen, of zeggen waar hij hoort te staan.
 *
 * Het pad staat er zonder punthaken omheen. `<de waarde van KOOP_GEHEIM>` is
 * ooit letterlijk, mét punthaken, in een veld bij Gumroad beland.
 */
export function leesSleutel(gegeven = null) {
  const pad = zoekSleutel(gegeven)
  if (!pad) {
    console.error('\nIk kan play-api.json niet vinden. Hij hoort hier te staan:\n')
    console.error(`  ${GEWONE_PLEK}\n`)
    console.error('Hij wordt ook onder je thuismap gezocht, vijf mappen diep.')
    console.error('Staat hij daarbuiten, geef het pad dan mee met --sleutel erachter.\n')
    process.exit(1)
  }
  return { pad, ...JSON.parse(readFileSync(pad, 'utf8')) }
}

/** De twee scopes die hier gebruikt worden. */
export const SCOPES = {
  uitgeven: 'https://www.googleapis.com/auth/androidpublisher',
  cijfers: 'https://www.googleapis.com/auth/playdeveloperreporting',
}

/**
 * Een toegangsbewijs halen met het serviceaccount.
 *
 * Google wil een JWT die je zelf ondertekent met de private sleutel uit dat
 * json-bestand, en geeft daar een token voor terug. Loopt de klok van de
 * machine een paar minuten voor of achter, dan wordt die JWT geweigerd — en de
 * melding gaat dan over de handtekening en niet over de tijd. Vandaar dat de
 * foutmelding de klok noemt.
 */
export async function haalToken(sleutel, scope = SCOPES.uitgeven) {
  const nu = Math.floor(Date.now() / 1000)
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const basis = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: sleutel.client_email,
    scope,
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

/** Hetzelfde, maar met de foutmelding die alle vier de scripts gaven. */
export async function tokenOfStop(sleutel, scope = SCOPES.uitgeven) {
  try {
    return await haalToken(sleutel, scope)
  } catch (fout) {
    console.error(`\n${fout.message}\n`)
    console.error('De sleutel werd niet aangenomen. Kijk of het het juiste')
    console.error('serviceaccount is, en of de systeemklok klopt.\n')
    process.exit(1)
  }
}
