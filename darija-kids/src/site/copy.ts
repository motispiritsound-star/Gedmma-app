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
  gesTitel: 'De geschiedenis van Marokko, in veertien momenten',
  gesLead: 'Van een Romeinse stad in de heuvels tot het alfabet dat in 2011 officieel werd. Veertien keer kort, op volgorde, en alles wat erin staat is nagekeken. Voor kinderen vanaf een jaar of acht — en voor de ouder die het zelf nooit heeft geleerd.',
  gesWist: 'Wist je dat?',
  gesSlot: 'Deze veertien verhalen zitten ook in de app: na elke toets krijgt je kind er één, voorgelezen in zijn eigen taal.',
  naamTitel: 'De naam van je kind in Arabisch schrift',
  naamLead: 'Typ de naam en zie hem verschijnen zoals hij in Marokko geschreven wordt. Sla hem op, stuur hem door, hang hem op — hij is van jou, gratis.',
  naamLabel: 'De naam',
  naamPlaceholder: 'Bijvoorbeeld Amir',
  naamKnop: 'Laat zien',
  naamOpslaan: 'Afbeelding opslaan',
  naamOnbekend: 'Deze naam staat nog niet in de lijst. Elke naam wordt met de hand nagekeken — automatisch omzetten gaat juist bij Marokkaanse namen mis. Vraag hem aan en hij staat er binnen een paar dagen bij.',
  naamAanvragen: 'Vraag deze naam aan',
  naamUitleg: 'Honderdtachtig Marokkaanse namen, stuk voor stuk nagekeken. Er wordt niets opgeslagen en niets verstuurd: de naam blijft in je eigen browser.',
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
  houMeOpDeHoogteMail: 'Ja, hou mij op de hoogte. Laat het me weten zodra de app in de winkel staat.',

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
  gesTitel: 'L’histoire du Maroc en quatorze moments',
  gesLead: 'D’une ville romaine dans les collines à l’alphabet devenu officiel en 2011. Quatorze fois court, dans l’ordre, et tout ce qui est écrit ici a été vérifié. Pour les enfants à partir de huit ans — et pour le parent qui ne l’a jamais appris.',
  gesWist: 'Le savais-tu ?',
  gesSlot: 'Ces quatorze récits sont aussi dans l’application : après chaque test, votre enfant en reçoit un, lu à voix haute dans sa langue.',
  naamTitel: 'Le prénom de votre enfant en écriture arabe',
  naamLead: 'Tapez le prénom et voyez-le apparaître comme on l’écrit au Maroc. Enregistrez-le, partagez-le, accrochez-le — il est à vous, gratuitement.',
  naamLabel: 'Le prénom',
  naamPlaceholder: 'Par exemple Amir',
  naamKnop: 'Afficher',
  naamOpslaan: 'Enregistrer l’image',
  naamOnbekend: 'Ce prénom n’est pas encore dans la liste. Chaque prénom est vérifié à la main — la conversion automatique se trompe justement sur les prénoms marocains. Demandez-le et il y sera dans quelques jours.',
  naamAanvragen: 'Demander ce prénom',
  naamUitleg: 'Cent quatre-vingts prénoms marocains, vérifiés un par un. Rien n’est enregistré ni envoyé : le prénom reste dans votre navigateur.',
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
  houMeOpDeHoogteMail: 'Oui, tenez-moi au courant. Prévenez-moi dès que l’application est disponible.',

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
  gesTitel: 'Die Geschichte Marokkos in vierzehn Momenten',
  gesLead: 'Von einer römischen Stadt in den Hügeln bis zum Alphabet, das 2011 amtlich wurde. Vierzehnmal kurz, der Reihe nach, und alles darin ist geprüft. Für Kinder ab etwa acht — und für die Eltern, die es selbst nie gelernt haben.',
  gesWist: 'Wusstest du schon?',
  gesSlot: 'Diese vierzehn Geschichten stecken auch in der App: nach jedem Test bekommt dein Kind eine, vorgelesen in seiner Sprache.',
  naamTitel: 'Der Name deines Kindes in arabischer Schrift',
  naamLead: 'Tippe den Namen ein und sieh ihn so, wie er in Marokko geschrieben wird. Speichern, weiterschicken, aufhängen — er gehört dir, kostenlos.',
  naamLabel: 'Der Name',
  naamPlaceholder: 'Zum Beispiel Amir',
  naamKnop: 'Anzeigen',
  naamOpslaan: 'Bild speichern',
  naamOnbekend: 'Dieser Name steht noch nicht in der Liste. Jeder Name wird von Hand geprüft — automatische Umschrift geht gerade bei marokkanischen Namen schief. Frag ihn an, dann steht er in ein paar Tagen dabei.',
  naamAanvragen: 'Diesen Namen anfragen',
  naamUitleg: 'Hundertachtzig marokkanische Namen, einzeln geprüft. Es wird nichts gespeichert und nichts gesendet: der Name bleibt in deinem Browser.',
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
  houMeOpDeHoogteMail: 'Ja, haltet mich auf dem Laufenden. Sagt mir Bescheid, sobald die App im Store steht.',

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
  gesTitel: 'La historia de Marruecos en catorce momentos',
  gesLead: 'De una ciudad romana en las colinas al alfabeto que se hizo oficial en 2011. Catorce veces breve, en orden, y todo lo que hay aquí está comprobado. Para niños a partir de los ocho años — y para el padre que nunca lo aprendió.',
  gesWist: '¿Sabías que...?',
  gesSlot: 'Estos catorce relatos también están en la aplicación: después de cada test tu hijo recibe uno, leído en voz alta en su idioma.',
  naamTitel: 'El nombre de tu hijo en escritura árabe',
  naamLead: 'Escribe el nombre y velo aparecer como se escribe en Marruecos. Guárdalo, compártelo, cuélgalo — es tuyo, gratis.',
  naamLabel: 'El nombre',
  naamPlaceholder: 'Por ejemplo Amir',
  naamKnop: 'Mostrar',
  naamOpslaan: 'Guardar la imagen',
  naamOnbekend: 'Este nombre aún no está en la lista. Cada nombre se revisa a mano: la conversión automática falla justo con los nombres marroquíes. Pídelo y estará en unos días.',
  naamAanvragen: 'Pedir este nombre',
  naamUitleg: 'Ciento ochenta nombres marroquíes, revisados uno a uno. No se guarda ni se envía nada: el nombre se queda en tu navegador.',
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
  houMeOpDeHoogteMail: 'Sí, mantenme informado. Avísame en cuanto la aplicación esté en la tienda.',

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
  gesTitel: 'La storia del Marocco in quattordici momenti',
  gesLead: 'Da una città romana sulle colline all’alfabeto diventato ufficiale nel 2011. Quattordici volte breve, in ordine, e tutto quello che c’è scritto è verificato. Per bambini dagli otto anni — e per il genitore che non l’ha mai imparato.',
  gesWist: 'Lo sapevi?',
  gesSlot: 'Questi quattordici racconti sono anche nell’app: dopo ogni test tuo figlio ne riceve uno, letto ad alta voce nella sua lingua.',
  naamTitel: 'Il nome di tuo figlio in scrittura araba',
  naamLead: 'Scrivi il nome e guardalo apparire come si scrive in Marocco. Salvalo, mandalo, appendilo — è tuo, gratis.',
  naamLabel: 'Il nome',
  naamPlaceholder: 'Per esempio Amir',
  naamKnop: 'Mostra',
  naamOpslaan: 'Salva l’immagine',
  naamOnbekend: 'Questo nome non è ancora nell’elenco. Ogni nome è controllato a mano: la conversione automatica sbaglia proprio sui nomi marocchini. Richiedilo e ci sarà entro pochi giorni.',
  naamAanvragen: 'Richiedi questo nome',
  naamUitleg: 'Centottanta nomi marocchini, controllati uno per uno. Non viene salvato né inviato nulla: il nome resta nel tuo browser.',
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
  houMeOpDeHoogteMail: 'Sì, tenetemi aggiornato. Fatemi sapere appena l’app è nel negozio.',

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
  gesTitel: 'The history of Morocco in fourteen moments',
  gesLead: 'From a Roman town in the hills to the alphabet that became official in 2011. Fourteen short pieces, in order, and everything in them has been checked. For children from about eight — and for the parent who never learnt it either.',
  gesWist: 'Did you know?',
  gesSlot: 'These fourteen stories are in the app as well: after every test your child gets one, read aloud in their own language.',
  naamTitel: 'Your child’s name in Arabic script',
  naamLead: 'Type the name and watch it appear the way it is written in Morocco. Save it, send it, put it on the wall — it is yours, free.',
  naamLabel: 'The name',
  naamPlaceholder: 'For example Amir',
  naamKnop: 'Show me',
  naamOpslaan: 'Save the image',
  naamOnbekend: 'This name is not in the list yet. Every name is checked by hand — automatic transliteration goes wrong on exactly the Moroccan names that matter. Ask for it and it will be there within a few days.',
  naamAanvragen: 'Ask for this name',
  naamUitleg: 'A hundred and eighty Moroccan names, each one checked by hand. Nothing is stored and nothing is sent: the name stays in your own browser.',
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
  houMeOpDeHoogteMail: 'Yes, keep me posted. Let me know as soon as the app is in the store.',

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
