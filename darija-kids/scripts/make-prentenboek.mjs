/**
 * Tekent en zet het prentenboek: Sbaa de Atlasleeuw, deel 1.
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
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { K, sbaa } from './lib/tekenen.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const TAAL = arg('taal', 'nl')
const UIT = arg('uit', path.join(ROOT, 'store', 'prentenboek', `sbaa-1-${TAAL}.pdf`))

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
  return `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-11 56 L-11 74" stroke="${k.huid}" stroke-width="8" stroke-linecap="round"/>
  <path d="M11 56 L11 74" stroke="${k.huid}" stroke-width="8" stroke-linecap="round"/>
  <path d="M-15 74 L-6 74" stroke="${K.inkt}" stroke-width="7" stroke-linecap="round"/>
  <path d="M6 74 L15 74" stroke="${K.inkt}" stroke-width="7" stroke-linecap="round"/>
  <path d="M-16 20 L16 20 L19 58 L-19 58 Z" fill="${k.jas}"/>
  <path d="M-16 24 L-26 ${44 - arm * 16}" stroke="${k.jas}" stroke-width="9" stroke-linecap="round"/>
  <path d="M16 24 L26 ${44 - arm * 16}" stroke="${k.jas}" stroke-width="9" stroke-linecap="round"/>
  <circle cx="-27" cy="${45 - arm * 16}" r="4.5" fill="${k.huid}"/>
  <circle cx="27" cy="${45 - arm * 16}" r="4.5" fill="${k.huid}"/>
  <circle cx="0" cy="2" r="16" fill="${k.huid}"/>
  <path d="M-16 -2 Q0 -22 16 -2 Q10 -12 0 -12 Q-10 -12 -16 -2 Z" fill="${k.haar}"/>
  ${k.ding === 'pet' ? `<path d="M-17 -3 Q0 -24 17 -3 Z" fill="#2f6fb3"/><path d="M-17 -3 L-26 0" stroke="#2f6fb3" stroke-width="5" stroke-linecap="round"/>` : ''}
  <circle cx="-5.5" cy="3" r="2.2" fill="${K.inkt}"/>
  <circle cx="5.5" cy="3" r="2.2" fill="${K.inkt}"/>
  <path d="M-4 9 Q0 13 4 9" stroke="${K.inkt}" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${k.ding === 'kaart' ? `<rect x="20" y="${38 - arm * 16}" width="18" height="13" rx="2" fill="${K.creme}" stroke="${K.inkt}" stroke-width="1.5"/>` : ''}
  ${k.ding === 'schets' ? `<rect x="18" y="${36 - arm * 16}" width="16" height="18" rx="2" fill="${K.creme}" stroke="${K.inkt}" stroke-width="1.5"/>` : ''}
</g>`
}

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
    ${sbaa(470, 270, 1.62, { kijk: -1 })}
    ${kind('adil', 690, 360, 0.85, { arm: 1 })}
    ${kind('rayan', 780, 376, 0.7, { arm: 1 })}
    ${kind('yousra', 862, 360, 0.85)}
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
    ${sbaa(180, 370, 1.37)}
    ${kind('adil', 700, 410, 0.8, { arm: 1 })}
    ${kind('rayan', 775, 424, 0.66)}
    ${kind('adam', 845, 410, 0.78)}`,

  welkom: () => `
    <defs>${lucht('l3', '#f3e0bd', '#e7c79a')}</defs>
    <rect width="1000" height="700" fill="url(#l3)"/>
    ${muurStuk(0, 60, 1000, 640)}
    ${boog(560, 190, 300, 510, '#8d5a3b')}
    ${boog(585, 215, 250, 485, '#f6dca8')}
    ${tegelband(560, 140, 300, 40, K.terra)}
    ${volwassene(700, 270, 1.35, { jas: K.terra, doek: '#f0c14b' })}
    ${theepot(790, 400, 1.3)}
    ${sbaa(180, 320, 1.43, { kijk: 1 })}
    ${kind('yousra', 360, 360, 0.82, { arm: 1 })}
    ${kind('rayan', 440, 374, 0.68, { arm: 1 })}
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
    ${sbaa(500, 240, 1.82)}
    ${kind('adil', 350, 410, 0.72)}
    ${kind('yassine', 640, 418, 0.7, { arm: 1 })}
    ${kat(830, 660, 1.1)}`,

  ezel: () => `
    <defs>${lucht('l5', '#cfe6f0', '#f2dfc0')}</defs>
    <rect width="1000" height="700" fill="url(#l5)"/>
    ${muurStuk(0, 90, 1000, 610)}
    ${boog(60, 300, 150, 400, '#8d5a3b')}
    <rect y="640" width="1000" height="60" fill="#cbb08a"/>
    ${ezel(600, 520, 1.25)}
    ${volwassene(760, 370, 1.2, { jas: '#6b7f4a' })}
    ${sbaa(180, 370, 1.30, { kijk: 1 })}
    ${kind('amir', 330, 410, 0.8, { arm: 1 })}
    ${kind('rayan', 405, 424, 0.66, { arm: 1 })}`,

  brood: () => `
    <defs>${lucht('l6', '#f0dcb6', '#e6c795')}</defs>
    <rect width="1000" height="700" fill="url(#l6)"/>
    ${muurStuk(0, 40, 1000, 660)}
    ${boog(150, 200, 300, 330, '#3a2a20')}
    <rect x="150" y="500" width="300" height="34" fill="#8d5a3b"/>
    ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${190 + i * 58}" cy="${486}" r="26" fill="#e7b96b" stroke="#c98f4a" stroke-width="4"/>`).join('')}
    <circle cx="300" cy="350" r="60" fill="${K.saffraan}" opacity=".35"/>
    ${volwassene(300, 190, 1.15, { jas: '#cbbba4' })}
    ${sbaa(760, 340, 1.37, { kijk: -1 })}
    ${kind('adam', 560, 390, 0.9, { arm: 1 })}
    ${kind('rayan', 640, 406, 0.68)}
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
    ${sbaa(880, 370, 1.10)}
    ${kind('yassine', 700, 410, 0.8, { arm: 1 })}
    ${kind('rayan', 620, 424, 0.66)}`,

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
    ${sbaa(500, 370, 1.30)}
    ${kind('amir', 620, 430, 0.72, { arm: 1 })}
    ${kind('rayan', 690, 442, 0.62)}`,

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
    ${sbaa(760, 340, 1.37, { kijk: -1, tas: false })}
    ${kind('yousra', 620, 360, 0.78)}
    ${kind('rayan', 690, 376, 0.64)}`,

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
    ${sbaa(180, 360, 1.30, { kijk: 1 })}
    ${kind('yousra', 700, 390, 0.85, { arm: 1 })}
    ${kind('rayan', 790, 404, 0.68)}`,

  jedda: () => `
    <defs>${lucht('l11', '#3c4a6b', '#7a6a7d')}</defs>
    <rect width="1000" height="700" fill="url(#l11)"/>
    ${muurStuk(0, 80, 1000, 620)}
    ${boog(600, 210, 300, 490, '#3a2a20')}
    ${boog(625, 235, 250, 465, '#ffd79a')}
    <polygon points="625,700 875,700 1000,690 500,690" fill="#ffd79a" opacity=".28"/>
    ${volwassene(750, 290, 1.3, { jas: '#8a6ea0', doek: '#f0e2c0', grijs: true })}
    ${lantaarn(420, 170, 1.7)}
    ${sbaa(180, 340, 1.30)}
    ${kind('rayan', 460, 396, 0.72, { arm: 1 })}
    ${kind('adil', 370, 380, 0.8)}`,

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
    ${sbaa(760, 340, 1.43, { kijk: -1 })}
    ${kind('rayan', 330, 410, 0.7, { arm: 1 })}
    ${kind('adil', 250, 394, 0.78, { arm: 1 })}
    ${kind('yousra', 410, 394, 0.78)}`,
}

/* ------------------------------------------------------------- de bladzijde */

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const plaat = (naam) => {
  const teken = SCENES[naam]
  if (!teken) throw new Error(`geen plaat met de naam ${naam}`)
  return `<svg class="plaat" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">${teken()}</svg>`
}

