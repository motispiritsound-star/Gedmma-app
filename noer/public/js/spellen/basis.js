// Het raamwerk onder elk spel.
//
// De belangrijkste keuze hier: na een antwoord flitst er niets weg. Er schuift
// een strook omhoog die zegt wat er goed of fout ging — en bij een fout staat
// het juiste antwoord erbij. Het kind gaat pas verder als het zelf op
// "Doorgaan" tikt. Dat is trager dan automatisch doorspoelen, en het is precies
// het moment waarop iemand iets leert.

import { el, zet, balk, sterren, confetti } from '../ui.js';
import { icoon, icoonKnop } from '../iconen.js';
import { klinkGoed, klinkFout, klinkKlaar } from '../geluid.js';
import { XP, geefXp, nieuweBadges, sterrenVoor } from '../punten.js';
import { telAntwoord, telTijd, tikDagreeks } from '../opslag.js';

/**
 * @param bak      element waar het spel in getekend wordt
 * @param titel    naam van het spel (voor het eindscherm)
 * @param uitleg   één zin, wat moet het kind doen
 * @param vragen   array van functies: (api) => Node
 * @param opKlaar  ({goed, fout, sterren, nogmaals}) => void
 * @param terug    () => void, de sluitknop linksboven
 */
export function ronde(bak, { titel, uitleg, vragen, opKlaar, terug, lesId = null }) {
  let index = 0;
  let goed = 0;
  let fout = 0;
  let bezig = false;
  const begonnen = Date.now();

  const voortgangsbalk = el('div', { class: 'oefenbalk' });
  const teller = el('span', { class: 'oefenteller' });
  const kop = el('header', { class: 'oefenkop' },
    icoonKnop('sluiten', { label: 'Oefening sluiten', opklik: () => terug?.(), klasse: 'sluit' }),
    voortgangsbalk,
    teller);
  const hint = el('p', { class: 'oefenhint', tekst: uitleg || '' });
  const podium = el('section', { class: 'podium' });
  const strook = el('div', { class: 'feedback', role: 'status', 'aria-live': 'assertive', hidden: true });

  zet(bak, kop, hint, podium, strook);

  function tekenKop() {
    zet(teller, icoon('vink', { maat: 16 }), el('b', { tekst: String(goed) }));
    zet(voortgangsbalk, balk(index / vragen.length, `Vraag ${Math.min(index + 1, vragen.length)} van ${vragen.length}`));
  }

  /** De strook onderin: wat ging er goed of fout, en hoe gaat het verder. */
  function toonStrook(isGoed, juist) {
    const doorgaan = el('button', { class: 'knop doorgaan', tekst: 'Doorgaan',
      opclick: () => { verbergStrook(); volgendeVraag(); } });

    strook.className = `feedback ${isGoed ? 'goed' : 'fout'} open`;
    strook.hidden = false;
    zet(strook, el('div', { class: 'feedback-binnen' },
      el('span', { class: 'feedback-icoon' }, icoon(isGoed ? 'vink' : 'sluiten', { maat: 22 })),
      el('div', { class: 'feedback-tekst' },
        el('b', { tekst: isGoed ? 'Goed zo!' : 'Net niet' }),
        !isGoed && juist ? juistRegel(juist) : null),
      doorgaan));
    doorgaan.focus({ preventScroll: true });
    document.body.classList.add('feedback-open');
  }

  function verbergStrook() {
    strook.hidden = true;
    strook.className = 'feedback';
    document.body.classList.remove('feedback-open');
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
      setTimeout(() => { bezig = false; volgendeVraag(); }, vertraging);
    },
    /** Eén antwoord op een keuzevraag: tellen, uitleggen, en wachten op het kind. */
    beantwoord(isGoed, meta = {}) {
      if (bezig) return;
      api.tel(isGoed, meta);
      toonStrook(isGoed, meta.juist);
    },
  };

  function volgendeVraag() {
    index++;
    tekenVraag();
  }

  function tekenVraag() {
    tekenKop();
    if (index >= vragen.length) return eindscherm();
    podium.classList.remove('in');
    zet(podium, vragen[index](api));
    requestAnimationFrame(() => podium.classList.add('in'));
  }

  function eindscherm() {
    verbergStrook();
    const aantalSterren = sterrenVoor(goed, fout);
    telTijd(Math.round((Date.now() - begonnen) / 1000));
    if (tikDagreeks()) geefXp(XP.nieuweDag);
    if (aantalSterren >= 2) geefXp(XP.lesAf);
    if (fout === 0) geefXp(XP.perfecteLes);
    const badges = nieuweBadges();
    const verdiend = goed * XP.goedAntwoord + (aantalSterren >= 2 ? XP.lesAf : 0) + (fout === 0 ? XP.perfecteLes : 0);
    klinkKlaar();
    if (aantalSterren >= 2) confetti();

    zet(bak, el('div', { class: 'eind' },
      el('div', { class: 'eind-emoji', tekst: aantalSterren === 3 ? '🎉' : aantalSterren >= 1 ? '👏' : '💪' }),
      el('h2', { tekst: aantalSterren === 3 ? 'Helemaal top!' : aantalSterren >= 2 ? 'Goed gedaan!' : aantalSterren === 1 ? 'Bijna!' : 'Blijf oefenen' }),
      sterren(aantalSterren),
      el('div', { class: 'eind-cijfers' },
        eindCijfer('Goed', `${goed}`, 'goed'),
        eindCijfer('Fout', `${fout}`, 'fout'),
        eindCijfer('Punten', `+${verdiend}`, 'punten')),
      badges.length ? el('div', { class: 'eind-badges' },
        el('p', { tekst: badges.length === 1 ? 'Nieuwe badge!' : 'Nieuwe badges!' }),
        el('div', { class: 'badgerij' }, ...badges.map((b) =>
          el('div', { class: 'badge nieuw', title: b.uitleg },
            el('span', { class: 'badge-emoji', tekst: b.emoji }),
            el('b', { tekst: b.naam }))))) : null,
      el('div', { class: 'knoprij' },
        el('button', { class: 'knop groot', tekst: 'Nog een keer',
          opclick: () => opKlaar?.({ goed, fout, sterren: aantalSterren, nogmaals: true }) }),
        el('button', { class: 'knop stil groot', tekst: 'Klaar',
          opclick: () => opKlaar?.({ goed, fout, sterren: aantalSterren }) }))));
  }

  const eindCijfer = (label, waarde, soort) =>
    el('div', { class: `eind-cijfer ${soort}` },
      el('b', { tekst: waarde }), el('span', { class: 'klein', tekst: label }));

  index = -1;
  volgendeVraag();
}

