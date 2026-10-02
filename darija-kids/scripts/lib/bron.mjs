/**
 * Hoe oud is de code die in deze bundel zit?
 *
 * Gradle bouwt het Android-project, niet de app: die staat als kant-en-klare
 * html in `assets/public/` en komt daar alleen terecht door `npm run android`.
 * Wie een bouwscript los aanroept na een `git pull` krijgt dus een bundel met
 * de code van gisteren erin, zonder dat er iets misgaat wat je kunt zien.
 *
 * Dat is hier gebeurd. `npm run build` is op Windows stuk geweest, en de keten
 * is hard: faalt `build`, dan draait `cap sync` niet en `maak-aab` ook niet --
 * maar de vorige bundel blijft wel op de uitvoerplek liggen, en `npm run track`
 * uploadt hem alsnog.
 *
 * Vandaar deze telling. Twee scripts hadden er hun eigen kopie van, en die
 * waren het niet eens: de een sloeg `node_modules` over, de ander niet.
 *
 * **Testbestanden tellen niet mee.** Ze staan in `src/` maar worden nooit
 * geïmporteerd door de app, dus ze komen niet in de bundel. Meetellen maakte
 * de bewaking een leugenaar: een `git pull` die alleen een test toevoegde liet
 * `npm run track` afbreken met "deze bundel is ouder dan de code", terwijl er
 * aan de app niets veranderd was. Dat is erger dan geen bewaking -- een
 * waarschuwing die te vaak loos afgaat leer je wegklikken.
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

/** Wat niet in de bundel belandt en dus niets zegt over hoe oud hij is. */
const teltNietMee = (naam) => /\.test\.[cm]?[jt]sx?$/.test(naam)

/** De mtime van de nieuwste bronregel onder `map`, of 0 als die er niet is. */
export function nieuwsteBron(map) {
  let nieuwste = 0
  const langs = (m) => {
    for (const item of readdirSync(m, { withFileTypes: true })) {
      if (item.name === 'node_modules' || item.name.startsWith('.')) continue
      const pad = path.join(m, item.name)
      if (item.isDirectory()) langs(pad)
      else if (!teltNietMee(item.name)) nieuwste = Math.max(nieuwste, statSync(pad).mtimeMs)
    }
  }
  if (existsSync(map)) langs(map)
  return nieuwste
}

/** Hetzelfde over meerdere mappen. */
export const nieuwsteVan = (...mappen) => Math.max(0, ...mappen.map(nieuwsteBron))
