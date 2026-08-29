/**
 * De opvolgmotor: wat moet er vandaag gebeuren?
 *
 * Leads gaan zelden verloren omdat het aanbod niet deugt — ze gaan verloren
 * omdat er na de eerste mail niets meer gebeurt. Deze module kijkt per lead naar
 * de fase en naar wanneer er voor het laatst iets is gedaan, en zegt wat de
 * volgende stap is en hoe laat die had moeten zijn.
 *
 * Er wordt niets automatisch verstuurd: het dashboard zet het werk klaar, de
 * agent drukt op de knop. Dat is bewust — een mail die namens jou de deur uit
 * gaat zonder dat iemand hem gelezen heeft, kost je meer klanten dan hij oplevert.
 */
import { db } from './index.ts';
import { FASES, type Fase } from './pipeline.ts';

/**
 * Hoeveel dagen na de laatste actie de volgende stap hoort te komen, en welke
 * stap dat is. De ritmes komen uit hoe verkopen in het mkb loopt: bellen mag
 * snel opnieuw, een mail geef je een paar dagen, een bouwproject een week.
 */
export const RITME: Record<string, { dagen: number; wat: string; sjabloon?: string }> = {
  nieuw:       { dagen: 0,  wat: 'Oppakken of laten liggen' },
  toegewezen:  { dagen: 1,  wat: 'Eerste mail sturen',                sjabloon: 'eerste-contact' },
  gebeld:      { dagen: 3,  wat: 'Terugkoppelen op het gesprek',      sjabloon: 'na-gesprek' },
  geen_gehoor: { dagen: 1,  wat: 'Opnieuw proberen',                  sjabloon: 'geen-gehoor' },
  afspraak:    { dagen: 0,  wat: 'Afspraak nakomen' },
  opdracht:    { dagen: 2,  wat: 'Gegevens opvragen en beginnen',     sjabloon: 'opdracht-bevestigd' },
  in_aanbouw:  { dagen: 7,  wat: 'Laten zien hoe ver de site is' },
  live:        { dagen: 3,  wat: 'Vragen om een testimonial',         sjabloon: 'testimonial' },
};

/** Na een verstuurde mail zonder reactie: hoelang wachten voor je aandringt. */
const NA_MAIL_DAGEN = 4;
/** Zoveel keer stil na een mail, dan is de laatste poging aan de beurt. */
const LAATSTE_POGING_NA = 2;

export type Werkregel = {
  id: number;
  name: string;
  domain: string;
  city: string | null;
  score: number | null;
  prioriteit: number | null;
  fase: string;
  faseLabel: string;
  toegewezen_aan: number | null;
  agent_naam: string | null;
  telefoon: string | null;
  email: string | null;
  /** Wat er moet gebeuren, in gewone taal. */
  wat: string;
  /** Waarom het nu aan de beurt is. */
  waarom: string;
  /** Het sjabloon dat hierbij hoort, als het een mail is. */
  sjabloon: string | null;
  /** Negatief = nog niet aan de beurt, 0 = vandaag, positief = dagen te laat. */
  dagenTeLaat: number;
  urgentie: 'te-laat' | 'vandaag' | 'binnenkort';
  laatsteActie: string | null;
};

type Rij = {
  id: number; name: string; domain: string; city: string | null;
  score: number | null; prioriteit: number | null; fase: string;
  toegewezen_aan: number | null; agent_naam: string | null;
  volgende_actie_op: string | null;
  telefoon: string | null; email: string | null;
  laatste_op: string | null; laatste_soort: string | null;
  mails_sinds_reactie: number;
};

const LABELS = new Map(FASES.map((fase) => [fase.id as string, fase.label]));

/** Hele dagen tussen twee momenten; negatief als het in de toekomst ligt. */
function dagenGeleden(tijdstip: string | null): number | null {
  if (!tijdstip) return null;
  const toen = new Date(`${tijdstip.replace(' ', 'T')}Z`).getTime();
  if (!Number.isFinite(toen)) return null;
  return Math.floor((Date.now() - toen) / 86_400_000);
}

/**
 * Bepaalt per lead wat de volgende stap is. Een geplande actie gaat voor: die
 * heeft een mens zelf ingepland. Staat er niets gepland, dan bepaalt het ritme
 * van de fase wanneer de lead te lang stil ligt.
 */
