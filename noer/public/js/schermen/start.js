// Wie ben jij? Profielen kiezen en aanmaken. Meerdere kinderen op één tablet.

import { el, leeg, bevestig, avatarRing } from '../ui.js';
import { alleProfielen, maakProfiel, kiesProfiel, verwijderProfiel } from '../opslag.js';
import { voortgang } from '../opslag.js';
import { niveauVan } from '../punten.js';
import { ga } from '../app.js';

const AVATARS = ['🦊', '🐨', '🦁', '🐼', '🐧', '🦉', '🐢', '🐝', '🦋', '🐬', '🦄', '🐙'];
const KLEUREN = ['#f6c453', '#5fb99a', '#7c9cf5', '#e0776a', '#c58bd8', '#66c4c9'];

export function toon(bak) {
  const profielen = alleProfielen();
  leeg(bak).append(
    el('div', { class: 'welkom' },
      el('div', { class: 'logo' }, el('span', { class: 'ar', dir: 'rtl', lang: 'ar', tekst: 'نُور' })),
      el('h1', { tekst: 'Noer' }),
      el('p', { class: 'onder-logo', tekst: 'Arabisch lezen, stap voor stap' })),
    profielen.length ? profielenLijst(profielen) : null,
    nieuwFormulier(profielen.length > 0),
  );
}

function profielenLijst(profielen) {
  return el('section', { class: 'kaart' },
    el('h2', { tekst: 'Wie gaat er oefenen?' }),
    el('div', { class: 'profielen' }, ...profielen.map((p) => {
      const n = niveauVan(voortgang(p.id).xp);
      return el('div', { class: 'profielkaart' },
        el('button', { class: 'profielkies', opclick: () => { kiesProfiel(p.id); ga('/thuis'); } },
          avatarRing(p, n.deel, { groot: true, niveauNr: n.nr }),
          el('b', { tekst: p.naam }),
          el('span', { class: 'klein', tekst: `${n.emoji} ${n.naam}` })),
        el('button', { class: 'wis', 'aria-label': `${p.naam} verwijderen`, tekst: '×',
          opclick: async () => {
            if (await bevestig(`${p.naam} verwijderen?`,
              'De voortgang van dit kind verdwijnt dan van dit apparaat.')) {
              verwijderProfiel(p.id);
              toon(document.getElementById('inhoud'));
            }
          } }));
    })));
}

function nieuwFormulier(inklapbaar) {
  let avatar = AVATARS[0];
  let kleur = KLEUREN[0];

  const naamVeld = el('input', { type: 'text', id: 'naam', maxlength: '20',
    placeholder: 'Bijvoorbeeld: Yasmina', autocomplete: 'off' });
  const leeftijdVeld = el('select', { id: 'leeftijd' },
    ...Array.from({ length: 9 }, (_, i) => el('option', { value: String(i + 5), tekst: `${i + 5} jaar` })));
  leeftijdVeld.value = '8';

  const avatarRij = el('div', { class: 'kiezers' }, ...AVATARS.map((a, i) =>
    el('button', { class: `kiezer ${i === 0 ? 'aan' : ''}`.trim(), tekst: a, 'aria-label': `Avatar ${a}`,
      opclick: (e) => {
        avatar = a;
        avatarRij.querySelectorAll('.kiezer').forEach((k) => k.classList.remove('aan'));
        e.currentTarget.classList.add('aan');
      } })));

  const kleurRij = el('div', { class: 'kiezers' }, ...KLEUREN.map((k, i) =>
    el('button', { class: `kiezer kleur ${i === 0 ? 'aan' : ''}`.trim(), stijl: { background: k },
      'aria-label': `Kleur ${i + 1}`,
      opclick: (e) => {
        kleur = k;
        kleurRij.querySelectorAll('.kiezer').forEach((x) => x.classList.remove('aan'));
        e.currentTarget.classList.add('aan');
      } })));

  const formulier = el('form', { class: 'nieuwprofiel', opsubmit: (e) => {
    e.preventDefault();
    const naam = naamVeld.value.trim();
    if (!naam) { naamVeld.focus(); return; }
    maakProfiel({ naam, leeftijd: Number(leeftijdVeld.value), avatar, kleur });
    ga('/thuis');
  } },
    el('label', { for: 'naam', tekst: 'Naam' }), naamVeld,
    el('label', { for: 'leeftijd', tekst: 'Leeftijd' }), leeftijdVeld,
    el('label', { tekst: 'Kies een dier' }), avatarRij,
    el('label', { tekst: 'Kies een kleur' }), kleurRij,
    el('button', { class: 'knop groot', type: 'submit', tekst: 'Beginnen' }));

  if (!inklapbaar) {
    return el('section', { class: 'kaart' }, el('h2', { tekst: 'Maak een profiel' }), formulier);
  }
  const details = el('details', { class: 'kaart' },
    el('summary', { tekst: '+ Nog een kind toevoegen' }), formulier);
  return details;
}
