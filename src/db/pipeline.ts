import { db } from './index.ts';

/**
 * De weg die een lead aflegt, van gescande website naar hostingklant.
 * `open` betekent: staat nog op de werklijst van een agent.
 */
export const FASES = [
  { id: 'nieuw',      label: 'Nieuw',            open: true,  uitleg: 'Gescand, nog niemand mee bezig' },
  { id: 'toegewezen', label: 'Toegewezen',       open: true,  uitleg: 'Op de lijst van een agent' },
  { id: 'gebeld',     label: 'Gebeld',           open: true,  uitleg: 'Gesproken, nog geen besluit' },
  { id: 'geen_gehoor',label: 'Geen gehoor',      open: true,  uitleg: 'Niet bereikt, later opnieuw' },
  { id: 'afspraak',   label: 'Afspraak',         open: true,  uitleg: 'Afspraak of terugbelmoment staat' },
  { id: 'akkoord',    label: 'Akkoord',          open: true,  uitleg: 'Zegt ja tegen de gratis verbetering' },
  { id: 'in_aanbouw', label: 'In aanbouw',       open: true,  uitleg: 'Nieuwe site wordt gebouwd' },
  { id: 'live',       label: 'Live',             open: true,  uitleg: 'Site staat live op onze hosting' },
  { id: 'klant',      label: 'Klant',            open: false, uitleg: 'Betaalt maandelijks voor hosting' },
  { id: 'afgewezen',  label: 'Afgewezen',        open: false, uitleg: 'Geen interesse' },
] as const;

export type Fase = (typeof FASES)[number]['id'];

const FASE_IDS = new Set<string>(FASES.map((fase) => fase.id));

export const SOORTEN = ['gebeld', 'voicemail', 'mail', 'afspraak', 'notitie', 'fase', 'testimonial'] as const;
export type Soort = (typeof SOORTEN)[number];

export type Activiteit = {
  id: number;
  company_id: number;
  gebruiker_id: number | null;
  gebruiker_naam: string | null;
  soort: Soort;
  uitkomst: string | null;
  notitie: string | null;
  op: string;
};

function zorgVoorRij(companyId: number): void {
  db().prepare('INSERT OR IGNORE INTO opvolging (company_id) VALUES (?)').run(companyId);
}

export function logActiviteit(input: {
  companyId: number; gebruikerId?: number | null; soort: Soort;
  uitkomst?: string | null; notitie?: string | null;
}): void {
  db().prepare('INSERT INTO activiteiten (company_id, gebruiker_id, soort, uitkomst, notitie) VALUES (?, ?, ?, ?, ?)')
    .run(input.companyId, input.gebruikerId ?? null, input.soort, input.uitkomst ?? null, input.notitie ?? null);
}

export function activiteiten(companyId: number, limit = 50): Activiteit[] {
  return db().prepare(`
    SELECT a.*, g.naam AS gebruiker_naam
    FROM activiteiten a LEFT JOIN gebruikers g ON g.id = a.gebruiker_id
    WHERE a.company_id = ? ORDER BY a.op DESC, a.id DESC LIMIT ?
  `).all(companyId, limit) as never;
}

/** Verzet de fase en legt dat vast in de geschiedenis. */
export function zetFase(companyId: number, fase: Fase, gebruikerId?: number | null, notitie?: string): void {
  if (!FASE_IDS.has(fase)) throw new Error(`Onbekende fase "${fase}".`);
  zorgVoorRij(companyId);
  db().prepare(`
    UPDATE opvolging SET fase = ?, notitie = COALESCE(?, notitie),
      bijgewerkt_op = datetime('now'), bijgewerkt_door = ?
    WHERE company_id = ?
  `).run(fase, notitie ?? null, gebruikerId ?? null, companyId);
  logActiviteit({ companyId, gebruikerId, soort: 'fase', uitkomst: fase, notitie: notitie ?? null });
}

