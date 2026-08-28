// Het alfabet: alle 28 letters, en per letter een kaart met vormen en klank.

import { el, leeg, husselen } from '../ui.js';
import { LETTERS, LETTER_OP_ID, MAKHRAJ } from '../../data/letters.js';
import { voortgang } from '../opslag.js';
import { zegLetter, heeftArabischeStem } from '../geluid.js';
import * as klankjacht from '../spellen/klankjacht.js';
import * as vormenpuzzel from '../spellen/vormenpuzzel.js';
import * as koppelen from '../spellen/koppelen.js';
import { ga } from '../app.js';

/** Hoe goed kent dit kind de letter: 0 (niet gezien) t/m 3. */
export function beheersing(letterId, v = voortgang()) {
  const l = v.letters[letterId];
  if (!l || l.goed === 0) return 0;
  const deel = l.goed / (l.goed + l.fout);
  if (l.goed >= 6 && deel >= 0.85) return 3;
  if (l.goed >= 3 && deel >= 0.6) return 2;
  return 1;
}

export function toon(bak) {
  const v = voortgang();
  const gekend = LETTERS.filter((l) => beheersing(l.id, v) >= 2).length;

  leeg(bak).append(
    el('header', { class: 'schermkop' },
      el('h1', { tekst: 'Het alfabet' }),
      el('p', { tekst: `${gekend} van de 28 letters ken je goed. Tik op een letter om hem te leren.` })),

    el('div', { class: 'letterrooster', dir: 'rtl' }, ...LETTERS.map((l) =>
      el('a', { class: `lettertegel niveau-${beheersing(l.id, v)}`, href: `#/letters/${l.id}`,
        lang: 'ar', title: l.naam },
        el('span', { class: 'ar', tekst: l.letter }),
        el('span', { class: 'lettertegel-naam', dir: 'ltr', tekst: l.naam })))),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Oefenen met alle letters' }),
      el('div', { class: 'knoprij' },
        el('button', { class: 'knop', tekst: '🎯 Klankjacht',
          opclick: () => klankjacht.start(bak, { terug: () => toon(bak), opKlaar: (r) => r.nogmaals ? klankjacht.start(bak, { terug: () => toon(bak), opKlaar: () => toon(bak) }) : toon(bak) }) }),
        el('button', { class: 'knop', tekst: '🧩 Vormenpuzzel',
          opclick: () => vormenpuzzel.start(bak, { terug: () => toon(bak), opKlaar: () => toon(bak) }) }),
        el('button', { class: 'knop', tekst: '🔗 Woorden bouwen',
          opclick: () => koppelen.start(bak, { terug: () => toon(bak), opKlaar: () => toon(bak) }) }))),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Waar komt de klank vandaan?' }),
      el('div', { class: 'makhraj-lijst' }, ...Object.entries(MAKHRAJ).map(([id, m]) =>
        el('div', { class: 'makhraj' },
          el('span', { class: 'stip', stijl: { background: m.kleur } }),
          el('div', {}, el('b', { tekst: m.naam }), el('p', { class: 'klein', tekst: m.uitleg }),
            el('p', { class: 'ar klein', dir: 'rtl', lang: 'ar',
              tekst: LETTERS.filter((l) => l.makhraj === id).map((l) => l.letter).join(' ') })))))),
  );
}

export function toonLetter(bak, id) {
  const l = LETTER_OP_ID[id];
  if (!l) return ga('/letters');
  const v = voortgang();
  const stand = v.letters[id] || { goed: 0, fout: 0 };
  const m = MAKHRAJ[l.makhraj];

  const melding = el('p', { class: 'klein stilmelding' });

  const spreek = async () => {
    const hoe = await zegLetter(l);
    melding.textContent = hoe === 'stil'
      ? 'Er staat nog geen opname klaar en dit apparaat heeft geen Arabische stem.'
      : hoe === 'stem' ? 'Voorgelezen door je apparaat.' : '';
  };

  leeg(bak).append(
    el('header', { class: 'schermkop met-terug' },
      el('a', { class: 'terug', href: '#/letters', 'aria-label': 'Terug naar het alfabet', tekst: '←' }),
      el('h1', {}, l.naam, el('span', { class: 'ar naam-ar', dir: 'rtl', lang: 'ar', tekst: l.naamAr }))),

    el('section', { class: 'letterheld', stijl: { '--kleur': m.kleur } },
      el('div', { class: 'ar letter-groot', dir: 'rtl', lang: 'ar', tekst: l.letter }),
      el('button', { class: 'knop luisterknop', tekst: '🔊 Luister', opclick: spreek }),
      melding,
      el('p', { class: 'klank', tekst: l.klank }),
      el('p', { class: 'tip', tekst: `💡 ${l.tip}` })),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'De vier vormen' }),
      el('p', { class: 'klein', tekst: l.verbindt
        ? 'Deze letter verandert van vorm, afhankelijk van waar hij staat.'
        : 'Deze letter verbindt niet naar links. Begin- en middenvorm zien er daarom uit als los en eind.' }),
      el('div', { class: 'vormen', dir: 'rtl' },
        ...[['los', 'Los'], ['begin', 'Begin'], ['midden', 'Midden'], ['eind', 'Eind']].map(([sleutel, label]) =>
          el('div', { class: 'vorm' },
            el('span', { class: 'ar', lang: 'ar', tekst: l.vormen[sleutel] }),
            el('span', { class: 'klein', dir: 'ltr', tekst: label }))))),

    el('section', { class: 'kaart voorbeeldkaart' },
      el('h2', { tekst: 'Een woord met deze letter' }),
      el('div', { class: 'voorbeeld' },
        el('span', { class: 'plaatje', tekst: l.voorbeeld.emoji }),
        el('div', {},
          el('div', { class: 'ar woord-groot', dir: 'rtl', lang: 'ar', tekst: l.voorbeeld.woord }),
          el('p', { tekst: `${l.voorbeeld.translit} — ${l.voorbeeld.betekenis}` })))),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Uitspraakplaats' }),
      el('p', {}, el('span', { class: 'stip', stijl: { background: m.kleur } }), ` ${m.naam}: ${m.uitleg}`)),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Oefen deze letter' }),
      el('p', { class: 'klein', tekst: `Tot nu toe: ${stand.goed} goed, ${stand.fout} fout.` }),
      el('div', { class: 'knoprij' },
        el('button', { class: 'knop', tekst: 'Oefen met lijkende letters',
          opclick: () => {
            const groep = husselen([l, ...LETTERS.filter((x) => x.makhraj === l.makhraj && x.id !== l.id)]).slice(0, 6);
            klankjacht.start(bak, { letters: groep.length >= 4 ? groep : LETTERS, aantal: 8,
              terug: () => toonLetter(bak, id), opKlaar: () => toonLetter(bak, id) });
          } }))),

    heeftArabischeStem() ? null : el('p', { class: 'voetnoot', tekst:
      'Tip voor ouders: zet eigen opnames in public/audio/letters/ om het geluid te verbeteren.' }),
  );
}
