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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SERVER = path.join(ROOT, 'server')
const BAK = 'darijaforkids-boeken'

const draai = (opdracht, argumenten, opties = {}) =>
  execFileSync(opdracht, argumenten, { cwd: SERVER, stdio: 'pipe', encoding: 'utf8', ...opties })

/* ------------------------------------------------------------------ de bak */

console.log(`\nDe bak ${BAK} aanmaken…\n`)
try {
  console.log(draai('npx', ['wrangler', 'r2', 'bucket', 'create', BAK]))
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
    console.error('  dash.cloudflare.com → R2 → aanzetten\n')
    console.error('Cloudflare vraagt daar om een betaalmethode. Dat hoort erbij en kost')
    console.error('niets: onder de tien gigabyte opslag is R2 gratis, en alle boeken bij')
    console.error('elkaar zijn een kwart gigabyte. Kijk wel even op dat scherm zelf wat')
    console.error('de grenzen vandaag zijn — die staan er, en ze veranderen soms.\n')
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

console.log(draai(process.execPath, [path.join(ROOT, 'scripts', 'r2-aan.mjs')], { cwd: ROOT }))

/* ---------------------------------------------------------------- uitrollen */

console.log('Uitrollen…\n')
try {
  draai('npx', ['wrangler', 'deploy'], { stdio: 'inherit' })
} catch {
  console.error('\nDe uitrol ging mis. De bak en de binding staan er wel; draai `npm run deploy`.\n')
  process.exit(1)
}

console.log('\nKlaar. Nu de boeken erin, vanuit darija-kids:\n')
console.log('  npm run lezen -- --r2                      (de 90 leesboeken)')
console.log('  npm run bladen -- --taal alles --uploaden  (de prentenboeken)\n')
