// De openingsscènes als vectortekening, in de huisstijl uit
// knowledge/huisstijl.yaml. Elke scène is figuurvrij van constructie: er zit
// geen mens in, want er is er geen getekend.
//
// Dit is géén generatief beeld. Het is de doelstijl, met de hand gezet, zodat
// er iets te beoordelen valt voordat er een beeldgenerator aan te pas komt.

export const PALETTE = {
  deep: '#0d2620', green: '#14332b', mid: '#1d4438',
  bone: '#f2efe6', gold: '#c9a961', sand: '#d8c9a3',
  dawn1: '#20403a', dawn2: '#7a6a45', dawn3: '#c9a961',
}

const sky = (id, from, via, to) => `
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="58%" stop-color="${via}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="${id}-sun" cx="0.72" cy="0.78" r="0.42">
      <stop offset="0%" stop-color="${PALETTE.gold}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${PALETTE.gold}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#${id})"/>
  <rect width="1280" height="720" fill="url(#${id}-sun)"/>`

/** Koepel met een halve cirkel en een aanzet, geen kant-en-klare vorm. */
const dome = (cx, base, r) =>
  `<path d="M ${cx - r} ${base} a ${r} ${r * 1.08} 0 0 1 ${r * 2} 0 Z" />`

const grain = (n, seed = 1) => {
  let s = seed
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648
  return Array.from({ length: n }, () => {
    const x = rnd() * 1280, y = 430 + rnd() * 290
    const r = 0.8 + rnd() * 2.6
    const o = 0.05 + rnd() * 0.35
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${PALETTE.bone}" opacity="${o.toFixed(2)}"/>`
  }).join('')
}

