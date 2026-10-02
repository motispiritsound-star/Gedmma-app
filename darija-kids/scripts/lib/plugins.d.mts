/**
 * De vorm van `plugins.mjs`, voor de tests.
 *
 * De scripts zelf zijn javascript — ze draaien met kaal `node`, zonder
 * bouwstap, want dat is precies wat je wil van iets dat een bundel maakt.
 * Maar `src/site/plugins.test.ts` is typescript, en zonder dit bestand is
 * alles wat daaruit komt `any`. Dan bewaakt de test de naam van de functies
 * nog wel, maar niet meer wat ze teruggeven.
 */
export type Plugin = 'android' | 'ios'

export interface Pluginstand {
  /** Pakketten met een `capacitor`-veld voor dit platform. */
  verwacht: string[]
  /** Wat er in capacitor.plugins.json staat. */
  ingeschreven: string[]
  /** Geïnstalleerd, maar niet ingeschreven. */
  ontbreekt: string[]
  /** In package.json, maar niet in node_modules. */
  nietGeinstalleerd: string[]
}

export interface Klasse {
  /** Waar hij bij hoort: 'de app zelf', of de pakketnaam van een plugin. */
  wat: string
  /** De java-naam, met punten: `app.darijaforkids.learn.MainActivity`. */
  klasse: string
}

export function pluginstand(wortel: string, platform?: Plugin): Pluginstand
export function pluginklacht(wortel: string, platform?: Plugin): string | null
export function verwachteKlassen(wortel: string): Klasse[]
export function dexNaam(klasse: string): string
export function kwijtInDex(dex: Buffer, verwacht: Klasse[]): Klasse[]
