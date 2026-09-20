/**
 * Telling the voice how a word is actually said.
 *
 * Darija drops the short vowels that Modern Standard Arabic keeps, and the
 * voices on phones are trained on Standard Arabic — so بسلامة comes out
 * "bi-salaama" where a Moroccan says "bslama". Writing an explicit sukun on
 * the first consonant stops the voice from inserting that vowel.
 *
 * The overrides are per word, not per sentence, so a word that appears in a
 * sentence is fixed there too. A sentence is walked token by token; a token
 * that carries one of the little prefixes Moroccans write against the next
 * word — وخويا, بالسكر, فالدار — has that prefix lifted off, looked up, and
 * put back.
 *
 * Nothing here is ever shown: the learner keeps reading the spelling that
 * Moroccans actually type. A test checks that every key matches a real word
 * and that an override only ever adds diacritics, so a typo cannot quietly
 * change what is said.
 */

/**
 * Words whose spoken form may differ in letters, not just in diacritics.
 *
 * The rule everywhere else is that an override adds vowels and nothing more,
 * so a typo cannot quietly change what the app says. A handful of words break
 * that rule for a reason, and each one has to be named here and explained, or
 * the test refuses it.
 */
export const RESPELLED: Record<string, string> = {
  // Leeg. Hier stond يالله: een Arabische stem zag الله erin, greep naar de
  // godsnaam en las drie zorgvuldige lettergrepen waar Marokkanen er twee
  // zeggen. Het woord wordt nu يلا geschreven — zoals het gezegd wordt — en
  // bovendien zegt een opname het, dus er valt niets meer te herspellen.
}

/** Word → the same word, spelled for the voice. */
export const SPOKEN_WORD: Record<string, string> = {
  ...RESPELLED,

  // ---------------------------------------------------------------------
  // De veertien die bij het nalopen fout klonken.
  //
  // Eén oorzaak: de app schrijft Darija zoals Marokkanen het typen, zonder
  // klinkertekens, en een Arabische stem is getraind op Standaardarabisch.
  // Die vult dan de klassieke klinkers in — نتا wordt "natā", حنا wordt
  // "ḥinnā", جدتي wordt "jaddatī". Het antwoord is niet anders spellen maar
  // volledig vocaliseren: dan is er niets meer te raden.
  'نتا': 'نْتَا',            // nta
  'نتي': 'نْتِي',            // nti
  'نتوما': 'نْتُومَا',        // ntuma
  'حنا': 'حْنَا',            // hna
  'خويا': 'خُويَا',          // khoya
  'ختي': 'خْتِي',            // khti
  'جدتي': 'جَدّْتِي',         // jeddti, niet het Standaardarabische "jaddati"
  'بزاف': 'بَزَّافْ',         // bezzaf
  'واخا': 'وَاخَا',          // wakha
  'ايه': 'ايَهْ',            // iyeh
  'تهلا': 'تْهَلَّا',         // thalla
  'عافاك': 'عَافَاكْ',        // 3afak

  // groeten
  'بسلامة': 'بْسْلَامَة',     // bslama, niet "bi-salaama"
  'مزيان': 'مْزيان',         // mzyan
  'سمح': 'سْمح',             // smeh liya
  'بشوية': 'بْشوية',         // bshwiya

  // mensen en familie
  'دراري': 'دْراري',         // drari
  'صغير': 'صْغير',           // sghir
  'صغيرة': 'صْغيرة',
  'كبير': 'كْبير',           // kbir
  'كبيرة': 'كْبيرة',
  'هنا': 'هْنا',             // hnaya, not "huna"

  // tellen en geld
  'تلاتة': 'تْلاتة',         // tlata
  'تمنية': 'تْمنية',         // tmnya
  'فلوس': 'فْلوس',           // flus
  'رخيص': 'رْخيص',           // rkhis
  'جديد': 'جْديد',           // jdid
  'قديم': 'قْديم',           // qdim

  // kleuren
  'زرق': 'زْرق',             // zreq
  'خضر': 'خْضر',             // khder
  'حمر': 'حْمر',             // hmer
  'كحل': 'كْحل',             // khel

  // eten
  'بغيت': 'بْغيت',           // bghit
  'لذيذ': 'لَذيذ',           // ldid
  'حليب': 'حْليب',           // hlib
  'جبن': 'جْبن',             // jben
  'تفاح': 'تْفاح',           // tfah
  'بطاطا': 'بْطاطا',         // btata
  'بصلة': 'بْصلة',           // bsla
  'مسمن': 'مْسمن',           // msemmen

  // huis en school
  'سطح': 'سْطح',             // stah
  'مراية': 'مْراية',         // mraya
  'فهمت': 'فْهمت',           // fhemt
  'مافهمتش': 'مافْهمتش',    // ma fhemtsh

  // dieren
  'سبع': 'سْبع',             // sba3
  'حمار': 'حْمار',           // hmar
  'بقرة': 'بْقرة',           // bgra
  'خروف': 'خْروف',           // khruf
  'معزة': 'مْعزة',           // m3za
  'جمل': 'جْمل',             // jmel

  // tijd en weer
  'شهر': 'شْهر',             // shher
  'شتا': 'شْتا',             // shta
  'سخون': 'سْخون',           // skhun

  // lichaam
  'شعر': 'شْعر',             // sh3ar
  'سنان': 'سْنان',           // snan
  'سناني': 'سْناني',
  'رجل': 'رْجل',             // rjel
  'حزين': 'حْزين',           // hzin
  'مريض': 'مْريض',           // mrid

  // vragen en onderweg
  'شحال': 'شْحال',           // shhal
  'حدا': 'حْدا',             // hda
  'بشكليط': 'بْشكليط',       // bshklit
  'بحر': 'بْحر',             // bhar
  'جبل': 'جْبل',             // jbel

  // cultuur
  'كناوة': 'كْناوة',         // gnawa
  'مغربية': 'مْغربية',       // mghribiya
}

