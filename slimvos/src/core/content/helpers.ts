import type { Vraag } from '../types';
import { heelGetal, husselen, type Rng } from '../rng';

let teller = 0;
/** Unieke id per gegenereerde vraag binnen één app-sessie. */
export function vraagId(prefix: string): string {
  teller += 1;
  return `${prefix}#${teller}`;
}

export interface KeuzeOpties {
  onderwerpId: string;
  niveau: number;
  stam: string;
  antwoord: string;
  afleiders: string[];
  uitleg: string;
  context?: string;
}

export function keuzeVraag(rng: Rng, o: KeuzeOpties): Vraag {
  const uniek = Array.from(new Set([o.antwoord, ...o.afleiders])).slice(0, 4);
  return {
    id: vraagId(o.onderwerpId),
    onderwerpId: o.onderwerpId,
    niveau: o.niveau,
    type: 'keuze',
    context: o.context,
    stam: o.stam,
    opties: husselen(rng, uniek),
    antwoord: o.antwoord,
    uitleg: o.uitleg,
  };
}

export function invulVraag(o: {
  onderwerpId: string;
  niveau: number;
  stam: string;
  antwoord: string;
  uitleg: string;
  eenheid?: string;
  context?: string;
}): Vraag {
  return {
    id: vraagId(o.onderwerpId),
    onderwerpId: o.onderwerpId,
    niveau: o.niveau,
    type: 'invul',
    context: o.context,
    stam: o.stam,
    antwoord: o.antwoord,
    uitleg: o.uitleg,
    eenheid: o.eenheid,
  };
}

/**
 * Bouwt geloofwaardige foute antwoorden rond een getal: net ernaast, zodat
 * gokken op basis van "welke ziet er raar uit" niet werkt.
 */
export function getalAfleiders(rng: Rng, antwoord: number, spreiding = 10, decimalen = 0): string[] {
  const uit = new Set<string>();
  const rond = (n: number) => (decimalen === 0 ? String(Math.round(n)) : n.toFixed(decimalen).replace('.', ','));
  let pogingen = 0;
  while (uit.size < 3 && pogingen < 60) {
    pogingen += 1;
    const stap = heelGetal(rng, 1, Math.max(1, spreiding));
    const kandidaat = rng() < 0.5 ? antwoord + stap : antwoord - stap;
    if (kandidaat < 0 || Math.abs(kandidaat - antwoord) < 1e-9) continue;
    uit.add(rond(kandidaat));
  }
  return [...uit];
}

/** Normaliseert een antwoord zodat '3,5', '3.5' en ' 3,50 ' gelijk zijn. */
export function normaliseer(waarde: string): string {
  const schoon = waarde.trim().toLowerCase().replace(/\s+/g, ' ').replace(',', '.');
  const getal = Number(schoon);
  if (schoon !== '' && Number.isFinite(getal)) return String(getal);
  return schoon;
}

export function isGoed(vraag: Vraag, gegeven: string): boolean {
  return normaliseer(gegeven) === normaliseer(vraag.antwoord);
}

export function komma(n: number, decimalen = 2): string {
  return n.toFixed(decimalen).replace('.', ',');
}
