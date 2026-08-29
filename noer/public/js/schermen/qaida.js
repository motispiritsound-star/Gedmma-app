// De Qaida-lessen als leerpad: een slingerend pad met een bol per les.
// Je ziet in één blik waar je bent, wat af is en wat er nog op slot zit.

import { el, zet, sterren, balk, svg } from '../ui.js';
import { icoon } from '../iconen.js';
import { LESSEN, LES_OP_ID } from '../../data/qaida.js';
import { voortgang, bewaarLes } from '../opslag.js';
import { spreekUit } from '../geluid.js';
import * as leesladder from '../spellen/leesladder.js';
import * as klankjacht from '../spellen/klankjacht.js';
import * as vormenpuzzel from '../spellen/vormenpuzzel.js';
import * as koppelen from '../spellen/koppelen.js';
import { ga } from '../app.js';

const SPELLEN = { leesladder, klankjacht, vormenpuzzel, koppelen };

/** Een les gaat pas open als de vorige twee sterren heeft. */
export function isOpen(les, v = voortgang()) {
  if (les.nr === 1) return true;
  return Boolean(v.lessen[LESSEN[les.nr - 2].id]?.af);
}

// Geometrie van het pad. Het is een vaste, smalle kolom — ook op een tablet,
// net als in de leer-apps waar dit vandaan komt.
const BREED = 320;
const TOP = 54;
const RUIMTE = 146;
const SLINGER = [0, 56, 80, 56, 0, -56, -80, -56];

const padPunten = () => LESSEN.map((les, i) => ({
  les,
  x: BREED / 2 + SLINGER[i % SLINGER.length],
  y: TOP + i * RUIMTE,
}));

export function toon(bak) {
  const v = voortgang();
  const punten = padPunten();
  const hoogte = TOP + (LESSEN.length - 1) * RUIMTE + 92;
  const af = LESSEN.filter((l) => v.lessen[l.id]?.af).length;
  const huidige = LESSEN.find((l) => !v.lessen[l.id]?.af && isOpen(l, v));

  // Eén lijnstuk per overgang: groen als de les erna al af is, anders grijs.
  const lijnen = punten.slice(1).map((b, i) => {
    const a = punten[i];
    const helft = (b.y - a.y) / 2;
    return svg('path', {
      class: `padlijn ${v.lessen[b.les.id]?.af || v.lessen[a.les.id]?.af ? 'gedaan' : ''}`.trim(),
      d: `M ${a.x} ${a.y} C ${a.x} ${a.y + helft}, ${b.x} ${b.y - helft}, ${b.x} ${b.y}`,
    });
  });

  zet(bak, 
    el('header', { class: 'schermkop' },
      el('h1', { tekst: 'Leren lezen' }),
      el('p', { class: 'klein', tekst: `${af} van de ${LESSEN.length} lessen af. Haal twee sterren om de volgende te openen.` }),
      balk(af / LESSEN.length, 'Voortgang door de lessen')),

    el('div', { class: 'leerpad', stijl: { height: `${hoogte}px` } },
      svg('svg', { class: 'padlijnen', viewBox: `0 0 ${BREED} ${hoogte}`,
        preserveAspectRatio: 'none', 'aria-hidden': 'true' }, ...lijnen),
      ...punten.map(({ les, x, y }) => padBol(les, v, x, y, hoogte, les === huidige)),
    ),
  );
}

function padBol(les, v, x, y, hoogte, isHuidig) {
  const stand = v.lessen[les.id] || { sterren: 0, af: false };
  const open = isOpen(les, v);
  const staat = stand.af ? 'af' : open ? 'open' : 'slot';

  const label = open
    ? `Les ${les.nr}: ${les.titel}. ${stand.sterren} van 3 sterren.`
    : `Les ${les.nr}: ${les.titel}. Nog op slot — maak eerst les ${les.nr - 1} af.`;

  return el(open ? 'a' : 'div', {
    class: `padstap ${staat} ${isHuidig ? 'huidig' : ''}`.trim(),
    href: open ? `#/qaida/${les.id}` : null,
    'aria-label': label,
    'aria-disabled': open ? null : 'true',
    stijl: { left: `${(x / BREED) * 100}%`, top: `${(y / hoogte) * 100}%` },
  },
    isHuidig ? el('span', { class: 'padwijzer', tekst: stand.sterren ? 'Verder' : 'Start' }) : null,
    el('span', { class: 'padbol' },
      stand.af ? icoon('vink', { maat: 30 })
        : open ? el('b', { tekst: String(les.nr) })
        : icoon('slot', { maat: 24 })),
    el('span', { class: 'padnaam', tekst: les.titel }),
    open ? sterren(stand.sterren) : null,
  );
}

export function toonLes(bak, id) {
  const les = LES_OP_ID[id];
  if (!les) return ga('/qaida');
  const v = voortgang();
  if (!isOpen(les, v)) return ga('/qaida');
  const stand = v.lessen[les.id] || { sterren: 0, goed: 0, fout: 0 };

  const startSpel = () => {
    const spel = SPELLEN[les.spel] || leesladder;
    spel.start(bak, {
      les,
      terug: () => toonLes(bak, id),
      opKlaar: (r) => {
        bewaarLes(les.id, { sterren: r.sterren, goed: r.goed, fout: r.fout });
        if (r.nogmaals) startSpel(); else toonLes(bak, id);
      },
    });
  };

  zet(bak, 
    el('header', { class: 'schermkop met-terug' },
      el('a', { class: 'icoonknop', href: '#/qaida', 'aria-label': 'Terug naar de lessen' }, icoon('terug')),
      el('div', {},
        el('p', { class: 'kruimel', tekst: `Les ${les.nr} van ${LESSEN.length}` }),
        el('h1', { tekst: les.titel }))),

    el('section', { class: 'kaart uitleg' },
      el('p', { tekst: les.uitleg }),
      sterren(stand.sterren),
      el('button', { class: 'knop groot', tekst: stand.sterren ? 'Nog een keer oefenen' : 'Start de oefening',
        opclick: startSpel })),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Het oefenblad' }),
      el('p', { class: 'klein', tekst: 'Lees hardop, van rechts naar links. Tik op een vakje om het te horen.' }),
      el('div', { class: 'blad', dir: 'rtl',
        stijl: { '--kolommen': String(Math.max(...les.rijen.map((r) => r.length))) } },
        ...les.rijen.map((rij) =>
          el('div', { class: 'bladrij' }, ...rij.map((item) =>
            el('button', { class: 'bladvak', lang: 'ar', 'aria-label': `${item.tr}, luister`,
              opclick: (e) => { if (!spreekUit(item.ar)) e.currentTarget.classList.add('stil'); } },
              el('span', { class: 'ar', tekst: item.ar }),
              el('span', { class: 'blad-tr', dir: 'ltr', tekst: item.tr }))))))),
  );
}
