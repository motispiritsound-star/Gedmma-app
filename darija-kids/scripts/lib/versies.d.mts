/**
 * De vorm van `versies.mjs`, voor de tests. Zie `plugins.d.mts` voor waarom.
 */
export interface Bouw {
  /** De versionCode. Play weigert er een die hij al gezien heeft. */
  code: number
  /** De versionName, het nummer dat een mens ziet. */
  naam: string
  /** YYYY-MM-DD. */
  datum: string
  /** Waar hij terechtgekomen is. Voor een mens; geen script leest dit. */
  waar?: string
}

export function gebouwd(wortel: string): Bouw[]
export function hoogste(wortel: string): number
export function hoogsteNaam(wortel: string): string | null
export function naamVan(wortel: string, code: number | string): string | null
export function schrijfBij(wortel: string, code: number, naam?: string): void
