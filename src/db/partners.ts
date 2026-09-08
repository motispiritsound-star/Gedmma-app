/**
 * Partners: de tweede laag van het verdienmodel.
 *
 * Laag één is je eigen werk — sites herbouwen en hosten, elke klant een
 * maandbedrag. Die laag groeit met jouw uren.
 *
 * Laag twee groeit zonder jouw uren: je geeft iemand anders het systeem, een
 * eigen gebied en het draaiboek, en die bouwt daar zijn eigen klantenbestand
 * mee op. Hij betaalt jou per maand voor de toegang en het gebied; de klanten
 * die hij binnenhaalt blijven van hem.
 *
 * Het gebied is wat hij koopt. Zonder exclusiviteit betaalt niemand maandelijks
 * voor gereedschap dat hij ook één keer zou kunnen kopen, en gaan twee partners
 * dezelfde bakker bellen.
 */
import { db } from './index.ts';
import { leesProvisie, provisieVan } from './instellingen.ts';
import { teamOverzicht } from './pipeline.ts';

export const ABONNEMENT_STATUS = ['geen', 'proef', 'actief', 'gestopt'] as const;
export type AbonnementStatus = (typeof ABONNEMENT_STATUS)[number];

export type Partner = {
  id: number;
  naam: string;
  email: string;
  rol: string;
  actief: number;
  /** Plaatsen die van deze partner zijn, als lijst. */
  gebied: string[];
  abonnementCent: number;
  abonnementStatus: AbonnementStatus;
  gestartOp: string | null;
};

type Rij = {
  id: number; naam: string; email: string; rol: string; actief: number;
  gebied: string | null; abonnement_cent: number; abonnement_status: string; gestart_op: string | null;
};

const naarPartner = (rij: Rij): Partner => ({
  id: Number(rij.id),
  naam: rij.naam,
  email: rij.email,
  rol: rij.rol,
  actief: Number(rij.actief),
  gebied: (rij.gebied ?? '').split(',').map((deel) => deel.trim()).filter(Boolean),
  abonnementCent: Number(rij.abonnement_cent ?? 0),
  abonnementStatus: (ABONNEMENT_STATUS as readonly string[]).includes(rij.abonnement_status)
    ? (rij.abonnement_status as AbonnementStatus) : 'geen',
  gestartOp: rij.gestart_op,
});

export function partners(): Partner[] {
  return (db().prepare(`
    SELECT id, naam, email, rol, actief, gebied, abonnement_cent, abonnement_status, gestart_op
    FROM gebruikers WHERE actief = 1 ORDER BY rol = 'eigenaar' DESC, naam
  `).all() as unknown as Rij[]).map(naarPartner);
}

export function partner(id: number): Partner | null {
  const rij = db().prepare(`
    SELECT id, naam, email, rol, actief, gebied, abonnement_cent, abonnement_status, gestart_op
    FROM gebruikers WHERE id = ?
  `).get(id) as Rij | undefined;
  return rij ? naarPartner(rij) : null;
}

/** Zet gebied en abonnement van een partner. Alleen wat je meegeeft verandert. */
export function bewaarPartner(id: number, input: {
  gebied?: string[] | string;
  abonnementCent?: number;
  abonnementStatus?: AbonnementStatus;
}): Partner {
  const bestaand = partner(id);
  if (!bestaand) throw new Error(`Geen gebruiker met nummer ${id}.`);

  if (input.gebied !== undefined) {
    const lijst = Array.isArray(input.gebied)
      ? input.gebied
      : String(input.gebied).split(',');
    const schoon = [...new Set(lijst.map((deel) => deel.trim()).filter(Boolean))];
    db().prepare('UPDATE gebruikers SET gebied = ? WHERE id = ?').run(schoon.join(', ') || null, id);
  }
  if (input.abonnementCent !== undefined) {
    db().prepare('UPDATE gebruikers SET abonnement_cent = ? WHERE id = ?')
      .run(Math.max(0, Math.round(input.abonnementCent)), id);
  }
  if (input.abonnementStatus !== undefined) {
    if (!(ABONNEMENT_STATUS as readonly string[]).includes(input.abonnementStatus)) {
      throw new Error(`Onbekende status "${input.abonnementStatus}".`);
    }
    db().prepare('UPDATE gebruikers SET abonnement_status = ? WHERE id = ?')
      .run(input.abonnementStatus, id);
    // De startdatum zetten we bij de eerste keer dat het abonnement gaat lopen.
    if (['proef', 'actief'].includes(input.abonnementStatus) && !bestaand.gestartOp) {
      db().prepare("UPDATE gebruikers SET gestart_op = date('now') WHERE id = ?").run(id);
    }
  }
  return partner(id)!;
}

/**
 * De bedrijven die in het gebied van een partner liggen maar nog van niemand
 * zijn. Dat is zijn voorraad; hij hoeft er niet om te vragen.
 */
