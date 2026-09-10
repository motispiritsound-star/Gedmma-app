// Badges: elk met een test op de voortgang. Zo staat de regel op één plek.

import { opSleutel } from './hulp.js';

export const BADGES = [
  { id: 'eerste-stap', naam: 'Eerste stap', emoji: '🌱',
    uitleg: 'Je eerste oefening af.', test: (v) => v.totaalGoed >= 1 },
  { id: 'tien-goed', naam: 'Tien op een rij', emoji: '🎯',
    uitleg: '10 antwoorden goed.', test: (v) => v.totaalGoed >= 10 },
  { id: 'honderd-goed', naam: 'Honderd sterren', emoji: '💯',
    uitleg: '100 antwoorden goed.', test: (v) => v.totaalGoed >= 100 },
  { id: 'alfabet-kenner', naam: 'Alfabetkenner', emoji: '🔤',
    uitleg: 'Alle 28 letters minstens één keer goed.', test: (v) => v.lettersGoed >= 28 },
  { id: 'harakat-held', naam: 'Harakat-held', emoji: '✨',
    uitleg: 'Les 4 (de harakat) afgerond.', test: (v) => v.lessenAf.includes('harakat') },
  { id: 'lezer', naam: 'Ik kan lezen', emoji: '📖',
    uitleg: 'Les 10 afgerond: alles door elkaar.', test: (v) => v.lessenAf.includes('alles-samen') },
  { id: 'eerste-soera', naam: 'Eerste soera', emoji: '🕌',
    uitleg: 'Je eerste soera helemaal uit je hoofd.', test: (v) => v.soerasAf.length >= 1 },
  { id: 'drie-soeras', naam: 'Drie soera\'s', emoji: '📗',
    uitleg: 'Drie soera\'s uit je hoofd.', test: (v) => v.soerasAf.length >= 3 },
  { id: 'hele-djoez', naam: 'Alle soera\'s', emoji: '🏆',
    uitleg: 'Alle soera\'s in de app uit je hoofd.', test: (v) => v.soerasAf.length >= 12 },
  { id: 'week-vol', naam: 'Zeven dagen', emoji: '🔥',
    uitleg: 'Zeven dagen achter elkaar geoefend.', test: (v) => v.langsteReeks >= 7 },
  { id: 'maand-vol', naam: 'Dertig dagen', emoji: '🌟',
    uitleg: 'Dertig dagen achter elkaar geoefend.', test: (v) => v.langsteReeks >= 30 },
  { id: 'woordenschat', naam: 'Woordenkoning', emoji: '🗝️',
    uitleg: '50 Arabische woorden geleerd.', test: (v) => v.woordenGoed >= 50 },
  { id: 'foutloos', naam: 'Foutloos', emoji: '🎖️',
    uitleg: 'Een hele les zonder één fout.', test: (v) => v.foutlozeLessen >= 1 },
];

export const BADGE_OP_ID = opSleutel(BADGES);
