/**
 * Het geheim dat Gumroad meestuurt bij een verkoop, in één opdracht.
 *
 * Zonder dit geheim kan iedereen die het adres kent zichzelf een boek
 * toesturen. Mét dit geheim kan alleen Gumroad melden dat er verkocht is.
 *
 * Het stond in de handleiding als drie regels PowerShell plus een adres met
 * `<de waarde van KOOP_GEHEIM>` erin, en dat adres is letterlijk zo in het
 * veld bij Gumroad geplakt — inclusief de punthaken. Gumroad zei "That URL
 * seems to be invalid", en terecht: punthaken mogen niet in een adres. Dat is
 * geen vergissing van wie het plakte maar van wie het opschreef.
 *
 * Dus doet deze opdracht alle drie de dingen: een geheim verzinnen, het naar
 * Cloudflare sturen, en het hele adres afdrukken zoals het in het veld hoort.
 * Kopiëren en plakken, niets invullen.
 *
 *   npm run koopgeheim
 *
 * Draai je hem nog een keer, dan komt er een nieuw geheim en werkt het oude
 * adres niet meer. Dat is precies wat je wilt als het ergens rondslingert.
 */
import { randomBytes } from 'node:crypto'
import { wrangler } from './lib/wrangler.mjs'

/**
 * Achtenveertig tekens uit de willekeurigheidsbron van het besturingssysteem.
 *
 * Niet `Math.random()` en niet zelf typen. Wat je zelf typt lijkt op iets, en
 * dit is het enige dat tussen een vreemde en een gratis boek staat.
 */
const geheim = randomBytes(24).toString('hex')

try {
  wrangler(['secret', 'put', 'KOOP_GEHEIM'], { input: geheim })
} catch (fout) {
  const tekst = String(fout.message || fout).replace(/\u001b\[[0-9;]*m/g, '')
  console.error('\nHet geheim is niet aangekomen bij Cloudflare.\n')
  if (/CLOUDFLARE_API_TOKEN|not logged in|authenticat/i.test(tekst)) {
    console.error('Wrangler weet niet wie je bent. Log één keer in:\n')
    console.error('  npm run inloggen\n')
  } else {
    console.error(`${tekst.split('\n').filter(Boolean).slice(-3).map((r) => `  ${r}`).join('\n')}\n`)
  }
  process.exit(1)
}

/**
 * De proefmelding staat er meteen bij, compleet.
 *
 * Anders staat die in de handleiding met `<geheim>` erin, en dan is hij net zo
 * onbruikbaar als het adres hierboven was. `curl.exe` en niet `curl`: op
 * Windows is dat laatste een alias voor Invoke-WebRequest, die `-X` en `-d`
 * niet kent.
 */
console.log(`
Klaar. Plak dit hele adres bij Gumroad, onder Settings → Advanced → Ping:

  https://post.darijaforkids.eu/koop?s=${geheim}

Druk daarna op "Send test ping to URL". Er hoort {"goed":true} terug te komen.

Wil je het zelf sturen in plaats van met die knop, dan is dit de hele regel:

  curl.exe -sS -X POST "https://post.darijaforkids.eu/koop?s=${geheim}" -d "email=jij@example.com&permalink=sleutels&ip_country=Netherlands&test=true"

Dit adres is een sleutel. Zet hem niet in een chat, niet in de repo en niet in
een mail aan jezelf — hij staat hier, en bij Gumroad, en verder nergens.
`)
