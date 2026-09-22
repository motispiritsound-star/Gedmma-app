/**
 * De lezer: de boeken staan op de website en alleen wie ze gekocht heeft komt erbij.
 *
 * Hoe het werkt, in vier stappen:
 *
 * 1. De betaalpartner meldt een verkoop bij `/koop`.
 * 2. Deze worker maakt een sleutel van zestien willekeurige bytes, bewaart
 *    alleen de hash ervan, en mailt de koper een adres met de sleutel erachter
 *    de hekjes: `darijaforkids.eu/lezen#<sleutel>`.
 * 3. De lezer in de browser stuurt die sleutel mee bij elk verzoek.
 * 4. Elke bladzijde komt als afbeelding uit R2, en alleen als de sleutel klopt.
 *
 * Waarom achter een hekje en niet in het pad: alles na een `#` gaat nooit naar
 * een server. Het staat niet in onze logboeken, niet in die van Cloudflare, en
 * niet in de verwijzende koptekst als de lezer ergens op klikt. Zet je de
 * sleutel in het pad, dan staat hij binnen een dag in drie logbestanden.
 *
 * Wat dit niet is: onkraakbaar. Wie de boeken wil doorgeven, maakt
 * schermafdrukken. Dat kan bij elk systeem ter wereld en het is de reden dat
 * de naam van de koper ook gewoon op elke bladzijde staat. Wat dit wél doet,
 * is de makkelijke weg afsluiten: je kunt geen bestand doorsturen dat je niet
 * hebt.
 */

export interface Bestelling {
  id: string
  email: string
  reeksen: string
  taal: string
  merk: string
  ingetrokken: number | null
}

/** De sleutel die in de mail gaat. Zestien bytes is ruim: raden kan niet. */
export const maakSleutel = (): string => {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/** Wat er in de database komt te staan. De sleutel zelf nooit. */
export async function hashVan(sleutel: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sleutel))
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/**
 * De sleutel omzetten in een bestelling, of niets.
 *
 * Een ingetrokken sleutel geeft hetzelfde antwoord als een sleutel die nooit
 * heeft bestaan. Wie een link probeert, hoort niet te weten of hij ooit goed
 * was.
 */
export async function bestellingVan(db: D1Database, sleutel: string): Promise<Bestelling | null> {
  if (!/^[0-9a-f]{32}$/.test(sleutel)) return null
  const rij = await db
    .prepare('SELECT id, email, reeksen, taal, merk, ingetrokken FROM bestelling WHERE sleutel_hash = ?')
    .bind(await hashVan(sleutel))
    .first<Bestelling>()
  if (!rij || rij.ingetrokken) return null
  return rij
}

/**
 * Bijhouden dat een sleutel gebruikt is.
 *
 * Eén regel per sleutel per dag per plek. Niet om te volgen wie wat leest —
 * er staat geen bladzijde in en geen ip, alleen een hash. Het beantwoordt één
 * vraag: gaat deze sleutel rond? Een gezin leest vanaf twee of drie plekken.
 * Veertig is iets anders, en dan wil je dat kunnen zien.
 */
export async function tekAan(db: D1Database, id: string, ipHash: string): Promise<void> {
  const dag = new Date().toISOString().slice(0, 10)
  await db
    .prepare(`INSERT INTO opening (bestelling_id, dag, ip_hash, aantal) VALUES (?, ?, ?, 1)
              ON CONFLICT (bestelling_id, dag, ip_hash) DO UPDATE SET aantal = aantal + 1`)
    .bind(id, dag, ipHash)
    .run()
}

/** Hoeveel verschillende plekken deze sleutel de laatste dertig dagen gebruikten. */
export async function plekken(db: D1Database, id: string): Promise<number> {
  const grens = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)
  const rij = await db
    .prepare('SELECT COUNT(DISTINCT ip_hash) AS n FROM opening WHERE bestelling_id = ? AND dag >= ?')
    .bind(id, grens)
    .first<{ n: number }>()
  return rij?.n ?? 0
}
