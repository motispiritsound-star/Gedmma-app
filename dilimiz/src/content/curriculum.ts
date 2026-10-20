import type { Les, LesTip, Unit } from './types'
import { LETTERGROEPEN } from './letters'
import { zinnenVan } from './zinnen'
import { HARMONIE_TIPS } from './achtervoegsels'

/**
 * Het lespad. Units staan op volgorde; een unit gaat open als de vorige af is.
 *
 * Unit 0 is het alfabet, en staat vooraan om een andere reden dan bij de app
 * waar de techniek van komt. Daar moest een kind een nieuw schrift leren voor
 * het één woord kon lezen -- 28 letters in vier vormen, zeven lessen. Hier kán
 * het de letters al lezen; wat het moet leren is er zes ánders lezen. Dat is
 * vier korte lessen, en daarna kan het élk Turks woord voorlezen, want de
 * spelling is fonetisch.
 *
 * Elke unit eindigt met een toets die uit de unit zelf wordt opgebouwd, zodat
 * een toets nooit uit de pas kan lopen met zijn lessen.
 */

type Vier = [string, string, string, string]
const b = ([nl, de, fr, en]: Vier) => ({ nl, de, fr, en })

/** Een les. `zinnen` wordt afgeleid, zodat zinnen.ts de enige bron is. */
const les = (
  id: string,
  titel: Vier,
  soort: Les['soort'],
  woorden: string[],
  extra: Partial<Les> = {},
): Les => ({ id, titel: b(titel), soort, woorden, zinnen: zinnenVan(id), ...extra })

/**
 * Een unit, met de toets eraan geplakt.
 *
 * De toets krijgt alle woorden en alle zinnen van de unit. Dat is met opzet
 * afgeleid en niet opgeschreven: een les erbij is dan automatisch ook in de
 * toets, en een toets die een woord vraagt dat nergens is onderwezen kan niet
 * bestaan.
 */
const unit = (
  id: string,
  tr: string,
  titel: Vier,
  ondertitel: Vier,
  emoji: string,
  niveau: Unit['niveau'],
  accent: Unit['accent'],
  lessen: Les[],
  gezinsopdracht?: Vier,
): Unit => {
  const alleWoorden = [...new Set(lessen.flatMap((l) => l.woorden))]
  const alleZinnen = [...new Set(lessen.flatMap((l) => l.zinnen ?? []))]
  const toets: Les = {
    id: `${id}-toets`,
    titel: b(['Toets', 'Test', 'Test', 'Test']),
    soort: 'toets',
    woorden: alleWoorden,
    zinnen: alleZinnen,
    letters: [...new Set(lessen.flatMap((l) => l.letters ?? []))],
    klankparen: [...new Set(lessen.flatMap((l) => l.klankparen ?? []))],
  }
  return {
    id, tr, titel: b(titel), ondertitel: b(ondertitel), emoji, niveau, accent,
    lessen: [...lessen, toets],
    ...(gezinsopdracht ? { gezinsopdracht: b(gezinsopdracht) } : {}),
  }
}

/* --------------------------------------------------- unit 0: de letters */

const LETTERLES_TITELS: Vier[] = [
  ['c, ç en ş', 'c, ç und ş', 'c, ç et ş', 'c, ç and ş'],
  ['ı en i', 'ı und i', 'ı et i', 'ı and i'],
  ['ö en ü', 'ö und ü', 'ö et ü', 'ö and ü'],
  ['ğ en de rest', 'ğ und der Rest', 'ğ et le reste', 'ğ and the rest'],
]

