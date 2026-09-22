import type { Lang } from '../i18n/languages'

/**
 * The words on darijaforkids.eu — the shop window, not the shop.
 *
 * The app itself is not on the website: it is downloaded from the App Store
 * and Google Play. What stands here has to do the convincing on its own, so
 * it is written for a parent who is scrolling on a phone and has about eight
 * seconds to decide whether this is worth a tap.
 *
 * Most of the site reuses the app's own text — the reasons, the path, the
 * questions — because that text is already written and already translated,
 * and a promise made here that the app does not keep is the worst kind of
 * marketing. Only what the app has no words for lives in this file: the
 * download, the film, the voice, the contact details.
 *
 * `SiteCopy` is derived from the Dutch below, so a missing key in Italian is
 * a compile error rather than a Dutch sentence on an Italian page.
 */

const nl = {
  /** `<title>` and the line under the link when somebody shares the site. */
  metaTitle: 'Darijaforkids — leer je kind de taal van thuis',
  metaDescription:
    'Marokkaans-Arabisch voor kinderen, spelenderwijs. 432 woorden en zinnen, ingesproken door een Marokkaanse stem. Geen account, geen advertenties. Binnenkort in de App Store en Google Play.',

  naarInhoud: 'Naar de inhoud',
  menu: {
    waarom: 'Waarom',
    stem: 'De stem',
    pad: 'Het pad',
    vragen: 'Vragen',
    ouders: 'Voor ouders',
    contact: 'Contact',
  },

  heroKicker: 'Marokkaans-Arabisch voor kinderen',
  heroTitel1: 'Eindelijk leren je kinderen ',
  heroAccent: 'hun Marokkaanse moedertaal',
  heroTitel2: ' — spelenderwijs.',
  heroLead:
    'Darija leer je niet uit een schoolboek: je leert het van je oma, aan tafel, in de auto, aan de telefoon. Maar dat gesprek stokt. Het kind antwoordt in het Nederlands, jeddti in het Darija, en daartussen valt een taal weg. Darijaforkids geeft je kind de woorden terug — twee minuten per dag, als een spelletje, met een échte Marokkaanse stem in de oren.',
  trustLine: 'Gratis beginnen · Geen account · Geen advertenties · Werkt offline',
  slogans: [
    'Twee minuten per dag. Een taal voor het leven.',
    'De taal van oma verdwijnt in één generatie. Tenzij je nu begint.',
    'Van salam tot afdingen op de souq — in 17 units.',
  ],
  heroBewijs: '432 opnames · 17 units · 304 woorden · 100 zinnen · 28 letters',

  downloadTitel: 'Begin vanavond nog',
  downloadBody:
    'De eerste les duurt twee minuten. Daarna kan je kind hallo zeggen, bedanken en afscheid nemen in het Darija. De eerste vier lessen zijn gratis — geen account, geen advertenties, niets in te vullen.',
  stickyKnop: 'Download de app',
  appStore: 'App Store',
  playStore: 'Google Play',
  downloadOp: 'Download in de',
  verkrijgbaarOp: 'Ontdek het op',
  binnenkort: 'Binnenkort',
  binnenkortBadge: 'Binnenkort beschikbaar',
  binnenkortBody:
    'De app ligt bij Apple en Google ter beoordeling. Wil je weten wanneer hij er staat? Stuur een mailtje en je hoort het als eerste.',
  houMeOpDeHoogte: 'Hou me op de hoogte',

  videoTitel: 'Een halve minuut, en je weet het',
  videoBody:
    'Dit is de app zelf: het leerpad, een les, het Arabische schrift en de opnames. Geen tekeningen van wat het ooit zou kunnen worden — dit is wat je downloadt.',
  videoGeen: 'Je browser kan deze film niet afspelen.',

  stemTitel: 'Geen computerstem. Een mens.',
  stemBody:
    'Elke taal-app laat een spraakcomputer het werk doen. Voor Darija kan dat niet: er bestáát geen Darija-stem. Elke synthesizer ter wereld is getraind op Standaardarabisch en maakt van نتا "natā" en van جدتي de grootmoeder uit een leerboek. Daarom is elk woord, elke zin en elke letter in deze app door een Marokkaanse stem ingesproken — 432 opnames, één voor één.',
  stemPunten: [
    ['432', 'opnames, allemaal met een menselijke stem'],
    ['304', 'woorden, elk in vijf soorten oefeningen'],
    ['100', 'zinnen, van begroeting tot afdingen'],
    ['28', 'letters, met hun vorm aan begin, midden en eind'],
  ] as [string, string][],

  beeldTitel: 'Zo ziet het eruit',
  vorige: 'Vorige',
  volgende: 'Volgende',
  beeldBody: (n: number): string => `${n} schermen uit de app. Veeg, of gebruik de pijlen.`,
  beeldAlt: [
    'Het leerpad met alle units',
    'Het Arabische alfabet',
    'Een oefening in een les',
    'Het woordenboek',
    'Een verhaal om te lezen',
    'Het profielscherm met de voortgang',
    'De drie spelletjes',
    'De veertien geschiedeniskaarten',
    'De herhaalstapel',
  ],

  padNiveau: { A0: 'Beginner', A1: 'Verder', A2: 'Zelfstandig' } as Record<string, string>,
  padLessen: (n: number): string => `${n} lessen`,

  oudersLees: 'Lees de uitleg voor ouders',

  contactTitel: 'Contact',
  contactBody:
    'Vragen, een fout gevonden, of je wilt de app in een klas gebruiken? Mail gerust — er zit een mens aan de andere kant.',
  mailKnop: 'Stuur een mail',
  juridisch: 'Juridisch',
  privacyLink: 'Privacyverklaring',
  voorwaardenLink: 'Gebruiksvoorwaarden',
  oudersLink: 'Voor ouders',
  taal: 'Taal',
  terugNaarHome: 'Terug naar de startpagina',
  marokko: 'Marokko',
  voetnoot: 'Darija is de taal van thuis. Hier leert je kind hem, woord voor woord.',
}