/**
 * Whole phrases that need more than a per-word fix. Kept small on purpose:
 * anything that can be said per word belongs above, where every sentence
 * containing that word benefits from it too.
 */
export const SPOKEN: Record<string, string> = {}

/**
 * The little words Moroccans write against the next one: و (and), ب (with),
 * ف (in), ل (to), and the article ال with any of those in front of it.
 * Longest first, so وال is tried before و.
 */
const CLITICS = ['وبال', 'وفال', 'ولل', 'وال', 'بال', 'فال', 'كال', 'لل', 'ال', 'و', 'ب', 'ف', 'ل', 'ك']

const PUNCTUATION = /[؟?!.,;:]/g

/** One token, with a prefix lifted off if that is what makes it a known word. */
function spokenToken(token: string): string {
  const bare = token.replace(PUNCTUATION, '')
  if (!bare) return token
  const direct = SPOKEN_WORD[bare]
  if (direct) return direct
  for (const clitic of CLITICS) {
    if (!bare.startsWith(clitic) || bare.length <= clitic.length) continue
    const rest = SPOKEN_WORD[bare.slice(clitic.length)]
    if (rest) return clitic + rest
  }
  return bare
}

/**
 * The form to hand the voice. Punctuation goes: a question mark makes some
 * voices pause for half a second in the middle of a two-part sentence.
 */
export function spokenForm(arabic: string): string {
  const whole = SPOKEN[arabic]
  if (whole) return whole
  return arabic.split(/\s+/).filter(Boolean).map(spokenToken).join(' ')
}

/* ------------------------------------------------------------- letters */

/**
 * How a letter is said, which is not the same as what it looks like.
 *
 * Two problems fixed here. The first: the app used to hand the voice the bare
 * glyph — "ت" — and a speech engine given one letter says whatever it likes.
 * A letter has a *name*, and the name is what a teacher says out loud, so
 * that is what an Arabic voice now gets: تاء, not ت.
 *
 * The second: a device without an Arabic voice borrows a European one, and
 * "jim" run through the Dutch rules came out "ziem" — the wrong sound for ج
 * entirely. So every letter carries a spelling per language, written for that
 * language's own reading habits: Dutch sj, German sch, French ch, all for the
 * same ش. `base` is the fallback for a language with nothing special to say.
 *
 * Emphatic and plain pairs — ت/ط, ح/ه, ز/ظ — are one sound to a European
 * voice and always will be; the Arabic voice is the one that tells them
 * apart. What the table can do is stop them being *wrong*, and it does.
 */

export type Target = 'fr' | 'de' | 'nl' | 'es' | 'it' | 'en'

export interface LetterSpeech {
  /** The letter's name in Arabic script, for a voice that reads Arabic. */
  ar: string
  /** The spelling to borrow a European voice with. */
  base: string
  say?: Partial<Record<Target, string>>
  /**
   * Which languages can actually make this sound, best first.
   *
   * Only used when the device has no Arabic voice. A Dutch mouth has no ث at
   * all — "thaa" comes out as "taa", which is ت — while Castilian z is
   * exactly that sound. So the letter asks for the voice that can say it,
   * rather than taking whichever one the device happened to offer.
   */
  prefer?: Target[]
}