const LETTERLES_TIPS: (LesTip | undefined)[] = [
  {
    titel: b(['Eén keer leren, altijd kunnen lezen', 'Einmal lernen, immer lesen können', 'Apprendre une fois, lire pour toujours', 'Learn it once, read it forever']),
    tekst: b([
      'Turks schrijf je precies zoals je het zegt. Geen stille letters, geen `ij` die soms `ei` is, geen `ou` die soms `oe` is. Als je deze letters kent, kun je élk Turks woord voorlezen — ook woorden die je nog nooit hebt gezien. Daar beginnen we mee, want daarna wordt alles makkelijker.',
      'Türkisch schreibt man genau so, wie man es spricht. Keine stummen Buchstaben, keine Ausnahmen. Wenn du diese Buchstaben kennst, kannst du jédes türkische Wort vorlesen — auch Wörter, die du noch nie gesehen hast.',
      'Le turc s’écrit exactement comme il se prononce. Pas de lettres muettes, pas d’exceptions. Si tu connais ces lettres, tu peux lire n’importe quel mot turc — même un mot que tu n’as jamais vu.',
      'Turkish is written exactly as it sounds. No silent letters, no exceptions. Once you know these letters you can read ány Turkish word out loud — even one you have never seen.',
    ]),
  },
  {
    titel: b(['Twee letters, twee woorden', 'Zwei Buchstaben, zwei Wörter', 'Deux lettres, deux mots', 'Two letters, two words']),
    tekst: b([
      'De `ı` zonder punt is geen `i`. Het is een andere letter en een andere klank, en hij verandert de betekenis: `kıl` is een haartje, `kil` is klei. Hier gaat het vaakst iets mis, dus hier oefenen we het langst.',
      'Das punktlose `ı` ist kein `i`. Es ist ein anderer Buchstabe und ein anderer Laut, und er ändert die Bedeutung: `kıl` ist ein Härchen, `kil` ist Ton.',
      'Le `ı` sans point n’est pas un `i`. C’est une autre lettre et un autre son, et il change le sens : `kıl` c’est un poil, `kil` c’est de l’argile.',
      'The dotless `ı` is not an `i`. It is a different letter and a different sound, and it changes the meaning: `kıl` is a single hair, `kil` is clay.',
    ]),
  },
  undefined,
  {
    titel: b(['De zachte g', 'Das weiche g', 'Le g doux', 'The soft g']),
    tekst: b([
      'De `ğ` hoor je bijna niet. Hij rekt de klinker ervoor uit: `dağ` (berg) klinkt als `daa`. Hij staat nooit aan het begin van een woord — als je hem ziet, weet je dus al dat er een klinker vóór staat.',
      'Das `ğ` hört man kaum. Es dehnt den Vokal davor: `dağ` (Berg) klingt wie `daa`. Es steht niemals am Wortanfang.',
      'On entend à peine le `ğ`. Il allonge la voyelle qui le précède : `dağ` (montagne) sonne comme `daa`. Il n’est jamais en début de mot.',
      'You barely hear the `ğ`. It stretches the vowel before it: `dağ` (mountain) sounds like `daa`. It never starts a word.',
    ]),
  },
]

const HARFLER = unit(
  'harfler', 'Harfler',
  ['Letters en klanken', 'Buchstaben und Laute', 'Lettres et sons', 'Letters and sounds'],
  ['Zes letters die je anders leest', 'Sechs Buchstaben, die anders klingen', 'Six lettres qui se lisent autrement', 'Six letters you read differently'],
  '🔤', 'A0', 'cini',
  LETTERGROEPEN.map((groep, i) => les(
    `harfler-${i + 1}`,
    LETTERLES_TITELS[i]!,
    i === 3 ? 'letters' : 'klanken',
    [],
    {
      letters: groep.letters,
      klankparen: groep.klankparen,
      ...(LETTERLES_TIPS[i] ? { tip: LETTERLES_TIPS[i]! } : {}),
    },
  )),
  [
    'Laat iemand thuis een Turks woord opschrijven dat jij nog niet kent, en lees het voor. Je kunt het nu, ook zonder te weten wat het betekent.',
    'Lass jemanden zu Hause ein türkisches Wort aufschreiben, das du noch nicht kennst, und lies es vor. Du kannst das jetzt, auch ohne zu wissen, was es bedeutet.',
    'Demande à quelqu’un chez toi d’écrire un mot turc que tu ne connais pas, et lis-le à voix haute. Tu en es capable maintenant, même sans savoir ce qu’il veut dire.',
    'Ask someone at home to write down a Turkish word you do not know, and read it out loud. You can do that now, even without knowing what it means.',
  ],
)

/* --------------------------------------------------- unit 1: Merhaba */

