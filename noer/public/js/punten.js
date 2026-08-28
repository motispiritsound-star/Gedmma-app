// Punten, niveaus en badges. Eén plek voor alle beloningsregels.

import { BADGES } from '../data/badges.js';
import { voortgang, pasAan } from './opslag.js';

export const XP = {
  goedAntwoord: 10,
  foutAntwoord: 0,
  lesAf: 50,
  perfecteLes: 25,
  ayaGeleerd: 20,
  soeraAf: 100,
  nieuweDag: 15,
};

export const NIVEAUS = [
  { naam: 'Zaadje', emoji: '🌱' },
  { naam: 'Scheutje', emoji: '🌿' },
  { naam: 'Ontdekker', emoji: '🔍' },
  { naam: 'Letterkenner', emoji: '🔤' },
  { naam: 'Beginnend lezer', emoji: '📄' },
  { naam: 'Lezer', emoji: '📖' },
  { naam: 'Doorzetter', emoji: '💪' },
  { naam: 'Kenner', emoji: '🧭' },
  { naam: 'Meester', emoji: '🏅' },
  { naam: 'Ster van Noer', emoji: '🌟' },
];

const PER_NIVEAU = 250;

export function niveauVan(xp) {
  const index = Math.min(NIVEAUS.length - 1, Math.floor(xp / PER_NIVEAU));
  const begin = index * PER_NIVEAU;
  const eind = (index + 1) * PER_NIVEAU;
  const laatste = index === NIVEAUS.length - 1;
  return {
    nr: index + 1,
    ...NIVEAUS[index],
    xpInNiveau: xp - begin,
    xpNodig: laatste ? 0 : eind - begin,
    deel: laatste ? 1 : (xp - begin) / (eind - begin),
    max: laatste,
  };
}

/** Telt XP op. Geeft terug of er een niveau bij kwam. */
export function geefXp(punten) {
  let voor = 0;
  let na = 0;
  pasAan((v) => {
    voor = niveauVan(v.xp).nr;
    v.xp += punten;
    na = niveauVan(v.xp).nr;
  });
  return na > voor;
}

/** Vat de voortgang samen in de getallen waar badges op testen. */
export function samenvatting(v = voortgang()) {
  const dagen = Object.values(v.dagen);
  return {
    totaalGoed: dagen.reduce((n, d) => n + (d.goed || 0), 0),
    totaalFout: dagen.reduce((n, d) => n + (d.fout || 0), 0),
    totaalSeconden: dagen.reduce((n, d) => n + (d.seconden || 0), 0),
    lettersGoed: Object.values(v.letters).filter((l) => l.goed > 0).length,
    lessenAf: Object.entries(v.lessen).filter(([, l]) => l.af).map(([id]) => id),
    soerasAf: Object.entries(v.soeras).filter(([, s]) => s.af).map(([id]) => id),
    woordenGoed: Object.values(v.themas).reduce((n, t) => n + (t.gekend?.length || 0), 0),
    langsteReeks: v.reeks.langste,
    huidigeReeks: v.reeks.huidig,
    foutlozeLessen: v.foutlozeLessen,
  };
}

/** Kijkt welke badges er nieuw bij zijn en bewaart ze. Geeft de nieuwe terug. */
export function nieuweBadges() {
  const v = voortgang();
  const s = samenvatting(v);
  const verdiend = BADGES.filter((b) => !v.badges.includes(b.id) && b.test(s));
  if (verdiend.length) {
    pasAan((p) => { p.badges = [...p.badges, ...verdiend.map((b) => b.id)]; });
  }
  return verdiend;
}

/** Sterren voor een oefening: 3 = bijna foutloos. */
export function sterrenVoor(goed, fout) {
  const totaal = goed + fout;
  if (!totaal) return 0;
  const deel = goed / totaal;
  if (deel >= 0.95) return 3;
  if (deel >= 0.8) return 2;
  if (deel >= 0.6) return 1;
  return 0;
}

/** Letters waar dit kind het vaakst op struikelt. */
export function zwakkePunten(v = voortgang(), aantal = 5) {
  return Object.entries(v.letters)
    .map(([id, l]) => ({ id, ...l, deel: l.fout / Math.max(1, l.goed + l.fout) }))
    .filter((l) => l.fout >= 2 && l.deel >= 0.3)
    .sort((a, b) => b.deel - a.deel || b.fout - a.fout)
    .slice(0, aantal);
}
