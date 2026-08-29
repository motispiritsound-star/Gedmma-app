// De Koran: lezen, betekenis, en uit je hoofd leren.
//
// Twee regels die de hele opzet sturen:
//  - De Arabische tekst wordt nooit door een computerstem voorgelezen.
//    Alleen echte recitatie, of stilte.
//  - Een vertaling is uitleg van de betekenis, niet de Koran zelf. Dat staat
//    er ook bij, zodat een kind het verschil leert.

import { el, zet, balk, sterren, confetti, toast, husselen } from '../ui.js';
import { icoon, icoonKnop } from '../iconen.js';
import { SOERAS, SOERA_OP_ID, woordenVan, soerasVoorLeeftijd } from '../../data/koran.js';
import { actiefProfiel, voortgang, bewaarAya, bewaarSoera } from '../opslag.js';
import { speelAya } from '../geluid.js';
import { geefXp, XP, nieuweBadges } from '../punten.js';
import * as ayapuzzel from '../spellen/ayapuzzel.js';
import { ga } from '../route.js';

export function toon(bak) {
  const p = actiefProfiel();
  const v = voortgang();
  const beschikbaar = soerasVoorLeeftijd(p.leeftijd);

  zet(bak, 
    el('header', { class: 'schermkop' },
      el('h1', { tekst: 'Koran' }),
      el('p', { tekst: 'Korte soera\'s om te lezen en uit je hoofd te leren.' })),

    el('div', { class: 'soeralijst' }, ...beschikbaar.map((s) => {
      const stand = v.soeras[s.id] || { ayaGeleerd: [], af: false, sterren: 0 };
      const deel = stand.ayaGeleerd.length / s.aantalAyaat;
      return el('a', { class: `soerakaart ${stand.af ? 'af' : ''}`.trim(), href: `#/koran/${s.id}` },
        el('span', { class: 'soeranr', tekst: String(s.nr) }),
        el('div', { class: 'soerainfo' },
          el('b', {}, s.naam, el('span', { class: 'ar naam-ar', dir: 'rtl', lang: 'ar', tekst: s.naamAr })),
          el('span', { class: 'klein', tekst: `${s.betekenis} · ${s.aantalAyaat} aya's · ${s.plaats}` }),
          balk(deel, `${stand.ayaGeleerd.length} van ${s.aantalAyaat} aya's geleerd`)),
        sterren(stand.sterren));
    })),

    beschikbaar.length < SOERAS.length ? el('p', { class: 'voetnoot', tekst:
      'Langere soera\'s komen erbij als je ouder wordt.' }) : null,
  );
}

export function toonSoera(bak, id) {
  const s = SOERA_OP_ID[id];
  if (!s) return ga('/koran');
  let modus = 'lezen';

  const teken = () => {
    const v = voortgang();
    const stand = v.soeras[id] || { ayaGeleerd: [], af: false, sterren: 0 };

    zet(bak, 
      el('header', { class: 'schermkop met-terug' },
        el('a', { class: 'icoonknop', href: '#/koran', 'aria-label': 'Terug naar de soera\'s' }, icoon('terug')),
        el('h1', {}, s.naam, el('span', { class: 'ar naam-ar', dir: 'rtl', lang: 'ar', tekst: s.naamAr }))),

      el('section', { class: 'kaart soera-over' },
        el('p', { tekst: s.over }),
        el('p', { class: 'klein', tekst: `Soera ${s.nr} · ${s.betekenis} · geopenbaard in ${s.plaats}` }),
        balk(stand.ayaGeleerd.length / s.aantalAyaat, 'Aya\'s geleerd')),

      el('div', { class: 'tabs', role: 'tablist' }, ...[
        ['lezen', 'Lezen'], ['betekenis', 'Betekenis'], ['uithoofd', 'Uit je hoofd'],
      ].map(([sleutel, label]) =>
        el('button', { class: `tab ${modus === sleutel ? 'aan' : ''}`.trim(), role: 'tab',
          'aria-selected': modus === sleutel ? 'true' : 'false', tekst: label,
          opclick: () => { modus = sleutel; teken(); } }))),

      modus === 'uithoofd' ? uitHoofdBlok(s, stand, teken)
        : el('div', { class: 'ayaat' }, ...s.ayaat.map((a) => ayaBlok(s, a, modus))),

      el('section', { class: 'kaart' },
        el('h2', { tekst: 'Oefenen' }),
        el('div', { class: 'knoprij' },
          el('button', { class: 'knop', tekst: 'Woordpuzzel',
            opclick: () => ayapuzzel.start(bak, {
              soera: s,
              terug: teken,
              opKlaar: (r) => {
                bewaarSoera(id, { sterren: r.sterren });
                teken();
              },
            }) }))),

      el('p', { class: 'voetnoot', tekst:
        'De Nederlandse tekst is een uitleg van de betekenis. De Koran zelf is het Arabisch.' }),
    );
  };

  teken();
}

