/**
 * Het ledenportaal: één adres, alles wat daarbij hoort.
 *
 * Tot nu toe stonden de nieuwsbrieflijst en de bestellingen los van elkaar:
 * twee tabellen die toevallig hetzelfde e-mailadres bevatten. Dat is genoeg om
 * een boek te openen vanuit een mail, maar niet om ergens terug te komen. Dit
 * voegt de derde tafel toe waar ze beide aan zitten — het lid — en de manier
 * om je daar bekend te maken.
 *
 * **Geen wachtwoorden.** Je vult je adres in, krijgt een link, en bent binnen;
 * dat ding onthoudt je negentig dagen. Dat is geen luie keuze maar de veilige:
 *
 *  - Een wachtwoord is het enige onderdeel van dit systeem dat iemand écht kan
 *    schaden als het uitlekt, en ouders hergebruiken wachtwoorden.
 *  - "Ik ben mijn wachtwoord kwijt" is de meest voorkomende supportvraag van
 *    elk betaald product. Die vraag bestaat hier niet.
 *  - Er wordt hoe dan ook al een bevestigd e-mailadres verzameld. Dat ís de
 *    inlog. Een wachtwoord erbij zegt niets extra's over wie er binnenkomt.
 *
 * Wat hier nooit in de database komt: de inlogsleutel zelf, alleen zijn hash.
 * Lekt deze tabel, dan lekt er geen toegang mee — net als bij de leessleutel.
 */
import { hashVan } from './lezer'

export interface PortaalEnv {
  DB: D1Database
  BASIS: string
  /** Waar de website staat, bijvoorbeeld https://darijaforkids.eu */
  SITE?: string
  ZOUT: string
}

export interface Lid {
  id: string
  email: string
  taal: string
  nieuws: number
  gewist_op: number | null
}

const nu = (): number => Math.floor(Date.now() / 1000)

