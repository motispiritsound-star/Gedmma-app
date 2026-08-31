// De opnamestudio: neem de letters, woorden en aya's in met je eigen stem.
//
// Waarom dit erin zit: een computerstem spreekt Arabisch op zijn best matig
// uit, en op veel apparaten helemaal niet. Een ouder of leerkracht die de 28
// letters inspreekt is in tien minuten klaar, en het kind hoort daarna een
// stem die het kent. Voor de Koran is het bovendien de enige nette manier —
// recitatie hoort van een mens te komen.
//
// Alles blijft op het apparaat staan (IndexedDB). Met "Opnames opslaan" krijg
// je er een zip van, met dezelfde mappen als public/audio/, zodat je ze kunt
// bewaren, delen of in de app zelf zetten.

import { el, zet, balk, toast, bevestig } from '../ui.js';
import { icoon, icoonKnop } from '../iconen.js';
import { LETTERS } from '../../data/letters.js';
import { THEMAS } from '../../data/woorden.js';
import { SOERAS } from '../../data/koran.js';
import {
  sleutels, padVan, bewaarOpname, urlVan, wisOpname, alleOpnames,
  opgenomenSleutels, wisAlleOpnames, ruimteInGebruik, extensieVan,
} from '../opnames.js';
import { zipBlob } from '../zip.js';
import { vergeetBestanden } from '../geluid.js';
import { ga } from '../route.js';

const FATHA = 'َ';
const MAX_SECONDEN = 12;

/** Alles wat je kunt inspreken, gegroepeerd zoals je het zou aanpakken. */
export function groepen() {
  return [
    {
      id: 'letter-klank', naam: 'Letters — de klank', soort: 'letters',
      uitleg: 'Spreek de letter uit met een fatha: "ba", "ta", "tha". Dit is wat een kind nodig heeft om te leren lezen.',
      items: LETTERS.map((l) => ({
        sleutel: sleutels.letter(`${l.id}-klank`),
        ar: l.letter + FATHA, kop: `${l.translit}a`, onder: l.naam,
      })),
    },
    {
      id: 'letter-naam', naam: 'Letters — de naam', soort: 'letters',
      uitleg: 'Spreek de naam van de letter uit: "baa", "taa", "thaa".',
      items: LETTERS.map((l) => ({
        sleutel: sleutels.letter(l.id), ar: l.naamAr, kop: l.naam, onder: l.klank,
      })),
    },
    ...THEMAS.map((t) => ({
      id: `woorden-${t.id}`, naam: `Woorden — ${t.naam}`, soort: 'woorden', emoji: t.emoji,
      uitleg: 'Spreek het woord rustig uit, één keer.',
      items: t.woorden.map((w, i) => ({
        sleutel: sleutels.woord(t.id, i), ar: w.ar, kop: w.tr, onder: w.nl, emoji: w.emoji,
      })),
    })),
    ...SOERAS.map((s) => ({
      id: `soera-${s.id}`, naam: `Soera ${s.naam}`, soort: 'koran',
      uitleg: 'Reciteer de aya. Deze opname wordt gebruikt waar de app anders stil blijft.',
      items: s.ayaat.map((a) => ({
        sleutel: sleutels.aya(s.nr, a.n), ar: a.ar, kop: `Aya ${a.n}`, onder: a.tr,
      })),
    })),
  ];
}

// --- Overzicht ------------------------------------------------------------

