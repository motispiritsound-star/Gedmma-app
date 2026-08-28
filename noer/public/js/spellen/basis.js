// Het raamwerk onder elk spel: vragen achter elkaar, teller, en een
// eindscherm met sterren, punten en eventuele nieuwe badges.

import { el, leeg, balk, sterren, confetti, toast } from '../ui.js';
import { klinkGoed, klinkFout, klinkKlaar } from '../geluid.js';
import { XP, geefXp, nieuweBadges, sterrenVoor } from '../punten.js';
import { telAntwoord, telTijd, tikDagreeks } from '../opslag.js';

/**
 * @param bak      element waar het spel in getekend wordt
 * @param titel    kop boven het spel
 * @param uitleg   één zin, wat moet het kind doen
 * @param vragen   array van functies: (api) => Node. api.beantwoord(goed, meta)
 * @param opKlaar  ({goed, fout, sterren}) => void, na het eindscherm
 * @param terug    () => void, knop linksboven
 */
export function ronde(bak, { titel, uitleg, vragen, opKlaar, terug, lesId = null }) {
  let index = 0;
  let goed = 0;
  let fout = 0;
  let bezig = false;
  const begonnen = Date.now();

  const kop = el('header', { class: 'spel-kop' },
    el('button', { class: 'terug', 'aria-label': 'Terug', tekst: '←', opclick: () => terug?.() }),
    el('div', { class: 'spel-titel' }, el('h2', { tekst: titel }), uitleg && el('p', { tekst: uitleg })),
    el('div', { class: 'spel-teller' }));
  const voortgangsbalk = el('div', { class: 'spel-balk' });
  const podium = el('section', { class: 'podium' });

  leeg(bak).append(kop, voortgangsbalk, podium);

  const tellerNode = kop.querySelector('.spel-teller');

  function tekenKop() {
    leeg(tellerNode).append(
      el('span', { class: 'teller-goed', tekst: `✓ ${goed}` }),
      el('span', { class: 'teller-fout', tekst: `✗ ${fout}` }),
      el('span', { class: 'teller-van', tekst: `${Math.min(index + 1, vragen.length)}/${vragen.length}` }));
    leeg(voortgangsbalk).append(balk(index / vragen.length, 'Voortgang in dit spel'));
  }

  const api = {
    /** Telt een antwoord mee zonder door te gaan naar de volgende vraag. */
    tel(isGoed, meta = {}) {
      if (isGoed) { goed++; klinkGoed(); } else { fout++; klinkFout(); }
      telAntwoord({ goed: isGoed, letterId: meta.letterId ?? null, themaId: meta.themaId ?? null });
      if (isGoed) geefXp(XP.goedAntwoord);
      tekenKop();
    },
    /** Gaat door naar de volgende vraag (of het eindscherm). */
    verder(vertraging = 0) {
      if (bezig) return;
      bezig = true;
      setTimeout(() => { bezig = false; index++; volgende(); }, vertraging);
    },
    /** Het gewone geval: één antwoord, dan door. */
    beantwoord(isGoed, meta = {}) {
      if (bezig) return;
      api.tel(isGoed, meta);
      api.verder(isGoed ? 700 : 1500);
    },
  };

  function volgende() {
    tekenKop();
    if (index >= vragen.length) return eindscherm();
    podium.classList.remove('in');
    leeg(podium).append(vragen[index](api));
    requestAnimationFrame(() => podium.classList.add('in'));
  }

  function eindscherm() {
    const aantalSterren = sterrenVoor(goed, fout);
    telTijd(Math.round((Date.now() - begonnen) / 1000));
    if (tikDagreeks()) geefXp(XP.nieuweDag);
    if (aantalSterren >= 2) geefXp(XP.lesAf);
    if (fout === 0) geefXp(XP.perfecteLes);
    const badges = nieuweBadges();
    klinkKlaar();
    if (aantalSterren >= 2) confetti();

    leeg(bak).append(el('div', { class: 'eind' },
      el('div', { class: 'eind-emoji', tekst: aantalSterren === 3 ? '🎉' : aantalSterren >= 1 ? '👏' : '💪' }),
      el('h2', { tekst: aantalSterren === 3 ? 'Helemaal top!' : aantalSterren >= 2 ? 'Goed gedaan!' : aantalSterren === 1 ? 'Bijna!' : 'Blijf oefenen' }),
      sterren(aantalSterren),
      el('p', { class: 'eind-score', tekst: `${goed} goed, ${fout} fout` }),
      badges.length ? el('div', { class: 'eind-badges' },
        el('p', { tekst: badges.length === 1 ? 'Nieuwe badge!' : 'Nieuwe badges!' }),
        el('div', { class: 'badgerij' }, ...badges.map((b) =>
          el('div', { class: 'badge nieuw', title: b.uitleg },
            el('span', { class: 'badge-emoji', tekst: b.emoji }),
            el('span', { tekst: b.naam }))))) : null,
      el('div', { class: 'knoprij' },
        el('button', { class: 'knop', tekst: 'Nog een keer', opclick: () => opKlaar?.({ goed, fout, sterren: aantalSterren, nogmaals: true }) }),
        el('button', { class: 'knop stil', tekst: 'Klaar', opclick: () => opKlaar?.({ goed, fout, sterren: aantalSterren }) }))));

    if (lesId) toast(`+${goed * XP.goedAntwoord} punten`, 'goed');
  }

  volgende();
}

/** Knoppen met keuzes; markeert goed/fout en blokkeert daarna verder klikken. */
export function keuzeknoppen(opties, juisteIndex, api, meta = {}, klasse = '') {
  const rij = el('div', { class: `keuzes ${klasse}`.trim() });
  const knoppen = opties.map((inhoud, i) =>
    el('button', {
      class: 'keuze',
      opclick: () => {
        if (rij.dataset.klaar) return;
        rij.dataset.klaar = '1';
        knoppen[i].classList.add(i === juisteIndex ? 'goed' : 'fout');
        if (i !== juisteIndex) knoppen[juisteIndex].classList.add('goed', 'onthul');
        api.beantwoord(i === juisteIndex, meta);
      },
    }, inhoud));
  rij.append(...knoppen);
  return rij;
}
