import type { SeedQuest } from '../quest-types'

export const natureScienceMovementQuests: SeedQuest[] = [
  // ------------------------------------------------------------- nature ---
  {
    slug: 'leaf-detective',
    category: 'nature',
    ageBands: ['AGE_6_8', 'AGE_9_11'],
    durationMinutes: 45,
    difficulty: 'EASY',
    setting: 'OUTDOOR',
    weather: ['DRY', 'ANY'],
    seasons: ['SPRING', 'SUMMER', 'AUTUMN'],
    minParticipants: 1,
    maxParticipants: 6,
    skills: ['nature-awareness', 'curiosity'],
    materials: [
      { slug: 'bag' },
      { slug: 'paper' },
      { slug: 'pencil' },
      { slug: 'magnifier', optional: true },
    ],
    safety: [
      {
        severity: 'CAUTION',
        en: 'Only pick leaves that have already fallen, and never eat anything you find.',
        nl: 'Raap alleen bladeren op die al gevallen zijn, en eet nooit iets wat je vindt.',
      },
      {
        severity: 'INFO',
        en: 'Wash your hands when you get home.',
        nl: 'Was je handen als je thuiskomt.',
      },
    ],
    steps: [
      {
        minutes: 5,
        en: {
          title: 'Pick your hunting ground',
          instruction:
            'Choose one place with several different trees: a park, a churchyard, a canal bank or your own street. You are going to work that one spot properly instead of walking far.',
          audioScript:
            'Choose one place with several different trees. A park, a churchyard, a canal bank, or your own street. You will work that one spot properly, rather than walking far.',
        },
        nl: {
          title: 'Kies je jachtgebied',
          instruction:
            'Kies één plek met verschillende bomen: een park, een kerkhof, een kade of je eigen straat. Je gaat die ene plek goed uitkammen in plaats van ver te lopen.',
          audioScript:
            'Kies één plek met verschillende bomen. Een park, een kerkhof, een kade of je eigen straat. Je gaat die ene plek goed uitkammen in plaats van ver te lopen.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Collect five clearly different leaves',
          instruction:
            'Look for leaves that differ in shape, not just in size: a hand shape, a needle, a heart, a saw-toothed edge, a smooth edge. Put each one in your bag as you find it.',
        },
        nl: {
          title: 'Verzamel vijf duidelijk verschillende bladeren',
          instruction:
            'Zoek bladeren die verschillen in vorm, niet alleen in grootte: een handvorm, een naald, een hart, een zaagrand, een gladde rand. Stop elk blad in je tas zodra je het vindt.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Become the expert',
          instruction:
            'Lay the five leaves out in a row. For each one, describe out loud: the shape of the edge, how the veins run, and whether the two halves are mirror images. Give each leaf a name of your own invention that describes it.',
        },
        nl: {
          title: 'Word de expert',
          instruction:
            'Leg de vijf bladeren op een rij. Beschrijf van elk hardop: de vorm van de rand, hoe de nerven lopen en of de twee helften elkaars spiegelbeeld zijn. Geef elk blad een zelfbedachte naam die het beschrijft.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Match them to a tree',
          instruction:
            'Walk back and try to find the tree each leaf came from. Two of the five is a good score. Leave the leaves under their tree when you are finished.',
        },
        nl: {
          title: 'Zoek de boom erbij',
          instruction:
            'Loop terug en probeer bij elk blad de boom te vinden. Twee van de vijf is al een goede score. Leg de bladeren aan het eind terug onder hun boom.',
        },
      },
    ],
    en: {
      title: 'Leaf detective',
      shortDescription:
        'Find five clearly different leaves in one small patch of green, and learn to read them.',
      story:
        'Every tree writes its name on its leaves - you just have to learn the handwriting. Today you are the detective who cracks the code in a single park, street or garden.',
      educationalObjective:
        'Children learn to observe systematically: comparing shape, edge and vein pattern rather than only colour, and describing what they see in their own words.',
      expectedResult: 'Five different leaves, described out loud, and at least two matched to their tree.',
      preparation: [
        'Check the weather and dress for it.',
        'Take a bag or basket and something to write with.',
        'Agree how far you may go from home.',
      ],
      reflectionQuestions: [
        'Which leaf was the hardest to describe, and why?',
        'What did you notice today that you had walked past a hundred times before?',
      ],
    },
    nl: {
      title: 'Bladerdetective',
      shortDescription:
        'Vind vijf duidelijk verschillende bladeren in één stukje groen, en leer ze lezen.',
      story:
        'Elke boom schrijft zijn naam op zijn bladeren — je moet alleen het handschrift leren lezen. Vandaag ben jij de detective die de code kraakt in één park, straat of tuin.',
      educationalObjective:
        'Kinderen leren systematisch waarnemen: vorm, rand en nerfpatroon vergelijken in plaats van alleen kleur, en beschrijven wat ze zien in eigen woorden.',
      expectedResult: 'Vijf verschillende bladeren, hardop beschreven, en minstens twee bij hun boom gevonden.',
      preparation: [
        'Kijk naar het weer en kleed je erop.',
        'Neem een tas of mandje mee en iets om mee te schrijven.',
        'Spreek af hoe ver je van huis mag.',
      ],
      reflectionQuestions: [
        'Welk blad was het moeilijkst te beschrijven, en waarom?',
        'Wat viel je vandaag op waar je al honderd keer langs was gelopen?',
      ],
    },
  },
  {
    slug: 'insect-hotel',
    category: 'nature',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 90,
    difficulty: 'MEDIUM',
    setting: 'OUTDOOR',
    weather: ['DRY'],
    seasons: ['SPRING', 'SUMMER', 'AUTUMN'],
    minParticipants: 2,
    maxParticipants: 6,
    requiresAdult: true,
    isPremium: true,
    skills: ['nature-awareness', 'problem-solving', 'practical-independence'],
    materials: [
      { slug: 'cardboard' },
      { slug: 'sticks', quantity: 'a good armful' },
      { slug: 'string' },
      { slug: 'scissors' },
      { slug: 'bamboo-canes', optional: true },
      { slug: 'drill', optional: true },
    ],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'An adult handles any cutting of canes and any drilling.',
        nl: 'Een volwassene doet het zagen van stokken en het boren.',
      },
      {
        severity: 'CAUTION',
        en: 'Hollow stems must be cut cleanly so no sharp splinters remain - insects are hurt by rough edges.',
        nl: 'Snijd holle stengels netjes af zodat er geen scherpe splinters overblijven — daar raken insecten gewond aan.',
      },
    ],
    steps: [
      {
        minutes: 15,
        en: {
          title: 'Study your guests first',
          instruction:
            'Before you build anything, spend ten minutes watching your garden or balcony. Which insects are actually there? Solitary bees want narrow tubes; ladybirds and lacewings want dry, dark gaps. Build for the guests you really have.',
        },
        nl: {
          title: 'Bestudeer eerst je gasten',
          instruction:
            'Voordat je iets bouwt: kijk tien minuten in je tuin of op je balkon. Welke insecten zijn er echt? Solitaire bijen willen smalle buisjes; lieveheersbeestjes en gaasvliegen willen droge, donkere kieren. Bouw voor de gasten die je echt hebt.',
        },
      },
      {
        minutes: 20,
        requiresAdult: true,
        en: {
          title: 'Prepare the rooms',
          instruction:
            'Cut hollow stems or rolled cardboard into pieces about as long as your hand. Every tube must be closed at the back - an open tunnel is a draught, and no bee will use it.',
        },
        nl: {
          title: 'Maak de kamers klaar',
          instruction:
            'Snijd holle stengels of opgerold karton in stukken zo lang als je hand. Elke buis moet aan de achterkant dicht zijn — een open tunnel is tocht, en daar gaat geen bij in.',
        },
      },
      {
        minutes: 30,
        en: {
          title: 'Build the frame and fill it',
          instruction:
            'Make a sturdy box from your cardboard or wood, then pack the tubes in tightly so nothing rattles. Different room sizes in one hotel means different guests.',
        },
        nl: {
          title: 'Bouw het frame en vul het',
          instruction:
            'Maak een stevige doos van karton of hout en stop de buisjes er strak in, zodat er niets rammelt. Verschillende kamermaten in één hotel betekent verschillende gasten.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Hang it in the right spot',
          instruction:
            'Fix the hotel firmly at about chest height, facing the morning sun, sheltered from rain, and out of the wind. A swinging hotel stays empty.',
        },
        nl: {
          title: 'Hang het op de goede plek',
          instruction:
            'Zet het hotel stevig vast op ongeveer borsthoogte, met de opening naar de ochtendzon, beschut tegen regen en uit de wind. Een schommelend hotel blijft leeg.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Make a check-in plan',
          instruction:
            'Agree when you will come back to look: once a week for a month. Write the dates on the calendar together, and note what you see each time.',
        },
        nl: {
          title: 'Maak een inchecklijst',
          instruction:
            'Spreek af wanneer je gaat kijken: één keer per week, een maand lang. Schrijf de data samen op de kalender en noteer elke keer wat je ziet.',
        },
      },
    ],
    en: {
      title: 'Build an insect hotel',
      shortDescription:
        'Design a shelter for the insects that actually live in your garden, and hang it where they will use it.',
      story:
        'Most insect hotels stay empty, because they were built for a picture rather than for an insect. Yours will be different: you are going to watch first, then build for the guests you really have.',
      educationalObjective:
        'Children connect observation to design: they find out what local species need and let that shape what they build, then commit to following up.',
      expectedResult: 'A sturdy insect hotel, correctly placed, plus a written plan for checking it.',
      preparation: [
        'Collect dry twigs, hollow stems and cardboard beforehand.',
        'Pick the spot: morning sun, sheltered, firm.',
        'Agree who does the cutting - that is an adult job.',
      ],
      reflectionQuestions: [
        'Which insect did you design for, and what does it need that you did not know before?',
        'What would you build differently next time?',
      ],
    },
    nl: {
      title: 'Bouw een insectenhotel',
      shortDescription:
        'Ontwerp een verblijf voor de insecten die echt in jullie tuin leven, en hang het op waar ze het gebruiken.',
      story:
        'De meeste insectenhotels blijven leeg, omdat ze gebouwd zijn voor een foto en niet voor een insect. Dat van jullie wordt anders: eerst kijken, dan bouwen voor de gasten die er echt zijn.',
      educationalObjective:
        'Kinderen koppelen waarnemen aan ontwerpen: ze zoeken uit wat lokale soorten nodig hebben, laten dat hun bouwsel bepalen en spreken af hoe ze het opvolgen.',
      expectedResult: 'Een stevig insectenhotel, goed opgehangen, plus een geschreven plan om te gaan kijken.',
      preparation: [
        'Verzamel vooraf droge takjes, holle stengels en karton.',
        'Kies de plek: ochtendzon, beschut, stevig.',
        'Spreek af wie er snijdt — dat is een klus voor een volwassene.',
      ],
      reflectionQuestions: [
        'Voor welk insect ontwierp je, en wat heeft dat nodig dat je nog niet wist?',
        'Wat zou je de volgende keer anders bouwen?',
      ],
    },
  },
  {
    slug: 'bird-language-map',
    category: 'nature',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 40,
    difficulty: 'EASY',
    setting: 'OUTDOOR',
    weather: ['DRY', 'ANY'],
    seasons: ['SPRING', 'SUMMER'],
    minParticipants: 1,
    maxParticipants: 5,
    skills: ['nature-awareness', 'curiosity', 'communication'],
    materials: [{ slug: 'paper' }, { slug: 'pencil' }],
    safety: [
      {
        severity: 'INFO',
        en: 'Stay on paths and keep well away from nests - a disturbed nest is often abandoned.',
        nl: 'Blijf op de paden en blijf ver van nesten — een verstoord nest wordt vaak verlaten.',
      },
    ],
    steps: [
      {
        minutes: 5,
        en: {
          title: 'Draw your map',
          instruction:
            'Sketch a rough map of the place you are standing: the house, a few trees, the fence, the road. It does not need to be beautiful; it needs to be recognisable.',
        },
        nl: {
          title: 'Teken je kaart',
          instruction:
            'Schets een ruwe kaart van waar je staat: het huis, een paar bomen, het hek, de weg. Hij hoeft niet mooi te zijn, alleen herkenbaar.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Sit still and mark every sound',
          instruction:
            'Sit down and stay quiet for twenty minutes. Every time you hear a bird, put a mark on the map where the sound came from, and write next to it what the sound was like: a whistle, a rattle, a scold, a long song.',
          audioScript:
            'Sit down and stay quiet for twenty minutes. Every time you hear a bird, mark on the map where the sound came from, and write what it sounded like. A whistle, a rattle, a scold, a long song.',
        },
        nl: {
          title: 'Zit stil en markeer elk geluid',
          instruction:
            'Ga zitten en blijf twintig minuten stil. Elke keer dat je een vogel hoort, zet je een streepje op de kaart waar het geluid vandaan kwam, met ernaast hoe het klonk: een fluit, een ratel, een scheldpartij, een lang lied.',
          audioScript:
            'Ga zitten en blijf twintig minuten stil. Elke keer dat je een vogel hoort, zet je een streepje op de kaart waar het geluid vandaan kwam, en schrijf je op hoe het klonk. Een fluit, een ratel, een scheldpartij, een lang lied.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Find the pattern',
          instruction:
            'Look at your map. Where are the marks clustered? Birds are loudest where there is food and cover. Try to explain, out loud, why the busiest corner is the busiest.',
        },
        nl: {
          title: 'Zoek het patroon',
          instruction:
            'Kijk naar je kaart. Waar zitten de streepjes bij elkaar? Vogels zijn het luidst waar eten en dekking is. Leg hardop uit waarom de drukste hoek de drukste is.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Tell someone',
          instruction:
            'Explain your map to someone who was not there, using only your marks. If they can picture the place, your map worked.',
        },
        nl: {
          title: 'Vertel het aan iemand',
          instruction:
            'Leg je kaart uit aan iemand die er niet bij was, alleen met je streepjes. Als die persoon de plek voor zich ziet, werkt je kaart.',
        },
      },
    ],
    en: {
      title: 'Map the birds of your street',
      shortDescription: 'Twenty quiet minutes and a hand-drawn map turn a familiar street into a soundscape.',
      story:
        'Birds are talking all day, in the same street you walk down without listening. Sit still long enough and the street turns into a map of conversations.',
      educationalObjective:
        'Children practise sustained attention and learn to record observations spatially, then draw a conclusion from their own data.',
      expectedResult: 'A hand-drawn sound map with at least eight marks, and an explanation of the busiest spot.',
      preparation: [
        'Pick a spot where you can sit comfortably for twenty minutes.',
        'Bring paper and a pencil - no photographs needed.',
        'Agree on a silent signal for "I heard one".',
      ],
      reflectionQuestions: [
        'What was the hardest part of sitting still for twenty minutes?',
        'Which sound do you now recognise that you could not name before?',
      ],
    },
    nl: {
      title: 'Breng de vogels van je straat in kaart',
      shortDescription: 'Twintig stille minuten en een zelfgetekende kaart maken van een bekende straat een klanklandschap.',
      story:
        'Vogels praten de hele dag, in dezelfde straat waar jij doorheen loopt zonder te luisteren. Zit lang genoeg stil en de straat wordt een kaart vol gesprekken.',
      educationalObjective:
        'Kinderen oefenen langdurige aandacht en leren waarnemingen ruimtelijk vastleggen, om er daarna zelf een conclusie uit te trekken.',
      expectedResult: 'Een zelfgetekende geluidskaart met minstens acht streepjes, en een verklaring voor de drukste plek.',
      preparation: [
        'Kies een plek waar je twintig minuten prettig kunt zitten.',
        'Neem papier en een potlood mee — foto’s zijn niet nodig.',
        'Spreek een stil signaal af voor "ik hoorde er een".',
      ],
      reflectionQuestions: [
        'Wat was het lastigst aan twintig minuten stilzitten?',
        'Welk geluid herken je nu dat je eerst niet kon benoemen?',
      ],
    },
  },

  // ------------------------------------------------------------ science ---
  {
    slug: 'bridge-that-carries-five-kilos',
    category: 'science',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 75,
    difficulty: 'CHALLENGING',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 2,
    maxParticipants: 5,
    skills: ['problem-solving', 'teamwork', 'creativity'],
    materials: [
      { slug: 'newspaper', quantity: '10 sheets' },
      { slug: 'tape', quantity: '1 roll' },
      { slug: 'ruler' },
      { slug: 'kitchen-scale' },
      { slug: 'scissors' },
    ],
    safety: [
      {
        severity: 'CAUTION',
        en: 'Test the bridge over a low table with nothing fragile below, and keep fingers out from under the load.',
        nl: 'Test de brug boven een lage tafel zonder breekbare spullen eronder, en houd je vingers onder de last vandaan.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Set the rules',
          instruction:
            'The bridge must span 40 centimetres between two stacks of books, use only newspaper and tape, and hold five kilograms in the middle for ten seconds. Measure the gap now and write the rules down.',
        },
        nl: {
          title: 'Zet de regels vast',
          instruction:
            'De brug moet 40 centimeter overbruggen tussen twee stapels boeken, mag alleen uit krant en plakband bestaan, en moet vijf kilo in het midden tien seconden dragen. Meet de opening nu en schrijf de regels op.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Test the material, not the idea',
          instruction:
            'Before designing anything, roll one sheet of newspaper into a tight tube and try to bend it. Then try a flat sheet. Feel the difference. Shape is what makes paper strong, not thickness.',
        },
        nl: {
          title: 'Test het materiaal, niet het idee',
          instruction:
            'Rol eerst één vel krant tot een strakke buis en probeer die te buigen. Probeer daarna een plat vel. Voel het verschil. Vorm maakt papier sterk, niet dikte.',
        },
      },
      {
        minutes: 30,
        en: {
          title: 'Build version one',
          instruction:
            'Build a bridge from rolled tubes. Triangles do not deform; squares do. Try to put a triangle wherever the load will push.',
        },
        nl: {
          title: 'Bouw versie één',
          instruction:
            'Bouw een brug van gerolde buizen. Driehoeken vervormen niet, vierkanten wel. Zet een driehoek op elke plek waar de last gaat duwen.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Load it and watch it fail',
          instruction:
            'Add weight slowly, in steps, and watch closely where it starts to bend. The place it fails is the place you learn from. Write down what gave way.',
        },
        nl: {
          title: 'Belast hem en kijk hoe hij bezwijkt',
          instruction:
            'Voeg langzaam gewicht toe, stap voor stap, en kijk goed waar hij begint te buigen. Waar hij bezwijkt, leer je van. Schrijf op wat het begaf.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Rebuild the weak point',
          instruction:
            'Do not build a whole new bridge. Reinforce only the part that failed, and test again. Two focused repairs usually beat one complete rebuild.',
        },
        nl: {
          title: 'Herbouw het zwakke punt',
          instruction:
            'Bouw geen hele nieuwe brug. Versterk alleen het deel dat het begaf en test opnieuw. Twee gerichte reparaties zijn meestal beter dan één keer helemaal opnieuw.',
        },
      },
    ],
    en: {
      title: 'Build a bridge that carries five kilograms',
      shortDescription:
        'Newspaper, tape and a 40 centimetre gap. Engineering is what happens after the first collapse.',
      story:
        'Every real bridge started as a drawing that fell down. You have newspaper, tape and one rule: five kilograms in the middle, ten seconds, no cheating.',
      educationalObjective:
        'Children experience structural thinking directly - that shape carries load, that failure locates the weak point, and that iterating beats starting over.',
      expectedResult: 'A newspaper bridge that holds five kilograms, plus notes on what failed first.',
      preparation: [
        'Clear a table and stack two equal piles of books 40 cm apart.',
        'Find something that weighs about five kilograms, such as bags of flour or rice.',
        'Agree that the first collapse is part of the plan.',
      ],
      reflectionQuestions: [
        'Where did your bridge fail first, and why do you think that was?',
        'What did you change after the failure, and did it work?',
      ],
    },
    nl: {
      title: 'Bouw een brug die vijf kilo draagt',
      shortDescription:
        'Krant, plakband en een gat van 40 centimeter. Techniek begint pas na de eerste instorting.',
      story:
        'Elke echte brug begon als een tekening die omviel. Jij hebt krant, plakband en één regel: vijf kilo in het midden, tien seconden, niet valsspelen.',
      educationalObjective:
        'Kinderen ervaren constructiedenken aan den lijve: vorm draagt de last, bezwijken wijst het zwakke punt aan, en verbeteren werkt beter dan opnieuw beginnen.',
      expectedResult: 'Een krantenbrug die vijf kilo houdt, plus aantekeningen over wat als eerste begaf.',
      preparation: [
        'Maak een tafel leeg en zet twee gelijke stapels boeken op 40 cm afstand.',
        'Zoek iets van ongeveer vijf kilo, bijvoorbeeld zakken bloem of rijst.',
        'Spreek af dat de eerste instorting bij het plan hoort.',
      ],
      reflectionQuestions: [
        'Waar bezweek je brug het eerst, en waardoor denk je dat dat kwam?',
        'Wat veranderde je daarna, en werkte het?',
      ],
    },
  },
  {
    slug: 'density-tower',
    category: 'science',
    ageBands: ['AGE_6_8', 'AGE_9_11'],
    durationMinutes: 40,
    difficulty: 'EASY',
    setting: 'INDOOR',
    weather: ['ANY', 'RAIN_FRIENDLY'],
    minParticipants: 1,
    maxParticipants: 5,
    skills: ['curiosity', 'problem-solving'],
    materials: [
      { slug: 'jar' },
      { slug: 'water' },
      { slug: 'baking-supplies', quantity: 'oil and salt' },
      { slug: 'pencil' },
      { slug: 'paper' },
    ],
    safety: [
      {
        severity: 'INFO',
        en: 'Work over the sink or a tray. Nothing here is for drinking.',
        nl: 'Werk boven de gootsteen of een dienblad. Niets hiervan is om te drinken.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Predict first',
          instruction:
            'Line up your liquids: water, oil, water with a lot of salt stirred in, and washing-up liquid if you have it. Before you pour anything, draw the order you think they will end up in. Predicting first is what makes it an experiment.',
        },
        nl: {
          title: 'Voorspel eerst',
          instruction:
            'Zet je vloeistoffen klaar: water, olie, water met veel zout erdoor, en afwasmiddel als je dat hebt. Teken vóór je iets giet de volgorde die je verwacht. Eerst voorspellen maakt het een proef.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Pour slowly, heaviest first',
          instruction:
            'Pour the salty water in first, then plain water down the side of the jar over the back of a spoon, then oil. Slowly. Fast pouring mixes the layers and hides the effect.',
        },
        nl: {
          title: 'Giet langzaam, zwaarste eerst',
          instruction:
            'Giet eerst het zoute water, dan gewoon water langs de rand over de bolle kant van een lepel, dan olie. Langzaam. Snel gieten mengt de lagen en verstopt het effect.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Drop things in',
          instruction:
            'Gently drop in a grape, a bottle cap and a small coin. Each one stops at the layer that is heavier than itself. Note where each stopped.',
        },
        nl: {
          title: 'Laat er dingen in vallen',
          instruction:
            'Laat voorzichtig een druif, een dopje en een muntje zakken. Elk stopt bij de laag die zwaarder is dan het voorwerp zelf. Noteer waar elk voorwerp bleef hangen.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Compare with your prediction',
          instruction:
            'Look back at your drawing. Where were you right, where were you wrong, and what would you test next?',
        },
        nl: {
          title: 'Vergelijk met je voorspelling',
          instruction:
            'Kijk terug naar je tekening. Waar had je gelijk, waar niet, en wat zou je hierna testen?',
        },
      },
    ],
    en: {
      title: 'Build a density tower',
      shortDescription: 'Stack liquids in a jar so they refuse to mix, then find out which layer catches what.',
      story:
        'Liquids have weight the way people have opinions: put them together and the heaviest ones sink to the bottom. Today you will make a tower of them in a jar.',
      educationalObjective:
        'Children practise the core scientific habit of predicting before observing, and meet density as something they can see rather than a definition.',
      expectedResult: 'A jar with at least three visible layers and a written prediction to compare against.',
      preparation: [
        'Find a tall, clear glass jar.',
        'Get oil, salt and water ready, plus a spoon.',
        'Work over a tray or the sink.',
      ],
      reflectionQuestions: [
        'Which prediction were you most surprised about?',
        'What else in the house do you now think would float on oil?',
      ],
    },
    nl: {
      title: 'Bouw een dichtheidstoren',
      shortDescription: 'Stapel vloeistoffen in een pot zodat ze weigeren te mengen, en ontdek welke laag wat opvangt.',
      story:
        'Vloeistoffen hebben gewicht zoals mensen meningen hebben: zet ze bij elkaar en de zwaarste zakken naar de bodem. Vandaag bouw je er een toren van in een pot.',
      educationalObjective:
        'Kinderen oefenen de kern van wetenschappelijk werken — eerst voorspellen, dan waarnemen — en ontmoeten dichtheid als iets zichtbaars in plaats van een definitie.',
      expectedResult: 'Een pot met minstens drie zichtbare lagen en een opgeschreven voorspelling om mee te vergelijken.',
      preparation: [
        'Zoek een hoge, doorzichtige glazen pot.',
        'Zet olie, zout en water klaar, plus een lepel.',
        'Werk boven een dienblad of de gootsteen.',
      ],
      reflectionQuestions: [
        'Welke voorspelling verbaasde je het meest?',
        'Wat in huis denk je nu dat ook op olie zou blijven drijven?',
      ],
    },
  },
  {
    slug: 'shadow-clock',
    category: 'science',
    ageBands: ['AGE_9_11', 'AGE_12_15'],
    durationMinutes: 60,
    difficulty: 'MEDIUM',
    setting: 'OUTDOOR',
    weather: ['DRY', 'WARM'],
    seasons: ['SPRING', 'SUMMER'],
    minParticipants: 1,
    maxParticipants: 5,
    isPremium: true,
    skills: ['curiosity', 'problem-solving', 'nature-awareness'],
    materials: [
      { slug: 'sticks', quantity: 'one straight stick' },
      { slug: 'chalk' },
      { slug: 'stones' },
      { slug: 'timer' },
    ],
    safety: [
      {
        severity: 'CAUTION',
        en: 'Never look directly at the sun, and wear a hat if it is hot.',
        nl: 'Kijk nooit recht in de zon en zet een pet op als het warm is.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Plant your gnomon',
          instruction:
            'Push a straight stick upright into the ground, or wedge it in a flowerpot, somewhere that will stay sunny all afternoon. That stick is called a gnomon - the oldest instrument in science.',
        },
        nl: {
          title: 'Plant je gnomon',
          instruction:
            'Steek een rechte stok rechtop in de grond, of zet hem vast in een bloempot, op een plek die de hele middag zon houdt. Die stok heet een gnomon — het oudste instrument uit de wetenschap.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Mark the first hour',
          instruction:
            'Mark the tip of the shadow with chalk or a stone and write the time next to it. Then walk away - this quest waits for the sun.',
        },
        nl: {
          title: 'Markeer het eerste uur',
          instruction:
            'Markeer de punt van de schaduw met krijt of een steen en zet de tijd ernaast. Loop dan weg — dit avontuur wacht op de zon.',
        },
      },
      {
        minutes: 30,
        en: {
          title: 'Come back every half hour',
          instruction:
            'Every thirty minutes, mark the shadow tip again and write the time. Do something else in between - this is deliberately not a task you sit and watch.',
        },
        nl: {
          title: 'Kom elk half uur terug',
          instruction:
            'Markeer elk half uur opnieuw de punt van de schaduw en schrijf de tijd erbij. Doe er iets anders tussendoor — dit is met opzet geen klus om bij te blijven zitten.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Read your clock',
          instruction:
            'Look at the curve your marks make. Where was the shadow shortest? That moment is solar noon, and the line from the stick through it points almost exactly north.',
        },
        nl: {
          title: 'Lees je klok af',
          instruction:
            'Kijk naar de kromme die je markeringen vormen. Waar was de schaduw het kortst? Dat moment is de ware middag, en de lijn van de stok daardoorheen wijst bijna precies naar het noorden.',
        },
      },
    ],
    en: {
      title: 'Build a shadow clock',
      shortDescription:
        'One stick, an afternoon of sunshine, and you can tell the time and find north without any device.',
      story:
        'Long before anybody had a watch, a stick in the ground was enough. Plant yours this afternoon and let the sun do the work while you get on with something else.',
      educationalObjective:
        'Children see the Earth turning, in the form of a moving shadow, and discover that patient measurement over hours reveals something a single glance cannot.',
      expectedResult: 'A chalked shadow clock with at least five timed marks, and the direction of north.',
      preparation: [
        'Find a spot that stays sunny for a few hours.',
        'Get a straight stick and something to mark with.',
        'Set a reminder for every thirty minutes.',
      ],
      reflectionQuestions: [
        'How did the shadow change in length as well as direction?',
        'Why would this clock be useless on a cloudy day, and what would you use instead?',
      ],
    },
    nl: {
      title: 'Bouw een schaduwklok',
      shortDescription:
        'Eén stok, een middag zon, en je kunt de tijd aflezen en het noorden vinden zonder apparaat.',
      story:
        'Lang voordat iemand een horloge had, was een stok in de grond genoeg. Plant die van jullie vanmiddag en laat de zon het werk doen terwijl jullie iets anders gaan doen.',
      educationalObjective:
        'Kinderen zien de aarde draaien, in de vorm van een bewegende schaduw, en ontdekken dat geduldig meten over uren iets laat zien wat één blik niet kan.',
      expectedResult: 'Een schaduwklok met minstens vijf gemarkeerde tijden, en de richting van het noorden.',
      preparation: [
        'Zoek een plek die een paar uur in de zon blijft.',
        'Pak een rechte stok en iets om mee te markeren.',
        'Zet een herinnering voor elk half uur.',
      ],
      reflectionQuestions: [
        'Hoe veranderde de schaduw niet alleen van richting maar ook van lengte?',
        'Waarom is deze klok nutteloos op een bewolkte dag, en wat zou je dan gebruiken?',
      ],
    },
  },

  // ----------------------------------------------------------- movement ---
  {
    slug: 'chalk-obstacle-course',
    category: 'movement',
    ageBands: ['AGE_6_8', 'AGE_9_11'],
    durationMinutes: 45,
    difficulty: 'EASY',
    setting: 'OUTDOOR',
    weather: ['DRY'],
    minParticipants: 2,
    maxParticipants: 8,
    skills: ['movement', 'creativity', 'teamwork'],
    materials: [{ slug: 'chalk' }, { slug: 'timer' }],
    safety: [
      {
        severity: 'CAUTION',
        en: 'Use a pavement, playground or car-free courtyard - never a road, and never a shared cycle path.',
        nl: 'Gebruik een stoep, speelplaats of autovrije binnenplaats — nooit de weg en nooit een fietspad.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Design the course',
          instruction:
            'Draw six stations in chalk: hop on one leg, crab walk, spin twice, jump the river, balance the line, star jumps. Number them so anyone can follow without being told.',
        },
        nl: {
          title: 'Ontwerp het parcours',
          instruction:
            'Teken zes stations met krijt: hinkelen, krabbenloop, twee keer draaien, over de rivier springen, over de lijn balanceren, sprongen. Nummer ze, zodat iedereen ze kan volgen zonder uitleg.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Walk it once, slowly',
          instruction:
            'Everyone walks the course once at slow speed to check it is safe and that every station is clear. Fix anything confusing now.',
        },
        nl: {
          title: 'Loop hem één keer langzaam',
          instruction:
            'Iedereen loopt het parcours één keer langzaam om te checken of het veilig is en of elk station duidelijk is. Pas nu aan wat verwarrend is.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Race yourself, not each other',
          instruction:
            'Time each person three times. The goal is to beat your own first time. Everyone gets faster; nobody loses.',
        },
        nl: {
          title: 'Race tegen jezelf, niet tegen elkaar',
          instruction:
            'Klok iedereen drie keer. Het doel is je eigen eerste tijd verbeteren. Iedereen wordt sneller; niemand verliest.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Leave it for the street',
          instruction:
            'Leave the chalk course where it is. Other children will find it. Add an arrow and the word START so they know where to begin.',
        },
        nl: {
          title: 'Laat het achter voor de straat',
          instruction:
            'Laat het krijtparcours liggen. Andere kinderen vinden het vanzelf. Zet er een pijl en het woord START bij zodat ze weten waar ze moeten beginnen.',
        },
      },
    ],
    en: {
      title: 'Chalk obstacle course',
      shortDescription: 'Six chalk stations on the pavement, three runs each, and you race only your own best time.',
      story:
        'A pavement is a blank playing field waiting for someone with chalk. Draw a course, run it until your own time drops, and leave it there for whoever comes next.',
      educationalObjective:
        'Children practise coordination and self-competition rather than ranking each other, and design something for other people to use.',
      expectedResult: 'A six-station chalk course, three timed runs each, and a course left for the neighbourhood.',
      preparation: [
        'Find a safe, car-free stretch of pavement or playground.',
        'Take chalk and something that can time seconds.',
        'Agree the boundaries before you start.',
      ],
      reflectionQuestions: [
        'Which station was hardest, and what made it easier the third time?',
        'What would you add to the course for someone younger than you?',
      ],
    },
    nl: {
      title: 'Krijtparcours',
      shortDescription: 'Zes krijtstations op de stoep, drie rondes elk, en je racet alleen tegen je eigen beste tijd.',
      story:
        'Een stoep is een leeg speelveld dat wacht op iemand met krijt. Teken een parcours, ren het tot je eigen tijd zakt, en laat het liggen voor wie er na jullie komt.',
      educationalObjective:
        'Kinderen oefenen coördinatie en meten zich met zichzelf in plaats van elkaar te ranken, en ontwerpen iets voor anderen om te gebruiken.',
      expectedResult: 'Een parcours van zes stations, drie geklokte rondes per persoon, en een parcours dat blijft liggen voor de buurt.',
      preparation: [
        'Zoek een veilig, autovrij stuk stoep of een speelplaats.',
        'Neem krijt mee en iets dat seconden kan klokken.',
        'Spreek vooraf de grenzen af.',
      ],
      reflectionQuestions: [
        'Welk station was het moeilijkst, en wat maakte het de derde keer makkelijker?',
        'Wat zou je toevoegen voor iemand die jonger is dan jij?',
      ],
    },
  },
  {
    slug: 'neighbourhood-sports-hour',
    category: 'movement',
    ageBands: ['AGE_12_15'],
    durationMinutes: 90,
    difficulty: 'CHALLENGING',
    setting: 'OUTDOOR',
    weather: ['DRY'],
    minParticipants: 3,
    maxParticipants: 12,
    requiresAdult: true,
    isPremium: true,
    skills: ['teamwork', 'communication', 'citizenship', 'movement'],
    materials: [{ slug: 'ball' }, { slug: 'chalk' }, { slug: 'paper' }, { slug: 'timer' }],
    safety: [
      {
        severity: 'ADULT_REQUIRED',
        en: 'An adult must be present for the whole activity and must agree the location beforehand.',
        nl: 'Een volwassene is de hele tijd aanwezig en keurt de locatie vooraf goed.',
      },
      {
        severity: 'CAUTION',
        en: 'Only invite children you and your parents already know. Do not post the invitation publicly online.',
        nl: 'Nodig alleen kinderen uit die jij en je ouders al kennen. Zet de uitnodiging niet openbaar online.',
      },
    ],
    steps: [
      {
        minutes: 20,
        en: {
          title: 'Plan one hour that anyone can join',
          instruction:
            'Design three games that work for wildly different ages and skills, each about fifteen minutes. Write the rules in one short sentence each - if a rule needs a paragraph, it is too complicated.',
        },
        nl: {
          title: 'Plan een uur waar iedereen aan mee kan doen',
          instruction:
            'Bedenk drie spellen die werken voor heel verschillende leeftijden en niveaus, elk ongeveer een kwartier. Schrijf de regels in één korte zin per spel — heeft een regel een alinea nodig, dan is hij te ingewikkeld.',
        },
      },
      {
        minutes: 15,
        en: {
          title: 'Invite in person',
          instruction:
            'Walk round and invite the neighbours you know, face to face or with a note through the door. Say the time, the place, how long it lasts and that a parent will be there.',
        },
        nl: {
          title: 'Nodig persoonlijk uit',
          instruction:
            'Ga langs en nodig de buren uit die je kent, in het echt of met een briefje door de bus. Zeg de tijd, de plek, hoe lang het duurt en dat er een ouder bij is.',
        },
      },
      {
        minutes: 45,
        en: {
          title: 'Run the hour',
          instruction:
            'You are the organiser, not the star. Explain each game in under a minute, join in, keep time, and change teams between games so nobody is stuck losing.',
        },
        nl: {
          title: 'Draai het uur',
          instruction:
            'Jij bent de organisator, niet de ster. Leg elk spel in minder dan een minuut uit, doe mee, houd de tijd bij en wissel de teams tussen de spellen, zodat niemand blijft verliezen.',
        },
      },
      {
        minutes: 10,
        en: {
          title: 'Tidy up and ask',
          instruction:
            'Clear everything away together and ask two people what they would change. Write both answers down; that is your plan for next time.',
        },
        nl: {
          title: 'Ruim op en vraag door',
          instruction:
            'Ruim samen alles op en vraag twee mensen wat ze zouden veranderen. Schrijf beide antwoorden op; dat is je plan voor de volgende keer.',
        },
      },
    ],
    en: {
      title: 'Organise a neighbourhood sports hour',
      shortDescription:
        'Plan, invite and run one hour of games for the children in your street - and run it well.',
      story:
        'There is a difference between playing a game and making one happen for other people. This one is about the second thing: planning, inviting, explaining, and keeping it fair.',
      educationalObjective:
        'Teenagers practise organising: designing for mixed abilities, communicating rules briefly, and taking responsibility for other people’s experience.',
      expectedResult: 'One hour of games actually run, and two pieces of feedback written down.',
      preparation: [
        'Agree the place and time with an adult first.',
        'Write the three games and their one-line rules.',
        'Check the weather and have an indoor fallback.',
      ],
      reflectionQuestions: [
        'What was harder than you expected: the planning, the inviting or the running?',
        'Who had the least fun, and what would have helped them?',
      ],
    },
    nl: {
      title: 'Organiseer een sportuur in de buurt',
      shortDescription:
        'Plan, nodig uit en draai een uur spel voor de kinderen in je straat — en doe het goed.',
      story:
        'Er is verschil tussen een spel spelen en er een laten gebeuren voor anderen. Dit gaat over het tweede: plannen, uitnodigen, uitleggen en het eerlijk houden.',
      educationalObjective:
        'Tieners oefenen organiseren: ontwerpen voor gemengde niveaus, regels kort uitleggen en verantwoordelijkheid nemen voor de ervaring van anderen.',
      expectedResult: 'Een uur spel dat echt gedraaid is, en twee stukjes feedback opgeschreven.',
      preparation: [
        'Spreek plek en tijd eerst af met een volwassene.',
        'Schrijf de drie spellen met hun regel van één zin.',
        'Check het weer en houd een binnenoptie achter de hand.',
      ],
      reflectionQuestions: [
        'Wat was moeilijker dan verwacht: plannen, uitnodigen of draaien?',
        'Wie had het minste plezier, en wat had die persoon geholpen?',
      ],
    },
  },
  {
    slug: 'living-room-olympics',
    category: 'movement',
    ageBands: ['AGE_6_8', 'AGE_9_11'],
    durationMinutes: 40,
    difficulty: 'EASY',
    setting: 'INDOOR',
    weather: ['RAIN_FRIENDLY', 'ANY', 'SNOW'],
    minParticipants: 2,
    maxParticipants: 6,
    skills: ['movement', 'creativity', 'teamwork'],
    materials: [{ slug: 'string' }, { slug: 'paper' }, { slug: 'timer' }, { slug: 'blanket' }],
    safety: [
      {
        severity: 'CAUTION',
        en: 'Clear the floor of hard corners first, and keep everything below chest height. No jumping from furniture.',
        nl: 'Ruim eerst harde hoeken weg en houd alles onder borsthoogte. Niet van meubels af springen.',
      },
    ],
    steps: [
      {
        minutes: 10,
        en: {
          title: 'Invent five events',
          instruction:
            'Use only what is already in the room. Sock shot-put, cushion long jump, blanket bobsleigh, paper-ball marathon, slow-motion race. Give each a proper name.',
        },
        nl: {
          title: 'Verzin vijf onderdelen',
          instruction:
            'Gebruik alleen wat al in de kamer ligt. Sokkenkogelstoten, kussenverspringen, dekenbobslee, papierbalmarathon, slowmotionrace. Geef elk onderdeel een echte naam.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Make the rules fair',
          instruction:
            'For every event, add one rule that gives the youngest person a real chance - a shorter distance, an extra go, or a handicap for the tallest.',
        },
        nl: {
          title: 'Maak de regels eerlijk',
          instruction:
            'Voeg bij elk onderdeel één regel toe die de jongste een echte kans geeft: een kortere afstand, een extra beurt, of een handicap voor de langste.',
        },
      },
      {
        minutes: 20,
        en: {
          title: 'Hold the games',
          instruction:
            'Run all five events back to back. Someone keeps score on paper and someone announces each event out loud, like a commentator.',
        },
        nl: {
          title: 'Houd de spelen',
          instruction:
            'Doe alle vijf de onderdelen achter elkaar. Eén iemand houdt de score bij op papier en één iemand kondigt elk onderdeel hardop aan, als een commentator.',
        },
      },
      {
        minutes: 5,
        en: {
          title: 'Award something silly',
          instruction:
            'Make a paper medal for a category that is not "winner": most improved, best commentary, funniest technique, best sportsmanship.',
        },
        nl: {
          title: 'Reik iets geks uit',
          instruction:
            'Maak een papieren medaille voor een categorie die niet "winnaar" is: meest verbeterd, beste commentaar, grappigste techniek, beste sportiviteit.',
        },
      },
    ],
    en: {
      title: 'Living room olympics',
      shortDescription:
        'Five invented events, everything already in the room, and rules deliberately written to be fair.',
      story:
        'Rain outside, energy inside. Turn the living room into a stadium with five events nobody has ever competed in before, and write the rules so the smallest player has a real chance.',
      educationalObjective:
        'Children design games and practise fairness explicitly - adapting rules so mixed ages can genuinely compete together.',
      expectedResult: 'Five invented events run to completion, with a scoreboard and one paper medal.',
      preparation: [
        'Clear a safe floor space and move fragile things away.',
        'Collect socks, cushions, paper and a blanket.',
        'Agree that nothing gets thrown at people.',
      ],
      reflectionQuestions: [
        'Which rule made the games fairest, and how did you come up with it?',
        'Which event would you keep for next time?',
      ],
    },
    nl: {
      title: 'Huiskamerolympiade',
      shortDescription:
        'Vijf zelfbedachte onderdelen, alles wat al in de kamer ligt, en regels die met opzet eerlijk zijn.',
      story:
        'Regen buiten, energie binnen. Maak van de woonkamer een stadion met vijf onderdelen waar nog nooit iemand aan meedeed, en schrijf de regels zo dat de kleinste speler een echte kans heeft.',
      educationalObjective:
        'Kinderen ontwerpen spellen en oefenen eerlijkheid heel concreet: regels aanpassen zodat gemengde leeftijden echt samen kunnen spelen.',
      expectedResult: 'Vijf zelfbedachte onderdelen helemaal gespeeld, met een scorebord en één papieren medaille.',
      preparation: [
        'Maak een veilige vloer vrij en zet breekbare spullen weg.',
        'Verzamel sokken, kussens, papier en een deken.',
        'Spreek af dat er niets naar mensen gegooid wordt.',
      ],
      reflectionQuestions: [
        'Welke regel maakte de spelen het eerlijkst, en hoe bedachten jullie die?',
        'Welk onderdeel houden jullie erin voor de volgende keer?',
      ],
    },
  },
]
