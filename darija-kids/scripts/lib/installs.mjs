/**
 * De installatiecijfers van Google Play uitrekenen, zonder netwerk.
 *
 * Alles wat hier staat is een functie van tekst naar getallen. Dat is met
 * opzet: het ophalen heeft een sleutel en een internetverbinding nodig en is
 * dus van hier niet na te rekenen, maar het ontleden en optellen wel — en daar
 * zit het soort fout in dat je pas merkt als je een verkeerd getal doorgeeft.
 * `src/site/installs.test.ts` rekent dit na op een bestand dat erop lijkt.
 *
 * Waarom dit bestand überhaupt bestaat: de Play Developer Reporting API, waar
 * `npm run crashes` mee praat, geeft alleen vitals — crashes, ANR's, trage
 * starts. Installatiecijfers zitten er niet in, en in de Android Publisher API
 * ook niet. De enige machinaal leesbare bron is een maandelijks csv-bestand dat
 * Google in een Cloud Storage-emmer zet.
 */

/**
 * De maand waarin de app in Play verscheen: 13 oktober 2026.
 *
 * Eerder bestaan er geen bestanden, en een verzoek om een maand die er niet is
 * kost een ronde naar Google om een 404 terug te krijgen. Verschuift de
 * lancering ooit in de geschiedenis, dan is dit de enige regel die meeschuift.
 */
export const EERSTE_MAAND = '202610'

/**
 * Hoe de emmer heet.
 *
 * Google gebruikt twee vormen, en welke van de twee het is hangt af van hoe
 * oud het ontwikkelaarsaccount is. Je ziet de goede staan in Play Console
 * onder Download reports; dit script probeert ze gewoon allebei, want dat is
 * één verzoek en scheelt de vraag.
 */
export const emmers = (ontwikkelaar) => [
  `pubsite_prod_rev_${ontwikkelaar}`,
  `pubsite_prod_${ontwikkelaar}`,
]

/** Waar het maandbestand staat, binnen de emmer. */
export const pad = (pakket, maand) => `stats/installs/installs_${pakket}_${maand}_overview.csv`

