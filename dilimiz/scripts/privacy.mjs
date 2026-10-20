/**
 * De privacyverklaring als één html-bestand.
 *
 *   npm run privacy -- --mail jouw@adres.nl
 *
 * Beide winkels eisen een privacyverklaring op een openbaar webadres, ook als
 * de app niets verzamelt. Dat is geen website: het is één bestand dat ergens
 * moet staan.
 *
 * Het e-mailadres staat er niet in gebakken en wordt gevraagd, omdat een
 * plaatshouder tussen punthaken anders letterlijk in de verklaring belandt --
 * mét punthaken. Dat is bij de vorige app precies zo misgegaan in een ander
 * formulier.
 *
 * Eén bestand, vier talen onder elkaar: één adres volstaat dan voor alle
 * landen waarin de app verschijnt.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const WORTEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const vlag = (naam) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > -1 ? process.argv[i + 1] : null
}

const mail = vlag('mail')
if (!mail || !/^[^@\s<>]+@[^@\s<>]+\.[a-z]{2,}$/i.test(mail)) {
  console.error([
    'Geef het e-mailadres mee waarop je bereikbaar bent voor privacyvragen:',
    '',
    '    npm run privacy -- --mail jouw@adres.nl',
    '',
    'Beide winkels eisen een contactadres in de verklaring, en het moet een',
    'adres zijn dat je ook werkelijk leest.',
  ].join('\n'))
  process.exit(1)
}

const DATUM = new Date().toISOString().slice(0, 10)

/** Eén taalblok. De inhoud is in alle vier dezelfde; alleen de taal verschilt. */
const blok = (t) => `
<section lang="${t.code}">
  <h2>${t.titel}</h2>
  <p class="datum">${t.bijgewerkt}: ${DATUM}</p>
  <p><strong>${t.kort}</strong></p>
  <h3>${t.kop1}</h3>
  <ul>${t.opslag.map((r) => `<li>${r}</li>`).join('')}</ul>
  <p>${t.lokaal}</p>
  <h3>${t.kop2}</h3>
  <ul>${t.niet.map((r) => `<li>${r}</li>`).join('')}</ul>
  <h3>${t.kop3}</h3>
  <p>${t.microfoon}</p>
  <h3>${t.kop4}</h3>
  <p>${t.rechten}</p>
  <h3>${t.kop5}</h3>
  <p>${t.betalen}</p>
  <h3>${t.kop6}</h3>
  <p>${t.kinderen}</p>
  <h3>${t.kop7}</h3>
  <p>${t.contact} <a href="mailto:${mail}">${mail}</a></p>
</section>`

