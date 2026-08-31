// Leesladder: lees wat er staat en kies hoe je het uitspreekt.
// De afleiders komen uit dezelfde les, zodat het verschil echt in de tekens zit.

import { el, husselen } from '../ui.js';
import { icoon } from '../iconen.js';
import { spreekUit } from '../geluid.js';
import { itemsVan } from '../../data/qaida.js';
import { ronde, keuzeknoppen } from './basis.js';

const vraag = (item, pool) => (api) => {
  const anderen = husselen(pool.filter((i) => i.tr !== item.tr)).slice(0, 3);
  const opties = husselen([item, ...anderen]);
  return el('div', { class: 'vraag' },
    el('p', { class: 'opdracht', tekst: 'Hoe lees je dit?' }),
    el('div', { class: 'groot-arabisch', dir: 'rtl', lang: 'ar', tekst: item.ar }),
    el('button', { class: 'luister', 'aria-label': 'Luister',
      opclick: (e) => {
        const knop = e.currentTarget;
        spreekUit(item.ar).then((gelukt) => knop.classList.toggle('stil', !gelukt));
      } },
      icoon('geluid', { maat: 22 })),
    keuzeknoppen(
      opties.map((o) => el('span', { class: 'keuze-naam', tekst: o.tr })),
      opties.indexOf(item), api, { letterId: item.letterId ?? null }));
};

export function start(bak, { les, aantal = 12, terug, opKlaar }) {
  const pool = itemsVan(les);
  const vragen = husselen(pool).slice(0, Math.min(aantal, pool.length)).map((i) => vraag(i, pool));
  ronde(bak, {
    titel: les.titel,
    uitleg: les.uitleg,
    vragen, terug, opKlaar, lesId: les.id,
  });
}
