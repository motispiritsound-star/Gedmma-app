import { deelEnRondAf, leesDecimaal, macht10, schrijfDecimaal } from './decimaal.ts';
import { decimalenVan, type ValutaCode } from './valuta.ts';

/**
 * Een bedrag in een valuta, exact opgeslagen als bigint in de kleinste eenheid
 * (voor euro's dus centen). Onveranderlijk: elke bewerking levert een nieuw
 * bedrag op.
 */
export class Money {
  /** Het bedrag in de kleinste eenheid van de valuta. */
  readonly eenheden: bigint;
  readonly valuta: ValutaCode;
  /** Aantal decimalen van de valuta; afgeleid, maar vaak nodig. */
  readonly decimalen: number;

  private constructor(eenheden: bigint, valuta: ValutaCode, decimalen: number) {
    this.eenheden = eenheden;
    this.valuta = valuta;
    this.decimalen = decimalen;
    Object.freeze(this);
  }

  /** Maakt een bedrag uit de kleinste eenheid, bijvoorbeeld centen. */
  static vanEenheden(eenheden: bigint, valuta: ValutaCode): Money {
    const code = valuta.toUpperCase();
    return new Money(eenheden, code, decimalenVan(code));
  }

  /** Leest een decimale tekst zoals die uit de database of een API komt. */
  static vanTekst(tekst: string, valuta: ValutaCode): Money {
    const code = valuta.toUpperCase();
    return new Money(leesDecimaal(tekst, decimalenVan(code)), code, decimalenVan(code));
  }

  /** Nul in de opgegeven valuta. */
  static nul(valuta: ValutaCode): Money {
    return Money.vanEenheden(0n, valuta);
  }

  /** Telt bedragen op; alle bedragen moeten dezelfde valuta hebben. */
  static som(bedragen: readonly Money[], valuta?: ValutaCode): Money {
    const code = valuta ?? bedragen[0]?.valuta;
    if (code === undefined) {
      throw new TypeError('Money.som() zonder bedragen heeft een valuta nodig.');
    }
    let totaal = Money.nul(code);
    for (const bedrag of bedragen) totaal = totaal.plus(bedrag);
    return totaal;
  }

  private zelfdeValuta(ander: Money): void {
    if (ander.valuta !== this.valuta) {
      throw new TypeError(
        `Kan ${this.valuta} en ${ander.valuta} niet met elkaar verrekenen; reken eerst om met een wisselkoers.`,
      );
    }
  }

  plus(ander: Money): Money {
    this.zelfdeValuta(ander);
    return new Money(this.eenheden + ander.eenheden, this.valuta, this.decimalen);
  }

  min(ander: Money): Money {
    this.zelfdeValuta(ander);
    return new Money(this.eenheden - ander.eenheden, this.valuta, this.decimalen);
  }

  negatie(): Money {
    return new Money(-this.eenheden, this.valuta, this.decimalen);
  }

  absoluut(): Money {
    return this.eenheden < 0n ? this.negatie() : this;
  }

  /** Vermenigvuldigt met een geheel getal; exact, dus zonder afronding. */
  maal(factor: bigint | number): Money {
    const f = typeof factor === 'number' ? BigInt(heelGetal(factor)) : factor;
    return new Money(this.eenheden * f, this.valuta, this.decimalen);
  }

  /**
   * Vermenigvuldigt met een breuk `teller/noemer` en rondt af op de kleinste
   * eenheid. Gebruik dit voor percentages en tarieven; nooit een `number`.
   */
  maalBreuk(teller: bigint, noemer: bigint): Money {
    return new Money(deelEnRondAf(this.eenheden * teller, noemer), this.valuta, this.decimalen);
  }

  /** Deelt door een geheel getal en rondt af op de kleinste eenheid. */
  gedeeldDoor(deler: bigint | number): Money {
    const d = typeof deler === 'number' ? BigInt(heelGetal(deler)) : deler;
    return new Money(deelEnRondAf(this.eenheden, d), this.valuta, this.decimalen);
  }

