import type { BoxSpec } from './types.ts';

/**
 * Nature Detective — the youngest age band.
 *
 * Written for five- to eight-year-olds, so the sentences are shorter, the
 * pauses longer, and every chapter can be finished outdoors or indoors. The
 * "I am inside" branch in chapter one is not a fallback: a child who cannot go
 * out gets a complete, equivalent path.
 */
export const natureDetective: BoxSpec = {
  sku: 'WB-NATURE-01',
  slug: 'natuurdetective',
  themeSlug: 'nature',
  ageMin: 5,
  ageMax: 8,
  priceCents: 2995,
  curriculumIndex: 3,
  translations: {
    nl: {
      name: 'Natuurdetective',
      tagline: 'Sporen zoeken, bladeren herkennen en ontdekken wie er onder de steen woont',
      description:
        'Vier hoofdstukken lang ben je detective in je eigen tuin, park of straat. Je giet een gipsafdruk van een echt spoor, leert bladeren herkennen aan hun rand, zoekt met een loep naar bodemdiertjes en maakt aan het eind je eigen natuurkaart. Alles kan ook binnen, met de kaarten uit de doos.',
      materialsNote: 'Je hebt zelf een beetje water nodig voor het gips.',
    },
    en: {
      name: 'Nature Detective',
      tagline: 'Track footprints, name leaves and find out who lives under the stone',
      description:
        'For four chapters you are a detective in your own garden, park or street. You cast a plaster print of a real track, learn to name leaves by their edges, hunt for soil creatures with a magnifier and finish by making your own nature map. Everything works indoors too, using the cards from the box.',
      materialsNote: 'You need a little water of your own for the plaster.',
    },
  },
  components: [
    { sku: 'CMP-PLASTER-200', name: 'Gips 200 gram', kind: 'COMPONENT', quantity: 1, stock: 100 },
    { sku: 'CMP-MAGNIFIER', name: 'Loep voor kinderen', kind: 'COMPONENT', quantity: 1, stock: 160 },
    { sku: 'CMP-COLLECT-POT', name: 'Kijkpotje met vergrootdeksel', kind: 'COMPONENT', quantity: 2, stock: 220 },
    { sku: 'CMP-CARD-RING', name: 'Ring met determineerkaartjes', kind: 'PRINTED', quantity: 1, stock: 150 },
    { sku: 'CMP-SOFT-BRUSH', name: 'Zacht kwastje', kind: 'COMPONENT', quantity: 1, stock: 180 },
    { sku: 'PRN-NATURE-MAP', name: 'Natuurkaart om in te vullen', kind: 'PRINTED', quantity: 1, stock: 150 },
    { sku: 'PKG-BOX-S', name: 'Verzenddoos S', kind: 'PACKAGING', quantity: 1, stock: 450 },
  ],
  safety: [
    {
      code: 'NATURE-PLASTER-DUST',
      severity: 'CAUTION',
      text: {
        nl: 'Gipspoeder is stoffig. Roer het buiten of bij een open raam, en houd je gezicht van de kom af. Vraag een volwassene om te helpen met het water.',
        en: 'Plaster powder is dusty. Mix it outside or by an open window, and keep your face away from the bowl. Ask a grown-up to help with the water.',
      },
      requiresAdult: true,
    },
    {
      code: 'NATURE-WASH-HANDS',
      severity: 'INFO',
      text: {
        nl: 'Was je handen als je klaar bent met zoeken in de aarde. En stop nooit iets in je mond wat je buiten hebt gevonden.',
        en: 'Wash your hands when you are finished digging in the soil. And never put anything you found outdoors in your mouth.',
      },
    },
    {
      code: 'NATURE-PUT-BACK',
      severity: 'INFO',
      text: {
        nl: 'Alles wat leeft gaat weer terug waar je het vond, en de steen gaat weer precies zo liggen. Dat is de belangrijkste regel van een natuurdetective.',
        en: 'Everything alive goes back where you found it, and the stone goes back exactly as it lay. That is the most important rule for a nature detective.',
      },
    },
  ],
  journey: {
    slug: 'natuurdetective-reis',
    title: { nl: 'Vier onderzoeken van een natuurdetective', en: "Four investigations of a nature detective" },
    summary: {
      nl: 'Sporen, bladeren, bodemdiertjes en je eigen kaart.',
      en: 'Tracks, leaves, soil creatures and your own map.',
    },
    estimatedMinutes: 60,
    chapters: [
      {
        key: 'tracks',
        title: { nl: 'Hoofdstuk 1: Wie liep hier?', en: 'Chapter 1: Who walked here?' },
        intro: {
          nl: 'Een afdruk in de modder vertelt je wie er langsgekomen is.',
          en: 'A print in the mud tells you who came past.',
        },
        estimatedMinutes: 16,
        entryNodeKey: 'tracks-open',
        experiments: [
          {
            key: 'plaster-cast',
            title: { nl: 'Gipsafdruk van een spoor', en: 'Plaster cast of a track' },
            objective: {
              nl: 'Een spoor bewaren dat er morgen niet meer is.',
              en: 'Keep a track that will be gone tomorrow.',
            },
            durationMinutes: 20,
            requiresAdult: true,
            materials: [
              { nl: 'Het zakje gips', en: 'The bag of plaster' },
              { nl: 'Een beetje water', en: 'A little water' },
              { nl: 'Een kijkpotje om in te roeren', en: 'A pot to mix in' },
            ],
            steps: [
              { nl: 'Zoek een duidelijke afdruk in zachte modder of zand.', en: 'Find a clear print in soft mud or sand.' },
              { nl: 'Haal blaadjes en takjes voorzichtig weg met het kwastje.', en: 'Gently brush away leaves and twigs with the brush.' },
              { nl: 'Roer gips met water tot het zo dik is als vla. Vraag een volwassene om te helpen.', en: 'Mix plaster with water until it is as thick as custard. Ask a grown-up to help.' },
              { nl: 'Giet het langzaam in de afdruk, vanaf de rand.', en: 'Pour it slowly into the print, starting at the edge.' },
              { nl: 'Wacht twintig minuten. Til hem er dan voorzichtig uit.', en: 'Wait twenty minutes. Then lift it out carefully.' },
            ],
            safetyCodes: ['NATURE-PLASTER-DUST', 'NATURE-WASH-HANDS'],
          },
        ],
        nodes: [
          {
            key: 'tracks-open',
            kind: 'NARRATION',
            text: {
              nl: 'Hallo detective. Vandaag ga je uitzoeken wie er bij jou in de buurt rondloopt zonder dat je het ziet. Ben je buiten, of binnen?',
              en: 'Hello detective. Today you are going to find out who walks around near you without you seeing them. Are you outside, or inside?',
            },
            pauseSeconds: 6,
            choices: [
              { key: 'outside', label: { nl: 'Ik ben buiten', en: 'I am outside' }, target: 'tracks-outside' },
              { key: 'inside', label: { nl: 'Ik ben binnen', en: 'I am inside' }, target: 'tracks-inside' },
              { key: 'slower', label: { nl: 'Langzamer praten', en: 'Speak slower' }, isSlower: true },
            ],
          },
          {
            key: 'tracks-outside',
            kind: 'NARRATION',
            text: {
              nl: 'Mooi. Zoek een plekje met zachte grond: modder, zand, of aarde na de regen. Kijk goed of je ergens een afdrukje ziet. Ik wacht wel even.',
              en: 'Good. Find a patch of soft ground: mud, sand, or earth after rain. Look carefully for a little print. I will wait a moment.',
            },
            pauseSeconds: 45,
            choices: [
              { key: 'found', label: { nl: 'Ik zie er een', en: 'I can see one' }, target: 'tracks-question' },
              { key: 'nothing', label: { nl: 'Ik zie niks', en: 'I cannot see anything' }, target: 'tracks-hint' },
            ],
          },
          {
            key: 'tracks-inside',
            kind: 'NARRATION',
            text: {
              nl: 'Ook goed. Pak dan de ring met kaartjes uit je doos en zoek het kaartje met sporen erop. Daar staan afdrukken van een kat, een vogel, een egel en een hond.',
              en: 'That is fine too. Take the ring of cards from your box and find the card with tracks on it. It shows prints of a cat, a bird, a hedgehog and a dog.',
            },
            pauseSeconds: 30,
            choices: [{ key: 'got-it', label: { nl: 'Gevonden', en: 'Found it' }, target: 'tracks-question' }],
          },
          {
            key: 'tracks-hint',
            kind: 'HINT',
            text: {
              nl: 'Kijk eens langs de rand van een plas, of onder een struik waar de grond nog nat is. Daar blijven afdrukken het langst staan. Anders pak je gewoon het kaartje uit de doos.',
              en: 'Try along the edge of a puddle, or under a bush where the ground is still wet. Prints last longest there. Otherwise just take the card from the box.',
            },
            pauseSeconds: 40,
            choices: [
              { key: 'found', label: { nl: 'Nu wel', en: 'Found one now' }, target: 'tracks-question' },
              { key: 'card', label: { nl: 'Ik gebruik het kaartje', en: 'I will use the card' }, target: 'tracks-question' },
            ],
          },
          {
            key: 'tracks-question',
            kind: 'QUESTION',
            text: {
              nl: 'Tel eens hoeveel teentjes je ziet. Een kat en een hond hebben er allebei vier. Maar bij een hond zie je iets wat je bij een kat bijna nooit ziet. Weet je wat?',
              en: 'Count how many toes you can see. A cat and a dog both have four. But with a dog you see something you almost never see with a cat. Do you know what?',
            },
            pauseSeconds: 10,
            choices: [
              { key: 'claws', label: { nl: 'Nageltjes', en: 'Claw marks' }, target: 'tracks-confirm' },
              { key: 'bigger', label: { nl: 'Hij is groter', en: 'It is bigger' }, target: 'tracks-hint2' },
              { key: 'dunno', label: { nl: 'Weet ik niet', en: 'I do not know' }, target: 'tracks-hint2' },
            ],
          },
          {
            key: 'tracks-hint2',
            kind: 'HINT',
            text: {
              nl: 'Denk aan een kat die in de bank klimt. Waar doet ze haar nagels dan mee? En waar laat ze die nagels als ze gewoon loopt?',
              en: 'Think of a cat climbing the sofa. What does she use her claws for? And where does she keep those claws when she is just walking?',
            },
            pauseSeconds: 10,
            choices: [
              { key: 'claws', label: { nl: 'Ze trekt ze in!', en: 'She pulls them in!' }, target: 'tracks-confirm' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'tracks-confirm',
            kind: 'NARRATION',
            text: {
              nl: 'Precies. Een kat trekt haar nagels in als ze loopt, een hond niet. Zie je vier teentjes met puntjes ervoor, dan is het een hond. Zonder puntjes: een kat.',
              en: 'Exactly. A cat pulls her claws in when she walks, a dog does not. Four toes with little points in front means a dog. Without the points: a cat.',
            },
            pauseSeconds: 4,
            choices: [
              { key: 'cast', label: { nl: 'Ik wil er gips in gieten', en: 'I want to cast it in plaster' }, target: 'tracks-safety' },
              { key: 'skip', label: { nl: 'Ik heb geen spoor buiten', en: 'I have no track outside' }, target: 'tracks-close' },
            ],
          },
          {
            key: 'tracks-safety',
            kind: 'SAFETY',
            safetyCode: 'NATURE-PLASTER-DUST',
            text: {
              nl: 'Voor het gips heb je een volwassene nodig. Gipspoeder stuift, dus roeren doe je buiten of bij een open raam, met je gezicht van de kom af. Ga iemand halen.',
              en: 'For the plaster you need a grown-up. Plaster powder is dusty, so mix it outside or by an open window, with your face away from the bowl. Go and fetch someone.',
            },
            pauseSeconds: 45,
            choices: [{ key: 'ready', label: { nl: 'We zijn er klaar voor', en: 'We are ready' }, target: 'tracks-cast' }],
          },
          {
            key: 'tracks-cast',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'plaster-cast',
            text: {
              nl: 'Veeg blaadjes weg met het kwastje. Roer dan gips met water tot het zo dik is als vla, en giet het langzaam in de afdruk, vanaf de rand. Wacht daarna twintig minuten.',
              en: 'Brush the leaves away with the brush. Then mix plaster with water until it is as thick as custard, and pour it slowly into the print, starting at the edge. Then wait twenty minutes.',
            },
            pauseSeconds: 90,
            choices: [
              { key: 'done', label: { nl: 'Gegoten', en: 'Poured' }, target: 'tracks-close' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'tracks-close',
            kind: 'CELEBRATION',
            text: {
              nl: 'Je hebt je eerste onderzoek gedaan, detective. Morgen is dat spoor in de modder weg — maar jij weet nu wie er langsliep.',
              en: 'You have done your first investigation, detective. Tomorrow that print in the mud will be gone — but you know who walked past.',
            },
            isTerminal: true,
          },
        ],
      },
      {
        key: 'leaves',
        title: { nl: 'Hoofdstuk 2: Bladeren lezen', en: 'Chapter 2: Reading leaves' },
        intro: {
          nl: 'Aan de rand van een blad zie je van welke boom het komt.',
          en: 'The edge of a leaf tells you which tree it came from.',
        },
        estimatedMinutes: 14,
        entryNodeKey: 'leaves-open',
        experiments: [],
        nodes: [
          {
            key: 'leaves-open',
            kind: 'NARRATION',
            text: {
              nl: 'Zoek drie bladeren die niet hetzelfde zijn. Van buiten, of uit een plantje binnen. Leg ze naast elkaar voor je neer.',
              en: 'Find three leaves that are not the same. From outside, or from a plant indoors. Lay them next to each other in front of you.',
            },
            pauseSeconds: 60,
            choices: [
              { key: 'have', label: { nl: 'Ik heb er drie', en: 'I have three' }, target: 'leaves-look' },
              { key: 'only-one', label: { nl: 'Ik heb er maar één', en: 'I only have one' }, target: 'leaves-one' },
            ],
          },
          {
            key: 'leaves-one',
            kind: 'NARRATION',
            text: {
              nl: 'Eén is genoeg om te beginnen. Op je kaartjesring staan er nog drie getekend — die gebruiken we erbij.',
              en: 'One is enough to start with. There are three more drawn on your card ring — we will use those as well.',
            },
            pauseSeconds: 15,
            choices: [{ key: 'ok', label: { nl: 'Goed', en: 'Alright' }, target: 'leaves-look' }],
          },
          {
            key: 'leaves-look',
            kind: 'PAUSE',
            text: {
              nl: 'Pak de loep en kijk naar de rand van een blad. Is die glad, of zitten er tandjes aan zoals bij een zaag? Kijk goed, ik wacht.',
              en: 'Take the magnifier and look at the edge of a leaf. Is it smooth, or does it have little teeth like a saw? Look closely, I will wait.',
            },
            pauseSeconds: 30,
            choices: [
              { key: 'smooth', label: { nl: 'Glad', en: 'Smooth' }, target: 'leaves-smooth' },
              { key: 'toothed', label: { nl: 'Tandjes', en: 'Little teeth' }, target: 'leaves-toothed' },
            ],
          },
          {
            key: 'leaves-smooth',
            kind: 'NARRATION',
            text: {
              nl: 'Een gladde rand. Dat past bij een beuk, of bij veel kamerplanten. Kijk nu naar de nerven: lopen ze als veertjes vanuit één middenlijn, of waaieren ze uit vanuit het steeltje?',
              en: 'A smooth edge. That fits a beech, or many houseplants. Now look at the veins: do they run like feathers from one middle line, or fan out from the stalk?',
            },
            pauseSeconds: 20,
            choices: [{ key: 'go', label: { nl: 'Ik heb gekeken', en: 'I have looked' }, target: 'leaves-question' }],
          },
          {
            key: 'leaves-toothed',
            kind: 'NARRATION',
            text: {
              nl: 'Tandjes! Dat past bij een berk, een els of een brandnetel. Kijk nu naar de nerven: lopen ze als veertjes vanuit één middenlijn, of waaieren ze uit vanuit het steeltje?',
              en: 'Teeth! That fits a birch, an alder or a nettle. Now look at the veins: do they run like feathers from one middle line, or fan out from the stalk?',
            },
            pauseSeconds: 20,
            choices: [{ key: 'go', label: { nl: 'Ik heb gekeken', en: 'I have looked' }, target: 'leaves-question' }],
          },
          {
            key: 'leaves-question',
            kind: 'QUESTION',
            text: {
              nl: 'Nu een echte detectievraag. Waarom denk je dat bomen bij ons hun bladeren laten vallen in de herfst?',
              en: 'Now a real detective question. Why do you think trees here drop their leaves in autumn?',
            },
            pauseSeconds: 12,
            choices: [
              { key: 'winter', label: { nl: 'Omdat het koud wordt', en: 'Because it gets cold' }, target: 'leaves-confirm' },
              { key: 'water', label: { nl: 'Omdat er geen water is', en: 'Because there is no water' }, target: 'leaves-confirm' },
              { key: 'dunno', label: { nl: 'Geen idee', en: 'No idea' }, target: 'leaves-hint' },
            ],
          },
          {
            key: 'leaves-hint',
            kind: 'HINT',
            text: {
              nl: 'Denk aan een bevroren plas. Als al het water hard is, kan een boom er dan nog uit drinken? En een blad heeft juist heel veel water nodig.',
              en: 'Think of a frozen puddle. If all the water is hard, can a tree still drink from it? And a leaf needs an awful lot of water.',
            },
            pauseSeconds: 12,
            choices: [
              { key: 'water', label: { nl: 'Dan kan hij niet drinken', en: 'Then it cannot drink' }, target: 'leaves-confirm' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'leaves-confirm',
            kind: 'CELEBRATION',
            text: {
              nl: 'Allebei goed gedacht. In de winter is het water bevroren, dus de boom kan bijna niet drinken. Bladeren verdampen juist heel veel water, dus die laat hij vallen. Een dennenboom heeft naalden, die verdampen bijna niets — daarom blijft die groen.',
              en: 'Both good thinking. In winter the water is frozen, so the tree can hardly drink. Leaves lose a lot of water, so it drops them. A pine has needles, which lose almost none — that is why it stays green.',
            },
            isTerminal: true,
          },
        ],
      },
      {
        key: 'soil',
        title: { nl: 'Hoofdstuk 3: Wie woont er onder de steen?', en: 'Chapter 3: Who lives under the stone?' },
        intro: {
          nl: 'Onder één steen wonen er meer dieren dan je denkt.',
          en: 'More animals live under one stone than you would think.',
        },
        estimatedMinutes: 16,
        entryNodeKey: 'soil-open',
        experiments: [
          {
            key: 'soil-hunt',
            title: { nl: 'Bodemdiertjes zoeken', en: 'Hunting for soil creatures' },
            objective: {
              nl: 'Ontdekken hoeveel verschillende diertjes er onder één steen leven.',
              en: 'Discover how many different creatures live under a single stone.',
            },
            durationMinutes: 15,
            materials: [
              { nl: 'De loep', en: 'The magnifier' },
              { nl: 'Twee kijkpotjes', en: 'Two viewing pots' },
              { nl: 'Het zachte kwastje', en: 'The soft brush' },
            ],
            steps: [
              { nl: 'Zoek een steen, een plank of een bloempot die al een tijdje ligt.', en: 'Find a stone, a plank or a flowerpot that has lain there a while.' },
              { nl: 'Til hem langzaam op. Niet gooien — er wonen dieren onder.', en: 'Lift it slowly. Do not throw it — animals live underneath.' },
              { nl: 'Veeg voorzichtig één diertje in een kijkpotje met het kwastje.', en: 'Gently sweep one creature into a viewing pot with the brush.' },
              { nl: 'Kijk door het vergrootdeksel. Tel de pootjes.', en: 'Look through the magnifying lid. Count the legs.' },
              { nl: 'Zet het diertje terug en leg de steen precies zo terug als hij lag.', en: 'Put the creature back and lay the stone exactly as it was.' },
            ],
            safetyCodes: ['NATURE-WASH-HANDS', 'NATURE-PUT-BACK'],
          },
        ],
        nodes: [
          {
            key: 'soil-open',
            kind: 'SAFETY',
            safetyCode: 'NATURE-PUT-BACK',
            text: {
              nl: 'Eerst de belangrijkste regel van een natuurdetective: alles wat leeft gaat terug waar je het vond, en de steen gaat precies zo terug als hij lag. Beloofd?',
              en: 'First the most important rule for a nature detective: everything alive goes back where you found it, and the stone goes back exactly as it lay. Promise?',
            },
            pauseSeconds: 6,
            choices: [{ key: 'promise', label: { nl: 'Beloofd', en: 'Promise' }, target: 'soil-find' }],
          },
          {
            key: 'soil-find',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'soil-hunt',
            text: {
              nl: 'Zoek een steen, een plank of een omgekeerde bloempot die er al een tijdje ligt. Til hem heel langzaam op en kijk wat er wegkruipt.',
              en: 'Find a stone, a plank or an upturned flowerpot that has been there a while. Lift it very slowly and see what scuttles away.',
            },
            pauseSeconds: 60,
            choices: [
              { key: 'saw', label: { nl: 'Ik zie iets bewegen', en: 'I can see something moving' }, target: 'soil-count' },
              { key: 'empty', label: { nl: 'Er zit niks onder', en: 'There is nothing under it' }, target: 'soil-hint' },
            ],
          },
          {
            key: 'soil-hint',
            kind: 'HINT',
            text: {
              nl: 'Probeer een plek die vochtig en donker is. Bodemdiertjes houden niet van droog en licht. Onder een bloempot of naast de schutting is bijna altijd raak.',
              en: 'Try somewhere damp and dark. Soil creatures do not like dry and bright. Under a flowerpot or next to the fence nearly always works.',
            },
            pauseSeconds: 50,
            choices: [
              { key: 'saw', label: { nl: 'Nu wel', en: 'Now I see one' }, target: 'soil-count' },
              { key: 'card', label: { nl: 'Ik gebruik de kaartjes', en: 'I will use the cards' }, target: 'soil-count' },
            ],
          },
          {
            key: 'soil-count',
            kind: 'QUESTION',
            text: {
              nl: 'Veeg er eentje voorzichtig in een kijkpotje met het kwastje en kijk door het deksel. Tel de pootjes. Hoeveel zijn het er?',
              en: 'Gently sweep one into a viewing pot with the brush and look through the lid. Count the legs. How many are there?',
            },
            pauseSeconds: 40,
            choices: [
              { key: 'six', label: { nl: 'Zes', en: 'Six' }, target: 'soil-insect' },
              { key: 'eight', label: { nl: 'Acht', en: 'Eight' }, target: 'soil-spider' },
              { key: 'lots', label: { nl: 'Heel veel', en: 'Lots and lots' }, target: 'soil-many' },
            ],
          },
          {
            key: 'soil-insect',
            kind: 'NARRATION',
            text: {
              nl: 'Zes pootjes: dat is een insect. Kevers, mieren en oorwurmen horen daarbij. Alle insecten hebben er precies zes, nooit meer en nooit minder.',
              en: 'Six legs: that is an insect. Beetles, ants and earwigs are all insects. Every insect has exactly six, never more and never fewer.',
            },
            pauseSeconds: 4,
            choices: [{ key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'soil-back' }],
          },
          {
            key: 'soil-spider',
            kind: 'NARRATION',
            text: {
              nl: 'Acht pootjes: dan is het geen insect maar een spinachtige. Spinnen en hooiwagens hebben er acht. Dat is meteen het makkelijkste verschil om te onthouden.',
              en: 'Eight legs: then it is not an insect but an arachnid. Spiders and harvestmen have eight. That is the easiest difference to remember.',
            },
            pauseSeconds: 4,
            choices: [{ key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'soil-back' }],
          },
          {
            key: 'soil-many',
            kind: 'NARRATION',
            text: {
              nl: 'Heel veel pootjes: dan heb je waarschijnlijk een pissebed of een duizendpoot. Een pissebed is trouwens familie van de garnaal — die woonde vroeger in zee.',
              en: 'Lots of legs: then you probably have a woodlouse or a centipede. A woodlouse is actually related to shrimps — its family used to live in the sea.',
            },
            pauseSeconds: 4,
            choices: [{ key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'soil-back' }],
          },
          {
            key: 'soil-back',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'soil-hunt',
            text: {
              nl: 'Zet je diertje nu terug op de plek waar je het vond, en leg de steen er precies zo overheen als hij lag. Was daarna je handen.',
              en: 'Now put your creature back where you found it, and lay the stone over it exactly as it was. Then wash your hands.',
            },
            pauseSeconds: 45,
            choices: [{ key: 'done', label: { nl: 'Gedaan', en: 'Done' }, target: 'soil-close' }],
          },
          {
            key: 'soil-close',
            kind: 'CELEBRATION',
            text: {
              nl: 'Netjes teruggelegd — dat is wat een echte onderzoeker doet. Je hebt nu drie onderzoeken gedaan. Nog eentje.',
              en: 'Put back neatly — that is what a real researcher does. You have done three investigations now. One more to go.',
            },
            isTerminal: true,
          },
        ],
      },
      {
        key: 'map',
        title: { nl: 'Hoofdstuk 4: Je eigen natuurkaart', en: 'Chapter 4: Your own nature map' },
        intro: {
          nl: 'Alles wat je gevonden hebt, op één kaart.',
          en: 'Everything you found, on one map.',
        },
        estimatedMinutes: 14,
        entryNodeKey: 'map-open',
        experiments: [],
        nodes: [
          {
            key: 'map-open',
            kind: 'NARRATION',
            text: {
              nl: 'Pak de natuurkaart uit je doos en een potlood. We gaan er alles op zetten wat je gevonden hebt.',
              en: 'Take the nature map from your box and a pencil. We are going to put everything you found on it.',
            },
            pauseSeconds: 25,
            choices: [
              { key: 'ready', label: { nl: 'Ik heb hem', en: 'I have it' }, target: 'map-draw-1' },
              { key: 'slower', label: { nl: 'Langzamer', en: 'Slower' }, isSlower: true },
            ],
          },
          {
            key: 'map-draw-1',
            kind: 'PAUSE',
            text: {
              nl: 'Teken eerst in het midden waar jij woont. Een vierkantje is genoeg. Zet er een kruisje bij de deur waar je naar buiten gaat.',
              en: 'First draw where you live, in the middle. A little square is enough. Put a cross by the door you go out of.',
            },
            pauseSeconds: 45,
            choices: [{ key: 'done', label: { nl: 'Getekend', en: 'Drawn' }, target: 'map-draw-2' }],
          },
          {
            key: 'map-draw-2',
            kind: 'PAUSE',
            text: {
              nl: 'Zet nu een pootje op de plek waar je het spoor vond, een blaadje waar je de bladeren vond, en een steentje waar je onder gekeken hebt.',
              en: 'Now draw a little paw where you found the track, a leaf where you found the leaves, and a stone where you looked underneath.',
            },
            pauseSeconds: 60,
            choices: [
              { key: 'done', label: { nl: 'Alle drie', en: 'All three' }, target: 'map-question' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'map-question',
            kind: 'QUESTION',
            text: {
              nl: 'Kijk eens naar je kaart. Liggen je vondsten door elkaar, of zitten ze een beetje bij elkaar in de buurt?',
              en: 'Look at your map. Are your finds scattered about, or are they somewhat close together?',
            },
            pauseSeconds: 12,
            choices: [
              { key: 'together', label: { nl: 'Ze zitten bij elkaar', en: 'They are close together' }, target: 'map-together' },
              { key: 'spread', label: { nl: 'Ze liggen door elkaar', en: 'They are scattered' }, target: 'map-spread' },
            ],
          },
          {
            key: 'map-together',
            kind: 'NARRATION',
            text: {
              nl: 'Dat is een echte ontdekking. Dieren en planten kiezen hun plek: vochtig, donker, of juist in de zon. Zo\'n plek heet een leefgebied. Jij hebt er net eentje op de kaart gezet.',
              en: 'That is a real discovery. Animals and plants choose their spot: damp, dark, or right in the sun. Such a place is called a habitat. You have just put one on the map.',
            },
            pauseSeconds: 5,
            choices: [{ key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'map-close' }],
          },
          {
            key: 'map-spread',
            kind: 'NARRATION',
            text: {
              nl: 'Ook interessant. Dan heb je verschillende soorten plekken bij je in de buurt: een natte hoek, een droge hoek, een zonnige hoek. Elk daarvan heeft zijn eigen bewoners.',
              en: 'Also interesting. Then you have several different kinds of place near you: a wet corner, a dry corner, a sunny corner. Each has its own residents.',
            },
            pauseSeconds: 5,
            choices: [{ key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'map-close' }],
          },
          {
            key: 'map-close',
            kind: 'CELEBRATION',
            text: {
              nl: 'De doos is af, detective. Hang je kaart op en zet er iets bij als je weer iets vindt. Over een maand ziet je buurt er heel anders uit — en jij weet dan waar je moet kijken.',
              en: 'The box is finished, detective. Hang your map up and add to it whenever you find something. In a month your neighbourhood will look completely different — and you will know where to look.',
            },
            isTerminal: true,
          },
        ],
      },
    ],
  },
};