/** The shape every other language has to match. */
export type SiteCopy = typeof nl

const fr: SiteCopy = {
  metaTitle: 'Darijaforkids — offrez à votre enfant la langue de la maison',
  metaDescription:
    "L'arabe marocain pour les enfants, en jouant. 432 mots et phrases enregistrés par une voix marocaine. Sans compte, sans publicité. Bientôt sur l'App Store et Google Play.",

  naarInhoud: 'Aller au contenu',
  menu: {
    waarom: 'Pourquoi',
    stem: 'La voix',
    pad: 'Le parcours',
    vragen: 'Questions',
    ouders: 'Pour les parents',
    contact: 'Contact',
  },

  heroKicker: 'L’arabe marocain pour les enfants',
  heroTitel1: 'Enfin, vos enfants apprennent ',
  heroAccent: 'leur langue maternelle marocaine',
  heroTitel2: ' — en jouant.',
  heroLead:
    "La darija ne s'apprend pas dans un manuel — elle s'apprend de sa grand-mère, à table, en voiture, au téléphone. Mais la conversation s'enraye : l'enfant répond en français, la grand-mère en darija, et entre les deux une langue disparaît. Darijaforkids rend les mots à votre enfant. En jouant, deux minutes par jour, avec une vraie voix marocaine dans les oreilles.",
  trustLine: 'Gratuit pour commencer · Sans compte · Sans publicité · Fonctionne hors ligne',
  slogans: [
    'Deux minutes par jour. Une langue pour la vie.',
    'La langue de mamie disparaît en une génération. Sauf si vous commencez maintenant.',
    'De « salam » au marchandage au souk — en 17 unités.',
  ],
  heroBewijs: '432 enregistrements · 17 unités · 304 mots · 100 phrases · 28 lettres',

  downloadTitel: 'Commencez ce soir',
  downloadBody:
    "La première leçon dure deux minutes. Ensuite, votre enfant sait dire bonjour, merci et au revoir en darija. Les quatre premières leçons sont gratuites — sans compte, sans publicité, rien à remplir.",
  stickyKnop: 'Télécharger l’application',
  appStore: 'App Store',
  playStore: 'Google Play',
  downloadOp: 'Télécharger dans l’',
  verkrijgbaarOp: 'Disponible sur',
  binnenkort: 'Bientôt',
  binnenkortBadge: 'Bientôt disponible',
  binnenkortBody:
    "L'application est en cours d'examen chez Apple et Google. Vous voulez savoir quand elle sort ? Écrivez-nous et vous serez prévenu en premier.",
  houMeOpDeHoogte: 'Prévenez-moi',

  videoTitel: 'Trente secondes, et vous saurez',
  videoBody:
    "Voici l'application elle-même : le parcours, une leçon, l'écriture arabe et les enregistrements. Pas une maquette de ce qu'elle pourrait devenir — c'est ce que vous téléchargez.",
  videoGeen: 'Votre navigateur ne peut pas lire cette vidéo.',

  stemTitel: 'Pas une voix de synthèse. Un être humain.',
  stemBody:
    "Toutes les applis de langues confient le travail à une voix de synthèse. Pour la darija, c'est impossible : il n'existe aucune voix de synthèse en darija. Tous les moteurs du monde sont entraînés sur l'arabe standard et transforment نتا en « natā » et جدتي en la grand-mère des manuels. C'est pourquoi chaque mot, chaque phrase et chaque lettre de cette application a été enregistré par une voix marocaine — 432 enregistrements, un par un.",
  stemPunten: [
    ['432', 'enregistrements, tous par une voix humaine'],
    ['304', 'mots, chacun dans cinq types d’exercices'],
    ['100', 'phrases, de la salutation au marchandage'],
    ['28', 'lettres, avec leur forme au début, au milieu et à la fin'],
  ],

  beeldTitel: 'À quoi ça ressemble',
  vorige: 'Précédent',
  volgende: 'Suivant',
  beeldBody: (n: number): string => `${n} écrans de l’application. Faites glisser, ou utilisez les flèches.`,
  beeldAlt: [
    'Le parcours avec toutes les unités',
    'L’alphabet arabe',
    'Un exercice dans une leçon',
    'Le dictionnaire',
    'Une histoire à lire',
    'L’écran de profil avec la progression',
    'Les trois jeux',
    'Les quatorze cartes d’histoire',
    'La pile de révision',
  ],

  padNiveau: { A0: 'Débutant', A1: 'Plus loin', A2: 'Autonome' },
  padLessen: (n: number): string => `${n} leçons`,

  oudersLees: 'Lire les explications pour les parents',

  contactTitel: 'Contact',
  contactBody:
    "Une question, une erreur repérée, ou l'envie d'utiliser l'application en classe ? Écrivez-nous — il y a un être humain au bout du fil.",
  mailKnop: 'Envoyer un e-mail',
  juridisch: 'Mentions légales',
  privacyLink: 'Politique de confidentialité',
  voorwaardenLink: 'Conditions d’utilisation',
  oudersLink: 'Pour les parents',
  taal: 'Langue',
  terugNaarHome: 'Retour à l’accueil',
  marokko: 'Maroc',
  voetnoot: 'La darija est la langue de la maison. Ici, votre enfant l’apprend, mot après mot.',
}

