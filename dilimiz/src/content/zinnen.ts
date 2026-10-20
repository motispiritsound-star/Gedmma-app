import type { Zin } from './types'
import { NAKIJKSTAND } from './nakijken'

/**
 * De zinnen, uitgeschreven en niet gegenereerd.
 *
 * Turkse woordvolgorde is onderwerp-voorwerp-werkwoord, en de achtervoegsels
 * plakken aan elkaar. Daar valt niet naar te gokken, dus staat elke zin hier
 * voluit.
 *
 * Elke les eindigt met zijn eigen woorden in een zin. Losse woorden zijn
 * weinig waard tot ze naast elkaar staan -- en de bouwoefening is precies
 * waar de andere woordvolgorde zichtbaar wordt.
 *
 * `hulpwoorden` zijn woorden die in de zin staan maar in deze les niet
 * geoefend worden. Ze staan op de leerkaart mét betekenis en gaan niet in de
 * herhaling. Zo hoeft geen enkele zin krom te zijn omdat het curriculum nog
 * niet zo ver is.
 */

const nagekeken = NAKIJKSTAND['zinnen.ts']!.klaar

type Vier = [string, string, string, string]

const z = (
  id: string,
  lesId: string,
  tr: string,
  [nl, de, fr, en]: Vier,
  extra: Partial<Zin> = {},
): Zin => ({ id, lesId, tr, betekenis: { nl, de, fr, en }, nagekeken, ...extra })

/** Een hulpwoord: staat in de zin, wordt niet geoefend. */
const h = (tr: string, [nl, de, fr, en]: Vier) => ({ tr, betekenis: { nl, de, fr, en } })

const BENIM = h('benim', ['mijn', 'mein', 'mon, ma', 'my'])
const BU = h('bu', ['dit, deze', 'das, dieser', 'ceci, ce', 'this'])

