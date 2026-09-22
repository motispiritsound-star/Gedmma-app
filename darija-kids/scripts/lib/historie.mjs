/**
 * Het tekenwerk van De sleutels van Marokko.
 *
 * Deze reeks is voor lezers van negen tot vijftien, en die leeftijd prikt
 * door een plaatjesboek heen. Wat hier getekend wordt is daarom geen
 * illustratie bij het verhaal maar het soort beeld dat in een echt
 * geschiedenisboek staat: een kaart met de plek erop, een tijdbalk waarop je
 * ziet hoe ver terug dit is, een plaat in inktlijn van het gebouw waar het
 * gebeurt. Een tekening die zich voordoet als een foto verliest het van een
 * foto; een tekening die zich voordoet als een kaart wint het.
 *
 * Echte opnames gaan hier altijd voor. Zodra er in
 * `store/sleutels/platen/<deel>/` foto's staan, gebruikt `make-sleutels.mjs`
 * die en blijft dit bestand achter de hand voor de kaart, de tijdbalk en de
 * sleutel zelf — want die drie bestaan nergens als foto.
 */

/** De kleuren van de reeks: nachtblauw, goud, terracotta, perkament. */
export const H = {
  inkt: '#151d2e',
  nacht: '#1b2540',
  goud: '#c8952f',
  lichtGoud: '#e6bb62',
  rood: '#a8352c',
  perkament: '#f4ead7',
  zand: '#e2d2b2',
  steen: '#8d7b62',
  groen: '#2f6b4f',
}

/* ── De sleutel ─────────────────────────────────────────────────────────── */

/**
 * De sleutel met de achtpuntige ster.
 *
 * De khatam — de achtpuntige ster — is een echt en eeuwenoud Marokkaans
 * motief; de sleutel die hem als kop draagt is verzonnen en dat staat
 * achterin ook met zoveel woorden. Hij loopt door alle vijftien delen heen en
 * is daarom het enige beeld dat in elk deel terugkomt.
 */
export const khatam = (cx, cy, r, vul, lijn = 'none', dikte = 0) => {
  const punten = []
  for (let i = 0; i < 16; i++) {
    const straal = i % 2 === 0 ? r : r * 0.54
    const hoek = (Math.PI / 8) * i - Math.PI / 2
    punten.push(`${(cx + Math.cos(hoek) * straal).toFixed(1)},${(cy + Math.sin(hoek) * straal).toFixed(1)}`)
  }
  return `<polygon points="${punten.join(' ')}" fill="${vul}" stroke="${lijn}" stroke-width="${dikte}" stroke-linejoin="round"/>`
}

export const sleutel = (x, y, s = 1, kleur = H.goud) => `<g transform="translate(${x} ${y}) scale(${s})">
  ${khatam(0, -92, 58, kleur)}
  ${khatam(0, -92, 26, '#00000033')}
  <circle cx="0" cy="-92" r="17" fill="#0000004d"/>
  <rect x="-9" y="-40" width="18" height="128" rx="5" fill="${kleur}"/>
  <rect x="-30" y="46" width="30" height="15" rx="4" fill="${kleur}"/>
  <rect x="-30" y="72" width="22" height="15" rx="4" fill="${kleur}"/>
  <path d="M-9 -40 L9 -40 L14 -30 L-14 -30 Z" fill="${kleur}"/>
</g>`

/* ── Randen en ornament ─────────────────────────────────────────────────── */

/** Een zellige-band: het ruitmotief dat op elke Marokkaanse muur terugkomt. */
export const zellige = (x, y, breed, hoog, kleur = H.goud) => {
  const stap = hoog
  let d = ''
  for (let i = 0; i * stap < breed + stap; i++) {
    const l = x + i * stap
    d += `M${l} ${y + hoog / 2} L${l + stap / 2} ${y} L${l + stap} ${y + hoog / 2} L${l + stap / 2} ${y + hoog} Z `
  }
  return `<g clip-path="inset(0)"><path d="${d}" fill="none" stroke="${kleur}" stroke-width="2" opacity=".85"/></g>`
}

/** Het hoekornament van de omslag — een kwart zellige-rozet. */
export const hoekje = (x, y, s, draai, kleur = H.goud) => `<g transform="translate(${x} ${y}) rotate(${draai}) scale(${s})" fill="none" stroke="${kleur}" stroke-width="2.6" stroke-linecap="round">
  <path d="M0 92 A92 92 0 0 1 92 0" opacity=".45"/>
  <path d="M0 64 A64 64 0 0 1 64 0"/>
  <path d="M0 22 L0 6 A6 6 0 0 1 6 0 L22 0" opacity=".8"/>
  ${khatam(30, 30, 12, kleur, 'none', 0)}
</g>`

/* ── De kaart ───────────────────────────────────────────────────────────── */

