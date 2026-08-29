import type { SeedQuest } from '../quest-types'

/** Entrepreneurship, family connection, social contribution, history and culture. */
export const peopleQuests: SeedQuest[] = [
  // ---------------------------------------------------- entrepreneurship ---
  {
    slug: 'handmade-product-stall',
    category: 'entrepreneurship',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 120,
    difficulty: 'CHALLENGING',
    setting: 'BOTH',
    weather: ['DRY'],
    minParticipants: 2,
    maxParticipants: 5,
    requiresAdult: true,
    isPremium: true,
    skills: ['financial-literacy', 'creativity', 'communication', 'teamwork'],
    materials: [
      { slug: 'paper' },
      { slug: 'pencil' },
      { slug: 'cardboard' },
      { slug: 'coins' },
      { slug: 'scissors' },
    ],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'An adult agrees the location and stays present. Sell only to people you know, at home or at a family event - not to strangers in the street.',
        nl: 'Een volwassene keurt de plek goed en blijft erbij. Verkoop alleen aan mensen die je kent, thuis of op een familiefeest — niet aan onbekenden op straat.',
      },
      {
        severity: 'INFO',
        en: 'Do not put your address, school or full name on anything you make.',
        nl: 'Zet je adres, school of volledige naam nergens op.',
      },
    ],
    steps: [
      {
        minutes: 20,
        en: {
          title: 'Find a real need first',
          instruction:
            'Ask three people what small thing annoys them or what they would happily pay a euro for. Write down their exact words. Do not pitch an idea yet - just listen.',
        },
        nl: {
          title: 'Zoek eerst een echte behoefte',
          instruction:
            'Vraag drie mensen wat hen irriteert of waar ze graag een euro voor zouden betalen. Schrijf hun eigen woorden op. Pitch nog geen idee — luister alleen.',
        },
      },
      {
        minutes: 25,
        en: {
          title: 'Make one prototype',
          instruction:
            'Make a single example of your product - a bookmark, a seed bomb, a bracelet, a card, a jar of something. One. Not twenty. You are testing the idea, not filling a shop.',
        },
        nl: {
          title: 'Maak één prototype',
          instruction:
            'Maak één exemplaar van je product — een boekenlegger, een zaadbom, een armband, een kaart, een potje van iets. Eén. Geen twintig. Je test het idee, je vult geen winkel.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Work out what it costs you',
          instruction:
            'Add up the materials for one item, then estimate your time. Write the cost price. Your selling price has to be higher, and you have to be able to explain why it is worth it.',
        },
        nl: {
          title: 'Reken uit wat het jou kost',
          instruction:
            'Tel de materialen voor één exemplaar op en schat je tijd in. Schrijf de kostprijs op. Je verkoopprijs moet hoger zijn, en je moet kunnen uitleggen waarom het dat waard is.',
        },
      },
      {
        minutes: 35,
        requiresAdult: true,
        en: {
          title: 'Show it to five people',
          instruction:
            'Show your prototype to five people you know and ask what they would pay - before you name a price. Write every answer down, including the awkward ones.',
        },
        nl: {
          title: 'Laat het aan vijf mensen zien',
          instruction:
            'Laat je prototype aan vijf bekenden zien en vraag wat zij zouden betalen — voordat jij een prijs noemt. Schrijf elk antwoord op, ook de ongemakkelijke.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Decide: build, change or stop',
          instruction:
            'Look at your numbers honestly. Would you make money? Make the decision out loud: build more, change the product, or stop. Stopping on purpose is a real business skill.',
        },
        nl: {
          title: 'Beslis: doorgaan, aanpassen of stoppen',
          instruction:
            'Kijk eerlijk naar je cijfers. Zou je er geld mee verdienen? Neem de beslissing hardop: meer maken, product aanpassen, of stoppen. Bewust stoppen is een echte ondernemersvaardigheid.',
        },
      },
    ],
    en: {
      title: 'Design and sell a handmade product',
      shortDescription:
        'Ask what people actually need, make one, price it honestly, and find out if anyone would buy it.',
      story:
        'Most first businesses fail because someone made a hundred of something nobody asked for. You are going to do it the other way round: listen first, make one, then decide.',
      educationalObjective:
        'Children learn cost price versus selling price, customer research before production, and that deciding to stop is a legitimate outcome.',
      expectedResult: 'One prototype, a written cost price, five recorded opinions and a decision.',
      preparation: [
        'Agree with an adult who you may show the product to.',
        'Collect materials you already have at home.',
        'Take paper to write down what people say, word for word.',
      ],
      reflectionQuestions: [
        'What did people say that you did not expect?',
        'Was your first price too high or too low, and how do you know?',
      ],
    },
    nl: {
      title: 'Ontwerp en verkoop een zelfgemaakt product',
      shortDescription:
        'Vraag wat mensen echt nodig hebben, maak er één, bereken een eerlijke prijs en ontdek of iemand het koopt.',
      story:
        'De meeste eerste bedrijfjes mislukken omdat iemand honderd dingen maakte waar niemand om vroeg. Jij doet het andersom: eerst luisteren, één maken, dan beslissen.',
      educationalObjective:
        'Kinderen leren kostprijs versus verkoopprijs, klantonderzoek vóór productie, en dat besluiten te stoppen een geldige uitkomst is.',
      expectedResult: 'Eén prototype, een opgeschreven kostprijs, vijf genoteerde meningen en een besluit.',
      preparation: [
        'Spreek met een volwassene af aan wie je het product mag laten zien.',
        'Verzamel materialen die je al in huis hebt.',
        'Neem papier mee om letterlijk op te schrijven wat mensen zeggen.',
      ],
      reflectionQuestions: [
        'Wat zeiden mensen dat je niet verwachtte?',
        'Was je eerste prijs te hoog of te laag, en hoe weet je dat?',
      ],
    },
  },
  {
    slug: 'price-detective',
    category: 'entrepreneurship',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 45,
    difficulty: 'MEDIUM',
    setting: 'BOTH',
    weather: ['ANY'],
    minParticipants: 1,
    maxParticipants: 4,
    requiresAdult: true,
    skills: ['financial-literacy', 'problem-solving', 'curiosity'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }, { slug: 'bag' }],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'Go to the shop with an adult, and never photograph shop staff or other customers.',
        nl: 'Ga met een volwassene naar de winkel en fotografeer nooit personeel of andere klanten.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Choose five everyday things',
          instruction:
            'Pick five things your household actually buys: bread, milk, pasta, soap, apples. Write down what you think each one costs, before you go.',
        },
        nl: {
          title: 'Kies vijf alledaagse dingen',
          instruction:
            'Kies vijf dingen die jullie huishouden echt koopt: brood, melk, pasta, zeep, appels. Schrijf op wat je denkt dat elk kost, vóór je gaat.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Compare price per kilo, not per pack',
          instruction:
            'In the shop, find the small price-per-kilo or per-litre label on the shelf edge. Write down the cheapest and most expensive version of each item, with the unit price.',
        },
        nl: {
          title: 'Vergelijk kiloprijs, niet pakprijs',
          instruction:
            'Zoek in de winkel het kleine prijs-per-kilo- of per-literlabel op de schaprand. Noteer van elk product de goedkoopste en duurste variant, met de eenheidsprijs.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Find the trick',
          instruction:
            'Look for at least one case where the bigger pack is more expensive per kilo, or where an offer is not actually cheaper. There is almost always one.',
        },
        nl: {
          title: 'Zoek de truc',
          instruction:
            'Zoek minstens één geval waar het grotere pak duurder is per kilo, of waar een aanbieding niet echt goedkoper is. Er is er bijna altijd één.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Report to the household',
          instruction:
            'Tell the family what you found and what you would buy differently. Compare your guesses with reality: how far off were you?',
        },
        nl: {
          title: 'Rapporteer aan het huishouden',
          instruction:
            'Vertel thuis wat je vond en wat je voortaan anders zou kopen. Vergelijk je schattingen met de werkelijkheid: hoe ver zat je ernaast?',
        },
      },
    ],
    en: {
      title: 'Price detective',
      shortDescription: 'Guess five prices, then check them against the unit price on the shelf edge.',
      story:
        'Shops are designed so the cheaper option is not the obvious one. Learn to read the small print on the shelf edge and you can see straight through it.',
      educationalObjective:
        'Children learn to compare unit prices rather than headline prices, calibrate their sense of everyday costs, and spot common pricing tricks.',
      expectedResult: 'A table of five products with guessed and real unit prices, plus one pricing trick found.',
      preparation: [
        'Agree the shop and the time with an adult.',
        'Write your five products and your guesses first.',
        'Take paper and a pencil rather than a phone.',
      ],
      reflectionQuestions: [
        'Which guess was furthest off, and why do you think that was?',
        'What would you change about how your household shops?',
      ],
    },
    nl: {
      title: 'Prijsdetective',
      shortDescription: 'Raad vijf prijzen en controleer ze met de kiloprijs op de schaprand.',
      story:
        'Winkels zijn zo ingericht dat de goedkoopste keuze niet de opvallendste is. Leer de kleine letters op de schaprand lezen en je kijkt er dwars doorheen.',
      educationalObjective:
        'Kinderen leren eenheidsprijzen vergelijken in plaats van pakprijzen, ijken hun gevoel voor dagelijkse kosten, en herkennen veelgebruikte prijstrucs.',
      expectedResult: 'Een tabel met vijf producten, geraden en echte eenheidsprijzen, plus één gevonden prijstruc.',
      preparation: [
        'Spreek de winkel en het tijdstip af met een volwassene.',
        'Schrijf eerst je vijf producten en je schattingen op.',
        'Neem papier en potlood mee in plaats van een telefoon.',
      ],
      reflectionQuestions: [
        'Welke schatting zat er het verst naast, en waardoor denk je dat dat kwam?',
        'Wat zou je veranderen aan hoe jullie boodschappen doen?',
      ],
    },
  },
  {
    slug: 'household-job-board',
    category: 'entrepreneurship',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 60,
    difficulty: 'MEDIUM',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 2,
    maxParticipants: 6,
    skills: ['financial-literacy', 'communication', 'teamwork'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }, { slug: 'cardboard' }],
    steps: [
      {
        minutes: 15,
        en: {
          title: 'List the work nobody enjoys',
          instruction:
            'Walk through the house together and list every recurring job: bins, laundry, hoovering, dishwasher, plants, bathroom. Be honest about how long each really takes.',
        },
        nl: {
          title: 'Maak een lijst van het werk dat niemand leuk vindt',
          instruction:
            'Loop samen door het huis en noteer elke terugkerende klus: vuilnis, was, stofzuigen, vaatwasser, planten, badkamer. Wees eerlijk over hoe lang elke klus echt duurt.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Put a value on each job',
          instruction:
            'For each job, agree what it is worth - in money, in screen time, or in a favour. The point is that everyone agrees the same job has the same value whoever does it.',
        },
        nl: {
          title: 'Geef elke klus een waarde',
          instruction:
            'Spreek per klus af wat hij waard is — in geld, in tijd, of in een wederdienst. Het punt is dat iedereen het eens is dat dezelfde klus dezelfde waarde heeft, wie hem ook doet.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Build the board',
          instruction:
            'Make a physical board from cardboard with a card per job, showing the job, its value and how often it comes round. Hang it where everyone passes it.',
        },
        nl: {
          title: 'Bouw het bord',
          instruction:
            'Maak een fysiek bord van karton met een kaartje per klus: de klus, de waarde en hoe vaak hij terugkomt. Hang het op waar iedereen langsloopt.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Agree the contract',
          instruction:
            'Write down the rules everyone signs: what happens when a job is claimed and not done, and when the deal is reviewed. Everyone signs it, adults included.',
        },
        nl: {
          title: 'Spreek het contract af',
          instruction:
            'Schrijf de regels op die iedereen ondertekent: wat er gebeurt als een klus geclaimd maar niet gedaan wordt, en wanneer de afspraak herzien wordt. Iedereen tekent, ook de volwassenen.',
        },
      },
    ],
    en: {
      title: 'The household job board',
      shortDescription:
        'Turn the invisible work of a household into a visible board with agreed value and a signed contract.',
      story:
        'Most household arguments are about work nobody can see. Make it visible, agree what each job is worth, and the arguing mostly stops.',
      educationalObjective:
        'Children experience negotiation, valuing labour, and honouring an agreement, and see the real weight of household work.',
      expectedResult: 'A physical job board, agreed values, and a contract signed by everyone.',
      preparation: [
        'Get everyone in the house together for the discussion.',
        'Find cardboard and something to write with.',
        'Agree in advance that adult jobs go on the board too.',
      ],
      reflectionQuestions: [
        'Which job turned out to take much longer than people thought?',
        'What will you do the first time somebody does not do a claimed job?',
      ],
    },
    nl: {
      title: 'Het klussenbord',
      shortDescription:
        'Maak het onzichtbare werk van een huishouden zichtbaar op een bord, met afgesproken waarde en een getekend contract.',
      story:
        'De meeste ruzies in huis gaan over werk dat niemand ziet. Maak het zichtbaar, spreek af wat elke klus waard is, en het gemopper stopt grotendeels.',
      educationalObjective:
        'Kinderen ervaren onderhandelen, werk waarderen en een afspraak nakomen, en zien hoe zwaar huishoudelijk werk echt weegt.',
      expectedResult: 'Een fysiek klussenbord, afgesproken waarden en een contract dat iedereen tekende.',
      preparation: [
        'Zorg dat iedereen in huis bij het gesprek is.',
        'Zoek karton en iets om mee te schrijven.',
        'Spreek vooraf af dat de klussen van volwassenen ook op het bord komen.',
      ],
      reflectionQuestions: [
        'Welke klus bleek veel langer te duren dan mensen dachten?',
        'Wat doen jullie de eerste keer dat iemand een geclaimde klus niet doet?',
      ],
    },
  },

  // -------------------------------------------------- family connection ---
  {
    slug: 'grandparent-interview',
    category: 'family-connection',
    ageBands: ['AGE_6_8', 'AGE_9_11', 'AGE_12_15'],
    durationMinutes: 60,
    difficulty: 'EASY',
    setting: 'BOTH',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 1,
    maxParticipants: 4,
    skills: ['communication', 'curiosity', 'citizenship'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }, { slug: 'phone-camera', optional: true }],
    safety: [
      {
        severity: 'INFO',
        en: 'Ask permission before recording anything, and stop if a memory becomes upsetting.',
        nl: 'Vraag toestemming voordat je iets opneemt, en stop als een herinnering te zwaar wordt.',
      },
    ],
    steps: [
      {
        minutes: 15,
        en: {
          title: 'Write questions that cannot be answered with yes',
          instruction:
            'Write eight questions that need a story: "What did your bedroom look like?", "What was the first thing you bought with your own money?", "What did you get in trouble for?". Avoid anything answerable with yes or no.',
        },
        nl: {
          title: 'Schrijf vragen die niet met ja te beantwoorden zijn',
          instruction:
            'Schrijf acht vragen die om een verhaal vragen: "Hoe zag je slaapkamer eruit?", "Wat was het eerste dat je van eigen geld kocht?", "Waar kreeg je straf voor?". Vermijd alles wat met ja of nee kan.',
        },
      },
      {
        minutes: 30,
        en: {
          title: 'Interview and stay quiet',
          instruction:
            'Ask a question, then say nothing. Let the silence do the work. The best stories arrive three seconds after you thought the answer was finished.',
          audioScript:
            'Ask a question, then say nothing. Let the silence do the work. The best stories arrive about three seconds after you thought the answer was finished.',
        },
        nl: {
          title: 'Interview en houd je stil',
          instruction:
            'Stel een vraag en zeg dan niets. Laat de stilte het werk doen. De beste verhalen komen drie seconden nadat je dacht dat het antwoord klaar was.',
          audioScript:
            'Stel een vraag en zeg dan niets. Laat de stilte het werk doen. De beste verhalen komen ongeveer drie seconden nadat je dacht dat het antwoord klaar was.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Ask the one extra question',
          instruction:
            'Pick the answer that interested you most and ask one more question about it. That follow-up is usually where the real story is.',
        },
        nl: {
          title: 'Stel die ene extra vraag',
          instruction:
            'Kies het antwoord dat je het meest boeide en stel er nog één vraag over. In die doorvraag zit meestal het echte verhaal.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Write down one sentence, exactly',
          instruction:
            'Write one sentence in their exact words, and the date. Keep it. In twenty years that sentence will be worth more than any photograph.',
        },
        nl: {
          title: 'Schrijf één zin letterlijk op',
          instruction:
            'Schrijf één zin op in hun eigen woorden, met de datum erbij. Bewaar hem. Over twintig jaar is die zin meer waard dan welke foto ook.',
        },
      },
    ],
    en: {
      title: 'Interview a grandparent about childhood',
      shortDescription: 'Eight open questions, one long silence, and a sentence worth keeping forever.',
      story:
        'Everybody in your family has stories nobody has asked for. Ask eight proper questions, stay quiet long enough, and you will hear something you never knew.',
      educationalObjective:
        'Children practise open questioning and active listening, and connect to family history through first-hand testimony.',
      expectedResult: 'Eight questions asked, one follow-up, and one sentence written down word for word.',
      preparation: [
        'Arrange the visit or call in advance.',
        'Write your eight questions beforehand.',
        'Agree that this is a conversation, not a performance.',
      ],
      reflectionQuestions: [
        'Which answer surprised you the most?',
        'What is one thing that was completely different when they were your age?',
      ],
    },
    nl: {
      title: 'Interview een opa of oma over vroeger',
      shortDescription: 'Acht open vragen, één lange stilte, en een zin die je voor altijd bewaart.',
      story:
        'Iedereen in je familie heeft verhalen waar nooit iemand naar vroeg. Stel acht goede vragen, houd je lang genoeg stil, en je hoort iets wat je nooit wist.',
      educationalObjective:
        'Kinderen oefenen open vragen stellen en actief luisteren, en verbinden zich met familiegeschiedenis via getuigenis uit de eerste hand.',
      expectedResult: 'Acht vragen gesteld, één doorvraag, en één zin letterlijk opgeschreven.',
      preparation: [
        'Plan het bezoek of telefoontje vooraf.',
        'Schrijf je acht vragen van tevoren op.',
        'Spreek af dat dit een gesprek is, geen optreden.',
      ],
      reflectionQuestions: [
        'Welk antwoord verbaasde je het meest?',
        'Wat was totaal anders toen zij zo oud waren als jij?',
      ],
    },
  },
  {
    slug: 'family-time-capsule',
    category: 'family-connection',
    ageBands: ['AGE_6_8', 'AGE_9_11', 'AGE_12_15'],
    durationMinutes: 75,
    difficulty: 'EASY',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 2,
    maxParticipants: 8,
    isPremium: true,
    skills: ['communication', 'creativity', 'curiosity'],
    materials: [
      { slug: 'box-with-lid' },
      { slug: 'paper' },
      { slug: 'pencil' },
      { slug: 'envelope' },
      { slug: 'tape' },
    ],
    safety: [
      {
        severity: 'INFO',
        en: 'Keep the capsule indoors and dry. Do not bury it without the property owner’s permission.',
        nl: 'Bewaar de capsule binnen en droog. Begraaf hem niet zonder toestemming van de eigenaar van de grond.',
      },
    ],
    steps: [
      {
        minutes: 20,
        en: {
          title: 'Write to your future selves',
          instruction:
            'Everyone writes a letter to themselves five years from now: what you love right now, what you are worried about, what you hope will have changed. Seal each one in its own envelope.',
        },
        nl: {
          title: 'Schrijf aan jezelf in de toekomst',
          instruction:
            'Iedereen schrijft een brief aan zichzelf over vijf jaar: wat je nu geweldig vindt, waar je over inzit, wat je hoopt dat veranderd is. Doe elke brief in een eigen envelop.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Collect the evidence of now',
          instruction:
            'Add small ordinary things: a receipt, a bus ticket, a drawing, a song title, a hand outline of the youngest. Ordinary things age best - a receipt says more in five years than a posed photograph.',
        },
        nl: {
          title: 'Verzamel het bewijs van nu',
          instruction:
            'Voeg kleine gewone dingen toe: een bonnetje, een buskaartje, een tekening, de titel van een lied, de omtrek van de hand van de jongste. Gewone dingen verouderen het mooist — een bonnetje zegt over vijf jaar meer dan een geposeerde foto.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Record the household facts',
          instruction:
            'Fill one page with facts: who lives here, everyone’s height, the price of bread, what you argue about, what you eat on Fridays, who is the loudest in the morning.',
        },
        nl: {
          title: 'Noteer de huisfeiten',
          instruction:
            'Vul één pagina met feiten: wie hier woont, hoe lang iedereen is, wat brood kost, waar je ruzie over maakt, wat je op vrijdag eet, wie het luidst is in de ochtend.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Seal it and set the date',
          instruction:
            'Tape the box shut and write the opening date in big letters. Put it somewhere dry and slightly inconvenient, so nobody opens it by accident.',
        },
        nl: {
          title: 'Verzegel hem en zet de datum',
          instruction:
            'Plak de doos dicht en schrijf de openingsdatum er groot op. Zet hem ergens droog en net een beetje onhandig, zodat niemand hem per ongeluk openmaakt.',
        },
      },
    ],
    en: {
      title: 'Create a family time capsule',
      shortDescription: 'Letters to your future selves, ordinary objects, and a date five years from now.',
      story:
        'In five years nobody will remember what a loaf of bread cost or what you argued about on a Tuesday. Seal it in a box now and find out how much changes.',
      educationalObjective:
        'Children practise reflection and perspective-taking across time, and see their present life as something worth documenting.',
      expectedResult: 'A sealed box with a letter per person, small objects and a page of household facts.',
      preparation: [
        'Find a box with a lid that nobody needs.',
        'Get one envelope per person.',
        'Agree the opening date before you start.',
      ],
      reflectionQuestions: [
        'What did you find hardest to write in your letter?',
        'What do you think will have changed most by the opening date?',
      ],
    },
    nl: {
      title: 'Maak een gezinstijdcapsule',
      shortDescription: 'Brieven aan jezelf in de toekomst, gewone voorwerpen, en een datum over vijf jaar.',
      story:
        'Over vijf jaar weet niemand meer wat een brood kostte of waar je op een dinsdag ruzie over had. Doe het nu in een doos en ontdek hoeveel er verandert.',
      educationalObjective:
        'Kinderen oefenen reflectie en perspectief nemen over tijd, en zien hun huidige leven als iets dat het waard is vast te leggen.',
      expectedResult: 'Een dichtgeplakte doos met een brief per persoon, kleine voorwerpen en een pagina huisfeiten.',
      preparation: [
        'Zoek een doos met deksel die niemand nodig heeft.',
        'Zorg voor één envelop per persoon.',
        'Spreek de openingsdatum af voordat je begint.',
      ],
      reflectionQuestions: [
        'Wat vond je het moeilijkst om in je brief te schrijven?',
        'Wat denk je dat er tegen de openingsdatum het meest veranderd is?',
      ],
    },
  },
  {
    slug: 'invent-a-dinner-ritual',
    category: 'family-connection',
    ageBands: ['AGE_6_8', 'AGE_9_11', 'AGE_12_15'],
    durationMinutes: 45,
    difficulty: 'EASY',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 2,
    maxParticipants: 8,
    skills: ['communication', 'creativity', 'teamwork'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Notice what already happens',
          instruction:
            'Talk about what your dinners are actually like right now: who talks, who does not, what interrupts. No blaming - you are describing, not judging.',
        },
        nl: {
          title: 'Merk op wat er al gebeurt',
          instruction:
            'Praat over hoe jullie avondeten nu echt verloopt: wie praat, wie niet, wat het onderbreekt. Niet verwijten — je beschrijft, je oordeelt niet.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Invent three candidate rituals',
          instruction:
            'Invent three small things you could do at every dinner: a round of highs and lows, one question from a jar, a candle lit by the youngest, a minute of quiet before eating. Each must take under five minutes.',
        },
        nl: {
          title: 'Bedenk drie mogelijke rituelen',
          instruction:
            'Bedenk drie kleine dingen die je bij elk avondeten kunt doen: een rondje hoogte- en dieptepunt, één vraag uit een pot, een kaars aangestoken door de jongste, een minuut stilte voor het eten. Elk moet binnen vijf minuten passen.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Test one tonight',
          instruction:
            'Pick one and do it at dinner tonight, properly, without laughing it off. A ritual only works if everyone actually commits the first time.',
        },
        nl: {
          title: 'Test er vanavond één',
          instruction:
            'Kies er één en doe hem vanavond bij het eten, serieus, zonder hem weg te lachen. Een ritueel werkt alleen als iedereen de eerste keer echt meedoet.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Decide together',
          instruction:
            'Afterwards, everyone says keep, change or drop. If it is kept, write it on a card and put it where you eat.',
        },
        nl: {
          title: 'Beslis samen',
          instruction:
            'Iedereen zegt daarna: houden, aanpassen of laten vallen. Als hij blijft, schrijf hem dan op een kaartje en zet het waar jullie eten.',
        },
      },
    ],
    en: {
      title: 'Invent your own dinner ritual',
      shortDescription: 'Design three small rituals, test one tonight, and decide together what stays.',
      story:
        'The families who talk most at dinner are not luckier; they have a habit that makes it happen. Design one of your own and try it out tonight.',
      educationalObjective:
        'Children practise observing group dynamics without blame, designing a small intervention, and evaluating it honestly.',
      expectedResult: 'One ritual tested at a real dinner, and a group decision about keeping it.',
      preparation: [
        'Do this before dinner, not during.',
        'Make sure everyone who eats together is there.',
        'Agree that nobody is being criticised.',
      ],
      reflectionQuestions: [
        'What changed about the conversation when you did the ritual?',
        'Who talked more than usual, and why do you think that was?',
      ],
    },
    nl: {
      title: 'Verzin je eigen eetritueel',
      shortDescription: 'Ontwerp drie kleine rituelen, test er vanavond één, en beslis samen wat blijft.',
      story:
        'Gezinnen die het meest praten aan tafel hebben niet meer geluk; ze hebben een gewoonte die het laat gebeuren. Ontwerp er zelf een en probeer hem vanavond.',
      educationalObjective:
        'Kinderen oefenen groepsdynamiek waarnemen zonder verwijt, een kleine ingreep ontwerpen en die eerlijk evalueren.',
      expectedResult: 'Eén ritueel getest bij een echt avondeten, en een gezamenlijk besluit erover.',
      preparation: [
        'Doe dit vóór het eten, niet tijdens.',
        'Zorg dat iedereen die meeeet erbij is.',
        'Spreek af dat er niemand bekritiseerd wordt.',
      ],
      reflectionQuestions: [
        'Wat veranderde er aan het gesprek toen jullie het ritueel deden?',
        'Wie praatte meer dan anders, en waardoor denk je dat dat kwam?',
      ],
    },
  },

  // ------------------------------------------------ social contribution ---
  {
    slug: 'secret-act-of-kindness',
    category: 'social-contribution',
    ageBands: ['AGE_6_8', 'AGE_9_11', 'AGE_12_15'],
    durationMinutes: 30,
    difficulty: 'EASY',
    setting: 'BOTH',
    weather: ['ANY'],
    minParticipants: 1,
    maxParticipants: 6,
    skills: ['citizenship', 'creativity', 'communication'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }],
    safety: [
      {
        severity: 'CAUTION',
        en: 'Do it only for people you know, and never enter anyone’s home or garden without permission.',
        nl: 'Doe het alleen voor mensen die je kent, en ga nooit zonder toestemming iemands huis of tuin in.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Choose someone and notice what they need',
          instruction:
            'Pick one person - a neighbour, a sibling, a teacher, a parent. Think about what would actually help them, not what would be fun to give. Those are usually different.',
        },
        nl: {
          title: 'Kies iemand en let op wat die nodig heeft',
          instruction:
            'Kies één persoon — een buurvrouw, je broer of zus, een leerkracht, een ouder. Bedenk wat die echt zou helpen, niet wat leuk is om te geven. Dat is meestal niet hetzelfde.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Do it without being seen',
          instruction:
            'Carry it out: bring the bins in, leave a drawing, tidy something, put a note where they will find it. The rule is that they must not know it was you.',
        },
        nl: {
          title: 'Doe het zonder gezien te worden',
          instruction:
            'Voer het uit: zet de vuilnisbak terug, leg een tekening neer, ruim iets op, leg een briefje waar ze het vinden. De regel is dat ze niet mogen weten dat jij het was.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Sit with not being thanked',
          instruction:
            'Talk about how it feels to do something good that nobody thanks you for. That feeling is the whole point of this quest.',
        },
        nl: {
          title: 'Blijf zitten met het uitblijven van dank',
          instruction:
            'Praat over hoe het voelt om iets goeds te doen waar niemand je voor bedankt. Dat gevoel is precies waar dit avontuur om draait.',
        },
      },
    ],
    en: {
      title: 'A secret act of kindness',
      shortDescription: 'Do one genuinely useful thing for someone, and make sure they never find out it was you.',
      story:
        'It is easy to be kind when someone is watching. This one only counts if nobody knows it was you - which turns out to be the harder version.',
      educationalObjective:
        'Children practise empathy - working out what someone actually needs - and experience intrinsic rather than social reward.',
      expectedResult: 'One anonymous helpful act carried out, and a conversation about how it felt.',
      preparation: [
        'Agree the boundaries of where you may go.',
        'Think about what the person needs, not what you want to give.',
        'Agree the rule: no telling, not even later.',
      ],
      reflectionQuestions: [
        'What did you want to do that would have been more about you than them?',
        'How did it feel not to be thanked?',
      ],
    },
    nl: {
      title: 'Een geheime goede daad',
      shortDescription: 'Doe iets echt nuttigs voor iemand, en zorg dat die nooit ontdekt dat jij het was.',
      story:
        'Aardig zijn is makkelijk als iemand kijkt. Dit telt alleen als niemand weet dat jij het was — en dat blijkt de moeilijkere versie.',
      educationalObjective:
        'Kinderen oefenen empathie — uitzoeken wat iemand echt nodig heeft — en ervaren een beloning van binnenuit in plaats van sociale waardering.',
      expectedResult: 'Eén anonieme hulpvaardige daad uitgevoerd, en een gesprek over hoe het voelde.',
      preparation: [
        'Spreek af waar je wel en niet mag komen.',
        'Bedenk wat de persoon nodig heeft, niet wat jij wilt geven.',
        'Spreek de regel af: niet vertellen, ook later niet.',
      ],
      reflectionQuestions: [
        'Wat wilde je doen dat eigenlijk meer over jou dan over hen ging?',
        'Hoe voelde het om niet bedankt te worden?',
      ],
    },
  },
  {
    slug: 'street-clean-up',
    category: 'social-contribution',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 45,
    difficulty: 'EASY',
    setting: 'OUTDOOR',
    weather: ['DRY'],
    minParticipants: 2,
    maxParticipants: 8,
    requiresAdult: true,
    skills: ['citizenship', 'teamwork', 'nature-awareness'],
    materials: [{ slug: 'bag' }, { slug: 'paper' }, { slug: 'pencil' }],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'An adult comes along. Wear gloves, and never pick up glass, needles, or anything you cannot identify - point it out to the adult instead.',
        nl: 'Een volwassene gaat mee. Draag handschoenen en raap nooit glas, naalden of iets onbekends op — wijs het aan de volwassene.',
      },
      {
        severity: 'CAUTION',
        en: 'Stay on the pavement, well away from traffic and water.',
        nl: 'Blijf op de stoep, ver van verkeer en water.',
      },
    ],
    steps: [
      {
        minutes: 5,
        en: {
          title: 'Pick a stretch, not a city',
          instruction:
            'Choose one short stretch - one street, one path, one edge of a park. Doing a small area properly beats half-doing a big one.',
        },
        nl: {
          title: 'Kies een stuk, geen stad',
          instruction:
            'Kies één kort stuk — één straat, één pad, één rand van een park. Een klein gebied goed doen is beter dan een groot gebied half.',
        },
      },
      {
        minutes: 25,
        requiresAdult: true,
        en: {
          title: 'Clean and count',
          instruction:
            'Collect litter and keep a tally of what you find by type: wrappers, cans, bottles, cigarette ends, masks. The count is what turns tidying into data.',
        },
        nl: {
          title: 'Ruim op en tel',
          instruction:
            'Verzamel zwerfafval en houd een turflijst bij per soort: wikkels, blikjes, flessen, peuken, mondkapjes. Dat tellen maakt van opruimen data.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Find the source',
          instruction:
            'Look at your tally. What was there most of, and where did most of it sit? Litter clusters near a cause: a bus stop, a takeaway, a missing bin.',
        },
        nl: {
          title: 'Zoek de bron',
          instruction:
            'Kijk naar je turflijst. Waarvan lag er het meest, en waar lag het meeste? Zwerfafval hoopt zich op bij een oorzaak: een bushalte, een snackbar, een ontbrekende prullenbak.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Say what should change',
          instruction:
            'Write one sentence proposing what would fix the cause - a bin here, a sign there. Give it to an adult who can pass it on to the council.',
        },
        nl: {
          title: 'Zeg wat er moet veranderen',
          instruction:
            'Schrijf één zin met wat de oorzaak zou oplossen — hier een prullenbak, daar een bordje. Geef hem aan een volwassene die het kan doorgeven aan de gemeente.',
        },
      },
    ],
    en: {
      title: 'Clean one street and count what you find',
      shortDescription: 'Tidy a short stretch properly, tally what you collect, and work out where it comes from.',
      story:
        'Picking up litter is good. Working out why it is there is better. Clean one short stretch, count what you find, and follow the trail back to the cause.',
      educationalObjective:
        'Children link direct action to analysis: collecting data as they work and reasoning from it to a proposal.',
      expectedResult: 'A cleaned stretch, a tally by litter type, and one written proposal.',
      preparation: [
        'Get gloves and a bag for everyone.',
        'Agree the stretch and the route with an adult.',
        'Take paper for the tally.',
      ],
      reflectionQuestions: [
        'What did you find most of, and where was it concentrated?',
        'What would actually stop it appearing again?',
      ],
    },
    nl: {
      title: 'Maak één straat schoon en tel wat je vindt',
      shortDescription: 'Ruim een kort stuk goed op, turf wat je verzamelt, en zoek uit waar het vandaan komt.',
      story:
        'Zwerfafval oprapen is goed. Uitzoeken waaróm het er ligt is beter. Maak één kort stuk schoon, tel wat je vindt, en volg het spoor terug naar de oorzaak.',
      educationalObjective:
        'Kinderen koppelen directe actie aan analyse: ze verzamelen data tijdens het werk en redeneren daarvandaan naar een voorstel.',
      expectedResult: 'Een schoongemaakt stuk, een turflijst per soort afval, en één geschreven voorstel.',
      preparation: [
        'Zorg voor handschoenen en een zak voor iedereen.',
        'Spreek het stuk en de route af met een volwassene.',
        'Neem papier mee voor de turflijst.',
      ],
      reflectionQuestions: [
        'Waarvan vond je het meest, en waar lag het geconcentreerd?',
        'Wat zou echt voorkomen dat het terugkomt?',
      ],
    },
  },
  {
    slug: 'letters-for-neighbours',
    category: 'social-contribution',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 60,
    difficulty: 'EASY',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 1,
    maxParticipants: 6,
    requiresAdult: true,
    isPremium: true,
    skills: ['communication', 'citizenship', 'creativity'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }, { slug: 'envelope' }],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'An adult chooses the recipients and delivers the letters, or arranges it through a care home or neighbourhood organisation.',
        nl: 'Een volwassene kiest de ontvangers en bezorgt de brieven, of regelt het via een zorginstelling of buurtorganisatie.',
      },
      {
        severity: 'CAUTION',
        en: 'Never put your surname, address, school or telephone number in the letter.',
        nl: 'Zet nooit je achternaam, adres, school of telefoonnummer in de brief.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Agree who receives them',
          instruction:
            'With your adult, decide who the letters go to: a neighbour who lives alone, residents of a care home, someone in hospital. Ask the organisation first if it is not someone you know.',
        },
        nl: {
          title: 'Spreek af wie ze krijgt',
          instruction:
            'Bepaal samen met je volwassene wie de brieven krijgt: een buurvrouw die alleen woont, bewoners van een zorgcentrum, iemand in het ziekenhuis. Vraag het eerst aan de organisatie als je de persoon niet kent.',
        },
      },
      {
        minutes: 30,
        en: {
          title: 'Write something only you could write',
          instruction:
            'Do not write "hope you are well". Write about something real and small: what the weather did today, what you are learning, what the cat did. Specific is what makes a letter worth reading.',
        },
        nl: {
          title: 'Schrijf iets dat alleen jij kunt schrijven',
          instruction:
            'Schrijf niet "ik hoop dat het goed gaat". Schrijf over iets echts en kleins: wat het weer vandaag deed, wat je leert, wat de kat uitspookte. Concreet zijn maakt een brief het lezen waard.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Draw something on it',
          instruction:
            'Add a small drawing. A handwritten, hand-drawn letter is a rare object now, and that is exactly why it lands.',
        },
        nl: {
          title: 'Teken er iets op',
          instruction:
            'Zet er een kleine tekening bij. Een handgeschreven, zelfgetekende brief is tegenwoordig zeldzaam, en juist daarom komt hij aan.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Hand them over',
          instruction:
            'Give the sealed letters to your adult to deliver. Do not expect a reply - that is not what this is for.',
        },
        nl: {
          title: 'Geef ze af',
          instruction:
            'Geef de gesloten brieven aan je volwassene om te bezorgen. Verwacht geen antwoord — daar is dit niet voor.',
        },
      },
    ],
    en: {
      title: 'Letters for people who live alone',
      shortDescription: 'Write real, specific, hand-drawn letters for neighbours who do not get much post.',
      story:
        'Nobody gets a handwritten letter any more, which is precisely why one matters. Write something small and true, and let an adult deliver it.',
      educationalObjective:
        'Children practise writing for a specific reader and giving attention with no expectation of return, safely mediated by an adult.',
      expectedResult: 'At least one hand-written, illustrated letter handed over for delivery.',
      preparation: [
        'Agree the recipients with an adult first.',
        'Get paper, an envelope and something to draw with.',
        'Agree the rule about not writing personal details.',
      ],
      reflectionQuestions: [
        'What did you decide to write about, and why that?',
        'What do you think it is like to get very little post?',
      ],
    },
    nl: {
      title: 'Brieven voor mensen die alleen wonen',
      shortDescription: 'Schrijf echte, concrete, zelfgetekende brieven voor buren die weinig post krijgen.',
      story:
        'Niemand krijgt nog een handgeschreven brief, en juist daarom telt er één. Schrijf iets kleins en waars, en laat een volwassene het bezorgen.',
      educationalObjective:
        'Kinderen oefenen schrijven voor een specifieke lezer en aandacht geven zonder iets terug te verwachten, veilig begeleid door een volwassene.',
      expectedResult: 'Minstens één handgeschreven, geïllustreerde brief overhandigd om te bezorgen.',
      preparation: [
        'Spreek de ontvangers eerst af met een volwassene.',
        'Pak papier, een envelop en iets om mee te tekenen.',
        'Spreek de regel af over geen persoonlijke gegevens.',
      ],
      reflectionQuestions: [
        'Waarover besloot je te schrijven, en waarom juist dat?',
        'Hoe zou het zijn om bijna geen post te krijgen?',
      ],
    },
  },

  // -------------------------------------------------- history & culture ---
  {
    slug: 'street-name-mystery',
    category: 'history-culture',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 60,
    difficulty: 'MEDIUM',
    setting: 'BOTH',
    weather: ['ANY'],
    minParticipants: 1,
    maxParticipants: 5,
    skills: ['curiosity', 'communication', 'citizenship'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }],
    safety: [
      {
        severity: 'INFO',
        en: 'When asking neighbours questions, stay in public view and go with someone else.',
        nl: 'Blijf in het zicht als je buren iets vraagt, en ga samen met iemand.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Collect the names',
          instruction:
            'Walk your neighbourhood and write down six street names. Note which ones are people, which are places, and which are things - trees, professions, battles.',
        },
        nl: {
          title: 'Verzamel de namen',
          instruction:
            'Loop door je buurt en schrijf zes straatnamen op. Noteer welke personen zijn, welke plaatsen, en welke dingen — bomen, beroepen, veldslagen.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Guess before you check',
          instruction:
            'For each name write your best guess at where it comes from. Guessing first makes the answer stick.',
        },
        nl: {
          title: 'Raad voordat je het opzoekt',
          instruction:
            'Schrijf bij elke naam je beste gok waar hij vandaan komt. Eerst raden zorgt dat het antwoord blijft hangen.',
        },
      },
      {
        minutes: 25,
        en: {
          title: 'Ask the people who have been here longest',
          instruction:
            'Ask two neighbours, a shopkeeper or a librarian what they know. Local memory holds things no sign explains. Write their answers in their own words.',
        },
        nl: {
          title: 'Vraag het aan wie hier het langst woont',
          instruction:
            'Vraag twee buren, een winkelier of een bibliothecaris wat zij weten. Het geheugen van een buurt bewaart dingen die op geen bordje staan. Schrijf hun antwoorden in hun eigen woorden op.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Name a street yourself',
          instruction:
            'Choose a nameless spot near you - an alley, a corner, a path - and give it a name that says something true about the neighbourhood. Explain your choice to someone.',
        },
        nl: {
          title: 'Noem zelf een straat',
          instruction:
            'Kies een naamloze plek bij jou in de buurt — een steegje, een hoek, een pad — en geef die een naam die iets waars zegt over de buurt. Leg je keuze uit aan iemand.',
        },
      },
    ],
    en: {
      title: 'The street name mystery',
      shortDescription: 'Six street names, six guesses, and the neighbours who actually know.',
      story:
        'Every street name was a decision somebody made, usually about what a neighbourhood wanted to remember. Find out what yours were trying to say.',
      educationalObjective:
        'Children practise local historical research using human sources, and see that place names encode choices about memory.',
      expectedResult: 'Six street names researched, at least two explained by a local, and one new name invented.',
      preparation: [
        'Agree how far you may walk.',
        'Take paper and a pencil.',
        'Think of a polite opening line for asking a stranger a question.',
      ],
      reflectionQuestions: [
        'Which name surprised you most once you knew where it came from?',
        'What does your neighbourhood seem to want to remember?',
      ],
    },
    nl: {
      title: 'Het straatnamenmysterie',
      shortDescription: 'Zes straatnamen, zes gokken, en de buren die het echt weten.',
      story:
        'Elke straatnaam was ooit een besluit, meestal over wat een buurt wilde onthouden. Zoek uit wat die van jullie probeerden te zeggen.',
      educationalObjective:
        'Kinderen oefenen lokaal historisch onderzoek met menselijke bronnen, en zien dat plaatsnamen keuzes over herinnering vastleggen.',
      expectedResult: 'Zes straatnamen onderzocht, minstens twee uitgelegd door iemand uit de buurt, en één nieuwe naam bedacht.',
      preparation: [
        'Spreek af hoe ver je mag lopen.',
        'Neem papier en potlood mee.',
        'Bedenk een beleefde openingszin om iemand iets te vragen.',
      ],
      reflectionQuestions: [
        'Welke naam verbaasde je het meest toen je wist waar hij vandaan kwam?',
        'Wat lijkt jullie buurt te willen onthouden?',
      ],
    },
  },
  {
    slug: 'your-house-a-century-ago',
    category: 'history-culture',
    ageBands: ['AGE_6_8', 'AGE_9_11'],
    durationMinutes: 50,
    difficulty: 'EASY',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 1,
    maxParticipants: 5,
    skills: ['curiosity', 'creativity', 'communication'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Take an inventory of now',
          instruction:
            'Walk through one room and list everything in it that needs electricity. Then list everything that does not. Two columns, no arguing yet.',
        },
        nl: {
          title: 'Maak een inventaris van nu',
          instruction:
            'Loop door één kamer en noteer alles wat stroom nodig heeft. Noteer daarna alles wat dat niet nodig heeft. Twee kolommen, nog geen discussie.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Delete the last hundred years',
          instruction:
            'Cross out everything that did not exist in 1925. What is left is roughly the room your great-grandparents would recognise.',
        },
        nl: {
          title: 'Schrap de laatste honderd jaar',
          instruction:
            'Streep alles door dat in 1925 nog niet bestond. Wat overblijft is ongeveer de kamer die je overgrootouders zouden herkennen.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Draw the room as it was',
          instruction:
            'Draw the same room a hundred years ago. Where does the light come from? Where does the heat come from? Where does the water come from, and where does it go?',
        },
        nl: {
          title: 'Teken de kamer zoals hij was',
          instruction:
            'Teken dezelfde kamer honderd jaar geleden. Waar komt het licht vandaan? Waar komt de warmte vandaan? Waar komt het water vandaan, en waar gaat het heen?',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Pick what you would miss',
          instruction:
            'Say out loud which crossed-out thing you would miss most, and which one you honestly would not miss at all.',
        },
        nl: {
          title: 'Kies wat je zou missen',
          instruction:
            'Zeg hardop welk doorgestreept ding je het meest zou missen, en welk ding je eerlijk gezegd helemaal niet zou missen.',
        },
      },
    ],
    en: {
      title: 'Your house a century ago',
      shortDescription: 'Cross out everything invented in the last hundred years, then draw what is left.',
      story:
        'Your room is full of things that did not exist when this house was built. Cross them all out and draw what your great-grandparents would have seen.',
      educationalObjective:
        'Children make historical change concrete and personal, and think about infrastructure - light, heat, water - that is normally invisible.',
      expectedResult: 'A two-column inventory and a drawing of one room as it was a century ago.',
      preparation: [
        'Choose one room and stay in it.',
        'Take a big sheet of paper.',
        'Ask an adult roughly when your home was built, if they know.',
      ],
      reflectionQuestions: [
        'What was the most surprising thing on the crossed-out list?',
        'What job in the house would take much longer without electricity?',
      ],
    },
    nl: {
      title: 'Jouw huis honderd jaar geleden',
      shortDescription: 'Streep alles door dat de laatste honderd jaar is uitgevonden, en teken wat overblijft.',
      story:
        'Je kamer staat vol dingen die niet bestonden toen dit huis gebouwd werd. Streep ze allemaal door en teken wat je overgrootouders zouden hebben gezien.',
      educationalObjective:
        'Kinderen maken historische verandering concreet en persoonlijk, en denken na over infrastructuur — licht, warmte, water — die normaal onzichtbaar is.',
      expectedResult: 'Een inventaris in twee kolommen en een tekening van één kamer van een eeuw geleden.',
      preparation: [
        'Kies één kamer en blijf daar.',
        'Pak een groot vel papier.',
        'Vraag een volwassene wanneer jullie huis ongeveer gebouwd is, als ze het weten.',
      ],
      reflectionQuestions: [
        'Wat stond er het meest verrassende op de doorgestreepte lijst?',
        'Welke klus in huis zou veel langer duren zonder elektriciteit?',
      ],
    },
  },
  {
    slug: 'rescue-a-family-recipe',
    category: 'history-culture',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 75,
    difficulty: 'MEDIUM',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 2,
    maxParticipants: 6,
    requiresAdult: true,
    isPremium: true,
    skills: ['communication', 'practical-independence', 'curiosity'],
    materials: [
      { slug: 'paper' },
      { slug: 'pencil' },
      { slug: 'kitchen-scale' },
      { slug: 'pan' },
      { slug: 'cutting-board' },
    ],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'An adult supervises all cooking, especially anything on the hob or in the oven.',
        nl: 'Een volwassene houdt toezicht bij het koken, zeker bij alles op het vuur of in de oven.',
      },
    ],
    steps: [
      {
        minutes: 20,
        en: {
          title: 'Find a recipe nobody wrote down',
          instruction:
            'Phone or visit an older relative and ask for a dish they made often. Most family recipes exist only in someone’s hands, in measurements like "a handful" and "until it looks right".',
        },
        nl: {
          title: 'Zoek een recept dat niemand opschreef',
          instruction:
            'Bel of bezoek een oudere familielid en vraag naar een gerecht dat zij vaak maakten. De meeste familierecepten bestaan alleen in iemands handen, met maten als "een handvol" en "tot het er goed uitziet".',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Turn hands into numbers',
          instruction:
            'Translate every vague measurement into something repeatable. Weigh a handful. Time "until it looks right". This is the actual work of rescuing a recipe.',
        },
        nl: {
          title: 'Maak van handen getallen',
          instruction:
            'Vertaal elke vage maat naar iets herhaalbaars. Weeg een handvol. Klok "tot het er goed uitziet". Dit is het echte werk van een recept redden.',
        },
      },
      {
        minutes: 30,
        requiresAdult: true,
        en: {
          title: 'Cook it and correct the notes',
          instruction:
            'Cook the dish following your own written version, and correct the notes as you go. Every place your version was wrong is a place the recipe was living in someone’s memory.',
        },
        nl: {
          title: 'Kook het en verbeter je aantekeningen',
          instruction:
            'Kook het gerecht volgens je eigen geschreven versie en verbeter je aantekeningen onderweg. Elke plek waar jouw versie fout was, is een plek waar het recept in iemands geheugen leefde.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Write the final card',
          instruction:
            'Write a clean final version with the name of the person it came from and the date you cooked it. That card is now a document your family did not have this morning.',
        },
        nl: {
          title: 'Schrijf de definitieve kaart',
          instruction:
            'Schrijf een nette eindversie met de naam van wie het recept kwam en de datum waarop je het kookte. Die kaart is nu een document dat je familie vanochtend nog niet had.',
        },
      },
    ],
    en: {
      title: 'Rescue a family recipe',
      shortDescription:
        'Get a dish out of someone’s memory and onto paper - then cook it and correct what you got wrong.',
      story:
        'Family recipes disappear quietly, one generation at a time, because they only ever lived in somebody’s hands. Write one down properly before it goes.',
      educationalObjective:
        'Children practise interviewing, translating vague instructions into precise ones, and testing documentation against reality.',
      expectedResult: 'A written, tested recipe card credited to the person it came from.',
      preparation: [
        'Arrange the call or visit in advance.',
        'Check you can get the ingredients.',
        'Agree with an adult when you will cook it.',
      ],
      reflectionQuestions: [
        'Which instruction was hardest to turn into a number?',
        'What did your version get wrong the first time?',
      ],
    },
    nl: {
      title: 'Red een familierecept',
      shortDescription:
        'Haal een gerecht uit iemands geheugen op papier — kook het daarna en verbeter wat je fout had.',
      story:
        'Familierecepten verdwijnen geruisloos, één generatie per keer, omdat ze alleen in iemands handen leefden. Schrijf er één goed op voordat het weg is.',
      educationalObjective:
        'Kinderen oefenen interviewen, vage instructies vertalen naar precieze, en documentatie toetsen aan de werkelijkheid.',
      expectedResult: 'Een geschreven, geteste receptkaart met de naam van wie het recept kwam.',
      preparation: [
        'Plan het telefoontje of bezoek vooraf.',
        'Check of je de ingrediënten kunt krijgen.',
        'Spreek met een volwassene af wanneer je het kookt.',
      ],
      reflectionQuestions: [
        'Welke instructie was het lastigst om in een getal te vangen?',
        'Wat had jouw versie de eerste keer mis?',
      ],
    },
  },
]