const de: SiteCopy = {
  metaTitle: 'Darijaforkids — schenken Sie Ihrem Kind die Sprache von zu Hause',
  metaDescription:
    'Marokkanisches Arabisch für Kinder, spielerisch. 432 Wörter und Sätze, eingesprochen von einer marokkanischen Stimme. Ohne Konto, ohne Werbung. Bald im App Store und bei Google Play.',

  naarInhoud: 'Zum Inhalt',
  menu: {
    waarom: 'Warum',
    stem: 'Die Stimme',
    pad: 'Der Weg',
    vragen: 'Fragen',
    ouders: 'Für Eltern',
    contact: 'Kontakt',
  },

  heroKicker: 'Marokkanisches Arabisch für Kinder',
  heroTitel1: 'Endlich lernen Ihre Kinder ',
  heroAccent: 'ihre marokkanische Muttersprache',
  heroTitel2: ' — spielerisch.',
  heroLead:
    'Darija lernt man nicht aus dem Schulbuch — man lernt es von der Großmutter, am Tisch, im Auto, am Telefon. Aber das Gespräch stockt: Das Kind antwortet auf Deutsch, die Großmutter auf Darija, und dazwischen geht eine Sprache verloren. Darijaforkids gibt Ihrem Kind die Wörter zurück. Spielerisch, zwei Minuten am Tag, mit einer echten marokkanischen Stimme im Ohr.',
  trustLine: 'Kostenlos starten · Kein Konto · Keine Werbung · Funktioniert offline',
  slogans: [
    'Zwei Minuten am Tag. Eine Sprache fürs Leben.',
    'Die Sprache der Großmutter verschwindet in einer Generation. Es sei denn, Sie fangen jetzt an.',
    'Von „salam“ bis zum Handeln im Souk — in 17 Einheiten.',
  ],
  heroBewijs: '432 Aufnahmen · 17 Einheiten · 304 Wörter · 100 Sätze · 28 Buchstaben',

  downloadTitel: 'Fangen Sie heute Abend an',
  downloadBody:
    'Die erste Lektion dauert zwei Minuten. Danach kann Ihr Kind auf Darija hallo sagen, danke sagen und sich verabschieden. Die ersten vier Lektionen sind kostenlos — kein Konto, keine Werbung, nichts auszufüllen.',
  stickyKnop: 'App herunterladen',
  appStore: 'App Store',
  playStore: 'Google Play',
  downloadOp: 'Laden im',
  verkrijgbaarOp: 'Jetzt bei',
  binnenkort: 'Demnächst',
  binnenkortBadge: 'Demnächst verfügbar',
  binnenkortBody:
    'Die App liegt bei Apple und Google zur Prüfung. Sie möchten wissen, wann sie da ist? Schreiben Sie uns kurz — Sie hören es als Erste.',
  houMeOpDeHoogte: 'Benachrichtigt mich',

  videoTitel: 'Eine halbe Minute, und Sie wissen Bescheid',
  videoBody:
    'Das ist die App selbst: der Lernweg, eine Lektion, die arabische Schrift und die Aufnahmen. Keine Zeichnung von dem, was es einmal werden könnte — das ist, was Sie herunterladen.',
  videoGeen: 'Ihr Browser kann dieses Video nicht abspielen.',

  stemTitel: 'Keine Computerstimme. Ein Mensch.',
  stemBody:
    'Jede Sprach-App lässt einen Sprachcomputer die Arbeit machen. Für Darija geht das nicht: Es gibt keine Darija-Stimme. Jeder Synthesizer der Welt ist auf Hocharabisch trainiert und macht aus نتا „natā“ und aus جدتي die Großmutter aus dem Lehrbuch. Deshalb wurde jedes Wort, jeder Satz und jeder Buchstabe in dieser App von einer marokkanischen Stimme eingesprochen — 432 Aufnahmen, eine nach der anderen.',
  stemPunten: [
    ['432', 'Aufnahmen, alle mit menschlicher Stimme'],
    ['304', 'Wörter, jedes in fünf Übungsarten'],
    ['100', 'Sätze, vom Gruß bis zum Handeln'],
    ['28', 'Buchstaben, mit ihrer Form am Anfang, in der Mitte und am Ende'],
  ],

  beeldTitel: 'So sieht es aus',
  vorige: 'Zurück',
  volgende: 'Weiter',
  beeldBody: (n: number): string => `${n} Bildschirme aus der App. Wischen, oder die Pfeile benutzen.`,
  beeldAlt: [
    'Der Lernweg mit allen Einheiten',
    'Das arabische Alphabet',
    'Eine Übung in einer Lektion',
    'Das Wörterbuch',
    'Eine Geschichte zum Lesen',
    'Der Profilbildschirm mit dem Fortschritt',
    'Die drei Spiele',
    'Die vierzehn Geschichtskarten',
    'Der Wiederholungsstapel',
  ],

  padNiveau: { A0: 'Anfänger', A1: 'Weiter', A2: 'Selbstständig' },
  padLessen: (n: number): string => `${n} Lektionen`,

  oudersLees: 'Die Erklärung für Eltern lesen',

  contactTitel: 'Kontakt',
  contactBody:
    'Eine Frage, einen Fehler entdeckt, oder Sie möchten die App im Unterricht einsetzen? Schreiben Sie ruhig — am anderen Ende sitzt ein Mensch.',
  mailKnop: 'E-Mail schreiben',
  juridisch: 'Rechtliches',
  privacyLink: 'Datenschutzerklärung',
  voorwaardenLink: 'Nutzungsbedingungen',
  oudersLink: 'Für Eltern',
  taal: 'Sprache',
  terugNaarHome: 'Zurück zur Startseite',
  marokko: 'Marokko',
  voetnoot: 'Darija ist die Sprache von zu Hause. Hier lernt Ihr Kind sie, Wort für Wort.',
}

