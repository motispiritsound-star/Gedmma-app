import { UNITS } from '../content/curriculum'
import { getState, isDone, setState, today, type Diploma, type State } from './store'

/**
 * De diploma's: zeventien units, zeventien vakken op een plank.
 *
 * Waarom dit iets anders is dan een insigne — want die hebben we al, achttien
 * stuks, in `BADGES`. Een insigne is een feit over jou dat de app zelf
 * vaststelt: dertig dagen op rij, honderd woorden gezien. Hij komt eraan, hij
 * blijft, en er komt geen mens aan te pas. Dat werkt: het is het bewijs dat je
 * er was.
 *
 * Een diploma is een papier. Het heeft een naam erop, een datum, en onderaan
 * een lege regel. Die lege regel is het hele verschil. Een diploma dat de app
 * zichzelf uitreikt is een insigne met een lijst eromheen; een diploma
 * betekent iets omdat iemand anders zijn naam eronder zet. Dus reikt de app
 * het uit en ondertekent een volwassene het, en pas dan is het af.
 *
 * Daar hangt ook de ouderkant aan. De vraag "hoe houd ik een ouder op de
 * hoogte" heeft hier geen melding als antwoord maar een kind dat zijn telefoon
 * komt brengen: er staat een diploma klaar dat nog niemand heeft ondertekend.
 * Dat is de enige boodschap die een ouder krijgt, en hij komt van zijn kind.
 *
 * Alles staat op het toestel, zoals al het andere. De naam die een ouder
 * eronder zet is een voornaam in `localStorage` en gaat net zo weinig de deur
 * uit als de naam van het kind.
 */

/** Wat er op een diploma aan khatims staat, en wat er te halen was. */
export interface Sterren {
  gehaald: number
  max: number
}

/** Drie khatims per les, de toets meegerekend. */
export function sterrenVanUnit(unitId: string, s: State = getState()): Sterren {
  const unit = UNITS.find((u) => u.id === unitId)
  if (!unit) return { gehaald: 0, max: 0 }
  return {
    gehaald: unit.lessons.reduce((som, l) => som + (s.lessons[l.id]?.stars ?? 0), 0),
    max: unit.lessons.length * 3,
  }
}

/**
 * Of elke les van de unit af is — de toets incluis.
 *
 * Niet `progressOfUnit(...) >= 1`: dat is een deling en die wordt bij een
 * unit zonder lessen `NaN`, en `NaN >= 1` is onwaar op een manier die je niet
 * ziet. Hier is het de vraag die het is: staat er van alle lessen een
 * uitslag.
 */
export const unitAf = (unitId: string, s: State = getState()): boolean => {
  const unit = UNITS.find((u) => u.id === unitId)
  return !!unit && unit.lessons.every((l) => isDone(l.id, s))
}

/** Wanneer de laatste les van deze unit af was. */
const afOp = (unitId: string, s: State): number => {
  const unit = UNITS.find((u) => u.id === unitId)
  return Math.max(0, ...(unit?.lessons.map((l) => s.lessons[l.id]?.lastDone ?? 0) ?? []))
}

/**
 * Reikt uit wat er te reiken valt, en geeft terug welke units nieuw waren.
 *
 * Draait na elke afgeronde les én één keer bij het opstarten. Dat tweede is
 * geen voorzorg maar de kern: toen dit alleen aan het einde van een les hing,
 * begon de plank van iemand die de app al een jaar had bij de unit die hij
 * daarná deed. Zestien lege vakken en één vol, voor een kind dat alles al had
 * gehaald. Nu loopt hij alle units na, dus een bestaande opslag krijgt zijn
 * hele plank in één keer.
 *
 * `op` is de dag dat de laatste les van die unit af was, niet vandaag. Anders
 * staat er op zestien diploma's dezelfde datum: die van de dag waarop deze
 * versie werd geïnstalleerd.
 */
