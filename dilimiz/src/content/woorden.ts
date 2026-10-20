import type { Onderwerp, Woord } from './types'
import { naarId } from '../engine/turks'
import { NAKIJKSTAND } from './nakijken'

/**
 * De woordenschat van de MVP: vier units, ongeveer tachtig woorden.
 *
 * Groeten en familie eerst, en niet kleuren en cijfers. Niet omdat het
 * makkelijker is -- kleuren zijn makkelijker -- maar omdat dit de woorden zijn
 * die een kind dezelfde avond kan gebruiken. `Günaydın anne` werkt aan het
 * ontbijt, `Bu benim ablam` werkt bij een videogesprek met Turkije. Een woord
 * dat vandaag gezegd kan worden, blijft.
 *
 * ALLES HIER MOET NAGEKEKEN WORDEN door iemand met Turks als moedertaal. Zie
 * nakijken.ts voor wat specifiek twijfelachtig is, en docs/decisions.md B-1.
 */

const nagekeken = NAKIJKSTAND['woorden.ts']!.klaar

/** Een woord. De id wordt uit het Turks berekend en verandert daarna nooit. */
const maak = (onderwerp: Onderwerp) =>
  (
    tr: string,
    nl: string, de: string, fr: string, en: string,
    extra: Partial<Woord> = {},
  ): Woord => ({
    id: naarId(tr), tr, betekenis: { nl, de, fr, en }, onderwerp, nagekeken, ...extra,
  })

const g = maak('groeten')
const ij = maak('ik-en-jij')
const c = maak('cijfers')
const f = maak('familie')

/** Uitleg bij gebruik, in vier talen. Kort: één regel op een leerkaart. */
const uitleg = (nl: string, de: string, fr: string, en: string) => ({ nl, de, fr, en })

/* ------------------------------------------------------- unit 1: Merhaba */

