/**
 * Wat een oudere WebView niet heeft.
 *
 * Deze lijst stond in `bundelcheck.mjs`, en die leest de gebóuwde bundel --
 * dus ook wat een afhankelijkheid meebrengt. Dat is de strengste controle en
 * hij hoort te blijven, maar hij draait pas bij `npm run android` op de
 * bouwmachine. Op 3 oktober stond er daardoor een `.at(-1)` in het leerpad die
 * de hele testronde groen liet en pas op Adils laptop opviel, met een halve
 * bouw ernaast.
 *
 * Daarom staat de lijst nu hier: `bundelcheck.mjs` gebruikt hem voor de
 * bundel, en `oudewebview.test.ts` voor onze eigen bron. Eén lijst, twee
 * lezers -- en de tweede valt om terwijl je nog aan het typen bent.
 */
/**
 * Functies die er op een oudere WebView niet zijn, met de Chrome-versie erbij.
 *
 * Alleen dingen met een eigen naam: die zijn betrouwbaar te tellen, anders dan
 * syntaxis. Komt er een bij die we echt nodig hebben, zet hem dan in
 * `src/polyfill.ts` en niet in deze lijst.
 */
export const TE_NIEUW = [
  // Let op de grens: zonder die `(?![A-Za-z])` matcht dit ook het begin van
  // `Object.hasOwnProperty`, en dat is een functie die er altijd al was.
  // Precies daar ben ik in getrapt: framer-motion gebruikt hasOwnProperty, en
  // ik concludeerde dat de bundel Chrome 93 eiste.
  ['Object.hasOwn', /Object\.hasOwn(?![A-Za-z])/g, 93],
  ['structuredClone', /\bstructuredClone\s*\(/g, 98],
  ['.findLast(', /\.findLast(?:Index)?\s*\(/g, 97],
  ['Array.prototype.at', /\.at\s*\(\s*-?\d/g, 92],
  ['crypto.randomUUID', /\brandomUUID\s*\(/g, 92],
  ['.replaceAll(', /\.replaceAll\s*\(/g, 85],
  ['Promise.any', /\bPromise\.any\s*\(/g, 85],
  ['String.prototype.matchAll', /\.matchAll\s*\(/g, 73],
]
