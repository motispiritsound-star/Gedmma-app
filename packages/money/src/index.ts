/**
 * @gedmma/money — exacte bedragen, tarieven en aantallen.
 *
 * Regel voor de hele monorepo: een financieel bedrag is nooit een `number`.
 * Uit de database komt een string (NUMERIC), die hier meteen een `Money` wordt.
 */
export { Money, eenhedenVanTekst, eenheidsFactor } from './money.ts';
export { Rate, Quantity, KOERS_SCHAAL, TARIEF_SCHAAL, AANTAL_SCHAAL } from './rate.ts';
export {
  decimalenVan,
  isBekendeValuta,
  bekendeValutas,
  type ValutaCode,
} from './valuta.ts';
export {
  macht10,
  deelEnRondAf,
  leesDecimaal,
  schrijfDecimaal,
  herschaal,
} from './decimaal.ts';