const MERHABA = unit(
  'merhaba', 'Merhaba',
  ['Groeten', 'Begrüßen', 'Saluer', 'Greetings'],
  ['Hallo, dag, en dank je', 'Hallo, tschüss und danke', 'Bonjour, au revoir et merci', 'Hello, goodbye and thank you'],
  '👋', 'A0', 'kayisi',
  [
    les('merhaba-1', ['Hallo', 'Hallo', 'Bonjour', 'Hello'], 'woorden',
      ['merhaba', 'selam', 'gunaydin', 'iyi-gunler', 'evet', 'hayir']),
    les('merhaba-2', ['Dank je', 'Danke', 'Merci', 'Thank you'], 'woorden',
      ['tesekkur-ederim', 'tesekkurler', 'sag-ol', 'rica-ederim', 'lutfen', 'ozur-dilerim', 'affedersin']),
    les('merhaba-3', ['Welkom', 'Willkommen', 'Bienvenue', 'Welcome'], 'woorden',
      ['iyi-aksamlar', 'iyi-geceler', 'hos-geldin', 'hos-bulduk'], {
        tip: {
          titel: b(['Hier hoort een antwoord bij', 'Darauf gibt es eine Antwort', 'Il y a une réponse à cela', 'This one has a reply']),
          tekst: b([
            'Sommige Turkse groeten komen in tweeën. Zegt iemand `hoş geldin`, dan antwoord je `hoş bulduk` — altijd, en iedereen doet het. Weet je dat niet, dan valt er een stilte waar niemand iets mee bedoelde.',
            'Manche türkische Grüße kommen zu zweit. Sagt jemand `hoş geldin`, antwortest du `hoş bulduk` — immer, und jeder macht das.',
            'Certaines salutations turques vont par deux. Si quelqu’un dit `hoş geldin`, tu réponds `hoş bulduk` — toujours, et tout le monde le fait.',
            'Some Turkish greetings come in pairs. If someone says `hoş geldin`, you answer `hoş bulduk` — always, and everyone does.',
          ]),
        },
      }),
    les('merhaba-4', ['Tot ziens', 'Bis bald', 'À bientôt', 'See you'], 'woorden',
      ['gorusuruz', 'hosca-kal', 'gule-gule', 'nasilsin', 'iyiyim', 'fena-degil'], {
        tip: {
          titel: b(['Wie gaat, en wie blijft', 'Wer geht, und wer bleibt', 'Qui part, et qui reste', 'Who leaves, and who stays']),
          tekst: b([
            'Turks heeft twee woorden voor `dag`, en welke je zegt hangt ervan af of jij weggaat of blijft. Wie vertrekt zegt `hoşça kal`; wie blijft zegt `güle güle`. Het Nederlands heeft dat niet, en daardoor is het precies het soort ding dat opvalt als je het goed doet.',
            'Türkisch hat zwei Wörter für `tschüss`, und welches du sagst, hängt davon ab, ob du gehst oder bleibst. Wer geht, sagt `hoşça kal`; wer bleibt, sagt `güle güle`.',
            'Le turc a deux mots pour `au revoir`, selon que tu partes ou que tu restes. Celui qui part dit `hoşça kal` ; celui qui reste dit `güle güle`.',
            'Turkish has two words for `bye`, and which one you say depends on whether you are leaving or staying. The one leaving says `hoşça kal`; the one staying says `güle güle`.',
          ]),
        },
      }),
  ],
  [
    'Groet morgenochtend iedereen thuis in het Turks: `günaydın`. Kijk wie teruggroet in het Turks.',
    'Begrüße morgen früh alle zu Hause auf Türkisch: `günaydın`. Schau, wer auf Türkisch zurückgrüßt.',
    'Demain matin, salue tout le monde chez toi en turc : `günaydın`. Regarde qui te répond en turc.',
    'Tomorrow morning, greet everyone at home in Turkish: `günaydın`. See who greets you back in Turkish.',
  ],
)

/* ------------------------------------------------- unit 2: Ben ve Sen */

