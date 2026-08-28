// Koppelen: bouw een woord door de letters in de goede volgorde te tikken.
// Arabisch leest van rechts naar links, dus de eerste letter staat rechts.

import { el, husselen, leeg } from '../ui.js';
import { zegWoord } from '../geluid.js';
import { LETTERS } from '../../data/letters.js';
import { ronde } from './basis.js';

/** Haalt de tekentjes weg, zodat je de kale letters overhoudt. */
export const kaleLetters = (woord) =>
  [...woord.replace(/[ً-ٰٕۖ-ۭـ]/g, '')].filter((c) => c.trim());

const vraag = (opgave) => (api) => {
  const doel = kaleLetters(opgave.ar);
  let stap = 0;
  const gebouwd = el('div', { class: 'gebouwd ar', dir: 'rtl', lang: 'ar' });
  const voorraad = el('div', { class: 'voorraad' });
  const hint = el('p', { class: 'onderschrift', tekst: `${opgave.tr} — ${opgave.nl}` });

  const tekenGebouwd = () =>
    leeg(gebouwd).append(
      doel.slice(0, stap).join('') || '…',
    );

  const knoppen = husselen(doel.map((letter, i) => ({ letter, i }))).map(({ letter }) =>
    el('button', { class: 'ar tegel', dir: 'rtl', lang: 'ar', tekst: letter,
      opclick: (e) => {
        const knop = e.currentTarget;
        if (knop.disabled) return;
        if (letter === doel[stap]) {
          knop.disabled = true;
          knop.classList.add('goed');
          stap++;
          tekenGebouwd();
          api.tel(true);
          if (stap === doel.length) {
            gebouwd.classList.add('af');
            zegWoord(opgave.ar);
            api.verder(1100);
          }
        } else {
          knop.classList.add('fout');
          setTimeout(() => knop.classList.remove('fout'), 500);
          api.tel(false);
        }
      } }));

  voorraad.append(...knoppen);
  tekenGebouwd();

  return el('div', { class: 'vraag' },
    el('p', { class: 'opdracht', tekst: 'Tik de letters in de goede volgorde. Begin rechts.' }),
    opgave.emoji ? el('div', { class: 'plaatje', tekst: opgave.emoji }) : null,
    gebouwd, hint, voorraad);
};

/** Standaardopgaven: de voorbeeldwoorden van de letters. */
export const standaardOpgaven = () =>
  LETTERS.map((l) => ({ ar: l.voorbeeld.woord, tr: l.voorbeeld.translit, nl: l.voorbeeld.betekenis, emoji: l.voorbeeld.emoji }));

export function start(bak, { opgaven = standaardOpgaven(), aantal = 6, terug, opKlaar } = {}) {
  const vragen = husselen(opgaven).slice(0, aantal).map(vraag);
  ronde(bak, {
    titel: 'Woorden bouwen',
    uitleg: 'Zet de letters op de goede plek — van rechts naar links.',
    vragen, terug, opKlaar,
  });
}
