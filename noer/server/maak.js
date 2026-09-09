// De server in elkaar zetten. Apart van server.js zodat de tests hem kunnen
// starten met een nep-Mollie en een eigen map, zonder omgevingsvariabelen.

import { createServer } from 'node:http';
import { join } from 'node:path';

import { maakApi } from './api.js';
import { Mollie, NepMollie } from './mollie.js';
import { opslagIn } from './opslag.js';
import { stuurBestand, TYPES } from './statisch.js';
import { readFile } from 'node:fs/promises';

export async function maakServer({ instellingen, mollie = null, log = console.log }) {
  const opslag = await opslagIn(instellingen.gegevensMap).open();
  const betaaldienst = mollie
    || (instellingen.proef
      ? new NepMollie({ basisUrl: instellingen.basisUrl })
      : new Mollie(instellingen.mollieSleutel));

  const api = maakApi({ opslag, mollie: betaaldienst, instellingen, log });

  const site = join(instellingen.wortel, 'landing');
  const app = join(instellingen.wortel, 'public');

  const server = createServer(async (verzoek, antwoord) => {
    const pad = (verzoek.url || '/').split('?')[0];
    try {
      if (pad.startsWith('/api/')) {
        if (!['GET', 'POST'].includes(verzoek.method)) {
          antwoord.writeHead(405, { allow: 'GET, POST' }).end('Alleen GET en POST');
          return;
        }
        await api(verzoek, antwoord, pad);
        return;
      }

      if (verzoek.method !== 'GET' && verzoek.method !== 'HEAD') {
        antwoord.writeHead(405, { allow: 'GET, HEAD' }).end('Alleen GET');
        return;
      }

      // De app staat op /app/. Alles wat de app opvraagt is relatief, dus
      // hoeft er verder niets aan de app zelf te veranderen.
      if (pad === '/app') {
        antwoord.writeHead(302, { location: '/app/' }).end();
        return;
      }
      if (pad.startsWith('/app/')) {
        const gelukt = await stuurBestand(antwoord, verzoek.method, app, pad.slice('/app'.length),
          { terugval: join(app, 'index.html') });
        if (!gelukt) antwoord.writeHead(404).end('Niet gevonden');
        return;
      }

      const gelukt = await stuurBestand(antwoord, verzoek.method, site, pad);
      if (!gelukt) await stuurNietGevonden(antwoord, verzoek.method, site);
    } catch (fout) {
      log(`fout bij ${verzoek.method} ${pad}: ${fout.stack || fout}`);
      if (!antwoord.headersSent) antwoord.writeHead(fout.status || 500, { 'content-type': 'text/plain' });
      antwoord.end('Er ging iets mis');
    }
  });

  return { server, opslag, mollie: betaaldienst };
}

/** Een nette 404-pagina als die er is, en anders een regel tekst. Met de
 * juiste code erbij: een 200 op een adres dat niet bestaat verpest zowel de
 * zoekmachine als het foutzoeken. */
async function stuurNietGevonden(antwoord, methode, site) {
  try {
    const inhoud = await readFile(join(site, 'niet-gevonden.html'));
    antwoord.writeHead(404, { 'content-type': TYPES['.html'] });
    antwoord.end(methode === 'HEAD' ? undefined : inhoud);
  } catch {
    antwoord.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Niet gevonden');
  }
}
