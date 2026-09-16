/**
 * Eén opname in losse woorden knippen.
 *
 * Eenenveertig woorden los inspreken betekent eenenveertig keer een knop
 * vasthouden, loslaten, luisteren, opslaan. Dat is niet moeilijk maar het is
 * wel het soort werk waar iemand halverwege mee stopt. Achter elkaar inlezen
 * is één handeling: de lijst van het scherm lezen met een adempauze tussen de
 * woorden, en dit zoekt daarna de stiltes op.
 *
 * Het is met opzet geen slimme spraakherkenning. Het telt energie per 10 ms en
 * knipt waar het lang genoeg stil is, want dat is te controleren en te
 * voorspellen: wie een woord overslaat ziet dat meteen terug in de lijst, en
 * kan het losse woord alsnog opnieuw doen.
 */

export interface Stuk {
  /** Begin en eind in seconden, binnen de hele opname. */
  van: number
  tot: number
}

export interface KnipOpties {
  /**
   * Hoe lang het stil moet zijn voordat het een grens is.
   *
   * Een adempauze tussen twee woorden is ongeveer een halve seconde; de stilte
   * binnen een woord — de sluiting van een b of een t — is hooguit een paar
   * honderdste. Drie tienden zit daar ruim tussenin.
   */
  pauze?: number
  /** Korter dan dit is een kuch of een klik, geen woord. */
  kortste?: number
  /** Wat er aan weerszijden blijft staan, zodat een medeklinker heel blijft. */
  marge?: number
}

/**
 * De grens tussen stilte en spraak, uit de opname zelf.
 *
 * Een vaste drempel werkt niet: de ene telefoon ruist tien keer harder dan de
 * andere, en een keuken is geen slaapkamer. Dit leest de ruisbodem af als het
 * stilste tiende deel en legt de grens daar ruim boven — maar nooit zo laag
 * dat de ruis zelf als spraak telt.
 */
export function drempelVan(energie: number[]): number {
  const gesorteerd = [...energie].sort((a, b) => a - b)
  const bodem = gesorteerd[Math.floor(gesorteerd.length * 0.1)] ?? 0
  const luid = gesorteerd[Math.floor(gesorteerd.length * 0.95)] ?? 0
  return Math.max(bodem * 4, luid * 0.08, 0.004)
}

/** De energie per venster van 10 ms, waar al het andere op rust. */
export function energieVan(samples: Float32Array, rate: number): number[] {
  const venster = Math.max(1, Math.round(rate * 0.01))
  const uit: number[] = []
  for (let i = 0; i + venster <= samples.length; i += venster) {
    let som = 0
    for (let k = i; k < i + venster; k++) som += samples[k]! * samples[k]!
    uit.push(Math.sqrt(som / venster))
  }
  return uit
}

/** Waar de woorden zitten in één doorlopende opname. */
export function knip(
  samples: Float32Array,
  rate: number,
  { pauze = 0.3, kortste = 0.12, marge = 0.05 }: KnipOpties = {},
): Stuk[] {
  const energie = energieVan(samples, rate)
  if (!energie.length) return []
  const drempel = drempelVan(energie)
  const stilteNodig = Math.round(pauze / 0.01)

  const stukken: Stuk[] = []
  let begin = -1
  let stil = 0
  const sluit = (eind: number) => {
    // De ondergrens geldt voor de spráák, niet voor wat er met marge omheen
    // komt te staan: anders wordt een klik van 40 ms er een van 140 en telt
    // hij alsnog mee als woord.
    const duur = (eind - begin) * 0.01
    if (duur < kortste) { begin = -1; return }
    stukken.push({
      van: Math.max(0, begin * 0.01 - marge),
      tot: Math.min(samples.length / rate, eind * 0.01 + marge),
    })
    begin = -1
  }

  for (let i = 0; i < energie.length; i++) {
    if (energie[i]! > drempel) {
      if (begin < 0) begin = i
      stil = 0
      continue
    }
    if (begin < 0) continue
    stil++
    if (stil >= stilteNodig) sluit(i - stil)
  }
  if (begin >= 0) sluit(energie.length)
  return stukken
}