export const LETTER_SPEECH: Record<string, LetterSpeech> = {
  alif: { ar: 'أَلِفْ', base: 'alif' },
  ba: { ar: 'بَاء', base: 'baa', say: { fr: 'ba' } },
  ta: { ar: 'تَاء', base: 'taa', say: { fr: 'ta' } },
  tha: { ar: 'ثَاء', base: 'thaa', say: { fr: 'tha', de: 'thaa', it: 'taa', es: 'zaa' }, prefer: ['es', 'en'] },
  // ج is the zh of "journaal" — the one the old rules turned into "ziem".
  jim: { ar: 'جِيمْ', base: 'jeem', say: { nl: 'zjiem', de: 'schiem', fr: 'jim', es: 'yim', it: 'gim' }, prefer: ['fr'] },
  // ح has no European equivalent; Spanish and French get their own /x/-ish
  // letter, the rest get a plain h and the app says so on the page.
  ha: { ar: 'حَاء', base: 'haa', say: { es: 'jaa' }, prefer: ['es', 'de', 'nl'] },
  kha: { ar: 'خَاء', base: 'khaa', say: { nl: 'chaa', de: 'chaa', es: 'jaa' }, prefer: ['nl', 'de', 'es'] },
  dal: { ar: 'دَالْ', base: 'daal', say: { fr: 'dal' } },
  dhal: { ar: 'ذَالْ', base: 'dhaal', say: { fr: 'dhal', nl: 'dzaal', de: 'dhaal' }, prefer: ['en'] },
  ra: { ar: 'رَاء', base: 'raa', say: { fr: 'ra' }, prefer: ['es', 'it'] },
  // German s before a vowel is already /z/, which is exactly what ز wants.
  zay: { ar: 'زَايْ', base: 'zaay', say: { nl: 'zaai', de: 'saai', es: 'sai', it: 'sai', fr: 'zaï' }, prefer: ['fr', 'nl', 'en'] },
  // and the same rule means س has to be spelled with a double s in German,
  // or the voice reads it as ز.
  sin: { ar: 'سِينْ', base: 'seen', say: { nl: 'sien', de: 'ssien', fr: 'sine', es: 'sin', it: 'sin' } },
  shin: { ar: 'شِينْ', base: 'sheen', say: { nl: 'sjien', de: 'schien', fr: 'chine', it: 'scin', es: 'chin' }, prefer: ['fr', 'de', 'en'] },
  sad: { ar: 'صَادْ', base: 'saad', say: { fr: 'sad', de: 'ssaad' } },
  dad: { ar: 'ضَادْ', base: 'daad', say: { fr: 'dad' } },
  'ta-emf': { ar: 'طَاء', base: 'taa', say: { fr: 'ta' } },
  'za-emf': { ar: 'ظَاء', base: 'zaa', say: { de: 'saa', es: 'sa', it: 'sa', fr: 'za' }, prefer: ['en'] },
  ayn: { ar: 'عَيْن', base: 'ayn', say: { nl: 'ain', de: 'ain', fr: 'aïn', es: 'ain', it: 'ain' } },
  ghayn: { ar: 'غَيْن', base: 'ghayn', say: { nl: 'gain', de: 'rain', fr: 'raïn', es: 'gain', it: 'gain' }, prefer: ['fr', 'de'] },
  fa: { ar: 'فَاء', base: 'faa', say: { fr: 'fa' } },
  // French and Italian q needs a u after it, and German q is read /kv/.
  qaf: { ar: 'قَافْ', base: 'qaaf', say: { nl: 'kaaf', fr: 'kaf', de: 'kaaf', es: 'caaf', it: 'caaf' } },
  kaf: { ar: 'كَافْ', base: 'kaaf', say: { fr: 'kaf', es: 'caaf', it: 'caaf' } },
  lam: { ar: 'لَامْ', base: 'laam', say: { fr: 'lam' } },
  mim: { ar: 'مِيمْ', base: 'meem', say: { nl: 'miem', de: 'miem', fr: 'mime', es: 'mim', it: 'mim' } },
  nun: { ar: 'نُونْ', base: 'noon', say: { nl: 'noen', de: 'nuun', fr: 'noune', es: 'nun', it: 'nun' } },
  'ha-soft': { ar: 'هَاء', base: 'haa' },
  waw: { ar: 'وَاوْ', base: 'waw', say: { nl: 'waauw', de: 'uau', fr: 'waou', es: 'uau', it: 'uau' }, prefer: ['en', 'fr'] },
  ya: { ar: 'يَاء', base: 'yaa', say: { nl: 'jaa', de: 'jaa', fr: 'ya', es: 'ya', it: 'ia' }, prefer: ['nl', 'de'] },
}

/**
 * What to hand `say()` for a letter: its Arabic name, and a spelling for
 * every voice that cannot read it.
 */
export function letterSpeech(id: string, fallbackAr: string, fallbackName: string): {
  ar: string
  tr: string
  latin: Record<string, string>
  prefer: string[]
} {
  const entry = LETTER_SPEECH[id]
  if (!entry) return { ar: fallbackAr, tr: fallbackName, latin: {}, prefer: [] }
  const latin: Record<string, string> = {}
  for (const target of ['fr', 'de', 'nl', 'es', 'it', 'en'] as Target[]) {
    latin[target] = entry.say?.[target] ?? entry.base
  }
  return { ar: entry.ar, tr: entry.base, latin, prefer: entry.prefer ?? [] }
}

/** Everything `SpeakButton` needs for one letter. */
export const letterVoice = (l: { id: string; ar: string; name: string }) => {
  const speech = letterSpeech(l.id, l.ar, l.name)
  return { ar: speech.ar, tr: speech.tr, latin: speech.latin, label: l.name }
}
