import type { Lang } from './languages'
import { winkelnamen, type Winkelnamen } from './winkels'

/**
 * The privacy statement, in every interface language.
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

const SECTIONS_NL = (n: Winkelnamen): Section[] => [
  ['Wat we verzamelen', [
    'Van het kind: niets. Darijaforkids heeft geen account, vraagt een kind nooit om een e-mailadres en stuurt niets van het oefenen naar een server.',
    'Er is één uitzondering, en die is van de ouder: laat een ouder op het ouderscherm zelf een e-mailadres achter, dan bewaren wij dat adres. Zie “Mail aan ouders” hieronder.',
    'Je voortgang — geleerde woorden, reeks, beloningen en instellingen — staat in de opslag van je eigen browser of app, op je eigen apparaat. Wij kunnen er niet bij.',
  ]],
  ['Advertenties en meten', [
    'Er zijn geen advertenties, geen trackers, geen analytics en geen cookies van derden. We tellen niet hoeveel mensen de app gebruiken.',
  ]],
  ['Geluid', [
    'De uitspraak komt uit opnames die in de app zelf zitten: een Marokkaanse stem die alles heeft ingesproken. Ze worden op je eigen apparaat afgespeeld. Is er voor iets geen opname, dan valt de app terug op de stem die al op je apparaat staat. In beide gevallen wordt er niets opgenomen en niets verstuurd.',
    'Bij de spreekoefeningen neem je jezelf op en hoor je je eigen stem meteen terug, vlak na de stem die het goed zegt. Die opname blijft op je eigen apparaat: ze wordt nergens naartoe gestuurd, ook niet naar ons, en na de oefening wordt ze weggegooid. Er komt geen spraakherkenning aan te pas — die zat er eerder in en is eruit gehaald, omdat geen enkele herkenner Darija kent. Wil je de microfoon helemaal niet gebruiken, zet spreekoefeningen dan uit bij Instellingen; de rest van de app werkt gewoon door.',
  ]],
  ['Kinderen', [
    'Deze app is gemaakt voor kinderen. Daarom is er bewust geen account, geen chat, geen mogelijkheid om iets te delen of te uploaden, en geen advertentie. Er is niets dat een kind kan invullen dat bij ons terechtkomt.',
    `Er is één aankoop: het abonnement voor de volledige cursus. Die zit achter een rekensom die een kind niet zomaar oplost, en de betaling loopt volledig via ${n.via} — wij zien geen kaartgegevens en geen naam.`,
  ]],
  [n.kop, [
    `Download je de app uit ${n.download}, dan weet ${n.bedrijfOf} dát je hem hebt gedownload, en kunnen zij technische crashgegevens verzamelen volgens hun eigen voorwaarden. Dat staat los van ons: wij krijgen daar geen persoonsgegevens uit.`,
  ]],
  ['Betalen', [
    `De eerste units zijn gratis. Neem je de volledige toegang, dan loopt die betaling helemaal via ${n.via}: zij innen het bedrag, zij rekenen de btw af, zij houden de proefperiode bij en zij weten wie je bent. Darijaforkids krijgt van hen alleen te horen dát het abonnement loopt — geen kaartgegevens, geen adres, geen naam.`,
    'Het is een maandabonnement dat doorloopt tot je opzegt, en opzeggen doe je in je eigen winkelaccount; wij kunnen dat niet voor je doen en zien ook niet wanneer je het doet. Voordat er iets afgesloten kan worden, staat er een rekensom die een volwassene moet beantwoorden.',
  ]],
  ['Mail aan ouders', [
    'Op het ouderscherm kan een ouder een e-mailadres achterlaten, om te horen wanneer er iets nieuws is of om één keer per week te lezen hoe het leren gaat. Dat is het enige dat wij van iemand bewaren, en het gebeurt alleen als iemand het zelf invult.',
    'Er staat een rekensom voor, zodat het een volwassene is die het doet. De twee vinkjes — nieuws en voortgang — staan allebei leeg en zijn twee losse keuzes. En we sturen pas iets nadat je in je mailbox op de bevestigingsknop hebt getikt: zonder die tik blijft het bij die ene mail.',
    'Wat we bewaren: het adres, de taal van de app, wat je hebt aangevinkt, wanneer je dat deed en een versleutelde afkorting van je IP-adres — dat laatste alleen om te kunnen laten zien dat de toestemming echt gegeven is.',
    'Vraag je om de wekelijkse mail, dan stuurt de app daar vijf getallen bij: hoeveel units en lessen af zijn, hoeveel woorden zijn langsgekomen, de langste reeks en het aantal punten. Geen antwoorden, geen namen, geen geboortedatum, niets over wélk kind.',
    'Onderaan elke mail staan twee links: uitschrijven, en je gegevens laten wissen. Uitschrijven zet de mail stop; wissen haalt het adres helemaal weg. Allebei werken ze zonder in te loggen.',
    'De post wordt bezorgd door een mailprovider in de EU, die daarvoor jouw adres te zien krijgt en verder niets. Wij verkopen adressen niet en geven ze aan niemand anders.',
  ]],
  ['Je gegevens weghalen', [
    'Bij Instellingen kun je je voortgang als bestand opslaan, terugzetten op een ander apparaat, of alles in één keer wissen. Wissen is definitief: er staat geen kopie ergens anders.',
    'De app van je apparaat verwijderen wist alles wat de app bewaarde.',
  ]],
]

const SECTIONS_FR = (n: Winkelnamen): Section[] => [
  ['Ce que nous collectons', [
    'De l’enfant : rien. Darijaforkids n’a pas de compte, ne demande jamais son adresse e-mail à un enfant et n’envoie rien de ses exercices à un serveur.',
    'Il y a une exception, et elle vient du parent : si un parent laisse lui-même une adresse sur l’écran des parents, nous conservons cette adresse. Voir « Courrier aux parents » plus bas.',
    'Ta progression — mots appris, série, récompenses et réglages — reste dans le stockage de ton navigateur ou de ton application, sur ton appareil. Nous n’y avons pas accès.',
  ]],
  ['Publicité et mesure', [
    'Pas de publicité, pas de traceurs, pas d’analytics, pas de cookies tiers. Nous ne comptons même pas le nombre d’utilisateurs.',
  ]],
  ['Le son', [
    'La prononciation vient d’enregistrements contenus dans l’application elle-même : une voix marocaine qui a tout dit. Ils sont joués sur ton propre appareil. S’il n’existe pas d’enregistrement pour quelque chose, l’application se rabat sur la voix déjà installée sur ton appareil. Dans les deux cas, rien n’est enregistré ni envoyé.',
    'Dans les exercices de prononciation, tu t’enregistres et tu te réécoutes aussitôt, juste après la voix qui le dit correctement. Cet enregistrement reste sur ton appareil : il n’est envoyé nulle part, pas même chez nous, et il est supprimé après l’exercice. Aucune reconnaissance vocale n’intervient — il y en avait une, elle a été retirée, parce qu’aucun moteur ne connaît le darija. Si tu préfères ne pas utiliser le micro, désactive les exercices de prononciation dans les Réglages ; le reste de l’application continue de fonctionner.',
  ]],
  ['Les enfants', [
    'Cette application est faite pour des enfants. C’est pourquoi il n’y a volontairement ni compte, ni chat, ni partage, ni envoi de fichiers, ni publicité. Il n’y a rien qu’un enfant puisse remplir qui nous parvienne.',
    `Il y a un achat : l’abonnement au cours complet. Il est protégé par un calcul qu’un enfant ne résout pas en passant, et le paiement passe entièrement par ${n.via} — nous ne voyons ni données bancaires ni nom.`,
  ]],
  [n.kop, [
    `Si tu télécharges l’application sur ${n.download}, ${n.bedrijfOf} sait que tu l’as téléchargée et peuvent collecter des données techniques de plantage selon leurs propres conditions. Cela ne dépend pas de nous et ne nous transmet aucune donnée personnelle.`,
  ]],
  ['Le paiement', [
    `Les premières unités sont gratuites. Si tu prends l’accès complet, ce paiement passe entièrement par ${n.via} : ce sont eux qui encaissent, qui reversent la TVA, qui gèrent la période d’essai et qui savent qui tu es. Darijaforkids apprend seulement que l’abonnement est actif — aucune donnée de carte, aucune adresse, aucun nom.`,
    'C’est un abonnement mensuel qui court jusqu’à résiliation, et la résiliation se fait dans ton propre compte du magasin ; nous ne pouvons pas le faire à ta place et nous ne voyons pas non plus quand tu le fais. Avant toute souscription, une petite opération doit être résolue par un adulte.',
  ]],
  ['Courrier aux parents', [
    "Sur l'écran des parents, un parent peut laisser une adresse e-mail, pour savoir quand il y a du nouveau ou pour lire une fois par semaine comment se passe l'apprentissage. C'est la seule chose que nous conservons de quelqu'un, et uniquement si cette personne la saisit elle-même.",
    "Un calcul le précède, pour que ce soit bien un adulte. Les deux cases — nouveautés et progression — sont vides et constituent deux choix distincts. Et nous n'envoyons rien avant que vous ayez touché le bouton de confirmation dans votre boîte : sans ce geste, cela s'arrête à ce seul message.",
    "Ce que nous gardons : l'adresse, la langue de l'app, ce que vous avez coché, quand vous l'avez fait, et une empreinte chiffrée de votre adresse IP — cette dernière seulement pour pouvoir montrer que le consentement a bien été donné.",
    "Si vous demandez le message hebdomadaire, l'app y joint cinq nombres : unités et leçons terminées, mots rencontrés, plus longue série et nombre de points. Pas de réponses, pas de prénoms, pas de date de naissance, rien sur quel enfant.",
    "En bas de chaque message il y a deux liens : se désinscrire, et faire effacer ses données. Se désinscrire arrête le courrier ; effacer supprime l'adresse entièrement. Les deux fonctionnent sans connexion.",
    "Le courrier est acheminé par un prestataire situé dans l'UE, qui voit votre adresse et rien d'autre. Nous ne vendons pas d'adresses et nous n'en donnons à personne.",
  ]],
  ['Supprimer tes données', [
    'Dans les réglages, tu peux enregistrer ta progression dans un fichier, la restaurer sur un autre appareil, ou tout effacer d’un coup. L’effacement est définitif : il n’existe aucune copie ailleurs.',
    'Désinstaller l’application efface tout ce qu’elle avait conservé.',
  ]],
]

const SECTIONS_DE = (n: Winkelnamen): Section[] => [
  ['Was wir erheben', [
    'Vom Kind: nichts. Darijaforkids hat kein Konto, fragt ein Kind nie nach einer E-Mail-Adresse und schickt nichts vom Üben an einen Server.',
    'Eine Ausnahme gibt es, und sie kommt von den Eltern: hinterlässt ein Elternteil auf dem Elternbildschirm selbst eine Adresse, dann bewahren wir diese Adresse auf. Siehe „Post an Eltern“ weiter unten.',
    'Dein Fortschritt — gelernte Wörter, Serie, Belohnungen und Einstellungen — bleibt im Speicher deines Browsers oder deiner App, auf deinem Gerät. Wir kommen nicht daran.',
  ]],
  ['Werbung und Messung', [
    'Keine Werbung, keine Tracker, keine Analytics, keine Cookies von Dritten. Wir zählen nicht einmal, wie viele Menschen die App benutzen.',
  ]],
  ['Ton', [
    'Die Aussprache kommt aus Aufnahmen, die in der App selbst stecken: eine marokkanische Stimme, die alles eingesprochen hat. Sie werden auf deinem eigenen Gerät abgespielt. Gibt es für etwas keine Aufnahme, greift die App auf die Stimme zurück, die bereits auf deinem Gerät installiert ist. In beiden Fällen wird nichts aufgenommen und nichts verschickt.',
    'Bei den Sprechübungen nimmst du dich selbst auf und hörst dich gleich danach — direkt nach der Stimme, die es richtig sagt. Diese Aufnahme bleibt auf deinem Gerät: sie wird nirgendwohin geschickt, auch nicht zu uns, und nach der Übung wird sie verworfen. Eine Spracherkennung kommt nicht vor — es gab eine, sie wurde ausgebaut, weil kein Erkenner Darija kennt. Willst du das Mikrofon gar nicht benutzen, schalte die Sprechübungen in den Einstellungen aus; der Rest der App läuft weiter.',
  ]],
  ['Kinder', [
    'Diese App ist für Kinder gemacht. Deshalb gibt es bewusst kein Konto, keinen Chat, kein Teilen, kein Hochladen und keine Werbung. Es gibt nichts, was ein Kind eingeben könnte und das bei uns ankäme.',
    `Einen Kauf gibt es: das Abo für den ganzen Kurs. Es liegt hinter einer Rechenaufgabe, die ein Kind nicht nebenbei löst, und die Zahlung läuft vollständig über ${n.via} — wir sehen weder Kartendaten noch Namen.`,
  ]],
  [n.kop, [
    `Lädst du die App ${n.download}, weiß ${n.bedrijfOf}, dass du sie geladen hast, und können nach ihren eigenen Bedingungen technische Absturzdaten erheben. Das liegt außerhalb unseres Einflusses; personenbezogene Daten erhalten wir daraus nicht.`,
  ]],
  ['Bezahlen', [
    `Die ersten Einheiten sind kostenlos. Nimmst du den vollen Zugang, läuft diese Zahlung vollständig über ${n.via}: sie ziehen den Betrag ein, sie führen die Mehrwertsteuer ab, sie verwalten die Testphase und sie wissen, wer du bist. Darijaforkids erfährt nur, dass das Abo läuft — keine Kartendaten, keine Adresse, kein Name.`,
    'Es ist ein Monatsabo, das bis zur Kündigung weiterläuft, und gekündigt wird im eigenen Store-Konto; wir können das nicht für dich tun und sehen auch nicht, wann du es tust. Vor jedem Abschluss steht eine kleine Rechenaufgabe, die ein Erwachsener lösen muss.',
  ]],
  ['Post an Eltern', [
    'Auf dem Elternbildschirm kann ein Elternteil eine E-Mail-Adresse hinterlassen, um zu hören, wenn es etwas Neues gibt, oder um einmal pro Woche zu lesen, wie das Lernen läuft. Das ist das Einzige, was wir von jemandem aufbewahren, und nur, wenn er es selbst einträgt.',
    'Davor steht eine Rechenaufgabe, damit es ein Erwachsener ist. Die beiden Häkchen — Neues und Fortschritt — sind beide leer und sind zwei getrennte Entscheidungen. Und wir schicken erst etwas, nachdem du im Postfach auf den Bestätigungsknopf getippt hast: ohne diesen Tipp bleibt es bei dieser einen Mail.',
    'Was wir aufbewahren: die Adresse, die Sprache der App, was du angehakt hast, wann du das getan hast, und eine verschlüsselte Kurzform deiner IP-Adresse — Letzteres nur, um zeigen zu können, dass die Einwilligung wirklich gegeben wurde.',
    'Bittest du um die Wochenmail, schickt die App fünf Zahlen mit: fertige Einheiten und Lektionen, gesehene Wörter, längste Serie und Punktzahl. Keine Antworten, keine Namen, kein Geburtsdatum, nichts darüber, welches Kind.',
    'Unten in jeder Mail stehen zwei Links: abmelden, und Daten löschen lassen. Abmelden stoppt die Post; Löschen entfernt die Adresse ganz. Beides funktioniert ohne Anmeldung.',
    'Die Post wird von einem Mailanbieter in der EU zugestellt, der dafür deine Adresse sieht und sonst nichts. Wir verkaufen keine Adressen und geben sie an niemanden weiter.',
  ]],
  ['Deine Daten löschen', [
    'In den Einstellungen kannst du deinen Fortschritt als Datei sichern, auf einem anderen Gerät zurückholen oder alles auf einmal löschen. Löschen ist endgültig: es gibt keine Kopie woanders.',
    'Die App vom Gerät zu entfernen löscht alles, was sie gespeichert hatte.',
  ]],
]

const SECTIONS_IT = (n: Winkelnamen): Section[] => [
  ['Che cosa raccogliamo', [
    'Del bambino: niente. Darijaforkids non ha un account, non chiede mai a un bambino il suo indirizzo e-mail e non manda niente degli esercizi a un server.',
    'C’è un’eccezione, e viene dal genitore: se un genitore lascia lui stesso un indirizzo nella schermata dei genitori, noi conserviamo quell’indirizzo. Vedi «Posta ai genitori» più sotto.',
    'I tuoi progressi — parole imparate, serie, premi e impostazioni — restano nella memoria del tuo browser o della tua app, sul tuo dispositivo. Noi non possiamo accedervi.',
  ]],
  ['Pubblicità e misurazioni', [
    'Nessuna pubblicità, nessun tracciatore, nessuna analitica, nessun cookie di terzi. Non contiamo nemmeno quante persone usano l’app.',
  ]],
  ['L’audio', [
    'La pronuncia viene da registrazioni contenute nell’app stessa: una voce marocchina che ha letto tutto. Vengono riprodotte sul tuo dispositivo. Se per qualcosa non esiste una registrazione, l’app ripiega sulla voce già installata sul dispositivo. In entrambi i casi non viene registrato né inviato niente.',
    'Negli esercizi di pronuncia ti registri e ti riascolti subito, appena dopo la voce che lo dice bene. Quella registrazione resta sul tuo dispositivo: non viene mandata da nessuna parte, nemmeno a noi, e dopo l’esercizio viene buttata. Non c’è di mezzo nessun riconoscimento vocale — c’era, è stato tolto, perché nessun motore conosce il darija. Se preferisci non usare il microfono, disattiva gli esercizi di pronuncia nelle Impostazioni; il resto dell’app continua a funzionare.',
  ]],
  ['I bambini', [
    'Questa app è fatta per i bambini. Per questo, apposta, non c’è né un account, né una chat, né un modo per condividere o caricare qualcosa, né pubblicità. Non c’è niente che un bambino possa compilare e che arrivi fino a noi.',
    `C’è un solo acquisto: l’abbonamento al corso completo. Sta dietro un calcolo che un bambino non risolve di sfuggita, e il pagamento passa interamente ${n.via}: non vediamo né i dati della carta né il nome.`,
  ]],
  [n.kop, [
    `Se scarichi l’app ${n.download}, ${n.bedrijfOf} sa che l’hai scaricata e possono raccogliere dati tecnici sui crash secondo le loro condizioni. Questo è fuori dalla nostra portata e non ci fornisce nessun dato personale.`,
  ]],
  ['Il pagamento', [
    `Le prime unità sono gratis. Se prendi l’accesso completo, quel pagamento passa interamente ${n.via}: sono loro a incassare, loro a versare l’IVA, loro a gestire la prova gratuita e loro a sapere chi sei. Darijaforkids viene a sapere soltanto che l’abbonamento è attivo: niente dati della carta, niente indirizzo, niente nome.`,
    'È un abbonamento che continua finché non lo disdici, e la disdetta si fa nel tuo account del negozio; noi non possiamo farlo al posto tuo e non vediamo nemmeno quando lo fai. Prima di sottoscrivere qualsiasi cosa c’è un piccolo calcolo che deve risolvere una persona adulta.',
  ]],
  ['Posta ai genitori', [
    "Nella schermata dei genitori un genitore può lasciare un indirizzo e-mail, per sapere quando c'è qualcosa di nuovo o per leggere una volta a settimana come va lo studio. È l'unica cosa che conserviamo di qualcuno, e solo se è lui stesso a scriverla.",
    "Prima c'è un calcolo, così è un adulto a farlo. Le due caselle — novità e progressi — sono entrambe vuote e sono due scelte separate. E non mandiamo niente finché non hai toccato il pulsante di conferma nella tua casella: senza quel tocco resta quella sola mail.",
    "Che cosa conserviamo: l'indirizzo, la lingua dell'app, che cosa hai spuntato, quando l'hai fatto e un'impronta cifrata del tuo indirizzo IP — quest'ultima solo per poter dimostrare che il consenso è stato davvero dato.",
    "Se chiedi la mail settimanale, l'app ci aggiunge cinque numeri: unità e lezioni finite, parole incontrate, serie più lunga e punti. Nessuna risposta, nessun nome, nessuna data di nascita, niente su quale bambino.",
    "In fondo a ogni mail ci sono due link: cancellarsi, e far cancellare i propri dati. Cancellarsi ferma la posta; cancellare toglie del tutto l'indirizzo. Funzionano entrambi senza accedere.",
    "La posta è consegnata da un fornitore nell'UE, che vede il tuo indirizzo e nient'altro. Non vendiamo indirizzi e non li diamo a nessuno.",
  ]],
  ['Cancellare i tuoi dati', [
    'Nelle impostazioni puoi salvare i tuoi progressi come file, recuperarli su un altro dispositivo o cancellare tutto in una volta. Cancellare è definitivo: non c’è nessuna copia da nessun’altra parte.',
    'Disinstallare l’app cancella tutto quello che era stato salvato.',
  ]],
]

const SECTIONS_EN = (n: Winkelnamen): Section[] => [
  ['What we collect', [
    'From the child: nothing. Darijaforkids has no account, never asks a child for an email address, and sends nothing about the practising to a server.',
    'There is one exception, and it comes from the parent: if a parent leaves an address themselves on the parents\u2019 screen, we keep that address. See \u201cMail to parents\u201d below.',
    'Your progress — words learned, streak, rewards and settings — stays in your own browser or app storage, on your own device. We cannot reach it.',
  ]],
  ['Advertising and measurement', [
    'No adverts, no trackers, no analytics, no third-party cookies. We do not even count how many people use the app.',
  ]],
  ['Sound', [
    'Pronunciation comes from recordings held inside the app itself: a Moroccan voice that read everything out. They are played on your own device. Where there is no recording for something, the app falls back on the voice already installed on your device. In neither case is anything recorded or sent.',
    'In the speaking exercises you record yourself and hear your own voice straight back, right after the voice that says it properly. That recording stays on your own device: it is not sent anywhere, not even to us, and it is thrown away after the exercise. No speech recognition is involved — there was some, it was taken out, because no recogniser knows Darija. If you would rather not use the microphone at all, switch the speaking exercises off in Settings; the rest of the app carries on.',
  ]],
  ['Children', [
    'This app is made for children. That is why there is deliberately no account, no chat, no sharing, no uploading and no advertising. There is nothing a child can fill in that reaches us.',
    `There is one purchase: the subscription to the full course. It sits behind a sum a child will not solve in passing, and the payment runs entirely through ${n.via} — we see no card details and no name.`,
  ]],
  [n.kop, [
    `If you download the app from ${n.download}, ${n.bedrijfOf} knows that you downloaded it and may collect technical crash data under their own terms. That is outside our control and gives us no personal data.`,
  ]],
  ['Paying', [
    `The first units are free. If you take full access, that payment runs entirely through ${n.via}: they take the money, they account for the VAT, they run the free trial and they know who you are. Darijaforkids is only told that the subscription is active — no card details, no address, no name.`,
    'It is a monthly subscription that runs until you cancel, and cancelling happens in your own store account; we cannot do it for you and we cannot see when you do. Before anything can be taken out, a small sum has to be answered by an adult.',
  ]],
  ['Mail to parents', [
    'On the parents’ screen a parent can leave an email address, to hear when something new arrives or to read once a week how the learning is going. It is the only thing we keep about anybody, and only if they type it in themselves.',
    'A sum comes first, so that it is a grown-up doing it. The two boxes — news and progress — are both empty and are two separate choices. And we send nothing until you have tapped the confirmation button in your inbox: without that tap it ends at that one mail.',
    'What we keep: the address, the app’s language, what you ticked, when you did it, and a hashed short form of your IP address — the last only so that the consent can be shown to have been given.',
    'If you ask for the weekly note, the app sends five numbers with it: units and lessons finished, words seen, longest streak and points. No answers, no names, no date of birth, nothing about which child.',
    'At the bottom of every mail are two links: unsubscribe, and erase my data. Unsubscribing stops the mail; erasing removes the address altogether. Both work without logging in.',
    'The mail is delivered by a provider in the EU, which sees your address and nothing else. We do not sell addresses and we give them to nobody.',
  ]],
  ['Removing your data', [
    'In the settings you can save your progress as a file, restore it on another device, or erase everything at once. Erasing is final: there is no copy anywhere else.',
    'Deleting the app from your device erases everything it had stored.',
  ]],
]

const SECTIONS_ES = (n: Winkelnamen): Section[] => [
  ['Qué recogemos', [
    'Del niño: nada. Darijaforkids no tiene cuenta, nunca le pide a un niño su dirección de correo y no manda nada de los ejercicios a ningún servidor.',
    'Hay una excepción, y viene del adulto: si un padre o una madre deja una dirección en la pantalla para adultos, guardamos esa dirección. Véase «Correo a los padres» más abajo.',
    'Tu progreso —palabras aprendidas, racha, recompensas y ajustes— se queda en el almacenamiento de tu navegador o de tu aplicación, en tu dispositivo. Nosotros no podemos acceder a él.',
  ]],
  ['Publicidad y medición', [
    'Sin publicidad, sin rastreadores, sin analítica, sin cookies de terceros. Ni siquiera contamos cuánta gente usa la aplicación.',
  ]],
  ['El sonido', [
    'La pronunciación viene de grabaciones que están dentro de la propia app: una voz marroquí que lo ha leído todo. Se reproducen en tu propio dispositivo. Si de algo no hay grabación, la app recurre a la voz que ya está instalada en el dispositivo. En ninguno de los dos casos se graba ni se envía nada.',
    'En los ejercicios de pronunciación te grabas y te vuelves a oír al momento, justo después de la voz que lo dice bien. Esa grabación se queda en tu propio dispositivo: no se envía a ninguna parte, tampoco a nosotros, y se descarta después del ejercicio. No hay ningún reconocimiento de voz de por medio — lo hubo y se quitó, porque ningún motor conoce el darija. Si prefieres no usar el micrófono, desactiva los ejercicios de pronunciación en los Ajustes; el resto de la aplicación sigue funcionando.',
  ]],
  ['Los niños', [
    'Esta aplicación está hecha para niños. Por eso no hay, a propósito, ni cuenta, ni chat, ni manera de compartir o subir nada, ni publicidad. No hay nada que un niño pueda rellenar y que llegue hasta nosotros.',
    `Hay una compra: la suscripción al curso completo. Está detrás de una cuenta que un niño no resuelve de pasada, y el pago va entero por ${n.via}: no vemos ni datos de tarjeta ni nombre.`,
  ]],
  [n.kop, [
    `Si descargas la aplicación en ${n.download}, ${n.bedrijfOf} sabe que la has descargado y pueden recoger datos técnicos de fallos según sus propias condiciones. Eso queda fuera de nuestro alcance y no nos aporta ningún dato personal.`,
  ]],
  ['El pago', [
    `Las primeras unidades son gratis. Si coges el acceso completo, ese pago pasa entero por ${n.via}: ellos cobran el importe, ellos liquidan el IVA, ellos llevan la prueba gratuita y ellos saben quién eres. Darijaforkids solo se entera de que la suscripción está activa: ni datos de la tarjeta, ni dirección, ni nombre.`,
    'Es una suscripción mensual que sigue hasta que la canceles, y la cancelación se hace en tu propia cuenta de la tienda; nosotros no podemos hacerlo por ti y tampoco vemos cuándo lo haces. Antes de contratar nada hay una pequeña operación que debe resolver una persona adulta.',
  ]],
  ['Correo a los padres', [
    'En la pantalla para adultos, un padre o una madre puede dejar una dirección de correo, para saber cuándo hay algo nuevo o para leer una vez por semana cómo va el aprendizaje. Es lo único que guardamos de alguien, y solo si lo escribe esa persona.',
    'Antes va una cuenta, para que lo haga un adulto. Las dos casillas —novedades y progreso— están vacías y son dos decisiones distintas. Y no enviamos nada hasta que hayas tocado el botón de confirmación en tu buzón: sin ese toque se queda en ese único correo.',
    'Qué guardamos: la dirección, el idioma de la aplicación, lo que marcaste, cuándo lo hiciste y una huella cifrada de tu dirección IP; esto último solo para poder demostrar que el consentimiento se dio de verdad.',
    'Si pides el correo semanal, la aplicación añade cinco números: unidades y lecciones terminadas, palabras vistas, racha más larga y puntos. Ninguna respuesta, ningún nombre, ninguna fecha de nacimiento, nada sobre qué niño.',
    'Al final de cada correo hay dos enlaces: darse de baja y borrar mis datos. Darse de baja detiene el correo; borrar quita la dirección del todo. Los dos funcionan sin iniciar sesión.',
    'El correo lo entrega un proveedor de la UE, que ve tu dirección y nada más. No vendemos direcciones ni se las damos a nadie.',
  ]],
  ['Borrar tus datos', [
    'En los ajustes puedes guardar tu progreso como archivo, recuperarlo en otro dispositivo o borrarlo todo de una vez. Borrar es definitivo: no hay ninguna copia en otro sitio.',
    'Desinstalar la aplicación borra todo lo que había guardado.',
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

const OPBOUW: Record<Lang, (n: Winkelnamen) => PrivacyText> = {
  nl: (n) => build(
    'Privacy',
    'Laatst bijgewerkt: september 2026',
    'Darijaforkids is gemaakt om aan een kind te kunnen geven. Dit is in het kort wat dat betekent.',
    'Voor publicatie in een appwinkel moeten hier nog de naam en het e-mailadres van de uitgever staan. Die staan nog niet ingevuld in src/content/operator.ts.',
    'Vragen over privacy? Mail',
    SECTIONS_NL(n),
  ),
  fr: (n) => build(
    'Confidentialité',
    'Dernière mise à jour : septembre 2026',
    'Darijaforkids est faite pour pouvoir être confiée à un enfant. Voici ce que cela veut dire, en bref.',
    'Avant une publication sur un magasin d’applications, le nom et l’adresse e-mail de l’éditeur doivent figurer ici. Ils ne sont pas encore renseignés dans src/content/operator.ts.',
    'Une question sur la vie privée ? Écris à',
    SECTIONS_FR(n),
  ),
  de: (n) => build(
    'Datenschutz',
    'Zuletzt aktualisiert: September 2026',
    'Darijaforkids ist so gebaut, dass man sie einem Kind in die Hand geben kann. Das heißt kurz gesagt Folgendes.',
    'Vor einer Veröffentlichung in einem App-Store müssen hier Name und E-Mail-Adresse des Herausgebers stehen. Sie sind in src/content/operator.ts noch nicht eingetragen.',
    'Fragen zum Datenschutz? Schreib an',
    SECTIONS_DE(n),
  ),
  es: (n) => build(
    'Privacidad',
    'Última actualización: septiembre de 2026',
    'Darijaforkids está hecha para poder dársela a un niño. Esto es, en corto, lo que eso significa.',
    'Antes de publicar en una tienda de aplicaciones, aquí deben figurar el nombre y el correo del editor. Todavía no están rellenados en src/content/operator.ts.',
    '¿Alguna duda sobre privacidad? Escribe a',
    SECTIONS_ES(n),
  ),
  it: (n) => build(
    'Privacy',
    'Ultimo aggiornamento: settembre 2026',
    'Darijaforkids è fatta per poterla mettere in mano a un bambino. Ecco, in breve, che cosa vuol dire.',
    'Prima di pubblicare in un negozio di app, qui devono comparire il nome e l’indirizzo e-mail di chi pubblica. Non sono ancora stati inseriti in src/content/operator.ts.',
    'Domande sulla privacy? Scrivi a',
    SECTIONS_IT(n),
  ),
  en: (n) => build(
    'Privacy',
    'Last updated: September 2026',
    'Darijaforkids is built to be handed to a child. Here is what that means, briefly.',
    'Before publishing to an app store, the publisher’s name and email address have to appear here. They are not filled in yet in src/content/operator.ts.',
    'Questions about privacy? Email',
    SECTIONS_EN(n),
  ),
}

/**
 * De privacyverklaring in deze taal, met de winkel van dit platform erin —
 * zie `winkels.ts` voor waarom er niet gewoon twee winkels staan.
 */
export const privacyVan = (lang: Lang): PrivacyText => OPBOUW[lang](winkelnamen(lang))