const TALEN = [
  {
    code: 'de', titel: 'Datenschutzerklärung', bijgewerkt: 'Stand',
    kort: 'Dilimiz sammelt keine personenbezogenen Daten. Es gibt kein Konto, keinen Server, keine Werbung und kein Tracking.',
    kop1: 'Was auf dem Gerät gespeichert wird',
    opslag: [
      'Der Vorname oder Spitzname, den das Kind selbst eingibt — freiwillig, das Feld darf leer bleiben.',
      'Das gewählte Bild (ein Emoji) und die Altersgruppe als Auswahl (4–6, 7–11, 12+). Kein Geburtsdatum.',
      'Der Lernfortschritt: welche Lektionen gemacht wurden und wie fest die Wörter sitzen.',
      'Die Einstellungen: Sprache, Farbe, Ton.',
    ],
    lokaal: 'All das bleibt im Speicher der App auf diesem Gerät. Es wird nicht übertragen, und wir haben keinen Zugriff darauf. Wer die App löscht, löscht damit auch diese Daten.',
    kop2: 'Was nicht passiert',
    niet: [
      'Keine Werbung, in keiner Form.',
      'Kein Tracking und keine Analyse-Software (kein Google Analytics, kein Firebase, kein Facebook-SDK).',
      'Keine Weitergabe an Dritte.',
      'Keine Standortdaten, keine Kontakte, keine Fotos, keine Geräte-Kennung.',
    ],
    kop3: 'Mikrofon',
    microfoon: 'Die Sprechübung läuft vollständig auf dem Gerät. Es wird nichts aufgenommen, nichts gespeichert und nichts verschickt. Die Übung lässt sich in den Einstellungen ausschalten.',
    kop4: 'Einsicht und Löschung',
    rechten: 'Im Elternbereich der App (hinter einer Rechenaufgabe, damit Kinder nicht versehentlich dorthin gelangen) lässt sich alles Gespeicherte wörtlich ansehen, als Datei sichern und vollständig löschen. Weil nichts übertragen wird, ist dafür keine Anfrage an uns nötig.',
    kop5: 'Bezahlen',
    betalen: 'Das Abonnement läuft über Google Play beziehungsweise den App Store. Zahlungsdaten sehen wir nie; sie liegen allein bei Google beziehungsweise Apple. Die Kündigung erfolgt in den Einstellungen des Geräts.',
    kop6: 'Kinder',
    kinderen: 'Diese App richtet sich an Kinder. Deshalb wurde sie so gebaut, dass sie so wenig wie möglich speichert und nichts überträgt. Käufe und Links nach außen liegen hinter einer Elternsperre.',
    kop7: 'Kontakt',
    contact: 'Fragen zum Datenschutz:',
  },
  {
    code: 'nl', titel: 'Privacyverklaring', bijgewerkt: 'Bijgewerkt',
    kort: 'Dilimiz verzamelt geen persoonsgegevens. Er is geen account, geen server, geen advertentie en geen tracking.',
    kop1: 'Wat er op het toestel wordt bewaard',
    opslag: [
      'De voornaam of bijnaam die het kind zelf invult — vrijwillig, het veld mag leeg blijven.',
      'Het gekozen plaatje (een emoji) en de leeftijdsgroep als keuze (4–6, 7–11, 12+). Geen geboortedatum.',
      'De voortgang: welke lessen gedaan zijn en hoe vast de woorden zitten.',
      'De instellingen: taal, kleur, geluid.',
    ],
    lokaal: 'Dat alles blijft in de opslag van de app op dit toestel. Het wordt niet verstuurd en wij kunnen er niet bij. Wie de app verwijdert, wist daarmee ook deze gegevens.',
    kop2: 'Wat er niet gebeurt',
    niet: [
      'Geen advertenties, in geen enkele vorm.',
      'Geen tracking en geen analysesoftware (geen Google Analytics, geen Firebase, geen Facebook-SDK).',
      'Geen doorgifte aan derden.',
      'Geen locatie, geen contacten, geen foto’s, geen toestel-id.',
    ],
    kop3: 'Microfoon',
    microfoon: 'De spreekoefening werkt volledig op het toestel. Er wordt niets opgenomen, niets opgeslagen en niets verstuurd. De oefening is uit te zetten in de instellingen.',
    kop4: 'Inzage en verwijdering',
    rechten: 'In het ouderdeel van de app (achter een rekenvraag, zodat een kind er niet per ongeluk komt) is alles wat bewaard is letterlijk te bekijken, als bestand mee te nemen en volledig te verwijderen. Omdat er niets wordt verstuurd, is daar geen verzoek aan ons voor nodig.',
    kop5: 'Betalen',
    betalen: 'Het abonnement loopt via Google Play of de App Store. Betaalgegevens zien wij nooit; die liggen uitsluitend bij Google of Apple. Opzeggen doe je in de instellingen van het toestel.',
    kop6: 'Kinderen',
    kinderen: 'Deze app is voor kinderen. Daarom is hij zo gebouwd dat hij zo min mogelijk bewaart en niets verstuurt. Aankopen en links naar buiten zitten achter een ouderpoort.',
    kop7: 'Contact',
    contact: 'Vragen over privacy:',
  },
  {
    code: 'en', titel: 'Privacy policy', bijgewerkt: 'Last updated',
    kort: 'Dilimiz collects no personal data. There is no account, no server, no advertising and no tracking.',
    kop1: 'What is stored on the device',
    opslag: [
      'The first name or nickname the child enters — optional, the field may be left empty.',
      'The chosen picture (an emoji) and the age group as a choice (4–6, 7–11, 12+). No date of birth.',
      'Learning progress: which lessons were done and how well the words are known.',
      'Settings: language, colour, sound.',
    ],
    lokaal: 'All of this stays in the app’s storage on this device. It is not transmitted, and we cannot access it. Deleting the app deletes this data with it.',
    kop2: 'What does not happen',
    niet: [
      'No advertising, in any form.',
      'No tracking and no analytics software (no Google Analytics, no Firebase, no Facebook SDK).',
      'No sharing with third parties.',
      'No location, no contacts, no photos, no device identifier.',
    ],
    kop3: 'Microphone',
    microfoon: 'The speaking exercise runs entirely on the device. Nothing is recorded, stored or sent. The exercise can be switched off in settings.',
    kop4: 'Access and deletion',
    rechten: 'In the parents’ section of the app (behind an arithmetic question, so children do not reach it by accident) everything stored can be viewed literally, saved as a file and deleted completely. Because nothing is transmitted, no request to us is needed.',
    kop5: 'Payment',
    betalen: 'The subscription runs through Google Play or the App Store. We never see payment details; they rest solely with Google or Apple. Cancellation is done in the device settings.',
    kop6: 'Children',
    kinderen: 'This app is for children. It was therefore built to store as little as possible and transmit nothing. Purchases and outbound links sit behind a parent gate.',
    kop7: 'Contact',
    contact: 'Privacy questions:',
  },
  {
    code: 'fr', titel: 'Politique de confidentialité', bijgewerkt: 'Mise à jour',
    kort: 'Dilimiz ne collecte aucune donnée personnelle. Pas de compte, pas de serveur, pas de publicité, pas de pistage.',
    kop1: 'Ce qui est enregistré sur l’appareil',
    opslag: [
      'Le prénom ou le surnom saisi par l’enfant — facultatif, le champ peut rester vide.',
      'L’image choisie (un emoji) et la tranche d’âge (4–6, 7–11, 12+). Aucune date de naissance.',
      'La progression : les leçons faites et la solidité des mots appris.',
      'Les réglages : langue, couleur, son.',
    ],
    lokaal: 'Tout cela reste dans la mémoire de l’application sur cet appareil. Rien n’est transmis et nous n’y avons pas accès. Supprimer l’application supprime ces données.',
    kop2: 'Ce qui n’a pas lieu',
    niet: [
      'Aucune publicité, sous aucune forme.',
      'Aucun pistage ni logiciel d’analyse (ni Google Analytics, ni Firebase, ni SDK Facebook).',
      'Aucune transmission à des tiers.',
      'Aucune localisation, aucun contact, aucune photo, aucun identifiant d’appareil.',
    ],
    kop3: 'Microphone',
    microfoon: 'L’exercice à voix haute fonctionne entièrement sur l’appareil. Rien n’est enregistré, conservé ni envoyé. L’exercice peut être désactivé dans les réglages.',
    kop4: 'Consultation et suppression',
    rechten: 'Dans l’espace parents de l’application (derrière un calcul, afin qu’un enfant n’y accède pas par hasard), tout ce qui est enregistré peut être consulté littéralement, sauvegardé en fichier et entièrement supprimé. Comme rien n’est transmis, aucune demande ne nous est nécessaire.',
    kop5: 'Paiement',
    betalen: 'L’abonnement passe par Google Play ou l’App Store. Nous ne voyons jamais les données de paiement ; elles restent chez Google ou Apple. La résiliation se fait dans les réglages de l’appareil.',
    kop6: 'Enfants',
    kinderen: 'Cette application s’adresse à des enfants. Elle a donc été conçue pour enregistrer le moins possible et ne rien transmettre. Les achats et les liens externes sont protégés par un contrôle parental.',
    kop7: 'Contact',
    contact: 'Questions sur la confidentialité :',
  },
]

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dilimiz — Datenschutz / Privacy</title>
<meta name="robots" content="index, follow">
<style>
  :root { color-scheme: light dark; }
  body { margin: 0 auto; max-width: 42rem; padding: 2rem 1.25rem 4rem;
         font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
         background: #f6f8fd; color: #16213e; }
  @media (prefers-color-scheme: dark) { body { background: #1d1b3a; color: #eef1f8; } }
  h1 { font-size: 1.6rem; }
  h2 { margin-top: 3rem; font-size: 1.25rem; }
  h3 { margin-top: 1.75rem; font-size: 1rem; }
  section + section { border-top: 1px solid rgba(127,127,127,.3); }
  .datum { opacity: .7; font-size: .85rem; }
  nav a { margin-right: 1rem; }
  a { color: #2f4fa8; }
  @media (prefers-color-scheme: dark) { a { color: #8da4e0; } }
</style>
</head>
<body>
<h1>Dilimiz</h1>
<nav>${TALEN.map((t) => `<a href="#${t.code}">${t.titel}</a>`).join('')}</nav>
${TALEN.map((t) => blok(t).replace('<section ', `<section id="${t.code}" `)).join('\n')}
</body>
</html>
`

const map = path.join(WORTEL, 'winkel', 'privacy')
mkdirSync(map, { recursive: true })
writeFileSync(path.join(map, 'index.html'), html, 'utf8')

console.log('Privacyverklaring geschreven:')
console.log(`  ${path.relative(WORTEL, path.join(map, 'index.html'))}`)
console.log('')
console.log('Zet dit bestand online. De snelste gratis manier, zonder website:')
console.log('')
console.log('  1. Ga naar https://app.netlify.com/drop')
console.log(`  2. Sleep de map winkel/privacy erin`)
console.log('  3. Je krijgt meteen een adres. Dat adres vul je in bij')
console.log('     Play Console → App-inhoud → Privacybeleid.')
console.log('')
console.log('Werkt ook: een openbare GitHub-repository met Pages aan.')
