/**
 * Maakt de boekenbak, zet de binding aan en rolt uit.
 *
 * Drie stappen die bij elkaar horen: zonder bak valt de uitrol om, zonder
 * binding kan de worker er niet bij, en zonder uitrol weet Cloudflare van
 * geen van beide. Vandaar één opdracht.
 *
 * Het stond eerst als een rij commando's met `&&` ertussen in package.json.
 * Dat werkt, maar als de eerste stap afketst krijg je de foutmelding van
 * wrangler en verder niets — en die zegt niet wat je nu moet doen.
 *
 * Draaien met:
 *   cd server
 *   npm run maak-bak
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { wrangler } from './lib/wrangler.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BAK = 'darijaforkids-boeken'

/* ------------------------------------------------------------------ de bak */

console.log(`\nDe bak ${BAK} aanmaken…\n`)
try {
  console.log(wrangler(['r2', 'bucket', 'create', BAK]))
} catch (fout) {
  const melding = `${fout.stdout ?? ''}${fout.stderr ?? ''}`

  /**
   * R2 staat niet aan op het account.
   *
   * Dit is de enige stap in dit hele project die echt met de muis moet: het
   * aanzetten van R2 vraagt om akkoord op de voorwaarden, en dat kan geen
   * opdracht namens jou doen.
   */
  if (melding.includes('10042') || /enable R2/i.test(melding)) {
    console.error('R2 staat nog uit op je Cloudflare-account.\n')
    console.error('Dat is het enige in dit project dat echt met de muis moet: je moet')
    console.error('akkoord geven op de voorwaarden, en dat kan een opdracht niet namens jou.\n')
    console.error('  dash.cloudflare.com → Storage & databases → R2 Object Storage\n')
    console.error('Op dat scherm staan de grenzen van wat gratis is: tien gigabyte opslag,')
    console.error('een miljoen schrijfacties en tien miljoen leesacties per maand. Alle')
    console.error('boeken bij elkaar zijn een kwart gigabyte, dus dat haal je niet.\n')
    console.error('Maak daar zelf geen bak aan — dat doet deze opdracht, en die zet ook')
    console.error('de binding aan en rolt uit.\n')
    console.error('Daarna deze opdracht opnieuw.\n')
    process.exit(1)
  }

  // Bestaat hij al? Dan is er niets aan de hand en gaan we door.
  if (/already exists|10004/i.test(melding)) {
    console.log(`De bak ${BAK} bestond al.\n`)
  } else {
    console.error(melding || String(fout))
    process.exit(1)
  }
}

/* -------------------------------------------------------------- de binding */

console.log(execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'r2-aan.mjs')],
  { cwd: ROOT, encoding: 'utf8' }))

/* ---------------------------------------------------------------- uitrollen */

console.log('Uitrollen…\n')
try {
  wrangler(['deploy'], { stdio: 'inherit' })
} catch {
  console.error('\nDe uitrol ging mis. De bak en de binding staan er wel; draai `npm run deploy`.\n')
  process.exit(1)
}

console.log('\nKlaar. Nu de boeken erin. Eén opdracht, vanuit darija-kids:\n')
console.log('  cd ..')
console.log('  npm run boeken\n')
console.log('Die zet eerst de leesboeken erin — een halve minuut — en daarna de')
console.log('prentenboeken, en dat duurt een half uur. Ontbreekt de browser waarmee')
console.log('die bladzijden geschoten worden, dan haalt hij die er zelf bij.\n')
