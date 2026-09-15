// De beelden van NL-001.
//
// TWEEDE VERSIE. De eerste was technisch juist en zag eruit als een werkblad:
// beige raster, platte vlakken, geen licht. Correct is niet hetzelfde als
// bekeken worden.
//
// De richting komt uit het onderwerp zelf. Nederlandse landschapschilders
// hebben hier vierhonderd jaar geleden het antwoord op gevonden: leg de
// horizon laag, geef de lucht vier vijfde van het doek, en laat het water het
// licht dragen. Dat is precies wat dit onderwerp is — een laag land onder een
// grote lucht, waar water het enige is dat beweegt.
//
// Dus: schemering, diepte in lagen, en warm licht op één plek. Het gemaal is
// het enige dat brandt, en daarmee weet je zonder uitleg waar je moet kijken.
//
// Wat er technisch anders is aan deze versie:
//   - verlopen en gelaagde diepte in plaats van vlakke vulling;
//   - textuur (korrel, riet, grasrand) zodat vlakken niet dood zijn;
//   - een scène mag BEWEGEN: geef hem `frames` en schrijf `svg` als functie
//     van t, dan rendert build.mjs hem als beeldenreeks.

export const PALETTE = {
  nacht: '#081520', diep: '#0e2333', mid: '#16384f', ver: '#27536b',
  horizon: '#5b8798', gloed: '#c98a54', vuur: '#e8a04a',
  water: '#14394f', glans: '#7fc0d8', schuim: '#bfe3ee',
  land: '#0a1a25', aarde: '#13232c', klei: '#1d3038',
  bot: '#f2efe4', zacht: '#9fb6c0', flauw: '#5d7885',
  accent: '#e2673c', koel: '#54a8c9',
}

const P = PALETTE
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const n2 = (v) => Number(v).toFixed(1)

/** Deterministische ruis: dezelfde scène ziet er elke render hetzelfde uit. */
function rnd(seed) {
  let s = seed
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648
}

/**
 * De lucht. Vier vijfde van het beeld, met de warmte onderaan bij de horizon —
 * zo staat het licht waar het hoort en niet in het midden van de lucht.
 */
const lucht = (id = 'l') => `
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${P.nacht}"/>
      <stop offset="34%"  stop-color="${P.diep}"/>
      <stop offset="62%"  stop-color="${P.mid}"/>
      <stop offset="84%"  stop-color="${P.ver}"/>
      <stop offset="100%" stop-color="${P.horizon}"/>
    </linearGradient>
    <radialGradient id="${id}-zon" cx="0.68" cy="0.94" r="0.55">
      <stop offset="0%"   stop-color="${P.gloed}" stop-opacity="0.62"/>
      <stop offset="55%"  stop-color="${P.gloed}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${P.gloed}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#${id})"/>
  <rect width="1280" height="720" fill="url(#${id}-zon)"/>`

/** Wolkenbanden: lange, lage strepen. Nederlandse luchten, geen schapenwolkjes. */
const wolken = (seed = 7) => {
  const r = rnd(seed)
  const banden = Array.from({ length: 7 }, () => {
    const y = 90 + r() * 230
    const x = -160 + r() * 1400
    const w = 380 + r() * 620
    const h = 6 + r() * 13
    const o = 0.03 + r() * 0.07
    return `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${n2(w / 2)}" ry="${n2(h)}"
      fill="${P.horizon}" opacity="${o.toFixed(3)}"/>`
  }).join('')
  return `<defs><filter id="wz${seed}" x="-25%" y="-200%" width="150%" height="500%">
      <feGaussianBlur stdDeviation="16"/>
    </filter></defs>
    <g filter="url(#wz${seed})">${banden}</g>`
}

/** Korrel over het hele beeld. Haalt de digitale vlakheid eraf. */
const korrel = (seed = 3, aantal = 420) => {
  const r = rnd(seed)
  return `<g>${Array.from({ length: aantal }, () => {
    const x = r() * 1280, y = r() * 720
    return `<circle cx="${n2(x)}" cy="${n2(y)}" r="${(0.5 + r() * 1.1).toFixed(2)}"
      fill="${P.bot}" opacity="${(0.02 + r() * 0.05).toFixed(3)}"/>`
  }).join('')}</g>`
}

const vignet = () => `
  <defs>
    <radialGradient id="vig" cx="0.5" cy="0.48" r="0.78">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#vig)"/>`

/** Basis voor elke scène: lucht, wolken. Korrel en vignet gaan er bovenop. */
const doek = (seed = 7) => `${lucht()}${wolken(seed)}`
const afwerking = (seed = 3) => `${korrel(seed)}${vignet()}`

/**
 * Water met een oppervlak dat licht vangt.
 *
 * `fase` schuift de glans op, zodat hetzelfde water in een bewegende scène
 * leeft zonder dat de vorm verandert.
 */
