import type { Lang } from './languages'

/**
 * The privacy statement, in the four interface languages.
 *
 * It is short because there is little to say: nothing leaves the device. The
 * two things that could — the browser's speech recognition and the store's own
 * crash reporting — are named explicitly rather than glossed over.
 */
export interface PrivacyText {
  title: string
  updated: string
  intro: string
  missing: string
  sections: { title: string; body: string[] }[]
  contact: string
}

/** A section as it is written below: a heading and its paragraphs. */
type Section = [title: string, body: string[]]

const SECTIONS_NL: Section[] = [
  ['Wat we verzamelen', [
    'Niets. Gedmma heeft geen account, vraagt geen e-mailadres en stuurt geen gegevens naar een server.',
    'Je voortgang — geleerde woorden, reeks, beloningen en instellingen — staat in de opslag van je eigen browser of app, op je eigen apparaat. Wij kunnen er niet bij.',
  ]],
  ['Advertenties en meten', [
    'Er zijn geen advertenties, geen trackers, geen analytics en geen cookies van derden. We tellen niet hoeveel mensen de app gebruiken.',
  ]],
  ['Geluid', [
    'De uitspraak komt van de stem die al op je apparaat staat. Er wordt daarvoor niets opgenomen en niets verstuurd.',
    'De spreekoefeningen zijn de enige uitzondering: die gebruiken de spraakherkenning van je browser. In Chrome en in sommige andere browsers betekent dat dat de opname naar de maker van die browser gaat (bij Chrome: Google) om te worden omgezet in tekst. Gedmma krijgt alleen de tekst te zien en bewaart die niet. Wil je dat niet, zet spreekoefeningen dan uit bij Instellingen; de rest van de app werkt gewoon door.',
  ]],
  ['Kinderen', [
    'Deze app is gemaakt voor kinderen. Daarom is er bewust geen account, geen chat, geen mogelijkheid om iets te delen of te uploaden, geen aankoop en geen advertentie. Er is niets dat een kind kan invullen dat bij ons terechtkomt.',
  ]],
  ['De app-winkels', [
    'Download je de app uit de App Store of Google Play, dan weten Apple of Google dát je hem hebt gedownload, en kunnen zij technische crashgegevens verzamelen volgens hun eigen voorwaarden. Dat staat los van ons: wij krijgen daar geen persoonsgegevens uit.',
  ]],
  ['Betalen', [
    'De eerste units zijn gratis. Koop je de volledige cursus, dan gaat die betaling helemaal via de App Store of Google Play: zij innen het bedrag, zij rekenen de btw af en zij weten wie je bent. Gedmma krijgt van hen alleen te horen dát er betaald is — geen kaartgegevens, geen adres, geen naam.',
    'De aankoop is eenmalig; er is geen abonnement dat doorloopt. Voordat er iets gekocht kan worden, staat er een rekensom die een volwassene moet beantwoorden.',
  ]],
  ['Je gegevens weghalen', [
    'Bij Instellingen kun je je voortgang als bestand opslaan, terugzetten op een ander apparaat, of alles in één keer wissen. Wissen is definitief: er staat geen kopie ergens anders.',
    'De app van je apparaat verwijderen wist alles wat de app bewaarde.',
  ]],
]

