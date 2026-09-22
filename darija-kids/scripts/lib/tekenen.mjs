/**
 * Wat het prentenboek en de website allebei tekenen.
 *
 * Sbaa staat op de kaft van het boek en op de boekenpagina van de site. Eén
 * leeuw, één bestand -- want twee leeuwen die bijna hetzelfde zijn, zijn op
 * den duur twee verschillende leeuwen.
 */

/** De kleuren van de reeks. */
export const K = {
  inkt: '#2b1d16', creme: '#fffaf3', zand: '#f4e3c8', saffraan: '#f59e0b',
  terra: '#e2603c', zellige: '#0d9488', nacht: '#131b30', rood: '#c1272d',
  vacht: '#e2984a', vachtLicht: '#f7c873', snuit: '#fff3e2', muur: '#e9cfa6',
  muurDonker: '#d8b585', lucht: '#bfe0ec', luchtAvond: '#f6b26b', blad: '#3f8f5f',
}

/**
 * Sbaa.
 *
 * Rond, zacht en groot. Zijn manen zijn een zon -- daar is hij aan te
 * herkennen, ook als hij maar twee centimeter hoog op de bladzijde staat.
 */
export const sbaa = (x, y, s = 1, { kijk = 0, tas = true } = {}) => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse cx="0" cy="62" rx="42" ry="34" fill="${K.vacht}"/>
  <path d="M-34 72 Q-52 86 -44 98 Q-36 104 -30 96" fill="none" stroke="${K.vacht}" stroke-width="9" stroke-linecap="round"/>
  <circle cx="-46" cy="98" r="7" fill="${K.vachtLicht}"/>
  ${tas ? `<path d="M-18 40 L18 64" stroke="#2f6fb3" stroke-width="6"/><rect x="14" y="56" width="26" height="22" rx="6" fill="#2f6fb3"/>` : ''}
  <g transform="translate(${kijk * 4} 0)">
    ${Array.from({ length: 14 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 14
      return `<ellipse cx="${(Math.cos(a) * 34).toFixed(1)}" cy="${(Math.sin(a) * 34).toFixed(1)}" rx="13" ry="9" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${(Math.cos(a) * 34).toFixed(1)} ${(Math.sin(a) * 34).toFixed(1)})" fill="${K.vachtLicht}"/>`
    }).join('')}
    <circle cx="-24" cy="-22" r="10" fill="${K.vacht}"/>
    <circle cx="24" cy="-22" r="10" fill="${K.vacht}"/>
    <circle cx="0" cy="0" r="30" fill="${K.vacht}"/>
    <ellipse cx="0" cy="8" rx="20" ry="15" fill="${K.snuit}"/>
    <circle cx="-11" cy="-6" r="3.4" fill="${K.inkt}"/>
    <circle cx="11" cy="-6" r="3.4" fill="${K.inkt}"/>
    <path d="M-4 3 L4 3 L0 8 Z" fill="${K.inkt}"/>
    <path d="M0 8 L0 12 M0 12 Q-7 18 -12 12 M0 12 Q7 18 12 12" stroke="${K.inkt}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  </g>
</g>`
