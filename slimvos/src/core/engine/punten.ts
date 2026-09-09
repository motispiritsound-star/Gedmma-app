/** Punten, munten en het niveau (level) van het kind zelf. */

export const XP_PER_GOED = 10;
export const XP_PER_NIVEAU_BONUS = 2;
/** Onder deze tijd telt een antwoord als snel en levert het een bonus op. */
export const SNEL_MS = 6000;
export const XP_SNELBONUS = 3;
export const XP_RONDE_PERFECT = 25;

export function xpVoorAntwoord(goed: boolean, niveau: number, duurMs: number): number {
  if (!goed) return 0;
  const basis = XP_PER_GOED + niveau * XP_PER_NIVEAU_BONUS;
  return basis + (duurMs <= SNEL_MS ? XP_SNELBONUS : 0);
}

export function muntenVoorRonde(aantalGoed: number, totaal: number): number {
  const basis = aantalGoed;
  return basis + (totaal > 0 && aantalGoed === totaal ? 5 : 0);
}

/**
 * XP dat nodig is om level `n` te bereiken. De curve loopt op zodat de eerste
 * levels snel gaan (motiverend) en latere levels echt iets betekenen.
 */
export function xpVoorLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(50 * (level - 1) ** 1.5);
}

export function levelVoorXp(xp: number): number {
  let level = 1;
  while (xp >= xpVoorLevel(level + 1)) level += 1;
  return level;
}

export interface LevelVoortgang {
  level: number;
  huidigeXp: number;
  xpVoorVolgend: number;
  fractie: number;
}

export function levelVoortgang(xp: number): LevelVoortgang {
  const level = levelVoorXp(xp);
  const onder = xpVoorLevel(level);
  const boven = xpVoorLevel(level + 1);
  const bereik = Math.max(1, boven - onder);
  return {
    level,
    huidigeXp: xp - onder,
    xpVoorVolgend: boven - xp,
    fractie: Math.min(1, Math.max(0, (xp - onder) / bereik)),
  };
}

/** Datum als 'JJJJ-MM-DD' in de lokale tijdzone van het toestel. */
export function dagSleutel(datum = new Date()): string {
  const j = datum.getFullYear();
  const m = String(datum.getMonth() + 1).padStart(2, '0');
  const d = String(datum.getDate()).padStart(2, '0');
  return `${j}-${m}-${d}`;
}

function verschilInDagen(a: string, b: string): number {
  const [ja, ma, da] = a.split('-').map(Number);
  const [jb, mb, db] = b.split('-').map(Number);
  const msPerDag = 86400000;
  return Math.round((Date.UTC(jb, mb - 1, db) - Date.UTC(ja, ma - 1, da)) / msPerDag);
}

export interface Streak {
  dagen: number;
  laatsteDag: string;
  langste: number;
}

/**
 * Werkt de dagenreeks bij. Eén dag overslaan breekt de reeks nog niet
 * ("respijtdag"), pas vanaf twee dagen begin je opnieuw — dat scheelt het
 * schuldgevoel dat andere apps oproepen zonder de reeks betekenisloos te maken.
 */
export function werkStreakBij(streak: Streak, vandaag = dagSleutel()): Streak {
  if (streak.laatsteDag === vandaag) return streak;
  if (streak.laatsteDag === '') {
    return { dagen: 1, laatsteDag: vandaag, langste: Math.max(1, streak.langste) };
  }
  const gat = verschilInDagen(streak.laatsteDag, vandaag);
  const dagen = gat <= 2 ? streak.dagen + 1 : 1;
  return { dagen, laatsteDag: vandaag, langste: Math.max(streak.langste, dagen) };
}
