#!/usr/bin/env node
// Bouwt de open uitgave: een map met bestanden die je gratis ergens neerzet.
// Geen server, geen account, geen betaling — alles staat open voor iedereen.
//
//   node tools/statisch.js            -> uit/
//   node tools/statisch.js --uit map
//
// Sleep de map daarna naar netlify.com/drop of zet hem bij Cloudflare Pages.
// Zie ONLINE.md.
//
// Wat er anders is dan de betaalde uitgave:
//   - de app draait in modus 'open': geen slot, geen /api/toegang
//   - de pagina's die een server nodig hebben (aanmelden, inloggen, account,
//     bedankt, de proefbank) gaan niet mee
//   - het prijsblok op de startpagina wordt een introblok
//
// Dit bestand raakt de repository niet aan: alles gaat naar de uitvoermap.

import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORTEL = fileURLToPath(new URL('..', import.meta.url));

const argumenten = process.argv.slice(2);
const waarde = (v, standaard) => {
  const i = argumenten.indexOf(v);
  return i >= 0 && argumenten[i + 1] ? argumenten[i + 1] : standaard;
};
const UIT = waarde('--uit', join(WORTEL, 'uit'));

// Deze pagina's kunnen niet zonder server, dus horen niet in een open uitgave.
const ALLEEN_MET_SERVER = new Set([
  'aanmelden.html', 'inloggen.html', 'account.html', 'bedankt.html',
  'proef-betalen.html', 'site.js', 'LEESMIJ.md',
  'open',   // die map bevat juist de vervangers; die worden apart gekopieerd
]);

await rm(UIT, { recursive: true, force: true });
await mkdir(UIT, { recursive: true });

// --- De site op / ---------------------------------------------------------

for (const naam of await readdir(join(WORTEL, 'landing'))) {
  if (ALLEEN_MET_SERVER.has(naam)) continue;
  await cp(join(WORTEL, 'landing', naam), join(UIT, naam), { recursive: true });
}
await rm(join(UIT, 'marketing', 'LEESMIJ.md'), { force: true });

// De voorwaarden en de privacyverklaring gaan over abonnementen en accounts.
// In een open uitgave bestaan die niet, dus komt er een kortere versie te
// staan. Een privacyverklaring die niet klopt is erger dan geen.
for (const naam of await readdir(join(WORTEL, 'landing', 'open'))) {
  await cp(join(WORTEL, 'landing', 'open', naam), join(UIT, naam));
}

// --- De app op /app/ ------------------------------------------------------

await cp(join(WORTEL, 'public'), join(UIT, 'app'), { recursive: true });

// De app draait open: geen slot, en niets om aan een server te vragen.
const versiePad = join(UIT, 'app', 'js', 'versie.js');
const versie = await readFile(versiePad, 'utf8');
if (!versie.includes("modus: 'abonnement'")) {
  throw new Error('versie.js ziet er anders uit dan verwacht; zet modus met de hand op open');
}
await writeFile(versiePad, versie.replace("modus: 'abonnement'", "modus: 'open'"));

// --- De startpagina, zonder prijzen ---------------------------------------

const indexPad = join(UIT, 'index.html');
let index = await readFile(indexPad, 'utf8');

const begin = index.indexOf('<section id="prijs">');
const eind = index.indexOf('</section>', begin) + '</section>'.length;
if (begin < 0 || eind < begin) throw new Error('het prijsblok is niet gevonden in index.html');

index = index.slice(0, begin) + `<section id="prijs">
  <div class="binnen midden" style="max-width:40rem;margin-inline:auto">
    <h2>Nu gratis</h2>
    <p class="groot-p">Noer is er net, en alles staat open: alle tien de leeslessen, alle
      soera's, alle woordthema's, de opnamestudio en het ouderscherm. Geen account, geen
      betaling, geen proefperiode die afloopt.</p>
    <p class="klein" style="margin-top:1rem">Later komt er een abonnement voor wie het
      dagelijks gebruikt. Wie er nu bij is, hoort dat ruim van tevoren — en houdt wat hij heeft.</p>
    <div class="knoprij">
      <a class="knop" href="/app/">Begin vandaag</a>
      <a class="knop stil" href="installeren.html">Op je beginscherm zetten</a>
    </div>
  </div>
</section>` + index.slice(eind);

// Twee vragen en de slotalinea gaan over betalen. In een open uitgave staat
// daar iets anders, of niets.
const vervang = (tekst, oud, nieuw) => {
  if (!tekst.includes(oud)) throw new Error(`niet gevonden in index.html: ${oud.slice(0, 60)}…`);
  return tekst.replace(oud, nieuw);
};

