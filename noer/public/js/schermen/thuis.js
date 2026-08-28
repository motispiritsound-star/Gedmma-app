// Het startscherm: waar was je gebleven, en wat kun je vandaag doen.

import { el, leeg, balk } from '../ui.js';
import { actiefProfiel, voortgang } from '../opslag.js';
import { samenvatting, niveauVan, zwakkePunten } from '../punten.js';
import { LESSEN } from '../../data/qaida.js';
import { soerasVoorLeeftijd } from '../../data/koran.js';
import { LETTER_OP_ID } from '../../data/letters.js';

const DAGDOEL = 10; // goede antwoorden per dag

export function toon(bak) {
  const p = actiefProfiel();
  const v = voortgang();
  const s = samenvatting(v);
  const n = niveauVan(v.xp);
  const vandaag = v.dagen[new Date().toISOString().slice(0, 10)] || { goed: 0, seconden: 0 };
  const volgendeLes = LESSEN.find((l) => !v.lessen[l.id]?.af) || LESSEN[LESSEN.length - 1];
  const soeras = soerasVoorLeeftijd(p.leeftijd);
  const volgendeSoera = soeras.find((sr) => !v.soeras[sr.id]?.af) || soeras[0];
  const zwak = zwakkePunten(v, 3);

  leeg(bak).append(
    el('section', { class: 'groet' },
      el('h1', { tekst: `${groet()}, ${p.naam}` }),
      el('p', { class: 'ar bismillah', dir: 'rtl', lang: 'ar', tekst: 'بِسْمِ ٱللَّهِ' })),

    el('section', { class: 'kaart dagdoel' },
      el('h2', { tekst: 'Vandaag' }),
      balk(Math.min(1, vandaag.goed / DAGDOEL), 'Dagdoel'),
      el('p', { class: 'klein', tekst: vandaag.goed >= DAGDOEL
        ? `Dagdoel gehaald — ${vandaag.goed} goed vandaag. ${s.huidigeReeks} dagen op rij.`
        : `Nog ${DAGDOEL - vandaag.goed} goede antwoorden voor je dagdoel.` })),

    el('section', { class: 'verder' },
      el('h2', { tekst: 'Verder waar je was' }),
      el('div', { class: 'tegels' },
        tegel({ href: `#/qaida/${volgendeLes.id}`, emoji: '📗', titel: `Les ${volgendeLes.nr}`,
          onder: volgendeLes.titel, kleur: '#5fb99a' }),
        volgendeSoera ? tegel({ href: `#/koran/${volgendeSoera.id}`, emoji: '📖',
          titel: volgendeSoera.naam, onder: `${volgendeSoera.aantalAyaat} aya's`, kleur: '#7c9cf5' }) : null)),

    el('section', { class: 'ontdek' },
      el('h2', { tekst: 'Wat wil je doen?' }),
      el('div', { class: 'tegels' },
        tegel({ href: '#/letters', emoji: '🔤', titel: 'Letters', onder: `${s.lettersGoed}/28 gekend`, kleur: '#f6c453' }),
        tegel({ href: '#/qaida', emoji: '📗', titel: 'Leren lezen', onder: `${s.lessenAf.length}/${LESSEN.length} lessen`, kleur: '#5fb99a' }),
        tegel({ href: '#/koran', emoji: '📖', titel: 'Koran', onder: `${s.soerasAf.length} soera's uit je hoofd`, kleur: '#7c9cf5' }),
        tegel({ href: '#/woorden', emoji: '💬', titel: 'Woorden', onder: `${s.woordenGoed} geleerd`, kleur: '#c58bd8' }),
        tegel({ href: '#/voortgang', emoji: '🏅', titel: 'Mijn sterren', onder: `${v.badges.length} badges`, kleur: '#e0776a' }))),

    zwak.length ? el('section', { class: 'kaart oefenen' },
      el('h2', { tekst: 'Deze letters zijn nog lastig' }),
      el('div', { class: 'zwakrij' }, ...zwak.map((z) => {
        const l = LETTER_OP_ID[z.id];
        return el('a', { class: 'zwakletter', href: `#/letters/${l.id}` },
          el('span', { class: 'ar', dir: 'rtl', lang: 'ar', tekst: l.letter }),
          el('span', { class: 'klein', tekst: l.naam }));
      }))) : null,

    n.max ? null : el('p', { class: 'voetnoot', tekst:
      `Nog ${n.xpNodig - n.xpInNiveau} punten tot niveau ${n.nr + 1}.` }),
  );
}

const groet = () => {
  const u = new Date().getHours();
  if (u < 6) return 'Goedenacht';
  if (u < 12) return 'Goedemorgen';
  if (u < 18) return 'Goedemiddag';
  return 'Goedenavond';
};

const tegel = ({ href, emoji, titel, onder, kleur }) =>
  el('a', { class: 'tegel', href, stijl: { '--tegelkleur': kleur } },
    el('span', { class: 'tegel-emoji', tekst: emoji }),
    el('b', { tekst: titel }),
    el('span', { class: 'klein', tekst: onder }));