const HEEFT_ARABISCH = /[\u0600-\u06FF]/;

/** "Het goede antwoord is: X" — met het Arabische lettertype als dat past. */
function juistRegel(juist) {
  if (!HEEFT_ARABISCH.test(juist)) return el('p', { tekst: `Het goede antwoord is: ${juist}` });
  return el('p', {}, 'Het goede antwoord is: ',
    el('span', { class: 'ar juist-ar', dir: 'rtl', lang: 'ar', tekst: juist }));
}

/**
 * Knoppen met keuzes. De tekst van het juiste antwoord gaat automatisch mee
 * naar de feedbackstrook, zodat elk spel dat gratis krijgt.
 */
export function keuzeknoppen(opties, juisteIndex, api, meta = {}, klasse = '') {
  const rij = el('div', { class: `keuzes ${klasse}`.trim() });
  const knoppen = opties.map((inhoud, i) =>
    el('button', {
      class: 'keuze',
      opclick: () => {
        if (rij.dataset.klaar) return;
        rij.dataset.klaar = '1';
        const isGoed = i === juisteIndex;
        knoppen[i].classList.add(isGoed ? 'goed' : 'fout');
        if (!isGoed) knoppen[juisteIndex].classList.add('goed', 'onthul');
        for (const k of knoppen) k.disabled = true;
        api.beantwoord(isGoed, { ...meta, juist: knoppen[juisteIndex].textContent.trim() });
      },
    }, inhoud));
  rij.append(...knoppen);
  return rij;
}