export const SCENES = [
  {
    id: '01-skyline',
    caption: 'De bekendste moskee ter wereld had geen minaret.',
    svg: `${sky('s1', PALETTE.deep, PALETTE.dawn1, PALETTE.dawn2)}
      <circle cx="946" cy="486" r="74" fill="${PALETTE.gold}" opacity="0.32"/>
      <g fill="${PALETTE.deep}" opacity="0.5">
        <rect x="0" y="500" width="1280" height="220"/>
        ${dome(216, 500, 44)}${dome(1096, 500, 38)}
        <rect x="702" y="318" width="13" height="182" rx="6"/>
        ${dome(708, 318, 11)}
      </g>
      <g fill="${PALETTE.deep}">
        <rect x="0" y="540" width="1280" height="180"/>
        ${dome(452, 540, 86)}
        <rect x="322" y="470" width="15" height="70"/>
        <rect x="574" y="470" width="15" height="70"/>
        <rect x="826" y="196" width="19" height="344" rx="9"/>
        ${dome(835, 196, 16)}
        <rect x="826" y="286" width="19" height="5" opacity="0.45" fill="${PALETTE.gold}"/>
        <rect x="820" y="278" width="31" height="4" opacity="0.3" fill="${PALETTE.gold}"/>
      </g>`,
  },
  {
    id: '02-leeg',
    caption: 'Niet omdat er geen geld was. Dat was een keuze.',
    svg: `${sky('s2', PALETTE.deep, PALETTE.dawn1, PALETTE.dawn2)}
      <circle cx="946" cy="486" r="74" fill="${PALETTE.gold}" opacity="0.32"/>
      <rect x="0" y="540" width="1280" height="180" fill="${PALETTE.deep}"/>
      <rect x="0" y="537" width="1280" height="3" fill="${PALETTE.gold}" opacity="0.24"/>`,
  },
  {
    id: '03-palmstammen',
    caption: 'Palmstammen als pilaren. Een dak van palmbladeren.',
    svg: `${sky('s3', PALETTE.green, PALETTE.dawn1, PALETTE.dawn3)}
      <g fill="${PALETTE.deep}">
        ${[120, 340, 560, 790, 1010, 1210].map((x, i) => {
          const w = 42 + (i % 3) * 8
          return `<path d="M ${x} 720 L ${x + 6} 210 l ${w} 0 L ${x + w + 2} 720 Z"/>`
        }).join('')}
        <path d="M 0 210 q 320 -46 640 -10 q 320 36 640 -12 l 0 -52 L 0 148 Z"/>
      </g>
      <g stroke="${PALETTE.sand}" stroke-width="2" opacity="0.14" fill="none">
        ${Array.from({ length: 16 }, (_, i) =>
          `<path d="M 120 ${250 + i * 28} q 560 -14 1090 -6"/>`).join('')}
      </g>`,
  },
  {
    id: '04-zand',
    caption: 'De vloer: zand.',
    svg: `${sky('s4', PALETTE.green, PALETTE.mid, PALETTE.dawn2)}
      <path d="M 0 430 q 340 -40 660 6 q 320 44 620 -14 L 1280 720 L 0 720 Z" fill="${PALETTE.deep}" opacity="0.55"/>
      ${grain(520, 7)}
      <path d="M 0 470 q 360 30 700 -12 q 300 -38 580 18" stroke="${PALETTE.gold}" stroke-width="2" fill="none" opacity="0.28"/>`,
  },
  {
    id: '05-plattegrond',
    caption: 'De afmetingen liggen rond de dertig bij dertig meter.',
    svg: `<rect width="1280" height="720" fill="${PALETTE.deep}"/>
      <g stroke="${PALETTE.mid}" stroke-width="1" opacity="0.5">
        ${Array.from({ length: 26 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="720"/>`).join('')}
        ${Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="1280" y2="${i * 50}"/>`).join('')}
      </g>
      <g stroke="${PALETTE.gold}" fill="none" stroke-width="3">
        <rect x="390" y="150" width="500" height="420"/>
        <path d="M 390 400 L 890 400" stroke-dasharray="10 9" opacity="0.6"/>
        ${[430, 510, 590, 670, 750, 830].map((x) =>
          `<circle cx="${x}" cy="470" r="6" fill="${PALETTE.gold}" stroke="none" opacity="0.85"/>`).join('')}
      </g>
      <g stroke="${PALETTE.bone}" stroke-width="1.5" opacity="0.45">
        <path d="M 390 110 L 890 110"/><path d="M 390 100 L 390 120"/><path d="M 890 100 L 890 120"/>
        <path d="M 930 150 L 930 570"/><path d="M 920 150 L 940 150"/><path d="M 920 570 L 940 570"/>
      </g>`,
  },
  {
    id: '06-kompas',
    caption: 'De gebedsrichting veranderde.',
    svg: `${sky('s6', PALETTE.deep, PALETTE.green, PALETTE.mid)}
      <g transform="translate(640 370)">
        <circle r="220" fill="none" stroke="${PALETTE.mid}" stroke-width="2"/>
        <circle r="176" fill="none" stroke="${PALETTE.mid}" stroke-width="1" opacity="0.6"/>
        ${Array.from({ length: 48 }, (_, i) => {
          const a = (i * 7.5 * Math.PI) / 180
          const long = i % 6 === 0
          const r1 = long ? 190 : 206, r2 = 220
          return `<line x1="${(Math.sin(a) * r1).toFixed(1)}" y1="${(-Math.cos(a) * r1).toFixed(1)}" x2="${(Math.sin(a) * r2).toFixed(1)}" y2="${(-Math.cos(a) * r2).toFixed(1)}" stroke="${PALETTE.bone}" stroke-width="${long ? 2.5 : 1}" opacity="${long ? 0.6 : 0.3}"/>`
        }).join('')}
        <path d="M 0 -150 L 26 26 L 0 -8 L -26 26 Z" fill="${PALETTE.bone}" opacity="0.35"/>
        <g transform="rotate(146)"><path d="M 0 -150 L 26 26 L 0 -8 L -26 26 Z" fill="${PALETTE.gold}"/></g>
        <path d="M 0 -120 a 120 120 0 0 1 68 38" fill="none" stroke="${PALETTE.gold}" stroke-width="3" stroke-dasharray="7 8" opacity="0.75"/>
      </g>`,
  },
  {
    id: '07-daklijn',
    caption: 'De oproep tot het gebed werd gedaan vanaf een dak.',
    svg: `${sky('s7', PALETTE.deep, PALETTE.dawn1, PALETTE.dawn3)}
      <g transform="translate(330 214)" fill="none" stroke="${PALETTE.gold}" stroke-width="2.5">
        ${[0, 1, 2, 3, 4].map((i) =>
          `<circle r="${70 + i * 78}" opacity="${(0.5 - i * 0.09).toFixed(2)}"/>`).join('')}
      </g>
      <g fill="${PALETTE.deep}">
        <rect x="0" y="440" width="1280" height="280"/>
        <rect x="200" y="344" width="260" height="100"/>
        <rect x="194" y="332" width="272" height="14"/>
        <rect x="540" y="398" width="180" height="46"/>
        <rect x="770" y="376" width="220" height="68"/>
        <rect x="1040" y="408" width="200" height="36"/>
      </g>
      <rect x="200" y="330" width="260" height="4" fill="${PALETTE.gold}" opacity="0.55"/>`,
  },
  {
    id: '08-ruimte',
    caption: 'Als je dat weet, kijk je anders naar het gebouw om de hoek.',
    svg: `<rect width="1280" height="720" fill="${PALETTE.green}"/>
      <defs>
        <linearGradient id="pool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${PALETTE.gold}" stop-opacity="0.30"/>
          <stop offset="100%" stop-color="${PALETTE.gold}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g fill="${PALETTE.deep}">
        ${[0, 1, 2].map((i) => {
          const x = 160 + i * 340
          return `<path d="M ${x} 620 L ${x} 330 a 130 150 0 0 1 260 0 L ${x + 260} 620 Z" opacity="0.0"/>
                  <path d="M ${x - 26} 620 L ${x - 26} 330 a 156 176 0 0 1 312 0 L ${x + 286} 620 L ${x + 226} 620 L ${x + 226} 340 a 96 116 0 0 0 -192 0 L ${x + 34} 620 Z"/>`
        }).join('')}
      </g>
      <path d="M 0 620 L 1280 620 L 1280 720 L 0 720 Z" fill="${PALETTE.deep}"/>
      <path d="M 300 330 L 470 620 L 130 620 Z" fill="url(#pool)"/>
      <path d="M 980 330 L 1150 620 L 810 620 Z" fill="url(#pool)"/>`,
  },
]
