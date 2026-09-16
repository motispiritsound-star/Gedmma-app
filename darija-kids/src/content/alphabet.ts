import type { Letter } from './types'

const L = (
  id: string, ar: string, name: string, tr: string, sound: string,
  initial: string, medial: string, final: string, exampleWordId?: string,
): Letter => ({ id, ar, name, tr, sound, forms: { initial, medial, final }, exampleWordId })

/**
 * The Arabic alphabet as it is used for Darija: the twenty-eight letters, and
 * nothing else.
 *
 * Moroccans do write پ, ڤ and ݣ for the p, v and g of loanwords, and they used
 * to be in here. They are out again: this is an alphabet course, and the
 * alphabet is twenty-eight letters. A child who meets ݣ in ݣناوة on a poster
 * has an alphabet to read it with; a child taught thirty-one has three extra
 * letters to unlearn.
 */
export const LETTERS: Letter[] = [
  L('alif', 'ا', 'alif', 'a', 'aa, zoals in “maan”', 'ا', 'ـا', 'ـا', 'ana'),
  L('ba', 'ب', 'ba', 'b', 'b van bal', 'بـ', 'ـبـ', 'ـب', 'bab'),
  L('ta', 'ت', 'ta', 't', 't van tas', 'تـ', 'ـتـ', 'ـت', 'tfah'),
  L('tha', 'ث', 'tha', 'th', 'th van het Engelse “think” — zeldzaam in Darija', 'ثـ', 'ـثـ', 'ـث'),
  L('jim', 'ج', 'jim', 'j', 'zj van “journaal”', 'جـ', 'ـجـ', 'ـج', 'jben'),
  L('ha', 'ح', 'ḥa', '7 / ḥ', 'een geblazen h, diep uit de keel', 'حـ', 'ـحـ', 'ـح', 'hut'),
  L('kha', 'خ', 'kha', 'kh', 'ch van “lachen”', 'خـ', 'ـخـ', 'ـخ', 'khobz'),
  L('dal', 'د', 'dal', 'd', 'd van dag', 'د', 'ـد', 'ـد', 'dar'),
  L('dhal', 'ذ', 'dhal', 'dh', 'zachte th, zoals Engels “this”', 'ذ', 'ـذ', 'ـذ'),
  L('ra', 'ر', 'ra', 'r', 'rollende r', 'ر', 'ـر', 'ـر', 'ras'),
  L('zay', 'ز', 'zay', 'z', 'z van zon', 'ز', 'ـز', 'ـز', 'zerbiya'),
  L('sin', 'س', 'sin', 's', 's van sok', 'سـ', 'ـسـ', 'ـس', 'sarut'),
  L('shin', 'ش', 'shin', 'sh', 'sj van “sjaal”', 'شـ', 'ـشـ', 'ـش', 'shems'),
  L('sad', 'ص', 'ṣad', 'ṣ', 'zware, donkere s', 'صـ', 'ـصـ', 'ـص', 'sghir'),
  L('dad', 'ض', 'ḍad', 'ḍ', 'zware d — het Arabisch heet “de taal van de dad”', 'ضـ', 'ـضـ', 'ـض', 'dou'),
  L('ta-emf', 'ط', 'ṭa', 'ṭ', 'zware t', 'طـ', 'ـطـ', 'ـط', 'tebla'),
  L('za-emf', 'ظ', 'ẓa', 'ẓ', 'zware z', 'ظـ', 'ـظـ', 'ـظ'),
  L('ayn', 'ع', 'ayn', '3', 'een knijp in de keel — de beroemdste klank van het Arabisch', 'عـ', 'ـعـ', 'ـع', 'afak'),
  L('ghayn', 'غ', 'ghayn', 'gh', 'brouwende g, zoals de Franse r', 'غـ', 'ـغـ', 'ـغ', 'ghali'),
  L('fa', 'ف', 'fa', 'f', 'f van fiets', 'فـ', 'ـفـ', 'ـف', 'flus'),
  L('qaf', 'ق', 'qaf', 'q / 9', 'k diep achter in de mond', 'قـ', 'ـقـ', 'ـق', 'qehwa'),
  L('kaf', 'ك', 'kaf', 'k', 'k van kat', 'كـ', 'ـكـ', 'ـك', 'ktab'),
  L('lam', 'ل', 'lam', 'l', 'l van lam', 'لـ', 'ـلـ', 'ـل', 'lma'),
  L('mim', 'م', 'mim', 'm', 'm van maan', 'مـ', 'ـمـ', 'ـم', 'mama'),
  L('nun', 'ن', 'nun', 'n', 'n van neus', 'نـ', 'ـنـ', 'ـن', 'nif'),
  L('ha-soft', 'ه', 'ha', 'h', 'gewone h', 'هـ', 'ـهـ', 'ـه', 'hnaya'),
  L('waw', 'و', 'waw', 'w / oe', 'w van water, of oe', 'و', 'ـو', 'ـو', 'wakha'),
  L('ya', 'ي', 'ya', 'y / ie', 'j van jas, of ie', 'يـ', 'ـيـ', 'ـي', 'yedd'),
]

const index = new Map(LETTERS.map((l) => [l.id, l]))

/** Throws on an unknown id: a lesson pointing at nothing is a content bug. */
export function letter(id: string): Letter {
  const found = index.get(id)
  if (!found) throw new Error(`Onbekende letter-id: ${id}`)
  return found
}

export const maybeLetter = (id: string) => index.get(id)

/**
 * The six letters that never connect to the letter after them.
 *
 * This is the first thing that makes Arabic writing click: a word can break in
 * the middle without being two words. Their "initial" and "medial" forms are
 * therefore the same shape as the isolated and final one.
 */
export const NON_CONNECTING = new Set(['alif', 'dal', 'dhal', 'ra', 'zay', 'waw'])

export const connects = (id: string): boolean => !NON_CONNECTING.has(id)

/**
 * The teaching order: letters grouped by the skeleton they share, the way
 * every Arabic reading course does it, because ب ت ث differ only in dots.
 */
export const LETTER_GROUPS: string[][] = [
  ['alif', 'ba', 'ta', 'tha'],
  ['jim', 'ha', 'kha', 'dal', 'dhal'],
  ['ra', 'zay', 'sin', 'shin'],
  ['sad', 'dad', 'ta-emf', 'za-emf'],
  ['ayn', 'ghayn', 'fa', 'qaf'],
  ['kaf', 'lam', 'mim', 'nun'],
  ['ha-soft', 'waw', 'ya'],
]
