# Ondersteuning rond de lancering

Twee soorten berichten, en ze gaan allebei over Play.

| | |
|---|---|
| **Deel 1** | wat jíj aan Google vraagt als de beoordeling te lang duurt — nu niets in beoordeling, zie daar |
| **Deel 2** | wat jij antwoordt aan iemand die jóu iets vraagt over een afschrijving |

Deel 2 is er sinds 23 november, en dat is geen bijzaak: er zijn geen gratis
lessen meer en geen proefperiode, de app is gratis te downloaden en de cursus
is een abonnement dat op het eerste scherm gevraagd wordt. Er wordt dus
afgeschreven bij het afsluiten, en dat is precies het moment waarop iemand
schrijft. De onderbouwing staat boven `magLeren` in `src/engine/store.ts`; wat
er in de consoles moet staat in `docs/STAND.md`.

---

# Deel 1 — het bericht aan Google Play, als het te lang duurt

Klaar om te plakken. **Niet versturen vóór werkdag zes** — zie onderaan waarom
te vroeg vragen je kost in plaats van oplevert.

## Waar

Play Console → rechtsboven het vraagteken → **Help & feedback** → onderaan
*Contact support* → onderwerp **App review / Publishing**.

Doe het vanaf het account waar de app onder staat, anders moet de
ondersteuning eerst uitzoeken wie je bent.

## Het bericht

Engels, want daar wordt het in behandeld. Kort, feitelijk, geen klacht: de
mensen die dit lezen hebben de beoordeling niet gedaan en kunnen hem niet
versnellen — ze kunnen alleen kijken of er iets vastzit.

**Die beoordeling is voorbij, dus dit bericht gaat vandaag niet de deur uit.**
Inzending 7 — versiecode 8 (1.4) — is goedgekeurd en op 13 oktober vrijgegeven,
en sinds 24 oktober staat 1.5 live als versiecode 10 (`docs/STAND.md`). Er
staat niets in beoordeling. Wat hieronder staat is dus geen openstaande vraag
meer, maar het model voor een volgende ronde die blijft hangen.

**Gebruik je het opnieuw, vervang dan eerst de vijf regels boven *Hello*.** Die
staan nog op inzending 7, ingediend 3 oktober. Welk nummer en welke datum er dan
kloppen leest Play Console je voor onder *Publishing overview*; neem die over in
de vijf regels en in de onderwerpregel voordat je verstuurt. Een statusvraag
over een inzending die er niet meer is, kost je een ronde heen en weer.

```
Subject: Submission 7 in review since 3 October — request for status

App: Darijaforkids
Package name: app.darijaforkids.learn
Submission ID: 7
Submitted: 3 October 2026, 16:20
Current status: In review

Hello,

Submission 7 has been in review since 3 October. I have not made any
changes to the app, the store listing or App content since submitting,
and I am not planning to — I understand that a new change would restart
the review.

I am not asking for the review to be expedited. I would like to know:

1. Whether anything is required from me that I may have missed.
2. Whether this submission is progressing normally, or whether it is
   held up on something I can resolve.

For context, the submission contains a first production release, an
expansion to 177 countries, six new store listings, a resumed closed
testing track and a new content rating questionnaire. I understand this
is a larger submission than usual and that a first-time approval takes
longer.

Thank you.
```

Er staat met opzet geen naam onder. Je verstuurt dit vanuit je eigen
Play Console-account, dus Google ziet al wie het vraagt; een ondertekening
voegt niets toe en zet je naam in een bestand dat in de repository staat.

**Wat er met opzet niet in staat:** geen "dit duurt onredelijk lang", geen
verwijzing naar beloofde doorlooptijden, geen vraag om voorrang. Je vraagt of
er iets vastzit en of er iets van jou nodig is. Dat is wat zij kunnen
beantwoorden, en het is ook het enige wat je verder helpt.

## Wanneer

**Werkdag zes of later.** Tel werkdagen, geen kalenderdagen — er is op
3 oktober op een zaterdag ingediend, en dat scheelt bij het tellen twee dagen
die nooit hebben meegedaan.

| | |
|---|---|
| Ingediend | zaterdag 3 oktober, 16:20 |
| Werkdag 1 | maandag 5 oktober |
| Werkdag 5 | vrijdag 9 oktober |
| Werkdag 6 | maandag 12 oktober — vanaf hier is vragen redelijk |

Deze tabel is die van inzending 7. Loopt er een nieuwe ronde, tel dan opnieuw
vanaf de datum die Play Console noemt; de regel zelf blijft werkdag zes.

