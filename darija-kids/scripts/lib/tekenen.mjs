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
 * Sbaa, zoals hij eruitziet.
 *
 * Het ontwerp ligt vast in `docs/SBAA.md`, met de tekening ernaast waar alles
 * op teruggaat: een jonge leeuw in een blauwe djellaba met Amazigh-ruiten,
 * een rode fez met kwast, een leren schoudertas en rode babouches. Dit is de
 * vectorversie daarvan — eenvoudiger, maar dezelfde leeuw. Wie hem ziet op
 * de website en daarna op de kaft, moet hem herkennen.
 *
 * De vier dingen waaraan hij te herkennen is, ook op twee centimeter hoog:
 * de rode fez, het blauw van de djellaba, de tas, en de rode schoenen.
 */
export const sbaa = (x, y, s = 1, { kijk = 0, tas = true } = {}) => `<g transform="translate(${x} ${y}) scale(${s})">
  <!-- staart -->
  <path d="M-38 118 Q-62 128 -56 150" fill="none" stroke="${K.vacht}" stroke-width="9" stroke-linecap="round"/>
  <path d="M-58 148 q-9 6 -4 16 q7 4 10 -4 q3 -9 -6 -12 Z" fill="${K.vachtLicht}"/>

  <!-- schoenen -->
  <path d="M-30 158 q-14 2 -14 10 q0 5 8 5 l22 0 q5 0 5 -6 l0 -9 Z" fill="#c1272d"/>
  <path d="M30 158 q14 2 14 10 q0 5 -8 5 l-22 0 q-5 0 -5 -6 l0 -9 Z" fill="#c1272d"/>

  <!-- djellaba: wit onderkleed, blauwe mantel, rode sjerp -->
  <path d="M-30 46 L30 46 L36 160 L-36 160 Z" fill="#f6eddd"/>
  <path d="M-30 46 Q0 58 30 46 L44 160 L20 160 L14 60 L-14 60 L-20 160 L-44 160 Z" fill="#2f5fb3"/>
  <path d="M-44 160 L-20 160 L-20 168 L-44 168 Z" fill="#2a4f96"/>
  <path d="M20 160 L44 160 L44 168 L20 168 Z" fill="#2a4f96"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${-40 + i * 6} ${142} l3 -7 l3 7 l-3 7 Z" fill="#e8b93f"/>`).join('')}
  ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${22 + i * 6} ${142} l3 -7 l3 7 l-3 7 Z" fill="#e8b93f"/>`).join('')}
  <path d="M-16 86 L16 86 L16 98 L-16 98 Z" fill="#c1272d"/>
  ${[0, 1, 2].map((i) => `<path d="M${-9 + i * 9} 92 l4 -6 l4 6 l-4 6 Z" fill="#f6eddd"/>`).join('')}

  <!-- armen -->
  <path d="M-30 58 L-46 96" stroke="#2f5fb3" stroke-width="15" stroke-linecap="round"/>
  <path d="M30 58 L46 96" stroke="#2f5fb3" stroke-width="15" stroke-linecap="round"/>
  <circle cx="-47" cy="100" r="8" fill="${K.vacht}"/>
  <circle cx="47" cy="100" r="8" fill="${K.vacht}"/>

  ${tas ? `<path d="M-24 50 L28 104" stroke="#8d5a3b" stroke-width="7"/>
  <rect x="22" y="96" width="34" height="28" rx="6" fill="#a9713f"/>
  <path d="M22 104 L56 104" stroke="#8d5a3b" stroke-width="4"/>
  <rect x="34" y="100" width="10" height="9" rx="2" fill="#e8b93f"/>` : ''}

  <g transform="translate(${kijk * 4} 0)">
    <!-- manen -->
    ${Array.from({ length: 14 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 14
      return `<ellipse cx="${(Math.cos(a) * 32).toFixed(1)}" cy="${(Math.sin(a) * 32).toFixed(1)}" rx="12" ry="8" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${(Math.cos(a) * 32).toFixed(1)} ${(Math.sin(a) * 32).toFixed(1)})" fill="${K.vachtLicht}"/>`
    }).join('')}
    <circle cx="-25" cy="-20" r="10" fill="${K.vacht}"/>
    <circle cx="25" cy="-20" r="10" fill="${K.vacht}"/>
    <circle cx="-25" cy="-20" r="5" fill="#d98f6a"/>
    <circle cx="25" cy="-20" r="5" fill="#d98f6a"/>
    <circle cx="0" cy="0" r="29" fill="${K.vacht}"/>
    <ellipse cx="0" cy="9" rx="19" ry="14" fill="${K.snuit}"/>
    <circle cx="-11" cy="-5" r="4" fill="${K.inkt}"/>
    <circle cx="11" cy="-5" r="4" fill="${K.inkt}"/>
    <circle cx="-9.5" cy="-6.5" r="1.4" fill="#fff"/>
    <circle cx="12.5" cy="-6.5" r="1.4" fill="#fff"/>
    <path d="M-17 -13 q6 -4 11 -1 M17 -13 q-6 -4 -11 -1" stroke="${K.inkt}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M-4 4 L4 4 L0 9 Z" fill="#8d5a3b"/>
    <path d="M0 9 L0 13 M0 13 Q-7 19 -12 13 M0 13 Q7 19 12 13" stroke="${K.inkt}" stroke-width="2.4" fill="none" stroke-linecap="round"/>

    <!-- fez met kwast -->
    <path d="M-19 -30 L19 -30 L16 -52 L-16 -52 Z" fill="#c1272d"/>
    <ellipse cx="0" cy="-52" rx="16" ry="4.5" fill="#d8352c"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M${-13 + i * 9} -34 l3.5 -6 l3.5 6 l-3.5 6 Z" fill="#e8b93f"/>`).join('')}
    <path d="M0 -52 q14 2 16 14" stroke="#e8b93f" stroke-width="2.6" fill="none"/>
    <circle cx="16" cy="-36" r="4" fill="#e8b93f"/>
  </g>
</g>`
