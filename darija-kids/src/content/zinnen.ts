/**
 * Een alinea in zinnen, op één plek.
 *
 * Twee dingen moeten hier hetzelfde denken: de leesbladzijde die een zin laat
 * oplichten, en de opnamemachine die per zin een begin- en eindtijd
 * wegschrijft. Knippen ze verschillend, dan licht de verkeerde zin op — en
 * dat merk je pas als je een hoofdstuk zit te luisteren, drie stappen nadat
 * het misging.
 *
 * `store/lezen/index.html` is losse HTML en kan dit bestand niet invoeren; de
 * uitdrukking staat daar met de hand overgeschreven, met een verwijzing
 * hierheen. Verandert hij hier, dan verandert hij daar mee.
 */

/** Na een punt, vraagteken, uitroepteken of beletselteken, eventueel gevolgd door een aanhalingsteken. */
export const ZINSGRENS = /(?<=[.!?…]["'»«”’]?)\s+/

export const zinnenVan = (alineas: string[]): string[] =>
  alineas.flatMap((alinea) => alinea.split(ZINSGRENS).filter(Boolean))

/** De sterretjes zijn opmaak voor de zetter en geen tekst om uit te spreken. */
export const uitspreekbaar = (zin: string): string => zin.replace(/\*/g, '')
