import type { QuestSeed } from "./quest-types";

export const PRACTICAL_AND_ENTERPRISE_QUESTS: QuestSeed[] = [
  {
    slug: "repair-cafe-at-home",
    categorySlug: "practical",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    durationMinutes: 60,
    difficulty: "MEDIUM",
    setting: "INDOOR",
    weather: "RAIN_FRIENDLY",
    minParticipants: 2,
    maxParticipants: 4,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["practical-independence", "problem-solving", "citizenship"],
    materials: [{ slug: "screwdriver" }, { slug: "glue", optional: true }, { slug: "notebook" }],
    nl: {
      title: "Repareercafe aan de keukentafel",
      summary: "Zoek iets kapots, haal het open en probeer het te maken.",
      story:
        "In bijna elk huis ligt iets kapots in een la. Een lamp die niet meer brandt, een speelgoedauto met een los wiel. Vandaag maak je hem open, kijk je hoe hij werkt en probeer je hem te repareren.",
      educationalObjective:
        "Het kind leert een probleem systematisch onderzoeken, ontdekt hoe voorwerpen in elkaar zitten, en ervaart dat repareren een alternatief is voor weggooien.",
      expectedResult: "Een gerepareerd voorwerp, of een duidelijke uitleg van wat er kapot is en waarom het niet lukte.",
      preparation: ["Zoek een kapot voorwerp uit dat niet op stroom werkt", "Leg gereedschap en een bakje voor schroefjes klaar", "Maak een foto voordat je begint"],
    },
    en: {
      title: "Repair cafe at the kitchen table",
      summary: "Find something broken, open it up and try to fix it.",
      story:
        "In almost every house something broken sits in a drawer. A lamp that no longer lights, a toy car with a loose wheel. Today you open it, look at how it works and try to repair it.",
      educationalObjective:
        "The child learns to investigate a problem systematically, discovers how objects are put together, and experiences repair as an alternative to throwing away.",
      expectedResult: "A repaired object, or a clear explanation of what is broken and why it could not be fixed.",
      preparation: ["Choose a broken object that does not run on mains power", "Lay out tools and a bowl for screws", "Take a photo before you start"],
    },
    steps: [
      {
        durationMinutes: 10,
        nl: { title: "Onderzoek eerst", body: "Bekijk het voorwerp goed zonder iets los te maken. Schrijf op wat er volgens jou mis is en waarom je dat denkt." },
        en: { title: "Investigate first", body: "Look at the object closely without taking anything apart. Write down what you think is wrong and why." },
      },
      {
        durationMinutes: 20,
        requiresParent: true,
        nl: { title: "Haal het open", body: "Schroef het voorzichtig open. Leg schroefjes in een bakje en maak foto's van elke stap.", tip: "Foto's van tussenstappen redden je bij het in elkaar zetten." },
        en: { title: "Open it up", body: "Unscrew it carefully. Put screws in a bowl and photograph every step.", tip: "Photos of intermediate steps save you when reassembling." },
      },
      {
        durationMinutes: 20,
        requiresParent: true,
        nl: { title: "Repareer", body: "Zoek het kapotte deel en probeer het te lijmen, vast te zetten of te vervangen. Lukt het niet? Dat is ook een resultaat." },
        en: { title: "Repair", body: "Find the broken part and try to glue, fasten or replace it. Not working? That is a result too." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Zet in elkaar en test", body: "Zet alles terug volgens je foto's en test of het werkt." },
        en: { title: "Reassemble and test", body: "Put everything back using your photos and test whether it works." },
      },
    ],
    safety: [
      { severity: "CRITICAL", nl: "Werk nooit aan apparaten die op het stopcontact aangesloten zijn of kunnen worden. Haal batterijen eruit voordat je begint.", en: "Never work on devices that are or can be connected to mains power. Remove batteries before you start." },
      { severity: "CRITICAL", nl: "Een volwassene doet het openmaken en blijft erbij zolang gereedschap op tafel ligt.", en: "An adult does the opening and stays present as long as tools are on the table." },
    ],
    reflections: [
      { nl: "Wat zat er binnenin dat je niet had verwacht?", en: "What was inside that you did not expect?" },
      { nl: "Wat zou je thuis nog meer kunnen repareren in plaats van weggooien?", en: "What else could you repair at home instead of throwing away?" },
    ],
  },
  {
    slug: "sew-a-button",
    categorySlug: "practical",
    ageBands: ["AGE_6_8", "AGE_9_11"],
    durationMinutes: 30,
    difficulty: "EASY",
    setting: "INDOOR",
    weather: "RAIN_FRIENDLY",
    minParticipants: 1,
    maxParticipants: 4,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["practical-independence", "problem-solving"],
    materials: [{ slug: "needle-and-thread" }, { slug: "button" }, { slug: "scissors" }],
    nl: {
      title: "Zet een knoop aan",
      summary: "Een vaardigheid voor de rest van je leven, in een half uur geleerd.",
      story:
        "Een losse knoop betekent meestal het einde van een shirt. Tenzij je weet hoe je hem aanzet. Vandaag leer je dat, en daarna hoef je het nooit meer aan iemand te vragen.",
      educationalObjective: "Het kind oefent fijne motoriek, doorzettingsvermogen en zelfredzaamheid.",
      expectedResult: "Een stevig vastgezette knoop die blijft zitten als je eraan trekt.",
      preparation: ["Zoek een kledingstuk met een losse knoop, of oefen op een lap", "Zet goed licht aan", "Leg een schaar en draad in een passende kleur klaar"],
    },
    en: {
      title: "Sew on a button",
      summary: "A skill for the rest of your life, learned in half an hour.",
      story:
        "A loose button usually means the end of a shirt. Unless you know how to put it back. Today you learn that, and after this you never have to ask anyone again.",
      educationalObjective: "The child practises fine motor skills, persistence and self-reliance.",
      expectedResult: "A firmly attached button that stays put when you pull it.",
      preparation: ["Find a garment with a loose button, or practise on a scrap of fabric", "Turn on good light", "Lay out scissors and thread in a matching colour"],
    },
    steps: [
      {
        durationMinutes: 10,
        requiresParent: true,
        nl: { title: "Rijg de naald", body: "Knip ongeveer vijftig centimeter draad af en rijg de naald. Maak een knoopje in het uiteinde.", tip: "Draad nat maken tussen je lippen maakt het rijgen makkelijker." },
        en: { title: "Thread the needle", body: "Cut about fifty centimetres of thread and thread the needle. Tie a knot in the end.", tip: "Wetting the end makes threading easier." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Naai de knoop vast", body: "Prik van onderaf door de stof en door een gaatje van de knoop. Ga zes keer heen en weer door beide gaatjes." },
        en: { title: "Sew the button on", body: "Push up through the fabric and through one hole of the button. Go back and forth through both holes six times." },
      },
      {
        durationMinutes: 5,
        nl: { title: "Zet vast", body: "Wikkel de draad drie keer om de steken onder de knoop en maak een knoopje. Knip de draad af en trek aan de knoop om te testen." },
        en: { title: "Finish off", body: "Wind the thread three times around the stitches under the button and tie a knot. Cut the thread and tug the button to test." },
      },
    ],
    safety: [
      { severity: "WARNING", nl: "Een naald is scherp. Een volwassene blijft erbij en de naald gaat na afloop terug in een doosje.", en: "A needle is sharp. An adult stays present and the needle goes back into a box afterwards." },
    ],
    reflections: [
      { nl: "Wat was het lastigst: rijgen, naaien of afhechten?", en: "What was hardest: threading, sewing or finishing off?" },
      { nl: "Wat zou je nu nog meer zelf kunnen repareren?", en: "What else could you now repair yourself?" },
    ],
  },
  {
    slug: "bike-check-and-fix",
    categorySlug: "practical",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    durationMinutes: 60,
    difficulty: "MEDIUM",
    setting: "OUTDOOR",
    weather: "DRY",
    minParticipants: 1,
    maxParticipants: 4,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["practical-independence", "problem-solving", "citizenship"],
    materials: [{ slug: "bicycle" }, { slug: "bicycle-pump" }, { slug: "screwdriver", optional: true }, { slug: "notebook" }],
    nl: {
      title: "Fietscheck in acht punten",
      summary: "Banden, remmen, licht, ketting. Loop je fiets langs en maak hem veilig.",
      story:
        "Je fietst er elke dag op, maar wanneer heb je hem voor het laatst goed bekeken? Vandaag doe je een echte keuring: acht punten, een checklist, en aan het eind een fiets waar je weer helemaal op kunt vertrouwen.",
      educationalObjective:
        "Het kind leert systematisch controleren, ontdekt hoe een fiets werkt en neemt verantwoordelijkheid voor de eigen veiligheid.",
      expectedResult: "Een ingevulde checklist van acht punten en minstens een punt dat je zelf hebt verbeterd.",
      preparation: ["Zet de fiets op een vlakke plek", "Leg een pomp en doek klaar", "Schrijf de acht controlepunten over in je boekje"],
    },
    en: {
      title: "Eight-point bicycle check",
      summary: "Tyres, brakes, lights, chain. Go over your bike and make it safe.",
      story:
        "You ride it every day, but when did you last really look at it? Today you do a proper inspection: eight points, a checklist, and at the end a bike you can trust again.",
      educationalObjective:
        "The child learns to check systematically, discovers how a bicycle works and takes responsibility for their own safety.",
      expectedResult: "A completed eight-point checklist and at least one point you improved yourself.",
      preparation: ["Put the bike on a flat spot", "Lay out a pump and a cloth", "Copy the eight check points into your notebook"],
    },
    steps: [
      {
        durationMinutes: 15,
        nl: { title: "Controleer banden en remmen", body: "Knijp in de banden: te zacht? Pomp op. Knijp de remmen in: pakken ze voordat de hendel het stuur raakt?" },
        en: { title: "Check tyres and brakes", body: "Squeeze the tyres: too soft? Pump them up. Squeeze the brakes: do they grip before the lever touches the handlebar?" },
      },
      {
        durationMinutes: 15,
        nl: { title: "Controleer licht en bel", body: "Test voorlicht, achterlicht, reflectoren en de bel. Noteer wat niet werkt." },
        en: { title: "Check lights and bell", body: "Test the front light, rear light, reflectors and the bell. Note what does not work." },
      },
      {
        durationMinutes: 20,
        requiresParent: true,
        nl: { title: "Ketting en zadel", body: "Maak de ketting schoon en smeer hem licht. Zet het zadel op de goede hoogte: met je tenen moet je net de grond raken.", tip: "Een schone ketting fietst merkbaar lichter." },
        en: { title: "Chain and saddle", body: "Clean the chain and oil it lightly. Set the saddle to the right height: your toes should just touch the ground.", tip: "A clean chain rides noticeably lighter." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Testrondje", body: "Fiets een klein rondje op een rustige plek en controleer of alles goed voelt." },
        en: { title: "Test ride", body: "Ride a short loop in a quiet spot and check that everything feels right." },
      },
    ],
    safety: [
      { severity: "CRITICAL", nl: "Een volwassene controleert de remmen mee voordat het kind wegfietst.", en: "An adult checks the brakes as well before the child rides off." },
      { severity: "WARNING", nl: "Werk niet aan de fiets op de rijbaan en houd vingers uit de ketting.", en: "Do not work on the bike in the road, and keep fingers out of the chain." },
    ],
    reflections: [
      { nl: "Welk punt was niet in orde en had je dat verwacht?", en: "Which point was not in order, and did you expect that?" },
      { nl: "Hoe vaak zou je deze check moeten doen?", en: "How often should you do this check?" },
    ],
  },
  {
    slug: "design-and-sell",
    categorySlug: "entrepreneurship",
    ageBands: ["AGE_12_15"],
    durationMinutes: 120,
    difficulty: "CHALLENGING",
    setting: "BOTH",
    weather: "ANY",
    minParticipants: 1,
    maxParticipants: 4,
    isPremium: true,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["financial-literacy", "creativity", "communication"],
    materials: [{ slug: "notebook" }, { slug: "coins", quantity: "startbudget" }, { slug: "pencils" }],
    nl: {
      title: "Ontwerp en verkoop iets zelfgemaakts",
      summary: "Van idee naar prijs naar echte klant. Reken uit of je winst maakt.",
      story:
        "Een idee is pas een onderneming als iemand ervoor betaalt. Vandaag maak je iets met de hand, bepaal je een eerlijke prijs, en probeer je het te verkopen aan familie of buren. Aan het eind weet je precies wat je verdiend hebt.",
      educationalObjective:
        "De jongere leert kostprijs, verkoopprijs en marge berekenen, oefent presenteren en ervaart dat verkopen ook afwijzing betekent.",
      expectedResult: "Minstens drie gemaakte producten, een prijsberekening en een verkoopoverzicht met winst of verlies.",
      preparation: ["Spreek af waar en aan wie verkocht mag worden", "Bepaal samen een startbudget", "Kies iets dat je echt kunt maken in een uur"],
    },
    en: {
      title: "Design and sell something handmade",
      summary: "From idea to price to a real customer. Work out whether you make a profit.",
      story:
        "An idea only becomes a business when someone pays for it. Today you make something by hand, set a fair price, and try to sell it to family or neighbours. At the end you know exactly what you earned.",
      educationalObjective:
        "The teenager learns to calculate cost price, selling price and margin, practises presenting and experiences that selling also means rejection.",
      expectedResult: "At least three products made, a price calculation and a sales overview showing profit or loss.",
      preparation: ["Agree where and to whom selling is allowed", "Decide a starting budget together", "Choose something you can really make within an hour"],
    },
    steps: [
      {
        durationMinutes: 20,
        nl: { title: "Kies je product", body: "Bedenk drie ideeen en kies er een. Schrijf op wat je nodig hebt en wat dat kost.", tip: "Iets kleins dat je vaker kunt maken werkt beter dan een groot uniek stuk." },
        en: { title: "Choose your product", body: "Come up with three ideas and pick one. Write down what you need and what it costs.", tip: "Something small you can make repeatedly works better than one large unique piece." },
      },
      {
        durationMinutes: 45,
        nl: { title: "Maak er drie", body: "Maak minstens drie stuks. Meet hoelang je per stuk bezig bent." },
        en: { title: "Make three", body: "Make at least three. Time how long each one takes." },
      },
      {
        durationMinutes: 20,
        nl: { title: "Bepaal de prijs", body: "Reken uit: materiaalkosten per stuk plus iets voor je tijd. Wat is een prijs die jij eerlijk vindt en die iemand wil betalen?" },
        en: { title: "Set the price", body: "Work it out: material cost per item plus something for your time. What is a price you find fair and someone will pay?" },
      },
      {
        durationMinutes: 35,
        requiresParent: true,
        nl: { title: "Verkoop", body: "Verkoop aan familie, buren of op een afgesproken plek, altijd met een volwassene erbij. Noteer elke verkoop en elke nee." },
        en: { title: "Sell", body: "Sell to family, neighbours or at an agreed spot, always with an adult present. Record every sale and every no." },
      },
    ],
    safety: [
      { severity: "CRITICAL", nl: "Verkoop nooit alleen en nooit aan onbekenden zonder volwassene erbij. Deel geen adres of telefoonnummer.", en: "Never sell alone and never to strangers without an adult present. Do not share your address or phone number." },
      { severity: "WARNING", nl: "Verkoop niets eetbaars aan mensen buiten het gezin zonder overleg met een volwassene.", en: "Do not sell food to people outside the family without checking with an adult." },
    ],
    reflections: [
      { nl: "Wat was je winst of verlies, en had je dat verwacht?", en: "What was your profit or loss, and did you expect that?" },
      { nl: "Hoe voelde het als iemand nee zei?", en: "How did it feel when someone said no?" },
    ],
  },
  {
    slug: "drink-stand-business-plan",
    categorySlug: "entrepreneurship",
    ageBands: ["AGE_9_11", "AGE_12_15"],
    seasons: ["SPRING", "SUMMER"],
    durationMinutes: 90,
    difficulty: "MEDIUM",
    setting: "OUTDOOR",
    weather: "WARM",
    minParticipants: 2,
    maxParticipants: 5,
    requiresAdultSupervision: true,
    safetyLevel: "WARNING",
    skillSlugs: ["financial-literacy", "teamwork", "communication"],
    materials: [{ slug: "notebook" }, { slug: "coins", quantity: "5 euro" }, { slug: "paper" }, { slug: "pencils" }],
    nl: {
      title: "Een drankstand met een echt plan",
      summary: "Begroten, inkopen, verkopen en nakijken of het klopte.",
      story:
        "Iedereen kent het limonadekraampje. Maar bijna niemand rekent van tevoren uit of het uitkomt. Vandaag doe jij dat wel: eerst het plan, dan de stand.",
      educationalObjective: "Het kind oefent begroten, inkopen, prijzen bepalen en samenwerken onder tijdsdruk.",
      expectedResult: "Een ingevuld plan met verwachte kosten en opbrengsten, en daarnaast de echte cijfers.",
      preparation: ["Vraag toestemming voor de plek", "Spreek een startbudget af", "Kijk het weerbericht"],
    },
    en: {
      title: "A drinks stand with a real plan",
      summary: "Budget, buy, sell and check whether the plan was right.",
      story:
        "Everyone knows the lemonade stand. But almost nobody works out beforehand whether it adds up. Today you do: first the plan, then the stand.",
      educationalObjective: "The child practises budgeting, purchasing, pricing and working together under time pressure.",
      expectedResult: "A completed plan with expected costs and revenue, alongside the real figures.",
      preparation: ["Ask permission for the spot", "Agree a starting budget", "Check the weather forecast"],
    },
    steps: [
      {
        durationMinutes: 25,
        nl: { title: "Maak het plan", body: "Schrijf op: wat verkoop je, wat kost het om te maken, wat vraag je per glas, hoeveel glazen denk je te verkopen?" },
        en: { title: "Make the plan", body: "Write down: what will you sell, what does it cost to make, what do you charge per cup, how many cups do you expect to sell?" },
      },
      {
        durationMinutes: 20,
        requiresParent: true,
        nl: { title: "Koop in en maak klaar", body: "Doe de inkopen binnen je budget en maak de drank klaar. Bewaar de kassabon." },
        en: { title: "Buy and prepare", body: "Do the shopping within your budget and prepare the drinks. Keep the receipt." },
      },
      {
        durationMinutes: 35,
        requiresParent: true,
        nl: { title: "Open de stand", body: "Maak een duidelijk bord met de prijs en verkoop, altijd met een volwassene in de buurt. Streep elke verkoop af.", tip: "Een vriendelijke begroeting verkoopt beter dan een hard bord." },
        en: { title: "Open the stand", body: "Make a clear sign with the price and sell, always with an adult nearby. Tick off every sale.", tip: "A friendly greeting sells better than a loud sign." },
      },
      {
        durationMinutes: 10,
        nl: { title: "Reken na", body: "Vergelijk je plan met de werkelijkheid. Klopte je schatting? Wat verklaart het verschil?" },
        en: { title: "Do the maths", body: "Compare your plan with reality. Was your estimate right? What explains the difference?" },
      },
    ],
    safety: [
      { severity: "CRITICAL", nl: "Er is altijd een volwassene bij de stand. Deel geen persoonlijke gegevens met klanten.", en: "An adult is always at the stand. Do not share personal details with customers." },
      { severity: "WARNING", nl: "Werk hygienisch: schone handen, schone kannen, en zet drank niet urenlang in de zon.", en: "Work hygienically: clean hands, clean jugs, and do not leave drinks standing in the sun for hours." },
    ],
    reflections: [
      { nl: "Wat klopte er niet in je plan, en waardoor kwam dat?", en: "What in your plan was wrong, and what caused it?" },
      { nl: "Wat zou je een volgende keer als eerste veranderen?", en: "What would you change first next time?" },
    ],
  },
  {
    slug: "price-detective",
    categorySlug: "entrepreneurship",
    ageBands: ["AGE_12_15"],
    durationMinutes: 45,
    difficulty: "EASY",
    setting: "BOTH",
    weather: "ANY",
    minParticipants: 1,
    maxParticipants: 4,
    skillSlugs: ["financial-literacy", "curiosity", "problem-solving"],
    materials: [{ slug: "notebook" }, { slug: "pencils" }],
    nl: {
      title: "Prijsdetective",
      summary: "Zoek uit wat iets echt kost per kilo, per liter of per stuk.",
      story:
        "De grote verpakking is goedkoper. Toch? Vandaag ga je dat controleren. Met een rekensom van vijf seconden weet je precies wie er slim inkoopt en wie betaalt voor mooie verpakking.",
      educationalObjective:
        "De jongere leert eenheidsprijzen berekenen en vergelijken, en herkent hoe verpakking en aanbiedingen keuzes sturen.",
      expectedResult: "Een tabel met vijf producten in twee formaten en de prijs per kilo of liter voor allebei.",
      preparation: ["Kies vijf producten die je thuis hebt of in de winkel ziet", "Maak een tabel met vier kolommen", "Neem een rekenmachine of reken uit het hoofd"],
    },
    en: {
      title: "Price detective",
      summary: "Work out what something really costs per kilo, per litre or per item.",
      story:
        "The big pack is cheaper. Right? Today you check. With a five-second calculation you know exactly who is buying smart and who is paying for nice packaging.",
      educationalObjective:
        "The teenager learns to calculate and compare unit prices, and recognises how packaging and offers steer choices.",
      expectedResult: "A table with five products in two sizes and the price per kilo or litre for both.",
      preparation: ["Choose five products you have at home or see in the shop", "Make a table with four columns", "Bring a calculator or do it in your head"],
    },
    steps: [
      {
        durationMinutes: 15,
        nl: { title: "Verzamel de prijzen", body: "Noteer van vijf producten de prijs en het gewicht of volume, in twee verschillende formaten." },
        en: { title: "Collect the prices", body: "For five products, note the price and the weight or volume, in two different sizes." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Reken per eenheid", body: "Deel de prijs door het gewicht of volume. Nu heb je de prijs per kilo of liter.", tip: "Winkels zetten dit vaak in kleine letters op het schap. Controleer of het klopt." },
        en: { title: "Calculate per unit", body: "Divide the price by the weight or volume. Now you have the price per kilo or litre.", tip: "Shops often print this in small type on the shelf. Check whether it is right." },
      },
      {
        durationMinutes: 15,
        nl: { title: "Trek een conclusie", body: "Bij welke producten was de grote verpakking echt goedkoper? Bij welke niet? Bespreek waarom dat zo zou kunnen zijn." },
        en: { title: "Draw a conclusion", body: "For which products was the large pack really cheaper? For which not? Discuss why that might be." },
      },
    ],
    safety: [{ severity: "INFO", nl: "Fotografeer geen schappen of personeel in een winkel zonder toestemming.", en: "Do not photograph shelves or staff in a shop without permission." }],
    reflections: [
      { nl: "Welk product verraste je het meest?", en: "Which product surprised you most?" },
      { nl: "Hoe ga je dit gebruiken bij de volgende boodschappen?", en: "How will you use this the next time you go shopping?" },
    ],
  },
];
