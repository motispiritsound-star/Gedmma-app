#!/usr/bin/env node
/** `npm run -w @gedmma/api migrate` — voert openstaande migraties uit. */
import { migreer } from './migreer.ts';

const gedraaid = await migreer();
if (gedraaid.length === 0) {
  console.log('De database is al bij: er stond niets open.');
} else {
  console.log(`${gedraaid.length} migratie(s) uitgevoerd:`);
  for (const naam of gedraaid) console.log(`  - ${naam}`);
}
