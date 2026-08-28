// De Qaida-lessen: van losse letter tot echt lezen. Elke les heeft een
// oefenblad (zoals in het boekje) en een spel.

import { el, leeg, sterren } from '../ui.js';
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
  const vorige = LESSEN[les.nr - 2];
  return Boolean(v.lessen[vorige.id]?.af);
}

export function toon(bak) {
  const v = voortgang();
  leeg(bak).append(
    el('header', { class: 'schermkop' },
      el('h1', { tekst: 'Leren lezen' }),
      el('p', { tekst: 'Tien stappen. Haal twee sterren om de volgende stap te openen.' })),
    el('ol', { class: 'lessenlijst' }, ...LESSEN.map((les) => {
      const stand = v.lessen[les.id] || { sterren: 0 };
      const open = isOpen(les, v);
      return el('li', {},
        el(open ? 'a' : 'div', {
          class: `lesregel ${open ? '' : 'op-slot'} ${stand.af ? 'af' : ''}`.trim(),
          href: open ? `#/qaida/${les.id}` : null,
          'aria-disabled': open ? null : 'true',
        },
          el('span', { class: 'lesnummer', tekst: open ? String(les.nr) : '🔒' }),
          el('div', { class: 'lesinfo' },
            el('b', { tekst: les.titel }),
            el('span', { class: 'klein', tekst: les.ondertitel })),
          sterren(stand.sterren)));
    })));
}

export function toonLes(bak, id) {
  const les = LES_OP_ID[id];
  if (!les) return ga('/qaida');
  const v = voortgang();
  if (!isOpen(les, v)) return ga('/qaida');
  const stand = v.lessen[les.id] || { sterren: 0, goed: 0, fout: 0 };

  const startSpel = () => {
    const spel = SPELLEN[les.spel] || leesladder;
    const opties = {
      les,
      terug: () => toonLes(bak, id),
      opKlaar: (r) => {
        bewaarLes(les.id, { sterren: r.sterren, goed: r.goed, fout: r.fout });
        if (r.nogmaals) startSpel(); else toonLes(bak, id);
      },
    };
    spel.start(bak, opties);
  };

  leeg(bak).append(
    el('header', { class: 'schermkop met-terug' },
      el('a', { class: 'terug', href: '#/qaida', 'aria-label': 'Terug naar de lessen', tekst: '←' }),
      el('h1', { tekst: `Les ${les.nr}: ${les.titel}` })),

    el('section', { class: 'kaart uitleg' },
      el('p', { tekst: les.uitleg }),
      sterren(stand.sterren),
      el('button', { class: 'knop groot', tekst: stand.sterren ? 'Nog een keer oefenen' : 'Start de oefening',
        opclick: startSpel })),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Het oefenblad' }),
      el('p', { class: 'klein', tekst: 'Lees hardop, van rechts naar links. Tik op een vakje om het te horen.' }),
      el('div', { class: 'blad', dir: 'rtl' }, ...les.rijen.map((rij) =>
        el('div', { class: 'bladrij' }, ...rij.map((item) =>
          el('button', { class: 'bladvak', lang: 'ar',
            opclick: (e) => { if (!spreekUit(item.ar)) e.currentTarget.classList.add('stil'); } },
            el('span', { class: 'ar', tekst: item.ar }),
            el('span', { class: 'blad-tr', dir: 'ltr', tekst: item.tr }))))))),
  );
}