const GROETEN: Woord[] = [
  g('merhaba', 'hallo', 'hallo', 'bonjour', 'hello', { emoji: '👋' }),
  g('selam', 'hoi', 'hi', 'salut', 'hi', {
    emoji: '✌️',
    gebruik: uitleg(
      'Korter en losser dan `merhaba`. Tegen vrienden en neefjes, niet tegen een onbekende oudere.',
      'Kürzer und lockerer als `merhaba`. Zu Freunden und Cousins, nicht zu fremden Erwachsenen.',
      'Plus court et plus familier que `merhaba`. Entre amis et cousins.',
      'Shorter and more casual than `merhaba`. For friends and cousins, not for an older stranger.',
    ),
  }),
  g('günaydın', 'goedemorgen', 'guten Morgen', 'bonjour (le matin)', 'good morning', { emoji: '🌅' }),
  g('iyi günler', 'goedendag', 'guten Tag', 'bonne journée', 'good day', { uitdrukking: true, emoji: '☀️' }),
  g('evet', 'ja', 'ja', 'oui', 'yes', { emoji: '✅' }),
  g('hayır', 'nee', 'nein', 'non', 'no', { emoji: '🚫' }),

  g('teşekkür ederim', 'dank je, dank u', 'danke, vielen Dank', 'merci', 'thank you', { uitdrukking: true, emoji: '🙏' }),
  g('teşekkürler', 'bedankt', 'danke schön', 'merci bien', 'thanks', { emoji: '🙏' }),
  g('sağ ol', 'bedankt', 'danke', 'merci', 'thanks', {
    uitdrukking: true,
    gebruik: uitleg(
      'Losser dan `teşekkür ederim`. Binnen het gezin en tegen vrienden.',
      'Lockerer als `teşekkür ederim`. In der Familie und zu Freunden.',
      'Plus familier que `teşekkür ederim`. En famille et entre amis.',
      'More casual than `teşekkür ederim`. Within the family and to friends.',
    ),
  }),
  g('rica ederim', 'graag gedaan', 'gern geschehen', 'je t’en prie', 'you are welcome', { uitdrukking: true }),
  g('lütfen', 'alsjeblieft, graag', 'bitte', 's’il te plaît', 'please', { emoji: '🫱' }),
  g('özür dilerim', 'het spijt me', 'es tut mir leid', 'je suis désolé', 'I am sorry', { uitdrukking: true }),
  g('affedersin', 'pardon, sorry', 'entschuldige', 'excuse-moi', 'excuse me', {
    gebruik: uitleg(
      'Tegen één iemand die je kent. Tegen een onbekende of een oudere: `affedersiniz`.',
      'Zu einer Person, die du kennst. Zu Fremden oder Älteren: `affedersiniz`.',
      'À quelqu’un que tu connais. À un inconnu ou à une personne plus âgée : `affedersiniz`.',
      'To one person you know. To a stranger or someone older: `affedersiniz`.',
    ),
  }),

  g('iyi akşamlar', 'goedenavond', 'guten Abend', 'bonsoir', 'good evening', { uitdrukking: true, emoji: '🌆' }),
  g('iyi geceler', 'goedenacht', 'gute Nacht', 'bonne nuit', 'good night', { uitdrukking: true, emoji: '🌙' }),
  g('hoş geldin', 'welkom', 'willkommen', 'bienvenue', 'welcome', {
    uitdrukking: true,
    emoji: '🚪',
    gebruik: uitleg(
      'Tegen één iemand. Tegen meer mensen of met respect: `hoş geldiniz`.',
      'Zu einer Person. Zu mehreren oder höflich: `hoş geldiniz`.',
      'À une personne. À plusieurs ou avec respect : `hoş geldiniz`.',
      'To one person. To several, or politely: `hoş geldiniz`.',
    ),
  }),
  g('hoş bulduk', 'dank je (antwoord op `hoş geldin`)', 'danke (Antwort auf `hoş geldin`)', 'merci (réponse à `hoş geldin`)', 'thank you (reply to `hoş geldin`)', {
    uitdrukking: true,
    gebruik: uitleg(
      'Hier hoort een vast antwoord bij: wie `hoş geldin` hoort, zegt `hoş bulduk`. Altijd.',
      'Darauf gibt es eine feste Antwort: wer `hoş geldin` hört, sagt `hoş bulduk`. Immer.',
      'La réponse est fixe : qui entend `hoş geldin` répond `hoş bulduk`. Toujours.',
      'The reply is fixed: whoever hears `hoş geldin` says `hoş bulduk`. Always.',
    ),
  }),

  g('görüşürüz', 'tot ziens', 'bis bald', 'à bientôt', 'see you', { emoji: '👋' }),
  g('hoşça kal', 'dag (jij gaat weg)', 'mach es gut (du gehst)', 'au revoir (c’est toi qui pars)', 'bye (you are the one leaving)', {
    uitdrukking: true,
    gebruik: uitleg(
      'Dit zegt wie wéggaat. Wie blijft, antwoordt `güle güle`.',
      'Das sagt, wer géht. Wer bleibt, antwortet `güle güle`.',
      'C’est celui qui part qui le dit. Celui qui reste répond `güle güle`.',
      'Said by the one who is leaving. The one staying answers `güle güle`.',
    ),
  }),
  g('güle güle', 'dag (jij blijft)', 'auf Wiedersehen (du bleibst)', 'au revoir (c’est toi qui restes)', 'bye (you are the one staying)', {
    uitdrukking: true,
    gebruik: uitleg(
      'En dit zegt wie blíjft. Twee verschillende woorden voor hetzelfde moment -- dat heeft het Nederlands niet.',
      'Und das sagt, wer bléibt. Zwei verschiedene Wörter für denselben Moment.',
      'Et c’est celui qui reste qui le dit. Deux mots différents pour le même moment.',
      'And this is said by the one staying. Two different words for the same moment.',
    ),
  }),
  g('nasılsın', 'hoe gaat het?', 'wie geht es dir?', 'comment ça va ?', 'how are you?', {
    gebruik: uitleg(
      'Tegen iemand die je kent. Tegen een oudere of onbekende: `nasılsınız`.',
      'Zu jemandem, den du kennst. Zu Älteren oder Fremden: `nasılsınız`.',
      'À quelqu’un que tu connais. À une personne plus âgée : `nasılsınız`.',
      'To someone you know. To someone older or a stranger: `nasılsınız`.',
    ),
  }),
  g('iyiyim', 'het gaat goed', 'mir geht es gut', 'ça va bien', 'I am fine', { emoji: '🙂' }),
  g('fena değil', 'niet slecht', 'nicht schlecht', 'pas mal', 'not bad', { uitdrukking: true }),

  /* -------------------------------------------------- unit 2: Ben ve Sen */
]

