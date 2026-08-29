// Wie ben jij? Profielen kiezen en aanmaken. Meerdere kinderen op één tablet.

import { el, zet, bevestig, avatarRing } from '../ui.js';
import { alleProfielen, maakProfiel, kiesProfiel, verwijderProfiel } from '../opslag.js';
import { voortgang } from '../opslag.js';
import { niveauVan } from '../punten.js';
import { ga } from '../route.js';

const AVATARS = ['🦊', '🐨', '🦁', '🐼', '🐧', '🦉', '🐢', '🐝', '🦋', '🐬', '🦄', '🐙'];
const KLEUREN = ['#f6c453', '#5fb99a', '#7c9cf5', '#e0776a', '#c58bd8', '#66c4c9'];

export function toon(bak) {
  const profielen = alleProfielen();
  zet(bak, 
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

  // Levend voorbeeld: het kind ziet meteen wat het kiest.
  const voorbeeldAvatar = el('span', { class: 'avatar', stijl: { background: kleur }, tekst: avatar });
  const voorbeeldNaam = el('b', { class: 'voorbeeldnaam', tekst: 'Jouw naam' });
  const voorbeeld = el('div', { class: 'voorbeeldkind' },
    el('span', { class: 'avatarring groot' }, voorbeeldAvatar), voorbeeldNaam);

  const beginKnop = el('button', { class: 'knop groot', type: 'submit', tekst: 'Beginnen', disabled: true });

  const naamVeld = el('input', { type: 'text', id: 'naam', maxlength: '20',
    placeholder: 'Bijvoorbeeld: Yasmina', autocomplete: 'off',
    opinput: (e) => {
      const naam = e.target.value.trim();
      voorbeeldNaam.textContent = naam || 'Jouw naam';
      beginKnop.disabled = naam.length === 0;
    } });

  const leeftijdVeld = el('select', { id: 'leeftijd' },
    ...Array.from({ length: 9 }, (_, i) => el('option', { value: String(i + 5), tekst: `${i + 5} jaar` })));
  leeftijdVeld.value = '8';

  const avatarRij = el('div', { class: 'kiezers' }, ...AVATARS.map((a, i) =>
    el('button', { class: `kiezer ${i === 0 ? 'aan' : ''}`.trim(), type: 'button', tekst: a,
      'aria-label': `Kies ${a}`, 'aria-pressed': i === 0 ? 'true' : 'false',
      opclick: (e) => {
        avatar = a;
        voorbeeldAvatar.textContent = a;
        for (const k of avatarRij.querySelectorAll('.kiezer')) {
          k.classList.remove('aan');
          k.setAttribute('aria-pressed', 'false');
        }
        e.currentTarget.classList.add('aan');
        e.currentTarget.setAttribute('aria-pressed', 'true');
      } })));

  const kleurRij = el('div', { class: 'kiezers' }, ...KLEUREN.map((k, i) =>
    el('button', { class: `kiezer kleur ${i === 0 ? 'aan' : ''}`.trim(), type: 'button',
      stijl: { background: k }, 'aria-label': `Kleur ${i + 1}`,
      'aria-pressed': i === 0 ? 'true' : 'false',
      opclick: (e) => {
        kleur = k;
        voorbeeldAvatar.style.background = k;
        for (const x of kleurRij.querySelectorAll('.kiezer')) {
          x.classList.remove('aan');
          x.setAttribute('aria-pressed', 'false');
        }
        e.currentTarget.classList.add('aan');
        e.currentTarget.setAttribute('aria-pressed', 'true');
      } })));

  const formulier = el('form', { class: 'nieuwprofiel', opsubmit: (e) => {
    e.preventDefault();
    const naam = naamVeld.value.trim();
    if (!naam) { naamVeld.focus(); return; }
    maakProfiel({ naam, leeftijd: Number(leeftijdVeld.value), avatar, kleur });
    ga('/thuis');
  } },
    voorbeeld,
    el('label', { for: 'naam', tekst: 'Naam' }), naamVeld,
    el('label', { for: 'leeftijd', tekst: 'Leeftijd' }), leeftijdVeld,
    el('label', { tekst: 'Kies een dier' }), avatarRij,
    el('label', { tekst: 'Kies een kleur' }), kleurRij,
    beginKnop);

  if (!inklapbaar) {
    return el('section', { class: 'kaart' }, el('h2', { tekst: 'Maak een profiel' }), formulier);
  }
  const details = el('details', { class: 'kaart' },
    el('summary', { tekst: '+ Nog een kind toevoegen' }), formulier);
  return details;
}
