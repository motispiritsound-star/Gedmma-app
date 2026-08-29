import type { BoxSpec } from './types.ts';

/**
 * Build an Electric Alarm — the oldest age band.
 *
 * The dialogue leans harder on diagnosis than the space box: three of the four
 * chapters have a "it does not work" branch that walks a child through finding
 * the break in their own circuit, which is the actual skill being taught.
 */
export const electricAlarm: BoxSpec = {
  sku: 'WB-ALARM-01',
  slug: 'bouw-een-alarm',
  themeSlug: 'practical-skills',
  ageMin: 9,
  ageMax: 12,
  priceCents: 3995,
  curriculumIndex: 2,
  translations: {
    nl: {
      name: 'Bouw een Alarm',
      tagline: 'Een echt werkend alarm op je deur, met stroom die je zelf laat lopen',
      description:
        'In vier hoofdstukken bouw je een alarm dat afgaat als iemand je deur opendoet. Je begint met één lampje en één draadje, ontdekt waarom een stroomkring rond moet zijn, maakt een schakelaar van aluminiumfolie, en zet alles samen op je deurpost. Aan het eind mag je hem zelf verbeteren.',
      materialsNote: 'Je hebt zelf twee AA-batterijen nodig — die zitten niet in de doos.',
    },
    en: {
      name: 'Build an Electric Alarm',
      tagline: 'A real working alarm on your door, with current you make flow yourself',
      description:
        'Over four chapters you build an alarm that goes off when someone opens your door. You start with one bulb and one wire, discover why a circuit has to be a loop, make a switch out of kitchen foil, and put it all together on your door frame. At the end you get to improve it yourself.',
      materialsNote: 'You need two AA batteries of your own — they are not in the box.',
    },
  },
  components: [
    { sku: 'CMP-BATT-HOLDER', name: 'Batterijhouder 2xAA', kind: 'COMPONENT', quantity: 1, stock: 95, note: { nl: 'Batterijen zitten er niet bij', en: 'Batteries not included' } },
    { sku: 'CMP-BUZZER-5V', name: 'Zoemer 5V', kind: 'COMPONENT', quantity: 1, stock: 88 },
    { sku: 'CMP-LED-RED', name: 'Rode LED met weerstand', kind: 'COMPONENT', quantity: 2, stock: 240 },
    { sku: 'CMP-WIRE-CROC', name: 'Krokodillenkabel (set van 6)', kind: 'COMPONENT', quantity: 1, stock: 130 },
    { sku: 'CMP-FOIL-SHEET', name: 'Aluminiumfolie vellen', kind: 'COMPONENT', quantity: 2, stock: 300 },
    { sku: 'CMP-CARD-STRIP', name: 'Kartonnen strips', kind: 'COMPONENT', quantity: 4, stock: 400 },
    { sku: 'PRN-ALARM-CARDS', name: 'Proefkaarten Elektriciteit', kind: 'PRINTED', quantity: 1, stock: 150 },
    { sku: 'PKG-BOX-M', name: 'Verzenddoos M', kind: 'PACKAGING', quantity: 1, stock: 400 },
  ],
  safety: [
    {
      code: 'ALARM-NO-MAINS',
      severity: 'WARNING',
      text: {
        nl: 'Gebruik nooit een stopcontact. Alles in deze doos werkt op twee AA-batterijen. Een stopcontact is levensgevaarlijk en hoort hier niet bij.',
        en: 'Never use a wall socket. Everything in this box runs on two AA batteries. A wall socket is life-threatening and has no place here.',
      },
      requiresAdult: false,
    },
    {
      code: 'ALARM-NO-SHORT',
      severity: 'CAUTION',
      text: {
        nl: 'Verbind de twee kanten van de batterijhouder nooit rechtstreeks met elkaar. De draad wordt dan heet. Zit er altijd een lampje of zoemer tussen.',
        en: 'Never connect the two sides of the battery holder straight to each other. The wire gets hot. Always keep a bulb or buzzer in between.',
      },
    },
    {
      code: 'ALARM-DOOR-ADULT',
      severity: 'CAUTION',
      text: {
        nl: 'Vraag een volwassene voordat je iets op de deurpost plakt, en gebruik alleen het plakband uit de doos.',
        en: 'Ask a grown-up before you stick anything to the door frame, and use only the tape from the box.',
      },
      requiresAdult: true,
    },
  ],
  journey: {
    slug: 'alarm-bouwen',
    title: { nl: 'Van één lampje naar een echt alarm', en: 'From one bulb to a real alarm' },
    summary: {
      nl: 'Stroomkring, schakelaar, alarm, en daarna verbeteren.',
      en: 'Circuit, switch, alarm, and then make it better.',
    },
    estimatedMinutes: 80,
    chapters: [
      {
        key: 'circuit',
        title: { nl: 'Hoofdstuk 1: Stroom loopt rond', en: 'Chapter 1: Current goes round' },
        intro: {
          nl: 'Eén lampje, één batterij, twee draadjes. Waarom moet het een rondje zijn?',
          en: 'One bulb, one battery, two wires. Why does it have to be a loop?',
        },
        estimatedMinutes: 20,
        entryNodeKey: 'open',
        experiments: [
          {
            key: 'closed-circuit',
            title: { nl: 'De gesloten stroomkring', en: 'The closed circuit' },
            objective: {
              nl: 'Zelf ontdekken dat een lampje alleen brandt als de stroom een heel rondje kan maken.',
              en: 'Discover for yourself that a bulb only lights when current can complete a full loop.',
            },
            durationMinutes: 15,
            materials: [
              { nl: 'De batterijhouder met twee AA-batterijen', en: 'The battery holder with two AA batteries' },
              { nl: 'Eén rode LED', en: 'One red LED' },
              { nl: 'Twee krokodillenkabels', en: 'Two crocodile leads' },
            ],
            steps: [
              { nl: 'Doe de twee batterijen in de houder. Let op de plus- en minkant.', en: 'Put the two batteries in the holder. Mind the plus and minus ends.' },
              { nl: 'Klem één kabel aan de rode draad van de houder en aan het lange pootje van de LED.', en: 'Clip one lead to the red wire of the holder and to the long leg of the LED.' },
              { nl: 'Klem de tweede kabel aan de zwarte draad en aan het korte pootje.', en: 'Clip the second lead to the black wire and to the short leg.' },
              { nl: 'Haal nu één kabel los en kijk wat er gebeurt.', en: 'Now unclip one lead and see what happens.' },
            ],
            safetyCodes: ['ALARM-NO-MAINS', 'ALARM-NO-SHORT'],
          },
        ],
        nodes: [
          {
            key: 'open',
            kind: 'NARRATION',
            text: {
              nl: 'Hoi. Aan het eind van deze doos hangt er een alarm op je deur dat echt afgaat. Maar we beginnen klein: met één lampje. Pak de batterijhouder, één rode LED en twee krokodillenkabels.',
              en: 'Hi. By the end of this box there will be an alarm on your door that really goes off. But we start small: with one bulb. Get the battery holder, one red LED and two crocodile leads.',
            },
            pauseSeconds: 15,
            choices: [
              { key: 'ready', label: { nl: 'Ik heb ze', en: 'I have them' }, target: 'safety-mains' },
              { key: 'slower', label: { nl: 'Langzamer', en: 'Slower' }, isSlower: true },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'safety-mains',
            kind: 'SAFETY',
            safetyCode: 'ALARM-NO-MAINS',
            text: {
              nl: 'Belangrijk, en ik zeg het maar één keer zo streng: gebruik nooit een stopcontact bij deze doos. Alles werkt op twee AA-batterijen. Een stopcontact is levensgevaarlijk.',
              en: 'Important, and I will only say it this sternly once: never use a wall socket with this box. Everything runs on two AA batteries. A wall socket is life-threatening.',
            },
            pauseSeconds: 4,
            choices: [{ key: 'ok', label: { nl: 'Begrepen', en: 'Understood' }, target: 'build-circuit' }],
          },
          {
            key: 'build-circuit',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'closed-circuit',
            text: {
              nl: 'Doe de batterijen in de houder. Klem dan één kabel aan de rode draad en aan het lange pootje van de LED, en de tweede kabel aan de zwarte draad en aan het korte pootje.',
              en: 'Put the batteries in the holder. Then clip one lead to the red wire and to the long leg of the LED, and the second lead to the black wire and the short leg.',
            },
            pauseSeconds: 60,
            choices: [
              { key: 'lit', label: { nl: 'Hij brandt', en: 'It is lit' }, target: 'question-loop' },
              { key: 'dark', label: { nl: 'Hij doet niets', en: 'Nothing happens' }, target: 'debug-1' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'debug-1',
            kind: 'HINT',
            text: {
              nl: 'Geen paniek, dit overkomt iedereen. Loop het na: zitten de batterijen goed om — plus tegen plus? Zitten de klemmetjes op het blote metaal en niet op het plastic? En zit het lange pootje van de LED aan de rode kant?',
              en: 'No panic, this happens to everyone. Check it through: are the batteries the right way round — plus against plus? Are the clips on bare metal and not on plastic? And is the long leg of the LED on the red side?',
            },
            pauseSeconds: 40,
            choices: [
              { key: 'lit', label: { nl: 'Nu brandt hij', en: 'Now it is lit' }, target: 'question-loop' },
              { key: 'still', label: { nl: 'Nog steeds niet', en: 'Still nothing' }, target: 'debug-2' },
            ],
          },
          {
            key: 'debug-2',
            kind: 'HINT',
            text: {
              nl: 'Draai de LED dan eens om — dus verwissel de twee pootjes. Een LED laat stroom maar één kant op door. Als hij achterstevoren zit, gebeurt er niets, en dat is niet stuk.',
              en: 'Then turn the LED around — swap the two legs over. An LED only lets current through one way. If it is back to front nothing happens, and that is not broken.',
            },
            pauseSeconds: 30,
            choices: [
              { key: 'lit', label: { nl: 'Nu wel!', en: 'Now it works!' }, target: 'question-loop' },
              { key: 'move-on', label: { nl: 'Ik ga verder', en: 'I will move on' }, target: 'question-loop' },
            ],
          },
          {
            key: 'question-loop',
            kind: 'QUESTION',
            text: {
              nl: 'Haal nu één kabel los. Het lampje gaat uit. Waarom gaat het uit, denk je — de batterij is toch nog vol?',
              en: 'Now unclip one lead. The bulb goes out. Why does it go out, do you think — the battery is still full, after all?',
            },
            pauseSeconds: 10,
            choices: [
              { key: 'loop-broken', label: { nl: 'Het rondje is niet meer rond', en: 'The loop is not a loop any more' }, target: 'confirm-loop' },
              { key: 'battery-empty', label: { nl: 'De batterij is leeg', en: 'The battery is empty' }, target: 'hint-loop' },
              { key: 'dunno', label: { nl: 'Weet ik niet', en: 'I do not know' }, target: 'hint-loop' },
            ],
          },
          {
            key: 'hint-loop',
            kind: 'HINT',
            text: {
              nl: 'Denk aan een treinbaan die rond loopt. Als je één rail weghaalt, kan de trein niet meer verder — ook al is de trein zelf nog helemaal in orde. Wat is hier de trein, en wat is de rail?',
              en: 'Think of a train track that runs in a loop. Take away one rail and the train cannot go on — even though the train itself is perfectly fine. What is the train here, and what is the rail?',
            },
            pauseSeconds: 10,
            choices: [
              { key: 'loop-broken', label: { nl: 'De baan is onderbroken', en: 'The track is broken' }, target: 'confirm-loop' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'confirm-loop',
            kind: 'NARRATION',
            text: {
              nl: 'Precies dat. Stroom moet een heel rondje kunnen maken: van de batterij, door het lampje, en weer terug naar de batterij. Eén onderbreking en alles stopt. Dat heet een stroomkring. Onthoud dit goed — je alarm gaat er straks juist gebruik van maken.',
              en: 'Exactly that. Current has to be able to go all the way round: out of the battery, through the bulb, and back to the battery. One break and everything stops. That is called a circuit. Remember it — your alarm is going to use exactly this.',
            },
            isTerminal: true,
          },
        ],
      },
      {
        key: 'switch',
        title: { nl: 'Hoofdstuk 2: De schakelaar', en: 'Chapter 2: The switch' },
        intro: {
          nl: 'Een schakelaar is niets anders dan een stukje stroomkring dat je met opzet kapot maakt.',
          en: 'A switch is nothing but a piece of circuit you break on purpose.',
        },
        estimatedMinutes: 20,
        entryNodeKey: 'switch-open',
        experiments: [
          {
            key: 'foil-switch',
            title: { nl: 'Drukschakelaar van folie', en: 'Foil pressure switch' },
            objective: {
              nl: 'Een schakelaar maken die sluit als je erop drukt, en opengaat als je loslaat.',
              en: 'Make a switch that closes when you press it and opens when you let go.',
            },
            durationMinutes: 18,
            materials: [
              { nl: 'Twee kartonnen strips', en: 'Two card strips' },
              { nl: 'Twee vellen aluminiumfolie', en: 'Two sheets of kitchen foil' },
              { nl: 'Plakband en twee krokodillenkabels', en: 'Tape and two crocodile leads' },
            ],
            steps: [
              { nl: 'Vouw elk vel folie tot een reepje en plak er één op elke kartonstrip.', en: 'Fold each sheet of foil into a strip and tape one onto each piece of card.' },
              { nl: 'Leg de strips met de folie naar elkaar toe, met een klein stukje karton ertussen aan één kant.', en: 'Lay the strips with the foil facing each other, with a small piece of card between them at one end.' },
              { nl: 'Klem een kabel op elk stukje folie.', en: 'Clip one lead to each piece of foil.' },
              { nl: 'Zet de schakelaar in je stroomkring, tussen batterij en LED.', en: 'Put the switch into your circuit, between the battery and the LED.' },
              { nl: 'Druk de strips tegen elkaar en laat weer los.', en: 'Press the strips together and let go again.' },
            ],
            safetyCodes: ['ALARM-NO-SHORT'],
          },
        ],
        nodes: [
          {
            key: 'switch-open',
            kind: 'NARRATION',
            text: {
              nl: 'Je weet nu dat één onderbreking het lampje uitzet. Dat is precies wat een schakelaar doet: hij onderbreekt de kring, en maakt hem weer heel. Wij maken er zelf een, van folie en karton.',
              en: 'You now know that one break turns the bulb off. That is exactly what a switch does: it breaks the loop, and closes it again. We are going to make one ourselves, from foil and card.',
            },
            pauseSeconds: 4,
            choices: [
              { key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'switch-build-1' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'switch-build-1',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'foil-switch',
            text: {
              nl: 'Vouw elk vel folie tot een reepje en plak er één op elke kartonstrip. Zorg dat het folie mooi plat ligt en niet gekreukt is.',
              en: 'Fold each sheet of foil into a strip and tape one onto each piece of card. Make sure the foil lies flat and is not crumpled.',
            },
            pauseSeconds: 60,
            choices: [{ key: 'done', label: { nl: 'Klaar', en: 'Done' }, target: 'switch-build-2' }],
          },
          {
            key: 'switch-build-2',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'foil-switch',
            text: {
              nl: 'Leg de twee strips met het folie naar elkaar toe. Schuif aan één kant een klein stukje karton ertussen, zodat ze elkaar net niet raken. Klem dan op elk stukje folie een kabel.',
              en: 'Lay the two strips with the foil facing each other. Slide a small piece of card between them at one end, so they just do not touch. Then clip one lead to each piece of foil.',
            },
            pauseSeconds: 70,
            choices: [
              { key: 'done', label: { nl: 'Klaar', en: 'Done' }, target: 'switch-test' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
              { key: 'slower', label: { nl: 'Langzamer', en: 'Slower' }, isSlower: true },
            ],
          },
          {
            key: 'switch-test',
            kind: 'EXPERIMENT_STEP',
            experimentKey: 'foil-switch',
            text: {
              nl: 'Zet de schakelaar nu in je stroomkring van hoofdstuk één, tussen de batterij en de LED. Druk de strips tegen elkaar. Brandt het lampje?',
              en: 'Now put the switch into your circuit from chapter one, between the battery and the LED. Press the strips together. Does the bulb light?',
            },
            pauseSeconds: 45,
            choices: [
              { key: 'yes', label: { nl: 'Ja!', en: 'Yes!' }, target: 'switch-question' },
              { key: 'no', label: { nl: 'Nee', en: 'No' }, target: 'switch-debug' },
            ],
          },
          {
            key: 'switch-debug',
            kind: 'HINT',
            text: {
              nl: 'Kijk of de klemmetjes echt op het folie zitten en niet op het plakband. Plakband laat geen stroom door. Druk daarna wat steviger, zodat de twee stukken folie elkaar over een groter vlak raken.',
              en: 'Check that the clips are really on the foil and not on the tape. Tape does not conduct. Then press a bit harder, so the two pieces of foil touch over a bigger area.',
            },
            pauseSeconds: 30,
            choices: [
              { key: 'yes', label: { nl: 'Nu wel', en: 'Now it works' }, target: 'switch-question' },
              { key: 'move-on', label: { nl: 'Verder', en: 'Move on' }, target: 'switch-question' },
            ],
          },
          {
            key: 'switch-question',
            kind: 'QUESTION',
            text: {
              nl: 'Jouw schakelaar is aan zolang je drukt. Voor een alarm wil je juist het omgekeerde: het moet afgaan als er iets weggaat. Wat zou je moeten veranderen?',
              en: 'Your switch is on as long as you press. For an alarm you want the opposite: it should go off when something is removed. What would you have to change?',
            },
            pauseSeconds: 12,
            choices: [
              { key: 'inverse', label: { nl: 'Het contact laten verbreken in plaats van maken', en: 'Break the contact instead of making it' }, target: 'switch-confirm' },
              { key: 'dunno', label: { nl: 'Geen idee', en: 'No idea' }, target: 'switch-hint2' },
            ],
          },
          {
            key: 'switch-hint2',
            kind: 'HINT',
            text: {
              nl: 'Stel je voor dat je de twee stukken folie tegen elkaar houdt met de deur zelf. Zolang de deur dicht is, drukken ze. Wat gebeurt er op het moment dat de deur opengaat?',
              en: 'Imagine the door itself holds the two pieces of foil together. As long as the door is shut, they press. What happens the moment the door opens?',
            },
            pauseSeconds: 10,
            choices: [
              { key: 'inverse', label: { nl: 'Dan laten ze los', en: 'Then they come apart' }, target: 'switch-confirm' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'switch-confirm',
            kind: 'CELEBRATION',
            text: {
              nl: 'Goed gedacht. Dat is precies wat we in het volgende hoofdstuk gaan bouwen. Je schakelaar blijft zoals hij is — we hangen hem alleen anders op.',
              en: 'Well reasoned. That is exactly what we are going to build in the next chapter. Your switch stays as it is — we just hang it differently.',
            },
            isTerminal: true,
          },
        ],
      },
      {
        key: 'assemble',
        title: { nl: 'Hoofdstuk 3: Het alarm op de deur', en: 'Chapter 3: The alarm on the door' },
        intro: {
          nl: 'Zoemer, schakelaar en deur worden één ding.',
          en: 'Buzzer, switch and door become one thing.',
        },
        estimatedMinutes: 22,
        entryNodeKey: 'assemble-open',
        experiments: [],
        nodes: [
          {
            key: 'assemble-open',
            kind: 'NARRATION',
            text: {
              nl: 'Nu het echte werk. We vervangen de LED door de zoemer, en hangen je schakelaar zo op dat de deur hem dichtdrukt.',
              en: 'Now the real work. We swap the LED for the buzzer, and hang your switch so that the door presses it shut.',
            },
            pauseSeconds: 3,
            choices: [{ key: 'go', label: { nl: 'Verder', en: 'Carry on' }, target: 'assemble-safety' }],
          },
          {
            key: 'assemble-safety',
            kind: 'SAFETY',
            safetyCode: 'ALARM-DOOR-ADULT',
            text: {
              nl: 'Vraag eerst even aan een volwassene of je iets op de deurpost mag plakken, en gebruik alleen het plakband uit de doos. Ga het nu vragen, ik wacht.',
              en: 'First ask a grown-up whether you may stick something to the door frame, and use only the tape from the box. Go and ask now, I will wait.',
            },
            pauseSeconds: 40,
            choices: [
              { key: 'allowed', label: { nl: 'Het mag', en: 'I am allowed' }, target: 'assemble-1' },
              { key: 'not-allowed', label: { nl: 'Het mag niet', en: 'I am not allowed' }, target: 'assemble-alt' },
            ],
          },
          {
            key: 'assemble-alt',
            kind: 'NARRATION',
            text: {
              nl: 'Geen probleem. Gebruik dan een la of een kastdeurtje in plaats van de deur. Dat werkt precies hetzelfde en er hoeft niets op de muur.',
              en: 'No problem. Use a drawer or a cupboard door instead. It works exactly the same and nothing has to go on the wall.',
            },
            pauseSeconds: 8,
            choices: [{ key: 'ok', label: { nl: 'Goed idee', en: 'Good idea' }, target: 'assemble-1' }],
          },
          {
            key: 'assemble-1',
            kind: 'EXPERIMENT_STEP',
            text: {
              nl: 'Haal de LED uit de kring en zet de zoemer ervoor in de plaats. Rode draad aan rood, zwarte aan zwart. Druk je schakelaar even dicht om te testen of de zoemer het doet.',
              en: 'Take the LED out of the circuit and put the buzzer in its place. Red wire to red, black to black. Press your switch shut for a moment to test that the buzzer works.',
            },
            pauseSeconds: 50,
            choices: [
              { key: 'buzz', label: { nl: 'Hij zoemt', en: 'It buzzes' }, target: 'assemble-2' },
              { key: 'silent', label: { nl: 'Hij blijft stil', en: 'It stays silent' }, target: 'assemble-debug' },
            ],
          },
          {
            key: 'assemble-debug',
            kind: 'HINT',
            text: {
              nl: 'Een zoemer heeft ook een plus- en een minkant, net als de LED. Draai de twee draadjes eens om. Controleer ook of de batterijen er nog goed in zitten.',
              en: 'A buzzer also has a plus and a minus side, just like the LED. Try swapping the two wires. Also check that the batteries are still seated properly.',
            },
            pauseSeconds: 30,
            choices: [
              { key: 'buzz', label: { nl: 'Nu zoemt hij', en: 'Now it buzzes' }, target: 'assemble-2' },
              { key: 'move-on', label: { nl: 'Verder', en: 'Move on' }, target: 'assemble-2' },
            ],
          },
          {
            key: 'assemble-2',
            kind: 'EXPERIMENT_STEP',
            text: {
              nl: 'Plak nu één kartonstrip op de deurpost en de andere op de deur zelf, precies tegenover elkaar. Als de deur dicht is, moeten de twee stukken folie elkaar raken.',
              en: 'Now tape one card strip to the door frame and the other to the door itself, exactly opposite each other. When the door is shut, the two pieces of foil must touch.',
            },
            pauseSeconds: 80,
            choices: [
              { key: 'done', label: { nl: 'Ze raken elkaar', en: 'They touch' }, target: 'assemble-invert' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
              { key: 'slower', label: { nl: 'Langzamer', en: 'Slower' }, isSlower: true },
            ],
          },
          {
            key: 'assemble-invert',
            kind: 'NARRATION',
            text: {
              nl: 'Nu zoemt hij als de deur dicht is, en dat is precies verkeerd om. Dit is het slimme stukje: klem de zoemer niet tussen de folie, maar zet de folie er parallel naast — dan houdt de gesloten deur de stroom bij de zoemer weg. Op je proefkaart staat een tekening; kijk daar even naar.',
              en: 'Right now it buzzes when the door is shut, which is exactly backwards. Here is the clever bit: do not put the buzzer between the foil, put the foil alongside it — then the closed door keeps the current away from the buzzer. There is a drawing on your card; have a look at it.',
            },
            pauseSeconds: 60,
            choices: [
              { key: 'done', label: { nl: 'Omgezet', en: 'Rewired' }, target: 'assemble-test' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'assemble-test',
            kind: 'PAUSE',
            text: {
              nl: 'Moment van de waarheid. Doe de deur dicht. Stil? Doe hem dan langzaam open.',
              en: 'Moment of truth. Close the door. Quiet? Now open it slowly.',
            },
            pauseSeconds: 20,
            choices: [
              { key: 'works', label: { nl: 'Hij ging af!', en: 'It went off!' }, target: 'assemble-close' },
              { key: 'nope', label: { nl: 'Nog niet goed', en: 'Not right yet' }, target: 'assemble-debug2' },
            ],
          },
          {
            key: 'assemble-debug2',
            kind: 'HINT',
            text: {
              nl: 'Kijk waar de kring nog rond is als de deur dicht is. Volg met je vinger de weg van de batterij, langs alle klemmetjes, terug naar de batterij. Bij welk stukje kan de stroom kiezen?',
              en: 'Look at where the loop is still closed when the door is shut. Follow the path with your finger, from the battery, past every clip, back to the battery. At which piece can the current choose?',
            },
            pauseSeconds: 45,
            choices: [
              { key: 'works', label: { nl: 'Gevonden, hij werkt', en: 'Found it, it works' }, target: 'assemble-close' },
              { key: 'move-on', label: { nl: 'Ik ga verder', en: 'I will move on' }, target: 'assemble-close' },
            ],
          },
          {
            key: 'assemble-close',
            kind: 'CELEBRATION',
            text: {
              nl: 'Je hebt een werkend alarm gebouwd. Niet nagemaakt, niet uit een bouwpakket geklikt — zelf bedacht hoe de stroom moest lopen. Eén hoofdstuk nog, en dat gaat over beter maken.',
              en: 'You have built a working alarm. Not copied, not clicked together from a kit — you worked out how the current had to flow. One chapter left, and it is about making it better.',
            },
            isTerminal: true,
          },
        ],
      },
      {
        key: 'improve',
        title: { nl: 'Hoofdstuk 4: Beter maken', en: 'Chapter 4: Making it better' },
        intro: {
          nl: 'Een uitvinder is niet klaar als iets werkt, maar als het goed werkt.',
          en: 'An inventor is not done when something works, but when it works well.',
        },
        estimatedMinutes: 18,
        entryNodeKey: 'improve-open',
        experiments: [],
        nodes: [
          {
            key: 'improve-open',
            kind: 'NARRATION',
            text: {
              nl: 'Je alarm werkt. Maar er zit vast iets aan wat je stoort. Denk even na: wat is het vervelendste aan jouw alarm?',
              en: 'Your alarm works. But something about it probably annoys you. Have a think: what is the most irritating thing about yours?',
            },
            pauseSeconds: 12,
            choices: [
              { key: 'too-loud', label: { nl: 'Hij is te hard', en: 'It is too loud' }, target: 'improve-loud' },
              { key: 'false', label: { nl: 'Hij gaat af als het niet hoeft', en: 'It goes off when it should not' }, target: 'improve-false' },
              { key: 'no-off', label: { nl: 'Ik kan hem niet uitzetten', en: 'I cannot turn it off' }, target: 'improve-off' },
            ],
          },
          {
            key: 'improve-loud',
            kind: 'NARRATION',
            text: {
              nl: 'Slim gehoord. Zet er eens één batterij uit — dus maar één in de houder. De zoemer wordt zachter maar doet het nog. Zo ontdek je dat meer spanning meer geluid geeft.',
              en: 'Well spotted. Try taking one battery out — just one in the holder. The buzzer gets quieter but still works. That is how you find out that more voltage gives more sound.',
            },
            pauseSeconds: 30,
            choices: [{ key: 'tried', label: { nl: 'Geprobeerd', en: 'Tried it' }, target: 'improve-question' }],
          },
          {
            key: 'improve-false',
            kind: 'NARRATION',
            text: {
              nl: 'Dat komt bijna altijd doordat het folie gekreukt is en de deur hem net niet goed dichtdrukt. Strijk het folie glad en plak de strips iets steviger vast. Probeer het daarna vijf keer achter elkaar.',
              en: 'That is nearly always because the foil is crumpled and the door does not quite press it shut. Smooth the foil and tape the strips down more firmly. Then try it five times in a row.',
            },
            pauseSeconds: 45,
            choices: [{ key: 'tried', label: { nl: 'Geprobeerd', en: 'Tried it' }, target: 'improve-question' }],
          },
          {
            key: 'improve-off',
            kind: 'NARRATION',
            text: {
              nl: 'Daar heb je een tweede schakelaar voor nodig: eentje die jij met de hand kunt openzetten. Maak nog een foliestrip zoals in hoofdstuk twee en zet die ergens in de kring waar jij er makkelijk bij kunt.',
              en: 'For that you need a second switch: one you can open by hand. Make another foil strip like in chapter two and put it somewhere in the loop you can easily reach.',
            },
            pauseSeconds: 60,
            choices: [{ key: 'tried', label: { nl: 'Gemaakt', en: 'Made it' }, target: 'improve-question' }],
          },
          {
            key: 'improve-question',
            kind: 'QUESTION',
            text: {
              nl: 'Laatste vraag van deze doos. Een echte inbraakalarm blijft loeien nadat de deur weer dicht is. Waarom is dat handiger dan een alarm dat stopt zodra de deur dichtgaat?',
              en: 'Last question of this box. A real burglar alarm keeps wailing after the door is shut again. Why is that more useful than one that stops as soon as the door closes?',
            },
            pauseSeconds: 15,
            choices: [
              { key: 'evidence', label: { nl: 'Anders hoort niemand het als de dief snel dichtdoet', en: 'Otherwise nobody hears it if the thief shuts it quickly' }, target: 'improve-close' },
              { key: 'dunno', label: { nl: 'Weet ik niet', en: 'I do not know' }, target: 'improve-hint' },
            ],
          },
          {
            key: 'improve-hint',
            kind: 'HINT',
            text: {
              nl: 'Stel je voor dat de deur maar één seconde openstaat en dan weer dicht is. Hoor jij dat, twee kamers verderop?',
              en: 'Imagine the door is open for only one second and then shut again. Would you hear that, two rooms away?',
            },
            pauseSeconds: 10,
            choices: [
              { key: 'evidence', label: { nl: 'Nee, dus hij moet blijven loeien', en: 'No, so it has to keep wailing' }, target: 'improve-close' },
              { key: 'again', label: { nl: 'Nog een keer', en: 'Again' }, isRepeat: true },
            ],
          },
          {
            key: 'improve-close',
            kind: 'CELEBRATION',
            text: {
              nl: 'Dat heet een geheugen, en dat is precies wat er in echte alarmsystemen zit. Je hebt de hele doos af: van één lampje naar een alarm dat je zelf verbeterd hebt. Laat het maar horen aan iemand.',
              en: 'That is called a latch, and it is exactly what sits inside real alarm systems. You have finished the whole box: from one bulb to an alarm you improved yourself. Go and show someone.',
            },
            isTerminal: true,
          },
        ],
      },
    ],
  },
};
