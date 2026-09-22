/**
 * Tekent en zet het prentenboek: Sba de Atlasleeuw, deel 1.
 *
 * De platen zijn met de hand getekend in vectoren, net als het logo en de
 * fennek — geen gegenereerde plaatjes. Dat is een keuze: de hele belofte van
 * dit merk is dat alles echt is, en een vlakke, geometrische stijl die op
 * elke bladzijde klopt is eerlijker dan zestien platen die op elkaar lijken
 * maar het net niet zijn. Vectoren blijven bovendien scherp op een poster van
 * twee meter en op een drukpers van 300 dpi.
 *
 * Elke plaat gebruikt dezelfde bouwdoos: de leeuw, de kinderen, en een handvol
 * vormen die in de medina steeds terugkomen — de hoefijzerboog, de dakrand,
 * de lantaarn, de tegelband. Dat is wat een reeks een reeks maakt.
 *
 * Run with: node scripts/make-prentenboek.mjs [--taal nl]
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { K, sba } from './lib/tekenen.mjs'

/** De achtpuntige khatam, klein, als behang op een bladzijde die nog wacht. */
const ster = (cx, cy, r, vul) => {
  const punten = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 8
    const straal = i % 2 === 0 ? r : r * 0.42
    return `${(cx + Math.cos(a) * straal).toFixed(1)},${(cy + Math.sin(a) * straal).toFixed(1)}`
  })
  return `<polygon points="${punten.join(' ')}" fill="${vul}"/>`
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
/** Zowel `--taal de` als `--taal=de`; het tweede kost anders stilletjes een Nederlands boek. */
const arg = (naam, terugval = null) => {
  const gelijk = process.argv.find((a) => a.startsWith(`--${naam}=`))
  if (gelijk) return gelijk.slice(naam.length + 3)
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const TAAL = arg('taal', 'nl')

/**
 * Voor wie dit exemplaar is.
 *
 * `--voor "Naam <mail>"` zet die regel op elke bladzijde. Dat heet sociale
 * drm en het is het enige wat bij een e-boek werkelijk helpt: je kunt een
 * bestand dat iemand heeft gekocht niet tegenhouden, maar bijna niemand zet
 * een boek online waar zijn eigen naam en mailadres op elke bladzijde staan.
 *
 * Slot erop werkt niet. Dat is geprobeerd, door uitgevers met meer geld dan
 * wij, en het levert alleen klanten op die hun eigen boek niet open krijgen.
 */
const VOOR = arg('voor', '')
const UIT = arg('uit', path.join(ROOT, 'store', 'prentenboek', `sba-${arg('deel', '1')}-${TAAL}.pdf`))

/** Een volwassene: dezelfde bouw als een kind, maar langer en rustiger. */
const volwassene = (x, y, s = 1, { jas = '#4a6fa5', huid = '#d9a06a', doek = null, grijs = false } = {}) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-22 26 L22 26 L28 92 L-28 92 Z" fill="${jas}"/>
  <path d="M-22 32 L-36 62" stroke="${jas}" stroke-width="11" stroke-linecap="round"/>
  <path d="M22 32 L36 62" stroke="${jas}" stroke-width="11" stroke-linecap="round"/>
  <circle cx="-37" cy="64" r="5.5" fill="${huid}"/>
  <circle cx="37" cy="64" r="5.5" fill="${huid}"/>
  <circle cx="0" cy="2" r="19" fill="${huid}"/>
  ${doek
    ? `<path d="M-21 4 Q0 -24 21 4 Q21 22 0 24 Q-21 22 -21 4 Z" fill="${doek}"/><circle cx="0" cy="4" r="14" fill="${huid}"/>`
    : `<path d="M-19 -2 Q0 -24 19 -2 Q12 -13 0 -13 Q-12 -13 -19 -2 Z" fill="${grijs ? '#cfc6bb' : '#2b1d16'}"/>`}
  <circle cx="-6.5" cy="3" r="2.4" fill="${K.inkt}"/>
  <circle cx="6.5" cy="3" r="2.4" fill="${K.inkt}"/>
  <path d="M-5 10 Q0 14 5 10" stroke="${K.inkt}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
</g>`

const theepot = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-16 0 Q-20 22 0 24 Q20 22 16 0 Z" fill="#b9c4cc"/>
  <path d="M-16 0 L16 0" stroke="#8d99a3" stroke-width="4"/>
  <path d="M16 -2 Q30 -6 30 -22" stroke="#b9c4cc" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M-16 -2 Q-28 -8 -22 -18" stroke="#b9c4cc" stroke-width="5" fill="none"/>
  <path d="M-7 -2 Q0 -16 7 -2 Z" fill="#b9c4cc"/>
  <circle cx="0" cy="-16" r="3.4" fill="#b9c4cc"/>
</g>`

const ezel = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse cx="0" cy="0" rx="46" ry="28" fill="#9b9187"/>
  <path d="M-40 22 L-40 52 M-16 24 L-16 52 M16 24 L16 52 M40 22 L40 52" stroke="#9b9187" stroke-width="9" stroke-linecap="round"/>
  <path d="M-46 -10 Q-64 -18 -66 -40" stroke="#9b9187" stroke-width="16" fill="none" stroke-linecap="round"/>
  <ellipse cx="-68" cy="-46" rx="15" ry="12" fill="#9b9187"/>
  <ellipse cx="-76" cy="-48" rx="7" ry="5" fill="#6f6862"/>
  <path d="M-74 -58 Q-78 -78 -70 -76 Q-66 -70 -66 -58 Z" fill="#9b9187"/>
  <path d="M-62 -58 Q-58 -78 -54 -76 Q-54 -68 -56 -58 Z" fill="#9b9187"/>
  <circle cx="-70" cy="-50" r="2.6" fill="${K.inkt}"/>
  <path d="M44 -6 Q60 0 56 18" stroke="#9b9187" stroke-width="5" fill="none" stroke-linecap="round"/>
  <rect x="-34" y="-46" width="30" height="26" rx="5" fill="#c9a26a"/>
  <rect x="2" y="-46" width="30" height="26" rx="5" fill="#c9a26a"/>
  <circle cx="-19" cy="-50" r="6" fill="${K.terra}"/><circle cx="-8" cy="-50" r="6" fill="${K.blad}"/>
  <circle cx="17" cy="-50" r="6" fill="${K.saffraan}"/>
</g>`

const kat = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse cx="0" cy="0" rx="20" ry="12" fill="#c9bfae"/>
  <circle cx="-18" cy="-10" r="10" fill="#c9bfae"/>
  <path d="M-25 -16 L-22 -26 L-15 -19 Z M-11 -19 L-9 -27 L-5 -18 Z" fill="#c9bfae"/>
  <circle cx="-21" cy="-10" r="1.8" fill="${K.inkt}"/><circle cx="-14" cy="-10" r="1.8" fill="${K.inkt}"/>
  <path d="M18 -4 Q30 -10 26 -22" stroke="#c9bfae" stroke-width="5" fill="none" stroke-linecap="round"/>
</g>`

/* ---------------------------------------------------------- de bouwstenen */

/** Een hoefijzerboog: de vorm die in Marokko op elke deur en elke poort staat. */
const boog = (x, y, b, h, vul, straal = b / 2) => {
  const r = straal
  return `<path d="M${x} ${y + h} L${x} ${y + r * 0.9}
    A${r} ${r} 0 0 1 ${x + b} ${y + r * 0.9} L${x + b} ${y + h} Z" fill="${vul}"/>`
}

/** De kartelrand die op elk Marokkaans dak staat. */
const dakrand = (x, y, b, stap, vul) => {
  const delen = []
  for (let i = x; i < x + b; i += stap) {
    delen.push(`<path d="M${i} ${y} L${i + stap / 2} ${y - stap * 0.8} L${i + stap} ${y} Z" fill="${vul}"/>`)
  }
  return delen.join('')
}

/** Een tegelband van achtpuntige sterren. */
const tegelband = (x, y, b, h, vul = K.zellige) => {
  const n = Math.floor(b / h)
  const sterren = []
  for (let i = 0; i < n; i++) {
    const cx = x + h / 2 + i * h, cy = y + h / 2, r = h * 0.34
    const punten = Array.from({ length: 16 }, (_, j) => {
      const a = (Math.PI / 8) * j - Math.PI / 8
      const rr = j % 2 === 0 ? r : r * 0.42
      return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`
    })
    sterren.push(`<polygon points="${punten.join(' ')}" fill="${vul}" opacity=".85"/>`)
  }
  return `<rect x="${x}" y="${y}" width="${b}" height="${h}" fill="${K.creme}" opacity=".5"/>${sterren.join('')}`
}

const lantaarn = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M0 0 L0 14" stroke="${K.inkt}" stroke-width="2"/>
  <path d="M-9 14 L9 14 L6 34 L-6 34 Z" fill="${K.saffraan}"/>
  <path d="M-6 34 L6 34 L4 40 L-4 40 Z" fill="${K.inkt}"/>
  <circle cx="0" cy="24" r="4" fill="${K.creme}" opacity=".85"/>
</g>`

const palm = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-4 0 Q0 -40 4 -80" stroke="#8a6a3f" stroke-width="9" fill="none" stroke-linecap="round"/>
  ${[-55, -25, 0, 25, 55, 90, -90].map((a) => `<path d="M4 -80 Q${28 * Math.cos((a * Math.PI) / 180)} ${-80 + 26 * Math.sin((a * Math.PI) / 180)} ${52 * Math.cos((a * Math.PI) / 180)} ${-74 + 30 * Math.sin((a * Math.PI) / 180)}" stroke="${K.blad}" stroke-width="10" fill="none" stroke-linecap="round"/>`).join('')}
</g>`

/* ------------------------------------------------------------- de figuren */

/**
 * Een kind.
 *
 * Zes kinderen die uit elkaar te houden zijn met vier knoppen: jas, haar,
 * huid en één ding dat ze bij zich hebben. Meer is niet nodig — een kleuter
 * herkent Rayan aan zijn paarse jas, niet aan zijn gezicht.
 */
const KINDEREN = {
  adil: { jas: '#0d9488', haar: '#2b1d16', huid: '#d9a06a', hoofddoek: false, ding: 'kaart' },
  yousra: { jas: '#c1272d', haar: '#2b1d16', huid: '#e0ae7a', hoofddoek: false, ding: 'schets' },
  amir: { jas: '#e2603c', haar: '#3b2a1c', huid: '#c98f5c', hoofddoek: false, ding: null },
  yassine: { jas: '#2f6fb3', haar: '#2b1d16', huid: '#d9a06a', hoofddoek: false, ding: 'pet' },
  adam: { jas: '#f59e0b', haar: '#4a3423', huid: '#e0ae7a', hoofddoek: false, ding: null },
  rayan: { jas: '#7c5cbf', haar: '#2b1d16', huid: '#d9a06a', hoofddoek: false, ding: null },
}

const kind = (wie, x, y, s = 1, { arm = 0 } = {}) => {
  const k = KINDEREN[wie]
  if (!k) throw new Error(`onbekend kind: ${wie}`)
  const mouw = `${k.jas}`
  return `<g transform="translate(${x} ${y}) scale(${s})">
  <!-- benen en schoenen -->
  <path d="M-12 60 L-12 80" stroke="${k.huid}" stroke-width="10" stroke-linecap="round"/>
  <path d="M12 60 L12 80" stroke="${k.huid}" stroke-width="10" stroke-linecap="round"/>
  <path d="M-19 84 q0 -6 7 -6 l6 0 q4 0 4 6 z" fill="${K.inkt}"/>
  <path d="M19 84 q0 -6 -7 -6 l-6 0 q-4 0 -4 6 z" fill="${K.inkt}"/>

  <!-- tuniek met band, zoals ze in Marokko dragen -->
  <path d="M-19 22 Q0 30 19 22 L24 64 L-24 64 Z" fill="${k.jas}"/>
  <path d="M-22 46 L22 46 L22 52 L-22 52 Z" fill="rgba(255,250,243,.55)"/>
  ${[0, 1, 2, 3].map((i) => `<path d="M${-15 + i * 9} 49 l3 -4 l3 4 l-3 4 Z" fill="${K.saffraan}"/>`).join('')}
  <path d="M-19 24 L-29 ${48 - arm * 18}" stroke="${mouw}" stroke-width="10" stroke-linecap="round"/>
  <path d="M19 24 L29 ${48 - arm * 18}" stroke="${mouw}" stroke-width="10" stroke-linecap="round"/>
  <circle cx="-30" cy="${49 - arm * 18}" r="5.5" fill="${k.huid}"/>
  <circle cx="30" cy="${49 - arm * 18}" r="5.5" fill="${k.huid}"/>

  <!-- hoofd -->
  <circle cx="0" cy="2" r="17" fill="${k.huid}"/>
  <path d="M-17 -1 Q0 -24 17 -1 Q17 -13 0 -14 Q-17 -13 -17 -1 Z" fill="${k.haar}"/>
  ${k.ding === 'pet' ? `<path d="M-18 -2 Q0 -25 18 -2 Z" fill="#2f6fb3"/><path d="M-18 -2 L-28 2" stroke="#2f6fb3" stroke-width="5" stroke-linecap="round"/>` : ''}
  <circle cx="-6" cy="3" r="2.6" fill="${K.inkt}"/>
  <circle cx="6" cy="3" r="2.6" fill="${K.inkt}"/>
  <circle cx="-5" cy="2.2" r="0.9" fill="#fff"/>
  <circle cx="7" cy="2.2" r="0.9" fill="#fff"/>
  <circle cx="-11" cy="8" r="3.4" fill="#e39a8a" opacity=".45"/>
  <circle cx="11" cy="8" r="3.4" fill="#e39a8a" opacity=".45"/>
  <path d="M-4.5 10 Q0 14.5 4.5 10" stroke="${K.inkt}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  ${k.ding === 'kaart' ? `<rect x="22" y="${42 - arm * 18}" width="20" height="15" rx="2" fill="${K.creme}" stroke="${K.inkt}" stroke-width="1.6"/><path d="M26 ${47 - arm * 18} l12 0 M26 ${51 - arm * 18} l8 0" stroke="${K.inkt}" stroke-width="1.2"/>` : ''}
  ${k.ding === 'schets' ? `<rect x="20" y="${40 - arm * 18}" width="18" height="21" rx="2" fill="${K.creme}" stroke="${K.inkt}" stroke-width="1.6"/>` : ''}
</g>`
}

/* --------------------------------------------------------------- de platen */

const lucht = (id, van, tot) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stop-color="${van}"/><stop offset="100%" stop-color="${tot}"/></linearGradient>`

const berg = (x, y, b, h, vul, sneeuw = true) => `
  <path d="M${x} ${y} L${x + b / 2} ${y - h} L${x + b} ${y} Z" fill="${vul}"/>
  ${sneeuw ? `<path d="M${x + b / 2 - h * 0.22} ${y - h * 0.62} L${x + b / 2} ${y - h} L${x + b / 2 + h * 0.22} ${y - h * 0.62} Q${x + b / 2 + h * 0.1} ${y - h * 0.7} ${x + b / 2} ${y - h * 0.6} Q${x + b / 2 - h * 0.1} ${y - h * 0.52} ${x + b / 2 - h * 0.22} ${y - h * 0.62} Z" fill="${K.creme}"/>` : ''}`

const muurStuk = (x, y, b, h) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" fill="${K.muur}"/>
  ${dakrand(x, y, b, 26, K.muurDonker)}`

const SCENES = {
  atlas: () => `
    <defs>${lucht('l1', '#d9eef7', '#f6e3c4')}</defs>
    <rect width="1000" height="700" fill="url(#l1)"/>
    <circle cx="820" cy="130" r="58" fill="${K.saffraan}" opacity=".9"/>
    ${berg(-80, 560, 520, 330, '#9fb3bf')}
    ${berg(560, 560, 560, 380, '#8aa2b0')}
    ${berg(220, 600, 600, 300, '#b0868a', false)}
    <rect y="600" width="1000" height="100" fill="#c9a887"/>
    ${sba(470, 270, 1.62, { kijk: -1 })}
    ${kind('adil', 690, 326.4, 1.27, { arm: 1 })}
    ${kind('rayan', 780, 348, 1.05, { arm: 1 })}
    ${kind('yousra', 862, 326.4, 1.27)}
    ${palm(120, 700, 0.8)}`,

  poort: () => `
    <defs>${lucht('l2', '#cfe6f0', '#f2dfc0')}</defs>
    <rect width="1000" height="700" fill="url(#l2)"/>
    <rect y="120" width="1000" height="580" fill="${K.muur}"/>
    ${dakrand(0, 120, 1000, 30, K.muurDonker)}
    ${boog(330, 210, 340, 490, '#2f6fb3')}
    ${boog(360, 240, 280, 460, '#1d4f88')}
    ${tegelband(330, 160, 340, 44)}
    <rect x="492" y="470" width="16" height="230" fill="#123a66"/>
    <circle cx="470" cy="560" r="10" fill="${K.saffraan}"/>
    <circle cx="530" cy="560" r="10" fill="${K.saffraan}"/>
    ${lantaarn(250, 240, 1.4)}${lantaarn(750, 240, 1.4)}
    ${sba(180, 370, 1.37)}
    ${kind('adil', 700, 378, 1.2, { arm: 1 })}
    ${kind('rayan', 775, 397.6, 0.99)}
    ${kind('adam', 845, 378.8, 1.17)}`,

  welkom: () => `
    <defs>${lucht('l3', '#f3e0bd', '#e7c79a')}</defs>
    <rect width="1000" height="700" fill="url(#l3)"/>
    ${muurStuk(0, 60, 1000, 640)}
    ${boog(560, 190, 300, 510, '#8d5a3b')}
    ${boog(585, 215, 250, 485, '#f6dca8')}
    ${tegelband(560, 140, 300, 40, K.terra)}
    ${volwassene(700, 270, 1.35, { jas: K.terra, doek: '#f0c14b' })}
    ${theepot(790, 400, 1.3)}
    ${sba(180, 320, 1.43, { kijk: 1 })}
    ${kind('yousra', 360, 327.2, 1.23, { arm: 1 })}
    ${kind('rayan', 440, 346.8, 1.02, { arm: 1 })}
    ${lantaarn(120, 150, 1.6)}`,

  medina: () => `
    <defs>${lucht('l4', '#9fc9dd', '#dfe9ef')}</defs>
    <rect width="1000" height="700" fill="url(#l4)"/>
    <path d="M0 0 L0 700 L300 700 L260 60 Z" fill="${K.muur}"/>
    <path d="M1000 0 L1000 700 L700 700 L740 60 Z" fill="${K.muurDonker}"/>
    <rect x="260" y="700" width="480" height="0" fill="none"/>
    <path d="M300 700 L700 700 L680 420 L320 420 Z" fill="#e0c9a4"/>
    ${boog(90, 330, 130, 370, '#8d5a3b')}
    ${boog(790, 350, 120, 350, '#6c4630')}
    ${tegelband(60, 250, 200, 34, K.zellige)}
    ${lantaarn(300, 120, 1.8)}${lantaarn(700, 150, 1.8)}
    ${sba(500, 240, 1.82)}
    ${kind('adil', 350, 381.2, 1.08)}
    ${kind('yassine', 640, 390, 1.05, { arm: 1 })}
    ${kat(830, 660, 1.1)}`,

  ezel: () => `
    <defs>${lucht('l5', '#cfe6f0', '#f2dfc0')}</defs>
    <rect width="1000" height="700" fill="url(#l5)"/>
    ${muurStuk(0, 90, 1000, 610)}
    ${boog(60, 300, 150, 400, '#8d5a3b')}
    <rect y="640" width="1000" height="60" fill="#cbb08a"/>
    ${ezel(600, 520, 1.25)}
    ${volwassene(760, 370, 1.2, { jas: '#6b7f4a' })}
    ${sba(180, 370, 1.30, { kijk: 1 })}
    ${kind('amir', 330, 378, 1.2, { arm: 1 })}
    ${kind('rayan', 405, 397.6, 0.99, { arm: 1 })}`,

  brood: () => `
    <defs>${lucht('l6', '#f0dcb6', '#e6c795')}</defs>
    <rect width="1000" height="700" fill="url(#l6)"/>
    ${muurStuk(0, 40, 1000, 660)}
    ${boog(150, 200, 300, 330, '#3a2a20')}
    <rect x="150" y="500" width="300" height="34" fill="#8d5a3b"/>
    ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${190 + i * 58}" cy="${486}" r="26" fill="#e7b96b" stroke="#c98f4a" stroke-width="4"/>`).join('')}
    <circle cx="300" cy="350" r="60" fill="${K.saffraan}" opacity=".35"/>
    ${volwassene(300, 190, 1.15, { jas: '#cbbba4' })}
    ${sba(760, 340, 1.37, { kijk: -1 })}
    ${kind('adam', 560, 354, 1.35, { arm: 1 })}
    ${kind('rayan', 640, 378.8, 1.02)}
    <circle cx="560" cy="452" r="20" fill="#e7b96b" stroke="#c98f4a" stroke-width="4"/>`,

  babouches: () => `
    <defs>${lucht('l7', '#f2e2c2', '#e8cfa6')}</defs>
    <rect width="1000" height="700" fill="url(#l7)"/>
    ${muurStuk(0, 40, 1000, 660)}
    <rect x="120" y="150" width="520" height="420" rx="12" fill="#a97b52"/>
    ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => {
      const kleuren = ['#e8b93f', '#c1272d', '#fffaf3', '#0d9488', '#f59e0b']
      const vul = r === 0 && c === 2 ? '#e8c23f' : kleuren[(r + c) % kleuren.length]
      const x = 160 + c * 96, y = 190 + r * 100
      return `<path d="M${x} ${y + 40} Q${x} ${y} ${x + 34} ${y + 6} Q${x + 68} ${y + 12} ${x + 66} ${y + 40} Z" fill="${vul}" stroke="#7a5333" stroke-width="3"/>`
    }).join('')).join('')}
    ${volwassene(790, 270, 1.2, { jas: '#7a5333', grijs: true })}
    ${sba(880, 370, 1.10)}
    ${kind('yassine', 700, 378, 1.2, { arm: 1 })}
    ${kind('rayan', 620, 397.6, 0.99)}`,

  souq: () => `
    <defs>${lucht('l8', '#cfe6f0', '#f5e2c0')}</defs>
    <rect width="1000" height="700" fill="url(#l8)"/>
    ${muurStuk(0, 60, 1000, 640)}
    ${[0, 1, 2].map((i) => {
      const x = 40 + i * 330
      return `<path d="M${x} 250 L${x + 300} 250 L${x + 300} 210 L${x} 210 Z" fill="${['#c1272d', '#0d9488', '#f59e0b'][i]}"/>
        ${[0, 1, 2, 3, 4, 5].map((j) => `<path d="M${x + j * 50} 250 L${x + j * 50 + 25} 272 L${x + j * 50 + 50} 250 Z" fill="${['#c1272d', '#0d9488', '#f59e0b'][i]}"/>`).join('')}
        <rect x="${x + 20}" y="380" width="260" height="120" rx="8" fill="#b98b5c"/>`
    }).join('')}
    ${[0, 1, 2, 3].map((i) => `<circle cx="${110 + i * 58}" cy="370" r="24" fill="${['#5a7d3a', '#2b1d16', '#8fae52', '#6b8f3f'][i]}"/>`).join('')}
    ${[0, 1, 2].map((i) => `<path d="M${420 + i * 70} 378 q-18 -6 -18 -28 q18 -10 36 0 q0 22 -18 28 Z" fill="${['#b9c4cc', '#d78a3f', '#0d9488'][i]}"/>`).join('')}
    ${[0, 1, 2, 3].map((i) => `<rect x="${740 + i * 52}" y="336" width="44" height="46" rx="4" fill="${['#c1272d', '#f4e3c8', '#0d9488', '#f59e0b'][i]}"/>`).join('')}
    ${volwassene(180, 410, 0.95, { jas: '#8d5a3b' })}
    ${volwassene(880, 410, 0.95, { jas: '#4a6fa5', doek: '#c1272d' })}
    ${sba(500, 370, 1.30)}
    ${kind('amir', 620, 401.2, 1.08, { arm: 1 })}
    ${kind('rayan', 690, 417.2, 0.93)}`,

  thee: () => `
    <defs>${lucht('l9', '#f3dfb8', '#e9c79a')}</defs>
    <rect width="1000" height="700" fill="url(#l9)"/>
    ${muurStuk(0, 40, 1000, 660)}
    ${tegelband(0, 300, 1000, 46, K.zellige)}
    <rect x="120" y="520" width="760" height="180" rx="18" fill="${K.terra}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<polygon points="${170 + i * 92},560 ${196 + i * 92},600 ${170 + i * 92},640 ${144 + i * 92},600" fill="${K.saffraan}" opacity=".8"/>`).join('')}
    ${theepot(430, 380, 1.5)}
    <path d="M478 356 Q520 420 520 486" stroke="#c98f4a" stroke-width="5" fill="none" opacity=".9"/>
    <rect x="500" y="486" width="40" height="46" rx="5" fill="#dfe9ef" opacity=".92"/>
    <rect x="500" y="500" width="40" height="32" rx="4" fill="#c98f4a"/>
    ${volwassene(330, 320, 1.15, { jas: '#6b7f4a' })}
    ${sba(760, 340, 1.37, { kijk: -1, tas: false })}
    ${kind('yousra', 620, 328.8, 1.17)}
    ${kind('rayan', 690, 350.4, 0.96)}`,

  zon: () => `
    <defs>${lucht('l10', '#f6b26b', '#e3708a')}</defs>
    <rect width="1000" height="700" fill="url(#l10)"/>
    <circle cx="520" cy="430" r="88" fill="#fff0c9" opacity=".95"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => {
      const x = i * 180 - 40, h = [220, 160, 260, 190, 240, 170][i]
      return `<rect x="${x}" y="${700 - h}" width="170" height="${h}" fill="${i % 2 ? '#b5715c' : '#c98268'}"/>
        ${dakrand(x, 700 - h, 170, 24, '#9d5a48')}`
    }).join('')}
    <rect y="620" width="1000" height="80" fill="#8d4c3d"/>
    ${sba(180, 360, 1.30, { kijk: 1 })}
    ${kind('yousra', 700, 356.4, 1.27, { arm: 1 })}
    ${kind('rayan', 790, 376.8, 1.02)}`,

  jedda: () => `
    <defs>${lucht('l11', '#3c4a6b', '#7a6a7d')}</defs>
    <rect width="1000" height="700" fill="url(#l11)"/>
    ${muurStuk(0, 80, 1000, 620)}
    ${boog(600, 210, 300, 490, '#3a2a20')}
    ${boog(625, 235, 250, 465, '#ffd79a')}
    <polygon points="625,700 875,700 1000,690 500,690" fill="#ffd79a" opacity=".28"/>
    ${volwassene(750, 290, 1.3, { jas: '#8a6ea0', doek: '#f0e2c0', grijs: true })}
    ${lantaarn(420, 170, 1.7)}
    ${sba(180, 340, 1.30)}
    ${kind('rayan', 460, 367.2, 1.08, { arm: 1 })}
    ${kind('adil', 370, 348, 1.2)}`,

  afscheid: () => `
    <defs>${lucht('l12', '#0b1020', '#2c3a63')}</defs>
    <rect width="1000" height="700" fill="url(#l12)"/>
    <circle cx="830" cy="140" r="46" fill="#f6e7b8"/>
    <circle cx="806" cy="128" r="46" fill="#1a2440"/>
    ${Array.from({ length: 40 }, (_, i) => {
      const x = (i * 149) % 1000, y = (i * 83) % 380
      return `<circle cx="${x}" cy="${y}" r="${i % 5 === 0 ? 3 : 1.8}" fill="${K.creme}" opacity="${0.4 + (i % 5) * 0.12}"/>`
    }).join('')}
    ${[0, 1, 2, 3, 4, 5].map((i) => {
      const x = i * 180 - 40, h = [200, 150, 250, 180, 230, 160][i]
      return `<rect x="${x}" y="${700 - h}" width="170" height="${h}" fill="#151d34"/>${dakrand(x, 700 - h, 170, 24, '#101729')}`
    }).join('')}
    ${boog(120, 520, 90, 180, '#f3c66a')}
    <rect y="650" width="1000" height="50" fill="#0d1425"/>
    ${sba(760, 340, 1.43, { kijk: -1 })}
    ${kind('rayan', 330, 382, 1.05, { arm: 1 })}
    ${kind('adil', 250, 362.8, 1.17, { arm: 1 })}
    ${kind('yousra', 410, 362.8, 1.17)}`,
}

/* ------------------------------------------------------------- de bladzijde */

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * De plaat bij een bladzijde.
 *
 * Staat de tekening er nog niet, dan komt er een rustige achtergrond met het
 * zegel erop, zodat het manuscript te lezen en te beoordelen is voordat er een
 * illustrator aan begint. Zo hoort de volgorde ook: eerst het verhaal, dan de
 * platen -- dat scheelt duizenden euro's aan tekenwerk dat je weggooit.
 */
const nogTeTekenen = () => `
  <defs><linearGradient id="wacht" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f6e7c8"/><stop offset="100%" stop-color="#e9cfa6"/></linearGradient></defs>
  <rect width="1000" height="700" fill="url(#wacht)"/>
  ${Array.from({ length: 24 }, (_, i) => {
    const x = (i % 6) * 180 + 60, y = Math.floor(i / 6) * 180 + 70
    return `<g opacity=".13">${ster(x, y, 40, K.inkt)}</g>`
  }).join('')}
  <g opacity=".22">${sba(500, 300, 1.6, { tas: false })}</g>`

/**
 * De echte plaat, als hij er is.
 *
 * `store/prentenboek/platen/<deel>/<nummer>.jpg` -- of .png of .webp. Staat
 * hij er, dan komt hij paginavullend in het boek; staat hij er niet, dan valt
 * het terug op de tekening hieronder. Zo kun je deel voor deel en plaat voor
 * plaat vervangen zonder dat er iets stukgaat, en blijft de rest van het boek
 * ondertussen gewoon te lezen.
 */
/**
 * De geschilderde plaat bij een bladzijde.
 *
 * Drie lagen, van goed naar minder goed:
 *
 * 1. `platen/<deel>/<nummer>.jpg` — een eigen plaat voor déze bladzijde. Zo
 *    hoort het, en daar gaan de honderdvierenveertig opdrachten in
 *    `platenlijst.md` over.
 * 2. `platen/<deel>/achtergrond.jpg` — één geschilderd tafereel voor het hele
 *    deel. Dat is hoe de aangeleverde v2-boeken in elkaar zitten, en het is
 *    beter dan een vectortekening: het is de goede sfeer, de goede Sba, en
 *    het kind kijkt naar hetzelfde beeld terwijl het verhaal verdergaat.
 * 3. De tekening uit `SCENES`. Een noodverband.
 */
const echtePlaat = (nr) => {
  const map = path.join(ROOT, 'store', 'prentenboek', 'platen', String(NUMMER))
  for (const naam of [String(nr), 'achtergrond']) {
    for (const soort of ['jpg', 'jpeg', 'png', 'webp']) {
      const bestand = path.join(map, `${naam}.${soort}`)
      if (existsSync(bestand)) return bestand
    }
  }
  return null
}

const plaat = (naam, nr) => {
  const bestand = echtePlaat(nr)
  if (bestand) return `<img class="plaat" src="file://${bestand}" alt="">`
  const teken = SCENES[naam] ?? nogTeTekenen
  return `<svg class="plaat" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">${teken()}</svg>`
}

