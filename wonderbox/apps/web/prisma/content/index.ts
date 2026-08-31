import { electricAlarm } from './electric-alarm.ts';
import { natureDetective } from './nature-detective.ts';
import { spaceExplorer } from './space-explorer.ts';
import type { BoxSpec } from './types.ts';

export * from './types.ts';

/** The three boxes shipped with the MVP, in curriculum order. */
export const BOXES: readonly BoxSpec[] = [spaceExplorer, electricAlarm, natureDetective];

export const THEMES = [
  {
    slug: 'space',
    name: { nl: 'Ruimte', en: 'Space' },
    blurb: {
      nl: 'Raketten, planeten en de vraag waarom sterren niet vallen.',
      en: 'Rockets, planets and the question of why stars do not fall.',
    },
    colorToken: 'aurora',
    iconKey: 'rocket',
    sortOrder: 1,
  },
  {
    slug: 'practical-skills',
    name: { nl: 'Handige handen', en: 'Practical skills' },
    blurb: {
      nl: 'Bouwen, schroeven, solderen en dingen laten werken.',
      en: 'Building, screwing, wiring and making things work.',
    },
    colorToken: 'ember',
    iconKey: 'wrench',
    sortOrder: 2,
  },
  {
    slug: 'nature',
    name: { nl: 'Natuur', en: 'Nature' },
    blurb: {
      nl: 'Wat er groeit en kruipt vlak bij je voordeur.',
      en: 'What grows and crawls right outside your front door.',
    },
    colorToken: 'moss',
    iconKey: 'leaf',
    sortOrder: 3,
  },
  {
    slug: 'human-body',
    name: { nl: 'Het lichaam', en: 'The body' },
    blurb: {
      nl: 'Hart, longen, botten en waarom je moet niezen.',
      en: 'Heart, lungs, bones and why you sneeze.',
    },
    colorToken: 'coral',
    iconKey: 'heart',
    sortOrder: 4,
  },
  {
    slug: 'architecture',
    name: { nl: 'Bouwkunst', en: 'Architecture' },
    blurb: {
      nl: 'Waarom een brug blijft staan en een toren niet omvalt.',
      en: 'Why a bridge stays up and a tower does not topple.',
    },
    colorToken: 'stone',
    iconKey: 'bridge',
    sortOrder: 5,
  },
  {
    slug: 'history',
    name: { nl: 'Geschiedenis', en: 'History' },
    blurb: {
      nl: 'Hoe mensen vroeger leefden, en wat ze achterlieten.',
      en: 'How people lived long ago, and what they left behind.',
    },
    colorToken: 'amber',
    iconKey: 'scroll',
    sortOrder: 6,
  },
  {
    slug: 'science',
    name: { nl: 'Wetenschap', en: 'Science' },
    blurb: {
      nl: 'Proeven doen en zelf uitvinden hoe iets zit.',
      en: 'Running experiments and working out how something works.',
    },
    colorToken: 'indigo',
    iconKey: 'flask',
    sortOrder: 7,
  },
  {
    slug: 'creativity',
    name: { nl: 'Maken', en: 'Creativity' },
    blurb: {
      nl: 'Tekenen, knutselen, verhalen bedenken.',
      en: 'Drawing, making, inventing stories.',
    },
    colorToken: 'blossom',
    iconKey: 'palette',
    sortOrder: 8,
  },
] as const;