/** Eén aya: Arabisch, plus uitspraak en betekenis als daarom gevraagd is. */
function ayaBlok(s, a, modus) {
  const melding = el('span', { class: 'klein stilmelding' });
  const speel = async (e) => {
    const knop = e.currentTarget;
    knop.classList.add('bezig');
    const hoe = await speelAya(s.nr, a.n);
    knop.classList.remove('bezig');
    melding.textContent = hoe === 'stil' ? 'Nog geen recitatie beschikbaar' : '';
  };

  const woorden = modus === 'betekenis' ? woordenVan(a) : null;

  return el('article', { class: 'ayakaart' },
    el('div', { class: 'ayakop' },
      el('span', { class: 'ayanr', tekst: String(a.n) }),
      icoonKnop('geluid', { label: `Luister naar aya ${a.n}`, klasse: 'luister', opklik: speel }),
      melding),

    woorden
      ? el('div', { class: 'woordvoorwoord', dir: 'rtl' }, ...woorden.map((w) =>
          el('span', { class: 'wvw' },
            el('span', { class: 'ar', lang: 'ar', tekst: w.ar }),
            el('span', { class: 'wvw-nl', dir: 'ltr', tekst: w.nl ?? '·' }))))
      : el('p', { class: 'ar aya', dir: 'rtl', lang: 'ar', tekst: a.ar }),

    el('p', { class: 'translit', tekst: a.tr }),
    el('p', { class: 'betekenis', tekst: a.nl }),
  );
}

/**
 * Uit je hoofd leren in drie rondes: eerst alles zichtbaar, dan de helft
 * verstopt, dan bijna alles. Tik op een verstopt woord om het te zien.
 */
function uitHoofdBlok(s, stand, herteken) {
  let ronde = 0;
  const RONDES = [
    { deel: 0, naam: 'Lees mee', uitleg: 'Lees de aya hardop, een paar keer.' },
    { deel: 0.4, naam: 'Vul aan', uitleg: 'Een deel is verstopt. Zeg het hardop, tik om te kijken.' },
    { deel: 0.75, naam: 'Bijna alles', uitleg: 'Nu bijna alles verstopt. Lukt het nog?' },
  ];

  const bak = el('section', { class: 'uithoofd' });

  const teken = () => {
    const r = RONDES[ronde];
    zet(bak, 
      el('div', { class: 'kaart uitleg' },
        el('h2', { tekst: `Ronde ${ronde + 1} van 3: ${r.naam}` }),
        el('p', { tekst: r.uitleg })),

      ...s.ayaat.map((a) => {
        const woorden = a.ar.split(/\s+/);
        const verstop = new Set(
          husselen(woorden.map((_, i) => i)).slice(0, Math.round(woorden.length * r.deel)));
        const geleerd = stand.ayaGeleerd.includes(a.n);

        return el('article', { class: `ayakaart ${geleerd ? 'geleerd' : ''}`.trim() },
          el('div', { class: 'ayakop' },
            el('span', { class: 'ayanr', tekst: String(a.n) }),
            icoonKnop('geluid', { label: `Luister naar aya ${a.n}`, klasse: 'luister',
              opklik: () => speelAya(s.nr, a.n) })),
          el('p', { class: 'ar aya', dir: 'rtl', lang: 'ar' }, ...woorden.map((w, i) =>
            verstop.has(i)
              ? el('button', { class: 'verstopt', 'aria-label': 'Woord laten zien',
                  opclick: (e) => { e.currentTarget.textContent = w; e.currentTarget.classList.add('open'); },
                  tekst: '•••' })
              : el('span', { tekst: `${w} ` }))),
          el('p', { class: 'translit', tekst: a.tr }),
          el('button', {
            class: `knop klein-knop ${geleerd ? 'stil' : ''}`.trim(),
            tekst: geleerd ? '✓ Deze ken ik' : 'Deze ken ik uit mijn hoofd',
            opclick: () => {
              if (geleerd) return;
              bewaarAya(s.id, a.n);
              geefXp(XP.ayaGeleerd);
              const nieuw = voortgang().soeras[s.id];
              if (nieuw.ayaGeleerd.length === s.aantalAyaat && !nieuw.af) {
                bewaarSoera(s.id, { af: true, sterren: 3 });
                geefXp(XP.soeraAf);
                nieuweBadges();
                confetti(70);
                toast(`${s.naam} helemaal uit je hoofd. Masha\'Allah!`, 'goed');
              } else {
                toast('Aya opgeslagen', 'goed');
              }
              herteken();
            },
          }));
      }),

      el('div', { class: 'knoprij' },
        ronde > 0 ? el('button', { class: 'knop stil', tekst: '← Makkelijker',
          opclick: () => { ronde--; teken(); } }) : null,
        ronde < RONDES.length - 1 ? el('button', { class: 'knop', tekst: 'Moeilijker →',
          opclick: () => { ronde++; teken(); } }) : null),
    );
  };

  teken();
  return bak;
}
