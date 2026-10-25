import type { BoxSpec } from './types.ts';

/**
 * Junior Space Explorer — the flagship box.
 *
 * Four chapters, two experiments, and a dialogue graph with real branches: the
 * child's answer to "how does a rocket push itself up?" decides whether they
 * get the confirmation path or the hint path, and both rejoin the story.
 */
export const spaceExplorer: BoxSpec = {
  sku: 'WB-SPACE-01',
  slug: 'junior-ruimteverkenner',
  themeSlug: 'space',
  ageMin: 7,
  ageMax: 10,
  priceCents: 3495,
  curriculumIndex: 1,
  translations: {
    nl: {
      name: 'Junior Ruimteverkenner',
      tagline: 'Bouw een raket, sla een krater en vind de weg terug naar huis',
      description:
        'Vier hoofdstukken lang ben je ruimteverkenner. Je bouwt een ballonraket die echt door de kamer schiet, laat een meteoriet in bloem vallen om te zien hoe kraters ontstaan, en leert waarom je op de maan hoger springt dan thuis. Je maatje leest voor, stelt vragen en wacht tot je klaar bent.',
      materialsNote: 'Je hebt zelf nog een stoel of tafelpoot nodig om het touw aan vast te maken.',
    },
    en: {
      name: 'Junior Space Explorer',
      tagline: 'Build a rocket, punch a crater and find your way home',
      description:
        'For four chapters you are a space explorer. You build a balloon rocket that really shoots across the room, drop a meteorite into flour to see how craters form, and find out why you jump higher on the Moon than at home. Your companion reads along, asks questions and waits until you are ready.',
      materialsNote: 'You will need a chair or table leg of your own to tie the string to.',
    },
  },
  components: [
    { sku: 'CMP-BALLOON-10', name: 'Ballonnen (10 stuks)', kind: 'COMPONENT', quantity: 1, stock: 120, note: { nl: 'Tien ballonnen, genoeg om te oefenen', en: 'Ten balloons, enough to practise' } },
    { sku: 'CMP-STRING-8M', name: 'Vliegertouw 8 meter', kind: 'COMPONENT', quantity: 1, stock: 140 },
    { sku: 'CMP-STRAW-20', name: 'Papieren rietjes (20 stuks)', kind: 'COMPONENT', quantity: 1, stock: 200 },
    { sku: 'CMP-FLOUR-TRAY', name: 'Inslagbak met bloem', kind: 'COMPONENT', quantity: 1, stock: 90 },
    { sku: 'CMP-MARBLES-3', name: 'Meteorietknikkers (3 maten)', kind: 'COMPONENT', quantity: 1, stock: 110 },
    { sku: 'PRN-SPACE-CARDS', name: 'Proefkaarten Ruimte', kind: 'PRINTED', quantity: 1, stock: 150 },
    { sku: 'PKG-BOX-M', name: 'Verzenddoos M', kind: 'PACKAGING', quantity: 1, stock: 400 },
  ],
  safety: [
    {
      code: 'SPACE-BALLOON-CHOKE',
      severity: 'WARNING',
      text: {
        nl: 'Een kapotte ballon is gevaarlijk voor kleine kinderen. Ruim stukjes meteen op en houd ze weg bij broertjes en zusjes onder de drie.',
        en: 'A burst balloon is dangerous for small children. Clear up the pieces straight away and keep them away from brothers and sisters under three.',
      },
      requiresAdult: false,
    },
    {
      code: 'SPACE-FLOUR-MESS',
      severity: 'INFO',
      text: {
        nl: 'Bloem stuift. Zet de bak op de grond met een handdoek eronder, en vraag een volwassene waar het mag.',
        en: 'Flour goes everywhere. Put the tray on the floor with a towel underneath, and ask a grown-up where it is allowed.',
      },
    },
    {
      code: 'SPACE-STRING-TIGHT',
      severity: 'CAUTION',
      text: {
        nl: 'Span het touw niet op ooghoogte en niet strak door een deuropening waar iemand doorheen loopt.',
        en: 'Do not stretch the string at eye height, and not across a doorway people walk through.',
      },
    },
  ],
  journey: {
    slug: 'ruimteverkenner-reis',
    title: { nl: 'De reis van de ruimteverkenner', en: "The space explorer's journey" },
    summary: {
      nl: 'Van de lanceerbasis naar de maan en weer terug, met twee echte proeven onderweg.',
      en: 'From the launch pad to the Moon and back, with two real experiments along the way.',
    },
    estimatedMinutes: 70,
    chapters: [
      {
        key: 'launch',
        title: { nl: 'Hoofdstuk 1: De lancering', en: 'Chapter 1: The launch' },
        intro: {
          nl: 'Waarom gaat een raket omhoog, terwijl alles wat je loslaat naar beneden valt?',
          en: 'Why does a rocket go up, when everything you let go of falls down?',
        },
        estimatedMinutes: 18,
        entryNodeKey: 'welcome',
        experiments: [
          {
            key: 'balloon-rocket',
            title: { nl: 'De ballonraket', en: 'The balloon rocket' },
            objective: {
              nl: 'Zien dat lucht die naar achteren gaat, de raket naar voren duwt.',
              en: 'See that air going backwards pushes the rocket forwards.',
            },
            durationMinutes: 12,
            materials: [
              { nl: 'Eén ballon', en: 'One balloon' },
              { nl: 'Het vliegertouw', en: 'The kite string' },
              { nl: 'Eén rietje', en: 'One straw' },
              { nl: 'Plakband uit de doos', en: 'Tape from the box' },
            ],
            steps: [
              { nl: 'Schuif het touw door het rietje.', en: 'Thread the string through the straw.' },
              { nl: 'Maak beide uiteinden van het touw vast, bijvoorbeeld aan twee stoelen. Trek het strak.', en: 'Tie both ends of the string to something, for example two chairs. Pull it tight.' },
              { nl: 'Blaas de ballon op en houd hem dicht met je vingers. Niet knopen!', en: 'Blow up the balloon and hold it shut with your fingers. Do not tie it!' },
              { nl: 'Plak de ballon met twee stukjes plakband onder het rietje.', en: 'Tape the balloon under the straw with two pieces of tape.' },
              { nl: 'Laat los en kijk wat er gebeurt.', en: 'Let go and watch what happens.' },
            ],
            safetyCodes: ['SPACE-BALLOON-CHOKE', 'SPACE-STRING-TIGHT'],
          },
        ],
        nodes: [
          {
            key: 'welcome',
            kind: 'NARRATION',
            text: {
              nl: 'Hallo ruimteverkenner. Ik ben je maatje. Vandaag gaan we een raket lanceren — een echte, hier in de kamer. Pak je doos erbij en ga ergens zitten waar je ruimte hebt.',
              en: 'Hello space explorer. I am your companion. Today we are launching a rocket — a real one, right here in the room. Get your box and sit somewhere with space around you.',
            },
            pauseSeconds: 4,
            choices: [
              { key: 'ready', label: { nl: 'Ik ben er klaar voor', en: 'I am ready' }, target: 'question-push' },
              { key: 'again', label: { nl: 'Zeg het nog een keer', en: 'Say that again' }, isRepeat: true },
              { key: 'slower', label: { nl: 'Wat langzamer graag', en: 'A bit slower please' }, isSlower: true },
            ],
          },
          {
            key: 'question-push',
            kind: 'QUESTION',
            text: {
              nl: 'Eerst een vraag. Een raket heeft niets om zich tegen af te zetten in de ruimte — geen grond, geen muur. Hoe komt hij dan toch vooruit? Wat denk jij?',
              en: 'First a question. A rocket has nothing to push against in space — no ground, no wall. So how does it move forward? What do you think?',
            },
            pauseSeconds: 8,
            choices: [
              { key: 'pushes-air-out', label: { nl: 'Hij duwt iets naar achteren', en: 'It pushes something backwards' }, target: 'confirm-push' },
              { key: 'flames-push-ground', label: { nl: 'De vlammen duwen tegen de grond', en: 'The flames push against the ground' }, target: 'hint-not-ground' },
              { key: 'no-idea', label: { nl: 'Ik weet het niet', en: 'I do not know' }, target: 'hint-not-ground' },
            ],
          },
          {
            key: 'confirm-push',
            kind: 'NARRATION',
            text: {
              nl: 'Precies. De raket gooit hete gassen met enorme kracht naar achteren, en daardoor gaat de raket zelf naar voren. Dat werkt ook waar helemaal niets is. Nu gaan we het zelf maken.',
              en: 'Exactly. The rocket throws hot gas backwards with enormous force, and that pushes the rocket itself forwards. It works even where there is nothing at all. Now let us build one.',
            },
            pauseSeconds: 2,
            choices: [{ key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'safety-balloon' }],
          },
          {
            key: 'hint-not-ground',
            kind: 'HINT',
            text: {
              nl: 'Bijna. Denk eens aan een ballon die je loslaat zonder te knopen. Er is dan geen grond, geen muur — en toch schiet hij weg. Wat komt er uit die ballon, en welke kant gaat dat op?',
              en: 'Almost. Think of a balloon you let go without tying it. There is no ground, no wall — and still it shoots away. What comes out of that balloon, and which way does it go?',
            },
            pauseSeconds: 6,
            choices: [
              { key: 'air-backwards', label: { nl: 'De lucht gaat naar achteren', en: 'The air goes backwards' }, target: 'confirm-push' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Say it again' }, isRepeat: true },
              { key: 'tell-me', label: { nl: 'Vertel het maar', en: 'Just tell me' }, target: 'confirm-push' },
            ],
          },
          {
            key: 'safety-balloon',
            kind: 'SAFETY',
            safetyCode: 'SPACE-BALLOON-CHOKE',
            text: {
              nl: 'Even iets belangrijks. Als een ballon knapt, ruim je de stukjes meteen op. Voor kleine kinderen zijn losse stukjes ballon echt gevaarlijk. Span het touw ook niet op ooghoogte.',
              en: 'Something important first. If a balloon bursts, clear up the pieces straight away. Loose bits of balloon are genuinely dangerous for small children. Also, do not stretch the string at eye height.',
            },
            pauseSeconds: 3,
            choices: [{ key: 'understood', label: { nl: 'Begrepen', en: 'Understood' }, target: 'build-1' }],
          },
          {
            key: 'build-1',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'balloon-rocket',
            text: {
              nl: 'Pak het touw en één rietje. Schuif het touw helemaal door het rietje. Ik wacht.',
              en: 'Take the string and one straw. Thread the string all the way through the straw. I will wait.',
            },
            pauseSeconds: 25,
            choices: [
              { key: 'done', label: { nl: 'Gelukt', en: 'Done' }, target: 'build-2' },
              { key: 'stuck', label: { nl: 'Het lukt niet', en: 'It is not working' }, target: 'hint-thread' },
            ],
          },
          {
            key: 'hint-thread',
            kind: 'HINT',
            text: {
              nl: 'Maak het puntje van het touw even plat tussen je vingers, dan glijdt het makkelijker. Of vraag iemand om het rietje vast te houden terwijl jij duwt.',
              en: 'Flatten the tip of the string between your fingers — it slides through more easily. Or ask someone to hold the straw while you push.',
            },
            pauseSeconds: 20,
            choices: [
              { key: 'done', label: { nl: 'Nu wel', en: 'Got it now' }, target: 'build-2' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Say it again' }, isRepeat: true },
            ],
          },
          {
            key: 'build-2',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'balloon-rocket',
            text: {
              nl: 'Maak nu beide kanten van het touw vast, bijvoorbeeld aan twee stoelen, en trek het strak. Blaas dan de ballon op en houd hem dicht met je vingers — niet knopen. Plak hem met twee stukjes plakband onder het rietje.',
              en: 'Now tie both ends of the string to something, two chairs for example, and pull it tight. Then blow up the balloon and hold it shut with your fingers — do not tie it. Tape it under the straw with two pieces of tape.',
            },
            pauseSeconds: 45,
            choices: [
              { key: 'ready', label: { nl: 'Klaar om te lanceren', en: 'Ready to launch' }, target: 'countdown' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Say it again' }, isRepeat: true },
              { key: 'slower', label: { nl: 'Langzamer', en: 'Slower' }, isSlower: true },
            ],
          },
          {
            key: 'countdown',
            kind: 'NARRATION',
            text: {
              nl: 'Aftellen dan. Drie… twee… één… loslaten!',
              en: 'Counting down. Three… two… one… let go!',
            },
            pauseSeconds: 6,
            choices: [
              { key: 'flew', label: { nl: 'Hij vloog!', en: 'It flew!' }, target: 'celebrate' },
              { key: 'nothing', label: { nl: 'Er gebeurde bijna niets', en: 'Almost nothing happened' }, target: 'hint-tighten' },
            ],
          },
          {
            key: 'hint-tighten',
            kind: 'HINT',
            text: {
              nl: 'Dat gebeurt vaak de eerste keer. Kijk of het touw echt strak staat en of het rietje soepel glijdt. Blaas de ballon ook wat voller. Probeer het nog een keer.',
              en: 'That happens a lot the first time. Check whether the string is really tight and the straw slides freely. Blow the balloon up a bit fuller too. Try again.',
            },
            pauseSeconds: 30,
            choices: [
              { key: 'flew', label: { nl: 'Nu vloog hij', en: 'Now it flew' }, target: 'celebrate' },
              { key: 'move-on', label: { nl: 'Ik ga verder', en: 'I will move on' }, target: 'celebrate' },
            ],
          },
          {
            key: 'celebrate',
            kind: 'CELEBRATION',
            text: {
              nl: 'Dat is precies wat een echte raket doet. De lucht ging de ene kant op, jouw raket de andere. Je hebt hoofdstuk één af, ruimteverkenner. In het volgende hoofdstuk gaan we naar de maan.',
              en: 'That is exactly what a real rocket does. The air went one way, your rocket went the other. Chapter one is finished, space explorer. In the next chapter we go to the Moon.',
            },
            isTerminal: true,
          },
        ],
      },
      {
        key: 'moon',
        title: { nl: 'Hoofdstuk 2: Aankomst op de maan', en: 'Chapter 2: Arriving at the Moon' },
        intro: {
          nl: 'Waarom staan er zoveel ronde kuilen op de maan, en bij ons bijna niet?',
          en: 'Why are there so many round dents on the Moon, and almost none here?',
        },
        estimatedMinutes: 18,
        entryNodeKey: 'arrive',
        experiments: [
          {
            key: 'crater-impact',
            title: { nl: 'Kraters slaan', en: 'Making craters' },
            objective: {
              nl: 'Ontdekken dat de grootte van de krater afhangt van de knikker én van hoe hoog je hem loslaat.',
              en: 'Discover that crater size depends on the marble and on how high you drop it from.',
            },
            durationMinutes: 15,
            materials: [
              { nl: 'De inslagbak met bloem', en: 'The impact tray with flour' },
              { nl: 'Drie meteorietknikkers', en: 'Three meteorite marbles' },
              { nl: 'Een liniaal van thuis', en: 'A ruler from home' },
            ],
            steps: [
              { nl: 'Zet de bak op de grond, niet op tafel. Strijk de bloem glad.', en: 'Put the tray on the floor, not on a table. Smooth the flour flat.' },
              { nl: 'Laat de kleinste knikker van kniehoogte vallen. Kijk naar de kuil.', en: 'Drop the smallest marble from knee height. Look at the dent.' },
              { nl: 'Haal hem eruit en strijk de bloem weer glad.', en: 'Take it out and smooth the flour again.' },
              { nl: 'Laat nu de grootste knikker van dezelfde hoogte vallen.', en: 'Now drop the biggest marble from the same height.' },
              { nl: 'Laat de grootste tot slot van schouderhoogte vallen en vergelijk alle drie.', en: 'Finally drop the biggest one from shoulder height and compare all three.' },
            ],
            safetyCodes: ['SPACE-FLOUR-MESS'],
          },
        ],
        nodes: [
          {
            key: 'arrive',
            kind: 'NARRATION',
            text: {
              nl: 'We zijn er. Onder ons ligt de maan, grijs en stoffig, en helemaal bedekt met ronde kuilen. Die kuilen heten kraters.',
              en: 'We have arrived. Below us lies the Moon, grey and dusty, and completely covered in round dents. Those dents are called craters.',
            },
            pauseSeconds: 3,
            choices: [
              { key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'question-craters' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'question-craters',
            kind: 'QUESTION',
            text: {
              nl: 'Op aarde zie je bijna geen kraters, op de maan duizenden. Waarom denk je dat dat verschil er is?',
              en: 'On Earth you see almost no craters, on the Moon there are thousands. Why do you think that is?',
            },
            pauseSeconds: 8,
            choices: [
              { key: 'no-air', label: { nl: 'De maan heeft geen lucht', en: 'The Moon has no air' }, target: 'confirm-craters' },
              { key: 'weather', label: { nl: 'Bij ons waait en regent het', en: 'Here it rains and blows' }, target: 'confirm-craters' },
              { key: 'dunno', label: { nl: 'Geen idee', en: 'No idea' }, target: 'hint-craters' },
            ],
          },
          {
            key: 'hint-craters',
            kind: 'HINT',
            text: {
              nl: 'Denk aan een zandkasteel op het strand. Wat gebeurt daarmee na een week regen en wind? En wat zou er gebeuren als er nooit wind of regen was?',
              en: 'Think of a sandcastle on the beach. What happens to it after a week of rain and wind? And what if there were never any wind or rain?',
            },
            pauseSeconds: 6,
            choices: [
              { key: 'stays', label: { nl: 'Dan blijft het staan', en: 'Then it stays' }, target: 'confirm-craters' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'confirm-craters',
            kind: 'NARRATION',
            text: {
              nl: 'Dat is het. Op aarde slijten kraters weg door wind, regen en planten. De maan heeft geen lucht en geen weer, dus een krater van drie miljard jaar oud ligt er nog precies zo bij. Nu gaan we er zelf een paar maken.',
              en: 'That is it. On Earth craters wear away through wind, rain and plants. The Moon has no air and no weather, so a crater three billion years old still looks exactly the same. Now we are going to make some ourselves.',
            },
            pauseSeconds: 2,
            choices: [{ key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'safety-flour' }],
          },
          {
            key: 'safety-flour',
            kind: 'SAFETY',
            safetyCode: 'SPACE-FLOUR-MESS',
            text: {
              nl: 'Zet de bak op de grond, niet op tafel, en leg er een handdoek onder. Bloem stuift. Vraag even aan een volwassene waar het mag.',
              en: 'Put the tray on the floor, not on a table, and lay a towel underneath. Flour goes everywhere. Ask a grown-up where it is allowed.',
            },
            pauseSeconds: 15,
            choices: [{ key: 'ok', label: { nl: 'Klaar', en: 'Ready' }, target: 'crater-1' }],
          },
          {
            key: 'crater-1',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'crater-impact',
            text: {
              nl: 'Strijk de bloem glad. Pak de kleinste knikker en laat hem van kniehoogte vallen. Kijk goed naar de kuil die ontstaat.',
              en: 'Smooth the flour flat. Take the smallest marble and drop it from knee height. Look carefully at the dent it makes.',
            },
            pauseSeconds: 30,
            choices: [{ key: 'done', label: { nl: 'Gedaan', en: 'Done' }, target: 'crater-2' }],
          },
          {
            key: 'crater-2',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'crater-impact',
            text: {
              nl: 'Haal de knikker eruit, strijk de bloem weer glad, en laat nu de grootste knikker van dezelfde hoogte vallen. Is de kuil groter of kleiner?',
              en: 'Take the marble out, smooth the flour again, and now drop the biggest marble from the same height. Is the dent bigger or smaller?',
            },
            pauseSeconds: 35,
            choices: [
              { key: 'bigger', label: { nl: 'Groter', en: 'Bigger' }, target: 'crater-3' },
              { key: 'same', label: { nl: 'Ongeveer hetzelfde', en: 'About the same' }, target: 'hint-crater-size' },
            ],
          },
          {
            key: 'hint-crater-size',
            kind: 'HINT',
            text: {
              nl: 'Kijk eens naar de rand in plaats van naar het gat. Ligt er bij de grote knikker meer bloem opzij gegooid? Dat hoort er ook bij.',
              en: 'Look at the rim instead of the hole. Is there more flour thrown aside by the big marble? That counts too.',
            },
            pauseSeconds: 15,
            choices: [{ key: 'ah', label: { nl: 'Ah, nu zie ik het', en: 'Ah, now I see it' }, target: 'crater-3' }],
          },
          {
            key: 'crater-3',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'crater-impact',
            text: {
              nl: 'Laatste keer. Strijk de bloem glad en laat de grootste knikker nu van schouderhoogte vallen. Vergelijk alle drie de kuilen naast elkaar.',
              en: 'Last time. Smooth the flour and drop the biggest marble from shoulder height. Compare all three dents side by side.',
            },
            pauseSeconds: 35,
            choices: [{ key: 'done', label: { nl: 'Vergeleken', en: 'Compared' }, target: 'moon-close' }],
          },
          {
            key: 'moon-close',
            kind: 'CELEBRATION',
            text: {
              nl: 'Je hebt net ontdekt wat sterrenkundigen ook doen: aan de grootte van een krater kun je zien hoe groot en hoe snel de steen was die insloeg. Hoofdstuk twee is klaar.',
              en: 'You have just discovered what astronomers do too: from the size of a crater you can tell how big and how fast the rock was that hit. Chapter two is finished.',
            },
            isTerminal: true,
          },
        ],
      },
      {
        key: 'gravity',
        title: { nl: 'Hoofdstuk 3: Springen op de maan', en: 'Chapter 3: Jumping on the Moon' },
        intro: {
          nl: 'Op de maan spring je zes keer zo hoog. Waarom eigenlijk?',
          en: 'On the Moon you jump six times as high. But why?',
        },
        estimatedMinutes: 16,
        entryNodeKey: 'gravity-open',
        experiments: [],
        nodes: [
          {
            key: 'gravity-open',
            kind: 'NARRATION',
            text: {
              nl: 'Stap uit je raket en spring eens. Op de maan kom je zes keer zo hoog als thuis. Ga maar staan, ik wacht — spring eens zo hoog als je kunt.',
              en: 'Step out of your rocket and jump. On the Moon you go six times as high as at home. Stand up, I will wait — jump as high as you can.',
            },
            pauseSeconds: 12,
            choices: [
              { key: 'jumped', label: { nl: 'Gesprongen', en: 'Jumped' }, target: 'gravity-question' },
              { key: 'slower', label: { nl: 'Langzamer praten', en: 'Speak slower' }, isSlower: true },
            ],
          },
          {
            key: 'gravity-question',
            kind: 'QUESTION',
            text: {
              nl: 'Op de maan zou diezelfde sprong je tot boven een deur brengen. Ben je op de maan lichter, of trekt de maan minder hard aan je?',
              en: 'On the Moon that same jump would take you above a door. Are you lighter on the Moon, or does the Moon pull at you less hard?',
            },
            pauseSeconds: 8,
            choices: [
              { key: 'pull-less', label: { nl: 'De maan trekt minder hard', en: 'The Moon pulls less hard' }, target: 'gravity-confirm' },
              { key: 'lighter', label: { nl: 'Ik ben lichter', en: 'I am lighter' }, target: 'gravity-nuance' },
              { key: 'dunno', label: { nl: 'Weet ik niet', en: 'I do not know' }, target: 'gravity-nuance' },
            ],
          },
          {
            key: 'gravity-nuance',
            kind: 'HINT',
            text: {
              nl: 'Dit is een lastige. Er zit nog precies evenveel jou in jou — evenveel botten, evenveel spieren. Er is dus niets van je af gegaan. Wat is er dan wél anders op de maan?',
              en: 'This one is tricky. There is still exactly as much of you in you — the same bones, the same muscles. Nothing has been taken away. So what is different on the Moon?',
            },
            pauseSeconds: 8,
            choices: [
              { key: 'pull-less', label: { nl: 'De maan trekt minder hard', en: 'The Moon pulls less hard' }, target: 'gravity-confirm' },
              { key: 'tell', label: { nl: 'Vertel maar', en: 'Tell me' }, target: 'gravity-confirm' },
            ],
          },
          {
            key: 'gravity-confirm',
            kind: 'NARRATION',
            text: {
              nl: 'Klopt. Er is evenveel van jou, maar de maan is veel kleiner dan de aarde en trekt daardoor zes keer zwakker. Je gewicht verandert, jijzelf niet. Astronauten huppelen daarom zo raar: gewoon lopen werkt er niet.',
              en: 'Right. There is just as much of you, but the Moon is far smaller than Earth and pulls six times more weakly. Your weight changes, you do not. That is why astronauts bounce along so oddly: ordinary walking does not work there.',
            },
            pauseSeconds: 3,
            choices: [{ key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'gravity-try' }],
          },
          {
            key: 'gravity-try',
            kind: 'PAUSE',
            text: {
              nl: 'Probeer eens te lopen als een astronaut: twee voeten tegelijk, kleine sprongetjes. Doe het een halve minuut. Ik zeg wel wanneer.',
              en: 'Try walking like an astronaut: both feet together, small hops. Do it for half a minute. I will say when.',
            },
            pauseSeconds: 30,
            choices: [{ key: 'done', label: { nl: 'Gedaan', en: 'Done' }, target: 'gravity-close' }],
          },
          {
            key: 'gravity-close',
            kind: 'CELEBRATION',
            text: {
              nl: 'Nu weet je waarom de eerste mensen op de maan zo bewogen. Nog één hoofdstuk: de weg terug naar huis.',
              en: 'Now you know why the first people on the Moon moved that way. One more chapter: the way back home.',
            },
            isTerminal: true,
          },
        ],
      },
      {
        key: 'home',
        title: { nl: 'Hoofdstuk 4: De weg naar huis', en: 'Chapter 4: The way home' },
        intro: {
          nl: 'Hoe vind je de aarde terug als je in het donker staat?',
          en: 'How do you find Earth again when you are standing in the dark?',
        },
        estimatedMinutes: 16,
        entryNodeKey: 'home-open',
        experiments: [],
        nodes: [
          {
            key: 'home-open',
            kind: 'NARRATION',
            text: {
              nl: 'Tijd om naar huis te gaan. Maar de ruimte is groot en donker. Vroeger voeren zeelui op de sterren, en ruimtevaarders doen iets wat daarop lijkt.',
              en: 'Time to go home. But space is big and dark. Sailors used to navigate by the stars, and space travellers do something similar.',
            },
            pauseSeconds: 3,
            choices: [{ key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'home-question' }],
          },
          {
            key: 'home-question',
            kind: 'QUESTION',
            text: {
              nl: 'Kijk eens naar de proefkaart met de sterrenhemel erop. Welke ster staat er in het noorden en beweegt bijna niet, hoe laat het ook is?',
              en: 'Look at the card with the night sky on it. Which star sits in the north and hardly moves, whatever the time?',
            },
            pauseSeconds: 10,
            choices: [
              { key: 'polaris', label: { nl: 'De poolster', en: 'The pole star' }, target: 'home-confirm' },
              { key: 'sun', label: { nl: 'De zon', en: 'The Sun' }, target: 'home-hint' },
              { key: 'dunno', label: { nl: 'Weet ik niet', en: 'I do not know' }, target: 'home-hint' },
            ],
          },
          {
            key: 'home-hint',
            kind: 'HINT',
            text: {
              nl: 'Zoek op de kaart de Grote Beer — die vier sterren als een pan met een steel. Trek de twee sterren aan de voorkant van de pan door naar boven. Daar kom je uit bij één heldere ster.',
              en: 'Find the Plough on the card — those four stars like a saucepan with a handle. Follow the two stars at the front of the pan upwards. They point you to one bright star.',
            },
            pauseSeconds: 15,
            choices: [
              { key: 'polaris', label: { nl: 'De poolster!', en: 'The pole star!' }, target: 'home-confirm' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'home-confirm',
            kind: 'NARRATION',
            text: {
              nl: 'Ja. De poolster staat bijna precies boven de noordpool, dus hij blijft de hele nacht op dezelfde plek staan. Zolang je hem ziet, weet je waar het noorden is — en dan weet je ook waar jij bent.',
              en: 'Yes. The pole star sits almost exactly above the North Pole, so it stays in the same place all night. As long as you can see it, you know where north is — and then you know where you are.',
            },
            pauseSeconds: 3,
            choices: [{ key: 'go', label: { nl: 'Landen', en: 'Land' }, target: 'home-landing' }],
          },
          {
            key: 'home-landing',
            kind: 'PAUSE',
            text: {
              nl: 'We gaan landen. Tel samen met mij af, hardop. Tien… negen… acht… zeven… zes… vijf… vier… drie… twee… één. Geland.',
              en: 'We are landing. Count down with me, out loud. Ten… nine… eight… seven… six… five… four… three… two… one. Landed.',
            },
            pauseSeconds: 12,
            choices: [{ key: 'done', label: { nl: 'Geland', en: 'Landed' }, target: 'home-close' }],
          },
          {
            key: 'home-close',
            kind: 'CELEBRATION',
            text: {
              nl: 'Je bent thuis, ruimteverkenner. Je hebt een raket gebouwd, kraters geslagen, geleerd waarom je op de maan zo hoog springt, en de weg terug gevonden aan de sterren. De hele doos is af. Vertel het maar aan iemand — dat is het leukste deel.',
              en: 'You are home, space explorer. You built a rocket, made craters, found out why you jump so high on the Moon, and found your way back by the stars. The whole box is finished. Go and tell someone — that is the best part.',
            },
            isTerminal: true,
          },
        ],
      },
    ],
  },
};
