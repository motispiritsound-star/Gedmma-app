#!/usr/bin/env node
// Kleine statische server voor Noer. Geen afhankelijkheden: node server.js
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const wortel = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const poort = Number(process.env.PORT || 5173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

/** Zet een URL-pad om in een pad binnen public/, of null als het eruit wijst. */
export function veiligPad(urlPad) {
  let pad;
  try {
    pad = decodeURIComponent(urlPad.split('?')[0].split('#')[0]);
  } catch {
    return null;
  }
  if (pad.includes('\0')) return null;
  if (pad.endsWith('/')) pad += 'index.html';
  const doel = normalize(join(wortel, pad));
  if (doel !== wortel && !doel.startsWith(wortel + sep)) return null;
  return doel;
}

const server = createServer(async (verzoek, antwoord) => {
  if (verzoek.method !== 'GET' && verzoek.method !== 'HEAD') {
    antwoord.writeHead(405, { allow: 'GET, HEAD' }).end('Alleen GET');
    return;
  }
  const doel = veiligPad(verzoek.url || '/');
  if (!doel) {
    antwoord.writeHead(400).end('Ongeldig pad');
    return;
  }
  try {
    const info = await stat(doel);
    const bestand = info.isDirectory() ? join(doel, 'index.html') : doel;
    const inhoud = await readFile(bestand);
    antwoord.writeHead(200, {
      'content-type': types[extname(bestand)] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    antwoord.end(verzoek.method === 'HEAD' ? undefined : inhoud);
  } catch {
    // Alles wat geen bestand is, valt terug op de app zelf (client-side routes).
    try {
      const inhoud = await readFile(join(wortel, 'index.html'));
      antwoord.writeHead(200, { 'content-type': types['.html'] }).end(inhoud);
    } catch {
      antwoord.writeHead(404).end('Niet gevonden');
    }
  }
});

// Alleen starten als dit bestand zelf wordt uitgevoerd, niet bij importeren
// vanuit de tests.
const zelfGestart = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (zelfGestart) {
  server.listen(poort, () => {
    console.log(`\n  Noer draait op http://localhost:${poort}\n`);
  });
}

export default server;
