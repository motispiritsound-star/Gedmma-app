import type { Antwoord, Vraag } from '../types';
import { maakRonde } from '../content';
import { isGoed } from '../content/helpers';

export const VRAGEN_PER_RONDE = 10;

export interface Sessie {
  onderwerpId: string;
  niveauBijStart: number;
  vragen: Vraag[];
  index: number;
  antwoorden: Antwoord[];
  gestartOp: number;
  vraagGestartOp: number;
  status: 'bezig' | 'klaar';
}

export function startSessie(
  onderwerpId: string,
  niveau: number,
  opties: { aantal?: number; seed?: number; nu?: number } = {},
): Sessie {
  const nu = opties.nu ?? Date.now();
  const aantal = opties.aantal ?? VRAGEN_PER_RONDE;
  const seed = opties.seed ?? Math.floor(Math.random() * 2 ** 31);
  return {
    onderwerpId,
    niveauBijStart: niveau,
    vragen: maakRonde(onderwerpId, niveau, aantal, seed),
    index: 0,
    antwoorden: [],
    gestartOp: nu,
    vraagGestartOp: nu,
    status: 'bezig',
  };
}

export function huidigeVraag(s: Sessie): Vraag | undefined {
  return s.vragen[s.index];
}

export interface AntwoordUitkomst {
  sessie: Sessie;
  goed: boolean;
  vraag: Vraag;
  antwoord: Antwoord;
}

/**
 * Legt een antwoord vast. De sessie blijft op dezelfde vraag staan zodat het
 * scherm eerst de uitleg kan tonen; `volgende()` schuift daarna door.
 */
export function beantwoord(s: Sessie, gegeven: string, nu = Date.now()): AntwoordUitkomst {
  const vraag = huidigeVraag(s);
  if (!vraag || s.status === 'klaar') {
    throw new Error('Deze ronde is al afgerond.');
  }
  if (s.antwoorden.some((a) => a.vraagId === vraag.id)) {
    throw new Error('Deze vraag is al beantwoord.');
  }
  const goed = isGoed(vraag, gegeven);
  const antwoord: Antwoord = {
    vraagId: vraag.id,
    gegeven,
    goed,
    duurMs: Math.max(0, nu - s.vraagGestartOp),
  };
  return {
    sessie: { ...s, antwoorden: [...s.antwoorden, antwoord] },
    goed,
    vraag,
    antwoord,
  };
}

export function volgende(s: Sessie, nu = Date.now()): Sessie {
  const index = s.index + 1;
  return {
    ...s,
    index,
    vraagGestartOp: nu,
    status: index >= s.vragen.length ? 'klaar' : 'bezig',
  };
}

export interface RondeResultaat {
  onderwerpId: string;
  aantal: number;
  goed: number;
  fout: number;
  procent: number;
  duurMs: number;
  /** Vragen die fout gingen, om ze meteen te kunnen herhalen. */
  foutVragen: Vraag[];
}

export function resultaat(s: Sessie, nu = Date.now()): RondeResultaat {
  const goed = s.antwoorden.filter((a) => a.goed).length;
  const aantal = s.antwoorden.length;
  const foutIds = new Set(s.antwoorden.filter((a) => !a.goed).map((a) => a.vraagId));
  return {
    onderwerpId: s.onderwerpId,
    aantal,
    goed,
    fout: aantal - goed,
    procent: aantal === 0 ? 0 : Math.round((goed / aantal) * 100),
    duurMs: Math.max(0, nu - s.gestartOp),
    foutVragen: s.vragen.filter((v) => foutIds.has(v.id)),
  };
}
