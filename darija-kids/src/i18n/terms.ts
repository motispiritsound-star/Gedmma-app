import type { Lang } from './languages'
import { LIST_PRICE, TRIAL_DAYS } from '../engine/billing'

/**
 * The terms of use, in all five interface languages.
 *
 * Both stores require this for an auto-renewing subscription — Apple will not
 * review an app that sells one without terms a buyer can read first, and the
 * minimum they insist on is what it costs, how long it runs, that it renews by
 * itself, and where to switch it off. Apple also has to be named as not being
 * a party to the agreement, which is the odd-looking clause at the bottom.
 *
 * Written to be read by a parent on a phone rather than by a lawyer: short
 * sentences, no defined terms, and nothing claimed that is not true. The price
 * and the trial come from billing.ts, so the page can never quote a figure the
 * app no longer charges.
 */
export interface TermsText {
  title: string
  updated: string
  intro: string
  sections: { title: string; body: string[] }[]
  contact: string
}

type Section = [title: string, body: string[]]

const price = LIST_PRICE
const days = String(TRIAL_DAYS)

const SECTIONS_NL: Section[] = [
  ['Wat je krijgt', [
    'Je mag Darija Kids gebruiken op de apparaten die bij jouw eigen winkelaccount horen, voor jezelf en je gezin. Dat is een gebruiksrecht, geen eigendom: de app, de lessen, de stemmen en de tekeningen blijven van de uitgever.',
    'Wat niet mag: de app doorverkopen of verhuren, de lessen kopiëren om ze elders aan te bieden, of proberen de code uit elkaar te halen om er iets anders van te maken.',
  ]],
  ['Het gratis deel', [
    'Het Arabische alfabet en de eerste vijf units zijn gratis en blijven gratis. Daar hoef je niets voor af te sluiten en niets voor in te vullen.',
  ]],
  ['Het abonnement', [
    `De volledige cursus loopt via een abonnement van ${price} per maand, inclusief btw. Je begint met ${days} dagen gratis; daarna wordt het bedrag maandelijks afgeschreven via je App Store- of Google Play-account, net zolang tot je opzegt.`,
    'Opzeggen doe je in dat winkelaccount, niet bij ons — wij kunnen er niet bij. Zeg je op vóór het einde van de gratis dagen, dan betaal je niets. Zeg je later op, dan loopt je toegang door tot het einde van de maand die je al betaald hebt.',
    'Apple en Google zijn de verkoper: zij innen het geld, dragen de btw af en bepalen hun eigen regels voor terugbetaling. Een verzoek om je geld terug gaat dus naar hen.',
    'Verandert de prijs ooit, dan laat de winkel dat weten vóór het ingaat, en kun je opzeggen in plaats van mee te gaan.',
  ]],
  ['Een volwassene sluit het af', [
    'De app is voor kinderen, dus een abonnement afsluiten kan alleen achter een rekensom die een kind niet zomaar oplost. Wie afsluit, verklaart daarmee volwassen te zijn en met dat winkelaccount te mogen betalen.',
  ]],
  ['Over de taal', [
    'Darija verschilt per stad, per streek en per familie, en er is geen officiële spelling. Wij kiezen de vorm die in Casablanca en Rabat het meest te horen is. Zegt jouw familie het anders, dan heeft jouw familie gelijk — dat is geen fout in de app.',
    'De uitspraak komt van de stem die al op je apparaat staat. Die spreekt Standaardarabisch en dus geen echte Marokkaanse tongval. We doen ons best om de woorden goed te laten klinken, maar een stem uit een telefoon vervangt geen mens.',
  ]],
  ['Wat we niet beloven', [
    'We leveren de app zoals hij is. We doen ons best om hem te laten werken en te blijven verbeteren, maar we beloven niet dat hij nooit een fout bevat, altijd bereikbaar is, of dat je er een bepaald niveau mee haalt.',
    'Voor schade die uit het gebruik voortkomt zijn we niet aansprakelijk, behalve waar de wet dat niet toestaat — bij opzet of grove nalatigheid bijvoorbeeld, en voor de rechten die je als consument hoe dan ook houdt.',
  ]],
  ['Als de voorwaarden wijzigen', [
    'Verandert er iets belangrijks, dan passen we deze pagina aan en zetten we de nieuwe datum erboven. Gebruik je de app daarna nog, dan geldt de nieuwe tekst. Wat je al betaald hebt, verandert er niet door.',
  ]],
  ['Apple en Google', [
    'Deze afspraken zijn tussen jou en de uitgever, niet tussen jou en Apple of Google. Zij zijn geen partij en niet verantwoordelijk voor de app of de inhoud ervan. Wel mag Apple deze voorwaarden tegenover jou inroepen — dat moet van Apple zelf hierin staan.',
    'Op deze voorwaarden is Nederlands recht van toepassing. Woon je in een ander EU-land, dan houd je de bescherming die het recht van jouw land je hoe dan ook geeft.',
  ]],
]

