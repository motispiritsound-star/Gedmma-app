import type { QuestSeed } from "./quest-types";

export const MOVEMENT_CREATIVE_COOKING_QUESTS: QuestSeed[] = [
  {
    slug: "garden-obstacle-course",
    categorySlug: "movement",
    ageBands: ["AGE_6_8", "AGE_9_11"],
    durationMinutes: 45,
    difficulty: "EASY",
    setting: "OUTDOOR",
    weather: "DRY",
    minParticipants: 2,
    maxParticipants: 6,
    skillSlugs: ["movement", "creativity", "problem-solving"],
    materials: [{ slug: "chalk" }, { slug: "rope", optional: true }, { slug: "timer" }, { slug: "cushions", optional: true }],
    nl: {
      title: "Ontwerp een hindernisbaan",
      summary: "Bedenk zes hindernissen, zet ze uit en verbeter je eigen tijd.",
      story:
        "Een tuin, een stoep of een stukje park verandert in een parcours zodra jij het bedenkt. Springen, balanceren, kruipen, draaien. Jij bent de ontwerper en de atleet.",
      educationalObjective: "Het kind oefent grove motoriek, ruimtelijk plannen en het opdelen van een taak in stappen.",
      expectedResult: "Een parcours met zes hindernissen en minstens twee gemeten rondes per deelnemer.",
      preparation: ["Kies een veilig stuk buiten", "Ruim losse spullen op die in de weg liggen", "Spreek af waar de start en finish zijn"],
    },
    en: {
      title: "Design an obstacle course",
      summary: "Invent six obstacles, lay them out and beat your own time.",
      story:
        "A garden, a pavement or a patch of park becomes a course the moment you invent it. Jumping, balancing, crawling, spinning. You are the designer and the athlete.",
      educationalObjective: "The child practises gross motor skills, spatial planning and breaking a task into steps.",
      expectedResult: "A course with six obstacles and at least two timed runs per participant.",
      preparation: ["Choose a safe space outdoors", "Clear away loose items in the way", "Agree where the start and finish are"],
    },
    steps: [
      {
        durationMinutes: 15,
        nl: { title: "Bedenk zes hindernissen", body: "Teken je parcours eerst op papier. Denk aan springen, balanceren, kruipen, gooien, draaien en rennen.", tip: "Gebruik wat er al is: een bankje, een stoeprand, een boom." },
        en: { title: "Invent six obstacles", body: "Draw your course on paper first. Think of jumping, balancing, crawling, throwing, spinning and running.", tip: "Use what is already there: a bench, a kerb, a tree." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Bouw en test", body: "Zet het parcours uit met krijt en spullen. Loop het een keer rustig door om te kijken of alles veilig kan." },
        en: { title: "Build and test", body: "Lay out the course with chalk and objects. Walk it once slowly to check that everything can be done safely." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Klok de rondes", body: "Iedereen doet twee rondes. Meet de tijd. Probeer je eigen tijd te verbeteren, niet die van een ander." },
        en: { title: "Time the runs", body: "Everyone does two runs. Take the time. Try to beat your own time, not someone else's." },
      },
    ],
    safety: [
      { severity: "WARNING", nl: "Bouw geen hindernissen hoger dan heuphoogte en houd het parcours weg van de weg.", en: "Do not build obstacles higher than hip height, and keep the course away from the road." },
      { severity: "INFO", nl: "Doe een warming-up van twee minuten voor de eerste ronde.", en: "Do a two-minute warm-up before the first run." },
    ],
    reflections: [
      { nl: "Welke hindernis was het moeilijkst en hoe loste je dat op?", en: "Which obstacle was hardest, and how did you solve it?" },
      { nl: "Werd je tweede ronde sneller? Waardoor kwam dat?", en: "Was your second run faster? What made the difference?" },
    ],
  },
  {
    slug: "explorer-walk-mission",
    categorySlug: "movement",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    durationMinutes: 75,
    difficulty: "MEDIUM",
    setting: "OUTDOOR",
    weather: "ANY",
    minParticipants: 2,
    maxParticipants: 6,
    skillSlugs: ["movement", "nature-awareness", "teamwork"],
    materials: [{ slug: "notebook" }, { slug: "pencils" }, { slug: "phone-camera", optional: true }],
    nl: {
      title: "Ontdekkingstocht met opdrachten",
      summary: "Een wandeling van een uur met tien kleine missies onderweg.",
      story:
        "Wandelen is saai, zeggen sommige kinderen. Tot je onderweg tien geheime opdrachten krijgt: iets roods vinden, een brug tellen, de oudste deur van de straat zoeken. Dan is het geen wandeling meer, maar een expeditie.",
      educationalObjective: "Het kind traint uithoudingsvermogen en aandacht, en leert de eigen omgeving nauwkeuriger bekijken.",
      expectedResult: "Een afgelegde route van minstens drie kilometer met tien afgevinkte missies.",
      preparation: ["Kies samen een route van ongeveer drie kilometer", "Schrijf tien missies op een briefje", "Neem water mee"],
    },
    en: {
      title: "Explorer walk with missions",
      summary: "An hour-long walk with ten small missions along the way.",
      story:
        "Walking is boring, some children say. Until you get ten secret missions on the way: find something red, count a bridge, find the oldest door in the street. Then it is not a walk any more, it is an expedition.",
      educationalObjective: "The child builds stamina and attention, and learns to look at their own surroundings more closely.",
      expectedResult: "A completed route of at least three kilometres with ten missions ticked off.",
      preparation: ["Choose a route of about three kilometres together", "Write ten missions on a note", "Bring water"],
    },
    steps: [
      {
        durationMinutes: 10,
        nl: { title: "Schrijf de missies", body: "Bedenk samen tien opdrachten. Bijvoorbeeld: vind een huisnummer boven de honderd, tel de bruggen, zoek drie soorten dakpannen." },
        en: { title: "Write the missions", body: "Invent ten tasks together. For example: find a house number above one hundred, count the bridges, find three kinds of roof tile." },
      },
      {
        durationMinutes: 55,
        nl: { title: "Loop de route", body: "Loop de route en vink onderweg de missies af. Leg de telefoon weg tussen de opdrachten door.", tip: "Laat het jongste kind de kaart of het briefje dragen." },
        en: { title: "Walk the route", body: "Walk the route and tick off the missions on the way. Put the phone away between tasks.", tip: "Let the youngest child carry the map or the note." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Sluit af", body: "Ga zitten en bespreek welke missie het lastigst was. Kies samen de mooiste vondst van de dag." },
        en: { title: "Wrap up", body: "Sit down and discuss which mission was hardest. Choose the best find of the day together." },
      },
    ],
    safety: [
      { severity: "WARNING", nl: "Spreek af waar jullie oversteken en blijf bij elkaar bij drukke wegen.", en: "Agree where you will cross and stay together near busy roads." },
      { severity: "INFO", nl: "Neem water mee en kijk het weerbericht vooraf.", en: "Bring water and check the forecast beforehand." },
    ],
    reflections: [
      { nl: "Welke missie was het lastigst?", en: "Which mission was the hardest?" },
      { nl: "Wat zag je onderweg dat je nooit eerder was opgevallen?", en: "What did you see on the way that you had never noticed before?" },
    ],
  },
  {
    slug: "family-dance-routine",
    categorySlug: "movement",
    ageBands: ["AGE_6_8", "AGE_9_11", "AGE_12_15"],
    durationMinutes: 45,
    difficulty: "EASY",
    setting: "INDOOR",
    weather: "RAIN_FRIENDLY",
    minParticipants: 2,
    maxParticipants: 8,
    skillSlugs: ["movement", "creativity", "teamwork"],
    materials: [{ slug: "timer", optional: true }],
    nl: {
      title: "Maak een dansroutine van twee minuten",
      summary: "Iedereen bedenkt acht tellen. Samen wordt het een echte routine.",
      story:
        "Een lied van twee minuten, en iedereen in huis bedenkt een stukje. De jongste ook. Aan het eind heb je iets wat niemand alleen had kunnen maken.",
      educationalObjective: "Het kind oefent ritme, geheugen en samenwerken, en leert een groepsproduct maken waarin iedereen zichtbaar is.",
      expectedResult: "Een routine van twee minuten die jullie minstens een keer helemaal achter elkaar dansen.",
      preparation: ["Ruim een stuk vloer vrij", "Kies samen een lied van ongeveer twee minuten", "Zet telefoons op stil"],
    },
    en: {
      title: "Make a two-minute dance routine",
      summary: "Everyone invents eight counts. Together it becomes a real routine.",
      story:
        "A two-minute song, and everyone in the house invents a piece. The youngest too. At the end you have something nobody could have made alone.",
      educationalObjective: "The child practises rhythm, memory and collaboration, and learns to make a group product in which everyone is visible.",
      expectedResult: "A two-minute routine you dance all the way through at least once.",
      preparation: ["Clear a patch of floor", "Choose a song of about two minutes together", "Put phones on silent"],
    },
    steps: [
      {
        durationMinutes: 15,
        nl: { title: "Ieder acht tellen", body: "Iedereen bedenkt in zijn eentje een stukje van acht tellen. Leer het daarna aan de anderen." },
        en: { title: "Eight counts each", body: "Everyone invents a piece of eight counts on their own. Then teach it to the others." },
      },
      {
        durationMinutes: 20,
        nl: { title: "Plak het aan elkaar", body: "Zet de stukjes achter elkaar. Oefen de overgangen extra: daar gaat het altijd mis.", tip: "Tel hardop mee, dat helpt iedereen." },
        en: { title: "Stitch it together", body: "Put the pieces in order. Practise the transitions extra: that is where it always goes wrong.", tip: "Count out loud, it helps everyone." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Dans hem helemaal", body: "Dans de hele routine minstens een keer zonder te stoppen. Applaus voor iedereen." },
        en: { title: "Dance it all the way", body: "Dance the whole routine at least once without stopping. Applause for everyone." },
      },
    ],
    safety: [
      { severity: "INFO", nl: "Dans op blote voeten of gympen, niet op sokken op een gladde vloer.", en: "Dance barefoot or in trainers, not in socks on a slippery floor." },
    ],
    reflections: [
      { nl: "Welk stukje van iemand anders vond je het leukst?", en: "Which part invented by someone else did you enjoy most?" },
      { nl: "Wat was moeilijker: bedenken of onthouden?", en: "Which was harder: inventing or remembering?" },
    ],
  },
  {
    slug: "cardboard-city",
    categorySlug: "creativity",
    ageBands: ["AGE_6_8", "AGE_9_11"],
    durationMinutes: 90,
    difficulty: "MEDIUM",
    setting: "INDOOR",
    weather: "RAIN_FRIENDLY",
    minParticipants: 1,
    maxParticipants: 5,
    skillSlugs: ["creativity", "problem-solving", "teamwork"],
    materials: [{ slug: "cardboard" }, { slug: "scissors" }, { slug: "tape" }, { slug: "pencils" }, { slug: "glue", optional: true }],
    nl: {
      title: "Bouw een kartonnen stad",
      summary: "Van lege dozen naar een stad met straten, winkels en een plein.",
      story:
        "In elke lege doos zit een gebouw verstopt. Vandaag bouwen jullie een hele stad: waar komt de school, waar het park, en wie woont er in het hoge gebouw op de hoek?",
      educationalObjective: "Het kind oefent ruimtelijk inzicht, plannen en fijne motoriek, en leert keuzes maken over een gedeelde ruimte.",
      expectedResult: "Een stad van minstens zes gebouwen op een ondergrond, met straten en namen.",
      preparation: ["Verzamel lege dozen en kokers", "Leg een groot vel karton neer als ondergrond", "Bedenk samen hoe de stad gaat heten"],
    },
    en: {
      title: "Build a cardboard city",
      summary: "From empty boxes to a city with streets, shops and a square.",
      story:
        "Every empty box has a building hidden inside. Today you build a whole city: where does the school go, where is the park, and who lives in the tall building on the corner?",
      educationalObjective: "The child practises spatial thinking, planning and fine motor skills, and learns to make choices about a shared space.",
      expectedResult: "A city of at least six buildings on a base, with streets and names.",
      preparation: ["Collect empty boxes and tubes", "Lay down a large sheet of cardboard as the base", "Decide together what the city will be called"],
    },
    steps: [
      {
        durationMinutes: 15,
        nl: { title: "Maak een plattegrond", body: "Teken op de ondergrond waar de straten komen. Bepaal samen welke gebouwen er zeker moeten zijn." },
        en: { title: "Draw a map", body: "Draw on the base where the streets will go. Decide together which buildings must definitely be there." },
      },
      {
        durationMinutes: 50,
        nl: { title: "Bouw de gebouwen", body: "Maak per persoon minstens twee gebouwen. Knip ramen en deuren uit en plak ze op hun plek.", tip: "Een koker wordt een toren, een pak wordt een flat." },
        en: { title: "Build the buildings", body: "Make at least two buildings per person. Cut out windows and doors and stick them in place.", tip: "A tube becomes a tower, a cereal box becomes a block of flats." },
      },
      {
        durationMinutes: 25,
        nl: { title: "Geef de stad leven", body: "Teken straatnamen, maak bomen en bankjes en bedenk wie er woont. Geef elk gebouw een naam." },
        en: { title: "Bring the city to life", body: "Draw street names, make trees and benches and decide who lives there. Give every building a name." },
      },
    ],
    safety: [
      { severity: "WARNING", nl: "Jongere kinderen knippen met een kinderschaar; snijden met een mes doet een volwassene.", en: "Younger children cut with child scissors; cutting with a knife is done by an adult." },
    ],
    reflections: [
      { nl: "Welk gebouw ben je het meest trots op?", en: "Which building are you most proud of?" },
      { nl: "Wat ontbreekt er nog in jullie stad?", en: "What is still missing in your city?" },
    ],
  },
  {
    slug: "story-in-six-objects",
    categorySlug: "creativity",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    durationMinutes: 60,
    difficulty: "MEDIUM",
    setting: "BOTH",
    weather: "ANY",
    minParticipants: 2,
    maxParticipants: 6,
    skillSlugs: ["creativity", "communication"],
    materials: [{ slug: "paper" }, { slug: "pencils" }],
    nl: {
      title: "Een verhaal in zes voorwerpen",
      summary: "Zoek zes willekeurige dingen in huis en maak er een verhaal van.",
      story:
        "Een sleutel, een lepel, een oude knoop. Los van elkaar niets bijzonders. Maar leg ze op tafel en er ontstaat vanzelf een verhaal, als je goed genoeg kijkt.",
      educationalObjective: "Het kind oefent verhalende structuur, verbeelding en het vertellen aan een publiek.",
      expectedResult: "Een verhaal met begin, midden en eind waarin alle zes voorwerpen voorkomen, hardop verteld.",
      preparation: ["Zoek zes voorwerpen die niets met elkaar te maken hebben", "Leg ze in een rij op tafel", "Spreek af wie eerst vertelt"],
    },
    en: {
      title: "A story in six objects",
      summary: "Find six random things around the house and turn them into a story.",
      story:
        "A key, a spoon, an old button. Nothing special on their own. But lay them on the table and a story appears by itself, if you look hard enough.",
      educationalObjective: "The child practises narrative structure, imagination and telling a story to an audience.",
      expectedResult: "A story with a beginning, middle and end that uses all six objects, told out loud.",
      preparation: ["Find six objects that have nothing to do with each other", "Lay them in a row on the table", "Agree who tells first"],
    },
    steps: [
      {
        durationMinutes: 10,
        nl: { title: "Verzamel", body: "Zoek ieder drie voorwerpen zonder te overleggen. Leg ze samen op tafel." },
        en: { title: "Collect", body: "Everyone finds three objects without discussing. Put them on the table together." },
      },
      {
        durationMinutes: 25,
        nl: { title: "Bedenk het verhaal", body: "Bedenk in stilte een verhaal waarin alle zes voorwerpen een rol spelen. Schrijf drie kernzinnen op: begin, midden, eind.", tip: "Het gekste voorwerp is meestal de beste hoofdrolspeler." },
        en: { title: "Invent the story", body: "In silence, invent a story in which all six objects play a part. Write down three key sentences: beginning, middle, end.", tip: "The strangest object usually makes the best main character." },
      },
      {
        durationMinutes: 25,
        nl: { title: "Vertel het", body: "Vertel je verhaal hardop aan de anderen. De luisteraars mogen daarna een ding noemen dat ze het mooist vonden." },
        en: { title: "Tell it", body: "Tell your story out loud to the others. Listeners then name one thing they liked best." },
      },
    ],
    safety: [{ severity: "INFO", nl: "Gebruik geen breekbare of gevaarlijke voorwerpen.", en: "Do not use fragile or dangerous objects." }],
    reflections: [
      { nl: "Welk voorwerp was het moeilijkst om in je verhaal te passen?", en: "Which object was hardest to fit into your story?" },
      { nl: "Wat vond je het mooist aan het verhaal van iemand anders?", en: "What did you like most about someone else's story?" },
    ],
  },
  {
    slug: "natural-paint-lab",
    categorySlug: "creativity",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    seasons: ["SPRING", "SUMMER", "AUTUMN"],
    durationMinutes: 75,
    difficulty: "MEDIUM",
    setting: "BOTH",
    weather: "ANY",
    minParticipants: 1,
    maxParticipants: 5,
    isPremium: true,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["creativity", "curiosity", "nature-awareness"],
    materials: [{ slug: "jar", quantity: "4" }, { slug: "water" }, { slug: "paper" }, { slug: "vegetables" }, { slug: "measuring-cup", optional: true }],
    nl: {
      title: "Maak verf van de natuur",
      summary: "Bieten, koffie, gras en bessen worden jouw eigen kleurenpalet.",
      story:
        "Lang voordat er verfwinkels waren, haalden mensen kleur uit planten en aarde. Vandaag maak jij vier kleuren die niemand anders precies zo heeft.",
      educationalObjective: "Het kind ontdekt waar kleurstoffen vandaan komen, en oefent doseren, testen en vergelijken.",
      expectedResult: "Vier zelfgemaakte kleuren en een kleurenkaart waarop elke kleur getest is.",
      preparation: ["Verzamel bietensap, koffiedik, gras en rode bessen of ui", "Zet vier potjes klaar", "Bescherm de tafel met krant"],
    },
    en: {
      title: "Make paint from nature",
      summary: "Beetroot, coffee, grass and berries become your own colour palette.",
      story:
        "Long before paint shops existed, people took colour from plants and earth. Today you make four colours nobody else has in exactly that shade.",
      educationalObjective: "The child discovers where pigments come from and practises measuring, testing and comparing.",
      expectedResult: "Four home-made colours and a colour card on which each one has been tested.",
      preparation: ["Collect beetroot juice, coffee grounds, grass and red berries or onion skin", "Set out four jars", "Protect the table with newspaper"],
    },
    steps: [
      {
        durationMinutes: 25,
        requiresParent: true,
        nl: { title: "Haal de kleur eruit", body: "Pers, wrijf of week elk ingredient in een klein beetje warm water. Een volwassene helpt met warm water en snijden." },
        en: { title: "Get the colour out", body: "Press, rub or soak each ingredient in a little warm water. An adult helps with hot water and cutting." },
      },
      {
        durationMinutes: 25,
        nl: { title: "Test op papier", body: "Schilder van elke kleur een streep op papier. Maak van elke kleur ook een lichtere versie met extra water.", tip: "Een snufje zout of azijn maakt sommige kleuren feller." },
        en: { title: "Test on paper", body: "Paint a stripe of each colour on paper. Also make a lighter version of each with extra water.", tip: "A pinch of salt or vinegar makes some colours brighter." },
      },
      {
        durationMinutes: 25,
        nl: { title: "Maak iets", body: "Schilder met je eigen kleuren een klein werk. Laat het drogen en kijk de volgende dag of de kleur veranderd is." },
        en: { title: "Make something", body: "Paint a small piece with your own colours. Let it dry and check the next day whether the colour has changed." },
      },
    ],
    safety: [
      { severity: "CRITICAL", nl: "Gebruik geen onbekende bessen of planten en stop niets in je mond.", en: "Do not use unknown berries or plants, and put nothing in your mouth." },
      { severity: "WARNING", nl: "Warm water en snijden doet een volwassene. Draag oude kleren: bietensap gaat er slecht uit.", en: "An adult handles hot water and cutting. Wear old clothes: beetroot juice stains." },
    ],
    reflections: [
      { nl: "Welke kleur werd anders dan je had verwacht?", en: "Which colour turned out different from what you expected?" },
      { nl: "Waarom denk je dat mensen vroeger juist deze planten gebruikten?", en: "Why do you think people in the past used exactly these plants?" },
    ],
  },
  {
    slug: "budget-family-meal",
    categorySlug: "cooking",
    ageBands: ["AGE_12_15"],
    durationMinutes: 90,
    difficulty: "MEDIUM",
    setting: "INDOOR",
    weather: "ANY",
    minParticipants: 2,
    maxParticipants: 6,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["financial-literacy", "practical-independence", "problem-solving"],
    materials: [{ slug: "coins", quantity: "10 euro" }, { slug: "notebook" }, { slug: "pan" }, { slug: "knife-child-safe" }, { slug: "vegetables" }],
    nl: {
      title: "Gezonde maaltijd voor een klein budget",
      summary: "Tien euro, vier personen, een echte maaltijd. Jij bent de chef en de boekhouder.",
      story:
        "Koken is rekenen. Vandaag krijg jij een budget van tien euro en de opdracht om er een gezonde maaltijd voor vier personen van te maken. Je plant, je koopt in, je kookt, en aan het eind vergelijk je wat je dacht met wat het werd.",
      educationalObjective:
        "De jongere oefent begroten, prijzen vergelijken, plannen en veilig koken, en ontdekt wat gezond eten werkelijk kost.",
      expectedResult: "Een maaltijd voor vier personen, een kassabon en een overzicht van geplande versus werkelijke kosten.",
      preparation: ["Spreek het budget af en geef het contant mee", "Kies samen een winkel op loopafstand", "Zoek een recept dat past bij wat jullie kunnen"],
    },
    en: {
      title: "Healthy family meal on a small budget",
      summary: "Ten euros, four people, a real meal. You are the chef and the bookkeeper.",
      story:
        "Cooking is arithmetic. Today you get a budget of ten euros and the task of making a healthy meal for four from it. You plan, you shop, you cook, and at the end you compare what you expected with what happened.",
      educationalObjective:
        "The teenager practises budgeting, comparing prices, planning and safe cooking, and discovers what healthy food really costs.",
      expectedResult: "A meal for four, a receipt, and an overview of planned versus actual cost.",
      preparation: ["Agree the budget and hand it over in cash", "Choose a shop within walking distance together", "Find a recipe that matches what you can cook"],
    },
    steps: [
      {
        durationMinutes: 20,
        nl: { title: "Maak het plan", body: "Kies een recept en schrijf alle ingredienten op met een geschatte prijs. Tel op: past het binnen tien euro?", tip: "Groente van het seizoen en peulvruchten zijn bijna altijd het goedkoopst." },
        en: { title: "Make the plan", body: "Choose a recipe and list every ingredient with an estimated price. Add it up: does it fit within ten euros?", tip: "Seasonal vegetables and pulses are almost always cheapest." },
      },
      {
        durationMinutes: 25,
        requiresParent: true,
        nl: { title: "Doe de boodschappen", body: "Ga samen naar de winkel. Vergelijk merken en formaten. Blijf binnen het budget, ook als dat betekent dat je iets moet schrappen." },
        en: { title: "Do the shopping", body: "Go to the shop together. Compare brands and sizes. Stay within budget, even if that means dropping something." },
      },
      {
        durationMinutes: 35,
        requiresParent: true,
        nl: { title: "Kook de maaltijd", body: "Kook zelf, met een volwassene in de buurt. Snijden en het fornuis: eerst uitleggen, dan doen." },
        en: { title: "Cook the meal", body: "Do the cooking yourself, with an adult nearby. Cutting and the hob: explain first, then do." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Reken na", body: "Vergelijk de kassabon met je plan. Wat was duurder dan gedacht? Wat viel mee?" },
        en: { title: "Do the maths", body: "Compare the receipt with your plan. What was more expensive than expected? What was cheaper?" },
      },
    ],
    safety: [
      { severity: "CRITICAL", nl: "Werken met messen en een heet fornuis gebeurt met een volwassene erbij.", en: "Working with knives and a hot hob happens with an adult present." },
      { severity: "WARNING", nl: "Was groente, houd rauw vlees gescheiden en was je handen tussendoor.", en: "Wash vegetables, keep raw meat separate and wash your hands in between." },
    ],
    reflections: [
      { nl: "Wat viel je op over de prijzen in de winkel?", en: "What did you notice about the prices in the shop?" },
      { nl: "Wat zou je een volgende keer anders inkopen?", en: "What would you buy differently next time?" },
    ],
  },
  {
    slug: "no-bake-energy-balls",
    categorySlug: "cooking",
    ageBands: ["AGE_6_8", "AGE_9_11"],
    durationMinutes: 40,
    difficulty: "EASY",
    setting: "INDOOR",
    weather: "RAIN_FRIENDLY",
    minParticipants: 1,
    maxParticipants: 6,
    skillSlugs: ["practical-independence", "teamwork"],
    materials: [{ slug: "oats-and-dates" }, { slug: "kitchen-scale" }, { slug: "jar", optional: true }],
    nl: {
      title: "Energieballetjes zonder oven",
      summary: "Wegen, kneden, rollen. Klaar in veertig minuten, zonder vuur.",
      story:
        "Soms is de beste keukenquest er een zonder oven en zonder mes. Wegen, kneden en rollen: aan het eind heb je iets zelfgemaakts om mee te nemen naar school.",
      educationalObjective: "Het kind oefent wegen en afmeten, volgt een recept zelfstandig en ervaart succes zonder risico.",
      expectedResult: "Twaalf energieballetjes in een bakje, klaar voor de koelkast.",
      preparation: ["Was je handen", "Zet de weegschaal klaar", "Leg een schone schaal en bakpapier neer"],
    },
    en: {
      title: "No-bake energy balls",
      summary: "Weigh, knead, roll. Done in forty minutes, no heat involved.",
      story:
        "Sometimes the best kitchen quest is one with no oven and no knife. Weigh, knead and roll: at the end you have something home-made to take to school.",
      educationalObjective: "The child practises weighing and measuring, follows a recipe independently and experiences success without risk.",
      expectedResult: "Twelve energy balls in a container, ready for the fridge.",
      preparation: ["Wash your hands", "Set out the scale", "Put out a clean bowl and baking paper"],
    },
    steps: [
      {
        durationMinutes: 10,
        nl: { title: "Weeg af", body: "Weeg 150 gram havermout en 150 gram ontpitte dadels. Voeg twee eetlepels pindakaas toe als jullie die hebben." },
        en: { title: "Weigh it out", body: "Weigh 150 grams of oats and 150 grams of pitted dates. Add two tablespoons of peanut butter if you have it." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Kneed", body: "Kneed alles met je handen tot een stevige massa. Te droog? Voeg een lepel water toe. Te plakkerig? Voeg havermout toe.", tip: "Kneden is het leukste deel. Laat het jongste kind dit doen." },
        en: { title: "Knead", body: "Knead everything by hand into a firm mass. Too dry? Add a spoon of water. Too sticky? Add oats.", tip: "Kneading is the best part. Let the youngest child do it." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Rol en koel", body: "Rol twaalf balletjes en leg ze op bakpapier. Zet ze een half uur in de koelkast en proef ze daarna samen." },
        en: { title: "Roll and chill", body: "Roll twelve balls and put them on baking paper. Chill for half an hour and then taste them together." },
      },
    ],
    safety: [
      { severity: "WARNING", nl: "Let op noten- en pinda-allergie bij iedereen die meeeet.", en: "Watch out for nut and peanut allergies among everyone who will eat them." },
      { severity: "INFO", nl: "Was handen voor en na het kneden.", en: "Wash hands before and after kneading." },
    ],
    reflections: [
      { nl: "Wat was het leukste om te doen: wegen, kneden of rollen?", en: "What was most fun: weighing, kneading or rolling?" },
      { nl: "Wat zou je de volgende keer toevoegen?", en: "What would you add next time?" },
    ],
  },
  {
    slug: "soup-from-leftovers",
    categorySlug: "cooking",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    seasons: ["AUTUMN", "WINTER"],
    durationMinutes: 60,
    difficulty: "MEDIUM",
    setting: "INDOOR",
    weather: "COLD",
    minParticipants: 2,
    maxParticipants: 5,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["practical-independence", "problem-solving", "citizenship"],
    materials: [{ slug: "vegetables" }, { slug: "pan" }, { slug: "knife-child-safe" }, { slug: "measuring-cup" }],
    nl: {
      title: "Soep van wat er nog ligt",
      summary: "Kijk in de koelkast, gooi niets weg en maak er soep van.",
      story:
        "In elke koelkast ligt een halve wortel, een stukje prei en een courgette die morgen te oud is. Samen worden dat vier borden soep. Weggooien is voor mensen zonder fantasie.",
      educationalObjective: "Het kind leert improviseren met een recept, ervaart hoeveel eten er anders verspild wordt, en oefent veilig koken.",
      expectedResult: "Een pan soep van restgroenten, met een lijstje van wat jullie gered hebben.",
      preparation: ["Inventariseer samen de koelkast", "Zet een grote pan klaar", "Spreek af wie snijdt en wie roert"],
    },
    en: {
      title: "Soup from what is left",
      summary: "Look in the fridge, throw nothing away and turn it into soup.",
      story:
        "In every fridge there is half a carrot, a bit of leek and a courgette that will be too old tomorrow. Together they make four bowls of soup. Throwing food away is for people without imagination.",
      educationalObjective: "The child learns to improvise with a recipe, sees how much food would otherwise be wasted, and practises safe cooking.",
      expectedResult: "A pot of soup from leftover vegetables, with a list of what you rescued.",
      preparation: ["Take stock of the fridge together", "Set out a large pot", "Agree who cuts and who stirs"],
    },
    steps: [
      {
        durationMinutes: 10,
        nl: { title: "Inventariseer", body: "Zoek alle groente die binnenkort weg zou moeten. Schrijf op wat je vindt en weeg het." },
        en: { title: "Take stock", body: "Find all the vegetables that would soon be thrown out. Write down what you find and weigh it." },
      },
      {
        durationMinutes: 20,
        requiresParent: true,
        nl: { title: "Snijd en fruit", body: "Snijd alles in gelijke stukken. Fruit ui en knoflook eerst, voeg dan de harde groenten toe.", tip: "Gelijke stukken worden tegelijk gaar. Dat is het hele geheim." },
        en: { title: "Cut and fry", body: "Cut everything into equal pieces. Fry onion and garlic first, then add the hard vegetables.", tip: "Equal pieces cook at the same speed. That is the whole secret." },
      },
      {
        durationMinutes: 25,
        requiresParent: true,
        nl: { title: "Laat sudderen", body: "Voeg water of bouillon toe en laat twintig minuten zachtjes koken. Proef en breng op smaak." },
        en: { title: "Let it simmer", body: "Add water or stock and let it simmer gently for twenty minutes. Taste and season." },
      },
      {
        durationMinutes: 5,
        nl: { title: "Reken uit", body: "Kijk op je lijstje: hoeveel gram eten hebben jullie gered van de prullenbak?" },
        en: { title: "Do the maths", body: "Look at your list: how many grams of food did you rescue from the bin?" },
      },
    ],
    safety: [
      { severity: "CRITICAL", nl: "Snijden en de hete pan: altijd met een volwassene erbij.", en: "Cutting and the hot pot: always with an adult present." },
      { severity: "WARNING", nl: "Gebruik geen groente die schimmelt of vies ruikt.", en: "Do not use vegetables that are mouldy or smell off." },
    ],
    reflections: [
      { nl: "Hoeveel eten hebben jullie gered?", en: "How much food did you rescue?" },
      { nl: "Wat kunnen jullie thuis doen om minder weg te gooien?", en: "What can you do at home to throw away less?" },
    ],
  },
];
