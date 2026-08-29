import {
  activitySuggestionSchema,
  educationalArticleSchema,
  type ActivitySuggestion,
  type EducationalArticle,
} from '@focusfamily/domain';

const updatedAt = new Date('2026-02-01T00:00:00Z');

/**
 * The offline activity packs. Everything here works with no screen, no
 * subscription and no preparation beyond what a house usually has.
 */
export const ACTIVITY_SUGGESTIONS: ActivitySuggestion[] = [
  {
    id: 'act_walk_photo_hunt',
    category: 'outdoors',
    title: {
      nl: 'Kijkwandeling van tien dingen',
      en: 'Ten-things walk',
    },
    body: {
      nl: 'Spreek tien dingen af die je onderweg wilt zien: een rode deur, een kat, iets van hout. Wie ze het eerst allemaal heeft, kiest de route terug.',
      en: 'Agree on ten things to spot on the way: a red door, a cat, something wooden. Whoever finds them all first picks the route home.',
    },
    minutes: 30,
    minAge: 6,
    maxAge: 99,
    needsAdult: true,
    pack: 'core',
    questlyRef: null,
  },
  {
    id: 'act_one_pan_dinner',
    category: 'kitchen',
    title: { nl: 'Eén pan, iedereen een taak', en: 'One pan, everyone a job' },
    body: {
      nl: 'Kies een gerecht dat in één pan past. Verdeel snijden, roeren, dekken en afwassen voordat je begint, zodat niemand hoeft te vragen wat hij moet doen.',
      en: 'Pick something that fits in one pan. Hand out chopping, stirring, laying the table and washing up before you start, so nobody has to ask what to do.',
    },
    minutes: 45,
    minAge: 8,
    maxAge: 99,
    needsAdult: true,
    pack: 'core',
    questlyRef: null,
  },
  {
    id: 'act_two_truths',
    category: 'talking',
    title: { nl: 'Twee waarheden en een verzinsel', en: 'Two truths and one made up' },
    body: {
      nl: 'Iedereen vertelt drie dingen over de eigen dag; één ervan is verzonnen. De rest raadt welke. Goed voor aan tafel, ook als iemand weinig zin heeft om te praten.',
      en: 'Everyone tells three things about their day; one is made up. The others guess which. It works at the table, even when someone does not feel like talking much.',
    },
    minutes: 15,
    minAge: 6,
    maxAge: 99,
    needsAdult: false,
    pack: 'core',
    questlyRef: null,
  },
  {
    id: 'act_card_tournament',
    category: 'games',
    title: { nl: 'Kaarttoernooi van drie rondes', en: 'Three-round card tournament' },
    body: {
      nl: 'Drie korte potjes van hetzelfde spel, punten optellen aan het eind. Kort genoeg om nog een keer te willen, lang genoeg om echt even weg te zijn van schermen.',
      en: 'Three short rounds of the same game, points added up at the end. Short enough to want another, long enough to really be away from screens.',
    },
    minutes: 30,
    minAge: 7,
    maxAge: 99,
    needsAdult: false,
    pack: 'core',
    questlyRef: null,
  },
  {
    id: 'act_repair_something',
    category: 'making',
    title: { nl: 'Repareer iets samen', en: 'Fix something together' },
    body: {
      nl: 'Zoek iets in huis dat kapot of los zit en maak het samen. Een fietsband, een la die klemt, een knoop aan een jas. Het resultaat blijft zichtbaar.',
      en: 'Find something in the house that is broken or loose and fix it together. A bike tyre, a sticking drawer, a button on a coat. The result stays visible.',
    },
    minutes: 45,
    minAge: 9,
    maxAge: 99,
    needsAdult: true,
    pack: 'core',
    questlyRef: null,
  },
  {
    id: 'act_ten_minute_stretch',
    category: 'movement',
    title: { nl: 'Tien minuten losmaken', en: 'Ten minutes of loosening up' },
    body: {
      nl: 'Zet muziek op en doe tien minuten rekken en strekken, om de beurt kiest iemand een beweging. Werkt goed als overgang tussen huiswerk en avondeten.',
      en: 'Put music on and stretch for ten minutes, taking turns to choose a move. It works well as the switch between homework and dinner.',
    },
    minutes: 10,
    minAge: 6,
    maxAge: 99,
    needsAdult: false,
    pack: 'core',
    questlyRef: null,
  },
  {
    id: 'act_night_sky',
    category: 'outdoors',
    title: { nl: 'Vijf minuten naar boven kijken', en: 'Five minutes looking up' },
    body: {
      nl: 'Ga na het eten naar buiten en kijk vijf minuten omhoog. Tel vliegtuigen, wolken of sterren. Kort, en verrassend rustig om mee af te sluiten.',
      en: 'Step outside after dinner and look up for five minutes. Count planes, clouds or stars. Short, and a surprisingly calm way to end the day.',
    },
    minutes: 5,
    minAge: 6,
    maxAge: 99,
    needsAdult: false,
    pack: 'core',
    questlyRef: null,
  },
  {
    id: 'act_family_playlist',
    category: 'making',
    title: { nl: 'Gezinsplaylist op papier', en: 'Family playlist on paper' },
    body: {
      nl: 'Iedereen schrijft drie nummers op een briefje. Je luistert ze samen zonder telefoon in de hand en vertelt waarom je ze koos.',
      en: 'Everyone writes down three songs on a slip of paper. You listen together with no phone in hand and say why you picked them.',
    },
    minutes: 30,
    minAge: 8,
    maxAge: 99,
    needsAdult: true,
    pack: 'extra',
    questlyRef: null,
  },
  {
    id: 'act_bake_without_recipe',
    category: 'kitchen',
    title: { nl: 'Bakken zonder recept', en: 'Baking without a recipe' },
    body: {
      nl: 'Bak iets eenvoudigs waarbij niemand op een scherm kijkt. Fout gaat het soms, en dat is meestal het leukste deel van het verhaal achteraf.',
      en: 'Bake something simple with nobody looking at a screen. It sometimes goes wrong, and that is usually the best part of the story afterwards.',
    },
    minutes: 60,
    minAge: 8,
    maxAge: 99,
    needsAdult: true,
    pack: 'extra',
    questlyRef: null,
  },
  {
    id: 'act_interview_a_grownup',
    category: 'talking',
    title: { nl: 'Interview een volwassene', en: 'Interview a grown-up' },
    body: {
      nl: 'Het kind bedenkt tien vragen over hoe het vroeger was en stelt ze aan een volwassene. Daarna wisselen jullie om.',
      en: 'The child writes ten questions about how things used to be and asks a grown-up. Then you swap around.',
    },
    minutes: 25,
    minAge: 8,
    maxAge: 17,
    needsAdult: true,
    pack: 'extra',
    questlyRef: null,
  },
  {
    id: 'act_build_a_track',
    category: 'making',
    title: { nl: 'Bouw een knikkerbaan', en: 'Build a marble run' },
    body: {
      nl: 'Gebruik kartonnen kokers, boeken en tape. De baan moet minstens drie bochten hebben. Iedereen mag één regel verzinnen.',
      en: 'Use cardboard tubes, books and tape. The run needs at least three bends. Everyone gets to invent one rule.',
    },
    minutes: 45,
    minAge: 6,
    maxAge: 14,
    needsAdult: false,
    pack: 'extra',
    questlyRef: null,
  },
  {
    id: 'act_evening_walk_talk',
    category: 'movement',
    title: { nl: 'Blokje om met één vraag', en: 'Round the block with one question' },
    body: {
      nl: 'Loop een blokje om met één vraag die je onderweg beantwoordt. Naast elkaar lopen maakt praten makkelijker dan tegenover elkaar zitten.',
      en: 'Walk round the block with one question to answer on the way. Walking side by side makes talking easier than sitting face to face.',
    },
    minutes: 20,
    minAge: 8,
    maxAge: 99,
    needsAdult: true,
    pack: 'core',
    questlyRef: null,
  },
].map((activity) => activitySuggestionSchema.parse(activity));