/**
 * Marokko, met de plek van dit deel erop.
 *
 * De kustlijn hieronder is een vereenvoudiging: genoeg punten om het land te
 * herkennen, weinig genoeg om als pentekening te lezen. De projectie is plat
 * — op deze schaal ziet niemand het verschil, en een kind moet het land
 * herkennen, niet nameten.
 */
const GRENS = [
  [-5.92, 35.79], [-5.35, 35.58], [-5.27, 35.18], [-4.30, 35.20], [-3.90, 35.25],
  [-3.05, 35.23], [-2.42, 35.10], [-1.79, 34.75], [-1.73, 34.10], [-1.30, 32.10],
  [-1.00, 32.00], [-1.15, 30.80], [-2.50, 29.90], [-3.65, 29.60], [-4.85, 29.00],
  [-6.00, 27.70], [-8.67, 27.66], [-8.67, 27.30], [-8.80, 26.00], [-12.00, 23.45],
  [-13.00, 23.00], [-13.00, 21.33], [-17.00, 21.33], [-17.10, 21.00], [-16.50, 22.00],
  [-15.95, 23.70], [-15.30, 24.60], [-14.85, 25.10], [-14.80, 26.10], [-13.80, 26.75],
  [-13.20, 27.70], [-12.00, 28.05], [-11.40, 28.05], [-10.60, 28.70], [-10.00, 29.30],
  [-9.85, 30.00], [-9.65, 30.42], [-9.30, 31.05], [-9.80, 31.50], [-9.25, 32.30],
  [-8.50, 33.00], [-7.60, 33.60], [-6.85, 34.02], [-6.35, 34.40], [-6.15, 35.00],
]

/** De Atlas: drie ruggen, als bergribbels op een oude kaart. */
const ATLAS = [
  [[-9.4, 30.7], [-8.4, 31.0], [-7.4, 31.2], [-6.3, 31.7], [-5.2, 32.2], [-4.2, 32.6]],
  [[-8.6, 32.4], [-7.6, 32.8], [-6.6, 33.2], [-5.6, 33.5], [-4.6, 33.8], [-3.6, 34.1]],
  [[-5.6, 35.1], [-4.6, 35.0], [-3.6, 34.9], [-2.9, 34.8]],
]

const KAART = { lon: [-17.6, -0.6], lat: [20.5, 36.3], w: 1000, h: 1180 }
const px = ([lon, lat]) => [
  ((lon - KAART.lon[0]) / (KAART.lon[1] - KAART.lon[0])) * KAART.w,
  ((KAART.lat[1] - lat) / (KAART.lat[1] - KAART.lat[0])) * KAART.h,
]
/** Een bergrug als rij kleine kepers — zo tekent een kaart een gebergte. */
const ribbels = (rug) => {
  const p = rug.map(px)
  let d = ''
  for (let i = 0; i < p.length - 1; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[i + 1]
    for (let k = 0; k < 3; k++) {
      const t = (k + 0.5) / 3
      const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t
      const h = 16 + (k % 2) * 6
      d += `M${(x - h).toFixed(1)} ${(y + h * 0.55).toFixed(1)} L${x.toFixed(1)} ${(y - h * 0.7).toFixed(1)} L${(x + h).toFixed(1)} ${(y + h * 0.55).toFixed(1)} `
    }
  }
  return `<path d="${d}"/>`
}

const lijn = (punten) => punten.map(px).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')

/** Waar elk deel speelt. Deel 15 speelt op twee plekken; de eerste telt. */
export const PLEKKEN = {
  1: { naam: 'Walili', lonlat: [-5.55, 34.07] },
  2: { naam: 'Tanger', lonlat: [-5.80, 35.77] },
  3: { naam: 'Fes', lonlat: [-5.00, 34.03] },
  4: { naam: 'Marrakech', lonlat: [-7.99, 31.63] },
  5: { naam: 'Ceuta', lonlat: [-5.32, 35.89] },
  6: { naam: 'Tanger', lonlat: [-5.80, 35.77] },
  7: { naam: 'Fes', lonlat: [-5.00, 34.03] },
  8: { naam: 'Ksar el-Kebir', lonlat: [-5.90, 35.00] },
  9: { naam: 'Marrakech', lonlat: [-7.99, 31.63] },
  10: { naam: 'Essaouira', lonlat: [-9.77, 31.51] },
  11: { naam: 'Salé', lonlat: [-6.80, 34.05] },
  12: { naam: 'Het Rif', lonlat: [-3.93, 35.15] },
  13: { naam: 'Rabat', lonlat: [-6.84, 34.02] },
  14: { naam: 'Rabat', lonlat: [-6.84, 34.02] },
  15: { naam: 'Hoge Atlas', lonlat: [-7.92, 31.14] },
}

