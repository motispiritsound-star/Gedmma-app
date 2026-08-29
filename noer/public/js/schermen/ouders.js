// Het ouderscherm: hoe gaat het met mijn kind, en wat kan ik instellen.
// De pincode houdt kleine handjes tegen, meer niet — hij staat gewoon op het
// apparaat. Het is een drempel, geen beveiliging; dat staat er ook bij.

import { el, zet, bevestig, tijdKort, toast, avatarRing } from '../ui.js';
import { icoon } from '../iconen.js';
import { LETTER_OP_ID } from '../../data/letters.js';
import { LESSEN } from '../../data/qaida.js';
import { AUDIO } from '../../data/bronnen.js';
import {
  alleProfielen, actiefProfiel, voortgang, wijzigProfiel,
  ouderInstelling, zetOuderPin, wisAlles, vandaag,
} from '../opslag.js';
import { samenvatting, zwakkePunten, niveauVan } from '../punten.js';
import { opgenomenSleutels } from '../opnames.js';
import { heeftArabischeStem, zegLetterKlank } from '../geluid.js';
import { LETTER_OP_ID as LETTERS_OP_ID } from '../../data/letters.js';
import { ga } from '../route.js';

let ontgrendeld = false;

export function toon(bak) {
  const pin = ouderInstelling().pin;
  if (pin && !ontgrendeld) return pinScherm(bak, pin);
  dashboard(bak);
}

function pinScherm(bak, pin) {
  const veld = el('input', { type: 'password', inputmode: 'numeric', maxlength: '4',
    id: 'pin', placeholder: '••••', autocomplete: 'off' });
  const fout = el('p', { class: 'fout-melding' });

  zet(bak, el('section', { class: 'kaart smal' },
    el('h1', { tekst: 'Voor ouders' }),
    el('p', { tekst: 'Vul de pincode in.' }),
    el('form', { opsubmit: (e) => {
      e.preventDefault();
      if (veld.value === pin) { ontgrendeld = true; dashboard(bak); }
      else { fout.textContent = 'Die code klopt niet.'; veld.value = ''; veld.focus(); }
    } },
      el('label', { for: 'pin', tekst: 'Pincode' }), veld, fout,
      el('button', { class: 'knop', type: 'submit', tekst: 'Openen' })),
    el('button', { class: 'knop stil', tekst: 'Terug', opclick: () => ga('/thuis') })));
}

function dashboard(bak) {
  const profielen = alleProfielen();
  const actief = actiefProfiel();

  zet(bak, 
    el('header', { class: 'schermkop met-terug' },
      el('a', { class: 'icoonknop', href: '#/thuis', 'aria-label': 'Terug naar het startscherm' }, icoon('terug')),
      el('h1', { tekst: 'Voor ouders' })),

    ...profielen.map((p) => kindKaart(p, p.id === actief?.id)),

    studioKaart(),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Geluid' }),
      el('p', { class: 'klein', tekst:
        'De app gebruikt eerst eigen opnames uit de map public/audio/. Is die er niet, ' +
        'dan leest het apparaat losse letters en woorden voor — als er een Arabische stem ' +
        'op staat. Voor de Koran gebeurt dat nooit: recitatie komt alleen uit een echte opname.' }),
      schakelaar('Letters en woorden voorlezen met de stem van het apparaat', AUDIO.spraak.aan,
        (aan) => { AUDIO.spraak.aan = aan; }),
      stemProef(),
      el('p', { class: 'klein', tekst: AUDIO.reciteur.aan
        ? `Recitatie: ${AUDIO.reciteur.naam || 'externe bron'}.`
        : 'Er is geen externe reciteur ingesteld. Zet eigen opnames in public/audio/koran/, of vul in data/bronnen.js een bron in die je mag gebruiken.' })),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Pincode' }),
      pinInstellen()),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Gegevens' }),
      el('p', { class: 'klein', tekst:
        'Alles blijft op dit apparaat staan. Er gaat niets naar een server, er zijn geen ' +
        'accounts en er is geen reclame. Wis je de gegevens hieronder, dan zijn ze weg.' }),
      el('button', { class: 'knop gevaar', tekst: 'Alle gegevens wissen',
        opclick: async () => {
          if (await bevestig('Alles wissen?', 'Alle profielen en voortgang verdwijnen van dit apparaat.')) {
            wisAlles();
            ontgrendeld = false;
            ga('/start');
          }
        } })),
  );
}