const es: SiteCopy = {
  metaTitle: 'Darijaforkids — devuelve a tu hijo la lengua de casa',
  metaDescription:
    'Árabe marroquí para niños, jugando. 432 palabras y frases grabadas por una voz marroquí. Sin cuenta, sin anuncios. Muy pronto en la App Store y en Google Play.',

  naarInhoud: 'Ir al contenido',
  menu: {
    waarom: 'Por qué',
    stem: 'La voz',
    pad: 'El camino',
    vragen: 'Preguntas',
    ouders: 'Para padres',
    contact: 'Contacto',
  },

  heroKicker: 'Árabe marroquí para niños',
  heroTitel1: 'Por fin tus hijos aprenden ',
  heroAccent: 'su lengua materna marroquí',
  heroTitel2: ' — jugando.',
  heroLead:
    'El dariya no se aprende en un libro de texto: se aprende de la abuela, en la mesa, en el coche, por teléfono. Pero la conversación se atasca: el niño responde en español, la abuela en dariya, y entremedias se pierde una lengua. Darijaforkids le devuelve las palabras a tu hijo. Jugando, dos minutos al día, con una voz marroquí de verdad al oído.',
  trustLine: 'Empieza gratis · Sin cuenta · Sin anuncios · Funciona sin conexión',
  slogans: [
    'Dos minutos al día. Una lengua para toda la vida.',
    'La lengua de la abuela desaparece en una generación. A menos que empieces hoy.',
    'De «salam» al regateo en el zoco — en 17 unidades.',
  ],
  heroBewijs: '432 grabaciones · 17 unidades · 304 palabras · 100 frases · 28 letras',

  downloadTitel: 'Empieza esta misma noche',
  downloadBody:
    'La primera lección dura dos minutos. Después tu hijo sabe saludar, dar las gracias y despedirse en dariya. Las cuatro primeras lecciones son gratis: sin cuenta, sin anuncios, nada que rellenar.',
  stickyKnop: 'Descargar la app',
  appStore: 'App Store',
  playStore: 'Google Play',
  downloadOp: 'Consíguelo en la',
  verkrijgbaarOp: 'Disponible en',
  binnenkort: 'Muy pronto',
  binnenkortBadge: 'Muy pronto disponible',
  binnenkortBody:
    'La app está en revisión en Apple y Google. ¿Quieres saber cuándo estará? Escríbenos y serás el primero en enterarte.',
  houMeOpDeHoogte: 'Avísame',

  videoTitel: 'Medio minuto y lo sabrás',
  videoBody:
    'Esta es la app misma: el camino de aprendizaje, una lección, la escritura árabe y las grabaciones. No es un boceto de lo que podría llegar a ser: es lo que te descargas.',
  videoGeen: 'Tu navegador no puede reproducir este vídeo.',

  stemTitel: 'No es una voz de ordenador. Es una persona.',
  stemBody:
    'Todas las apps de idiomas dejan el trabajo a una voz sintética. Con el dariya no se puede: no existe ninguna voz sintética en dariya. Todos los motores del mundo están entrenados en árabe estándar y convierten نتا en «natā» y جدتي en la abuela de los libros de texto. Por eso cada palabra, cada frase y cada letra de esta app las ha grabado una voz marroquí: 432 grabaciones, una a una.',
  stemPunten: [
    ['432', 'grabaciones, todas con voz humana'],
    ['304', 'palabras, cada una en cinco tipos de ejercicio'],
    ['100', 'frases, del saludo al regateo'],
    ['28', 'letras, con su forma al principio, en medio y al final'],
  ],

  beeldTitel: 'Así se ve',
  vorige: 'Anterior',
  volgende: 'Siguiente',
  beeldBody: (n: number): string => `${n} pantallas de la app. Desliza, o usa las flechas.`,
  beeldAlt: [
    'El camino de aprendizaje con todas las unidades',
    'El alfabeto árabe',
    'Un ejercicio dentro de una lección',
    'El diccionario',
    'Una historia para leer',
    'La pantalla de perfil con el progreso',
    'Los tres juegos',
    'Las catorce tarjetas de historia',
    'El montón de repaso',
  ],

  padNiveau: { A0: 'Principiante', A1: 'Más allá', A2: 'Autónomo' },
  padLessen: (n: number): string => `${n} lecciones`,

  oudersLees: 'Leer la explicación para padres',

  contactTitel: 'Contacto',
  contactBody:
    '¿Tienes una pregunta, has visto un error o quieres usar la app en clase? Escríbenos: al otro lado hay una persona.',
  mailKnop: 'Enviar un correo',
  juridisch: 'Aviso legal',
  privacyLink: 'Política de privacidad',
  voorwaardenLink: 'Condiciones de uso',
  oudersLink: 'Para padres',
  taal: 'Idioma',
  terugNaarHome: 'Volver al inicio',
  marokko: 'Marruecos',
  voetnoot: 'El dariya es la lengua de casa. Aquí tu hijo la aprende, palabra a palabra.',
}

