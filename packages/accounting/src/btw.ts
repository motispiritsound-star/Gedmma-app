import { Money, type Rate, type ValutaCode } from '@gedmma/money';
import { BoekhoudFout } from './fouten.ts';

/**
 * Btw-codes zijn gegevens, geen code. Tarief, geldigheidsperiode en aangiftevak
 * staan in de database; dit type beschrijft alleen de vorm. Een tariefwijziging
 * is dus een nieuwe rij met een eigen geldigheidsdatum, niet een codewijziging.
 * Zie docs/accounting-engine.md en docs/legal-source-register.md.
 */
export type BtwCode = {
  id: string;
  code: string;
  naam: string;
  /** Waar de code voor bedoeld is. */
  soort: 'verkoop' | 'inkoop' | 'beide';
  /** Het tarief als verhouding: 0.21 voor 21%. */
  tarief: Rate;
  /** Vak van de Nederlandse aangifte omzetbelasting, bijvoorbeeld "1a" of "5b". */
  vak: string | null;
  /** Btw verlegd naar de afnemer. */
  verlegd: boolean;
  /** Intracommunautaire levering; telt mee in de ICP-opgave. */
  icLevering: boolean;
  /** Geldig vanaf, ISO-datum. */
  geldigVanaf: string;
  /** Geldig tot en met, ISO-datum, of null als hij nog geldt. */
  geldigTot: string | null;
  /** Grootboekrekening waarop de btw wordt geboekt. */
  btwRekeningId: string | null;
  /** Bij verlegde btw: de tegenrekening waarop de af te dragen kant komt. */
  verlegdTegenrekeningId?: string | null;
};

/** Geldt deze btw-code op de opgegeven datum? */
export function isGeldigOp(code: BtwCode, datum: string): boolean {
  if (datum < code.geldigVanaf) return false;
  if (code.geldigTot !== null && datum > code.geldigTot) return false;
  return true;
}

/** Zoekt de btw-code op en controleert de geldigheid; gooit met uitleg als het niet klopt. */
export function eisGeldigeBtwCode(code: BtwCode | undefined, datum: string): BtwCode {
  if (!code) {
    throw new BoekhoudFout('tax_code_not_valid_on_date', 'De opgegeven btw-code bestaat niet.', 'Kies een btw-code uit de lijst van deze administratie.');
  }
  if (!isGeldigOp(code, datum)) {
    throw new BoekhoudFout(
      'tax_code_not_valid_on_date',
      `Btw-code ${code.code} geldt niet op ${datum}.`,
      `Deze code geldt van ${code.geldigVanaf} tot ${code.geldigTot ?? 'nu'}. Kies de code die op de factuurdatum gold.`,
      { code: code.code, geldigVanaf: code.geldigVanaf, geldigTot: code.geldigTot },
    );
  }
  return code;
}

/** Een factuurregel zoals de gebruiker hem invoert. */
export type FactuurRegelInvoer = {
  omschrijving: string;
  /** Aantal maal prijs is al uitgerekend tot dit bedrag, exclusief korting. */
  bedrag: Money;
  /** Korting op deze regel, als bedrag (niet als percentage). */
  korting?: Money | null;
  btwCode: BtwCode;
  rekeningId: string;
  /** Staat `bedrag` inclusief btw? Standaard exclusief. */
  inclusiefBtw?: boolean;
};

export type BerekendeRegel = {
  omschrijving: string;
  rekeningId: string;
  btwCode: BtwCode;
  exclusief: Money;
  btw: Money;
  inclusief: Money;
};

export type BtwGroep = {
  btwCode: BtwCode;
  grondslag: Money;
  btw: Money;
};

export type FactuurTotalen = {
  regels: BerekendeRegel[];
  /** Btw per code; dit is de basis voor de aangifte, niet het factuurtotaal. */
  btwGroepen: BtwGroep[];
  totaalExclusief: Money;
  totaalBtw: Money;
  totaalInclusief: Money;
};

/**
 * Rekent een factuur door. De btw wordt **per regel** berekend en **per code**
 * gegroepeerd; nooit over het factuurtotaal. Dat is de enige methode die
 * aansluit op de aangifte omzetbelasting.
 */
