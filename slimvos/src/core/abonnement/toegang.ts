import { vindOnderwerp } from '../content/curriculum';
import { MAX_PROFIELEN_BETAALD, PROEF_DAGEN, vindPlan, type PlanId } from './plannen';

/** Het vak dat in de gratis versie helemaal open staat. */
export const GRATIS_VAK = 'rekenen';
/** Hoeveel vragen per dag je in de gratis versie buiten dat vak mag doen. */
export const GRATIS_VRAGEN_PER_DAG = 10;
/** Hoeveel uitlegfilmpjes gratis zijn. */
export const GRATIS_FILMPJES = 3;

export type AbonnementStatus = 'geen' | 'proef' | 'actief' | 'opgezegd' | 'verlopen';

export interface Abonnement {
  plan: PlanId;
  status: AbonnementStatus;
  /** Wanneer de huidige periode afloopt; null bij het gratis plan. */
  looptTot: number | null;
  automatischVerlengen: boolean;
  /** Of de proefperiode al een keer gebruikt is; die krijg je maar één keer. */
  proefGebruikt: boolean;
}

export function gratisAbonnement(): Abonnement {
  return { plan: 'gratis', status: 'geen', looptTot: null, automatischVerlengen: false, proefGebruikt: false };
}

const DAG = 86400000;

export function startProef(abo: Abonnement, plan: PlanId, nu = Date.now()): Abonnement {
  if (abo.proefGebruikt) throw new Error('De proefperiode is al een keer gebruikt.');
  return {
    plan,
    status: 'proef',
    looptTot: nu + PROEF_DAGEN * DAG,
    automatischVerlengen: true,
    proefGebruikt: true,
  };
}

export function activeer(abo: Abonnement, plan: PlanId, nu = Date.now()): Abonnement {
  const duur = vindPlan(plan).periode === 'jaar' ? 365 * DAG : 30 * DAG;
  return { ...abo, plan, status: 'actief', looptTot: nu + duur, automatischVerlengen: true };
}

/** Opzeggen laat de lopende periode gewoon uitlopen — geen opzegtermijn. */
export function zegOp(abo: Abonnement): Abonnement {
  if (abo.status !== 'actief' && abo.status !== 'proef') return abo;
  return { ...abo, status: 'opgezegd', automatischVerlengen: false };
}

export function hervat(abo: Abonnement): Abonnement {
  if (abo.status !== 'opgezegd') return abo;
  return { ...abo, status: 'actief', automatischVerlengen: true };
}

/**
 * Rekent de status bij op basis van de tijd.
 *
 * Een proefperiode die afloopt gaat vanzelf over in een betaald abonnement op
 * hetzelfde plan — dat is precies wat de stores ook doen. Zeg je op, dan loopt
 * de lopende periode uit en val je daarna terug op de gratis versie.
 */
export function huidigeStatus(abo: Abonnement, nu = Date.now()): Abonnement {
  if (abo.looptTot === null || abo.status === 'geen' || abo.status === 'verlopen') return abo;
  if (nu < abo.looptTot) return abo;
  if (abo.automatischVerlengen && abo.status !== 'opgezegd') {
    // Doorrekenen, zodat een app die weken dichtstond niet op één periode blijft hangen.
    let bijgewerkt = activeer(abo, abo.plan, abo.looptTot);
    let rondes = 0;
    while (bijgewerkt.looptTot !== null && nu >= bijgewerkt.looptTot && rondes < 500) {
      bijgewerkt = activeer(bijgewerkt, bijgewerkt.plan, bijgewerkt.looptTot);
      rondes += 1;
    }
    return bijgewerkt;
  }
  return { ...abo, plan: 'gratis', status: 'verlopen', looptTot: null, automatischVerlengen: false };
}

/**
 * Wanneer er (voor het eerst of weer) afgeschreven wordt, en hoeveel.
 * Dit staat op de paywall en in het ouderdashboard: een ouder die precies weet
 * wanneer er geld af gaat, hoeft geen mail te sturen om het te vragen.
 */
export function volgendeAfschrijving(
  abo: Abonnement,
  nu = Date.now(),
): { op: number; plan: PlanId; isEersteKeer: boolean } | null {
  const actueel = huidigeStatus(abo, nu);
  if (actueel.looptTot === null) return null;
  if (!actueel.automatischVerlengen) return null;
  return { op: actueel.looptTot, plan: actueel.plan, isEersteKeer: actueel.status === 'proef' };
}

/** Datum als '4 september 2026', voor tekst die een ouder leest. */
export function datumInWoorden(tijd: number): string {
  const maanden = [
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december',
  ];
  const d = new Date(tijd);
  return `${d.getDate()} ${maanden[d.getMonth()]} ${d.getFullYear()}`;
}

export function heeftToegang(abo: Abonnement, nu = Date.now()): boolean {
  const actueel = huidigeStatus(abo, nu);
  return actueel.status === 'proef' || actueel.status === 'actief' || actueel.status === 'opgezegd';
}

export function dagenResterend(abo: Abonnement, nu = Date.now()): number | null {
  const actueel = huidigeStatus(abo, nu);
  if (actueel.looptTot === null) return null;
  return Math.max(0, Math.ceil((actueel.looptTot - nu) / DAG));
}

export interface Oordeel {
  mag: boolean;
  /** Waarom niet, in taal die je aan een ouder kunt laten zien. */
  reden?: string;
  /** Hoeveel vragen er vandaag nog over zijn in de gratis versie. */
  restVandaag?: number;
}

/**
 * Mag dit kind dit onderwerp nu oefenen?
 *
 * De gratis versie geeft rekenen helemaal weg en beperkt de andere vakken tot
 * een handvol vragen per dag. Dat is genoeg om te zien of de app bevalt,
 * en te weinig om er een heel schooljaar op te draaien.
 */
export function magOefenen(
  abo: Abonnement,
  onderwerpId: string,
  vragenVandaagBuitenGratisVak: number,
  nu = Date.now(),
): Oordeel {
  if (heeftToegang(abo, nu)) return { mag: true };

  const onderwerp = vindOnderwerp(onderwerpId);
  if (onderwerp?.vak === GRATIS_VAK) return { mag: true };

  const rest = GRATIS_VRAGEN_PER_DAG - vragenVandaagBuitenGratisVak;
  if (rest > 0) return { mag: true, restVandaag: rest };
  return {
    mag: false,
    reden: `In de gratis versie oefen je ${GRATIS_VRAGEN_PER_DAG} vragen per dag buiten rekenen. Morgen staan er weer ${GRATIS_VRAGEN_PER_DAG} klaar.`,
    restVandaag: 0,
  };
}

export function magFilmpje(abo: Abonnement, index: number, nu = Date.now()): boolean {
  return heeftToegang(abo, nu) || index < GRATIS_FILMPJES;
}

export function maxProfielen(abo: Abonnement, nu = Date.now()): number {
  return heeftToegang(abo, nu) ? MAX_PROFIELEN_BETAALD : 1;
}
