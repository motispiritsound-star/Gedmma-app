import { Money, Rate, type ValutaCode } from '@gedmma/money';
import { BoekhoudFout } from './fouten.ts';

/** Soort grootboekrekening; bepaalt of hij op de balans of in de W&V staat. */
export type RekeningSoort = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

/** Rekeningen die op de balans staan. */
export const BALANSSOORTEN: readonly RekeningSoort[] = ['asset', 'liability', 'equity'];
/** Rekeningen die in de winst-en-verliesrekening staan. */
export const RESULTAATSOORTEN: readonly RekeningSoort[] = ['revenue', 'expense'];

export function isBalansrekening(soort: RekeningSoort): boolean {
  return BALANSSOORTEN.includes(soort);
}

/**
 * Een regel zoals hij wordt aangeboden. Debet en credit zijn allebei
 * `Money` in de valuta van de administratie; precies één ervan is groter
 * dan nul.
 */
export type ConceptRegel = {
  rekeningId: string;
  /** Alleen voor foutmeldingen en rapportage; de rekeningcode zoals 8000. */
  rekeningCode?: string;
  debet: Money;
  credit: Money;
  omschrijving?: string;
  btwCodeId?: string | null;
  /** Grondslag waarover de btw is berekend; verplicht zodra er een btw-code is. */
  btwGrondslag?: Money | null;
  relatieId?: string | null;
  kostenplaatsId?: string | null;
  /** Origineel bedrag in vreemde valuta, als de regel daarvandaan komt. */
  bedragVreemdeValuta?: Money | null;
  wisselkoers?: Rate | null;
};

export type ConceptPost = {
  dagboekCode: string;
  boekdatum: string;
  omschrijving: string;
  valuta: ValutaCode;
  regels: readonly ConceptRegel[];
  bronSoort?: 'sales_invoice' | 'purchase_invoice' | 'bank_transaction' | 'manual' | 'opening' | 'reversal';
  bronId?: string | null;
};

/** Een regel met het definitieve regelnummer erbij. */
export type GeldigeRegel = ConceptRegel & { regelnummer: number };

/** Een gevalideerde post: hij voldoet gegarandeerd aan alle invarianten. */
export type GeldigePost = Omit<ConceptPost, 'regels'> & {
  readonly totaalDebet: Money;
  readonly totaalCredit: Money;
  readonly regels: readonly GeldigeRegel[];
};

const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Controleert een concept-journaalpost op alle boekhoudkundige invarianten en
 * levert een gevalideerde post op. Dit is de enige weg naar de database:
 * `apps/api` kent geen pad waarlangs een ongeldige post kan worden opgeslagen.
 *
 * Invarianten (zie docs/accounting-engine.md):
 *  I1 som debet is exact gelijk aan som credit
 *  I2 elke regel heeft debet of credit groter dan nul, niet beide
 *  I3 minimaal twee regels
 *  I10 vreemde valuta bewaart origineel bedrag en koers, debet/credit staan
 *      altijd in administratievaluta
 */
