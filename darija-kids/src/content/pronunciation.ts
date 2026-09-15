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

/** Word → the same word, spelled for the voice. */
export const SPOKEN_WORD: Record<string, string> = {
  // groeten
  'بسلامة': 'بْسلامة',       // bslama, not "bi-salaama"
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
  'بنين': 'بْنين',           // bnin
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
