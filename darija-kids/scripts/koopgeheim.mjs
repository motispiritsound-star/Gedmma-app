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
 * Dus doet deze opdracht alles: een geheim verzinnen, het naar Cloudflare
 * sturen, het op deze computer bewaren zodat `npm run proefkoop` het vindt,
 * en het hele adres op je klembord zetten. Plakken, niets invullen — en het
 * komt niet op je scherm, dus er kan ook geen schermafdruk van rondgaan.
 *
 *   npm run koopgeheim
 *
 * Draai je hem nog een keer, dan komt er een nieuw geheim en werkt het oude
 * adres niet meer. Dat is precies wat je wilt als het ergens rondslingert.
 */
import { randomBytes } from 'node:crypto'
import { schrijfGeheim } from './lib/geheim.mjs'
import { naarKlembord } from './lib/klembord.mjs'
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
 * En hier blijft hij ook staan, zodat je hem niet elke keer hoeft op te zoeken.
 *
 * `server/.dev.vars` is de plek waar dit project zijn lokale geheimen al
 * bewaarde en staat in `.gitignore`. Zonder dit moet je hem voor elke proef
 * uit Gumroad halen, en een opdracht die dat vraagt wordt niet gedraaid —
 * dan gaat hij ergens staan waar hij makkelijker terug te vinden is.
 */
const bewaard = schrijfGeheim(geheim)

const adres = `https://post.darijaforkids.eu/koop?s=${geheim}`

/**
 * Het adres gaat naar het klembord en niet naar het scherm.
 *
 * Het stond hier eerst gewoon afgedrukt, met "zet hem niet in een chat"
 * eronder. Daarna belandde hij twee keer in een chat, allebei de keren via
 * een schermafdruk van dit scherm. Dat is niet de schuld van wie hem stuurt
 * maar van wie hem afdrukt: als de enige manier om een waarde over te nemen
 * is hem te lezen, dan wordt hij gelezen — en wat gelezen kan worden, kan
 * gefotografeerd worden.
 *
 * Lukt het klembord niet, dan komt hij alsnog op het scherm. Zichtbaar is
 * vervelend; onbruikbaar is erger.
 */
const opKlembord = naarKlembord(adres)

console.log(`
Klaar. Er is een nieuw geheim, en het oude werkt niet meer.
`)

if (opKlembord) {
  console.log(`Het hele adres staat op je klembord. Plak het bij Gumroad, onder
Settings → Advanced → Ping, en druk rechtsboven op "Update settings".

Het staat met opzet niet op dit scherm: dan kan er ook geen schermafdruk van
gemaakt worden. Wil je het toch zien, dan staat het in:

  ${bewaard}
`)
} else {
  console.log(`Het klembord deed het niet, dus hier is het adres. Plak het bij Gumroad,
onder Settings → Advanced → Ping, en druk rechtsboven op "Update settings":

  ${adres}

Maak hier geen schermafdruk van — dit is de sleutel van je winkel.
`)
}

console.log(`Druk daarna op "Send test ping to URL". Er hoort {"goed":true} terug te komen.

Het geheim staat ook in ${bewaard}, zodat npm run proefkoop het zelf vindt.
Dat bestand staat in .gitignore en gaat dus niet mee in git.

Wil je een proefkoop doen, dan hoef je niets over te typen:

  npm run proefkoop
`)