const BEN_VE_SEN = unit(
  'bensen', 'Ben ve Sen',
  ['Ik en jij', 'Ich und du', 'Moi et toi', 'Me and you'],
  ['Jezelf voorstellen', 'Dich vorstellen', 'Te présenter', 'Introducing yourself'],
  '🙋', 'A0', 'fistik',
  [
    les('bensen-1', ['Ik, jij, wij', 'Ich, du, wir', 'Moi, toi, nous', 'I, you, we'], 'woorden',
      ['ben', 'sen', 'o', 'biz', 'siz', 'onlar'], {
        tip: {
          titel: b(['Eén woord voor hij, zij en het', 'Ein Wort für er, sie und es', 'Un seul mot pour il et elle', 'One word for he, she and it']),
          tekst: b([
            'Turks heeft geen mannelijk of vrouwelijk. `o` is hij, zij én het. Geen `de` of `het`, geen `der, die, das` — één woord, en je kunt er nooit naast zitten.',
            'Türkisch kennt kein Geschlecht. `o` ist er, sie únd es. Kein `der, die, das` — ein Wort, und du kannst nie danebenliegen.',
            'Le turc n’a pas de genre. `o`, c’est il, elle ét ça. Pas de `le` ou `la` — un seul mot, impossible de se tromper.',
            'Turkish has no gender. `o` is he, she ánd it. No `the` to get wrong — one word, and you can never pick the wrong one.',
          ]),
        },
      }),
    les('bensen-2', ['Hoe heet je?', 'Wie heißt du?', 'Comment tu t’appelles ?', 'What is your name?'], 'woorden',
      ['ad', 'adim', 'adin-ne', 'memnun-oldum']),
    les('bensen-3', ['Een tot vijf', 'Eins bis fünf', 'Un à cinq', 'One to five'], 'woorden',
      ['bir', 'iki', 'uc', 'dort', 'bes']),
    les('bensen-4', ['Zes tot tien', 'Sechs bis zehn', 'Six à dix', 'Six to ten'], 'woorden',
      ['alti', 'yedi', 'sekiz', 'dokuz', 'on']),
    les('bensen-5', ['Hoe oud ben je?', 'Wie alt bist du?', 'Tu as quel âge ?', 'How old are you?'], 'woorden',
      ['kac-yasindasin', 'yasindayim']),
  ],
  [
    'Vraag iemand thuis in het Turks hoe oud die is: `kaç yaşındasın?`. En vertel dan zelf hoe oud jij bent.',
    'Frag jemanden zu Hause auf Türkisch, wie alt er ist: `kaç yaşındasın?`. Und sag dann, wie alt du bist.',
    'Demande en turc à quelqu’un chez toi quel âge il a : `kaç yaşındasın ?`. Puis dis le tien.',
    'Ask someone at home in Turkish how old they are: `kaç yaşındasın?`. Then say how old you are.',
  ],
)

/* ----------------------------------------------------- unit 3: Aile */