Voor een **eerste** goedkeuring van een app voor kinderen, met een nieuwe
leeftijdsclassificatie erin, zijn doorlooptijden van twee tot drie weken
gedocumenteerd. Vijf werkdagen is dus nog geen afwijking, en vragen zonder
reden kost goodwill bij precies de partij die straks over je zaak gaat.

## Wat je ondertussen niet doet

Niets aanraken. Geen *Remove changes*, geen nieuwe bundel, niets onder App
content — dat laatste is zelf een wijziging die beoordeeld moet worden. Een
achtste inzending zet nummer 7 bij het rijtje "Canceled" en de klok op nul.

---

# Deel 2 — wat je antwoordt op een vraag over geld

Vanaf de dag dat de campagne loopt komen deze vragen binnen, en met een
betaalmuur bij de download komen ze eerder en vaker dan eerst. Hieronder staan
de antwoorden op de drie die je zeker krijgt, klaar om te plakken.

**Twee dingen die bij alle drie gelden.**

De app heeft geen account en er staat geen server achter: alles blijft op het
toestel. Je kunt dus niet opzoeken wat iemand heeft gekocht of hoe ver hij was
— `src/engine/store.ts`, en `docs/PAYMENTS.md` zegt het ook: verlengingen,
opzeggingen en terugbetalingen gebeuren buiten de app om. Vraag dus niet om
een ordernummer om iets "na te kijken" wat je niet kunt nakijken.

En de winkel is de verkoper. Dat staat zo in de gebruiksvoorwaarden die een
koper vóór het betalen leest (`src/i18n/terms.ts`): daar wordt het geld geïnd,
daar wordt de btw afgedragen, en een verzoek om geld terug gaat daarheen. Dus
wijs de weg naar de winkel en beloof niets over een terugbetaling — die is
niet van jou.

De antwoorden hieronder staan in het Nederlands. De app en de winkelpagina's
staan in zes talen, dus de vraag komt ook in het Frans, Duits, Spaans,
Italiaans of Engels binnen; antwoord in de taal waarin hij gesteld is.

## "Er is geld afgeschreven en daar had ik niet op gerekend"

De kern: er is geen proefperiode, en er wordt bij het afsluiten afgeschreven.
Dat staat ook in de voorwaarden die hij vóór het betalen te lezen kreeg —
*"Het bedrag wordt bij het afsluiten afgeschreven … en daarna telkens opnieuw,
jaarlijks of maandelijks, net zolang tot je opzegt."*

```
Dank dat je het laat weten, en sorry dat het als een verrassing kwam.

Hoe het bij deze app werkt: de app zelf is gratis te downloaden, en de
cursus is een abonnement. Daar zit geen proefperiode bij — het bedrag
wordt afgeschreven op het moment dat je het abonnement afsluit, en daarna
telkens opnieuw tot je opzegt.

Opzeggen kan altijd, en het gaat buiten de app om: dat regel je bij je
abonnementen in de Play Store. In de app staat een knop die je er meteen
heen brengt — op het abonnementsscherm, onder "Abonnement beheren". Zeg
je op, dan loopt de periode die je betaald hebt nog af en wordt er daarna
niets meer afgeschreven.

Wil je je geld terug, dan gaat dat verzoek naar de winkel en niet naar
mij: Google int het geld en draagt de btw af, en de regels voor
terugbetaling zijn die van Google. Dat vraag je daar aan, bij de
bestelling zelf.

Ik heb zelf geen inzage in je aankoop: de app heeft geen account en er
gaat niets naar een server, dus bij mij staat niets van jou.
```

Komt deze vraag van iemand die vóór 23 november afsloot, dan kan hij wél drie
gratis dagen hebben gehad: tot die dag zat er een proef van drie dagen bij
beide abonnementen. Wat er bij hém is gebeurd staat op zijn bon in de winkel,
en dat is ook de enige plek waar het staat. Zeg dus niet "er is nooit een proef
geweest" — zeg wat er nu gebeurt, en laat de bon de rest zeggen.

## "Mijn lessen zijn op slot gegaan"

Dit komt van iemand die de app vóór 23 november had. Het antwoord is dat hij
precies houdt wat hij had afgerond, en dat wat hij nooit heeft afgerond achter
het abonnement zit. Dat is geen vriendelijkheid maar een belofte terughouden
die al gedaan is: de voorwaarden die hij heeft gelezen zeiden over die lessen
"zijn gratis en blijven gratis". `magLeren` in `src/engine/store.ts` hangt
daarom aan `isDone` en niet aan een lijst.

