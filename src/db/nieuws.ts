/**
 * Het prikbord van het platform: korte berichten van de eigenaar aan het team.
 * Bedoeld voor wat iedereen moet weten — een nieuw aanbod, een regel die
 * verandert, een resultaat om te vieren — zonder dat het via de mail moet.
 */
import { db } from './index.ts';

export const SOORTEN = ['bericht', 'update', 'resultaat', 'let-op'] as const;
export type Soort = (typeof SOORTEN)[number];

export type Nieuwsitem = {
  id: number;
  titel: string;
  tekst: string;
  soort: Soort;
  vastgezet: number;
  door_id: number | null;
  door_naam: string | null;
  gemaakt_op: string;
  gelezen: number;
};

const MAX_TITEL = 120;
const MAX_TEKST = 4000;

export function plaatsNieuws(input: {
  titel: string; tekst: string; soort?: string; vastgezet?: boolean; doorId: number;
}): Nieuwsitem {
  const titel = input.titel.trim();
  const tekst = input.tekst.trim();
  if (titel.length < 3) throw new Error('Geef het bericht een titel van minstens 3 tekens.');
  if (titel.length > MAX_TITEL) throw new Error(`Houd de titel onder ${MAX_TITEL} tekens.`);
  if (tekst.length === 0) throw new Error('Een bericht zonder tekst heeft niemand iets aan.');
  if (tekst.length > MAX_TEKST) throw new Error(`Houd het bericht onder ${MAX_TEKST} tekens.`);

  const soort = (SOORTEN as readonly string[]).includes(input.soort ?? '')
    ? (input.soort as Soort) : 'bericht';

  const resultaat = db().prepare(`
    INSERT INTO nieuws (titel, tekst, soort, vastgezet, door_id)
    VALUES (?, ?, ?, ?, ?)`).run(titel, tekst, soort, input.vastgezet ? 1 : 0, input.doorId);

  // De schrijver hoeft zijn eigen bericht niet als ongelezen te zien.
  const id = Number(resultaat.lastInsertRowid);
  markeerGelezen(id, input.doorId);
  return nieuwsitem(id, input.doorId)!;
}

/** De berichten zoals één gebruiker ze ziet, met vastgezette items bovenaan. */
export function nieuwsLijst(gebruikerId: number, limit = 50): Nieuwsitem[] {
  return db().prepare(`
    SELECT n.id, n.titel, n.tekst, n.soort, n.vastgezet, n.door_id, n.gemaakt_op,
           g.naam AS door_naam,
           CASE WHEN r.nieuws_id IS NULL THEN 0 ELSE 1 END AS gelezen
    FROM nieuws n
    LEFT JOIN gebruikers g     ON g.id = n.door_id
    LEFT JOIN nieuws_gelezen r ON r.nieuws_id = n.id AND r.gebruiker_id = ?
    WHERE n.verwijderd = 0
    ORDER BY n.vastgezet DESC, n.gemaakt_op DESC, n.id DESC
    LIMIT ?`).all(gebruikerId, limit) as Nieuwsitem[];
}

export function nieuwsitem(id: number, gebruikerId: number): Nieuwsitem | null {
  return (db().prepare(`
    SELECT n.id, n.titel, n.tekst, n.soort, n.vastgezet, n.door_id, n.gemaakt_op,
           g.naam AS door_naam,
           CASE WHEN r.nieuws_id IS NULL THEN 0 ELSE 1 END AS gelezen
    FROM nieuws n
    LEFT JOIN gebruikers g     ON g.id = n.door_id
    LEFT JOIN nieuws_gelezen r ON r.nieuws_id = n.id AND r.gebruiker_id = ?
    WHERE n.id = ? AND n.verwijderd = 0`).get(gebruikerId, id) as Nieuwsitem) ?? null;
}

export function markeerGelezen(nieuwsId: number, gebruikerId: number): void {
  db().prepare(`
    INSERT OR IGNORE INTO nieuws_gelezen (nieuws_id, gebruiker_id) VALUES (?, ?)`)
    .run(nieuwsId, gebruikerId);
}

export function markeerAllesGelezen(gebruikerId: number): number {
  const resultaat = db().prepare(`
    INSERT OR IGNORE INTO nieuws_gelezen (nieuws_id, gebruiker_id)
    SELECT id, ? FROM nieuws WHERE verwijderd = 0`).run(gebruikerId);
  return Number(resultaat.changes);
}

export function aantalOngelezen(gebruikerId: number): number {
  const rij = db().prepare(`
    SELECT COUNT(*) AS aantal FROM nieuws n
    LEFT JOIN nieuws_gelezen r ON r.nieuws_id = n.id AND r.gebruiker_id = ?
    WHERE n.verwijderd = 0 AND r.nieuws_id IS NULL`).get(gebruikerId) as { aantal: number };
  return Number(rij.aantal);
}

/** Weghalen laat het bericht staan maar verbergt het; niets gaat verloren. */
export function verwijderNieuws(id: number): boolean {
  return Number(db().prepare('UPDATE nieuws SET verwijderd = 1 WHERE id = ?').run(id).changes) > 0;
}

export function zetVastgezet(id: number, vast: boolean): boolean {
  return Number(db().prepare('UPDATE nieuws SET vastgezet = ? WHERE id = ? AND verwijderd = 0')
    .run(vast ? 1 : 0, id).changes) > 0;
}