const SECTIONS_FR: Section[] = [
  ['Ce que tu obtiens', [
    'Tu peux utiliser Darija Kids sur les appareils liés à ton propre compte de boutique, pour toi et ta famille. C’est un droit d’usage, pas une propriété : l’application, les leçons, les voix et les dessins restent à l’éditeur.',
    'Ce qui n’est pas permis : revendre ou louer l’application, copier les leçons pour les proposer ailleurs, ou tenter de démonter le code pour en faire autre chose.',
  ]],
  ['La partie gratuite', [
    'L’alphabet arabe et les cinq premières unités sont gratuits et le restent. Il n’y a rien à souscrire et rien à remplir pour cela.',
  ]],
  ['L’abonnement', [
    `Le cours complet passe par un abonnement de ${price} par mois, TTC. Tu commences par ${days} jours offerts ; ensuite le montant est prélevé chaque mois via ton compte App Store ou Google Play, jusqu’à ce que tu résilies.`,
    'La résiliation se fait dans ce compte de boutique, pas chez nous — nous n’y avons pas accès. Si tu résilies avant la fin des jours offerts, tu ne paies rien. Plus tard, ton accès continue jusqu’à la fin du mois déjà payé.',
    'Apple et Google sont le vendeur : ils encaissent, reversent la TVA et fixent leurs propres règles de remboursement. Une demande de remboursement leur revient donc.',
    'Si le prix change un jour, la boutique te prévient avant que cela s’applique, et tu peux résilier au lieu de suivre.',
  ]],
  ['C’est un adulte qui souscrit', [
    'L’application est pour des enfants : souscrire n’est donc possible qu’après un calcul qu’un enfant ne résout pas en passant. Qui souscrit déclare être majeur et avoir le droit de payer avec ce compte.',
  ]],
  ['À propos de la langue', [
    'Le darija change d’une ville, d’une région et d’une famille à l’autre, et il n’a pas d’orthographe officielle. Nous choisissons la forme qu’on entend le plus à Casablanca et à Rabat. Si ta famille le dit autrement, c’est ta famille qui a raison — ce n’est pas une erreur de l’application.',
    'La prononciation vient de la voix déjà présente sur ton appareil. Elle parle l’arabe standard, donc sans véritable accent marocain. Nous faisons de notre mieux pour que les mots sonnent juste, mais une voix de téléphone ne remplace pas un être humain.',
  ]],
  ['Ce que nous ne promettons pas', [
    'Nous fournissons l’application telle qu’elle est. Nous faisons de notre mieux pour qu’elle fonctionne et continue de s’améliorer, mais nous ne promettons pas qu’elle soit sans défaut, toujours disponible, ni qu’elle te fasse atteindre un niveau donné.',
    'Nous ne sommes pas responsables des dommages issus de l’usage de l’application, sauf là où la loi l’interdit — en cas de faute intentionnelle ou de négligence grave, par exemple, et pour les droits que tu conserves de toute façon en tant que consommateur.',
  ]],
  ['Si les conditions changent', [
    'Si quelque chose d’important change, nous modifions cette page et inscrivons la nouvelle date en haut. Continuer à utiliser l’application vaut acceptation du nouveau texte. Ce que tu as déjà payé n’en est pas affecté.',
  ]],
  ['Apple et Google', [
    'Cet accord est conclu entre toi et l’éditeur, pas entre toi et Apple ou Google. Ils n’y sont pas parties et ne répondent ni de l’application ni de son contenu. Apple peut toutefois se prévaloir de ces conditions à ton égard — Apple exige que cela y figure.',
    'Ces conditions relèvent du droit néerlandais. Si tu vis dans un autre pays de l’UE, tu conserves la protection que le droit de ton pays te garantit de toute façon.',
  ]],
]