const AILE = unit(
  'aile', 'Aile',
  ['Familie', 'Familie', 'Famille', 'Family'],
  ['Iedereen een eigen naam', 'Für jeden ein eigenes Wort', 'Un mot pour chacun', 'A word for everyone'],
  '👨‍👩‍👧‍👦', 'A1', 'gul',
  [
    les('aile-1', ['Mama en papa', 'Mama und Papa', 'Maman et papa', 'Mum and dad'], 'woorden',
      ['aile', 'anne', 'baba', 'cocuk', 'bebek']),
    les('aile-2', ['Broers en zussen', 'Geschwister', 'Frères et sœurs', 'Brothers and sisters'], 'woorden',
      ['abla', 'abi', 'kardes', 'kiz-kardes', 'erkek-kardes'], {
        tip: {
          titel: b(['Ouder of jonger staat in het woord', 'Älter oder jünger steckt im Wort', 'Plus âgé ou plus jeune est dans le mot', 'Older or younger is in the word itself']),
          tekst: b([
            'In het Turks hoor je aan het woord of iemand ouder of jonger is dan jij. Je grote zus is `abla`, je kleine zus is `kız kardeş` — twee verschillende woorden. En `abla` en `abi` zeg je ook tegen oudere kinderen die geen familie zijn: het is een manier om respect te laten horen.',
            'Im Türkischen hörst du am Wort, ob jemand älter oder jünger ist als du. Deine große Schwester ist `abla`, deine kleine Schwester ist `kız kardeş`. Und `abla` und `abi` sagt man auch zu älteren Kindern, die nicht verwandt sind.',
            'En turc, le mot te dit si quelqu’un est plus âgé ou plus jeune que toi. Ta grande sœur est `abla`, ta petite sœur est `kız kardeş`. Et on dit aussi `abla` et `abi` à des enfants plus âgés qui ne sont pas de la famille.',
            'In Turkish the word tells you whether someone is older or younger than you. Your big sister is `abla`, your little sister is `kız kardeş`. And you also call older children who are not family `abla` and `abi`.',
          ]),
        },
      }),
    les('aile-3', ['Oma en opa', 'Oma und Opa', 'Mamie et papi', 'Grandma and grandpa'], 'woorden',
      ['anneanne', 'babaanne', 'dede'], {
        tip: {
          titel: b(['Twee oma’s, twee namen', 'Zwei Omas, zwei Namen', 'Deux mamies, deux noms', 'Two grandmas, two names']),
          tekst: b([
            'De moeder van je moeder is `anneanne` — letterlijk `moeder-moeder`. De moeder van je vader is `babaanne`, `vader-moeder`. Zo weet iedereen meteen over wie je het hebt. Bij de opa’s is dat niet zo: die heten allebei `dede`.',
            'Die Mutter deiner Mutter ist `anneanne` — wörtlich `Mutter-Mutter`. Die Mutter deines Vaters ist `babaanne`, `Vater-Mutter`. Bei den Opas ist das nicht so: beide heißen `dede`.',
            'La mère de ta mère est `anneanne` — littéralement `mère-mère`. La mère de ton père est `babaanne`, `père-mère`. Pour les grands-pères, pas de distinction : les deux sont `dede`.',
            'Your mother’s mother is `anneanne` — literally `mother-mother`. Your father’s mother is `babaanne`, `father-mother`. Not so for grandfathers: both are `dede`.',
          ]),
        },
      }),
    les('aile-4', ['Ooms en tantes', 'Onkel und Tanten', 'Oncles et tantes', 'Uncles and aunts'], 'woorden',
      ['teyze', 'hala', 'dayi', 'amca', 'kuzen'], {
        tip: {
          titel: b(['Vier woorden waar wij twee hebben', 'Vier Wörter, wo wir zwei haben', 'Quatre mots là où nous en avons deux', 'Four words where we have two']),
          tekst: b([
            '`teyze` is de zus van je moeder, `hala` de zus van je vader. `dayı` is de broer van je moeder, `amca` de broer van je vader. Vier woorden in plaats van `oom` en `tante` — en dat betekent dat je in Turkije met één woord vertelt hoe de familie in elkaar zit. Let op: `teyze` zeg je ook tegen een vriendelijke oudere vrouw die geen familie is.',
            '`teyze` ist die Schwester deiner Mutter, `hala` die deines Vaters. `dayı` ist der Bruder deiner Mutter, `amca` der deines Vaters. Vier Wörter statt `Onkel` und `Tante`. Übrigens: `teyze` sagt man auch zu einer freundlichen älteren Frau, die nicht verwandt ist.',
            '`teyze` est la sœur de ta mère, `hala` celle de ton père. `dayı` est le frère de ta mère, `amca` celui de ton père. Quatre mots au lieu de `oncle` et `tante`. À noter : on dit aussi `teyze` à une dame plus âgée et gentille qui n’est pas de la famille.',
            '`teyze` is your mother’s sister, `hala` your father’s. `dayı` is your mother’s brother, `amca` your father’s. Four words instead of `uncle` and `aunt`. Note: you also call a kind older woman who is not family `teyze`.',
          ]),
        },
      }),
  ],
  [
    'Teken je familie en zet er de Turkse woorden bij. Vraag een ouder of een oma of het klopt — en of er in jullie familie misschien een ander woord voor wordt gebruikt.',
    'Zeichne deine Familie und schreib die türkischen Wörter dazu. Frag einen Elternteil oder eine Oma, ob es stimmt — und ob in deiner Familie vielleicht ein anderes Wort benutzt wird.',
    'Dessine ta famille et écris les mots turcs à côté. Demande à un parent ou à une mamie si c’est juste — et si dans ta famille on dit peut-être autrement.',
    'Draw your family and write the Turkish words next to it. Ask a parent or a grandma whether it is right — and whether your family maybe uses a different word.',
  ],
)

/* ------------------------------------------------------ de harmonieles */

/**
 * De harmonieles hangt niet aan een unit maar aan het pad, ná unit 3.
 *
 * Met reden: klinkerharmonie valt pas op als je genoeg woorden hebt om hem te
 * zien. Een kind dat `anne`, `ev`, `okul` en `göz` kent, ziet in één oefening
 * wat de regel is. Datzelfde kind had in les twee alleen een regel gehoord.
 */
export const HARMONIE_LES: Les = {
  id: 'harmonie-1',
  titel: { nl: 'Woorden die groeien', de: 'Wörter, die wachsen', fr: 'Des mots qui poussent', en: 'Words that grow' },
  soort: 'harmonie',
  woorden: [],
  harmonieOefeningen: ['ev-in', 'okul-in', 'kitap-in', 'goz-mijn', 'anne-meervoud'],
  tip: HARMONIE_TIPS.twee,
  zinnen: [],
}

export const UNITS: Unit[] = [HARFLER, MERHABA, BEN_VE_SEN, AILE]

export const LESSEN: Les[] = UNITS.flatMap((u) => u.lessen)

/** Het pad in de volgorde waarin een kind het aflegt. */
export const PAD: { unit: Unit; les: Les }[] =
  UNITS.flatMap((u) => u.lessen.map((l) => ({ unit: u, les: l })))

export const unitVan = (lesId: string): Unit | undefined =>
  UNITS.find((u) => u.lessen.some((l) => l.id === lesId))

export const les_ = (id: string): Les | undefined => LESSEN.find((l) => l.id === id)