export function vrijInGebied(partnerId: number, limit = 50): { id: number; name: string; city: string | null }[] {
  const wie = partner(partnerId);
  if (!wie || wie.gebied.length === 0) return [];
  const plaatsen = wie.gebied.map(() => '?').join(',');
  return db().prepare(`
    SELECT c.id, c.name, c.city
    FROM companies c
    LEFT JOIN opvolging o ON o.company_id = c.id
    LEFT JOIN benaderregels b ON b.company_id = c.id
    WHERE c.city IN (${plaatsen})
      AND c.score IS NOT NULL
      AND o.toegewezen_aan IS NULL
      AND COALESCE(b.geblokkeerd, 0) = 0
    ORDER BY c.prioriteit DESC NULLS LAST
    LIMIT ?
  `).all(...wie.gebied, limit) as never;
}

/** Wijst alle vrije bedrijven in zijn gebied toe aan de partner. */
export function verdeelGebied(partnerId: number, limit = 500): number {
  const rijen = vrijInGebied(partnerId, limit);
  const zet = db().prepare(`
    INSERT INTO opvolging (company_id, fase, toegewezen_aan, toegewezen_op)
    VALUES (?, 'toegewezen', ?, datetime('now'))
    ON CONFLICT(company_id) DO UPDATE SET
      toegewezen_aan = excluded.toegewezen_aan,
      toegewezen_op = excluded.toegewezen_op,
      fase = CASE WHEN opvolging.fase = 'nieuw' THEN 'toegewezen' ELSE opvolging.fase END
    WHERE opvolging.toegewezen_aan IS NULL
  `);
  let aantal = 0;
  for (const rij of rijen) { zet.run(rij.id, partnerId); aantal++; }
  return aantal;
}

export type PartnerRegel = Partner & {
  /** Wat hij zelf aan hostingklanten heeft staan. */
  klanten: number;
  eigenMrrCent: number;
  opdrachten: number;
  /** Wat jij aan hem verdient: zijn abonnement. */
  abonnementPerMaandCent: number;
  /** Wat hij aan provisie opbouwt, als je met provisie werkt in plaats van abonnement. */
  provisieEenmaligCent: number;
  provisiePerMaandCent: number;
  bedrijvenInGebied: number;
  vrijInGebied: number;
};

/** Het partneroverzicht: wat elke partner doet, en wat het jou oplevert. */
export function partnerOverzicht(): PartnerRegel[] {
  const regeling = leesProvisie();
  const team = new Map(teamOverzicht().map((regel) => [Number(regel.gebruiker_id), regel]));

  return partners().map((wie) => {
    const regel = team.get(wie.id);
    const verdiend = provisieVan(
      { opdrachten: Number(regel?.opdrachten ?? 0), mrr_cent: Number(regel?.mrr_cent ?? 0) }, regeling,
    );

    let inGebied = 0;
    if (wie.gebied.length > 0) {
      const plaatsen = wie.gebied.map(() => '?').join(',');
      inGebied = Number((db().prepare(
        `SELECT COUNT(*) AS n FROM companies WHERE city IN (${plaatsen}) AND score IS NOT NULL`)
        .get(...wie.gebied) as { n: number }).n);
    }

    return {
      ...wie,
      klanten: Number(regel?.klanten ?? 0),
      eigenMrrCent: Number(regel?.mrr_cent ?? 0),
      opdrachten: Number(regel?.opdrachten ?? 0),
      abonnementPerMaandCent: wie.abonnementStatus === 'actief' ? wie.abonnementCent : 0,
      provisieEenmaligCent: verdiend.eenmaligCent,
      provisiePerMaandCent: verdiend.perMaandCent,
      bedrijvenInGebied: inGebied,
      vrijInGebied: wie.gebied.length > 0 ? vrijInGebied(wie.id, 10_000).length : 0,
    };
  });
}

/**
 * De twee lagen naast elkaar: wat je eigen klanten opbrengen, en wat je
 * partners je per maand betalen.
 */
export function tweeLagen(): {
  eigenKlantenCent: number; eigenKlanten: number;
  partnersCent: number; partnersActief: number; partnersProef: number;
  totaalCent: number;
} {
  const eigen = db().prepare(
    "SELECT COUNT(*) AS aantal, COALESCE(SUM(maandbedrag_cent), 0) AS mrr FROM klanten WHERE status = 'actief'")
    .get() as { aantal: number; mrr: number };

  const laag2 = db().prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN abonnement_status = 'actief' THEN abonnement_cent ELSE 0 END), 0) AS mrr,
      SUM(CASE WHEN abonnement_status = 'actief' THEN 1 ELSE 0 END) AS actief,
      SUM(CASE WHEN abonnement_status = 'proef'  THEN 1 ELSE 0 END) AS proef
    FROM gebruikers WHERE actief = 1
  `).get() as { mrr: number; actief: number | null; proef: number | null };

  const eigenCent = Number(eigen.mrr ?? 0);
  const partnerCent = Number(laag2.mrr ?? 0);
  return {
    eigenKlantenCent: eigenCent,
    eigenKlanten: Number(eigen.aantal ?? 0),
    partnersCent: partnerCent,
    partnersActief: Number(laag2.actief ?? 0),
    partnersProef: Number(laag2.proef ?? 0),
    totaalCent: eigenCent + partnerCent,
  };
}
