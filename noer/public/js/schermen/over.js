// Het colofon: wat dit is, wat er met gegevens gebeurt, waar de inhoud vandaan
// komt en welke versie je voor je hebt.
//
// Dit hoort bij een app die je uitgeeft. Een ouder die wil weten of dit veilig
// is voor zijn kind, moet dat kunnen nalezen zonder de broncode te openen.

import { el, zet } from '../ui.js';
import { icoon } from '../iconen.js';
import { UITGAVE, versieRegel } from '../versie.js';
import { SOERAS } from '../../data/koran.js';
import { LETTERS } from '../../data/letters.js';
import { LESSEN } from '../../data/qaida.js';

const AUDIO_BRON_URL = 'data/../audio/koran/bron.json';

export function toon(bak) {
  const bronRegel = el('p', { class: 'klein' });
  bronVanKoranTekst().then((tekst) => { bronRegel.textContent = tekst; });

  zet(bak,
    el('header', { class: 'schermkop met-terug' },
      el('a', { class: 'icoonknop', href: '#/thuis', 'aria-label': 'Terug naar het startscherm' }, icoon('terug')),
      el('div', {},
        el('p', { class: 'kruimel', tekst: 'Colofon' }),
        el('h1', { tekst: 'Over Noer' }))),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Wat dit is' }),
      el('p', { tekst: `Een app om Arabisch te leren lezen en korte soera's uit je hoofd te leren, voor kinderen van 5 tot en met 13 jaar. Hij bevat ${LETTERS.length} letters, ${LESSEN.length} leeslessen en ${SOERAS.length} soera's.` })),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Wat er met jullie gegevens gebeurt' }),
      el('p', { tekst: 'Niets verlaat dit apparaat.' }),
      el('ul', { class: 'lijstje' },
        el('li', { tekst: 'Namen, leeftijden en voortgang staan in de opslag van deze browser.' }),
        el('li', { tekst: 'Opnames uit de studio staan in de database van deze browser.' }),
        el('li', { tekst: 'Er is geen account, geen server, geen reclame en geen meetsoftware.' }),
        el('li', { tekst: 'Er gaat alleen iets naar internet als je zelf een reciteur aanzet die gestreamd wordt.' })),
      el('p', { class: 'klein', tekst: 'Wis je de gegevens van deze site in je browser, of gebruik je de knop in het ouderscherm, dan is alles weg. Er blijft nergens anders iets staan.' })),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Waar de inhoud vandaan komt' }),
      el('p', { class: 'klein', tekst: 'De Arabische Koran-tekst is overgenomen uit een bron en wordt bewaakt door een vingerafdruk; een wijziging valt daardoor op.' }),
      bronRegel,
      el('p', { class: 'klein', tekst: 'De Nederlandse tekst bij de aya\'s is een weergave van de betekenis, geen vertaling van de Koran. De Koran zelf is het Arabisch.' }),
      el('p', { class: 'klein', tekst: 'De leesopbouw volgt de Qaida Noeraniyah. Recitatie en opnames zijn van wie ze heeft ingesproken; staat er een reciteur vermeld bij een soera, dan is dat zijn opname.' })),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Deze uitgave' }),
      el('p', { class: 'klein', tekst: versieRegel() }),
      UITGAVE.houder ? el('p', { class: 'klein', tekst: `© ${new Date().getFullYear()} ${UITGAVE.houder}` }) : null,
      UITGAVE.contact ? el('p', { class: 'klein' }, 'Vragen: ', el('a', { href: `mailto:${UITGAVE.contact}`, tekst: UITGAVE.contact })) : null),
  );
}

/** Leest de bronvermelding van de Koran-tekst, als die er is. */
async function bronVanKoranTekst() {
  try {
    const antwoord = await fetch('data/koran-bron.json');
    if (!antwoord.ok) return 'Bron niet gevonden.';
    const bron = await antwoord.json();
    return `Bron: ${bron.bron} — overgenomen op ${bron.overgenomen}.`;
  } catch {
    return '';
  }
}