export function bouwPost(concept: ConceptPost): GeldigePost {
  if (!ISO_DATUM.test(concept.boekdatum)) {
    throw new BoekhoudFout(
      'date_outside_period',
      `Boekdatum ${JSON.stringify(concept.boekdatum)} is geen geldige datum.`,
      'Gebruik het formaat jjjj-mm-dd.',
    );
  }

  if (concept.regels.length < 2) {
    throw new BoekhoudFout(
      'entry_too_few_lines',
      'Een journaalpost heeft minimaal twee regels.',
      'Elke boeking heeft een tegenrekening: wat er ergens af gaat, komt ergens anders bij.',
      { aantalRegels: concept.regels.length },
    );
  }

  let totaalDebet = Money.nul(concept.valuta);
  let totaalCredit = Money.nul(concept.valuta);
  const regels: (ConceptRegel & { regelnummer: number })[] = [];

  for (const [index, regel] of concept.regels.entries()) {
    const regelnummer = index + 1;

    if (regel.debet.valuta !== concept.valuta || regel.credit.valuta !== concept.valuta) {
      throw new BoekhoudFout(
        'mixed_currencies',
        `Regel ${regelnummer} staat niet in de valuta van de boeking (${concept.valuta}).`,
        'Reken het bedrag eerst om met een wisselkoers; het origineel blijft bewaard in bedragVreemdeValuta.',
        { regelnummer },
      );
    }

    if (regel.debet.isNegatief() || regel.credit.isNegatief()) {
      throw new BoekhoudFout(
        'line_negative_amount',
        `Regel ${regelnummer} heeft een negatief bedrag.`,
        'Boek een tegengesteld bedrag op de andere kant in plaats van een min-bedrag.',
        { regelnummer },
      );
    }

    const heeftDebet = regel.debet.isPositief();
    const heeftCredit = regel.credit.isPositief();

    if (heeftDebet && heeftCredit) {
      throw new BoekhoudFout(
        'line_debit_and_credit',
        `Regel ${regelnummer} heeft zowel een debet- als een creditbedrag.`,
        'Splits de regel: een regel staat aan één kant.',
        { regelnummer },
      );
    }
    if (!heeftDebet && !heeftCredit) {
      throw new BoekhoudFout(
        'line_no_amount',
        `Regel ${regelnummer} heeft geen bedrag.`,
        'Vul een bedrag in of haal de regel weg.',
        { regelnummer },
      );
    }

    if (regel.btwCodeId && !regel.btwGrondslag) {
      throw new BoekhoudFout(
        'tax_base_missing',
        `Regel ${regelnummer} heeft een btw-code maar geen grondslag.`,
        'De grondslag is het bedrag waarover de btw is berekend; zonder dat sluit de aangifte niet aan.',
        { regelnummer },
      );
    }

    if (regel.bedragVreemdeValuta) {
      if (!regel.wisselkoers || regel.wisselkoers.isNul()) {
        throw new BoekhoudFout(
          'invalid_exchange_rate',
          `Regel ${regelnummer} heeft een bedrag in vreemde valuta zonder bruikbare wisselkoers.`,
          'Leg de koers vast die gold op de boekdatum.',
          { regelnummer },
        );
      }
      if (regel.bedragVreemdeValuta.valuta === concept.valuta) {
        throw new BoekhoudFout(
          'mixed_currencies',
          `Regel ${regelnummer} noemt een vreemde valuta die gelijk is aan de administratievaluta.`,
          'Laat bedragVreemdeValuta weg als er niet is omgerekend.',
          { regelnummer },
        );
      }
    }

    totaalDebet = totaalDebet.plus(regel.debet);
    totaalCredit = totaalCredit.plus(regel.credit);
    regels.push({ ...regel, regelnummer });
  }

  if (!totaalDebet.gelijkAan(totaalCredit)) {
    const verschil = totaalDebet.min(totaalCredit);
    throw new BoekhoudFout(
      'entry_not_balanced',
      `De boeking is niet in balans: debet ${totaalDebet} tegenover credit ${totaalCredit}.`,
      `Er is een verschil van ${verschil.absoluut()}. Zoek de regel die ontbreekt of het verkeerde bedrag heeft.`,
      { totaalDebet: totaalDebet.toString(), totaalCredit: totaalCredit.toString(), verschil: verschil.toString() },
    );
  }

  return { ...concept, regels, totaalDebet, totaalCredit };
}

/**
 * Maakt de tegenboeking van een post: dezelfde regels met debet en credit
 * verwisseld. De boekdatum kan afwijken als de oorspronkelijke periode
 * inmiddels gesloten is.
 */
export function keerPostOm(post: GeldigePost, opties: { boekdatum?: string; omschrijving?: string } = {}): GeldigePost {
  return bouwPost({
    ...post,
    boekdatum: opties.boekdatum ?? post.boekdatum,
    omschrijving: opties.omschrijving ?? `Tegenboeking van: ${post.omschrijving}`,
    bronSoort: 'reversal',
    regels: post.regels.map((regel) => ({
      ...regel,
      debet: regel.credit,
      credit: regel.debet,
      btwGrondslag: regel.btwGrondslag ? regel.btwGrondslag.negatie() : regel.btwGrondslag,
    })),
  });
}

/** Handige constructor voor een regel aan de debetkant. */
export function debet(
  rekeningId: string,
  bedrag: Money,
  extra: Partial<ConceptRegel> = {},
): ConceptRegel {
  return { rekeningId, debet: bedrag, credit: Money.nul(bedrag.valuta), ...extra };
}

/** Handige constructor voor een regel aan de creditkant. */
export function credit(
  rekeningId: string,
  bedrag: Money,
  extra: Partial<ConceptRegel> = {},
): ConceptRegel {
  return { rekeningId, debet: Money.nul(bedrag.valuta), credit: bedrag, ...extra };
}