/**
 * The parent library. Written to be read in one sitting, with an explicit note
 * about where the guidance comes from and a reminder that the app is not a
 * health service.
 */
export const EDUCATIONAL_ARTICLES: EducationalArticle[] = [
  {
    id: 'art_social_media',
    slug: 'social-media-en-vergelijken',
    topic: 'social_media',
    title: {
      nl: 'Sociale media: vergelijken doet meer dan schermtijd',
      en: 'Social media: comparing matters more than screen time',
    },
    summary: {
      nl: 'Hoe lang iemand scrolt zegt minder dan wat hij tijdens het scrollen voelt. Een paar vragen die verder komen dan een tijdslimiet.',
      en: 'How long someone scrolls says less than how they feel while scrolling. A few questions that get further than a time limit.',
    },
    body: {
      nl: [
        'Ouders vragen ons vaak naar het juiste aantal minuten. Dat is begrijpelijk, maar het is zelden de vraag die het gesprek verder brengt. Twee kinderen kunnen even lang op dezelfde app zitten en er totaal anders uitkomen.',
        'Wat vaker uitmaakt: kijkt iemand vooral naar mensen die hij kent, of naar onbekenden die alles beter lijken te doen? Wordt er gereageerd en gelachen, of alleen gekeken? Voelt iemand zich na een half uur opgeladen of leeg?',
        'Een bruikbare vraag aan tafel is: "Wie zag je vandaag voorbijkomen waar je vrolijk van werd?" Die vraag gaat over inhoud in plaats van over tijd, en hij is makkelijker te beantwoorden dan "hoe lang zat je erop".',
        'Spreek ook iets af voor jezelf. Als een kind ziet dat een volwassene tijdens het eten wegkijkt naar een telefoon, weegt dat zwaarder dan welke regel dan ook die op papier staat.',
        'Merk je dat iemand er structureel somberder van wordt, praat dan met de huisarts of de mentor op school. FocusFamily is een hulpmiddel voor afspraken, geen zorgverlener.',
      ],
      en: [
        'Parents often ask us for the right number of minutes. That is understandable, but it is rarely the question that moves the conversation forward. Two children can spend the same time in the same app and come out of it completely differently.',
        'What matters more often: is someone mostly looking at people they know, or at strangers who seem to do everything better? Is there replying and laughing, or only watching? Does someone feel charged up or emptied out after half an hour?',
        'A useful question at the table is: "Who did you see today that made you smile?" That asks about content rather than time, and it is easier to answer than "how long were you on it".',
        'Agree something for yourself too. If a child sees a grown-up glance away at a phone during dinner, that weighs more than any rule written on paper.',
        'If you notice that someone is consistently more down because of it, talk to your GP or their mentor at school. FocusFamily is a tool for making agreements, not a care provider.',
      ],
    },
    readMinutes: 4,
    audience: 'guardian',
    sourceNote: {
      nl: 'Gebaseerd op algemene richtlijnen van het Nederlands Jeugdinstituut en de American Academy of Pediatrics over mediagebruik in gezinnen.',
      en: 'Based on general guidance from the Netherlands Youth Institute and the American Academy of Pediatrics on family media use.',
    },
    updatedAt,
  },
  {
    id: 'art_gaming',
    slug: 'gamen-en-stoppen',
    topic: 'gaming',
    title: {
      nl: 'Gamen: het gaat bijna altijd over het stopmoment',
      en: 'Gaming: it is almost always about the stopping point',
    },
    summary: {
      nl: 'De meeste ruzies over gamen gaan niet over gamen, maar over onverwacht moeten stoppen. Dat is oplosbaar.',
      en: 'Most arguments about gaming are not about gaming, they are about having to stop unexpectedly. That is fixable.',
    },
    body: {
      nl: [
        'Veel spellen zijn zo gebouwd dat stoppen midden in een ronde je team benadeelt. Wie dan "nu meteen" hoort, kiest tussen twee dingen die allebei vervelend zijn.',
        'Spreek daarom af in rondes of levels in plaats van in minuten. "Deze pot afmaken en dan eten" werkt bijna altijd beter dan "over vijf minuten".',
        'Geef een waarschuwing die past bij het spel. Vraag je kind zelf hoeveel tijd een ronde kost; dat antwoord is meestal eerlijk en het maakt de afspraak van hem.',
        'Kijk af en toe mee zonder commentaar te geven. Tien minuten meekijken levert meer op dan tien vragen achteraf, en het maakt het gesprek erover een stuk makkelijker.',
        'Maak dezelfde afspraak voor jezelf over series of werkmail. Onderbroken worden midden in iets is voor iedereen vervelend, ook voor volwassenen.',
      ],
      en: [
        'Many games are built so that stopping mid-round puts your team at a disadvantage. Someone told "right now" is choosing between two things that are both unpleasant.',
        'So agree in rounds or levels rather than in minutes. "Finish this match and then dinner" almost always works better than "five more minutes".',
        'Give a warning that fits the game. Ask your child how long a round takes; the answer is usually honest, and it makes the agreement theirs.',
        'Watch along now and then without commenting. Ten minutes of watching gets you further than ten questions afterwards, and it makes talking about it much easier.',
        'Make the same agreement for yourself about series or work email. Being interrupted mid-something is unpleasant for everyone, grown-ups included.',
      ],
    },
    readMinutes: 4,
    audience: 'guardian',
    sourceNote: {
      nl: 'Gebaseerd op algemene adviezen van het Trimbos-instituut over gamen in gezinnen.',
      en: 'Based on general advice from the Trimbos Institute on gaming within families.',
    },
    updatedAt,
  },
  {
    id: 'art_sleep',
    slug: 'slaap-en-de-oplader',
    topic: 'sleep',
    title: { nl: 'Slaap: begin bij de oplader', en: 'Sleep: start with the charger' },
    summary: {
      nl: 'De plek waar telefoons opladen verandert avonden sneller dan welke tijdslimiet dan ook.',
      en: 'Where phones charge changes evenings faster than any time limit does.',
    },
    body: {
      nl: [
        'Een telefoon naast het bed is de makkelijkste manier om per ongeluk een uur later te gaan slapen. Niet omdat iemand dat wil, maar omdat er altijd nog iets is.',
        'Zet één oplaadplek in huis, bij voorkeur beneden. Doe dat voor het hele gezin tegelijk; een regel die alleen voor kinderen geldt houdt zelden stand.',
        'Koop een goedkope wekker voor wie de telefoon als wekker gebruikt. Dat kost weinig en haalt het laatste praktische argument weg.',
        'Verwacht een week of twee gemopper. Dat hoort erbij en zegt niets over of het werkt. Kijk na twee weken samen of de avonden rustiger voelen.',
        'Blijft iemand slecht slapen, bespreek dat met de huisarts. Deze app meet geen slaap en doet geen uitspraken over gezondheid; hij helpt alleen om een afspraak vol te houden.',
      ],
      en: [
        'A phone next to the bed is the easiest way to accidentally go to sleep an hour later. Not because anyone wants to, but because there is always one more thing.',
        'Set up one charging spot in the house, preferably downstairs. Do it for the whole family at once; a rule that applies only to children rarely lasts.',
        'Buy a cheap alarm clock for anyone who uses their phone to wake up. It costs little and removes the last practical objection.',
        'Expect a week or two of grumbling. That is part of it and says nothing about whether it works. After two weeks, check together whether evenings feel calmer.',
        'If someone keeps sleeping badly, discuss it with your GP. This app does not measure sleep and makes no statements about health; it only helps you keep an agreement.',
      ],
    },
    readMinutes: 3,
    audience: 'guardian',
    sourceNote: {
      nl: 'Gebaseerd op algemene slaapadviezen van het Nederlands Centrum Jeugdgezondheid.',
      en: 'Based on general sleep guidance from the Netherlands Centre for Youth Health.',
    },
    updatedAt,
  },
  {
    id: 'art_conversations',
    slug: 'gesprekken-die-verder-komen',
    topic: 'conversations',
    title: {
      nl: 'Gesprekken die verder komen dan "doe die telefoon weg"',
      en: 'Conversations that get further than "put that phone away"',
    },
    summary: {
      nl: 'Vier manieren om een gesprek te beginnen waarin niemand zich hoeft te verdedigen.',
      en: 'Four ways to start a conversation where nobody has to defend themselves.',
    },
    body: {
      nl: [
        'Begin naast elkaar in plaats van tegenover elkaar. In de auto, tijdens de afwas of tijdens een blokje om zegt een kind vaak meer dan aan tafel met oogcontact.',
        'Stel een vraag waarop je het antwoord niet weet. "Wat vind jij een goede afspraak voor de avond?" levert meer op dan "vind je ook niet dat het te veel is?".',
        'Zeg wat je zelf lastig vindt. Als je vertelt dat jij ook moeite hebt om je telefoon weg te leggen, verandert het gesprek van een beoordeling in een probleem dat jullie delen.',
        'Kies één ding tegelijk. Een gezin dat drie dingen tegelijk verandert houdt er meestal nul over; één afspraak die een maand standhoudt is meer waard.',
        'Sluit af met iets concreets. Niet "we gaan er beter op letten", maar "vanaf maandag laden we beneden op en kijken we zondag hoe het ging".',
      ],
      en: [
        'Start side by side rather than face to face. In the car, doing the washing up or on a walk, a child often says more than at the table with eye contact.',
        'Ask a question you do not know the answer to. "What would you say is a good agreement for the evening?" gets further than "do you not think it is too much?".',
        'Say what you find hard yourself. If you mention that you also struggle to put your phone down, the conversation changes from a judgement into a problem you share.',
        'Pick one thing at a time. A family that changes three things at once usually keeps none of them; one agreement that lasts a month is worth more.',
        'Finish with something concrete. Not "we will pay more attention", but "from Monday we charge downstairs and on Sunday we look at how it went".',
      ],
    },
    readMinutes: 3,
    audience: 'everyone',
    sourceNote: {
      nl: 'Gebaseerd op gespreksmethodes uit oudertrainingen, zoals motiverende gespreksvoering.',
      en: 'Based on conversation methods from parenting programmes, such as motivational interviewing.',
    },
    updatedAt,
  },
  {
    id: 'art_school',
    slug: 'huiswerk-en-afleiding',
    topic: 'school',
    title: { nl: 'Huiswerk: afleiding is geen karakterkwestie', en: 'Homework: distraction is not a character flaw' },
    summary: {
      nl: 'Waarom een telefoon in dezelfde kamer al meetelt, en wat je eraan doet zonder ruzie.',
      en: 'Why a phone in the same room already counts, and what to do about it without a row.',
    },
    body: {
      nl: [
        'Een telefoon hoeft niet op te lichten om af te leiden. Alleen al weten dat hij er ligt kost aandacht; dat geldt voor volwassenen net zo goed.',
        'Spreek een vaste plek af waar telefoons tijdens het huiswerkuur liggen, in een andere kamer. Doe dat ook met de jouwe als je in dezelfde ruimte werkt.',
        'Werk met blokken van vijfentwintig minuten en een korte pauze. Kort en af is beter dan lang en half; het focusmoment in deze app is daarvoor bedoeld.',
        'Laat het kind zelf de lengte kiezen binnen wat jullie afspreken. Meedoen aan de afspraak maakt het volhouden makkelijker dan hem opgelegd krijgen.',
        'Lukt het een keer niet, ga dan niet terug naar het begin. Eén keer overslaan is normaal; de afspraak blijft gewoon staan.',
      ],
      en: [
        'A phone does not have to light up to distract. Simply knowing it is there costs attention; that goes for grown-ups just as much.',
        'Agree a fixed spot where phones sit during homework hour, in another room. Do the same with yours if you work in the same space.',
        'Work in blocks of twenty-five minutes with a short break. Short and finished beats long and half-done; the focus moment in this app is built for that.',
        'Let the child pick the length within what you agree. Taking part in the agreement makes it easier to keep than having it handed down.',
        'If it does not work one day, do not go back to the start. Skipping once is normal; the agreement simply stays as it is.',
      ],
    },
    readMinutes: 3,
    audience: 'guardian',
    sourceNote: {
      nl: 'Gebaseerd op algemeen onderzoek naar aandacht en afleiding tijdens leren.',
      en: 'Based on general research into attention and distraction while studying.',
    },
    updatedAt,
  },
  {
    id: 'art_privacy',
    slug: 'meekijken-of-afspreken',
    topic: 'privacy',
    title: { nl: 'Meekijken of afspreken?', en: 'Monitoring or agreeing?' },
    summary: {
      nl: 'Waarom FocusFamily geen berichten leest, en wat je in plaats daarvan kunt doen.',
      en: 'Why FocusFamily does not read messages, and what you can do instead.',
    },
    body: {
      nl: [
        'Er bestaan apps die berichten, websites en locatie doorsturen naar een ouder. Wij bouwen dat niet. Niet alleen omdat het wettelijk nauw luistert, maar omdat het meestal het tegenovergestelde oplevert van wat een ouder zoekt.',
        'Zodra een kind merkt dat er stiekem wordt meegekeken, verhuist het gesprek naar een plek waar jij niet meekijkt. Het onderwerp verdwijnt niet, alleen jouw uitnodiging om erover te praten.',
        'Wat FocusFamily wel doet: iedereen ziet welke afspraken gelden en wat er wordt bijgehouden, ook de kinderen. Er staat een lijst in de app van dingen die we nooit meten.',
        'Dagtotalen per brede categorie kunnen we alleen tonen als het besturingssysteem ze geeft én iedereen die het aangaat ja heeft gezegd. Zonder dat laten we liever niets zien dan een schatting.',
        'Maak je je zorgen over iets specifieks, bespreek het dan rechtstreeks of schakel de mentor of de huisarts in. Meelezen is daar geen vervanging voor.',
      ],
      en: [
        'There are apps that forward messages, websites and location to a parent. We do not build that. Not only because the law is strict about it, but because it usually produces the opposite of what a parent is looking for.',
        'The moment a child notices they are being watched in secret, the conversation moves somewhere you cannot see. The subject does not disappear, only your invitation to talk about it.',
        'What FocusFamily does instead: everyone sees which agreements apply and what is being recorded, children included. There is a list in the app of things we never measure.',
        'We can show daily totals per broad category only when the operating system provides them and everyone involved has said yes. Without that, we would rather show nothing than an estimate.',
        'If you are worried about something specific, raise it directly or involve a mentor or your GP. Reading along is no substitute for that.',
      ],
    },
    readMinutes: 4,
    audience: 'everyone',
    sourceNote: {
      nl: 'Gebaseerd op de AVG-uitgangspunten voor gegevens van kinderen en op de eigen ontwerpkeuzes in PRIVACY_MODEL.md.',
      en: 'Based on GDPR principles for children’s data and on the design choices documented in PRIVACY_MODEL.md.',
    },
    updatedAt,
  },
].map((article) => educationalArticleSchema.parse(article));
