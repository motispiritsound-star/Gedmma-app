/**
 * Vaste-kommagetallen op basis van bigint.
 *
 * Alles in dit pakket rekent met hele eenheden op een vaste schaal. Er komt
 * nergens een `number` aan te pas, want een bedrag dat via een double gaat is
 * niet meer exact. Zie docs/decision-log.md (ADR-006).
 */

/** Tien tot de macht n, als bigint. */
export function macht10(n: number): bigint {
  if (!Number.isInteger(n) || n < 0 || n > 30) {
    throw new RangeError(`Ongeldige schaal: ${n}`);
  }
  let uitkomst = 1n;
  for (let i = 0; i < n; i++) uitkomst *= 10n;
  return uitkomst;
}

/** Deelt en rondt af volgens "half naar boven, van nul af" (5 gaat omhoog). */
export function deelEnRondAf(teller: bigint, noemer: bigint): bigint {
  if (noemer === 0n) throw new RangeError('Delen door nul');
  const negatief = teller < 0n !== noemer < 0n;
  const absTeller = teller < 0n ? -teller : teller;
  const absNoemer = noemer < 0n ? -noemer : noemer;
  const quotient = absTeller / absNoemer;
  const rest = absTeller % absNoemer;
  const omhoog = rest * 2n >= absNoemer;
  const uitkomst = omhoog ? quotient + 1n : quotient;
  return negatief ? -uitkomst : uitkomst;
}

const DECIMAAL_PATROON = /^\s*(-|\+)?(\d+)(?:[.,](\d+))?\s*$/;

/**
 * Leest een decimale tekst ("1234.56", "-1.234,56" is *niet* toegestaan omdat
 * duizendtallen dubbelzinnig zijn) en levert het bedrag in eenheden op de
 * gevraagde schaal. Meer decimalen dan de schaal is een fout: stil afkappen van
 * een bedrag is precies wat we willen voorkomen.
 */
export function leesDecimaal(tekst: string, schaal: number): bigint {
  const match = DECIMAAL_PATROON.exec(tekst);
  if (!match) throw new TypeError(`Geen geldig bedrag: ${JSON.stringify(tekst)}`);
  const teken = match[1] === '-' ? -1n : 1n;
  const heel = match[2] ?? '0';
  const fractie = match[3] ?? '';
  if (fractie.length > schaal) {
    throw new RangeError(
      `${JSON.stringify(tekst)} heeft ${fractie.length} decimalen, maar er passen er ${schaal}.`,
    );
  }
  const aangevuld = fractie.padEnd(schaal, '0');
  return teken * (BigInt(heel) * macht10(schaal) + BigInt(aangevuld || '0'));
}

/** Schrijft eenheden op een schaal terug als decimale tekst, altijd met alle decimalen. */
export function schrijfDecimaal(eenheden: bigint, schaal: number): string {
  const deler = macht10(schaal);
  const negatief = eenheden < 0n;
  const abs = negatief ? -eenheden : eenheden;
  const heel = abs / deler;
  const rest = abs % deler;
  const fractie = schaal === 0 ? '' : `.${rest.toString().padStart(schaal, '0')}`;
  return `${negatief ? '-' : ''}${heel}${fractie}`;
}

/** Zet eenheden van de ene schaal naar de andere, met afronding waar nodig. */
export function herschaal(eenheden: bigint, van: number, naar: number): bigint {
  if (van === naar) return eenheden;
  if (naar > van) return eenheden * macht10(naar - van);
  return deelEnRondAf(eenheden, macht10(van - naar));
}