const bladzijde = (blad, nr) => `<section class="blad">
  ${plaat(blad.scene)}
  <div class="onder">
    <div class="verhaal">
      ${blad.tekst.map((regel) => `<p>${esc(regel)}</p>`).join('')}
      <p class="echo">${esc(blad.echo)}</p>
    </div>
    <div class="kaartje">
      <div class="ar">${esc(blad.woord.ar)}</div>
      <div class="tr">${esc(blad.woord.tr)}</div>
      <div class="nl">${esc(blad.woord.nl)}</div>
      <div class="spoor">${nr}</div>
    </div>
  </div>
</section>`

/* ------------------------------------------------------------------ zetten */

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ DEEL1, CAST }] = await Promise.all([server.ssrLoadModule('/src/content/prentenboek.ts')])

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
  .plaat{position:absolute;inset:0;width:100%;height:100%}

  .onder{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:flex-end;
         gap:6mm;padding:7mm 8mm;}
  .verhaal{flex:1 1 auto;background:rgba(255,250,243,.93);border-radius:6mm;padding:6mm 7mm;
           box-shadow:0 2mm 6mm rgba(43,29,22,.18)}
  .verhaal p{font-size:13pt;line-height:1.35}
  .verhaal .echo{margin-top:2.5mm;font-size:14pt;font-weight:800;color:${K.terra}}
  .kaartje{flex:0 0 46mm;background:${K.saffraan};border-radius:6mm;padding:4mm 3mm;text-align:center;
           box-shadow:0 2mm 6mm rgba(43,29,22,.22);position:relative}
  .kaartje .ar{font-family:'Naskh',serif;font-weight:700;direction:rtl;font-size:26pt;line-height:1.5}
  .kaartje .tr{font-size:13pt;font-weight:800;color:#6b3f10}
  .kaartje .nl{font-size:10.5pt;opacity:.8}
  .kaartje .spoor{position:absolute;top:-4mm;right:-4mm;width:10mm;height:10mm;border-radius:50%;
                  background:${K.inkt};color:${K.creme};font-size:11pt;font-weight:800;
                  display:flex;align-items:center;justify-content:center}

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
  .lijst{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}
  .lijst div{background:${K.creme};border-radius:4mm;padding:3mm;text-align:center}
  .lijst .ar{font-family:'Naskh',serif;font-weight:700;direction:rtl;font-size:19pt;line-height:1.5}
  .lijst .tr{font-size:10pt;font-weight:800;color:#8a5a12}
  .lijst .nl{font-size:9pt;opacity:.75}
</style>
<body>

<section class="omslag">
  <svg class="leeuw" viewBox="0 0 300 260">${sbaa(150, 90, 1.5, { tas: false })}</svg>
  <h1>${esc(DEEL1.titel)}</h1>
  <div class="sub">${esc(DEEL1.ondertitel)}</div>
  <div class="leeftijd">${esc(DEEL1.leeftijd)}</div>
</section>

<section class="tekstblad">
  <h2>Wie er meegaan</h2>
  <div class="wie">
    ${CAST.map((f) => `<div><b>${esc(f.naam)}</b>${f.leeftijd ? ` · ${f.leeftijd} jaar` : ''}<br>${esc(f.wie)}</div>`).join('')}
  </div>
  <p style="opacity:.75">${esc(DEEL1.opdracht)}</p>
</section>

${DEEL1.bladen.map((blad, i) => bladzijde(blad, i + 1)).join('\n')}

<section class="tekstblad">
  <h2>De twaalf woorden van dit boek</h2>
  <div class="lijst">
    ${DEEL1.bladen.map((b) => `<div><div class="ar">${esc(b.woord.ar)}</div><div class="tr">${esc(b.woord.tr)}</div><div class="nl">${esc(b.woord.nl)}</div></div>`).join('')}
  </div>
  <p>Elk woord is ingesproken door een Marokkaanse stem. Scan de code en je hoort ze alle twaalf — één keer gewoon, één keer langzaam.</p>
  <p style="opacity:.7">darijaforkids.eu · Sbaa deel ${DEEL1.nummer}</p>
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