/** De steden die op elke kaart staan, zodat de lezer zich oriënteert. */
const STEDEN = [
  ['Tanger', -5.80, 35.77, 'end'], ['Fes', -5.00, 34.03, 'start'],
  ['Rabat', -6.84, 34.02, 'end'], ['Casablanca', -7.60, 33.60, 'end'],
  ['Marrakech', -7.99, 31.63, 'end'], ['Agadir', -9.65, 30.42, 'end'],
  ['Laayoune', -13.20, 27.15, 'start'], ['Oujda', -1.90, 34.68, 'start'],
]

export const kaart = (nummer) => {
  const plek = PLEKKEN[nummer]
  const [mx, my] = plek ? px(plek.lonlat) : [0, 0]
  return `<svg viewBox="0 0 1000 1180" xmlns="http://www.w3.org/2000/svg">
  <rect width="1000" height="1180" fill="${H.perkament}"/>
  <path d="${lijn(GRENS)} Z" fill="${H.zand}" stroke="${H.inkt}" stroke-width="3.5" stroke-linejoin="round"/>
  <g fill="none" stroke="${H.steen}" stroke-width="2.6" stroke-linecap="round" opacity=".8">
    ${ATLAS.map((rug) => ribbels(rug)).join('')}
  </g>
  <g font-family="Georgia,serif" font-style="italic" fill="#7e6e58" font-size="24"
     paint-order="stroke" stroke="${H.zand}" stroke-width="7" stroke-linejoin="round">
    <text x="500" y="474" transform="rotate(-20 500 474)">Hoge Atlas</text>
    <text x="536" y="346" transform="rotate(-23 536 346)">Midden-Atlas</text>
    <text x="772" y="150">Rif</text>
  </g>
  <g font-family="Georgia,serif" font-style="italic" fill="#6f8aa3"
     paint-order="stroke" stroke="${H.perkament}" stroke-width="7" stroke-linejoin="round">
    <text x="120" y="330" font-size="30" transform="rotate(-24 120 330)">Atlantische Oceaan</text>
    <text x="790" y="54" font-size="25">Middellandse Zee</text>
  </g>
  <g font-family="Georgia,serif" font-size="25" fill="${H.inkt}">
    ${STEDEN.filter(([naam]) => naam !== plek?.naam).map(([naam, lon, lat, anker]) => {
      const [x, y] = px([lon, lat])
      const dx = anker === 'end' ? -14 : 14
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${H.inkt}"/>
        <text x="${(x + dx).toFixed(1)}" y="${(y + 9).toFixed(1)}" text-anchor="${anker}">${naam}</text>`
    }).join('')}
  </g>
  ${plek ? `<g>
    <circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="34" fill="none" stroke="${H.rood}" stroke-width="5"/>
    <circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="50" fill="none" stroke="${H.rood}" stroke-width="2" opacity=".5"/>
    ${khatam(mx, my, 15, H.rood)}
    <text x="${mx.toFixed(1)}" y="${(my + 86).toFixed(1)}" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="33" fill="${H.rood}">${plek.naam}</text>
  </g>` : ''}
  <g transform="translate(880 1060)" stroke="${H.inkt}" stroke-width="3" fill="none">
    <circle r="40"/><path d="M0 -52 L0 52 M-52 0 L52 0" opacity=".4"/>
    <polygon points="0,-46 12,0 0,46 -12,0" fill="${H.inkt}" stroke="none"/>
    <text y="-58" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="${H.inkt}" stroke="none">N</text>
  </g>
</svg>`
}

/* ── De tijdbalk ────────────────────────────────────────────────────────── */

/**
 * Tweeduizend jaar op één streep, met dit deel eruit gelicht.
 *
 * Niet op schaal: de jaren staan op gelijke afstand, want anders verdwijnen
 * de eerste vijf delen in één punt aan de linkerkant en verliest de lezer
 * juist wat hij hier moet zien — dat het verhaal doorloopt tot bij hem thuis.
 */
export const tijdbalk = (reeks, nu) => {
  const top = 54, stap = 92, spil = 300
  const h = top + stap * (reeks.length - 1) + 70
  return `<svg viewBox="0 0 1000 ${h}" xmlns="http://www.w3.org/2000/svg">
  <line x1="${spil}" y1="${top}" x2="${spil}" y2="${top + stap * (reeks.length - 1)}" stroke="${H.zand}" stroke-width="7"/>
  ${reeks.map((d, i) => {
    const y = top + i * stap
    const dit = d.nummer === nu
    return `${dit ? `<rect x="24" y="${y - 34}" width="952" height="68" rx="10" fill="#f8efdd"/>` : ''}
      <text x="${spil - 42}" y="${y + 9}" text-anchor="end" font-family="Georgia,serif" font-size="${dit ? 30 : 26}"
            font-weight="${dit ? 'bold' : 'normal'}" fill="${dit ? H.rood : '#6d6152'}">${d.jaar.replace(/ – .*/, '')}</text>
      ${dit
        ? `<circle cx="${spil}" cy="${y}" r="17" fill="${H.rood}"/><circle cx="${spil}" cy="${y}" r="28" fill="none" stroke="${H.rood}" stroke-width="4"/>`
        : `<circle cx="${spil}" cy="${y}" r="10" fill="${H.steen}"/>`}
      <text x="${spil + 54}" y="${y - 2}" font-family="'Baloo 2',system-ui,sans-serif" font-weight="800" font-size="${dit ? 32 : 28}"
            fill="${dit ? H.rood : H.inkt}">${d.titel}</text>
      <text x="${spil + 54}" y="${y + 28}" font-family="Georgia,serif" font-style="italic" font-size="21" fill="#8a7a63">Deel ${d.nummer} · ${d.waar}</text>`
  }).join('')}
