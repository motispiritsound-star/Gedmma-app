import { PAD, UNITS } from '../content/curriculum'
import type { Staat } from './opslag'
import { allesOpen } from './omgeving'

/**
 * Wat gratis is, en wat bij het abonnement hoort.
 *
 * Geteld in LESSEN en niet in units, en dat is een les uit de app waar de
 * techniek van komt: een hele unit gratis is weken werk, en tegen de tijd dat
 * iemand die af heeft, probeert hij de app niet meer uit. Vier lessen is
 * ongeveer twintig minuten -- lang genoeg om het Turkse alfabet te kunnen
 * lezen en `merhaba`, `teşekkür ederim` en `görüşürüz` te kunnen zeggen,
 * iets wat een kind dezelfde avond kan laten zien, en kort genoeg dat de
 * vraag "en dan?" komt terwijl het nog leuk is.
 *
 * Tellen in lessen laat het gratis deel ook middenin een unit eindigen, zodat
 * wat erna komt zichtbaar op het pad staat in plaats van achter een unit die
 * nooit opengaat. Zien wat er nog komt is de beste reden om verder te willen.
 *
 * Zie docs/decisions.md B-6. De aantallen zijn een voorstel.
 */
export const GRATIS_PER_UNIT: Record<string, number> = { harfler: 3, merhaba: 1 }

/** De gratis lessen, in de volgorde van het pad. */
export const GRATIS_LESSEN: string[] = UNITS.flatMap((u) =>
  u.lessen.slice(0, GRATIS_PER_UNIT[u.id] ?? 0).map((l) => l.id),
)

/** Het aantal dat de app noemt. Afgeleid, zodat scherm en regel niet uiteenlopen. */
export const AANTAL_GRATIS = GRATIS_LESSEN.length

const gratis = new Set(GRATIS_LESSEN)

/** De woorden, letters en klankparen die in een gratis les voorkomen. */
export const GRATIS_WOORDEN = new Set(
  PAD.filter(({ les }) => gratis.has(les.id)).flatMap(({ les }) => les.woorden),
)
export const GRATIS_LETTERS = new Set(
  PAD.filter(({ les }) => gratis.has(les.id)).flatMap(({ les }) => les.letters ?? []),
)

export const heeftToegang = (s: Staat): boolean => s.abonnement.actief || allesOpen()

/** Of een les open staat: betaald, gratis, of de vorige is af. */
export function lesOpen(lesId: string, s: Staat): boolean {
  if (heeftToegang(s)) return opVolgorde(lesId, s)
  if (!gratis.has(lesId)) return false
  return opVolgorde(lesId, s)
}

/**
 * Waarom een les op slot staat. Het scherm zegt iets anders bij elk van de
 * twee, en dat verschil is het hele punt: "nog niet aan de beurt" is iets wat
 * een kind zelf kan oplossen, "hoort bij het abonnement" niet.
 */
export type Slot = 'open' | 'volgorde' | 'betaald'

export function slotVan(lesId: string, s: Staat): Slot {
  /*
   * Het betaalde slot gaat vóór het volgordeslot, ook als beide gelden.
   *
   * Dat is niet willekeurig. Een les die om beide redenen dicht zit en
   * "maak de les ervoor af" zegt, stuurt een kind op een opdracht die het
   * slot niet opent: het doet die les, komt terug, en vindt een slotje. Dat
   * is een kleine misleiding en precies het soort ding waar een ouder zijn
   * vertrouwen aan verliest.
   *
   * Dus noemt het scherm de reden die bindt. `lesOpen` blijft wél beide
   * eisen: betalen koopt toegang, niet het overslaan van de leerlijn.
   */
  if (!heeftToegang(s) && !gratis.has(lesId)) return 'betaald'
  if (!opVolgorde(lesId, s)) return 'volgorde'
  return 'open'
}

/**
 * Of de les ervoor af is.
 *
 * De eerste les van het pad staat altijd open. Daarna moet de vorige minstens
 * één keer gedaan zijn -- niet met drie sterren, want dan zit een kind vast
 * op een les die het niet perfect krijgt, en dat is geen leren maar afstraffen.
 */
function opVolgorde(lesId: string, s: Staat): boolean {
  const i = PAD.findIndex(({ les }) => les.id === lesId)
  if (i <= 0) return i === 0
  const vorige = PAD[i - 1]!.les.id
  return (s.lessen[vorige]?.keren ?? 0) > 0
}

/** De eerste les die nog niet af is. Waar de knop "verder" naartoe gaat. */
export function volgendeLes(s: Staat): string {
  const open = PAD.find(({ les }) => (s.lessen[les.id]?.keren ?? 0) === 0 && lesOpen(les.id, s))
  if (open) return open.les.id
  // Alles open is gedaan: terug naar de laatste die wél kan, om te herhalen.
  const laatste = [...PAD].reverse().find(({ les }) => lesOpen(les.id, s))
  return laatste?.les.id ?? PAD[0]!.les.id
}

export const woordOpSlot = (id: string, s: Staat): boolean =>
  !heeftToegang(s) && !GRATIS_WOORDEN.has(id)

export const letterOpSlot = (id: string, s: Staat): boolean =>
  !heeftToegang(s) && !GRATIS_LETTERS.has(id)