function water(x, y, w, h, opts = {}) {
  const { tint = P.water, glans = 0.5, fase = 0, seed = 11 } = opts
  const r = rnd(seed)
  const id = `w${Math.round(x)}${Math.round(y)}`
  const strepen = Array.from({ length: Math.max(3, Math.round(h / 26)) }, (_, i) => {
    const yy = y + 10 + i * 24 + Math.sin(fase * 6.283 + i) * 2
    if (yy > y + h - 4) return ''
    const bx = x + 20 + r() * (w * 0.5)
    const bw = 40 + r() * (w * 0.42)
    const o = (0.05 + r() * 0.16) * glans
    return `<rect x="${n2(bx)}" y="${n2(yy)}" width="${n2(Math.min(bw, w - 30))}" height="2"
      rx="1" fill="${P.glans}" opacity="${o.toFixed(3)}"/>`
  }).join('')

  const golf = []
  for (let i = 0; i <= w; i += 16) {
    golf.push(`${i === 0 ? 'M' : 'L'} ${n2(x + i)} ${n2(y + Math.sin((i / 46) + fase * 6.283) * 2.6)}`)
  }

  return `
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${P.glans}" stop-opacity="0.30"/>
        <stop offset="14%" stop-color="${tint}"/>
        <stop offset="100%" stop-color="${P.nacht}"/>
      </linearGradient>
    </defs>
    <path d="${golf.join(' ')} L ${n2(x + w)} ${n2(y + h)} L ${n2(x)} ${n2(y + h)} Z"
      fill="url(#${id})"/>
    ${strepen}
    <path d="${golf.join(' ')}" fill="none" stroke="${P.schuim}" stroke-width="1.6"
      opacity="${(0.34 * glans + 0.1).toFixed(2)}"/>`
}

/** Grondlichaam met bodemlagen. Een doorsnede hoort eruit te zien als aarde. */
function grond(x, y, w, h) {
  const r = rnd(29)
  const lagen = [
    [0, 0.30, P.klei], [0.30, 0.62, P.aarde], [0.62, 1, P.land],
  ].map(([a, b, kleur]) =>
    `<rect x="${n2(x)}" y="${n2(y + h * a)}" width="${n2(w)}" height="${n2(h * (b - a) + 1)}"
      fill="${kleur}"/>`).join('')
  const korrels = Array.from({ length: Math.round(w / 7) }, () =>
    `<circle cx="${n2(x + r() * w)}" cy="${n2(y + 6 + r() * (h - 8))}"
      r="${(0.6 + r() * 1.5).toFixed(2)}" fill="${P.bot}" opacity="${(0.03 + r() * 0.07).toFixed(3)}"/>`).join('')
  return `<defs><linearGradient id="gr${Math.round(y)}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${P.ver}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${P.klei}" stop-opacity="0"/>
    </linearGradient></defs>
    ${lagen}${korrels}
    <rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="26" fill="url(#gr${Math.round(y)})"/>`
}

/** Grasrand: korte streepjes op een lijn. Geeft een dijk een bovenkant. */
const gras = (x1, x2, y, seed = 5, dicht = 5) => {
  const r = rnd(seed)
  return Array.from({ length: Math.round((x2 - x1) / dicht) }, (_, i) => {
    const x = x1 + i * dicht + r() * 2
    const hh = 3 + r() * 6
    return `<line x1="${n2(x)}" y1="${n2(y)}" x2="${n2(x + (r() - 0.5) * 3)}" y2="${n2(y - hh)}"
      stroke="${P.horizon}" stroke-width="1.1" opacity="${(0.2 + r() * 0.3).toFixed(2)}"/>`
  }).join('')
}

/** Dijk als landvorm: talud, kruin, grasrand. Geen trapezium met een randje. */
function dijk(cx, kruin, voet, halfKruin, halfVoet) {
  return `
    <path d="M ${n2(cx - halfVoet)} ${n2(voet)}
             C ${n2(cx - halfVoet * 0.6)} ${n2(voet - (voet - kruin) * 0.35)}
               ${n2(cx - halfKruin * 1.5)} ${n2(kruin + 8)}
               ${n2(cx - halfKruin)} ${n2(kruin)}
             L ${n2(cx + halfKruin)} ${n2(kruin)}
             C ${n2(cx + halfKruin * 1.5)} ${n2(kruin + 8)}
               ${n2(cx + halfVoet * 0.6)} ${n2(voet - (voet - kruin) * 0.35)}
               ${n2(cx + halfVoet)} ${n2(voet)} Z"
      fill="${P.aarde}"/>
    ${gras(cx - halfKruin, cx + halfKruin, kruin, cx)}`
}

/**
 * Het gemaal: een bakstenen blok met brandende ramen.
 *
 * Dit is het enige warme licht in de hele video. Daarmee weet de kijker zonder
 * één woord uitleg waar hij moet kijken, en dat is precies de rol die dit
 * gebouw in het verhaal speelt.
 */
function gemaal(cx, basis, schaal = 1, aan = true) {
  const b = 92 * schaal, h = 78 * schaal
  const top = basis - h
  const ramen = [0, 1, 2].map((i) => {
    const rx = cx - b / 2 + 14 * schaal + i * (22 * schaal)
    return `<rect x="${n2(rx)}" y="${n2(top + 20 * schaal)}"
      width="${n2(12 * schaal)}" height="${n2(20 * schaal)}" rx="1"
      fill="${aan ? P.vuur : P.nacht}" opacity="${aan ? 0.95 : 0.6}"/>`
  }).join('')
  return `
    ${aan ? `<defs><radialGradient id="g${Math.round(cx)}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${P.vuur}" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="${P.vuur}" stop-opacity="0"/>
    </radialGradient></defs>
    <ellipse cx="${n2(cx)}" cy="${n2(top + h * 0.45)}" rx="${n2(b * 1.5)}" ry="${n2(h * 1.3)}"
      fill="url(#g${Math.round(cx)})"/>` : ''}
    <path d="M ${n2(cx - b / 2)} ${n2(basis)} L ${n2(cx - b / 2)} ${n2(top + 12 * schaal)}
             L ${n2(cx)} ${n2(top - 6 * schaal)} L ${n2(cx + b / 2)} ${n2(top + 12 * schaal)}
             L ${n2(cx + b / 2)} ${n2(basis)} Z"
      fill="${P.nacht}" stroke="${P.flauw}" stroke-width="1.5" stroke-opacity="0.5"/>
    ${ramen}`
}