/**
 * Twee bladzijden per moment: eerst kijken, dan lezen.
 *
 * Een prentenboek telt bladzijden, geen taferelen. Twaalf momenten worden zo
 * vierentwintig bladzijden, en met het voorwerk en de woordenlijst erbij komt
 * een deel op dertig uit -- het formaat dat een drukker verwacht.
 */
/**
 * Twee bladzijden per woord: de plaat met het woord erop, en het verhaal.
 *
 * De plaat draagt de woordkaart, want dat is het moment waar het kind naar
 * kijkt terwijl de ouder voorleest — het woord hoort bij het beeld en niet op
 * de bladzijde erna. De vorm komt uit de proef van v2: een crème kaart op de
 * plaat, het woord in kapitalen, het Arabisch eronder, en een knop die zegt
 * wat je moet doen. "Zeg het hardop" is geen versiering maar de hele oefening.
 */
const bladzijde = (blad, nr) => `<section class="blad">
  ${plaat(blad.scene, nr)}
  <div class="merkpil">Darija for Kids</div>
  <div class="woordpil">${esc(S.woord(nr))}</div>
  <div class="woordkaart">
    <div class="tr">${esc(blad.woord.tr)}</div>
    <div class="ar">${esc(blad.woord.ar)}</div>
    <div class="nl">${esc(blad.woord.nl)}</div>
    <div class="hardop">${esc(S.hardop)}</div>
  </div>
  <div class="voetregel">${esc(VOOR ? `${S.voet} · ${VOOR}` : S.voet)}</div>
</section>
<section class="tekstblad verhaalblad">
  <div class="woordpil donker">${esc(S.woord(nr))}</div>
  <div class="verhaal">
    ${blad.tekst.map((regel) => `<p>${esc(regel)}</p>`).join('')}
    <p class="echo">${esc(blad.echo)}</p>
  </div>
  <div class="kaartje">
    <div class="ar">${esc(blad.woord.ar)}</div>
    <div class="tr">${esc(blad.woord.tr)}</div>
    <div class="nl">${esc(blad.woord.nl)}</div>
  </div>
  <div class="voetregel donker">${esc(VOOR ? `${S.voet} · ${VOOR}` : S.voet)}</div>
</section>`