const SECTIONS_DE: Section[] = [
  ['Was du bekommst', [
    'Du darfst Darija Kids auf den Geräten deines eigenen Store-Kontos nutzen, für dich und deine Familie. Das ist ein Nutzungsrecht, kein Eigentum: Die App, die Lektionen, die Stimmen und die Zeichnungen bleiben beim Herausgeber.',
    'Was nicht erlaubt ist: die App weiterverkaufen oder vermieten, die Lektionen kopieren, um sie anderswo anzubieten, oder versuchen, den Code auseinanderzunehmen und daraus etwas anderes zu bauen.',
  ]],
  ['Der kostenlose Teil', [
    'Das arabische Alphabet und die ersten fünf Einheiten sind kostenlos und bleiben es. Dafür musst du nichts abschließen und nichts ausfüllen.',
  ]],
  ['Das Abo', [
    `Der ganze Kurs läuft über ein Abo von ${price} pro Monat, inklusive Mehrwertsteuer. Du beginnst mit ${days} Tagen gratis; danach wird der Betrag monatlich über dein App-Store- oder Google-Play-Konto abgebucht, bis du kündigst.`,
    'Gekündigt wird in diesem Store-Konto, nicht bei uns — wir kommen da nicht heran. Kündigst du vor Ende der Gratistage, zahlst du nichts. Kündigst du später, läuft dein Zugang bis zum Ende des bereits bezahlten Monats.',
    'Apple und Google sind der Verkäufer: Sie kassieren, führen die Mehrwertsteuer ab und legen ihre eigenen Regeln für Erstattungen fest. Ein Erstattungswunsch geht also an sie.',
    'Ändert sich der Preis irgendwann, sagt der Store das vorher, und du kannst kündigen, statt mitzugehen.',
  ]],
  ['Ein Erwachsener schließt ab', [
    'Die App ist für Kinder, deshalb lässt sich ein Abo nur hinter einer Rechenaufgabe abschließen, die ein Kind nicht nebenbei löst. Wer abschließt, erklärt damit, volljährig zu sein und mit diesem Konto zahlen zu dürfen.',
  ]],
  ['Über die Sprache', [
    'Darija unterscheidet sich von Stadt zu Stadt, von Gegend zu Gegend und von Familie zu Familie, und eine offizielle Rechtschreibung gibt es nicht. Wir wählen die Form, die man in Casablanca und Rabat am häufigsten hört. Sagt deine Familie es anders, hat deine Familie recht — das ist kein Fehler der App.',
    'Die Aussprache kommt von der Stimme, die schon auf deinem Gerät ist. Die spricht Hocharabisch und damit keinen echten marokkanischen Tonfall. Wir geben uns Mühe, dass die Wörter richtig klingen, aber eine Stimme aus dem Telefon ersetzt keinen Menschen.',
  ]],
  ['Was wir nicht versprechen', [
    'Wir liefern die App so, wie sie ist. Wir geben unser Bestes, dass sie funktioniert und besser wird, versprechen aber nicht, dass sie fehlerfrei oder immer erreichbar ist oder dich auf ein bestimmtes Niveau bringt.',
    'Für Schäden aus der Nutzung haften wir nicht, außer wo das Gesetz es nicht zulässt — bei Vorsatz oder grober Fahrlässigkeit etwa, und für die Rechte, die dir als Verbraucher ohnehin bleiben.',
  ]],
  ['Wenn sich die Bedingungen ändern', [
    'Ändert sich etwas Wichtiges, passen wir diese Seite an und schreiben das neue Datum darüber. Nutzt du die App danach weiter, gilt der neue Text. An dem, was du schon bezahlt hast, ändert das nichts.',
  ]],
  ['Apple und Google', [
    'Diese Vereinbarung besteht zwischen dir und dem Herausgeber, nicht zwischen dir und Apple oder Google. Sie sind keine Partei und nicht verantwortlich für die App oder ihren Inhalt. Apple darf sich dir gegenüber allerdings auf diese Bedingungen berufen — Apple verlangt, dass das hier steht.',
    'Auf diese Bedingungen ist niederländisches Recht anwendbar. Wohnst du in einem anderen EU-Land, behältst du den Schutz, den dir das Recht deines Landes ohnehin gibt.',
  ]],
]

