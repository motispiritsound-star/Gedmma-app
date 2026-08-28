#!/usr/bin/env node
/**
 * Startpunt van de tool. Dit bestand is met opzet gewoon JavaScript: het draait
 * op elke Node-versie, zodat we een begrijpelijke melding kunnen geven in plaats
 * van "Unknown file extension .ts" als iemand een te oude Node heeft.
 */
const [hoofd, minor] = process.versions.node.split('.').map(Number);
const teOud = hoofd < 22 || (hoofd === 22 && minor < 18);

if (teOud) {
  console.error(`\nWebscan NL heeft Node 22.18 of nieuwer nodig; jij draait ${process.versions.node}.`);
  console.error('Werk Node bij via https://nodejs.org (kies de LTS-versie) en probeer het opnieuw.\n');
  process.exit(1);
}

const doel = process.argv[2] === '--proefrit' ? './demo/proefrit.ts' : './src/cli.ts';
if (process.argv[2] === '--proefrit') process.argv.splice(2, 1);

import(doel).catch((fout) => {
  console.error('\nStarten is mislukt:', fout instanceof Error ? fout.message : fout);
  console.error('Heb je "npm install" al gedraaid?\n');
  process.exit(1);
});
