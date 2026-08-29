// Content for the SkillPass development seed. Kept apart from the seeding logic
// so the catalogue can be reviewed and translated on its own.

export type SeedCategory =
  | 'SPORTS'
  | 'MUSIC'
  | 'COOKING'
  | 'ART'
  | 'CRAFTS'
  | 'TECHNOLOGY'
  | 'NATURE'
  | 'THEATRE'
  | 'PRACTICAL_SKILLS'
  | 'DANCE'
  | 'LANGUAGES'
  | 'SCIENCE';

export type SeedAgeBand = 'AGE_6_8' | 'AGE_9_11' | 'AGE_12_14' | 'AGE_15_17';

export interface SeedProvider {
  slug: string;
  legalName: string;
  displayName: string;
  descriptionNl: string;
  kvk: string;
  contactPersonName: string;
  contactEmail: string;
  venueName: string;
  addressLine1: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  wheelchairAccessible: boolean;
  /** Left PENDING_REVIEW so the admin verification queue is not empty. */
  pending?: boolean;
}

export const PROVIDERS: SeedProvider[] = [
  {
    slug: 'sportclub-de-vechtstroom',
    legalName: 'Sportclub De Vechtstroom V.O.F.',
    displayName: 'Sportclub De Vechtstroom',
    descriptionNl: 'Breedtesportvereniging in Zuilen met turnen, judo en klimmen voor de jeugd.',
    kvk: '30112233',
    contactPersonName: 'Meryem El Amrani',
    contactEmail: 'info@vechtstroom.local',
    venueName: 'Sporthal De Vechtstroom',
    addressLine1: 'Amsterdamsestraatweg 512',
    postalCode: '3555 HW',
    latitude: 52.1118,
    longitude: 5.0836,
    wheelchairAccessible: true,
  },
  {
    slug: 'muziekhuis-lombok',
    legalName: 'Stichting Muziekhuis Lombok',
    displayName: 'Muziekhuis Lombok',
    descriptionNl: 'Buurtmuziekschool met gitaar, keyboard en percussie in kleine groepen.',
    kvk: '30112234',
    contactPersonName: 'Joost Verhagen',
    contactEmail: 'hallo@muziekhuislombok.local',
    venueName: 'Muziekhuis Lombok',
    addressLine1: 'Kanaalstraat 88',
    postalCode: '3531 CE',
    latitude: 52.0895,
    longitude: 5.0999,
    wheelchairAccessible: false,
  },
  {
    slug: 'kookstudio-de-pan',
    legalName: 'Kookstudio De Pan B.V.',
    displayName: 'Kookstudio De Pan',
    descriptionNl: 'Kookworkshops voor kinderen: van gezond ontbijt tot eigen pizzadeeg.',
    kvk: '30112235',
    contactPersonName: 'Sanne de Wit',
    contactEmail: 'workshops@depan.local',
    venueName: 'Kookstudio De Pan',
    addressLine1: 'Oudegracht 214',
    postalCode: '3511 NR',
    latitude: 52.0894,
    longitude: 5.1101,
    wheelchairAccessible: true,
  },
  {
    slug: 'atelier-noord',
    legalName: 'Atelier Noord Eenmanszaak',
    displayName: 'Atelier Noord',
    descriptionNl: 'Beeldend atelier in Overvecht voor tekenen, schilderen en keramiek.',
    kvk: '30112236',
    contactPersonName: 'Petra Bakker',
    contactEmail: 'atelier@ateliernoord.local',
    venueName: 'Atelier Noord',
    addressLine1: 'Carnegiedreef 12',
    postalCode: '3565 BJ',
    latitude: 52.1176,
    longitude: 5.1063,
    wheelchairAccessible: true,
  },
  {
    slug: 'makerslab-utrecht',
    legalName: 'MakersLab Utrecht B.V.',
    displayName: 'MakersLab Utrecht',
    descriptionNl: 'Techniekwerkplaats met 3D-printen, robotica en programmeren.',
    kvk: '30112237',
    contactPersonName: 'Daan Wolters',
    contactEmail: 'lab@makerslab.local',
    venueName: 'MakersLab Werkplaats',
    addressLine1: 'Vleutenseweg 340',
    postalCode: '3532 HR',
    latitude: 52.0942,
    longitude: 5.0421,
    wheelchairAccessible: true,
  },
  {
    slug: 'natuurgroep-de-haar',
    legalName: 'Natuurgroep De Haar',
    displayName: 'Natuurgroep De Haar',
    descriptionNl: 'Buitenclub die kinderen leert sporen zoeken, vuur maken en bushcraften.',
    kvk: '30112238',
    contactPersonName: 'Ruben Jansen',
    contactEmail: 'buiten@dehaar.local',
    venueName: 'Buitencentrum De Haar',
    addressLine1: 'Haarzuilensedijk 3',
    postalCode: '3455 RJ',
    latitude: 52.1054,
    longitude: 4.9992,
    wheelchairAccessible: false,
  },
  {
    slug: 'theaterwerkplaats-oost',
    legalName: 'Theaterwerkplaats Oost',
    displayName: 'Theaterwerkplaats Oost',
    descriptionNl: 'Improvisatie, toneel en musical voor kinderen die het podium op willen.',
    kvk: '30112239',
    contactPersonName: 'Lieke Smulders',
    contactEmail: 'spelen@twoost.local',
    venueName: 'Theaterzaal Oost',
    addressLine1: 'Maliesingel 22',
    postalCode: '3581 BE',
    latitude: 52.0862,
    longitude: 5.1258,
    wheelchairAccessible: true,
  },
  {
    slug: 'dansstudio-cadence',
    legalName: 'Dansstudio Cadence B.V.',
    displayName: 'Dansstudio Cadence',
    descriptionNl: 'Hiphop, streetdance en moderne dans in een studio zonder spiegelstress.',
    kvk: '30112240',
    contactPersonName: 'Naomi Fernandes',
    contactEmail: 'dans@cadence.local',
    venueName: 'Studio Cadence',
    addressLine1: 'Croeselaan 120',
    postalCode: '3521 CG',
    latitude: 52.0851,
    longitude: 5.1027,
    wheelchairAccessible: true,
  },
  {
    slug: 'taalclub-utrecht',
    legalName: 'Taalclub Utrecht',
    displayName: 'Taalclub Utrecht',
    descriptionNl: 'Speelse taallessen Engels en Spaans, met veel spel en weinig grammatica.',
    kvk: '30112241',
    contactPersonName: 'Marta Ruiz',
    contactEmail: 'hola@taalclub.local',
    venueName: 'Taalclub Leslokaal',
    addressLine1: 'Nachtegaalstraat 44',
    postalCode: '3581 AE',
    latitude: 52.0888,
    longitude: 5.1259,
    wheelchairAccessible: false,
  },
  {
    slug: 'sterrenlab',
    legalName: 'Stichting Sterrenlab',
    displayName: 'Sterrenlab',
    descriptionNl: 'Wetenschapsclub met proefjes, sterrenkijken en een eigen mini-laboratorium.',
    kvk: '30112242',
    contactPersonName: 'Ingrid Postma',
    contactEmail: 'lab@sterrenlab.local',
    venueName: 'Sterrenlab',
    addressLine1: 'Zonnebaan 9',
    postalCode: '3542 EA',
    latitude: 52.1015,
    longitude: 5.0691,
    wheelchairAccessible: true,
  },
  {
    slug: 'handwerkhuis-de-draad',
    legalName: 'Handwerkhuis De Draad',
    displayName: 'Handwerkhuis De Draad',
    descriptionNl: 'Naaien, weven en houtbewerking — met echte gereedschappen en veel geduld.',
    kvk: '30112243',
    contactPersonName: 'Truus Hendriks',
    contactEmail: 'post@dedraad.local',
    venueName: 'Handwerkhuis De Draad',
    addressLine1: 'Rijnlaan 77',
    postalCode: '3522 BM',
    latitude: 52.0785,
    longitude: 5.1109,
    wheelchairAccessible: true,
  },
  {
    slug: 'levensles-utrecht',
    legalName: 'Levensles Utrecht',
    displayName: 'Levensles Utrecht',
    descriptionNl: 'Praktische vaardigheden voor tieners: fietsreparatie, geldzaken en EHBO.',
    kvk: '30112244',
    contactPersonName: 'Bram Koster',
    contactEmail: 'info@levensles.local',
    venueName: 'Buurtwerkplaats Levensles',
    addressLine1: 'Kaap Hoorndreef 60',
    postalCode: '3563 AT',
    latitude: 52.1122,
    longitude: 5.1206,
    wheelchairAccessible: true,
    pending: true,
  },
];