const bytes = (n: number): string => {
  const b = new Uint8Array(n)
  crypto.getRandomValues(b)
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export const netjes = (email: string): string => email.trim().toLowerCase()

/** Hoe lang een inloglink geldig is, en hoe lang je daarna binnen blijft. */
export const LINK_GELDIG = 30 * 60
export const SESSIE_GELDIG = 90 * 24 * 60 * 60
/** Niet vaker dan dit een nieuwe inlogmail naar hetzelfde adres. */
export const WACHTTIJD = 60

/**
 * De koekjesregel.
 *
 * Op het hoofddomein en niet op de subdomein waar deze worker draait, want de
 * website vraagt hem op vanaf darijaforkids.eu. `SameSite=Lax` is hier de
 * juiste: de sessie moet meekomen als iemand vanuit zijn mailprogramma op de
 * link klikt, en mag niet meekomen bij een verzoek dat een andere site stiekem
 * opzet.
 */
export const koekje = (token: string, site: string | undefined, maxAge: number): string => {
  const domein = site ? new URL(site).hostname.replace(/^www\./, '') : ''
  return [
    `dfk_sessie=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    domein ? `Domain=.${domein}` : '',
  ].filter(Boolean).join('; ')
}

export const sessieUit = (koek: string | null): string | null => {
  const m = /(?:^|;\s*)dfk_sessie=([0-9a-f]{32})(?:;|$)/.exec(koek ?? '')
  return m ? m[1]! : null
}

/* ------------------------------------------------------------- de tafels */

export async function lidVanEmail(db: D1Database, email: string): Promise<Lid | null> {
  return await db
    .prepare('SELECT id, email, taal, nieuws, gewist_op FROM lid WHERE email = ?')
    .bind(netjes(email))
    .first<Lid>()
}

/**
 * Een lid maken of bijwerken, met het bewijs erbij.
 *
 * "Ze hebben ja gezegd" is onder de AVG iets wat je moet kunnen laten zien en
 * niet alleen beweren. Daarom staat er bij elk vinkje wanneer het is gezet, en
 * onder welke versie van de tekst.
 */
export async function schrijfIn(
  db: D1Database,
  gegevens: { email: string; taal: string; nieuws: boolean; tekstVersie: string; ipHash: string | null },
): Promise<Lid> {
  const email = netjes(gegevens.email)
  const t = nu()
  const bestaand = await lidVanEmail(db, email)
  if (bestaand) {
    // Een bestaand lid dat opnieuw inschrijft mag de nieuwsbrief aanzetten,
    // maar een eerder gegeven ja mag er niet stilletjes vanaf vallen.
    await db
      .prepare(`UPDATE lid SET taal = ?, nieuws = MAX(nieuws, ?), nieuws_op = CASE WHEN ? = 1 AND nieuws_op IS NULL THEN ? ELSE nieuws_op END,
                gewist_op = NULL WHERE id = ?`)
      .bind(gegevens.taal, gegevens.nieuws ? 1 : 0, gegevens.nieuws ? 1 : 0, t, bestaand.id)
      .run()
    return { ...bestaand, taal: gegevens.taal, nieuws: bestaand.nieuws || (gegevens.nieuws ? 1 : 0), gewist_op: null }
  }
  const id = bytes(8)
  await db
    .prepare(`INSERT INTO lid (id, email, taal, voorwaarden_op, leeftijd_op, nieuws, nieuws_op,
              tekst_versie, ip_hash, aangemaakt_op) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, email, gegevens.taal, t, t, gegevens.nieuws ? 1 : 0, gegevens.nieuws ? t : null,
      gegevens.tekstVersie, gegevens.ipHash, t)
    .run()
  return { id, email, taal: gegevens.taal, nieuws: gegevens.nieuws ? 1 : 0, gewist_op: null }
}

/** Te vaak achter elkaar een inlogmail vragen is geen inloggen maar spammen. */
export async function magOpnieuw(db: D1Database, lidId: string): Promise<boolean> {
  const rij = await db
    .prepare(`SELECT gemaakt_op FROM sessie WHERE lid_id = ? AND soort = 'link' ORDER BY gemaakt_op DESC LIMIT 1`)
    .bind(lidId)
    .first<{ gemaakt_op: number }>()
  return !rij || nu() - rij.gemaakt_op >= WACHTTIJD
}

/** Een inloglink: eenmalig, een half uur geldig, en alleen als hash bewaard. */
export async function maakLink(db: D1Database, lidId: string): Promise<string> {
  const token = bytes(16)
  await db
    .prepare(`INSERT INTO sessie (token_hash, lid_id, soort, gemaakt_op, verloopt_op) VALUES (?, ?, 'link', ?, ?)`)
    .bind(await hashVan(token), lidId, nu(), nu() + LINK_GELDIG)
    .run()
  return token
}

/**
 * De link inwisselen voor een sessie.
 *
 * Eenmalig: de link wordt afgestempeld voordat de sessie wordt gemaakt. Wie
 * hem daarna nog eens opent — een mailprogramma dat links vooruit ophaalt,
 * iemand die de mail doorstuurt — komt er niet mee binnen.
 */
export async function wisselIn(db: D1Database, token: string): Promise<{ lid: Lid; sessie: string } | null> {
  if (!/^[0-9a-f]{32}$/.test(token)) return null
  const hash = await hashVan(token)
  const rij = await db
    .prepare(`SELECT lid_id, verloopt_op, gebruikt_op FROM sessie WHERE token_hash = ? AND soort = 'link'`)
    .bind(hash)
    .first<{ lid_id: string; verloopt_op: number; gebruikt_op: number | null }>()
  if (!rij || rij.gebruikt_op || rij.verloopt_op < nu()) return null

  await db.prepare('UPDATE sessie SET gebruikt_op = ? WHERE token_hash = ?').bind(nu(), hash).run()
  const lid = await db
    .prepare('SELECT id, email, taal, nieuws, gewist_op FROM lid WHERE id = ?')
    .bind(rij.lid_id)
    .first<Lid>()
  if (!lid || lid.gewist_op) return null

  const sessie = bytes(16)
  await db
    .prepare(`INSERT INTO sessie (token_hash, lid_id, soort, gemaakt_op, verloopt_op) VALUES (?, ?, 'sessie', ?, ?)`)
    .bind(await hashVan(sessie), lid.id, nu(), nu() + SESSIE_GELDIG)
    .run()
  await db.prepare('UPDATE lid SET laatste_bezoek = ? WHERE id = ?').bind(nu(), lid.id).run()
  return { lid, sessie }
}

/** Wie er binnen is, of niemand. Een verlopen sessie is niemand. */
export async function wieIsDit(db: D1Database, token: string | null): Promise<Lid | null> {
  if (!token || !/^[0-9a-f]{32}$/.test(token)) return null
  const rij = await db
    .prepare(`SELECT lid_id, verloopt_op FROM sessie WHERE token_hash = ? AND soort = 'sessie'`)
    .bind(await hashVan(token))
    .first<{ lid_id: string; verloopt_op: number }>()
  if (!rij || rij.verloopt_op < nu()) return null
  const lid = await db
    .prepare('SELECT id, email, taal, nieuws, gewist_op FROM lid WHERE id = ?')
    .bind(rij.lid_id)
    .first<Lid>()
  return lid && !lid.gewist_op ? lid : null
}

export async function logUit(db: D1Database, token: string | null): Promise<void> {
  if (!token || !/^[0-9a-f]{32}$/.test(token)) return
  await db.prepare('DELETE FROM sessie WHERE token_hash = ?').bind(await hashVan(token)).run()
}

/**
 * Wat dit lid gekocht heeft.
 *
 * Op e-mailadres, want dat is wat de betaalpartner doorgeeft. Een bestelling
 * die vóór het account is gedaan hoort er dus vanzelf bij zodra iemand zich
 * met hetzelfde adres aanmeldt — en dat is precies de volgorde waarin het
 * gebeurt.
 */
export async function bezit(db: D1Database, email: string): Promise<{ reeksen: string[]; sinds: number | null }> {
  const rijen = await db
    .prepare('SELECT reeksen, gekocht_op FROM bestelling WHERE email = ? AND ingetrokken IS NULL ORDER BY gekocht_op')
    .bind(netjes(email))
    .all<{ reeksen: string; gekocht_op: number }>()
  const alles = new Set<string>()
  for (const rij of rijen.results ?? []) {
    for (const reeks of rij.reeksen.split(',')) if (reeks.trim()) alles.add(reeks.trim())
  }
  return { reeksen: [...alles].sort(), sinds: rijen.results?.[0]?.gekocht_op ?? null }
}

/**
 * Wie er een nieuwsbrief mag krijgen.
 *
 * Hier staat één regel meer in dan je zou verwachten: `laatste_bezoek IS NOT
 * NULL`. Dat is de bevestiging, en zonder die regel is deze lijst onbruikbaar.
 *
 * Aanmelden kan namelijk met elk adres. Iemand typt het adres van zijn buurman
 * in, zet het vinkje voor de nieuwsbrief aan, en er staat een rij in de tafel
 * waar die buurman nooit om heeft gevraagd. Dat is geen bedacht gevaar maar de
 * gewone gang van zaken bij elk formulier op internet, en het is precies wat de
 * AVG bedoelt met toestemming die van de betrokkene zelf moet komen.
 *
 * `laatste_bezoek` wordt op één plek gezet: in `wisselIn`, als iemand op de
 * link in zijn mail heeft geklikt. Dat kan alleen wie bij die mailbox kan. Het
 * is dus geen bezoekteller maar een bewijs, en daarom staat deze functie hier
 * en niet als losse query in een script — een query wordt overgetypt zonder de
 * regel die ertoe doet.
 *
 * Wie hier ooit een nieuwsbrief mee gaat versturen: dit is de lijst. Niet
 * `SELECT email FROM lid WHERE nieuws = 1`.
 */
export async function nieuwsbrieflijst(
  db: D1Database,
): Promise<{ email: string; taal: string }[]> {
  const rijen = await db
    .prepare(`SELECT email, taal FROM lid
              WHERE nieuws = 1 AND gewist_op IS NULL AND laatste_bezoek IS NOT NULL
              ORDER BY aangemaakt_op`)
    .all<{ email: string; taal: string }>()
  return rijen.results ?? []
}

/**
 * Verlopen sessies en gebruikte links opruimen.
 *
 * Elke inlogpoging laat een rij achter, en die rijen doen na hun vervaldatum
 * niets meer dan ruimte innemen. Eén keer per week is ruim voldoende: het gaat
 * om tientallen rijen, niet om duizenden.
 */
export async function ruimOp(db: D1Database): Promise<number> {
  const uit = await db
    .prepare('DELETE FROM sessie WHERE verloopt_op < ?')
    .bind(nu())
    .run()
  return uit.meta?.changes ?? 0
}

export async function zetNieuws(db: D1Database, lidId: string, aan: boolean): Promise<void> {
  await db
    .prepare(`UPDATE lid SET nieuws = ?, nieuws_op = CASE WHEN ? = 1 THEN ? ELSE nieuws_op END WHERE id = ?`)
    .bind(aan ? 1 : 0, aan ? 1 : 0, nu(), lidId)
    .run()
}