```
Je hebt de app al vóór 23 november, en toen waren de eerste lessen gratis.
Dat deel is er sindsdien niet meer: de cursus is nu een abonnement.

Wat je toen hebt afgerond, blijft open — precies die lessen, en je
voortgang, je woorden en je stempels erbij. Wat je nooit hebt afgerond,
zit achter het abonnement. Dus als het pad er nu voor een deel op slot
uitziet, is dat het stuk waar je nog niet was.

Staat ook het afgeronde deel op slot, dan is er iets anders aan de hand:
je voortgang staat alleen op het toestel zelf, niet op een server en niet
in een account. Bij een nieuw toestel of een verse installatie is hij er
dus niet meer. Heb je hem eerder bewaard, dan zet je hem terug via
Instellingen → Je gegevens → "Voortgang terugzetten". En een abonnement
dat je al had, zet je kosteloos terug met "Aankoop terugzetten" op het
abonnementsscherm.
```

Laat de laatste alinea staan ook als hij er niet om vraagt. Een verse
installatie is de enige manier waarop afgeronde lessen tóch op slot gaan, en
het is de enige vraag in deze lijst waar een knop in de app het antwoord is.

## "Ik zie de korting van 50% niet"

De kern: € 29,99 voor het eerste jaar is een **introductieaanbieding**, en die
bereikt alleen wie nooit eerder een abonnement in die groep had. Wie de proef
van drie dagen nam en opzegde, ziet € 29,99 dus niet. Dat staat zo in
`docs/STAND.md` onder *23 november: de tijdelijke actie van 50% op het jaar*.

Beloof hier niets. Er bestaat bij beide winkels een soort aanbieding die deze
groep wél bereikt — bij Apple Win-Back of Promotional Offer — maar zolang die
niet is aangemaakt, is er niets om aan te bieden.

```
De halve jaarprijs is een introductieaanbieding, en zo'n aanbieding geeft
de winkel alleen aan wie nog nooit een abonnement op deze app heeft
gehad. Heb je er eerder een gehad — ook als dat de proefperiode van drie
dagen was die er vroeger bij zat, en ook als je die hebt opgezegd — dan
ziet de winkel je niet als nieuwe abonnee, en dan staat er € 59,99 per
jaar of € 6,99 per maand in het aankoopvenster.

Dat is niets wat ik aan jouw kant kan omzetten: wie welke prijs ziet,
bepaalt de winkel.

Wat er wél staat in het aankoopvenster is altijd het bedrag dat
afgeschreven wordt. Staat daar € 59,99 per jaar, dan is dat wat je
betaalt — ook als een bericht van mij € 29,99 noemde.
```

Krijg je deze vraag vaker dan een paar keer, dan is dat een signaal en geen
klacht: het betekent dat de campagne mensen bereikt die de proef eerder al
hadden genomen. Dan is een Win-Back-aanbieding aanmaken de oplossing, niet een
beter antwoord.

## Wat je in geen van de drie zet

- **Geen bedrag dat je niet in de console hebt gezien.** € 6,99 en € 59,99
  staan in `PLANS` in `src/engine/billing.ts`; € 29,99 is daar geen prijs —
  dat is een aanbieding in de twee consoles, die de app uit de winkel leest.
  Noem dat bedrag dus alleen als het er werkelijk staat, en controleer het op
  het aankoopvenster zelf, op een telefoon, in de app uit de winkel.
- **Geen omrekening per maand die alleen staat.** Niet "€ 2,50 per maand" maar
  "€ 29,99 voor het eerste jaar (€ 2,50 per maand)". Apple wees deze app één
  keer af op richtlijn **3.1.2(c)** omdat de omrekening opvallender stond dan
  het bedrag dat van de rekening gaat, en richtlijn **2.3.1** over een
  misleidende prijsbelofte geldt woordelijk *"whether within or outside of the
  App Store"* — een mailtje aan één ouder valt daar net zo goed onder.
- **Geen toezegging over een terugbetaling, een coupon of een uitzondering.**
  De winkel is de verkoper. Wat je wel kunt doen is de weg wijzen.
- **Geen naam en geen telefoonnummer.** Om dezelfde reden als in deel 1: het
  antwoord komt van het adres waar de vraag binnenkwam, en een ondertekening
  zet persoonlijke gegevens in een bestand dat in de repository staat.