export interface SeedActivity {
  providerSlug: string;
  category: SeedCategory;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  minAgeBand: SeedAgeBand;
  maxAgeBand: SeedAgeBand;
  creditCost: number;
  listPriceCents: number;
  languages: ('NL' | 'EN')[];
  wheelchairAccessible?: boolean;
  sensoryFriendly?: boolean;
  trialAvailable?: boolean;
  equipmentProvided?: boolean;
  cancellationHours?: number;
  interests: string[];
  seats: number;
  nl: { title: string; summary: string; description: string; whatToBring?: string; safetyNotes?: string };
  en: { title: string; summary: string; description: string; whatToBring?: string; safetyNotes?: string };
}

export const ACTIVITIES: SeedActivity[] = [
  {
    providerSlug: 'sportclub-de-vechtstroom',
    category: 'SPORTS',
    level: 'BEGINNER',
    minAgeBand: 'AGE_6_8',
    maxAgeBand: 'AGE_9_11',
    creditCost: 2,
    listPriceCents: 1200,
    languages: ['NL'],
    trialAvailable: true,
    wheelchairAccessible: true,
    interests: ['gymnastics', 'ball-sports'],
    seats: 12,
    nl: {
      title: 'Turnen voor beginners',
      summary: 'Rollen, springen en klimmen in een veilige turnzaal.',
      description:
        'In deze les leren kinderen de basis van turnen: koprol, handstand tegen de muur, springen op de kast en balanceren op de balk. We werken in kleine groepjes met twee begeleiders, zodat iedereen aan de beurt komt.',
      whatToBring: 'Sportkleding en gymschoenen. Lang haar in een staart.',
      safetyNotes: 'Alle toestellen worden voor de les gecontroleerd. Er is altijd een BHV-er aanwezig.',
    },
    en: {
      title: 'Gymnastics for beginners',
      summary: 'Rolling, jumping and climbing in a safe gymnastics hall.',
      description:
        'Children learn the basics of gymnastics: forward rolls, a wall-supported handstand, vaulting and balancing on the beam. We work in small groups with two instructors so everyone gets plenty of turns.',
      whatToBring: 'Sports clothing and gym shoes. Long hair tied back.',
      safetyNotes: 'All apparatus is checked before each session and a first-aider is always present.',
    },
  },
  {
    providerSlug: 'sportclub-de-vechtstroom',
    category: 'SPORTS',
    level: 'ALL_LEVELS',
    minAgeBand: 'AGE_9_11',
    maxAgeBand: 'AGE_12_14',
    creditCost: 3,
    listPriceCents: 1500,
    languages: ['NL', 'EN'],
    interests: ['martial-arts'],
    seats: 14,
    nl: {
      title: 'Judo: vallen en opstaan',
      summary: 'Judotechniek, respect en zelfvertrouwen op de mat.',
      description:
        'Judo draait om meer dan worpen. We besteden elke les aandacht aan valtechniek, samenwerken met je partner en respect voor elkaar. Kinderen kunnen doorstromen naar de bandenexamens van de club.',
      whatToBring: 'Judopak indien aanwezig, anders leen je er een.',
      safetyNotes: 'Nagels kort, geen sieraden. Blessures worden altijd aan de ouder gemeld.',
    },
    en: {
      title: 'Judo: falling and getting up',
      summary: 'Judo technique, respect and confidence on the mat.',
      description:
        'Judo is about more than throws. Every session covers break-falling, working with your partner and mutual respect. Children can progress to the club’s belt examinations.',
      whatToBring: 'A judo suit if you have one, otherwise you can borrow one.',
      safetyNotes: 'Short nails, no jewellery. Injuries are always reported to the guardian.',
    },
  },
  {
    providerSlug: 'sportclub-de-vechtstroom',
    category: 'SPORTS',
    level: 'INTERMEDIATE',
    minAgeBand: 'AGE_12_14',
    maxAgeBand: 'AGE_15_17',
    creditCost: 3,
    listPriceCents: 1600,
    languages: ['NL'],
    interests: ['climbing'],
    seats: 10,
    nl: {
      title: 'Sportklimmen voor tieners',
      summary: 'Toprope klimmen en zekeren leren aan de klimwand.',
      description:
        'Tieners leren klimtechniek, routes lezen en veilig zekeren met een klimpartner. Na acht lessen kun je zelfstandig toprope klimmen onder toezicht.',
      whatToBring: 'Sportkleding. Klimschoenen en gordel zijn beschikbaar.',
      safetyNotes: 'Zekeren gebeurt altijd onder toezicht van een gecertificeerde instructeur.',
    },
    en: {
      title: 'Sport climbing for teens',
      summary: 'Learn top-rope climbing and belaying on the wall.',
      description:
        'Teenagers learn climbing technique, how to read a route and how to belay a partner safely. After eight sessions you can top-rope independently under supervision.',
      whatToBring: 'Sports clothing. Climbing shoes and a harness are provided.',
      safetyNotes: 'Belaying always happens under supervision of a certified instructor.',
    },
  },
  {
    providerSlug: 'muziekhuis-lombok',
    category: 'MUSIC',
    level: 'BEGINNER',
    minAgeBand: 'AGE_6_8',
    maxAgeBand: 'AGE_9_11',
    creditCost: 2,
    listPriceCents: 1400,
    languages: ['NL'],
    trialAvailable: true,
    sensoryFriendly: true,
    interests: ['guitar', 'singing'],
    seats: 6,
    nl: {
      title: 'Eerste gitaarles',
      summary: 'Je eerste akkoorden op een gitaar die bij je maat past.',
      description:
        'In kleine groepjes van maximaal zes kinderen leer je de eerste akkoorden en een liedje dat je zelf kiest. Gitaren in kindermaten zijn aanwezig; thuis oefenen mag, maar hoeft niet.',
      whatToBring: 'Niets. Een eigen gitaar mag natuurlijk mee.',
    },
    en: {
      title: 'First guitar lesson',
      summary: 'Your first chords on a guitar that fits your size.',
      description:
        'In small groups of at most six children you learn your first chords and a song of your own choosing. Child-sized guitars are available; practising at home is welcome but not required.',
      whatToBring: 'Nothing. You may bring your own guitar.',
    },
  },
  {
    providerSlug: 'muziekhuis-lombok',
    category: 'MUSIC',
    level: 'ALL_LEVELS',
    minAgeBand: 'AGE_9_11',
    maxAgeBand: 'AGE_15_17',
    creditCost: 3,
    listPriceCents: 1600,
    languages: ['NL', 'EN'],
    interests: ['drums', 'band'],
    seats: 8,
    nl: {
      title: 'Percussie en ritme',
      summary: 'Djembé, cajón en drumstel: ritme met je hele lichaam.',
      description:
        'We spelen samen ritmes uit West-Afrika, Brazilië en de popmuziek. Je leert luisteren naar elkaar en op tijd invallen. Aan het eind van elke reeks spelen we voor ouders.',
      safetyNotes: 'Gehoorbescherming wordt uitgedeeld en is verplicht bij het drumstel.',
    },
    en: {
      title: 'Percussion and rhythm',
      summary: 'Djembe, cajón and drum kit: rhythm with your whole body.',
      description:
        'We play rhythms from West Africa, Brazil and pop music together. You learn to listen to each other and come in on time. Each block ends with a short performance for guardians.',
      safetyNotes: 'Hearing protection is handed out and is mandatory at the drum kit.',
    },
  },
  {
    providerSlug: 'muziekhuis-lombok',
    category: 'MUSIC',
    level: 'BEGINNER',
    minAgeBand: 'AGE_6_8',
    maxAgeBand: 'AGE_12_14',
    creditCost: 2,
    listPriceCents: 1300,
    languages: ['NL'],
    interests: ['keyboard'],
    seats: 6,
    nl: {
      title: 'Keyboard ontdekken',
      summary: 'Melodieën spelen zonder eerst noten te hoeven lezen.',
      description:
        'We beginnen op het gehoor en met kleuren op de toetsen. Noten lezen komt vanzelf later. Ieder kind heeft een eigen keyboard met koptelefoon tijdens de les.',
    },
    en: {
      title: 'Discovering the keyboard',
      summary: 'Play melodies without having to read music first.',
      description:
        'We start by ear and with colours on the keys; reading music follows naturally later. Every child has their own keyboard and headphones during the lesson.',
    },
  },
  {
    providerSlug: 'kookstudio-de-pan',
    category: 'COOKING',
    level: 'BEGINNER',
    minAgeBand: 'AGE_6_8',
    maxAgeBand: 'AGE_9_11',
    creditCost: 3,
    listPriceCents: 1800,
    languages: ['NL', 'EN'],
    trialAvailable: true,
    wheelchairAccessible: true,
    interests: ['baking'],
    seats: 10,
    nl: {
      title: 'Zelf pizza maken',
      summary: 'Deeg kneden, saus maken en je eigen pizza beleggen.',
      description:
        'We maken deeg vanaf het begin, laten het rijzen en bakken de pizza’s in een echte steenoven. Iedereen neemt zijn eigen pizza mee naar huis. Vegetarisch en halal beleg is standaard aanwezig.',
      whatToBring: 'Een bakje voor de pizza. Schort krijg je van ons.',
      safetyNotes: 'Alleen begeleiders bedienen de oven. Allergieën vooraf doorgeven.',
    },
    en: {
      title: 'Make your own pizza',
      summary: 'Knead dough, make sauce and top your own pizza.',
      description:
        'We make dough from scratch, let it prove and bake the pizzas in a real stone oven. Everyone takes their own pizza home. Vegetarian and halal toppings are always available.',
      whatToBring: 'A container for your pizza. We provide the apron.',
      safetyNotes: 'Only instructors operate the oven. Please tell us about allergies in advance.',
    },
  },
  {
    providerSlug: 'kookstudio-de-pan',
    category: 'COOKING',
    level: 'INTERMEDIATE',
    minAgeBand: 'AGE_12_14',
    maxAgeBand: 'AGE_15_17',
    creditCost: 4,
    listPriceCents: 2200,
    languages: ['NL'],
    interests: ['baking', 'nutrition'],
    seats: 8,
    nl: {
      title: 'Koken met een klein budget',
      summary: 'Drie maaltijden voor onder de vijf euro per persoon.',
      description:
        'Voor tieners die zelf willen leren koken. We rekenen uit wat een maaltijd kost, doen samen boodschappen op papier en koken drie gerechten die je thuis kunt herhalen.',
      whatToBring: 'Bakjes voor restjes.',
    },
    en: {
      title: 'Cooking on a small budget',
      summary: 'Three meals for under five euros per person.',
      description:
        'For teenagers who want to learn to cook for themselves. We work out what a meal costs, plan a shopping list together and cook three dishes you can repeat at home.',
      whatToBring: 'Containers for leftovers.',
    },
  },
  {
    providerSlug: 'kookstudio-de-pan',
    category: 'COOKING',
    level: 'ALL_LEVELS',
    minAgeBand: 'AGE_9_11',
    maxAgeBand: 'AGE_12_14',
    creditCost: 3,
    listPriceCents: 1900,
    languages: ['NL', 'EN'],
    interests: ['baking'],
    seats: 10,
    nl: {
      title: 'Wereldkeuken: Marokkaans bakken',
      summary: 'Msemen, harcha en muntthee uit de Marokkaanse keuken.',
      description:
        'Samen met een gastkok bakken we traditioneel Marokkaans brood en zoetigheid. We praten over waar de recepten vandaan komen en welke ingrediënten je in de buurt kunt kopen.',
    },
    en: {
      title: 'World kitchen: Moroccan baking',
      summary: 'Msemen, harcha and mint tea from Moroccan cuisine.',
      description:
        'Together with a guest cook we bake traditional Moroccan breads and sweets. We talk about where the recipes come from and which ingredients you can buy nearby.',
    },
  },
  {
    providerSlug: 'atelier-noord',
    category: 'ART',
    level: 'ALL_LEVELS',
    minAgeBand: 'AGE_6_8',
    maxAgeBand: 'AGE_9_11',
    creditCost: 2,
    listPriceCents: 1400,
    languages: ['NL'],
    trialAvailable: true,
    sensoryFriendly: true,
    wheelchairAccessible: true,
    interests: ['drawing', 'painting'],
    seats: 12,
    nl: {
      title: 'Tekenen en schilderen',
      summary: 'Werken met potlood, houtskool en acrylverf.',
      description:
        'Elke les staat één techniek centraal. We kijken naar werk van bekende makers en gaan daarna zelf aan de slag. Je werk hangt aan het eind van de reeks in de expositieruimte.',
      whatToBring: 'Kleding die vies mag worden.',
    },
    en: {
      title: 'Drawing and painting',
      summary: 'Working with pencil, charcoal and acrylic paint.',
      description:
        'Each session focuses on one technique. We look at work by well-known makers and then get to work ourselves. Your work is exhibited at the end of the block.',
      whatToBring: 'Clothes that are allowed to get messy.',
    },
  },
  {
    providerSlug: 'atelier-noord',
    category: 'ART',
    level: 'INTERMEDIATE',
    minAgeBand: 'AGE_12_14',
    maxAgeBand: 'AGE_15_17',
    creditCost: 4,
    listPriceCents: 2100,
    languages: ['NL', 'EN'],
    wheelchairAccessible: true,
    interests: ['ceramics'],
    seats: 8,
    nl: {
      title: 'Keramiek: draaien op de schijf',
      summary: 'Klei draaien, glazuren en stoken in de eigen oven.',
      description:
        'Je leert klei centreren op de draaischijf en een kom of beker maken. Werk wordt in het atelier gestookt en geglazuurd; je neemt het twee weken later mee naar huis.',
      safetyNotes: 'De oven is afgeschermd en wordt alleen door docenten bediend.',
    },
    en: {
      title: 'Ceramics: throwing on the wheel',
      summary: 'Throw clay, glaze it and fire it in our own kiln.',
      description:
        'You learn to centre clay on the wheel and make a bowl or mug. Work is fired and glazed in the studio; you take it home two weeks later.',
      safetyNotes: 'The kiln is screened off and operated only by teachers.',
    },
  },
  {
    providerSlug: 'atelier-noord',
    category: 'CRAFTS',
    level: 'BEGINNER',
    minAgeBand: 'AGE_9_11',
    maxAgeBand: 'AGE_12_14',
    creditCost: 2,
    listPriceCents: 1500,
    languages: ['NL'],
    interests: ['crafting'],
    seats: 10,
    nl: {
      title: 'Stripverhaal maken',
      summary: 'Van personage tot afgedrukt eigen stripboekje.',
      description:
        'We bedenken een personage, schrijven een kort verhaal en tekenen het uit als strip. Aan het eind drukken we jouw strip af en bind je hem zelf in.',
    },
    en: {
      title: 'Make a comic book',
      summary: 'From character design to your own printed comic.',
      description:
        'We invent a character, write a short story and draw it as a comic. At the end we print your comic and you bind it yourself.',
    },
  },
  {
    providerSlug: 'makerslab-utrecht',
    category: 'TECHNOLOGY',
    level: 'BEGINNER',
    minAgeBand: 'AGE_9_11',
    maxAgeBand: 'AGE_12_14',
    creditCost: 3,
    listPriceCents: 1900,
    languages: ['NL', 'EN'],
    trialAvailable: true,
    wheelchairAccessible: true,
    interests: ['coding', 'robotics'],
    seats: 12,
    nl: {
      title: 'Programmeren met micro:bit',
      summary: 'Je eigen stappenteller en alarmsysteem programmeren.',
      description:
        'Met een micro:bit bouw en programmeer je kleine apparaten: een stappenteller, een kompas en een alarm voor je kamerdeur. Geen ervaring nodig; we werken in tweetallen.',
    },
    en: {
      title: 'Coding with the micro:bit',
      summary: 'Program your own step counter and alarm system.',
      description:
        'Using a micro:bit you build and program small devices: a step counter, a compass and an alarm for your bedroom door. No experience needed; we work in pairs.',
    },
  },
  {
    providerSlug: 'makerslab-utrecht',
    category: 'TECHNOLOGY',
    level: 'INTERMEDIATE',
    minAgeBand: 'AGE_12_14',
    maxAgeBand: 'AGE_15_17',
    creditCost: 4,
    listPriceCents: 2400,
    languages: ['NL', 'EN'],
    wheelchairAccessible: true,
    interests: ['3d-printing', 'design'],
    seats: 10,
    nl: {
      title: '3D-ontwerpen en printen',
      summary: 'Ontwerp in CAD en print je model in de werkplaats.',
      description:
        'Je leert werken met vrije CAD-software, ontwerpt een eigen object en print het op een FDM-printer. We bespreken ook wat een ontwerp printbaar maakt en wat niet.',
      safetyNotes: 'De printers staan in een afgesloten kast; alleen begeleiders halen prints eruit.',
    },
    en: {
      title: '3D design and printing',
      summary: 'Design in CAD and print your model in the workshop.',
      description:
        'You learn free CAD software, design your own object and print it on an FDM printer. We also discuss what makes a design printable and what does not.',
      safetyNotes: 'Printers sit in an enclosed cabinet; only instructors remove prints.',
    },
  },
  {
    providerSlug: 'makerslab-utrecht',
    category: 'TECHNOLOGY',
    level: 'ADVANCED',
    minAgeBand: 'AGE_15_17',
    maxAgeBand: 'AGE_15_17',
    creditCost: 5,
    listPriceCents: 2800,
    languages: ['EN', 'NL'],
    wheelchairAccessible: true,
    interests: ['coding'],
    seats: 8,
    nl: {
      title: 'Webapps bouwen',
      summary: 'Van idee naar werkende webapp met HTML, CSS en JavaScript.',
      description:
        'In zes bijeenkomsten bouw je een eigen webapp. We behandelen versiebeheer, toegankelijkheid en hoe je je werk online zet. Neem je eigen laptop mee als je die hebt.',
      whatToBring: 'Eigen laptop als je die hebt; anders lenen we er een.',
    },
    en: {
      title: 'Building web apps',
      summary: 'From idea to a working web app with HTML, CSS and JavaScript.',
      description:
        'Across six meetings you build your own web app. We cover version control, accessibility and how to publish your work. Bring your own laptop if you have one.',
      whatToBring: 'Your own laptop if you have one; otherwise we lend you one.',
    },
  },
  {
    providerSlug: 'natuurgroep-de-haar',
    category: 'NATURE',
    level: 'ALL_LEVELS',
    minAgeBand: 'AGE_6_8',
    maxAgeBand: 'AGE_9_11',
    creditCost: 2,
    listPriceCents: 1200,
    languages: ['NL'],
    trialAvailable: true,
    interests: ['outdoors', 'animals'],
    seats: 16,
    nl: {
      title: 'Sporenzoekers in het bos',
      summary: 'Dierensporen herkennen en een schuilhut bouwen.',
      description:
        'We trekken het bos in op zoek naar sporen van reeën, vossen en spechten. Daarna bouwen we samen een schuilhut van takken. Bij regen gaat de les gewoon door.',
      whatToBring: 'Laarzen, regenjas en een flesje water.',
      safetyNotes: 'De groep blijft altijd binnen zicht van twee begeleiders.',
    },
    en: {
      title: 'Track finders in the forest',
      summary: 'Recognise animal tracks and build a shelter.',
      description:
        'We head into the forest looking for signs of deer, foxes and woodpeckers, then build a shelter from branches together. The session goes ahead in the rain.',
      whatToBring: 'Boots, a rain jacket and a bottle of water.',
      safetyNotes: 'The group always stays within sight of two instructors.',
    },
  },
  {
    providerSlug: 'natuurgroep-de-haar',
    category: 'NATURE',
    level: 'INTERMEDIATE',
    minAgeBand: 'AGE_12_14',
    maxAgeBand: 'AGE_15_17',
    creditCost: 4,
    listPriceCents: 2000,
    languages: ['NL', 'EN'],
    interests: ['outdoors', 'survival'],
    seats: 12,
    nl: {
      title: 'Bushcraft: vuur en koken buiten',
      summary: 'Veilig vuur maken en buiten koken met eenvoudig materiaal.',
      description:
        'Je leert vuur maken met vuurslag, een kookplek inrichten en veilig met een mes werken. We eten aan het eind samen wat we hebben gekookt.',
      safetyNotes: 'Messen worden per les uitgegeven en weer ingenomen. Ouders tekenen vooraf een toestemmingsformulier.',
    },
    en: {
      title: 'Bushcraft: fire and outdoor cooking',
      summary: 'Make fire safely and cook outdoors with simple gear.',
      description:
        'You learn to light a fire with a fire steel, set up a cooking area and handle a knife safely. We eat what we cooked together at the end.',
      safetyNotes: 'Knives are handed out and collected each session. Guardians sign a consent form in advance.',
    },
  },
  {
    providerSlug: 'theaterwerkplaats-oost',
    category: 'THEATRE',
    level: 'BEGINNER',
    minAgeBand: 'AGE_6_8',
    maxAgeBand: 'AGE_9_11',
    creditCost: 2,
    listPriceCents: 1300,
    languages: ['NL'],
    trialAvailable: true,
    wheelchairAccessible: true,
    interests: ['acting'],
    seats: 14,
    nl: {
      title: 'Spelen en verzinnen',
      summary: 'Toneelspel via spel, verkleden en fantasie.',
      description:
        'Met spelletjes, verkleedkleren en korte scènes ontdekken kinderen wat toneelspelen is. Er is geen publiek: het gaat om durven en plezier.',
    },
    en: {
      title: 'Play and invent',
      summary: 'Drama through games, dressing up and imagination.',
      description:
        'Through games, costumes and short scenes children discover what acting is. There is no audience: it is about daring and having fun.',
    },
  },
  {
    providerSlug: 'theaterwerkplaats-oost',
    category: 'THEATRE',
    level: 'INTERMEDIATE',
    minAgeBand: 'AGE_12_14',
    maxAgeBand: 'AGE_15_17',
    creditCost: 3,
    listPriceCents: 1700,
    languages: ['NL', 'EN'],
    wheelchairAccessible: true,
    interests: ['acting', 'improvisation'],
    seats: 12,
    nl: {
      title: 'Improvisatietheater',
      summary: 'Scènes maken zonder script, samen met je groep.',
      description:
        'Improviseren leert je luisteren, ja-zeggen en fouten omarmen. We werken toe naar een openbare improvisatievoorstelling aan het eind van het seizoen.',
    },
    en: {
      title: 'Improvisation theatre',
      summary: 'Build scenes without a script, together with your group.',
      description:
        'Improvising teaches you to listen, to say yes and to embrace mistakes. We work towards a public improv show at the end of the season.',
    },
  },
  {
    providerSlug: 'theaterwerkplaats-oost',
    category: 'THEATRE',
    level: 'ALL_LEVELS',
    minAgeBand: 'AGE_9_11',
    maxAgeBand: 'AGE_12_14',
    creditCost: 3,
    listPriceCents: 1800,
    languages: ['NL'],
    wheelchairAccessible: true,
    interests: ['musical', 'singing'],
    seats: 16,
    nl: {
      title: 'Musical: zingen, spelen, dansen',
      summary: 'Alle drie de disciplines in één les.',
      description:
        'We werken aan een scène uit een bekende musical: eerst de tekst, dan het lied en tenslotte de choreografie. Je hoeft geen ervaring te hebben.',
    },
    en: {
      title: 'Musical: sing, act, dance',
      summary: 'All three disciplines in a single session.',
      description:
        'We work on a scene from a well-known musical: first the text, then the song and finally the choreography. No experience needed.',
    },
  },
  {
    providerSlug: 'dansstudio-cadence',
    category: 'DANCE',
    level: 'BEGINNER',
    minAgeBand: 'AGE_9_11',
    maxAgeBand: 'AGE_12_14',
    creditCost: 2,
    listPriceCents: 1400,
    languages: ['NL', 'EN'],
    trialAvailable: true,
    wheelchairAccessible: true,
    interests: ['hiphop'],
    seats: 18,
    nl: {
      title: 'Hiphop basis',
      summary: 'Grooves, isolaties en je eerste choreografie.',
      description:
        'We beginnen met de basisgrooves en bouwen elke les een stukje choreografie op. De studio heeft geen spiegelwand aan de voorkant: het gaat om hoe het voelt, niet hoe het eruitziet.',
      whatToBring: 'Schone binnenschoenen.',
    },
    en: {
      title: 'Hip-hop basics',
      summary: 'Grooves, isolations and your first choreography.',
      description:
        'We start with basic grooves and add a piece of choreography each session. The studio has no mirror wall at the front: it is about how it feels, not how it looks.',
      whatToBring: 'Clean indoor shoes.',
    },
  },
  {
    providerSlug: 'dansstudio-cadence',
    category: 'DANCE',
    level: 'INTERMEDIATE',
    minAgeBand: 'AGE_12_14',
    maxAgeBand: 'AGE_15_17',
    creditCost: 3,
    listPriceCents: 1700,
    languages: ['NL'],
    wheelchairAccessible: true,
    interests: ['modern-dance'],
    seats: 14,
    nl: {
      title: 'Moderne dans',
      summary: 'Vloerwerk, ademhaling en eigen bewegingsmateriaal.',
      description:
        'Moderne dans met aandacht voor techniek en eigen inbreng. We maken samen materiaal dat we aan het eind van het blok laten zien aan elkaar.',
    },
    en: {
      title: 'Modern dance',
      summary: 'Floor work, breathing and your own movement material.',
      description:
        'Modern dance with attention to technique and your own input. We create material together and show it to each other at the end of the block.',
    },
  },
  {
    providerSlug: 'taalclub-utrecht',
    category: 'LANGUAGES',
    level: 'BEGINNER',
    minAgeBand: 'AGE_6_8',
    maxAgeBand: 'AGE_9_11',
    creditCost: 2,
    listPriceCents: 1500,
    languages: ['EN', 'NL'],
    trialAvailable: true,
    interests: ['english'],
    seats: 10,
    nl: {
      title: 'Engels door spel',
      summary: 'Engels leren met spelletjes, liedjes en verhalen.',
      description:
        'Geen rijtjes stampen: we spelen memory, zingen liedjes en spelen korte toneelstukjes in het Engels. De docent spreekt tijdens de les alleen Engels.',
    },
    en: {
      title: 'English through play',
      summary: 'Learn English with games, songs and stories.',
      description:
        'No rote learning: we play memory games, sing songs and act out short plays in English. The teacher speaks only English during the lesson.',
    },
  },
  {
    providerSlug: 'taalclub-utrecht',
    category: 'LANGUAGES',
    level: 'BEGINNER',
    minAgeBand: 'AGE_12_14',
    maxAgeBand: 'AGE_15_17',
    creditCost: 3,
    listPriceCents: 1700,
    languages: ['NL', 'EN'],
    interests: ['spanish'],
    seats: 12,
    nl: {
      title: 'Spaans voor beginners',
      summary: 'Je eerste gesprekken in het Spaans.',
      description:
        'In tien lessen leer je jezelf voorstellen, iets bestellen en de weg vragen. We gebruiken korte video’s en veel spreekoefeningen in tweetallen.',
    },
    en: {
      title: 'Spanish for beginners',
      summary: 'Your first conversations in Spanish.',
      description:
        'In ten lessons you learn to introduce yourself, order something and ask for directions. We use short videos and lots of paired speaking practice.',
    },
  },
  {
    providerSlug: 'sterrenlab',
    category: 'SCIENCE',
    level: 'ALL_LEVELS',
    minAgeBand: 'AGE_6_8',
    maxAgeBand: 'AGE_9_11',
    creditCost: 2,
    listPriceCents: 1400,
    languages: ['NL'],
    trialAvailable: true,
    wheelchairAccessible: true,
    sensoryFriendly: true,
    interests: ['experiments'],
    seats: 14,
    nl: {
      title: 'Proefjes in het lab',
      summary: 'Zelf experimenteren met veilige, echte materialen.',
      description:
        'Elke les doen we drie proefjes rond één thema: lucht, water of licht. Kinderen noteren wat ze verwachten en wat er echt gebeurt in een eigen labboekje.',
      safetyNotes: 'Veiligheidsbril verplicht. Alle stoffen zijn geschikt voor kinderen.',
    },
    en: {
      title: 'Experiments in the lab',
      summary: 'Hands-on experimenting with safe, real materials.',
      description:
        'Each session we run three experiments around one theme: air, water or light. Children write down what they expect and what actually happens in their own lab book.',
      safetyNotes: 'Safety goggles are mandatory. All substances are child-appropriate.',
    },
  },
  {
    providerSlug: 'sterrenlab',
    category: 'SCIENCE',
    level: 'INTERMEDIATE',
    minAgeBand: 'AGE_12_14',
    maxAgeBand: 'AGE_15_17',
    creditCost: 3,
    listPriceCents: 1800,
    languages: ['NL', 'EN'],
    wheelchairAccessible: true,
    interests: ['astronomy'],
    seats: 12,
    nl: {
      title: 'Sterrenkijken voor gevorderden',
      summary: 'Telescoop instellen en planeten vinden.',
      description:
        'We leren een telescoop uitlijnen, sterrenbeelden herkennen en planeten volgen. Bij bewolking wijken we uit naar het planetariumprogramma binnen.',
      whatToBring: 'Warme kleding: we staan buiten.',
    },
    en: {
      title: 'Stargazing for the experienced',
      summary: 'Align a telescope and find the planets.',
      description:
        'We learn to align a telescope, recognise constellations and track planets. If it is cloudy we switch to the indoor planetarium programme.',
      whatToBring: 'Warm clothing: we are outdoors.',
    },
  },
  {
    providerSlug: 'sterrenlab',
    category: 'SCIENCE',
    level: 'BEGINNER',
    minAgeBand: 'AGE_9_11',
    maxAgeBand: 'AGE_12_14',
    creditCost: 3,
    listPriceCents: 1600,
    languages: ['NL'],
    wheelchairAccessible: true,
    interests: ['experiments', 'nature-study'],
    seats: 12,
    nl: {
      title: 'Waterdiertjes onder de microscoop',
      summary: 'Slootwater onderzoeken met echte microscopen.',
      description:
        'We scheppen water uit de sloot naast het lab en zoeken uit wat erin leeft. Je leert een microscoop instellen en tekent wat je ziet.',
    },
    en: {
      title: 'Pond life under the microscope',
      summary: 'Investigate ditch water with real microscopes.',
      description:
        'We scoop water from the ditch beside the lab and find out what lives in it. You learn to set up a microscope and draw what you see.',
    },
  },
  {
    providerSlug: 'handwerkhuis-de-draad',
    category: 'CRAFTS',
    level: 'BEGINNER',
    minAgeBand: 'AGE_9_11',
    maxAgeBand: 'AGE_12_14',
    creditCost: 2,
    listPriceCents: 1500,
    languages: ['NL'],
    trialAvailable: true,
    wheelchairAccessible: true,
    interests: ['sewing'],
    seats: 8,
    nl: {
      title: 'Naaien met de machine',
      summary: 'Je eigen tas naaien op een echte naaimachine.',
      description:
        'Je leert een naaimachine inrijgen, rechte naden stikken en een patroon volgen. Aan het eind van de reeks heb je een zelfgemaakte tas.',
      safetyNotes: 'Naaimachines worden per twee kinderen begeleid.',
    },
    en: {
      title: 'Sewing with a machine',
      summary: 'Sew your own bag on a real sewing machine.',
      description:
        'You learn to thread a sewing machine, sew straight seams and follow a pattern. By the end of the block you have a bag you made yourself.',
      safetyNotes: 'One instructor supervises every two children at the machines.',
    },
  },
  {
    providerSlug: 'handwerkhuis-de-draad',
    category: 'CRAFTS',
    level: 'ALL_LEVELS',
    minAgeBand: 'AGE_12_14',
    maxAgeBand: 'AGE_15_17',
    creditCost: 3,
    listPriceCents: 1900,
    languages: ['NL', 'EN'],
    wheelchairAccessible: true,
    interests: ['woodwork'],
    seats: 8,
    nl: {
      title: 'Houtbewerking: bouw een krukje',
      summary: 'Zagen, schaven en verbinden met echt gereedschap.',
      description:
        'Je maakt een krukje van massief hout, van ruwe plank tot geschuurd eindresultaat. We besteden veel aandacht aan veilig werken met handgereedschap.',
      safetyNotes: 'Machinaal zagen doen alleen de begeleiders. Oog- en gehoorbescherming verplicht.',
    },
    en: {
      title: 'Woodwork: build a stool',
      summary: 'Saw, plane and join with real tools.',
      description:
        'You make a stool from solid wood, from rough plank to sanded result. We spend a lot of time on working safely with hand tools.',
      safetyNotes: 'Machine sawing is done by instructors only. Eye and ear protection required.',
    },
  },
  {
    providerSlug: 'handwerkhuis-de-draad',
    category: 'PRACTICAL_SKILLS',
    level: 'BEGINNER',
    minAgeBand: 'AGE_9_11',
    maxAgeBand: 'AGE_12_14',
    creditCost: 2,
    listPriceCents: 1300,
    languages: ['NL'],
    wheelchairAccessible: true,
    interests: ['repair'],
    seats: 10,
    nl: {
      title: 'Repareren in plaats van weggooien',
      summary: 'Kleding stoppen, lijmen en kleine dingen maken.',
      description:
        'Neem iets kapots mee en repareer het samen met een vrijwilliger van het repaircafé. Je leert naaien, lijmen en wanneer iets echt niet meer te redden is.',
      whatToBring: 'Iets kapots van huis.',
    },
    en: {
      title: 'Repair instead of replace',
      summary: 'Darn clothes, glue things and fix small items.',
      description:
        'Bring something broken and repair it together with a volunteer from the repair café. You learn to sew, to glue and to recognise when something is beyond saving.',
      whatToBring: 'Something broken from home.',
    },
  },
  {
    providerSlug: 'levensles-utrecht',
    category: 'PRACTICAL_SKILLS',
    level: 'BEGINNER',
    minAgeBand: 'AGE_12_14',
    maxAgeBand: 'AGE_15_17',
    creditCost: 2,
    listPriceCents: 1400,
    languages: ['NL'],
    interests: ['repair', 'cycling'],
    seats: 10,
    nl: {
      title: 'Fietsreparatie voor tieners',
      summary: 'Band plakken, remmen afstellen en ketting spannen.',
      description:
        'Na deze reeks kun je je eigen fiets onderhouden. Neem je eigen fiets mee; gereedschap is aanwezig.',
      whatToBring: 'Je eigen fiets.',
    },
    en: {
      title: 'Bike repair for teens',
      summary: 'Patch a tyre, adjust brakes and tension a chain.',
      description:
        'After this block you can maintain your own bike. Bring your own bike; tools are provided.',
      whatToBring: 'Your own bike.',
    },
  },
  {
    providerSlug: 'levensles-utrecht',
    category: 'PRACTICAL_SKILLS',
    level: 'ALL_LEVELS',
    minAgeBand: 'AGE_15_17',
    maxAgeBand: 'AGE_15_17',
    creditCost: 3,
    listPriceCents: 1600,
    languages: ['NL', 'EN'],
    interests: ['money'],
    seats: 12,
    nl: {
      title: 'Geldzaken voor beginners',
      summary: 'Budget maken, sparen en doorzien wat reclame doet.',
      description:
        'Praktische les over je eerste bijbaan, belasting, sparen en schulden voorkomen. We rekenen met echte voorbeelden uit Utrecht.',
    },
    en: {
      title: 'Money matters for beginners',
      summary: 'Make a budget, save, and see through advertising.',
      description:
        'A practical session about your first job, tax, saving and avoiding debt. We work through real examples from Utrecht.',
    },
  },
];