/** Een datum als `202610`. In UTC, want Google rekent de rapporten in UTC af. */
export const maandNaam = (d) =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`

/**
 * Alle maanden van `eerste` tot en met de maand van `tot`.
 *
 * Begrensd op honderd: een verkeerd meegegeven `--maand` mag geen lus worden
 * die duizend verzoeken naar Google doet.
 */
export function maandenSinds(eerste, tot) {
  const jaar = Number(String(eerste).slice(0, 4))
  const maand = Number(String(eerste).slice(4, 6))
  if (!jaar || !maand || maand < 1 || maand > 12) return []
  const uit = []
  const d = new Date(Date.UTC(jaar, maand - 1, 1))
  const laatste = maandNaam(tot)
  while (uit.length < 100) {
    const naam = maandNaam(d)
    uit.push(naam)
    if (naam >= laatste) break
    d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return uit
}

/**
 * De bytes naar tekst, met het regeleinde dat Google gebruikt.
 *
 * Deze bestanden zijn UTF-16 en niet UTF-8 — Google zegt dat zelf in de uitleg
 * over het inlezen in BigQuery. Lees je ze als UTF-8, dan krijg je geen
 * foutmelding maar een reeks tekens met een nulbyte ertussen, en een kop die
 * nergens op past. Dat is precies het soort fout dat eruitziet als "er staat
 * niets in het bestand".
 *
 * De bytevolgorde staat in de eerste twee bytes. Staat er geen merk, dan is
 * het UTF-8 — dat komt voor als iemand het bestand onderweg heeft omgezet.
 */
export function naarTekst(bytes) {
  const b = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) return b.subarray(2).toString('utf16le')
  if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
    // Een oneven aantal bytes laat `swap16` gooien met ERR_INVALID_BUFFER_SIZE,
    // en dan valt het script om op een afgebroken download in plaats van te
    // zeggen wat er aan de hand is. De laatste halve letter gaat eraf.
    const rest = b.subarray(2)
    const om = Buffer.from(rest.subarray(0, rest.length - (rest.length % 2)))
    om.swap16()
    return om.toString('utf16le')
  }
  if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return b.subarray(3).toString('utf8')
  return b.toString('utf8')
}

/** Eén regel csv, met aanhalingstekens erin verwerkt. */
export function splitsRegel(regel) {
  const uit = []
  let veld = ''
  let inAanhaling = false
  for (let i = 0; i < regel.length; i += 1) {
    const teken = regel[i]
    if (inAanhaling) {
      if (teken === '"' && regel[i + 1] === '"') { veld += '"'; i += 1 } else if (teken === '"') inAanhaling = false
      else veld += teken
    } else if (teken === '"') inAanhaling = true
    else if (teken === ',') { uit.push(veld); veld = '' } else veld += teken
  }
  uit.push(veld)
  return uit.map((v) => v.trim())
}

/** De kop en de regels. Lege regels vallen weg, ook de laatste. */
export function leesCsv(tekst) {
  const regels = tekst.split(/\r?\n/).filter((r) => r.trim() !== '')
  if (!regels.length) return { kop: [], regels: [] }
  return { kop: splitsRegel(regels[0]), regels: regels.slice(1).map(splitsRegel) }
}

/**
 * Welke kolom dit is, op naam en niet op plaats.
 *
 * Google heeft de kolommen van dit bestand in de loop der jaren verschoven en
 * hernoemd, en de uitleg op de hulppagina noemt een andere set dan wat er in
 * de praktijk in staat. Op volgnummer zoeken geeft dan geen foutmelding maar
 * een verkeerd getal, en dat is erger: een verkeerd getal ziet er goed uit.
 */
export const kolom = (kop, namen) => {
  const plat = kop.map((k) => k.toLowerCase().replace(/[^a-z]/g, ''))
  for (const naam of namen) {
    const i = plat.indexOf(naam.toLowerCase().replace(/[^a-z]/g, ''))
    if (i >= 0) return i
  }
  return -1
}

/** De drie kolommen die ertoe doen, elk met de namen die Google gebruikt heeft. */
export const KOLOMMEN = {
  datum: ['Date'],
  nieuw: ['Daily User Installs', 'Daily Users Installs'],
  installaties: ['Daily Device Installs'],
  toestellen: ['Active Device Installs', 'Current Device Installs'],
}

const getal = (v) => {
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/**
 * Eén maandbestand optellen.
 *
 * `nieuw` en `installaties` worden opgeteld over de dagen; `toestellen` niet,
 * want dat is een stand en geen stroom — daarvan telt alleen de laatste dag.
 * Een stand optellen geeft een getal dat elke dag groeit en nergens op slaat,
 * en dat is hier makkelijk per ongeluk te doen.
 */
export function vatSamen(kop, regels) {
  const kolommen = Object.fromEntries(
    Object.entries(KOLOMMEN).map(([naam, namen]) => [naam, kolom(kop, namen)]),
  )
  const ontbreekt = Object.entries(kolommen).filter(([, i]) => i < 0).map(([naam]) => naam)

  const dagen = regels.map((r) => ({
    datum: kolommen.datum >= 0 ? r[kolommen.datum] : '',
    nieuw: kolommen.nieuw >= 0 ? getal(r[kolommen.nieuw]) : 0,
    installaties: kolommen.installaties >= 0 ? getal(r[kolommen.installaties]) : 0,
    toestellen: kolommen.toestellen >= 0 ? getal(r[kolommen.toestellen]) : 0,
  }))

  return {
    dagen,
    ontbreekt,
    nieuw: dagen.reduce((a, d) => a + d.nieuw, 0),
    installaties: dagen.reduce((a, d) => a + d.installaties, 0),
    toestellen: dagen.length ? dagen[dagen.length - 1].toestellen : 0,
  }
}
