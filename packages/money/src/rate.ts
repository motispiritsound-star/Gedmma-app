import { deelEnRondAf, leesDecimaal, macht10, schrijfDecimaal } from './decimaal.ts';
import { Money } from './money.ts';
import type { ValutaCode } from './valuta.ts';

/** Schaal van wisselkoersen: acht decimalen, gelijk aan NUMERIC(18,8). */
export const KOERS_SCHAAL = 8;
/** Schaal van percentages en btw-tarieven: zes decimalen, gelijk aan NUMERIC(9,6). */
export const TARIEF_SCHAAL = 6;

/**
 * Een verhouding met vaste schaal: een wisselkoers of een btw-tarief.
 * Ook hier geen floating point.
 */
export class Rate {
  readonly eenheden: bigint;
  readonly schaal: number;

  private constructor(eenheden: bigint, schaal: number) {
    this.eenheden = eenheden;
    this.schaal = schaal;
    Object.freeze(this);
  }

  static vanTekst(tekst: string, schaal: number): Rate {
    return new Rate(leesDecimaal(tekst, schaal), schaal);
  }

  static vanEenheden(eenheden: bigint, schaal: number): Rate {
    return new Rate(eenheden, schaal);
  }

  /** Een btw-tarief uit tekst, bijvoorbeeld "0.21" voor 21%. */
  static tarief(tekst: string): Rate {
    return Rate.vanTekst(tekst, TARIEF_SCHAAL);
  }

  /** Een btw-tarief uit een percentage, bijvoorbeeld "21" voor 21%. */
  static tariefVanProcent(procent: string): Rate {
    const eenheden = leesDecimaal(procent, TARIEF_SCHAAL);
    return new Rate(deelEnRondAf(eenheden, 100n), TARIEF_SCHAAL);
  }

  /** Een wisselkoers uit tekst, bijvoorbeeld "1.08450000". */
  static koers(tekst: string): Rate {
    return Rate.vanTekst(tekst, KOERS_SCHAAL);
  }

  static een(schaal: number): Rate {
    return new Rate(macht10(schaal), schaal);
  }

  isNul(): boolean {
    return this.eenheden === 0n;
  }

  /** Past de verhouding toe op een bedrag en rondt af op de kleinste eenheid. */
  toepassenOp(bedrag: Money): Money {
    return bedrag.maalBreuk(this.eenheden, macht10(this.schaal));
  }

  /**
   * Rekent een bedrag om naar een andere valuta met deze koers.
   * `bedrag_in_doelvaluta = bedrag * koers`, afgerond op de doelvaluta.
   */
  reken(bedrag: Money, naarValuta: ValutaCode): Money {
    const doel = Money.vanEenheden(0n, naarValuta);
    const factorBron = macht10(bedrag.decimalen);
    const factorDoel = macht10(doel.decimalen);
    const teller = bedrag.eenheden * this.eenheden * factorDoel;
    const noemer = macht10(this.schaal) * factorBron;
    return Money.vanEenheden(deelEnRondAf(teller, noemer), naarValuta);
  }

  /**
   * Rekent terug: uit een inclusief bedrag het exclusieve bedrag halen.
   * `excl = incl / (1 + tarief)`.
   */
  exclusiefUitInclusief(inclusief: Money): Money {
    const een = macht10(this.schaal);
    return inclusief.maalBreuk(een, een + this.eenheden);
  }

  toString(): string {
    return schrijfDecimaal(this.eenheden, this.schaal);
  }

  toJSON(): string {
    return this.toString();
  }

  /** Weergave als percentage voor de gebruiker: "21%" of "9,5%". */
  alsProcent(locale = 'nl-NL'): string {
    const procentEenheden = this.eenheden * 100n;
    const tekst = schrijfDecimaal(procentEenheden, this.schaal).replace(/\.?0+$/, '');
    return `${tekst.replace('.', locale.startsWith('nl') || locale.startsWith('de') || locale.startsWith('fr') ? ',' : '.')}%`;
  }
}

/** Schaal van aantallen: zes decimalen, gelijk aan NUMERIC(18,6). */
export const AANTAL_SCHAAL = 6;

/** Een aantal (stuks, uren, kilometers) met zes decimalen. */
export class Quantity {
  readonly eenheden: bigint;

  private constructor(eenheden: bigint) {
    this.eenheden = eenheden;
    Object.freeze(this);
  }

  static vanTekst(tekst: string): Quantity {
    return new Quantity(leesDecimaal(tekst, AANTAL_SCHAAL));
  }

  static vanEenheden(eenheden: bigint): Quantity {
    return new Quantity(eenheden);
  }

  static een(): Quantity {
    return new Quantity(macht10(AANTAL_SCHAAL));
  }

  plus(ander: Quantity): Quantity {
    return new Quantity(this.eenheden + ander.eenheden);
  }

  min(ander: Quantity): Quantity {
    return new Quantity(this.eenheden - ander.eenheden);
  }

  isNul(): boolean {
    return this.eenheden === 0n;
  }

  isNegatief(): boolean {
    return this.eenheden < 0n;
  }

  /** Aantal maal prijs, afgerond op de kleinste eenheid van de valuta. */
  maalPrijs(prijs: Money): Money {
    return prijs.maalBreuk(this.eenheden, macht10(AANTAL_SCHAAL));
  }

  toString(): string {
    return schrijfDecimaal(this.eenheden, AANTAL_SCHAAL);
  }

  toJSON(): string {
    return this.toString();
  }

  /** Korte weergave zonder overbodige nullen: "10" in plaats van "10.000000". */
  kort(): string {
    const tekst = this.toString();
    return tekst.includes('.') ? tekst.replace(/\.?0+$/, '') : tekst;
  }
}
