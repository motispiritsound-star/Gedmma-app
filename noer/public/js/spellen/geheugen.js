// Geheugenspel: draai twee kaartjes om en zoek het paar — het Arabische woord
// bij het plaatje.

import { el, husselen } from '../ui.js';
import { zegWoord } from '../geluid.js';
import { ronde } from './basis.js';

const bord = (thema, paren) => (api) => {
  const kaarten = husselen(paren.flatMap((p, paar) => [
    { paar, kant: 'ar', inhoud: p.ar, woord: p },
    { paar, kant: 'nl', inhoud: `${p.emoji}\n${p.nl}`, woord: p },
  ]));

  let open = [];
  let gevonden = 0;
  let blokkeer = false;

  const rooster = el('div', { class: `geheugen kolommen-${kaarten.length > 12 ? 4 : 3}` });

  kaarten.forEach((kaart) => {
    const voor = kaart.kant === 'ar'
      ? el('span', { class: 'ar memo-ar', dir: 'rtl', lang: 'ar', tekst: kaart.inhoud })
      : el('span', { class: 'memo-nl' },
          el('span', { class: 'memo-emoji', tekst: kaart.woord.emoji }),
          el('span', { tekst: kaart.woord.nl }));

    const knop = el('button', { class: 'memokaart', 'aria-label': 'Kaartje omdraaien',
      opclick: () => {
        if (blokkeer || knop.classList.contains('om') || knop.disabled) return;
        knop.classList.add('om');
        open.push({ kaart, knop });
        if (open.length < 2) return;
        blokkeer = true;
        const [a, b] = open;
        const gelijk = a.kaart.paar === b.kaart.paar;
        api.tel(gelijk, { themaId: thema });
        setTimeout(() => {
          if (gelijk) {
            a.knop.classList.add('gevonden');
            b.knop.classList.add('gevonden');
            a.knop.disabled = b.knop.disabled = true;
            zegWoord(a.kaart.woord.ar, { themaId: thema, index: a.kaart.woord.index });
            gevonden++;
            if (gevonden === paren.length) api.verder(700);
          } else {
            a.knop.classList.remove('om');
            b.knop.classList.remove('om');
          }
          open = [];
          blokkeer = false;
        }, gelijk ? 500 : 900);
      } }, el('span', { class: 'memo-achter', tekst: '﴾' }), el('span', { class: 'memo-voor' }, voor));
    rooster.append(knop);
  });

  return el('div', { class: 'vraag' },
    el('p', { class: 'opdracht', tekst: 'Zoek het Arabische woord bij het plaatje.' }),
    rooster);
};

export function start(bak, { thema, paren = 6, terug, opKlaar }) {
  const gekozen = husselen(thema.woorden.map((w, index) => ({ ...w, index })))
    .slice(0, Math.min(paren, thema.woorden.length));
  ronde(bak, {
    titel: `Geheugen: ${thema.naam}`,
    uitleg: 'Twee kaartjes tegelijk. Onthoud goed waar ze liggen.',
    vragen: [bord(thema.id, gekozen)],
    terug, opKlaar,
  });
}
