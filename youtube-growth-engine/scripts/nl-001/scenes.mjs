// De beelden van NL-001, als vectortekening.
//
// Dit is een ander kanaal dan het islamitische, en dus een andere huisstijl:
// geen filmische schemering maar technisch tekenwerk op papier. Ingetekend met
// de hand, niet gegenereerd — bij dit onderwerp is een doorsnede niet de
// goedkope oplossing maar de beste vorm, omdat hij laat zien wat een foto
// verbergt.
//
// Het systeem onder deze scènes:
//   - drie waterniveaus die in elke doorsnede op dezelfde hoogte staan, zodat
//     de kijker de tekening in de loop van de video leert lezen;
//   - schoon regenwater in blauw, gemengd rioolwater in bruin, en dat verschil
//     doet in scène 12 het werk waar anders een zin voor nodig was;
//   - één accentkleur, die alleen gebruikt wordt voor het ding waar de zin op
//     dat moment over gaat.

export const PALETTE = {
  paper: '#f2efe4', grid: '#e0dac9', ink: '#152530', soft: '#54656f',
  line: '#a8a08c', clean: '#3f85ab', mixed: '#8a7248', deep: '#24485c',
  accent: '#c0552e', dike: '#cfc4a8', dark: '#101c24',
}

const P = PALETTE
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

/** Papier met een flauw raster: technische tekening, geen schoolbord. */
const sheet = () => `
  <rect width="1280" height="720" fill="${P.paper}"/>
  ${Array.from({ length: 32 }, (_, i) =>
    `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="720" stroke="${P.grid}" stroke-width="1"/>`).join('')}
  ${Array.from({ length: 18 }, (_, i) =>
    `<line x1="0" y1="${i * 40}" x2="1280" y2="${i * 40}" stroke="${P.grid}" stroke-width="1"/>`).join('')}`

const label = (x, y, text, size = 26, fill = P.ink, anchor = 'start') =>
  `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}"
     font-weight="600" fill="${fill}" text-anchor="${anchor}">${esc(text)}</text>`

const note = (x, y, text, anchor = 'start') =>
  `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="19"
     fill="${P.soft}" text-anchor="${anchor}">${esc(text)}</text>`