  /**
   * Verdeelt het bedrag over de gegeven verhoudingen zonder ook maar één cent
   * te verliezen. De rest wordt deterministisch uitgedeeld: eerst aan de delen
   * met de grootste verwaarloosde fractie, bij gelijkspel aan het laagste
   * indexnummer. De som van de uitkomst is altijd exact dit bedrag.
   */
  verdeel(verhoudingen: readonly (bigint | number)[]): Money[] {
    if (verhoudingen.length === 0) throw new TypeError('Verdelen over nul delen kan niet.');
    const gewichten = verhoudingen.map((v) => (typeof v === 'number' ? BigInt(heelGetal(v)) : v));
    if (gewichten.some((g) => g < 0n)) throw new RangeError('Verhoudingen mogen niet negatief zijn.');
    const totaalGewicht = gewichten.reduce((a, b) => a + b, 0n);
    if (totaalGewicht === 0n) throw new RangeError('De som van de verhoudingen is nul.');

    const negatief = this.eenheden < 0n;
    const abs = negatief ? -this.eenheden : this.eenheden;

    const delen: bigint[] = [];
    const resten: { index: number; rest: bigint }[] = [];
    let uitgedeeld = 0n;
    for (const [index, gewicht] of gewichten.entries()) {
      const exact = abs * gewicht;
      const deel = exact / totaalGewicht;
      delen.push(deel);
      resten.push({ index, rest: exact % totaalGewicht });
      uitgedeeld += deel;
    }

    let restant = abs - uitgedeeld;
    resten.sort((a, b) => (a.rest === b.rest ? a.index - b.index : a.rest > b.rest ? -1 : 1));
    for (const { index } of resten) {
      if (restant === 0n) break;
      delen[index] = (delen[index] ?? 0n) + 1n;
      restant -= 1n;
    }

    return delen.map((deel) =>
      new Money(negatief ? -deel : deel, this.valuta, this.decimalen),
    );
  }

  isNul(): boolean {
    return this.eenheden === 0n;
  }

  isPositief(): boolean {
    return this.eenheden > 0n;
  }

  isNegatief(): boolean {
    return this.eenheden < 0n;
  }

  gelijkAan(ander: Money): boolean {
    return this.valuta === ander.valuta && this.eenheden === ander.eenheden;
  }

  /** -1, 0 of 1. Gooit bij verschillende valuta's. */
  vergelijk(ander: Money): -1 | 0 | 1 {
    this.zelfdeValuta(ander);
    if (this.eenheden < ander.eenheden) return -1;
    if (this.eenheden > ander.eenheden) return 1;
    return 0;
  }

  kleinerDan(ander: Money): boolean {
    return this.vergelijk(ander) < 0;
  }

  groterDan(ander: Money): boolean {
    return this.vergelijk(ander) > 0;
  }

  /** Decimale tekst zoals die naar de database en de API gaat: "1210.00". */
  toString(): string {
    return schrijfDecimaal(this.eenheden, this.decimalen);
  }

  /** JSON-weergave is altijd de decimale tekst, nooit een getal. */
  toJSON(): string {
    return this.toString();
  }

  /**
   * Weergave voor de gebruiker in de gevraagde taal. Gebruikt Intl, maar voedt
   * dat met de exacte decimale tekst zodat er geen precisieverlies optreedt.
   */
  formatteer(locale: string, opties: Intl.NumberFormatOptions = {}): string {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.valuta,
      minimumFractionDigits: this.decimalen,
      maximumFractionDigits: this.decimalen,
      ...opties,
    });
    // Intl.NumberFormat accepteert sinds ES2023 een string, die intern exact
    // wordt verwerkt. Dat is precies waarom we hem de tekst geven en geen number.
    return formatter.format(this.toString() as unknown as number);
  }
}

function heelGetal(waarde: number): number {
  if (!Number.isSafeInteger(waarde)) {
    throw new TypeError(
      `Alleen hele getallen zijn toegestaan bij bedragen; kreeg ${waarde}. Gebruik maalBreuk() voor tarieven.`,
    );
  }
  return waarde;
}

/** Eenheden op de schaal van een valuta uit een decimale tekst. */
export function eenhedenVanTekst(tekst: string, valuta: ValutaCode): bigint {
  return leesDecimaal(tekst, decimalenVan(valuta));
}

/** Handige constante: 100 cent per euro, als bigint. */
export function eenheidsFactor(valuta: ValutaCode): bigint {
  return macht10(decimalenVan(valuta));
}
