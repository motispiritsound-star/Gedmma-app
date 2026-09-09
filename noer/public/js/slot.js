// Het slot: wat een kind ziet waar het abonnement nog niet loopt.
//
// Twee regels. Eén: nooit midden in een oefening. Wat open is blijft open tot
// het af is. Twee: het kind krijgt geen betaalscherm, maar een kaartje dat
// zegt dat de rest er is en dat papa of mama het openzet.

import { el } from './ui.js';
import { icoon } from './iconen.js';
import { siteUrl } from './toegang.js';

/** Het hangslotje op een kaart of een bol die nog dicht zit. */
export const slotje = (maat = 18) =>
  el('span', { class: 'slotmerk', 'aria-hidden': 'true' }, icoon('slot', { maat }));

/**
 * De kaart die in de plaats komt van het scherm erachter.
 *
 * `wat` is wat er achter zit, in gewone woorden: "de acht andere lessen".
 */
export function slotKaart({ wat, terugPad = '#/thuis', terugTekst = 'Terug' }) {
  return el('section', { class: 'kaart slotkaart' },
    el('span', { class: 'slotcirkel' }, icoon('slot', { maat: 30 })),
    el('h2', { tekst: 'Dit deel staat nog dicht' }),
    el('p', { tekst: `${wat} horen bij het abonnement. Een ouder kan Noer openzetten; daarna staat alles open op elk apparaat waarop je inlogt.` }),
    el('div', { class: 'knoprij' },
      el('a', { class: 'knop', href: siteUrl('aanmelden.html'), tekst: 'Laat dit aan je ouder zien' }),
      el('a', { class: 'knop stil', href: terugPad, tekst: terugTekst })),
    el('p', { class: 'voetnoot', tekst: 'Het alfabet, de eerste twee lessen, Al-Faatiha, Al-Ichlaas en An-Naas blijven altijd gratis.' }));
}

/**
 * Een smalle strook onder een lijst: hier houdt het gratis deel op.
 * Bedoeld voor de ouder die meekijkt, niet voor het kind — vandaar de toon.
 */
export function slotStrook(tekst) {
  return el('a', { class: 'slotstrook', href: siteUrl('aanmelden.html') },
    el('span', { class: 'slotcirkel klein' }, icoon('slot', { maat: 18 })),
    el('span', {}, el('b', { tekst: tekst }), el('span', { class: 'klein', tekst: 'Zet Noer open — € 6,99 per maand, elke maand opzegbaar.' })),
    icoon('pijlRechts', { maat: 20 }));
}