function kindKaart(p, isActief) {
  const v = voortgang(p.id);
  const s = samenvatting(v);
  const n = niveauVan(v.xp);
  const zwak = zwakkePunten(v, 5);
  const lessenAf = LESSEN.filter((l) => v.lessen[l.id]?.af).length;

  return el('section', { class: 'kaart kindkaart' },
    el('div', { class: 'kindkop' },
      avatarRing(p, n.deel, { niveauNr: n.nr }),
      el('div', {},
        el('h2', {}, p.naam, isActief ? el('span', { class: 'label', tekst: 'nu actief' }) : null),
        el('p', { class: 'klein', tekst: `${p.leeftijd} jaar · niveau ${n.nr} (${n.naam}) · ${v.xp} punten` }))),

    el('div', { class: 'cijfers' },
      el('div', { class: 'cijfer' }, el('b', { tekst: tijdKort(s.totaalSeconden) }), el('span', { class: 'klein', tekst: 'totaal geoefend' })),
      el('div', { class: 'cijfer' }, el('b', { tekst: `${s.totaalGoed}` }), el('span', { class: 'klein', tekst: 'goed' })),
      el('div', { class: 'cijfer' }, el('b', { tekst: `${s.totaalFout}` }), el('span', { class: 'klein', tekst: 'fout' })),
      el('div', { class: 'cijfer' }, el('b', { tekst: `${lessenAf}/${LESSEN.length}` }), el('span', { class: 'klein', tekst: 'lessen af' })),
      el('div', { class: 'cijfer' }, el('b', { tekst: `${s.soerasAf.length}` }), el('span', { class: 'klein', tekst: 'soera\'s' })),
      el('div', { class: 'cijfer' }, el('b', { tekst: `${s.huidigeReeks}` }), el('span', { class: 'klein', tekst: 'dagen op rij' }))),

    weekStrip(v),

    zwak.length
      ? el('div', { class: 'zwakblok' },
          el('h3', { tekst: 'Hier gaat het nog mis' }),
          el('div', { class: 'zwakrij' }, ...zwak.map((z) => {
            const l = LETTER_OP_ID[z.id];
            return el('div', { class: 'zwakletter' },
              el('span', { class: 'ar', dir: 'rtl', lang: 'ar', tekst: l.letter }),
              el('span', { class: 'klein', tekst: `${l.naam} · ${Math.round(z.deel * 100)}% fout` }));
          })),
          el('p', { class: 'klein', tekst: 'Tip: oefen deze letters samen hardop. Ze lijken vaak op elkaar in vorm of klank.' }))
      : el('p', { class: 'klein', tekst: 'Nog geen letters die opvallend vaak fout gaan.' }),

    el('div', { class: 'instelrij' },
      el('label', { for: `leeftijd-${p.id}`, tekst: 'Leeftijd' }),
      el('select', { id: `leeftijd-${p.id}`, opchange: (e) => {
        wijzigProfiel(p.id, { leeftijd: Number(e.target.value) });
        toast('Leeftijd aangepast');
      } }, ...Array.from({ length: 9 }, (_, i) => {
        const jaar = i + 5;
        return el('option', { value: String(jaar), selected: jaar === p.leeftijd, tekst: `${jaar} jaar` });
      }))),
  );
}

/**
 * Oefentijd van de afgelopen zeven dagen. Eén reeks, dus geen legenda:
 * de kop zegt al wat er staat. De cijfers staan er ook als tekst onder,
 * zodat het ook zonder kleuren te lezen is.
 */
function weekStrip(v) {
  const dagen = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const sleutel = d.toISOString().slice(0, 10);
    const dag = v.dagen[sleutel] || { seconden: 0, goed: 0, fout: 0 };
    dagen.push({
      sleutel,
      label: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'][d.getDay()],
      minuten: Math.round(dag.seconden / 60),
      goed: dag.goed,
      vandaag: sleutel === vandaag(),
    });
  }
  const top = Math.max(10, ...dagen.map((d) => d.minuten));

  const tabel = el('table', { class: 'weektabel', hidden: true },
    el('thead', {}, el('tr', {}, el('th', { tekst: 'Dag' }), el('th', { tekst: 'Minuten' }), el('th', { tekst: 'Goed' }))),
    el('tbody', {}, ...dagen.map((d) =>
      el('tr', {}, el('td', { tekst: d.sleutel }), el('td', { tekst: String(d.minuten) }), el('td', { tekst: String(d.goed) })))));

  const totaal = dagen.reduce((n, d) => n + d.minuten, 0);

  return el('figure', { class: 'weekstrip' },
    el('figcaption', { tekst: 'Oefentijd per dag, afgelopen week (minuten)' }),
    totaal === 0 ? el('p', { class: 'klein', tekst: 'Deze week is er nog geen oefentijd gemeten.' }) : null,
    el('div', { class: `staven ${totaal === 0 ? 'leeg' : ''}`.trim() }, ...dagen.map((d) =>
      el('div', { class: `staafkolom ${d.vandaag ? 'vandaag' : ''}`.trim() },
        el('span', { class: 'staafwaarde', tekst: d.minuten ? String(d.minuten) : '' }),
        el('div', { class: 'staafbak' },
          el('div', { class: 'staaf', stijl: { height: `${(d.minuten / top) * 100}%` },
            title: `${d.label}: ${d.minuten} min, ${d.goed} goed` })),
        el('span', { class: 'staaflabel', tekst: d.label })))),
    el('button', { class: 'knop stil klein-knop', tekst: 'Cijfers als tabel',
      opclick: (e) => {
        tabel.hidden = !tabel.hidden;
        e.currentTarget.textContent = tabel.hidden ? 'Cijfers als tabel' : 'Tabel verbergen';
      } }),
    tabel);
}