const SECTIONS_FR: Section[] = [
  ['Ce que nous collectons', [
    'Rien. Gedmma n’a pas de compte, ne demande pas d’adresse e-mail et n’envoie aucune donnée à un serveur.',
    'Ta progression — mots appris, série, récompenses et réglages — reste dans le stockage de ton navigateur ou de ton application, sur ton appareil. Nous n’y avons pas accès.',
  ]],
  ['Publicité et mesure', [
    'Pas de publicité, pas de traceurs, pas d’analytics, pas de cookies tiers. Nous ne comptons même pas le nombre d’utilisateurs.',
  ]],
  ['Le son', [
    'La prononciation vient de la voix déjà installée sur ton appareil. Rien n’est enregistré ni envoyé pour cela.',
    'Les exercices de prononciation sont la seule exception : ils utilisent la reconnaissance vocale de ton navigateur. Dans Chrome et quelques autres, cela signifie que l’enregistrement part chez l’éditeur du navigateur (pour Chrome : Google) pour être transformé en texte. Gedmma ne voit que le texte et ne le conserve pas. Si tu préfères l’éviter, désactive les exercices de prononciation dans les réglages ; le reste de l’application continue de fonctionner.',
  ]],
  ['Les enfants', [
    'Cette application est faite pour des enfants. C’est pourquoi il n’y a volontairement ni compte, ni chat, ni partage, ni envoi de fichiers, ni achat, ni publicité. Il n’y a rien qu’un enfant puisse remplir qui nous parvienne.',
  ]],
  ['Les magasins d’applications', [
    'Si tu télécharges l’application sur l’App Store ou Google Play, Apple ou Google savent que tu l’as téléchargée et peuvent collecter des données techniques de plantage selon leurs propres conditions. Cela ne dépend pas de nous et ne nous transmet aucune donnée personnelle.',
  ]],
  ['Le paiement', [
    'Les premières unités sont gratuites. Si tu achètes le cours complet, ce paiement passe entièrement par l’App Store ou Google Play : ce sont eux qui encaissent, qui reversent la TVA et qui savent qui tu es. Gedmma apprend seulement qu’un paiement a eu lieu — aucune donnée de carte, aucune adresse, aucun nom.',
    'L’achat est unique ; il n’y a pas d’abonnement qui court. Avant tout achat, une petite opération doit être résolue par un adulte.',
  ]],
  ['Supprimer tes données', [
    'Dans les réglages, tu peux enregistrer ta progression dans un fichier, la restaurer sur un autre appareil, ou tout effacer d’un coup. L’effacement est définitif : il n’existe aucune copie ailleurs.',
    'Désinstaller l’application efface tout ce qu’elle avait conservé.',
  ]],
]

const SECTIONS_DE: Section[] = [
  ['Was wir erheben', [
    'Nichts. Gedmma hat kein Konto, fragt keine E-Mail-Adresse ab und schickt keine Daten an einen Server.',
    'Dein Fortschritt — gelernte Wörter, Serie, Belohnungen und Einstellungen — bleibt im Speicher deines Browsers oder deiner App, auf deinem Gerät. Wir kommen nicht daran.',
  ]],
  ['Werbung und Messung', [
    'Keine Werbung, keine Tracker, keine Analytics, keine Cookies von Dritten. Wir zählen nicht einmal, wie viele Menschen die App benutzen.',
  ]],
  ['Ton', [
    'Die Aussprache kommt von der Stimme, die bereits auf deinem Gerät installiert ist. Dafür wird nichts aufgenommen und nichts verschickt.',
    'Die Sprechübungen sind die einzige Ausnahme: sie nutzen die Spracherkennung deines Browsers. Bei Chrome und einigen anderen heißt das, dass die Aufnahme zum Hersteller des Browsers geht (bei Chrome: Google), um in Text umgewandelt zu werden. Gedmma sieht nur den Text und speichert ihn nicht. Wenn dir das nicht recht ist, schalte die Sprechübungen in den Einstellungen aus; der Rest der App funktioniert weiter.',
  ]],
  ['Kinder', [
    'Diese App ist für Kinder gemacht. Deshalb gibt es bewusst kein Konto, keinen Chat, kein Teilen, kein Hochladen, keine Käufe und keine Werbung. Es gibt nichts, was ein Kind eingeben könnte und das bei uns ankäme.',
  ]],
  ['Die App-Stores', [
    'Lädst du die App im App Store oder bei Google Play, wissen Apple oder Google, dass du sie geladen hast, und können nach ihren eigenen Bedingungen technische Absturzdaten erheben. Das liegt außerhalb unseres Einflusses; personenbezogene Daten erhalten wir daraus nicht.',
  ]],
  ['Bezahlen', [
    'Die ersten Einheiten sind kostenlos. Kaufst du den kompletten Kurs, läuft diese Zahlung vollständig über den App Store oder Google Play: sie ziehen den Betrag ein, sie führen die Mehrwertsteuer ab und sie wissen, wer du bist. Gedmma erfährt nur, dass bezahlt wurde — keine Kartendaten, keine Adresse, kein Name.',
    'Der Kauf ist einmalig; es läuft kein Abo weiter. Vor jedem Kauf steht eine kleine Rechenaufgabe, die ein Erwachsener lösen muss.',
  ]],
  ['Deine Daten löschen', [
    'In den Einstellungen kannst du deinen Fortschritt als Datei sichern, auf einem anderen Gerät zurückholen oder alles auf einmal löschen. Löschen ist endgültig: es gibt keine Kopie woanders.',
    'Die App vom Gerät zu entfernen löscht alles, was sie gespeichert hatte.',
  ]],
]

