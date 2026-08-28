// Harakat (klinkertekens) en de klanken die ze maken.
// De Unicode-tekens staan er expliciet bij zodat je ze nergens hoeft te raden.

export const FATHA = 'َ';      // َ
export const KASRA = 'ِ';      // ِ
export const DAMMA = 'ُ';      // ُ
export const FATHATAYN = 'ً';  // ً
export const KASRATAYN = 'ٍ';  // ٍ
export const DAMMATAYN = 'ٌ';  // ٌ
export const SOEKOEN = 'ْ';    // ْ
export const SJADDA = 'ّ';     // ّ

export const HARAKAT = [
  { id: 'fatha', teken: FATHA, naam: 'fatha', naamAr: 'فَتْحَة', klank: 'a',
    uitleg: 'Een streepje bóven de letter. Je zegt "a", zoals in "bak".',
    ezelsbrug: 'Fatha ligt plat op het dak: a.' },
  { id: 'kasra', teken: KASRA, naam: 'kasra', naamAr: 'كَسْرَة', klank: 'i',
    uitleg: 'Een streepje ónder de letter. Je zegt "i", zoals in "kip".',
    ezelsbrug: 'Kasra zakt naar de kelder: i.' },
  { id: 'damma', teken: DAMMA, naam: 'damma', naamAr: 'ضَمَّة', klank: 'oe',
    uitleg: 'Een klein krulletje boven de letter. Je zegt "oe", zoals in "boek".',
    ezelsbrug: 'Damma is een krul, je lippen worden rond: oe.' },
];

export const TANWEEN = [
  { id: 'fathatayn', teken: FATHATAYN, naam: 'fathatain', klank: 'an', basis: 'fatha',
    uitleg: 'Twee streepjes boven: je hoort een "n" achter de a.' },
  { id: 'kasratayn', teken: KASRATAYN, naam: 'kasratain', klank: 'in', basis: 'kasra',
    uitleg: 'Twee streepjes onder: je hoort een "n" achter de i.' },
  { id: 'dammatayn', teken: DAMMATAYN, naam: 'dammatain', klank: 'oen', basis: 'damma',
    uitleg: 'Dubbele krul boven: je hoort een "n" achter de oe.' },
];

export const OVERIG = [
  { id: 'soekoen', teken: SOEKOEN, naam: 'soekoen', naamAr: 'سُكُون', klank: '(stop)',
    uitleg: 'Een rondje boven de letter: deze letter krijgt géén klinker. Je plakt hem tegen de letter ervoor.' },
  { id: 'sjadda', teken: SJADDA, naam: 'sjadda', naamAr: 'شَدَّة', klank: '(dubbel)',
    uitleg: 'Een klein "w"tje boven de letter: je spreekt de letter twee keer uit, met een klein duwtje.' },
];

/** De drie madd-letters: ze rekken de klinker ervóór op tot twee tellen. */
export const MADD = [
  { id: 'madd-a', na: 'fatha', letter: 'ا', naam: 'alif na fatha', klank: 'aa' },
  { id: 'madd-i', na: 'kasra', letter: 'ي', naam: 'ya na kasra', klank: 'ie' },
  { id: 'madd-oe', na: 'damma', letter: 'و', naam: 'waw na damma', klank: 'oe (lang)' },
];

/** Leen: waw of ya met soekoen ná een fatha — de "au"- en "ai"-klanken. */
export const LEEN = [
  { id: 'leen-au', letter: 'و', klank: 'au', voorbeeld: 'خَوْف' },
  { id: 'leen-ai', letter: 'ي', klank: 'ai', voorbeeld: 'خَيْر' },
];

const KLANK_OP_ID = Object.fromEntries(
  [...HARAKAT, ...TANWEEN, ...OVERIG].map((h) => [h.id, h]),
);

/** Plakt een haraka op een letter. Sjadda komt vóór de klinker te staan. */
export function metHaraka(letter, harakaId, { sjadda = false } = {}) {
  const h = KLANK_OP_ID[harakaId];
  if (!h) throw new Error(`Onbekende haraka: ${harakaId}`);
  return letter + (sjadda ? SJADDA : '') + h.teken;
}

/** Uitspraak in Nederlandse letters, bijv. ("b", "kasra") -> "bi". */
export function uitspraak(letterTranslit, harakaId, { sjadda = false, madd = false } = {}) {
  const h = KLANK_OP_ID[harakaId];
  if (!h) throw new Error(`Onbekende haraka: ${harakaId}`);
  const stam = sjadda ? letterTranslit + letterTranslit : letterTranslit;
  if (h.id === 'soekoen') return stam;
  let klank = h.klank;
  if (madd) klank = { a: 'aa', i: 'ie', oe: 'oew' }[klank] || klank;
  return stam + klank;
}