export function reikDiplomasUit(): string[] {
  const s = getState()
  const nieuw = UNITS.filter((u) => !s.diplomas[u.id] && unitAf(u.id, s)).map((u) => u.id)
  if (!nieuw.length) return []
  setState((st) => ({
    diplomas: {
      ...st.diplomas,
      ...Object.fromEntries(nieuw.map((id) => [
        id,
        { op: afOp(id, st) || Date.now(), door: '', getekendOp: null, woord: '' } satisfies Diploma,
      ])),
    },
  }))
  return nieuw
}

export const diplomaVan = (unitId: string, s: State = getState()): Diploma | null =>
  s.diplomas[unitId] ?? null

/** De diploma's in de volgorde van het leerpad, zodat de plank een plank is. */
export const diplomasOpPlank = (s: State = getState()): { unitId: string; diploma: Diploma }[] =>
  UNITS.flatMap((u) => (s.diplomas[u.id] ? [{ unitId: u.id, diploma: s.diplomas[u.id]! }] : []))

export const aantalDiplomas = (s: State = getState()): number => diplomasOpPlank(s).length

/** Welke diploma's nog op een handtekening wachten, oudste eerst. */
export const wachtOpHandtekening = (s: State = getState()): string[] =>
  diplomasOpPlank(s).filter(({ diploma }) => !diploma.getekendOp).map(({ unitId }) => unitId)

/** Hoeveel er ondertekend zijn. */
export const aantalOndertekend = (s: State = getState()): number =>
  diplomasOpPlank(s).filter(({ diploma }) => diploma.getekendOp).length

/** Alle zeventien binnen. */
export const plankVol = (s: State = getState()): boolean => aantalDiplomas(s) === UNITS.length

/**
 * Hoe lang een naam en een compliment mogen zijn.
 *
 * Niet uit zuinigheid: dit staat op een diploma dat afgedrukt kan worden, en
 * daar is de ruimte onder de streep zo groot als hij is. Nagemeten op een blad
 * van 210mm: vierentwintig tekens is de breedste naam die naast de datum past,
 * en honderdtwintig het langste compliment dat in drie regels blijft. Langer
 * ingetikt loopt het niet buiten beeld maar wordt het afgekapt — dat is
 * zichtbaar in het veld, en dus te herstellen.
 */
export const MAX_NAAM = 24
export const MAX_WOORD = 120

/**
 * Een volwassene zet zijn naam eronder, en schrijft er iets bij of niet.
 *
 * Mag opnieuw. Een handtekening die je niet kunt herstellen is een
 * handtekening die je niet durft te zetten, en "baba" met een typefout erin
 * staat er anders voor altijd. Opnieuw ondertekenen zet ook de datum opnieuw:
 * het is dan werkelijk een nieuw moment.
 *
 * Een leeg compliment is goed. Wie niets weet te schrijven moet niet
 * tegengehouden worden — zijn naam eronder is al het hele punt. Een lege naam
 * is wél een weigering: dan is er niemand langs geweest.
 *
 * Waar de rekensom van de ouderpoort voor staat, staat in de schermen die dit
 * aanroepen. Hier niet: een functie die zelf gaat bepalen of er een volwassene
 * bij was, is een functie die het ergens vergeet.
 */
export function onderteken(unitId: string, door: string, woord = ''): boolean {
  const naam = door.trim().slice(0, MAX_NAAM)
  if (!naam) return false
  const s = getState()
  if (!s.diplomas[unitId]) return false
  setState((st) => ({
    diplomas: {
      ...st.diplomas,
      [unitId]: {
        ...st.diplomas[unitId]!,
        door: naam,
        woord: woord.trim().slice(0, MAX_WOORD),
        getekendOp: Date.now(),
      },
    },
  }))
  return true
}

/**
 * Wie er allemaal ondertekend hebben, met hoeveel.
 *
 * Dit is waarom de plank een plank is en niet een rij vinkjes. Zeventien
 * diploma's over een jaar zijn ook zeventien keer iemand die erbij ging zitten,
 * en aan het eind staat er wie dat waren. "Mama (9) · baba (6) · jeddi (2)" is
 * een ander soort uitslag dan een percentage.
 *
 * Namen worden op kleine letters vergeleken zodat "Mama" en "mama" dezelfde
 * persoon blijven; wat er op het scherm komt is de vorm die het laatst
 * ingetikt is.
 */
