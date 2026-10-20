/**
 * Wie welk inhoudsbestand heeft nagekeken.
 *
 * Alles staat op `false`, en dat is geen slordigheid maar de stand van zaken:
 * de Turkse inhoud is met zorg opgeschreven en door niemand met Turks als
 * moedertaal gezien. Zie docs/decisions.md B-1 — dit is het grootste
 * openstaande kwaliteitsrisico van het project.
 *
 * Zet een regel op `true` zodra een moedertaalspreker of Turkse taaldocent
 * dat bestand regel voor regel heeft doorgenomen, en zet erbij wie en wanneer.
 * `nagekeken.test.ts` leest dit en drukt de stand af bij elke testronde.
 */
export interface Nakijkstand {
  /** Of het bestand volledig is nagekeken. */
  klaar: boolean
  /** Door wie, zodra het gebeurd is. Leeg betekent: nog niemand. */
  door: string
  /** Wanneer, als `2026-11-03`. Leeg betekent: nog niet. */
  op: string
  /** Wat er nog specifiek nagekeken moet worden. */
  twijfel?: string[]
}

export const NAKIJKSTAND: Record<string, Nakijkstand> = {
  'letters.ts': {
    klaar: false, door: '', op: '',
    twijfel: [
      'Of de namen van de letters (`ce`, `çe`, `yumuşak ge`) zijn zoals ze op een Turkse school gezegd worden.',
      'Of de klankbeschrijvingen voor een Nederlandse en Duitse lezer kloppen, vooral bij ğ en ı.',
    ],
  },
  'klankparen.ts': {
    klaar: false, door: '', op: '',
    twijfel: [
      'Of elk paar echt minimaal is, en of de als contrast gemarkeerde paren bruikbaar zijn.',
      'Of elk woord past bij een kind van zeven. `kir` (vuil) en `kıl` (haartje) zijn nagekeken op gepastheid, de rest niet.',
      'Of `dağ` / `da` het verschil met ğ echt hoorbaar maakt, of dat daar een beter paar voor is.',
    ],
  },
  'woorden.ts': {
    klaar: false, door: '', op: '',
    twijfel: [
      '`sağ ol` — of dat te informeel is voor een eerste les.',
      '`abi` versus `ağabey` — welke schrijfwijze een kind moet leren.',
      'Of `hoşça kal` en `güle güle` goed uitgelegd staan: wie zegt wat.',
      'Of de familieaanduidingen in de diaspora net zo gebruikt worden als in Turkije.',
    ],
  },
  'zinnen.ts': {
    klaar: false, door: '', op: '',
    twijfel: [
      'Of elke zin klinkt als iets wat een kind werkelijk zegt, en niet als een lesboekzin.',
      'Of de volgorde van `Benim adım Deniz` natuurlijker is dan `Adım Deniz` voor een eerste les.',
    ],
  },
  'achtervoegsels.ts': {
    klaar: false, door: '', op: '',
    twijfel: ['Of de uitleg bij klinkerharmonie klopt zoals een Turkse docent hem zou geven.'],
  },
  'curriculum.ts': {
    klaar: false, door: '', op: '',
    twijfel: ['Of de volgorde van de units en de lesindeling didactisch klopt.'],
  },
}

/** Hoeveel bestanden er nog wachten. Voor de test en voor het ouderoverzicht. */
export const nogNaTeKijken = (): string[] =>
  Object.entries(NAKIJKSTAND).filter(([, s]) => !s.klaar).map(([naam]) => naam)

/** Of de hele inhoud is nagekeken. Zolang dit false is, mag er niets publiceren. */
export const inhoudNagekeken = (): boolean => nogNaTeKijken().length === 0
