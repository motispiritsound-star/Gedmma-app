/**
 * Wat beeld kost, per manier om eraan te komen.
 *
 * De vraag was "zijn er goedkopere alternatieven", en het eerlijke antwoord is
 * dat de prijs per seconde de minst belangrijke knop is. Van $0,10 naar $0,04
 * scheelt een factor 2,5. Van negenhonderd gegenereerde seconden naar dertig
 * scheelt een factor dertig. Die tweede knop zit in je montage en niet bij je
 * leverancier.
 *
 * Daarom rekent dit niet "welk model is het goedkoopst" maar "wat kost een
 * maand als je X seconden laat genereren". Dat is de beslissing die je neemt.
 */

export interface Beeldmanier {
  key: string
  naam: string
  /** Dollarcent per seconde eindvideo. */
  centsPerSeconde: number
  /** Dollarcent per losse afbeelding, waar dat de eenheid is. */
  centsPerBeeld?: number
  rechten: 'eigen' | 'licentie-nodig' | 'vrij-met-voorwaarden'
  risico: string
}

/**
 * Prijzen uit secundaire bronnen, oktober 2026. Niet bij de leverancier zelf
 * gelezen — die pagina's waren vanuit deze omgeving niet te openen. Reken ze na
 * op de prijspagina voordat je een maand vastlegt; ze veranderen vaak.
 */
export const MANIEREN: Beeldmanier[] = [
  {
    key: 'eigen-tekening', naam: 'Eigen tekening, bewogen met FFmpeg',
    centsPerSeconde: 0, rechten: 'eigen',
    risico: 'Geen. Dit is wat er nu staat.',
  },
  {
    key: 'gratis-stock', naam: 'Gratis stock (Pexels, Pixabay)',
    centsPerSeconde: 0, rechten: 'vrij-met-voorwaarden',
    risico: 'Commercieel toegestaan zonder naamsvermelding, maar: geen ' +
      'vrijwaring, merken en logos in beeld mogen niet, en iedereen gebruikt ' +
      'dezelfde clips. Telt mee voor het plafond op geleend beeld.',
  },
  {
    key: 'eigen-stills', naam: 'Gegenereerde stills met camerabeweging',
    centsPerSeconde: 0, centsPerBeeld: 3, rechten: 'licentie-nodig',
    risico: 'Controleer per model of commercieel gebruik mag.',
  },
  {
    key: 'wan-480', naam: 'WAN 2.5 op 480p (goedkoopste bruikbare)',
    centsPerSeconde: 5, rechten: 'licentie-nodig',
    risico: '480p is zichtbaar zacht op een groot scherm.',
  },
  {
    key: 'wan-720', naam: 'WAN 2.5 op 720p',
    centsPerSeconde: 10, rechten: 'licentie-nodig',
    risico: 'Clips van vijf tot tien seconden; samenhang moet uit de montage komen.',
  },
  {
    key: 'kling-turbo', naam: 'Kling V3 Turbo Pro',
    centsPerSeconde: 14, rechten: 'licentie-nodig',
    risico: 'Beste beeld van deze lijst, duurste per seconde.',
  },
]

export interface Raming {
  manier: Beeldmanier
  centsPerVideo: number
  centsPerMaand: number
  /** True wanneer dit binnen het maandbudget past. */
  past: boolean
}

export interface Opzet {
  /** Lengte van de aflevering in seconden. */
  videoSeconden: number
  /** Hoeveel daarvan generatief wordt gemaakt. De rest is eigen beeld. */
  generatieveSeconden: number
  /** Aantal stills wanneer je met camerabeweging werkt. */
  beelden: number
  videosPerMaand: number
  budgetCentsPerMaand: number
}

export function raam(opzet: Opzet, manieren = MANIEREN): Raming[] {
  const seconden = Math.min(opzet.generatieveSeconden, opzet.videoSeconden)
  return manieren.map((manier) => {
    const perVideo = manier.centsPerBeeld !== undefined
      ? manier.centsPerBeeld * opzet.beelden
      : manier.centsPerSeconde * seconden
    const perMaand = perVideo * opzet.videosPerMaand
    return {
      manier,
      centsPerVideo: Math.round(perVideo),
      centsPerMaand: Math.round(perMaand),
      past: Math.round(perMaand) <= opzet.budgetCentsPerMaand,
    }
  })
}

/**
 * Hoeveel seconden generatief beeld er per video in passen zonder het budget
 * te overschrijden. Dit is het getal waar de beslissing op neerkomt.
 */
export function maxSeconden(
  centsPerSeconde: number, videosPerMaand: number, budgetCentsPerMaand: number,
): number {
  if (centsPerSeconde <= 0) return Infinity
  if (videosPerMaand <= 0) return Infinity
  return Math.floor(budgetCentsPerMaand / (centsPerSeconde * videosPerMaand))
}
