// Vormenpuzzel: dezelfde letter ziet er anders uit aan het begin, in het
// midden en aan het eind van een woord. Welke vorm hoort waar?

import { el, husselen, kies } from '../ui.js';
import { LETTERS, LETTER_OP_ID, afleiders } from '../../data/letters.js';
import { ronde, keuzeknoppen } from './basis.js';

const PLEK = {
  begin: 'aan het begin van een woord',
  midden: 'midden in een woord',
  eind: 'aan het eind van een woord',
};

/** Kies de juiste vorm van een bekende letter op een gevraagde plek. */
const vraagVorm = (letter) => (api) => {
  const plekken = letter.verbindt ? ['begin', 'midden', 'eind'] : ['eind'];
  const plek = kies(plekken);
  const juist = letter.vormen[plek];
  const anderen = afleiders(letter.id, 5)
    .map((id) => LETTER_OP_ID[id].vormen[plek])
    .filter((v) => v !== juist);
  const opties = husselen([juist, ...anderen.slice(0, 3)]);
  return el('div', { class: 'vraag' },
    el('p', { class: 'opdracht', tekst: `Hoe schrijf je ${letter.naam} ${PLEK[plek]}?` }),
    el('div', { class: 'groot-arabisch klein', dir: 'rtl', lang: 'ar', tekst: letter.letter }),
    keuzeknoppen(
      opties.map((vorm) => el('span', { class: 'ar keuze-letter', dir: 'rtl', lang: 'ar', tekst: vorm })),
      opties.indexOf(juist), api, { letterId: letter.id }));
};

/** Verbindt deze letter naar links of niet? Zes letters doen dat nooit. */
const vraagVerbindt = (letter) => (api) =>
  el('div', { class: 'vraag' },
    el('p', { class: 'opdracht', tekst: 'Pakt deze letter de hand van de letter erna?' }),
    el('div', { class: 'groot-arabisch', dir: 'rtl', lang: 'ar', tekst: letter.letter }),
    el('p', { class: 'onderschrift', tekst: letter.naam }),
    keuzeknoppen(
      [el('span', { tekst: 'Ja, hij verbindt 🤝' }), el('span', { tekst: 'Nee, hij laat los ✋' })],
      letter.verbindt ? 0 : 1, api, { letterId: letter.id }));

/** Welke letter zit hierin verstopt? Toont een verbonden vorm. */
const vraagHerken = (letter) => (api) => {
  const plek = letter.verbindt ? kies(['begin', 'midden', 'eind']) : 'eind';
  const opties = husselen([letter.id, ...afleiders(letter.id, 3)]);
  return el('div', { class: 'vraag' },
    el('p', { class: 'opdracht', tekst: 'Welke letter is dit, in deze vorm?' }),
    el('div', { class: 'groot-arabisch', dir: 'rtl', lang: 'ar', tekst: letter.vormen[plek] }),
    keuzeknoppen(
      opties.map((id) => el('span', { class: 'keuze-naam', tekst: LETTER_OP_ID[id].naam })),
      opties.indexOf(letter.id), api, { letterId: letter.id }));
};

const SOORTEN = [vraagVorm, vraagVerbindt, vraagHerken];

export function start(bak, { letters = LETTERS, aantal = 10, terug, opKlaar } = {}) {
  const vragen = husselen(letters).slice(0, aantal).map((l) => kies(SOORTEN)(l));
  ronde(bak, {
    titel: 'Vormenpuzzel',
    uitleg: 'Letters veranderen van vorm. Kijk goed naar de stippen en de staart.',
    vragen, terug, opKlaar,
  });
}