export const INTERESTS: { slug: string; nl: string; en: string; category: SeedCategory }[] = [
  { slug: 'ball-sports', nl: 'Balsporten', en: 'Ball sports', category: 'SPORTS' },
  { slug: 'gymnastics', nl: 'Turnen', en: 'Gymnastics', category: 'SPORTS' },
  { slug: 'martial-arts', nl: 'Vechtsport', en: 'Martial arts', category: 'SPORTS' },
  { slug: 'climbing', nl: 'Klimmen', en: 'Climbing', category: 'SPORTS' },
  { slug: 'guitar', nl: 'Gitaar', en: 'Guitar', category: 'MUSIC' },
  { slug: 'drums', nl: 'Drums', en: 'Drums', category: 'MUSIC' },
  { slug: 'keyboard', nl: 'Keyboard', en: 'Keyboard', category: 'MUSIC' },
  { slug: 'singing', nl: 'Zingen', en: 'Singing', category: 'MUSIC' },
  { slug: 'band', nl: 'Samenspelen', en: 'Playing in a band', category: 'MUSIC' },
  { slug: 'baking', nl: 'Bakken', en: 'Baking', category: 'COOKING' },
  { slug: 'nutrition', nl: 'Gezond eten', en: 'Healthy food', category: 'COOKING' },
  { slug: 'drawing', nl: 'Tekenen', en: 'Drawing', category: 'ART' },
  { slug: 'painting', nl: 'Schilderen', en: 'Painting', category: 'ART' },
  { slug: 'ceramics', nl: 'Keramiek', en: 'Ceramics', category: 'ART' },
  { slug: 'crafting', nl: 'Knutselen', en: 'Crafting', category: 'CRAFTS' },
  { slug: 'sewing', nl: 'Naaien', en: 'Sewing', category: 'CRAFTS' },
  { slug: 'woodwork', nl: 'Houtbewerking', en: 'Woodwork', category: 'CRAFTS' },
  { slug: 'coding', nl: 'Programmeren', en: 'Coding', category: 'TECHNOLOGY' },
  { slug: 'robotics', nl: 'Robotica', en: 'Robotics', category: 'TECHNOLOGY' },
  { slug: '3d-printing', nl: '3D-printen', en: '3D printing', category: 'TECHNOLOGY' },
  { slug: 'design', nl: 'Ontwerpen', en: 'Design', category: 'TECHNOLOGY' },
  { slug: 'outdoors', nl: 'Buiten zijn', en: 'Being outdoors', category: 'NATURE' },
  { slug: 'animals', nl: 'Dieren', en: 'Animals', category: 'NATURE' },
  { slug: 'survival', nl: 'Survival', en: 'Survival', category: 'NATURE' },
  { slug: 'nature-study', nl: 'Natuuronderzoek', en: 'Nature study', category: 'NATURE' },
  { slug: 'acting', nl: 'Toneelspelen', en: 'Acting', category: 'THEATRE' },
  { slug: 'improvisation', nl: 'Improviseren', en: 'Improvisation', category: 'THEATRE' },
  { slug: 'musical', nl: 'Musical', en: 'Musical', category: 'THEATRE' },
  { slug: 'hiphop', nl: 'Hiphop', en: 'Hip-hop', category: 'DANCE' },
  { slug: 'modern-dance', nl: 'Moderne dans', en: 'Modern dance', category: 'DANCE' },
  { slug: 'english', nl: 'Engels', en: 'English', category: 'LANGUAGES' },
  { slug: 'spanish', nl: 'Spaans', en: 'Spanish', category: 'LANGUAGES' },
  { slug: 'experiments', nl: 'Proefjes', en: 'Experiments', category: 'SCIENCE' },
  { slug: 'astronomy', nl: 'Sterrenkunde', en: 'Astronomy', category: 'SCIENCE' },
  { slug: 'repair', nl: 'Repareren', en: 'Repairing', category: 'PRACTICAL_SKILLS' },
  { slug: 'cycling', nl: 'Fietsen', en: 'Cycling', category: 'PRACTICAL_SKILLS' },
  { slug: 'money', nl: 'Geldzaken', en: 'Money matters', category: 'PRACTICAL_SKILLS' },
];
