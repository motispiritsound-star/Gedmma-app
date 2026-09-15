/**
 * Telling the voice how a word is actually said.
 *
 * Darija drops short vowels that Modern Standard Arabic keeps, and the voices
 * on phones are trained on Standard Arabic — so بسلامة comes out "bi-salaama"
 * where a Moroccan says "bslama". Writing an explicit sukun on the first
 * consonant stops the voice inserting that vowel.
 *
 * The keys are the exact script as it is written in words.ts; the values are
 * only ever spoken, never shown, so the learner still reads the spelling that
 * Moroccans actually type. A test checks that every key here matches a real
 * word, so a typo cannot quietly do nothing.
 */
export const SPOKEN: Record<string, string> = {
  'بسلامة': 'بْسلامة',       // bslama — not "bi-salaama"
  'بنين': 'بْنين',           // bnin
  'بغيت': 'بْغيت',           // bghit
  'بغيت ناكل': 'بْغيت ناكل', // bghit nakol
  'بغيت هادا': 'بْغيت هادا', // bghit hada
  'مزيان': 'مْزيان',         // mzyan
  'شحال': 'شْحال',           // shhal
  'شحال هادا؟': 'شْحال هادا', // shhal hada
  'شحال فالساعة؟': 'شْحال فالساعة', // shhal f ssa3a
  'شحال ف عمرك؟': 'شْحال ف عمرك',  // shhal f 3merek
  'صغير': 'صْغير',           // sghir
  'سمح ليا': 'سْمح ليا',     // smeh liya
  'بشوية': 'بْشوية',         // bshwiya
  'دراري': 'دْراري',         // drari
  'كناوة': 'كْناوة',         // gnawa
  'سبع': 'سْبع',             // sba3
  'زرق': 'زْرق',             // zreq
  'خضر': 'خْضر',             // khder
  'حمر': 'حْمر',             // hmer
  'كحل': 'كْحل',             // khel
}

/** The form to hand the voice: the override when there is one. */
export const spokenForm = (arabic: string): string => SPOKEN[arabic] ?? arabic