export const ondertekenaars = (s: State = getState()): { naam: string; aantal: number }[] => {
  const op = new Map<string, { naam: string; aantal: number }>()
  for (const { diploma } of diplomasOpPlank(s)) {
    if (!diploma.getekendOp || !diploma.door) continue
    const sleutel = diploma.door.toLocaleLowerCase()
    const al = op.get(sleutel)
    op.set(sleutel, { naam: diploma.door, aantal: (al?.aantal ?? 0) + 1 })
  }
  return [...op.values()].sort((a, b) => b.aantal - a.aantal || a.naam.localeCompare(b.naam))
}

/* ------------------------------------------------------ wat het kind al zag */

/** Ondertekende diploma's die het kind nog niet heeft opgehaald. */
export const nieuweHandtekeningen = (s: State = getState()): string[] =>
  diplomasOpPlank(s)
    .filter(({ unitId, diploma }) => diploma.getekendOp && !s.diplomaGezien.includes(unitId))
    .map(({ unitId }) => unitId)

/**
 * De plank is bekeken.
 *
 * Alles in één keer, en niet per diploma dat je openklapt: het compliment
 * staat op de kaart op de plank zelf, dus wie de bladzijde opent heeft het
 * gezien. Een vlaggetje dat pas weggaat als je elk vakje aantikt, blijft
 * hangen bij het enige diploma dat een kind niet nog eens hoeft te lezen.
 */
export function plankGezien(): void {
  const nieuw = nieuweHandtekeningen()
  if (!nieuw.length) return
  setState((s) => ({ diplomaGezien: [...new Set([...s.diplomaGezien, ...nieuw])] }))
}

/* --------------------------------------------- wat er sindsdien gebeurd is */

export interface Sindsdien {
  /** Waarvandaan gerekend is, of null als er nog nooit ondertekend is. */
  vanaf: number | null
  lessen: number
  dagen: number
  xp: number
}

/**
 * Wat er gebeurd is sinds de vorige handtekening.
 *
 * Dit is het antwoord op "hoe blijft een ouder op de hoogte", en het staat
 * met opzet niet in een melding maar in het paneel waar hij ondertekent. Een
 * ouder die een compliment komt geven wil op dat moment weten waarvoor; een
 * bericht op donderdagavond met vier getallen erin wil niemand, en het is ook
 * precies het soort bericht dat een winkel een "engagement notification"
 * noemt. De informatie komt dus waar het antwoord gegeven wordt.
 *
 * Vanaf de vorige handtekening en niet vanaf deze unit: de vraag is "wat heb
 * ik gemist", niet "wat zat er in deze unit". Is er nog nooit ondertekend, dan
 * is het vanaf het begin en staat `vanaf` op null — dan zegt het scherm dat
 * ook, in plaats van een datum te verzinnen.
 */
export function sindsLaatsteHandtekening(s: State = getState()): Sindsdien {
  const vanaf = Math.max(0, ...diplomasOpPlank(s).map(({ diploma }) => diploma.getekendOp ?? 0))
  const lessen = Object.values(s.lessons).filter((l) => l.lastDone > vanaf).length
  /*
   * De dagen en de XP komen uit `daily`, dat per dag telt en niet per
   * milliseconde. De dag van de handtekening telt dus helemaal mee — wie
   * 's ochtends ondertekent en 's avonds weer, ziet de XP van die ochtend nog
   * een keer. Dat is beter dan de andere kant op: een halve dag wegstrepen
   * maakt het getal kleiner dan wat er werkelijk gebeurd is, en dit getal
   * staat in een compliment.
   */
  const eersteDag = vanaf ? today(new Date(vanaf)) : ''
  const dagen = Object.entries(s.daily).filter(([dag, xp]) => dag >= eersteDag && xp > 0)
  return {
    vanaf: vanaf || null,
    lessen,
    dagen: dagen.length,
    xp: dagen.reduce((som, [, xp]) => som + xp, 0),
  }
}