function beoordeel(rij: Rij): Werkregel | null {
  const ritme = RITME[rij.fase];
  if (!ritme) return null;

  const basis = {
    id: rij.id, name: rij.name, domain: rij.domain, city: rij.city,
    score: rij.score, prioriteit: rij.prioriteit,
    fase: rij.fase, faseLabel: LABELS.get(rij.fase) ?? rij.fase,
    toegewezen_aan: rij.toegewezen_aan, agent_naam: rij.agent_naam,
    telefoon: rij.telefoon, email: rij.email,
    laatsteActie: rij.laatste_op,
  };

  // 1. Een ingeplande actie: die telt, ongeacht de rest.
  if (rij.volgende_actie_op) {
    const dagen = dagenGeleden(`${rij.volgende_actie_op} 00:00:00`);
    if (dagen === null) return null;
    if (dagen < 0) return null; // staat netjes in de toekomst
    return {
      ...basis,
      wat: ritme.wat,
      waarom: dagen === 0 ? 'Vandaag ingepland' : `${dagen} ${dagen === 1 ? 'dag' : 'dagen'} geleden ingepland`,
      sjabloon: ritme.sjabloon ?? null,
      dagenTeLaat: dagen,
      urgentie: dagen > 0 ? 'te-laat' : 'vandaag',
    };
  }

  // 2. Een verstuurde mail waar niemand op reageerde.
  const stil = dagenGeleden(rij.laatste_op);
  if (rij.laatste_soort === 'mail' && stil !== null && stil >= NA_MAIL_DAGEN) {
    const derde = rij.mails_sinds_reactie >= LAATSTE_POGING_NA;
    return {
      ...basis,
      wat: derde ? 'Laatste poging, daarna loslaten' : 'Herinnering sturen',
      waarom: `${stil} dagen geen reactie op je mail`,
      sjabloon: derde ? 'laatste-poging' : 'geen-gehoor',
      dagenTeLaat: stil - NA_MAIL_DAGEN,
      urgentie: 'te-laat',
    };
  }

  // 3. Het ritme van de fase: te lang niets gedaan.
  if (ritme.dagen > 0) {
    const sinds = stil ?? dagenGeleden(rij.volgende_actie_op) ?? 999;
    if (sinds >= ritme.dagen) {
      return {
        ...basis,
        wat: ritme.wat,
        waarom: rij.laatste_op
          ? `${sinds} dagen niets gedaan in "${basis.faseLabel.toLowerCase()}"`
          : 'Nog niets ondernomen',
        sjabloon: ritme.sjabloon ?? null,
        dagenTeLaat: sinds - ritme.dagen,
        urgentie: sinds - ritme.dagen > 0 ? 'te-laat' : 'vandaag',
      };
    }
  }
  return null;
}

/**
 * De werklijst: wat er vandaag te doen is, het meest achterstallige bovenaan.
 * Zonder agent krijg je alles; met een agent alleen diens eigen leads.
 */
export function werklijst(agentId: number | null = null, limit = 60): Werkregel[] {
  const rijen = db().prepare(`
    SELECT
      c.id, c.name, c.domain, c.city, c.score, c.prioriteit,
      c.contact_telefoon AS telefoon, c.contact_email AS email,
      o.fase, o.toegewezen_aan, o.volgende_actie_op,
      g.naam AS agent_naam,
      (SELECT MAX(a.op) FROM activiteiten a WHERE a.company_id = c.id) AS laatste_op,
      (SELECT a.soort FROM activiteiten a WHERE a.company_id = c.id
         ORDER BY a.op DESC, a.id DESC LIMIT 1) AS laatste_soort,
      (SELECT COUNT(*) FROM activiteiten a WHERE a.company_id = c.id AND a.soort = 'mail'
         AND a.op > COALESCE((SELECT MAX(r.op) FROM activiteiten r
              WHERE r.company_id = c.id AND r.soort = 'reactie'), '0')) AS mails_sinds_reactie
    FROM opvolging o
    JOIN companies c ON c.id = o.company_id
    LEFT JOIN gebruikers g ON g.id = o.toegewezen_aan
    LEFT JOIN benaderregels b ON b.company_id = c.id
    WHERE o.fase NOT IN ('klant', 'afgewezen')
      AND COALESCE(b.geblokkeerd, 0) = 0
      AND (? IS NULL OR o.toegewezen_aan = ?)
    ORDER BY c.prioriteit DESC NULLS LAST
    LIMIT 800
  `).all(agentId, agentId) as unknown as Rij[];

  const uit: Werkregel[] = [];
  for (const rij of rijen) {
    const regel = beoordeel(rij);
    if (regel) uit.push(regel);
  }

  const rang = { 'te-laat': 0, vandaag: 1, binnenkort: 2 } as const;
  uit.sort((a, b) => rang[a.urgentie] - rang[b.urgentie]
    || b.dagenTeLaat - a.dagenTeLaat
    || (b.prioriteit ?? 0) - (a.prioriteit ?? 0));
  return uit.slice(0, limit);
}

/** Korte telling voor de tegels en de menubalk. */
export function werkdruk(agentId: number | null = null): {
  teLaat: number; vandaag: number; totaal: number;
} {
  const lijst = werklijst(agentId, 10_000);
  return {
    teLaat: lijst.filter((regel) => regel.urgentie === 'te-laat').length,
    vandaag: lijst.filter((regel) => regel.urgentie === 'vandaag').length,
    totaal: lijst.length,
  };
}

/** Legt vast dat een bedrijf gereageerd heeft; dat stopt de herinneringen. */
export function legReactieVast(companyId: number, gebruikerId: number | null, notitie?: string): void {
  db().prepare(`
    INSERT INTO activiteiten (company_id, gebruiker_id, soort, notitie) VALUES (?, ?, 'reactie', ?)
  `).run(companyId, gebruikerId, notitie ?? null);
}

export type { Fase };