/** Regen. `t` laat hem vallen. */
const regen = (x, y, w, h, t = 0, seed = 17, aantal = 70) => {
  const r = rnd(seed)
  return Array.from({ length: aantal }, () => {
    const bx = x + r() * w
    const start = r()
    const yy = y + ((start + t * 1.4) % 1) * h
    return `<line x1="${n2(bx)}" y1="${n2(yy)}" x2="${n2(bx - 2)}" y2="${n2(yy + 13)}"
      stroke="${P.glans}" stroke-width="1.4" opacity="${(0.18 + r() * 0.3).toFixed(2)}"/>`
  }).join('')
}

const titel = (x, y, tekst, grootte = 46) => `
  <text x="${x}" y="${y}" font-family="Archivo, 'Arial Narrow', Helvetica, sans-serif"
    font-weight="700" font-size="${grootte}" fill="${P.bot}"
    letter-spacing="-0.5">${esc(tekst)}</text>`

const kopje = (x, y, tekst) => `
  <text x="${x}" y="${y}" font-family="Archivo, Helvetica, sans-serif" font-weight="700"
    font-size="17" fill="${P.accent}" letter-spacing="3">${esc(tekst.toUpperCase())}</text>`

const bijschrift = (x, y, tekst, anker = 'start', kleur = P.zacht) => `
  <text x="${x}" y="${y}" font-family="Archivo, Helvetica, sans-serif" font-size="20"
    fill="${kleur}" text-anchor="${anker}">${esc(tekst)}</text>`

/** Groot getal: het enige moment waarop typografie het beeld mag zijn. */
const groot = (x, y, tekst, grootte = 130, kleur = P.bot, anker = 'start') => `
  <text x="${x}" y="${y}" font-family="Archivo, 'Arial Narrow', Helvetica, sans-serif"
    font-weight="700" font-size="${grootte}" fill="${kleur}" text-anchor="${anker}"
    letter-spacing="-4">${esc(tekst)}</text>`

const pijl = (x1, y1, x2, y2, kleur = P.accent, dik = 5, o = 1) => {
  const hk = Math.atan2(y2 - y1, x2 - x1), l = 17
  return `<g opacity="${o}">
    <line x1="${n2(x1)}" y1="${n2(y1)}" x2="${n2(x2)}" y2="${n2(y2)}"
      stroke="${kleur}" stroke-width="${dik}" stroke-linecap="round"/>
    <path d="M ${n2(x2)} ${n2(y2)}
             L ${n2(x2 - l * Math.cos(hk - 0.42))} ${n2(y2 - l * Math.sin(hk - 0.42))}
             L ${n2(x2 - l * Math.cos(hk + 0.42))} ${n2(y2 - l * Math.sin(hk + 0.42))} Z"
      fill="${kleur}"/></g>`
}

