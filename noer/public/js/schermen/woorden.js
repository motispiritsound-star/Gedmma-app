// Woordenschat per thema: kaartjes om te leren, en spelletjes om te oefenen.

import { el, leeg, husselen } from '../ui.js';
import { THEMAS, THEMA_OP_ID, themasVoorLeeftijd } from '../../data/woorden.js';
import { actiefProfiel, voortgang, bewaarWoord } from '../opslag.js';
import { zegWoord } from '../geluid.js';
import { ronde, keuzeknoppen } from '../spellen/basis.js';
import * as geheugen from '../spellen/geheugen.js';
import { ga } from '../app.js';

export function toon(bak) {
  const p = actiefProfiel();
  const v = voortgang();
  const beschikbaar = themasVoorLeeftijd(p.leeftijd);

  leeg(bak).append(
    el('header', { class: 'schermkop' },
      el('h1', { tekst: 'Arabische woorden' }),
      el('p', { tekst: 'Kies een thema. Tik op een kaartje om het woord te horen.' })),
    el('div', { class: 'tegels' }, ...beschikbaar.map((t) => {
      const stand = v.themas[t.id] || { gekend: [] };
      return el('a', { class: 'tegel', href: `#/woorden/${t.id}`, stijl: { '--tegelkleur': '#c58bd8' } },
        el('span', { class: 'tegel-emoji', tekst: t.emoji }),
        el('b', { tekst: t.naam }),
        el('span', { class: 'klein', tekst: `${stand.gekend.length}/${t.woorden.length} gekend` }));
    })),
    beschikbaar.length < THEMAS.length ? el('p', { class: 'voetnoot', tekst:
      'Er komen meer thema\'s bij als je ouder wordt. Pas de leeftijd aan in het ouderscherm.' }) : null,
  );
}

export function toonThema(bak, id) {
  const thema = THEMA_OP_ID[id];
  if (!thema) return ga('/woorden');
  const v = voortgang();
  const gekend = new Set((v.themas[id] || { gekend: [] }).gekend);

  const kaartje = (w, i) => el('button', {
    class: `woordkaart ${gekend.has(i) ? 'gekend' : ''}`.trim(),
    opclick: (e) => {
      const kaart = e.currentTarget;
      zegWoord(w.ar, { themaId: id, index: i });
      bewaarWoord(id, i);
      kaart.classList.add('gekend', 'tik');
      setTimeout(() => kaart.classList.remove('tik'), 300);
    },
  },
    el('span', { class: 'woord-emoji', tekst: w.emoji }),
    el('span', { class: 'ar woord-groot', dir: 'rtl', lang: 'ar', tekst: w.ar }),
    el('span', { class: 'klein', tekst: w.tr }),
    el('b', { tekst: w.nl }));

  leeg(bak).append(
    el('header', { class: 'schermkop met-terug' },
      el('a', { class: 'terug', href: '#/woorden', 'aria-label': 'Terug', tekst: '←' }),
      el('h1', {}, `${thema.emoji} ${thema.naam}`)),

    el('div', { class: 'woordrooster' }, ...thema.woorden.map(kaartje)),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Oefenen' }),
      el('div', { class: 'knoprij' },
        el('button', { class: 'knop', tekst: '🃏 Geheugenspel',
          opclick: () => geheugen.start(bak, { thema, terug: () => toonThema(bak, id), opKlaar: () => toonThema(bak, id) }) }),
        el('button', { class: 'knop', tekst: '❓ Wat betekent het?',
          opclick: () => startQuiz(bak, thema) }))),
  );
}

/** Zie het Arabische woord, kies de Nederlandse betekenis. */
function startQuiz(bak, thema) {
  const vragen = husselen(thema.woorden.map((w, i) => ({ ...w, index: i })))
    .slice(0, Math.min(8, thema.woorden.length))
    .map((w) => (api) => {
      const anderen = husselen(thema.woorden.filter((x) => x.nl !== w.nl)).slice(0, 3);
      const opties = husselen([w, ...anderen]);
      return el('div', { class: 'vraag' },
        el('p', { class: 'opdracht', tekst: 'Wat betekent dit woord?' }),
        el('div', { class: 'ar woord-groot groot-arabisch', dir: 'rtl', lang: 'ar', tekst: w.ar }),
        el('button', { class: 'luister', 'aria-label': 'Luister', tekst: '🔊',
          opclick: () => zegWoord(w.ar, { themaId: thema.id, index: w.index }) }),
        keuzeknoppen(
          opties.map((o) => el('span', { class: 'keuze-naam' },
            el('span', { class: 'keuze-emoji', tekst: o.emoji }), o.nl)),
          opties.indexOf(w), api, { themaId: thema.id }));
    });

  ronde(bak, {
    titel: `Wat betekent het? ${thema.emoji}`,
    uitleg: 'Kies de goede betekenis.',
    vragen,
    terug: () => toonThema(bak, thema.id),
    opKlaar: (r) => r.nogmaals ? startQuiz(bak, thema) : toonThema(bak, thema.id),
  });
}
