import type { QuestSeed } from "./quest-types";

export const FAMILY_COMMUNITY_HISTORY_QUESTS: QuestSeed[] = [
  {
    slug: "family-time-capsule",
    categorySlug: "family",
    ageBands: ["AGE_6_8", "AGE_9_11", "AGE_12_15"],
    durationMinutes: 75,
    difficulty: "EASY",
    setting: "INDOOR",
    weather: "RAIN_FRIENDLY",
    minParticipants: 2,
    maxParticipants: 8,
    skillSlugs: ["communication", "creativity", "teamwork"],
    materials: [{ slug: "jar" }, { slug: "paper" }, { slug: "pencils" }, { slug: "phone-camera", optional: true }],
    nl: {
      title: "Maak een tijdcapsule",
      summary: "Stop het heden in een pot en open hem over een jaar.",
      story:
        "Wat vind je nu het allerleukst? Wie is je beste vriend? Hoe groot ben je? Over een jaar weet je het niet meer precies. Tenzij je het vandaag opschrijft en wegstopt.",
      educationalObjective:
        "Het kind oefent reflecteren op het eigen leven en ervaart tijd als iets tastbaars, en het gezin maakt een gedeelde herinnering.",
      expectedResult: "Een dichte pot met voor elk gezinslid een brief, plus een datum waarop hij open mag.",
      preparation: ["Zoek een pot of doos die goed dicht kan", "Leg papier en pennen klaar voor iedereen", "Spreek af wanneer hij open mag"],
    },
    en: {
      title: "Make a time capsule",
      summary: "Put the present into a jar and open it in a year.",
      story:
        "What do you love most right now? Who is your best friend? How tall are you? In a year you will not remember exactly. Unless you write it down today and put it away.",
      educationalObjective:
        "The child practises reflecting on their own life and experiences time as something tangible, while the family makes a shared memory.",
      expectedResult: "A sealed jar with a letter from every family member, plus a date on which it may be opened.",
      preparation: ["Find a jar or box that closes well", "Lay out paper and pens for everyone", "Agree when it may be opened"],
    },
    steps: [
      {
        durationMinutes: 25,
        nl: { title: "Schrijf je brief", body: "Iedereen schrijft een brief aan zichzelf van over een jaar. Beantwoord in ieder geval: wat vind ik nu het leukst, waar ben ik trots op, en waar kijk ik naar uit?" },
        en: { title: "Write your letter", body: "Everyone writes a letter to themselves one year from now. Answer at least: what do I love most now, what am I proud of, and what am I looking forward to?" },
      },
      {
        durationMinutes: 25,
        nl: { title: "Kies een voorwerp", body: "Iedereen legt er een klein voorwerp bij dat iets over dit jaar zegt. Vertel elkaar waarom je het koos.", tip: "Een treinkaartje, een tekening of een lievelingssticker werkt beter dan iets duurs." },
        en: { title: "Choose an object", body: "Everyone adds a small object that says something about this year. Tell each other why you chose it.", tip: "A train ticket, a drawing or a favourite sticker works better than something expensive." },
      },
      {
        durationMinutes: 25,
        nl: { title: "Sluit en bewaar", body: "Meet iedereen en schrijf de lengtes op de buitenkant. Sluit de pot, schrijf de openingsdatum erop en zet hem ergens weg." },
        en: { title: "Seal and store", body: "Measure everyone and write the heights on the outside. Close the jar, write the opening date on it and store it away." },
      },
    ],
    safety: [{ severity: "INFO", nl: "Stop geen eten of batterijen in de capsule.", en: "Do not put food or batteries in the capsule." }],
    reflections: [
      { nl: "Wat denk je dat er over een jaar het meest veranderd is?", en: "What do you think will have changed most in a year?" },
      { nl: "Welk voorwerp van iemand anders vond je verrassend?", en: "Which object chosen by someone else surprised you?" },
    ],
  },
  {
    slug: "interview-a-grandparent",
    categorySlug: "family",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    durationMinutes: 60,
    difficulty: "EASY",
    setting: "BOTH",
    weather: "ANY",
    minParticipants: 1,
    maxParticipants: 4,
    skillSlugs: ["communication", "curiosity"],
    materials: [{ slug: "notebook" }, { slug: "pencils" }, { slug: "phone-camera", optional: true }],
    nl: {
      title: "Interview een grootouder",
      summary: "Tien vragen over vroeger, en een verhaal dat anders verloren gaat.",
      story:
        "Je opa was ooit acht jaar oud. Hij had een lievelingssnoep, een school waar hij naartoe liep en iets waar hij bang voor was. Als niemand het vraagt, verdwijnt dat verhaal. Vandaag vraag jij het.",
      educationalObjective:
        "Het kind oefent open vragen stellen en luisteren, en legt familiegeschiedenis vast die anders niet wordt doorgegeven.",
      expectedResult: "Tien vragen met antwoorden, opgeschreven of opgenomen, en bewaard voor het gezin.",
      preparation: ["Spreek een moment af met opa, oma of een oudere buur", "Bedenk vooraf tien vragen", "Vraag toestemming voordat je iets opneemt"],
    },
    en: {
      title: "Interview a grandparent",
      summary: "Ten questions about the past, and a story that would otherwise be lost.",
      story:
        "Your grandfather was eight years old once. He had a favourite sweet, a school he walked to and something he was afraid of. If nobody asks, that story disappears. Today you ask.",
      educationalObjective:
        "The child practises asking open questions and listening, and records family history that would not otherwise be passed on.",
      expectedResult: "Ten questions with answers, written down or recorded, and kept for the family.",
      preparation: ["Arrange a time with a grandparent or older neighbour", "Prepare ten questions in advance", "Ask permission before recording anything"],
    },
    steps: [
      {
        durationMinutes: 15,
        nl: { title: "Bedenk je vragen", body: "Schrijf tien vragen op die niet met ja of nee te beantwoorden zijn. Begin met: vertel eens over...", tip: "De beste vragen gaan over gewone dagen, niet over grote gebeurtenissen." },
        en: { title: "Prepare your questions", body: "Write ten questions that cannot be answered with yes or no. Start with: tell me about...", tip: "The best questions are about ordinary days, not big events." },
      },
      {
        durationMinutes: 35,
        nl: { title: "Voer het gesprek", body: "Stel je vragen en laat vooral stiltes vallen. Vraag bij elk antwoord een keer door: en toen?" },
        en: { title: "Have the conversation", body: "Ask your questions and above all let silences happen. After each answer, follow up once: and then?" },
      },
      {
        durationMinutes: 10,
        nl: { title: "Leg het vast", body: "Schrijf het mooiste antwoord helemaal uit. Bewaar het bij de familiefoto's." },
        en: { title: "Record it", body: "Write out the best answer in full. Keep it with the family photos." },
      },
    ],
    safety: [
      { severity: "INFO", nl: "Vraag altijd toestemming voordat je opneemt of een foto maakt, en deel het gesprek niet online.", en: "Always ask permission before recording or taking a photo, and do not share the conversation online." },
    ],
    reflections: [
      { nl: "Welk antwoord verraste je het meest?", en: "Which answer surprised you most?" },
      { nl: "Wat lijkt er nog steeds op jouw leven, en wat is helemaal anders?", en: "What still resembles your life, and what is completely different?" },
    ],
  },
  {
    slug: "device-free-dinner-game",
    categorySlug: "family",
    ageBands: ["AGE_6_8", "AGE_9_11", "AGE_12_15"],
    durationMinutes: 45,
    difficulty: "EASY",
    setting: "INDOOR",
    weather: "ANY",
    minParticipants: 3,
    maxParticipants: 8,
    skillSlugs: ["communication", "teamwork"],
    materials: [{ slug: "paper" }, { slug: "pencils" }, { slug: "jar", optional: true }],
    nl: {
      title: "Het schermloze tafelspel",
      summary: "Maak twintig vraagkaartjes en eet een keer zonder telefoon aan tafel.",
      story:
        "Aan tafel wordt vaak weinig gezegd, of alleen door de oudsten. Met twintig kaartjes in een pot verandert dat: iedereen trekt er een, en iedereen komt aan het woord.",
      educationalObjective:
        "Het gezin oefent gelijkwaardig gesprek voeren en het kind leert vragen bedenken en naar anderen luisteren.",
      expectedResult: "Twintig vraagkaartjes in een pot en een maaltijd waarin iedereen minstens een keer iets vertelde.",
      preparation: ["Knip twintig kaartjes", "Spreek af dat alle telefoons in een andere kamer liggen", "Zet de pot midden op tafel"],
    },
    en: {
      title: "The device-free table game",
      summary: "Make twenty question cards and eat one meal without phones at the table.",
      story:
        "Little gets said at the table, or only by the oldest. Twenty cards in a jar change that: everyone draws one, and everyone gets a turn.",
      educationalObjective:
        "The family practises having an equal conversation, and the child learns to invent questions and listen to others.",
      expectedResult: "Twenty question cards in a jar and a meal in which everyone said something at least once.",
      preparation: ["Cut twenty cards", "Agree that all phones stay in another room", "Put the jar in the middle of the table"],
    },
    steps: [
      {
        durationMinutes: 20,
        nl: { title: "Maak de kaartjes", body: "Iedereen bedenkt vier vragen. Bijvoorbeeld: wat was vandaag het gekste moment, of wie zou je willen zijn voor een dag?" },
        en: { title: "Make the cards", body: "Everyone invents four questions. For example: what was the strangest moment today, or who would you be for a day?" },
      },
      {
        durationMinutes: 20,
        nl: { title: "Speel tijdens het eten", body: "Om de beurt trekt iemand een kaartje en beantwoordt de vraag. Daarna mag iedereen een keer doorvragen.", tip: "Ouders beantwoorden de vragen ook. Dat is het halve spel." },
        en: { title: "Play during the meal", body: "In turn, someone draws a card and answers the question. Then everyone may ask one follow-up.", tip: "Parents answer the questions too. That is half the game." },
      },
      {
        durationMinutes: 5,
        nl: { title: "Bewaar de pot", body: "Zet de pot op een vaste plek zodat je hem vaker kunt gebruiken. Voeg nieuwe vragen toe wanneer je wilt." },
        en: { title: "Keep the jar", body: "Put the jar in a fixed place so you can use it again. Add new questions whenever you like." },
      },
    ],
    safety: [{ severity: "INFO", nl: "Niemand is verplicht een vraag te beantwoorden. Overslaan mag altijd.", en: "Nobody has to answer a question. Skipping is always allowed." }],
    reflections: [
      { nl: "Welk antwoord van een ander vond je verrassend?", en: "Which answer from someone else did you find surprising?" },
      { nl: "Was het lastig om zonder telefoon te eten?", en: "Was it hard to eat without a phone?" },
    ],
  },
  {
    slug: "secret-act-of-kindness",
    categorySlug: "community",
    ageBands: ["AGE_6_8", "AGE_9_11"],
    durationMinutes: 30,
    difficulty: "EASY",
    setting: "BOTH",
    weather: "ANY",
    minParticipants: 1,
    maxParticipants: 6,
    skillSlugs: ["citizenship", "creativity"],
    materials: [{ slug: "paper" }, { slug: "pencils" }],
    nl: {
      title: "Een geheime goede daad",
      summary: "Doe iets aardigs zonder dat iemand weet dat jij het was.",
      story:
        "Aardig zijn is makkelijk als er iemand kijkt. Vandaag is de opdracht moeilijker: doe iets goeds waarvan niemand weet dat jij het deed. Alleen jij weet het. Dat is precies de bedoeling.",
      educationalObjective:
        "Het kind oefent inleving en ervaart dat helpen ook waardevol is zonder beloning of bevestiging.",
      expectedResult: "Een uitgevoerde geheime goede daad, en een gesprek achteraf over hoe dat voelde.",
      preparation: ["Bedenk voor wie je iets wilt doen", "Spreek af dat niemand het doorvertelt", "Kies iets dat vandaag nog kan"],
    },
    en: {
      title: "A secret act of kindness",
      summary: "Do something kind without anyone knowing it was you.",
      story:
        "Being kind is easy when someone is watching. Today the task is harder: do something good that nobody knows you did. Only you know. That is exactly the point.",
      educationalObjective:
        "The child practises empathy and experiences that helping is valuable even without reward or recognition.",
      expectedResult: "A secret act of kindness carried out, and a conversation afterwards about how it felt.",
      preparation: ["Think of who you want to do something for", "Agree that nobody tells", "Choose something you can do today"],
    },
    steps: [
      {
        durationMinutes: 10,
        nl: { title: "Bedenk je daad", body: "Bedenk in je eentje iets aardigs. Bijvoorbeeld: de tafel dekken voordat iemand het vraagt, of een tekening onder een deur schuiven." },
        en: { title: "Think of your act", body: "On your own, think of something kind. For example: setting the table before anyone asks, or slipping a drawing under a door." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Doe het in het geheim", body: "Voer het uit zonder dat iemand het ziet. Vertel het aan niemand, ook niet aan wie het krijgt.", tip: "Als het per ongeluk toch gezien wordt, is dat niet erg. Het gaat om de bedoeling." },
        en: { title: "Do it in secret", body: "Carry it out without anyone seeing. Tell nobody, not even the person who receives it.", tip: "If someone happens to see it, that is fine. It is about the intention." },
      },
      {
        durationMinutes: 5,
        nl: { title: "Praat erover", body: "Vertel thuis wel hoe het voelde, maar niet wat je precies deed. Dat blijft jouw geheim." },
        en: { title: "Talk about it", body: "At home, share how it felt, but not what exactly you did. That stays your secret." },
      },
    ],
    safety: [
      { severity: "WARNING", nl: "Ga niet bij onbekenden naar binnen en kom niet aan andermans spullen zonder toestemming.", en: "Do not enter strangers' homes and do not touch other people's belongings without permission." },
    ],
    reflections: [
      { nl: "Hoe voelde het om niet te mogen vertellen wat je deed?", en: "How did it feel not to be allowed to tell what you did?" },
      { nl: "Zou je dit vaker willen doen?", en: "Would you like to do this more often?" },
    ],
  },
  {
    slug: "neighbourhood-sports-hour",
    categorySlug: "community",
    ageBands: ["AGE_12_15"],
    seasons: ["SPRING", "SUMMER", "AUTUMN"],
    durationMinutes: 120,
    difficulty: "CHALLENGING",
    setting: "OUTDOOR",
    weather: "DRY",
    minParticipants: 3,
    maxParticipants: 12,
    isPremium: true,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["citizenship", "teamwork", "communication", "movement"],
    materials: [{ slug: "ball" }, { slug: "chalk" }, { slug: "timer" }, { slug: "paper" }],
    nl: {
      title: "Organiseer een sportuur in de buurt",
      summary: "Jij bedenkt de spellen, nodigt uit en leidt het uur.",
      story:
        "Meedoen aan een sportactiviteit is leuk. Er een organiseren is iets heel anders: je moet bedenken, uitnodigen, uitleggen en zorgen dat iedereen meedoet. Vandaag ben jij de organisator.",
      educationalObjective:
        "De jongere oefent leidinggeven, plannen en inclusief denken, en ervaart wat er nodig is om anderen in beweging te krijgen.",
      expectedResult: "Een uitgevoerd sportuur met minstens drie spellen en een groep die het uitspeelde.",
      preparation: ["Vraag toestemming voor het veld of plein", "Nodig buurtkinderen uit met een volwassene erbij", "Bedenk drie spellen die voor alle leeftijden werken"],
    },
    en: {
      title: "Organise a neighbourhood sports hour",
      summary: "You invent the games, do the inviting and lead the hour.",
      story:
        "Taking part in a sports activity is fun. Organising one is something else entirely: you have to invent, invite, explain and make sure everyone joins in. Today you are the organiser.",
      educationalObjective:
        "The teenager practises leading, planning and inclusive thinking, and experiences what it takes to get others moving.",
      expectedResult: "A sports hour actually held, with at least three games and a group that played it through.",
      preparation: ["Ask permission for the field or square", "Invite neighbourhood children with an adult present", "Invent three games that work for all ages"],
    },
    steps: [
      {
        durationMinutes: 30,
        nl: { title: "Maak het programma", body: "Bedenk drie spellen die werken voor zowel zesjarigen als vijftienjarigen. Schrijf per spel de regels op in drie zinnen." },
        en: { title: "Make the programme", body: "Invent three games that work for six-year-olds and fifteen-year-olds alike. Write the rules of each in three sentences." },
      },
      {
        durationMinutes: 20,
        requiresParent: true,
        nl: { title: "Nodig uit", body: "Nodig samen met een volwassene buurtkinderen uit. Spreek een duidelijke tijd en plek af." },
        en: { title: "Invite", body: "Together with an adult, invite neighbourhood children. Agree a clear time and place." },
      },
      {
        durationMinutes: 60,
        requiresParent: true,
        nl: { title: "Leid het uur", body: "Leg elk spel kort uit, doe het voor en let erop dat iedereen meedoet. Wissel van spel voordat het saai wordt.", tip: "Wie het minst meedoet, geef je een taak: scheidsrechter of tijdwaarnemer." },
        en: { title: "Lead the hour", body: "Explain each game briefly, demonstrate it and watch that everyone joins in. Switch games before it gets boring.", tip: "Give whoever joins in least a role: referee or timekeeper." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Ruim op en evalueer", body: "Ruim samen op. Vraag twee deelnemers wat ze het leukst vonden." },
        en: { title: "Tidy up and evaluate", body: "Tidy up together. Ask two participants what they enjoyed most." },
      },
    ],
    safety: [
      { severity: "CRITICAL", nl: "Er is altijd een volwassene aanwezig. Nodig alleen kinderen uit met medeweten van hun ouders.", en: "An adult is always present. Only invite children with their parents' knowledge." },
      { severity: "WARNING", nl: "Kies een veld weg van verkeer, zorg voor water en stop bij hitte of onweer.", en: "Choose a field away from traffic, provide water and stop in heat or thunderstorms." },
    ],
    reflections: [
      { nl: "Wat was moeilijker dan je dacht: bedenken, uitnodigen of leidinggeven?", en: "What was harder than you expected: inventing, inviting or leading?" },
      { nl: "Hoe zorgde je ervoor dat iedereen mee kon doen?", en: "How did you make sure everyone could take part?" },
    ],
  },
  {
    slug: "litter-hero-hour",
    categorySlug: "community",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    durationMinutes: 60,
    difficulty: "EASY",
    setting: "OUTDOOR",
    weather: "DRY",
    minParticipants: 2,
    maxParticipants: 8,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["citizenship", "nature-awareness", "teamwork"],
    materials: [{ slug: "gloves" }, { slug: "rubbish-bag" }, { slug: "notebook" }],
    nl: {
      title: "Een uur zwerfafval opruimen",
      summary: "Een straat, een zak, een uur. En tel wat je vindt.",
      story:
        "Elke dag loop je langs hetzelfde blikje. Vandaag raap je het op, samen met alles wat er verder ligt. Aan het eind weet je precies wat er in jullie straat rondslingert, en dat is vaak schrikken.",
      educationalObjective:
        "Het kind ervaart directe verantwoordelijkheid voor de eigen omgeving en oefent tellen, sorteren en conclusies trekken.",
      expectedResult: "Een volle zak zwerfafval en een telling van de vijf meest gevonden soorten.",
      preparation: ["Trek stevige handschoenen aan", "Kies een route weg van drukke wegen", "Maak een turflijst met vijf categorieen"],
    },
    en: {
      title: "One hour of litter picking",
      summary: "One street, one bag, one hour. And count what you find.",
      story:
        "Every day you walk past the same can. Today you pick it up, together with everything else lying there. At the end you know exactly what is scattered around your street, and that is often a shock.",
      educationalObjective:
        "The child experiences direct responsibility for their own surroundings and practises counting, sorting and drawing conclusions.",
      expectedResult: "A full bag of litter and a count of the five most common types found.",
      preparation: ["Put on sturdy gloves", "Choose a route away from busy roads", "Make a tally sheet with five categories"],
    },
    steps: [
      {
        durationMinutes: 10,
        nl: { title: "Bereid voor", body: "Trek handschoenen aan en maak een turflijst: plastic, papier, blik, glas, sigarettenpeuken." },
        en: { title: "Prepare", body: "Put on gloves and make a tally sheet: plastic, paper, cans, glass, cigarette ends." },
      },
      {
        durationMinutes: 40,
        requiresParent: true,
        nl: { title: "Ruim op en tel", body: "Loop de route en raap op wat je tegenkomt. Zet bij elk stuk een streepje in de juiste categorie.", tip: "Doe een straat grondig in plaats van drie straten half." },
        en: { title: "Collect and count", body: "Walk the route and pick up what you find. Put a tally mark in the right category for each item.", tip: "Do one street thoroughly rather than three streets halfway." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Sorteer en bespreek", body: "Gooi het afval weg in de juiste bak. Kijk naar je turflijst: wat vonden jullie het meest, en waar zou dat vandaan komen?" },
        en: { title: "Sort and discuss", body: "Dispose of the waste in the right bin. Look at your tally: what did you find most, and where might it come from?" },
      },
    ],
    safety: [
      { severity: "CRITICAL", nl: "Raak nooit glas, naalden, batterijen of iets scherps aan. Wijs het aan een volwassene aan.", en: "Never touch glass, needles, batteries or anything sharp. Point it out to an adult." },
      { severity: "CRITICAL", nl: "Draag altijd handschoenen, was daarna je handen, en blijf weg van de rijbaan en het water.", en: "Always wear gloves, wash your hands afterwards, and stay away from the road and the water." },
    ],
    reflections: [
      { nl: "Wat vonden jullie het meest, en had je dat verwacht?", en: "What did you find most, and did you expect that?" },
      { nl: "Wat zou er moeten gebeuren zodat het er over een maand nog schoon is?", en: "What would need to happen for it to still be clean in a month?" },
    ],
  },
  {
    slug: "street-name-mystery",
    categorySlug: "history",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    durationMinutes: 60,
    difficulty: "MEDIUM",
    setting: "BOTH",
    weather: "ANY",
    minParticipants: 1,
    maxParticipants: 5,
    skillSlugs: ["curiosity", "communication", "citizenship"],
    materials: [{ slug: "notebook" }, { slug: "books-or-internet" }, { slug: "phone-camera", optional: true }],
    nl: {
      title: "Het raadsel van de straatnaam",
      summary: "Zoek uit waar jullie straat zijn naam vandaan heeft.",
      story:
        "Elke straatnaam is ooit door iemand bedacht, en bijna altijd om een reden. Een boer die daar land had, een schrijver, een oude molen die er niet meer staat. Vandaag los jij dat raadsel op.",
      educationalObjective:
        "Het kind oefent bronnen zoeken en vergelijken, en ontdekt dat de eigen omgeving een geschiedenis heeft.",
      expectedResult: "Een uitgeschreven verklaring van jullie straatnaam met minstens twee bronnen.",
      preparation: ["Schrijf de precieze straatnaam op", "Bedenk wie het zou kunnen weten: buren, bibliotheek, gemeente", "Neem een boekje mee"],
    },
    en: {
      title: "The street name mystery",
      summary: "Find out where your street got its name.",
      story:
        "Every street name was invented by someone once, and almost always for a reason. A farmer who owned the land, a writer, an old mill that no longer stands. Today you solve that mystery.",
      educationalObjective:
        "The child practises finding and comparing sources, and discovers that their own surroundings have a history.",
      expectedResult: "A written explanation of your street name with at least two sources.",
      preparation: ["Write down the exact street name", "Think who might know: neighbours, the library, the council", "Bring a notebook"],
    },
    steps: [
      {
        durationMinutes: 10,
        nl: { title: "Formuleer de vraag", body: "Schrijf je vraag precies op. Kijk of het naambordje een onderschrift heeft: veel gemeenten zetten er een korte uitleg op." },
        en: { title: "Frame the question", body: "Write your question down precisely. Check whether the street sign has a subtitle: many councils add a short explanation." },
      },
      {
        durationMinutes: 25,
        nl: { title: "Zoek twee bronnen", body: "Zoek in een boek, op de site van de gemeente, of vraag het aan een oudere buur. Gebruik minstens twee verschillende bronnen.", tip: "Spreken twee bronnen elkaar tegen? Dat is juist interessant. Schrijf het allebei op." },
        en: { title: "Find two sources", body: "Search in a book, on the council website, or ask an older neighbour. Use at least two different sources.", tip: "Do two sources contradict each other? That is interesting. Write down both." },
      },
      {
        durationMinutes: 25,
        nl: { title: "Schrijf het verhaal", body: "Schrijf in tien zinnen op wat je hebt uitgevonden. Vertel het thuis aan iemand die het nog niet wist." },
        en: { title: "Write the story", body: "Write down what you found out in ten sentences. Tell it at home to someone who did not know." },
      },
    ],
    safety: [
      { severity: "WARNING", nl: "Bel niet alleen bij onbekenden aan. Vraag buren alleen samen met een volwassene.", en: "Do not ring strangers' doorbells alone. Only approach neighbours together with an adult." },
    ],
    reflections: [
      { nl: "Wat wist je hiervoor niet over je eigen straat?", en: "What did you not know about your own street before this?" },
      { nl: "Welke bron vond je het betrouwbaarst, en waarom?", en: "Which source did you find most reliable, and why?" },
    ],
  },
  {
    slug: "then-and-now-photo",
    categorySlug: "history",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    durationMinutes: 75,
    difficulty: "MEDIUM",
    setting: "BOTH",
    weather: "DRY",
    minParticipants: 2,
    maxParticipants: 6,
    skillSlugs: ["curiosity", "creativity", "communication"],
    materials: [{ slug: "old-photo" }, { slug: "phone-camera" }],
    nl: {
      title: "Toen en nu",
      summary: "Zoek een oude familiefoto en maak hem opnieuw op dezelfde plek.",
      story:
        "Op de foto staat je moeder als kind voor een huis. Datzelfde huis staat er nog. Vandaag ga je erheen en maak je de foto opnieuw, met jullie erop. Twee foto's naast elkaar vertellen dertig jaar.",
      educationalObjective:
        "Het kind ervaart tijdsverloop concreet, oefent nauwkeurig kijken en vergelijken, en hoort familieverhalen bij een beeld.",
      expectedResult: "Twee foto's naast elkaar, oud en nieuw, met een korte tekst over wat er veranderd is.",
      preparation: ["Zoek samen een oude foto van een plek die er nog is", "Vraag wie erop staat en wanneer hij gemaakt is", "Plan wanneer jullie erheen gaan"],
    },
    en: {
      title: "Then and now",
      summary: "Find an old family photo and recreate it in the same place.",
      story:
        "In the photo your mother stands as a child in front of a house. That same house is still there. Today you go there and take the photo again, with you in it. Two photos side by side tell thirty years.",
      educationalObjective:
        "The child experiences the passage of time concretely, practises close looking and comparison, and hears family stories attached to an image.",
      expectedResult: "Two photos side by side, old and new, with a short text about what has changed.",
      preparation: ["Find an old photo of a place that still exists", "Ask who is in it and when it was taken", "Plan when you will go there"],
    },
    steps: [
      {
        durationMinutes: 20,
        nl: { title: "Kies de foto", body: "Zoek samen een oude foto van een herkenbare plek. Vraag aan wie erbij was hoe het daar toen was." },
        en: { title: "Choose the photo", body: "Find an old photo of a recognisable place together. Ask whoever was there what it was like then." },
      },
      {
        durationMinutes: 35,
        nl: { title: "Ga naar de plek", body: "Ga naar dezelfde plek en zoek precies het punt waar de oude foto genomen is. Let op hoogte en hoek.", tip: "Houd de oude foto op armlengte voor je en loop tot de lijnen kloppen." },
        en: { title: "Go to the spot", body: "Go to the same place and find exactly where the old photo was taken. Watch the height and the angle.", tip: "Hold the old photo at arm's length and walk until the lines match." },
      },
      {
        durationMinutes: 20,
        nl: { title: "Vergelijk", body: "Zet de foto's naast elkaar. Schrijf vijf dingen op die veranderd zijn en drie die hetzelfde zijn gebleven." },
        en: { title: "Compare", body: "Put the photos side by side. Write down five things that changed and three that stayed the same." },
      },
    ],
    safety: [
      { severity: "INFO", nl: "Fotografeer geen mensen zonder toestemming en betreed geen privaat terrein.", en: "Do not photograph people without permission and do not enter private property." },
    ],
    reflections: [
      { nl: "Wat was er het meest veranderd?", en: "What had changed the most?" },
      { nl: "Wat zou er over dertig jaar anders zijn op deze plek?", en: "What will be different at this spot in thirty years?" },
    ],
  },
  {
    slug: "museum-treasure-hunt",
    categorySlug: "history",
    ageBands: ["AGE_12_15"],
    durationMinutes: 120,
    difficulty: "MEDIUM",
    setting: "INDOOR",
    weather: "RAIN_FRIENDLY",
    minParticipants: 2,
    maxParticipants: 6,
    isPremium: true,
    skillSlugs: ["curiosity", "communication", "problem-solving"],
    materials: [{ slug: "notebook" }, { slug: "pencils" }],
    nl: {
      title: "Speurtocht in het museum",
      summary: "Maak zelf tien opdrachten en laat je gezin het museum anders zien.",
      story:
        "Een museum kan een lange rij glazen kasten zijn, of een speurtocht. Het verschil zit hem in de vragen die je meeneemt. Vandaag maak jij die vragen, en daarna spelen jullie ze samen.",
      educationalObjective:
        "De jongere oefent goed kijken, vragen formuleren en anderen begeleiden, en verbindt objecten aan hun verhaal.",
      expectedResult: "Tien zelfgemaakte opdrachten, uitgevoerd door het gezin in het museum.",
      preparation: ["Kies een museum en kijk de openingstijden na", "Bedenk vooraf vijf opdrachten", "Neem potlood en boekje mee, geen pen"],
    },
    en: {
      title: "Museum treasure hunt",
      summary: "Invent ten tasks yourself and make your family see the museum differently.",
      story:
        "A museum can be a long row of glass cases, or a treasure hunt. The difference is the questions you bring. Today you write those questions, and then you play them together.",
      educationalObjective:
        "The teenager practises close looking, formulating questions and guiding others, and connects objects to their story.",
      expectedResult: "Ten self-written tasks, carried out by the family in the museum.",
      preparation: ["Choose a museum and check the opening hours", "Prepare five tasks in advance", "Bring a pencil and notebook, not a pen"],
    },
    steps: [
      {
        durationMinutes: 20,
        nl: { title: "Bedenk vijf opdrachten vooraf", body: "Schrijf vijf opdrachten die in bijna elk museum werken. Bijvoorbeeld: vind het oudste voorwerp, of vind iets dat je thuis ook hebt." },
        en: { title: "Prepare five tasks", body: "Write five tasks that work in almost any museum. For example: find the oldest object, or find something you also have at home." },
      },
      {
        durationMinutes: 20,
        nl: { title: "Maak er vijf ter plekke", body: "Loop eerst zelf een zaal door en maak vijf opdrachten die alleen hier werken." },
        en: { title: "Add five on site", body: "Walk through a room by yourself first and write five tasks that only work here." },
      },
      {
        durationMinutes: 70,
        nl: { title: "Speel de speurtocht", body: "Geef iedereen de lijst en ga op pad. Bespreek na elke vondst kort waarom het antwoord klopt.", tip: "Kijk bij elk gevonden voorwerp ook naar het bordje: daar staat het verhaal." },
        en: { title: "Play the hunt", body: "Give everyone the list and set off. After each find, briefly discuss why the answer is right.", tip: "For every object found, read the label as well: that is where the story is." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Kies de winnaar", body: "Kies samen het mooiste voorwerp van de dag en vertel waarom." },
        en: { title: "Pick the winner", body: "Together choose the best object of the day and say why." },
      },
    ],
    safety: [
      { severity: "WARNING", nl: "Raak niets aan en blijf achter de lijnen. Volg de huisregels van het museum.", en: "Do not touch anything and stay behind the lines. Follow the museum's house rules." },
      { severity: "INFO", nl: "Blijf bij elkaar en spreek een verzamelplek af.", en: "Stay together and agree a meeting point." },
    ],
    reflections: [
      { nl: "Welk voorwerp bleef je het langst bij?", en: "Which object stayed with you longest?" },
      { nl: "Welke opdracht die je bedacht werkte het best?", en: "Which task that you invented worked best?" },
    ],
  },
];
