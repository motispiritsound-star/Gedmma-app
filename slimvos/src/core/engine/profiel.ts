import type { Groep } from '../types';
import { startNiveau, vindOnderwerp, onderwerpenVoorGroep } from '../content/curriculum';
import { GRATIS_VAK } from '../abonnement/toegang';
import { nieuweBeheersing, naAntwoord, type Beheersing } from './beheersing';
import {
  dagSleutel,
  levelVoorXp,
  muntenVoorRonde,
  werkStreakBij,
  xpVoorAntwoord,
  XP_RONDE_PERFECT,
  type Streak,
} from './punten';
import type { Sessie } from './sessie';
import { resultaat } from './sessie';

export const PROFIEL_VERSIE = 1;

export interface RondeLog {
  onderwerpId: string;
  tijd: number;
  aantal: number;
  goed: number;
  xp: number;
  niveauVoor: number;
  niveauNa: number;
  duurMs: number;
}

export interface DagTeller {
  datum: string;
  vragen: number;
  goed: number;
  xp: number;
  minuten: number;
  /** Vragen buiten het gratis vak; hierop rust de limiet van de gratis versie. */
  buitenGratisVak: number;
}

export interface Profiel {
  versie: number;
  id: string;
  naam: string;
  avatar: string;
  groep: Groep;
  xp: number;
  munten: number;
  streak: Streak;
  beheersing: Record<string, Beheersing>;
  badges: string[];
  bezit: string[];
  /** Aantal vragen per dag dat het kind zich voorneemt. */
  dagdoel: number;
  vandaag: DagTeller;
  /** De laatste 100 rondes, voor het ouderdashboard. */
  geschiedenis: RondeLog[];
  /** Pincode voor het oudergedeelte; null = nog niet ingesteld. */
  ouderPincode: string | null;
  aangemaakt: number;
}

export const AVATARS = ['🦊', '🦉', '🐼', '🐨', '🐸', '🦄', '🐙', '🦖', '🐝', '🦁', '🐧', '🦋'];

export function nieuwProfiel(naam: string, groep: Groep, avatar = AVATARS[0], nu = Date.now()): Profiel {
  const beheersing: Record<string, Beheersing> = {};
  for (const onderwerp of onderwerpenVoorGroep(groep)) {
    beheersing[onderwerp.id] = nieuweBeheersing(onderwerp.id, startNiveau(onderwerp, groep), nu);
  }
  return {
    versie: PROFIEL_VERSIE,
    id: `p_${nu.toString(36)}`,
    naam: naam.trim() || 'Slimvos',
    avatar,
    groep,
    xp: 0,
    munten: 0,
    streak: { dagen: 0, laatsteDag: '', langste: 0 },
    beheersing,
    badges: [],
    bezit: [avatar],
    dagdoel: 20,
    vandaag: { datum: dagSleutel(new Date(nu)), vragen: 0, goed: 0, xp: 0, minuten: 0, buitenGratisVak: 0 },
    geschiedenis: [],
    ouderPincode: null,
    aangemaakt: nu,
  };
}

/** Zorgt dat een onderwerp een beheersing heeft, ook na een groepswissel. */
export function metBeheersing(profiel: Profiel, onderwerpId: string, nu = Date.now()): Beheersing {
  const bestaand = profiel.beheersing[onderwerpId];
  if (bestaand) return bestaand;
  const onderwerp = vindOnderwerp(onderwerpId);
  return nieuweBeheersing(onderwerpId, onderwerp ? startNiveau(onderwerp, profiel.groep) : 1, nu);
}

export function huidigNiveau(profiel: Profiel, onderwerpId: string): number {
  return metBeheersing(profiel, onderwerpId).niveau;
}

/**
 * Verwerkt een afgeronde ronde in het profiel: beheersing, XP, munten, streak
 * en de dagteller. Puur — geeft een nieuw profiel terug.
 */
export function verwerkRonde(profiel: Profiel, sessie: Sessie, nu = Date.now()): Profiel {
  const uitkomst = resultaat(sessie, nu);
  const vraagPerId = new Map(sessie.vragen.map((v) => [v.id, v]));

  let beheersing = metBeheersing(profiel, sessie.onderwerpId, nu);
  const niveauVoor = beheersing.niveau;
  let xp = 0;
  for (const antwoord of sessie.antwoorden) {
    const vraag = vraagPerId.get(antwoord.vraagId);
    xp += xpVoorAntwoord(antwoord.goed, vraag?.niveau ?? beheersing.niveau, antwoord.duurMs);
    beheersing = naAntwoord(beheersing, antwoord.goed, nu);
  }
  if (uitkomst.aantal > 0 && uitkomst.goed === uitkomst.aantal) xp += XP_RONDE_PERFECT;
  const munten = muntenVoorRonde(uitkomst.goed, uitkomst.aantal);

  const vandaagSleutel = dagSleutel(new Date(nu));
  const vandaag: DagTeller =
    profiel.vandaag.datum === vandaagSleutel
      ? { ...profiel.vandaag }
      : { datum: vandaagSleutel, vragen: 0, goed: 0, xp: 0, minuten: 0, buitenGratisVak: 0 };
  vandaag.vragen += uitkomst.aantal;
  vandaag.goed += uitkomst.goed;
  vandaag.xp += xp;
  vandaag.minuten += Math.round(uitkomst.duurMs / 60000);
  if (vindOnderwerp(sessie.onderwerpId)?.vak !== GRATIS_VAK) {
    vandaag.buitenGratisVak += uitkomst.aantal;
  }

  const log: RondeLog = {
    onderwerpId: sessie.onderwerpId,
    tijd: nu,
    aantal: uitkomst.aantal,
    goed: uitkomst.goed,
    xp,
    niveauVoor,
    niveauNa: beheersing.niveau,
    duurMs: uitkomst.duurMs,
  };

  return {
    ...profiel,
    xp: profiel.xp + xp,
    munten: profiel.munten + munten,
    streak: uitkomst.aantal > 0 ? werkStreakBij(profiel.streak, vandaagSleutel) : profiel.streak,
    beheersing: { ...profiel.beheersing, [sessie.onderwerpId]: beheersing },
    vandaag,
    geschiedenis: [log, ...profiel.geschiedenis].slice(0, 100),
  };
}

export function level(profiel: Profiel): number {
  return levelVoorXp(profiel.xp);
}

/** Migreert een opgeslagen profiel naar de huidige versie. */
export function migreerProfiel(ruw: unknown): Profiel | null {
  if (!ruw || typeof ruw !== 'object') return null;
  const p = ruw as Partial<Profiel>;
  if (typeof p.naam !== 'string' || typeof p.groep !== 'number') return null;
  const basis = nieuwProfiel(p.naam, p.groep as Groep, p.avatar ?? AVATARS[0], p.aangemaakt ?? Date.now());
  return {
    ...basis,
    ...p,
    versie: PROFIEL_VERSIE,
    beheersing: { ...basis.beheersing, ...(p.beheersing ?? {}) },
    streak: { dagen: 0, laatsteDag: '', langste: 0, ...(p.streak ?? {}) },
    vandaag: { ...basis.vandaag, ...(p.vandaag ?? {}) },
    badges: p.badges ?? [],
    bezit: p.bezit ?? basis.bezit,
    geschiedenis: p.geschiedenis ?? [],
  };
}
