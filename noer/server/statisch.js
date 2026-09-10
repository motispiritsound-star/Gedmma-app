// Bestanden uitserveren. Twee mappen: de site op /, de app op /app/.

import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

export const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  // De studio exporteert in het formaat van de browser: webm (Chrome, Firefox),
  // m4a (Safari). Zonder deze regels komen die binnen als octet-stream.
  '.webm': 'audio/webm',
  '.m4a': 'audio/mp4',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

/** Zet een URL-pad om in een pad binnen `wortel`, of null als het eruit wijst. */
export function veiligPad(wortel, urlPad) {
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

/**
 * Stuurt het bestand, of geeft false als het er niet is.
 *
 * `terugval` is het bestand voor adressen zonder extensie: die horen bij de
 * app zelf (routes achter de #, of een pad dat de browser onthouden heeft).
 * Een pad mét extensie krijgt gewoon 404 — anders komt er index.html terug op
 * de plek van een ontbrekende mp3, en denkt de app dat er geluid is.
 */
export async function stuurBestand(antwoord, methode, wortel, urlPad, { terugval = null, cache = 'no-cache' } = {}) {
  const doel = veiligPad(wortel, urlPad);
  if (!doel) {
    antwoord.writeHead(400).end('Ongeldig pad');
    return true;
  }
  try {
    const info = await stat(doel);
    const bestand = info.isDirectory() ? join(doel, 'index.html') : doel;
    const inhoud = await readFile(bestand);
    antwoord.writeHead(200, {
      'content-type': TYPES[extname(bestand)] || 'application/octet-stream',
      'cache-control': cache,
    });
    antwoord.end(methode === 'HEAD' ? undefined : inhoud);
    return true;
  } catch {
    if (extname(doel) || !terugval) return false;
    try {
      const inhoud = await readFile(terugval);
      antwoord.writeHead(200, { 'content-type': TYPES['.html'], 'cache-control': 'no-cache' });
      antwoord.end(methode === 'HEAD' ? undefined : inhoud);
      return true;
    } catch {
      return false;
    }
  }
}
