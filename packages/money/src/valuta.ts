/**
 * Valuta's met hun aantal decimalen. De lijst is bewust kort: hij bevat wat
 * een Nederlandse administratie in de praktijk tegenkomt. Onbekende codes
 * worden geweigerd in plaats van geraden.
 */
export type ValutaCode = string;

const DECIMALEN: Record<string, number> = {
  EUR: 2,
  USD: 2,
  GBP: 2,
  CHF: 2,
  SEK: 2,
  NOK: 2,
  DKK: 2,
  PLN: 2,
  CZK: 2,
  HUF: 2,
  RON: 2,
  BGN: 2,
  CAD: 2,
  AUD: 2,
  NZD: 2,
  ZAR: 2,
  TRY: 2,
  JPY: 0,
  KRW: 0,
  ISK: 0,
  BHD: 3,
  KWD: 3,
  TND: 3,
};

/** Aantal decimalen van een valuta; gooit als de code onbekend is. */
export function decimalenVan(code: ValutaCode): number {
  const decimalen = DECIMALEN[code.toUpperCase()];
  if (decimalen === undefined) {
    throw new RangeError(
      `Onbekende valuta ${JSON.stringify(code)}. Voeg hem toe aan packages/money/src/valuta.ts voordat je ermee boekt.`,
    );
  }
  return decimalen;
}

/** Kent het pakket deze valuta? */
export function isBekendeValuta(code: string): boolean {
  return Object.hasOwn(DECIMALEN, code.toUpperCase());
}

/** Alle ondersteunde valutacodes, alfabetisch. */
export function bekendeValutas(): ValutaCode[] {
  return Object.keys(DECIMALEN).sort();
}