const SECTIONS_ES: Section[] = [
  ['Qué recibes', [
    'Puedes usar Darija Kids en los dispositivos vinculados a tu propia cuenta de la tienda, para ti y tu familia. Es un derecho de uso, no una propiedad: la aplicación, las lecciones, las voces y los dibujos siguen siendo de quien la publica.',
    'Lo que no se puede: revender o alquilar la aplicación, copiar las lecciones para ofrecerlas en otro sitio, o intentar desmontar el código para hacer otra cosa con él.',
  ]],
  ['La parte gratuita', [
    'El alfabeto árabe y las cinco primeras unidades son gratis y lo seguirán siendo. No hay que contratar nada ni rellenar nada para eso.',
  ]],
  ['La suscripción', [
    `El curso completo va con una suscripción de ${price} al mes, con IVA incluido. Empiezas con ${days} días gratis; después se cobra el importe cada mes a través de tu cuenta de la App Store o de Google Play, hasta que canceles.`,
    'Se cancela en esa cuenta de la tienda, no con nosotros: no tenemos acceso. Si cancelas antes de que acaben los días gratis, no pagas nada. Si cancelas más tarde, mantienes el acceso hasta el final del mes ya pagado.',
    'Apple y Google son el vendedor: cobran, liquidan el IVA y fijan sus propias normas de devolución. Una petición de devolución va, por tanto, a ellos.',
    'Si algún día cambia el precio, la tienda te avisa antes de que se aplique y puedes cancelar en lugar de seguir.',
  ]],
  ['Lo contrata una persona adulta', [
    'La aplicación es para niños, así que contratar solo es posible tras una cuenta que un niño no resuelve de pasada. Quien contrata declara con ello ser mayor de edad y poder pagar con esa cuenta.',
  ]],
  ['Sobre el idioma', [
    'El dariya cambia de ciudad a ciudad, de región a región y de familia a familia, y no tiene ortografía oficial. Elegimos la forma que más se oye en Casablanca y Rabat. Si tu familia lo dice de otra manera, tu familia tiene razón: no es un fallo de la aplicación.',
    'La pronunciación viene de la voz que ya está en tu dispositivo. Habla árabe estándar, así que no tiene acento marroquí de verdad. Hacemos lo posible para que las palabras suenen bien, pero una voz de teléfono no sustituye a una persona.',
  ]],
  ['Lo que no prometemos', [
    'Entregamos la aplicación tal como está. Hacemos lo posible para que funcione y siga mejorando, pero no prometemos que no tenga fallos, que esté siempre disponible, ni que llegues con ella a un nivel determinado.',
    'No respondemos de los daños derivados del uso, salvo donde la ley no lo permita: en caso de dolo o negligencia grave, por ejemplo, y en cuanto a los derechos que conservas como consumidor en cualquier caso.',
  ]],
  ['Si cambian las condiciones', [
    'Si cambia algo importante, actualizamos esta página y ponemos arriba la fecha nueva. Si sigues usando la aplicación después, vale el texto nuevo. Lo que ya hayas pagado no cambia por ello.',
  ]],
  ['Apple y Google', [
    'Este acuerdo es entre tú y quien publica la aplicación, no entre tú y Apple o Google. Ellos no son parte ni responden de la aplicación ni de su contenido. Apple sí puede invocar estas condiciones frente a ti: es la propia Apple quien exige que eso conste aquí.',
    'A estas condiciones se les aplica el derecho neerlandés. Si vives en otro país de la UE, conservas la protección que el derecho de tu país te da de todos modos.',
  ]],
]

