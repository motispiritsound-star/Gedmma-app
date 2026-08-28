import type { Vraag } from '../types';
import { MAX_NIVEAU, MIN_NIVEAU } from '../types';
import { maakRng, type Rng } from '../rng';
import { REKENEN_GENERATOREN } from './rekenen';
import { TAAL_GENERATOREN } from './taal';
import { ENGELS_GENERATOREN } from './engels';
import { WERELD_GENERATOREN } from './wereld';
import { LEZEN_GENERATOREN } from './lezen';

export type VraagGenerator = (niveau: number, rng: Rng) => Vraag;

export const GENERATOREN: Record<string, VraagGenerator> = {
  ...REKENEN_GENERATOREN,
  ...TAAL_GENERATOREN,
  ...ENGELS_GENERATOREN,
  ...WERELD_GENERATOREN,
  ...LEZEN_GENERATOREN,
};

export function heeftGenerator(onderwerpId: string): boolean {
  return onderwerpId in GENERATOREN;
}

function klem(niveau: number): number {
  return Math.min(MAX_NIVEAU, Math.max(MIN_NIVEAU, Math.round(niveau)));
}

/**
 * Maakt één vraag. `niveau` wordt altijd binnen 1..5 gehouden, zodat een
 * generator nooit op een ongeldig niveau wordt aangeroepen.
 */
export function maakVraag(onderwerpId: string, niveau: number, rng: Rng): Vraag {
  const generator = GENERATOREN[onderwerpId];
  if (!generator) throw new Error(`Geen vragen beschikbaar voor onderwerp "${onderwerpId}"`);
  return generator(klem(niveau), rng);
}

/**
 * Bouwt een ronde. Rond 70% van de vragen staat op het huidige niveau, de rest
 * eromheen: een paar makkelijkere om zelfvertrouwen te geven en een paar
 * moeilijkere om te kijken of het kind al toe is aan het volgende niveau.
 */
export function maakRonde(onderwerpId: string, niveau: number, aantal: number, seed: number): Vraag[] {
  const rng = maakRng(seed);
  const basis = klem(niveau);
  const vragen: Vraag[] = [];
  const gezien = new Set<string>();
  for (let i = 0; i < aantal; i++) {
    const rol = rng();
    const doelNiveau = rol < 0.15 ? basis - 1 : rol > 0.85 ? basis + 1 : basis;
    let vraag = maakVraag(onderwerpId, doelNiveau, rng);
    // Voorkom dat dezelfde vraagtekst twee keer in één ronde staat.
    for (let poging = 0; poging < 8 && gezien.has(vraag.stam + (vraag.context ?? '')); poging++) {
      vraag = maakVraag(onderwerpId, doelNiveau, rng);
    }
    gezien.add(vraag.stam + (vraag.context ?? ''));
    vragen.push(vraag);
  }
  return vragen;
}