export function berekenFactuur(regels: readonly FactuurRegelInvoer[], valuta: ValutaCode): FactuurTotalen {
  const berekend: BerekendeRegel[] = [];
  const perCode = new Map<string, BtwGroep>();

  for (const regel of regels) {
    if (regel.bedrag.valuta !== valuta) {
      throw new BoekhoudFout(
        'mixed_currencies',
        `Regel "${regel.omschrijving}" staat in ${regel.bedrag.valuta} maar de factuur in ${valuta}.`,
        'Alle regels van één factuur staan in dezelfde valuta.',
      );
    }

    const korting = regel.korting ?? Money.nul(valuta);
    const bruto = regel.bedrag.min(korting);

    // Bij verlegde btw en bij het nultarief is de btw nul, maar de grondslag
    // telt wel mee in de aangifte. Daarom rekenen we de grondslag altijd uit.
    const exclusief = regel.inclusiefBtw ? regel.btwCode.tarief.exclusiefUitInclusief(bruto) : bruto;
    const btw = regel.btwCode.verlegd
      ? Money.nul(valuta)
      : regel.inclusiefBtw
        ? bruto.min(exclusief)
        : regel.btwCode.tarief.toepassenOp(exclusief);
    const inclusief = exclusief.plus(btw);

    berekend.push({
      omschrijving: regel.omschrijving,
      rekeningId: regel.rekeningId,
      btwCode: regel.btwCode,
      exclusief,
      btw,
      inclusief,
    });

    const bestaand = perCode.get(regel.btwCode.id);
    if (bestaand) {
      bestaand.grondslag = bestaand.grondslag.plus(exclusief);
      bestaand.btw = bestaand.btw.plus(btw);
    } else {
      perCode.set(regel.btwCode.id, { btwCode: regel.btwCode, grondslag: exclusief, btw });
    }
  }

  const btwGroepen = [...perCode.values()].sort((a, b) => a.btwCode.code.localeCompare(b.btwCode.code));
  const totaalExclusief = Money.som(berekend.map((r) => r.exclusief), valuta);
  const totaalBtw = Money.som(btwGroepen.map((g) => g.btw), valuta);

  return {
    regels: berekend,
    btwGroepen,
    totaalExclusief,
    totaalBtw,
    totaalInclusief: totaalExclusief.plus(totaalBtw),
  };
}

/** Eén regel van het btw-overzicht: een vak van de aangifte met bedragen. */
export type BtwVakRegel = {
  vak: string;
  omschrijving: string;
  grondslag: Money;
  btw: Money;
};

/**
 * De Nederlandse aangifte omzetbelasting kent vaste vakken. De omschrijvingen
 * hier zijn de gebruikelijke aanduidingen; de exacte tekst en de geldende
 * indeling staan in docs/legal-source-register.md met bron en raadpleegdatum.
 */
export const AANGIFTE_VAKKEN: readonly { vak: string; omschrijving: string }[] = [
  { vak: '1a', omschrijving: 'Leveringen/diensten belast met het hoge tarief' },
  { vak: '1b', omschrijving: 'Leveringen/diensten belast met het lage tarief' },
  { vak: '1c', omschrijving: 'Leveringen/diensten belast met overige tarieven, behalve 0%' },
  { vak: '1d', omschrijving: 'Privegebruik' },
  { vak: '1e', omschrijving: 'Leveringen/diensten belast met 0% of niet bij u belast' },
  { vak: '2a', omschrijving: 'Btw verlegd naar u' },
  { vak: '3a', omschrijving: 'Leveringen naar landen buiten de EU (uitvoer)' },
  { vak: '3b', omschrijving: 'Leveringen naar of diensten in landen binnen de EU' },
  { vak: '3c', omschrijving: 'Installatie/afstandsverkopen binnen de EU' },
  { vak: '4a', omschrijving: 'Leveringen/diensten uit landen buiten de EU' },
  { vak: '4b', omschrijving: 'Verwervingen van goederen uit landen binnen de EU' },
  { vak: '5b', omschrijving: 'Voorbelasting' },
];

/** Zoekt de omschrijving bij een vaknummer. */
export function vakOmschrijving(vak: string): string {
  return AANGIFTE_VAKKEN.find((v) => v.vak === vak)?.omschrijving ?? vak;
}