</svg>`
}

/* ── De platen ──────────────────────────────────────────────────────────── */

const hemel = (id, boven, onder) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${boven}"/><stop offset="1" stop-color="${onder}"/></linearGradient></defs>`

/**
 * Arcering.
 *
 * Een vlak vlak leest als een schema; dezelfde vorm met lijnen erin leest als
 * een prent uit een boek. Dat is het hele verschil tussen een werkblad en
 * iets wat een lezer van twaalf serieus neemt, en het kost één patroon.
 */
const ARCERING = `<defs>
  <pattern id="arc" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
    <line x1="0" y1="0" x2="0" y2="9" stroke="#6b5c47" stroke-width="1.1" opacity=".3"/>
  </pattern>
  <pattern id="stip" width="14" height="14" patternUnits="userSpaceOnUse">
    <circle cx="3" cy="3" r="1.2" fill="#6b5c47" opacity=".22"/>
  </pattern>
  <radialGradient id="vig" cx="50%" cy="46%" r="72%">
    <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#3a2b1a" stop-opacity=".2"/>
  </radialGradient>
</defs>`

const plaat = (binnen, lucht = ['#e9d9b8', '#f4ead7']) => `<svg viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
  ${hemel('l', lucht[0], lucht[1])}${ARCERING}
  <rect width="1000" height="700" fill="url(#l)"/>
  ${binnen}
  <rect width="1000" height="700" fill="url(#stip)"/>
  <rect width="1000" height="700" fill="url(#vig)"/>
  <rect x="5" y="5" width="990" height="690" fill="none" stroke="${H.inkt}" stroke-width="3"/>
</svg>`

const grond = (y = 560, kleur = '#cbb68f') =>
  `<rect x="0" y="${y}" width="1000" height="${700 - y}" fill="${kleur}"/>
   <rect x="0" y="${y}" width="1000" height="${700 - y}" fill="url(#arc)"/>
   <line x1="0" y1="${y}" x2="1000" y2="${y}" stroke="${H.inkt}" stroke-width="2.5" opacity=".7"/>`

const hoefboog = (x, y, b, hgt, vul, lijnk = H.inkt) => {
  const r = b / 2
  return `<path d="M${x} ${y} L${x} ${y - hgt + r} A${r} ${r * 1.15} 0 0 1 ${x + b} ${y - hgt + r} L${x + b} ${y} Z"
    fill="${vul}" stroke="${lijnk}" stroke-width="3"/>`
}

const palmboom = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="${H.inkt}" stroke-width="3">
  <path d="M0 0 C-6 -50 -4 -100 2 -140" fill="none"/>
  <g fill="${H.groen}" stroke="${H.inkt}" stroke-width="2.5">
    <path d="M2 -140 C-40 -164 -76 -160 -96 -142 C-66 -150 -30 -150 2 -134 Z"/>
    <path d="M2 -140 C44 -166 80 -160 100 -142 C70 -150 34 -150 2 -134 Z"/>
    <path d="M2 -140 C-26 -186 -18 -214 4 -232 C14 -204 14 -172 6 -136 Z"/>
    <path d="M2 -140 C-52 -138 -78 -120 -86 -98 C-58 -118 -26 -128 2 -130 Z"/>
    <path d="M2 -140 C56 -138 82 -120 90 -98 C62 -118 30 -128 2 -130 Z"/>
  </g>
