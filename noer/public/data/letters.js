// De 28 letters van het Arabische alfabet.
// vormen: los | begin | midden | eind. Zes letters verbinden niet naar links
// (ا د ذ ر ز و); daar zijn begin/midden gelijk aan los/eind.
// makhraj = uitspraakplaats, in kindertaal.

export const MAKHRAJ = {
  holte: { naam: 'Holte', kleur: '#7c9cf5', uitleg: 'De klank rekt door je mond naar buiten.' },
  keel: { naam: 'Keel', kleur: '#e0776a', uitleg: 'Diep achter in je keel.' },
  tong: { naam: 'Tong', kleur: '#5fb99a', uitleg: 'Je tong raakt je gehemelte of je tanden.' },
  lippen: { naam: 'Lippen', kleur: '#e5a44b', uitleg: 'Je lippen doen het werk.' },
};

export const LETTERS = [
  { id: 'alif', letter: 'ا', naam: 'alif', naamAr: 'أَلِف', translit: 'a', verbindt: false, makhraj: 'holte',
    vormen: { los: 'ا', begin: 'ا', midden: 'ـا', eind: 'ـا' },
    klank: 'Een lange aaa, zoals in "maan".',
    tip: 'Alif staat kaarsrecht als een stok. Hij pakt nooit de hand van de letter na hem.',
    voorbeeld: { woord: 'أَسَد', translit: 'asad', betekenis: 'leeuw', emoji: '🦁' } },

  { id: 'ba', letter: 'ب', naam: 'ba', naamAr: 'بَاء', translit: 'b', verbindt: true, makhraj: 'lippen',
    vormen: { los: 'ب', begin: 'بـ', midden: 'ـبـ', eind: 'ـب' },
    klank: 'B, zoals in "bal".',
    tip: 'Een bootje met één stip eronder.',
    voorbeeld: { woord: 'بَاب', translit: 'baab', betekenis: 'deur', emoji: '🚪' } },

  { id: 'ta', letter: 'ت', naam: 'ta', naamAr: 'تَاء', translit: 't', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ت', begin: 'تـ', midden: 'ـتـ', eind: 'ـت' },
    klank: 'T, zoals in "tas".',
    tip: 'Hetzelfde bootje, maar met twee stippen erbóven.',
    voorbeeld: { woord: 'تُفَّاح', translit: 'toeffaah', betekenis: 'appel', emoji: '🍎' } },

  { id: 'tha', letter: 'ث', naam: 'tha', naamAr: 'ثَاء', translit: 'th', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ث', begin: 'ثـ', midden: 'ـثـ', eind: 'ـث' },
    klank: 'Als de Engelse "th" in "think": tongpuntje tussen je tanden.',
    tip: 'Het bootje met drie stippen erboven, als een kroontje.',
    voorbeeld: { woord: 'ثَعْلَب', translit: 'thaʿlab', betekenis: 'vos', emoji: '🦊' } },

  { id: 'jim', letter: 'ج', naam: 'djim', naamAr: 'جِيم', translit: 'dj', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ج', begin: 'جـ', midden: 'ـجـ', eind: 'ـج' },
    klank: 'Dj, zoals in "jungle".',
    tip: 'Een schaaltje met een stip erin.',
    voorbeeld: { woord: 'جَمَل', translit: 'djamal', betekenis: 'kameel', emoji: '🐫' } },

  { id: 'ha', letter: 'ح', naam: 'haa', naamAr: 'حَاء', translit: 'ḥ', verbindt: true, makhraj: 'keel',
    vormen: { los: 'ح', begin: 'حـ', midden: 'ـحـ', eind: 'ـح' },
    klank: 'Een warme, ademende h — alsof je een brilletje wasemt.',
    tip: 'Hetzelfde schaaltje als djim, maar helemaal leeg.',
    voorbeeld: { woord: 'حِصَان', translit: 'hisaan', betekenis: 'paard', emoji: '🐴' } },

  { id: 'kha', letter: 'خ', naam: 'chaa', naamAr: 'خَاء', translit: 'ch', verbindt: true, makhraj: 'keel',
    vormen: { los: 'خ', begin: 'خـ', midden: 'ـخـ', eind: 'ـخ' },
    klank: 'De ch van "lachen", schrapend achter in je keel.',
    tip: 'Het schaaltje met een stip erbóven.',
    voorbeeld: { woord: 'خُبْز', translit: 'choebz', betekenis: 'brood', emoji: '🍞' } },

  { id: 'dal', letter: 'د', naam: 'dal', naamAr: 'دَال', translit: 'd', verbindt: false, makhraj: 'tong',
    vormen: { los: 'د', begin: 'د', midden: 'ـد', eind: 'ـد' },
    klank: 'D, zoals in "deur".',
    tip: 'Een haakje. Verbindt niet naar links.',
    voorbeeld: { woord: 'دَجَاجَة', translit: 'dadjaadja', betekenis: 'kip', emoji: '🐔' } },

  { id: 'dhal', letter: 'ذ', naam: 'dzal', naamAr: 'ذَال', translit: 'dh', verbindt: false, makhraj: 'tong',
    vormen: { los: 'ذ', begin: 'ذ', midden: 'ـذ', eind: 'ـذ' },
    klank: 'Als de Engelse "th" in "this": zacht, met trilling.',
    tip: 'Dal met een stip erop.',
    voorbeeld: { woord: 'ذَهَب', translit: 'dhahab', betekenis: 'goud', emoji: '🪙' } },

  { id: 'ra', letter: 'ر', naam: 'ra', naamAr: 'رَاء', translit: 'r', verbindt: false, makhraj: 'tong',
    vormen: { los: 'ر', begin: 'ر', midden: 'ـر', eind: 'ـر' },
    klank: 'Een rollende r, met je tongpunt.',
    tip: 'Een duikplankje dat onder de lijn doorzakt.',
    voorbeeld: { woord: 'رُمَّان', translit: 'roemmaan', betekenis: 'granaatappel', emoji: '🍎' } },

  { id: 'zay', letter: 'ز', naam: 'zay', naamAr: 'زَاي', translit: 'z', verbindt: false, makhraj: 'tong',
    vormen: { los: 'ز', begin: 'ز', midden: 'ـز', eind: 'ـز' },
    klank: 'Z, zoals in "zon".',
    tip: 'Ra met een stip erop.',
    voorbeeld: { woord: 'زَهْرَة', translit: 'zahra', betekenis: 'bloem', emoji: '🌸' } },

  { id: 'sin', letter: 'س', naam: 'sien', naamAr: 'سِين', translit: 's', verbindt: true, makhraj: 'tong',
    vormen: { los: 'س', begin: 'سـ', midden: 'ـسـ', eind: 'ـس' },
    klank: 'S, zoals in "sok".',
    tip: 'Drie tandjes en dan een schaaltje.',
    voorbeeld: { woord: 'سَمَك', translit: 'samak', betekenis: 'vis', emoji: '🐟' } },

  { id: 'shin', letter: 'ش', naam: 'sjien', naamAr: 'شِين', translit: 'sj', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ش', begin: 'شـ', midden: 'ـشـ', eind: 'ـش' },
    klank: 'Sj, zoals in "sjaal".',
    tip: 'Sien met drie stippen erboven.',
    voorbeeld: { woord: 'شَمْس', translit: 'sjams', betekenis: 'zon', emoji: '☀️' } },

  { id: 'sad', letter: 'ص', naam: 'saad', naamAr: 'صَاد', translit: 'ṣ', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ص', begin: 'صـ', midden: 'ـصـ', eind: 'ـص' },
    klank: 'Een dikke, zware s. Maak je mond rond en bol je tong.',
    tip: 'Een groot ei met een staartje.',
    voorbeeld: { woord: 'صَقْر', translit: 'saqr', betekenis: 'valk', emoji: '🦅' } },

  { id: 'dad', letter: 'ض', naam: 'daad', naamAr: 'ضَاد', translit: 'ḍ', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ض', begin: 'ضـ', midden: 'ـضـ', eind: 'ـض' },
    klank: 'Een dikke, zware d — de zijkant van je tong duwt tegen je kiezen.',
    tip: 'Saad met een stip. Arabisch heet ook wel "de taal van de daad".',
    voorbeeld: { woord: 'ضِفْدَع', translit: 'difdaʿ', betekenis: 'kikker', emoji: '🐸' } },

  { id: 'taa', letter: 'ط', naam: 'taa', naamAr: 'طَاء', translit: 'ṭ', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ط', begin: 'طـ', midden: 'ـطـ', eind: 'ـط' },
    klank: 'Een dikke, zware t.',
    tip: 'Een ei met een rechte mast erop.',
    voorbeeld: { woord: 'طَائِر', translit: 'taa-ir', betekenis: 'vogel', emoji: '🐦' } },

  { id: 'zaa', letter: 'ظ', naam: 'dzaa', naamAr: 'ظَاء', translit: 'ẓ', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ظ', begin: 'ظـ', midden: 'ـظـ', eind: 'ـظ' },
    klank: 'Een dikke, zware "dh" — als dzal, maar zwaar.',
    tip: 'Taa met een stip erboven.',
    voorbeeld: { woord: 'ظِلّ', translit: 'zill', betekenis: 'schaduw', emoji: '🌳' } },

  { id: 'ayn', letter: 'ع', naam: 'ain', naamAr: 'عَيْن', translit: 'ʿ', verbindt: true, makhraj: 'keel',
    vormen: { los: 'ع', begin: 'عـ', midden: 'ـعـ', eind: 'ـع' },
    klank: 'Knijp je keel even samen en laat de klank er dan uit.',
    tip: 'Deze klank bestaat niet in het Nederlands. Oefen hem hardop.',
    voorbeeld: { woord: 'عَيْن', translit: 'ain', betekenis: 'oog', emoji: '👁️' } },

  { id: 'ghayn', letter: 'غ', naam: 'ghain', naamAr: 'غَيْن', translit: 'gh', verbindt: true, makhraj: 'keel',
    vormen: { los: 'غ', begin: 'غـ', midden: 'ـغـ', eind: 'ـغ' },
    klank: 'Een gorgelende g, als de Franse r in "Paris".',
    tip: 'Ain met een stip erboven.',
    voorbeeld: { woord: 'غُرَاب', translit: 'ghoeraab', betekenis: 'kraai', emoji: '🐦‍⬛' } },

  { id: 'fa', letter: 'ف', naam: 'fa', naamAr: 'فَاء', translit: 'f', verbindt: true, makhraj: 'lippen',
    vormen: { los: 'ف', begin: 'فـ', midden: 'ـفـ', eind: 'ـف' },
    klank: 'F, zoals in "fiets".',
    tip: 'Een rondje met een stip erop en een staart.',
    voorbeeld: { woord: 'فِيل', translit: 'fiel', betekenis: 'olifant', emoji: '🐘' } },

  { id: 'qaf', letter: 'ق', naam: 'qaaf', naamAr: 'قَاف', translit: 'q', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ق', begin: 'قـ', midden: 'ـقـ', eind: 'ـق' },
    klank: 'Een k van diep achter in je mond, tegen je huig.',
    tip: 'Als fa, maar met twee stippen en een diepe kom.',
    voorbeeld: { woord: 'قَمَر', translit: 'qamar', betekenis: 'maan', emoji: '🌙' } },

  { id: 'kaf', letter: 'ك', naam: 'kaaf', naamAr: 'كَاف', translit: 'k', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ك', begin: 'كـ', midden: 'ـكـ', eind: 'ـك' },
    klank: 'K, zoals in "kat".',
    tip: 'Er zit een kleine hamza-achtige krul in verstopt.',
    voorbeeld: { woord: 'كِتَاب', translit: 'kitaab', betekenis: 'boek', emoji: '📖' } },

  { id: 'lam', letter: 'ل', naam: 'laam', naamAr: 'لَام', translit: 'l', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ل', begin: 'لـ', midden: 'ـلـ', eind: 'ـل' },
    klank: 'L, zoals in "lamp".',
    tip: 'Een lange haak. Met alif erna wordt het لا.',
    voorbeeld: { woord: 'لَيْمُون', translit: 'laimoen', betekenis: 'citroen', emoji: '🍋' } },

  { id: 'mim', letter: 'م', naam: 'miem', naamAr: 'مِيم', translit: 'm', verbindt: true, makhraj: 'lippen',
    vormen: { los: 'م', begin: 'مـ', midden: 'ـمـ', eind: 'ـم' },
    klank: 'M, zoals in "maan".',
    tip: 'Een rondje met een staartje naar beneden.',
    voorbeeld: { woord: 'مِفْتَاح', translit: 'miftaah', betekenis: 'sleutel', emoji: '🔑' } },

  { id: 'nun', letter: 'ن', naam: 'noen', naamAr: 'نُون', translit: 'n', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ن', begin: 'نـ', midden: 'ـنـ', eind: 'ـن' },
    klank: 'N, zoals in "neus". Er zit altijd wat neusklank in.',
    tip: 'Een diep schaaltje met één stip erboven.',
    voorbeeld: { woord: 'نَجْمَة', translit: 'nadjma', betekenis: 'ster', emoji: '⭐' } },

  { id: 'haa', letter: 'ه', naam: 'ha', naamAr: 'هَاء', translit: 'h', verbindt: true, makhraj: 'keel',
    vormen: { los: 'ه', begin: 'هـ', midden: 'ـهـ', eind: 'ـه' },
    klank: 'H, zoals in "huis" — lichter dan de haa (ح).',
    tip: 'Deze letter verandert het meest van vorm. Kijk goed.',
    voorbeeld: { woord: 'هِلَال', translit: 'hilaal', betekenis: 'halve maan', emoji: '🌙' } },

  { id: 'waw', letter: 'و', naam: 'waw', naamAr: 'وَاو', translit: 'w', verbindt: false, makhraj: 'lippen',
    vormen: { los: 'و', begin: 'و', midden: 'ـو', eind: 'ـو' },
    klank: 'W, zoals in "water". Met een soekoen wordt het "oe".',
    tip: 'Een lus met een staart. Verbindt niet naar links.',
    voorbeeld: { woord: 'وَرْدَة', translit: 'warda', betekenis: 'roos', emoji: '🌹' } },

  { id: 'ya', letter: 'ي', naam: 'ya', naamAr: 'يَاء', translit: 'y', verbindt: true, makhraj: 'tong',
    vormen: { los: 'ي', begin: 'يـ', midden: 'ـيـ', eind: 'ـي' },
    klank: 'J, zoals in "jas". Met een soekoen wordt het "ie".',
    tip: 'Twee stippen eronder — als een glimlach met ogen.',
    voorbeeld: { woord: 'يَد', translit: 'jad', betekenis: 'hand', emoji: '✋' } },
];

export const LETTER_OP_ID = Object.fromEntries(LETTERS.map((l) => [l.id, l]));

/** Letters die visueel makkelijk verward worden — handig als afleiders in spellen. */
export const VERWARPAREN = [
  ['ba', 'ta', 'tha'], ['jim', 'ha', 'kha'], ['dal', 'dhal'], ['ra', 'zay'],
  ['sin', 'shin'], ['sad', 'dad'], ['taa', 'zaa'], ['ayn', 'ghayn'],
  ['fa', 'qaf'], ['haa', 'mim'], ['waw', 'ra'], ['nun', 'ba'],
];

/** Geeft plausibele verkeerde antwoorden bij een letter: eerst lookalikes. */
export function afleiders(letterId, aantal = 3) {
  const gezien = new Set([letterId]);
  const uit = [];
  for (const groep of VERWARPAREN) {
    if (!groep.includes(letterId)) continue;
    for (const id of groep) {
      if (!gezien.has(id)) { gezien.add(id); uit.push(id); }
    }
  }
  const rest = LETTERS.map((l) => l.id).filter((id) => !gezien.has(id));
  while (uit.length < aantal && rest.length) {
    uit.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
  }
  return uit.slice(0, aantal);
}
