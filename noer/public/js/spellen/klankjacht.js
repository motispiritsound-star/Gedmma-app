// Klankjacht: welke letter is dit? Zie de letter, kies de naam — of andersom.

import { el, husselen, kies } from '../ui.js';
import { LETTERS, LETTER_OP_ID, afleiders } from '../../data/letters.js';
import { zegLetter } from '../geluid.js';
import { ronde, keuzeknoppen } from './basis.js';

const luisterknop = (letter) =>
  el('button', {
    class: 'luister', 'aria-label': `Luister naar ${letter.naam}`,
    opclick: async (e) => {
      const knop = e.currentTarget;
      knop.classList.add('bezig');
      const hoe = await zegLetter(letter);
      knop.classList.remove('bezig');
      knop.classList.toggle('stil', hoe === 'stil');
      if (hoe === 'stil') knop.title = 'Nog geen opname en geen Arabische stem op dit apparaat';
    },
  }, '🔊');

/** Zie de Arabische letter, kies de juiste naam. */
const vraagNaam = (letter) => (api) => {
  const opties = husselen([letter.id, ...afleiders(letter.id, 3)]);
  return el('div', { class: 'vraag' },
    el('p', { class: 'opdracht', tekst: 'Welke letter is dit?' }),
    el('div', { class: 'groot-arabisch', dir: 'rtl', lang: 'ar', tekst: letter.letter }),
    luisterknop(letter),
    keuzeknoppen(
      opties.map((id) => el('span', { class: 'keuze-naam', tekst: LETTER_OP_ID[id].naam })),
      opties.indexOf(letter.id), api, { letterId: letter.id }));
};

/** Hoor of lees de naam, kies de juiste Arabische letter. */
const vraagLetter = (letter) => (api) => {
  const opties = husselen([letter.id, ...afleiders(letter.id, 3)]);
  return el('div', { class: 'vraag' },
    el('p', { class: 'opdracht', tekst: 'Welke letter hoort hierbij?' }),
    el('div', { class: 'naam-groot' }, letter.naam, luisterknop(letter)),
    keuzeknoppen(
      opties.map((id) => el('span', { class: 'ar keuze-letter', dir: 'rtl', lang: 'ar', tekst: LETTER_OP_ID[id].letter })),
      opties.indexOf(letter.id), api, { letterId: letter.id }));
};

/** Bij welk plaatje hoort deze letter? Gebruikt het voorbeeldwoord. */
const vraagVoorbeeld = (letter) => (api) => {
  const anderen = afleiders(letter.id, 3).map((id) => LETTER_OP_ID[id]);
  const opties = husselen([letter, ...anderen]);
  return el('div', { class: 'vraag' },
    el('p', { class: 'opdracht', tekst: `Met welke letter begint dit woord?` }),
    el('div', { class: 'plaatje', tekst: letter.voorbeeld.emoji }),
    el('div', { class: 'ar woord-groot', dir: 'rtl', lang: 'ar', tekst: letter.voorbeeld.woord }),
    el('p', { class: 'onderschrift', tekst: `${letter.voorbeeld.translit} — ${letter.voorbeeld.betekenis}` }),
    keuzeknoppen(
      opties.map((l) => el('span', { class: 'ar keuze-letter', dir: 'rtl', lang: 'ar', tekst: l.letter })),
      opties.indexOf(letter), api, { letterId: letter.id }));
};

const SOORTEN = [vraagNaam, vraagLetter, vraagVoorbeeld];

export function start(bak, { letters = LETTERS, aantal = 10, terug, opKlaar } = {}) {
  const gekozen = husselen(letters).slice(0, aantal);
  const vragen = gekozen.map((letter) => kies(SOORTEN)(letter));
  ronde(bak, {
    titel: 'Klankjacht',
    uitleg: 'Kies de goede letter. Tik op 🔊 om te luisteren.',
    vragen, terug, opKlaar,
  });
}
