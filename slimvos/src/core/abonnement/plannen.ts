/**
 * Prijsplannen. De bedragen staan in centen inclusief btw, want dat is wat
 * Apple en Google in de winkel tonen en wat de ouder betaalt.
 */

export type PlanId = 'gratis' | 'maand' | 'jaar';

export interface Plan {
  id: PlanId;
  naam: string;
  /** Prijs inclusief btw, in centen. */
  centen: number;
  /** Waar de prijs over gaat: per maand of per jaar. */
  periode: 'maand' | 'jaar' | null;
  /** Product-id zoals die in de App Store en Play Console komt te staan. */
  productId: string | null;
  proefDagen: number;
  maxProfielen: number;
  regels: string[];
  /** Waarmee het abonnement zichzelf verlengt; null bij het gratis plan. */
  verlengtElke?: 'maand' | 'jaar';
}

/**
 * Eén week gratis, daarna gaat het abonnement vanzelf in. Zeven dagen is kort
 * voor een gewoonte, maar dat hoeft ook niet: de gratis versie blijft daarna
 * gewoon bestaan, dus niemand valt in het niets.
 */
export const PROEF_DAGEN = 7;
export const MAX_PROFIELEN_BETAALD = 5;

/** Het plan dat standaard aanstaat: de laagste drempel om te beginnen. */
export const STANDAARD_PLAN: PlanId = 'maand';

export const PLANNEN: Plan[] = [
  {
    id: 'gratis',
    naam: 'Gratis',
    centen: 0,
    periode: null,
    productId: null,
    proefDagen: 0,
    maxProfielen: 1,
    regels: [
      'Rekenen helemaal gratis, onbeperkt',
      '10 vragen per dag in de andere vakken',
      'Drie uitlegfilmpjes',
      'Eén kindprofiel',
      'Nooit advertenties',
    ],
  },
  {
    id: 'maand',
    naam: 'Maandelijks',
    centen: 499,
    periode: 'maand',
    productId: 'nl.slimvos.app.compleet.maand',
    proefDagen: PROEF_DAGEN,
    maxProfielen: MAX_PROFIELEN_BETAALD,
    regels: [
      'Alle vakken, onbeperkt oefenen',
      'Alle uitlegfilmpjes',
      'Tot 5 kindprofielen',
      'Weekrapport voor ouders',
      'Elke maand opzegbaar, geen opzegtermijn',
    ],
    verlengtElke: 'maand',
  },
  {
    id: 'jaar',
    naam: 'Per jaar',
    centen: 3999,
    periode: 'jaar',
    productId: 'nl.slimvos.app.compleet.jaar',
    proefDagen: PROEF_DAGEN,
    maxProfielen: MAX_PROFIELEN_BETAALD,
    regels: [
      'Alles van het maandplan',
      'Je betaalt acht maanden voor twaalf',
      'Prijs staat een jaar vast',
    ],
    verlengtElke: 'jaar',
  },
];

export function vindPlan(id: PlanId): Plan {
  const plan = PLANNEN.find((p) => p.id === id);
  if (!plan) throw new Error(`Onbekend plan: ${id}`);
  return plan;
}

export function euro(centen: number): string {
  return `€${(centen / 100).toFixed(2).replace('.', ',')}`;
}

/** Wat het jaarplan omgerekend per maand kost. */
export function perMaand(plan: Plan): number {
  return plan.periode === 'jaar' ? Math.round(plan.centen / 12) : plan.centen;
}

/** Hoeveel procent je bespaart met het jaarplan ten opzichte van maandelijks. */
export function jaarKortingProcent(): number {
  const maand = vindPlan('maand');
  const jaar = vindPlan('jaar');
  return Math.round((1 - jaar.centen / (maand.centen * 12)) * 100);
}

/**
 * De zin die de stores verplicht op een paywall willen zien, en die ook
 * gewoon eerlijk is: wat het kost, hoe vaak, en dat het doorloopt.
 */
export function verlengingsregel(plan: Plan): string {
  if (!plan.verlengtElke) return 'Gratis, zonder abonnement.';
  const per = plan.verlengtElke === 'jaar' ? 'jaar' : 'maand';
  const proef = plan.proefDagen > 0 ? `${plan.proefDagen} dagen gratis, daarna ` : '';
  return `${proef}${euro(plan.centen)} per ${per}. Loopt automatisch door tot je opzegt.`;
}