/** Wijst een lead toe aan een agent. Zonder gebruiker geeft het de lead weer vrij. */
export function wijsToe(companyId: number, agentId: number | null, doorGebruikerId?: number | null): void {
  zorgVoorRij(companyId);
  db().prepare(`
    UPDATE opvolging SET toegewezen_aan = ?, toegewezen_op = CASE WHEN ? IS NULL THEN NULL ELSE datetime('now') END,
      fase = CASE WHEN ? IS NOT NULL AND fase = 'nieuw' THEN 'toegewezen' ELSE fase END,
      bijgewerkt_op = datetime('now'), bijgewerkt_door = ?
    WHERE company_id = ?
  `).run(agentId, agentId, agentId, doorGebruikerId ?? null, companyId);
}

/**
 * Een agent pakt een vrije lead op. Geeft false als een ander hem al heeft —
 * zo bellen twee mensen niet hetzelfde bedrijf.
 */
export function claim(companyId: number, agentId: number): boolean {
  zorgVoorRij(companyId);
  const result = db().prepare(`
    UPDATE opvolging SET toegewezen_aan = ?, toegewezen_op = datetime('now'),
      fase = CASE WHEN fase = 'nieuw' THEN 'toegewezen' ELSE fase END,
      bijgewerkt_op = datetime('now'), bijgewerkt_door = ?
    WHERE company_id = ? AND (toegewezen_aan IS NULL OR toegewezen_aan = ?)
  `).run(agentId, agentId, companyId, agentId);
  return Number(result.changes ?? 0) > 0;
}

export function zetVolgendeActie(companyId: number, datum: string | null): void {
  zorgVoorRij(companyId);
  db().prepare("UPDATE opvolging SET volgende_actie_op = ?, bijgewerkt_op = datetime('now') WHERE company_id = ?")
    .run(datum, companyId);
}

// --- klanten ---------------------------------------------------------------

export function maakKlant(companyId: number, input: {
  door?: number | null; pakket?: string; maandbedragCent: number; gestartOp?: string; status?: 'proef' | 'actief';
}): void {
  db().prepare(`
    INSERT INTO klanten (company_id, binnengehaald_door, pakket, maandbedrag_cent, gestart_op, status)
    VALUES (?, ?, ?, ?, COALESCE(?, date('now')), ?)
    ON CONFLICT(company_id) DO UPDATE SET
      pakket = excluded.pakket, maandbedrag_cent = excluded.maandbedrag_cent,
      status = excluded.status, opgezegd_op = NULL
  `).run(companyId, input.door ?? null, input.pakket ?? 'hosting',
         Math.round(input.maandbedragCent), input.gestartOp ?? null, input.status ?? 'actief');
  zetFase(companyId, 'klant', input.door ?? null, `Hosting gestart: € ${(input.maandbedragCent / 100).toFixed(2)} per maand`);
}

export function zegKlantOp(companyId: number, datum?: string): void {
  db().prepare("UPDATE klanten SET status = 'opgezegd', opgezegd_op = COALESCE(?, date('now')) WHERE company_id = ?")
    .run(datum ?? null, companyId);
}

export type Omzet = {
  actieveKlanten: number;
  proefKlanten: number;
  mrrCent: number;
  jaaromzetCent: number;
  gemiddeldeKlantCent: number;
  opgezegd: number;
};

export function omzet(): Omzet {
  const rij = db().prepare(`
    SELECT
      SUM(CASE WHEN status = 'actief'   THEN 1 ELSE 0 END) AS actief,
      SUM(CASE WHEN status = 'proef'    THEN 1 ELSE 0 END) AS proef,
      SUM(CASE WHEN status = 'opgezegd' THEN 1 ELSE 0 END) AS opgezegd,
      SUM(CASE WHEN status = 'actief'   THEN maandbedrag_cent ELSE 0 END) AS mrr
    FROM klanten
  `).get() as Record<string, number | null>;

  const actief = Number(rij.actief ?? 0);
  const mrr = Number(rij.mrr ?? 0);
  return {
    actieveKlanten: actief,
    proefKlanten: Number(rij.proef ?? 0),
    opgezegd: Number(rij.opgezegd ?? 0),
    mrrCent: mrr,
    jaaromzetCent: mrr * 12,
    gemiddeldeKlantCent: actief > 0 ? Math.round(mrr / actief) : 0,
  };
}

