/**
 * Gespreide herhaling, een vereenvoudigde SM-2.
 *
 * Een woord dat je net hebt gezien komt over acht minuten terug; een woord dat
 * je blijft goed doen schuift uit naar dagen en dan weken. Fout zetten zet het
 * vooraan in de rij zonder alles weg te gooien wat je er al van wist.
 *
 * Dit algoritme komt uit de literatuur en niet uit de app waar de techniek van
 * komt: het is rekenwerk en geen inhoud. Wat hier wél anders is, is wat er
 * geplanned wordt -- naast woorden en zinnen ook letters en klankparen, en dat
 * laatste is de kern van unit 0.
 */

export interface Kaart {
  id: string
  /** Hoe makkelijk dit voor déze leerling is. 1.3 (zwaar) … 3.0 (triviaal). */
  gemak: number
  /** Dagen tot de volgende keer. Onder 1 is het nog deze sessie. */
  tussentijd: number
  /** Wanneer hij weer aan de beurt is, in ms sinds 1970. */
  beurt: number
  keren: number
  missers: number
  /** 0…1. Drijft het streepje achter het woord in de woordenlijst. */
  sterkte: number
}

export const MINUUT = 60_000
export const DAG = 86_400_000

export const nieuweKaart = (id: string, nu = Date.now()): Kaart => ({
  id, gemak: 2.4, tussentijd: 0, beurt: nu, keren: 0, missers: 0, sterkte: 0,
})

export type Cijfer = 'fout' | 'moeizaam' | 'goed' | 'makkelijk'

const GEMAK_DELTA: Record<Cijfer, number> = {
  fout: -0.25,
  moeizaam: -0.1,
  goed: 0,
  makkelijk: 0.12,
}

const klem = (v: number, laag: number, hoog: number) => Math.min(hoog, Math.max(laag, v))

export function herzie(kaart: Kaart, cijfer: Cijfer, nu = Date.now()): Kaart {
  const gemak = klem(kaart.gemak + GEMAK_DELTA[cijfer], 1.3, 3)

  if (cijfer === 'fout') {
    return {
      ...kaart,
      gemak,
      tussentijd: 0,
      beurt: nu + 8 * MINUUT,
      keren: kaart.keren + 1,
      missers: kaart.missers + 1,
      // Niet terug naar nul: wie een woord acht keer goed had en nu één keer
      // fout, is het niet kwijt. Een reset zou de hele geschiedenis wissen om
      // één vergissing.
      sterkte: klem(kaart.sterkte - 0.35, 0, 1),
    }
  }

  const gegroeid =
    kaart.tussentijd < 1 ? (cijfer === 'makkelijk' ? 1.5 : 1)
    : kaart.tussentijd < 3 ? kaart.tussentijd * (cijfer === 'moeizaam' ? 1.4 : gemak)
    : kaart.tussentijd * gemak * (cijfer === 'moeizaam' ? 0.7 : 1)

  const tussentijd = klem(Math.round(gegroeid * 10) / 10, 0.007, 240)
  const stap = cijfer === 'makkelijk' ? 0.3 : cijfer === 'goed' ? 0.22 : 0.1

  return {
    ...kaart,
    gemak,
    tussentijd,
    beurt: nu + tussentijd * DAG,
    keren: kaart.keren + 1,
    sterkte: klem(kaart.sterkte + stap, 0, 1),
  }
}

/** Wat aan de beurt is, het zwakste eerst, met een bovengrens. */
export function aanDeBeurt(kaarten: Kaart[], nu = Date.now(), hoogstens = 20): Kaart[] {
  return kaarten
    .filter((k) => k.beurt <= nu)
    .sort((a, b) => a.sterkte - b.sterkte || a.beurt - b.beurt)
    .slice(0, hoogstens)
}

/** Hoe vast een woord zit, als sleutel die de interface in woorden omzet. */
export type Sterkte = 'vast' | 'sterk' | 'bijna' | 'wankel' | 'nieuw'

export function sterkteNaam(sterkte: number): Sterkte {
  if (sterkte >= 0.85) return 'vast'
  if (sterkte >= 0.6) return 'sterk'
  if (sterkte >= 0.35) return 'bijna'
  if (sterkte > 0) return 'wankel'
  return 'nieuw'
}

/**
 * Het voorvoegsel waarmee niet-woorden in de planner staan.
 *
 * Letters als `l:i-dotless`, zinnen als `z:merhaba-1`, klankparen als
 * `p:kil-kil`. Apart gehouden van de woordkaarten, zodat "woorden geleerd" een
 * aantal woorden blijft en niet stil meegroeit met het alfabet.
 */
export const SLEUTEL = {
  letter: (id: string) => `l:${id}`,
  zin: (id: string) => `z:${id}`,
  klankpaar: (id: string) => `p:${id}`,
} as const

export const isWoordKaart = (id: string): boolean => !/^[lzp]:/.test(id)
