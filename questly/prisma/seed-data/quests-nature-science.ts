import type { QuestSeed } from "./quest-types";

export const NATURE_AND_SCIENCE_QUESTS: QuestSeed[] = [
  {
    slug: "leaf-detective",
    categorySlug: "nature",
    ageBands: ["AGE_6_8", "AGE_9_11"],
    seasons: ["SPRING", "SUMMER", "AUTUMN"],
    durationMinutes: 45,
    difficulty: "EASY",
    setting: "OUTDOOR",
    weather: "DRY",
    minParticipants: 1,
    maxParticipants: 6,
    skillSlugs: ["nature-awareness", "curiosity"],
    materials: [{ slug: "notebook" }, { slug: "pencils" }, { slug: "books-or-internet", optional: true }],
    nl: {
      title: "Bladerdetective",
      summary: "Zoek vijf verschillende bladeren en ontdek van welke boom ze komen.",
      story:
        "Elke straat is eigenlijk een klein bos. De bomen staan er al jaren, maar bijna niemand kijkt goed naar hun bladeren. Vandaag ben jij de detective die vijf verschillende bladeren opspoort en uitzoekt wie ze verloren heeft.",
      educationalObjective:
        "Het kind leert nauwkeurig waarnemen, vormen vergelijken en een eenvoudige determinatiesleutel gebruiken.",
      expectedResult: "Vijf verschillende bladeren, met bij elk blad een tekening en de naam van de boom.",
      preparation: ["Neem een boekje en potlood mee", "Trek schoenen aan die vies mogen worden", "Spreek af hoe ver jullie gaan"],
      audioScript:
        "Vandaag ga je op zoek naar vijf verschillende bladeren. Kijk niet alleen naar de kleur, maar ook naar de vorm van de rand en hoe de nerven lopen.",
    },
    en: {
      title: "Leaf detective",
      summary: "Find five different leaves and work out which tree each one came from.",
      story:
        "Every street is really a small forest. The trees have stood there for years, but almost nobody looks closely at their leaves. Today you are the detective who tracks down five different leaves and works out who dropped them.",
      educationalObjective:
        "The child practises careful observation, comparing shapes and using a simple identification key.",
      expectedResult: "Five different leaves, each with a drawing and the name of the tree.",
      preparation: ["Bring a notebook and a pencil", "Wear shoes that can get dirty", "Agree how far you will go"],
      audioScript:
        "Today you are looking for five different leaves. Do not only look at the colour, but also at the shape of the edge and how the veins run.",
    },
    steps: [
      {
        durationMinutes: 15,
        nl: { title: "Ga op pad", body: "Loop naar een straat, park of speelplek met bomen. Zoek vijf bladeren die duidelijk van elkaar verschillen. Raap alleen bladeren op die al op de grond liggen.", tip: "Bladeren met een gekartelde rand en bladeren met een gladde rand zijn een goed begin." },
        en: { title: "Head out", body: "Walk to a street, park or playground with trees. Find five leaves that clearly differ from each other. Only pick up leaves that are already on the ground.", tip: "Leaves with a jagged edge and leaves with a smooth edge are a good start." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Kijk goed", body: "Leg de bladeren naast elkaar. Teken van elk blad de vorm na in je boekje. Let op: is de rand glad of gekarteld? Hoeveel punten heeft het blad?" },
        en: { title: "Look closely", body: "Lay the leaves side by side. Trace the shape of each leaf in your notebook. Look carefully: is the edge smooth or jagged? How many points does the leaf have?" },
      },
      {
        durationMinutes: 15,
        nl: { title: "Geef ze een naam", body: "Zoek bij elk blad de boom op in een boek of samen met een volwassene. Schrijf de naam bij je tekening. Weet je het niet zeker? Schrijf dan op waar het blad volgens jou op lijkt." },
        en: { title: "Give them a name", body: "Look up the tree for each leaf in a book or together with an adult. Write the name next to your drawing. Not sure? Write down what you think it resembles." },
      },
    ],
    safety: [
      { severity: "INFO", nl: "Raap geen bladeren op langs een drukke weg en was je handen na afloop.", en: "Do not pick up leaves along a busy road, and wash your hands afterwards." },
      { severity: "WARNING", nl: "Eet nooit bladeren, bessen of paddenstoelen die je buiten vindt.", en: "Never eat leaves, berries or mushrooms you find outdoors." },
    ],
    reflections: [
      { nl: "Welk blad vond je het mooist en waarom?", en: "Which leaf did you like most, and why?" },
      { nl: "Wat viel je op aan een boom waar je normaal langsloopt?", en: "What did you notice about a tree you normally walk past?" },
    ],
  },
  {
    slug: "insect-hotel",
    categorySlug: "nature",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    seasons: ["SPRING", "SUMMER", "AUTUMN"],
    durationMinutes: 90,
    difficulty: "MEDIUM",
    setting: "OUTDOOR",
    weather: "DRY",
    minParticipants: 2,
    maxParticipants: 5,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["nature-awareness", "practical-independence", "teamwork"],
    materials: [{ slug: "wood-scraps" }, { slug: "bamboo-sticks" }, { slug: "string" }, { slug: "shoebox", optional: true }],
    nl: {
      title: "Bouw een insectenhotel",
      summary: "Maak een veilige slaapplek voor wilde bijen en lieveheersbeestjes.",
      story:
        "Wilde bijen hebben het moeilijk: er zijn steeds minder holle stengels en oude muurtjes waarin ze kunnen schuilen. Met een paar stukjes hout en holle stokjes bouw je een hotel waar ze de winter door kunnen komen.",
      educationalObjective: "Het kind leert hoe insecten leven, en oefent meten, zagen onder begeleiding en samenwerken.",
      expectedResult: "Een insectenhotel dat droog en beschut hangt of staat in de tuin, op het balkon of bij school.",
      preparation: ["Verzamel houtresten en holle stengels", "Kies samen een droge, zonnige plek", "Leg gereedschap klaar met een volwassene"],
    },
    en: {
      title: "Build an insect hotel",
      summary: "Make a safe place to sleep for wild bees and ladybirds.",
      story:
        "Wild bees are having a hard time: there are fewer and fewer hollow stems and old walls for them to shelter in. With a few pieces of wood and hollow sticks you can build a hotel that helps them through the winter.",
      educationalObjective: "The child learns how insects live and practises measuring, supervised sawing and teamwork.",
      expectedResult: "An insect hotel standing or hanging dry and sheltered in the garden, on the balcony or at school.",
      preparation: ["Collect wood offcuts and hollow stems", "Choose a dry, sunny spot together", "Lay out tools with an adult"],
    },
    steps: [
      {
        durationMinutes: 20,
        requiresParent: true,
        nl: { title: "Maak het frame", body: "Gebruik een stevige doos of vier plankjes om een open kastje te maken. Een volwassene helpt met zagen en vastmaken.", tip: "Een oude houten kist of wijnkist werkt ook prima." },
        en: { title: "Make the frame", body: "Use a sturdy box or four small planks to make an open case. An adult helps with sawing and fastening.", tip: "An old wooden crate or wine box works well too." },
      },
      {
        durationMinutes: 30,
        nl: { title: "Vul de kamers", body: "Snijd holle stengels of bamboestokjes op lengte en stapel ze strak naast elkaar in het kastje. Vul de gaten op met dennenappels of takjes." },
        en: { title: "Fill the rooms", body: "Cut hollow stems or bamboo sticks to length and stack them tightly side by side in the case. Fill the gaps with pine cones or twigs." },
      },
      {
        durationMinutes: 20,
        requiresParent: true,
        nl: { title: "Hang het op", body: "Hang of zet het hotel op ongeveer een meter hoogte, met de opening naar het zuiden en uit de wind." },
        en: { title: "Put it up", body: "Hang or place the hotel about a metre high, with the opening facing south and out of the wind." },
      },
      {
        durationMinutes: 20,
        nl: { title: "Houd het bij", body: "Kijk de eerste weken elke paar dagen of er al bewoners zijn. Schrijf op wat je ziet." },
        en: { title: "Keep watch", body: "For the first few weeks, check every couple of days whether there are any residents. Write down what you see." },
      },
    ],
    safety: [
      { severity: "CRITICAL", nl: "Zagen en boren gebeurt altijd door of samen met een volwassene.", en: "Sawing and drilling is always done by, or together with, an adult." },
      { severity: "WARNING", nl: "Schuur scherpe randen glad en gebruik geen behandeld of geverfd hout.", en: "Sand sharp edges smooth and do not use treated or painted wood." },
    ],
    reflections: [
      { nl: "Welk deel van het bouwen was het lastigst?", en: "Which part of the building was hardest?" },
      { nl: "Welke insecten hopen jullie te zien, en waarom?", en: "Which insects do you hope to see, and why?" },
    ],
  },
  {
    slug: "sound-map-walk",
    categorySlug: "nature",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    durationMinutes: 40,
    difficulty: "EASY",
    setting: "OUTDOOR",
    weather: "ANY",
    minParticipants: 1,
    maxParticipants: 6,
    skillSlugs: ["nature-awareness", "curiosity", "communication"],
    materials: [{ slug: "paper" }, { slug: "pencils" }],
    nl: {
      title: "Geluidskaart van de buurt",
      summary: "Zit tien minuten stil en teken alles wat je hoort op een kaart.",
      story:
        "Sluit je ogen en de wereld wordt ineens groter. Vogels, wind, een fietsbel, iemand die lacht. Vandaag maak je een kaart van geluid in plaats van van straten.",
      educationalObjective: "Het kind oefent aandachtig luisteren, richting bepalen en waarnemingen omzetten in een tekening.",
      expectedResult: "Een getekende kaart met jezelf in het midden en alle geluiden op de plek waar ze vandaan kwamen.",
      preparation: ["Zoek een bankje of plek om te zitten", "Neem papier en potlood mee", "Spreek af dat niemand praat tijdens het luisteren"],
    },
    en: {
      title: "Sound map of the neighbourhood",
      summary: "Sit still for ten minutes and draw everything you hear on a map.",
      story:
        "Close your eyes and the world suddenly gets bigger. Birds, wind, a bicycle bell, someone laughing. Today you draw a map of sound instead of streets.",
      educationalObjective: "The child practises attentive listening, judging direction and turning observations into a drawing.",
      expectedResult: "A drawn map with yourself in the middle and every sound placed where it came from.",
      preparation: ["Find a bench or spot to sit", "Bring paper and a pencil", "Agree that nobody talks while listening"],
    },
    steps: [
      {
        durationMinutes: 5,
        nl: { title: "Kies je plek", body: "Zoek buiten een plek waar je rustig kunt zitten. Zet een kruisje in het midden van je papier: dat ben jij." },
        en: { title: "Choose your spot", body: "Find a place outdoors where you can sit quietly. Put a cross in the middle of your paper: that is you." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Luister tien minuten", body: "Zit stil en luister. Teken elk geluid als een klein symbool op de plek waar het vandaan komt. Verder weg betekent verder van het kruisje." },
        en: { title: "Listen for ten minutes", body: "Sit still and listen. Draw each sound as a small symbol in the place it came from. Further away means further from the cross." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Vergelijk", body: "Vergelijk jullie kaarten. Wie hoorde iets wat de ander miste? Tel hoeveel geluiden van de natuur kwamen en hoeveel van mensen." },
        en: { title: "Compare", body: "Compare your maps. Who heard something the other missed? Count how many sounds came from nature and how many from people." },
      },
    ],
    safety: [{ severity: "INFO", nl: "Kies een plek waar jullie veilig kunnen zitten, niet vlak langs de weg.", en: "Choose a spot where you can sit safely, not right next to the road." }],
    reflections: [
      { nl: "Welk geluid had je nooit eerder opgemerkt?", en: "Which sound had you never noticed before?" },
      { nl: "Was het moeilijk om tien minuten stil te zijn?", en: "Was it hard to be quiet for ten minutes?" },
    ],
  },
  {
    slug: "seed-bombs",
    categorySlug: "nature",
    ageBands: ["AGE_6_8", "AGE_9_11"],
    seasons: ["SPRING", "SUMMER"],
    durationMinutes: 45,
    difficulty: "EASY",
    setting: "BOTH",
    weather: "ANY",
    minParticipants: 1,
    maxParticipants: 6,
    skillSlugs: ["nature-awareness", "creativity"],
    materials: [{ slug: "seeds" }, { slug: "soil" }, { slug: "water" }],
    nl: {
      title: "Maak zaadbommen",
      summary: "Rol balletjes van aarde en bloemzaad en geef een kaal plekje kleur.",
      story:
        "Er zijn overal kale hoekjes: bij de stoeprand, achter de schuur, langs het fietspad. Met een handvol zaadbommen verander je zo'n hoekje in een bloemenveldje voor bijen en vlinders.",
      educationalObjective: "Het kind leert wat zaden nodig hebben om te groeien en oefent geduld en verzorging.",
      expectedResult: "Tien zaadbommen, gedroogd en klaar om te gebruiken op een plek die van jullie mag zijn.",
      preparation: ["Koop of verzamel zaden van inheemse bloemen", "Leg een oude krant op tafel", "Vraag toestemming voor de plek waar je ze legt"],
    },
    en: {
      title: "Make seed bombs",
      summary: "Roll balls of soil and flower seed and bring colour to a bare spot.",
      story:
        "There are bare corners everywhere: by the kerb, behind the shed, along the cycle path. With a handful of seed bombs you turn such a corner into a small flower field for bees and butterflies.",
      educationalObjective: "The child learns what seeds need to grow and practises patience and care.",
      expectedResult: "Ten seed bombs, dried and ready to use somewhere you are allowed to plant.",
      preparation: ["Buy or collect seeds of native flowers", "Put old newspaper on the table", "Ask permission for the spot where you place them"],
    },
    steps: [
      {
        durationMinutes: 15,
        nl: { title: "Meng", body: "Meng vijf handen potgrond met een half handje zaad. Voeg beetje bij beetje water toe tot het mengsel plakt maar niet druipt." },
        en: { title: "Mix", body: "Mix five handfuls of potting soil with half a handful of seed. Add water bit by bit until the mixture sticks together but does not drip." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Rol balletjes", body: "Rol balletjes ter grootte van een walnoot. Leg ze op krantenpapier om te drogen." },
        en: { title: "Roll balls", body: "Roll balls about the size of a walnut. Put them on newspaper to dry." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Kies een plek", body: "Laat ze een dag drogen. Leg ze daarna op een kale plek waar je toestemming voor hebt. Kijk elke week of er iets groeit." },
        en: { title: "Choose a spot", body: "Let them dry for a day. Then place them on a bare spot you have permission for. Check every week whether anything is growing." },
      },
    ],
    safety: [
      { severity: "INFO", nl: "Was je handen na het werken met aarde.", en: "Wash your hands after working with soil." },
      { severity: "WARNING", nl: "Gooi geen zaadbommen in natuurgebieden of op andermans grond zonder toestemming.", en: "Do not throw seed bombs into nature reserves or onto someone else's land without permission." },
    ],
    reflections: [
      { nl: "Welke plek koos je, en waarom juist die?", en: "Which spot did you choose, and why that one?" },
      { nl: "Wat denk je dat er nodig is voordat er iets groeit?", en: "What do you think is needed before anything grows?" },
    ],
  },
  {
    slug: "bridge-of-five-kilos",
    categorySlug: "science",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    durationMinutes: 90,
    difficulty: "CHALLENGING",
    setting: "INDOOR",
    weather: "ANY",
    minParticipants: 1,
    maxParticipants: 4,
    isPremium: true,
    skillSlugs: ["problem-solving", "creativity", "teamwork"],
    materials: [{ slug: "paper" }, { slug: "tape" }, { slug: "ruler" }, { slug: "kitchen-scale", optional: true }],
    nl: {
      title: "Bouw een brug die vijf kilo draagt",
      summary: "Alleen papier en plakband. Kan jouw brug vijf kilo dragen over dertig centimeter?",
      story:
        "Ingenieurs bouwen bruggen die honderden tonnen dragen. Jij krijgt papier en plakband. De opdracht: een brug van dertig centimeter die vijf kilo houdt. Vouwen is jouw geheime wapen.",
      educationalObjective:
        "Het kind ontdekt hoe vorm de sterkte bepaalt, test een hypothese en verbetert een ontwerp op basis van wat er misgaat.",
      expectedResult: "Een brug tussen twee stapels boeken die minstens vijf kilo draagt, plus notities over wat je hebt aangepast.",
      preparation: ["Leg twintig vellen papier klaar", "Zet twee stapels boeken op dertig centimeter afstand", "Zoek iets van vijf kilo, bijvoorbeeld een pak rijst en flessen water"],
    },
    en: {
      title: "Build a bridge that carries five kilos",
      summary: "Paper and tape only. Can your bridge carry five kilos across thirty centimetres?",
      story:
        "Engineers build bridges that carry hundreds of tonnes. You get paper and tape. The task: a thirty-centimetre bridge that holds five kilos. Folding is your secret weapon.",
      educationalObjective:
        "The child discovers how shape determines strength, tests a hypothesis and improves a design based on what goes wrong.",
      expectedResult: "A bridge between two stacks of books that carries at least five kilos, plus notes on what you changed.",
      preparation: ["Lay out twenty sheets of paper", "Place two stacks of books thirty centimetres apart", "Find something weighing five kilos, such as a bag of rice and water bottles"],
    },
    steps: [
      {
        durationMinutes: 15,
        nl: { title: "Bedenk een plan", body: "Teken eerst je ontwerp. Praat samen over de vraag: waarom is een gevouwen strook sterker dan een platte?" },
        en: { title: "Make a plan", body: "Draw your design first. Talk together about the question: why is a folded strip stronger than a flat one?" },
      },
      {
        durationMinutes: 30,
        nl: { title: "Bouw versie 1", body: "Bouw je eerste brug. Gebruik niet meer dan tien vellen papier en een halve meter plakband.", tip: "Buisjes en driehoeken houden vaak veel meer dan platte vlakken." },
        en: { title: "Build version 1", body: "Build your first bridge. Use no more than ten sheets of paper and half a metre of tape.", tip: "Tubes and triangles usually hold far more than flat surfaces." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Test voorzichtig", body: "Leg het gewicht er langzaam op, kilo voor kilo. Kijk goed waar de brug het eerst begint te buigen." },
        en: { title: "Test carefully", body: "Add the weight slowly, kilo by kilo. Watch closely where the bridge first starts to bend." },
      },
      {
        durationMinutes: 30,
        nl: { title: "Bouw versie 2", body: "Verbeter precies dat zwakke punt en test opnieuw. Schrijf op wat je veranderd hebt en of het werkte." },
        en: { title: "Build version 2", body: "Improve exactly that weak point and test again. Write down what you changed and whether it worked." },
      },
    ],
    safety: [
      { severity: "WARNING", nl: "Zet het gewicht laag bij de grond en houd voeten weg van onder de brug.", en: "Keep the weight low to the ground and keep feet out from under the bridge." },
    ],
    reflections: [
      { nl: "Wat ging er kapot bij versie 1, en waarom denk je dat dat gebeurde?", en: "What broke in version 1, and why do you think that happened?" },
      { nl: "Welke verandering hielp het meest?", en: "Which change helped the most?" },
    ],
  },
  {
    slug: "red-cabbage-lab",
    categorySlug: "science",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    durationMinutes: 60,
    difficulty: "MEDIUM",
    setting: "INDOOR",
    weather: "ANY",
    minParticipants: 2,
    maxParticipants: 5,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["curiosity", "problem-solving"],
    materials: [{ slug: "red-cabbage" }, { slug: "pan" }, { slug: "jar", quantity: "5" }, { slug: "baking-soda" }, { slug: "lemon" }, { slug: "water" }],
    nl: {
      title: "Het rodekoollaboratorium",
      summary: "Maak je eigen kleurtest en ontdek welk keukenspul zuur of basisch is.",
      story:
        "Rodekool verstopt een geheim: het sap verandert van kleur bij zuur en bij base. Daarmee maak je een echte indicator, net als in een laboratorium, alleen dan van de groenteboer.",
      educationalObjective: "Het kind maakt kennis met zuur en base, leert voorspellingen doen en resultaten netjes noteren.",
      expectedResult: "Vijf potjes met verschillende kleuren en een tabel met jullie voorspelling en het echte resultaat.",
      preparation: ["Snijd een kwart rodekool klein (volwassene)", "Zet vijf schone potjes klaar", "Maak een tabel met de kolommen: stof, voorspelling, resultaat"],
    },
    en: {
      title: "The red cabbage laboratory",
      summary: "Make your own colour test and find out which kitchen substances are acidic or basic.",
      story:
        "Red cabbage hides a secret: its juice changes colour with acids and with bases. With it you make a real indicator, just like in a laboratory, only from the greengrocer.",
      educationalObjective: "The child meets acids and bases, learns to make predictions and to record results carefully.",
      expectedResult: "Five jars in different colours and a table with your prediction and the real result.",
      preparation: ["Chop a quarter red cabbage (adult)", "Set out five clean jars", "Make a table with the columns: substance, prediction, result"],
    },
    steps: [
      {
        durationMinutes: 20,
        requiresParent: true,
        nl: { title: "Maak het sap", body: "Een volwassene kookt de gesneden rodekool tien minuten in water en laat het afkoelen. Het paarse vocht is jullie indicator." },
        en: { title: "Make the juice", body: "An adult boils the chopped red cabbage in water for ten minutes and lets it cool. The purple liquid is your indicator." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Voorspel", body: "Schrijf per potje op wat je erin gaat doen: citroensap, baksoda, water, azijn, zeep. Voorspel welke kleur je verwacht." },
        en: { title: "Predict", body: "Write down for each jar what you will add: lemon juice, baking soda, water, vinegar, soap. Predict the colour you expect." },
      },
      {
        durationMinutes: 20,
        nl: { title: "Test", body: "Giet in elk potje wat koud koolsap en voeg een klein beetje van de stof toe. Noteer de kleur die je ziet.", tip: "Rood of roze betekent zuur, groen of geel betekent base." },
        en: { title: "Test", body: "Pour some cold cabbage juice into each jar and add a small amount of the substance. Record the colour you see.", tip: "Red or pink means acid, green or yellow means base." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Vergelijk", body: "Vergelijk je voorspelling met het resultaat. Bij welke stof zat je ernaast, en heb je een idee waarom?" },
        en: { title: "Compare", body: "Compare your prediction with the result. Which substance surprised you, and do you have an idea why?" },
      },
    ],
    safety: [
      { severity: "CRITICAL", nl: "Koken doet een volwassene. Laat het sap eerst afkoelen voordat kinderen ermee werken.", en: "An adult does the boiling. Let the juice cool before children work with it." },
      { severity: "CRITICAL", nl: "Proef niets uit de potjes en meng nooit schoonmaakmiddelen met elkaar.", en: "Do not taste anything from the jars and never mix cleaning products together." },
    ],
    reflections: [
      { nl: "Welke uitslag verraste je het meest?", en: "Which result surprised you most?" },
      { nl: "Waar zou je deze test nog meer voor kunnen gebruiken?", en: "What else could you use this test for?" },
    ],
  },
  {
    slug: "shadow-clock",
    categorySlug: "science",
    ageBands: ["AGE_6_8", "AGE_9_11"],
    seasons: ["SPRING", "SUMMER"],
    durationMinutes: 60,
    difficulty: "EASY",
    setting: "OUTDOOR",
    weather: "DRY",
    minParticipants: 1,
    maxParticipants: 5,
    skillSlugs: ["curiosity", "problem-solving"],
    materials: [{ slug: "stick" }, { slug: "stones" }, { slug: "chalk", optional: true }, { slug: "timer" }],
    nl: {
      title: "Bouw een schaduwklok",
      summary: "Zet een stok in de grond en lees de tijd af aan zijn schaduw.",
      story:
        "Duizenden jaren voordat er horloges waren, keken mensen naar de schaduw van een stok. Vandaag bouw je die klok opnieuw, en je ontdekt dat de zon precies op tijd loopt.",
      educationalObjective: "Het kind ontdekt het verband tussen de stand van de zon en de tijd, en oefent nauwkeurig markeren.",
      expectedResult: "Een schaduwklok met minstens vier gemarkeerde uren die echt de tijd aangeeft.",
      preparation: ["Kies een zonnige plek die de hele middag zon heeft", "Zoek een rechte stok van ongeveer een halve meter", "Spreek af wie elk uur gaat kijken"],
    },
    en: {
      title: "Build a shadow clock",
      summary: "Put a stick in the ground and read the time from its shadow.",
      story:
        "Thousands of years before watches existed, people looked at the shadow of a stick. Today you rebuild that clock, and discover that the sun runs exactly on time.",
      educationalObjective: "The child discovers the link between the position of the sun and the time, and practises careful marking.",
      expectedResult: "A shadow clock with at least four marked hours that really tells the time.",
      preparation: ["Choose a sunny spot that gets sun all afternoon", "Find a straight stick about half a metre long", "Agree who will check each hour"],
    },
    steps: [
      {
        durationMinutes: 10,
        nl: { title: "Zet de stok", body: "Duw de stok rechtop in de grond of zet hem vast tussen stenen. Hij moet echt recht staan." },
        en: { title: "Plant the stick", body: "Push the stick upright into the ground or wedge it between stones. It must stand truly upright." },
      },
      {
        durationMinutes: 5,
        nl: { title: "Markeer het eerste uur", body: "Leg een steentje aan het eind van de schaduw en schrijf de tijd erbij met krijt." },
        en: { title: "Mark the first hour", body: "Place a stone at the end of the shadow and write the time next to it with chalk." },
      },
      {
        durationMinutes: 40,
        nl: { title: "Kom elk uur terug", body: "Leg elk heel uur een nieuw steentje. Doe tussendoor iets anders: de zon werkt gewoon door zonder jou.", tip: "Dit is een perfecte quest om naast een andere activiteit te laten lopen." },
        en: { title: "Come back every hour", body: "Place a new stone every full hour. Do something else in between: the sun keeps working without you.", tip: "This is a perfect quest to run alongside another activity." },
      },
      {
        durationMinutes: 5,
        nl: { title: "Lees de tijd af", body: "Laat iemand anders raden hoe laat het is met jullie klok. Klopt het?" },
        en: { title: "Read the time", body: "Let someone else guess the time using your clock. Is it right?" },
      },
    ],
    safety: [
      { severity: "INFO", nl: "Kijk nooit recht in de zon en zorg voor een pet en water bij warm weer.", en: "Never look straight at the sun, and take a hat and water in warm weather." },
      { severity: "WARNING", nl: "Gebruik een stok zonder scherpe punt en zet hem niet op een looppad.", en: "Use a stick without a sharp point and do not place it on a walking path." },
    ],
    reflections: [
      { nl: "Werd de schaduw langer of korter in de loop van de middag?", en: "Did the shadow get longer or shorter during the afternoon?" },
      { nl: "Wat zou er gebeuren als je dit in de winter opnieuw doet?", en: "What would happen if you did this again in winter?" },
    ],
  },
  {
    slug: "paper-plane-lab",
    categorySlug: "science",
    ageBands: ["AGE_6_8", "AGE_9_11"],
    durationMinutes: 45,
    difficulty: "EASY",
    setting: "BOTH",
    weather: "ANY",
    minParticipants: 2,
    maxParticipants: 6,
    skillSlugs: ["problem-solving", "curiosity", "teamwork"],
    materials: [{ slug: "paper", quantity: "6 vellen" }, { slug: "ruler" }, { slug: "notebook" }],
    nl: {
      title: "Papieren vliegtuiglab",
      summary: "Drie ontwerpen, drie worpen, een winnaar. Welke vorm vliegt het verst?",
      story:
        "Iedereen kan een vliegtuigje vouwen. Maar welk vouwtje vliegt echt het verst? Vandaag ben je testpiloot en onderzoeker tegelijk: je meet, je noteert en je ontdekt de winnaar.",
      educationalObjective: "Het kind leert eerlijk vergelijken door steeds maar een ding te veranderen, en oefent meten en noteren.",
      expectedResult: "Een tabel met drie ontwerpen en drie gemeten afstanden per ontwerp, met een duidelijke winnaar.",
      preparation: ["Zoek een lange gang, gymzaal of rustig stuk buiten", "Maak een startstreep met tape of krijt", "Teken een tabel met drie rijen"],
    },
    en: {
      title: "Paper plane lab",
      summary: "Three designs, three throws, one winner. Which shape flies furthest?",
      story:
        "Anyone can fold a paper plane. But which fold really flies furthest? Today you are test pilot and researcher at once: you measure, you record and you find the winner.",
      educationalObjective: "The child learns fair comparison by changing one thing at a time, and practises measuring and recording.",
      expectedResult: "A table with three designs and three measured distances each, with a clear winner.",
      preparation: ["Find a long hallway, gym or quiet space outdoors", "Make a start line with tape or chalk", "Draw a table with three rows"],
    },
    steps: [
      {
        durationMinutes: 15,
        nl: { title: "Vouw drie ontwerpen", body: "Vouw drie duidelijk verschillende vliegtuigjes: een smal, een breed en een met een stompe neus." },
        en: { title: "Fold three designs", body: "Fold three clearly different planes: a narrow one, a wide one and one with a blunt nose." },
      },
      {
        durationMinutes: 20,
        nl: { title: "Test eerlijk", body: "Gooi elk vliegtuigje drie keer vanaf dezelfde streep, met dezelfde arm en ongeveer dezelfde kracht. Meet elke worp.", tip: "Verander steeds maar een ding, anders weet je niet waardoor het kwam." },
        en: { title: "Test fairly", body: "Throw each plane three times from the same line, with the same arm and roughly the same force. Measure every throw.", tip: "Change only one thing at a time, or you will not know what caused the difference." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Reken uit", body: "Bereken per ontwerp de gemiddelde afstand. Welke wint? Bedenk samen waarom." },
        en: { title: "Work it out", body: "Calculate the average distance for each design. Which one wins? Work out together why." },
      },
    ],
    safety: [
      { severity: "INFO", nl: "Gooi nooit richting gezichten en test niet vanaf een balkon of trap.", en: "Never throw towards faces and do not test from a balcony or staircase." },
    ],
    reflections: [
      { nl: "Welke voorspelling had je vooraf, en klopte die?", en: "What did you predict beforehand, and were you right?" },
      { nl: "Wat zou je veranderen als je nog een ontwerp mocht maken?", en: "What would you change if you could make one more design?" },
    ],
  },
];