/** Buis in doorsnede, met inhoud die je kunt zien. */
const buis = (x, y, w, h, vulling, tekst) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"
    fill="${P.nacht}" stroke="${P.flauw}" stroke-width="2" stroke-opacity="0.6"/>
  <rect x="${x + 4}" y="${y + 5}" width="${w - 8}" height="${h - 10}" rx="${(h - 10) / 2}"
    fill="${vulling}" opacity="0.85"/>
  ${tekst ? `<text x="${x + 24}" y="${y + h / 2 + 7}" font-family="Archivo, Helvetica, sans-serif"
    font-size="20" font-weight="700" fill="${P.bot}">${esc(tekst)}</text>` : ''}`

/**
 * De dragende doorsnede: polder laag, boezem hoger, zee het hoogst.
 *
 * `stap` bepaalt hoeveel er al staat, `t` laat het water leven. Alles blijft
 * boven y=560, want daaronder komt de ondertiteling.
 */
function doorsnede(stap, t = 0) {
  const polder = 470, boezem = 386, zee = 322, voet = 556
  let s = ''

  s += grond(0, voet, 1280, 164)
  s += water(46, polder, 372, voet - polder, { fase: t, seed: 21 })
  s += kopje(52, polder - 34, 'polder')
  s += bijschrift(52, polder - 10, 'vast peil')

  if (stap >= 2) {
    s += dijk(468, boezem - 18, voet, 26, 224)
    s += water(516, boezem, 300, voet - boezem, { fase: t + 0.3, seed: 33 })
    s += kopje(524, boezem - 34, 'boezem')
    s += bijschrift(524, boezem - 10, 'geen vast peil')
    s += gemaal(468, boezem - 26, 0.62)
    s += pijl(430, polder - 6, 430, boezem + 8, P.accent, 5)
  }

  if (stap >= 3) {
    s += dijk(878, zee - 18, voet, 26, 236)
    s += water(926, zee, 340, voet - zee, { tint: P.ver, fase: t + 0.6, glans: 0.9, seed: 45 })
    s += kopje(936, zee - 34, 'zee')
    s += gemaal(878, zee - 26, 0.62)
    s += pijl(838, boezem - 6, 838, zee + 8, P.accent, 5)
  }

  if (stap >= 2) {
    s += `<line x1="46" y1="${polder}" x2="1250" y2="${polder}" stroke="${P.schuim}"
      stroke-width="1.2" stroke-dasharray="6 9" opacity="0.32"/>`
  }
  if (stap >= 3) {
    s += `<line x1="516" y1="${boezem}" x2="1250" y2="${boezem}" stroke="${P.schuim}"
      stroke-width="1.2" stroke-dasharray="6 9" opacity="0.32"/>`
  }
  return s
}

/** Stoeprand met de buis eronder, in doorsnede. */
const straat = (y) => `
  ${grond(0, y, 1280, 720 - y)}
  <rect x="0" y="${y - 14}" width="1280" height="16" fill="${P.klei}"/>
  <rect x="0" y="${y - 16}" width="1280" height="3" fill="${P.horizon}" opacity="0.4"/>
  <rect x="612" y="${y - 40}" width="26" height="26" fill="${P.aarde}"
    stroke="${P.flauw}" stroke-width="1.5" stroke-opacity="0.5"/>`

/** Silhouet van Nederland. Eigen tekening, geen kaartdata. */
const kaart = (vul, laag) => `
  <g transform="translate(470,70) scale(1.02)">
    <path d="M 168 12 L 214 40 L 236 96 L 262 150 L 276 214 L 268 286
             L 288 330 L 262 392 L 206 436 L 140 468 L 84 452 L 46 404
             L 28 336 L 44 268 L 34 196 L 62 132 L 106 66 Z"
      fill="${vul}" stroke="${P.horizon}" stroke-width="2.5" stroke-linejoin="round"
      stroke-opacity="0.75"/>
    ${laag ? `<path d="M 106 66 L 62 132 L 34 196 L 44 268 L 28 336
             L 46 404 L 84 452 L 140 468 L 168 420 L 120 372 L 96 300
             L 110 222 L 92 150 Z" fill="${laag}" opacity="0.9"/>` : ''}
  </g>`

export const SCENES = [
  {
    id: '01-druppel', caption: 'Regenwater in Nederland gaat niet naar beneden.',
    frames: 26,
    svg: (t) => `${doek(4)}
      ${straat(470)}
      ${regen(0, -60, 1280, 560, t, 19, 90)}
      ${water(0, 470, 1280, 40, { fase: t, glans: 0.7, seed: 8 })}
      ${pijl(640, 180, 640, 330, P.zacht, 5, 0.55)}
      ${bijschrift(672, 270, 'je verwacht: omlaag')}
      ${afwerking(4)}`,
  },
  {
    id: '02-omhoog', caption: 'Het gaat omhoog.',
    frames: 22,
    svg: (t) => `${doek(6)}
      ${straat(470)}
      ${water(0, 470, 1280, 40, { fase: t, glans: 0.8, seed: 9 })}
      <g opacity="0.22">${pijl(420, 180, 420, 330, P.zacht, 5)}</g>
      <line x1="384" y1="176" x2="456" y2="336" stroke="${P.accent}" stroke-width="7"/>
      ${pijl(820, 400 - t * 40, 820, 180 - t * 40, P.accent, 8)}
      ${titel(880, 300, 'omhoog', 62)}
      ${afwerking(6)}`,
  },
  {
    id: '03-emmer', caption: 'Gooi een emmer water op straat en hij zakt weg. Maar niet naar de zee.',
    svg: `${doek(8)}
      ${grond(0, 470, 1280, 250)}
      ${water(46, 486, 1188, 70, { fase: 0.2, seed: 12 })}
      ${kopje(60, 190, 'beneden is geen optie')}
      ${titel(60, 250, 'Het laagste punt', 52)}
      ${bijschrift(60, 292, 'ligt lager dan de zee')}
      ${pijl(940, 300, 940, 452, P.koel, 5, 0.8)}
      ${afwerking(8)}`,
  },
  {
    id: '04-kaart-nap', caption: 'Zesentwintig procent van Nederland ligt onder zeeniveau.',
    svg: `${doek(10)}
      ${kaart(P.diep, P.water)}
      ${groot(70, 300, '26%', 150, P.bot)}
      ${titel(70, 356, 'onder zeeniveau', 32)}
      ${bijschrift(70, 396, 'nog na te lopen — bronnencheck 1', 'start', P.flauw)}
      ${afwerking(10)}`,
  },
  {
    id: '05-kaart-overstroom', caption: 'Negenenvijftig procent kan onder water lopen bij een overstroming.',
    svg: `${doek(12)}
      ${kaart(P.mid, P.ver)}
      ${groot(70, 300, '59%', 150, P.koel)}
      ${titel(70, 356, 'overstroombaar', 32)}
      ${bijschrift(70, 396, 'dit getal staat ter discussie', 'start', P.accent)}
      ${afwerking(12)}`,
  },
  {
    id: '06-trap', caption: 'Tussen jouw stoep en de zee staat een reeks pompen die het water trapsgewijs omhoog brengt.',
    svg: `${doek(14)}
      ${[0, 1, 2, 3].map((i) => {
        const y = 490 - i * 74, x = 90 + i * 290
        return `${grond(x, y, 292, 720 - y)}
          ${water(x + 8, y + 8, 276, 60, { fase: i * 0.2, seed: 50 + i })}
          ${gemaal(x + 292, y, 0.5)}
          ${pijl(x + 240, y - 4, x + 240, y - 58, P.accent, 4)}`
      }).join('')}
      ${kopje(60, 130, 'trapsgewijs')}
      ${titel(60, 186, 'Elke trede is een pomp', 46)}
      ${afwerking(14)}`,
  },
  {
    id: '07-doorsnede-leeg', caption: 'Ik loop de hele reeks met je af. Van de tegel voor je deur tot de zee.',
    svg: `${doek(16)}${doorsnede(1, 0.1)}
      ${titel(60, 150, 'De doorsnede', 48)}
      ${bijschrift(60, 190, 'deze tekening blijft de hele video staan')}
      ${afwerking(16)}`,
  },
  {
    id: '08-stoeprand', caption: 'Bij de stoeprand splitst het al.',
    frames: 20,
    svg: (t) => `${doek(18)}
      ${straat(360)}
      ${regen(0, -40, 1280, 380, t, 23, 60)}
      ${buis(120, 470, 1040, 62, P.klei, 'onder de straat')}
      ${pijl(340, 380, 340, 458, P.koel, 4)}
      ${pijl(920, 380, 920, 458, P.koel, 4)}
      ${titel(60, 210, 'De stoeprand', 48)}
      ${afwerking(18)}`,
  },
  {
    id: '09-gemengd', caption: 'Een gemengd stelsel: één buis, waarin regenwater en afvalwater samenkomen.',
    svg: `${doek(20)}
      ${kopje(60, 120, 'gemengd stelsel')}
      ${titel(60, 176, 'Eén buis', 48)}
      ${bijschrift(60, 216, 'de meeste Nederlandse woonwijken')}
      ${pijl(330, 290, 440, 400, P.koel, 5)}
      ${pijl(920, 290, 810, 400, P.gloed, 5)}
      ${bijschrift(220, 272, 'regen van je dak')}
      ${bijschrift(1060, 272, 'afvalwater', 'end')}
      ${buis(120, 430, 1040, 74, P.klei, 'alles samen')}
      ${bijschrift(1160, 556, 'naar de zuivering', 'end', P.flauw)}
      ${afwerking(20)}`,
  },
  {
    id: '10-gescheiden', caption: 'Een gescheiden stelsel: twee buizen. Dat verschil is het belangrijkste in deze video.',
    svg: `${doek(22)}
      ${kopje(60, 120, 'gescheiden stelsel')}
      ${titel(60, 176, 'Twee buizen', 48)}
      ${buis(120, 300, 1040, 66, P.water, 'regenwater')}
      ${buis(120, 430, 1040, 66, P.klei, 'afvalwater')}
      ${bijschrift(1160, 288, 'naar de sloot', 'end', P.flauw)}
      ${bijschrift(1160, 548, 'naar de zuivering', 'end', P.flauw)}
      ${afwerking(22)}`,
  },
  {
    id: '11-vergelijk', caption: 'Dat verschil lijkt technisch. Aan het eind van deze video zie je waarom het dat niet is.',
    svg: `${doek(24)}
      ${titel(60, 150, 'Eén buis of twee', 48)}
      ${buis(60, 260, 520, 76, P.klei, 'samen')}
      ${buis(700, 236, 500, 58, P.water, 'regen')}
      ${buis(700, 320, 500, 58, P.klei, 'afval')}
      <line x1="640" y1="210" x2="640" y2="470" stroke="${P.flauw}" stroke-width="1.5" opacity="0.5"/>
      ${bijschrift(60, 440, 'onthoud dit — het komt terug in segment vijf', 'start', P.accent)}
      ${afwerking(24)}`,
  },
  {
    id: '12-polder', caption: 'Een polder is een bak. Dijken eromheen, en een waterstand die kunstmatig op peil blijft.',
    svg: `${doek(26)}
      ${grond(0, 500, 1280, 220)}
      ${dijk(150, 396, 524, 30, 230)}
      ${dijk(1130, 396, 524, 30, 230)}
      ${water(276, 432, 728, 92, { fase: 0.4, seed: 55 })}
      ${kopje(60, 130, 'de polder')}
      ${titel(60, 186, 'Een bak met een peil', 46)}
      <line x1="276" y1="432" x2="1004" y2="432" stroke="${P.accent}"
        stroke-width="2.5" stroke-dasharray="8 7" opacity="0.8"/>
      ${bijschrift(620, 412, 'peil', 'middle', P.accent)}
      ${afwerking(26)}`,
  },
  {
    id: '13-doorsnede-1', caption: 'De polder is het laagste punt. Alles komt hier samen.',
    svg: `${doek(28)}${doorsnede(1, 0.3)}
      ${pijl(230, 230, 230, 420, P.koel, 5, 0.8)}
      ${bijschrift(258, 330, 'hierheen stroomt het')}
      ${afwerking(28)}`,
  },
  {
    id: '14-sloten', caption: 'Al het water verzamelt zich op het laagste punt. Daar staat een poldergemaal.',
    svg: `${doek(30)}
      ${grond(0, 500, 1280, 220)}
      <g stroke="${P.water}" stroke-width="9" fill="none" stroke-linecap="round" opacity="0.9">
        ${[0, 1, 2, 3, 4].map((i) =>
          `<path d="M ${120 + i * 26} ${250 + i * 16} Q 400 ${360 + i * 10} 600 470"/>`).join('')}
        ${[0, 1, 2, 3, 4].map((i) =>
          `<path d="M ${1160 - i * 26} ${250 + i * 16} Q 880 ${360 + i * 10} 680 470"/>`).join('')}
      </g>
      ${water(560, 462, 160, 60, { fase: 0.5, glans: 0.9, seed: 61 })}
      ${gemaal(640, 462, 0.8)}
      ${kopje(60, 130, 'het laagste punt')}
      ${titel(60, 186, 'Hier staat het gemaal', 46)}
      ${afwerking(30)}`,
  },
  {
    id: '15-doorsnede-2', caption: 'Een poldergemaal tilt water uit de polder omhoog en zet het in de boezem.',
    frames: 24,
    svg: (t) => `${doek(32)}${doorsnede(2, t)}
      ${titel(60, 150, 'Stap één: omhoog', 48)}
      ${afwerking(32)}`,
  },
  {
    id: '16-boezemnet', caption: 'De boezem is een net van kanalen dat het water van tientallen polders opvangt.',
    svg: `${doek(34)}
      ${grond(0, 540, 1280, 180)}
      <g stroke="${P.water}" stroke-width="11" fill="none" stroke-linecap="round">
        <path d="M 120 320 L 500 320 L 690 236 L 1140 236"/>
        <path d="M 500 320 L 640 470 L 1060 470"/>
        <path d="M 290 320 L 290 480"/>
        <path d="M 850 236 L 850 348 L 1170 348"/>
      </g>
      <g stroke="${P.glans}" stroke-width="2" fill="none" opacity="0.35">
        <path d="M 120 316 L 500 316 L 690 232 L 1140 232"/>
      </g>
      ${[[290, 480], [640, 470], [1060, 470], [1170, 348]].map(([x, y]) =>
        gemaal(x, y, 0.42)).join('')}
      ${kopje(60, 130, 'de boezem')}
      ${titel(60, 186, 'Geen meer. Een net.', 46)}
      ${bijschrift(60, 610, 'elk brandend gebouw is een gemaal dat erin uitkomt')}
      ${afwerking(34)}`,
  },
  {
    id: '17-boezem-vol', caption: 'Maar een wachtkamer heeft een plafond. Staat de boezem te hoog, dan vallen de poldergemalen stil.',
    svg: `${doek(36)}
      ${grond(0, 540, 1280, 180)}
      ${dijk(468, 330, 544, 26, 226)}
      ${water(46, 452, 372, 88, { fase: 0.2, glans: 0.4, seed: 71 })}
      ${water(520, 372, 720, 168, { fase: 0.6, glans: 0.8, seed: 73 })}
      ${gemaal(468, 336, 0.62, false)}
      ${kopje(60, 130, 'het gemaal staat stil')}
      ${titel(60, 186, 'De wachtkamer is vol', 46)}
      <line x1="520" y1="372" x2="1250" y2="372" stroke="${P.accent}"
        stroke-width="3" stroke-dasharray="9 7"/>
      ${bijschrift(1250, 352, 'maximum', 'end', P.accent)}
      ${bijschrift(60, 610, 'dat is geen storing')}
      ${afwerking(36)}`,
  },
  {
    id: '18-doorsnede-3', caption: 'Van de boezem moet het water nog één keer omhoog.',
    frames: 24,
    svg: (t) => `${doek(38)}${doorsnede(3, t)}
      ${titel(60, 150, 'Stap twee', 48)}
      ${afwerking(38)}`,
  },
  {
    id: '19-kanaal', caption: 'Aan het eind van het Noordzeekanaal staat het grootste gemaal van Europa.',
    svg: `${doek(40)}
      ${grond(0, 540, 1280, 180)}
      ${water(60, 380, 940, 160, { fase: 0.3, seed: 77 })}
      ${dijk(1040, 326, 544, 28, 210)}
      ${water(1120, 300, 160, 240, { tint: P.mid, fase: 0.7, glans: 0.9, seed: 79 })}
      ${gemaal(1040, 330, 0.95)}
      ${kopje(60, 130, 'het noordzeekanaal')}
      ${titel(60, 186, 'Het eindpunt', 46)}
      ${bijschrift(90, 600, 'kanaal')}
      ${bijschrift(1250, 600, 'Noordzee', 'end')}
      ${afwerking(40)}`,
  },
  {
    id: '20-schaal', caption: 'Ongeveer tweehonderdzestig kubieke meter water per seconde.',
    svg: `${doek(42)}
      ${groot(60, 250, '260', 168, P.bot)}
      ${titel(340, 250, 'm³ per seconde', 44)}
      ${bijschrift(62, 300, 'gemaal IJmuiden — nog na te lopen', 'start', P.flauw)}
      ${water(60, 380, 480, 150, { fase: 0.4, glans: 0.9, seed: 83 })}
      ${bijschrift(62, 566, 'één olympisch zwembad = 2500 m³')}
      ${pijl(580, 455, 690, 455, P.accent, 6)}
      ${groot(760, 480, '10 sec', 86, P.accent)}
      ${bijschrift(762, 526, 'per zwembad, de hele dag door')}
      ${afwerking(42)}`,
  },
  {
    id: '21-getij', caption: 'Bij laag water loopt het er vanzelf uit. Pas als de zee te hoog staat, gaan de pompen aan.',
    frames: 28,
    svg: (t) => {
      const h = Math.sin(t * 6.283) * 0.5 + 0.5
      return `${doek(44)}
      ${grond(0, 540, 1280, 180)}
      ${dijk(640, 326, 544, 28, 238)}
      ${water(40, 400, 560, 140, { fase: t, seed: 85 })}
      ${water(760, 470 - h * 150, 500, 70 + h * 150, { tint: P.mid, fase: t + 0.4, glans: 0.9, seed: 87 })}
      ${gemaal(640, 330, 0.85, h > 0.55)}
      ${h > 0.55
        ? pijl(640, 420, 640, 352, P.accent, 7)
        : pijl(700, 430, 800, 490, P.koel, 7)}
      ${kopje(60, 130, h > 0.55 ? 'hoog water — pompen' : 'laag water — spuien')}
      ${titel(60, 186, 'Het getij beslist', 46)}
      ${afwerking(44)}`
    },
  },
  {
    id: '22-keten', caption: 'Stoep, buis, sloot, polder, gemaal, boezem, gemaal, zee. Zeven stappen, waarvan twee een pomp.',
    svg: `${doek(46)}
      ${titel(60, 150, 'De hele keten', 48)}
      ${['stoep', 'buis', 'sloot', 'polder', 'gemaal', 'boezem', 'gemaal', 'zee']
        .map((naam, i) => {
          const x = 108 + i * 152, pomp = naam === 'gemaal'
          return `<circle cx="${x}" cy="350" r="${pomp ? 26 : 19}"
              fill="${pomp ? P.vuur : P.ver}" opacity="${pomp ? 1 : 0.9}"/>
            ${pomp ? `<circle cx="${x}" cy="350" r="40" fill="none" stroke="${P.vuur}"
              stroke-width="2" opacity="0.35"/>` : ''}
            ${bijschrift(x, 418, naam, 'middle', pomp ? P.bot : P.zacht)}`
        }).join('')}
      ${[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = 134 + i * 152, b = 234 + i * 152, m = (a + b) / 2
        return `<line x1="${a}" y1="350" x2="${b}" y2="350" stroke="${P.flauw}"
            stroke-width="2.5" opacity="0.6"/>
          <text x="${m}" y="${332}" font-family="Archivo, Helvetica, sans-serif"
            font-size="16" fill="${P.flauw}" text-anchor="middle">${i + 1}</text>`
      }).join('')}
      ${bijschrift(60, 510, 'acht plekken, zeven stappen — twee daarvan zijn een pomp')}
      ${afwerking(46)}`,
  },
  {
    id: '23-bui-te-groot', caption: 'Een rioolstelsel wordt niet gebouwd om elke denkbare bui te verwerken.',
    frames: 22,
    svg: (t) => `${doek(48)}
      ${straat(430)}
      ${regen(0, -60, 1280, 470, t, 91, 140)}
      ${buis(120, 468, 1040, 66, P.klei)}
      ${titel(60, 200, 'De bui past niet', 48)}
      ${bijschrift(60, 244, 'er wordt gebouwd op een bui met een bepaalde kans')}
      ${afwerking(48)}`,
  },
  {
    id: '24-overstort', caption: 'Kan de buis het niet meer aan, dan gaat een mengsel van regen- en afvalwater het oppervlaktewater in.',
    svg: `${doek(50)}
      ${grond(0, 500, 1280, 220)}
      ${kopje(60, 130, 'de overstort')}
      ${titel(60, 186, 'De rem', 48)}
      ${bijschrift(60, 226, 'die voorkomt dat het bij jou binnenkomt')}
      ${buis(60, 300, 660, 78, P.klei, 'vol')}
      <path d="M 720 300 L 840 300 L 840 430 L 1210 430 L 1210 500 L 770 500 L 770 378 L 720 378 Z"
        fill="${P.klei}" stroke="${P.flauw}" stroke-width="2" stroke-opacity="0.5"/>
      ${water(860, 508, 400, 40, { tint: P.klei, glans: 0.4, seed: 93 })}
      ${pijl(900, 466, 1120, 466, P.accent, 6)}
      ${bijschrift(1250, 400, 'de sloot in', 'end', P.accent)}
      ${afwerking(50)}`,
  },
  {
    id: '25-kleurverschil', caption: 'Het is dezelfde bui. Het is een andere buis.',
    svg: `${doek(52)}
      ${titel(60, 150, 'Dezelfde bui', 48)}
      ${kopje(60, 250, 'gescheiden')}
      ${buis(60, 270, 460, 66, P.water)}
      ${pijl(540, 303, 640, 303, P.koel, 6)}
      <circle cx="720" cy="303" r="44" fill="${P.water}"/>
      ${bijschrift(790, 310, 'schoon regenwater de sloot in')}
      ${kopje(60, 430, 'gemengd')}
      ${buis(60, 450, 460, 66, P.klei)}
      ${pijl(540, 483, 640, 483, P.gloed, 6)}
      <circle cx="720" cy="483" r="44" fill="${P.klei}"/>
      ${bijschrift(790, 490, 'een mengsel de sloot in', 'start', P.accent)}
      ${afwerking(52)}`,
  },
  {
    id: '26-gemaal-stil', caption: 'Dat is het systeem dat kiest waar het water blijft staan.',
    svg: `${doek(54)}
      ${grond(0, 540, 1280, 180)}
      ${dijk(640, 334, 544, 26, 232)}
      ${water(60, 424, 500, 116, { fase: 0.2, glans: 0.4, seed: 95 })}
      ${water(740, 376, 500, 164, { fase: 0.6, seed: 97 })}
      ${gemaal(640, 340, 0.7, false)}
      ${kopje(60, 130, 'een keuze, geen storing')}
      ${titel(60, 186, 'Liever hier dan overal', 46)}
      ${bijschrift(70, 404, 'polder')}
      ${bijschrift(1240, 356, 'boezem', 'end')}
      ${afwerking(54)}`,
  },
  {
    id: '27-aanname', caption: 'Elk onderdeel is gedimensioneerd op een aanname: zoveel water, zo vaak.',
    svg: `${doek(56)}
      ${kopje(60, 130, 'geen natuurkunde')}
      ${titel(60, 186, 'Een afspraak', 48)}
      <line x1="150" y1="530" x2="1180" y2="530" stroke="${P.flauw}" stroke-width="2"/>
      <line x1="150" y1="530" x2="150" y2="270" stroke="${P.flauw}" stroke-width="2"/>
      ${bijschrift(150, 252, 'zwaarte van de bui', 'start', P.flauw)}
      ${bijschrift(1180, 566, 'hoe vaak', 'end', P.flauw)}
      <line x1="150" y1="400" x2="1180" y2="400" stroke="${P.zacht}"
        stroke-width="2" stroke-dasharray="10 8" opacity="0.6"/>
      ${bijschrift(1170, 382, 'waar de buis op is berekend', 'end', P.zacht)}
      <path d="M 200 510 C 420 502 560 464 700 414 C 840 364 980 322 1140 302"
        fill="none" stroke="${P.koel}" stroke-width="5"/>
      ${afwerking(56)}`,
  },
  {
    id: '28-verschuift', caption: 'Valt er vaker een bui die zwaarder is, dan verandert er niets aan de buis.',
    svg: `${doek(58)}
      ${titel(60, 150, 'De lijn verschuift', 48)}
      <line x1="150" y1="530" x2="1180" y2="530" stroke="${P.flauw}" stroke-width="2"/>
      <line x1="150" y1="530" x2="150" y2="270" stroke="${P.flauw}" stroke-width="2"/>
      ${bijschrift(1180, 566, 'hoe vaak', 'end', P.flauw)}
      <line x1="150" y1="400" x2="1180" y2="400" stroke="${P.zacht}"
        stroke-width="2" stroke-dasharray="10 8" opacity="0.5"/>
      <path d="M 200 510 C 420 502 560 464 700 414 C 840 364 980 322 1140 302"
        fill="none" stroke="${P.koel}" stroke-width="4" opacity="0.35"/>
      <path d="M 200 488 C 420 476 560 424 700 364 C 840 304 980 262 1140 246"
        fill="none" stroke="${P.accent}" stroke-width="5" stroke-dasharray="14 9"/>
      ${pijl(700, 406, 700, 360, P.accent, 5)}
      ${bijschrift(730, 386, 'vaker boven de streep', 'start', P.accent)}
      ${afwerking(58)}`,
  },
  {
    id: '29-natte-voeten', caption: 'Er verandert alleen iets aan hoe vaak je natte voeten hebt.',
    svg: `${doek(60)}
      ${titel(60, 160, 'Niet de capaciteit', 44)}
      <line x1="60" y1="176" x2="560" y2="176" stroke="${P.flauw}" stroke-width="3" opacity="0.7"/>
      ${titel(60, 250, 'De frequentie', 48)}
      ${Array.from({ length: 12 }, (_, i) => {
        const nat = i % 4 === 3
        const h = 70 + (i % 4) * 16
        return `<rect x="${86 + i * 96}" y="${500 - h}" width="56" height="${h}" rx="2"
          fill="${nat ? P.vuur : P.ver}" opacity="${nat ? 1 : 0.55}"/>`
      }).join('')}
      <line x1="60" y1="502" x2="1230" y2="502" stroke="${P.flauw}" stroke-width="2"/>
      ${bijschrift(60, 548, 'elke staaf een jaar — oranje is een jaar met water op straat')}
      ${afwerking(60)}`,
  },
  {
    id: '30-frequentie', caption: 'Niet de capaciteit van het grootste gemaal van Europa. De frequentie.',
    svg: `${doek(62)}
      ${grond(0, 600, 1280, 120)}
      ${water(0, 560, 1280, 48, { fase: 0.3, glans: 0.7, seed: 99 })}
      ${groot(640, 340, 'FREQUENTIE', 104, P.bot, 'middle')}
      <line x1="330" y1="382" x2="950" y2="382" stroke="${P.accent}" stroke-width="6"/>
      ${bijschrift(640, 442, 'dat is het getal waar je naar moet kijken', 'middle')}
      ${afwerking(62)}`,
  },
  {
    id: '31-volgende', caption: 'Volgende week: waar de stroom uit je stopcontact vandaan komt, en hoeveel ervan onderweg verdwijnt.',
    svg: `${doek(64)}
      ${grond(0, 540, 1280, 180)}
      <g stroke="${P.nacht}" stroke-width="7" fill="none" stroke-linecap="round">
        ${[200, 620, 1040].map((x) => `
          <path d="M ${x} 540 L ${x} 250 M ${x - 46} 262 L ${x + 46} 262
                   M ${x - 34} 310 L ${x + 34} 310"/>`).join('')}
      </g>
      <path d="M 200 270 Q 410 350 620 270 Q 830 190 1040 270 Q 1160 312 1270 296"
        fill="none" stroke="${P.vuur}" stroke-width="3" opacity="0.8"/>
      ${kopje(60, 130, 'volgende week')}
      ${titel(60, 186, 'Waar de stroom blijft', 46)}
      ${afwerking(64)}`,
  },
]
