// Mijn sterren: wat heb je al gehaald, en waar sta je nu.

import { el, leeg, balk, sterren, tijdKort, avatarRing } from '../ui.js';
import { BADGES } from '../../data/badges.js';
import { LESSEN } from '../../data/qaida.js';
import { LETTERS } from '../../data/letters.js';
import { SOERAS } from '../../data/koran.js';
import { voortgang, actiefProfiel } from '../opslag.js';
import { niveauVan, samenvatting } from '../punten.js';
import { beheersing } from './letters.js';

export function toon(bak) {
  const p = actiefProfiel();
  const v = voortgang();
  const s = samenvatting(v);
  const n = niveauVan(v.xp);
  const verdiend = new Set(v.badges);

  leeg(bak).append(
    el('header', { class: 'schermkop' },
      el('h1', { tekst: `De sterren van ${p.naam}` })),

    el('section', { class: 'kaart niveaukaart' },
      el('div', { class: 'niveau-groot' },
        avatarRing(p, n.deel, { groot: true, niveauNr: n.nr }),
        el('div', {},
          el('h2', { tekst: `Niveau ${n.nr}: ${n.naam}` }),
          el('p', { class: 'klein', tekst: n.max ? `${v.xp} punten` : `${n.xpInNiveau} van ${n.xpNodig} punten` }))),
      balk(n.deel, 'Voortgang naar het volgende niveau')),

    el('div', { class: 'cijfers' },
      cijfer('🔥', s.huidigeReeks, 'dagen op rij'),
      cijfer('✓', s.totaalGoed, 'goede antwoorden'),
      cijfer('🔤', `${LETTERS.filter((l) => beheersing(l.id, v) >= 2).length}/28`, 'letters gekend'),
      cijfer('📖', `${s.soerasAf.length}/${SOERAS.length}`, 'soera\'s uit je hoofd'),
      cijfer('💬', s.woordenGoed, 'woorden geleerd'),
      cijfer('⏱️', tijdKort(s.totaalSeconden), 'geoefend')),

    el('section', { class: 'kaart' },
      el('h2', { tekst: `Badges (${verdiend.size} van ${BADGES.length})` }),
      el('div', { class: 'badgerooster' }, ...BADGES.map((b) =>
        el('div', { class: `badge ${verdiend.has(b.id) ? 'aan' : 'uit'}`, title: b.uitleg },
          el('span', { class: 'badge-emoji', tekst: verdiend.has(b.id) ? b.emoji : '🔒' }),
          el('b', { tekst: b.naam }),
          el('span', { class: 'klein', tekst: b.uitleg }))))),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Lessen' }),
      el('div', { class: 'lessterren' }, ...LESSEN.map((les) => {
        const stand = v.lessen[les.id] || { sterren: 0 };
        return el('div', { class: 'lesster' },
          el('span', { class: 'klein', tekst: `${les.nr}. ${les.titel}` }),
          sterren(stand.sterren));
      }))),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Letters' }),
      el('p', { class: 'klein', tekst: 'Hoe voller de kleur, hoe beter je de letter kent.' }),
      el('div', { class: 'letterrooster klein-rooster', dir: 'rtl' }, ...LETTERS.map((l) =>
        el('a', { class: `lettertegel niveau-${beheersing(l.id, v)}`, href: `#/letters/${l.id}`,
          lang: 'ar', title: l.naam },
          el('span', { class: 'ar', tekst: l.letter }))))),
  );
}

const cijfer = (emoji, waarde, label) =>
  el('div', { class: 'cijfer' },
    el('span', { class: 'cijfer-emoji', tekst: emoji }),
    el('b', { tekst: String(waarde) }),
    el('span', { class: 'klein', tekst: label }));
