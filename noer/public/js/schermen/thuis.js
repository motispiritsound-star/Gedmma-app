// Het startscherm: waar was je gebleven, en wat kun je vandaag doen.

import { el, zet, balk, meervoud } from '../ui.js';
import { icoon } from '../iconen.js';
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

  zet(bak, 
    el('section', { class: 'hero groet' },
      el('div', { class: 'herorij' },
        el('div', {},
          el('h1', { tekst: `${groet()}, ${p.naam}` }),
          el('p', { class: 'klein', tekst: n.max
            ? `${n.emoji} ${n.naam} — ${v.xp} punten`
            : `${n.emoji} ${n.naam} — nog ${n.xpNodig - n.xpInNiveau} punten tot niveau ${n.nr + 1}` })),
        el('p', { class: 'ar bismillah', dir: 'rtl', lang: 'ar', tekst: 'بِسْمِ ٱللَّهِ' })),
      el('div', { class: 'herodoel' },
        el('p', { class: 'klein', tekst: vandaag.goed >= DAGDOEL
          ? `Dagdoel gehaald — ${vandaag.goed} goed vandaag. ${meervoud(s.huidigeReeks, 'dag', 'dagen')} op rij.`
          : `Vandaag: nog ${DAGDOEL - vandaag.goed} ${DAGDOEL - vandaag.goed === 1
              ? 'goed antwoord' : 'goede antwoorden'} voor je dagdoel.` }),
        balk(Math.min(1, vandaag.goed / DAGDOEL), 'Dagdoel'))),

    el('section', { class: 'verder' },
      el('h2', { tekst: 'Verder waar je was' }),
      el('div', { class: 'tegels' },
        tegel({ href: `#/qaida/${volgendeLes.id}`, teken: 'boek', titel: `Les ${volgendeLes.nr}`,
          onder: volgendeLes.titel, kleur: 'var(--groen)' }),
        volgendeSoera ? tegel({ href: `#/koran/${volgendeSoera.id}`, teken: 'koran',
          titel: volgendeSoera.naam, onder: `${volgendeSoera.aantalAyaat} aya's`, kleur: 'var(--blauw)' }) : null)),

    el('section', { class: 'ontdek' },
      el('h2', { tekst: 'Wat wil je doen?' }),
      el('div', { class: 'tegels' },
        tegel({ href: '#/letters', teken: 'ster8', titel: 'Letters', onder: `${s.lettersGoed}/28 gekend`, kleur: 'var(--goud)' }),
        tegel({ href: '#/qaida', teken: 'boek', titel: 'Leren lezen', onder: `${s.lessenAf.length}/${LESSEN.length} lessen`, kleur: 'var(--groen)' }),
        tegel({ href: '#/koran', teken: 'koran', titel: 'Koran', onder: `${s.soerasAf.length} soera's uit je hoofd`, kleur: 'var(--blauw)' }),
        tegel({ href: '#/woorden', teken: 'praatwolk', titel: 'Woorden', onder: `${s.woordenGoed} geleerd`, kleur: 'var(--paars)' }),
        tegel({ href: '#/voortgang', teken: 'ster', titel: 'Mijn sterren', onder: `${v.badges.length} badges`, kleur: 'var(--terra)' }))),

    zwak.length ? el('section', { class: 'kaart oefenen' },
      el('h2', { tekst: 'Deze letters zijn nog lastig' }),
      el('div', { class: 'zwakrij' }, ...zwak.map((z) => {
        const l = LETTER_OP_ID[z.id];
        return el('a', { class: 'zwakletter', href: `#/letters/${l.id}` },
          el('span', { class: 'ar', dir: 'rtl', lang: 'ar', tekst: l.letter }),
          el('span', { class: 'klein', tekst: l.naam }));
      }))) : null,
  );
}

const groet = () => {
  const u = new Date().getHours();
  if (u < 6) return 'Goedenacht';
  if (u < 12) return 'Goedemorgen';
  if (u < 18) return 'Goedemiddag';
  return 'Goedenavond';
};

const tegel = ({ href, teken, titel, onder, kleur }) =>
  el('a', { class: 'tegel', href, stijl: { '--tegelkleur': kleur } },
    el('span', { class: 'tegelbol' }, icoon(teken, { maat: 24 })),
    el('b', { tekst: titel }),
    el('span', { class: 'klein', tekst: onder }));
