import type { Antwoord, Vraag } from '../types';
import { maakRonde } from '../content';
import { isGoed } from '../content/helpers';
import { sleutel } from './herhalen';

/**
 * Zet de herhalingen verspreid tussen de nieuwe vragen, niet vooraan. Een
 * ronde die begint met drie sommen die je vorige keer fout had, voelt als een
 * strafwerkje.
 */
function vlecht(nieuwe: Vraag[], herhalingen: Vraag[]): Vraag[] {
  if (herhalingen.length === 0) return nieuwe;
  const uit = [...nieuwe];
  const stap = Math.max(1, Math.floor(uit.length / (herhalingen.length + 1)));
  herhalingen.forEach((vraag, i) => {
    const plek = Math.min(uit.length, (i + 1) * stap + i);
    uit.splice(plek, 0, vraag);
  });
  return uit;
}

export const VRAGEN_PER_RONDE = 10;

export interface Sessie {
  onderwerpId: string;
  niveauBijStart: number;
  vragen: Vraag[];
  /** Sleutels van de vragen die als herhaling zijn ingevoegd. */
  herhaalSleutels: string[];
  index: number;
  antwoorden: Antwoord[];
  gestartOp: number;
  vraagGestartOp: number;
  status: 'bezig' | 'klaar';
}

export function startSessie(
  onderwerpId: string,
  niveau: number,
  opties: { aantal?: number; seed?: number; nu?: number; herhalingen?: Vraag[] } = {},
): Sessie {
  const nu = opties.nu ?? Date.now();
  const aantal = opties.aantal ?? VRAGEN_PER_RONDE;
  const seed = opties.seed ?? Math.floor(Math.random() * 2 ** 31);
  const herhalingen = (opties.herhalingen ?? []).slice(0, Math.max(0, aantal - 1));
  const nieuwe = maakRonde(onderwerpId, niveau, aantal - herhalingen.length, seed);
  return {
    onderwerpId,
    niveauBijStart: niveau,
    vragen: vlecht(nieuwe, herhalingen),
    herhaalSleutels: herhalingen.map(sleutel),
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
  /** Hoeveel van de vragen herhalingen waren. */
  herhaald: number;
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
  const herhaalSet = new Set(s.herhaalSleutels);
  return {
    onderwerpId: s.onderwerpId,
    aantal,
    herhaald: s.vragen.filter((v) => herhaalSet.has(sleutel(v))).length,
    goed,
    fout: aantal - goed,
    procent: aantal === 0 ? 0 : Math.round((goed / aantal) * 100),
    duurMs: Math.max(0, nu - s.gestartOp),
    foutVragen: s.vragen.filter((v) => foutIds.has(v.id)),
  };
}