// --- testimonials ----------------------------------------------------------

export function bewaarTestimonial(companyId: number, input: {
  tekst: string; sterren?: number | null; contactpersoon?: string | null;
  publiceerbaar?: boolean; gebruikerId?: number | null;
}): void {
  db().prepare(`
    INSERT INTO testimonials (company_id, tekst, sterren, contactpersoon, publiceerbaar, gebruiker_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(company_id) DO UPDATE SET
      tekst = excluded.tekst, sterren = excluded.sterren,
      contactpersoon = excluded.contactpersoon, publiceerbaar = excluded.publiceerbaar
  `).run(companyId, input.tekst.trim(), input.sterren ?? null, input.contactpersoon ?? null,
         input.publiceerbaar ? 1 : 0, input.gebruikerId ?? null);
  logActiviteit({ companyId, gebruikerId: input.gebruikerId, soort: 'testimonial', uitkomst: `${input.sterren ?? '-'} sterren` });
}

export const testimonials = (alleenPubliceerbaar = false) =>
  db().prepare(`
    SELECT t.*, c.name AS bedrijf, c.domain, c.city
    FROM testimonials t JOIN companies c ON c.id = t.company_id
    ${alleenPubliceerbaar ? 'WHERE t.publiceerbaar = 1' : ''}
    ORDER BY t.ontvangen_op DESC
  `).all() as never[];

// --- teamoverzicht ---------------------------------------------------------

export type TeamRegel = {
  gebruiker_id: number; naam: string; rol: string;
  toegewezen: number; open: number; gebeld_7d: number;
  afspraken: number; klanten: number; mrr_cent: number; testimonials: number;
};

export function teamOverzicht(): TeamRegel[] {
  const openFases = FASES.filter((fase) => fase.open).map((fase) => `'${fase.id}'`).join(',');
  return db().prepare(`
    SELECT
      g.id AS gebruiker_id, g.naam, g.rol,
      (SELECT COUNT(*) FROM opvolging o WHERE o.toegewezen_aan = g.id) AS toegewezen,
      (SELECT COUNT(*) FROM opvolging o WHERE o.toegewezen_aan = g.id AND o.fase IN (${openFases})) AS open,
      (SELECT COUNT(*) FROM activiteiten a WHERE a.gebruiker_id = g.id AND a.soort IN ('gebeld','voicemail')
         AND a.op > datetime('now','-7 days')) AS gebeld_7d,
      (SELECT COUNT(*) FROM opvolging o WHERE o.toegewezen_aan = g.id AND o.fase = 'afspraak') AS afspraken,
      (SELECT COUNT(*) FROM klanten k WHERE k.binnengehaald_door = g.id AND k.status = 'actief') AS klanten,
      (SELECT COALESCE(SUM(k.maandbedrag_cent), 0) FROM klanten k
         WHERE k.binnengehaald_door = g.id AND k.status = 'actief') AS mrr_cent,
      (SELECT COUNT(*) FROM testimonials t WHERE t.gebruiker_id = g.id) AS testimonials
    FROM gebruikers g
    WHERE g.actief = 1
    ORDER BY mrr_cent DESC, klanten DESC, g.naam
  `).all() as never;
}

/** Aantal leads per fase, voor de trechter in het dashboard. */
export function trechter(agentId?: number | null): { fase: string; label: string; aantal: number }[] {
  const rijen = db().prepare(`
    SELECT COALESCE(o.fase, 'nieuw') AS fase, COUNT(*) AS aantal
    FROM companies c
    LEFT JOIN opvolging o ON o.company_id = c.id
    WHERE (? IS NULL OR o.toegewezen_aan = ?)
    GROUP BY 1
  `).all(agentId ?? null, agentId ?? null) as unknown as { fase: string; aantal: number }[];

  const perFase = new Map(rijen.map((rij) => [rij.fase, Number(rij.aantal)]));
  return FASES.map((fase) => ({ fase: fase.id, label: fase.label, aantal: perFase.get(fase.id) ?? 0 }));
}