/* ------------------------------------------------------------------ zetten */

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ DELEN, CAST }, { deelIn, TALEN_KLAAR, VORDERING, schilVan }] = await Promise.all([
  server.ssrLoadModule('/src/content/prentenboek.ts'),
  server.ssrLoadModule('/src/content/prentenboek-talen.ts'),
])
const NUMMER = Number(arg('deel', '1'))
if (!DELEN.some((d) => d.nummer === NUMMER)) throw new Error(`geen deel ${NUMMER}; er zijn er ${DELEN.length}`)

/**
 * Een taal die nog niet af is, zetten mag — zwijgen erover niet.
 *
 * `deelIn` valt voor een ontbrekend deel terug op het Nederlands. Dat is
 * bruikbaar voor een proefdruk en onbruikbaar voor de winkel, dus komt het
 * hier op het scherm en niet pas op bladzijde zeven.
 */
if (TAAL !== 'nl' && !TALEN_KLAAR.includes(TAAL)) {
  const v = VORDERING[TAAL]
  console.warn(v
    ? `\nLet op: ${TAAL} is ${v.klaar} van de ${v.totaal} delen vertaald. De rest staat in het Nederlands.\n`
    : `\nLet op: er is geen vertaling voor "${TAAL}". Dit boek komt in het Nederlands.\n`)
}

