/**
 * Eén set kleuren en maten voor de hele app. Grote raakvlakken (minimaal 56px)
 * en veel contrast, zodat ook jonge kinderen en kinderen met dyslexie of een
 * motorische beperking de app goed kunnen bedienen.
 */
export const kleur = {
  achtergrond: '#FFFDF7',
  kaart: '#FFFFFF',
  rand: '#E8E2D5',
  tekst: '#1F2933',
  tekstZacht: '#6B7280',
  primair: '#4F46E5',
  primairZacht: '#EEF2FF',
  goed: '#16A34A',
  goedZacht: '#DCFCE7',
  fout: '#DC2626',
  foutZacht: '#FEE2E2',
  goud: '#F59E0B',
  goudZacht: '#FEF3C7',
  streak: '#F97316',
} as const;

export const ruimte = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

export const radius = { s: 8, m: 14, l: 22, rond: 999 } as const;

export const tekst = {
  titel: { fontSize: 30, fontWeight: '800' as const, color: kleur.tekst },
  kop: { fontSize: 22, fontWeight: '700' as const, color: kleur.tekst },
  subkop: { fontSize: 18, fontWeight: '700' as const, color: kleur.tekst },
  body: { fontSize: 17, lineHeight: 25, color: kleur.tekst },
  zacht: { fontSize: 15, color: kleur.tekstZacht },
  klein: { fontSize: 13, color: kleur.tekstZacht },
} as const;

/** Minimale hoogte van iets waar je op tikt. */
export const RAAKVLAK = 56;

export const schaduw = {
  shadowColor: '#1F2933',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