const SECTIONS_EN: Section[] = [
  ['What we collect', [
    'Nothing. Gedmma has no account, asks for no email address and sends no data to a server.',
    'Your progress — words learned, streak, rewards and settings — stays in your own browser or app storage, on your own device. We cannot reach it.',
  ]],
  ['Advertising and measurement', [
    'No adverts, no trackers, no analytics, no third-party cookies. We do not even count how many people use the app.',
  ]],
  ['Sound', [
    'Pronunciation comes from the voice already installed on your device. Nothing is recorded or sent for it.',
    'The speaking exercises are the one exception: they use your browser’s speech recognition. In Chrome and some others that means the recording goes to the browser’s maker (for Chrome: Google) to be turned into text. Gedmma only sees the text and does not keep it. If you would rather avoid that, switch speaking exercises off in the settings; the rest of the app carries on working.',
  ]],
  ['Children', [
    'This app is made for children. That is why there is deliberately no account, no chat, no sharing, no uploading, no purchases and no advertising. There is nothing a child can fill in that reaches us.',
  ]],
  ['The app stores', [
    'If you download the app from the App Store or Google Play, Apple or Google know that you downloaded it and may collect technical crash data under their own terms. That is outside our control and gives us no personal data.',
  ]],
  ['Paying', [
    'The first units are free. If you buy the full course, that payment runs entirely through the App Store or Google Play: they take the money, they account for the VAT and they know who you are. Gedmma is only told that a payment happened — no card details, no address, no name.',
    'The purchase is one-off; there is no subscription running on. Before anything can be bought, a small sum has to be answered by an adult.',
  ]],
  ['Removing your data', [
    'In the settings you can save your progress as a file, restore it on another device, or erase everything at once. Erasing is final: there is no copy anywhere else.',
    'Deleting the app from your device erases everything it had stored.',
  ]],
]

const build = (
  title: string, updated: string, intro: string, missing: string, contact: string,
  sections: Section[],
): PrivacyText => ({
  title,
  updated,
  intro,
  missing,
  contact,
  sections: sections.map(([heading, body]) => ({ title: heading, body })),
})

export const PRIVACY: Record<Lang, PrivacyText> = {
  nl: build(
    'Privacy',
    'Laatst bijgewerkt: september 2026',
    'Gedmma is gemaakt om aan een kind te kunnen geven. Dit is in het kort wat dat betekent.',
    'Voor publicatie in een appwinkel moeten hier nog de naam en het e-mailadres van de uitgever staan. Die staan nog niet ingevuld in src/content/operator.ts.',
    'Vragen over privacy? Mail',
    SECTIONS_NL,
  ),
  fr: build(
    'Confidentialité',
    'Dernière mise à jour : septembre 2026',
    'Gedmma est faite pour pouvoir être confiée à un enfant. Voici ce que cela veut dire, en bref.',
    'Avant une publication sur un magasin d’applications, le nom et l’adresse e-mail de l’éditeur doivent figurer ici. Ils ne sont pas encore renseignés dans src/content/operator.ts.',
    'Une question sur la vie privée ? Écris à',
    SECTIONS_FR,
  ),
  de: build(
    'Datenschutz',
    'Zuletzt aktualisiert: September 2026',
    'Gedmma ist so gebaut, dass man sie einem Kind in die Hand geben kann. Das heißt kurz gesagt Folgendes.',
    'Vor einer Veröffentlichung in einem App-Store müssen hier Name und E-Mail-Adresse des Herausgebers stehen. Sie sind in src/content/operator.ts noch nicht eingetragen.',
    'Fragen zum Datenschutz? Schreib an',
    SECTIONS_DE,
  ),
  en: build(
    'Privacy',
    'Last updated: September 2026',
    'Gedmma is built to be handed to a child. Here is what that means, briefly.',
    'Before publishing to an app store, the publisher’s name and email address have to appear here. They are not filled in yet in src/content/operator.ts.',
    'Questions about privacy? Email',
    SECTIONS_EN,
  ),
}