export async function toon(bak) {
  const alle = groepen();
  const gedaan = await opgenomenSleutels();
  const totaal = alle.reduce((n, g) => n + g.items.length, 0);
  const opgenomen = alle.reduce((n, g) => n + g.items.filter((i) => gedaan.has(i.sleutel)).length, 0);
  const bytes = await ruimteInGebruik();

  zet(bak,
    el('header', { class: 'schermkop met-terug' },
      el('a', { class: 'icoonknop', href: '#/ouders', 'aria-label': 'Terug naar het ouderscherm' }, icoon('terug')),
      el('div', {},
        el('p', { class: 'kruimel', tekst: 'Voor ouders' }),
        el('h1', { tekst: 'Opnamestudio' }))),

    el('section', { class: 'kaart uitleg' },
      el('p', { tekst: 'Neem de letters, woorden en aya\'s in met je eigen stem. Je kind hoort dan een stem die het kent, in plaats van een computerstem — en bij de Koran is het de enige manier waarop er geluid klinkt.' }),
      el('p', { class: 'klein', tekst: 'Begin bij "Letters — de klank". Dat zijn 28 opnames en je bent er in tien minuten doorheen.' }),
      balk(totaal ? opgenomen / totaal : 0, 'Hoeveel er al is opgenomen'),
      el('p', { class: 'klein', tekst: `${opgenomen} van de ${totaal} opgenomen${bytes ? ` · ${(bytes / 1048576).toFixed(1)} MB` : ''}` })),

    ...['letters', 'woorden', 'koran'].map((soort) => {
      const groepenVanSoort = alle.filter((g) => g.soort === soort);
      const kop = { letters: 'Letters', woorden: 'Woorden', koran: 'Koran' }[soort];
      return el('section', { class: 'kaart' },
        el('h2', { tekst: kop }),
        el('div', { class: 'groeplijst' }, ...groepenVanSoort.map((g) => {
          const af = g.items.filter((i) => gedaan.has(i.sleutel)).length;
          return el('a', { class: `groepregel ${af === g.items.length ? 'af' : ''}`.trim(),
            href: `#/studio/${g.id}` },
            el('div', { class: 'groepinfo' },
              el('b', {}, g.emoji ? `${g.emoji} ${g.naam}` : g.naam),
              el('span', { class: 'klein', tekst: `${af} van de ${g.items.length}` })),
            balk(af / g.items.length, ''),
            af === g.items.length ? icoon('vink', { maat: 20 }) : icoon('pijlRechts', { maat: 20 }));
        })));
    }),

    el('section', { class: 'kaart' },
      el('h2', { tekst: 'Opnames bewaren' }),
      el('p', { class: 'klein', tekst: 'De opnames staan in dit apparaat. Sla ze op als zip om ze te bewaren of op een ander apparaat te zetten. De mappen in de zip zijn dezelfde als in public/audio/, dus je kunt ze er zo in schuiven.' }),
      el('div', { class: 'knoprij' },
        el('button', { class: 'knop', opclick: exporteer, disabled: opgenomen === 0 },
          icoon('opslaan', { maat: 20 }), 'Opnames opslaan'),
        el('button', { class: 'knop gevaar', tekst: 'Alle opnames wissen', disabled: opgenomen === 0,
          opclick: async () => {
            if (!await bevestig('Alle opnames wissen?', 'Alle ingesproken letters, woorden en aya\'s verdwijnen van dit apparaat.')) return;
            await wisAlleOpnames();
            vergeetBestanden();
            toast('Opnames gewist');
            toon(bak);
          } }))),
  );
}

async function exporteer() {
  const rijen = await alleOpnames();
  if (!rijen.length) return;
  const bestanden = await Promise.all(rijen.map(async (rij) => ({
    naam: padVan(rij.sleutel, extensieVan(rij.type)),
    data: new Uint8Array(await rij.blob.arrayBuffer()),
  })));

  bestanden.push({
    naam: 'LEESMIJ.txt',
    data: new TextEncoder().encode(
      'Opnames uit Noer.\n\n'
      + 'Zet de map audio/ in public/ van de app, dan gebruikt Noer deze\n'
      + 'bestanden vanzelf — ook op een ander apparaat en zonder internet.\n\n'
      + `Gemaakt op ${new Date().toLocaleDateString('nl-NL')}.\n`),
  });

  const url = URL.createObjectURL(zipBlob(bestanden));
  const link = el('a', { href: url, download: `noer-opnames-${new Date().toISOString().slice(0, 10)}.zip` });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast(`${rijen.length} opnames opgeslagen`, 'goed');
}

// --- Eén groep opnemen ----------------------------------------------------

export async function toonGroep(bak, id) {
  const groep = groepen().find((g) => g.id === id);
  if (!groep) return ga('/studio');
  const gedaan = await opgenomenSleutels();

  const teller = el('p', { class: 'klein' });
  const voortgang = el('div', {});

  const tekenVoortgang = () => {
    const af = groep.items.filter((i) => gedaan.has(i.sleutel)).length;
    zet(voortgang, balk(af / groep.items.length, 'Voortgang in deze groep'));
    teller.textContent = `${af} van de ${groep.items.length} opgenomen`;
  };

  zet(bak,
    el('header', { class: 'schermkop met-terug' },
      el('a', { class: 'icoonknop', href: '#/studio', 'aria-label': 'Terug naar de studio' }, icoon('terug')),
      el('div', {},
        el('p', { class: 'kruimel', tekst: 'Opnemen' }),
        el('h1', { tekst: groep.naam }))),

    el('section', { class: 'kaart uitleg' },
      el('p', { tekst: groep.uitleg }),
      voortgang, teller),

    el('div', { class: 'opnamelijst' },
      ...groep.items.map((item) => opnameRegel(item, gedaan, tekenVoortgang))),
  );

  tekenVoortgang();
}