/** Pijl met een echte punt, niet een driehoekje dat er los naast ligt. */
const arrow = (x1, y1, x2, y2, kleur = P.accent, dik = 5) => {
  const hoek = Math.atan2(y2 - y1, x2 - x1)
  const l = 16
  const p1 = [x2 - l * Math.cos(hoek - 0.42), y2 - l * Math.sin(hoek - 0.42)]
  const p2 = [x2 - l * Math.cos(hoek + 0.42), y2 - l * Math.sin(hoek + 0.42)]
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${kleur}" stroke-width="${dik}" stroke-linecap="round"/>
    <path d="M ${x2} ${y2} L ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} Z" fill="${kleur}"/>`
}

/** Waterlichaam met een golvend oppervlak, zodat het geen balk is. */
const water = (x, y, w, h, kleur) => {
  const golf = Array.from({ length: Math.ceil(w / 28) }, (_, i) =>
    `q 7 -4 14 0 t 14 0`).join(' ')
  return `<path d="M ${x} ${y} ${golf} L ${x + w} ${y + h} L ${x} ${y + h} Z"
    fill="${kleur}" opacity="0.88"/>`
}

/**
 * Dijk als trapezium. De verhouding tussen kruin en voet doet het werk: te smal
 * en het leest als een schoorsteen, wat de eerste versie ook deed.
 */
const dike = (cx, top, bodem, halfBoven, halfOnder) =>
  `<path d="M ${cx - halfOnder} ${bodem} L ${cx - halfBoven} ${top}
     L ${cx + halfBoven} ${top} L ${cx + halfOnder} ${bodem} Z"
   fill="${P.dike}" stroke="${P.line}" stroke-width="2"/>`

/**
 * Gemaal: een huisje met een schroef die omhoog werkt.
 *
 * Eerste versie was een cirkel met twee lijnen erin, en dat las als een klok.
 * Een pictogram dat het verkeerde ding zegt, is erger dan geen pictogram: de
 * kijker denkt dat de tijd ertoe doet in plaats van de richting.
 */
const pump = (cx, top, actief = true) => `
  <rect x="${cx - 36}" y="${top}" width="72" height="54" rx="4"
    fill="${actief ? P.ink : P.line}" stroke="${P.dark}" stroke-width="2"/>
  <path d="M ${cx} ${top + 12} L ${cx} ${top + 42}" stroke="${P.paper}"
    stroke-width="5" stroke-linecap="round"/>
  <path d="M ${cx - 13} ${top + 24} L ${cx} ${top + 11} L ${cx + 13} ${top + 24}"
    fill="none" stroke="${P.paper}" stroke-width="5"
    stroke-linecap="round" stroke-linejoin="round"/>
  ${actief ? '' : `<path d="M ${cx - 24} ${top + 12} L ${cx + 24} ${top + 42}"
    stroke="${P.accent}" stroke-width="5"/>`}`

/**
 * De dragende doorsnede. `stap` bepaalt hoeveel ervan al is ingevuld, zodat de
 * kijker de tekening met het script mee ziet groeien in plaats van hem in één
 * keer voor zijn hoofd te krijgen.
 */
const doorsnede = (stap) => {
  // Alles blijft boven y=550: daar begint de ondertitelbalk.
  const polderWater = 496, boezemWater = 408, zeeWater = 344, bodem = 550
  let s = ''

  // Grondlijn: laag links, oplopend naar rechts.
  s += `<path d="M 0 ${bodem} L 1280 ${bodem} L 1280 560 L 0 560 Z"
    fill="${P.dike}" opacity="0.5"/>`

  // Polder
  s += water(60, polderWater, 360, bodem - polderWater, P.clean)
  s += label(70, polderWater - 22, 'POLDER', 24)
  s += note(70, polderWater + 34, 'vast peil')

  if (stap >= 2) {
    s += dike(470, boezemWater - 34, bodem, 44, 128)
    s += water(520, boezemWater, 300, bodem - boezemWater, P.clean)
    s += label(530, boezemWater - 22, 'BOEZEM', 24)
    s += note(530, boezemWater + 34, 'geen vast peil')
    s += pump(470, boezemWater - 82)
    s += arrow(430, polderWater - 8, 430, boezemWater + 6, P.accent, 5)
  }

  if (stap >= 3) {
    s += dike(880, zeeWater - 34, bodem, 44, 128)
    s += water(930, zeeWater, 330, bodem - zeeWater, P.deep)
    s += label(940, zeeWater - 22, 'ZEE', 24)
    s += pump(880, zeeWater - 82)
    s += arrow(838, boezemWater - 8, 838, zeeWater + 6, P.accent, 5)
  }

  // Hoogtelijnen, zodat je ziet dat het echt omhoog gaat.
  if (stap >= 2) {
    s += `<line x1="60" y1="${polderWater}" x2="1240" y2="${polderWater}"
      stroke="${P.line}" stroke-width="1.5" stroke-dasharray="7 7"/>`
  }
  if (stap >= 3) {
    s += `<line x1="520" y1="${boezemWater}" x2="1240" y2="${boezemWater}"
      stroke="${P.line}" stroke-width="1.5" stroke-dasharray="7 7"/>`
  }
  return s
}

/** Contour van Nederland, sterk vereenvoudigd. Eigen tekening, geen kaartdata. */
const nederland = (vulling, laagVulling) => `
  <g transform="translate(430,60) scale(1.08)">
    <path d="M 168 12 L 214 40 L 236 96 L 262 150 L 276 214 L 268 286
             L 288 330 L 262 392 L 206 436 L 140 468 L 84 452 L 46 404
             L 28 336 L 44 268 L 34 196 L 62 132 L 106 66 Z"
      fill="${vulling}" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"/>
    ${laagVulling ? `<path d="M 106 66 L 62 132 L 34 196 L 44 268 L 28 336
             L 46 404 L 84 452 L 140 468 L 168 420 L 120 372 L 96 300
             L 110 222 L 92 150 Z" fill="${laagVulling}" opacity="0.85"/>` : ''}
  </g>`

export const SCENES = [
  {
    id: '01-druppel',
    caption: 'Regenwater in Nederland gaat niet naar beneden. Het gaat omhoog.',
    svg: `${sheet()}
      <rect x="380" y="430" width="520" height="34" fill="${P.line}" opacity="0.5"/>
      <rect x="380" y="430" width="520" height="6" fill="${P.ink}" opacity="0.3"/>
      <circle cx="640" cy="404" r="20" fill="${P.clean}"/>
      <path d="M 640 372 q -16 20 -16 32 a 16 16 0 0 0 32 0 q 0 -12 -16 -32 Z" fill="${P.clean}"/>
      ${arrow(760, 280, 760, 150)}
      <g opacity="0.35">${arrow(520, 150, 520, 280, P.soft, 5)}</g>
      <line x1="480" y1="140" x2="560" y2="290" stroke="${P.accent}" stroke-width="6"/>
      ${label(800, 220, 'omhoog', 34)}
      ${note(430, 330, 'niet omlaag')}`,
  },
  {
    id: '02-kaart',
    caption: 'Zesentwintig procent van Nederland ligt onder zeeniveau.',
    svg: `${sheet()}
      ${nederland(P.paper, P.clean)}
      ${label(90, 200, '26%', 78, P.accent)}
      ${label(90, 250, 'ligt onder', 28)}
      ${label(90, 288, 'zeeniveau', 28)}
      ${note(90, 340, 'bron: nog na te lopen — zie bronnencheck punt 1')}`,
  },
  {
    id: '03-emmer',
    caption: 'Water dat daar terechtkomt, blijft daar liggen tot iemand het optilt.',
    svg: `${sheet()}
      ${doorsnede(1)}
      ${label(70, 130, 'Beneden is geen optie', 40)}
      ${note(70, 176, 'de polder is het laagste punt in de omgeving')}
      ${arrow(300, 240, 300, 452, P.soft, 5)}
      ${note(322, 350, 'hierheen stroomt het')}`,
  },
  {
    id: '04-gemengd',
    caption: 'Een gemengd stelsel: één buis, waarin regenwater en afvalwater samenkomen.',
    svg: `${sheet()}
      ${label(70, 110, 'GEMENGD STELSEL', 32)}
      ${note(70, 148, 'de meeste Nederlandse woonwijken')}
      <rect x="120" y="250" width="1040" height="30" fill="${P.line}" opacity="0.4"/>
      ${arrow(320, 300, 420, 400, P.clean, 6)}
      ${arrow(760, 300, 660, 400, P.mixed, 6)}
      ${note(200, 330, 'regen van je dak')}
      ${note(790, 330, 'afvalwater uit je huis')}
      <rect x="120" y="420" width="1040" height="64" rx="8"
        fill="${P.mixed}" stroke="${P.ink}" stroke-width="3"/>
      ${label(150, 462, 'één buis', 28, P.paper)}
      ${arrow(1100, 500, 1100, 548, P.ink, 5)}
      ${note(1120, 540, 'naar de zuivering')}`,
  },
  {
    id: '05-gescheiden',
    caption: 'Een gescheiden stelsel: twee buizen. Dat verschil is het belangrijkste in deze video.',
    svg: `${sheet()}
      ${label(70, 110, 'GESCHEIDEN STELSEL', 32)}
      ${note(70, 148, 'nieuwere wijken')}
      <rect x="120" y="250" width="1040" height="30" fill="${P.line}" opacity="0.4"/>
      <rect x="120" y="380" width="1040" height="56" rx="8"
        fill="${P.clean}" stroke="${P.ink}" stroke-width="3"/>
      ${label(150, 418, 'regenwater', 26, P.paper)}
      <rect x="120" y="490" width="1040" height="56" rx="8"
        fill="${P.mixed}" stroke="${P.ink}" stroke-width="3"/>
      ${label(150, 528, 'afvalwater', 26, P.paper)}
      ${note(880, 356, 'naar de sloot')}
      ${note(880, 580, 'naar de zuivering')}`,
  },
  {
    id: '06-polder',
    caption: 'Een polder is een bak. Dijken eromheen, en een waterstand die kunstmatig op peil blijft.',
    svg: `${sheet()}
      ${dike(215, 400, 548, 48, 130)}
      ${dike(1065, 400, 548, 48, 130)}
      ${water(280, 452, 720, 96, P.clean)}
      ${label(70, 130, 'DE POLDER', 40)}
      ${note(70, 176, 'een bak met een vaste waterstand')}
      <line x1="280" y1="452" x2="1000" y2="452"
        stroke="${P.accent}" stroke-width="3" stroke-dasharray="9 6"/>
      ${label(600, 432, 'peil', 24, P.accent)}
      ${arrow(640, 250, 640, 430, P.clean, 5)}
      ${note(662, 330, 'sloten komen hier samen')}`,
  },
  {
    id: '07-doorsnede-2',
    caption: 'Een poldergemaal tilt water uit de polder omhoog en zet het in de boezem.',
    svg: `${sheet()}${doorsnede(2)}
      ${label(70, 110, 'Stap één: omhoog', 36)}`,
  },
  {
    id: '08-boezem-vol',
    caption: 'Maar een wachtkamer heeft een plafond. Staat de boezem te hoog, dan vallen de poldergemalen stil.',
    svg: `${sheet()}
      ${dike(470, 350, 548, 44, 126)}
      ${water(60, 470, 350, 78, P.clean)}
      ${water(540, 384, 700, 164, P.clean)}
      ${pump(470, 288, false)}
      ${label(70, 120, 'De wachtkamer is vol', 38)}
      ${note(70, 164, 'het gemaal staat stil — dat is geen storing')}
      <line x1="540" y1="384" x2="1240" y2="384"
        stroke="${P.accent}" stroke-width="4" stroke-dasharray="9 6"/>
      ${label(1230, 364, 'maximum', 22, P.accent, 'end')}
      <g opacity="0.3">${arrow(430, 462, 430, 400, P.soft, 5)}</g>
      <line x1="396" y1="398" x2="464" y2="466" stroke="${P.accent}" stroke-width="6"/>`,
  },
  {
    id: '09-doorsnede-3',
    caption: 'Stoep, buis, sloot, polder, gemaal, boezem, gemaal, zee. Zeven stappen, waarvan twee een pomp.',
    svg: `${sheet()}${doorsnede(3)}
      ${label(70, 110, 'De hele keten', 36)}`,
  },
  {
    id: '10-schaal',
    caption: 'Ongeveer tweehonderdzestig kubieke meter per seconde: één olympisch zwembad per tien seconden.',
    svg: `${sheet()}
      ${label(70, 120, '260 m³ / seconde', 52)}
      ${note(70, 166, 'gemaal IJmuiden — grootste van Europa, na te lopen')}
      <rect x="70" y="250" width="420" height="190" rx="6"
        fill="${P.clean}" stroke="${P.ink}" stroke-width="3"/>
      ${Array.from({ length: 7 }, (_, i) =>
        `<line x1="${70 + (i + 1) * 52}" y1="250" x2="${70 + (i + 1) * 52}" y2="440"
          stroke="${P.paper}" stroke-width="2" opacity="0.5"/>`).join('')}
      ${label(90, 480, 'één olympisch zwembad = 2500 m³', 24)}
      ${arrow(530, 345, 650, 345)}
      <circle cx="830" cy="345" r="110" fill="none" stroke="${P.ink}" stroke-width="5"/>
      <line x1="830" y1="345" x2="830" y2="255" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>
      <line x1="830" y1="345" x2="895" y2="382" stroke="${P.accent}" stroke-width="5" stroke-linecap="round"/>
      ${label(830, 500, '10 seconden', 30, P.ink, 'middle')}
      ${note(830, 536, 'zes zwembaden per minuut', 'middle')}`,
  },
  {
    id: '11-getij',
    caption: 'Bij laag water loopt het er vanzelf uit. Pas als de zee te hoog staat, gaan de pompen aan.',
    svg: `${sheet()}
      ${label(70, 110, 'Spuien of pompen', 38)}
      ${note(70, 152, 'het getij bepaalt wat er nodig is')}

      ${label(70, 248, 'LAAG WATER', 26)}
      ${note(70, 278, 'het loopt er vanzelf uit — spuien')}
      ${dike(300, 316, 540, 34, 92)}
      ${water(60, 340, 208, 200, P.clean)}
      ${water(392, 442, 206, 98, P.deep)}
      ${arrow(300, 360, 300, 452, P.clean, 6)}

      ${label(700, 248, 'HOOG WATER', 26)}
      ${note(700, 278, 'de zee staat hoger')}
      ${dike(986, 316, 540, 34, 92)}
      ${water(700, 400, 188, 140, P.clean)}
      ${water(1080, 340, 170, 200, P.deep)}
      ${pump(986, 244)}
      ${arrow(986, 420, 986, 352, P.accent, 6)}
      <line x1="645" y1="230" x2="645" y2="548" stroke="${P.line}" stroke-width="2"/>`,
  },
  {
    id: '12-overstort',
    caption: 'Kan de buis het niet meer aan, dan gaat een mengsel van regen- en afvalwater het oppervlaktewater in.',
    svg: `${sheet()}
      ${label(70, 110, 'DE OVERSTORT', 36)}
      ${note(70, 152, 'de rem die voorkomt dat het bij jou binnenkomt')}
      <rect x="70" y="330" width="700" height="80" rx="8"
        fill="${P.mixed}" stroke="${P.ink}" stroke-width="3"/>
      ${label(100, 382, 'gemengd stelsel — vol', 26, P.paper)}
      <path d="M 770 330 L 900 330 L 900 470 L 1210 470 L 1210 542 L 820 542 L 820 410 L 770 410 Z"
        fill="${P.mixed}" stroke="${P.ink}" stroke-width="3"/>
      ${arrow(940, 506, 1150, 506, P.accent, 6)}
      ${label(1210, 450, 'de sloot in', 26, P.ink, 'end')}
      <g>${Array.from({ length: 18 }, (_, i) =>
        `<circle cx="${150 + i * 34}" cy="${250 + (i % 3) * 22}" r="4" fill="${P.clean}"/>`).join('')}</g>
      ${note(150, 220, 'de bui')}`,
  },
  {
    id: '13-frequentie',
    caption: 'Elk onderdeel is gedimensioneerd op een aanname: zoveel water, zo vaak.',
    svg: `${sheet()}
      ${label(70, 110, 'De aanname', 38)}
      ${note(70, 152, 'geen natuurkunde — een afspraak')}
      <line x1="150" y1="540" x2="1180" y2="540" stroke="${P.ink}" stroke-width="3"/>
      <line x1="150" y1="540" x2="150" y2="240" stroke="${P.ink}" stroke-width="3"/>
      ${note(150, 218, 'zwaarte van de bui')}
      ${note(1180, 576, 'hoe vaak', 'end')}
      <line x1="150" y1="420" x2="1180" y2="420"
        stroke="${P.line}" stroke-width="3" stroke-dasharray="10 7"/>
      ${label(1170, 402, 'waar de buis op is berekend', 20, P.soft, 'end')}
      <path d="M 200 516 C 420 585 560 540 700 470 C 840 400 980 330 1140 300"
        fill="none" stroke="${P.clean}" stroke-width="5"/>
      <path d="M 200 494 C 420 560 560 500 700 415 C 840 330 980 270 1140 250"
        fill="none" stroke="${P.accent}" stroke-width="5" stroke-dasharray="12 8"/>
      ${label(700, 200, 'de lijn verschuift', 26, P.accent, 'middle')}`,
  },
  {
    id: '14-slot',
    caption: 'Niet de capaciteit van het grootste gemaal van Europa. De frequentie.',
    svg: `${sheet()}
      ${label(640, 330, 'FREQUENTIE', 88, P.ink, 'middle')}
      <line x1="360" y1="370" x2="920" y2="370" stroke="${P.accent}" stroke-width="6"/>
      ${note(640, 430, 'dat is het getal waar je naar moet kijken', 'middle')}`,
  },
]