export const ZINNEN: Zin[] = [
  /* ------------------------------------------------- unit 1: Merhaba */
  z('merhaba-1', 'merhaba-1', 'Merhaba! Ben Deniz.',
    ['Hallo! Ik ben Deniz.', 'Hallo! Ich bin Deniz.', 'Bonjour ! Je suis Deniz.', 'Hello! I am Deniz.']),
  z('merhaba-2', 'merhaba-1', 'Günaydın anne!',
    ['Goedemorgen mama!', 'Guten Morgen Mama!', 'Bonjour maman !', 'Good morning mum!']),
  z('merhaba-3', 'merhaba-1', 'İyi günler!',
    ['Goedendag!', 'Guten Tag!', 'Bonne journée !', 'Good day!']),

  z('merhaba-4', 'merhaba-2', 'Teşekkür ederim!',
    ['Dank je!', 'Danke!', 'Merci !', 'Thank you!']),
  z('merhaba-5', 'merhaba-2', 'Lütfen bir su.',
    ['Water, alsjeblieft.', 'Wasser, bitte.', 'De l’eau, s’il te plaît.', 'Water, please.'],
    { hulpwoorden: [h('su', ['water', 'Wasser', 'eau', 'water'])] }),
  z('merhaba-6', 'merhaba-2', 'Özür dilerim, affedersin.',
    ['Het spijt me, pardon.', 'Es tut mir leid, entschuldige.', 'Je suis désolé, excuse-moi.', 'I am sorry, excuse me.']),

  z('merhaba-7', 'merhaba-3', 'İyi geceler anne, iyi geceler baba!',
    ['Goedenacht mama, goedenacht papa!', 'Gute Nacht Mama, gute Nacht Papa!', 'Bonne nuit maman, bonne nuit papa !', 'Good night mum, good night dad!']),
  z('merhaba-8', 'merhaba-3', 'Hoş geldin! — Hoş bulduk.',
    ['Welkom! — Dank je.', 'Willkommen! — Danke.', 'Bienvenue ! — Merci.', 'Welcome! — Thank you.'],
    { spreker: 'twee' }),

  z('merhaba-9', 'merhaba-4', 'Nasılsın? — İyiyim, teşekkürler.',
    ['Hoe gaat het? — Goed, bedankt.', 'Wie geht es dir? — Gut, danke.', 'Comment ça va ? — Bien, merci.', 'How are you? — Fine, thanks.'],
    { spreker: 'twee' }),
  z('merhaba-10', 'merhaba-4', 'Hoşça kal! — Güle güle!',
    ['Dag! — Dag!', 'Mach es gut! — Auf Wiedersehen!', 'Au revoir ! — Au revoir !', 'Bye! — Bye!'],
    { spreker: 'twee' }),
  z('merhaba-11', 'merhaba-4', 'Görüşürüz dede!',
    ['Tot ziens opa!', 'Bis bald Opa!', 'À bientôt papi !', 'See you grandpa!']),

  /* ----------------------------------------------- unit 2: Ben ve Sen */
  z('bensen-1', 'bensen-1', 'Ben buradayım.',
    ['Ik ben hier.', 'Ich bin hier.', 'Je suis ici.', 'I am here.'],
    { hulpwoorden: [h('burada', ['hier', 'hier', 'ici', 'here'])] }),
  z('bensen-2', 'bensen-1', 'O benim kardeşim.',
    ['Dat is mijn broertje.', 'Das ist mein Bruder.', 'C’est mon petit frère.', 'That is my little brother.'],
    { hulpwoorden: [BENIM] }),
  z('bensen-3', 'bensen-1', 'Biz bir aileyiz.',
    ['Wij zijn één familie.', 'Wir sind eine Familie.', 'Nous sommes une famille.', 'We are one family.']),

  z('bensen-4', 'bensen-2', 'Benim adım Elif.',
    ['Mijn naam is Elif.', 'Mein Name ist Elif.', 'Je m’appelle Elif.', 'My name is Elif.'],
    { hulpwoorden: [BENIM] }),
  z('bensen-5', 'bensen-2', 'Adın ne? — Adım Deniz.',
    ['Hoe heet je? — Ik heet Deniz.', 'Wie heißt du? — Ich heiße Deniz.', 'Comment tu t’appelles ? — Je m’appelle Deniz.', 'What is your name? — My name is Deniz.'],
    { spreker: 'twee' }),
  z('bensen-6', 'bensen-2', 'Memnun oldum!',
    ['Aangenaam!', 'Freut mich!', 'Enchanté !', 'Nice to meet you!']),

  z('bensen-7', 'bensen-3', 'Bir, iki, üç, dört, beş.',
    ['Een, twee, drie, vier, vijf.', 'Eins, zwei, drei, vier, fünf.', 'Un, deux, trois, quatre, cinq.', 'One, two, three, four, five.']),
  z('bensen-8', 'bensen-3', 'Bir anne, bir baba, iki çocuk.',
    ['Een moeder, een vader, twee kinderen.', 'Eine Mutter, ein Vater, zwei Kinder.', 'Une mère, un père, deux enfants.', 'One mother, one father, two children.']),

  z('bensen-9', 'bensen-4', 'Altı, yedi, sekiz, dokuz, on.',
    ['Zes, zeven, acht, negen, tien.', 'Sechs, sieben, acht, neun, zehn.', 'Six, sept, huit, neuf, dix.', 'Six, seven, eight, nine, ten.']),

  z('bensen-10', 'bensen-5', 'Kaç yaşındasın? — Sekiz yaşındayım.',
    ['Hoe oud ben je? — Ik ben acht.', 'Wie alt bist du? — Ich bin acht.', 'Tu as quel âge ? — J’ai huit ans.', 'How old are you? — I am eight.'],
    { spreker: 'twee' }),
  z('bensen-11', 'bensen-5', 'Ablam on yaşında.',
    ['Mijn grote zus is tien.', 'Meine große Schwester ist zehn.', 'Ma grande sœur a dix ans.', 'My big sister is ten.']),

  /* --------------------------------------------------- unit 3: Aile */
  z('aile-1', 'aile-1', 'Bu benim annem.',
    ['Dit is mijn moeder.', 'Das ist meine Mutter.', 'C’est ma mère.', 'This is my mother.'],
    { hulpwoorden: [BU, BENIM] }),
  z('aile-2', 'aile-1', 'Bu benim babam.',
    ['Dit is mijn vader.', 'Das ist mein Vater.', 'C’est mon père.', 'This is my father.'],
    { hulpwoorden: [BU, BENIM] }),
  z('aile-3', 'aile-1', 'Ailem büyük.',
    ['Mijn familie is groot.', 'Meine Familie ist groß.', 'Ma famille est grande.', 'My family is big.'],
    { hulpwoorden: [h('büyük', ['groot', 'groß', 'grand', 'big'])] }),

  z('aile-4', 'aile-2', 'Bir ablam var.',
    ['Ik heb een grote zus.', 'Ich habe eine große Schwester.', 'J’ai une grande sœur.', 'I have a big sister.'],
    { hulpwoorden: [h('var', ['er is, ik heb', 'es gibt, ich habe', 'il y a, j’ai', 'there is, I have'])] }),
  z('aile-5', 'aile-2', 'Abim okulda.',
    ['Mijn grote broer is op school.', 'Mein großer Bruder ist in der Schule.', 'Mon grand frère est à l’école.', 'My big brother is at school.'],
    { hulpwoorden: [h('okul', ['school', 'Schule', 'école', 'school'])] }),
  z('aile-6', 'aile-2', 'İki kardeşim var.',
    ['Ik heb twee broertjes of zusjes.', 'Ich habe zwei Geschwister.', 'J’ai deux frères et sœurs.', 'I have two siblings.'],
    { hulpwoorden: [h('var', ['er is, ik heb', 'es gibt, ich habe', 'il y a, j’ai', 'there is, I have'])] }),

  z('aile-7', 'aile-3', 'Anneannem Türkiye’de.',
    ['Mijn oma is in Turkije.', 'Meine Oma ist in der Türkei.', 'Ma grand-mère est en Turquie.', 'My grandma is in Türkiye.'],
    { hulpwoorden: [h('Türkiye', ['Turkije', 'Türkei', 'Turquie', 'Türkiye'])] }),
  z('aile-8', 'aile-3', 'Dedem ve babaannem burada.',
    ['Mijn opa en oma zijn hier.', 'Mein Opa und meine Oma sind hier.', 'Mon papi et ma mamie sont ici.', 'My grandpa and grandma are here.'],
    { hulpwoorden: [h('ve', ['en', 'und', 'et', 'and']), h('burada', ['hier', 'hier', 'ici', 'here'])] }),

  z('aile-9', 'aile-4', 'Teyzem geliyor!',
    ['Mijn tante komt!', 'Meine Tante kommt!', 'Ma tante arrive !', 'My aunt is coming!'],
    { hulpwoorden: [h('geliyor', ['komt', 'kommt', 'arrive', 'is coming'])] }),
  z('aile-10', 'aile-4', 'Amcam ve halam burada.',
    ['Mijn oom en mijn tante zijn hier.', 'Mein Onkel und meine Tante sind hier.', 'Mon oncle et ma tante sont ici.', 'My uncle and my aunt are here.'],
    {
      hulpwoorden: [h('ve', ['en', 'und', 'et', 'and']), h('burada', ['hier', 'hier', 'ici', 'here'])],
    }),
  z('aile-11', 'aile-4', 'Kuzenim sekiz yaşında.',
    ['Mijn neef is acht.', 'Mein Cousin ist acht.', 'Mon cousin a huit ans.', 'My cousin is eight.']),
]

const OP_ID = new Map(ZINNEN.map((z) => [z.id, z]))

export const zin = (id: string): Zin | undefined => OP_ID.get(id)

/** De zinnen van één les, in de volgorde waarin ze hier staan. */
export const zinnenVan = (lesId: string): string[] =>
  ZINNEN.filter((z) => z.lesId === lesId).map((z) => z.id)

/**
 * De tegels voor de bouwoefening: de zin in losse stukken.
 *
 * Op spaties, en leestekens blijven aan het woord vast zitten -- `Merhaba!`
 * blijft één tegel. Een kind dat tegels legt is met woordvolgorde bezig en
 * niet met interpunctie, en een losse tegel met alleen een uitroepteken is
 * een puzzel over niets.
 */
export const tegelsVan = (tekst: string): string[] =>
  tekst.split(/\s+/).filter(Boolean)