const IK_EN_JIJ: Woord[] = [
  ij('ben', 'ik', 'ich', 'je, moi', 'I'),
  ij('sen', 'jij', 'du', 'tu, toi', 'you'),
  ij('o', 'hij, zij, het', 'er, sie, es', 'il, elle', 'he, she, it', {
    gebruik: uitleg(
      'Eén woord voor hij, zij en het. Turks heeft geen mannelijk of vrouwelijk.',
      'Ein Wort für er, sie und es. Türkisch kennt kein Geschlecht.',
      'Un seul mot pour il, elle et ça. Le turc n’a pas de genre.',
      'One word for he, she and it. Turkish has no gender.',
    ),
  }),
  ij('biz', 'wij', 'wir', 'nous', 'we'),
  ij('siz', 'jullie, u', 'ihr, Sie', 'vous', 'you (plural, polite)'),
  ij('onlar', 'zij', 'sie', 'ils, elles', 'they'),

  ij('ad', 'naam', 'Name', 'nom', 'name', { emoji: '🏷️' }),
  ij('adım', 'mijn naam', 'mein Name', 'mon nom', 'my name', {
    gebruik: uitleg(
      '`ad` plus `-ım` is `mijn naam`. Turks plakt dat eraan vast in plaats van er een woord voor te zetten.',
      '`ad` plus `-ım` heißt `mein Name`. Türkisch klebt das an, statt ein Wort davorzusetzen.',
      '`ad` plus `-ım` veut dire `mon nom`. Le turc le colle au mot au lieu d’ajouter un mot devant.',
      '`ad` plus `-ım` means `my name`. Turkish glues it on instead of putting a word in front.',
    ),
  }),
  ij('adın ne', 'hoe heet je?', 'wie heißt du?', 'comment tu t’appelles ?', 'what is your name?', { uitdrukking: true }),
  ij('memnun oldum', 'aangenaam', 'freut mich', 'enchanté', 'nice to meet you', { uitdrukking: true }),

  c('bir', 'een (1)', 'eins (1)', 'un (1)', 'one (1)', { emoji: '1️⃣' }),
  c('iki', 'twee (2)', 'zwei (2)', 'deux (2)', 'two (2)', { emoji: '2️⃣' }),
  c('üç', 'drie (3)', 'drei (3)', 'trois (3)', 'three (3)', { emoji: '3️⃣' }),
  c('dört', 'vier (4)', 'vier (4)', 'quatre (4)', 'four (4)', { emoji: '4️⃣', zacht: true }),
  c('beş', 'vijf (5)', 'fünf (5)', 'cinq (5)', 'five (5)', { emoji: '5️⃣' }),
  c('altı', 'zes (6)', 'sechs (6)', 'six (6)', 'six (6)', { emoji: '6️⃣' }),
  c('yedi', 'zeven (7)', 'sieben (7)', 'sept (7)', 'seven (7)', { emoji: '7️⃣' }),
  c('sekiz', 'acht (8)', 'acht (8)', 'huit (8)', 'eight (8)', { emoji: '8️⃣' }),
  c('dokuz', 'negen (9)', 'neun (9)', 'neuf (9)', 'nine (9)', { emoji: '9️⃣' }),
  c('on', 'tien (10)', 'zehn (10)', 'dix (10)', 'ten (10)', { emoji: '🔟' }),

  ij('kaç yaşındasın', 'hoe oud ben je?', 'wie alt bist du?', 'tu as quel âge ?', 'how old are you?', { uitdrukking: true }),
  ij('yaşındayım', 'ik ben ... jaar', 'ich bin ... Jahre alt', 'j’ai ... ans', 'I am ... years old', {
    gebruik: uitleg(
      'Het getal komt ervóór: `sekiz yaşındayım` is `ik ben acht`.',
      'Die Zahl kommt davor: `sekiz yaşındayım` heißt `ich bin acht`.',
      'Le chiffre vient avant : `sekiz yaşındayım` veut dire `j’ai huit ans`.',
      'The number comes first: `sekiz yaşındayım` is `I am eight`.',
    ),
  }),
]

/* -------------------------------------------------------- unit 3: Aile */

