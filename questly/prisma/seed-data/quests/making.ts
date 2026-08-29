import type { SeedQuest } from '../quest-types'

/** Creativity, cooking, practical skills and technology. */
export const makingQuests: SeedQuest[] = [
  // --------------------------------------------------------- creativity ---
  {
    slug: 'sound-map-of-your-street',
    category: 'creativity',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 40,
    difficulty: 'EASY',
    setting: 'BOTH',
    weather: ['ANY'],
    minParticipants: 1,
    maxParticipants: 5,
    skills: ['creativity', 'curiosity', 'communication'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }],
    safety: [
      {
        severity: 'INFO',
        en: 'Sit somewhere you are visible and safe; do not record other people.',
        nl: 'Ga zitten op een plek waar je zichtbaar en veilig bent; neem andere mensen niet op.',
      },
    ],
    steps: [
      {
        minutes: 5,
        en: {
          title: 'Choose your listening post',
          instruction:
            'Pick a spot with a mix of sounds: a window, a doorstep, a bench. You will not move from it.',
        },
        nl: {
          title: 'Kies je luisterpost',
          instruction:
            'Kies een plek met een mix van geluiden: een raam, een stoep, een bankje. Daar blijf je zitten.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Draw sound, do not write it',
          instruction:
            'Put yourself in the middle of the paper. For every sound, draw a shape instead of a word: a spiky line for a siren, a soft cloud for wind, dots for footsteps. Size means loudness; position means direction.',
          audioScript:
            'Put yourself in the middle of the paper. For every sound, draw a shape instead of a word. A spiky line for a siren, a soft cloud for wind, dots for footsteps. Size means loudness, and position means direction.',
        },
        nl: {
          title: 'Teken geluid, schrijf het niet',
          instruction:
            'Zet jezelf midden op het papier. Teken bij elk geluid een vorm in plaats van een woord: een puntige lijn voor een sirene, een zachte wolk voor wind, stippen voor voetstappen. Grootte is volume, plek is richting.',
          audioScript:
            'Zet jezelf midden op het papier. Teken bij elk geluid een vorm in plaats van een woord. Een puntige lijn voor een sirene, een zachte wolk voor wind, stippen voor voetstappen. Grootte is volume en plek is richting.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Add the quietest sound you can find',
          instruction:
            'Hunt for the softest sound in reach: a clock, a fridge, your own breathing, a leaf. Draw it small, right where it belongs.',
        },
        nl: {
          title: 'Voeg het zachtste geluid toe dat je kunt vinden',
          instruction:
            'Jaag op het zachtste geluid binnen bereik: een klok, een koelkast, je eigen adem, een blad. Teken het klein, precies waar het hoort.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Read it aloud',
          instruction:
            'Show the map to someone and "read" it: point at each shape and make the sound. A good map should let them hear the street.',
        },
        nl: {
          title: 'Lees hem hardop voor',
          instruction:
            'Laat de kaart aan iemand zien en "lees" hem voor: wijs elke vorm aan en maak het geluid. Bij een goede kaart hoort die persoon de straat.',
        },
      },
    ],
    en: {
      title: 'Make a sound map of your street',
      shortDescription: 'Twenty minutes of listening, drawn as shapes instead of words.',
      story:
        'You know what your street looks like. Do you know what it sounds like? Sit still, and draw what you hear instead of what you see.',
      educationalObjective:
        'Children translate one sense into another, which forces them to invent their own visual language rather than copying an existing one.',
      expectedResult: 'A drawn sound map that someone else can "read" out loud.',
      preparation: [
        'Find a safe spot with a mix of sounds.',
        'Take paper and a pencil.',
        'Agree to stay in one place for twenty minutes.',
      ],
      reflectionQuestions: [
        'Which sound was hardest to draw?',
        'What did you hear that you had never noticed before?',
      ],
    },
    nl: {
      title: 'Maak een geluidskaart van je straat',
      shortDescription: 'Twintig minuten luisteren, getekend als vormen in plaats van woorden.',
      story:
        'Je weet hoe je straat eruitziet. Weet je ook hoe hij klinkt? Ga stil zitten en teken wat je hoort in plaats van wat je ziet.',
      educationalObjective:
        'Kinderen vertalen de ene zintuiglijke ervaring naar de andere, waardoor ze een eigen beeldtaal moeten bedenken in plaats van een bestaande na te doen.',
      expectedResult: 'Een getekende geluidskaart die iemand anders hardop kan "voorlezen".',
      preparation: [
        'Zoek een veilige plek met verschillende geluiden.',
        'Neem papier en een potlood mee.',
        'Spreek af dat je twintig minuten op één plek blijft.',
      ],
      reflectionQuestions: [
        'Welk geluid was het moeilijkst te tekenen?',
        'Wat hoorde je dat je nooit eerder was opgevallen?',
      ],
    },
  },
  {
    slug: 'cardboard-city',
    category: 'creativity',
    ageBands: ['AGE_6_8', 'AGE_9_11'],
    durationMinutes: 90,
    difficulty: 'MEDIUM',
    setting: 'INDOOR',
    weather: ['RAIN_FRIENDLY', 'ANY'],
    minParticipants: 2,
    maxParticipants: 6,
    isPremium: true,
    skills: ['creativity', 'problem-solving', 'teamwork'],
    materials: [
      { slug: 'cardboard', quantity: '2-3 boxes' },
      { slug: 'scissors' },
      { slug: 'tape' },
      { slug: 'pencil' },
      { slug: 'ruler' },
    ],
    safety: [
      {
        severity: 'CAUTION',
        en: 'Cut cardboard with safety scissors on a flat surface, cutting away from your body. Craft knives are for adults only.',
        nl: 'Snijd karton met een veilige schaar op een vlakke ondergrond, van je lichaam af. Stanleymessen zijn alleen voor volwassenen.',
      },
    ],
    steps: [
      {
        minutes: 15,
        en: {
          title: 'Decide what your city needs',
          instruction:
            'Before cutting anything, list six things a city needs for people to live well: somewhere to sleep, somewhere to buy food, somewhere to play, somewhere to see a doctor, somewhere green, a way to get around. Everyone claims one.',
        },
        nl: {
          title: 'Bepaal wat jullie stad nodig heeft',
          instruction:
            'Voordat je iets knipt: maak een lijst van zes dingen die een stad nodig heeft om prettig te wonen. Slapen, eten kopen, spelen, naar de dokter, iets groens en een manier om je te verplaatsen. Iedereen claimt er één.',
        },
      },
      {
        minutes: 45,
        en: {
          title: 'Build your building',
          instruction:
            'Build the one you claimed. It has to stand up on its own and be at least as tall as your hand. Fold, do not just tape - a folded edge is ten times stronger.',
        },
        nl: {
          title: 'Bouw jouw gebouw',
          instruction:
            'Bouw het gebouw dat jij claimde. Het moet uit zichzelf blijven staan en minstens zo hoog zijn als je hand. Vouw, plak niet alleen — een gevouwen rand is tien keer sterker.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Connect the city',
          instruction:
            'Lay out all the buildings on the floor and draw the streets between them. Argue properly about where the park goes and why. Move buildings until everyone can walk to everything.',
        },
        nl: {
          title: 'Verbind de stad',
          instruction:
            'Leg alle gebouwen op de vloer en teken de straten ertussen. Discussieer serieus over waar het park komt en waarom. Verschuif gebouwen tot iedereen overal naartoe kan lopen.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Give the tour',
          instruction:
            'One person walks a small figure through the city and tells its story out loud: where it wakes up, where it goes, who it meets.',
        },
        nl: {
          title: 'Geef de rondleiding',
          instruction:
            'Eén iemand loopt met een klein poppetje door de stad en vertelt hardop het verhaal: waar het wakker wordt, waar het heen gaat, wie het tegenkomt.',
        },
      },
    ],
    en: {
      title: 'Build a cardboard city',
      shortDescription: 'Everyone builds one essential building, then you argue about where the streets go.',
      story:
        'A city is not a pile of buildings; it is a set of decisions about who can reach what. Build one out of cardboard and you will find that out within the hour.',
      educationalObjective:
        'Children learn structural folding, negotiate shared space, and discover that layout decisions have consequences for the people who live there.',
      expectedResult: 'A connected cardboard city with at least four free-standing buildings and drawn streets.',
      preparation: [
        'Flatten a few boxes and clear floor space.',
        'Get safety scissors, tape and a pencil each.',
        'Agree who builds which building before you start.',
      ],
      reflectionQuestions: [
        'What did you argue about most while laying out the streets?',
        'Which building would you miss most if it were not there?',
      ],
    },
    nl: {
      title: 'Bouw een kartonnen stad',
      shortDescription: 'Iedereen bouwt één noodzakelijk gebouw, daarna discussieer je over waar de straten komen.',
      story:
        'Een stad is geen stapel gebouwen, maar een reeks besluiten over wie waar kan komen. Bouw er een van karton en je merkt dat binnen het uur.',
      educationalObjective:
        'Kinderen leren constructief vouwen, onderhandelen over gedeelde ruimte en ontdekken dat indeling gevolgen heeft voor wie er woont.',
      expectedResult: 'Een samenhangende kartonnen stad met minstens vier zelfstaande gebouwen en getekende straten.',
      preparation: [
        'Vouw een paar dozen plat en maak vloerruimte vrij.',
        'Zorg voor een veilige schaar, plakband en een potlood per persoon.',
        'Spreek vooraf af wie welk gebouw bouwt.',
      ],
      reflectionQuestions: [
        'Waar discussieerden jullie het meest over bij het indelen van de straten?',
        'Welk gebouw zou je het meest missen als het er niet was?',
      ],
    },
  },
  {
    slug: 'story-in-six-objects',
    category: 'creativity',
    ageBands: ['AGE_6_8', 'AGE_9_11', 'AGE_12_15'],
    durationMinutes: 45,
    difficulty: 'EASY',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 2,
    maxParticipants: 6,
    skills: ['creativity', 'communication'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Gather six unrelated objects',
          instruction:
            'Everyone fetches one object from a different room. No explaining, no choosing something that already fits a story. The stranger the mix, the better.',
        },
        nl: {
          title: 'Verzamel zes losse voorwerpen',
          instruction:
            'Iedereen haalt één voorwerp uit een andere kamer. Geen uitleg, en niets kiezen dat al in een verhaal past. Hoe vreemder de mix, hoe beter.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Put them in order',
          instruction:
            'Lay the objects in a line. That line is now the order they appear in the story. You may not rearrange them later.',
        },
        nl: {
          title: 'Zet ze op volgorde',
          instruction:
            'Leg de voorwerpen op een rij. Die rij is nu de volgorde waarin ze in het verhaal voorkomen. Later verschuiven mag niet meer.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Tell it out loud, together',
          instruction:
            'Take turns. Each person tells the part of the story belonging to the next object, and has to accept whatever the person before them invented. Nobody may say "actually that did not happen".',
        },
        nl: {
          title: 'Vertel hem hardop, samen',
          instruction:
            'Om de beurt. Iedereen vertelt het stukje verhaal dat bij het volgende voorwerp hoort, en moet accepteren wat de vorige verzon. Niemand mag zeggen "dat gebeurde eigenlijk niet".',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Save the best sentence',
          instruction:
            'Agree on the single best sentence anybody said and write it down. Stick it on the fridge. That is the whole record you need.',
        },
        nl: {
          title: 'Bewaar de beste zin',
          instruction:
            'Kies samen de beste zin die iemand zei en schrijf hem op. Hang hem op de koelkast. Meer hoef je niet te bewaren.',
        },
      },
    ],
    en: {
      title: 'A story in six objects',
      shortDescription: 'Six random objects, one shared story, and nobody is allowed to say no.',
      story:
        'Grab six things from around the house that have nothing to do with each other, then build one story that has to contain all of them, in order.',
      educationalObjective:
        'Children practise improvisation and the collaborative rule of "yes, and" - accepting someone else’s idea and building on it rather than replacing it.',
      expectedResult: 'A complete told story using six objects in order, and one written sentence kept.',
      preparation: [
        'Agree the rooms objects may come from.',
        'Sit in a circle where everyone can see the objects.',
        'Agree the "no rejecting" rule out loud before starting.',
      ],
      reflectionQuestions: [
        'Which object was hardest to fit in, and how did you solve it?',
        'What did someone else add that you would never have thought of?',
      ],
    },
    nl: {
      title: 'Een verhaal in zes voorwerpen',
      shortDescription: 'Zes willekeurige voorwerpen, één gezamenlijk verhaal, en niemand mag nee zeggen.',
      story:
        'Pak zes dingen uit huis die niets met elkaar te maken hebben, en bouw er één verhaal mee dat ze allemaal moet bevatten, op volgorde.',
      educationalObjective:
        'Kinderen oefenen improvisatie en de samenwerkingsregel "ja, en" — het idee van een ander aannemen en erop doorbouwen in plaats van het te vervangen.',
      expectedResult: 'Een compleet verteld verhaal met zes voorwerpen op volgorde, en één bewaarde zin.',
      preparation: [
        'Spreek af uit welke kamers de voorwerpen mogen komen.',
        'Ga in een kring zitten waar iedereen de voorwerpen ziet.',
        'Spreek de regel "niet afwijzen" hardop af voordat je begint.',
      ],
      reflectionQuestions: [
        'Welk voorwerp was het lastigst in te passen, en hoe losten jullie dat op?',
        'Wat voegde iemand anders toe waar jij nooit op was gekomen?',
      ],
    },
  },

  // ------------------------------------------------------------ cooking ---
  {
    slug: 'budget-family-meal',
    category: 'cooking',
    ageBands: ['AGE_12_15'],
    durationMinutes: 120,
    difficulty: 'CHALLENGING',
    setting: 'BOTH',
    weather: ['ANY'],
    minParticipants: 2,
    maxParticipants: 6,
    requiresAdult: true,
    isPremium: true,
    skills: ['practical-independence', 'financial-literacy', 'teamwork'],
    materials: [
      { slug: 'paper' },
      { slug: 'pencil' },
      { slug: 'bag' },
      { slug: 'pan' },
      { slug: 'knife' },
      { slug: 'cutting-board' },
      { slug: 'vegetables' },
    ],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'An adult supervises all knife work and everything on the hob.',
        nl: 'Een volwassene houdt toezicht bij al het snijwerk en alles op het vuur.',
      },
      {
        severity: 'CAUTION',
        en: 'Wash hands and vegetables, use a separate board for raw meat, and turn pan handles inwards.',
        nl: 'Was je handen en de groenten, gebruik een aparte plank voor rauw vlees en draai pannengrepen naar binnen.',
      },
    ],
    steps: [
      {
        minutes: 25,
        en: {
          title: 'Plan a meal inside the budget',
          instruction:
            'Agree a budget with your adult - around eight euros for four people works. Plan a meal with a vegetable, something filling and some protein. Write the shopping list with an estimated price next to every item, and add it up before you leave.',
        },
        nl: {
          title: 'Plan een maaltijd binnen het budget',
          instruction:
            'Spreek een budget af met je volwassene — ongeveer acht euro voor vier personen werkt goed. Plan een maaltijd met groente, iets vullends en wat eiwit. Schrijf de boodschappenlijst met bij elk product een geschatte prijs, en tel op voordat je vertrekt.',
        },
      },
      {
        minutes: 30,
        en: {
          title: 'Shop against your own estimate',
          instruction:
            'In the shop, compare the real price with your estimate and note the difference. Check the price per kilo, not per pack - that is where the real comparison lives. Adjust the plan if you are over budget.',
        },
        nl: {
          title: 'Doe boodschappen tegen je eigen schatting',
          instruction:
            'Vergelijk in de winkel de echte prijs met je schatting en noteer het verschil. Kijk naar de kiloprijs, niet de pakprijs — daar zit de echte vergelijking. Pas het plan aan als je over budget gaat.',
        },
      },
      {
        minutes: 50,
        requiresAdult: true,
        en: {
          title: 'Cook it together',
          instruction:
            'Divide the jobs before you start: one chops, one cooks, one lays the table, one washes up as you go. Cook the whole meal yourselves, with the adult nearby rather than taking over.',
        },
        nl: {
          title: 'Kook het samen',
          instruction:
            'Verdeel de taken voordat je begint: één snijdt, één kookt, één dekt de tafel, één wast alvast af. Kook de hele maaltijd zelf, met de volwassene ernaast in plaats van erdoorheen.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Work out the real cost per plate',
          instruction:
            'Add up what you actually spent and divide by the number of people. Compare that with what a takeaway for the same number would have cost.',
        },
        nl: {
          title: 'Bereken de echte prijs per bord',
          instruction:
            'Tel op wat je echt uitgaf en deel door het aantal mensen. Vergelijk dat met wat afhalen voor hetzelfde aantal zou hebben gekost.',
        },
      },
    ],
    en: {
      title: 'A healthy family meal on a budget',
      shortDescription: 'Plan it, price it, shop it, cook it - and work out what a plate really costs.',
      story:
        'Anyone can follow a recipe. The real skill is deciding what to cook when the budget is fixed, the shop is out of one thing, and four people are hungry.',
      educationalObjective:
        'Teenagers connect money to food: estimating, comparing unit prices, adapting a plan under constraint, and taking real responsibility in the kitchen.',
      expectedResult: 'A cooked meal, a receipt compared against the estimate, and a cost per plate.',
      preparation: [
        'Agree the budget and the shop with an adult.',
        'Check what is already in the cupboard first.',
        'Decide who does which job in the kitchen.',
      ],
      reflectionQuestions: [
        'Where was your price estimate most wrong, and why?',
        'What would you change to cook this meal for less without making it worse?',
      ],
    },
    nl: {
      title: 'Een gezonde gezinsmaaltijd met klein budget',
      shortDescription: 'Plan, prijs, koop, kook — en reken uit wat een bord echt kost.',
      story:
        'Een recept volgen kan iedereen. De echte vaardigheid is kiezen wat je kookt als het budget vaststaat, de winkel iets niet heeft en er vier mensen honger hebben.',
      educationalObjective:
        'Tieners koppelen geld aan eten: schatten, kiloprijzen vergelijken, een plan aanpassen binnen grenzen, en echte verantwoordelijkheid nemen in de keuken.',
      expectedResult: 'Een gekookte maaltijd, een bonnetje vergeleken met de schatting, en een prijs per bord.',
      preparation: [
        'Spreek het budget en de winkel af met een volwassene.',
        'Kijk eerst wat er al in de kast staat.',
        'Bepaal wie welke taak doet in de keuken.',
      ],
      reflectionQuestions: [
        'Waar zat je prijsschatting het meest naast, en waardoor?',
        'Wat zou je veranderen om dit goedkoper te koken zonder dat het minder wordt?',
      ],
    },
  },
  {
    slug: 'flatbread-from-scratch',
    category: 'cooking',
    ageBands: ['AGE_6_8', 'AGE_9_11'],
    durationMinutes: 60,
    difficulty: 'EASY',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 1,
    maxParticipants: 5,
    requiresAdult: true,
    skills: ['practical-independence', 'curiosity'],
    materials: [
      { slug: 'baking-supplies' },
      { slug: 'water' },
      { slug: 'pan' },
      { slug: 'kitchen-scale' },
      { slug: 'timer' },
    ],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'An adult handles the hot pan. A dry pan gets hotter than a pan with oil - treat it with respect.',
        nl: 'Een volwassene doet de hete pan. Een droge pan wordt heter dan een pan met olie — wees voorzichtig.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Weigh instead of guess',
          instruction:
            'Weigh 250 grams of flour, then add 150 millilitres of warm water, a big pinch of salt and a spoon of oil. Weighing is what makes baking repeatable.',
        },
        nl: {
          title: 'Weeg in plaats van gokken',
          instruction:
            'Weeg 250 gram bloem af, voeg 150 milliliter lauw water toe, een flinke snuf zout en een lepel olie. Wegen is wat bakken herhaalbaar maakt.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Knead until it changes',
          instruction:
            'Knead on the table for a full ten minutes. Notice the moment it stops being sticky and starts feeling smooth and springy - that is gluten forming, and you can feel it happen.',
        },
        nl: {
          title: 'Kneed tot het verandert',
          instruction:
            'Kneed tien volle minuten op tafel. Let op het moment dat het niet meer plakt en glad en verend aanvoelt — dat is gluten die zich vormt, en je voelt het gebeuren.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Rest the dough and lay the table',
          instruction:
            'Cover the dough and leave it for twenty minutes. Use that time to lay the table properly - this is a meal, not a snack.',
        },
        nl: {
          title: 'Laat het deeg rusten en dek de tafel',
          instruction:
            'Dek het deeg af en laat het twintig minuten staan. Gebruik die tijd om de tafel netjes te dekken — dit is een maaltijd, geen tussendoortje.',
        },
      },
      {
        minutes: 20,
        requiresAdult: true,
        en: {
          title: 'Roll and bake',
          instruction:
            'Roll each ball thin, then bake in a dry hot pan for about a minute a side, until it puffs and browns in spots. The adult manages the pan; you manage the timing.',
        },
        nl: {
          title: 'Rol uit en bak',
          instruction:
            'Rol elke bal dun uit en bak in een droge hete pan, ongeveer een minuut per kant, tot hij bol gaat staan en bruine vlekjes krijgt. De volwassene doet de pan; jij houdt de tijd bij.',
        },
      },
    ],
    en: {
      title: 'Flatbread from scratch',
      shortDescription: 'Four ingredients, ten minutes of kneading, and bread you made with your hands.',
      story:
        'Flour, water, salt, oil. That is bread - the same four things people have used for thousands of years. Today you find out what your hands can do with them.',
      educationalObjective:
        'Children learn to weigh accurately, follow a process with a resting stage, and recognise a physical change (gluten development) by feel.',
      expectedResult: 'A stack of warm flatbreads and a table laid for everyone.',
      preparation: [
        'Check you have flour, oil and salt.',
        'Clear and wipe the table for kneading.',
        'Agree that the adult handles the hot pan.',
      ],
      reflectionQuestions: [
        'How did the dough feel different after ten minutes of kneading?',
        'What would you add to the dough next time?',
      ],
    },
    nl: {
      title: 'Platbrood vanaf nul',
      shortDescription: 'Vier ingrediënten, tien minuten kneden, en brood dat je met je handen maakte.',
      story:
        'Bloem, water, zout, olie. Dat is brood — dezelfde vier dingen die mensen al duizenden jaren gebruiken. Vandaag ontdek je wat jouw handen ermee kunnen.',
      educationalObjective:
        'Kinderen leren nauwkeurig wegen, een proces met rusttijd volgen en een natuurkundige verandering (glutenvorming) op gevoel herkennen.',
      expectedResult: 'Een stapel warme platbroden en een gedekte tafel voor iedereen.',
      preparation: [
        'Check of je bloem, olie en zout hebt.',
        'Maak de tafel leeg en schoon om te kneden.',
        'Spreek af dat de volwassene de hete pan doet.',
      ],
      reflectionQuestions: [
        'Hoe voelde het deeg anders na tien minuten kneden?',
        'Wat zou je de volgende keer aan het deeg toevoegen?',
      ],
    },
  },
  {
    slug: 'rainbow-lunchbox',
    category: 'cooking',
    ageBands: ['AGE_6_8', 'AGE_9_11'],
    durationMinutes: 45,
    difficulty: 'EASY',
    setting: 'INDOOR',
    weather: ['ANY'],
    minParticipants: 1,
    maxParticipants: 5,
    requiresAdult: true,
    skills: ['practical-independence', 'creativity', 'curiosity'],
    materials: [{ slug: 'vegetables' }, { slug: 'knife' }, { slug: 'cutting-board' }, { slug: 'paper' }],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'An adult supervises the knife and shows the bridge grip before any cutting.',
        nl: 'Een volwassene houdt toezicht bij het mes en laat eerst de brugreep zien.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Hunt for five colours',
          instruction:
            'Search the kitchen for food in five different natural colours: red, orange or yellow, green, purple or blue, and white. Line them up on the counter.',
        },
        nl: {
          title: 'Jaag op vijf kleuren',
          instruction:
            'Zoek in de keuken naar eten in vijf verschillende natuurlijke kleuren: rood, oranje of geel, groen, paars of blauw, en wit. Zet ze op een rij op het aanrecht.',
        },
      },
      {
        minutes: 20,
        requiresAdult: true,
        en: {
          title: 'Prepare each colour',
          instruction:
            'Wash and cut each one into pieces small enough to eat with your fingers. Use the bridge grip: fingers make a bridge, the knife goes underneath.',
        },
        nl: {
          title: 'Maak elke kleur klaar',
          instruction:
            'Was en snijd alles in stukjes die je met je vingers kunt eten. Gebruik de brugreep: je vingers maken een brug, het mes gaat eronderdoor.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Build the box',
          instruction:
            'Pack the colours side by side so none of them touch. Add something filling - bread, rice or pasta - and something with protein.',
        },
        nl: {
          title: 'Bouw de trommel',
          instruction:
            'Leg de kleuren naast elkaar zodat ze elkaar niet raken. Voeg iets vullends toe — brood, rijst of pasta — en iets met eiwit.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Write the menu card',
          instruction:
            'Write a small menu card naming each colour and one reason your body likes it. Put it in the box for whoever opens it.',
        },
        nl: {
          title: 'Schrijf het menukaartje',
          instruction:
            'Schrijf een klein menukaartje met elke kleur en één reden waarom je lichaam er blij van wordt. Doe het in de trommel voor wie hem openmaakt.',
        },
      },
    ],
    en: {
      title: 'The five-colour lunchbox',
      shortDescription: 'Find five natural colours in the kitchen and turn them into tomorrow’s lunch.',
      story:
        'Your body reads colour as information. Five natural colours in one box is a surprisingly good rule of thumb - and it turns making lunch into a hunt.',
      educationalObjective:
        'Children learn safe knife technique and a simple, memorable rule for varied eating, while preparing food for someone else.',
      expectedResult: 'A packed lunchbox with five natural colours and a hand-written menu card.',
      preparation: [
        'Check which fruit and vegetables are in the house.',
        'Ask the adult to demonstrate the bridge grip.',
        'Find a lunchbox with compartments if you have one.',
      ],
      reflectionQuestions: [
        'Which colour was hardest to find, and what did you use in the end?',
        'What would you swap for tomorrow?',
      ],
    },
    nl: {
      title: 'De vijfkleurentrommel',
      shortDescription: 'Zoek vijf natuurlijke kleuren in de keuken en maak er de lunch van morgen van.',
      story:
        'Je lichaam leest kleur als informatie. Vijf natuurlijke kleuren in één trommel is een verrassend goede vuistregel — en het maakt van de lunch een speurtocht.',
      educationalObjective:
        'Kinderen leren veilig snijden en een simpele, onthoudbare regel voor gevarieerd eten, terwijl ze eten klaarmaken voor iemand anders.',
      expectedResult: 'Een gevulde lunchtrommel met vijf natuurlijke kleuren en een handgeschreven menukaartje.',
      preparation: [
        'Kijk welk fruit en welke groenten er in huis zijn.',
        'Vraag de volwassene de brugreep voor te doen.',
        'Zoek een trommel met vakjes als je die hebt.',
      ],
      reflectionQuestions: [
        'Welke kleur was het lastigst te vinden, en wat werd het uiteindelijk?',
        'Wat zou je morgen omruilen?',
      ],
    },
  },

  // --------------------------------------------------- practical skills ---
  {
    slug: 'repair-cafe-at-home',
    category: 'practical-skills',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 60,
    difficulty: 'MEDIUM',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 2,
    maxParticipants: 4,
    requiresAdult: true,
    skills: ['practical-independence', 'problem-solving', 'citizenship'],
    materials: [
      { slug: 'screwdriver' },
      { slug: 'glue', optional: true },
      { slug: 'needle-thread', optional: true },
      { slug: 'paper' },
      { slug: 'pencil' },
    ],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'An adult must be present. Never open anything that plugs into the mains or has a battery you cannot remove.',
        nl: 'Een volwassene is aanwezig. Open nooit iets dat op het stopcontact zit of een batterij heeft die je er niet uit kunt halen.',
      },
      {
        severity: 'CAUTION',
        en: 'Choose a mechanical repair: a loose screw, a torn seam, a jammed hinge, a snapped handle.',
        nl: 'Kies een mechanische reparatie: een losse schroef, een gescheurde naad, een klemmend scharnier, een afgebroken handvat.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Find the patient',
          instruction:
            'Hunt through the house for something broken that has been quietly waiting: a wobbly chair, a bag with a split seam, a drawer that sticks, a toy missing a screw.',
        },
        nl: {
          title: 'Zoek de patiënt',
          instruction:
            'Zoek in huis naar iets kapots dat al een tijdje stil ligt te wachten: een wiebelende stoel, een tas met een gescheurde naad, een lade die klemt, speelgoed met een schroef eruit.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Diagnose before you touch it',
          instruction:
            'Write down what it should do, what it does instead, and your best guess at why. Only then pick up a tool. Half of all repairs fail because nobody did this bit.',
        },
        nl: {
          title: 'Stel eerst de diagnose',
          instruction:
            'Schrijf op wat het zou moeten doen, wat het in plaats daarvan doet, en je beste gok waarom. Pak pas daarna gereedschap. De helft van alle reparaties mislukt omdat niemand dit deed.',
        },
      },
      {
        minutes: 30,
        requiresAdult: true,
        en: {
          title: 'Take it apart in order',
          instruction:
            'Lay every screw and part out in the order you removed it, left to right. Repair the fault. Then reassemble in reverse order - your line of parts is the instruction manual.',
        },
        nl: {
          title: 'Haal het uit elkaar op volgorde',
          instruction:
            'Leg elke schroef en elk onderdeel op volgorde neer, van links naar rechts. Herstel het defect. Zet het daarna in omgekeerde volgorde weer in elkaar — je rij onderdelen is de handleiding.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Test it honestly',
          instruction:
            'Use the thing properly, the way it will really be used. If it still is not right, write down what you would try next. A written next step is a successful repair too.',
        },
        nl: {
          title: 'Test het eerlijk',
          instruction:
            'Gebruik het ding echt, zoals het gebruikt gaat worden. Werkt het nog niet, schrijf dan op wat je hierna zou proberen. Een opgeschreven volgende stap is ook een geslaagde reparatie.',
        },
      },
    ],
    en: {
      title: 'Repair café at home',
      shortDescription: 'Find something broken, diagnose it properly, and put it back into use.',
      story:
        'Every house has a small graveyard of broken things nobody quite threw away. Pick one, work out what is actually wrong, and bring it back.',
      educationalObjective:
        'Children practise structured diagnosis, orderly disassembly, and the idea that repairing is a normal alternative to replacing.',
      expectedResult: 'One repaired object back in use, or a written diagnosis and next step.',
      preparation: [
        'Ask an adult which broken things are fair game.',
        'Clear a table and put down newspaper.',
        'Find a screwdriver set and a small container for screws.',
      ],
      reflectionQuestions: [
        'Was the real fault what you first guessed?',
        'What would have to be true for you to fix something harder next time?',
      ],
    },
    nl: {
      title: 'Repair café thuis',
      shortDescription: 'Zoek iets kapots, stel een goede diagnose en breng het terug in gebruik.',
      story:
        'Elk huis heeft een klein kerkhof van kapotte dingen die niemand echt weggooide. Kies er één, zoek uit wat er werkelijk mis is, en breng het terug.',
      educationalObjective:
        'Kinderen oefenen gestructureerd diagnosticeren, ordelijk demonteren, en het idee dat repareren een gewoon alternatief is voor vervangen.',
      expectedResult: 'Eén gerepareerd voorwerp weer in gebruik, of een geschreven diagnose met volgende stap.',
      preparation: [
        'Vraag een volwassene welke kapotte dingen je mag pakken.',
        'Maak een tafel vrij en leg er krant op.',
        'Zoek een schroevendraaierset en een bakje voor de schroeven.',
      ],
      reflectionQuestions: [
        'Was het echte defect wat je eerst dacht?',
        'Wat zou er waar moeten zijn om de volgende keer iets moeilijkers te maken?',
      ],
    },
  },
  {
    slug: 'sew-a-button',
    category: 'practical-skills',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 30,
    difficulty: 'EASY',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 1,
    maxParticipants: 4,
    skills: ['practical-independence', 'problem-solving'],
    materials: [{ slug: 'needle-thread' }, { slug: 'scissors' }],
    safety: [
      {
        severity: 'CAUTION',
        en: 'Push the needle away from your fingers, and count your needles at the start and end so none is lost.',
        nl: 'Duw de naald van je vingers af, en tel je naalden aan het begin en eind zodat er geen kwijtraakt.',
      },
    ],
    steps: [
      {
        minutes: 5,
        en: {
          title: 'Thread and knot',
          instruction:
            'Cut thread about as long as your arm. Longer tangles, shorter runs out. Thread the needle, double the thread and tie a knot in the end.',
        },
        nl: {
          title: 'Rijg en knoop',
          instruction:
            'Knip draad ongeveer zo lang als je arm. Langer knoopt, korter is te snel op. Rijg de naald, verdubbel de draad en leg een knoop in het uiteinde.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Sew the button on',
          instruction:
            'Come up from underneath through one hole, down through the next, and repeat six times. Keep it slightly loose - the button needs a small neck of thread to sit on, or the fabric will not close over it.',
        },
        nl: {
          title: 'Naai de knoop vast',
          instruction:
            'Kom van onderaf omhoog door één gaatje, ga naar beneden door het volgende, en herhaal dat zes keer. Houd het iets losjes — de knoop heeft een klein halsje draad nodig, anders sluit de stof er niet omheen.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Wind the neck and finish',
          instruction:
            'Bring the needle up under the button and wind the thread three times around the threads beneath it. Then push through to the back and knot twice.',
        },
        nl: {
          title: 'Wikkel het halsje en werk af',
          instruction:
            'Kom met de naald onder de knoop omhoog en wikkel de draad drie keer om de draden eronder. Steek daarna naar de achterkant en knoop twee keer af.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Teach it to someone else',
          instruction:
            'Show one other person how to do it, out loud, from memory. Teaching a skill is the test of whether you actually have it.',
        },
        nl: {
          title: 'Leer het aan iemand anders',
          instruction:
            'Laat het aan één ander zien, hardop en uit je hoofd. Iets kunnen uitleggen is de test of je het echt kunt.',
        },
      },
    ],
    en: {
      title: 'Sew a button back on',
      shortDescription: 'A fifteen-minute skill that keeps clothes out of the bin for years.',
      story:
        'A missing button is the most common reason a good shirt stops being worn. It takes fifteen minutes to fix, once, and then you can do it forever.',
      educationalObjective:
        'Children gain a concrete repair skill and the habit of mending rather than discarding, then consolidate it by teaching someone else.',
      expectedResult: 'A button sewn on firmly, and one other person taught how.',
      preparation: [
        'Find a garment with a loose or missing button.',
        'Get a needle, thread in a close colour, and scissors.',
        'Sit at a table in good light.',
      ],
      reflectionQuestions: [
        'What was fiddlier than you expected?',
        'What else in your wardrobe could be saved with fifteen minutes of work?',
      ],
    },
    nl: {
      title: 'Naai een knoop weer aan',
      shortDescription: 'Een vaardigheid van een kwartier die kleding jarenlang uit de afvalbak houdt.',
      story:
        'Een ontbrekende knoop is de meest voorkomende reden dat een goed overhemd niet meer gedragen wordt. Het kost een kwartier om het één keer te leren, en daarna kun je het altijd.',
      educationalObjective:
        'Kinderen leren een concrete reparatievaardigheid en de gewoonte om te herstellen in plaats van weg te gooien, en verankeren dat door het aan iemand te leren.',
      expectedResult: 'Een stevig aangenaaide knoop, en één ander persoon die het geleerd heeft.',
      preparation: [
        'Zoek een kledingstuk met een losse of ontbrekende knoop.',
        'Pak een naald, draad in een passende kleur en een schaar.',
        'Ga aan tafel zitten met goed licht.',
      ],
      reflectionQuestions: [
        'Wat was priegeliger dan je dacht?',
        'Wat in je kast zou je met een kwartier werk nog meer kunnen redden?',
      ],
    },
  },
  {
    slug: 'four-useful-knots',
    category: 'practical-skills',
    ageBands: ['AGE_6_8', 'AGE_9_11', 'AGE_12_15'],
    durationMinutes: 35,
    difficulty: 'EASY',
    setting: 'BOTH',
    weather: ['ANY'],
    minParticipants: 1,
    maxParticipants: 6,
    skills: ['practical-independence', 'problem-solving', 'movement'],
    materials: [{ slug: 'string', quantity: '2 pieces per person, 1 m each' }],
    safety: [
      {
        severity: 'CAUTION',
        en: 'Never tie rope around anyone’s neck, wrists or ankles, and never use these knots to climb.',
        nl: 'Bind nooit touw om iemands nek, polsen of enkels, en gebruik deze knopen nooit om mee te klimmen.',
      },
    ],
    steps: [
      {
        minutes: 8,
        en: {
          title: 'The reef knot: joining two ropes',
          instruction:
            'Left over right and under, then right over left and under. Say it out loud while you do it. If it looks like a twisted mess, you did the same side twice.',
        },
        nl: {
          title: 'De platte knoop: twee touwen verbinden',
          instruction:
            'Links over rechts en eronderdoor, dan rechts over links en eronderdoor. Zeg het hardop terwijl je het doet. Ziet het eruit als een gedraaide prop, dan deed je twee keer dezelfde kant.',
        },
      },
      {
        minutes: 9,
        en: {
          title: 'The bowline: a loop that will not tighten',
          instruction:
            'Make a small loop, bring the end up through it, around the standing part, and back down. This is the knot that does not strangle whatever is inside the loop.',
        },
        nl: {
          title: 'De paalsteek: een lus die niet aantrekt',
          instruction:
            'Maak een klein lusje, kom met het uiteinde omhoog door het lusje, om het staande deel heen en weer terug omlaag. Dit is de knoop die niet knelt om wat er in de lus zit.',
        },
      },
      {
        minutes: 9,
        en: {
          title: 'Two half hitches: tie to a post',
          instruction:
            'Around the post, then two identical loops through. Pull tight. This is how a washing line, a swing or a tarpaulin stays put.',
        },
        nl: {
          title: 'Twee halve steken: vastmaken aan een paal',
          instruction:
            'Om de paal heen, dan twee identieke lussen erdoor. Strak trekken. Zo blijft een waslijn, een schommel of een zeil op zijn plek.',
        },
      },
      {
        minutes: 9,
        en: {
          title: 'Test them for real',
          instruction:
            'Use your knots for something actual: hang a line between two chairs, make a swing for a soft toy, tie a parcel. A knot you have never loaded is a knot you do not know.',
        },
        nl: {
          title: 'Test ze in het echt',
          instruction:
            'Gebruik je knopen voor iets echts: span een lijn tussen twee stoelen, maak een schommel voor een knuffel, bind een pakje dicht. Een knoop die je nooit belast hebt, ken je niet.',
        },
      },
    ],
    en: {
      title: 'Four knots worth knowing',
      shortDescription: 'Three real knots plus a test that puts them under load - useful for the rest of your life.',
      story:
        'Most people know one knot and use it badly for everything. Learn three proper ones this afternoon, then put them under real tension and see the difference.',
      educationalObjective:
        'Children develop fine motor control and spatial reasoning, and learn that a tool is only known once it has been used under load.',
      expectedResult: 'Three knots tied from memory and used for a real job.',
      preparation: [
        'Cut two pieces of string or rope per person, about a metre each.',
        'Find a chair leg or post to tie to.',
        'Agree the safety rule about necks and wrists out loud.',
      ],
      reflectionQuestions: [
        'Which knot took the most attempts, and what finally made it click?',
        'Where in the house could each knot actually be useful?',
      ],
    },
    nl: {
      title: 'Vier knopen die je wilt kennen',
      shortDescription: 'Drie echte knopen plus een test die ze op spanning zet — nuttig voor de rest van je leven.',
      story:
        'De meeste mensen kennen één knoop en gebruiken die overal verkeerd voor. Leer er vanmiddag drie goed, zet ze dan onder echte spanning en zie het verschil.',
      educationalObjective:
        'Kinderen ontwikkelen fijne motoriek en ruimtelijk inzicht, en leren dat je een techniek pas kent als je hem belast hebt.',
      expectedResult: 'Drie knopen uit het hoofd gelegd en gebruikt voor een echte klus.',
      preparation: [
        'Knip per persoon twee stukken touw van ongeveer een meter.',
        'Zoek een stoelpoot of paal om aan vast te maken.',
        'Spreek de veiligheidsregel over nek en polsen hardop af.',
      ],
      reflectionQuestions: [
        'Welke knoop kostte de meeste pogingen, en waardoor lukte het uiteindelijk?',
        'Waar in huis zou elke knoop echt van pas komen?',
      ],
    },
  },

  // --------------------------------------------------------- technology ---
  {
    slug: 'human-robot-algorithm',
    category: 'technology',
    ageBands: ['AGE_6_8', 'AGE_9_11'],
    durationMinutes: 40,
    difficulty: 'EASY',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 2,
    maxParticipants: 6,
    skills: ['problem-solving', 'communication', 'teamwork'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }],
    safety: [
      {
        severity: 'INFO',
        en: 'Clear the route of obstacles - the robot is not allowed to look where it is going.',
        nl: 'Maak de route vrij van obstakels — de robot mag niet kijken waar hij loopt.',
      },
    ],
    steps: [
      {
        minutes: 5,
        en: {
          title: 'Agree the instruction set',
          instruction:
            'You may use only four commands: FORWARD one step, TURN LEFT, TURN RIGHT, PICK UP. Nothing else counts. Write them on the paper where everyone can see.',
        },
        nl: {
          title: 'Spreek de instructieset af',
          instruction:
            'Je mag maar vier commando’s gebruiken: VOORUIT één stap, LINKSAF, RECHTSAF, PAK OP. Meer telt niet. Schrijf ze op het papier waar iedereen ze ziet.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Write the program',
          instruction:
            'Pick a target object across the room. Write the full list of commands to get the robot there and pick it up. You may not change it once the robot starts.',
        },
        nl: {
          title: 'Schrijf het programma',
          instruction:
            'Kies een voorwerp aan de andere kant van de kamer. Schrijf de volledige lijst commando’s op om de robot daar te krijgen en het op te laten pakken. Aanpassen mag niet meer als de robot loopt.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Run the program exactly',
          instruction:
            'The robot does exactly what is written, including the mistakes, and stops when the instructions run out. No helping, no hints. Watch where it goes wrong.',
        },
        nl: {
          title: 'Voer het programma precies uit',
          instruction:
            'De robot doet precies wat er staat, inclusief de fouten, en stopt als de instructies op zijn. Niet helpen, geen hints. Kijk waar het misgaat.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Debug and swap roles',
          instruction:
            'Find the first wrong line - not the place it ended up, the line where it first went wrong. Fix that, run again, then swap who is the robot.',
        },
        nl: {
          title: 'Debug en wissel van rol',
          instruction:
            'Zoek de eerste foute regel — niet waar hij eindigde, maar de regel waar het voor het eerst misging. Herstel die, voer opnieuw uit, en wissel dan wie de robot is.',
        },
      },
    ],
    en: {
      title: 'Program a human robot',
      shortDescription:
        'Four commands, one blindly obedient robot, and the discovery that computers do exactly what you say.',
      story:
        'A computer is not clever. It does precisely what it is told, in order, including the parts you got wrong. Turn a family member into one and you will never forget it.',
      educationalObjective:
        'Children meet the core ideas of programming - a limited instruction set, sequence, precision, and debugging - entirely away from a screen.',
      expectedResult: 'A written program that gets the robot to the object, after at least one round of debugging.',
      preparation: [
        'Clear a route across the room.',
        'Choose a target object and where the robot starts.',
        'Write the four allowed commands on paper.',
      ],
      reflectionQuestions: [
        'Where did your program first go wrong, and why did you not notice when writing it?',
        'What extra command would have made the program much shorter?',
      ],
    },
    nl: {
      title: 'Programmeer een menselijke robot',
      shortDescription:
        'Vier commando’s, één blind gehoorzame robot, en de ontdekking dat computers precies doen wat je zegt.',
      story:
        'Een computer is niet slim. Hij doet precies wat je zegt, op volgorde, inclusief de stukken die je fout had. Maak een gezinslid tot robot en je vergeet het nooit meer.',
      educationalObjective:
        'Kinderen ontmoeten de kern van programmeren — een beperkte instructieset, volgorde, precisie en debuggen — volledig zonder scherm.',
      expectedResult: 'Een geschreven programma dat de robot bij het voorwerp brengt, na minstens één ronde debuggen.',
      preparation: [
        'Maak een route door de kamer vrij.',
        'Kies een doelvoorwerp en waar de robot start.',
        'Schrijf de vier toegestane commando’s op papier.',
      ],
      reflectionQuestions: [
        'Waar ging je programma het eerst mis, en waarom zag je dat niet bij het schrijven?',
        'Welk extra commando had het programma veel korter gemaakt?',
      ],
    },
  },
  {
    slug: 'secret-code-workshop',
    category: 'technology',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 50,
    difficulty: 'MEDIUM',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 2,
    maxParticipants: 6,
    isPremium: true,
    skills: ['problem-solving', 'curiosity', 'communication'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }, { slug: 'scissors' }],
    steps: [
      {
        minutes: 15,
        en: {
          title: 'Build a cipher wheel',
          instruction:
            'Cut two paper circles, one smaller. Write A to Z round the edge of each and pin them at the centre. Turn the inner wheel three letters along: that is a Caesar cipher, and it is two thousand years old.',
        },
        nl: {
          title: 'Bouw een codewiel',
          instruction:
            'Knip twee papieren cirkels, één kleiner. Schrijf op beide A tot Z langs de rand en zet ze in het midden vast. Draai de binnenste drie letters door: dat is een Caesar-cijfer, en het is tweeduizend jaar oud.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Send a real message',
          instruction:
            'Encode a message of at least ten words and pass it to the other side of the room. They decode it with their own wheel, set to the same shift.',
        },
        nl: {
          title: 'Stuur een echt bericht',
          instruction:
            'Codeer een bericht van minstens tien woorden en geef het aan de overkant van de kamer. Zij decoderen het met hun eigen wiel, op dezelfde verschuiving.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Now break one without the key',
          instruction:
            'Swap a message with a shift the other side did not tell you. Count which letter appears most often - in English and Dutch alike, that is almost always E. From there the whole message unlocks.',
        },
        nl: {
          title: 'Kraak er nu één zonder sleutel',
          instruction:
            'Ruil een bericht met een verschuiving die de ander niet verteld heeft. Tel welke letter het vaakst voorkomt — in het Nederlands en het Engels is dat bijna altijd de E. Vanaf daar valt het hele bericht open.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Make it harder',
          instruction:
            'Discuss: what would you change so that counting letters no longer works? You have just walked to the edge of real cryptography.',
        },
        nl: {
          title: 'Maak het moeilijker',
          instruction:
            'Bespreek: wat zou je veranderen zodat letters tellen niet meer werkt? Je staat nu aan de rand van echte cryptografie.',
        },
      },
    ],
    en: {
      title: 'Secret code workshop',
      shortDescription: 'Build a cipher wheel, send a coded message, then break one without the key.',
      story:
        'Encoding a message is easy. Breaking one you have no key for is where it gets interesting - and it turns out counting letters is enough.',
      educationalObjective:
        'Children meet substitution ciphers and frequency analysis, and discover that a code’s strength depends on the patterns it leaves behind.',
      expectedResult: 'A working cipher wheel, one message sent, and one message broken without the key.',
      preparation: [
        'Get paper, scissors and a split pin or drawing pin.',
        'Split into two groups sitting apart.',
        'Agree that nobody peeks at the other wheel.',
      ],
      reflectionQuestions: [
        'How did you find the shift without being told?',
        'Which everyday things do you now realise must be encrypted?',
      ],
    },
    nl: {
      title: 'Geheime-codeworkshop',
      shortDescription: 'Bouw een codewiel, stuur een gecodeerd bericht en kraak er daarna één zonder sleutel.',
      story:
        'Een bericht coderen is makkelijk. Er een kraken waar je geen sleutel van hebt, is waar het interessant wordt — en letters tellen blijkt genoeg.',
      educationalObjective:
        'Kinderen ontmoeten substitutiecijfers en frequentieanalyse, en ontdekken dat de sterkte van een code afhangt van de patronen die hij achterlaat.',
      expectedResult: 'Een werkend codewiel, één verstuurd bericht en één bericht gekraakt zonder sleutel.',
      preparation: [
        'Pak papier, een schaar en een splitpen of punaise.',
        'Verdeel je in twee groepjes die uit elkaar zitten.',
        'Spreek af dat niemand op het andere wiel gluurt.',
      ],
      reflectionQuestions: [
        'Hoe vond je de verschuiving zonder dat iemand het zei?',
        'Welke alledaagse dingen moeten volgens jou wel versleuteld zijn?',
      ],
    },
  },
  {
    slug: 'inside-an-old-machine',
    category: 'technology',
    ageBands: ['AGE_12_15'],
    durationMinutes: 75,
    difficulty: 'CHALLENGING',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 2,
    maxParticipants: 4,
    requiresAdult: true,
    isPremium: true,
    skills: ['curiosity', 'problem-solving', 'practical-independence'],
    materials: [
      { slug: 'screwdriver' },
      { slug: 'paper' },
      { slug: 'pencil' },
      { slug: 'box-with-lid' },
      { slug: 'phone-camera', optional: true },
    ],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'An adult chooses the device and is present throughout. It must be unplugged, and any battery must be removed first.',
        nl: 'Een volwassene kiest het apparaat en is er de hele tijd bij. Het moet losgekoppeld zijn en de batterij moet er eerst uit.',
      },
      {
        severity: 'CAUTION',
        en: 'Never open a microwave, a television, a monitor or anything with a large capacitor: those can hold a dangerous charge long after unplugging.',
        nl: 'Open nooit een magnetron, televisie, monitor of iets met een grote condensator: die kunnen nog lang na het uittrekken een gevaarlijke lading vasthouden.',
      },
      {
        severity: 'CAUTION',
        en: 'Take the parts to a recycling point afterwards. Electronics do not belong in household waste.',
        nl: 'Breng de onderdelen daarna naar een inzamelpunt. Elektronica hoort niet bij het huisvuil.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Predict the insides',
          instruction:
            'Before opening it, draw what you think is inside: how many parts, what shapes, what moves. Keep the drawing; you will compare it later.',
        },
        nl: {
          title: 'Voorspel de binnenkant',
          instruction:
            'Teken vóór het openen wat je denkt dat erin zit: hoeveel onderdelen, welke vormen, wat er beweegt. Bewaar de tekening; je vergelijkt hem straks.',
        },
      },
      {
        minutes: 30,
        requiresAdult: true,
        en: {
          title: 'Open it in order',
          instruction:
            'Remove screws one at a time and put each into the box, keeping them in groups by where they came from. Photograph or sketch each stage before you go deeper.',
        },
        nl: {
          title: 'Open het op volgorde',
          instruction:
            'Draai de schroeven één voor één los en leg ze in de doos, in groepjes per plek waar ze vandaan komen. Fotografeer of schets elke fase voordat je dieper gaat.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Follow the energy',
          instruction:
            'Trace the path from where power came in to where the work happened. Name every part you can: motor, gear, switch, spring, circuit board. Look up nothing - reason it out from what it is connected to.',
        },
        nl: {
          title: 'Volg de energie',
          instruction:
            'Volg het pad van waar de stroom binnenkwam naar waar het werk gebeurde. Benoem elk onderdeel dat je kunt: motor, tandwiel, schakelaar, veer, printplaat. Zoek niets op — redeneer het uit op basis van waar het aan vastzit.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Compare and sort for recycling',
          instruction:
            'Put your first drawing next to the real thing. What surprised you? Then sort the parts: metal, plastic, electronics - and take them to a collection point.',
        },
        nl: {
          title: 'Vergelijk en sorteer voor recycling',
          instruction:
            'Leg je eerste tekening naast de werkelijkheid. Wat verbaasde je? Sorteer daarna de onderdelen: metaal, plastic, elektronica — en breng ze naar een inzamelpunt.',
        },
      },
    ],
    en: {
      title: 'Inside an old machine',
      shortDescription:
        'Take a broken appliance apart safely, follow the energy through it, and recycle what is left.',
      story:
        'A machine is a chain of decisions someone made about how to turn energy into work. Open a broken one and you can read all of them.',
      educationalObjective:
        'Teenagers develop mechanical reasoning and systematic disassembly, and connect that to safe handling and proper e-waste disposal.',
      expectedResult:
        'A disassembled appliance, a labelled sketch of its inside, and the parts taken to recycling.',
      preparation: [
        'Ask an adult to choose a safe, broken, battery-free device.',
        'Unplug it and leave it unplugged.',
        'Find out where your nearest electronics recycling point is.',
      ],
      reflectionQuestions: [
        'What surprised you most compared to your prediction?',
        'Which single part would you replace to try and fix it?',
      ],
    },
    nl: {
      title: 'In een oude machine',
      shortDescription:
        'Haal veilig een kapot apparaat uit elkaar, volg de energie erdoorheen en breng de rest naar de recycling.',
      story:
        'Een machine is een keten van keuzes die iemand maakte om energie in werk om te zetten. Open een kapotte en je kunt ze allemaal lezen.',
      educationalObjective:
        'Tieners ontwikkelen mechanisch redeneren en systematisch demonteren, gekoppeld aan veilig werken en juiste afvoer van elektronica.',
      expectedResult:
        'Een gedemonteerd apparaat, een geannoteerde schets van de binnenkant, en de onderdelen naar de recycling gebracht.',
      preparation: [
        'Vraag een volwassene een veilig, kapot apparaat zonder batterij te kiezen.',
        'Trek de stekker eruit en laat hem eruit.',
        'Zoek uit waar het dichtstbijzijnde inzamelpunt voor elektronica is.',
      ],
      reflectionQuestions: [
        'Wat verbaasde je het meest vergeleken met je voorspelling?',
        'Welk onderdeel zou je vervangen om het te proberen te repareren?',
      ],
    },
  },
]
