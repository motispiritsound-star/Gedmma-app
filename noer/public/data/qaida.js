// De Qaida-lessen (opbouw van de Noeraniyah): van losse letter naar echt lezen.
// Elke les levert oefenitems { ar, tr } op — ar = wat het kind ziet,
// tr = de uitspraak in Nederlandse letters, voor de begeleider en de nakijkbeurt.

import { LETTERS, LETTER_OP_ID } from './letters.js';
import { metHaraka, uitspraak, SOEKOEN, SJADDA } from './harakat.js';

const rijen = (items, per = 6) => {
  const uit = [];
  for (let i = 0; i < items.length; i += per) uit.push(items.slice(i, i + per));
  return uit;
};

// --- Les 1: losse letters -------------------------------------------------
const losseLetters = LETTERS.map((l) => ({ ar: l.letter, tr: l.naam, letterId: l.id }));

// --- Les 2: verbonden letters --------------------------------------------
// Groepjes die dezelfde romp delen, zodat het verschil in stippen opvalt.
const VERBIND_GROEPEN = [
  ['ba', 'ta', 'tha'], ['jim', 'ha', 'kha'], ['dal', 'dhal'], ['ra', 'zay'],
  ['sin', 'shin'], ['sad', 'dad'], ['taa', 'zaa'], ['ayn', 'ghayn'],
  ['fa', 'qaf'], ['kaf', 'lam'], ['mim', 'nun'], ['haa', 'waw', 'ya'],
];
const verbondenLetters = VERBIND_GROEPEN.map((groep) => {
  const ls = groep.map((id) => LETTER_OP_ID[id]);
  return {
    ar: ls.map((l) => l.letter).join(''),
    tr: ls.map((l) => l.naam).join('-'),
    letterIds: groep,
  };
});

// --- Les 3: de losse letters aan het begin van soera's --------------------
const MOEQATTAAT = [
  { ar: 'الم', tr: 'alif-laam-miem' }, { ar: 'المص', tr: 'alif-laam-miem-saad' },
  { ar: 'الر', tr: 'alif-laam-ra' }, { ar: 'المر', tr: 'alif-laam-miem-ra' },
  { ar: 'كهيعص', tr: 'kaaf-ha-ya-ain-saad' }, { ar: 'طه', tr: 'taa-ha' },
  { ar: 'طسم', tr: 'taa-sien-miem' }, { ar: 'طس', tr: 'taa-sien' },
  { ar: 'يس', tr: 'ya-sien' }, { ar: 'ص', tr: 'saad' },
  { ar: 'حم', tr: 'haa-miem' }, { ar: 'حمعسق', tr: 'haa-miem-ain-sien-qaaf' },
  { ar: 'ق', tr: 'qaaf' }, { ar: 'ن', tr: 'noen' },
];

// --- Les 4 t/m 10: gegenereerd uit letters + tekens -----------------------
const alleLetters = LETTERS.filter((l) => l.id !== 'alif');

const metTeken = (harakaId, opties = {}) =>
  alleLetters.map((l) => ({
    ar: metHaraka(l.letter, harakaId, opties),
    tr: uitspraak(l.translit, harakaId, opties),
    letterId: l.id,
  }));

const harakaItems = ['fatha', 'kasra', 'damma'].flatMap((h) => metTeken(h));
const tanweenItems = ['fathatayn', 'kasratayn', 'dammatayn'].flatMap((h) => metTeken(h));
const sjaddaItems = ['fatha', 'kasra', 'damma'].flatMap((h) => metTeken(h, { sjadda: true }));

// Madd: letter + klinker + de bijpassende madd-letter (aa / ie / oe).
const maddItems = alleLetters.flatMap((l) => [
  { ar: metHaraka(l.letter, 'fatha') + 'ا', tr: l.translit + 'aa', letterId: l.id },
  { ar: metHaraka(l.letter, 'kasra') + 'ي', tr: l.translit + 'ie', letterId: l.id },
  { ar: metHaraka(l.letter, 'damma') + 'و', tr: l.translit + 'oe', letterId: l.id },
]);

// Leen: fatha + waw/ya met soekoen -> "au" en "ai".
const leenItems = alleLetters.flatMap((l) => [
  { ar: metHaraka(l.letter, 'fatha') + 'و' + SOEKOEN, tr: l.translit + 'au', letterId: l.id },
  { ar: metHaraka(l.letter, 'fatha') + 'ي' + SOEKOEN, tr: l.translit + 'ai', letterId: l.id },
]);

// Soekoen: eerst een letter met klinker, dan een letter zonder — samen één hapje.
const SLUITERS = ['ba', 'dal', 'sin', 'mim', 'nun', 'lam', 'ra', 'fa'];
const soekoenItems = alleLetters.flatMap((l) =>
  SLUITERS.filter((id) => id !== l.id).slice(0, 2).map((id) => {
    const s = LETTER_OP_ID[id];
    return {
      ar: metHaraka(l.letter, 'fatha') + s.letter + SOEKOEN,
      tr: l.translit + 'a' + s.translit,
      letterId: l.id,
    };
  }),
);