index = vervang(index,
  'Er is geen reclame en geen meetsoftware. Voor het abonnement zelf is er wel een account op naam van de ouder nodig — dat is het enige dat op onze server staat.',
  'Er is geen reclame en geen meetsoftware, en er is geen account: je hoeft nergens iets in te vullen.');

index = vervang(index,
  '<p>Met één knop in je account, op elk moment. Je houdt toegang tot het einde van de periode die je betaald hebt. Geen opzegtermijn, geen telefoontje, geen mailtje.</p>',
  '<p>Er is nu niets om op te zeggen: Noer is gratis en er is geen account. Komt er later een abonnement, dan geldt daarvoor: opzeggen met één knop, op elk moment, zonder opzegtermijn.</p>');

index = vervang(index,
  'Bevalt het, dan zet je de rest\n      open voor € 6,99 per maand — en zeg je op met dezelfde knop.',
  'Alles staat open, en het kost\n      voorlopig niets.');

// De knoppen die naar een server wijzen, wijzen nu naar de app zelf.
index = index
  .replace(/<a href="inloggen\.html" data-account-knop>Inloggen<\/a>\s*/g, '')
  .replace(/href="aanmelden\.html"/g, 'href="/app/"')
  .replace(/>Noer openzetten</g, '>Begin gratis<')
  .replace(/>Kies het jaarabonnement</g, '>Begin gratis<')
  .replace(/>Zet alles open</g, '>Op je beginscherm zetten<')
  .replace(/<a href="account\.html">Mijn abonnement<\/a>\s*/g, '')
  .replace(/<script type="module">\s*import \{ vulKopbalk \} from '\.\/site\.js';\s*vulKopbalk\(\);\s*<\/script>/g, '');

await writeFile(indexPad, index);

// De flyer noemt een schoollicentie met een prijs. In de open uitgave is er
// niets te betalen, en dat is juist het argument om nu langs te gaan.
const flyerPad = join(UIT, 'flyer.html');
let flyer = await readFile(flyerPad, 'utf8');
flyer = vervang(flyer, '<h2>Eén licentie voor de hele klas</h2>', '<h2>Nu gratis, voor de hele klas</h2>');
flyer = flyer.replace(/<p>Zestig kinderen voor[\s\S]*?<\/p>/,
  `<p>Noer is er net en alles staat open — voor elk kind, thuis en in de klas. Geen
        licentie, geen factuur, geen account. Wij komen graag een uur langs om de leerkrachten
        wegwijs te maken en te horen wat er in jullie lessen anders loopt.</p>`);
flyer = vervang(flyer, '<b>€ 295</b>', '<b>Gratis</b>');
flyer = vervang(flyer, '<span>per jaar, 60 kinderen</span>', '<span>voor de hele school</span>');
await writeFile(flyerPad, flyer);

// De andere pagina's verwijzen ook naar het account; die verwijzingen weg.
for (const naam of ['installeren.html', 'voorwaarden.html', 'privacy.html', 'flyer.html', 'niet-gevonden.html']) {
  const pad = join(UIT, naam);
  let tekst;
  try { tekst = await readFile(pad, 'utf8'); } catch { continue; }
  await writeFile(pad, tekst
    .replace(/<a href="account\.html">Mijn abonnement<\/a>\s*/g, '')
    .replace(/href="aanmelden\.html"/g, 'href="/app/"'));
}

// --- Wat de host moet weten -----------------------------------------------

// Netlify en Cloudflare Pages lezen allebei dit bestand. index.html en de
// service worker mogen niet lang blijven hangen, anders ziet niemand een
// nieuwe uitgave; de rest regelt de service worker zelf.
await writeFile(join(UIT, '_headers'), [
  '/index.html', '  Cache-Control: no-cache', '',
  '/app/index.html', '  Cache-Control: no-cache', '',
  '/app/sw.js', '  Cache-Control: no-cache', '',
].join('\n'));

const tel = async (map) => {
  let n = 0;
  for (const item of await readdir(map, { withFileTypes: true })) {
    n += item.isDirectory() ? await tel(join(map, item.name)) : 1;
  }
  return n;
};

console.log(`\n  ${UIT}`);
console.log(`  ${await tel(UIT)} bestanden — de open uitgave, alles staat open\n`);
console.log('  Sleep deze map naar https://app.netlify.com/drop en je bent live.');
console.log('  Zie ONLINE.md voor een eigen domein en voor de stap naar betaald.\n');