const it: SiteCopy = {
  metaTitle: 'Darijaforkids — ridai a tuo figlio la lingua di casa',
  metaDescription:
    'Arabo marocchino per bambini, giocando. 432 parole e frasi registrate da una voce marocchina. Senza account, senza pubblicità. Presto su App Store e Google Play.',

  naarInhoud: 'Vai al contenuto',
  menu: {
    waarom: 'Perché',
    stem: 'La voce',
    pad: 'Il percorso',
    vragen: 'Domande',
    ouders: 'Per i genitori',
    contact: 'Contatti',
  },

  heroKicker: 'Arabo marocchino per bambini',
  heroTitel1: 'Finalmente i tuoi figli imparano ',
  heroAccent: 'la loro lingua madre marocchina',
  heroTitel2: ' — giocando.',
  heroLead:
    'Il darija non si impara sui libri di scuola: si impara dalla nonna, a tavola, in macchina, al telefono. Ma la conversazione si inceppa: il bambino risponde in italiano, la nonna in darija, e in mezzo si perde una lingua. Darijaforkids restituisce le parole a tuo figlio. Giocando, due minuti al giorno, con una vera voce marocchina nelle orecchie.',
  trustLine: 'Inizi gratis · Senza account · Senza pubblicità · Funziona offline',
  slogans: [
    'Due minuti al giorno. Una lingua per tutta la vita.',
    'La lingua della nonna sparisce in una generazione. A meno che tu non cominci oggi.',
    'Da «salam» alla trattativa al souk — in 17 unità.',
  ],
  heroBewijs: '432 registrazioni · 17 unità · 304 parole · 100 frasi · 28 lettere',

  downloadTitel: 'Comincia stasera',
  downloadBody:
    'La prima lezione dura due minuti. Dopo, tuo figlio sa dire ciao, grazie e arrivederci in darija. Le prime quattro lezioni sono gratis: senza account, senza pubblicità, niente da compilare.',
  stickyKnop: 'Scarica l’app',
  appStore: 'App Store',
  playStore: 'Google Play',
  downloadOp: 'Scarica su',
  verkrijgbaarOp: 'Disponibile su',
  binnenkort: 'Presto',
  binnenkortBadge: 'Presto disponibile',
  binnenkortBody:
    'L’app è in revisione da Apple e Google. Vuoi sapere quando sarà disponibile? Scrivici e sarai il primo a saperlo.',
  houMeOpDeHoogte: 'Avvisami',

  videoTitel: 'Mezzo minuto e capirai',
  videoBody:
    'Questa è l’app stessa: il percorso, una lezione, la scrittura araba e le registrazioni. Non un disegno di quello che potrebbe diventare: è quello che scarichi.',
  videoGeen: 'Il tuo browser non può riprodurre questo video.',

  stemTitel: 'Non una voce sintetica. Una persona.',
  stemBody:
    'Ogni app di lingue lascia il lavoro a una voce sintetica. Con il darija non si può: una voce sintetica in darija non esiste. Tutti i motori del mondo sono addestrati sull’arabo standard e trasformano نتا in «natā» e جدتي nella nonna dei manuali. Per questo ogni parola, ogni frase e ogni lettera di quest’app è stata registrata da una voce marocchina: 432 registrazioni, una per una.',
  stemPunten: [
    ['432', 'registrazioni, tutte con voce umana'],
    ['304', 'parole, ciascuna in cinque tipi di esercizio'],
    ['100', 'frasi, dal saluto alla trattativa'],
    ['28', 'lettere, con la forma all’inizio, in mezzo e alla fine'],
  ],

  beeldTitel: 'Ecco com’è',
  vorige: 'Precedente',
  volgende: 'Successivo',
  beeldBody: (n: number): string => `${n} schermate dell’app. Scorri, o usa le frecce.`,
  beeldAlt: [
    'Il percorso con tutte le unità',
    'L’alfabeto arabo',
    'Un esercizio in una lezione',
    'Il dizionario',
    'Una storia da leggere',
    'La schermata del profilo con i progressi',
    'I tre giochi',
    'Le quattordici carte di storia',
    'Il mazzo di ripasso',
  ],

  padNiveau: { A0: 'Principiante', A1: 'Avanti', A2: 'Autonomo' },
  padLessen: (n: number): string => `${n} lezioni`,

  oudersLees: 'Leggi la spiegazione per i genitori',

  contactTitel: 'Contatti',
  contactBody:
    'Una domanda, un errore trovato, o vuoi usare l’app in classe? Scrivici pure: dall’altra parte c’è una persona.',
  mailKnop: 'Scrivi un’e-mail',
  juridisch: 'Note legali',
  privacyLink: 'Informativa sulla privacy',
  voorwaardenLink: 'Condizioni d’uso',
  oudersLink: 'Per i genitori',
  taal: 'Lingua',
  terugNaarHome: 'Torna alla home',
  marokko: 'Marocco',
  voetnoot: 'Il darija è la lingua di casa. Qui tuo figlio la impara, parola per parola.',
}

