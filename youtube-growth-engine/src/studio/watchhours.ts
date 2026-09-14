/**
 * Hoe videolengte de weg naar monetisatie verandert.
 *
 * De drempels van het Partner Program staan in kijkUREN, niet in views. Daardoor
 * telt een lange video die half wordt uitgekeken zwaarder dan een korte die
 * bijna helemaal wordt uitgekeken — en dat is het enige aantoonbaar juiste
 * argument in de "maak ze vijftien minuten"-adviezen die rondgaan.
 *
 * Het argument heeft één harde voorwaarde: de inhoud moet die lengte dragen.
 * Vullen om aan vijftien minuten te komen verlaagt het bekeken percentage, en
 * omdat dat percentage in de teller staat, werkt vullen averechts — je hebt dan
 * méér views nodig, niet minder.
 */

export interface Drempel {
  naam: string
  abonnees: number
  kijkuren: number
  opent: string
}

export const DREMPELS: Drempel[] = [
  {
    naam: 'Fan funding',
    abonnees: 500, kijkuren: 3000,
    opent: 'lidmaatschappen, Super Thanks, Shopping',
  },
  {
    naam: 'Advertenties',
    abonnees: 1000, kijkuren: 4000,
    opent: 'AdSense en het Premium-aandeel',
  },
]

export interface LengteScenario {
  minuten: number
  /** Gemiddeld bekeken percentage. Langere video's halen er doorgaans minder. */
  bekekenPercentage: number
}

export interface Uitkomst {
  minuten: number
  bekekenPercentage: number
  kijkminutenPerView: number
  /** Views nodig per drempel. */
  views: { drempel: string; views: number }[]
  /** Kan deze lengte midrolls dragen? */
  midrolls: boolean
}

/** Midrolls mogen vanaf acht minuten. */
export const MIDROLL_MINUTEN = 8

export function berekenLengte(scenarios: LengteScenario[]): Uitkomst[] {
  return scenarios.map((s) => {
    const perView = s.minuten * (s.bekekenPercentage / 100)
    return {
      minuten: s.minuten,
      bekekenPercentage: s.bekekenPercentage,
      kijkminutenPerView: Math.round(perView * 100) / 100,
      midrolls: s.minuten >= MIDROLL_MINUTEN,
      views: DREMPELS.map((d) => ({
        drempel: d.naam,
        views: Math.ceil((d.kijkuren * 60) / perView),
      })),
    }
  })
}

/**
 * De omslag: bij welk bekeken percentage levert een langere video níét meer op?
 * Dit is het getal dat de "maak ze langer"-adviezen nooit noemen.
 */
export function omslagpunt(
  kort: LengteScenario, langMinuten: number,
): number {
  const kortPerView = kort.minuten * (kort.bekekenPercentage / 100)
  // Onder dit percentage levert de lange video minder kijktijd per view op.
  return Math.round((kortPerView / langMinuten) * 100 * 10) / 10
}

export function formatteer(uitkomsten: Uitkomst[]): string {
  const regels: string[] = []
  regels.push(
    '  lengte   bekeken   min/view   views voor 3.000 u   views voor 4.000 u   midrolls',
  )
  for (const u of uitkomsten) {
    const fan = u.views.find((v) => v.drempel === 'Fan funding')?.views ?? 0
    const ads = u.views.find((v) => v.drempel === 'Advertenties')?.views ?? 0
    regels.push(
      `  ${String(u.minuten).padStart(2)} min` +
      `   ${String(u.bekekenPercentage).padStart(4)}%` +
      `   ${u.kijkminutenPerView.toFixed(2).padStart(8)}` +
      `   ${fan.toLocaleString('nl-NL').padStart(18)}` +
      `   ${ads.toLocaleString('nl-NL').padStart(18)}` +
      `   ${u.midrolls ? 'ja' : 'nee'}`,
    )
  }
  return regels.join('\n')
}
