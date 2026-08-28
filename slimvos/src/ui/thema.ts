import type { TextStyle } from 'react-native';

/**
 * Eén bron voor kleur, ruimte, vorm en type. Schermen halen hier alles uit en
 * schrijven zelf nooit een losse kleurcode op.
 *
 * Uitgangspunten:
 * - Warme, zachte grond (papier) met heldere accenten per vak, zodat een kind
 *   aan de kleur ziet waar het is.
 * - Alles waar je op tikt is minstens 56 punten hoog.
 * - Contrast van tekst op de eigen ondergrond haalt minimaal 4,5:1.
 */

const oranje = {
  50: '#FFF4EC',
  100: '#FFE3CE',
  300: '#FFB07A',
  500: '#F4783C',
  600: '#E2601F',
  700: '#B84A14',
} as const;

const inkt = {
  0: '#FFFFFF',
  50: '#FBF8F2',
  100: '#F3EDE1',
  200: '#E4DACA',
  300: '#CBBFAB',
  500: '#8A7F6E',
  700: '#4A4338',
  900: '#241F18',
} as const;

export const kleur = {
  /** De grond waar alles op ligt. */
  grond: inkt[50],
  grondDiep: inkt[100],
  kaart: inkt[0],
  rand: inkt[200],
  randZacht: inkt[100],

  tekst: inkt[900],
  tekstZacht: inkt[500],
  tekstOpKleur: '#FFFFFF',

  merk: oranje[500],
  merkDonker: oranje[600],
  merkDieper: oranje[700],
  merkZacht: oranje[50],
  merkRand: oranje[100],

  goed: '#1E9E5A',
  goedZacht: '#E4F7EC',
  goedRand: '#A8E3C2',
  fout: '#D93A3A',
  foutZacht: '#FDEBEB',
  foutRand: '#F5BDBD',
  goud: '#E9A100',
  goudZacht: '#FFF5DA',
  goudRand: '#F6DFA0',
  slot: '#7C5CD6',
  slotZacht: '#F1ECFD',
} as const;

/** Elk vak heeft een eigen kleurpaar; de gradient vult de vakkaarten. */
export const vakKleur: Record<string, { van: string; tot: string; zacht: string; op: string }> = {
  rekenen: { van: '#3D7DF6', tot: '#5AA7FF', zacht: '#E8F1FE', op: '#FFFFFF' },
  taal: { van: '#E0489B', tot: '#FF77BC', zacht: '#FDEAF4', op: '#FFFFFF' },
  lezen: { van: '#E08C15', tot: '#FFB648', zacht: '#FEF3E0', op: '#FFFFFF' },
  engels: { van: '#12A17A', tot: '#3ED1A5', zacht: '#E4F7F1', op: '#FFFFFF' },
  wereld: { van: '#7C5CD6', tot: '#A98CF3', zacht: '#F1ECFD', op: '#FFFFFF' },
  studie: { van: '#C2410C', tot: '#F0813F', zacht: '#FDEDE3', op: '#FFFFFF' },
};

export function kleurVoorVak(vak: string) {
  return vakKleur[vak] ?? { van: kleur.merk, tot: oranje[300], zacht: kleur.merkZacht, op: '#FFFFFF' };
}

export const ruimte = { xxs: 2, xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { s: 10, m: 16, l: 24, xl: 32, rond: 999 } as const;

/** Namen van de geladen lettertypen. Zie src/ui/fonts.ts. */
export const font = {
  displayBold: 'Baloo2_800ExtraBold',
  display: 'Baloo2_700Bold',
  displayMedium: 'Baloo2_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodySemi: 'Nunito_600SemiBold',
  body: 'Nunito_400Regular',
} as const;

/**
 * Eén typeschaal voor de hele app. Baloo 2 is de rondere, vriendelijke
 * displayfont voor koppen en knoppen; Nunito draagt de lopende tekst omdat die
 * op kleine formaten beter leesbaar blijft.
 */
export const tekst = {
  mega: { fontFamily: font.displayBold, fontSize: 40, lineHeight: 46, color: kleur.tekst },
  titel: { fontFamily: font.displayBold, fontSize: 30, lineHeight: 36, color: kleur.tekst },
  kop: { fontFamily: font.display, fontSize: 23, lineHeight: 29, color: kleur.tekst },
  subkop: { fontFamily: font.display, fontSize: 18, lineHeight: 24, color: kleur.tekst },
  vraag: { fontFamily: font.displayMedium, fontSize: 25, lineHeight: 33, color: kleur.tekst },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 25, color: kleur.tekst },
  bodyVet: { fontFamily: font.bodySemi, fontSize: 16, lineHeight: 25, color: kleur.tekst },
  zacht: { fontFamily: font.body, fontSize: 14, lineHeight: 21, color: kleur.tekstZacht },
  klein: { fontFamily: font.body, fontSize: 12.5, lineHeight: 18, color: kleur.tekstZacht },
  label: {
    fontFamily: font.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase' as const,
    color: kleur.tekstZacht,
  },
  cijfer: { fontFamily: font.displayBold, fontSize: 26, color: kleur.tekst },
} as const;

/** Cijfers die in kolommen onder elkaar moeten uitlijnen. */
export const tabelCijfers: TextStyle = { fontVariant: ['tabular-nums'] };

export const RAAKVLAK = 56;

export const schaduw = {
  klein: {
    shadowColor: '#3B3020',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  midden: {
    shadowColor: '#3B3020',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  groot: {
    shadowColor: '#3B3020',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;

/** Duur van bewegingen, op één plek zodat de app consistent aanvoelt. */
export const duur = { snel: 140, normaal: 240, traag: 420, viering: 900 } as const;