const en: SiteCopy = {
  metaTitle: 'Darijaforkids — give your child the language of home',
  metaDescription:
    'Moroccan Arabic for children, through play. 432 words and sentences recorded by a Moroccan voice. No account, no ads. Coming soon to the App Store and Google Play.',

  naarInhoud: 'Skip to content',
  menu: {
    waarom: 'Why',
    stem: 'The voice',
    pad: 'The path',
    vragen: 'Questions',
    ouders: 'For parents',
    contact: 'Contact',
  },

  heroKicker: 'Moroccan Arabic for children',
  heroTitel1: 'At last, your children learn ',
  heroAccent: 'their Moroccan mother tongue',
  heroTitel2: ' — through play.',
  heroLead:
    'Darija is not learned from a textbook — it is learned from your grandmother, at the table, in the car, on the phone. But the conversation stalls: the child answers in English, the grandmother in Darija, and somewhere in between a language slips away. Darijaforkids gives your child the words back. Through play, two minutes a day, with a real Moroccan voice in their ears.',
  trustLine: 'Free to start · No account · No ads · Works offline',
  slogans: [
    'Two minutes a day. A language for life.',
    'Grandma’s language disappears in one generation. Unless you start now.',
    'From “salam” to haggling in the souk — in 17 units.',
  ],
  heroBewijs: '432 recordings · 17 units · 304 words · 100 sentences · 28 letters',

  downloadTitel: 'Start tonight',
  downloadBody:
    'The first lesson takes two minutes. After it your child can say hello, thank you and goodbye in Darija. The first four lessons are free — no account, no ads, nothing to fill in.',
  stickyKnop: 'Download the app',
  appStore: 'App Store',
  playStore: 'Google Play',
  downloadOp: 'Download on the',
  verkrijgbaarOp: 'Get it on',
  binnenkort: 'Coming soon',
  binnenkortBadge: 'Coming soon',

  binnenkortBody:
    'The app is with Apple and Google for review. Want to know the moment it lands? Send us a line and you will hear it first.',
  houMeOpDeHoogte: 'Let me know',

  videoTitel: 'Half a minute, and you will know',
  videoBody:
    'This is the app itself: the path, a lesson, the Arabic script and the recordings. Not a drawing of what it might one day be — this is what you download.',
  videoGeen: 'Your browser cannot play this film.',

  stemTitel: 'Not a computer voice. A person.',
  stemBody:
    'Every language app hands the work to a speech engine. For Darija that is not possible: there is no Darija voice. Every synthesiser in the world is trained on Modern Standard Arabic and turns نتا into "natā" and جدتي into the grandmother of a textbook. So every word, every sentence and every letter in this app was recorded by a Moroccan voice — 432 recordings, one at a time.',
  stemPunten: [
    ['432', 'recordings, every one of them a human voice'],
    ['304', 'words, each in five kinds of exercise'],
    ['100', 'sentences, from a greeting to haggling'],
    ['28', 'letters, with their shape at the start, middle and end'],
  ],

  beeldTitel: 'What it looks like',
  vorige: 'Previous',
  volgende: 'Next',
  beeldBody: (n: number): string => `${n} screens from the app. Swipe, or use the arrows.`,
  beeldAlt: [
    'The learning path with every unit',
    'The Arabic alphabet',
    'An exercise inside a lesson',
    'The dictionary',
    'A story to read',
    'The profile screen with progress',
    'The three games',
    'The fourteen history cards',
    'The review stack',
  ],

  padNiveau: { A0: 'Beginner', A1: 'Further', A2: 'On your own' },
  padLessen: (n: number): string => `${n} lessons`,

  oudersLees: 'Read the explanation for parents',

  contactTitel: 'Contact',
  contactBody:
    'A question, a mistake you spotted, or you would like to use the app in a classroom? Write to us — there is a human at the other end.',
  mailKnop: 'Send an email',
  juridisch: 'Legal',
  privacyLink: 'Privacy policy',
  voorwaardenLink: 'Terms of use',
  oudersLink: 'For parents',
  taal: 'Language',
  terugNaarHome: 'Back to the home page',
  marokko: 'Morocco',
  voetnoot: 'Darija is the language of home. Here your child learns it, word by word.',
}

export const SITE: Record<Lang, SiteCopy> = { nl, fr, de, es, it, en }
