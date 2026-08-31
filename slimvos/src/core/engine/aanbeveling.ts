import type { Onderwerp } from '../types';
import { onderwerpenVoorGroep, vindOnderwerp } from '../content/curriculum';
import { heeftGenerator } from '../content';
import type { Profiel } from './profiel';
import { metBeheersing } from './profiel';
import { scoreProcent } from './beheersing';

export interface Aanbeveling {
  onderwerp: Onderwerp;
  niveau: number;
  reden: string;
}

const DAG = 86400000;

/**
 * Kiest wat het kind nu het beste kan oefenen: eerst iets nieuws, dan iets waar
 * het moeite mee heeft, dan iets dat lang geleden is. Het resultaat is de
 * "Ga verder"-knop op het startscherm: één tik en je oefent iets zinnigs.
 */
export function aanbevelingen(profiel: Profiel, aantal = 3, nu = Date.now()): Aanbeveling[] {
  const kandidaten = onderwerpenVoorGroep(profiel.groep).filter((o) => heeftGenerator(o.id));

  const gescoord = kandidaten.map((onderwerp) => {
    const b = metBeheersing(profiel, onderwerp.id, nu);
    const beurten = b.goed + b.fout;
    const dagenGeleden = beurten === 0 ? 99 : (nu - b.laatstGeoefend) / DAG;
    const procent = scoreProcent(b);

    let prioriteit: number;
    let reden: string;
    if (beurten === 0) {
      prioriteit = 100;
      reden = 'Nog niet geoefend';
    } else if (procent < 60) {
      prioriteit = 90 - procent;
      reden = `Nog lastig (${procent}% goed)`;
    } else if (b.sterren < 3) {
      prioriteit = 40 + Math.min(30, dagenGeleden * 5) - b.sterren * 5;
      reden = dagenGeleden >= 3 ? `${Math.round(dagenGeleden)} dagen niet gedaan` : 'Bijna een ster erbij';
    } else {
      prioriteit = Math.min(30, dagenGeleden * 3);
      reden = 'Even opfrissen';
    }
    return { onderwerp, niveau: b.niveau, reden, prioriteit };
  });

  return gescoord
    .sort((a, b) => b.prioriteit - a.prioriteit)
    .slice(0, aantal)
    .map(({ onderwerp, niveau, reden }) => ({ onderwerp, niveau, reden }));
}

/** Het enige onderwerp achter de grote "Ga verder"-knop. */
export function volgendeOefening(profiel: Profiel, nu = Date.now()): Aanbeveling | undefined {
  return aanbevelingen(profiel, 1, nu)[0];
}

export function onderwerpOfFout(id: string): Onderwerp {
  const onderwerp = vindOnderwerp(id);
  if (!onderwerp) throw new Error(`Onbekend onderwerp: ${id}`);
  return onderwerp;
}
