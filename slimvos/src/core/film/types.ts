import type { VakId } from '../types';

export type Uitdrukking = 'blij' | 'juich' | 'denk' | 'troost' | 'slaap' | 'wijs';

/** Eén beeld uit een filmpje: wat Vos doet en wat er te zien is. */
export interface Beeld {
  duurMs: number;
  uitdrukking: Uitdrukking;
  kop: string;
  tekst: string;
  /** Regels die één voor één verschijnen, bijvoorbeeld de stappen van een som. */
  stappen?: string[];
  /** Accentkleur voor dit beeld; standaard de merkkleur. */
  tint?: 'merk' | 'goed' | 'goud' | 'slot' | 'fout';
}

export interface Film {
  id: string;
  titel: string;
  /** Zin die onder de titel staat in de lijst. */
  pitch: string;
  vak: VakId | 'algemeen';
  /** Bij welk onderwerp hij hoort; leeg voor de motiverende filmpjes. */
  onderwerpId?: string;
  /** Motiverende filmpjes staan apart in de lijst. */
  soort: 'uitleg' | 'motivatie';
  beelden: Beeld[];
  /**
   * Zodra er een echt gefilmd of getekend filmpje is, komt de URL hier te
   * staan. De speler kiest dan die video in plaats van de beelden hierboven.
   */
  videoUrl?: string;
}

export function duurVan(film: Film): number {
  return film.beelden.reduce((n, b) => n + b.duurMs, 0);
}

/** Welk beeld hoort bij deze speeltijd? */
export function beeldOpTijd(film: Film, msVerstreken: number): { index: number; beeld: Beeld; startMs: number } {
  let start = 0;
  for (let i = 0; i < film.beelden.length; i++) {
    const beeld = film.beelden[i];
    if (msVerstreken < start + beeld.duurMs || i === film.beelden.length - 1) {
      return { index: i, beeld, startMs: start };
    }
    start += beeld.duurMs;
  }
  return { index: 0, beeld: film.beelden[0], startMs: 0 };
}
