// Eén hash over alle Arabische Koran-tekst in de app, in vaste volgorde.
//
// Staat apart zodat zowel het bronscript als de tests hem kunnen gebruiken
// zonder elkaars werk uit te voeren.

import { createHash } from 'node:crypto';

export function vingerafdrukVan(soeras) {
  const hash = createHash('sha256');
  for (const s of [...soeras].sort((a, b) => a.nr - b.nr)) {
    for (const a of [...s.ayaat].sort((x, y) => x.n - y.n)) hash.update(`${s.nr}:${a.n}:${a.ar}\n`);
  }
  return `sha256:${hash.digest('hex')}`;
}