const FAMILIE: Woord[] = [
  f('aile', 'familie', 'Familie', 'famille', 'family', { emoji: '👨‍👩‍👧‍👦' }),
  f('anne', 'moeder, mama', 'Mutter, Mama', 'mère, maman', 'mother, mum', { emoji: '👩' }),
  f('baba', 'vader, papa', 'Vater, Papa', 'père, papa', 'father, dad', { emoji: '👨' }),
  f('çocuk', 'kind', 'Kind', 'enfant', 'child', { emoji: '🧒', zacht: true }),
  f('bebek', 'baby', 'Baby', 'bébé', 'baby', { emoji: '👶', zacht: true }),

  f('abla', 'grote zus', 'große Schwester', 'grande sœur', 'big sister', {
    emoji: '👧',
    gebruik: uitleg(
      'Alleen voor een zus die ouder is dan jij. Een jongere zus is `kız kardeş`.',
      'Nur für eine ältere Schwester. Eine jüngere ist `kız kardeş`.',
      'Seulement pour une sœur plus âgée. Une sœur plus jeune est `kız kardeş`.',
      'Only for a sister older than you. A younger one is `kız kardeş`.',
    ),
  }),
  f('abi', 'grote broer', 'großer Bruder', 'grand frère', 'big brother', {
    emoji: '👦',
    gebruik: uitleg(
      'Ook de korte vorm van `ağabey`, en wat je zegt tegen een oudere jongen die geen familie is.',
      'Auch die Kurzform von `ağabey`, und was man zu einem älteren Jungen sagt, der nicht verwandt ist.',
      'Aussi la forme courte de `ağabey`, et ce qu’on dit à un garçon plus âgé qui n’est pas de la famille.',
      'Also short for `ağabey`, and what you call an older boy who is not family.',
    ),
  }),
  f('kardeş', 'broer of zus (jonger)', 'Geschwister (jünger)', 'frère ou sœur (plus jeune)', 'younger sibling', { emoji: '🧑' }),
  f('kız kardeş', 'zusje', 'kleine Schwester', 'petite sœur', 'little sister', { uitdrukking: true, emoji: '👧' }),
  f('erkek kardeş', 'broertje', 'kleiner Bruder', 'petit frère', 'little brother', { uitdrukking: true, emoji: '👦' }),

  f('anneanne', 'oma (de moeder van je moeder)', 'Oma (Mutter deiner Mutter)', 'grand-mère (mère de ta mère)', 'grandma (your mother’s mother)', {
    emoji: '👵',
    gebruik: uitleg(
      'Letterlijk `moeder-moeder`. De oma van de andere kant heet `babaanne`.',
      'Wörtlich `Mutter-Mutter`. Die Oma von der anderen Seite heißt `babaanne`.',
      'Littéralement `mère-mère`. La grand-mère de l’autre côté s’appelle `babaanne`.',
      'Literally `mother-mother`. The grandma on the other side is `babaanne`.',
    ),
  }),
  f('babaanne', 'oma (de moeder van je vader)', 'Oma (Mutter deines Vaters)', 'grand-mère (mère de ton père)', 'grandma (your father’s mother)', { emoji: '👵' }),
  f('dede', 'opa', 'Opa', 'grand-père', 'grandpa', {
    emoji: '👴',
    gebruik: uitleg(
      'Voor beide opa’s dezelfde naam -- bij de oma’s is dat niet zo.',
      'Für beide Opas dasselbe Wort -- bei den Omas nicht.',
      'Le même mot pour les deux grands-pères -- pas pour les grands-mères.',
      'The same word for both grandfathers -- not so for the grandmothers.',
    ),
  }),

  f('teyze', 'tante (de zus van je moeder)', 'Tante (Schwester deiner Mutter)', 'tante (sœur de ta mère)', 'aunt (your mother’s sister)', {
    emoji: '👩',
    gebruik: uitleg(
      'Turks heeft vier woorden waar het Nederlands `oom` en `tante` heeft. Welke kant van de familie staat in het woord zelf.',
      'Türkisch hat vier Wörter, wo Deutsch `Onkel` und `Tante` hat. Welche Seite der Familie steckt im Wort.',
      'Le turc a quatre mots là où le français n’a que `oncle` et `tante`. Le côté de la famille est dans le mot.',
      'Turkish has four words where English has `uncle` and `aunt`. Which side of the family is in the word itself.',
    ),
  }),
  f('hala', 'tante (de zus van je vader)', 'Tante (Schwester deines Vaters)', 'tante (sœur de ton père)', 'aunt (your father’s sister)', { emoji: '👩' }),
  f('dayı', 'oom (de broer van je moeder)', 'Onkel (Bruder deiner Mutter)', 'oncle (frère de ta mère)', 'uncle (your mother’s brother)', { emoji: '👨' }),
  f('amca', 'oom (de broer van je vader)', 'Onkel (Bruder deines Vaters)', 'oncle (frère de ton père)', 'uncle (your father’s brother)', { emoji: '👨' }),
  f('kuzen', 'neef, nicht', 'Cousin, Cousine', 'cousin, cousine', 'cousin', { emoji: '🧑' }),
]

export const WOORDEN: Woord[] = [...GROETEN, ...IK_EN_JIJ, ...FAMILIE]

const OP_ID = new Map(WOORDEN.map((w) => [w.id, w]))

export const woord = (id: string): Woord | undefined => OP_ID.get(id)

/**
 * Een woord dat moet bestaan. Voor code die er niet zonder kan.
 *
 * Werpt als de id niet bestaat, en dat is met opzet: een les die naar een
 * woord verwijst dat er niet is, hoort bij de eerste test om te vallen en niet
 * bij een kind op het scherm.
 */
export const woordVast = (id: string): Woord => {
  const w = OP_ID.get(id)
  if (!w) throw new Error(`Onbekend woord: ${id}`)
  return w
}

export const woordenVan = (onderwerp: Onderwerp): Woord[] =>
  WOORDEN.filter((w) => w.onderwerp === onderwerp)