/** Kiest het eerste opnameformaat dat deze browser aankan. */
function besteFormaat() {
  const kandidaten = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  if (!window.MediaRecorder) return null;
  return kandidaten.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

let lopendeOpname = null; // maar één tegelijk

function opnameRegel(item, gedaan, opVerandering) {
  const staat = el('span', { class: 'opnamestaat' });
  const rij = el('div', { class: 'opnameregel' });

  const speelKnop = icoonKnop('afspelen', { label: 'Beluister de opname', klasse: 'luister klein-rond',
    opklik: async () => {
      const url = await urlVan(item.sleutel);
      if (url) new Audio(url).play().catch(() => {});
    } });

  const wisKnop = icoonKnop('prullenbak', { label: 'Opname wissen', klasse: 'luister klein-rond gevaarlijk',
    opklik: async () => {
      await wisOpname(item.sleutel);
      gedaan.delete(item.sleutel);
      vergeetBestanden();
      werkBij();
      opVerandering();
    } });

  const neemKnop = el('button', { class: 'knop neemop', opclick: () => wissel() });

  function werkBij() {
    const heeft = gedaan.has(item.sleutel);
    rij.classList.toggle('opgenomen', heeft);
    staat.textContent = heeft ? 'opgenomen' : 'nog niet';
    speelKnop.disabled = !heeft;
    wisKnop.disabled = !heeft;
    zet(neemKnop, icoon('microfoon', { maat: 20 }), heeft ? 'Opnieuw' : 'Opnemen');
    neemKnop.classList.remove('bezig');
  }

  let stopper = null;

  async function wissel() {
    if (stopper) { stopper(); return; }
    if (lopendeOpname) lopendeOpname();

    const formaat = besteFormaat();
    if (formaat === null) { toast('Deze browser kan geen geluid opnemen', 'fout'); return; }

    let stroom;
    try {
      stroom = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast('Geen toegang tot de microfoon', 'fout');
      return;
    }

    const recorder = new MediaRecorder(stroom, formaat ? { mimeType: formaat } : undefined);
    const stukken = [];
    recorder.ondataavailable = (e) => { if (e.data.size) stukken.push(e.data); };

    recorder.onstop = async () => {
      for (const spoor of stroom.getTracks()) spoor.stop();
      clearInterval(tikker);
      clearTimeout(rem);
      stopper = null;
      lopendeOpname = null;
      const blob = new Blob(stukken, { type: recorder.mimeType || formaat || 'audio/webm' });
      if (blob.size > 0) {
        await bewaarOpname(item.sleutel, blob);
        gedaan.add(item.sleutel);
        vergeetBestanden();
        opVerandering();
      }
      werkBij();
    };

    let seconden = 0;
    const tikker = setInterval(() => {
      seconden++;
      zet(neemKnop, icoon('stop', { maat: 20 }), `Stop ${seconden}s`);
    }, 1000);
    const rem = setTimeout(() => stopper?.(), MAX_SECONDEN * 1000);

    stopper = () => { if (recorder.state !== 'inactive') recorder.stop(); };
    lopendeOpname = stopper;

    recorder.start();
    neemKnop.classList.add('bezig');
    zet(neemKnop, icoon('stop', { maat: 20 }), 'Stop');
  }

  // Arabisch bovenaan over de hele breedte — een aya past niet naast knoppen.
  zet(rij,
    el('div', { class: 'ar opname-ar', dir: 'rtl', lang: 'ar', tekst: item.ar }),
    el('div', { class: 'opname-voet' },
      el('div', { class: 'opname-labels' },
        el('b', {}, item.emoji ? `${item.emoji} ${item.kop}` : item.kop),
        el('span', { class: 'klein', tekst: item.onder })),
      staat,
      el('div', { class: 'opname-knoppen' }, neemKnop, speelKnop, wisKnop)));

  werkBij();
  return rij;
}
