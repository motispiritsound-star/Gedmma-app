#!/usr/bin/env node
/** `npm run -w @gedmma/api seed` — zet rechten, rollen en valuta klaar. */
import { seedBasisgegevens } from './seed.ts';

await seedBasisgegevens();
console.log('Basisgegevens (rechten, rollen, valuta) staan klaar.');