</g>`

const golven = (y, kleur = '#7b9db4') => {
  let d = ''
  for (let r = 0; r < 5; r++) for (let i = 0; i < 9; i++) {
    const x = i * 120 + (r % 2 ? 60 : 0)
    d += `M${x} ${y + r * 30} q30 -16 60 0 `
  }
  return `<rect x="0" y="${y - 10}" width="1000" height="${710 - y}" fill="${kleur}"/>
    <path d="${d}" fill="none" stroke="#ffffff88" stroke-width="3"/>`
}

/**
 * Eén plaat per deel: het gebouw, de plek of het voorwerp waar het over gaat.
 *
 * Deze staan er zolang er geen echte opname is. Zodra `store/sleutels/platen/`
 * gevuld wordt, verdwijnen ze vanzelf naar de achtergrond.
 */
export const PLATEN = {
  1: () => plaat(`${grond(540, '#c9b68e')}
    ${[120, 330, 540, 750].map((x) => `<g><rect x="${x}" y="200" width="34" height="340" fill="#e8dcc2" stroke="${H.inkt}" stroke-width="3"/>
      <rect x="${x - 12}" y="180" width="58" height="26" fill="#ded0b0" stroke="${H.inkt}" stroke-width="3"/>
      <rect x="${x - 14}" y="530" width="62" height="22" fill="#ded0b0" stroke="${H.inkt}" stroke-width="3"/></g>`).join('')}
    <rect x="96" y="150" width="722" height="34" fill="#e8dcc2" stroke="${H.inkt}" stroke-width="3"/>
    <path d="M96 150 L457 62 L818 150 Z" fill="#ded0b0" stroke="${H.inkt}" stroke-width="3"/>
    <g opacity=".85">${Array.from({ length: 11 }, (_, i) => Array.from({ length: 4 }, (_, j) =>
      khatam(70 + i * 86, 596 + j * 34, 15, (i + j) % 2 ? '#b9a279' : '#a8916a')).join('')).join('')}</g>`),
  2: () => plaat(`${golven(380)}
    <path d="M0 330 L1000 330 L1000 250 C820 236 700 258 560 252 C420 246 200 268 0 258 Z" fill="#9aa892" stroke="${H.inkt}" stroke-width="3"/>
    <text x="500" y="300" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="30" fill="#4c5a45">de overkant</text>
    <g transform="translate(430 430)">
      <path d="M0 0 L240 0 L206 74 L34 74 Z" fill="#8a6a44" stroke="${H.inkt}" stroke-width="4"/>
      <rect x="112" y="-170" width="9" height="172" fill="${H.inkt}"/>
      <path d="M118 -166 L216 -44 L118 -44 Z" fill="${H.perkament}" stroke="${H.inkt}" stroke-width="3.5"/>
      <path d="M112 -140 L26 -44 L112 -44 Z" fill="#efe2c6" stroke="${H.inkt}" stroke-width="3.5"/>
    </g>`, ['#cfe0ea', '#eef2ee']),
  3: () => plaat(`${grond(600, '#c3ad84')}
    <rect x="120" y="240" width="700" height="360" fill="#efe3c9" stroke="${H.inkt}" stroke-width="4"/>
    ${zellige(124, 250, 692, 34)}
    <line x1="120" y1="288" x2="820" y2="288" stroke="${H.inkt}" stroke-width="2.5"/>
    ${[170, 330, 490, 650].map((x) => hoefboog(x, 600, 120, 250, '#2c3a52')).join('')}
    <rect x="120" y="240" width="700" height="360" fill="url(#arc)" opacity=".5"/>
    <g transform="translate(838 0)">
      <rect x="0" y="196" width="104" height="404" fill="#e5d6b4" stroke="${H.inkt}" stroke-width="4"/>
      <rect x="0" y="196" width="104" height="404" fill="url(#arc)" opacity=".6"/>
      <rect x="-14" y="162" width="132" height="36" fill="#d9c69f" stroke="${H.inkt}" stroke-width="3.5"/>
      ${zellige(6, 262, 92, 30, H.groen)}
      <rect x="26" y="102" width="52" height="60" fill="#d9c69f" stroke="${H.inkt}" stroke-width="3"/>
      ${khatam(52, 72, 24, H.goud, H.inkt, 2.5)}
    </g>
    <path d="M0 646 q250 -42 500 0 t500 0" fill="none" stroke="#7b9db4" stroke-width="12"/>
    <path d="M0 662 q250 -42 500 0 t500 0" fill="none" stroke="#ffffff" stroke-width="3" opacity=".6"/>`),
  4: () => plaat(`${grond(520, '#d9b98b')}
    ${[60, 170].map((x, i) => palmboom(x + 40, 560, 1 - i * 0.15)).join('')}
    ${palmboom(880, 570, 1.05)}
    <rect x="300" y="300" width="400" height="260" fill="#c96a45" stroke="${H.inkt}" stroke-width="4"/>
    ${[330, 430, 530, 630].map((x) => `<rect x="${x}" y="240" width="46" height="62" fill="#c96a45" stroke="${H.inkt}" stroke-width="3"/>`).join('')}
    ${hoefboog(450, 560, 100, 190, '#3a2b22')}
    <g stroke="${H.inkt}" stroke-width="3" fill="none" opacity=".5">
      <path d="M0 250 q120 -34 250 -10 t260 -18 t260 22 t230 -10" stroke="#a89372"/>
    </g>
    <g transform="translate(180 470)" stroke="${H.inkt}" stroke-width="3" fill="#b9915f">
      <path d="M0 90 L0 30 q34 -44 68 0 L68 90 Z"/><circle cx="34" cy="16" r="16"/>
    </g>`, ['#f3cf95', '#f7e7c7']),
  5: () => plaat(`<rect width="1000" height="700" fill="${H.perkament}"/>
    <circle cx="500" cy="350" r="290" fill="#e2d2b2" stroke="${H.inkt}" stroke-width="4"/>
    <g fill="#a4b79a" stroke="${H.inkt}" stroke-width="2.5">
      <path d="M330 220 q90 -30 180 10 t150 -20 l30 70 q-120 40 -200 10 t-170 30 Z"/>
      <path d="M300 430 q140 -40 230 20 t160 -10 l-10 80 q-150 30 -240 -10 t-150 20 Z"/>
    </g>
    <g stroke="${H.goud}" stroke-width="2" fill="none" opacity=".8">
      ${Array.from({ length: 12 }, (_, i) => `<line x1="${500 + Math.cos(i * Math.PI / 6) * 290}" y1="${350 + Math.sin(i * Math.PI / 6) * 290}" x2="${500 - Math.cos(i * Math.PI / 6) * 290}" y2="${350 - Math.sin(i * Math.PI / 6) * 290}"/>`).join('')}
      <circle cx="500" cy="350" r="180"/><circle cx="500" cy="350" r="80"/>
    </g>
    ${khatam(500, 350, 40, H.goud, H.inkt, 2.5)}
    <text x="500" y="676" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="28" fill="${H.steen}">de wereld, met het zuiden boven</text>`),
  6: () => plaat(`${grond(540, '#e0c18e')}
    <g stroke="${H.inkt}" stroke-width="3">
      ${[[170, 1], [400, 0.92], [610, 0.84], [790, 0.76]].map(([x, s]) => `<g transform="translate(${x} 540) scale(${s})">
        <path d="M-70 0 L-58 -96 L-30 -120 L40 -120 L70 -86 L70 0" fill="#c39a63"/>
        <path d="M-30 -120 q30 -50 70 0 Z" fill="#8f6f45"/>
        <rect x="-56" y="-150" width="86" height="42" rx="8" fill="#a8352c"/>
        <path d="M-70 0 L-70 66 M-40 0 L-40 66 M40 0 L40 66 M70 0 L70 66" stroke-linecap="round"/>
        <circle cx="52" cy="-134" r="14" fill="#c39a63"/>
      </g>`).join('')}
    </g>
    <circle cx="840" cy="130" r="58" fill="#f0d79b" stroke="${H.inkt}" stroke-width="3"/>
    <path d="M0 470 q160 -46 330 -10 t340 -20 t330 24" fill="none" stroke="#c9ab7c" stroke-width="5"/>`, ['#f5d79e', '#fbeed0']),
  7: () => plaat(`<rect width="1000" height="700" fill="#e7dabb"/>
    <g transform="translate(140 90)">
      <rect width="720" height="520" rx="8" fill="${H.perkament}" stroke="${H.inkt}" stroke-width="4"/>
      <line x1="360" y1="0" x2="360" y2="520" stroke="${H.inkt}" stroke-width="3"/>
      <g stroke="#8d7b62" stroke-width="3" stroke-linecap="round" opacity=".75">
        ${Array.from({ length: 13 }, (_, i) => `<line x1="34" y1="${52 + i * 34}" x2="326" y2="${52 + i * 34}"/>`).join('')}
        ${Array.from({ length: 13 }, (_, i) => `<line x1="${394 + (i % 3) * 14}" y1="${52 + i * 34}" x2="686" y2="${52 + i * 34}"/>`).join('')}
      </g>
      ${khatam(360, 262, 46, '#ffffff', H.goud, 3)}
    </g>
    <g transform="translate(700 520) rotate(-24)" stroke="${H.inkt}" stroke-width="3">
      <path d="M0 0 L150 -34" stroke="#6b4f33" stroke-width="10" stroke-linecap="round"/>
      <path d="M150 -34 q54 -18 96 -62 q-56 16 -96 34 Z" fill="#f4ead7"/>
    </g>`),
  8: () => plaat(`${grond(520, '#b9a373')}
    <g opacity=".85">
      ${[[130, 0], [300, 1], [470, 0], [640, 1], [810, 0]].map(([x, k]) => `<g transform="translate(${x} 520)">
        <path d="M0 0 L0 -180" stroke="${H.inkt}" stroke-width="5"/>
        <path d="M4 -180 L84 -152 L4 -124 Z" fill="${k ? H.rood : '#2c3a52'}" stroke="${H.inkt}" stroke-width="3"/>
      </g>`).join('')}
    </g>
    <path d="M0 520 q250 -60 500 -20 t500 -30" fill="none" stroke="#8d7b62" stroke-width="6"/>
    <path d="M0 610 q250 40 500 0 t500 10" fill="none" stroke="#7b9db4" stroke-width="16" opacity=".8"/>
    <g fill="none" stroke="#6b5c47" stroke-width="3" opacity=".6">
      ${Array.from({ length: 26 }, (_, i) => `<circle cx="${40 + i * 37}" cy="${560 + (i % 3) * 16}" r="7"/>`).join('')}
    </g>`, ['#d9c39a', '#efe2c6']),
  9: () => plaat(`${grond(560, '#c9ad7e')}
    <rect x="90" y="250" width="820" height="310" fill="#c96a45" stroke="${H.inkt}" stroke-width="4"/>
    ${[150, 330, 510, 690].map((x) => hoefboog(x, 560, 130, 240, '#3a2b22')).join('')}
    ${zellige(90, 212, 820, 38, H.goud)}
    <rect x="200" y="600" width="600" height="80" fill="#7b9db4" stroke="${H.inkt}" stroke-width="3"/>
    <path d="M200 620 q150 -14 300 0 t300 0" fill="none" stroke="#ffffff88" stroke-width="4"/>
    ${[120, 880].map((x) => palmboom(x, 640, 0.8)).join('')}`, ['#f0c48d', '#f8e6c5']),
  10: () => plaat(`${golven(430)}
    <rect x="0" y="330" width="1000" height="104" fill="#efe6d2" stroke="${H.inkt}" stroke-width="4"/>
    ${[60, 240, 420, 600, 780].map((x) => `<rect x="${x}" y="286" width="56" height="46" fill="#efe6d2" stroke="${H.inkt}" stroke-width="3"/>`).join('')}
    ${[150, 520, 890].map((x) => `<g transform="translate(${x} 330)">
      <rect x="-34" y="-112" width="68" height="112" fill="#e7dabb" stroke="${H.inkt}" stroke-width="3.5"/>
      <rect x="-44" y="-134" width="88" height="26" fill="#2c3a52" stroke="${H.inkt}" stroke-width="3"/></g>`).join('')}
    <g transform="translate(560 470)">
      <path d="M0 0 L200 0 L172 62 L28 62 Z" fill="#8a6a44" stroke="${H.inkt}" stroke-width="4"/>
      <rect x="94" y="-150" width="8" height="150" fill="${H.inkt}"/>
      <path d="M100 -146 L182 -40 L100 -40 Z" fill="${H.perkament}" stroke="${H.inkt}" stroke-width="3.5"/>
    </g>
    <g fill="#f4f1ea" stroke="${H.inkt}" stroke-width="2">
      ${[[220, 190], [300, 150], [180, 120], [760, 170], [840, 130]].map(([x, y]) => `<path d="M${x} ${y} l14 -10 l14 10 l-6 16 l-16 0 Z"/>`).join('')}
    </g>`, ['#cfe0ea', '#eef4f0']),
  11: () => plaat(`${golven(400, '#6d90a8')}
    <g transform="translate(120 250)">
      <path d="M0 160 L300 160 L258 240 L42 240 Z" fill="#7b5b3a" stroke="${H.inkt}" stroke-width="4"/>
      <rect x="146" y="-40" width="10" height="200" fill="${H.inkt}"/>
      <path d="M156 -34 L264 110 L156 110 Z" fill="${H.perkament}" stroke="${H.inkt}" stroke-width="3.5"/>
      <path d="M146 -6 L46 110 L146 110 Z" fill="#efe2c6" stroke="${H.inkt}" stroke-width="3.5"/>
      ${khatam(206, 40, 22, H.rood)}
    </g>
    <g transform="translate(620 300)">
      <path d="M0 140 L280 140 L242 216 L38 216 Z" fill="#5d5a54" stroke="${H.inkt}" stroke-width="4"/>
      <rect x="136" y="-30" width="10" height="170" fill="${H.inkt}"/>
      <path d="M146 -24 L244 96 L146 96 Z" fill="#f4f1ea" stroke="${H.inkt}" stroke-width="3.5"/>
      <g fill="#a8352c">${Array.from({ length: 7 }, (_, i) => `<rect x="${150}" y="${-18 + i * 16}" width="90" height="8"/>`).join('')}</g>
    </g>`, ['#cadbe6', '#e9f0ec']),
  12: () => plaat(`<rect width="1000" height="700" fill="#dfe6e6"/>
    <path d="M0 700 L0 420 L140 300 L260 380 L400 210 L560 360 L700 250 L840 350 L1000 260 L1000 700 Z" fill="#8e9b8a" stroke="${H.inkt}" stroke-width="4"/>
    <path d="M0 700 L0 540 L180 470 L340 560 L520 460 L700 550 L860 470 L1000 540 L1000 700 Z" fill="#6f7d68" stroke="${H.inkt}" stroke-width="4"/>
    <g fill="#f4ead7" stroke="none" opacity=".9">
      <path d="M400 210 l40 42 l-80 0 Z"/><path d="M700 250 l34 38 l-68 0 Z"/>
    </g>
    ${[[150, 640], [330, 660], [520, 630], [720, 655]].map(([x, y]) => `<g transform="translate(${x} ${y})">
      <rect x="-46" y="-56" width="92" height="56" fill="#c2a375" stroke="${H.inkt}" stroke-width="3"/>
      <rect x="-54" y="-70" width="108" height="16" fill="#a8896a" stroke="${H.inkt}" stroke-width="3"/></g>`).join('')}
    <circle cx="860" cy="120" r="44" fill="#f2e6c4" stroke="${H.inkt}" stroke-width="3"/>`, ['#cfd9dd', '#eaefee']),
  13: () => plaat(`<rect width="1000" height="700" fill="#e9dfc7"/>
    ${grond(560, '#cbb68f')}
    <g transform="translate(500 300)">
      ${[-320, -160, 0, 160, 320].map((dx) => `<rect x="${dx - 22}" y="-40" width="44" height="300" fill="#e0cba4" stroke="${H.inkt}" stroke-width="3.5"/>`).join('')}
      <rect x="-120" y="-250" width="240" height="510" fill="#d9bf92" stroke="${H.inkt}" stroke-width="4"/>
      ${zellige(-112, -180, 224, 40, H.groen)}
      ${hoefboog(-60, 260, 120, 210, '#3a2b22')}
    </g>
    <g fill="${H.rood}">
      ${[130, 870].map((x) => `<g transform="translate(${x} 430)"><rect x="-4" y="-160" width="8" height="300" fill="${H.inkt}"/>
        <rect x="4" y="-160" width="110" height="74" fill="${H.rood}" stroke="${H.inkt}" stroke-width="3"/>
        ${khatam(59, -123, 26, 'none', H.groen, 5)}</g>`).join('')}
    </g>`, ['#f0e2bd', '#f7eed8']),
  14: () => plaat(`<rect width="1000" height="700" fill="${H.perkament}"/>
    <g transform="translate(150 80)">
      <rect width="700" height="540" rx="10" fill="#ffffff" stroke="${H.inkt}" stroke-width="4"/>
      <rect x="0" y="0" width="700" height="80" fill="${H.nacht}"/>
      <text x="350" y="54" text-anchor="middle" font-family="Georgia,serif" font-size="36" fill="${H.perkament}" letter-spacing="6">DE GRONDWET</text>
      <g stroke="#8d7b62" stroke-width="3" stroke-linecap="round" opacity=".7">
        ${Array.from({ length: 11 }, (_, i) => `<line x1="60" y1="${140 + i * 34}" x2="${640 - (i % 4) * 60}" y2="${140 + i * 34}"/>`).join('')}
      </g>
      <g transform="translate(560 430)">${khatam(0, 0, 54, 'none', H.groen, 6)}<circle r="76" fill="none" stroke="${H.rood}" stroke-width="5"/></g>
    </g>
    <g transform="translate(64 600)" font-family="Georgia,serif" font-size="26" fill="${H.steen}" font-style="italic">
      <text>de taal die eindelijk in het boek kwam</text></g>`),
  15: () => plaat(`<rect width="1000" height="700" fill="#efe6d4"/>
    <g transform="translate(240 200)">
      <path d="M0 120 L520 120 L520 380 L0 380 Z" fill="#b98f5d" stroke="${H.inkt}" stroke-width="4"/>
      <path d="M-24 60 L544 60 L520 124 L0 124 Z" fill="#cda36f" stroke="${H.inkt}" stroke-width="4"/>
      <rect x="230" y="96" width="60" height="52" rx="8" fill="#8a6a44" stroke="${H.inkt}" stroke-width="3"/>
      <g opacity=".5"><path d="M40 160 L480 160 M40 200 L480 200" stroke="#8a6a44" stroke-width="3"/></g>
    </g>
    ${sleutel(500, 430, 1.05, H.goud)}
    <g fill="none" stroke="${H.steen}" stroke-width="3" opacity=".6">
      ${Array.from({ length: 5 }, (_, i) => `<rect x="${120 + i * 8}" y="${470 + i * 6}" width="180" height="${26}" rx="4"/>`).join('')}
    </g>
    <text x="500" y="662" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="28" fill="${H.steen}">een doos op een zolder, tweeduizend jaar later</text>`, ['#f2e9d7', '#faf4e6']),
}

export const plaatVan = (nummer) => (PLATEN[nummer] ?? PLATEN[1])()