const DEEL1 = deelIn(TAAL, NUMMER)
const S = schilVan(TAAL)

const [balo800, balo600, naskh] = await Promise.all([
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2')),
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-600.woff2')),
  readFile(path.join(ROOT, 'public', 'fonts', 'noto-naskh-arabic-700.woff2')),
]).then((b) => b.map((x) => x.toString('base64')))

const html = `<!doctype html><html lang="${TAAL}"><meta charset="utf-8">
<style>
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo800}) format('woff2');font-weight:800}
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo600}) format('woff2');font-weight:600}
  @font-face{font-family:'Naskh';src:url(data:font/woff2;base64,${naskh}) format('woff2');font-weight:700}
  @page{size:210mm 148mm;margin:0}
  *{margin:0;box-sizing:border-box}
  body{font-family:'Baloo 2',system-ui,sans-serif;font-weight:600;color:${K.inkt}}
  section{width:210mm;height:148mm;position:relative;overflow:hidden;page-break-after:always}
  .plaat{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}

  /* De twee pillen en de voetregel: op de plaat en op het verhaal dezelfde,
     zodat een kind ziet dat de twee bladzijden bij elkaar horen. */
  .merkpil{position:absolute;top:7mm;left:8mm;background:${K.nacht};color:${K.creme};
           font-size:8pt;font-weight:800;letter-spacing:.16em;text-transform:uppercase;
           padding:2mm 5mm;border-radius:99mm}
  .woordpil{position:absolute;top:7mm;right:8mm;background:${K.zellige};color:#fff;
            font-size:8pt;font-weight:800;letter-spacing:.16em;text-transform:uppercase;
            padding:2mm 5mm;border-radius:99mm}
  .woordpil.donker{background:${K.nacht}}
  /* De voetregel staat op een geschilderde plaat en die kan overal licht of
     donker zijn. Een klein donker balkje eronder werkt op allebei; een
     schaduw alleen werkt op licht zand niet. */
  .voetregel{position:absolute;left:50%;transform:translateX(-50%);bottom:4mm;text-align:center;
             font-size:7.5pt;font-weight:600;letter-spacing:.06em;color:${K.creme};
             background:rgba(19,27,48,.55);padding:1.2mm 5mm;border-radius:99mm}
  .voetregel.donker{color:${K.inkt};opacity:.45;background:none;padding:0}

  /* De woordkaart op de plaat: het moment waar het kind naar kijkt. */
  /* De kaart staat linksonder en niet in het midden: dan blijft de rechter
     helft van de plaat vrij voor wie er op staat. Dat is ook de regel die in
     de platenlijst aan de illustrator wordt meegegeven. */
  .woordkaart{position:absolute;left:10mm;bottom:11mm;width:84mm;background:${K.creme};
              border-radius:6mm;padding:5mm 7mm 5.5mm;text-align:center;
              box-shadow:0 3mm 10mm rgba(43,29,22,.28)}
  .woordkaart .tr{font-size:23pt;font-weight:800;letter-spacing:.03em;text-transform:uppercase;
                  line-height:1.05;color:${K.inkt}}
  .woordkaart .ar{font-family:'Naskh',serif;font-weight:700;direction:rtl;font-size:18pt;
                  line-height:1.6;color:${K.zellige}}
  .woordkaart .nl{font-size:12pt;font-weight:800;color:${K.inkt};margin-top:.5mm}
  .woordkaart .hardop{display:inline-block;margin-top:3mm;background:${K.saffraan};color:#3a2409;
                      font-size:9pt;font-weight:800;padding:1.8mm 5.5mm;border-radius:99mm}

  .verhaalblad{display:flex;flex-direction:column;justify-content:center;gap:8mm;
               background:${K.creme};padding:24mm 24mm 20mm}
  .verhaal{flex:0 0 auto}
  .verhaal p{font-size:17pt;line-height:1.45}
  .verhaal .echo{margin-top:5mm;font-size:19pt;font-weight:800;color:${K.terra}}
  .kaartje{align-self:flex-start;display:flex;align-items:baseline;gap:5mm;
           background:${K.creme};border-radius:5mm;padding:3.5mm 7mm;
           box-shadow:0 1mm 4mm rgba(43,29,22,.12)}
  .kaartje .ar{font-family:'Naskh',serif;font-weight:700;direction:rtl;font-size:20pt;
               line-height:1.5;color:${K.zellige}}
  .kaartje .tr{font-size:13pt;font-weight:800;color:${K.inkt}}
  .kaartje .nl{font-size:10.5pt;opacity:.7}

  .omslag{background:linear-gradient(160deg,#1b2340,#131b30 55%,#0b1020);color:${K.creme};
          display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4mm}
  .omslag .leeuw{width:60mm}
  .omslag h1{font-size:30pt;font-weight:800;line-height:1.05;max-width:150mm}
  .omslag .sub{font-size:12pt;opacity:.85}
  .omslag .leeftijd{margin-top:2mm;background:${K.saffraan};color:#1a1625;font-size:11pt;font-weight:800;
                    padding:2mm 6mm;border-radius:99mm}

  .tekstblad{background:${K.zand};padding:16mm 20mm;display:flex;flex-direction:column;justify-content:center;gap:5mm}
  .tekstblad h2{font-size:18pt;font-weight:800}
  .tekstblad p{font-size:11.5pt;line-height:1.5;max-width:150mm}
  .wie{display:grid;grid-template-columns:1fr 1fr;gap:4mm 8mm}
  .wie div{font-size:10pt;line-height:1.35}
  .wie b{font-size:11.5pt}
  .lijst{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm}
  .lijst div{background:${K.creme};border-radius:4mm;padding:3mm;text-align:center}
  .lijst .ar{font-family:'Naskh',serif;font-weight:700;direction:rtl;font-size:19pt;line-height:1.5}
  .lijst .tr{font-size:10pt;font-weight:800;color:#8a5a12}
  .lijst .nl{font-size:9pt;opacity:.75}
</style>
<body>

<section class="omslag">
  <svg class="leeuw" viewBox="0 0 300 260">${sba(150, 90, 1.5, { tas: false })}</svg>
  <h1>${esc(DEEL1.titel)}</h1>
  <div class="sub">${esc(DEEL1.ondertitel)}</div>
  <div class="leeftijd">${esc(DEEL1.leeftijd)}</div>
</section>

<section class="tekstblad" style="justify-content:center;text-align:center">
  <h2 style="font-size:24pt">${esc(DEEL1.titel)}</h2>
  <p style="font-size:13pt;opacity:.75">${esc(DEEL1.ondertitel)}</p>
  <p style="font-size:12pt;opacity:.7;font-style:italic;max-width:120mm;margin:6mm auto 0">${esc(DEEL1.opdracht)}</p>
  <p style="margin-top:12mm;font-size:11pt;font-weight:800;opacity:.6">${esc(S.deel(DEEL1.nummer))}</p>
</section>

<section class="tekstblad" style="justify-content:center;text-align:center">
  <svg viewBox="0 0 300 190" style="width:80mm;align-self:center">${sba(150, 70, 1.15)}</svg>
  <h2 style="font-size:17pt">${esc(S.waarSpeelt)}</h2>
  <p style="font-size:13pt">${esc(DEEL1.waar ?? '')}</p>
</section>

<section class="tekstblad">
  <h2>${esc(S.wieMee)}</h2>
  <div class="wie">
    ${CAST.map((f) => `<div><b>${esc(f.naam)}</b>${f.leeftijd ? ` · ${f.leeftijd} ${esc(S.jaar)}` : ''}<br>${esc(f.wie)}</div>`).join('')}
  </div>
  <p style="opacity:.75">${esc(DEEL1.opdracht)}</p>
</section>

${DEEL1.bladen.map((blad, i) => bladzijde(blad, i + 1)).join('\n')}

<section class="tekstblad">
  <h2>${esc(S.deWoorden)}</h2>
  <div class="lijst">
    ${DEEL1.bladen.slice(0, 6).map((b) => `<div><div class="ar">${esc(b.woord.ar)}</div><div class="tr">${esc(b.woord.tr)}</div><div class="nl">${esc(b.woord.nl)}</div></div>`).join('')}
  </div>
  <div class="lijst">
    ${DEEL1.bladen.slice(6).map((b) => `<div><div class="ar">${esc(b.woord.ar)}</div><div class="tr">${esc(b.woord.tr)}</div><div class="nl">${esc(b.woord.nl)}</div></div>`).join('')}
  </div>
  <p>${esc(S.uitleg)}</p>
  <p style="opacity:.7">${esc(S.deel(DEEL1.nummer))}</p>
</section>

<section class="tekstblad" style="justify-content:center;text-align:center">
  <h2 style="font-size:19pt">${esc(S.hierna)}</h2>
  <p style="font-size:14pt;max-width:120mm;margin:0 auto">${esc(DEEL1.hierna ?? '')}</p>
  <svg viewBox="0 0 300 190" style="width:70mm;align-self:center;margin-top:8mm">${sba(150, 70, 1.1, { kijk: 1 })}</svg>
</section>

</body></html>`

await mkdir(path.dirname(UIT), { recursive: true })
const tijdelijk = path.join(tmpdir(), `.prentenboek-${TAAL}.html`)
await writeFile(tijdelijk, html)

const browser = await chromium.launch({ executablePath: CHROME })
const blad = await browser.newPage()
await blad.goto(`file://${tijdelijk}`, { waitUntil: 'networkidle' })
await blad.emulateMedia({ media: 'print' })
await blad.pdf({ path: UIT, width: '210mm', height: '148mm', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } })
await browser.close()
await server.close()

const grootte = (await readFile(UIT)).length
console.log(`\n${path.relative(ROOT, UIT)} — ${DEEL1.bladen.length} platen, ${(grootte / 1e6).toFixed(1)} MB\n`)
