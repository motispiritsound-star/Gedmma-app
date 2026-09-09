import type { Profiel } from './profiel';
import { level } from './profiel';

export interface Badge {
  id: string;
  naam: string;
  emoji: string;
  omschrijving: string;
  /** Voortgang naar de badge toe, 0..1, zodat de app kan laten zien hoe ver je bent. */
  voortgang: (p: Profiel) => number;
}

const fractie = (waarde: number, doel: number) => Math.min(1, doel <= 0 ? 1 : waarde / doel);

const totaalGoed = (p: Profiel) => Object.values(p.beheersing).reduce((n, b) => n + b.goed, 0);
const totaalSterren = (p: Profiel) => Object.values(p.beheersing).reduce((n, b) => n + b.sterren, 0);
const vakkenGeoefend = (p: Profiel) =>
  new Set(
    Object.values(p.beheersing)
      .filter((b) => b.goed + b.fout > 0)
      .map((b) => b.onderwerpId.split('.')[0]),
  ).size;

export const BADGES: Badge[] = [
  { id: 'eerste-stap', naam: 'Eerste stap', emoji: '👟', omschrijving: 'Je eerste ronde afgerond', voortgang: (p) => fractie(p.geschiedenis.length, 1) },
  { id: 'tien-goed', naam: 'Tien op een rij', emoji: '🎯', omschrijving: '10 vragen goed beantwoord', voortgang: (p) => fractie(totaalGoed(p), 10) },
  { id: 'honderd-goed', naam: 'Honderdclub', emoji: '💯', omschrijving: '100 vragen goed beantwoord', voortgang: (p) => fractie(totaalGoed(p), 100) },
  { id: 'vijfhonderd-goed', naam: 'Kenner', emoji: '🧠', omschrijving: '500 vragen goed beantwoord', voortgang: (p) => fractie(totaalGoed(p), 500) },
  { id: 'streak-3', naam: 'Drie dagen', emoji: '🔥', omschrijving: '3 dagen op rij geoefend', voortgang: (p) => fractie(p.streak.langste, 3) },
  { id: 'streak-7', naam: 'Volle week', emoji: '📅', omschrijving: '7 dagen op rij geoefend', voortgang: (p) => fractie(p.streak.langste, 7) },
  { id: 'streak-30', naam: 'Doorzetter', emoji: '🏆', omschrijving: '30 dagen op rij geoefend', voortgang: (p) => fractie(p.streak.langste, 30) },
  { id: 'ster-1', naam: 'Eerste ster', emoji: '⭐', omschrijving: 'Je eerste ster verdiend', voortgang: (p) => fractie(totaalSterren(p), 1) },
  { id: 'ster-10', naam: 'Sterrenjager', emoji: '🌟', omschrijving: '10 sterren verzameld', voortgang: (p) => fractie(totaalSterren(p), 10) },
  { id: 'allrounder', naam: 'Allrounder', emoji: '🎨', omschrijving: 'In alle 5 de vakken geoefend', voortgang: (p) => fractie(vakkenGeoefend(p), 5) },
  { id: 'level-5', naam: 'Level 5', emoji: '🚀', omschrijving: 'Level 5 bereikt', voortgang: (p) => fractie(level(p), 5) },
  { id: 'level-15', naam: 'Level 15', emoji: '🛸', omschrijving: 'Level 15 bereikt', voortgang: (p) => fractie(level(p), 15) },
];

export function verdiendeBadges(p: Profiel): string[] {
  return BADGES.filter((b) => b.voortgang(p) >= 1).map((b) => b.id);
}

/** Geeft de badges terug die er bij deze update bij zijn gekomen. */
export function nieuweBadges(p: Profiel): string[] {
  const al = new Set(p.badges);
  return verdiendeBadges(p).filter((id) => !al.has(id));
}

export function metBadges(p: Profiel): Profiel {
  const verdiend = verdiendeBadges(p);
  return verdiend.length === p.badges.length ? p : { ...p, badges: verdiend };
}