function pinInstellen() {
  const huidig = ouderInstelling().pin;
  const veld = el('input', { type: 'text', inputmode: 'numeric', maxlength: '4',
    id: 'nieuwe-pin', placeholder: '4 cijfers', autocomplete: 'off' });

  return el('div', {},
    el('p', { class: 'klein', tekst: huidig
      ? 'Er staat een pincode ingesteld. Vul een nieuwe in, of maak het veld leeg en sla op om hem weg te halen.'
      : 'Nog geen pincode. Met een code komt een kind niet zomaar in dit scherm. Let op: de code staat op het apparaat zelf en houdt geen vastberaden tiener tegen.' }),
    el('form', { class: 'instelrij', opsubmit: (e) => {
      e.preventDefault();
      const nieuw = veld.value.trim();
      if (nieuw && !/^\d{4}$/.test(nieuw)) { toast('Vul vier cijfers in', 'fout'); return; }
      zetOuderPin(nieuw || null);
      toast(nieuw ? 'Pincode opgeslagen' : 'Pincode weggehaald');
      veld.value = '';
    } },
      el('label', { for: 'nieuwe-pin', tekst: 'Pincode' }), veld,
      el('button', { class: 'knop', type: 'submit', tekst: 'Opslaan' })));
}

function schakelaar(label, aan, opWissel) {
  const knop = el('button', { class: `schakelaar ${aan ? 'aan' : ''}`.trim(),
    role: 'switch', 'aria-checked': aan ? 'true' : 'false',
    opclick: (e) => {
      const nu = e.currentTarget.classList.toggle('aan');
      e.currentTarget.setAttribute('aria-checked', nu ? 'true' : 'false');
      opWissel(nu);
    } }, el('i', {}));
  return el('label', { class: 'schakelrij' }, knop, el('span', { tekst: label }));
}

/** Snelkoppeling naar de studio, met hoeveel er al ingesproken is. */
function studioKaart() {
  const regel = el('p', { class: 'klein', tekst: 'Even kijken wat er al is…' });
  opgenomenSleutels().then((gedaan) => {
    regel.textContent = gedaan.size
      ? `${gedaan.size} opnames staan klaar op dit apparaat.`
      : 'Er staat nog niets ingesproken. De 28 letters kosten je ongeveer tien minuten.';
  });
  return el('section', { class: 'kaart studiokaart' },
    el('h2', { tekst: 'Zelf inspreken' }),
    el('p', { tekst: 'Neem de letters, woorden en aya\'s in met je eigen stem. Je kind hoort dan een stem die het kent — en bij de Koran is het de enige manier waarop er geluid klinkt.' }),
    regel,
    el('a', { class: 'knop', href: '#/studio' }, icoon('microfoon', { maat: 20 }), 'Naar de opnamestudio'));
}

/** Laat horen wat de stem van dit apparaat ervan maakt, met één tik. */
function stemProef() {
  const melding = el('p', { class: 'klein' });
  heeftArabischeStem().then((heeft) => {
    melding.textContent = heeft
      ? 'Dit apparaat heeft een Arabische stem.'
      : 'Dit apparaat heeft géén Arabische stem. Letters en woorden blijven stil tot je ze zelf inspreekt.';
  });
  return el('div', {},
    el('button', { class: 'knop stil klein-knop', opclick: async () => {
      const hoe = await zegLetterKlank(LETTERS_OP_ID.ba);
      melding.textContent = { opname: 'Dat was jullie eigen opname.', bestand: 'Dat kwam uit een bestand.',
        stem: 'Dat was de stem van dit apparaat.', stil: 'Er kwam niets — er is geen opname en geen Arabische stem.' }[hoe];
    } }, icoon('geluid', { maat: 18 }), 'Hoor hoe "ba" klinkt'),
    melding);
}
