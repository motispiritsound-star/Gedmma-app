import { heelGetal, kies, husselen, type Rng } from '../rng';

/**
 * Een klein rekensommetje dat een kind van de basisschool niet zomaar maakt,
 * voor het geval er geen pincode is ingesteld. Het is geen beveiliging tegen
 * een vastberaden tiener — het houdt een zesjarige uit de instellingen.
 */
export interface OuderslotVraag {
  stam: string;
  antwoord: number;
  opties: number[];
}

export function maakOuderslotVraag(rng: Rng): OuderslotVraag {
  const a = heelGetal(rng, 12, 29);
  const b = heelGetal(rng, 12, 29);
  const soort = kies(rng, ['keer', 'plus'] as const);
  const antwoord = soort === 'keer' ? a * b : a * 10 + b;
  const stam = soort === 'keer' ? `${a} × ${b}` : `${a} × 10 + ${b}`;

  const afleiders = new Set<number>();
  while (afleiders.size < 3) {
    const kandidaat = antwoord + heelGetal(rng, -40, 40);
    if (kandidaat > 0 && kandidaat !== antwoord) afleiders.add(kandidaat);
  }
  return { stam: `Hoeveel is ${stam}?`, antwoord, opties: husselen(rng, [antwoord, ...afleiders]) };
}
