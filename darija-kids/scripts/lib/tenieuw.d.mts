/**
 * De vorm van `tenieuw.mjs`, voor de tests. Zie `plugins.d.mts` voor waarom.
 *
 * Elke regel is: de naam zoals een mens hem kent, waar hij aan te herkennen
 * is, en vanaf welke Chrome hij bestaat.
 */
export type TeNieuw = [naam: string, patroon: RegExp, chrome: number]

export const TE_NIEUW: TeNieuw[]
