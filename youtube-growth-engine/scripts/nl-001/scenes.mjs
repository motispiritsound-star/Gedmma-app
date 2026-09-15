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


/** Buis in doorsnede, met een vulling die de inhoud verraadt. */
const pipe = (x, y, w, h, vulling, tekst) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7"
    fill="${vulling}" stroke="${P.ink}" stroke-width="3"/>
  ${tekst ? label(x + 26, y + h / 2 + 9, tekst, 24, P.paper) : ''}`

/** Regen als losse druppels, altijd hetzelfde patroon zodat het rustig blijft. */
const rain = (x, y, kolommen, rijen = 3) =>
  Array.from({ length: kolommen * rijen }, (_, i) => {
    const k = i % kolommen, r = Math.floor(i / kolommen)
    return `<circle cx="${x + k * 34}" cy="${y + r * 22 + (k % 2) * 8}" r="4"
      fill="${P.clean}"/>`
  }).join('')

/** Genummerde stap in de keten. */
const step = (x, y, n, tekst, pomp = false) => `
  <circle cx="${x}" cy="${y}" r="26" fill="${pomp ? P.accent : P.ink}"/>
  ${label(x, y + 9, String(n), 26, P.paper, 'middle')}
  ${label(x, y + 58, tekst, 19, P.ink, 'middle')}`

export const SCENES = [
  {
    id: '01-druppel',
    caption: 'Regenwater in Nederland gaat niet naar beneden.',
    svg: `${sheet()}
      <rect x="360" y="430" width="560" height="34" fill="${P.line}" opacity="0.5"/>
      <rect x="360" y="430" width="560" height="6" fill="${P.ink}" opacity="0.3"/>
      <path d="M 640 372 q -18 22 -18 36 a 18 18 0 0 0 36 0 q 0 -14 -18 -36 Z" fill="${P.clean}"/>
      ${arrow(640, 250, 640, 350, P.soft, 5)}
      ${note(660, 300, 'je verwacht: omlaag')}`,
  },
  {
    id: '02-omhoog',
    caption: 'Het gaat omhoog.',
    svg: `${sheet()}
      <rect x="360" y="430" width="560" height="34" fill="${P.line}" opacity="0.5"/>
      <path d="M 640 372 q -18 22 -18 36 a 18 18 0 0 0 36 0 q 0 -14 -18 -36 Z" fill="${P.clean}"/>
      <g opacity="0.25">${arrow(460, 250, 460, 350, P.soft, 5)}</g>
      <line x1="424" y1="246" x2="496" y2="354" stroke="${P.accent}" stroke-width="7"/>
      ${arrow(800, 350, 800, 210, P.accent, 7)}
      ${label(840, 290, 'omhoog', 40)}`,
  },
  {
    id: '03-emmer',
    caption: 'Gooi een emmer water op straat en hij zakt weg. Maar niet naar de zee.',
    svg: `${sheet()}
      <path d="M 300 260 L 360 400 L 470 400 L 530 260 Z"
        fill="none" stroke="${P.ink}" stroke-width="4"/>
      <path d="M 320 306 L 352 380 L 478 380 L 510 306 Z" fill="${P.clean}"/>
      <path d="M 528 300 q 90 30 120 120" fill="none" stroke="${P.clean}" stroke-width="7"/>
      <rect x="600" y="410" width="620" height="28" fill="${P.line}" opacity="0.5"/>
      ${arrow(760, 452, 760, 530, P.clean, 6)}
      ${note(786, 500, 'zakt weg')}
      ${label(600, 300, 'maar waarheen?', 32)}`,
  },
  {
    id: '04-kaart-nap',
    caption: 'Zesentwintig procent van Nederland ligt onder zeeniveau.',
    svg: `${sheet()}
      ${nederland(P.paper, P.clean)}
      ${label(90, 210, '26%', 82, P.accent)}
      ${label(90, 262, 'onder zeeniveau', 28)}
      ${note(90, 306, 'nog na te lopen — bronnencheck punt 1')}`,
  },
  {
    id: '05-kaart-overstroom',
    caption: 'Negenenvijftig procent kan onder water lopen bij een overstroming.',
    svg: `${sheet()}
      ${nederland(P.dike, P.clean)}
      ${label(90, 210, '59%', 82, P.deep)}
      ${label(90, 262, 'overstroombaar', 28)}
      ${note(90, 306, 'dit getal staat ter discussie — punt 2')}
      ${note(90, 340, 'gaat eruit als de bron het niet bevestigt')}`,
  },
  {
    id: '06-trap',
    caption: 'Tussen jouw stoep en de zee staat een reeks pompen die het water trapsgewijs omhoog brengt.',
    svg: `${sheet()}
      ${[0, 1, 2, 3].map((i) => `
        <rect x="${150 + i * 250}" y="${470 - i * 80}" width="230" height="${80 + i * 80}"
          fill="${P.dike}" stroke="${P.line}" stroke-width="2"/>
        ${arrow(265 + i * 250, 450 - i * 80, 265 + i * 250, 390 - i * 80, P.accent, 5)}`).join('')}
      ${label(70, 130, 'Trapsgewijs omhoog', 40)}
      ${note(70, 176, 'elke trede is een pomp')}`,
  },
  {
    id: '07-doorsnede-leeg',
    caption: 'Ik loop de hele reeks met je af. Van de tegel voor je deur tot de zee.',
    svg: `${sheet()}${doorsnede(1)}
      ${label(70, 110, 'De doorsnede', 38)}
      ${note(70, 152, 'deze tekening blijft de hele video staan')}`,
  },
  {
    id: '08-stoeprand',
    caption: 'Bij de stoeprand splitst het al.',
    svg: `${sheet()}
      <rect x="0" y="300" width="1280" height="40" fill="${P.line}" opacity="0.45"/>
      <rect x="520" y="270" width="40" height="70" fill="${P.line}" opacity="0.8"/>
      ${rain(180, 130, 8, 3)}
      ${pipe(140, 420, 980, 64, P.mixed, 'onder de straat')}
      ${arrow(360, 350, 360, 410, P.clean, 5)}
      ${arrow(900, 350, 900, 410, P.clean, 5)}
      ${label(70, 200, 'De stoeprand', 38)}`,
  },
  {
    id: '09-gemengd',
    caption: 'Een gemengd stelsel: één buis, waarin regenwater en afvalwater samenkomen.',
    svg: `${sheet()}
      ${label(70, 110, 'GEMENGD STELSEL', 32)}
      ${note(70, 148, 'de meeste Nederlandse woonwijken')}
      ${arrow(320, 230, 430, 360, P.clean, 6)}
      ${arrow(900, 230, 790, 360, P.mixed, 6)}
      ${note(200, 210, 'regen van je dak')}
      ${note(880, 210, 'afvalwater uit je huis')}
      ${pipe(120, 390, 1040, 70, P.mixed, 'één buis')}
      ${arrow(1060, 480, 1060, 536, P.ink, 5)}
      ${note(880, 524, 'naar de zuivering', 'end')}`,
  },
  {
    id: '10-gescheiden',
    caption: 'Een gescheiden stelsel: twee buizen. Dat verschil is het belangrijkste in deze video.',
    svg: `${sheet()}
      ${label(70, 110, 'GESCHEIDEN STELSEL', 32)}
      ${note(70, 148, 'nieuwere wijken')}
      ${pipe(120, 280, 1040, 62, P.clean, 'regenwater')}
      ${pipe(120, 420, 1040, 62, P.mixed, 'afvalwater')}
      ${note(1160, 262, 'naar de sloot', 'end')}
      ${note(1160, 522, 'naar de zuivering', 'end')}`,
  },
  {
    id: '11-vergelijk',
    caption: 'Dat verschil lijkt technisch. Aan het eind van deze video zie je waarom het dat niet is.',
    svg: `${sheet()}
      ${label(70, 110, 'Eén buis of twee', 38)}
      ${pipe(80, 250, 520, 74, P.mixed)}
      ${label(110, 300, 'alles samen', 24, P.paper)}
      ${pipe(680, 220, 520, 58, P.clean)}
      ${label(710, 258, 'regen', 22, P.paper)}
      ${pipe(680, 300, 520, 58, P.mixed)}
      ${label(710, 338, 'afval', 22, P.paper)}
      <line x1="640" y1="200" x2="640" y2="480" stroke="${P.line}" stroke-width="2"/>
      ${note(80, 420, 'onthoud dit — het komt terug in segment vijf')}`,
  },
  {
    id: '12-polder',
    caption: 'Een polder is een bak. Dijken eromheen, en een waterstand die kunstmatig op peil blijft.',
    svg: `${sheet()}
      ${dike(215, 400, 548, 48, 130)}
      ${dike(1065, 400, 548, 48, 130)}
      ${water(280, 452, 720, 96, P.clean)}
      ${label(70, 130, 'DE POLDER', 40)}
      ${note(70, 176, 'een bak met een vaste waterstand')}
      <line x1="280" y1="452" x2="1000" y2="452"
        stroke="${P.accent}" stroke-width="3" stroke-dasharray="9 6"/>
      ${label(600, 432, 'peil', 24, P.accent)}`,
  },
  {
    id: '13-doorsnede-1',
    caption: 'De polder is het laagste punt. Alles komt hier samen.',
    svg: `${sheet()}${doorsnede(1)}
      ${arrow(240, 250, 240, 440, P.clean, 5)}
      ${note(262, 340, 'hierheen stroomt het')}`,
  },
  {
    id: '14-sloten',
    caption: 'Al het water verzamelt zich op het laagste punt. Daar staat een poldergemaal.',
    svg: `${sheet()}
      ${label(70, 110, 'Sloten komen samen', 38)}
      ${[0, 1, 2, 3, 4].map((i) =>
        `<path d="M ${140 + i * 30} ${230 + i * 12} L 620 430" fill="none"
          stroke="${P.clean}" stroke-width="6" opacity="0.85"/>`).join('')}
      ${[0, 1, 2, 3, 4].map((i) =>
        `<path d="M ${1140 - i * 30} ${230 + i * 12} L 660 430" fill="none"
          stroke="${P.clean}" stroke-width="6" opacity="0.85"/>`).join('')}
      <circle cx="640" cy="446" r="34" fill="${P.clean}"/>
      ${pump(640, 476)}
      ${note(700, 500, 'het laagste punt')}`,
  },
  {
    id: '15-doorsnede-2',
    caption: 'Een poldergemaal tilt water uit de polder omhoog en zet het in de boezem.',
    svg: `${sheet()}${doorsnede(2)}
      ${label(70, 110, 'Stap één: omhoog', 38)}`,
  },
  {
    id: '16-boezemnet',
    caption: 'De boezem is een net van kanalen dat het water van tientallen polders opvangt.',
    svg: `${sheet()}
      ${label(70, 110, 'DE BOEZEM', 38)}
      ${note(70, 152, 'geen meer, geen rivier — een net')}
      <g stroke="${P.clean}" stroke-width="9" fill="none" stroke-linecap="round">
        <path d="M 140 300 L 520 300 L 700 220 L 1120 220"/>
        <path d="M 520 300 L 640 460 L 1060 460"/>
        <path d="M 300 300 L 300 470"/>
        <path d="M 860 220 L 860 330 L 1160 330"/>
      </g>
      ${[[300, 470], [640, 460], [1060, 460], [1160, 330]].map(([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="13" fill="${P.accent}"/>`).join('')}
      ${note(140, 520, 'elke stip is een poldergemaal dat erin uitkomt')}`,
  },
  {
    id: '17-boezem-vol',
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
      ${label(1230, 364, 'maximum', 22, P.accent, 'end')}`,
  },
  {
    id: '18-doorsnede-3',
    caption: 'Van de boezem moet het water nog één keer omhoog.',
    svg: `${sheet()}${doorsnede(3)}
      ${label(70, 110, 'Stap twee', 38)}`,
  },
  {
    id: '19-kanaal',
    caption: 'Aan het eind van het Noordzeekanaal staat het grootste gemaal van Europa.',
    svg: `${sheet()}
      ${label(70, 110, 'Het Noordzeekanaal', 38)}
      <rect x="120" y="300" width="900" height="120" fill="${P.clean}"/>
      <rect x="1080" y="250" width="180" height="220" fill="${P.deep}"/>
      ${dike(1050, 250, 470, 34, 74)}
      ${pump(1050, 178)}
      ${note(140, 470, 'kanaal')}
      ${note(1120, 500, 'Noordzee')}
      ${arrow(1010, 360, 1090, 360, P.accent, 6)}`,
  },
  {
    id: '20-schaal',
    caption: 'Ongeveer tweehonderdzestig kubieke meter water per seconde.',
    svg: `${sheet()}
      ${label(70, 130, '260 m³ / seconde', 56)}
      ${note(70, 176, 'gemaal IJmuiden — nog na te lopen, punt 4')}
      <rect x="70" y="260" width="420" height="190" rx="6"
        fill="${P.clean}" stroke="${P.ink}" stroke-width="3"/>
      ${Array.from({ length: 7 }, (_, i) =>
        `<line x1="${70 + (i + 1) * 52}" y1="260" x2="${70 + (i + 1) * 52}" y2="450"
          stroke="${P.paper}" stroke-width="2" opacity="0.5"/>`).join('')}
      ${label(90, 492, 'één olympisch zwembad = 2500 m³', 24)}
      ${arrow(530, 355, 650, 355)}
      <circle cx="830" cy="355" r="106" fill="none" stroke="${P.ink}" stroke-width="5"/>
      <line x1="830" y1="355" x2="830" y2="269" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>
      <line x1="830" y1="355" x2="893" y2="390" stroke="${P.accent}" stroke-width="5" stroke-linecap="round"/>
      ${label(1120, 340, '10 sec', 34, P.ink, 'middle')}
      ${note(1120, 380, 'per zwembad', 'middle')}`,
  },
  {
    id: '21-getij',
    caption: 'Bij laag water loopt het er vanzelf uit. Pas als de zee te hoog staat, gaan de pompen aan.',
    svg: `${sheet()}
      ${label(70, 110, 'Spuien of pompen', 38)}
      ${note(70, 152, 'het getij bepaalt wat er nodig is')}
      ${label(70, 248, 'LAAG WATER', 26)}
      ${note(70, 278, 'het loopt er vanzelf uit')}
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
    id: '22-keten',
    caption: 'Stoep, buis, sloot, polder, gemaal, boezem, gemaal, zee. Zeven stappen, waarvan twee een pomp.',
    svg: `${sheet()}
      ${label(70, 130, 'De hele keten', 38)}
      ${['stoep', 'buis', 'sloot', 'polder', 'gemaal', 'boezem', 'gemaal', 'zee']
        .map((t, i) => {
          const x = 110 + i * 151
          const pomp = t === 'gemaal'
          return `<circle cx="${x}" cy="330" r="21"
              fill="${pomp ? P.accent : P.ink}"/>
            ${label(x, 386, t, 19, P.ink, 'middle')}`
        }).join('')}
      ${[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const van = 131 + i * 151, tot = 240 + i * 151
        return `<line x1="${van}" y1="330" x2="${tot}" y2="330"
            stroke="${P.line}" stroke-width="4"/>
          <circle cx="${(van + tot) / 2}" cy="330" r="15" fill="${P.paper}"
            stroke="${P.line}" stroke-width="2"/>
          ${label((van + tot) / 2, 337, String(i + 1), 17, P.soft, 'middle')}`
      }).join('')}
      ${note(110, 470, 'acht plekken, zeven stappen ertussen')}
      ${note(110, 498, 'twee van die stappen zijn een pomp — oranje')}`,
  },
  {
    id: '23-bui-te-groot',
    caption: 'Een rioolstelsel wordt niet gebouwd om elke denkbare bui te verwerken.',
    svg: `${sheet()}
      ${label(70, 110, 'De bui past niet', 38)}
      ${rain(160, 200, 26, 4)}
      ${pipe(140, 400, 1000, 70, P.mixed, 'de buis')}
      ${arrow(300, 330, 300, 390, P.clean, 6)}
      ${arrow(640, 330, 640, 390, P.clean, 6)}
      ${arrow(980, 330, 980, 390, P.clean, 6)}
      ${note(140, 520, 'er wordt gebouwd op een bui met een bepaalde kans')}
      ${note(140, 548, 'en op een frequentie waarop water op straat aanvaardbaar is')}`,
  },
  {
    id: '24-overstort',
    caption: 'Kan de buis het niet meer aan, dan gaat een mengsel van regen- en afvalwater het oppervlaktewater in.',
    svg: `${sheet()}
      ${label(70, 110, 'DE OVERSTORT', 36)}
      ${note(70, 152, 'de rem die voorkomt dat het bij jou binnenkomt')}
      ${pipe(70, 330, 700, 80, P.mixed, 'gemengd stelsel — vol')}
      <path d="M 770 330 L 900 330 L 900 470 L 1210 470 L 1210 542 L 820 542 L 820 410 L 770 410 Z"
        fill="${P.mixed}" stroke="${P.ink}" stroke-width="3"/>
      ${arrow(940, 506, 1150, 506, P.accent, 6)}
      ${label(1210, 450, 'de sloot in', 26, P.ink, 'end')}
      ${rain(150, 220, 18, 2)}`,
  },
  {
    id: '25-kleurverschil',
    caption: 'Het is dezelfde bui. Het is een andere buis.',
    svg: `${sheet()}
      ${label(70, 110, 'Dezelfde bui', 38)}
      ${label(70, 250, 'GESCHEIDEN', 26)}
      ${pipe(70, 280, 480, 64, P.clean)}
      ${arrow(560, 312, 660, 312, P.clean, 6)}
      <circle cx="740" cy="312" r="46" fill="${P.clean}"/>
      ${note(800, 318, 'schoon regenwater de sloot in')}
      ${label(70, 430, 'GEMENGD', 26)}
      ${pipe(70, 460, 480, 64, P.mixed)}
      ${arrow(560, 492, 660, 492, P.mixed, 6)}
      <circle cx="740" cy="492" r="46" fill="${P.mixed}"/>
      ${note(800, 498, 'een mengsel de sloot in')}`,
  },
  {
    id: '26-gemaal-stil',
    caption: 'Dat is het systeem dat kiest waar het water blijft staan.',
    svg: `${sheet()}
      ${dike(640, 350, 548, 44, 126)}
      ${water(80, 430, 490, 118, P.clean)}
      ${water(760, 384, 480, 164, P.clean)}
      ${pump(640, 288, false)}
      ${label(70, 120, 'Liever hier dan overal', 38)}
      ${note(70, 164, 'het gemaal staat stil, en dat is een keuze')}
      ${label(100, 410, 'polder', 24)}
      ${label(1160, 364, 'boezem', 24, P.ink, 'end')}
      ${note(100, 590, '')}`,
  },
  {
    id: '27-aanname',
    caption: 'Elk onderdeel is gedimensioneerd op een aanname: zoveel water, zo vaak.',
    svg: `${sheet()}
      ${label(70, 110, 'De aanname', 38)}
      ${note(70, 152, 'geen natuurkunde — een afspraak')}
      <line x1="150" y1="540" x2="1180" y2="540" stroke="${P.ink}" stroke-width="3"/>
      <line x1="150" y1="540" x2="150" y2="240" stroke="${P.ink}" stroke-width="3"/>
      ${note(150, 218, 'zwaarte van de bui')}
      ${note(1180, 576, 'hoe vaak', 'end')}
      <line x1="150" y1="400" x2="1180" y2="400"
        stroke="${P.line}" stroke-width="3" stroke-dasharray="10 7"/>
      ${label(1170, 382, 'waar de buis op is berekend', 20, P.soft, 'end')}
      <path d="M 200 516 C 420 508 560 470 700 420 C 840 370 980 320 1140 300"
        fill="none" stroke="${P.clean}" stroke-width="5"/>`,
  },
  {
    id: '28-verschuift',
    caption: 'Valt er vaker een bui die zwaarder is, dan verandert er niets aan de buis.',
    svg: `${sheet()}
      ${label(70, 110, 'De lijn verschuift', 38)}
      <line x1="150" y1="540" x2="1180" y2="540" stroke="${P.ink}" stroke-width="3"/>
      <line x1="150" y1="540" x2="150" y2="240" stroke="${P.ink}" stroke-width="3"/>
      ${note(1180, 576, 'hoe vaak', 'end')}
      <line x1="150" y1="400" x2="1180" y2="400"
        stroke="${P.line}" stroke-width="3" stroke-dasharray="10 7"/>
      <path d="M 200 516 C 420 508 560 470 700 420 C 840 370 980 320 1140 300"
        fill="none" stroke="${P.clean}" stroke-width="5" opacity="0.4"/>
      <path d="M 200 494 C 420 482 560 430 700 370 C 840 310 980 268 1140 252"
        fill="none" stroke="${P.accent}" stroke-width="5" stroke-dasharray="12 8"/>
      ${arrow(700, 412, 700, 366, P.accent, 5)}
      ${note(730, 390, 'vaker boven de streep')}`,
  },
  {
    id: '29-natte-voeten',
    caption: 'Er verandert alleen iets aan hoe vaak je natte voeten hebt.',
    svg: `${sheet()}
      ${label(70, 130, 'Niet de capaciteit', 40, P.soft)}
      <line x1="70" y1="150" x2="620" y2="150" stroke="${P.soft}" stroke-width="4"/>
      ${label(70, 260, 'De frequentie', 40)}
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `
        <rect x="${90 + i * 96}" y="${400 - (i % 4) * 14}" width="58" height="${60 + (i % 4) * 14}"
          fill="${i % 4 === 3 ? P.accent : P.line}" opacity="${i % 4 === 3 ? 1 : 0.55}"/>`).join('')}
      ${note(90, 500, 'elke staaf een jaar; oranje is een jaar met water op straat')}`,
  },
  {
    id: '30-frequentie',
    caption: 'Niet de capaciteit van het grootste gemaal van Europa. De frequentie.',
    svg: `${sheet()}
      ${label(640, 330, 'FREQUENTIE', 88, P.ink, 'middle')}
      <line x1="360" y1="370" x2="920" y2="370" stroke="${P.accent}" stroke-width="6"/>
      ${note(640, 430, 'dat is het getal waar je naar moet kijken', 'middle')}`,
  },
  {
    id: '31-volgende',
    caption: 'Volgende week: waar de stroom uit je stopcontact vandaan komt, en hoeveel ervan onderweg verdwijnt.',
    svg: `${sheet()}
      ${label(70, 130, 'Volgende week', 38)}
      <g stroke="${P.ink}" stroke-width="5" fill="none">
        <path d="M 180 300 L 180 460 M 140 300 L 220 300 M 150 340 L 210 340"/>
        <path d="M 560 300 L 560 460 M 520 300 L 600 300 M 530 340 L 590 340"/>
        <path d="M 940 300 L 940 460 M 900 300 L 980 300 M 910 340 L 970 340"/>
      </g>
      <path d="M 180 316 q 190 60 380 0 q 190 -60 380 0 q 120 38 220 20"
        fill="none" stroke="${P.accent}" stroke-width="5"/>
      ${note(70, 520, 'hoogspanning, en het verlies onderweg')}`,
  },
]