export const LESSEN = [
  {
    nr: 1, id: 'losse-letters', titel: 'De losse letters',
    ondertitel: 'Alle 28 letters, één voor één',
    uitleg: 'Dit zijn alle letters van het Arabische alfabet, los van elkaar. Luister goed en zeg ze hardop na.',
    spel: 'klankjacht', rijen: rijen(losseLetters),
  },
  {
    nr: 2, id: 'verbonden-letters', titel: 'Letters die op elkaar lijken',
    ondertitel: 'Zelfde vorm, andere stippen',
    uitleg: 'Sommige letters hebben dezelfde romp en verschillen alleen in hun stippen. Kijk goed waar de stippen staan: boven, onder, één, twee of drie.',
    spel: 'vormenpuzzel', rijen: rijen(verbondenLetters, 4),
  },
  {
    nr: 3, id: 'moeqattaat', titel: 'Letters aan het begin van soera\'s',
    ondertitel: 'Alif-laam-miem en de rest',
    uitleg: 'Aan het begin van sommige soera\'s staan losse letters. Je leest ze niet als woord, maar je noemt de letters bij hun naam.',
    spel: 'klankjacht', rijen: rijen(MOEQATTAAT, 4),
  },
  {
    nr: 4, id: 'harakat', titel: 'De harakat',
    ondertitel: 'Fatha, kasra en damma',
    uitleg: 'De klinkers staan als kleine tekentjes boven of onder de letter. Streepje boven is "a", streepje onder is "i", krulletje boven is "oe".',
    spel: 'leesladder', rijen: rijen(harakaItems),
  },
  {
    nr: 5, id: 'tanween', titel: 'Tanween',
    ondertitel: 'Dubbel teken, klank met een n',
    uitleg: 'Staat het teken dubbel, dan hoor je er een "n" achteraan: an, in, oen. Je ziet het vooral aan het einde van een woord.',
    spel: 'leesladder', rijen: rijen(tanweenItems),
  },
  {
    nr: 6, id: 'madd', titel: 'Madd: rek de klank',
    ondertitel: 'Alif, waw en ya maken lang',
    uitleg: 'Komt er een alif na een fatha, een ya na een kasra of een waw na een damma? Dan rek je de klank uit: twee tellen lang.',
    spel: 'leesladder', rijen: rijen(maddItems),
  },
  {
    nr: 7, id: 'leen', titel: 'Leen: au en ai',
    ondertitel: 'Zachte tweeklanken',
    uitleg: 'Een waw of ya met een soekoen ná een fatha wordt zacht: "au" en "ai". Denk aan خَوْف (angst) en خَيْر (goedheid).',
    spel: 'leesladder', rijen: rijen(leenItems),
  },
  {
    nr: 8, id: 'soekoen', titel: 'Soekoen: even stoppen',
    ondertitel: 'Een letter zonder klinker',
    uitleg: 'Een rondje boven de letter betekent: geen klinker. Je plakt die letter vast aan de letter ervóór, in één hapje.',
    spel: 'koppelen', rijen: rijen(soekoenItems),
  },
  {
    nr: 9, id: 'sjadda', titel: 'Sjadda: dubbel zo sterk',
    ondertitel: 'Eén letter, twee keer',
    uitleg: 'Het "w"tje boven de letter betekent: spreek hem twee keer uit. Eerst met een soekoen, dan met de klinker. Geef er een klein duwtje bij.',
    spel: 'leesladder', rijen: rijen(sjaddaItems),
  },
  {
    nr: 10, id: 'alles-samen', titel: 'Alles door elkaar',
    ondertitel: 'Lezen zoals in de Koran',
    uitleg: 'Nu komt alles samen: harakat, madd, soekoen en sjadda in echte woorden. Lees rustig, letter voor letter.',
    spel: 'leesladder',
    rijen: rijen([
      { ar: 'بِسْمِ', tr: 'bismi' }, { ar: 'رَبِّ', tr: 'rabbi' }, { ar: 'ٱلْحَمْدُ', tr: 'al-hamdoe' },
      { ar: 'نَسْتَعِينُ', tr: 'nastaʿienoe' }, { ar: 'ٱلنَّاسِ', tr: 'an-naasi' }, { ar: 'قُلْ', tr: 'qoel' },
      { ar: 'أَحَدٌ', tr: 'ahadoen' }, { ar: 'ٱلصَّمَدُ', tr: 'as-samadoe' }, { ar: 'يُولَدْ', tr: 'joelad' },
      { ar: 'خَلَقَ', tr: 'chalaqa' }, { ar: 'ٱلْفَلَقِ', tr: 'al-falaqi' }, { ar: 'حَاسِدٍ', tr: 'haasidin' },
      { ar: 'ٱلْكَوْثَرَ', tr: 'al-kauthara' }, { ar: 'فَصَلِّ', tr: 'fasalli' }, { ar: 'وَٱنْحَرْ', tr: 'wa-nhar' },
      { ar: 'يَتِيمَ', tr: 'jatiema' }, { ar: 'مِسْكِينِ', tr: 'miskiene' }, { ar: 'ٱلدِّينِ', tr: 'ad-diene' },
    ]),
  },
];

export const LES_OP_ID = Object.fromEntries(LESSEN.map((l) => [l.id, l]));

/** Alle oefenitems van een les, plat. */
export function itemsVan(les) {
  return les.rijen.flat();
}
