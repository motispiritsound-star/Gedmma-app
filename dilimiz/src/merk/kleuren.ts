/**
 * Het palet.
 *
 * Licht eerst. De referentie-app is 's nachts gezet — donkerblauw oppervlak met
 * warme accenten erboven. Deze app is 's ochtends gezet: koel papier, diep
 * çini-blauw, warme kleuren als accent. Dat is de snelste manier om twee apps
 * naast elkaar niet op elkaar te laten lijken, en het past bij de inhoud:
 * İznik-keramiek is blauw op wit.
 *
 * De namen zijn Turks omdat het een Turkse app is, en omdat `kayisi` beter
 * onthoudt waar hij voor staat dan `orange-400`.
 *
 * Elke waarde hier hoort gelijk te lopen met `--kleur-*` in src/stijl.css.
 * `kleuren.test.ts` legt ze naast elkaar, en controleert ook dat geen enkele
 * waarde uit het palet van de referentie-app hier voorkomt.
 */

/** De vier accenten waaruit een kind er één voor zichzelf kiest. */
export const ACCENTEN = ['cini', 'kayisi', 'fistik', 'gul'] as const
export type Accent = (typeof ACCENTEN)[number]

/** De kleur van het bolletje dat je aantikt, per accent. */
export const ACCENTKLEUR: Record<Accent, string> = {
  cini: '#2f4fa8',
  kayisi: '#f2994a',
  fistik: '#5fa845',
  gul: '#d94f70',
}

/** Hoe het accent in de interface heet, als sleutel voor i18n. */
export const ACCENTNAAM: Record<Accent, string> = {
  cini: 'blauw',
  kayisi: 'abrikoos',
  fistik: 'groen',
  gul: 'roze',
}

/**
 * De kleurwaarden van de referentie-app.
 *
 * Staan hier alleen om ertegen te kunnen testen. Komt er een van deze waarden
 * in dit project voor, dan is er iets gekopieerd dat niet gekopieerd mocht
 * worden.
 */
export const KLEUREN_VAN_DE_ANDERE_APP = [
  '#f59e0b', '#d97706', '#b45309', '#ffd166', '#fbbf24', // saffraan
  '#e2603c', '#c34a2c', '#9a3412', '#ff9f7a',             // terra
  '#14b8a6', '#2dd4bf', '#0f766e', '#115e59', '#6fded0',  // zellige
  '#22c55e', '#16a34a', '#15803d', '#4ade80',             // mint
  '#c1272d', '#9e1f24',                                   // alam
  '#006233', '#0b8046', '#3da76a',                        // khatim
  '#0d1220', '#080c17', '#131b30', '#1b2540',             // nacht
  '#fffaf3', '#f4ece1', '#1a1625', '#e7dccd',             // oppervlak en inkt
] as const
