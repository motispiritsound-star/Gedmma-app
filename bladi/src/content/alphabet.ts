import type { Letter } from './types'

const L = (
  id: string, ar: string, name: string, tr: string, sound: string,
  initial: string, medial: string, final: string, exampleWordId?: string,
): Letter => ({ id, ar, name, tr, sound, forms: { initial, medial, final }, exampleWordId })

/**
 * The Arabic alphabet as it is used for Darija, plus the three extra letters
 * Moroccans invented for sounds Arabic does not have (p, v, g).
 */
export const LETTERS: Letter[] = [
  L('alif', 'ا', 'alif', 'a', 'aa, zoals in “maan”', 'ا', 'ـا', 'ـا', 'ana'),
  L('ba', 'ب', 'ba', 'b', 'b van bal', 'بـ', 'ـبـ', 'ـب', 'bab'),
  L('ta', 'ت', 'ta', 't', 't van tas', 'تـ', 'ـتـ', 'ـت', 'tfah'),
  L('tha', 'ث', 'tha', 'th', 'th van het Engelse “think” — zeldzaam in Darija', 'ثـ', 'ـثـ', 'ـث'),
  L('jim', 'ج', 'jim', 'j', 'zj van “journaal”', 'جـ', 'ـجـ', 'ـج', 'jben'),
  L('ha', 'ح', 'ha', '7 / ḥ', 'een geblazen h, diep uit de keel', 'حـ', 'ـحـ', 'ـح', 'hut'),
  L('kha', 'خ', 'kha', 'kh', 'ch van “lachen”', 'خـ', 'ـخـ', 'ـخ', 'khobz'),
  L('dal', 'د', 'dal', 'd', 'd van dag', 'د', 'ـد', 'ـد', 'dar'),
  L('dhal', 'ذ', 'dhal', 'dh', 'zachte th, zoals Engels “this”', 'ذ', 'ـذ', 'ـذ'),
  L('ra', 'ر', 'ra', 'r', 'rollende r', 'ر', 'ـر', 'ـر', 'ras'),
  L('zay', 'ز', 'zay', 'z', 'z van zon', 'ز', 'ـز', 'ـز', 'zerbiya'),
  L('sin', 'س', 'sin', 's', 's van sok', 'سـ', 'ـسـ', 'ـس', 'sarut'),
  L('shin', 'ش', 'shin', 'sh', 'sj van “sjaal”', 'شـ', 'ـشـ', 'ـش', 'shems'),
  L('sad', 'ص', 'sad', 'ṣ', 'zware, donkere s', 'صـ', 'ـصـ', 'ـص', 'sghir'),
  L('dad', 'ض', 'dad', 'ḍ', 'zware d — het Arabisch heet “de taal van de dad”', 'ضـ', 'ـضـ', 'ـض', 'dou'),
  L('ta-emf', 'ط', 'ta', 'ṭ', 'zware t', 'طـ', 'ـطـ', 'ـط', 'tebla'),
  L('za-emf', 'ظ', 'za', 'ẓ', 'zware z', 'ظـ', 'ـظـ', 'ـظ'),
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
  L('pa', 'پ', 'pa', 'p', 'p van pen — extra letter voor leenwoorden', 'پـ', 'ـپـ', 'ـپ'),
  L('va', 'ڤ', 'va', 'v', 'v van video — extra letter', 'ڤـ', 'ـڤـ', 'ـڤ'),
  L('ga', 'ݣ', 'ga', 'g', 'g van het Engelse “go” — extra letter, zoals in ݣناوة (gnawa)', 'ݣـ', 'ـݣـ', 'ـݣ', 'gnawa'),
]