const SECTIONS_EN: Section[] = [
  ['What you get', [
    'You may use Darija Kids on the devices tied to your own store account, for yourself and your family. That is a right to use it, not ownership: the app, the lessons, the voices and the drawings stay with the publisher.',
    'What is not allowed: reselling or renting out the app, copying the lessons to offer them elsewhere, or trying to take the code apart to make something else of it.',
  ]],
  ['The free part', [
    'The Arabic alphabet and the first five units are free and stay free. There is nothing to sign up for and nothing to fill in.',
  ]],
  ['The subscription', [
    `The full course runs on a subscription of ${price} a month, VAT included. You start with ${days} days free; after that the amount is charged monthly through your App Store or Google Play account, until you cancel.`,
    'Cancelling happens in that store account, not with us — we cannot reach it. Cancel before the free days end and you pay nothing. Cancel later and your access runs to the end of the month you already paid for.',
    'Apple and Google are the seller: they take the payment, settle the VAT and set their own refund rules. A request for your money back therefore goes to them.',
    'If the price ever changes, the store tells you before it applies, and you can cancel rather than follow it.',
  ]],
  ['An adult signs up', [
    'The app is for children, so subscribing is only possible past a sum a child will not solve in passing. Whoever subscribes states by doing so that they are an adult and may pay with that account.',
  ]],
  ['About the language', [
    'Darija differs from city to city, region to region and family to family, and it has no official spelling. We use the form heard most in Casablanca and Rabat. If your family says it differently, your family is right — that is not a fault in the app.',
    'The pronunciation comes from the voice already on your device. It speaks Standard Arabic, so it has no real Moroccan accent. We do our best to make the words sound right, but a voice from a phone is no substitute for a person.',
  ]],
  ['What we do not promise', [
    'We provide the app as it is. We do our best to keep it working and to keep improving it, but we do not promise it is free of faults, always available, or that it will bring you to any particular level.',
    'We are not liable for damage arising from use of the app, except where the law does not allow that — in cases of intent or gross negligence, for instance, and for the rights you keep as a consumer regardless.',
  ]],
  ['If the terms change', [
    'If something important changes, we update this page and put the new date at the top. Carrying on using the app means the new text applies. It changes nothing about what you have already paid.',
  ]],
  ['Apple and Google', [
    'This agreement is between you and the publisher, not between you and Apple or Google. They are not a party to it and are not responsible for the app or its content. Apple may, however, rely on these terms against you — Apple itself requires that to be stated here.',
    'Dutch law applies to these terms. If you live in another EU country, you keep the protection your own country’s law gives you regardless.',
  ]],
]

const build = (
  title: string,
  updated: string,
  intro: string,
  contact: string,
  sections: Section[],
): TermsText => ({
  title,
  updated,
  intro,
  contact,
  sections: sections.map(([heading, body]) => ({ title: heading, body })),
})

export const TERMS: Record<Lang, TermsText> = {
  nl: build(
    'Gebruiksvoorwaarden',
    'Laatst gewijzigd: september 2026',
    'Dit zijn de afspraken tussen jou en de uitgever van Darija Kids. Ze zijn kort, want de app doet weinig dat afspraken nodig heeft: hij leert je een taal en bewaart niets over je.',
    'Vragen over deze voorwaarden?',
    SECTIONS_NL,
  ),
  fr: build(
    'Conditions d’utilisation',
    'Dernière modification : septembre 2026',
    'Voici l’accord entre toi et l’éditeur de Darija Kids. Il est court, parce que l’application fait peu de choses qui demandent un accord : elle t’apprend une langue et ne garde rien sur toi.',
    'Une question sur ces conditions ?',
    SECTIONS_FR,
  ),
  de: build(
    'Nutzungsbedingungen',
    'Zuletzt geändert: September 2026',
    'Das ist die Vereinbarung zwischen dir und dem Herausgeber von Darija Kids. Sie ist kurz, denn die App tut wenig, wofür man eine Vereinbarung braucht: Sie bringt dir eine Sprache bei und speichert nichts über dich.',
    'Fragen zu diesen Bedingungen?',
    SECTIONS_DE,
  ),
  es: build(
    'Condiciones de uso',
    'Última modificación: septiembre de 2026',
    'Este es el acuerdo entre tú y quien publica Darija Kids. Es corto, porque la aplicación hace pocas cosas que necesiten un acuerdo: te enseña un idioma y no guarda nada sobre ti.',
    '¿Dudas sobre estas condiciones?',
    SECTIONS_ES,
  ),
  en: build(
    'Terms of use',
    'Last changed: September 2026',
    'This is the agreement between you and the publisher of Darija Kids. It is short, because the app does little that needs an agreement: it teaches you a language and keeps nothing about you.',
    'Questions about these terms?',
    SECTIONS_EN,
  ),
}
