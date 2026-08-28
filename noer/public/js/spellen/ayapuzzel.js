// Aya-puzzel: de woorden van een aya staan door elkaar. Zet ze terug in de
// goede volgorde — van rechts naar links.

import { el, husselen, leeg } from '../ui.js';
import { speelAya } from '../geluid.js';
import { ronde } from './basis.js';

const vraag = (soera, aya) => (api) => {
  const doel = aya.ar.split(/\s+/).filter(Boolean);
  let stap = 0;

  const gebouwd = el('div', { class: 'gebouwd ar aya-bouw', dir: 'rtl', lang: 'ar' });
  const voorraad = el('div', { class: 'voorraad woorden' });

  const teken = () => leeg(gebouwd).append(doel.slice(0, stap).join(' ') || '…');

  const knoppen = husselen(doel.map((w, i) => ({ w, i }))).map(({ w }) =>
    el('button', { class: 'ar tegel woordtegel', dir: 'rtl', lang: 'ar', tekst: w,
      opclick: (e) => {
        const knop = e.currentTarget;
        if (knop.disabled) return;
        if (w === doel[stap]) {
          knop.disabled = true;
          knop.classList.add('goed');
          stap++;
          teken();
          api.tel(true);
          if (stap === doel.length) {
            gebouwd.classList.add('af');
            speelAya(soera.nr, aya.n);
            api.verder(1300);
          }
        } else {
          knop.classList.add('fout');
          setTimeout(() => knop.classList.remove('fout'), 500);
          api.tel(false);
        }
      } }));

  voorraad.append(...knoppen);
  teken();

  return el('div', { class: 'vraag' },
    el('p', { class: 'opdracht', tekst: `${soera.naam}, aya ${aya.n}` }),
    gebouwd,
    el('p', { class: 'onderschrift betekenis', tekst: aya.nl }),
    voorraad);
};

export function start(bak, { soera, ayaat = soera.ayaat, terug, opKlaar }) {
  // Aya's met één woord vallen af: daar valt niets te puzzelen.
  const bruikbaar = ayaat.filter((a) => a.ar.split(/\s+/).length > 1);
  ronde(bak, {
    titel: `Puzzel: ${soera.naam}`,
    uitleg: 'Zet de woorden in de goede volgorde. Het eerste woord staat rechts.',
    vragen: bruikbaar.map((a) => vraag(soera, a)),
    terug, opKlaar,
  });
}
