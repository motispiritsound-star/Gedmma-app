/**
 * Hoe een video online komt.
 *
 * De opdracht zegt: publiceer niets zonder expliciete toestemming. Die regel
 * bestaat om één ding te voorkomen — dat een fout die niemand heeft gezien,
 * onomkeerbaar naar buiten gaat. Dat is een echt risico bij claims waar een
 * oordeel aan te pas komt: een overlevering, een gradering, een medische
 * uitspraak. Daar kan software niet voor instaan en moet er een mens kijken.
 *
 * Bij claims die alleen een getal uit een genoemde openbare bron zijn, ligt dat
 * anders. Dan is de controle mechanisch: staat het getal in het script hetzelfde
 * als in de bron waarnaar het verwijst? Dat kan een machine, en beter dan een
 * mens die het voor de vijftiende week op rij nakijkt.
 *
 * Daarom drie standen, en niet twee:
 *
 *   handmatig    Niets gaat online zonder dat jij het commando geeft. De video
 *                komt privé op je kanaal. Dit is de standaard, en de enige
 *                stand die is toegestaan bij inhoud met oordeelclaims.
 *
 *   uitgesteld   De video wordt ingepland om over N uur vanzelf openbaar te
 *                worden. Jij hoeft niets te doen om hem te laten gaan, en één
 *                handeling om hem tegen te houden. Toestemming door niet in te
 *                grijpen, met een pauzeknop die echt werkt.
 *
 *   direct       Meteen openbaar. Geen venster, geen weg terug.
 *
 * De grendel die hieronder staat is het hele punt van dit bestand: welke stand
 * je ook kiest, bij een kanaalprofiel met oordeelclaims valt hij terug op
 * handmatig. Die keuze staat in code en niet in een instelling, zodat een
 * verkeerde regel in .env je kanaal niet kan kosten.
 */

export type PublicatieStand = 'handmatig' | 'uitgesteld' | 'direct'

/**
 * Wat voor claims een kanaal maakt. Dit bepaalt of uitstellen mag, en het is
 * geen smaakoordeel maar een eigenschap van de inhoud.
 */
export type Claimprofiel =
  /** Alleen getallen en feiten uit genoemde openbare bronnen. */
  | 'controleerbaar'
  /** Er komt uitleg of duiding bij die iemand moet wegen. */
  | 'oordeel'

export interface PublicatieBesluit {
  privacyStatus: 'private' | 'unlisted' | 'public'
  /** RFC3339; alleen gezet bij een ingeplande publicatie. */
  publishAt?: string
  /** De stand die werkelijk is toegepast. */
  stand: PublicatieStand
  /** Waarom, in één zin die je aan jezelf kunt voorlezen. */
  uitleg: string
  /** True wanneer de gevraagde stand is teruggezet. */
  teruggezet: boolean
}

export const MINIMUM_UITSTEL_UREN = 1
export const STANDAARD_UITSTEL_UREN = 24

export function leesStand(waarde: string | undefined): PublicatieStand {
  const schoon = (waarde ?? '').trim().toLowerCase()
  if (schoon === 'uitgesteld' || schoon === 'direct') return schoon
  return 'handmatig'
}

/**
 * Uren uitstel, met een bodem. Nul uur uitstel is geen uitstel maar direct
 * publiceren onder een andere naam, en dan hoort er ook `direct` te staan —
 * anders lees je in je eigen instellingen dat er een venster is dat er niet is.
 */
export function leesUren(waarde: string | undefined): number {
  const n = Number.parseFloat((waarde ?? '').trim())
  if (!Number.isFinite(n)) return STANDAARD_UITSTEL_UREN
  return Math.max(MINIMUM_UITSTEL_UREN, n)
}

export function besluit(opties: {
  stand: PublicatieStand
  profiel: Claimprofiel
  urenUitstel?: number
  nu?: Date
}): PublicatieBesluit {
  const { stand, profiel } = opties
  const nu = opties.nu ?? new Date()

  if (profiel === 'oordeel' && stand !== 'handmatig') {
    return {
      privacyStatus: 'private',
      stand: 'handmatig',
      teruggezet: true,
      uitleg:
        `Stand "${stand}" is niet toegestaan bij een kanaal met oordeelclaims. ` +
        'Wat er gezegd wordt over geloof, gezondheid of personen kun je niet ' +
        'terugnemen als het fout is. De video staat privé en wacht op jou.',
    }
  }

  if (stand === 'direct') {
    return {
      privacyStatus: 'public',
      stand: 'direct',
      teruggezet: false,
      uitleg: 'Meteen openbaar. Er is geen venster om dit terug te draaien.',
    }
  }

  if (stand === 'uitgesteld') {
    const uren = opties.urenUitstel ?? STANDAARD_UITSTEL_UREN
    const moment = new Date(nu.getTime() + uren * 3600_000)
    return {
      privacyStatus: 'private',
      publishAt: moment.toISOString(),
      stand: 'uitgesteld',
      teruggezet: false,
      uitleg:
        `Ingepland om over ${uren} uur openbaar te worden ` +
        `(${moment.toISOString()}). Doe je niets, dan gaat hij. Wil je hem ` +
        'tegenhouden: YouTube Studio, zet de video terug op privé.',
    }
  }

  return {
    privacyStatus: 'private',
    stand: 'handmatig',
    teruggezet: false,
    uitleg: 'Privé op je kanaal. Openbaar maken doe jij in YouTube Studio.',
  }
}
