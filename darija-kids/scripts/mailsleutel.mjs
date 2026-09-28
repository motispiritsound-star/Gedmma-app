/**
 * De sleutel van de mailpartner instellen, en meteen nakijken of hij werkt.
 *
 * Zonder deze sleutel valt elke mail om met een 401 — "Key not found" — en
 * verder werkt alles. Een koper betaalt, de bestelling komt keurig binnen, en
 * hij krijgt niets. Dat is precies het soort storing waarbij je aan de
 * verkeerde kant gaat zoeken, en het heeft hier een middag gekost.
 *
 * Daarom kijkt deze opdracht eerst of de sleutel het doet, en daarna of het
 * afzenderadres bij de mailpartner geverifieerd is. Twee vragen die anders
 * pas beantwoord worden door de eerste koper die niets ontvangt.
 *
 * De sleutel komt niet op je scherm. Hij is er één, net als het koopgeheim,
 * en die twee zijn hier al twee keer in een schermafdruk beland.
 *
 *   npm run mailsleutel
 */
import { wrangler } from './lib/wrangler.mjs'

const AFZENDER = 'info@darijaforkids.eu'

if (!process.stdin.isTTY) {
  console.error('\nDeze opdracht vraagt om een sleutel en heeft dus een scherm nodig.\n')
  process.exit(1)
}

console.log(`
De sleutel van de mailpartner
─────────────────────────────

Je vindt hem bij Brevo, onder SMTP & API → API Keys. Maak er een aan als er
nog geen is; hij begint meestal met xkeysib-.

Plak hem hieronder. Hij komt niet in beeld — dat is met opzet.
`)

/**
 * Invoer zonder dat hij op het scherm verschijnt.
 *
 * Readline heeft daar geen knop voor, en `_writeToOutput` — de gebruikelijke
 * omweg — bestaat niet op de belofteversie in Node 22. Dus zetten we voor de
 * duur van de vraag het schrijven naar het scherm stil. Wat je typt komt wel
 * gewoon aan; je ziet het alleen niet, zoals bij een wachtwoord.
 */
const { createInterface } = await import('node:readline/promises')
const lezer = createInterface({ input: process.stdin, output: process.stdout, terminal: true })

process.stdout.write('Sleutel: ')
const echtSchrijven = process.stdout.write.bind(process.stdout)
process.stdout.write = () => true

let sleutel = ''
try {
  sleutel = (await lezer.question('')).trim()
} catch {
  process.stdout.write = echtSchrijven
  lezer.close()
  console.log('\n\nAfgebroken. Er is niets veranderd.\n')
  process.exit(0)
}
process.stdout.write = echtSchrijven
lezer.close()
console.log('\n')

if (!sleutel) {
  console.log('Niets ingevuld, dus niets veranderd.\n')
  process.exit(0)
}

/** Eerst vragen of hij het doet, vóór we hem ergens neerzetten. */
console.log('Nakijken bij de mailpartner …\n')

let account
try {
  account = await fetch('https://api.brevo.com/v3/account', { headers: { 'api-key': sleutel } })
} catch (fout) {
  console.error(`De mailpartner is niet bereikbaar: ${fout.message}\n`)
  process.exit(1)
}

if (account.status === 401) {
  console.error('Die sleutel kent de mailpartner niet.\n')
  console.error('Controleer of je hem helemaal hebt geplakt — ze zijn lang, en een')
  console.error('half geplakte sleutel geeft precies deze melding.\n')
  console.error('Er is niets veranderd.\n')
  process.exit(1)
}

if (!account.ok) {
  console.error(`De mailpartner antwoordde met ${account.status}:\n`)
  console.error(`  ${(await account.text()).slice(0, 200)}\n`)
  process.exit(1)
}

console.log('  de sleutel werkt')

/**
 * En kan hij ook namens ons adres versturen?
 *
 * Een geldige sleutel is niet genoeg: de mailpartner verstuurt alleen vanaf
 * een adres dat je daar hebt geverifieerd. Is dat niet gebeurd, dan valt de
 * mail alsnog om — met een andere melding, een dag later, bij de eerste
 * koper. Dan weet je het liever nu.
 */
try {
  const senders = await fetch('https://api.brevo.com/v3/senders', { headers: { 'api-key': sleutel } })
  if (senders.ok) {
    const lijst = (await senders.json()).senders ?? []
    const die = lijst.find((s) => String(s.email).toLowerCase() === AFZENDER)
    if (!die) {
      console.log(`  LET OP: ${AFZENDER} staat niet bij de afzenders`)
      console.log('\n  Zet hem erbij onder Senders, Domains & Dedicated IPs → Senders,')
      console.log('  en bevestig de mail die daarna binnenkomt. Zonder die stap weigert')
      console.log('  de mailpartner elke mail namens dat adres.\n')
    } else if (die.active === false) {
      console.log(`  LET OP: ${AFZENDER} staat er wel, maar is nog niet bevestigd`)
      console.log('\n  Er is een mail naartoe gestuurd met een bevestigingslink.\n')
    } else {
      console.log(`  ${AFZENDER} mag versturen`)
    }
  }
} catch {
  /* Niet kunnen kijken is geen reden om te stoppen. */
}

console.log('\nOpslaan bij Cloudflare …\n')

try {
  wrangler(['secret', 'put', 'MAIL_SLEUTEL'], { input: sleutel })
} catch (fout) {
  const tekst = String(fout.message || fout).replace(/\u001b\[[0-9;]*m/g, '')
  console.error('Dat is niet gelukt.\n')
  if (/CLOUDFLARE_API_TOKEN|not logged in|authenticat/i.test(tekst)) {
    console.error('Wrangler weet niet wie je bent:  npm run inloggen\n')
  } else {
    console.error(`${tekst.split('\n').filter(Boolean).slice(-3).map((r) => `  ${r}`).join('\n')}\n`)
  }
  process.exit(1)
}

console.log(`
Klaar. Een geheim werkt meteen — je hoeft niet opnieuw uit te rollen.

Probeer het:

  npm run proefkoop
`)
